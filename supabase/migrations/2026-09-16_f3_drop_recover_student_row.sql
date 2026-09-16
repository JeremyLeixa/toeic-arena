-- ════════════════════════════════════════════════════════════════════════
-- F3 — suppression de recover_student_row (audit identité du 2026-09-16)
-- ════════════════════════════════════════════════════════════════════════
--
-- POURQUOI. recover_student_row(p_name, p_class_code) (2026-09-14_p2b3_public_reads.sql)
-- rend la ligne students COMPLÈTE — email, access_level, progression — à partir d'un prénom
-- et d'un code promo, sans garde. C'est le finding C4 côté LECTURE : fermé en écriture pour
-- les comptes sécurisés (save_student → not_owner), resté ouvert en lecture. Sa migration
-- d'origine la marquait « TEMPORAIRE — À SUPPRIMER À LA DATE BUTOIR » (passée le 2026-09-14).
-- Elle nourrissait aussi le piège de F1/F2 : « Continuer sans pour l'instant » ouvrait un
-- compte sécurisé avec une session incapable de sauvegarder.
--
-- ⚠️ ORDRE (CLAUDE.md, modèle d'accès). Ce fichier brûle le filet :
--   1. client déployé SANS aucun appel à recover_student_row (commits F3 : recover() lit par
--      load_student, onboarding sans entrée sans mot de passe, BUILD_ID 2026-09-16-f3) ;
--   2. vérification en prod (connexion par mot de passe) ;
--   3. SEULEMENT ALORS ce fichier. Appliqué avant le client, les anciennes versions encore en
--      cache échoueraient en « Compte introuvable » au lieu de s'ouvrir sans mot de passe
--      (dégradation sûre, mais pas voulue).
--
-- VÉRIFICATION APRÈS APPLICATION :
--   · npm run check:security → la sonde « RPC retirées » exige un 404 sur recover_student_row ;
--   · un login par mot de passe + un « Join a Group » en prod (règle après toute migration
--     de privilèges).

REVOKE ALL ON FUNCTION public.recover_student_row(text, text) FROM public, anon, authenticated;
DROP FUNCTION IF EXISTS public.recover_student_row(text, text);

-- Contrôle (SQL Editor) : doit renvoyer 0 ligne.
--   SELECT proname FROM pg_proc WHERE proname = 'recover_student_row';
