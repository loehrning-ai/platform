-- Beta feedback table.
-- Only the server-side service role can INSERT or read rows. Browser clients
-- must use /api/feedback so validation and rate limiting cannot be bypassed.
-- Name, email, and IP are not requested as structured fields. The free-text
-- message can nevertheless contain personal or confidential data entered by a
-- submitter and must therefore be handled as potentially personal data.
-- Rate limiting is enforced at the API route level (5 per IP per 24h).

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT        NOT NULL CHECK (category IN ('inhalt', 'technik', 'lernweg', 'sonstiges')),
  message     TEXT        NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  context_url TEXT        CHECK (char_length(context_url) <= 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No user_id column: submissions are not linked to a platform account, but the
-- free-text field means the table must not be described as fully anonymous.
-- created_at index for dashboard queries ordered by time.
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at
  ON public.beta_feedback (created_at DESC);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Revoke all browser-facing access. The service role is server-only.
REVOKE ALL ON TABLE public.beta_feedback FROM public, anon, authenticated;
GRANT ALL   ON TABLE public.beta_feedback TO service_role;
