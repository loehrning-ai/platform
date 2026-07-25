-- Close direct Data API mutation paths that bypass the application's
-- validation and durable rate limits. The website authenticates callers with
-- a cookie-bound client, then performs progress mutations with the server-only
-- service role while binding auth.users.id on the server.

-- Bound each user to the ten canonical course rows plus the reserved metadata
-- row. This turns the existing 64 KiB per-row limit into a finite per-user
-- storage ceiling even if a future grant is accidentally broadened.
alter table public.user_course_progress
  drop constraint if exists user_course_progress_course_slug_check;

alter table public.user_course_progress
  add constraint user_course_progress_course_slug_check
  check (
    course_slug in (
      '_meta',
      'ai-native',
      'ai-native-operator',
      'claude',
      'codex',
      'data-engineering-fundamentals',
      'data-infrastructure',
      'data-science',
      'eu-ai-act-kurs',
      'ki-fuehrerschein',
      'ki-und-gesellschaft'
    )
  )
  not valid;

alter table public.user_course_progress
  validate constraint user_course_progress_course_slug_check;

revoke all on table public.user_course_progress from public, anon;
revoke insert, update, delete on table public.user_course_progress
  from authenticated;
grant select on table public.user_course_progress to authenticated;

-- These optional tables have no application writer. Leaving INSERT exposed to
-- every authenticated account creates an unmetered append-only storage and
-- forged-assessment path. Keep the schema reserved but deny Data API access
-- until a validated server-side feature exists.
revoke all on table public.assessment_answers
  from public, anon, authenticated;
revoke all on table public.assessment_runs
  from public, anon, authenticated;

-- Shared-project worker/admin objects are not part of a clean website
-- bootstrap. Harden them only when they exist so this public migration history
-- remains replayable in a fresh Supabase project.
do $hardening$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable()
      from public, anon, authenticated';
  end if;

  if to_regprocedure(
    'public.daily_usage_consume(text,numeric,integer,numeric)'
  ) is not null then
    execute 'revoke execute on function public.daily_usage_consume(
      text, numeric, integer, numeric
    ) from public, anon, authenticated';
    execute 'grant execute on function public.daily_usage_consume(
      text, numeric, integer, numeric
    ) to service_role';
    execute 'alter function public.daily_usage_consume(
      text, numeric, integer, numeric
    ) set search_path = ''''';
  end if;

  if to_regprocedure(
    'public.deep_analysis_bump_attempts(uuid)'
  ) is not null then
    execute 'revoke execute on function public.deep_analysis_bump_attempts(uuid)
      from public, anon, authenticated';
    execute 'grant execute on function public.deep_analysis_bump_attempts(uuid)
      to service_role';
    execute 'alter function public.deep_analysis_bump_attempts(uuid)
      set search_path = ''''';
  end if;

  if to_regprocedure(
    'public.deep_analysis_claim_jobs(integer)'
  ) is not null then
    execute 'revoke execute on function public.deep_analysis_claim_jobs(integer)
      from public, anon, authenticated';
    execute 'grant execute on function public.deep_analysis_claim_jobs(integer)
      to service_role';
    execute 'alter function public.deep_analysis_claim_jobs(integer)
      set search_path = ''''';
  end if;

  -- The deployed retention body referenced rate_limits.updated_at, but the
  -- active limiter stores expiry in expires_at. That runtime error rolled back
  -- every personal-data deletion in the function.
  if to_regprocedure('public.journey_gdpr_cleanup()') is not null
    and to_regclass('public.deep_analysis_jobs') is not null
    and to_regclass('public.journey_leads') is not null
    and to_regclass('public.journey_consultations') is not null
    and to_regclass('public.rate_limits') is not null then
    execute $ddl$
      create or replace function public.journey_gdpr_cleanup()
      returns table(table_name text, deleted bigint)
      language plpgsql
      set search_path = ''
      as $body$
      declare
        n_jobs bigint;
        n_consultations bigint;
        n_leads bigint;
        n_rate bigint;
      begin
        with deleted_rows as (
          delete from public.deep_analysis_jobs
          where (
            status in ('done', 'failed')
            and completed_at < now() - interval '90 days'
          )
            or enqueued_at < now() - interval '365 days'
          returning 1
        )
        select count(*) into n_jobs from deleted_rows;

        -- Consultations contain free-text and JSON content. The FK uses
        -- ON DELETE SET NULL, so delete consultations before their retained
        -- lead is removed, and expire already orphaned rows conservatively.
        with deleted_rows as (
          delete from public.journey_consultations as consultation
          where (
            consultation.lead_id is null
            and consultation.created_at < now() - interval '90 days'
          )
            or exists (
              select 1
              from public.journey_leads as lead
              where lead.id = consultation.lead_id
                and (
                  (
                    lead.unsubscribed_at is not null
                    and lead.unsubscribed_at < now() - interval '30 days'
                  )
                  or (
                    lead.marketing_consent_at is null
                    and lead.created_at < now() - interval '90 days'
                  )
                  or (
                    lead.marketing_consent_at is not null
                    and lead.created_at < now() - interval '730 days'
                  )
                )
            )
          returning 1
        )
        select count(*) into n_consultations from deleted_rows;

        with deleted_rows as (
          delete from public.journey_leads
          where (
            unsubscribed_at is not null
            and unsubscribed_at < now() - interval '30 days'
          )
            or (
              marketing_consent_at is null
              and created_at < now() - interval '90 days'
            )
            or (
              marketing_consent_at is not null
              and created_at < now() - interval '730 days'
            )
          returning 1
        )
        select count(*) into n_leads from deleted_rows;

        with deleted_rows as (
          delete from public.rate_limits
          where expires_at < now() - interval '7 days'
          returning 1
        )
        select count(*) into n_rate from deleted_rows;

        return query values
          ('deep_analysis_jobs', n_jobs),
          ('journey_consultations', n_consultations),
          ('journey_leads', n_leads),
          ('rate_limits', n_rate);
      end;
      $body$
    $ddl$;
  end if;

  if to_regprocedure('public.journey_gdpr_cleanup()') is not null then
    execute 'revoke execute on function public.journey_gdpr_cleanup()
      from public, anon, authenticated';
    execute 'grant execute on function public.journey_gdpr_cleanup()
      to service_role';
    execute 'alter function public.journey_gdpr_cleanup()
      set search_path = ''''';
  end if;

  if to_regclass('public.daily_usage') is not null then
    execute 'revoke all on table public.daily_usage
      from anon, authenticated';
  end if;
  if to_regclass('public.deep_analysis_jobs') is not null then
    execute 'revoke all on table public.deep_analysis_jobs
      from anon, authenticated';
  end if;
  if to_regclass('public.journey_leads') is not null then
    execute 'revoke all on table public.journey_leads
      from anon, authenticated';
  end if;
  if to_regclass('public.journey_consultations') is not null then
    execute 'revoke all on table public.journey_consultations
      from anon, authenticated';
  end if;
end
$hardening$;

alter function public.rate_limit_consume(text, integer, integer)
  set search_path = '';

-- This renamed legacy limiter has no dependencies or live code references.
-- Its only remaining rows are stale raw-IP-like identifiers from April 2026.
-- Remove the obsolete personal data instead of preserving it indefinitely.
drop table if exists public.zz_legacy_rate_limits_businesssite;

-- Retention controls are ineffective without a caller. Supabase Cron runs the
-- repaired cleanup once per day at 03:17 UTC and records each execution in the
-- database for operational inspection. Reusing the job name makes replay
-- update the existing schedule instead of creating duplicates.
create extension if not exists pg_cron;

do $schedule$
begin
  if to_regprocedure('public.journey_gdpr_cleanup()') is not null then
    perform cron.schedule(
      'journey-gdpr-cleanup-daily',
      '17 3 * * *',
      'select * from public.journey_gdpr_cleanup()'
    );
  end if;
end
$schedule$;

-- Prevent future public-schema objects from silently inheriting browser API
-- access or PUBLIC function execution. Migrations must grant each intended API
-- object explicitly. Keep the service role's defaults intact for backend
-- operations. Supabase runs project migrations as postgres, which is not a
-- member of the managed supabase_admin role; that role's defaults cannot be
-- changed safely from a project migration.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
