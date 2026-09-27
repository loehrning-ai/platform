-- Let the agent endpoint refuse an OAuth access token whose grant has ended.
--
-- A Supabase OAuth 2.1 access token is a self-contained JWT. Revoking the
-- grant (the learner's "Revoke" on /konto/ki), a global sign-out, a ban, or
-- deleting the account ends or removes the Auth session the token was issued
-- under, but the token itself stays cryptographically valid until its `exp`.
-- Signature verification alone therefore kept answering an agent the learner
-- had already cut off, for up to the token lifetime.
--
-- The MCP bearer resolver (src/lib/mcp/auth.ts, through
-- src/lib/agent-access/oauth-sessions.ts) calls this after the signature
-- check with the token's verified `session_id` and `sub`. `false` refuses the
-- token as revoked; an error refuses it as unverifiable. It never answers
-- `true` for a session of another user, an expired time-boxed session, a
-- banned user, or a soft-deleted user.
--
-- SECURITY DEFINER because auth.sessions is not readable by API roles, and
-- therefore callable by the service role only. It returns one boolean and
-- never a session row, identifier, or user attribute. STABLE, search_path
-- pinned empty, every relation schema-qualified.

create or replace function public.agent_oauth_session_live(
  p_session_id uuid,
  p_user_id uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions as s
    join auth.users as u on u.id = s.user_id
    where s.id = p_session_id
      and s.user_id = p_user_id
      and (s.not_after is null or s.not_after > pg_catalog.now())
      and (u.banned_until is null or u.banned_until <= pg_catalog.now())
      and u.deleted_at is null
  );
$$;

revoke all on function public.agent_oauth_session_live(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.agent_oauth_session_live(uuid, uuid)
  to service_role;

comment on function public.agent_oauth_session_live(uuid, uuid) is
  'True only while the Auth session behind a verified OAuth access token still exists for that user and is neither time-boxed out, banned, nor soft-deleted. Service role only; returns a boolean and nothing else.';
