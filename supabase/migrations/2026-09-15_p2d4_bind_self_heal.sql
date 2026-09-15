-- ════════════════════════════════════════════════════════════════════════
-- P2-D4 — Liaison d'identité auto-réparatrice (claim et connexion)
-- ════════════════════════════════════════════════════════════════════════
--
-- SYMPTÔME (vécu par Jérémy le 2026-09-15 au soir) : « choisis un mot de passe » à
-- chaque login, alors que le mot de passe avait été posé. Ne concerne pas que lui : tout
-- compte passé par le chemin de secours « un compte existe déjà → me connecter » est
-- dans cet état.
--
-- MÉCANISME. Deux marqueurs, deux lectures :
--   · le ROUTAGE (find_students_by_name → Onboard.lookupName) regarde password_set_at :
--     NULL → écran « claim » (poser un mot de passe) ;
--   · la GARDE (student_guard, donc load/save_student) regarde user_id : NULL → tolérance
--     legacy, sinon auth.uid() doit être le propriétaire.
-- Le client liait à la connexion SANS poser password_set_at (bind sans p_mark_password),
-- d'où des lignes « liées mais sans date » : garde satisfaite (même uid), routage qui
-- renvoie au claim, dont le signUp échoue (compte synthétique déjà créé) → chemin de
-- secours → connexion → liaison sans date → et ainsi de suite à chaque login.
--
-- PIRE CAS. Une ligne dont user_id pointe une VIEILLE identité (compte email réel de
-- l'ère magic-link, ou session d'avant) : le claim crée le compte synthétique (uid Y),
-- la liaison est refusée (not_owner, X ≠ Y), le client ignorait le refus et laissait
-- entrer via recover_student_row (sans garde) — puis CHAQUE save_student était refusé
-- par student_guard (auth.uid() = Y ≠ X). Progression perdue en silence. C'est l'état
-- des trois comptes débloqués à la main le matin du 2026-09-15.
--
-- CORRECTIF (cette fonction seule, signature inchangée) :
--   1. not_owner n'est opposé que si la ligne est SÉCURISÉE (password_set_at posé) et
--      appartient à quelqu'un d'autre. Sur une ligne non sécurisée, un user_id résiduel
--      n'est la preuve de rien (il vient d'une liaison sans date, ou d'une identité
--      abandonnée) : la reliaison est autorisée, c'est ça, la migration. Même politique
--      que la tolérance legacy de student_guard (user_id NULL passe), étendue au cas
--      « user_id périmé » qu'elle ne couvrait pas.
--   2. p_mark_password pose password_set_at s'il est NULL et le CONSERVE sinon
--      (COALESCE) : le client peut désormais marquer à chaque connexion réussie sans
--      réécrire la date d'origine.
-- Le client (Onboard.jsx, même livraison) passe p_mark_password=true à la connexion et
-- refuse d'entrer si la liaison est refusée, avec un message qui dit de prévenir le
-- formateur, au lieu de laisser jouer sans sauvegarder.
--
-- CE QUE ÇA NE CHANGE PAS : une ligne sécurisée reste inappropriable (not_owner), la
-- garde student_guard est intacte, aucune colonne ni signature ne bouge (check_rpc_contracts).
--
-- ORDRE : ce SQL d'abord (compatible avec l'ancien client), puis le client. Avec l'ancien
-- SQL, le nouveau client fonctionne aussi (il marque la date à chaque connexion, elle est
-- juste réécrite) — l'ordre inverse n'est donc pas dangereux, seulement moins propre.

CREATE OR REPLACE FUNCTION public.bind_student_user_id(
  p_name text, p_class_code text, p_mark_password boolean DEFAULT false
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_uid uuid := auth.uid(); v_owner uuid; v_id uuid; v_secured timestamptz;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_session'); END IF;
  SELECT id, user_id, password_set_at INTO v_id, v_owner, v_secured FROM students
   WHERE norm_name(name) = norm_name(p_name) AND class_code = p_class_code
   ORDER BY xp DESC NULLS LAST LIMIT 1;
  IF v_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_row'); END IF;
  -- Refus seulement si la ligne est sécurisée ET à quelqu'un d'autre (P2-D4).
  IF v_secured IS NOT NULL AND v_owner IS NOT NULL AND v_owner IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  UPDATE students
     SET user_id = v_uid,
         password_set_at = CASE WHEN p_mark_password THEN COALESCE(password_set_at, now()) ELSE password_set_at END
   WHERE id = v_id;
  RETURN jsonb_build_object('ok', true,
    'rebound', (v_owner IS NOT NULL AND v_owner IS DISTINCT FROM v_uid));
END;
$function$;

-- CREATE OR REPLACE conserve les privilèges existants ; on les refixe quand même, par
-- convention du verrou (jamais un GRANT seul, jamais un REVOKE partiel sur une table —
-- ici une fonction : EXECUTE est son seul privilège).
REVOKE ALL ON FUNCTION public.bind_student_user_id(text, text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.bind_student_user_id(text, text, boolean) TO anon, authenticated;

-- ── Diagnostic AVANT / APRÈS (à lancer dans le SQL Editor) ─────────────────
-- 1) Population des trois états :
--    SELECT
--      count(*) FILTER (WHERE user_id IS NULL AND password_set_at IS NULL)     AS legacy_libre,
--      count(*) FILTER (WHERE user_id IS NOT NULL AND password_set_at IS NULL) AS lie_sans_date,
--      count(*) FILTER (WHERE password_set_at IS NOT NULL)                     AS securise
--    FROM public.students;
--    « lie_sans_date » = les comptes qui revoient l'écran claim à chaque login ; ils se
--    réparent seuls à leur prochaine connexion une fois client + SQL déployés.
-- 2) Lignes sécurisées dont l'identité n'est PAS le compte synthétique (à réparer à la
--    main, comme les trois du matin) :
--    SELECT s.name, s.class_code, s.password_set_at, s.user_id, u.email
--      FROM public.students s LEFT JOIN auth.users u ON u.id = s.user_id
--     WHERE s.password_set_at IS NOT NULL
--       AND (u.email IS NULL OR u.email NOT LIKE '%@students.verse-arena.fr');
-- 3) Vérification : `npm run check:security` (bind_student_user_id reste sondée, gardée par auth.uid).
