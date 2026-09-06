-- Audit trail for everything an agent does on a student's behalf.
--
-- One row per authenticated tool call, written by the MCP server, the personal
-- access token path, and the account chat. The row answers exactly one
-- question: "which client ran which tool against my account, when, and did it
-- work". That is what makes the account page an honest account of agent
-- activity without turning the platform into a transcript store.
--
-- Deliberately absent, and never to be added here: tool arguments, tool
-- results, prompts, model output, search queries, resource URIs, bearer
-- tokens, IP addresses, and user agents. The two text columns hold a client
-- label and a registered tool name, both bounded in length; the writer in
-- src/lib/agent-access/record.ts is the only producer and normalises both
-- before the INSERT.
--
-- Retention is 30 days, enforced by the function below and the daily job it
-- schedules. Rows disappear with the account through the ON DELETE CASCADE.

create table if not exists public.agent_access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client text not null
    constraint agent_access_events_client_check
    check (char_length(client) between 1 and 96),
  tool text not null
    constraint agent_access_events_tool_check
    check (char_length(tool) between 1 and 64),
  ok boolean not null,
  duration_ms integer not null
    constraint agent_access_events_duration_ms_check
    check (duration_ms between 0 and 600000),
  created_at timestamptz not null default now()
);

-- The account page reads one owner's most recent events; the retention job
-- scans by age across all owners.
create index if not exists agent_access_events_user_id_created_at_idx
  on public.agent_access_events (user_id, created_at desc);
create index if not exists agent_access_events_created_at_idx
  on public.agent_access_events (created_at);

alter table public.agent_access_events enable row level security;

drop policy if exists "Users can read their own agent access events"
  on public.agent_access_events;
create policy "Users can read their own agent access events"
  on public.agent_access_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- An audit trail the audited party can write is not an audit trail. Only the
-- service role appends, and only after a bearer or session has been resolved
-- to the user_id it binds the row to.
drop policy if exists "Users can insert their own agent access events"
  on public.agent_access_events;
drop policy if exists "Users can update their own agent access events"
  on public.agent_access_events;
drop policy if exists "Users can delete their own agent access events"
  on public.agent_access_events;

drop policy if exists "Service role full access"
  on public.agent_access_events;
create policy "Service role full access"
  on public.agent_access_events
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.agent_access_events
  from public, anon, authenticated;
grant select on table public.agent_access_events to authenticated;
grant all on table public.agent_access_events to service_role;

comment on table public.agent_access_events is
  'Audit trail of authenticated agent tool calls. Client label, tool name, outcome, and duration only. Never store arguments, results, prompts, queries, tokens, or addresses here.';

-- Fixed retention boundary, mirroring public.prune_beta_feedback(). SECURITY
-- INVOKER, so only the service role and the scheduled job owner can run it.
create or replace function public.prune_agent_access_events()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count bigint;
begin
  delete from public.agent_access_events
  where created_at < now() - interval '30 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke execute on function public.prune_agent_access_events()
  from public, anon, authenticated;
grant execute on function public.prune_agent_access_events() to service_role;

comment on function public.prune_agent_access_events() is
  'Deletes agent_access_events rows older than the fixed 30-day maximum retention period.';

-- Retention that depends on someone remembering to create a dashboard job is
-- not retention. The migration schedules it, under a stable job name so a
-- replay updates the existing entry instead of adding a duplicate. Do not
-- create a second job for this function by hand.
create extension if not exists pg_cron;

do $schedule$
begin
  if to_regprocedure('public.prune_agent_access_events()') is null then
    raise exception
      'Cannot schedule agent access retention: public.prune_agent_access_events() is missing';
  end if;

  perform cron.schedule(
    'agent-access-events-retention-daily',
    '41 3 * * *',
    'select public.prune_agent_access_events()'
  );
end
$schedule$;
