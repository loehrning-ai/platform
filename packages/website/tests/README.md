# E2E Tests

Playwright suites live in `tests/e2e/` and are configured in
`playwright.config.ts`. All commands run from this package
(`packages/website`); the same commands exist at the repository root and
delegate here. Commands ending in `:built` are internal reuse commands that
are valid only after `bun run verify` has produced a receipt-bound,
provider-free build in the same workspace. A plain `bun run build` uses the
current environment and does not establish provider-free reuse. Built gates
recheck the receipt after execution and fail if source, toolchain, or immutable
build output changed while the gate was running.

## Tiers

- **Public (default PR tier):** desktop Chromium plus an iPhone 13 viewport in
  Chromium and WebKit (`chromium`, `mobile-chromium`, `mobile-webkit`
  projects). Covers the public route matrix, open-source routes, and
  structural accessibility. Run with `bun run test:e2e` (full default graph,
  builds first) or `bun run test:e2e:public` (public-route subset).
  `bun run test:e2e:dev` runs against the dev server instead of a production
  build.
- **Auth scaffold (provider-free):** the `auth-scaffold` project writes a
  deterministic mock cookie and proves storage-state wiring plus fail-closed
  signed-out behavior for `*.authed.spec.ts` files. It is not live login
  proof. Run with `bun run test:e2e:auth-scaffold`.
- **Authenticated live (opt-in, fail-closed):** the `authenticated-live`
  project runs only when `E2E_AUTH_LIVE=1` and a dedicated Supabase test
  project supplies the exact nine-variable contract documented in
  [`docs/ci-contract.md`](../docs/ci-contract.md). Run with
  `bun run test:e2e:authenticated-live`; the command validates the environment
  before Playwright starts and has no mock-key fallback.
- **Release / launch gate:** tests tagged `@launch-gate` are excluded from
  every default run (`grepInvert`). They require the real service address on
  the legal pages and run only via `bun run test:e2e:release`
  (`RUN_LAUNCH_GATE=1`), after strict release-mode validation.

An additional desktop WebKit project is available locally by setting
`RUN_WEBKIT` after installing the locked WebKit build
(`bun run --cwd packages/website playwright install webkit` from the
repository root).

## Production server-log privacy probe

`bun run test:server-log-privacy` creates a fresh production build, starts that
build in a Node subprocess, and exercises the installed Next.js
`uncaughtException` and `unhandledRejection` handlers with fixed synthetic
canaries. The probe fails if either canary reaches stdout or stderr, if the
fixed redaction marker is absent, or if the separately validated structured
API log is lost.

`bun run test:server-log-privacy:built` reuses `.next` and is valid only after
`bun run verify` has produced a receipt-matching provider-free build from the
same checkout. The preload is test-only, does not add or remove process
listeners, and is activated only inside the probe subprocess.

## Test selectors

Components must include data-testid attributes for test selectors:
- journey-section: The transformation journey wrapper
- journey-step: Individual journey step sentinels
- journey-step-{n}: Specific step content (0-3)
- accordion-header-{n}: Mobile accordion headers
- accordion-content-{n}: Mobile accordion content panels
- readiness-cta: The KI-Readiness inline question section
- readiness-option: Individual answer option buttons
