#!/usr/bin/env node
/**
 * The one CI runner. GitHub jobs and a contributor's terminal call the same
 * groups, so a red job is reproduced by running the same script name locally.
 *
 *   bun run ci            static and unit in parallel, then browser
 *   bun run ci:static     types, lint, public-leak scan, content and route checks
 *   bun run ci:unit       vitest, no coverage
 *   bun run ci:browser    the one production build, server-log privacy, browser smoke
 *   bun run ci:hygiene    audits and tool self-tests (nightly only, not part of `ci`)
 *
 * Every root `ci*` script runs this file under run-provider-free.mjs, which
 * scrubs the environment down to the allowlist in scripts/environment-policy.mjs.
 *
 * Output stays quiet on success: one line per step with its duration. A failed
 * step prints its own output; a passed step prints nothing.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SMOKE_LIST = "packages/website/tests/e2e/smoke.list";
const SMOKE_PROJECTS = ["chromium", "mobile-chromium"];
const WEBSITE = ["--cwd", "packages/website"];

const bun = (name, ...args) => ({ name, command: "bun", args });
const site = (name, ...args) => bun(name, "run", ...WEBSITE, ...args);
const root = (name, script) => bun(name, "run", script);

/** Smoke specs, as paths Playwright matches unambiguously (`responsive` is not `*-responsive`). */
export function parseSmokeList(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((name) => `tests/e2e/${name}`);
}

export function readSmokeFiles(read = (file) => readFileSync(path.join(ROOT, file), "utf8")) {
  return parseSmokeList(read(SMOKE_LIST));
}

function checkSmokeListExists() {
  const missing = readSmokeFiles().filter(
    (file) => !existsSync(path.join(ROOT, "packages/website", file)),
  );
  if (missing.length > 0) {
    throw new Error(`smoke.list names specs that do not exist: ${missing.join(", ")}`);
  }
}

export function smokeArguments(files = readSmokeFiles()) {
  return [
    "test",
    ...SMOKE_PROJECTS.map((project) => `--project=${project}`),
    "--workers=2",
    "--retries=1",
    ...files,
  ];
}

/**
 * A group is a list of waves. Steps inside a wave run in parallel (heaviest
 * first); a wave starts only after the previous one passed.
 */
export const GROUPS = {
  static: () => [
    [site("typegen", "typegen")],
    [
      // The two tsc projects run directly: `typecheck` has a pre-hook that
      // would run typegen again, concurrently with its sibling.
      site("tsc (app)", "tsc", "--noEmit", "-p", "tsconfig.typecheck.json"),
      site("tsc (tests)", "tsc", "--noEmit", "-p", "tsconfig.tests.json"),
      site("lint", "lint"),
      site("content:lint", "content:lint"),
      root("scan:public", "scan:public"),
      root("test:scanner", "test:scanner"),
      root("marketing:check", "marketing:check"),
      root("copy:lint", "copy:lint"),
      root("deck-keys:check", "deck-keys:check"),
      root("workshop05-deck:check", "workshop05-deck:check"),
      root("workshop06-kit:check", "workshop06-kit:check"),
      root("workshop06-deck:check", "workshop06-deck:check"),
      site("skills:mirror-check", "skills:mirror-check"),
      site("page-inventory:check", "page-inventory:check"),
      site("english-routes:check", "english-routes:check"),
      site("migrations:check", "migrations:check"),
      root("verify:workspace-contract", "verify:workspace-contract"),
      root("test:deploy-production", "test:deploy-production"),
      // Cheap self-tests of the gates that guard the public tree and the copy.
      root("test:ci", "test:ci"),
      site("test:content-lint", "test:content-lint"),
      site("test:english-routes", "test:english-routes"),
      site("test:migrations-tracked", "test:migrations-tracked"),
      root("test:marketing", "test:marketing"),
      root("test:copy-lint", "test:copy-lint"),
      root("test:claude-recorder", "test:claude-recorder"),
      root("test:deck-keys", "test:deck-keys"),
      root("test:publication-clean", "test:publication-clean"),
      root("test:workspace-contract", "test:workspace-contract"),
      { name: "smoke.list files exist", run: checkSmokeListExists },
    ],
  ],
  unit: () => [[site("vitest", "test")]],
  browser: () => [
    [site("build", "verify:build")],
    [site("server-log privacy", "test:server-log-privacy:built")],
    [bun("browser smoke", "run", ...WEBSITE, "e2e:shard:built", ...smokeArguments())],
  ],
  hygiene: () => [
    [
      root("audit", "audit"),
      root("license:audit", "license:audit"),
      root("test:dependency-licenses", "test:dependency-licenses"),
      root("test:course03-publication", "test:course03-publication"),
      root("test:workshop04-publication", "test:workshop04-publication"),
      root("test:asset-tool", "test:asset-tool"),
      root("test:dependency-snapshot", "test:dependency-snapshot"),
      root("test:artifact-assets", "test:artifact-assets"),
      root("artifact-assets:check", "artifact-assets:check"),
      site("test:env-contract", "test:env-contract"),
      site("test:provider-free-env", "test:provider-free-env"),
      site("test:build-freshness", "test:build-freshness"),
      site("test:e2e-suite-contract", "test:e2e-suite-contract"),
      site("test:e2e-auth-env-contract", "test:e2e-auth-env-contract"),
    ],
  ],
};

/** Environment the browser steps share: build and serve must see identical values. */
export function browserEnvironment(env) {
  return {
    E2E_SERVER_MODE: "production",
    E2E_PORT: env.E2E_PORT ?? "3000",
    E2E_GLOBAL_TIMEOUT: env.E2E_GLOBAL_TIMEOUT ?? "900000",
  };
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
const log = (line) => process.stdout.write(`${line}\n`);

function runCommand(step, { capture, env }) {
  return new Promise((resolve) => {
    let output = "";
    const child = spawn(step.command, step.args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    if (capture) {
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
    }
    child.on("error", (error) => resolve({ code: 1, output: `${output}${error.message}\n` }));
    child.on("close", (code, signal) =>
      resolve({ code: code ?? 1, output: signal ? `${output}killed by ${signal}\n` : output }),
    );
  });
}

async function runStep(step, options) {
  const started = Date.now();
  let result;
  if (step.run) {
    try {
      await step.run();
      result = { code: 0, output: "" };
    } catch (error) {
      result = { code: 1, output: `${error instanceof Error ? error.message : error}\n` };
    }
  } else {
    result = await runCommand(step, options);
  }
  const ms = Date.now() - started;
  log(`${result.code === 0 ? "ok  " : "FAIL"} ${seconds(ms).padStart(7)}  ${step.name}`);
  return { ...result, name: step.name, ms };
}

/** Run steps with at most `limit` in flight, starting in the given order. */
async function runPool(steps, options, limit) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < steps.length) {
      const step = steps[next];
      next += 1;
      results.push(await runStep(step, options));
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, steps.length) }, worker));
  return results;
}

/** Runs one group; resolves to the failed results (empty when the group passed). */
export async function runGroup(name, { capture, env = {} }) {
  const limit = Math.max(4, os.availableParallelism());
  for (const wave of GROUPS[name]()) {
    // A lone step streams its output (vitest, build, Playwright); parallel steps are captured.
    const results = await runPool(wave, { capture: capture || wave.length > 1, env }, limit);
    const failed = results.filter((result) => result.code !== 0);
    for (const result of failed) {
      if (result.output.trim() !== "") {
        log(`\n--- ${name}: ${result.name} (exit ${result.code}) ---\n${result.output.trimEnd()}\n`);
      }
    }
    if (failed.length > 0) return failed;
  }
  return [];
}

async function main(argv) {
  const [command, ...rest] = argv;
  if (command === "smoke-files") {
    // For workflow steps that run the smoke list on another project.
    process.stdout.write(`${readSmokeFiles().join(" ")}\n`);
    return 0;
  }
  if (rest.length > 0 || !["all", ...Object.keys(GROUPS)].includes(command ?? "")) {
    log(`Usage: node scripts/ci.mjs <${["all", ...Object.keys(GROUPS)].join("|")}|smoke-files>`);
    return 2;
  }
  const started = Date.now();
  const browserEnv = browserEnvironment(process.env);
  let failed;
  if (command === "all") {
    const [staticFailed, unitFailed] = await Promise.all([
      runGroup("static", { capture: true }),
      runGroup("unit", { capture: true }),
    ]);
    failed = [...staticFailed, ...unitFailed];
    if (failed.length === 0) failed = await runGroup("browser", { capture: false, env: browserEnv });
  } else {
    failed = await runGroup(command, {
      capture: command === "static" || command === "hygiene",
      env: command === "browser" ? browserEnv : {},
    });
  }
  log(`\n${command}: ${failed.length === 0 ? "passed" : `FAILED (${failed.map((r) => r.name).join(", ")})`} in ${seconds(Date.now() - started)}`);
  if (failed.length === 0 && ["all", "static"].includes(command) && !process.env.CI) {
    log("Run `git status --short` to confirm no generated file changed (CI runs `git diff --exit-code`).");
  }
  return failed.length === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
      process.exit(1);
    },
  );
}
