import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { minimalVerificationEnvironment } from "../../../../scripts/environment-policy.mjs";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const packageRoot = fileURLToPath(new URL("../..", import.meta.url));

function listWith(environment, project = "chromium") {
  const childEnvironment = minimalVerificationEnvironment(process.env);
  // These tests define their own execution tier. Do not let an outer CI runner
  // silently turn the explicit development case into a production-strict run.
  // CI semantics remain covered by passing the marker as part of the scenario.
  delete childEnvironment.CI;
  delete childEnvironment.GITHUB_ACTIONS;

  return spawnSync(
    process.execPath,
    [playwrightCli, "test", "--list", `--project=${project}`],
    {
      cwd: packageRoot,
      encoding: "utf8",
      env: {
        ...childEnvironment,
        ...environment,
      },
      maxBuffer: 32 * 1024 * 1024,
    },
  );
}

test("every scripted project loads and lists its specs", () => {
  for (const project of ["chromium", "mobile-chromium", "mobile-webkit"]) {
    const result = listWith({}, project);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Total: \d+ tests? in \d+ files?/, project);
  }
});

test("production verification rejects reuse of an arbitrary existing server", () => {
  const result = listWith({
    E2E_REUSE_EXISTING_SERVER: "1",
    E2E_SERVER_MODE: "production",
  });
  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Production and release Playwright runs may not reuse an existing server/,
  );
});

test("explicit development runs may reuse their deliberately started server", () => {
  const result = listWith({
    E2E_REUSE_EXISTING_SERVER: "1",
    E2E_SERVER_MODE: "development",
  });
  assert.equal(result.status, 0, result.stderr);
});

test("CI remains production-strict even when development mode is requested", () => {
  const result = listWith({
    CI: "true",
    E2E_REUSE_EXISTING_SERVER: "1",
    E2E_SERVER_MODE: "development",
  });
  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Production and release Playwright runs may not reuse an existing server/,
  );
});

function workflowJobs(file) {
  const workflow = readFileSync(
    new URL(`../../../../.github/workflows/${file}`, import.meta.url),
    "utf8",
  );
  // Split on job-level keys (exactly two spaces of indent under `jobs:`).
  return workflow
    .split(/\n {2}(?=[a-z][a-z0-9-]*:\n)/)
    .filter((block) => block.includes("E2E_GLOBAL_TIMEOUT"));
}

test("every CI and weekly browser job gives Playwright a budget under its job timeout", () => {
  const ciJobs = workflowJobs("ci.yml");
  assert.ok(ciJobs.length >= 1, "the browser smoke job must set a budget");

  for (const job of [...ciJobs, ...workflowJobs("nightly.yml")]) {
    const jobTimeoutMinutes = Number(
      /timeout-minutes:\s*(\d+)\b/.exec(job)?.[1],
    );
    assert.ok(
      Number.isSafeInteger(jobTimeoutMinutes),
      "every job running a browser gate must declare timeout-minutes",
    );

    const budgets = [...job.matchAll(/E2E_GLOBAL_TIMEOUT:\s*(\d+)\b/g)].map(
      (match) => Number(match[1]),
    );
    assert.ok(budgets.length > 0);
    for (const budget of budgets) {
      // playwright.config.ts refuses anything outside this window.
      assert.ok(
        budget >= 65_000 && budget <= 2 * 60 * 60 * 1000,
        `E2E_GLOBAL_TIMEOUT ${budget} is outside the range the config accepts`,
      );
      // The suite's own deadline must expire first. If the job timeout fired
      // instead, the run would be killed with no per-test diagnosis and no
      // uploaded artifacts.
      assert.ok(
        budget < jobTimeoutMinutes * 60_000,
        `E2E_GLOBAL_TIMEOUT ${budget}ms must be under the ${jobTimeoutMinutes}m job timeout so the gate, not the runner, reports the failure`,
      );
    }
  }
});
