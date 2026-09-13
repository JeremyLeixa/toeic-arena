-- ════════════════════════════════════════════════════════════════════════
-- P2 Phase B — durcissement des RPC économie (finding H5)
-- (2026-09-13, voir SECURITY_PENTEST_2026-09-11.md + plan jaunty-munching-frost)
-- ════════════════════════════════════════════════════════════════════════
-- CONTEXTE. grant_marks / grant_token / consume_token / spend_marks recevaient
-- p_user_name + p_class_code FOURNIS PAR LE CLIENT et étaient SECURITY INVOKER.
-- Avec RLS off + grants anon, un élève pouvait les appeler avec le nom d'UN AUTRE
-- (drainer ses Darics, consommer ses tokens) — vecteur CROSS-USER.
--
-- CE QUE CETTE MIGRATION FERME : le cross-user. On dérive le propriétaire de la
-- ligne (students.user_id) et on exige auth.uid() = user_id, en SECURITY DEFINER.
-- Grâce migration soft : si la ligne n'est pas encore migrée (user_id NULL, legacy
-- pas encore claim), on laisse passer — sinon on casserait l'accrual de Darics des
-- comptes non-claim. Au fil de la migration (Phase A), la protection s'étend.
--
-- CE QUE ÇA NE FERME PAS : le SELF-MINT (se donner un delta énorme À SOI-MÊME).
-- p_delta est calculé côté client par design (XP→Darics), donc le check d'identité
-- (qui vérifie QUI on est, pas si le delta est mérité) ne l'empêche pas. Pas de
-- plafond dur ici : les deltas légitimes varient (chest inclus) et un cap mal réglé
-- perdrait des Darics gagnés en silence. Le self-mint relève de la DÉTECTION
-- (marks_log trace chaque octroi) ou d'une économie server-side (chantier séparé).
--
-- NB search_path figé (bonne pratique SECURITY DEFINER). Logique métier existante
-- reproduite À L'IDENTIQUE, on n'ajoute QUE le garde de propriété.
-- ════════════════════════════════════════════════════════════════════════

-- ── grant_marks ──
CREATE OR REPLACE FUNCTION public.grant_marks(
  p_user_name text, p_class_code text, p_delta integer,
  p_source text, p_source_detail text, p_unique boolean DEFAULT false
) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  -- Garde de propriété (grâce si legacy non migré : user_id NULL)
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  IF p_unique AND EXISTS(
    SELECT 1 FROM marks_log
    WHERE user_name=p_user_name AND class_code=p_class_code AND source_detail=p_source_detail
  ) THEN
    RETURN 0; -- déjà accordé, no-op silencieux côté client
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
DECLARE v_new_qty INT; v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  INSERT INTO public.player_tokens (user_name, class_code, token_type, quantity)
  VALUES (p_user_name, p_class_code, p_token_type, LEAST(p_amount, p_cap))
  ON CONFLICT (user_name, class_code, token_type)
  DO UPDATE SET
    quantity   = LEAST(public.player_tokens.quantity + p_amount, p_cap),
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

-- ── spend_marks (déf d'origine 2026-06-01_shop_p2.sql + garde de propriété) ──
CREATE OR REPLACE FUNCTION public.spend_marks(
  p_user_name TEXT, p_class_code TEXT, p_item_id TEXT,
  p_category TEXT, p_ref_id TEXT, p_price INT,
  p_rarity TEXT, p_cap INT, p_one_shot BOOLEAN
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE bal INT; owned INT; qty INT; v_owner uuid;
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
    IF COALESCE(qty, 0) >= p_cap THEN
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
    PERFORM grant_token(p_user_name, p_class_code, p_ref_id, 1, p_cap);
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

-- ⚠️ NB : spend_marks appelle grant_token en interne. Comme spend_marks est
-- SECURITY DEFINER et a déjà validé la propriété, l'appel imbriqué à grant_token
-- (aussi DEFINER, re-checké) reste cohérent (auth.uid() inchangé dans la transaction).
