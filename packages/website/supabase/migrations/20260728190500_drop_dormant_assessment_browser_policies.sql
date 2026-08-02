-- The browser roles have no assessment table grants. Drop the old policies in
-- already-migrated projects as well, so a future broad GRANT cannot silently
-- reactivate browser-authored assessment records.

drop policy if exists "Users can read own assessment_runs"
  on public.assessment_runs;
drop policy if exists "Users can insert own assessment_runs"
  on public.assessment_runs;
drop policy if exists "Users can read own assessment_answers"
  on public.assessment_answers;
drop policy if exists "Users can insert own assessment_answers"
  on public.assessment_answers;
