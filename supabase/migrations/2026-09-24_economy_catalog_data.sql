-- ════════════════════════════════════════════════════════════════════════
-- FICHIER GÉNÉRÉ par scripts/gen-economy-sql.mjs depuis src/data/chestCatalog.js — NE PAS ÉDITER.
-- Catalogues de l'économie côté serveur (lot 1 du chantier « économie côté serveur », 2026-09-24).
-- Tables SANS accès client (verrou du 2026-09-15) : seules les RPC SECURITY DEFINER les lisent.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.shop_catalog (
  item_id text PRIMARY KEY, category text NOT NULL, ref_id text NOT NULL,
  price integer NOT NULL CHECK (price > 0), rarity text, one_shot boolean NOT NULL);
CREATE TABLE IF NOT EXISTS public.reward_catalog (
  reward_type text NOT NULL, reward_id text NOT NULL, rarity text NOT NULL, exclusive boolean NOT NULL,
  PRIMARY KEY (reward_type, reward_id));
CREATE TABLE IF NOT EXISTS public.token_catalog (
  token_type text PRIMARY KEY, cap integer NOT NULL CHECK (cap > 0), premium boolean NOT NULL, boost boolean NOT NULL);

ALTER TABLE public.shop_catalog ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.shop_catalog FROM anon, authenticated, public;
ALTER TABLE public.reward_catalog ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.reward_catalog FROM anon, authenticated, public;
ALTER TABLE public.token_catalog ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.token_catalog FROM anon, authenticated, public;

BEGIN;
DELETE FROM public.shop_catalog; DELETE FROM public.reward_catalog; DELETE FROM public.token_catalog;
INSERT INTO public.shop_catalog (item_id, category, ref_id, price, rarity, one_shot) VALUES
  ('sk_frostbite', 'skin', 'frostbite', 1400, 'rare', true),
  ('sk_abyssal', 'skin', 'abyssal', 1400, 'rare', true),
  ('sk_emberheart', 'skin', 'emberheart', 2800, 'epic', true),
  ('sk_cosmic', 'skin', 'cosmic_void', 2800, 'epic', true),
  ('sk_molten', 'skin', 'molten_gold', 5800, 'legend', true),
  ('sk_heraldic', 'skin', 'heraldic', 5800, 'legend', true),
  ('sk_aldric', 'skin', 'aldric_chamber', 5800, 'legend', true),
  ('fr_arc', 'frame', 'arc_pulse', 400, 'rare', true),
  ('fr_halo', 'frame', 'gilded_halo', 750, 'epic', true),
  ('fr_orbit', 'frame', 'orbit', 750, 'epic', true),
  ('fr_tempest', 'frame', 'tempest', 750, 'epic', true),
  ('fr_inferno', 'frame', 'inferno_ring', 1400, 'legend', true),
  ('fr_prism', 'frame', 'prismatic', 1400, 'legend', true),
  ('ti_marchand', 'title', 'marchand_reliques', 200, 'rare', true),
  ('ti_arpenteur', 'title', 'arpenteur_comptoir', 250, 'rare', true),
  ('ti_tisseur', 'title', 'tisseur_darics', 350, 'epic', true),
  ('ti_oeil', 'title', 'oeil_aldric', 500, 'epic', true),
  ('tok_reroll', 'token', 'daily_reroll', 60, NULL, false),
  ('tok_bypass', 'token', 'diminishing_bypass', 90, NULL, false),
  ('tok_shield', 'token', 'streak_shield', 120, NULL, false),
  ('tok_mock', 'token', 'mock_reset', 150, NULL, false),
  ('tok_endless', 'token', 'endless_resurrect', 150, NULL, false),
  ('tok_boss', 'token', 'boss_reset', 220, NULL, false),
  ('tok_insight', 'token', 'insight_token', 300, NULL, false),
  ('boost_module', 'token', 'module_booster', 120, NULL, false),
  ('boost_mock', 'token', 'mock_multiplier', 220, NULL, false),
  ('boost_daily', 'token', 'daily_doubler', 400, NULL, false),
  ('cs_part5_conjunctions', 'cheat_sheet', 'part5_conjunctions', 700, 'epic', true),
  ('cs_part3_negation', 'cheat_sheet', 'part3_negation', 700, 'epic', true),
  ('cs_reading_skim_scan', 'cheat_sheet', 'reading_skim_scan', 450, 'rare', true),
  ('cs_part5_word_pairs', 'cheat_sheet', 'part5_word_pairs', 450, 'rare', true),
  ('cs_listening_reductions', 'cheat_sheet', 'listening_reductions', 450, 'rare', true),
  ('cs_part5_modals', 'cheat_sheet', 'part5_modals', 700, 'epic', true),
  ('cs_business_false_cognates', 'cheat_sheet', 'business_false_cognates', 700, 'epic', true),
  ('cs_part7_inference', 'cheat_sheet', 'part7_inference', 900, 'legend', true);
INSERT INTO public.reward_catalog (reward_type, reward_id, rarity, exclusive) VALUES
  ('avatar', 'paysan', 'common', false),
  ('avatar', 'ecuyer', 'common', false),
  ('avatar', 'apprenti', 'common', false),
  ('avatar', 'archer', 'common', false),
  ('avatar', 'forgeron', 'common', false),
  ('avatar', 'aubergiste', 'common', false),
  ('avatar', 'herboriste', 'common', false),
  ('avatar', 'barde', 'common', false),
  ('avatar', 'sentinelle', 'common', false),
  ('avatar', 'marchand', 'common', false),
  ('avatar', 'chevalier', 'uncommon', false),
  ('avatar', 'roublard', 'uncommon', false),
  ('avatar', 'sorcier', 'uncommon', false),
  ('avatar', 'rodeuse', 'uncommon', false),
  ('avatar', 'clerc', 'uncommon', false),
  ('avatar', 'alchimiste', 'uncommon', false),
  ('avatar', 'mercenaire', 'uncommon', false),
  ('avatar', 'erudit', 'uncommon', false),
  ('avatar', 'paladin', 'rare', false),
  ('avatar', 'archimage', 'rare', false),
  ('avatar', 'assassin', 'rare', false),
  ('avatar', 'druide', 'rare', false),
  ('avatar', 'mage_guerre', 'rare', false),
  ('avatar', 'seigneur', 'rare', false),
  ('avatar', 'valkyrie', 'rare', false),
  ('avatar', 'ch_dragon', 'epic', false),
  ('avatar', 'necro', 'epic', false),
  ('avatar', 'archere', 'epic', false),
  ('avatar', 'st_tempete', 'epic', false),
  ('avatar', 'inquisiteur', 'epic', false),
  ('avatar', 'pourfendeur', 'legend', false),
  ('avatar', 'champion', 'legend', false),
  ('avatar', 'warrior_queen_anais', 'legend', false),
  ('skin', 'argent', 'rare', false),
  ('skin', 'emeraude', 'rare', false),
  ('skin', 'saphir', 'rare', false),
  ('skin', 'rubis', 'epic', false),
  ('skin', 'amethyste', 'epic', false),
  ('skin', 'corail', 'epic', false),
  ('skin', 'jade', 'epic', false),
  ('skin', 'obsidienne', 'legend', false),
  ('skin', 'aurore', 'legend', false),
  ('skin', 'frostbite', 'rare', true),
  ('skin', 'abyssal', 'rare', true),
  ('skin', 'emberheart', 'epic', true),
  ('skin', 'cosmic_void', 'epic', true),
  ('skin', 'molten_gold', 'legend', true),
  ('skin', 'heraldic', 'legend', true),
  ('skin', 'aldric_chamber', 'legend', true),
  ('frame', 'gold_neon', 'rare', false),
  ('frame', 'emerald_glow', 'rare', false),
  ('frame', 'ice_crystal', 'rare', false),
  ('frame', 'fire_forged', 'epic', false),
  ('frame', 'ruby_aura', 'epic', false),
  ('frame', 'amethyst_veil', 'epic', false),
  ('frame', 'cosmic', 'legend', false),
  ('frame', 'dragonbone', 'legend', false),
  ('frame', 'arc_pulse', 'rare', true),
  ('frame', 'gilded_halo', 'epic', true),
  ('frame', 'orbit', 'epic', true),
  ('frame', 'tempest', 'epic', true),
  ('frame', 'inferno_ring', 'legend', true),
  ('frame', 'prismatic', 'legend', true),
  ('title', 'apprentice', 'rare', false),
  ('title', 'tavern_regular', 'rare', false),
  ('title', 'squire', 'rare', false),
  ('title', 'scribe', 'rare', false),
  ('title', 'wordsmith', 'epic', false),
  ('title', 'tense_sage', 'epic', false),
  ('title', 'drillmaster', 'epic', false),
  ('title', 'word_forger', 'epic', false),
  ('title', 'arena_veteran', 'epic', false),
  ('title', 'dragon_slayer', 'legend', false),
  ('title', 'arena_conqueror', 'legend', false),
  ('title', 'legend', 'legend', false),
  ('title', 'aldric_chosen', 'legend', true),
  ('title', 'marchand_reliques', 'rare', true),
  ('title', 'arpenteur_comptoir', 'rare', true),
  ('title', 'tisseur_darics', 'epic', true),
  ('title', 'oeil_aldric', 'epic', true),
  ('title', 'bourse_inepuisable', 'legend', true),
  ('cheat_sheet', 'part5_conjunctions', 'epic', false),
  ('cheat_sheet', 'part3_negation', 'epic', false),
  ('cheat_sheet', 'reading_skim_scan', 'rare', false),
  ('cheat_sheet', 'part5_word_pairs', 'rare', false),
  ('cheat_sheet', 'listening_reductions', 'rare', false),
  ('cheat_sheet', 'part5_modals', 'epic', false),
  ('cheat_sheet', 'business_false_cognates', 'epic', false),
  ('cheat_sheet', 'part7_inference', 'legend', false);
INSERT INTO public.token_catalog (token_type, cap, premium, boost) VALUES
  ('diminishing_bypass', 5, false, false),
  ('streak_shield', 3, false, false),
  ('daily_reroll', 1, false, false),
  ('mock_reset', 2, true, false),
  ('boss_reset', 1, true, false),
  ('endless_resurrect', 2, true, false),
  ('insight_token', 3, true, false),
  ('module_booster', 3, false, true),
  ('mock_multiplier', 2, false, true),
  ('daily_doubler', 2, false, true);
COMMIT;

-- token_cap() lit désormais token_catalog (plus de CASE recopié à la main).
CREATE OR REPLACE FUNCTION public.token_cap(p_type text) RETURNS integer
  LANGUAGE sql STABLE SET search_path = public
AS $function$ SELECT cap FROM token_catalog WHERE token_type = p_type $function$;
REVOKE ALL ON FUNCTION public.token_cap(text) FROM public, anon, authenticated;
