-- ════════════════════════════════════════════════════════════════════════
-- Arena Shop P2a — spend Darics (2026-06-01)
-- ════════════════════════════════════════════════════════════════════════
-- Mirrors the grant_marks / grant_token / consume_token server-authoritative
-- pattern. The Daric wallet (students.arena_marks) is NEVER mutated by the
-- client save() payload — only by these RPCs. spend_marks is a single atomic
-- transaction so a purchase can never half-apply (Darics taken without item,
-- or item granted without payment).
-- ════════════════════════════════════════════════════════════════════════

-- Audit trail + purchase history (also future "Historique" tab source).
-- One-shot anti-rebuy for cosmetics is enforced via player_rewards existence
-- (the real ownership record), NOT this table — this is the spend ledger.
CREATE TABLE IF NOT EXISTS shop_purchases (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT,
  class_code TEXT,
  item_id TEXT,
  category TEXT,
  ref_id TEXT,
  price_paid INT,
  purchased_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_purchases_user_idx ON shop_purchases(user_name, class_code);

-- spend_marks — atomic purchase.
--   1. read balance
--   2. one-shot: refuse if already owned (player_rewards) ; token: refuse if at cap
--   3. refuse if balance < price
--   4. decrement, grant by category, log to shop_purchases + marks_log
-- Returns jsonb {ok, balance?, error?} so the client can distinguish failure modes.
CREATE OR REPLACE FUNCTION spend_marks(
  p_user_name TEXT, p_class_code TEXT, p_item_id TEXT,
  p_category TEXT, p_ref_id TEXT, p_price INT,
  p_rarity TEXT, p_cap INT, p_one_shot BOOLEAN
) RETURNS jsonb AS $$
DECLARE bal INT; owned INT; qty INT;
BEGIN
  SELECT arena_marks INTO bal FROM students
    WHERE name = p_user_name AND class_code = p_class_code LIMIT 1;
  IF bal IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_student');
  END IF;

  IF p_one_shot THEN
    -- Cosmetics / cheat sheets : ownership lives in player_rewards.
    SELECT count(*) INTO owned FROM player_rewards
      WHERE user_name = p_user_name AND class_code = p_class_code
        AND reward_type = p_category AND reward_id = p_ref_id;
    IF owned > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
    END IF;
  ELSE
    -- Tokens (repeatable) : refuse at cap, else we'd take Darics for nothing.
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

  -- Atomic decrement
  UPDATE students SET arena_marks = arena_marks - p_price
    WHERE name = p_user_name AND class_code = p_class_code
    RETURNING arena_marks INTO bal;

  -- Grant by category
  IF p_category = 'token' THEN
    PERFORM grant_token(p_user_name, p_class_code, p_ref_id, 1, p_cap);
  ELSE
    -- avatar / skin / frame / title / cheat_sheet → player_rewards
    INSERT INTO player_rewards(user_name, class_code, reward_type, reward_id, rarity)
      VALUES (p_user_name, p_class_code, p_category, p_ref_id, p_rarity);
  END IF;

  -- Ledger
  INSERT INTO shop_purchases(user_name, class_code, item_id, category, ref_id, price_paid)
    VALUES (p_user_name, p_class_code, p_item_id, p_category, p_ref_id, p_price);
  INSERT INTO marks_log(user_name, class_code, delta, source, source_detail)
    VALUES (p_user_name, p_class_code, -p_price, 'shop', p_item_id);

  RETURN jsonb_build_object('ok', true, 'balance', bal);
END;
$$ LANGUAGE plpgsql;
