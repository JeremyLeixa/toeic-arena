-- ════════════════════════════════════════════════════════════════════════
-- Économie côté serveur, lot 3 : garde-fou XP dans save_student (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- L'XP de chaque manche reste calculée par le client (la recalculer côté serveur = réécrire le jeu). Mais
-- save_student acceptait n'importe quelle valeur : un appel console suffisait à écrire 10 millions d'XP et à
-- prendre la tête de la Ligue et du podium (coffres compris). Borne : +20 000 XP par jour (heure de Paris)
-- au-dessus de l'XP enregistrée au premier enregistrement du jour ; la plus grosse SEMAINE réelle relevée le
-- 24/09 est de 29 047. Même borne sur weekly_xp, depuis SA valeur du début de journée : sans elle, baisser
-- son XP puis la remonter ferait monter weekly_xp sans limite.
-- Au-delà : la valeur est PLAFONNÉE (jamais refusée, le reste du profil se sauvegarde) et journalisée dans
-- xp_clamp_log, une ligne par élève et par jour. Le formateur la voit dans l'onglet Usage (RPC nommée à part :
-- teacher_usage reste anonyme). Les baisses restent permises (réinitialisation, pari de Duel perdu).
-- ADDITIF pour le client : aucun changement de payload. Colonnes serveur HORS de la liste blanche v_cols.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS xp_day_date date,
  ADD COLUMN IF NOT EXISTS xp_day_base integer,
  ADD COLUMN IF NOT EXISTS xp_day_weekly_base integer,
  ADD COLUMN IF NOT EXISTS xp_day_week_id text;

CREATE TABLE IF NOT EXISTS public.xp_clamp_log (
  user_name text NOT NULL, class_code text NOT NULL, day date NOT NULL,
  base_xp integer NOT NULL, claimed_xp integer NOT NULL, accepted_xp integer NOT NULL,
  claimed_weekly integer, accepted_weekly integer,
  hits integer NOT NULL DEFAULT 1, first_at timestamptz NOT NULL DEFAULT now(), last_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_name, class_code, day));
ALTER TABLE public.xp_clamp_log ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.xp_clamp_log FROM anon, authenticated, public;

-- La borne, isolée (lisible et testable) : rend {xp, weekly_xp} acceptés et met à jour la base du jour.
-- Appelée par save_student sur la ligne verrouillée ; jamais par le client.
CREATE OR REPLACE FUNCTION public._xp_guard(p_row students, p_xp integer, p_weekly integer, p_week_id text,
  OUT o_xp integer, OUT o_weekly integer, OUT o_day date, OUT o_base integer, OUT o_wbase integer, OUT o_wid text)
  LANGUAGE plpgsql SET search_path = public
AS $function$
DECLARE c_max CONSTANT integer := 20000; v_today date := (now() AT TIME ZONE 'Europe/Paris')::date; v_wb integer;
BEGIN
  IF p_row.xp_day_date IS DISTINCT FROM v_today THEN
    o_day := v_today; o_base := COALESCE(p_row.xp, 0);
    o_wbase := COALESCE(p_row.weekly_xp, 0); o_wid := p_row.week_id;
  ELSE
    o_day := p_row.xp_day_date; o_base := COALESCE(p_row.xp_day_base, COALESCE(p_row.xp, 0));
    o_wbase := COALESCE(p_row.xp_day_weekly_base, 0); o_wid := p_row.xp_day_week_id;
  END IF;
  o_xp := LEAST(p_xp, o_base + c_max);
  -- Semaine changée depuis le début de journée (lundi, ou horloge du client) : la base hebdomadaire repart de 0.
  v_wb := CASE WHEN p_week_id IS NOT DISTINCT FROM o_wid THEN o_wbase ELSE 0 END;
  o_weekly := LEAST(p_weekly, v_wb + c_max);
END;
$function$;
REVOKE ALL ON FUNCTION public._xp_guard(students, integer, integer, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_student(p_name text, p_class_code text, p_payload jsonb, p_allow_insert boolean DEFAULT false, p_bind_auth boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cols text[] := ARRAY[
    'xp','weekly_xp','week_id','streak','last_active',
    'card_states','daily_challenge','stats','module_scores','mock_results',
    'game_scores','mission','avatar','theme','skin_id','frame_id','title_id',
    'unlocked_ach','total_time','weekly_history','daily_mod_sessions',
    'weekly_daily_count','battle_scan','tips_shown','daily_seen','gdpr_consent',
    'joined_at','tutorial_pending','email','narrator',
    'cgv_accepted_at','cgv_version','retractation_waived_at',
    'target_toeic','target_date','boosts','review','letter_seen'
  ];
  v_clean jsonb;
  v_row   students;
  v_new   students;
  v_uid   uuid := auth.uid();
  v_other text[];
  v_g     record;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_name'); END IF;
  IF p_class_code IS NULL OR btrim(p_class_code) = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_class_code'); END IF;

  SELECT COALESCE(jsonb_object_agg(k, p_payload -> k), '{}'::jsonb) INTO v_clean
    FROM unnest(v_cols) AS k
   WHERE p_payload ? k;

  -- FOR UPDATE (lot 3) : deux sauvegardes simultanées liraient la même base du jour.
  SELECT * INTO v_row FROM students
   WHERE norm_name(name) = norm_name(p_name) AND class_code = p_class_code
   ORDER BY xp DESC NULLS LAST LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    IF v_row.user_id IS NOT NULL AND v_row.user_id IS DISTINCT FROM v_uid THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
    END IF;
    v_new := jsonb_populate_record(v_row, v_clean);
    -- Garde-fou XP (lot 3) : plafonné, jamais refusé.
    SELECT * INTO v_g FROM _xp_guard(v_row, COALESCE(v_new.xp, 0), COALESCE(v_new.weekly_xp, 0), v_new.week_id);
    IF v_g.o_xp < COALESCE(v_new.xp, 0) OR v_g.o_weekly < COALESCE(v_new.weekly_xp, 0) THEN
      INSERT INTO xp_clamp_log AS l (user_name, class_code, day, base_xp, claimed_xp, accepted_xp, claimed_weekly, accepted_weekly)
      VALUES (v_row.name, v_row.class_code, v_g.o_day, v_g.o_base, v_new.xp, v_g.o_xp, v_new.weekly_xp, v_g.o_weekly)
      ON CONFLICT (user_name, class_code, day) DO UPDATE SET
        claimed_xp = GREATEST(l.claimed_xp, EXCLUDED.claimed_xp), accepted_xp = EXCLUDED.accepted_xp,
        claimed_weekly = GREATEST(l.claimed_weekly, EXCLUDED.claimed_weekly), accepted_weekly = EXCLUDED.accepted_weekly,
        hits = l.hits + 1, last_at = now();
      v_new.xp := v_g.o_xp; v_new.weekly_xp := v_g.o_weekly;
    END IF;
    UPDATE students SET
      xp = v_new.xp, weekly_xp = v_new.weekly_xp, week_id = v_new.week_id,
      streak = v_new.streak, last_active = v_new.last_active,
      card_states = v_new.card_states, daily_challenge = v_new.daily_challenge,
      stats = v_new.stats, module_scores = v_new.module_scores,
      mock_results = v_new.mock_results, game_scores = v_new.game_scores,
      mission = v_new.mission, avatar = v_new.avatar, theme = v_new.theme,
      skin_id = v_new.skin_id, frame_id = v_new.frame_id, title_id = v_new.title_id,
      unlocked_ach = v_new.unlocked_ach, total_time = v_new.total_time,
      weekly_history = v_new.weekly_history, daily_mod_sessions = v_new.daily_mod_sessions,
      weekly_daily_count = v_new.weekly_daily_count, battle_scan = v_new.battle_scan,
      tips_shown = v_new.tips_shown, daily_seen = v_new.daily_seen,
      gdpr_consent = v_new.gdpr_consent, joined_at = v_new.joined_at,
      tutorial_pending = v_new.tutorial_pending, email = v_new.email,
      narrator = v_new.narrator, cgv_accepted_at = v_new.cgv_accepted_at,
      cgv_version = v_new.cgv_version, retractation_waived_at = v_new.retractation_waived_at,
      target_toeic = v_new.target_toeic, target_date = v_new.target_date,
      boosts = v_new.boosts,
      review = v_new.review, letter_seen = v_new.letter_seen,
      xp_day_date = v_g.o_day, xp_day_base = v_g.o_base,
      xp_day_weekly_base = v_g.o_wbase, xp_day_week_id = v_g.o_wid,
      user_id        = CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN v_uid ELSE user_id END,
      password_set_at = CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN now() ELSE password_set_at END
     WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', true, 'action', 'update')
      || CASE WHEN v_g.o_xp < COALESCE((v_clean->>'xp')::integer, 0) THEN jsonb_build_object('xp_clamped', v_g.o_xp)
              ELSE '{}'::jsonb END;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM groups WHERE code = p_class_code) THEN
    RAISE LOG 'save_student refused: unknown class_code %', p_class_code;
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_class_code');
  END IF;

  SELECT array_agg(DISTINCT class_code) INTO v_other
    FROM students
   WHERE norm_name(name) = norm_name(p_name) AND class_code IS DISTINCT FROM p_class_code;

  IF v_other IS NOT NULL AND array_length(v_other, 1) > 0 AND NOT p_allow_insert THEN
    RAISE LOG 'save_student blocked phantom: % exists in % (attempted %)', p_name, v_other, p_class_code;
    RETURN jsonb_build_object('ok', false, 'error', 'blocked_phantom', 'codes', to_jsonb(v_other));
  END IF;

  v_new := jsonb_populate_record(NULL::students, v_clean);
  -- Garde-fou XP (lot 3) : un profil neuf part d'une base nulle.
  v_new.xp := LEAST(COALESCE(v_new.xp, 0), 20000);
  v_new.weekly_xp := LEAST(COALESCE(v_new.weekly_xp, 0), 20000);
  INSERT INTO students(
    name, class_code, access_level, access_expires_at,
    xp, weekly_xp, week_id, streak, last_active, card_states, daily_challenge,
    stats, module_scores, mock_results, game_scores, mission, avatar, theme,
    skin_id, frame_id, title_id, unlocked_ach, total_time, weekly_history,
    daily_mod_sessions, weekly_daily_count, battle_scan, tips_shown, daily_seen,
    gdpr_consent, joined_at, tutorial_pending, email, narrator,
    cgv_accepted_at, cgv_version, retractation_waived_at,
    target_toeic, target_date, boosts, review, letter_seen, user_id, password_set_at,
    xp_day_date, xp_day_base, xp_day_weekly_base, xp_day_week_id
  ) VALUES (
    btrim(p_name), p_class_code, 'free', NULL,
    v_new.xp, v_new.weekly_xp, v_new.week_id, v_new.streak, v_new.last_active,
    v_new.card_states, v_new.daily_challenge, v_new.stats, v_new.module_scores,
    v_new.mock_results, v_new.game_scores, v_new.mission, v_new.avatar, v_new.theme,
    v_new.skin_id, v_new.frame_id, v_new.title_id, v_new.unlocked_ach, v_new.total_time,
    v_new.weekly_history, v_new.daily_mod_sessions, v_new.weekly_daily_count,
    v_new.battle_scan, v_new.tips_shown, v_new.daily_seen, v_new.gdpr_consent,
    v_new.joined_at, v_new.tutorial_pending, v_new.email, v_new.narrator,
    v_new.cgv_accepted_at, v_new.cgv_version, v_new.retractation_waived_at,
    v_new.target_toeic, v_new.target_date, v_new.boosts,
    COALESCE(v_new.review, '{}'::jsonb), v_new.letter_seen,
    CASE WHEN p_bind_auth THEN v_uid ELSE NULL END,
    CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN now() ELSE NULL END,
    (now() AT TIME ZONE 'Europe/Paris')::date, 0, 0, v_new.week_id
  );
  RETURN jsonb_build_object('ok', true, 'action', 'insert');
END;
$function$;

-- Onglet Usage : les plafonnements des 30 derniers jours de la cohorte, NOMMÉS (le formateur voit déjà les noms
-- dans teacher_students). Même garde que teacher_usage.
CREATE OR REPLACE FUNCTION public.teacher_xp_clamps(p_code text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_role text; v_rows jsonb;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF v_role <> 'admin' AND p_class_code NOT IN (SELECT code FROM groups WHERE teacher_code = p_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.day DESC, t.name), '[]'::jsonb) INTO v_rows FROM (
    SELECT user_name AS name, day, base_xp, claimed_xp, accepted_xp, claimed_weekly, accepted_weekly, hits
      FROM xp_clamp_log
     WHERE class_code = p_class_code AND day >= current_date - 30 AND user_name <> 'Teacher'
     ORDER BY day DESC LIMIT 100) t;
  RETURN jsonb_build_object('ok', true, 'clamps', v_rows);
END;
$function$;
REVOKE ALL ON FUNCTION public.teacher_xp_clamps(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.teacher_xp_clamps(text, text) TO anon, authenticated;
