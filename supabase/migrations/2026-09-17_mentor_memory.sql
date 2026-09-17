-- ════════════════════════════════════════════════════════════════════════
-- Mémoire du Mentor — la colonne du bestiaire des erreurs (2026-09-17)
-- ════════════════════════════════════════════════════════════════════════
-- Chantier « le Mentor qui se souvient » (proto prototypes/mentor-memory/, plan lot 2).
--
-- CE QUE ÇA AJOUTE
--   students.review      jsonb  — le bestiaire : {items:[…], slain, log}. Des RÉFÉRENCES de
--                                 questions ("drill:g326", "lisP3:p3_05:1"), jamais leur texte :
--                                 ~70 octets par créature, 120 au plus (borné côté client par
--                                 lib/review.js boundReview). Écrit par l'élève, comme mission
--                                 ou module_scores.
--   students.letter_seen text   — la semaine de la dernière lettre du lundi lue ("2026-W38"),
--                                 pour ne pas la rouvrir à chaque visite.
--
-- POURQUOI UNE COLONNE ET PAS UNE TABLE. Une table par réponse (« item_attempts ») aurait été
-- la forme évidente, mais elle multiplierait les écritures : l'alerte Disk IO du 2026-09-16 est
-- encore fraîche (231 Go de fichiers temporaires). Ici, le bestiaire part dans le save_student
-- déjà émis à chaque session : ZÉRO écriture supplémentaire.
--
-- PURELY ADDITIF, donc sûr à passer avant le déploiement du client : les deux colonnes restent
-- vides et inertes tant que le code ne les remplit pas (ordre imposé par le verrou d'accès du
-- 2026-09-15 : SQL d'abord, client ensuite).
--
-- APRÈS AVOIR PASSÉ CE FICHIER : `npm run check:security` (réseau + .env), puis un login et un
-- « Join a Group » en prod — la règle post-2026-09-15 sur tout GRANT/REVOKE/POLICY. Ici on ne
-- touche ni GRANT ni policy, et `CREATE OR REPLACE` sur une signature inchangée conserve les
-- privilèges existants, mais la vérification ne coûte rien.

-- ── 1) Les deux colonnes ────────────────────────────────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS review      jsonb DEFAULT '{}'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS letter_seen text;

COMMENT ON COLUMN students.review IS
  'Bestiaire des erreurs (2026-09-17) : {items:[{k,cat,part,first,last,miss,fails,box,due}], slain, log}. k = référence de question, jamais son texte. Borné à 120 items / 60 entrées de journal par lib/review.js.';
COMMENT ON COLUMN students.letter_seen IS
  'Semaine de la dernière lettre du lundi affichée ("2026-W38").';

-- ── 2) save_student : la liste blanche gagne les deux colonnes ──────────
-- ⚠️ QUATRE listes à tenir d'accord, pas une : v_cols (la liste blanche), le SET de l'UPDATE,
-- les colonnes de l'INSERT et ses VALUES. Une clé ajoutée à v_cols seulement passe le filtre
-- puis n'est jamais écrite — la donnée disparaît en silence, ce que tests/check_profile_roundtrip
-- ne verrait pas (il ne lit que v_cols).
-- Le corps ci-dessous est celui de 2026-09-14_p2c_student_rpc.sql, plus 'review' et 'letter_seen'
-- (et moins la variable v_g, déclarée mais jamais utilisée). Tout le reste — garde not_owner,
-- cohorte connue, garde anti-phantom, colonnes inécrivables access_level / arena_marks / user_id —
-- est inchangé.
CREATE OR REPLACE FUNCTION public.save_student(
  p_name text, p_class_code text, p_payload jsonb,
  p_allow_insert boolean DEFAULT false, p_bind_auth boolean DEFAULT false
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_name'); END IF;
  IF p_class_code IS NULL OR btrim(p_class_code) = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_class_code'); END IF;

  SELECT COALESCE(jsonb_object_agg(k, p_payload -> k), '{}'::jsonb) INTO v_clean
    FROM unnest(v_cols) AS k
   WHERE p_payload ? k;

  SELECT * INTO v_row FROM students
   WHERE norm_name(name) = norm_name(p_name) AND class_code = p_class_code
   ORDER BY xp DESC NULLS LAST LIMIT 1;

  IF FOUND THEN
    IF v_row.user_id IS NOT NULL AND v_row.user_id IS DISTINCT FROM v_uid THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
    END IF;
    v_new := jsonb_populate_record(v_row, v_clean);
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
      user_id        = CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN v_uid ELSE user_id END,
      password_set_at = CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN now() ELSE password_set_at END
     WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', true, 'action', 'update');
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
  INSERT INTO students(
    name, class_code, access_level, access_expires_at,
    xp, weekly_xp, week_id, streak, last_active, card_states, daily_challenge,
    stats, module_scores, mock_results, game_scores, mission, avatar, theme,
    skin_id, frame_id, title_id, unlocked_ach, total_time, weekly_history,
    daily_mod_sessions, weekly_daily_count, battle_scan, tips_shown, daily_seen,
    gdpr_consent, joined_at, tutorial_pending, email, narrator,
    cgv_accepted_at, cgv_version, retractation_waived_at,
    target_toeic, target_date, boosts, review, letter_seen, user_id, password_set_at
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
    CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN now() ELSE NULL END
  );
  RETURN jsonb_build_object('ok', true, 'action', 'insert');
END;
$function$;

-- Idempotent : `CREATE OR REPLACE` sur une signature inchangée garde les privilèges, on les
-- repose par sécurité (mêmes rôles qu'au 2026-09-14).
GRANT EXECUTE ON FUNCTION public.save_student(text, text, jsonb, boolean, boolean) TO anon, authenticated;

-- ── 3) Vérification rapide après passage ────────────────────────────────
-- SELECT column_name, data_type, column_default FROM information_schema.columns
--  WHERE table_name = 'students' AND column_name IN ('review','letter_seen');
-- SELECT 'review' = ANY(
--   (SELECT regexp_matches(prosrc, 'v_cols text\[\] := ARRAY\[([^\]]*)\]', 'g'))[1]::text[]
-- ) FROM pg_proc WHERE proname = 'save_student';
