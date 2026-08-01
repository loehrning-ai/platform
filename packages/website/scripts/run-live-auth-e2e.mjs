#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  minimalVerificationEnvironment,
  pickEnvironment,
} from "../../../scripts/environment-policy.mjs";
import { verifyBuildReceipt } from "./build-freshness.mjs";
import {
  LIVE_AUTH_ENV_NAMES,
  validateLiveAuthEnv,
} from "./validate-e2e-auth-env.mjs";

const arguments_ = process.argv.slice(2);
const LIVE_AUTH_DIRECTORY_NAME =
  /^loehrning-live-auth-[A-Za-z0-9_-]{6,80}$/;
const STALE_DIRECTORY_AGE_MS = 24 * 60 * 60 * 1_000;
if (
  arguments_.some((argument) => argument !== "--built") ||
  arguments_.filter((argument) => argument === "--built").length > 1
) {
  console.error("Usage: node scripts/run-live-auth-e2e.mjs [--built]");
  process.exit(2);
}
const reuseBuild = arguments_.includes("--built");
const baseEnvironment = {
  ...minimalVerificationEnvironment(process.env),
  NEXT_TELEMETRY_DISABLED: "1",
};
const liveCredentials = pickEnvironment(process.env, LIVE_AUTH_ENV_NAMES);

try {
  validateLiveAuthEnv(liveCredentials);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function removeStaleOwnedDirectories() {
  const temporaryRoot = path.resolve(tmpdir());
  const currentUserId =
    typeof process.getuid === "function" ? process.getuid() : null;
  for (const entry of readdirSync(temporaryRoot, { withFileTypes: true })) {
    if (
      !entry.isDirectory() ||
      !LIVE_AUTH_DIRECTORY_NAME.test(entry.name)
    ) {
      continue;
    }
    const candidate = path.join(temporaryRoot, entry.name);
    try {
      const metadata = lstatSync(candidate);
      if (
        !metadata.isDirectory() ||
        metadata.isSymbolicLink() ||
        (currentUserId !== null && metadata.uid !== currentUserId) ||
        (metadata.mode & 0o077) !== 0 ||
        Date.now() - metadata.mtimeMs < STALE_DIRECTORY_AGE_MS
      ) {
        continue;
      }
      rmSync(candidate, { recursive: true, force: true });
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "ENOENT"
      ) {
        throw error;
      }
    }
  }
}

removeStaleOwnedDirectories();
const temporaryDirectory = mkdtempSync(
  path.join(tmpdir(), "loehrning-live-auth-"),
);
chmodSync(temporaryDirectory, 0o700);
const storageStatePath = path.join(temporaryDirectory, "user.json");
const reporterEnvironment = {
  PLAYWRIGHT_BLOB_OUTPUT_DIR: path.join(temporaryDirectory, "blob-report"),
  PLAYWRIGHT_HTML_OPEN: "never",
  PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(temporaryDirectory, "playwright-report"),
};
const publicEnvironment = pickEnvironment(liveCredentials, [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
]);
const receiptEnvironment = {
  ...baseEnvironment,
  ...publicEnvironment,
  E2E_AUTH_LIVE: "1",
  LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
};

function verifyPinnedBuild() {
  return verifyBuildReceipt({
    environment: receiptEnvironment,
    mode: "live-auth",
  });
}

function run(label, commandArguments, environment) {
  console.log(`[live-auth-e2e] ${label}`);
  const result = spawnSync("bun", commandArguments, {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
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

let preflightReceipt;
try {
  if (!reuseBuild) {
    run("public-config-only build", ["run", "build"], receiptEnvironment);
  }
  preflightReceipt = verifyPinnedBuild();

  run(
    "credentialed session setup",
    [
      "run",
      "playwright",
      "test",
      "--output",
      path.join(temporaryDirectory, "setup-results"),
      "--project=auth-live-setup",
    ],
    {
      ...baseEnvironment,
      ...reporterEnvironment,
      ...liveCredentials,
      E2E_AUTH_LIVE: "1",
      E2E_AUTH_PRESERVE_STORAGE_STATE: "1",
      E2E_AUTH_STORAGE_STATE: storageStatePath,
      E2E_SERVER_MODE: "production",
    },
  );

  run(
    "credential-free authenticated journey",
    [
      "run",
      "playwright",
      "test",
      "--output",
      path.join(temporaryDirectory, "journey-results"),
      "--no-deps",
      "--project=authenticated-live",
    ],
    {
      ...baseEnvironment,
      ...reporterEnvironment,
      ...publicEnvironment,
      E2E_AUTH_LIVE: "1",
      E2E_AUTH_STORAGE_STATE: storageStatePath,
      E2E_SERVER_MODE: "production",
    },
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
          "Live-auth production build identity changed while the gate was running.",
        );
      }
    } catch (error) {
      console.error(
        `[live-auth-e2e] postflight failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      process.exitCode = 1;
    }
  }
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
