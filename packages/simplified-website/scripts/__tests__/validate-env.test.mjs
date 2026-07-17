#!/usr/bin/env node
// Fixture-based test for validate-env.mjs (regression coverage).
//
// Runs the real env-validation CLI with planted environments and asserts on the
// process exit code. It proves the widened gate: a bad env now fails preview and
// CI builds (not only production), while local dev stays lenient. Every planted
// value is obviously fake. Run with:
//   node scripts/__tests__/validate-env.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const validateEnvScript = join(here, "..", "validate-env.mjs");

// Every variable validate-env reads, plus the two build-context signals. We
// strip all of them from a copy of the parent env before applying a fixture, so
// the test is deterministic whether it runs locally or in CI (where CI=true is
// set by default and would otherwise leak into the "local dev" cases).
const CONTROLLED_KEYS = [
  "CI",
  "E2E_AUTH_LIVE",
  "LOEHRNING_VALIDATION_PROFILE",
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
  "SUPABASE_REGION",
  "SUPABASE_DPA_CONFIRMED_AT",
  "FEEDBACK_ENABLED",
  "FEEDBACK_RETENTION_CRON_CONFIRMED_AT",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_DPA_CONFIRMED_AT",
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

  // F. A partially configured provider fails closed in CI instead of exposing
  //    account or feedback UI backed by an incomplete runtime.
  const partialSupabase = runValidateEnv({
    CI: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
  });
  assert.equal(
    partialSupabase.status,
    1,
    `partial Supabase config must fail CI\n${combined(partialSupabase)}`,
  );
  assert.match(combined(partialSupabase), /partially configured/i);

  const liveAuthE2E = runValidateEnv({
    CI: "true",
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
  });
  assert.equal(
    liveAuthE2E.status,
    0,
    `dedicated live-auth E2E profile must not require a service-role key\n${combined(liveAuthE2E)}`,
  );
  assert.match(combined(liveAuthE2E), /live-auth E2E/);

  const unsafeLiveAuthE2E = runValidateEnv({
    CI: "true",
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
    SUPABASE_SERVICE_ROLE_KEY: "sb_service_role_fake",
  });
  assert.equal(unsafeLiveAuthE2E.status, 1, combined(unsafeLiveAuthE2E));
  assert.match(combined(unsafeLiveAuthE2E), /privileged/);

  const providerPollutedLiveAuthE2E = runValidateEnv({
    CI: "true",
    E2E_AUTH_LIVE: "1",
    LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
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
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
  });
  assert.equal(deployedLiveAuthE2E.status, 1, combined(deployedLiveAuthE2E));
  assert.match(combined(deployedLiveAuthE2E), /forbidden in Vercel/);

  // G. A complete Supabase fixture still fails until its EU location and DPA
  //    attestation are explicit.
  const unverifiedSupabase = runValidateEnv({
    CI: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    SUPABASE_URL: "https://aaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
    SUPABASE_SERVICE_ROLE_KEY: "sb_service_role_fake",
  });
  assert.equal(unverifiedSupabase.status, 1, combined(unverifiedSupabase));
  assert.match(combined(unverifiedSupabase), /SUPABASE_REGION/);
  assert.match(combined(unverifiedSupabase), /SUPABASE_DPA_CONFIRMED_AT/);

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
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
    SUPABASE_SERVICE_ROLE_KEY: "sb_service_role_fake",
    SUPABASE_REGION: "eu-central-1",
    SUPABASE_DPA_CONFIRMED_AT: "2026-07-01",
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
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake",
    SUPABASE_SERVICE_ROLE_KEY: "sb_service_role_fake",
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

  console.log("validate-env gate test: ALL ASSERTIONS PASSED");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
