# Deployment (Vercel)

How to deploy this repository to production on Vercel. All facts below come
from the code in this tree (`scripts/validate-env.mjs`, `next.config.ts`,
`package.json`); update this file whenever those change.

## Vercel project settings

| Setting                                        | Value                   | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root Directory                                 | `packages/website`      | Bun workspace monorepo; `next` is a dependency of the nested package only.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Include source files outside of Root Directory | ON (default)            | `next.config.ts` sets `outputFileTracingRoot` to the repo root; `bun.lock` lives at the repo root; `/open-source/lizenzrichtlinie` reads `LICENSE_POLICY.md` from the repo root at build time.                                                                                                                                                                                                                                                                                                                   |
| Framework Preset                               | Next.js                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Install / Build command                        | pinned in `vercel.json` | `packages/website/vercel.json` sets `framework: nextjs`, `buildCommand: bun run build` (triggers `prebuild`: `validate-env` + non-mutating `registry:check`), and `installCommand: cd ../.. && bun install --frozen-lockfile --ignore-scripts` — install must run from the repo root because `bun.lock` and the fail-closed `bunfig.toml` live there. Regenerate a reviewed legal-date change explicitly with `bun run registry:export` before commit. Keep the dashboard overrides empty so `vercel.json` wins. |
| Node.js version                                | 22.x or 24.x            | `engines: ^22.18.0 \|\| ^24.0.0`, `.nvmrc` 24.x. The registry check/export imports a `.ts` module through plain `node` and relies on type stripping (Node >= 22.18).                                                                                                                                                                                                                                                                                                                                             |
| Fluid Compute                                  | ON (default)            | `src/proxy.ts` uses Next.js 16's Node.js proxy runtime.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Environment variables

The prebuild gate (`scripts/validate-env.mjs`) fails any Vercel production or
preview build until the required attestations are present. See `.env.example`
for the authoritative, commented list. Summary:

**Required for every Vercel build:**

- `VERCEL_DPA_CONFIRMED_AT` — `YYYY-MM-DD`, past or present. The build exits 1
  without it whenever `VERCEL=1`.

**Optional groups (all-or-nothing; a partial group fails the build):**

Disabled means every runtime, region, retention, and attestation variable for
that provider is absent or empty. A standalone compliance attestation is still
partial configuration and fails instead of surviving as stale release state.

- Supabase account core (sessions, course progress, feedback): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_HMAC_SECRET`,
  `SUPABASE_REGION` (must match `^eu`),
  and `SUPABASE_DPA_CONFIRMED_AT`. Also apply `supabase/migrations/` and add the
  exact application callback, such as
  `https://loehrning.ai/auth/callback`, to Supabase Auth's redirect allow-list.
  Magic-link and Google login are separate optional readiness groups. A core
  account configuration with neither group passes validation but exposes no
  new-session method until one group is verified.
- Magic-link login additionally requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  `SUPABASE_CAPTCHA_CONFIRMED_AT`, and
  `TURNSTILE_CONFIGURATION_CONFIRMED_AT`. Configure custom SMTP with German
  templates in the Supabase dashboard. Enable Cloudflare Turnstile under
  Supabase Auth > Bot and Abuse Protection with the matching server-side
  secret, restrict the widget to exact deployment hostnames, and verify one
  real Magic-link request before dating the attestations. The Turnstile secret
  belongs in Supabase, never in Vercel. Turnstile protects only the OTP request;
  the Google OAuth action does not load or submit it.
- Google login additionally requires the server-only, non-secret
  `SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT` attestation set to a past-or-present
  `YYYY-MM-DD`. Keep the Google
  client ID and client secret exclusively in the Google and Supabase provider
  consoles. In Google, register the exact Supabase Auth callback shown by the
  project. In Supabase, enable the Google provider and allow-list each exact
  application callback. Complete a real Google sign-in in the target
  environment before dating the attestation. The application calls
  `signInWithOAuth` with provider `google` and a sanitized application callback;
  it requests no additional Google scopes. Keep every other social provider
  disabled. The callback verifies the exchanged user and signed AMR claim, then
  rejects and clears an OAuth session unless the Google attestation is active;
  a Magic-link attestation cannot authorize an OAuth callback.
  The visible control uses Google's current standard-gradient G asset and light
  button measurements. Recheck the current
  [Sign in with Google branding guidelines](https://developers.google.com/identity/branding-guidelines)
  during Google app verification; the attestation does not substitute for that
  external review.
- With zero
  Supabase vars the site builds and runs with auth cleanly disabled.
  `NEXT_PUBLIC_*` values are inlined at build time and feed the CSP, so
  adding them later requires a redeploy.
- Generate `RATE_LIMIT_HMAC_SECRET` once per environment as
  `printf 'rlh1_%s\n' "$(openssl rand -hex 32)"`. Store it only as a server
  secret. The runtime rejects missing, unversioned, short, uppercase, or
  whitespace-bearing values and returns the existing fail-closed rate-limit
  response without logging the secret, raw identity, or derived token.
- Migration `20260730010000_retire_unkeyed_rate_limit_identifiers.sql` deletes
  only the obsolete `sha256` and `user-sha256` counter-key shapes. This creates
  an intentional one-time quota reset at the HMAC cutover; the rows are
  ephemeral abuse counters, not user content. The new
  `ip-hmac-sha256-v1`/`user-hmac-sha256-v1` prefixes prevent collisions and make
  future format migrations explicit. HMAC-secret rotation also resets active
  counters, so rotate through a controlled release and record the event. No
  schema change or backfill is required.
- Supabase URLs must use the standard
  `https://<project-ref>.supabase.co` origin. A custom domain is rejected until
  its exact origin receives a code-reviewed allowlist entry.
- Sentry runtime reporting requires at least one DSN plus the DPA and retention
  attestations. Server and browser DSNs must match when both are set.
  `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` form an
  all-or-nothing source-map upload group.
- Analytics: `VERCEL_TELEMETRY_ENABLED=true` requires
  `VERCEL_TDDDG_ASSESSMENT_AT=YYYY-MM-DD`. Without the pair, Web Analytics and
  Speed Insights are compiled out.
- Provider-backed practice is feature-flagged by `AI_NATIVE_PRACTICE_ENABLED` and
  requires the full Supabase group, the applied
  `20260813000000_add_usage_budget_counter.sql` migration with both
  `usage_budget_consume_pair` and `rate_limit_consume_multi`, positive
  `AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET` and
  `AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET`, plus an exact
  `AI_NATIVE_PRACTICE_ALLOWED_MODELS` list. `anthropic/claude-haiku-4.5`
  requires `ANTHROPIC_API_KEY`, `ANTHROPIC_DPA_CONFIRMED_AT`, and
  `ANTHROPIC_RETENTION_DAYS`. `google/gemini-2.5-flash-lite` requires the
  server-only `GEMINI_API_KEY`, `GEMINI_DPA_CONFIRMED_AT`,
  `GEMINI_PAID_TIER_CONFIRMED_AT`, and `GEMINI_RETENTION_DAYS`. Do not enable
  Gemini free-tier traffic for learner text. The paid-tier date is a
  deployer-supplied review marker; application code does not inspect or prove
  the Google billing tier. Keys never enter client code.
  Practice and AI exercise grading reserve the caller and global daily ledgers
  together in one database transaction. Authenticated traffic from both routes
  shares the `ai-model-token-day` caller namespace; anonymous grading remains
  bound to a separate pseudonymous trusted-IP quota. These values reserve
  estimated model tokens, not price, currency, provider balance, or spend.
- The real synthetic course terminal is independently feature-flagged by
  `COURSE_TERMINAL_ENABLED`. Activation requires Vercel runtime OIDC,
  `VERCEL_DPA_CONFIRMED_AT`, `COURSE_TERMINAL_POLICY_CONFIRMED_AT`, a positive
  `COURSE_TERMINAL_DAILY_RUN_BUDGET`, a reviewed immutable
  `COURSE_TERMINAL_SANDBOX_IMAGE` in `repository@sha256:<64 lowercase hex>`
  form, the full Supabase group, and the applied
  `20260813000000_add_usage_budget_counter.sql` migration. Terminal account,
  IP, and global run quotas use its service-role-only
  `rate_limit_consume_multi` RPC atomically; provider-token reservations use
  `usage_budget_consume_pair`. Run quotas count accepted runs and do not measure
  Sandbox price or spend.
  `VERCEL_OIDC_TOKEN` is runtime-injected; never place it in `.env.example` or a
  client variable. Mutable image tags and bare image names fail closed; no
  digest is guessed by source code. The route runs only each workspace's exact,
  ordered synthetic command-ID contract in a non-persistent,
  deny-all-network Sandbox and fails closed when any readiness input is absent.
  The route covers the Codex repository fixture and the fixed Data Science,
  Data Engineering, and Data Infrastructure programs. Their browser-entered
  plans are not executable SQL and are never sent to Sandbox.

Outside CI, Vercel, and release validation, credential-free local development
can continue after a validation warning. An invalid environment containing
`SENTRY_AUTH_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, or
`GEMINI_API_KEY` fails
instead because those credentials can authorize uploads, writes, or paid calls.

## Domain

Add `loehrning.ai` in the Vercel Domains tab and follow its DNS instructions
(apex A record plus `www` CNAME, or nameserver delegation). Configure
`www.loehrning.ai` to redirect to the apex. The canonical origin
`https://loehrning.ai` is hardcoded in `src/lib/seo/entity.ts` and used by
metadata, sitemap, robots and JSON-LD; no env var controls it.

## Pre-deploy verification

```
bun run verify
```

runs page-inventory check, env-contract tests, typecheck, lint, unit tests and
the production build. `docs/ci-contract.md` documents the CI equivalents.
