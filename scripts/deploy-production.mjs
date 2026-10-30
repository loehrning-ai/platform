#!/usr/bin/env node
/**
 * Exact-commit, CI-gated Git-source releases. Nothing mutates without --yes.
 * Production stages, checks the unique deployment, then promotes that same build.
 * Preview uses the current branch (or --ref) and never acquires production domains.
 * Authentication remains in the installed gh/Vercel CLIs; no token arguments/files.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createDefaultAdapters, executeRelease, parseArguments } from "./release-core.mjs";

export * from "./release-core.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await executeRelease(parseArguments(process.argv.slice(2)), createDefaultAdapters());
    if (result.status !== "help") process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Release failed"}\n`);
    process.exitCode = 1;
  }
}
