#!/usr/bin/env node
// Fixture-based test for validate-env.mjs (regression coverage).
//
// Runs the real env-validation CLI with planted environments and asserts on the
// process exit code. It proves the widened gate: a bad env now fails preview and
// CI builds (not only production), while credential-free local dev stays
// lenient. Every planted value is obviously fake. Run with:
//   node scripts/__tests__/validate-env.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const validateEnvScript = join(here, "..", "validate-env.mjs");
const fixtureCwd = mkdtempSync(join(tmpdir(), "loehrning-env-contract-"));

// Every variable validate-env reads, plus the two build-context signals. We
// strip all of them from a copy of the parent env before applying a fixture, so
// the test is deterministic whether it runs locally or in CI (where CI=true is
// set by default and would otherwise leak into the "local dev" cases).
const CONTROLLED_KEYS = [
  "CI",
  "E2E_AUTH_LIVE",
  "LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME",
  "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
  "LOEHRNING_VALIDATION_PROFILE",
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
  "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF",
  "RELEASE_VALIDATION",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_DPA_CONFIRMED_AT",
  "VERCEL_TELEMETRY_ENABLED",
  "VERCEL_TDDDG_ASSESSMENT_AT",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "SUPABASE_REGION",
  "SUPABASE_DPA_CONFIRMED_AT",
  "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
  "SUPABASE_CAPTCHA_CONFIRMED_AT",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
  "FEEDBACK_ENABLED",
  "FEEDBACK_RETENTION_CRON_CONFIRMED_AT",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SENTRY_DSN",
  "SENTRY_AUTH_TOKEN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_DPA_CONFIRMED_AT",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_RETENTION_DAYS",
  "AI_NATIVE_PRACTICE_ENABLED",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_DPA_CONFIRMED_AT",
  "ANTHROPIC_RETENTION_DAYS",
];

function runValidateEnv(overrides) {
  const env = { ...process.env };
  for (const key of CONTROLLED_KEYS) {
    delete env[key];
  }
  Object.assign(env, overrides);
  return spawnSync(process.execPath, [validateEnvScript], {
    cwd: fixtureCwd,
    encoding: "utf8",
    env,
  });
}

function combined(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

// A non-canonical public origin, an obviously fake value that trips the
// hardcoded-origin guard (validate-env HARDCODED_ORIGIN is https://loehrning.ai).
const BAD_ORIGIN = "https://preview-branch.example.com";
const PUBLIC_KEY_FIXTURE =
  "sb_publishable_abcdefghijklmnopqrstuv_12345678";
const PRIVILEGED_KEY_FIXTURE = [
  "sb",
  "secret",
  "abcdefghijklmnopqrstuv",
  "12345678",
].join("_");
const RATE_LIMIT_HMAC_SECRET_FIXTURE = `rlh1_${"a".repeat(64)}`;

function legacySupabaseJwt(role) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({ role }),
    Buffer.alloc(32, 0xa5).toString("base64url"),
  ].join(".");
}

function completeSupabase(overrides = {}) {
  return {
    CI: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    SUPABASE_SERVICE_ROLE_KEY: PRIVILEGED_KEY_FIXTURE,
    RATE_LIMIT_HMAC_SECRET: RATE_LIMIT_HMAC_SECRET_FIXTURE,
    SUPABASE_REGION: "eu-central-1",
    SUPABASE_DPA_CONFIRMED_AT: "2026-07-01",
    ...overrides,
  };
}

function completeMagicLinkSupabase(overrides = {}) {
  return completeSupabase({
    SUPABASE_CAPTCHA_CONFIRMED_AT: "2026-07-01",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAFakeProductionKey",
    TURNSTILE_CONFIGURATION_CONFIRMED_AT: "2026-07-01",
    ...overrides,
  });
}

function main() {
  // A. bad PREVIEW env now FAILS the build (the core release hardening widening) --------
  const badPreview = runValidateEnv({
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SITE_URL: BAD_ORIGIN,
  });
  assert.equal(
    badPreview.status,
    1,
    `bad preview env must fail the build (exit 1)\n${combined(badPreview)}`,
  );

  // B. bad CI env (no VERCEL_ENV) also FAILS. Uses a distinct error branch: two
  //    Supabase URLs that disagree. Proves CI alone gates the build.
  const badCI = runValidateEnv({
    CI: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    SUPABASE_URL: "https://bbbbbbbbbbbb.supabase.co",
  });
  assert.equal(
    badCI.status,
    1,
    `bad CI env must fail the build (exit 1)\n${combined(badCI)}`,
  );

  const localRedirectCapabilityInCI = runValidateEnv({
    CI: "true",
    LOEHRNING_LOCAL_VERIFICATION_ORIGIN: "http://localhost:3311",
  });
  assert.equal(
    localRedirectCapabilityInCI.status,
    1,
    `local redirect authority must fail a gated build\n${combined(localRedirectCapabilityInCI)}`,
  );
  assert.match(
    combined(localRedirectCapabilityInCI),
    /Local verification redirect authority is forbidden/,
  );

  // C. bad PRODUCTION env still FAILS (regression guard for the original
  //    behaviour). Uses the AI-gate error branch: flag on, key absent.
  const badProd = runValidateEnv({
    VERCEL_ENV: "production",
    AI_NATIVE_PRACTICE_ENABLED: "true",
  });
  assert.equal(
    badProd.status,
    1,
    `bad production env must fail the build (exit 1)\n${combined(badProd)}`,
  );

  const anthropicWithoutDurableLimiter = runValidateEnv({
    CI: "true",
    AI_NATIVE_PRACTICE_ENABLED: "true",
    ANTHROPIC_API_KEY: "sk-ant-obviously-fake",
    ANTHROPIC_DPA_CONFIRMED_AT: "2026-07-01",
    ANTHROPIC_RETENTION_DAYS: "30",
  });
  assert.equal(
    anthropicWithoutDurableLimiter.status,
    1,
    `Anthropic cannot be enabled without its production quota backend\n${combined(anthropicWithoutDurableLimiter)}`,
  );
  assert.match(
    combined(anthropicWithoutDurableLimiter),
    /complete Supabase configuration/,
  );

  // D. bad LOCAL DEV env stays LENIENT: exits 0 but still PRINTS the error, so
  //    an engineer without a full env is not blocked.
  const badLocal = runValidateEnv({
    NEXT_PUBLIC_SITE_URL: BAD_ORIGIN,
  });
  assert.equal(
    badLocal.status,
    0,
    `local dev with bad env must stay lenient (exit 0)\n${combined(badLocal)}`,
  );
  assert.match(
    combined(badLocal),
    /ERROR/,
    "local dev run must still print the error even though it exits 0",
  );

  for (const [credentialName, credentialFixture] of [
    ["SENTRY_AUTH_TOKEN", { SENTRY_AUTH_TOKEN: "obviously-fake" }],
    [
      "SUPABASE_SERVICE_ROLE_KEY",
      { SUPABASE_SERVICE_ROLE_KEY: PRIVILEGED_KEY_FIXTURE },
    ],
    ["ANTHROPIC_API_KEY", { ANTHROPIC_API_KEY: "sk-ant-obviously-fake" }],
  ]) {
    const credentialBearingLocalBuild = runValidateEnv(credentialFixture);
    assert.equal(
      credentialBearingLocalBuild.status,
      1,
      `${credentialName} must make invalid local validation fail\n${combined(credentialBearingLocalBuild)}`,
    );
    assert.match(
      combined(credentialBearingLocalBuild),
      /credential-bearing local build/,
    );
    assert.match(combined(credentialBearingLocalBuild), new RegExp(credentialName));
  }

  // F. A partially configured provider fails closed in CI instead of exposing
  //    account or feedback UI backed by an incomplete runtime.
  const partialSupabase = runValidateEnv({
    CI: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  });
  assert.equal(
    partialSupabase.status,
    1,
    `partial Supabase config must fail CI\n${combined(partialSupabase)}`,
  );
  assert.match(combined(partialSupabase), /partially configured/i);

  for (const [orphanName, orphanFixture] of [
    ["SUPABASE_REGION", { SUPABASE_REGION: "eu-central-1" }],
    [
      "SUPABASE_DPA_CONFIRMED_AT",
      { SUPABASE_DPA_CONFIRMED_AT: "2026-07-01" },
    ],
    [
      "RATE_LIMIT_HMAC_SECRET",
      { RATE_LIMIT_HMAC_SECRET: RATE_LIMIT_HMAC_SECRET_FIXTURE },
    ],
    [
      "SUPABASE_CAPTCHA_CONFIRMED_AT",
      { SUPABASE_CAPTCHA_CONFIRMED_AT: "2026-07-01" },
    ],
    [
      "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
      { SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT: "2026-08-08" },
    ],
    [
      "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
      { TURNSTILE_CONFIGURATION_CONFIRMED_AT: "2026-07-01" },
    ],
    [
      "ANTHROPIC_DPA_CONFIRMED_AT",
      { ANTHROPIC_DPA_CONFIRMED_AT: "2026-07-01" },
    ],
    ["ANTHROPIC_RETENTION_DAYS", { ANTHROPIC_RETENTION_DAYS: "30" }],
    [
      "FEEDBACK_RETENTION_CRON_CONFIRMED_AT",
      { FEEDBACK_RETENTION_CRON_CONFIRMED_AT: "2026-07-01" },
    ],
    [
      "VERCEL_DPA_CONFIRMED_AT",
      { VERCEL_DPA_CONFIRMED_AT: "2026-07-01" },
    ],
    [
      "VERCEL_TDDDG_ASSESSMENT_AT",
      { VERCEL_TDDDG_ASSESSMENT_AT: "2026-07-01" },
    ],
  ]) {
    const orphanedProviderVariable = runValidateEnv({
      CI: "true",
      ...orphanFixture,
    });
    assert.equal(
      orphanedProviderVariable.status,
      1,
      `${orphanName} must not survive without its provider group\n${combined(orphanedProviderVariable)}`,
    );
    assert.match(
      combined(orphanedProviderVariable),
      new RegExp(orphanName),
    );
  }

  for (const [flagName, invalidValue] of [
    ["AI_NATIVE_PRACTICE_ENABLED", "yes"],
    ["VERCEL_TELEMETRY_ENABLED", "1"],
  ]) {
    const invalidProviderFlag = runValidateEnv({
      CI: "true",
      [flagName]: invalidValue,
    });
    assert.equal(
      invalidProviderFlag.status,
      1,
      `${flagName} must reject ambiguous boolean syntax\n${combined(invalidProviderFlag)}`,
    );
    assert.match(combined(invalidProviderFlag), /exactly true or false/);
  }

  const leakedLiveAuthCredentials = runValidateEnv({
    CI: "true",
    SIMPLIFIED_SUPABASE_TEST_EMAIL: "e2e@example.test",
  });
  assert.equal(
    leakedLiveAuthCredentials.status,
    1,
    combined(leakedLiveAuthCredentials),
  );
  assert.match(
    combined(leakedLiveAuthCredentials),
    /Test-only live-auth variables are forbidden/,
  );

  const liveAuthE2E = runValidateEnv({
    CI: "true",
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  });
  assert.equal(
    liveAuthE2E.status,
    0,
    `dedicated live-auth E2E profile must not require a service-role key\n${combined(liveAuthE2E)}`,
  );
  assert.match(combined(liveAuthE2E), /live-auth E2E/);

  const providerFreeMaskedLiveAuthE2E = runValidateEnv({
    CI: "true",
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    AI_NATIVE_PRACTICE_ENABLED: "",
    FEEDBACK_ENABLED: "",
    NEXT_PUBLIC_APP_URL: "",
    SENTRY_AUTH_TOKEN: "",
    SENTRY_ORG: "",
    SENTRY_PROJECT: "",
    VERCEL: "",
  });
  assert.equal(
    providerFreeMaskedLiveAuthE2E.status,
    0,
    `explicit empty provider masks must behave as absent\n${combined(providerFreeMaskedLiveAuthE2E)}`,
  );

  const unsafeLiveAuthE2E = runValidateEnv({
    CI: "true",
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    SUPABASE_SERVICE_ROLE_KEY: PRIVILEGED_KEY_FIXTURE,
  });
  assert.equal(unsafeLiveAuthE2E.status, 1, combined(unsafeLiveAuthE2E));
  assert.match(combined(unsafeLiveAuthE2E), /privileged/);

  const providerPollutedLiveAuthE2E = runValidateEnv({
    CI: "true",
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    FEEDBACK_ENABLED: "false",
    SENTRY_ORG: "unexpected-test-telemetry",
  });
  assert.equal(
    providerPollutedLiveAuthE2E.status,
    1,
    combined(providerPollutedLiveAuthE2E),
  );
  assert.match(combined(providerPollutedLiveAuthE2E), /FEEDBACK_ENABLED/);
  assert.match(combined(providerPollutedLiveAuthE2E), /SENTRY_ORG/);

  const deployedLiveAuthE2E = runValidateEnv({
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    VERCEL: "1",
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
  });
  assert.equal(deployedLiveAuthE2E.status, 1, combined(deployedLiveAuthE2E));
  assert.match(combined(deployedLiveAuthE2E), /forbidden in Vercel/);

  // G. A complete Supabase fixture still fails until its EU location and DPA
  //    attestation are explicit.
  const unverifiedSupabase = runValidateEnv({
    CI: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    SUPABASE_SERVICE_ROLE_KEY: PRIVILEGED_KEY_FIXTURE,
  });
  assert.equal(unverifiedSupabase.status, 1, combined(unverifiedSupabase));
  assert.match(combined(unverifiedSupabase), /SUPABASE_REGION/);
  assert.match(combined(unverifiedSupabase), /SUPABASE_DPA_CONFIRMED_AT/);

  const accountWithoutSignInMethods = runValidateEnv(completeSupabase());
  assert.equal(
    accountWithoutSignInMethods.status,
    0,
    `core account configuration must not require either optional sign-in method\n${combined(accountWithoutSignInMethods)}`,
  );

  const partialMagicLink = runValidateEnv(
    completeSupabase({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAFakeProductionKey",
    }),
  );
  assert.equal(partialMagicLink.status, 1, combined(partialMagicLink));
  assert.match(combined(partialMagicLink), /Magic-link authentication is partially configured/);
  assert.match(combined(partialMagicLink), /SUPABASE_CAPTCHA_CONFIRMED_AT/);
  assert.match(combined(partialMagicLink), /TURNSTILE_CONFIGURATION_CONFIRMED_AT/);

  const completeMagicLink = runValidateEnv(completeMagicLinkSupabase());
  assert.equal(
    completeMagicLink.status,
    0,
    `complete protected Magic-link configuration must pass\n${combined(completeMagicLink)}`,
  );

  const googleOnlySignIn = runValidateEnv(
    completeSupabase({
      SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT: "2026-08-08",
    }),
  );
  assert.equal(
    googleOnlySignIn.status,
    0,
    `Google OAuth attestation must not require Turnstile\n${combined(googleOnlySignIn)}`,
  );

  for (const googleAttestation of ["not-a-date", "2999-01-01"]) {
    const invalidGoogleOAuth = runValidateEnv(
      completeSupabase({
        SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT: googleAttestation,
      }),
    );
    assert.equal(invalidGoogleOAuth.status, 1, combined(invalidGoogleOAuth));
    assert.match(
      combined(invalidGoogleOAuth),
      /SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT/,
    );
  }

  for (const malformedOrigin of [
    " https://aaaaaaaaaaaa.supabase.co",
    "https://aaaaaaaaaaaa.supabase.co\n",
    `https://${"a".repeat(2048)}.supabase.co`,
  ]) {
    const malformedSupabaseOrigin = runValidateEnv(
      completeSupabase({
        NEXT_PUBLIC_SUPABASE_URL: malformedOrigin,
      }),
    );
    assert.equal(
      malformedSupabaseOrigin.status,
      1,
      combined(malformedSupabaseOrigin),
    );
    assert.match(
      combined(malformedSupabaseOrigin),
      /exact, whitespace-free HTTPS origin no longer than 2048 characters/,
    );
  }

  const productionTurnstileTestKey = runValidateEnv(
    completeMagicLinkSupabase({
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_DPA_CONFIRMED_AT: "2026-07-01",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    }),
  );
  assert.equal(
    productionTurnstileTestKey.status,
    1,
    combined(productionTurnstileTestKey),
  );
  assert.match(
    combined(productionTurnstileTestKey),
    /test site keys are forbidden in production/,
  );

  const publicSecretKey = runValidateEnv(
    completeSupabase({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PRIVILEGED_KEY_FIXTURE,
    }),
  );
  assert.equal(publicSecretKey.status, 1, combined(publicSecretKey));
  assert.match(combined(publicSecretKey), /server-only Supabase secret key/);

  for (const malformedPublicKey of [
    "opaque-browser-key",
    "sb_publishable_too-short",
    ` ${PUBLIC_KEY_FIXTURE}`,
    "header.payload.signature",
  ]) {
    const malformedPublic = runValidateEnv(
      completeSupabase({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: malformedPublicKey,
      }),
    );
    assert.equal(
      malformedPublic.status,
      1,
      `malformed public key must fail: ${malformedPublicKey}\n${combined(malformedPublic)}`,
    );
    assert.match(
      combined(malformedPublic),
      /exact sb_publishable_<22-char-random>_<8-char-checksum>/,
    );
  }

  for (const malformedServiceKey of [
    "opaque-service-key",
    "sb_secret_too-short",
    `${PRIVILEGED_KEY_FIXTURE} `,
    legacySupabaseJwt("anon"),
  ]) {
    const malformedService = runValidateEnv(
      completeSupabase({
        SUPABASE_SERVICE_ROLE_KEY: malformedServiceKey,
      }),
    );
    assert.equal(
      malformedService.status,
      1,
      `malformed service key must fail: ${malformedServiceKey}\n${combined(malformedService)}`,
    );
    assert.match(
      combined(malformedService),
      /exact sb_secret_<22-char-random>_<8-char-checksum>/,
    );
  }

  const missingRateLimitSecret = runValidateEnv(
    completeSupabase({ RATE_LIMIT_HMAC_SECRET: "" }),
  );
  assert.equal(
    missingRateLimitSecret.status,
    1,
    combined(missingRateLimitSecret),
  );
  assert.match(combined(missingRateLimitSecret), /RATE_LIMIT_HMAC_SECRET/);

  for (const malformedRateLimitSecret of [
    "rlh1_deadbeef",
    `rlh1_${"A".repeat(64)}`,
    "a".repeat(64),
    `${RATE_LIMIT_HMAC_SECRET_FIXTURE} `,
  ]) {
    const invalidRateLimitSecret = runValidateEnv(
      completeSupabase({
        RATE_LIMIT_HMAC_SECRET: malformedRateLimitSecret,
      }),
    );
    assert.equal(
      invalidRateLimitSecret.status,
      1,
      `malformed limiter secret must fail\n${combined(invalidRateLimitSecret)}`,
    );
    assert.match(
      combined(invalidRateLimitSecret),
      /rlh1_ prefix followed by 64 lowercase hexadecimal characters/,
    );
  }

  const equalPublicAndServiceKey = runValidateEnv(
    completeSupabase({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PRIVILEGED_KEY_FIXTURE,
      SUPABASE_SERVICE_ROLE_KEY: PRIVILEGED_KEY_FIXTURE,
    }),
  );
  assert.equal(
    equalPublicAndServiceKey.status,
    1,
    combined(equalPublicAndServiceKey),
  );
  assert.match(combined(equalPublicAndServiceKey), /equals SUPABASE_SERVICE_ROLE_KEY/);

  const publicServiceRoleJwt = runValidateEnv(
    completeSupabase({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        legacySupabaseJwt("service_role"),
    }),
  );
  assert.equal(publicServiceRoleJwt.status, 1, combined(publicServiceRoleJwt));
  assert.match(combined(publicServiceRoleJwt), /required anon role/);

  const wrongServiceRole = runValidateEnv(
    completeSupabase({
      SUPABASE_SERVICE_ROLE_KEY: legacySupabaseJwt("anon"),
    }),
  );
  assert.equal(wrongServiceRole.status, 1, combined(wrongServiceRole));
  assert.match(combined(wrongServiceRole), /legacy JWT with role service_role/);

  const legacyKeyPair = runValidateEnv(
    completeSupabase({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacySupabaseJwt("anon"),
      SUPABASE_SERVICE_ROLE_KEY: legacySupabaseJwt("service_role"),
    }),
  );
  assert.equal(
    legacyKeyPair.status,
    0,
    `correctly separated legacy JWT roles must pass\n${combined(legacyKeyPair)}`,
  );

  // H. Every configured provider passes only with non-secret attestations.
  const verifiedProviders = runValidateEnv({
    CI: "true",
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_DPA_CONFIRMED_AT: "2026-07-01",
    VERCEL_TELEMETRY_ENABLED: "true",
    VERCEL_TDDDG_ASSESSMENT_AT: "2026-07-01",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    SUPABASE_SERVICE_ROLE_KEY: PRIVILEGED_KEY_FIXTURE,
    RATE_LIMIT_HMAC_SECRET: RATE_LIMIT_HMAC_SECRET_FIXTURE,
    SUPABASE_REGION: "eu-central-1",
    SUPABASE_DPA_CONFIRMED_AT: "2026-07-01",
    SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT: "2026-08-08",
    SUPABASE_CAPTCHA_CONFIRMED_AT: "2026-07-01",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAFakeProductionKey",
    TURNSTILE_CONFIGURATION_CONFIRMED_AT: "2026-07-01",
    SENTRY_DSN: "https://abcdef0123456789@o1.ingest.de.sentry.io/1234",
    SENTRY_DPA_CONFIRMED_AT: "2026-07-01",
    SENTRY_RETENTION_DAYS: "30",
    AI_NATIVE_PRACTICE_ENABLED: "true",
    ANTHROPIC_API_KEY: "sk-ant-obviously-fake",
    ANTHROPIC_DPA_CONFIRMED_AT: "2026-07-01",
    ANTHROPIC_RETENTION_DAYS: "30",
  });
  assert.equal(
    verifiedProviders.status,
    0,
    `fully attested provider config must pass\n${combined(verifiedProviders)}`,
  );
  assert.match(combined(verifiedProviders), /Environment validation passed/);

  // I. Sentry retention is not guessed from a provider default.
  const sentryWithoutRetention = runValidateEnv({
    CI: "true",
    SENTRY_DSN: "https://abcdef0123456789@o1.ingest.sentry.io/1234",
    SENTRY_DPA_CONFIRMED_AT: "2026-07-01",
  });
  assert.equal(
    sentryWithoutRetention.status,
    1,
    combined(sentryWithoutRetention),
  );
  assert.match(combined(sentryWithoutRetention), /SENTRY_RETENTION_DAYS/);

  const feedbackWithoutRetentionJob = runValidateEnv({
    CI: "true",
    FEEDBACK_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLIC_KEY_FIXTURE,
    SUPABASE_SERVICE_ROLE_KEY: PRIVILEGED_KEY_FIXTURE,
    RATE_LIMIT_HMAC_SECRET: RATE_LIMIT_HMAC_SECRET_FIXTURE,
    SUPABASE_REGION: "eu-central-1",
    SUPABASE_DPA_CONFIRMED_AT: "2026-07-01",
  });
  assert.equal(
    feedbackWithoutRetentionJob.status,
    1,
    combined(feedbackWithoutRetentionJob),
  );
  assert.match(
    combined(feedbackWithoutRetentionJob),
    /FEEDBACK_RETENTION_CRON_CONFIRMED_AT/,
  );

  const anthropicWithoutRetention = runValidateEnv({
    CI: "true",
    ANTHROPIC_API_KEY: "sk-ant-obviously-fake",
    ANTHROPIC_DPA_CONFIRMED_AT: "2026-07-01",
  });
  assert.equal(
    anthropicWithoutRetention.status,
    1,
    combined(anthropicWithoutRetention),
  );
  assert.match(combined(anthropicWithoutRetention), /ANTHROPIC_RETENTION_DAYS/);

  // J. A future date is not a completed attestation.
  const futureAnthropicDpa = runValidateEnv({
    CI: "true",
    ANTHROPIC_API_KEY: "sk-ant-obviously-fake",
    ANTHROPIC_DPA_CONFIRMED_AT: "2999-01-01",
  });
  assert.equal(futureAnthropicDpa.status, 1, combined(futureAnthropicDpa));
  assert.match(combined(futureAnthropicDpa), /ANTHROPIC_DPA_CONFIRMED_AT/);

  // K. The local release command is strict even without CI or Vercel signals.
  const badLocalRelease = runValidateEnv({
    RELEASE_VALIDATION: "1",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
  });
  assert.equal(
    badLocalRelease.status,
    1,
    `local release validation must fail on provider misconfiguration\n${combined(badLocalRelease)}`,
  );

  // L. Supabase URLs are security boundaries and must be HTTPS origins.
  const insecureSupabase = runValidateEnv({
    CI: "true",
    NEXT_PUBLIC_SUPABASE_URL: "http://aaaaaaaaaaaa.supabase.co",
  });
  assert.equal(insecureSupabase.status, 1, combined(insecureSupabase));
  assert.match(combined(insecureSupabase), /valid HTTPS origin/);

  const malformedSupabase = runValidateEnv({
    CI: "true",
    SUPABASE_URL: "not-a-url",
  });
  assert.equal(malformedSupabase.status, 1, combined(malformedSupabase));
  assert.match(combined(malformedSupabase), /valid HTTPS origin/);

  const credentialedSupabase = runValidateEnv({
    CI: "true",
    SUPABASE_URL: "https://user:pass@aaaaaaaaaaaa.supabase.co/path?x=1",
  });
  assert.equal(credentialedSupabase.status, 1, combined(credentialedSupabase));
  assert.match(combined(credentialedSupabase), /valid HTTPS origin/);

  const externalSupabaseOrigin = runValidateEnv(
    completeSupabase({
      NEXT_PUBLIC_SUPABASE_URL: "https://attacker.example",
      SUPABASE_URL: "https://attacker.example",
    }),
  );
  assert.equal(
    externalSupabaseOrigin.status,
    1,
    `non-Supabase credential destinations must fail\n${combined(externalSupabaseOrigin)}`,
  );
  assert.match(combined(externalSupabaseOrigin), /Supabase project origin/);

  const nonDefaultSupabasePort = runValidateEnv(
    completeSupabase({
      NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co:444",
      SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co:444",
    }),
  );
  assert.equal(
    nonDefaultSupabasePort.status,
    1,
    `non-default Supabase ports must fail\n${combined(nonDefaultSupabasePort)}`,
  );
  assert.match(combined(nonDefaultSupabasePort), /default HTTPS port/);

  const uploadOnlySentry = runValidateEnv({
    CI: "true",
    SENTRY_AUTH_TOKEN: "obviously-fake",
    SENTRY_ORG: "fake-org",
    SENTRY_PROJECT: "fake-project",
  });
  assert.equal(uploadOnlySentry.status, 1, combined(uploadOnlySentry));
  assert.match(
    combined(uploadOnlySentry),
    /neither SENTRY_DSN nor NEXT_PUBLIC_SENTRY_DSN/,
  );

  const partialSentryUpload = runValidateEnv({
    CI: "true",
    SENTRY_DSN: "https://abcdef0123456789@o1.ingest.sentry.io/1234",
    SENTRY_AUTH_TOKEN: "obviously-fake",
    SENTRY_DPA_CONFIRMED_AT: "2026-07-01",
    SENTRY_RETENTION_DAYS: "30",
  });
  assert.equal(partialSentryUpload.status, 1, combined(partialSentryUpload));
  assert.match(combined(partialSentryUpload), /source-map upload is partially configured/);

  const mismatchedSentryDsns = runValidateEnv({
    CI: "true",
    SENTRY_DSN: "https://abcdef0123456789@o1.ingest.sentry.io/1234",
    NEXT_PUBLIC_SENTRY_DSN:
      "https://fedcba9876543210@o1.ingest.sentry.io/5678",
    SENTRY_DPA_CONFIRMED_AT: "2026-07-01",
    SENTRY_RETENTION_DAYS: "30",
  });
  assert.equal(mismatchedSentryDsns.status, 1, combined(mismatchedSentryDsns));
  assert.match(combined(mismatchedSentryDsns), /same Sentry project/);

  // E. GOOD preview env PASSES: correct canonical origin, no misconfig. Proves
  //    the widened gate does not fail a correctly-configured preview build.
  const goodPreview = runValidateEnv({
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SITE_URL: "https://loehrning.ai",
  });
  assert.equal(
    goodPreview.status,
    0,
    `good preview env must pass (exit 0)\n${combined(goodPreview)}`,
  );
  assert.match(
    combined(goodPreview),
    /Environment validation passed/,
    "good preview run must report that validation passed",
  );

  // F. Production Supabase Auth without magic-link Turnstile FAILS. Preview
  //    is allowed to omit Turnstile (hostname allowlists cannot wildcard
  //    *.vercel.app); production has no such excuse.
  const prodAccountWithoutMagicLink = runValidateEnv(
    completeSupabase({ VERCEL_ENV: "production" }),
  );
  assert.equal(
    prodAccountWithoutMagicLink.status,
    1,
    `production account config without magic link must fail\n${combined(prodAccountWithoutMagicLink)}`,
  );
  assert.match(
    combined(prodAccountWithoutMagicLink),
    /magic-link Turnstile protection/,
  );

  // G. The identical config PASSES in preview — the asymmetry is deliberate,
  //    not an oversight this gate should ever start blocking.
  const previewAccountWithoutMagicLink = runValidateEnv(
    completeSupabase({ VERCEL_ENV: "preview" }),
  );
  assert.equal(
    previewAccountWithoutMagicLink.status,
    0,
    `preview account config without magic link must pass\n${combined(previewAccountWithoutMagicLink)}`,
  );

  // H. Production WITH magic link configured still PASSES (regression guard:
  //    the new check must not fire once Turnstile is actually present).
  const prodAccountWithMagicLink = runValidateEnv(
    completeMagicLinkSupabase({ VERCEL_ENV: "production" }),
  );
  assert.equal(
    prodAccountWithMagicLink.status,
    0,
    `production account config with magic link must pass\n${combined(prodAccountWithMagicLink)}`,
  );

  const deploymentDocs = readFileSync(
    join(here, "..", "..", "docs", "deployment.md"),
    "utf8",
  );
  assert.match(deploymentDocs, /`ANTHROPIC_DPA_CONFIRMED_AT`/);
  assert.match(deploymentDocs, /`ANTHROPIC_RETENTION_DAYS`/);
  assert.match(deploymentDocs, /`RATE_LIMIT_HMAC_SECRET`/);
  assert.match(deploymentDocs, /`SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT`/);
  assert.match(deploymentDocs, /one-time quota reset/i);
  assert.doesNotMatch(deploymentDocs, /budget attestation vars/i);

  console.log("validate-env gate test: ALL ASSERTIONS PASSED");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  rmSync(fixtureCwd, { force: true, recursive: true });
}
