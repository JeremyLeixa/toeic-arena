-- ════════════════════════════════════════════════════════════════════════
-- Économie côté serveur, lot 1 : FERMETURE (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Passé APRÈS vérification en prod du client lot 1 (bundle en ligne : buy_item et claim_bourse_title,
-- plus aucun appel à spend_marks ni grant_reward_once). Aucune autre fonction SQL ne les appelait.
-- spend_marks prenait prix / catégorie / rareté / one_shot / plafond du client ; grant_reward_once accordait
-- n'importe quel cosmétique. Supprimées (et non seulement révoquées) : scripts/check-security.mjs exige
-- un 404 sur la liste RETIRED, pour qu'aucune ne revienne par un vieux CREATE OR REPLACE rejoué.
-- Revenir en arrière = rejouer 2026-09-24_currency_bounds.sql (spend_marks) et 2026-09-15_p2d3_chest_rpc.sql
-- (grant_reward_once), et reverter le client.

DROP FUNCTION IF EXISTS public.spend_marks(text, text, text, text, text, integer, text, integer, boolean);
DROP FUNCTION IF EXISTS public.grant_reward_once(text, text, text, text, text);
