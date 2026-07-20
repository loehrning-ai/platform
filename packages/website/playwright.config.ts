import { defineConfig, devices } from "@playwright/test";

// Port override for local runs where 3000 is taken by another project
// (E2E_PORT=3311 bun run test:e2e). CI keeps the default 3000.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const PRODUCTION_E2E =
  !!process.env.CI || process.env.E2E_SERVER_MODE === "production";
const GLOBAL_TIMEOUT = Number(
  process.env.E2E_GLOBAL_TIMEOUT ??
    (process.env.CI ? 40 * 60 * 1000 : 30 * 60 * 1000),
);

// storageState written by the auth setup project and consumed by auth tests.
// It is a generated session artifact and must never be committed.
const STORAGE_STATE = "tests/e2e/.auth/user.json";

// Desktop Safari is an optional local tier. Enable it with RUN_WEBKIT after
// installing WebKit. Use element screenshots for unusually tall pages.
const RUN_WEBKIT = !!process.env.RUN_WEBKIT;
// Live auth is excluded from the default project graph. Only the explicit,
// fail-closed `test:e2e:authenticated-live(:built)` command sets this flag.
const RUN_LIVE_AUTH = process.env.E2E_AUTH_LIVE === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  // Bound native browser/process failures at the suite level. Individual test
  // timeouts cannot stop an engine that hangs between tests or during teardown.
  globalTimeout: GLOBAL_TIMEOUT,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // CI keeps 2 retries (single worker, clean runner). Locally 1 retry turns
  // machine-load starvation (other dev servers, image optimizer) into a
  // visible "flaky" verdict instead of a red run — real failures still fail
  // twice and stay red.
  retries: process.env.CI ? 2 : 1,
  // CI: 1 worker (GitHub runner). Local: cap at 2 — the suite runs against a
  // single `next start` process on a machine that usually runs other dev
  // servers; unbounded workers (~10 here) starve the server + image
  // optimizer and produce phantom timeouts (clicks taking 60s) that no
  // per-test wait can absorb (performance hardening).
  workers: process.env.CI ? 1 : 2,
  // CI: `blob` so a sharded matrix can be merged into one report, plus
  // `github` for inline annotations.
  // Local: `html` for the browsable report plus `list` for live terminal output.
  reporter: process.env.CI ? [["blob"], ["github"]] : [["html"], ["list"]],
  // Release-only tests require the real service address on the legal pages.
  // Default runs exclude them; `bun run test:e2e:release` enables
  // them. Never weaken this gate to obtain a green deployment check.
  grepInvert: process.env.RUN_LAUNCH_GATE ? undefined : /@launch-gate/,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    // Failure artifacts (regression coverage): keep the retry trace and add a
    // screenshot + video only when a test fails, so green runs stay cheap but
    // red runs are debuggable straight from the report.
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Visual regression threshold: fail CI on pixel differences above 2%.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  projects: [
    // --- Provider-free auth scaffold (regression coverage) ------------------
    // This writes a deterministic mock cookie and proves storage-state wiring
    // plus fail-closed signed-out behavior. It is not live authentication
    // proof. It is deliberately not a dependency of chromium/mobile.
    {
      name: "auth-scaffold-setup",
      testMatch: /auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Default PR tier: desktop Chromium plus the same iPhone 13 viewport in
    // Chromium and WebKit. Keeping viewport and engine explicit prevents a
    // native WebKit crash from being misreported as a responsive-layout bug.
    // No auth dependency, so these carry the whole public suite.
    {
      name: "chromium",
      testIgnore: /\.authed\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testIgnore: /\.authed\.spec\.ts$/,
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
    {
      name: "mobile-webkit",
      testIgnore: /\.authed\.spec\.ts$/,
      use: { ...devices["iPhone 13"] },
    },

    // Provider-free auth scaffold. Protected-route assertions that require a
    // server-validated session stay explicitly skipped in this project.
    {
      name: "auth-scaffold",
      testMatch: /\.authed\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["auth-scaffold-setup"],
    },

    // Live authentication is opt-in and fail-closed. The command validates all
    // six dedicated test variables before Playwright starts; auth.setup.ts
    // validates them again before making the password-grant request. These
    // projects do not exist in provider-free or ordinary CI runs.
    ...(RUN_LIVE_AUTH
      ? [
          {
            name: "auth-live-setup",
            testMatch: /auth\.setup\.ts$/,
            use: { ...devices["Desktop Chrome"] },
          },
          {
            name: "authenticated-live",
            testMatch: /\.authed\.spec\.ts$/,
            use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
            dependencies: ["auth-live-setup"],
          },
        ]
      : []),

    // Additional desktop-WebKit tier, gated behind RUN_WEBKIT (see note above).
    // iPhone/WebKit remains covered by the explicit `mobile-webkit` project.
    ...(RUN_WEBKIT
      ? [
          {
            name: "webkit",
            testIgnore: /\.authed\.spec\.ts$/,
            use: { ...devices["Desktop Safari"] },
          },
        ]
      : []),
  ],
  webServer: {
    command: PRODUCTION_E2E
      ? `bun run start -- -p ${PORT}`
      : `bun run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Reusing an arbitrary listener can turn a stale or unrelated server into
    // false production proof. Local reuse must be deliberate.
    reuseExistingServer: process.env.E2E_REUSE_EXISTING_SERVER === "1",
    timeout: 60_000,
  },
});
