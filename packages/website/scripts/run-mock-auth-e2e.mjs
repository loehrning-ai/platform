#!/usr/bin/env node

/**
 * Mocked-session e2e tier.
 *
 * Runs the .authed.spec.ts suite against a build that carries ONLY the three
 * public Supabase variables, with the endpoints the server calls during SSR
 * served in-process by tests/e2e/fixtures/mock-auth-backend.cjs. No credential,
 * no network, no external project - so this runs in ordinary CI, unlike the
 * credentialed live tier.
 *
 * WHAT THIS TIER PROVES: the session cookie reaches the server, @supabase/ssr
 * forwards the bearer token and apikey to the outbound call, and the signed-in
 * /konto DOM renders from the resulting user.
 *
 * WHAT IT DOES NOT PROVE: nothing about real authentication. The mock never
 * verifies a JWT signature. Token refresh, expiry, RLS, logout revocation,
 * magic-link/OTP and Turnstile all remain covered only by the live tier.
 *
 * ON E2E_AUTH_LIVE=1 BELOW: that flag is the env validator's name for "this is
 * a public-config-only e2e build" (validate-env.mjs gates the live-auth-e2e
 * profile on it, and build-freshness.mjs pins it into the matching receipt).
 * The build is byte-identical for both auth tiers - only the backend differs -
 * so the mocked tier reuses that build identity rather than adding a second,
 * near-duplicate profile to a fail-closed validator. It is set for the BUILD
 * only; the Playwright run below sets E2E_AUTH_MOCK instead, so the live
 * projects never come into existence and no credential is ever requested.
 */

import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { minimalVerificationEnvironment } from "../../../scripts/environment-policy.mjs";
import { verifyBuildReceipt } from "./build-freshness.mjs";

const arguments_ = process.argv.slice(2);
if (
  arguments_.some((argument) => argument !== "--built") ||
  arguments_.filter((argument) => argument === "--built").length > 1
) {
  console.error("Usage: node scripts/run-mock-auth-e2e.mjs [--built]");
  process.exit(2);
}
const reuseBuild = arguments_.includes("--built");

// Fictional but well-formed. The host matches the <ref>.supabase.co shape the
// env validator requires, the key matches the publishable-key format, and the
// Turnstile value is Cloudflare's public always-passes test key. None of them
// address a real project, and the URL is the same one session-mock.ts already
// seeds cookies for, so the cookie name the server derives matches byte for
// byte.
const MOCK_PUBLIC_ENVIRONMENT = {
  NEXT_PUBLIC_SUPABASE_URL: "https://e2e-mock-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    "sb_publishable_e2emockpublishablekey1_a1b2c3d4",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
};

const baseEnvironment = {
  ...minimalVerificationEnvironment(process.env),
  NEXT_TELEMETRY_DISABLED: "1",
};

// E2E_PORT is deliberately excluded from the receipt: it selects the local test
// server's port and must not change the build identity, or a run on a different
// port would fail its own postflight comparison.
const receiptEnvironment = {
  ...baseEnvironment,
  ...MOCK_PUBLIC_ENVIRONMENT,
  E2E_AUTH_LIVE: "1",
  E2E_PORT: "",
  LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
};

// No temp-directory isolation here, unlike the live runner: this tier holds no
// credential and writes the ordinary in-repo storageState, so the default
// bounded relative artifact paths apply.

function verifyPinnedBuild() {
  return verifyBuildReceipt({
    environment: receiptEnvironment,
    mode: "live-auth",
  });
}

function run(label, commandArguments, environment) {
  console.log(`[mock-auth-e2e] ${label}`);
  const result = spawnSync("bun", commandArguments, {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(
      `${label} failed with ${
        result.signal ? `signal ${result.signal}` : `exit ${result.status}`
      }.`,
    );
    error.exitStatus = result.status ?? 1;
    throw error;
  }
}

// The Playwright run never sets E2E_AUTH_LIVE, so RUN_LIVE_AUTH stays false and
// the credentialed projects are not defined at all.
const playwrightEnvironment = {
  ...baseEnvironment,
  ...MOCK_PUBLIC_ENVIRONMENT,
  E2E_AUTH_MOCK: "1",
  E2E_SERVER_MODE: "production",
  ...(process.env.E2E_PORT ? { E2E_PORT: process.env.E2E_PORT } : {}),
};

let preflightReceipt;
try {
  if (!reuseBuild) {
    run("public-config-only build", ["run", "build"], receiptEnvironment);
  }
  preflightReceipt = verifyPinnedBuild();

  // ONE invocation, relying on the project dependency to run auth-mock-setup
  // first. The live runner splits setup and journey into two processes so the
  // journey never sees the credentials; this tier has none to hide, and
  // splitting would break it anyway - global-teardown deletes the static
  // storageState whenever E2E_AUTH_LIVE is not "1", so a second process would
  // find no session file.
  run(
    "mocked-session konto DOM",
    ["run", "playwright", "test", "--project=konto-dom-mocked"],
    playwrightEnvironment,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode =
    error && typeof error === "object" && "exitStatus" in error
      ? Number(error.exitStatus)
      : 1;
} finally {
  if (preflightReceipt) {
    try {
      const postflightReceipt = verifyPinnedBuild();
      if (!isDeepStrictEqual(preflightReceipt, postflightReceipt)) {
        throw new Error(
          "Mock-auth production build identity changed while the gate was running.",
        );
      }
    } catch (error) {
      console.error(
        `[mock-auth-e2e] postflight failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      process.exitCode = 1;
    }
  }
}
