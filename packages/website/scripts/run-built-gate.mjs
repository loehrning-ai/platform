#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { verifyBuildReceipt } from "./build-freshness.mjs";

function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

export function executeBuiltGate(options = {}) {
  const args = options.args ?? process.argv.slice(2);
  const [command, ...commandArguments] = args;
  const verify = options.verify ?? (() => verifyBuildReceipt());
  const spawn = options.spawn ?? spawnSync;
  const logError = options.logError ?? ((message) => console.error(message));

  if (!command) {
    logError(
      "Usage: node scripts/run-built-gate.mjs <command> [arguments...]",
    );
    return 2;
  }

  let preflightReceipt;
  try {
    preflightReceipt = verify();
  } catch (error) {
    logError(`[built-gate] preflight failed: ${describeError(error)}`);
    return 1;
  }

  let result;
  let executionError;
  try {
    result = spawn(command, commandArguments, {
      cwd: options.cwd ?? process.cwd(),
      env: options.environment ?? process.env,
      stdio: options.stdio ?? "inherit",
    });
    executionError = result.error;
  } catch (error) {
    executionError = error;
  }

  let postflightError;
  try {
    const postflightReceipt = verify();
    if (!isDeepStrictEqual(preflightReceipt, postflightReceipt)) {
      throw new Error(
        "Production build identity changed while the gate was running.",
      );
    }
  } catch (error) {
    postflightError = error;
  }

  if (executionError) {
    logError(`[built-gate] command failed: ${describeError(executionError)}`);
  }
  if (postflightError) {
    logError(
      `[built-gate] postflight failed: ${describeError(postflightError)}`,
    );
  }
  if (executionError || postflightError) return 1;
  return result?.status ?? 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  process.exitCode = executeBuiltGate();
}
