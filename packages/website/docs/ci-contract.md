# CI Contract

The repository root defines the authoritative command contract. Continuous integration must execute the same commands a contributor can run locally and must never deploy or require production credentials.

## Pipeline

One workflow blocks, one runs overnight, two inform. The scripts a job calls are
the scripts a contributor runs: `scripts/ci.mjs` owns the step lists, and the
root `ci*` commands run it inside the provider-free environment scrubber.

| Workflow file                | Name                      | Runs on                                   | Role                                                                  |
| ---------------------------- | ------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `ci.yml`                     | Verify                    | pull requests, push to `main`             | The only blocking gate. Its `verify` check is the release signal.     |
| `nightly.yml`                | Nightly                   | 02:30 UTC, manual dispatch                | Everything that left the pull-request path. Never blocks a merge.     |
| `dependency-review.yml`      | Dependency Review         | pull requests                             | GitHub's dependency-graph diff. Informational for deploys.            |
| `dependency-submission.yml`  | Bun Dependency Submission | `bun.lock` or `package.json` change on `main`, weekly | Feeds the dependency graph. Ignored by deploys. |

CodeQL runs as GitHub's default setup (a repository setting, no workflow file)
and is informational. No workflow deploys: merging to `main` ships nothing, and
production changes only through `bun run deploy:production`. Vercel builds pull
request previews itself.

## The blocking gate (`ci.yml`)

Three jobs start together; there is no `needs` between them and no path filter.
The shared bootstrap (Node, checksum-verified Bun,
`bun install --frozen-lockfile --ignore-scripts`, optional Playwright browser)
is the composite action at `.github/actions/setup`.

| Job       | Check name       | Command            | What it proves                                                                                                                                                                                                                              |
| --------- | ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static`  | `static checks`  | `bun run ci:static`  | Types (app and tests), lint, the public-leak scan and its tests, content and marketing rules, route and generated-file drift, workspace and migration contracts, the deploy script, `bun audit --audit-level=critical` (a critical advisory blocks the PR), and that `git diff --exit-code` finds no regenerated file. |
| `unit`    | `unit tests`     | `bun run ci:unit`    | The complete Vitest suite. Coverage floors run nightly.                                                                                                                                                                                      |
| `browser` | `browser smoke`  | `bun run ci:browser` | One production build, the server-log privacy probe, then the curated browser smoke list on desktop Chromium and the iPhone 13 Chromium viewport.                                                                                           |
| `verify`  | `verify`         | inline shell       | Aggregation only. Red unless each of the three results is exactly `success`; failure, cancelled and skipped are all red.                                                                                                                    |

`verify` declares `if: always()`. That is load-bearing: a job that is skipped
when a dependency fails would not be a red check. It is the only job called
`verify` in any workflow.

The smoke list is `packages/website/tests/e2e/smoke.list`, one spec per line.
It is curated from the specs that caught real regressions (route matrix, axe and
target size, SEO, legal, edge states, phone shell, workshop and home locales, the
plakat contrast, the courses hub). Adding a spec is a one-line diff. A spec
whose title carries `@quarantine` is skipped by the nightly run and is deleted
if still tagged after 14 days; no known-flaky spec belongs in the list. Retries
are set to one on this path, and a test that passes on its retry does not fail
the run (`E2E_FAIL_ON_FLAKY` stays unset); the nightly desktop run sets it to
`1` so those tests are counted there.

If the `browser` job's 90th-percentile duration stays above about 10 minutes,
split it into two shards in `ci.yml`; do not re-add whole browser projects.

A pull request runs its own copy of `ci.yml`. When it edits `.github/`, the
scripts the workflows call, the lockfile, a `package.json`, `bunfig.toml`,
`vercel.json` or the security configuration, a green `verify` comes from the
edited checks, not from the ones on `main`. Review such a diff by hand before
merging.

### Release signal

`scripts/deploy-production.mjs` reads exactly one check: the `verify` check-run
created by GitHub Actions on the head of `main`, completed and successful. Every
other check-run (CodeQL, dependency graph, nightly, anything added later) is
printed as "Not blocking" and cannot refuse a release. There is no override
flag. After a re-run the newest `verify` decides.

`main` has no branch protection today, so no check name is configured in
repository settings. If protection is added, require `verify` and nothing else.

For a risky release (CSP, fonts, layout primitives, a workshop launch), run the
full matrix on the exact commit first:

```bash
gh workflow run nightly.yml --ref main
bun run deploy:production -- --require-nightly --wait --yes
```

`--require-nightly` refuses unless the newest completed `Nightly` run is green
on that commit. Without the flag the script prints the last nightly result as an
information line.

## Nightly (`nightly.yml`)

Runs at 02:30 UTC and on `workflow_dispatch` (input `suite`: `all` or
`webkit`). It never blocks a merge. Jobs: the full desktop Chromium, phone
Chromium and AI-native operator browser suites (sharded, one build each), a
mobile WebKit run of the smoke list, the mocked-session `/konto` DOM suite,
coverage with the Vitest
floors, and `bun run ci:hygiene` (live `bun audit`, licence audit, and the
self-tests of publication and tooling scripts). The `report` job opens one issue
labelled `nightly-red` when any job fails, comments on it while it stays red,
and closes it when a full run is green again. An unread issue means the demoted
coverage is effectively off, so read it.

## Token permissions

Every workflow in `.github/workflows/` sets its default token to
`contents: read`. Two jobs hold more, each granted at the job level only:

| Workflow                    | Job      | Token permissions                        | Why                                                                                                                                                                                                           |
| --------------------------- | -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nightly.yml`               | `report` | `issues: write`                          | Opens, comments on and closes the single `nightly-red` issue with the preinstalled `gh`. It has no checkout and runs no repository code; it runs only on `main`.                                              |
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
| `bun run ci:browser`| The `browser` job. Needs `bunx playwright install chromium` once; honours `E2E_PORT` when 3000 is taken. |
| `bun run ci:hygiene`| The nightly audits and tool self-tests.                              |

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

The live tier is fail-closed and is not part of credential-free CI; the nightly
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
