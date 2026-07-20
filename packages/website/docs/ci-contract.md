# CI Contract

The repository root defines the authoritative command contract. Continuous integration must execute the same commands a contributor can run locally and must never deploy or require production credentials.

## Required blocking gates

| Gate                        | Root command                                                  | Purpose                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public-tree scan            | `bun run scan:public`                                         | Blocks secrets, private paths, unlicensed binaries, stale paths, and manifest drift in scanner-visible files. Known generated directories are deliberately pruned.                                                                                                                               |
| Post-clean publication tree | `bun run publication:check`                                   | Final pre-`git init` packaging gate. After dependencies and build reports are removed, blocks Git metadata, secrets, symlinks, generated/cache/report directories, authenticated storage state, and local-only excluded E2E specs. It intentionally cannot run after a root `.git` entry exists. |
| Dependency licenses         | `bun run license:audit`                                       | Requires license metadata or a bundled license file for every installed package/version, blocks unreviewed strong-copyleft, source-available, and conditional identifiers, and reports exact reviewed package/version exceptions for distribution review.                                        |
| Lighthouse route contract   | `bun run lighthouse:check`                                    | Proves that every static public-indexable page and one published representative per dynamic public pattern are present in `lighthouserc.json`; rejects duplicate, stale, non-indexable, and non-canonical URLs.                                                                                  |
| Content validation          | `bun run content:lint`                                        | Validates registries, dates, links, and content invariants.                                                                                                                                                                                                                                      |
| Environment contract        | `bun run --cwd packages/website test:env-contract` | Proves that partial, insecure, or unattested optional-provider configuration fails gated builds.                                                                                                                                                                                                 |
| Type safety                 | `bun run typecheck`                                           | Compiles the application without emitting files.                                                                                                                                                                                                                                                 |
| Static analysis             | `bun run lint`                                                | Runs ESLint across the application.                                                                                                                                                                                                                                                              |
| Unit tests                  | `bun run test`                                                | Runs the complete Vitest suite.                                                                                                                                                                                                                                                                  |
| Production build            | `bun run build`                                               | Proves credential-free production compilation and static generation.                                                                                                                                                                                                                             |

The root workflow must install with `bun install --frozen-lockfile`. It has read-only repository permissions and no deployment step.

## Browser gates

Every public root command named `test:e2e*` that does not end in `:built` builds
before starting the local production server. This prevents a stale `.next`
directory from being reported as current proof. Commands ending in `:built` are
internal reuse commands: run
them only after `bun run verify` has produced the build in the same workspace.
CI and `verify:public` use these internal commands after the blocking verify
gate, avoiding a redundant build without weakening freshness.

The explicitly named
`bun run --cwd packages/website test:e2e:dev` command is development
diagnostics only. Anonymous learning, accessibility, responsive layout, and
route contracts remain runnable without provider credentials.

### Authentication proof tiers

| Tier                   | Command                               | Credential/network contract                                                                                               | What it proves                                                                                                                               |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-free scaffold | `bun run test:e2e:auth-scaffold`      | No credentials and no Supabase request.                                                                                   | Mock storage-state wiring, browser auth affordance where public config exists, and fail-closed signed-out routes. It is not live-auth proof. |
| Live authenticated     | `bun run test:e2e:authenticated-live` | Requires an intentionally configured, dedicated disposable Supabase test project and makes a live password-grant request. | Server-validated login, protected account pages, and authenticated client round-trips.                                                       |

CI runs `test:e2e:auth-scaffold:built`; its green state must never be described
as successful live authentication. The live tier is fail-closed and is not part
of credential-free pull-request CI. It requires all six variables below:

```text
SIMPLIFIED_SUPABASE_TEST_URL
SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY
SIMPLIFIED_SUPABASE_TEST_EMAIL
SIMPLIFIED_SUPABASE_TEST_PASSWORD
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Both URLs must be the same HTTPS project origin and project reference. Both
publishable-key variables must contain the same key. There is no anon-key alias,
service-role-key path, default key, or mock fallback in the live tier. The test
email must identify a confirmed user created only for this isolated project.
Keep the password in the CI/local secret facility, never in a tracked env file.
Missing, partial, cross-project, or mismatched configuration fails before the
build. A protected-route redirect in the live project fails instead of skipping.
The dedicated build profile also rejects unrelated Supabase, Sentry, Anthropic,
feedback, telemetry, canonical-origin, and deployment variables. This prevents
a developer shell or local env file from activating an optional provider during
the isolated live-auth proof.

## Manual release gate: Lighthouse measurements

`bun run lighthouse:check` is a fast blocking CI contract. It validates route
coverage and catalog drift without launching a browser. It does not produce or
claim performance results.

Before a public release, run the actual Lighthouse measurement from the
repository root after a successful production build:

```bash
bun run build
bun run lighthouse:local
```

The manual release gate passes only when the command completes for every URL in
`lighthouserc.json`, all error-level assertions pass, and every warning-level
budget or score regression is reviewed. Reports are written to
`.lighthouseci/reports`; they are local release evidence and remain excluded
from the public tree. The measurement remains outside CI because performance
scores vary with runner load and Chromium conditions. Route coverage itself is
deterministic and blocking in CI.

## Release validation

`bun run verify:release` sets `RELEASE_VALIDATION=1` for the full verification
and build, then reuses that exact release-mode build for the public and launch
browser gates. This makes environment validation fail closed on a local
machine just as it does in CI or a preview/production build. Configured
providers require their non-secret DPA dates; Supabase additionally requires a
matching HTTPS origin and explicit EU region, Sentry requires its actual
retention period, Anthropic requires its contractually verified retention
period, and Vercel telemetry requires a dated TDDDG assessment. Stored feedback
requires its explicit flag plus a dated verification of the 180-day pruning
Cron job; a service-role key alone does not activate the form. The provider-free
configuration remains valid.

## Proof boundary

Passing these gates proves local repository correctness. It does not prove a deployment, remote configuration, production environment, provider account, or live-domain behavior.
