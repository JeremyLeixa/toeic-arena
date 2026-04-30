-- Feedback Reports — student bug/suggestion/question form
-- Form lives in Profile → "Send feedback". Submissions go through
-- /api/feedback-send (Vercel function) which inserts here AND emails
-- leixa.formation@gmail.com via Resend.
--
-- TeacherDash exposes a "Feedback" tab to read + mark resolved.
-- Resolving a report sends a push notification to the student via
-- the existing /api/push-send pipeline.
--
-- RLS : disabled (consistent with siblings push_subscriptions /
-- weekly_snapshots / chest_log — server-side writes via service role).
-- Apply via Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id              BIGSERIAL PRIMARY KEY,
  user_name       TEXT NOT NULL,
  class_code      TEXT NOT NULL,
  feedback_type   TEXT NOT NULL CHECK (feedback_type IN ('bug','suggestion','question')),
  module_id       TEXT NOT NULL,
  module_label    TEXT NOT NULL,
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_status_created
  ON public.feedback_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_class
  ON public.feedback_reports (class_code, created_at DESC);

ALTER TABLE public.feedback_reports DISABLE ROW LEVEL SECURITY;
