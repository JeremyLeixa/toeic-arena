-- ════════════════════════════════════════════════════════════════════════
-- Économie côté serveur, lot 1 : la boutique (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Avant : spend_marks recevait prix, catégorie, référence, rareté, one_shot et plafond DU CLIENT. Un article
-- légendaire s'achetait 1 Daric ; one_shot=false sur un cosmétique créait des doublons à l'infini ;
-- grant_reward_once accordait n'importe quel cosmétique, exclusifs compris.
-- Maintenant : le client envoie seulement l'identifiant de l'article ; tout le reste est lu dans shop_catalog
-- (généré depuis src/data/chestCatalog.js, fichier 2026-09-24_economy_catalog_data.sql). Même transaction
-- et même réponse qu'avant ({ok, balance} ou {ok:false, error}) : la boutique côté client ne change pas.
-- ADDITIF : spend_marks et grant_reward_once restent en place jusqu'à la fermeture (fichier séparé, passé
-- après vérification en prod), pour qu'un onglet encore ouvert sur l'ancienne version ne casse pas.

CREATE OR REPLACE FUNCTION public.buy_item(p_name text, p_class_code text, p_item_id text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE it shop_catalog%ROWTYPE; bal INT; owned INT; qty INT; v_owner uuid; v_cap INT; v_week INT;
BEGIN
  SELECT * INTO it FROM shop_catalog WHERE item_id = p_item_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_item');
  END IF;
  -- FOR UPDATE : deux achats simultanés du même élève se suivent (sinon deux « déjà possédé ? » passeraient
  -- ensemble et créeraient un doublon).
  SELECT arena_marks, user_id INTO bal, v_owner FROM students
    WHERE name = p_name AND class_code = p_class_code LIMIT 1 FOR UPDATE;
  IF bal IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_student');
  END IF;
  -- Garde de propriété (grâce si legacy non migré), comme spend_marks.
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  IF it.category = 'token' THEN
    v_cap := token_cap(it.ref_id);
    IF v_cap IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_item'); END IF;
    SELECT quantity INTO qty FROM player_tokens
      WHERE user_name = p_name AND class_code = p_class_code AND token_type = it.ref_id;
    IF COALESCE(qty, 0) >= v_cap THEN
      RETURN jsonb_build_object('ok', false, 'error', 'at_cap');
    END IF;
    -- Daily Doubler : 2 achats par semaine (lundi 00:00 UTC), vérifiés ici et plus seulement côté client.
    IF it.ref_id = 'daily_doubler' THEN
      SELECT count(*) INTO v_week FROM shop_purchases
        WHERE user_name = p_name AND class_code = p_class_code AND item_id = it.item_id
          AND purchased_at >= date_trunc('week', now());
      IF v_week >= 2 THEN RETURN jsonb_build_object('ok', false, 'error', 'weekly_cap'); END IF;
    END IF;
  ELSE
    SELECT count(*) INTO owned FROM player_rewards
      WHERE user_name = p_name AND class_code = p_class_code
        AND reward_type = it.category AND reward_id = it.ref_id;
    IF owned > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
    END IF;
  END IF;

  IF bal < it.price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_marks');
  END IF;

  UPDATE students SET arena_marks = arena_marks - it.price
    WHERE name = p_name AND class_code = p_class_code
    RETURNING arena_marks INTO bal;

  IF it.category = 'token' THEN
    PERFORM grant_token(p_name, p_class_code, it.ref_id, 1, v_cap);
  ELSE
    INSERT INTO player_rewards(user_name, class_code, reward_type, reward_id, rarity)
      VALUES (p_name, p_class_code, it.category, it.ref_id, COALESCE(it.rarity, 'rare'));
  END IF;

  INSERT INTO shop_purchases(user_name, class_code, item_id, category, ref_id, price_paid)
    VALUES (p_name, p_class_code, it.item_id, it.category, it.ref_id, it.price);
  INSERT INTO marks_log(user_name, class_code, delta, source, source_detail)
    VALUES (p_name, p_class_code, -it.price, 'shop', it.item_id);

  RETURN jsonb_build_object('ok', true, 'balance', bal);
END;
$function$;
REVOKE ALL ON FUNCTION public.buy_item(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.buy_item(text, text, text) TO anon, authenticated;

-- Titre « Bottomless Purse » : accordé une fois, quand la dépense RÉELLE (shop_purchases) atteint 10 000 Darics.
-- Remplace l'appel client à grant_reward_once (qui accordait n'importe quel cosmétique sur la foi du client).
CREATE OR REPLACE FUNCTION public.claim_bourse_title(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_owner uuid; v_spent bigint; v_rows int;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name = p_name AND class_code = p_class_code;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'no_student'); END IF;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  SELECT COALESCE(SUM(price_paid), 0) INTO v_spent FROM shop_purchases
    WHERE user_name = p_name AND class_code = p_class_code;
  IF v_spent < 10000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough', 'spent', v_spent);
  END IF;
  INSERT INTO player_rewards(user_name, class_code, reward_type, reward_id, rarity)
    SELECT p_name, p_class_code, 'title', 'bourse_inepuisable', 'legend'
    WHERE NOT EXISTS (SELECT 1 FROM player_rewards WHERE user_name = p_name AND class_code = p_class_code
                        AND reward_type = 'title' AND reward_id = 'bourse_inepuisable');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'granted', v_rows > 0);
END;
$function$;
REVOKE ALL ON FUNCTION public.claim_bourse_title(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_bourse_title(text, text) TO anon, authenticated;
