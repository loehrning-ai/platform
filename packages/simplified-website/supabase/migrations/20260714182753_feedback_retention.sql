-- Fixed retention boundary for free-text feedback. This SECURITY INVOKER
-- function is callable only by the server-side service role. Production
-- activation additionally requires a daily Supabase Cron job which calls it;
-- the API calls it before every accepted insert as a fail-closed schema check
-- and opportunistic cleanup path.

create or replace function public.prune_beta_feedback()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count bigint;
begin
  delete from public.beta_feedback
  where created_at < now() - interval '180 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke execute on function public.prune_beta_feedback() from public, anon, authenticated;
grant execute on function public.prune_beta_feedback() to service_role;

comment on function public.prune_beta_feedback() is
  'Deletes beta_feedback rows older than the fixed 180-day maximum retention period.';
