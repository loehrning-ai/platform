#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import {
  configuredApplicationEnvironment,
  providerFreeVerificationEnvironment,
} from "./environment-policy.mjs";
import { verifyBuildReceipt } from "../packages/website/scripts/build-freshness.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strictVerificationEnvironment = {
  ...providerFreeVerificationEnvironment(process.env),
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
    label: "deterministic repository verification",
    args: ["run", "verify"],
    captureProviderFreeReceipt: true,
  },
  {
    label: "full Lighthouse performance gate",
    args: ["run", "lighthouse:release:built"],
    verifyProviderFreeReceipt: true,
  },
  {
    label: "public browser gate",
    args: ["run", "test:e2e:public:built"],
    verifyProviderFreeReceipt: true,
  },
  {
    label: "provider-free authentication scaffold",
    args: ["run", "test:e2e:auth-scaffold:built"],
    verifyProviderFreeReceipt: true,
  },
  {
    label: "launch browser gate",
    args: ["run", "test:e2e:release:built"],
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
