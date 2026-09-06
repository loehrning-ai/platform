-- Bring-your-own-key vault for the account chat.
--
-- One row per (account, provider). The row holds the student's own provider
-- key sealed with AES-256-GCM under the deployment key-encryption key
-- (ACCOUNT_LLM_KEK), never the key itself:
--
--   ciphertext  base64url of the GCM ciphertext with its 16-byte
--               authentication tag appended, produced by
--               src/lib/llm-keys/envelope.ts;
--   iv          base64url of the 12 random bytes used once for that seal;
--   hint        the last four characters of the clear key, the only clear
--               fragment that ever leaves the server.
--
-- The additional authenticated data of every seal binds the ciphertext to this
-- row's user_id and provider. Copying a ciphertext into another account's row,
-- or into the same account under a different provider, therefore fails the tag
-- check at decrypt time instead of yielding a usable key.
--
-- Reads are column-scoped on purpose. The owner may list their own stored
-- keys from the browser, but ciphertext and iv are outside every
-- browser-reachable result set, so a future policy mistake cannot hand sealed
-- key material to a client. Only the service role, after a cookie-bound
-- session has been verified in the API route, can read or write the sealed
-- columns. Rows disappear with the account through the ON DELETE CASCADE and
-- are never part of the data export.

create table if not exists public.account_llm_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null
    constraint account_llm_keys_provider_check
    check (provider in ('anthropic')),
  ciphertext text not null
    constraint account_llm_keys_ciphertext_check
    check (ciphertext ~ '^[A-Za-z0-9_-]{32,1024}$'),
  iv text not null
    constraint account_llm_keys_iv_check
    check (iv ~ '^[A-Za-z0-9_-]{16}$'),
  hint text not null
    constraint account_llm_keys_hint_check
    check (hint ~ '^[A-Za-z0-9_-]{4}$'),
  created_at timestamptz not null default now(),
  validated_at timestamptz not null default now(),
  constraint account_llm_keys_pkey primary key (user_id, provider)
);

alter table public.account_llm_keys enable row level security;

drop policy if exists "Users can read their own account llm keys"
  on public.account_llm_keys;
create policy "Users can read their own account llm keys"
  on public.account_llm_keys
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Mutations are server-only. Storing a key requires a successful provider
-- validation call and a seal under a key-encryption key the browser must never
-- hold, so a direct PostgREST write would bypass the only conditions that make
-- the stored value meaningful.
drop policy if exists "Users can insert their own account llm keys"
  on public.account_llm_keys;
drop policy if exists "Users can update their own account llm keys"
  on public.account_llm_keys;
drop policy if exists "Users can delete their own account llm keys"
  on public.account_llm_keys;

drop policy if exists "Service role full access"
  on public.account_llm_keys;
create policy "Service role full access"
  on public.account_llm_keys
  for all
  to service_role
  using (true)
  with check (true);

-- Column-level grant on purpose: the hint is readable, the sealed key is not.
-- Readers must name their columns; "select *" is refused by design.
revoke all on table public.account_llm_keys
  from public, anon, authenticated;
grant select (
  user_id,
  provider,
  hint,
  created_at,
  validated_at
) on table public.account_llm_keys to authenticated;
grant all on table public.account_llm_keys to service_role;

comment on table public.account_llm_keys is
  'Bring-your-own-key vault for the account chat. Stores a sealed provider key plus a four-character hint. Never exported, never readable in the clear by any browser role.';
comment on column public.account_llm_keys.ciphertext is
  'base64url of the AES-256-GCM ciphertext with the 16-byte authentication tag appended. Bound to user_id and provider through the additional authenticated data.';
comment on column public.account_llm_keys.iv is
  'base64url of the 12-byte initialisation vector used exactly once for this ciphertext.';
comment on column public.account_llm_keys.hint is
  'Last four characters of the clear provider key. The only clear fragment that leaves the server.';
comment on column public.account_llm_keys.validated_at is
  'When the stored key last answered a provider models-list call successfully.';
