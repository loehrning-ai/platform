# CI Contract

The repository root defines the authoritative command contract. Verification
executes the same commands a contributor runs locally and requires no production
credentials. Deployment is a separate exact-SHA release operation.

## Pipeline

One workflow verifies the application, one runs the daily extended matrix, and
dependency/security workflows enforce their separate merge contracts. The scripts a job calls are
the scripts a contributor runs: `scripts/ci.mjs` owns the step lists, and the
root `ci*` commands run it inside the provider-free environment scrubber.

| Workflow file                | Name                      | Runs on                                   | Role                                                                  |
| ---------------------------- | ------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `ci.yml`                     | Verify                    | pull requests, push to `main`             | The application gate. Its `verify` check is the release signal.     |
| `nightly.yml`                | Extended                  | Daily 04:17 UTC, manual dispatch          | Full public regression coverage, mobile baseline, account DOM and hygiene. |
| `dependency-review.yml`      | Dependency Review         | pull requests                             | GitHub's dependency-graph diff. Informational for deploys.            |
| `dependency-submission.yml`  | Bun Dependency Submission | `bun.lock` or `package.json` change on `main`, weekly | Feeds the dependency graph. Ignored by deploys. |

CodeQL runs as GitHub's default setup (a repository setting, no workflow file).
CodeQL and dependency review are required by merge rules; the release command
consumes the separate application `verify` signal. Validation workflows do not
deploy: merging to `main` ships nothing, and
production changes only through the exact-SHA release command. Preview builds
also use the dedicated release command after verification; automatic Git builds
are disabled so an unverified push does not build or publish a deployment.

## The blocking gate (`ci.yml`)

Three jobs start together; there is no `needs` between them and no path filter.
The shared bootstrap (Node, checksum-verified Bun,
`bun install --frozen-lockfile --ignore-scripts`, optional Playwright browser)
is the composite action at `.github/actions/setup`.

Every repository-owned job uses `ubuntu-24.04`, the validated OS baseline. An
OS-major migration requires a reviewed workflow change and passing Verify and
Extended on that commit. Hosted-image patch updates still apply.

| Job       | Check name       | Command            | What it proves                                                                                                                                                                                                                              |
| --------- | ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static`  | `static checks`  | `bun run ci:static`  | Types (app and tests), lint, the public-leak scan and its tests, content and marketing rules, route and generated-file drift, workspace and migration contracts, the deploy script, `bun audit --audit-level=critical` (a critical advisory blocks the PR), and that `git diff --exit-code` finds no regenerated file. |
| `unit`    | `unit tests`     | `bun run ci:unit`    | The complete Vitest suite.                                                                                                                                                                                                                   |
| `browser` | `browser smoke`  | `bun run ci:browser` | One production build and privacy probe, then twenty capability cases in desktop Chromium and the same twenty in five fresh-process WebKit batches. |
| `verify`  | `verify`         | inline shell       | Aggregation only. Red unless each of the three results is exactly `success`; failure, cancelled and skipped are all red.                                                                                                                    |

A critical advisory turns `static` red on every pull request, and with it
`verify` and the deploy gate; that is intended. The fix is a bump or an
override. When no fixed version exists yet, add `--ignore=GHSA-...` to the
`audit:critical` script and a dated line here naming the advisory and the
reason, and remove both once a fix ships. Never drop the step. An outage of
the npm advisory API also turns `static` red; re-run the job.

`verify` declares `if: always()`. That is load-bearing: a job that is skipped
when a dependency fails would not be a red check. It is the only job called
`verify` in any workflow.

The smoke list is `packages/website/tests/e2e/smoke.list`. It selects the dedicated
`baseline-smoke.spec.ts`: ten capabilities in DE and EN, twenty logical cases.
Both browser engines run that same contract. The cases cover navigation and
locale URL state; a real public lesson checkpoint; W04/W05 entry, kit download
hashes, deck/presenter and recorded demo handoffs; book navigation; glossary
search/reset; three representative phone axe/reflow checks; and public/protected
HTTP boundaries. The exhaustive route, axe, SEO, legal and workshop specs remain
in the full Extended suite.

The baseline has zero automatic retries and fails on flaky tests. Its coverage
reporter rejects missing, duplicate or unknown capability tags, skips, expected
failures and retry results. A partial green-looking run cannot satisfy it.
WebKit runs five consecutive batches of four cases; each invocation starts a
new server/browser process against the same unchanged build receipt. Each batch
has its own artifact directory. No engine instance accumulates an entire site's
navigation history. Helpers wait for actual hydration before actions, use real
user scrolling and keep each course handoff in a fresh page. Network idle is
not an application-readiness contract.

`verify:release` consumes the same shared cross-engine step list after its
provider-free build and privacy probe. It pins that receipt through all six
baseline invocations and the unchanged launch gate, then validates the final
configured-provider build against the same source set and toolchain.

Changing baseline scope requires updating its capability contract and preserving
the displaced behavior coverage in Extended. A failing test is a defect to
investigate, with its failed trace retained. Do not hide it with quarantine,
larger timeouts, repeated forced clicks or removal of the owning test/job.

If the `browser` job's 90th-percentile duration stays above about 10 minutes,
split it into two shards in `ci.yml`; do not re-add whole browser projects.

A pull request runs its own copy of `ci.yml`. When it edits `.github/`, the
scripts the workflows call, the lockfile, a `package.json`, `bunfig.toml`,
`vercel.json` or the security configuration, a green `verify` comes from the
edited checks, not from the ones on `main`. Review such a diff by hand before
merging.

### Release signal

`scripts/deploy-production.mjs` consumes the `verify` check-run created by GitHub Actions on the exact selected branch-head commit, completed and successful. Production always selects `main`; `deploy:preview` selects the current branch or an explicit `--ref`. Other workflow results do not substitute for this application gate. The separate optional `--require-extended` flag requires a successful extended run on the same commit. After a re-run the newest `verify` decides.

The release runner checks the branch again after waiting and immediately before creation or promotion, validates deployment provenance, and reuses healthy/in-flight builds. Production is staged and checked through authenticated unique-deployment access before promotion, then checked on both canonical domains. Smoke checks use source and asset metadata from the exact GitHub commit. A healthy already-current release succeeds without another build. [Deployment](deployment.md) defines the operator commands and failure behavior.

The release script's `verify` signal is distinct from merge protection. The
active `Protect main` ruleset also requires `dependency-review`, CodeQL and its
configured code-scanning policy. It enforces squash pull requests, linear
history, resolved conversations and no force-push/deletion. These controls must
remain intact; a release-script change does not authorize weakening merge rules.

For a risky release (CSP, fonts, layout primitives, a workshop launch), run the
full matrix on the exact commit first:

```bash
gh workflow run nightly.yml --ref main
bun run deploy:production -- --require-extended --wait --yes
```

`--require-extended` refuses unless the latest run of `nightly.yml` is
green on that commit. A pending or failing latest run is rejected. Without the
flag, Extended is not required. `--require-nightly` remains a compatibility alias.

## Daily extended run (`nightly.yml`)

Runs daily at 04:17 UTC and on `workflow_dispatch`. It runs the full desktop
Chromium suite (two shards, one build each), five small mobile WebKit baseline
batches against one build, the mocked-session `/konto` DOM suite, and
`bun run ci:hygiene` (`bun audit` at every level and the licence audit). Every
existing public spec remains included; there is no quarantine exclusion.
Automatic retries are disabled and flaky results fail. The address-dependent
`@launch-gate` remains a separate explicit release tier. Failures retain their
artifacts and require a cause-specific fix; the test/job is not deleted to make
the dashboard green. Run this workflow on the final exact commit after changing
shared browser helpers, dependencies, layout or release infrastructure.

## Token permissions

Every workflow in `.github/workflows/` sets its default token to
`contents: read`. One job holds more, granted at the job level only:

| Workflow                    | Job      | Token permissions                        | Why                                                                                                                                                                                                           |
| --------------------------- | -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependency-submission.yml` | `submit` | `contents: write`, `actions: read`       | Submits the Bun dependency snapshot to the dependency graph. It runs only on `main`, downloads the snapshot that the read-only `generate` job built, and neither checks out the tree nor runs repository code. |

Every other job runs with `contents: read` alone. Only GitHub-owned actions
(`actions/*`), pinned to a full commit SHA, may be used; write a step in shell
instead of adding a third-party action.

## Local equivalents

| Command             | Runs                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `bun run ci`        | `static` and `unit` in parallel, then `browser`. `bun run verify` is the same command. |
| `bun run ci:static` | The `static` job. Afterwards `git status --short` shows any drift CI would reject. |
| `bun run ci:unit`   | The `unit` job.                                                      |
| `bun run ci:browser`| The `browser` job. Needs the locked Chromium and WebKit builds; honours `E2E_PORT` when 3000 is taken. |
| `bun run ci:hygiene`| The scheduled full advisory and licence audits.                      |

The root workflow and Vercel install with
`bun install --frozen-lockfile --ignore-scripts`. Root `bunfig.toml` enforces
the same lifecycle-script denial for ordinary Bun installs. Required Sharp,
esbuild, Sentry CLI, and Playwright binaries resolve from packages pinned in
`bun.lock`; no dependency install script is part of the build contract.

## Browser gates

Every public root command named `test:e2e*` that does not end in `:built` builds
before starting the local production server. This prevents a stale `.next`
directory from being reported as current proof. Commands ending in `:built` are
internal reuse commands: run them only after a build made in the same workspace
with the same environment. Each long-running built gate verifies source,
toolchain, and artifact integrity both before and after execution, preventing a
mixed-revision success. `ci:browser` builds with `E2E_SERVER_MODE=production` and
`E2E_PORT` in the environment of every step, because the build receipt hashes
that environment and the CSP drops `upgrade-insecure-requests` only for a build
proven to be loopback HTTP.

The explicitly named `bun run --cwd packages/website test:e2e:dev` command is
development diagnostics only. Anonymous learning, accessibility, responsive
layout, and route contracts remain runnable without provider credentials.

### Authentication proof tiers

| Tier                     | Command                               | Credential/network contract                                                                                                                                  | What it proves                                                                                                                                             |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live session integration | `bun run test:e2e:authenticated-live` | Requires an intentionally configured, dedicated disposable Supabase test project, a public Turnstile test site key, and makes a live password-grant request. | Server-validated session handling, protected account pages, and authenticated client round-trips. It bypasses the magic-link/Turnstile/PKCE login journey. |

The live tier is fail-closed and is not part of credential-free CI; the scheduled
`konto-dom-mocked` project is DOM coverage, never authentication proof. The live tier requires all nine variables below:

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

## Release validation

`bun run verify:release` first runs an unwrapped strict preflight against the
supplied provider environment. This prevents the provider-free verification
wrapper from hiding partial or unattested production configuration. It then
runs `ci:static` and `ci:unit`, then the server-log
privacy probe, the browser smoke list and the launch gate against one
provider-free build receipt, then finishes
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
