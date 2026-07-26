-- Preserve the existing authorization contract while making RLS evaluation
-- constant per statement and adding indexes for every active foreign key.

drop policy if exists "Service role full access"
  on public.journey_leads;
create policy "Service role full access"
  on public.journey_leads
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role full access"
  on public.journey_consultations;
create policy "Service role full access"
  on public.journey_consultations
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role full access"
  on public.rate_limits;
create policy "Service role full access"
  on public.rate_limits
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Users can read own assessment_runs"
  on public.assessment_runs;
create policy "Users can read own assessment_runs"
  on public.assessment_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own assessment_runs"
  on public.assessment_runs;
create policy "Users can insert own assessment_runs"
  on public.assessment_runs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own assessment_answers"
  on public.assessment_answers;
create policy "Users can read own assessment_answers"
  on public.assessment_answers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own assessment_answers"
  on public.assessment_answers;
create policy "Users can insert own assessment_answers"
  on public.assessment_answers
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and run_id in (
      select run.id
      from public.assessment_runs as run
      where run.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read their own course progress"
  on public.user_course_progress;
create policy "Users can read their own course progress"
  on public.user_course_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit service-role policies document the backend-only contract and keep
-- the Supabase advisor from treating intentional deny-by-default tables as
-- accidentally policy-free. Browser roles retain no table grants.
drop policy if exists "Service role full access"
  on public.beta_feedback;
create policy "Service role full access"
  on public.beta_feedback
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role full access"
  on public.daily_usage;
create policy "Service role full access"
  on public.daily_usage
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role full access"
  on public.deep_analysis_jobs;
create policy "Service role full access"
  on public.deep_analysis_jobs
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists assessment_answers_run_id_idx
  on public.assessment_answers (run_id);
create index if not exists assessment_answers_user_id_idx
  on public.assessment_answers (user_id);
create index if not exists assessment_runs_user_id_idx
  on public.assessment_runs (user_id);
