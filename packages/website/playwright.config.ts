import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateLiveAuthStorageStatePath } from "./tests/e2e/fixtures/live-auth-artifacts";
import { resolvePlaywrightArtifactPath } from "./tests/e2e/fixtures/playwright-artifact-paths";

// Port override for local runs where 3000 is taken by another project
// (E2E_PORT=3311 bun run test:e2e). CI keeps the default 3000.
function boundedInteger(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new Error(`${name} must be a positive integer.`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

const CI_GLOBAL_TIMEOUT = 40 * 60 * 1000;
const PORT = boundedInteger("E2E_PORT", 3000, 1, 65_535);
const PRODUCTION_E2E =
  !!process.env.CI || process.env.E2E_SERVER_MODE === "production";
const STRICT_TEST_RUN =
  PRODUCTION_E2E || process.env.RELEASE_VALIDATION === "1";
const GLOBAL_TIMEOUT = boundedInteger(
  "E2E_GLOBAL_TIMEOUT",
  process.env.CI ? CI_GLOBAL_TIMEOUT : 30 * 60 * 1000,
  // The public-suite runner owns the 70-minute aggregate deadline and passes
  // each sequential shard only its remaining budget. Keep the per-process
  // lower bound at one minute in CI as well, or valid late shards would be
  // rejected once the aggregate run has less than 40 minutes remaining.
  60_000,
  2 * 60 * 60 * 1000,
);
const REUSE_EXISTING_SERVER =
  process.env.E2E_REUSE_EXISTING_SERVER === "1";
if (STRICT_TEST_RUN && REUSE_EXISTING_SERVER) {
  throw new Error(
    "Production and release Playwright runs may not reuse an existing server.",
  );
}

// storageState written by the auth setup project and consumed by auth tests.
// It is a generated session artifact and must never be committed.
const STATIC_STORAGE_STATE = "tests/e2e/.auth/user.json";
const PACKAGE_ROOT = fileURLToPath(new URL(".", import.meta.url));

// Desktop Safari is an optional local tier. Enable it with RUN_WEBKIT after
// installing WebKit. Use element screenshots for unusually tall pages.
const RUN_WEBKIT = process.env.RUN_WEBKIT === "1";
// Live auth is excluded from the default project graph. Only the explicit,
// fail-closed `test:e2e:authenticated-live(:built)` command sets this flag.
const RUN_LIVE_AUTH = process.env.E2E_AUTH_LIVE === "1";
const DESKTOP_CHROMIUM_ISOLATED_SPECS = [
  /route-ai-native-operator\.spec\.ts$/,
  /route-claude-responsive\.spec\.ts$/,
] as const;
const STORAGE_STATE = RUN_LIVE_AUTH
  ? validateLiveAuthStorageStatePath(
      process.env.E2E_AUTH_STORAGE_STATE,
    )
  : STATIC_STORAGE_STATE;
const LIVE_ARTIFACT_DIRECTORY = RUN_LIVE_AUTH
  ? path.dirname(STORAGE_STATE)
  : undefined;
const PLAYWRIGHT_OUTPUT_DIRECTORY = resolvePlaywrightArtifactPath({
  value: process.env.PLAYWRIGHT_OUTPUT_DIR,
  kind: "output",
  packageRoot: PACKAGE_ROOT,
  liveDirectory: LIVE_ARTIFACT_DIRECTORY,
});
const PLAYWRIGHT_BLOB_OUTPUT_DIRECTORY = resolvePlaywrightArtifactPath({
  value: process.env.PLAYWRIGHT_BLOB_OUTPUT_DIR,
  kind: "blob",
  packageRoot: PACKAGE_ROOT,
  liveDirectory: LIVE_ARTIFACT_DIRECTORY,
});
const PLAYWRIGHT_HTML_OUTPUT_DIRECTORY = resolvePlaywrightArtifactPath({
  value: process.env.PLAYWRIGHT_HTML_OUTPUT_DIR,
  kind: "html",
  packageRoot: PACKAGE_ROOT,
  liveDirectory: LIVE_ARTIFACT_DIRECTORY,
});

const TEST_SERVER_ALLOWED_PUBLIC_PROVIDER_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
]);
const TEST_SERVER_SYSTEM_ENVIRONMENT_KEYS = new Set([
  "CI",
  "HOME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "LOGNAME",
  "PATH",
  "SHELL",
  "TEMP",
  "TERM",
  "TMP",
  "TMPDIR",
  "TZ",
  "USER",
]);
const TEST_SERVER_DENIED_PROVIDER_KEYS = [
  "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
  "AI_NATIVE_PRACTICE_ENABLED",
  "AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET",
  "AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_DPA_CONFIRMED_AT",
  "ANTHROPIC_RETENTION_DAYS",
  "COURSE_TERMINAL_DAILY_RUN_BUDGET",
  "COURSE_TERMINAL_ENABLED",
  "COURSE_TERMINAL_POLICY_CONFIRMED_AT",
  "COURSE_TERMINAL_SANDBOX_IMAGE",
  "E2E_AUTH_LIVE",
  "FEEDBACK_ENABLED",
  "FEEDBACK_RETENTION_CRON_CONFIRMED_AT",
  "GEMINI_API_KEY",
  "GEMINI_DPA_CONFIRMED_AT",
  "GEMINI_PAID_TIER_CONFIRMED_AT",
  "GEMINI_RETENTION_DAYS",
  "LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME",
  "LOEHRNING_VALIDATION_PROFILE",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_DPA_CONFIRMED_AT",
  "SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_RETENTION_DAYS",
  "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF",
  "SUPABASE_CAPTCHA_CONFIRMED_AT",
  "SUPABASE_DPA_CONFIRMED_AT",
  "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
  "SUPABASE_REGION",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
  "TURBO_TOKEN",
  "VERCEL",
  "VERCEL_BRANCH_URL",
  "VERCEL_DPA_CONFIRMED_AT",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_SHA",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_TDDDG_ASSESSMENT_AT",
  "VERCEL_TELEMETRY_ENABLED",
  "VERCEL_URL",
] as const;

function isAllowedTestServerEnvironmentKey(key: string): boolean {
  return (
    TEST_SERVER_SYSTEM_ENVIRONMENT_KEYS.has(key) ||
    TEST_SERVER_ALLOWED_PUBLIC_PROVIDER_KEYS.has(key)
  );
}

const TEST_SERVER_ENVIRONMENT = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [
    key,
    isAllowedTestServerEnvironmentKey(key) ? (value ?? "") : "",
  ]),
);
const DOTENV_GUARD_NODE_OPTIONS = `--require=${fileURLToPath(
  new URL("../../scripts/deny-dotenv-loading.cjs", import.meta.url),
)}`;
const DOTENV_GUARD_BUN_OPTIONS =
  `--no-env-file --preload=${fileURLToPath(
    new URL("../../scripts/deny-dotenv-loading.cjs", import.meta.url),
  )}`;
const TEST_SERVER_DENIED_ENVIRONMENT = Object.fromEntries(
  TEST_SERVER_DENIED_PROVIDER_KEYS.map((key) => [key, ""]),
);

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  outputDir: PLAYWRIGHT_OUTPUT_DIRECTORY,
  // Bound native browser/process failures at the suite level. Individual test
  // timeouts cannot stop an engine that hangs between tests or during teardown.
  globalTimeout: GLOBAL_TIMEOUT,
  fullyParallel: true,
  forbidOnly: true,
  // Retries retain a trace and separate infrastructure noise from a stable
  // defect. Every gate still fails if any test needed a retry.
  retries: process.env.CI ? 2 : 1,
  failOnFlakyTests: true,
  // CI: 1 worker (GitHub runner). Local: cap at 2 — the suite runs against a
  // single `next start` process on a machine that usually runs other dev
  // servers; unbounded workers (~10 here) starve the server + image
  // optimizer and produce phantom timeouts (clicks taking 60s) that no
  // per-test wait can absorb (performance hardening).
  workers: process.env.CI ? 1 : 2,
  // CI: `blob` so a sharded matrix can be merged into one report, plus
  // `github` for inline annotations.
  // Local: `html` for the browsable report plus `list` for live terminal output.
  reporter: process.env.CI
    ? [
        [
          "blob",
          {
            outputDir: PLAYWRIGHT_BLOB_OUTPUT_DIRECTORY,
          },
        ],
        ["github"],
      ]
    : [
        [
          "html",
          {
            outputFolder: PLAYWRIGHT_HTML_OUTPUT_DIRECTORY,
            open: process.env.PLAYWRIGHT_HTML_OPEN ?? "never",
          },
        ],
        ["list"],
      ],
  // Release-only tests require the real service address on the legal pages.
  // Default runs exclude them; `bun run test:e2e:release` enables
  // them. Never weaken this gate to obtain a green deployment check.
  grepInvert: process.env.RUN_LAUNCH_GATE === "1" ? undefined : /@launch-gate/,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    // Failure artifacts retain a trace plus screenshot and video by default.
    // The serialized WebKit tier narrows video separately to avoid native
    // engine/encoder contention; it still retains the trace and screenshot.
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Pixel baselines are deliberately project/OS independent. The checked-in
  // desktop-Chromium references use bundled local fonts and a bounded 3%
  // tolerance, so Linux CI verifies the same reviewed pixels as local macOS.
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
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
      // These two exhaustive route matrices each get a fresh browser process
      // below. Running both after sustained route walking in one worker
      // reproduced a Chromium renderer deadlock on two protected CI runs.
      testIgnore: [
        /\.authed\.spec\.ts$/,
        ...DESKTOP_CHROMIUM_ISOLATED_SPECS,
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-ai-native-operator",
      testMatch: DESKTOP_CHROMIUM_ISOLATED_SPECS[0],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-claude-responsive",
      testMatch: DESKTOP_CHROMIUM_ISOLATED_SPECS[1],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testIgnore: [/\.authed\.spec\.ts$/, /course-workspace\.spec\.ts$/],
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
    {
      name: "mobile-webkit",
      // Native WebKit and video encoding can starve each other when two workers
      // share one local Next server. Serialize this engine and disable video in
      // zero-retry gates; the retained trace and screenshot remain available.
      // Keep the timeout strict so an actual hang still fails.
      workers: 1,
      timeout: 60_000,
      testIgnore: [/\.authed\.spec\.ts$/, /course-workspace\.spec\.ts$/],
      use: { ...devices["iPhone 13"], video: "on-first-retry" },
    },

    // Provider-free auth scaffold. Protected-route assertions that require a
    // server-validated session stay explicitly skipped in this project.
    {
      name: "auth-scaffold",
      testMatch: /\.authed\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], storageState: STATIC_STORAGE_STATE },
      dependencies: ["auth-scaffold-setup"],
    },

    // Live authentication is opt-in and fail-closed. The command validates all
    // nine dedicated test variables before Playwright starts; auth.setup.ts
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
            testIgnore: [/\.authed\.spec\.ts$/, /course-workspace\.spec\.ts$/],
            use: { ...devices["Desktop Safari"] },
          },
        ]
      : []),
  ],
  webServer: {
    command: PRODUCTION_E2E
      ? `bun run start -- -p ${PORT}`
      : `bun run dev -- -p ${PORT}`,
    // Production-mode local verification needs same-origin auth redirects.
    // Scope that authority to the exact server child and exact loopback origin.
    // Live-auth credentials remain available to the Playwright worker that
    // creates storage state, but never reach the application server process.
    env: {
      ...TEST_SERVER_ENVIRONMENT,
      ...TEST_SERVER_DENIED_ENVIRONMENT,
      BUN_OPTIONS: DOTENV_GUARD_BUN_OPTIONS,
      LOEHRNING_LOCAL_VERIFICATION_ORIGIN: `http://localhost:${PORT}`,
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: PRODUCTION_E2E ? "production" : "development",
      NODE_OPTIONS: DOTENV_GUARD_NODE_OPTIONS,
      ...Object.fromEntries(
        [...TEST_SERVER_ALLOWED_PUBLIC_PROVIDER_KEYS].map((key) => [
          key,
          process.env[key] ?? "",
        ]),
      ),
    },
    url: `http://localhost:${PORT}`,
    // Reusing an arbitrary listener can turn a stale or unrelated server into
    // false production proof. Local reuse must be deliberate.
    reuseExistingServer: REUSE_EXISTING_SERVER,
    timeout: 60_000,
  },
});
