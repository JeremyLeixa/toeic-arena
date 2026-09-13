-- ════════════════════════════════════════════════════════════════════════
-- P2 Phase B (B4) — auth enseignant server-side, fichier 1/2 : les RPC
-- (2026-09-13, finding H3 du pentest — voir SECURITY_PENTEST_2026-09-11.md
--  + plan .claude/plans/glowing-crunching-spark.md)
-- ════════════════════════════════════════════════════════════════════════
-- PROBLÈME (H3). `groups` est lisible par le rôle anon (RLS OFF) et le login
-- enseignant n'est qu'un `select('code').eq('teacher_code', code)` côté client.
-- Donc `await supabase.from('groups').select('teacher_code')` depuis n'importe
-- quelle console = TOUS les codes formateur → dashboard ouvert → PII de tous les
-- élèves (email, consentement RGPD, access_level, stats).
--
-- CE FICHIER ne fait que CRÉER les fonctions : il est INERTE tant que le
-- fichier 2 (verrouillage des privilèges sur `groups`) n'est pas appliqué, et
-- tant que le client n'appelle pas ces RPC. On l'applique donc en premier, on
-- vérifie le dashboard, PUIS on applique le fichier 2. Règle post-crise :
-- déployer le CODE avant le SQL.
--
-- MODÈLE. On garde le login par code (décision produit « auth prof légère » :
-- pas de comptes enseignants pour l'instant). Les teacher_code restent là où ils
-- sont, sur `groups.teacher_code` → ZÉRO migration de données. Seul le rôle
-- ADMIN (super-admin multi-campus) est déplacé du bundle vers la base : il était
-- dans VITE_ADMIN_TEACHER_CODE, donc inliné en clair dans le JS public.
--
-- Toutes les fonctions sont SECURITY DEFINER (elles doivent lire teacher_code,
-- que le rôle anon n'aura plus le droit de lire) avec search_path figé.
-- AUCUNE ne renvoie jamais teacher_code au client.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 1) Tables privées
-- ════════════════════════════════════════════════════════════════════════
-- ⚠️ Supabase pose des DEFAULT PRIVILEGES qui accordent tout à anon/authenticated
-- sur les nouvelles tables du schéma public. D'où le REVOKE explicite EN PLUS de
-- ENABLE RLS (RLS sans policy = deny-all ; le REVOKE ferme aussi la voie des
-- privilèges de table). Les fonctions SECURITY DEFINER, elles, y accèdent.

-- Registre des rôles. Un code présent ici avec role='admin' est super-admin.
-- Un code absent d'ici mais présent sur groups.teacher_code = rôle 'teacher'
-- (rétro-compatibilité totale avec les 6 cohortes existantes).
CREATE TABLE IF NOT EXISTS public.teacher_codes(
  code       text PRIMARY KEY,
  role       text NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher','admin')),
  label      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.teacher_codes FROM anon, authenticated;

-- Journal des actions destructrices/structurantes du dashboard.
-- `actor` = empreinte courte du code (left(md5(code),8)) : on veut pouvoir dire
-- QUI a agi sans stocker une deuxième copie du secret en clair.
CREATE TABLE IF NOT EXISTS public.teacher_audit_log(
  id      bigserial PRIMARY KEY,
  at      timestamptz NOT NULL DEFAULT now(),
  actor   text,
  role    text,
  action  text NOT NULL,
  target  text,
  details jsonb
);
ALTER TABLE public.teacher_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.teacher_audit_log FROM anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 2) Helper interne — résolution du rôle
-- ════════════════════════════════════════════════════════════════════════
-- EXECUTE révoqué à tout le monde : ce n'est PAS un endpoint. S'il était
-- appelable, il donnerait un oracle « ce code est-il admin ? » gratuit.
-- Les autres fonctions DEFINER ci-dessous l'appellent en tant que propriétaire.
CREATE OR REPLACE FUNCTION public.teacher_role_of(p_code text)
RETURNS text
  LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $function$
  SELECT CASE
    WHEN p_code IS NULL OR length(btrim(p_code)) < 4 THEN NULL
    WHEN EXISTS(SELECT 1 FROM teacher_codes WHERE code = p_code AND role = 'admin') THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM teacher_codes WHERE code = p_code) THEN 'teacher'
    WHEN EXISTS(SELECT 1 FROM groups       WHERE teacher_code = p_code) THEN 'teacher'
    ELSE NULL
  END;
$function$;
REVOKE ALL ON FUNCTION public.teacher_role_of(text) FROM public, anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 3) teacher_groups — login ET listing des cohortes
-- ════════════════════════════════════════════════════════════════════════
-- Remplace à la fois les 4 checks de login client (`select('code')
-- .eq('teacher_code', code)`) et `loadGroups()` (`select('*')` + filtre client).
-- Le scoping multi-campus est désormais fait EN SQL, pas dans le navigateur.
--
-- `to_jsonb(g) - 'teacher_code'` renvoie toutes les colonnes du groupe SAUF le
-- code formateur : le secret ne franchit jamais la frontière réseau, quelles que
-- soient les colonnes ajoutées à `groups` plus tard.
CREATE OR REPLACE FUNCTION public.teacher_groups(p_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_groups jsonb;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN
    -- Frein minimal au brute-force (la fonction reste un oracle de validation
    -- par nature ; un vrai rate-limit demanderait un compteur en base).
    PERFORM pg_sleep(0.3);
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(g) - 'teacher_code' ORDER BY g.type, g.name), '[]'::jsonb)
    INTO v_groups
    FROM groups g
   WHERE g.code <> 'teacher-internal'
     AND (v_role = 'admin' OR g.teacher_code = p_code);

  RETURN jsonb_build_object('ok', true, 'role', v_role, 'groups', v_groups);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 4) teacher_set_report_email — configuration du rapport hebdo
-- ════════════════════════════════════════════════════════════════════════
-- Remplace `groups.update({teacher_email,...}).eq('teacher_code', tc)`.
-- Le client ne connaît plus les teacher_code : il envoie le CODE DE COHORTE
-- sélectionné, et le serveur en déduit le teacher_code cible. Portée conservée
-- (« toutes mes cohortes » = tous les groupes partageant ce teacher_code).
CREATE OR REPLACE FUNCTION public.teacher_set_report_email(
  p_code text, p_group_code text, p_email text, p_optin boolean
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_target text; v_n integer;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT teacher_code INTO v_target FROM groups WHERE code = p_group_code;
  IF v_target IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_teacher_code'); END IF;
  IF v_role <> 'admin' AND v_target IS DISTINCT FROM p_code THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  UPDATE groups SET teacher_email = NULLIF(btrim(COALESCE(p_email,'')), ''),
                    weekly_report_optin = COALESCE(p_optin, true)
   WHERE teacher_code = v_target;
  GET DIAGNOSTICS v_n = ROW_COUNT;

  INSERT INTO teacher_audit_log(actor, role, action, target, details)
    VALUES(left(md5(p_code),8), v_role, 'set_report_email', v_target,
           jsonb_build_object('email', p_email, 'optin', p_optin, 'rows', v_n));

  RETURN jsonb_build_object('ok', true, 'rows', v_n);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 5) teacher_upsert_group — création / édition d'une cohorte
-- ════════════════════════════════════════════════════════════════════════
-- Remplace `groups.upsert({...}, {onConflict:'code'})`.
-- Ferme au passage une PRISE DE CONTRÔLE : l'upsert client acceptait n'importe
-- quel code formateur valide pour ouvrir l'écran, et réutiliser un `code` de
-- cohorte existant écrasait la ligne d'un AUTRE formateur, teacher_code compris.
-- Ici : si le groupe existe déjà et ne t'appartient pas → not_owner.
-- `p_teacher_code` n'est honoré que pour l'admin ; un formateur normal stampe
-- forcément SON code (on ne lui fait pas confiance sur ce champ).
CREATE OR REPLACE FUNCTION public.teacher_upsert_group(
  p_code text, p_group_code text, p_name text, p_type text,
  p_start text, p_end text, p_seasons jsonb,
  p_teacher_code text, p_teacher_email text, p_optin boolean
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_existing text; v_stamp text; v_gc text;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  v_gc := lower(btrim(COALESCE(p_group_code,'')));
  IF length(v_gc) < 3 THEN RETURN jsonb_build_object('ok', false, 'error', 'bad_group_code'); END IF;
  IF v_gc = 'teacher-internal' THEN RETURN jsonb_build_object('ok', false, 'error', 'reserved_code'); END IF;

  SELECT teacher_code INTO v_existing FROM groups WHERE code = v_gc;
  IF FOUND AND v_role <> 'admin' AND v_existing IS DISTINCT FROM p_code THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  -- Seul l'admin peut attribuer une cohorte à un autre formateur.
  v_stamp := CASE WHEN v_role = 'admin' THEN NULLIF(btrim(COALESCE(p_teacher_code,'')), '')
                  ELSE p_code END;
  IF v_stamp IS NULL THEN v_stamp := p_code; END IF;

  INSERT INTO groups(code, name, type, start_date, end_date, seasons,
                     teacher_code, teacher_email, weekly_report_optin)
  VALUES(v_gc, btrim(p_name), p_type,
         NULLIF(btrim(COALESCE(p_start,'')), '')::date,
         NULLIF(btrim(COALESCE(p_end,'')), '')::date,
         p_seasons, v_stamp,
         NULLIF(btrim(COALESCE(p_teacher_email,'')), ''), COALESCE(p_optin, true))
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type,
    start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
    seasons = EXCLUDED.seasons, teacher_code = EXCLUDED.teacher_code,
    teacher_email = EXCLUDED.teacher_email,
    weekly_report_optin = EXCLUDED.weekly_report_optin;

  INSERT INTO teacher_audit_log(actor, role, action, target, details)
    VALUES(left(md5(p_code),8), v_role, 'upsert_group', v_gc,
           jsonb_build_object('name', p_name, 'type', p_type, 'existed', v_existing IS NOT NULL));

  RETURN jsonb_build_object('ok', true, 'code', v_gc);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 6) teacher_delete_student — répare le bouton « Delete this student »
-- ════════════════════════════════════════════════════════════════════════
-- BUG (B5). App.jsx:12840 faisait `students.delete().eq('id', s.id)` : le filtre
-- est bon (s.id EST la PK) mais le rôle authenticated/anon N'A PAS le privilège
-- DELETE sur students (fait vérifié 2026-09-13) → 0 ligne, erreur avalée, et le
-- dashboard affichait quand même un succès. De plus AUCUNE table satellite
-- n'était purgée. Même liste de satellites que delete_my_account (B6).
--
-- ⚠️ SURFACE ASSUMÉE : cette RPC crée une vraie capacité de suppression qui
-- n'existait pas. Atténuations : (a) après le fichier 2, les teacher_code ne
-- sont plus énumérables ; (b) portée limitée aux cohortes du formateur ;
-- (c) chaque suppression laisse une trace dans teacher_audit_log.
-- On identifie l'élève par (name, class_code) et non par id : c'est la clé
-- naturelle de toutes les tables satellites, et ça évite de dépendre du type
-- de la PK.
CREATE OR REPLACE FUNCTION public.teacher_delete_student(
  p_code text, p_name text, p_class_code text
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_owner text; v_found boolean;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT true INTO v_found FROM students WHERE name = p_name AND class_code = p_class_code;
  IF NOT COALESCE(v_found, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_student');
  END IF;

  -- Portée : la cohorte de l'élève doit appartenir au formateur (admin = toutes).
  IF v_role <> 'admin' THEN
    SELECT teacher_code INTO v_owner FROM groups WHERE code = p_class_code;
    IF v_owner IS DISTINCT FROM p_code THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
    END IF;
  END IF;

  DELETE FROM weekly_snapshots   WHERE student_name = p_name AND class_code = p_class_code;
  DELETE FROM push_subscriptions WHERE student_name = p_name AND class_code = p_class_code;
  DELETE FROM player_rewards     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM player_tokens      WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM pending_chests     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM chest_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM shop_purchases     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM marks_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM students           WHERE name = p_name AND class_code = p_class_code;

  INSERT INTO teacher_audit_log(actor, role, action, target, details)
    VALUES(left(md5(p_code),8), v_role, 'delete_student', p_class_code,
           jsonb_build_object('name', p_name));

  RETURN jsonb_build_object('ok', true);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 7) À FAIRE APRÈS AVOIR APPLIQUÉ CE FICHIER (Jérémy)
-- ════════════════════════════════════════════════════════════════════════
-- Déclarer ton code admin (celui posé dans VITE_ADMIN_TEACHER_CODE le 2026-09-11).
-- Remplace la valeur entre quotes par le code réel AVANT d'exécuter :
--
--   INSERT INTO public.teacher_codes(code, role, label)
--   VALUES ('colle-ici-ton-vrai-code-admin', 'admin', 'Jeremy')
--   ON CONFLICT (code) DO UPDATE SET role = 'admin';
--
-- Vérification (doit renvoyer 'admin') :
--   SELECT public.teacher_role_of('colle-ici-ton-vrai-code-admin');
--
-- Puis tester le dashboard AVANT d'appliquer le fichier 2
-- (2026-09-13_p2b4_lock_groups.sql).
