-- Personal access tokens expire, and stop working for a suspended account.
--
-- Until now a personal access token (lat_...) stayed valid until its owner
-- revoked it or deleted the account. A leaked token kept reading the learner's
-- progress indefinitely, and neither a ban nor a soft delete of the account
-- stopped it: the bearer resolver only ever asked whether revoked_at was set.
--
-- 1. expires_at. Every token carries an expiry chosen at mint time (30, 90 or
--    365 days, 90 by default). The CHECK keeps it strictly after creation, so
--    no already-dead token can be stored, and at most 366 days after it, so no
--    code path can mint a token that outlives a year. The resolver
--    (src/lib/agent-access/personal-tokens.ts) refuses a row whose expiry has
--    passed, and the five-token ceiling counts only unrevoked, unexpired rows.
--
--    Existing rows get the default lifetime, but never less than 30 days from
--    now, so a learner who minted a token before this migration sees the date
--    on /konto/ki before it stops working. The CHECK's ceiling still applies.
--
--    The column default exists for the deploy window only: this migration is
--    applied before the code that sets expires_at explicitly, and the mint
--    route that is live until then must keep working. It is the default
--    lifetime, so it can never produce a value the CHECK would refuse.
--
-- 2. public.agent_access_token_owner_active(uuid). The resolver calls it after
--    it has recognised an unrevoked, unexpired token. It is true only while
--    the owner exists, is not banned and is not soft-deleted: the same account
--    conditions public.agent_oauth_session_live applies to OAuth access
--    tokens. SECURITY DEFINER because auth.users is not readable by API roles,
--    and therefore executable by the service role only. It returns one boolean
--    and never a user attribute. STABLE, search_path pinned empty, every
--    relation schema-qualified.
--
-- Deploy order: apply this migration before the code that reads expires_at
-- and calls the function. The reverse order fails closed (every personal token
-- is refused as unverifiable and minting fails) rather than open.

alter table public.agent_access_tokens
  add column if not exists expires_at timestamptz;

update public.agent_access_tokens
set expires_at = least(
  created_at + interval '365 days',
  greatest(
    created_at + interval '90 days',
    pg_catalog.now() + interval '30 days'
  )
)
where expires_at is null;

alter table public.agent_access_tokens
  alter column expires_at set default (pg_catalog.now() + interval '90 days');
alter table public.agent_access_tokens
  alter column expires_at set not null;

alter table public.agent_access_tokens
  drop constraint if exists agent_access_tokens_expires_at_check;
alter table public.agent_access_tokens
  add constraint agent_access_tokens_expires_at_check
  check (
    expires_at > created_at
    and expires_at <= created_at + interval '366 days'
  );

-- The owner sees when each token stops working. Column grants are additive:
-- this extends the existing list and leaves token_hash outside it.
grant select (expires_at) on table public.agent_access_tokens to authenticated;

comment on column public.agent_access_tokens.expires_at is
  'When the token stops working. Chosen at mint time (30, 90 or 365 days); at most 366 days after created_at. The bearer resolver refuses a token past this instant.';

create or replace function public.agent_access_token_owner_active(
  p_user_id uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as u
    where u.id = p_user_id
      and (u.banned_until is null or u.banned_until <= pg_catalog.now())
      and u.deleted_at is null
  );
$$;

revoke all on function public.agent_access_token_owner_active(uuid)
  from public, anon, authenticated;
grant execute on function public.agent_access_token_owner_active(uuid)
  to service_role;

comment on function public.agent_access_token_owner_active(uuid) is
  'True only while the owner of a personal access token exists and is neither banned nor soft-deleted. Service role only; returns a boolean and nothing else.';
