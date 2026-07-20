# Deployment (Vercel)

How to deploy this repository to production on Vercel. All facts below come
from the code in this tree (`scripts/validate-env.mjs`, `next.config.ts`,
`package.json`); update this file whenever those change.

## Vercel project settings

| Setting | Value | Why |
|---|---|---|
| Root Directory | `packages/website` | Bun workspace monorepo; `next` is a dependency of the nested package only. |
| Include source files outside of Root Directory | ON (default) | `next.config.ts` sets `outputFileTracingRoot` to the repo root; `bun.lock` lives at the repo root; `/open-source/lizenzrichtlinie` reads `LICENSE_POLICY.md` from the repo root at build time. |
| Framework Preset | Next.js | |
| Install / Build command | pinned in `vercel.json` | `packages/website/vercel.json` sets `framework: nextjs`, `buildCommand: bun run build` (triggers `prebuild`: `validate-env` + `registry:export`), and `installCommand: cd ../.. && bun install --frozen-lockfile` — install must run from the repo root because `bun.lock` lives there, one level above the Root Directory. Keep the dashboard overrides empty so `vercel.json` wins. |
| Node.js version | 22.x or 24.x | `engines: ^22.18.0 \|\| ^24.0.0`, `.nvmrc` 24.x. The prebuild registry export imports a `.ts` module through plain `node` and relies on type stripping (Node >= 22.18). |
| Fluid Compute | ON (default) | `src/middleware.ts` uses `runtime: "nodejs"`. |

## Environment variables

The prebuild gate (`scripts/validate-env.mjs`) fails any Vercel production or
preview build until the required attestations are present. See `.env.example`
for the authoritative, commented list. Summary:

**Required for every Vercel build:**

- `VERCEL_DPA_CONFIRMED_AT` — `YYYY-MM-DD`, past or present. The build exits 1
  without it whenever `VERCEL=1`.

**Optional groups (all-or-nothing; a partial group fails the build):**

- Supabase (login, course progress, feedback): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_REGION` (must match `^eu`),
  `SUPABASE_DPA_CONFIRMED_AT`. Also apply `supabase/migrations/`, set the
  Auth redirect URL to `https://loehrning.ai/auth/callback`, and configure
  custom SMTP with German templates in the Supabase dashboard. With zero
  Supabase vars the site builds and runs with auth cleanly disabled.
  `NEXT_PUBLIC_*` values are inlined at build time and feed the CSP, so
  adding them later requires a redeploy.
- Analytics: `VERCEL_TELEMETRY_ENABLED=true` requires
  `VERCEL_TDDDG_ASSESSMENT_AT=YYYY-MM-DD`. Without the pair, Web Analytics and
  Speed Insights are compiled out.
- Anthropic (AI-Native practice grading): `ANTHROPIC_API_KEY` requires
  `ANTHROPIC_DPA_CONFIRMED_AT` and the budget attestation vars, plus the full
  Supabase group (rate limiting). Feature-flagged by
  `AI_NATIVE_PRACTICE_ENABLED`.

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
