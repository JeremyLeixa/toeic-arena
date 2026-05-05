-- ═══════════════════════════════════════════════════════════════════════
-- 2026-05-05 — Personalization Phase 1 — Goal-setting fields
-- Adds target TOEIC score + target date to students.
-- Both nullable: a goal is opt-in (set via Profile → "Mon objectif TOEIC").
-- Used by Home progress bar + ETA computation (commit 3) and as the meta-quest
-- reference for Today's Focus + NextStepReco (commit 4).
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS target_toeic int CHECK (target_toeic IS NULL OR (target_toeic >= 200 AND target_toeic <= 990)),
  ADD COLUMN IF NOT EXISTS target_date date;

COMMENT ON COLUMN students.target_toeic IS 'User-defined TOEIC score goal (200-990). NULL = no goal set.';
COMMENT ON COLUMN students.target_date  IS 'User-defined target date to reach target_toeic. NULL = no goal set.';
