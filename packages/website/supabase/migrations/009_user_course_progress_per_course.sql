-- Restructures user_course_progress from one shared JSONB blob per user
-- (PRIMARY KEY (user_id)) to one row per (user_id, course_slug). No
-- production Supabase project exists yet, so this is a clean table
-- restructure rather than a zero-downtime data migration: there is no
-- live data to carry forward.
--
-- Two row shapes share this table, distinguished by course_slug:
--   * a real CourseSlug        -> progress holds that course's UnifiedCourseSlice
--   * the reserved "_meta" row -> progress holds the cross-course ledger
--     (xp, checkpoints, badges, streak, lastActivity). "_meta" can never
--     collide with a real course slug: every CourseSlug is a bare kebab-case
--     identifier with no leading underscore.
drop table if exists public.user_course_progress;

create table public.user_course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null,
  progress jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_slug)
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

drop policy if exists "Users can delete their own course progress" on public.user_course_progress;
create policy "Users can delete their own course progress"
  on public.user_course_progress
  for delete
  using (auth.uid() = user_id);

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
        and progress @> '{"schemaVersion": 3}'::jsonb
      );
  end if;

  -- 65536 bytes per course row (was 262144 shared across every course in one
  -- blob): generous relative to any single course plan's own worst-case
  -- estimate, while bounding per-course abuse. Replaces the old
  -- "10 courses fighting over one 256KB ceiling" risk class with an
  -- independent budget per course.
  if not exists (
    select 1 from pg_constraint where conname = 'user_course_progress_size_check'
  ) then
    alter table public.user_course_progress
      add constraint user_course_progress_size_check
      check (pg_column_size(progress) <= 65536);
  end if;
end $$;

revoke all on table public.user_course_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.user_course_progress to authenticated;
