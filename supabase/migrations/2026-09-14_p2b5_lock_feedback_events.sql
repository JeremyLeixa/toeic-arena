-- ════════════════════════════════════════════════════════════════════════
-- P2 Phase B (B5) — verrouillage `feedback_reports` + `events`, fichier 2/2
-- (2026-09-14)
-- ════════════════════════════════════════════════════════════════════════
-- ⚠️ À N'APPLIQUER QU'APRÈS :
--   1. le déploiement du code client qui passe par les RPC ;
--   2. l'application de 2026-09-14_p2b5_teacher_content_rpc.sql ;
--   3. un test du dashboard (onglet Feedback + création/arrêt d'événement).
-- ════════════════════════════════════════════════════════════════════════

-- ── feedback_reports : deny-all client ─────────────────────────────────
-- Contient des retours NOMINATIFS (user_name, class_code, message libre) et
-- était lisible par l'anon → n'importe qui pouvait aspirer les feedbacks de tous
-- les élèves de toutes les promos, et n'importe quel formateur partenaire les
-- voyait dans son dashboard.
--
-- Deny-all ne casse rien, les 3 chemins sont couverts :
--   · INSERT (élève) → `api/feedback-send.js`, service_role (bypasse) ;
--   · SELECT (dashboard) → RPC teacher_feedback ;
--   · UPDATE (résolution) → RPC teacher_resolve_feedback.
-- Vérifié par grep : aucune autre écriture/lecture client de cette table.
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback_reports FROM anon, authenticated;

-- ── events : lecture conservée, écritures fermées ──────────────────────
-- ⚠️ NE PAS faire de deny-all ici : le client ÉLÈVE lit cette table pour
-- afficher les bannières d'événement actif (App.jsx, `select('*').eq('active',
-- true)`). On ne retire donc que les écritures — elles n'étaient gardées que par
-- le flag localStorage du dashboard, et permettaient un événement + push
-- `class_code='all'` sur toute la plateforme.
-- Les colonnes d'events ne contiennent aucune donnée personnelle (type, titre,
-- description, dates, config, class_code) → SELECT au niveau table suffit, pas
-- besoin de grants colonne par colonne comme sur `groups`.
REVOKE INSERT, UPDATE, DELETE ON public.events FROM anon, authenticated;

-- ── Vérification post-migration ────────────────────────────────────────
-- SELECT table_name, grantee, privilege_type
--   FROM information_schema.role_table_grants
--  WHERE table_schema='public' AND table_name IN ('feedback_reports','events')
--    AND grantee IN ('anon','authenticated')
--  ORDER BY table_name, grantee, privilege_type;
--
-- Attendu : feedback_reports -> plus aucune ligne (hors TRIGGER, grant Supabase
-- par défaut, inerte car PostgREST n'émet pas de DDL) ; events -> SELECT seul.
