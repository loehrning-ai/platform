# Agent Access

How a learner's own assistant (Claude Desktop, Claude Code, Codex, or any other
MCP client) reads this platform, how it proves who it acts for, what the
platform limits, what it records, and the two operational duties that come
with it: rotating the key-encryption key for stored provider keys, and keeping
the audit-trail retention job alive.

Every fact below comes from the code in this tree. The files named next to each
section are the source of truth; update this note when they change.

## Surfaces

The crawl contract (`src/lib/crawl/contract.ts`) classifies every route. Agent
surfaces fall into two classes.

### Public machine surfaces

Crawlable, never in the sitemap, all cached short. `src/proxy.ts` splits cache
ownership: an `/api/` path keeps the policy its handler sets, every other public
document gets the contract class header from the proxy. The times in the table
are the ones the handlers set.

| Path | Method | What it serves | Fails closed when |
| --- | --- | --- | --- |
| `/api/mcp` | POST | The MCP Streamable HTTP transport (JSON-RPC). `Content-Type: application/json` is required. | `isAgentAccessReady()` is false: 503 with a JSON-RPC error |
| `/api/mcp` | GET | A self-contained HTML explainer with the setup for Claude Desktop, Claude Code and Codex, `?locale=en` for English, `X-Robots-Tag: noindex, follow`, cached 600 s. | `isAgentAccessReady()` is false: 503 plain text |
| `/api/courses.json` | GET | The course catalog as machine records, derived from the same registries the tools read. CORS `*`, cached 3600 s. | never (public page content) |
| `/api/workshops.json` | GET | The workshop catalog with the materials manifest. Same headers. | never |
| `/api/books.json`, `/api/knowledge-graph.json`, `/llms.txt` | GET | The existing machine surfaces; `llms.txt` lists everything in this table. | never |
| `/.well-known/oauth-protected-resource/api/mcp` | GET | RFC 9728 protected resource metadata for the endpoint: `resource` is `https://loehrning.ai/api/mcp`, `scopes_supported`, `bearer_methods_supported: ["header"]`, documentation and policy links. Cached 300 s, CORS `*`. | `isAgentAccessReady()` is false: 404, `Cache-Control: no-store` |
| `/.well-known/oauth-protected-resource` | GET | The site-level variant of the same document for clients that only probe the origin root. | same |
| `/skills/<name>/SKILL.md` | GET | One authored skill document, byte for byte, as `text/markdown` with CORS and `nosniff`. Names come from `content/skills/`; any other name is a 404. See `docs/skills-mirror.md`. | never |

`authorization_servers` appears in the metadata documents only while
`isOAuthServerReady()` holds. Advertising an authorization server that does not
answer would send every client into a dead flow, so until then the personal
access token is the documented way in.

### Protected surfaces

The proxy (`src/proxy.ts`) redirects a signed-out browser to `/login` with the
full query carried in `next`, answers 401 JSON on `/api/` paths, and stamps
`Cache-Control: private, no-store` plus `Vary: Cookie` on every signed-in
answer.

| Path | Method | What it does | Gate |
| --- | --- | --- | --- |
| `/oauth/consent` | GET | The consent page the Supabase OAuth server sends a learner to (`?authorization_id=`). Shows client name and id, registered site, redirect host, and one sentence per requested scope. | `isOAuthServerReady()`, else 404 |
| `/oauth/consent/entscheidung` | POST | Approve or deny. Origin and `sec-fetch-site` checks, 2 KB form ceiling, then a 303 either to the client's redirect or back to the page with a named error. | same |
| `/konto/ki` | GET | The account page: personal access tokens, granted OAuth clients, the last 50 agent events, and the chat on the learner's own key. | account runtime |
| `/api/account/agent-tokens` | POST, DELETE | Mint a personal access token (shown once) or revoke one by id. | `isAgentAccessReady()`, else 503 `agent_access_disabled` |
| `/api/account/llm-key` | POST, DELETE | Store, replace or delete the learner's own provider key. | `isByoChatReady()`, else 503 `byo_chat_not_ready` |
| `/api/account/chat` | POST | The streaming chat (NDJSON) on the stored key with the read-only tools. | `isByoChatReady()`, else 503 `chat_not_enabled` |
| `/api/account/oauth-grants` | DELETE | Revoke a granted OAuth client. Deliberately not readiness-gated: withdrawing a credential must keep working while the surface that honours it is off. | account runtime |

## Tools and resources

Source: `src/lib/mcp/tools/*.ts`, `src/lib/mcp/resources.ts`. Every tool is a
pure function over the canonical content registries; there is no second
catalog, and nothing under `src/lib/mcp` can reach a write path (a source-scan
test in `tools/registry.test.ts` enforces this).

| Kind | Tools | Resources |
| --- | --- | --- |
| Public, no credential | `list_courses`, `get_course`, `get_lesson`, `list_workshops`, `get_workshop`, `get_book_chapter`, `list_open_source_tools`, `get_open_source_tool`, `search_content`, `get_knowledge_graph` | `lesson://<course>/<lessonId>?locale=de\|en`, `workshop://<slug>`, `book://<slug>/<chapter>` |
| Authenticated, read-only | `get_my_progress`, `get_next_step` | none |

Every tool takes an optional `locale` (`de` or `en`, German by default). There
is no write tool on this surface by decision: an agent never records progress,
never completes a lesson, never issues a certificate of participation.

### Current wiring

`src/app/api/mcp/route.ts` registers the public tools and resources. The bearer
resolver (`src/lib/mcp/auth.ts`) and the two authenticated tools
(`src/lib/mcp/tools/authenticated.ts`) are complete and tested but not yet
called from the endpoint, so over HTTP every request is treated as anonymous:
`tools/list` shows the ten public tools, a bearer header is ignored, and no
audit row is written for an MCP call. The account chat already records its
tool calls. The wiring, once added to the endpoint, is:

```ts
const caller = await resolveAgentPrincipal(request);
if (!caller.ok) return agentUnauthorizedResponse(caller.rejection);
registerAuthenticatedMcpTools(server, {
  principal: caller.principal,
  request,
  readProgress: readAgentProgressSnapshot,
  recordEvent: recordAgentAccessEvent,
});
```

Nothing in this note should be read as "live" for the authenticated path until
that call exists in the route.

## Credentials

Four kinds of credential touch the agent surface. Source: `src/lib/mcp/auth.ts`,
`src/lib/mcp/oauth-jwt.ts`, `src/lib/mcp/jwks.ts`,
`src/lib/agent-access/personal-tokens.ts`, `src/lib/llm-keys/`.

### 1. OAuth 2.1 access token

Issued by the Supabase OAuth server after the learner approves a client on
`/oauth/consent`. Presented as `Authorization: Bearer <jwt>`. Verified in this
order, and every failure is a fixed rejection code, never a message that echoes
the token:

1. Signature against the project JWKS at
   `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cached for 10 minutes, with
   a minimum refresh interval so an unknown key id cannot turn into a fetch
   storm). The algorithm profile is chosen from the published key, never from
   the token header; only ES256 and RS256 exist, so a token that claims a
   symmetric algorithm has no path to a key at all.
2. `iss` must equal `${SUPABASE_URL}/auth/v1`.
3. `aud` must contain `https://loehrning.ai/api/mcp` (the `resource` the client
   sent during authorization).
4. `exp` must be present and in the future; `nbf` and `iat` get a small
   tolerance for a client clock running ahead.
5. `sub` must be a UUID. That value, and nothing claimed by the client, becomes
   the account id.

Audit-trail label: `oauth:<client id>`.

### 2. Personal access token

For clients without an OAuth flow. Minted on `/konto/ki`, shown exactly once.

- Format: `lat_` followed by 43 base64url characters (32 bytes from the
  platform CSPRNG), 47 characters in total.
- Stored: only the lowercase-hex SHA-256 digest (64 characters, enforced by a
  CHECK constraint) and a display prefix (`lat_` plus the first 8 characters).
  A mint that tried to persist a clear token would fail at INSERT.
- Lifecycle: at most 5 active tokens per account, name up to 64 characters,
  revocation sets `revoked_at` and is honoured on the next use,
  `last_used_at` is touched fire-and-forget.
- The browser role's column grant on `agent_access_tokens` excludes
  `token_hash`, so no browser-reachable query can return the verifier.

Audit-trail label: `pat:<name>`.

### 3. Browser session

The Supabase session cookie. It is what `/konto/ki` and every `/api/account/*`
route require. It is never accepted as a bearer on `/api/mcp`, and a bearer is
never accepted on the account routes.

Audit-trail label for tool calls the account chat makes: `konto-chat`.

### 4. The learner's own provider key

Not a credential for the platform: it is the learner's Anthropic key, stored so
the account chat can spend the learner's own budget. The operator key is never
used for that chat; the provider client refuses to build without an explicitly
shaped key, and a test asserts the operator path is unreachable from the chat
code.

- Sealed with AES-256-GCM under `ACCOUNT_LLM_KEK`, a fresh 12-byte IV per seal,
  and additional authenticated data `acct-llm-key.v1|<user id>|<provider>`, so
  a row copied to another account or provider fails the tag check instead of
  yielding a key.
- Table `public.account_llm_keys` (`user_id`, `provider`, `ciphertext`, `iv`,
  `hint`, `created_at`, `validated_at`). The browser role may read only
  `user_id`, `provider`, `hint`, `created_at`, `validated_at`.
- The hint is the last four characters of the key and the only clear value.
- Validated once on save with a models-list call (5 s timeout, no response
  body decoded).
- Never exported; deleted with the account through `ON DELETE CASCADE`.

### Rejections

A rejected bearer on the endpoint answers 401 with
`WWW-Authenticate: Bearer resource_metadata="https://loehrning.ai/.well-known/oauth-protected-resource/api/mcp"`,
plus an `error` parameter for every case except a request that presented no
credential at all (RFC 6750). Rejection codes: `missing_credentials`,
`malformed_credentials`, `unknown_token_format`, `invalid_token`,
`expired_token`, `invalid_audience`, `invalid_issuer`, `revoked_token`,
`verifier_unavailable`, `not_configured`.

## Scopes

Source: `src/lib/mcp/protected-resource.ts`, `src/app/oauth/consent/consent-copy.ts`.

The metadata documents advertise `openid`, `email` and `profile`. The consent
page also documents `phone`, and prints one plain sentence for any scope it
does not know, naming the scope, so a learner never approves a bare token. A
scope unlocks nothing on this platform beyond what the consent sentence says:
the agent tools are read-only and a grant carries the same read rights as the
learner's own sign-in, not more.

## Limits

All counters go through the durable limiter in `src/lib/security/rate-limit.ts`.
Keys are hashed, so no address or account id is stored in the clear. When the
limiter itself is unavailable the call is refused (`503 rate_limit_unavailable`,
or a refused tool result), never waved through.

| Surface | Per account | Per client (address) | Other ceilings |
| --- | --- | --- | --- |
| `POST /api/mcp` | none (anonymous) | 240 requests per hour | request body 256 KB, each tool result 64 KB (a longer result is truncated and carries the canonical URL), `search_content` at most 25 results (default 10) and 200 query characters, `maxDuration` 30 s |
| `get_my_progress`, `get_next_step` | 120 calls per hour | 240 per hour | both budgets are reserved in one transaction, so a refused pair changes neither |
| `POST /api/account/chat` | 60 messages per hour | 240 per hour | 32 KiB per message, 256 KiB body, 24 replayed history messages, 8 tool calls per message (the ninth is refused, not run), 4096 output tokens per turn, 100 s deadline inside `maxDuration` 120 s |
| `POST /api/account/agent-tokens` | 30 per hour | 200 per hour | 5 active tokens, name 64 characters |
| `POST /api/account/llm-key` | 10 per hour | 60 per hour | provider validation 5 s, `maxDuration` 15 s |
| `DELETE /api/account/llm-key` | 20 per hour | 120 per hour | idempotent |
| `DELETE /api/account/oauth-grants` | 30 per hour | 200 per hour | |
| `POST /oauth/consent/entscheidung` | 20 per minute | 60 per minute | form 2 KB |

Named errors on the chat route: `unsupported_media_type` 415, `unauthorized`
401, `auth_unavailable` and `auth_not_configured` 503, `payload_too_large`
413, `chat_owner_mismatch` 409, `model_not_allowed` 400, `rate_limit_exceeded`
429, `rate_limit_unavailable` 503, `chat_not_enabled` 503, `llm_key_missing`
409, `llm_key_unavailable` 503, `llm_key_rejected` 502 (replace the key),
`llm_credit_required` 502, `llm_request_rejected` 502, `llm_busy` 503 with
`Retry-After`, `llm_timeout` 504, `llm_unavailable` 502. Errors that occur
after the stream has started arrive as in-band error events.

## What is logged, and what never is

### Structured request and tool lines

Source: `src/lib/mcp/observability.ts`. Two JSON lines, written through
`console.warn` (the production boundary replaces `console.error` with a fixed
redaction marker, so a diagnostic written there would vanish):

- `mcp-request`: `outcome` from a fixed enum (`served`, `disabled`,
  `unsupported_media_type`, `payload_too_large`, `rate_limited`,
  `rate_limit_unavailable`, `failed`), the HTTP `status`, `durationMs`.
- `mcp-tool`: `tool` (a name that must exist in the registry, otherwise
  `unknown`), `outcome` (`ok`, `not_found`, `unavailable`, `invalid_input`,
  `failed`), `durationMs`, and `truncated: true` when the output ceiling hit.

No search query, slug, locale, header, address or payload is ever read by the
logger, so no line can carry caller-controlled text.

### Error reports

`reportApiError` (`src/lib/observability/api-error.ts`) records a route and a
step from two allowlists. A route not on the list is recorded as `unknown`;
today that is the case for `/api/mcp`, `/api/account/chat`,
`/api/account/llm-key`, `/api/account/agent-tokens` and
`/oauth/consent/entscheidung`, which lose only their label, never leak.

### The audit trail

Table `public.agent_access_events`, written by
`src/lib/agent-access/record.ts`.

| Column | Content |
| --- | --- |
| `user_id` | the account the credential resolved to |
| `client` | `pat:<name>`, `oauth:<client id>` or `konto-chat`, at most 96 code points |
| `tool` | the registered tool name, at most 64 code points |
| `ok` | whether the call succeeded |
| `duration_ms` | at most 600000 |
| `created_at` | server time |

There is no argument, result, prompt, query, address or token column, and the
CHECK constraints make a mistaken write of one fail at INSERT. The write is
handed to `after()` so it costs the tool call no latency, and a failed write is
a log line plus a returned outcome, never a thrown error. The account page shows
the owner's last 50 rows. Rows disappear with the account (cascade) and after 30
days (see the retention job below).

### Sentry

`redactSentryCredentials` (`src/lib/observability/sentry-redaction.ts`) runs
ahead of the existing allowlist in both the server and edge configurations. It
removes `authorization`, `cookie` and token-shaped keys and any bearer-, JWT- or
`lat_`-shaped string at any depth, and drops an event it cannot inspect.

### Never written anywhere

Bearer tokens, the clear value of a personal access token (digest only), the
learner's provider key, its ciphertext or IV in a log line, and the
key-encryption key. The test suites for the chat route, the key vault, and the
bearer resolver scan response bodies, every console channel and every error
report for the credential under test.

## Data at rest and GDPR

| Table | Migration | Delete | Export |
| --- | --- | --- | --- |
| `public.agent_access_tokens` | `20260905120000_add_agent_access_tokens.sql` | cascade on account deletion | not yet included; the non-secret columns (`id`, `name`, `prefix`, `created_at`, `last_used_at`, `revoked_at`) belong in `src/app/api/account/export/route.ts`, `token_hash` never |
| `public.agent_access_events` | `20260905120100_add_agent_access_events.sql` | cascade, plus the 30-day prune | not yet included; the rows are the learner's own activity record and belong in the export |
| `public.account_llm_keys` | `20260905120200_add_account_llm_keys.sql` | cascade | excluded on purpose and tested (`src/lib/llm-keys/export-exclusion.test.ts`): a sealed key is not personal data the learner needs back, and exporting ciphertext would only widen its exposure |

All three follow the platform's RLS pattern: an owner-scoped select policy for
`authenticated` using `(select auth.uid()) = user_id`, a `service_role` policy
for writes, revoke from `public`, `anon` and `authenticated`, then explicit
column-level grants that exclude every secret-bearing column.

## Configuration and readiness

Every switch fails closed. Source: `src/lib/provider-readiness.ts`. All names
are registered together in `scripts/environment-policy.mjs`,
`packages/website/scripts/validate-env.mjs`, `packages/website/.env.example`
and the Playwright test-server denied list.

| Predicate | Requires | Turns on |
| --- | --- | --- |
| `isAgentAccessReady()` | `MCP_SERVER_ENABLED=true` and the complete Supabase runtime (the limiter lives there) | `/api/mcp`, both metadata documents, token minting |
| `isOAuthServerReady()` | the account runtime and `SUPABASE_OAUTH_SERVER_CONFIRMED_AT` as a past or present `YYYY-MM-DD` | `/oauth/consent`, `authorization_servers` in the metadata, the grants region on `/konto/ki` |
| `isByoChatReady()` | `BYO_CHAT_ENABLED=true`, a valid `ACCOUNT_LLM_KEK`, a valid `BYO_CHAT_MODEL_ALLOWLIST` (1 to 8 unique lowercase model ids) and the account runtime | `/api/account/llm-key`, `/api/account/chat`, the chat region |
| `isCvEngineHostedReady()` | `CV_ENGINE_HOSTED_URL` (exact HTTPS origin) and `CV_ENGINE_HOSTED_CONFIRMED_AT` | reserved for the hosted cv-engine documents tool |

`SUPABASE_OAUTH_SERVER_CONFIRMED_AT` is an attestation, not a switch: set it
only after the OAuth server is enabled in the Supabase dashboard
(Authentication, OAuth Server), the authorization path points at
`/oauth/consent` on the Site URL, and one real grant has completed in that
deployment.

## Rotating `ACCOUNT_LLM_KEK`

Facts that shape the procedure (`src/lib/llm-keys/envelope.ts`):

- There is exactly one key-encryption key per environment, and a ciphertext
  carries no key id. The envelope has no dual-key window and this tree has no
  re-wrap script, so rotation means every stored key becomes unreadable.
- After rotation, opening an old row ends in `decrypt_failed`. The chat then
  answers `409 llm_key_missing`, while the account page would still show the
  old hint from the summary row. Clearing the rows first avoids that
  contradiction: the page shows the honest "no key stored" state and offers the
  form.
- Production and Preview each hold their own value; rotate them separately.

Procedure:

1. Generate the new value on a trusted machine and keep it out of chats,
   tickets and shell history:
   `printf 'kek1_%s\n' "$(openssl rand -hex 32)"`.
   The format is the literal prefix `kek1_` plus 64 lowercase hex characters;
   anything else fails `isValidAccountLlmKek()` and the build.
2. Tell the affected learners beforehand that stored keys will have to be
   entered again on `/konto/ki`. The key form's "replace" action is the whole
   recovery; no support action is needed per account.
3. With the service role, count and then clear the vault for that environment:
   `select count(*) from public.account_llm_keys;` then
   `delete from public.account_llm_keys;`. This is irreversible, and that is
   the point: the ciphertexts are useless under the new key anyway.
4. Set the new `ACCOUNT_LLM_KEK` in the Vercel environment (never in a
   `NEXT_PUBLIC_` variable, never in the repository) and redeploy.
5. Verify: the build passes `validate-env`, `/konto/ki` accepts and validates a
   key, one chat message answers.
6. Remove the old value from every local `.env` and from the environment
   history you control.

On a suspected compromise of the key or of a database backup, run steps 1, 3
and 4 immediately, then ask learners to rotate their provider keys at Anthropic
as well: a leaked KEK together with the table exposes every key that was stored
under it. A revoked KEK protects only what has not already been read.

## Retention job for the audit trail

Migration `20260905120100_add_agent_access_events.sql` creates
`public.prune_agent_access_events()` (SECURITY INVOKER, empty search path,
fixed 30-day boundary, executable by `service_role` only) and schedules it
through `pg_cron` under a stable name:

| Job | Schedule (UTC) | Command |
| --- | --- | --- |
| `agent-access-events-retention-daily` | `41 3 * * *` | `select public.prune_agent_access_events()` |

The migration creates the `pg_cron` extension if it is missing and refuses to
schedule if the function does not exist, so the job cannot outrun its function.
Nothing else prunes the table: if the job stops, rows older than 30 days stay
until it runs again. There is no attestation variable for this job (unlike the
feedback retention job), so verification is a deployment duty:

1. Apply the migration and make sure Supabase Cron is enabled in the project.
2. Verify the exact job exists:
   `select jobname, schedule, command from cron.job where jobname = 'agent-access-events-retention-daily';`
3. After the first scheduled run, verify it succeeded:
   `select status, start_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'agent-access-events-retention-daily') order by start_time desc limit 5;`
4. Do not create a second retention job by hand. The existing
   `beta-feedback-retention-daily` job runs at `29 3 * * *`; the migration
   contract test asserts the two never share a minute.

## Robots and crawl

`src/lib/crawl/contract.ts` records the AI agent decision that `robots.txt`
renders: user-initiated and search agents (`Claude-User`, `Claude-SearchBot`,
`ChatGPT-User`, `OAI-SearchBot`, `PerplexityBot`, `Perplexity-User`) receive the
same allow and disallow lists as every other crawler, so they can read the
public surfaces above and nothing protected; training crawlers (`ClaudeBot`,
`anthropic-ai`, `GPTBot`, `CCBot`, `Bytespider`, `Google-Extended`,
`Applebot-Extended`) are blocked from the whole site. The reasoning sits next to
the two lists in that file.

## Verifying a change

```bash
cd packages/website
bunx vitest run src/lib/crawl src/app/__tests__/robots.test.ts src/app/llms.txt
bunx vitest run src/lib/mcp src/lib/agent-access src/lib/llm-keys src/app/api/mcp src/app/api/account
node scripts/skills-mirror-check.mjs
bun run page-inventory:check
```

The crawl completeness test walks the real `src/app` tree, so a new agent route
without a contract entry fails there before it can ship unclassified.
