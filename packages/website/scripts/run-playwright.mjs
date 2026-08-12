#!/usr/bin/env node

/**
 * Invoke the Playwright CLI resolved from this workspace's lockfile.
 *
 * CI shards call Playwright directly rather than through `run-e2e-suite.mjs`,
 * because a GitHub matrix already provides the process isolation that the
 * in-process shard loop was emulating. Resolving the CLI through `createRequire`
 * (rather than `npx playwright`) keeps the runner pinned to the version in
 * `bun.lock` — `npx playwright` resolves a different package that has no `test`
 * command at all.
 *
 * Arguments are forwarded verbatim, so this composes with the existing
 * `run-provider-free.mjs` -> `run-built-gate.mjs` wrapper chain.
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");

const result = spawnSync(
  process.execPath,
  [playwrightCli, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`Failed to start Playwright: ${result.error.message}`);
  process.exit(1);
}

// A signal-terminated child reports status null; treat that as failure rather
// than letting `?? 0` turn a killed engine into a green gate.
process.exit(result.status ?? 1);
