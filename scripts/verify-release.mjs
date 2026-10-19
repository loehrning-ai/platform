#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import {
  configuredApplicationEnvironment,
  providerFreeVerificationEnvironment,
} from "./environment-policy.mjs";
import { smokeArguments } from "./ci.mjs";
import { verifyBuildReceipt } from "../packages/website/scripts/build-freshness.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strictVerificationEnvironment = {
  ...providerFreeVerificationEnvironment(process.env),
  NEXT_TELEMETRY_DISABLED: "1",
  RELEASE_VALIDATION: "1",
};
// The build receipt hashes the loopback origin derived from E2E_SERVER_MODE and
// E2E_PORT, so the build and every gate after it must see the same two values
// (as `bun run ci:browser` does). The static and unit steps run without them.
const browserSource = {
  ...process.env,
  E2E_SERVER_MODE: "production",
  E2E_PORT: process.env.E2E_PORT ?? "3000",
};
const browserVerificationEnvironment = {
  ...providerFreeVerificationEnvironment(browserSource),
  E2E_SERVER_MODE: browserSource.E2E_SERVER_MODE,
  E2E_PORT: browserSource.E2E_PORT,
  NEXT_TELEMETRY_DISABLED: "1",
  RELEASE_VALIDATION: "1",
};
const strictConfiguredEnvironment = {
  ...configuredApplicationEnvironment(process.env),
  NEXT_TELEMETRY_DISABLED: "1",
  RELEASE_VALIDATION: "1",
};

const steps = [
  {
    label: "provider environment preflight",
    args: ["run", "--cwd", "packages/website", "validate-env"],
    configuredEnvironment: true,
  },
  {
    label: "static checks",
    args: ["run", "ci:static"],
  },
  {
    label: "unit tests",
    args: ["run", "ci:unit"],
  },
  {
    label: "provider-free production build",
    args: ["run", "--cwd", "packages/website", "build"],
    browserEnvironment: true,
    captureProviderFreeReceipt: true,
  },
  {
    label: "full Lighthouse performance gate",
    args: ["run", "lighthouse:release:built"],
    browserEnvironment: true,
    verifyProviderFreeReceipt: true,
  },
  {
    label: "server-log privacy probe",
    args: ["run", "--cwd", "packages/website", "test:server-log-privacy:built"],
    browserEnvironment: true,
    verifyProviderFreeReceipt: true,
  },
  {
    label: "browser smoke",
    args: ["run", "--cwd", "packages/website", "e2e:shard:built", ...smokeArguments()],
    browserEnvironment: true,
    verifyProviderFreeReceipt: true,
  },
  {
    label: "launch browser gate",
    args: ["run", "test:e2e:release:built"],
    browserEnvironment: true,
    verifyProviderFreeReceipt: true,
  },
  {
    label: "configured provider build",
    args: ["run", "--cwd", "packages/website", "build"],
    configuredEnvironment: true,
    verifyConfiguredReceipt: true,
    removeEnvironment: [
      "SENTRY_AUTH_TOKEN",
      "SENTRY_ORG",
      "SENTRY_PROJECT",
    ],
  },
];

let providerFreeReceipt = null;

for (const step of steps) {
  const environment = {
    ...(step.configuredEnvironment
      ? strictConfiguredEnvironment
      : step.browserEnvironment
        ? browserVerificationEnvironment
        : strictVerificationEnvironment),
  };
  for (const name of step.removeEnvironment ?? []) {
    delete environment[name];
  }

  console.log(`[verify:release] ${step.label}`);
  const result = spawnSync("bun", step.args, {
    cwd: ROOT,
    env: environment,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`[verify:release] ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (step.captureProviderFreeReceipt) {
    providerFreeReceipt = verifyBuildReceipt({ environment });
  }
  if (step.verifyProviderFreeReceipt) {
    const receipt = verifyBuildReceipt({ environment });
    if (
      providerFreeReceipt === null ||
      !isDeepStrictEqual(receipt, providerFreeReceipt)
    ) {
      console.error(
        "[verify:release] provider-free build identity changed between release stages",
      );
      process.exit(1);
    }
  }
  if (step.verifyConfiguredReceipt) {
    const receipt = verifyBuildReceipt({ environment });
    if (
      providerFreeReceipt === null ||
      receipt.fileCount !== providerFreeReceipt.fileCount ||
      receipt.inputDigest !== providerFreeReceipt.inputDigest ||
      !isDeepStrictEqual(receipt.toolchain, providerFreeReceipt.toolchain)
    ) {
      console.error(
        "[verify:release] source set or toolchain changed between provider-free proof and configured build",
      );
      process.exit(1);
    }
  }
}
