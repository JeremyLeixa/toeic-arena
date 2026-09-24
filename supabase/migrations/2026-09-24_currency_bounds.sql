-- ════════════════════════════════════════════════════════════════════════
-- Mitigation : bornes serveur sur la monnaie et les jetons (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Constat (relevé du 2026-09-24, vérifié en prod) : grant_marks, spend_marks, grant_token et
-- consume_token vérifient QUI appelle (propriété), jamais COMBIEN. Depuis la console :
--   · grant_marks(p_delta := 99999) crédite n'importe quel montant ;
--   · spend_marks(p_price := -99999) CRÉDITE le compte (bal < p_price est faux, arena_marks - p_price monte) ;
--   · grant_token(p_amount, p_cap) : quantité et plafond choisis par l'appelant ;
--   · consume_token(p_amount := -5) AJOUTE des jetons (quantity - (-5)).
-- Aucune trace d'exploitation au 24/09 (aucun achat à prix <= 0, aucun jeton au-dessus de son plafond,
-- plus gros solde = somme exacte de ses gains journalisés).
--
-- Ceci est une MITIGATION (ferme les abus illimités), pas la correction de fond : les montants et
-- récompenses devraient être calculés côté serveur (chantier séparé, Plan Mode). Restent ouverts après
-- ce fichier : prix sous-évalué d'un article de la boutique (catalogue côté client), grant_reward_once
-- et open_pending_chest (récompenses fournies par l'appelant).
--
-- Bornes choisies sur les données réelles :
--   · un gain de Darics : 1 à 1000 (plus gros gain légitime : 700, coffre Légendaire) ;
--   · 3000 Darics au plus par élève sur 24 h glissantes hors boutique et hors dons du formateur
--     (record réel : 1795 le 2026-05-31) ;
--   · jetons : types connus seulement, plafond = celui de TOKEN_TYPES (src/data/chests.js), 1 à 3 par
--     octroi (le client en accorde toujours 1), 1 à 5 par consommation.
-- Les dons du formateur (source 'admin', 'admin_bonus') passent par le SQL Editor, pas par ces RPC.
-- `npm run check:security` ne signale que 401/403/404 : une exception de borne (400) le laisse vert.
-- Logique métier reproduite À L'IDENTIQUE de 2026-09-13_p2b_rpc_ownership.sql, bornes en plus.

-- ── Plafonds des jetons : miroir de TOKEN_TYPES (src/data/chests.js). Un type inconnu → NULL. ──
CREATE OR REPLACE FUNCTION public.token_cap(p_type text) RETURNS integer
  LANGUAGE sql IMMUTABLE SET search_path = public
AS $function$
  SELECT CASE p_type
    WHEN 'diminishing_bypass' THEN 5
    WHEN 'streak_shield'      THEN 3
    WHEN 'daily_reroll'       THEN 1
    WHEN 'mock_reset'         THEN 2
    WHEN 'boss_reset'         THEN 1
    WHEN 'endless_resurrect'  THEN 2
    WHEN 'insight_token'      THEN 3
    WHEN 'module_booster'     THEN 3
    WHEN 'mock_multiplier'    THEN 2
    WHEN 'daily_doubler'      THEN 2
    ELSE NULL
  END;
$function$;
REVOKE ALL ON FUNCTION public.token_cap(text) FROM public, anon, authenticated;

-- ── grant_marks ──
CREATE OR REPLACE FUNCTION public.grant_marks(
  p_user_name text, p_class_code text, p_delta integer,
  p_source text, p_source_detail text, p_unique boolean DEFAULT false
) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_owner uuid; v_day integer;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  -- Garde de propriété (grâce si legacy non migré : user_id NULL)
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  -- Borne par octroi (2026-09-24).
  IF p_delta IS NULL OR p_delta < 1 OR p_delta > 1000 THEN
    RAISE EXCEPTION 'invalid_delta';
  END IF;

  IF p_unique AND EXISTS(
    SELECT 1 FROM marks_log
    WHERE user_name=p_user_name AND class_code=p_class_code AND source_detail=p_source_detail
  ) THEN
    RETURN 0; -- déjà accordé, no-op silencieux côté client
  END IF;

  -- Plafond sur 24 h glissantes (2026-09-24), hors boutique et hors dons du formateur.
  SELECT COALESCE(SUM(delta), 0) INTO v_day FROM marks_log
    WHERE user_name=p_user_name AND class_code=p_class_code AND delta > 0
      AND source NOT IN ('shop', 'admin', 'admin_bonus')
      AND created_at > now() - interval '24 hours';
  IF v_day + p_delta > 3000 THEN
    RAISE EXCEPTION 'daily_limit';
  END IF;

  UPDATE students SET arena_marks = COALESCE(arena_marks,0) + p_delta
    WHERE name=p_user_name AND class_code=p_class_code;
  INSERT INTO marks_log(user_name,class_code,delta,source,source_detail)
    VALUES(p_user_name,p_class_code,p_delta,p_source,p_source_detail);
  RETURN p_delta;
END;
$function$;

-- ── grant_token ──
CREATE OR REPLACE FUNCTION public.grant_token(
  p_user_name text, p_class_code text, p_token_type text, p_amount integer, p_cap integer
) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_new_qty INT; v_owner uuid; v_cap INT;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  -- Bornes (2026-09-24) : type connu, plafond serveur, 1 à 3 par octroi.
  v_cap := token_cap(p_token_type);
  IF v_cap IS NULL THEN RAISE EXCEPTION 'invalid_token_type'; END IF;
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 3 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  v_cap := LEAST(COALESCE(p_cap, v_cap), v_cap);

  INSERT INTO public.player_tokens (user_name, class_code, token_type, quantity)
  VALUES (p_user_name, p_class_code, p_token_type, LEAST(p_amount, v_cap))
  ON CONFLICT (user_name, class_code, token_type)
  DO UPDATE SET
    quantity   = LEAST(public.player_tokens.quantity + p_amount, v_cap),
    updated_at = now()
  RETURNING quantity INTO v_new_qty;
  RETURN v_new_qty;
END;
$function$;

-- ── consume_token ──
CREATE OR REPLACE FUNCTION public.consume_token(
  p_user_name text, p_class_code text, p_token_type text, p_amount integer
) RETURNS boolean
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_qty INT; v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  -- Borne (2026-09-24) : une quantité négative AJOUTAIT des jetons.
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 5 THEN
    RETURN FALSE;
  END IF;

  SELECT quantity INTO v_qty
  FROM public.player_tokens
  WHERE user_name = p_user_name AND class_code = p_class_code AND token_type = p_token_type
  FOR UPDATE;

  IF v_qty IS NULL OR v_qty < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.player_tokens
  SET quantity = quantity - p_amount, updated_at = now()
  WHERE user_name = p_user_name AND class_code = p_class_code AND token_type = p_token_type;

  RETURN TRUE;
END;
$function$;

-- ── spend_marks ──
CREATE OR REPLACE FUNCTION public.spend_marks(
  p_user_name TEXT, p_class_code TEXT, p_item_id TEXT,
  p_category TEXT, p_ref_id TEXT, p_price INT,
  p_rarity TEXT, p_cap INT, p_one_shot BOOLEAN
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE bal INT; owned INT; qty INT; v_owner uuid; v_cap INT;
BEGIN
  SELECT arena_marks, user_id INTO bal, v_owner FROM students
    WHERE name = p_user_name AND class_code = p_class_code LIMIT 1;
  IF bal IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_student');
  END IF;
  -- Garde de propriété (grâce si legacy non migré)
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  -- Bornes (2026-09-24) : un prix <= 0 CRÉDITAIT le compte ; un jeton garde son plafond serveur.
  IF p_price IS NULL OR p_price < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_price');
  END IF;
  IF p_category = 'token' THEN
    v_cap := token_cap(p_ref_id);
    IF v_cap IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_item');
    END IF;
    v_cap := LEAST(COALESCE(p_cap, v_cap), v_cap);
  ELSE
    v_cap := p_cap;
  END IF;

  IF p_one_shot THEN
    SELECT count(*) INTO owned FROM player_rewards
      WHERE user_name = p_user_name AND class_code = p_class_code
        AND reward_type = p_category AND reward_id = p_ref_id;
    IF owned > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
    END IF;
  ELSE
    SELECT quantity INTO qty FROM player_tokens
      WHERE user_name = p_user_name AND class_code = p_class_code
        AND token_type = p_ref_id;
    IF COALESCE(qty, 0) >= v_cap THEN
      RETURN jsonb_build_object('ok', false, 'error', 'at_cap');
    END IF;
  END IF;

  IF bal < p_price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_marks');
  END IF;

  UPDATE students SET arena_marks = arena_marks - p_price
    WHERE name = p_user_name AND class_code = p_class_code
    RETURNING arena_marks INTO bal;

  IF p_category = 'token' THEN
    PERFORM grant_token(p_user_name, p_class_code, p_ref_id, 1, v_cap);
  ELSE
    INSERT INTO player_rewards(user_name, class_code, reward_type, reward_id, rarity)
      VALUES (p_user_name, p_class_code, p_category, p_ref_id, p_rarity);
  END IF;

  INSERT INTO shop_purchases(user_name, class_code, item_id, category, ref_id, price_paid)
    VALUES (p_user_name, p_class_code, p_item_id, p_category, p_ref_id, p_price);
  INSERT INTO marks_log(user_name, class_code, delta, source, source_detail)
    VALUES (p_user_name, p_class_code, -p_price, 'shop', p_item_id);

  RETURN jsonb_build_object('ok', true, 'balance', bal);
END;
$function$;

-- Vérification (lecture seule, compte test) :
--   SELECT grant_marks('<eleve>', '<code>', -5, 'x', 'y');     -- invalid_delta
--   SELECT spend_marks('<eleve>', '<code>', 'x', 'token', 'daily_reroll', -100, 'common', 99, false);  -- invalid_price
--   SELECT consume_token('<eleve>', '<code>', 'daily_reroll', -5);  -- false
