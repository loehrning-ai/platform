# E2E Tests

Playwright suites live in `tests/e2e/` and are configured in
`playwright.config.ts`. All commands run from this package
(`packages/website`); the same commands exist at the repository root and
delegate here. Commands ending in `:built` are internal reuse commands that
expect a fresh `bun run build` from the same workspace — do not invoke them
directly.

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
  project supplies the exact six-variable contract documented in
  [`docs/ci-contract.md`](../docs/ci-contract.md). Run with
  `bun run test:e2e:authenticated-live`; the command validates the environment
  before Playwright starts and has no mock-key fallback.
- **Release / launch gate:** tests tagged `@launch-gate` are excluded from
  every default run (`grepInvert`). They require the real service address on
  the legal pages and run only via `bun run test:e2e:release`
  (`RUN_LAUNCH_GATE=1`), after strict release-mode validation.

An additional desktop WebKit project is available locally by setting
`RUN_WEBKIT` after installing WebKit (`bunx playwright install webkit`).

## Test selectors

Components must include data-testid attributes for test selectors:
- journey-section: The transformation journey wrapper
- journey-step: Individual journey step sentinels
- journey-step-{n}: Specific step content (0-3)
- accordion-header-{n}: Mobile accordion headers
- accordion-content-{n}: Mobile accordion content panels
- readiness-cta: The KI-Readiness inline question section
- readiness-option: Individual answer option buttons
