-- ════════════════════════════════════════════════════════════════════════
-- Phase C-lite — accès à `students` par RPC, fichier 1/2 : les fonctions
-- (2026-09-14, voir .claude/plans/dynamic-swinging-hippo.md)
-- ════════════════════════════════════════════════════════════════════════
-- POURQUOI PAS LA RLS. Le plan initial était `ENABLE RLS` + policy
-- `auth.uid() = user_id`. Au 2026-09-14, **1 compte sur 160** porte un user_id :
-- activer la policy couperait 159 élèves de leur progression du jour au lendemain,
-- chacun avec une fenêtre d'usurpation pendant son claim. On ferme donc par les
-- PRIVILÈGES (fichier 2) plutôt que par la RLS — même mouvement que B4 sur `groups`.
--
-- LA GARDE EST CONDITIONNELLE (même principe que les RPC d'économie de B1) :
--   · ligne avec user_id  → on exige auth.uid() = user_id (lecture ET écriture) ;
--   · ligne sans user_id  → tolérance, c'est un compte legacy non migré.
-- Conséquence : chaque élève qui migre devient réellement protégé, tout seul, sans
-- jour J et sans bloquer personne. Le durcissement final (la vraie Phase C) = retirer
-- la tolérance dans student_guard, une ligne.
--
-- CE QUE CE FICHIER FERME À LUI SEUL, une fois le client basculé et le fichier 2
-- appliqué : l'exfiltration et la modification EN MASSE (aujourd'hui un `curl` rend
-- les 160 lignes), et surtout l'écriture des colonnes serveur-authoritatives — voir
-- la liste blanche de save_student, qui rend `access_level`, `access_expires_at` et
-- `arena_marks` inatteignables depuis le client quoi qu'il envoie. Aujourd'hui ils ne
-- sont exclus que par le JS, un PATCH REST direct les écrit encore (C3 à moitié).
--
-- CE QUE ÇA NE FERME PAS : l'usurpation ciblée d'un compte legacy (finding C4).
-- Se referme compte par compte, à mesure des migrations.
--
-- ⚠️ Ce fichier est INERTE : il ne révoque rien. À appliquer AVANT de déployer le
-- client. Le fichier 2 (verrouillage) vient APRÈS vérification en production — tant
-- qu'il n'est pas passé, les accès directs existent encore et reverter le client
-- suffit à tout remettre d'aplomb. C'est le seul filet de ce chantier.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 1) student_guard — la règle de propriété, en un seul endroit
-- ════════════════════════════════════════════════════════════════════════
-- Renvoie 'no_row' | 'not_owner' | 'ok'.
-- EXECUTE révoqué : ce n'est pas un endpoint, juste le helper des fonctions ci-dessous.
-- ⚠️ C'EST ICI qu'on durcira le jour de la vraie Phase C : supprimer la branche
-- "v_owner IS NULL → ok" et exiger un propriétaire dans tous les cas.
CREATE OR REPLACE FUNCTION public.student_guard(p_name text, p_class_code text)
RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_owner uuid; v_found boolean;
BEGIN
  SELECT user_id, true INTO v_owner, v_found
    FROM students
   WHERE norm_name(name) = norm_name(p_name) AND class_code = p_class_code
   ORDER BY xp DESC NULLS LAST
   LIMIT 1;
  IF NOT COALESCE(v_found, false) THEN RETURN 'no_row'; END IF;
  -- Tolérance legacy : tant que la ligne n'a pas été migrée, on ne peut pas exiger
  -- de preuve — il n'y en a aucune à donner.
  IF v_owner IS NULL THEN RETURN 'ok'; END IF;
  IF v_owner IS DISTINCT FROM auth.uid() THEN RETURN 'not_owner'; END IF;
  RETURN 'ok';
END;
$function$;
REVOKE ALL ON FUNCTION public.student_guard(text, text) FROM public, anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 2) Lecture du profil
-- ════════════════════════════════════════════════════════════════════════
-- Remplace les deux SELECT de load() (App.jsx ~788 et ~797). Renvoie la ligne
-- COMPLÈTE : le client en a besoin pour hydrater tout le profil (supaToLocal), y
-- compris access_level, qu'il LIT sans jamais l'écrire.
CREATE OR REPLACE FUNCTION public.load_student(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_g text; v_row jsonb;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN
    -- On ne distingue pas "inconnu" de "pas à toi" côté client : dans les deux cas
    -- l'app retombe sur l'onboarding, qui réclamera le mot de passe.
    IF v_g = 'not_owner' THEN RAISE LOG 'load_student refused (not_owner) for %/%', p_name, p_class_code; END IF;
    RETURN NULL;
  END IF;
  SELECT to_jsonb(s) INTO v_row
    FROM students s
   WHERE norm_name(s.name) = norm_name(p_name) AND s.class_code = p_class_code
   ORDER BY s.xp DESC NULLS LAST
   LIMIT 1;
  RETURN v_row;
END;
$function$;

-- Chemin de secours de load() : la ligne liée à la session courante. Aucun paramètre,
-- donc rien à deviner — c'est la seule lecture déjà totalement sûre de ce fichier.
CREATE OR REPLACE FUNCTION public.load_student_by_uid()
RETURNS jsonb
  LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $function$
  SELECT to_jsonb(s) FROM students s
   WHERE s.user_id IS NOT NULL AND s.user_id = auth.uid()
   ORDER BY s.xp DESC NULLS LAST LIMIT 1;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 3) save_student — écriture du profil, LISTE BLANCHE DE COLONNES
-- ════════════════════════════════════════════════════════════════════════
-- Remplace l'UPDATE (App.jsx ~935), l'INSERT (~996) et le PATCH keepalive (~17516).
--
-- SÉMANTIQUE DE FUSION. On ne remplace que les clés PRÉSENTES dans p_payload :
-- `jsonb_populate_record(v_row, v_clean)` part de la ligne existante et n'écrase que
-- ce qui est fourni. Indispensable — le keepalive envoie un sous-ensemble de colonnes,
-- et un `jsonb_populate_record(null::students, …)` mettrait tout le reste à NULL.
--
-- LISTE BLANCHE. v_clean ne retient que les 36 colonnes ci-dessous, exactement celles
-- que save() construit côté client. Tout le reste de p_payload est ignoré en silence.
-- Donc `access_level`, `access_expires_at`, `arena_marks`, `id`, `name`, `class_code`
-- et `user_id` sont INÉCRIVABLES depuis le client, quoi qu'il poste.
--   · access_level / access_expires_at : entitlement, écrit par le seul webhook Stripe
--     (service_role). Les remettre ici = premium gratuit (finding C3).
--   · arena_marks : monnaie, incréments atomiques via grant_marks/spend_marks. Un
--     full-row UPDATE l'inclurait et écraserait tout gain arrivé entre-temps
--     (lost-update classique) — c'est documenté dans save() depuis 2026-05-29.
--   · user_id : posé UNIQUEMENT par p_bind_auth, et avec auth.uid(), jamais avec une
--     valeur fournie par l'appelant.
--
-- GARDE ANTI-PHANTOM. Si l'UPDATE ne touche aucune ligne, on ne crée PAS aveuglément :
-- si le prénom existe dans une AUTRE promo, c'est soit un homonyme légitime en cours
-- d'inscription (onboard passe p_allow_insert), soit un classCode local parti à la
-- dérive — et c'est ce second cas qui fabriquait les lignes fantômes. Bug de prod vécu
-- des deux côtés : retirer allowInsert re-casse l'inscription des homonymes (« Romain
-- 2027 », corrigé le 2026-07-31), l'enlever tout court refabrique des fantômes.
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
    'target_toeic','target_date','boosts'
  ];
  v_clean jsonb;
  v_row   students;
  v_new   students;
  v_g     text;
  v_uid   uuid := auth.uid();
  v_other text[];
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_name'); END IF;
  -- Miroir du garde-fou client : un class_code vide ferait matcher (nom, 'visitor')
  -- et pourrait écraser la ligne d'un autre.
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
      user_id        = CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN v_uid ELSE user_id END,
      password_set_at = CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN now() ELSE password_set_at END
     WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', true, 'action', 'update');
  END IF;

  -- Pas de ligne : création, sous conditions.
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
    target_toeic, target_date, boosts, user_id, password_set_at
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
    CASE WHEN p_bind_auth THEN v_uid ELSE NULL END,
    CASE WHEN p_bind_auth AND v_uid IS NOT NULL THEN now() ELSE NULL END
  );
  RETURN jsonb_build_object('ok', true, 'action', 'insert');
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 4) bind_student_user_id — liaison d'identité
-- ════════════════════════════════════════════════════════════════════════
-- Remplace l'UPDATE de src/auth.js (bindStudentUserId). N'accepte de lier que si la
-- ligne est libre (user_id NULL) ou déjà à nous : sinon une session quelconque
-- pourrait s'approprier le compte d'un élève déjà migré.
CREATE OR REPLACE FUNCTION public.bind_student_user_id(
  p_name text, p_class_code text, p_mark_password boolean DEFAULT false
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_uid uuid := auth.uid(); v_owner uuid; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_session'); END IF;
  SELECT id, user_id INTO v_id, v_owner FROM students
   WHERE norm_name(name) = norm_name(p_name) AND class_code = p_class_code
   ORDER BY xp DESC NULLS LAST LIMIT 1;
  IF v_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_row'); END IF;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  UPDATE students
     SET user_id = v_uid,
         password_set_at = CASE WHEN p_mark_password THEN now() ELSE password_set_at END
   WHERE id = v_id;
  RETURN jsonb_build_object('ok', true);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 5) sync_my_student_email — l'email vient du JWT
-- ════════════════════════════════════════════════════════════════════════
-- Remplace l'UPDATE de syncEmailFromSession (App.jsx ~17272), qui écrivait une adresse
-- fournie par le client. Ici elle est lue dans le JWT : on ne peut coller sur son profil
-- que l'email de sa propre session.
CREATE OR REPLACE FUNCTION public.sync_my_student_email(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_email text; v_g text; v_n integer;
BEGIN
  v_email := lower(btrim(COALESCE(auth.jwt() ->> 'email', '')));
  IF v_email = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_email'); END IF;
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;
  UPDATE students SET email = v_email
   WHERE norm_name(name) = norm_name(p_name) AND class_code = p_class_code;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'rows', v_n);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 6) Lectures du Teacher Dashboard
-- ════════════════════════════════════════════════════════════════════════
-- Le dashboard lit les lignes de TOUS les élèves d'une cohorte : il ne peut pas passer
-- par la garde de propriété. Il passe donc par teacher_role_of (B4) + propriété de
-- cohorte, comme teacher_feedback / teacher_delete_student. Colonnes identiques à la
-- constante DASH_STUDENT_COLS du client (B3) — ni email, ni access_level, ni user_id.
CREATE OR REPLACE FUNCTION public.teacher_students(p_code text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_role text; v_rows jsonb;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF v_role <> 'admin'
     AND p_class_code NOT IN (SELECT code FROM groups WHERE teacher_code = p_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.xp DESC NULLS LAST), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT id, name, class_code, xp, weekly_xp, week_id, streak, last_active,
             stats, total_time, module_scores, mock_results, game_scores,
             unlocked_ach, weekly_daily_count, weekly_history
        FROM students
       WHERE class_code = p_class_code AND name <> 'Teacher'
       ORDER BY xp DESC NULLS LAST
       LIMIT 200
    ) t;
  RETURN jsonb_build_object('ok', true, 'students', v_rows);
END;
$function$;

-- Vue tous campus (admin). Mêmes colonnes que loadCampusData aujourd'hui.
CREATE OR REPLACE FUNCTION public.teacher_campus_rows(p_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_role text; v_rows jsonb;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT name, class_code, stats, total_time, module_scores, last_active
        FROM students
       WHERE name <> 'Teacher'
         AND (v_role = 'admin'
              OR class_code IN (SELECT code FROM groups WHERE teacher_code = p_code))
       LIMIT 5000
    ) t;
  RETURN jsonb_build_object('ok', true, 'role', v_role, 'students', v_rows);
END;
$function$;


-- ── Vérification (avant de toucher au client) ──────────────────────────
-- SELECT public.load_student('Pierre','idrac2026') -> 'name';        -- "Pierre"
-- SELECT public.load_student('Pierre','idrac2026') ? 'access_level'; -- true
-- SELECT public.save_student('ZZNope','idrac2027','{"xp":1}'::jsonb,false,false);
--   -- doit renvoyer ok:false (aucune ligne) et ne RIEN créer
-- SELECT jsonb_array_length(public.teacher_students('<code admin>','idrac2026')->'students');
