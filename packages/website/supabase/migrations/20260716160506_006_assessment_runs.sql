-- Optional assessment tables. No current route writes to these tables; they
-- reserve a row-level-security-safe shape for future server-scored quizzes.
--
-- These tables are intentionally empty at launch. If server-scored quizzes never
-- ship, run: DROP TABLE assessment_answers, assessment_runs; in a maintenance migration.

-- assessment_runs: one row per quiz/assessment attempt
CREATE TABLE IF NOT EXISTS assessment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('workshop_quiz', 'fluency_test')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,
  total_questions INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  schema_version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE assessment_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON assessment_runs FROM public, anon, authenticated;
GRANT SELECT, INSERT ON assessment_runs TO authenticated;  -- no UPDATE, no DELETE

CREATE POLICY "Users can read own assessment_runs"
  ON assessment_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment_runs"
  ON assessment_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- assessment_answers: per-question evidence for scored attempts
CREATE TABLE IF NOT EXISTS assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES assessment_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON assessment_answers FROM public, anon, authenticated;
GRANT SELECT, INSERT ON assessment_answers TO authenticated;  -- append-only

CREATE POLICY "Users can read own assessment_answers"
  ON assessment_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment_answers"
  ON assessment_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id AND run_id IN (
    SELECT id FROM assessment_runs WHERE user_id = auth.uid()
  ));
