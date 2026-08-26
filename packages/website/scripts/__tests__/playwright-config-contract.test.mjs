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

test("manual visual capture is isolated from every mandatory public project", () => {
  const ordinaryVisualProject = listWith({}, "chromium-visual-qa");
  assert.notEqual(ordinaryVisualProject.status, 0);
  assert.match(
    `${ordinaryVisualProject.stdout}\n${ordinaryVisualProject.stderr}`,
    /Project\(s\) "chromium-visual-qa" not found/,
  );

  const optedInVisualProject = listWith(
    { PLAYWRIGHT_CAPTURE_VISUALS: "1" },
    "chromium-visual-qa",
  );
  assert.equal(optedInVisualProject.status, 0, optedInVisualProject.stderr);
  assert.equal(
    optedInVisualProject.stdout.match(/qa-visuals\.spec\.ts/g)?.length,
    25,
  );

  for (const project of [
    "chromium",
    "chromium-ai-native-operator",
    "chromium-claude-responsive",
    "mobile-chromium",
    "mobile-webkit",
  ]) {
    const ordinary = listWith({}, project);
    const optedIn = listWith({ PLAYWRIGHT_CAPTURE_VISUALS: "1" }, project);
    assert.equal(ordinary.status, 0, ordinary.stderr);
    assert.equal(optedIn.status, 0, optedIn.stderr);
    assert.equal(optedIn.stdout, ordinary.stdout);
    assert.doesNotMatch(optedIn.stdout, /qa-visuals\.spec\.ts/);
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

test("CI gives public and auth browser gates independent bounded budgets", () => {
  const workflow = readFileSync(
    new URL("../../../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );

  // Both gates must still exist. Verify runs them as separate jobs now, so a
  // gate can no longer be skipped by an earlier step's failure — but it could
  // still be deleted, and that must fail here.
  assert.match(workflow, /name: Public browser gate\b/);
  assert.match(workflow, /name: Provider-free auth scaffold gate\b/);

  // Split on job-level keys (exactly two spaces of indent under `jobs:`).
  const jobs = workflow
    .split(/\n {2}(?=[a-z][a-z0-9-]*:\n)/)
    .filter((block) => block.includes("E2E_GLOBAL_TIMEOUT"));
  assert.ok(
    jobs.length >= 2,
    "expected at least the public and auth-scaffold browser jobs to set a budget",
  );

  for (const job of jobs) {
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
