-- Data-preserving transition from the original one-row-per-user progress blob
-- to one row per (user_id, course_slug).
--
-- This migration is deliberately idempotent. Production already received the
-- target schema through a manually applied change before its migration history
-- was reconciled. Replaying this file must never drop that live table.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

do $migration$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_course_progress'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_course_progress'
      and column_name = 'course_slug'
  ) then
    -- Preserve the complete v4 table as a private rollback source. SET SCHEMA
    -- moves its indexes and constraints with it, leaving the public names free
    -- for the replacement table.
    alter table public.user_course_progress
      rename to user_course_progress_v4_legacy;
    alter table public.user_course_progress_v4_legacy
      set schema private;
    revoke all on table private.user_course_progress_v4_legacy
      from public, anon, authenticated;
  end if;
end
$migration$;

create table if not exists public.user_course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null,
  progress jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_slug)
);

-- If an original v4 table was moved above, split its unified JSON document
-- into canonical per-course rows and a reserved metadata row. ON CONFLICT
-- makes a retry harmless. The private source remains intact for rollback.
do $migration$
begin
  if to_regclass('private.user_course_progress_v4_legacy') is not null then
    insert into public.user_course_progress (
      user_id,
      course_slug,
      progress,
      created_at,
      updated_at
    )
    select
      legacy.user_id,
      '_meta',
      jsonb_build_object(
        'schemaVersion', 3,
        'xp', coalesce(legacy.progress -> 'xp', '0'::jsonb),
        'checkpoints', coalesce(legacy.progress -> 'checkpoints', '{}'::jsonb),
        'badges', coalesce(legacy.progress -> 'badges', '{}'::jsonb),
        'streak', coalesce(
          legacy.progress -> 'streak',
          '{"days":0,"last":null}'::jsonb
        ),
        'lastActivity', coalesce(
          legacy.progress -> 'lastActivity',
          to_jsonb(legacy.updated_at::text)
        )
      ),
      legacy.created_at,
      legacy.updated_at
    from private.user_course_progress_v4_legacy as legacy
    on conflict (user_id, course_slug) do nothing;

    insert into public.user_course_progress (
      user_id,
      course_slug,
      progress,
      created_at,
      updated_at
    )
    select
      legacy.user_id,
      course.key,
      jsonb_build_object(
        'schemaVersion', 3,
        'slice', course.value
      ),
      legacy.created_at,
      legacy.updated_at
    from private.user_course_progress_v4_legacy as legacy
    cross join lateral jsonb_each(
      case
        when jsonb_typeof(legacy.progress -> 'courses') = 'object'
          then legacy.progress -> 'courses'
        else '{}'::jsonb
      end
    ) as course(key, value)
    on conflict (user_id, course_slug) do nothing;
  end if;
end
$migration$;

alter table public.user_course_progress enable row level security;

drop policy if exists "Users can read their own course progress"
  on public.user_course_progress;
create policy "Users can read their own course progress"
  on public.user_course_progress
  for select
  using (auth.uid() = user_id);

-- Mutations are intentionally server-only. The route verifies the cookie
-- session with getUser(), validates the complete payload, applies durable rate
-- limits, and binds user_id from the verified identity before using the
-- service role.
drop policy if exists "Users can insert their own course progress"
  on public.user_course_progress;
drop policy if exists "Users can update their own course progress"
  on public.user_course_progress;
drop policy if exists "Users can delete their own course progress"
  on public.user_course_progress;

create index if not exists user_course_progress_updated_at_idx
  on public.user_course_progress (updated_at desc);

alter table public.user_course_progress
  drop constraint if exists user_course_progress_schema_version_check;
alter table public.user_course_progress
  add constraint user_course_progress_schema_version_check
  check (
    jsonb_typeof(progress) = 'object'
    and progress @> '{"schemaVersion": 3}'::jsonb
  )
  not valid;
alter table public.user_course_progress
  validate constraint user_course_progress_schema_version_check;

alter table public.user_course_progress
  drop constraint if exists user_course_progress_size_check;
alter table public.user_course_progress
  add constraint user_course_progress_size_check
  check (pg_column_size(progress) <= 65536)
  not valid;
alter table public.user_course_progress
  validate constraint user_course_progress_size_check;

revoke all on table public.user_course_progress
  from public, anon, authenticated;
grant select on table public.user_course_progress to authenticated;
grant all on table public.user_course_progress to service_role;
