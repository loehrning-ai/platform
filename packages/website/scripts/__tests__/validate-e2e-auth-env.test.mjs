import assert from "node:assert/strict";
import test from "node:test";
import {
  LIVE_AUTH_ENV_NAMES,
  validateLiveAuthEnv,
} from "../validate-e2e-auth-env.mjs";

const VALID = Object.freeze({
  SIMPLIFIED_SUPABASE_TEST_URL: "https://isolated-test-ref.supabase.co",
  SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY: "sb_publishable_test_fixture",
  SIMPLIFIED_SUPABASE_TEST_EMAIL: "learner@example.test",
  SIMPLIFIED_SUPABASE_TEST_PASSWORD: "non-secret-test-fixture",
  NEXT_PUBLIC_SUPABASE_URL: "https://isolated-test-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture",
});

test("requires the complete six-variable live-auth contract", () => {
  assert.throws(
    () => validateLiveAuthEnv({}),
    (error) =>
      error instanceof Error &&
      LIVE_AUTH_ENV_NAMES.every((name) => error.message.includes(name)),
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
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_other_fixture",
      }),
    /same project key/,
  );
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
