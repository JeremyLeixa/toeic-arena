-- ════════════════════════════════════════════════════════════════════════
-- Phase C sécurité, lot 1 : une seule règle de propriété, mode strict par promo (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- ADDITIF : aucun effet tant que identity_strict_classes est vide.
--
-- La tolérance legacy (« une ligne sans user_id passe, faute de preuve à exiger ») n'était pas dans
-- student_guard seul : save_student, grant_marks, consume_token, buy_item, claim_bourse_title et grant_token
-- en avaient chacun leur copie. Retirer « une ligne » dans student_guard aurait laissé la sauvegarde ouverte.
-- Les 7 appellent maintenant _owner_ok(owner, promo) :
--   · ligne liée (user_id posé)  → seul son propriétaire (auth.uid() = user_id) ;
--   · ligne legacy (user_id NULL) → tolérée, SAUF si sa promo est en mode strict (identity_strict_classes,
--     ou la ligne '*' pour toutes). Les visiteurs restent toujours tolérés (choix de Jérémy : leur inscription
--     ne crée pas de mot de passe, rien de précieux à protéger).
-- Refus = 'not_owner' : le client le traite déjà comme une session perdue (F1/F2) → find_students_by_name →
-- écran « Sécurise ton compte » (password_set_at NULL) → mot de passe → bind_student_user_id → recover, copie
-- locale gardée. Basculer une promo : INSERT INTO identity_strict_classes VALUES ('<code>') ; revenir : DELETE.

CREATE TABLE IF NOT EXISTS public.identity_strict_classes (
  class_code text PRIMARY KEY, since timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.identity_strict_classes ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.identity_strict_classes FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public._owner_ok(p_owner uuid, p_class_code text)
RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  -- ⚠️ IS NOT DISTINCT FROM, jamais « = » : sans session, auth.uid() est NULL, « p_owner = NULL » vaut NULL et
  -- « IF NOT NULL » ne refuse RIEN. Écrit avec « = », ce lot ouvrait tout compte sécurisé aux appels anonymes
  -- (attrapé par l'essai en transaction du 2026-09-24). COALESCE : jamais de NULL rendu.
  SELECT COALESCE(CASE
    WHEN p_owner IS NOT NULL THEN p_owner IS NOT DISTINCT FROM auth.uid()
    WHEN p_class_code = 'visitor' THEN true
    ELSE NOT EXISTS (SELECT 1 FROM identity_strict_classes WHERE class_code IN (p_class_code, '*'))
  END, false)
$function$;
REVOKE ALL ON FUNCTION public._owner_ok(uuid, text) FROM public, anon, authenticated;

-- ── buy_item ──
CREATE OR REPLACE FUNCTION public.buy_item(p_name text, p_class_code text, p_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE it shop_catalog%ROWTYPE; bal INT; owned INT; qty INT; v_owner uuid; v_cap INT; v_week INT;
BEGIN
  SELECT * INTO it FROM shop_catalog WHERE item_id = p_item_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_item');
  END IF;
  -- FOR UPDATE : deux achats simultanés du même élève se suivent (sinon deux « déjà possédé ? » passeraient
  -- ensemble et créeraient un doublon).
  SELECT arena_marks, user_id INTO bal, v_owner FROM students
    WHERE name = p_name AND class_code = p_class_code LIMIT 1 FOR UPDATE;
  IF bal IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_student');
  END IF;
  -- Garde de propriété (grâce si legacy non migré), comme spend_marks.
  -- Phase C : même règle que student_guard.
  IF NOT _owner_ok(v_owner, p_class_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  IF it.category = 'token' THEN
    v_cap := token_cap(it.ref_id);
    IF v_cap IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_item'); END IF;
    SELECT quantity INTO qty FROM player_tokens
      WHERE user_name = p_name AND class_code = p_class_code AND token_type = it.ref_id;
    IF COALESCE(qty, 0) >= v_cap THEN
      RETURN jsonb_build_object('ok', false, 'error', 'at_cap');
    END IF;
    -- Daily Doubler : 2 achats par semaine (lundi 00:00 UTC), vérifiés ici et plus seulement côté client.
    IF it.ref_id = 'daily_doubler' THEN
      SELECT count(*) INTO v_week FROM shop_purchases
        WHERE user_name = p_name AND class_code = p_class_code AND item_id = it.item_id
          AND purchased_at >= date_trunc('week', now());
      IF v_week >= 2 THEN RETURN jsonb_build_object('ok', false, 'error', 'weekly_cap'); END IF;
    END IF;
  ELSE
    SELECT count(*) INTO owned FROM player_rewards
      WHERE user_name = p_name AND class_code = p_class_code
        AND reward_type = it.category AND reward_id = it.ref_id;
    IF owned > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
    END IF;
  END IF;

  IF bal < it.price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_marks');
  END IF;

  UPDATE students SET arena_marks = arena_marks - it.price
    WHERE name = p_name AND class_code = p_class_code
    RETURNING arena_marks INTO bal;

  IF it.category = 'token' THEN
    PERFORM grant_token(p_name, p_class_code, it.ref_id, 1, v_cap);
  ELSE
    INSERT INTO player_rewards(user_name, class_code, reward_type, reward_id, rarity)
      VALUES (p_name, p_class_code, it.category, it.ref_id, COALESCE(it.rarity, 'rare'));
  END IF;

  INSERT INTO shop_purchases(user_name, class_code, item_id, category, ref_id, price_paid)
    VALUES (p_name, p_class_code, it.item_id, it.category, it.ref_id, it.price);
  INSERT INTO marks_log(user_name, class_code, delta, source, source_detail)
    VALUES (p_name, p_class_code, -it.price, 'shop', it.item_id);

  RETURN jsonb_build_object('ok', true, 'balance', bal);
END;
$function$;

-- ── claim_bourse_title ──
CREATE OR REPLACE FUNCTION public.claim_bourse_title(p_name text, p_class_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_owner uuid; v_spent bigint; v_rows int;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name = p_name AND class_code = p_class_code;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'no_student'); END IF;
  -- Phase C : même règle que student_guard.
  IF NOT _owner_ok(v_owner, p_class_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  SELECT COALESCE(SUM(price_paid), 0) INTO v_spent FROM shop_purchases
    WHERE user_name = p_name AND class_code = p_class_code;
  IF v_spent < 10000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough', 'spent', v_spent);
  END IF;
  INSERT INTO player_rewards(user_name, class_code, reward_type, reward_id, rarity)
    SELECT p_name, p_class_code, 'title', 'bourse_inepuisable', 'legend'
    WHERE NOT EXISTS (SELECT 1 FROM player_rewards WHERE user_name = p_name AND class_code = p_class_code
                        AND reward_type = 'title' AND reward_id = 'bourse_inepuisable');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'granted', v_rows > 0);
END;
$function$;

-- ── consume_token ──
CREATE OR REPLACE FUNCTION public.consume_token(p_user_name text, p_class_code text, p_token_type text, p_amount integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_qty INT; v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  -- Phase C : même règle que student_guard.
  IF NOT _owner_ok(v_owner, p_class_code) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  -- Borne (2026-09-24) : une quantité négative AJOUTAIT des jetons.
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 5 THEN
    RETURN FALSE;
  END IF;

  SELECT quantity INTO v_qty
  FROM public.player_tokens
  WHERE user_name = p_user_name AND class_code = p_class_code AND token_type = p_token_type
  FOR UPDATE;

  IF v_qty IS NULL OR v_qty < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.player_tokens
  SET quantity = quantity - p_amount, updated_at = now()
  WHERE user_name = p_user_name AND class_code = p_class_code AND token_type = p_token_type;

  RETURN TRUE;
END;
$function$;

-- ── grant_marks ──
CREATE OR REPLACE FUNCTION public.grant_marks(p_user_name text, p_class_code text, p_delta integer, p_source text, p_source_detail text, p_unique boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_owner uuid; v_found boolean; v_day integer;
BEGIN
  SELECT true, user_id INTO v_found, v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  IF v_found IS NULL THEN
    RAISE EXCEPTION 'no_student';
  END IF;
  -- Garde de propriété (grâce si legacy non migré : user_id NULL)
  -- Phase C : même règle que student_guard.
  IF NOT _owner_ok(v_owner, p_class_code) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  IF p_source IS NULL OR p_source NOT IN ('achievement', 'daily', 'focus', 'hunt', 'login', 'mastery', 'podium',
                                          'toeic_weekly') THEN
    RAISE EXCEPTION 'invalid_source';
  END IF;
  -- Borne par octroi (2026-09-24).
  IF p_delta IS NULL OR p_delta < 1 OR p_delta > 1000 THEN
    RAISE EXCEPTION 'invalid_delta';
  END IF;

  IF p_unique AND EXISTS(
    SELECT 1 FROM marks_log
    WHERE user_name=p_user_name AND class_code=p_class_code AND source_detail=p_source_detail
  ) THEN
    RETURN 0; -- déjà accordé, no-op silencieux côté client
  END IF;

  -- Plafond sur 24 h glissantes (2026-09-24), sur tout ce qui passe par ici. Les coffres (source 'chest',
  -- open_chest) et la boutique n'y entrent pas : ils sont écrits par leurs propres RPC.
  SELECT COALESCE(SUM(delta), 0) INTO v_day FROM marks_log
    WHERE user_name=p_user_name AND class_code=p_class_code AND delta > 0
      AND source NOT IN ('shop', 'chest', 'admin', 'admin_bonus')
      AND created_at > now() - interval '24 hours';
  IF v_day + p_delta > 3000 THEN
    RAISE EXCEPTION 'daily_limit';
  END IF;

  UPDATE students SET arena_marks = COALESCE(arena_marks,0) + p_delta
    WHERE name=p_user_name AND class_code=p_class_code;
  INSERT INTO marks_log(user_name,class_code,delta,source,source_detail)
    VALUES(p_user_name,p_class_code,p_delta,p_source,p_source_detail);
  RETURN p_delta;
END;
$function$;

-- ── grant_token ──
CREATE OR REPLACE FUNCTION public.grant_token(p_user_name text, p_class_code text, p_token_type text, p_amount integer, p_cap integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_new_qty INT; v_owner uuid; v_cap INT;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  -- Phase C : même règle que student_guard.
  IF NOT _owner_ok(v_owner, p_class_code) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  -- Bornes (2026-09-24) : type connu, plafond serveur, 1 à 3 par octroi.
  v_cap := token_cap(p_token_type);
  IF v_cap IS NULL THEN RAISE EXCEPTION 'invalid_token_type'; END IF;
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 3 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  v_cap := LEAST(COALESCE(p_cap, v_cap), v_cap);

  INSERT INTO public.player_tokens (user_name, class_code, token_type, quantity)
  VALUES (p_user_name, p_class_code, p_token_type, LEAST(p_amount, v_cap))
  ON CONFLICT (user_name, class_code, token_type)
  DO UPDATE SET
    quantity   = LEAST(public.player_tokens.quantity + p_amount, v_cap),
    updated_at = now()
  RETURNING quantity INTO v_new_qty;
  RETURN v_new_qty;
END;
$function$;

-- ── save_student ──
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
    -- Phase C : même règle que student_guard (tolérance legacy seulement hors mode strict).
    IF NOT _owner_ok(v_row.user_id, v_row.class_code) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
    END IF;
    v_new := jsonb_populate_record(v_row, v_clean);
    -- Garde-fou XP (lot 3b) : noté au-delà de +20 000 dans la journée, plafonné au-delà de +40 000, jamais refusé.
    SELECT * INTO v_g FROM _xp_guard(v_row, COALESCE(v_new.xp, 0), COALESCE(v_new.weekly_xp, 0), v_new.week_id);
    IF v_g.o_alert THEN
      INSERT INTO xp_clamp_log AS l (user_name, class_code, day, base_xp, claimed_xp, accepted_xp, claimed_weekly, accepted_weekly, clamped)
      VALUES (v_row.name, v_row.class_code, v_g.o_day, v_g.o_base, v_new.xp, v_g.o_xp, v_new.weekly_xp, v_g.o_weekly,
              v_g.o_xp < COALESCE(v_new.xp, 0) OR v_g.o_weekly < COALESCE(v_new.weekly_xp, 0))
      ON CONFLICT (user_name, class_code, day) DO UPDATE SET
        claimed_xp = GREATEST(l.claimed_xp, EXCLUDED.claimed_xp), accepted_xp = EXCLUDED.accepted_xp,
        claimed_weekly = GREATEST(l.claimed_weekly, EXCLUDED.claimed_weekly), accepted_weekly = EXCLUDED.accepted_weekly,
        clamped = l.clamped OR EXCLUDED.clamped, hits = l.hits + 1, last_at = now();
    END IF;
    v_new.xp := v_g.o_xp; v_new.weekly_xp := v_g.o_weekly;
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
  -- Garde-fou XP (lot 3b) : un profil neuf part d'une base nulle.
  v_new.xp := LEAST(COALESCE(v_new.xp, 0), 40000);
  v_new.weekly_xp := LEAST(COALESCE(v_new.weekly_xp, 0), 40000);
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

-- ── student_guard ──
CREATE OR REPLACE FUNCTION public.student_guard(p_name text, p_class_code text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_owner uuid; v_found boolean;
BEGIN
  SELECT user_id, true INTO v_owner, v_found
    FROM students
   WHERE norm_name(name) = norm_name(p_name) AND class_code = p_class_code
   ORDER BY xp DESC NULLS LAST
   LIMIT 1;
  IF NOT COALESCE(v_found, false) THEN RETURN 'no_row'; END IF;
  -- Phase C : une seule règle, _owner_ok (tolérance legacy seulement hors mode strict). 'not_owner' pour une
  -- ligne sans mot de passe en mode strict : le client la traite comme une session perdue (écran de sécurisation).
  IF NOT _owner_ok(v_owner, p_class_code) THEN RETURN 'not_owner'; END IF;
  RETURN 'ok';
END;
$function$;
