-- Personal access tokens for agent clients (Claude Desktop, Claude Code,
-- Codex) that cannot complete an OAuth authorization code flow.
--
-- The clear token is generated in the API route, shown to the account owner
-- exactly once, and never stored, logged, or exported. This table keeps only
-- what a later request needs in order to recognise a presented token:
--
--   prefix      the leading, non-secret display fragment ("lat_" plus a short
--               readable head) so the owner can tell two tokens apart in the
--               account UI without ever seeing the secret again;
--   token_hash  the SHA-256 digest of the complete clear token, lowercase hex.
--
-- The digest column is deliberately constrained to exactly 64 lowercase
-- hexadecimal characters. A clear token, a JWT, a base64 blob, or an empty
-- string cannot satisfy that shape, so an implementation mistake in the mint
-- route fails loudly at the INSERT instead of silently persisting a usable
-- credential.
--
-- Browser roles never write here. Minting, revoking, and the last_used_at
-- touch all run through the service role after the cookie-bound session has
-- been verified, exactly like public.user_course_progress.

create table if not exists public.agent_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null
    constraint agent_access_tokens_name_check
    check (char_length(name) between 1 and 64),
  prefix text not null
    constraint agent_access_tokens_prefix_check
    check (prefix ~ '^lat_[A-Za-z0-9_-]{4,32}$'),
  token_hash text not null
    constraint agent_access_tokens_token_hash_check
    check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  constraint agent_access_tokens_token_hash_key unique (token_hash)
);

-- Bearer resolution looks a presented token up by its digest; the account page
-- lists an owner's tokens newest first. The unique constraint above already
-- provides the digest index.
create index if not exists agent_access_tokens_user_id_created_at_idx
  on public.agent_access_tokens (user_id, created_at desc);

alter table public.agent_access_tokens enable row level security;

drop policy if exists "Users can read their own agent access tokens"
  on public.agent_access_tokens;
create policy "Users can read their own agent access tokens"
  on public.agent_access_tokens
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Mutations are intentionally server-only: mint, revoke, and the last_used_at
-- touch all carry rules (an active-token ceiling, ownership, a verified
-- session) that a direct PostgREST write would bypass.
drop policy if exists "Users can insert their own agent access tokens"
  on public.agent_access_tokens;
drop policy if exists "Users can update their own agent access tokens"
  on public.agent_access_tokens;
drop policy if exists "Users can delete their own agent access tokens"
  on public.agent_access_tokens;

drop policy if exists "Service role full access"
  on public.agent_access_tokens;
create policy "Service role full access"
  on public.agent_access_tokens
  for all
  to service_role
  using (true)
  with check (true);

-- Column-level grant on purpose. The owner may list their own tokens from the
-- browser, but token_hash stays out of every browser-reachable result set, so
-- a future policy mistake cannot hand a verifier value to a client. Readers
-- must therefore name their columns; "select *" is refused by design.
revoke all on table public.agent_access_tokens
  from public, anon, authenticated;
grant select (
  id,
  user_id,
  name,
  prefix,
  created_at,
  last_used_at,
  revoked_at
) on table public.agent_access_tokens to authenticated;
grant all on table public.agent_access_tokens to service_role;

comment on table public.agent_access_tokens is
  'Personal access tokens for agent clients. Stores only a display prefix and a SHA-256 digest; the clear token is shown once at mint time and never persisted.';
comment on column public.agent_access_tokens.token_hash is
  'Lowercase hex SHA-256 digest of the complete clear token. Never readable by browser roles.';
comment on column public.agent_access_tokens.revoked_at is
  'Set when the owner revokes the token. Rows are retained so the audit trail keeps a stable token name.';
