-- Chest Redesign V2 — schema migration
-- Plan validé 2026-04-27, applied for "data foundation" step 1.
-- Apply via Supabase Dashboard → SQL Editor (or CLI).
--
-- This migration is forward-compatible : it does NOT alter player_rewards or
-- chest_log columns (their reward_type/reward_id are TEXT, accept new values
-- like "frame" / "title" / "cheat_sheet" without schema change).
--
-- It only adds the new player_tokens table for stackable tactical tokens.

-- ═══ player_tokens — stackables (1 row per user × token_type) ═══
CREATE TABLE IF NOT EXISTS public.player_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_name   TEXT NOT NULL,
  class_code  TEXT NOT NULL,
  token_type  TEXT NOT NULL,
  quantity    INT  NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT player_tokens_unique UNIQUE (user_name, class_code, token_type)
);

CREATE INDEX IF NOT EXISTS player_tokens_user_idx
  ON public.player_tokens (user_name, class_code);

-- RLS : disabled for now (consistent with player_rewards / push_subscriptions /
-- weekly_snapshots which also have RLS off — see CLAUDE.md "Hardened Rules").
ALTER TABLE public.player_tokens DISABLE ROW LEVEL SECURITY;

-- ═══ Helper : UPSERT a token grant with cap enforcement ═══
-- Usage from app code :
--   SELECT public.grant_token('Alice','idrac2026','streak_shield',1,3);
-- Increments quantity by `amount`, capped at `cap`. Returns the new quantity.
CREATE OR REPLACE FUNCTION public.grant_token(
  p_user_name  TEXT,
  p_class_code TEXT,
  p_token_type TEXT,
  p_amount     INT,
  p_cap        INT
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_qty INT;
BEGIN
  INSERT INTO public.player_tokens (user_name, class_code, token_type, quantity)
  VALUES (p_user_name, p_class_code, p_token_type, LEAST(p_amount, p_cap))
  ON CONFLICT (user_name, class_code, token_type)
  DO UPDATE SET
    quantity   = LEAST(public.player_tokens.quantity + p_amount, p_cap),
    updated_at = now()
  RETURNING quantity INTO v_new_qty;
  RETURN v_new_qty;
END;
$$;

-- ═══ Helper : CONSUME a token (decrement, fail if insufficient) ═══
-- Usage : SELECT public.consume_token('Alice','idrac2026','mock_reset',1);
-- Returns TRUE if consumed, FALSE if not enough quantity.
CREATE OR REPLACE FUNCTION public.consume_token(
  p_user_name  TEXT,
  p_class_code TEXT,
  p_token_type TEXT,
  p_amount     INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_qty INT;
BEGIN
  SELECT quantity INTO v_qty
  FROM public.player_tokens
  WHERE user_name = p_user_name
    AND class_code = p_class_code
    AND token_type = p_token_type
  FOR UPDATE;

  IF v_qty IS NULL OR v_qty < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.player_tokens
  SET quantity = quantity - p_amount,
      updated_at = now()
  WHERE user_name = p_user_name
    AND class_code = p_class_code
    AND token_type = p_token_type;

  RETURN TRUE;
END;
$$;

-- ═══ Step 4 — students profile : equipped frame & title ═══
-- Mirrors the existing skin_id pattern. New cosmetic types from V2 chests
-- (frames, titles) need a single active selection per student.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS frame_id TEXT,
  ADD COLUMN IF NOT EXISTS title_id TEXT;

-- ═══ chest_log.reward_type — relax CHECK to allow V2 values ═══
-- The V1 constraint only allowed ('xp','avatar','skin'). V2 step 3 uses 'multi'
-- as the chest_log reward_type (per-item history lives in player_rewards / player_tokens).
-- Without this update, every V2 chest open fails silently on the chest_log INSERT
-- and breaks the audit trail.
ALTER TABLE public.chest_log
  DROP CONSTRAINT IF EXISTS chest_log_reward_type_check;
ALTER TABLE public.chest_log
  ADD  CONSTRAINT chest_log_reward_type_check
  CHECK (reward_type IN ('xp', 'avatar', 'skin', 'frame', 'title', 'cheat_sheet', 'token', 'multi'));

-- ═══ Notes (no SQL action required) ═══
-- 1. player_rewards.reward_type already accepts new values ("frame","title","cheat_sheet")
--    without schema change — column is TEXT non-constrained.
-- 2. chest_log.reward_type idem.
-- 3. When step 3 (ChestOpenModal sequential render) lands, openChestFromPending
--    will need to call grant_token() instead of insert into player_rewards
--    for token-typed rewards.
