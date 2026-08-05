#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { providerFreeVerificationEnvironment } from "../../../scripts/environment-policy.mjs";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/run-provider-free.mjs <command> [args...]");
  process.exit(2);
}

// The allowlist removes arbitrary shell credentials and capabilities. Explicit
// empty provider values then take precedence over .env.local when Next loads
// it, making the application provider-free as well as process-minimal.
const providerFreeEnvironment =
  providerFreeVerificationEnvironment(process.env);

const result = spawnSync(command, args, {
  cwd: process.cwd(),
  env: providerFreeEnvironment,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
