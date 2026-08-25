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
| Type safety                 | `bun run typecheck` and `bun run --cwd packages/website typecheck:test` | Compiles production code and the separate strict test configuration without emitting files.                                                                                                                                                                                     |
| Static analysis             | `bun run lint`                                                | Runs ESLint across the application.                                                                                                                                                                                                                                                              |
| Unit tests and coverage     | `bun run --cwd packages/website test:coverage`                | Runs the complete Vitest suite with blocking line, branch, function, and statement coverage floors.                                                                                                                                                                                             |
| Production build            | `bun run verify`                                              | Runs production compilation and static generation inside the provider-free verification wrapper. A plain `bun run build` intentionally validates the current environment and is not provider-free release evidence.                                                                               |
| Server-log privacy          | `bun run --cwd packages/website test:server-log-privacy`      | Builds and starts the production Next.js Node runtime, then proves synthetic uncaught-error and primitive-rejection canaries are replaced by the fixed redaction marker while validated structured API logging remains available.                                                               |

The root workflow and Vercel must install with
`bun install --frozen-lockfile --ignore-scripts`. Root `bunfig.toml` enforces
the same lifecycle-script denial for ordinary Bun installs. Required Sharp,
esbuild, Sentry CLI, and Playwright binaries resolve from packages pinned in
`bun.lock`, including their relevant optional platform packages; no dependency
install script is part of the build contract. CI has read-only repository
permissions and no deployment step.

## Browser gates

Every public root command named `test:e2e*` that does not end in `:built` builds
before starting the local production server. This prevents a stale `.next`
directory from being reported as current proof. Commands ending in `:built` are
internal reuse commands: run
them only after `bun run verify` has produced the build in the same workspace.
Each long-running built gate verifies source, toolchain, and artifact integrity
both before and after execution, preventing a mixed-revision success.
`verify:public` uses these internal commands after the blocking verify gate,
avoiding a redundant build without weakening freshness.

## CI job graph

Verify runs as a parallel job graph rather than one serial job. The shared
bootstrap (Node, checksum-verified Bun, `bun install --frozen-lockfile
--ignore-scripts`, and optional Playwright browsers) lives in the composite
action at `.github/actions/setup`.

| Job | Command | Needs a build |
| --- | --- | --- |
| `fast` | `bun run verify:static` | no |
| `unit` | `bun run --cwd packages/website verify:unit` | no |
| `lighthouse` | `bun run lighthouse:ci:built` | yes |
| `e2e` (18-way matrix) | `bun run --cwd packages/website e2e:shard:built` | yes |
| `auth-scaffold` | `bun run test:e2e:auth-scaffold:built` | yes |
| `server-log-privacy` | `bun run --cwd packages/website test:server-log-privacy:built` | yes |
| `verify` | aggregation only | no |

Each build-dependent job runs `bun run --cwd packages/website verify:build`
itself. The build is deliberately **not** passed between jobs as an artifact:
the build-freshness receipt re-hashes the artifact digest, the input digest, and
the captured toolchain, so a transported `.next` must land byte-identical on an
identically-imaged runner or every `:built` gate fails preflight. Rebuilding
costs runner-minutes, which are free on a public repository, and buys a gate
that cannot fail for transport reasons.

`verify` is the only required status check. It declares `if: always()` and fails
when any dependency did not succeed. That `always()` is load-bearing — a
required job that is *skipped* is treated as passing by branch protection.

The public browser gate is sharded across the matrix instead of looping shards
inside one process. `scripts/run-e2e-suite.mjs` retains the serial loop for
local runs, where process isolation is not otherwise available.

The explicitly named
`bun run --cwd packages/website test:e2e:dev` command is development
diagnostics only. Anonymous learning, accessibility, responsive layout, and
route contracts remain runnable without provider credentials.

### Authentication proof tiers

| Tier                   | Command                               | Credential/network contract                                                                                               | What it proves                                                                                                                               |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-free scaffold | `bun run test:e2e:auth-scaffold`      | No credentials and no Supabase request.                                                                                   | Mock storage-state wiring, browser auth affordance where public config exists, and fail-closed signed-out routes. It is not live-auth proof. |
| Live session integration | `bun run test:e2e:authenticated-live` | Requires an intentionally configured, dedicated disposable Supabase test project, a public Turnstile test site key, and makes a live password-grant request. | Server-validated session handling, protected account pages, and authenticated client round-trips. It bypasses the magic-link/Turnstile/PKCE login journey. |

CI runs `test:e2e:auth-scaffold:built`; its green state must never be described
as successful live authentication. The live tier is fail-closed and is not part
of credential-free pull-request CI. It requires all nine variables below:

```text
SIMPLIFIED_SUPABASE_TEST_URL
SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY
SIMPLIFIED_SUPABASE_TEST_EMAIL
SIMPLIFIED_SUPABASE_TEST_PASSWORD
SIMPLIFIED_SUPABASE_PRODUCTION_URL
SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

The test and browser URLs must be the same HTTPS project origin and project
reference. The production URL must identify a different project, and the
write-project-ref value must exactly repeat the disposable project ref as an
explicit mutation acknowledgement. Both
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

The general environment gate treats standalone provider region, retention, and
compliance-attestation variables as partial configuration. Credential-free
local development remains warning-only, but invalid configuration containing a
Sentry upload token, Supabase service-role key, or Anthropic API key fails even
without CI or Vercel signals so a production build cannot perform external
side effects after reporting a critical mismatch.

This tier does not enter an email on `/login`, solve Turnstile, receive a magic
link, or exchange a same-browser PKCE code. Those steps require a separate
isolated hosted login-journey test; a green session-integration run must not be
reported as proof of the production login flow.

## Release gate: Lighthouse measurements

`bun run lighthouse:check` is a fast blocking CI contract. It validates route
coverage and catalog drift without launching a browser. It does not produce or
claim performance results.

The complete release command runs the actual Lighthouse measurement from the
repository root:

```bash
bun run verify:release
```

The command creates a fresh provider-free production build and a
content-and-environment-bound receipt before measuring. Its internal
`:built` variant rejects a missing or stale receipt. The release gate
passes only when the command completes for every URL in `lighthouserc.json`,
the perfect-score accessibility assertion passes, and every warning-level
budget or score regression is reviewed. Reports are written only to
`.lighthouseci/reports`; they are local release evidence and remain excluded
from the public tree. The complete 35-route, three-run measurement remains
outside ordinary CI because performance scores vary with runner load and
Chromium conditions. Ordinary CI retains its five-route, one-run smoke; route
coverage itself is deterministic and blocking there.

## Release validation

`bun run verify:release` first runs an unwrapped strict preflight against the
supplied provider environment. This prevents the provider-free verification
wrapper from hiding partial or unattested production configuration. It then
runs deterministic verification, the full Lighthouse gate, and browser gates
against one provider-free build receipt, then finishes
by compiling the supplied provider configuration with
`RELEASE_VALIDATION=1`; it explicitly removes `SENTRY_AUTH_TOKEN`,
`SENTRY_ORG`, and `SENTRY_PROJECT`, so this local proof cannot upload source
maps. The browser gates do not attest live provider
behavior or authenticated production journeys. Configured providers require their
non-secret DPA dates; Supabase additionally requires a matching HTTPS origin,
explicit EU region, Cloudflare Turnstile site key, verified hosted CAPTCHA
enforcement, and dated Turnstile configuration review; Sentry requires its
actual retention period, Anthropic requires its contractually verified
retention period, and Vercel telemetry requires a dated TDDDG assessment.
Stored feedback requires its explicit flag plus a dated verification of the
180-day pruning Cron job; a service-role key alone does not activate the form.
The provider-free configuration remains valid.

## Proof boundary

Passing these gates proves local repository correctness. It does not prove a deployment, remote configuration, production environment, provider account, or live-domain behavior.
