-- ════════════════════════════════════════════════════════════════════════
-- P2-D3 — Restaurer la lecture élève de `groups` (régression du 2026-09-15)
-- ════════════════════════════════════════════════════════════════════════
--
-- SYMPTÔME. Depuis l'application de 2026-09-15_p2d0_schema_hygiene.sql, l'écran
-- « Join a Group » répond « Code not found » pour TOUS les codes de promo
-- (teacher-internal, idrac2026, iabd2627…). Constaté par Jérémy le 2026-09-15 à
-- 18h14 sur la preview, reproduit avec la clé anon en REST :
--     GET /rest/v1/groups?select=name,type&code=eq.idrac2026  →  200 []
-- Une liste vide avec un 200 (et non un 401/42501) = le privilège SELECT existe,
-- mais la RLS ne laisse passer aucune ligne : RLS active, zéro policy SELECT.
--
-- CAUSE. 2026-09-13_p2b4_lock_groups.sql révoque tout sur `groups` PUIS ré-accorde
-- SELECT colonne par colonne (toutes sauf teacher_code / teacher_email) : la lecture
-- élève était VOULUE, elle reposait sur ce grant + la policy legacy
-- « Groups are readable by everyone » (SELECT USING true). La migration D0 a
-- supprimé cette policy en la croyant inerte (« privilège restant : TRIGGER seul »),
-- ce qui était vrai des policies d'écriture (le grant UPDATE avait bien disparu),
-- pas de celle de lecture. Pour `events`, D0 avait gardé « Events visible » pour la
-- même raison ; `groups` méritait le même soin.
--
-- IMPACT côté client tant que ce n'est pas appliqué (4 lectures directes de
-- `groups`, App.jsx) :
--   · Onboarding checkGroupCode        → « Code not found » : AUCUNE inscription
--                                        avec code de promo possible (seul le mode
--                                        visiteur passe).
--   · Chargement du profil (groupAccess) → res.data null → repli « school / ok » :
--                                        les élèves gardent l'accès, mais les bornes
--                                        start_date / end_date ne sont plus appliquées.
--   · League (saisons du groupe)        → null → repli SEASONS (idrac2026 seulement).
--   · Picker d'homonymes (groupMap)     → cartes sans nom de promo.
--
-- CORRECTIF. Recréer la policy de lecture, et rien d'autre. Les colonnes sensibles
-- restent protégées par le grant colonne de B4 (teacher_code / teacher_email ne
-- sont pas accordées : un SELECT * échoue, un SELECT sur les colonnes accordées
-- passe). Aucun changement client, aucun déploiement.
--
-- À appliquer dans le SQL Editor Supabase (projet huklmklwvwwhhrrcyytq), puis
-- `npm run check:security` doit passer avec le nouveau chemin « groups par code ».

DROP POLICY IF EXISTS "Groups are readable by everyone" ON public.groups;
CREATE POLICY "Groups are readable by everyone"
  ON public.groups
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Vérification post-migration ────────────────────────────────────────
-- 1) La policy existe, SELECT seul :
--    SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'groups';
--    → une ligne : "Groups are readable by everyone" | SELECT | {anon,authenticated}
--
-- 2) Le grant colonne de B4 est toujours là (teacher_code / teacher_email absents) :
--    SELECT column_name FROM information_schema.column_privileges
--     WHERE table_name = 'groups' AND grantee = 'anon' AND privilege_type = 'SELECT'
--     ORDER BY column_name;
--
-- 3) Depuis le client (clé anon), une ligne revient pour un code existant :
--    GET /rest/v1/groups?select=name,type&code=eq.idrac2026  →  200 [{"name":…,"type":…}]
--    et les colonnes sensibles restent refusées :
--    GET /rest/v1/groups?select=teacher_code&limit=1          →  42501 permission denied
