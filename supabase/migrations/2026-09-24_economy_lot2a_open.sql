-- ════════════════════════════════════════════════════════════════════════
-- Économie côté serveur, lot 2a : le serveur tire et crédite le contenu des coffres (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Avant : le client tirait le butin (pickRewards) et l'envoyait à open_pending_chest, qui l'enregistrait tel
-- quel (exclusifs compris, sans contrôle de rareté ni de nombre) ; Darics et jetons étaient crédités ensuite par
-- des appels séparés du client.
-- Maintenant : open_chest(p_pending_id) consomme le coffre, TIRE le butin (_roll_chest, port de pickRewards
-- sur chest_drop_tables / reward_catalog / rarity_catalog générés depuis src/data/chestCatalog.js), crédite
-- cosmétiques, jetons et Darics dans la MÊME transaction, journalise, et renvoie le butin au format de
-- pickRewards (l'écran d'ouverture ne change pas). Seule l'XP reste créditée par le client (bornée par le lot 3).
-- ADDITIF : open_pending_chest reste jusqu'à la fermeture (fichier séparé, après vérification en prod).

-- Tirage (interne : jamais appelable par le client). Même logique que pickRewards, slot par slot.
CREATE OR REPLACE FUNCTION public._roll_chest(p_name text, p_class_code text, p_chest_type text)
RETURNS jsonb
  LANGUAGE plpgsql VOLATILE SET search_path = public
AS $function$
DECLARE
  v_slots jsonb; s jsonb; v_out jsonb := '[]'::jsonb; v_kind text; v_sub text; v_min int;
  v_pick text; v_rar text; v_tok jsonb; v_pool text[]; v_avail text[]; v_count int; v_picks int; k int; t text;
  v_chance numeric;
BEGIN
  SELECT slots INTO v_slots FROM chest_drop_tables WHERE chest_type = p_chest_type;
  IF v_slots IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE(jsonb_object_agg(token_type, quantity), '{}'::jsonb) INTO v_tok
    FROM player_tokens WHERE user_name = p_name AND class_code = p_class_code;

  FOR s IN SELECT * FROM jsonb_array_elements(v_slots) LOOP
    v_kind := s->>'kind';

    IF v_kind = 'daric' THEN
      v_out := v_out || jsonb_build_array(jsonb_build_object('type', 'daric', 'amount', COALESCE((s->>'amount')::int, 0)));

    ELSIF v_kind = 'xp' THEN
      v_out := v_out || jsonb_build_array(jsonb_build_object('type', 'xp', 'id', NULL,
        'xp', (s->>'min')::int + floor(random() * ((s->>'max')::int - (s->>'min')::int + 1))::int));

    ELSIF v_kind = 'cosmetic' THEN
      SELECT x INTO v_sub FROM jsonb_array_elements_text(s->'oneOf') x ORDER BY random() LIMIT 1;
      v_min := COALESCE((SELECT tier FROM rarity_catalog WHERE id = s->>'minRarity'), 0);
      v_pick := NULL;
      -- Non possédé, jamais exclusif (les exclusifs ne sortent que de la boutique ou d'un geste du formateur).
      SELECT rc.reward_id, rc.rarity INTO v_pick, v_rar
        FROM reward_catalog rc JOIN rarity_catalog rr ON rr.id = rc.rarity
       WHERE rc.reward_type = v_sub AND NOT rc.exclusive AND rr.tier >= v_min
         AND NOT EXISTS (SELECT 1 FROM player_rewards pr WHERE pr.user_name = p_name AND pr.class_code = p_class_code
                           AND pr.reward_type = v_sub AND pr.reward_id = rc.reward_id)
       ORDER BY random() LIMIT 1;
      IF v_pick IS NOT NULL THEN
        v_out := v_out || jsonb_build_array(jsonb_build_object('type', v_sub, 'id', v_pick, 'rarity', v_rar));
      ELSE
        -- Tout est possédé : un doublon (convertible), comme pickRewards.
        SELECT rc.reward_id, rc.rarity INTO v_pick, v_rar
          FROM reward_catalog rc JOIN rarity_catalog rr ON rr.id = rc.rarity
         WHERE rc.reward_type = v_sub AND NOT rc.exclusive AND rr.tier >= v_min
         ORDER BY random() LIMIT 1;
        IF v_pick IS NOT NULL THEN
          v_out := v_out || jsonb_build_array(jsonb_build_object('type', v_sub, 'id', v_pick, 'rarity', v_rar, 'duplicate', true));
        ELSE
          v_out := v_out || jsonb_build_array(jsonb_build_object('type', 'xp', 'id', NULL, 'fallback', 'empty_pool',
            'xp', CASE s->>'minRarity' WHEN 'legend' THEN 500 WHEN 'epic' THEN 250 ELSE 100 END));
        END IF;
      END IF;

    ELSIF v_kind = 'token' THEN
      v_chance := (s->>'chance')::numeric;
      IF v_chance IS NOT NULL AND random() > v_chance THEN CONTINUE; END IF;
      v_count := COALESCE((s->>'count')::int, 1);
      v_pool := ARRAY(SELECT x FROM jsonb_array_elements_text(s->'pool') x
                       WHERE COALESCE((v_tok->>x)::int, 0) < COALESCE(token_cap(x), 1));
      v_picks := LEAST(v_count, COALESCE(array_length(v_pool, 1), 0));
      FOR k IN 1..v_picks LOOP
        v_avail := ARRAY(SELECT x FROM unnest(v_pool) x WHERE COALESCE((v_tok->>x)::int, 0) < COALESCE(token_cap(x), 1));
        EXIT WHEN COALESCE(array_length(v_avail, 1), 0) = 0;
        t := v_avail[1 + floor(random() * array_length(v_avail, 1))::int];
        v_out := v_out || jsonb_build_array(jsonb_build_object('type', 'token', 'id', t, 'tokenType', t));
        v_tok := jsonb_set(v_tok, ARRAY[t], to_jsonb(COALESCE((v_tok->>t)::int, 0) + 1));
      END LOOP;
      IF v_count - v_picks > 0 THEN
        v_out := v_out || jsonb_build_array(jsonb_build_object('type', 'xp', 'id', NULL, 'xp', 50 * (v_count - v_picks),
          'fallback', 'tokens_capped'));
      END IF;

    ELSIF v_kind = 'cheat_sheet' THEN
      v_chance := COALESCE((s->>'chance')::numeric, 0);
      IF random() > v_chance THEN CONTINUE; END IF;
      v_pick := NULL;
      SELECT rc.reward_id, rc.rarity INTO v_pick, v_rar FROM reward_catalog rc
       WHERE rc.reward_type = 'cheat_sheet' AND NOT rc.exclusive
         AND NOT EXISTS (SELECT 1 FROM player_rewards pr WHERE pr.user_name = p_name AND pr.class_code = p_class_code
                           AND pr.reward_type = 'cheat_sheet' AND pr.reward_id = rc.reward_id)
       ORDER BY random() LIMIT 1;
      IF v_pick IS NOT NULL THEN
        v_out := v_out || jsonb_build_array(jsonb_build_object('type', 'cheat_sheet', 'id', v_pick, 'rarity', v_rar));
      ELSIF v_chance >= 1 THEN
        v_out := v_out || jsonb_build_array(jsonb_build_object('type', 'xp', 'id', NULL, 'xp', 300, 'fallback', 'sheets_owned'));
      END IF;
    END IF;
  END LOOP;
  RETURN v_out;
END;
$function$;
REVOKE ALL ON FUNCTION public._roll_chest(text, text, text) FROM public, anon, authenticated;

-- Ouverture : une transaction (consommation du coffre, tirage, crédits, journal). Rejouée (réseau, deux
-- appareils), elle trouve le coffre déjà consommé et ne crédite rien : 'already_opened'.
CREATE OR REPLACE FUNCTION public.open_chest(p_pending_id uuid, p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_chest pending_chests%ROWTYPE; v_rewards jsonb; r jsonb; v_type text;
        v_xp int := 0; v_dar int := 0; v_bal int; v_rar text;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  DELETE FROM pending_chests
   WHERE id = p_pending_id AND lower(user_name) = lower(p_name) AND class_code = p_class_code
  RETURNING * INTO v_chest;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_opened');
  END IF;

  v_rewards := _roll_chest(p_name, p_class_code, v_chest.chest_type);
  IF v_rewards IS NULL THEN
    RAISE EXCEPTION 'unknown_chest_type';   -- annule la transaction : le coffre reste en attente
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(v_rewards) LOOP
    v_type := r->>'type';
    IF v_type = 'xp' THEN
      v_xp := v_xp + COALESCE((r->>'xp')::int, 0);
    ELSIF v_type = 'daric' THEN
      v_dar := v_dar + COALESCE((r->>'amount')::int, 0);
    ELSIF v_type = 'token' THEN
      PERFORM grant_token(p_name, p_class_code, r->>'id', 1, token_cap(r->>'id'));
    ELSIF v_type IN ('avatar', 'skin', 'frame', 'title', 'cheat_sheet') THEN
      INSERT INTO player_rewards (user_name, class_code, reward_type, reward_id, rarity)
      VALUES (p_name, p_class_code, v_type, r->>'id', COALESCE(r->>'rarity', 'common'));
    END IF;
  END LOOP;

  IF v_dar > 0 THEN
    UPDATE students SET arena_marks = COALESCE(arena_marks, 0) + v_dar
     WHERE name = p_name AND class_code = p_class_code
    RETURNING arena_marks INTO v_bal;
    INSERT INTO marks_log (user_name, class_code, delta, source, source_detail)
    VALUES (p_name, p_class_code, v_dar, 'chest', v_chest.trigger_source);
  ELSE
    SELECT arena_marks INTO v_bal FROM students WHERE name = p_name AND class_code = p_class_code;
  END IF;

  -- Rareté affichée du coffre : même correspondance que le client (novice common, guerrier rare,
  -- champion epic, légendaire legend).
  v_rar := CASE v_chest.chest_type WHEN 'novice' THEN 'common' WHEN 'guerrier' THEN 'rare'
                                   WHEN 'champion' THEN 'epic' ELSE 'legend' END;
  INSERT INTO chest_log (user_name, class_code, chest_type, trigger_source,
                         rarity_obtained, reward_type, reward_id, xp_amount)
  VALUES (p_name, p_class_code, v_chest.chest_type, v_chest.trigger_source,
          v_rar, 'multi', 'v2', NULLIF(v_xp, 0));

  RETURN jsonb_build_object('ok', true, 'chest_type', v_chest.chest_type, 'rewards', v_rewards,
    'total_xp', v_xp, 'total_darics', v_dar, 'balance', v_bal);
END;
$function$;
REVOKE ALL ON FUNCTION public.open_chest(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.open_chest(uuid, text, text) TO anon, authenticated;
