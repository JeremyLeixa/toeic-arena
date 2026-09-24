-- ════════════════════════════════════════════════════════════════════════
-- Économie côté serveur, lot 2c : conversions décidées par le serveur (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Avant : le client choisissait le jeton rendu et l'accordait lui-même (grant_token), en deux appels
-- séparés de la suppression / consommation ; la règle « source non premium » n'existait qu'en JS.
-- Maintenant : une transaction par conversion, jeton tiré par le serveur. Listes de jetons tirées de TOKEN_TYPES
-- (non premium = ni premium ni boost ; premium sauf insight_token) : tests/check_economy_parity.cjs vérifie.
-- ADDITIF : convert_cosmetic_dups reste jusqu'à la fermeture du lot 2.

-- 3 doublons d'un cosmétique (4 exemplaires au moins : le plus ancien est toujours gardé) → 1 jeton non premium,
-- ou 100 XP (créditée par le client) si tous sont au plafond.
CREATE OR REPLACE FUNCTION public.convert_dups_to_token(
  p_name text, p_class_code text, p_reward_type text, p_reward_id text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_total integer; v_ids uuid[]; v_pick text;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  SELECT count(*) INTO v_total FROM player_rewards
   WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
     AND reward_type = p_reward_type AND reward_id = p_reward_id;
  IF v_total < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough_duplicates', 'owned', v_total);
  END IF;

  SELECT array_agg(id) INTO v_ids FROM (
    SELECT id FROM player_rewards
     WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
       AND reward_type = p_reward_type AND reward_id = p_reward_id
     ORDER BY obtained_at DESC NULLS LAST
     LIMIT 3
  ) dups;
  DELETE FROM player_rewards WHERE id = ANY(v_ids);

  SELECT t INTO v_pick FROM unnest(ARRAY['diminishing_bypass', 'streak_shield', 'daily_reroll']) t
   WHERE COALESCE((SELECT quantity FROM player_tokens WHERE user_name = p_name AND class_code = p_class_code
                     AND token_type = t), 0) < token_cap(t)
   ORDER BY random() LIMIT 1;
  IF v_pick IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'token', NULL, 'xp_fallback', 100);
  END IF;
  PERFORM grant_token(p_name, p_class_code, v_pick, 1, token_cap(v_pick));
  RETURN jsonb_build_object('ok', true, 'token', v_pick);
END;
$function$;
REVOKE ALL ON FUNCTION public.convert_dups_to_token(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.convert_dups_to_token(text, text, text, text) TO anon, authenticated;

-- 5 jetons non premium d'un même type → 1 jeton premium. Rien n'est consommé si la source n'est pas non premium,
-- s'il en manque, ou si tous les premium sont au plafond.
CREATE OR REPLACE FUNCTION public.convert_tokens_premium(p_name text, p_class_code text, p_source text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_qty integer; v_pick text;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;
  IF p_source NOT IN ('diminishing_bypass', 'streak_shield', 'daily_reroll') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'source_not_non_premium');
  END IF;

  SELECT quantity INTO v_qty FROM player_tokens
   WHERE user_name = p_name AND class_code = p_class_code AND token_type = p_source FOR UPDATE;
  IF COALESCE(v_qty, 0) < 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough_tokens');
  END IF;

  SELECT t INTO v_pick FROM unnest(ARRAY['mock_reset', 'boss_reset', 'endless_resurrect']) t
   WHERE COALESCE((SELECT quantity FROM player_tokens WHERE user_name = p_name AND class_code = p_class_code
                     AND token_type = t), 0) < token_cap(t)
   ORDER BY random() LIMIT 1;
  IF v_pick IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'all_premium_capped');
  END IF;

  UPDATE player_tokens SET quantity = quantity - 5, updated_at = now()
   WHERE user_name = p_name AND class_code = p_class_code AND token_type = p_source;
  PERFORM grant_token(p_name, p_class_code, v_pick, 1, token_cap(v_pick));
  RETURN jsonb_build_object('ok', true, 'token', v_pick);
END;
$function$;
REVOKE ALL ON FUNCTION public.convert_tokens_premium(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.convert_tokens_premium(text, text, text) TO anon, authenticated;
