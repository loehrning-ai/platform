-- Keep OAuth client access tokens out of the account tables.
--
-- When the Supabase OAuth 2.1 server is enabled, the access token it issues
-- to a third-party client the learner approved is an ordinary project JWT:
-- role `authenticated`, the learner's `sub`, plus the approved client's
-- `client_id`. The Data API accepts it like a first-party session, so the
-- owner-read policies below would hand such a client the learner's personal
-- access token list, the agent audit trail, and the stored provider key
-- metadata. None of that is part of what the consent screen grants: an
-- approved client may read learning progress through the agent interface,
-- and nothing else.
--
-- The application already refuses these tokens on every cookie-authenticated
-- account route (src/lib/supabase/first-party-session.ts). These restrictive
-- policies are the same boundary one layer down, so a direct Data API read
-- with an OAuth client token finds no rows here either. A restrictive policy
-- is ANDed with the existing permissive owner policy; a first-party session
-- carries no client_id and is unaffected. The service role is not bound by
-- policies granted to `authenticated`.
--
-- Scope, decided explicitly: only the three account tables below.
-- public.user_course_progress stays readable to the owner's OAuth client on
-- purpose, because reading learning progress is exactly what the learner
-- approved, and the agent interface serves the same data. The browser role
-- holds SELECT only on all four tables, so no write policy is needed.

drop policy if exists "No OAuth client tokens"
  on public.agent_access_tokens;
create policy "No OAuth client tokens"
  on public.agent_access_tokens
  as restrictive
  for select
  to authenticated
  using ((select auth.jwt() ->> 'client_id') is null);

drop policy if exists "No OAuth client tokens"
  on public.agent_access_events;
create policy "No OAuth client tokens"
  on public.agent_access_events
  as restrictive
  for select
  to authenticated
  using ((select auth.jwt() ->> 'client_id') is null);

drop policy if exists "No OAuth client tokens"
  on public.account_llm_keys;
create policy "No OAuth client tokens"
  on public.account_llm_keys
  as restrictive
  for select
  to authenticated
  using ((select auth.jwt() ->> 'client_id') is null);
