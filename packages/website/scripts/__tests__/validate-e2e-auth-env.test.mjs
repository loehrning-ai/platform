import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LIVE_AUTH_ENV_NAMES,
  validateLiveAuthEnv,
} from "../validate-e2e-auth-env.mjs";

const PUBLIC_KEY_FIXTURE =
  "sb_publishable_abcdefghijklmnopqrstuv_12345678";
const OTHER_PUBLIC_KEY_FIXTURE =
  "sb_publishable_vutsrqponmlkjihgfedcba_87654321";
const PRIVILEGED_KEY_FIXTURE = [
  "sb",
  "secret",
  "abcdefghijklmnopqrstuv",
  "12345678",
].join("_");

const VALID = Object.freeze({
  SIMPLIFIED_SUPABASE_TEST_URL: "https://isolated-test-ref.supabase.co",
  SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
  SIMPLIFIED_SUPABASE_TEST_EMAIL: "learner@example.test",
  SIMPLIFIED_SUPABASE_TEST_PASSWORD: "non-secret-test-fixture",
  SIMPLIFIED_SUPABASE_PRODUCTION_URL:
    "https://production-project-ref.supabase.co",
  SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF: "isolated-test-ref",
  NEXT_PUBLIC_SUPABASE_URL: "https://isolated-test-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
});

function legacySupabaseJwt(role) {
  return [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(JSON.stringify({ role })).toString("base64url"),
    Buffer.alloc(32, 0xa5).toString("base64url"),
  ].join(".");
}

test("requires the complete nine-variable live-auth contract", () => {
  assert.throws(
    () => validateLiveAuthEnv({}),
    (error) =>
      error instanceof Error &&
      LIVE_AUTH_ENV_NAMES.every((name) => error.message.includes(name)),
  );
});

test("rejects a malformed public Turnstile site key", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "bad",
      }),
    /valid public Cloudflare Turnstile site key/,
  );
});

test("accepts one matching HTTPS project and publishable key", () => {
  assert.deepEqual(validateLiveAuthEnv(VALID), {
    projectRef: "isolated-test-ref",
  });
});

test("rejects a public URL from a different project", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        NEXT_PUBLIC_SUPABASE_URL: "https://different-ref.supabase.co",
      }),
    /same project origin/,
  );
});

test("rejects a mismatched browser publishable key", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          OTHER_PUBLIC_KEY_FIXTURE,
      }),
    /same project key/,
  );
});

test("rejects a production project and a missing exact write acknowledgement", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_PRODUCTION_URL:
          "https://isolated-test-ref.supabase.co",
      }),
    /refuses the configured production/,
  );
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF: "wrong-project-ref",
      }),
    /exactly acknowledge the disposable project/,
  );
});

test("rejects secret and privileged legacy keys at the live-auth boundary", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY:
          PRIVILEGED_KEY_FIXTURE,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          PRIVILEGED_KEY_FIXTURE,
      }),
    /exact sb_publishable_<22-char-random>_<8-char-checksum>/,
  );
  const serviceRoleJwt = legacySupabaseJwt("service_role");
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY: serviceRoleJwt,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: serviceRoleJwt,
      }),
    /legacy JWT with role anon/,
  );
});

test("rejects opaque, malformed, and whitespace-altered public keys", () => {
  for (const malformedKey of [
    "opaque-browser-key",
    "sb_publishable_too-short",
    ` ${PUBLIC_KEY_FIXTURE}`,
    `${PUBLIC_KEY_FIXTURE}\n`,
    "header.payload.signature",
  ]) {
    assert.throws(
      () =>
        validateLiveAuthEnv({
          ...VALID,
          SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY: malformedKey,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: malformedKey,
        }),
      /exact sb_publishable_<22-char-random>_<8-char-checksum>/,
      malformedKey,
    );
  }
});

test("rejects non-HTTPS project URLs", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_TEST_URL: "http://isolated-test-ref.supabase.co",
      }),
    /must use HTTPS/,
  );
});

test("rejects whitespace-altered and unbounded project origins", () => {
  for (const malformedOrigin of [
    " https://isolated-test-ref.supabase.co",
    "https://isolated-test-ref.supabase.co\n",
    `https://${"a".repeat(2048)}.supabase.co`,
  ]) {
    assert.throws(
      () =>
        validateLiveAuthEnv({
          ...VALID,
          SIMPLIFIED_SUPABASE_TEST_URL: malformedOrigin,
        }),
      /exact, whitespace-free Supabase origin no longer than 2048 characters/,
      malformedOrigin,
    );
  }
});

test("rejects non-Supabase hosts and URL paths", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_TEST_URL: "https://attacker.example.test",
      }),
    /supabase\.co origin/,
  );
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_TEST_URL:
          "https://isolated-test-ref.supabase.co/auth/v1",
      }),
    /must not contain a path/,
  );
});

test("rejects a non-default Supabase port", () => {
  assert.throws(
    () =>
      validateLiveAuthEnv({
        ...VALID,
        SIMPLIFIED_SUPABASE_TEST_URL:
          "https://isolated-test-ref.supabase.co:444",
      }),
    /bare HTTPS project origin/,
  );
});

test("keeps password-grant credentials out of the build and app server", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  );
  const liveCommand = packageJson.scripts["test:e2e:authenticated-live"];
  assert.equal(
    liveCommand,
    "node scripts/run-live-auth-e2e.mjs",
  );
  assert.equal(
    packageJson.scripts["test:e2e:authenticated-live:built"],
    "node scripts/run-live-auth-e2e.mjs --built",
  );
  const runner = readFileSync(
    new URL("../run-live-auth-e2e.mjs", import.meta.url),
    "utf8",
  );
  assert.match(runner, /validateLiveAuthEnv\(liveCredentials\)/);
  assert.match(runner, /minimalVerificationEnvironment\(process\.env\)/);
  assert.match(runner, /verifyBuildReceipt\(\{\s*\n\s*environment: receiptEnvironment,\s*\n\s*mode: "live-auth"/);
  assert.match(runner, /preflightReceipt = verifyPinnedBuild\(\)/);
  assert.match(runner, /postflightReceipt = verifyPinnedBuild\(\)/);
  assert.match(
    runner,
    /isDeepStrictEqual\(preflightReceipt, postflightReceipt\)/,
  );
  assert.doesNotMatch(
    runner.match(
      /const receiptEnvironment = \{([\s\S]*?)\n\};/,
    )?.[1] ?? "",
    /liveCredentials/,
  );
  assert.match(runner, /\.\.\.publicEnvironment,\s*\n\s*E2E_AUTH_LIVE: "1",\s*\n\s*LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e"/);
  assert.match(runner, /"credentialed session setup"/);
  assert.match(runner, /"credential-free authenticated journey"/);
  assert.match(runner, /"--no-deps"/);
  assert.match(runner, /PLAYWRIGHT_BLOB_OUTPUT_DIR:/);
  assert.match(runner, /PLAYWRIGHT_HTML_OUTPUT_DIR:/);
  assert.match(runner, /path\.join\(temporaryDirectory, "setup-results"\)/);
  assert.match(runner, /path\.join\(temporaryDirectory, "journey-results"\)/);
  assert.match(runner, /rmSync\(temporaryDirectory, \{ recursive: true, force: true \}\)/);

  assert.match(
    runner,
    /pickEnvironment\(process\.env, LIVE_AUTH_ENV_NAMES\)/,
    "the setup process must receive exactly the validator-owned nine-variable contract",
  );

  const playwrightConfig = readFileSync(
    new URL("../../playwright.config.ts", import.meta.url),
    "utf8",
  );
  const deniedProviderBlock = playwrightConfig.match(
    /const TEST_SERVER_DENIED_PROVIDER_KEYS = \[([\s\S]*?)\] as const;/,
  )?.[1];
  assert.ok(
    deniedProviderBlock,
    "Playwright must define an explicit denied-provider variable list",
  );
  for (const name of [
    "SIMPLIFIED_SUPABASE_TEST_URL",
    "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
    "SIMPLIFIED_SUPABASE_TEST_EMAIL",
    "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
    "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
    "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF",
  ]) {
    assert.match(
      deniedProviderBlock,
      new RegExp(`"${name}"`),
      `${name} must be on the Playwright web-server denylist`,
    );
  }
  assert.match(
    playwrightConfig,
    /TEST_SERVER_DENIED_PROVIDER_KEYS\.map\(\(key\) => \[key, ""\]\)/,
  );
  assert.match(playwrightConfig, /TEST_SERVER_SYSTEM_ENVIRONMENT_KEYS/);
  assert.match(playwrightConfig, /isAllowedTestServerEnvironmentKey/);
  assert.match(
    playwrightConfig,
    /isAllowedTestServerEnvironmentKey\(key\) \? \(value \?\? ""\) : ""/,
    "the test server must blank every parent variable outside the positive allowlist",
  );

  const authSetup = readFileSync(
    new URL("../../tests/e2e/auth.setup.ts", import.meta.url),
    "utf8",
  );
  assert.match(authSetup, /context\.storageState\(\)/);
  assert.doesNotMatch(authSetup, /storageState\(\{\s*path:/);
  assert.match(authSetup, /mkdir\(directory, \{ recursive: true, mode: 0o700 \}\)/);
  assert.match(authSetup, /open\(temporaryPath, "wx", 0o600\)/);
  assert.match(authSetup, /chmod\(storageStatePath, 0o600\)/);

  const teardown = readFileSync(
    new URL("../../tests/e2e/global-teardown.ts", import.meta.url),
    "utf8",
  );
  assert.match(teardown, /validateLiveAuthStorageStatePath/);
  assert.match(
    teardown,
    /return validateLiveAuthStorageStatePath\(\s*process\.env\.E2E_AUTH_STORAGE_STATE,\s*\)/,
  );
  assert.match(teardown, /await rm\(storageStatePath, \{ force: true \}\)/);

  const sessionMock = readFileSync(
    new URL("../../tests/e2e/fixtures/session-mock.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    sessionMock,
    /from "\.\.\/\.\.\/\.\.\/src\/lib\/supabase\/key-classification\.mjs"/,
  );
  assert.match(sessionMock, /isSafePublicSupabaseKey\(publishableKey\)/);
  assert.match(playwrightConfig, /NEXT_TELEMETRY_DISABLED: "1"/);
  assert.match(
    playwrightConfig,
    /TEST_SERVER_ALLOWED_PUBLIC_PROVIDER_KEYS/,
    "only the three documented public live-auth provider variables may reach the app server",
  );

  const example = readFileSync(
    new URL("../../tests/e2e/.env.test.example", import.meta.url),
    "utf8",
  );
  assert.match(example, /^NEXT_PUBLIC_TURNSTILE_SITE_KEY=/m);
});
