-- ════════════════════════════════════════════════════════════════════════
-- P0 sécurité — verrouillage des tables serveur-only + purge PIN en clair
-- (2026-09-11, suite au pentest — voir SECURITY_PENTEST_2026-09-11.md)
-- ════════════════════════════════════════════════════════════════════════
-- Contexte : la clé anon publique + RLS désactivée exposaient ces tables en
-- lecture (confirmé live : HTTP 200 sur SELECT anon). Ces 3 tables ne sont
-- JAMAIS touchées par le client (grep src/ = 0 référence) — uniquement par les
-- endpoints Vercel et les Edge Functions, qui utilisent la clé service_role et
-- BYPASSENT la RLS. Donc activer la RLS SANS policy = deny-all pour anon +
-- authenticated (y compris les sessions anonymes), aucun impact fonctionnel.
--
-- ⚠️ NE PAS étendre ce fichier aux tables lues/écrites par le client
-- (students, groups, player_rewards, player_tokens, push_subscriptions,
-- feedback_reports, weekly_snapshots) : activer la RLS sans policy les
-- casserait. Elles relèvent du chantier P2 (RLS keyed auth.uid()=user_id,
-- code réécrit AVANT le SQL).
-- ════════════════════════════════════════════════════════════════════════

-- 1) password_reset_tokens — ferme l'account takeover (finding C2).
--    Lisible par anon = un attaquant lisait le token d'un reset en cours et
--    changeait le mot de passe de la victime. Seule la fonction serveur
--    password-reset-* (service_role) y accède → deny-all anon est safe.
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 2) subscriptions — ferme la fuite de données de paiement (finding H4).
--    Contient user_id + stripe_customer_id + statut d'abonnement. Écrite par
--    le webhook Stripe (service_role), lue par les endpoints Stripe + Edge
--    Functions (service_role). Le client lit l'entitlement via
--    students.access_level, jamais cette table.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3) passes — idem subscriptions (Pass 3 mois).
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;

-- 4) students.pin — 13 PIN à 4 chiffres EN CLAIR, lisibles par anon, vestige
--    d'un ancien système d'auth (aucune référence dans le code depuis 2026-04).
--    Finding C5. Purge définitive.
--    (Optionnel avant le DROP, pour garder une trace hors-ligne :
--     SELECT name, class_code, pin FROM public.students WHERE pin IS NOT NULL;)
ALTER TABLE public.students DROP COLUMN IF EXISTS pin;

-- ── Vérification post-migration (doit renvoyer rowsecurity = true) ──
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('password_reset_tokens','subscriptions','passes');
