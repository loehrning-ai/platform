create table if not exists public.user_course_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_course_progress enable row level security;

drop policy if exists "Users can read their own course progress" on public.user_course_progress;
create policy "Users can read their own course progress"
  on public.user_course_progress
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own course progress" on public.user_course_progress;
create policy "Users can insert their own course progress"
  on public.user_course_progress
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own course progress" on public.user_course_progress;
create policy "Users can update their own course progress"
  on public.user_course_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_course_progress_updated_at_idx
  on public.user_course_progress (updated_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_course_progress_schema_version_check'
  ) then
    alter table public.user_course_progress
      add constraint user_course_progress_schema_version_check
      check (
        jsonb_typeof(progress) = 'object'
        and progress @> '{"schemaVersion": 2}'::jsonb
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_course_progress_size_check'
  ) then
    alter table public.user_course_progress
      add constraint user_course_progress_size_check
      check (pg_column_size(progress) <= 262144);
  end if;
end $$;

revoke all on table public.user_course_progress from public, anon, authenticated;
grant select, insert, update on table public.user_course_progress to authenticated;
