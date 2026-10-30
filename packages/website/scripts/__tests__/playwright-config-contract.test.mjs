import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { minimalVerificationEnvironment } from "../../../../scripts/environment-policy.mjs";
import { expectedSmokeTags, MOBILE_SMOKE_BATCHES } from "../../../../scripts/smoke-contract.mjs";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const packageRoot = fileURLToPath(new URL("../..", import.meta.url));

function listWith(environment, project = "chromium", arguments_ = []) {
  const childEnvironment = minimalVerificationEnvironment(process.env);
  // These tests define their own execution tier. Do not let an outer CI runner
  // silently turn the explicit development case into a production-strict run.
  // CI semantics remain covered by passing the marker as part of the scenario.
  delete childEnvironment.CI;
  delete childEnvironment.GITHUB_ACTIONS;

  return spawnSync(
    process.execPath,
    [playwrightCli, "test", "--list", `--project=${project}`, ...arguments_],
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
  for (const project of ["chromium", "mobile-webkit"]) {
    const result = listWith({}, project);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Total: \d+ tests? in \d+ files?/, project);
  }
});

function collectBaseline(project, shard) {
  const result = listWith({}, project, [
    "tests/e2e/baseline-smoke.spec.ts", "--reporter=json",
    ...(shard ? [`--shard=${shard.current}/${shard.total}`] : []),
  ]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.errors, []);
  const specs = [];
  const visit = (suite) => {
    specs.push(...(suite.specs ?? []));
    for (const child of suite.suites ?? []) visit(child);
  };
  report.suites.forEach(visit);
  for (const spec of specs) {
    assert.equal(spec.tags.length, 1, spec.title);
    assert.equal(spec.tests.length, 1, spec.title);
    assert.equal(spec.tests[0].projectName, project);
    assert.equal(spec.tests[0].expectedStatus, "passed", spec.title);
  }
  // Playwright's JSON reporter removes the leading @ from TestCase.tags.
  return specs.map((spec) => `@${spec.tags[0]}`);
}

test("Chromium collects every baseline capability once with no expected skips or failures", () => {
  assert.deepEqual(collectBaseline("chromium"), expectedSmokeTags());
});

test("five fresh WebKit invocations partition all baseline cases without a coverage gap", () => {
  const collected = [];
  for (let current = 1; current <= MOBILE_SMOKE_BATCHES; current++) {
    const shard = { current, total: MOBILE_SMOKE_BATCHES };
    const tags = collectBaseline("mobile-webkit", shard);
    assert.equal(tags.length, 4);
    assert.deepEqual(tags, expectedSmokeTags(shard));
    collected.push(...tags);
  }
  assert.deepEqual(collected, expectedSmokeTags());
});

test("live auth projects explicitly disable credential-bearing browser media while public traces remain enabled", () => {
  // Configuration import only: no state file, credential or auth request.
  const directory = mkdtempSync(join(tmpdir(), "loehrning-live-auth-"));
  try {
    const configuration = pathToFileURL(join(packageRoot, "playwright.config.ts")).href;
    const source = [
      `import config from ${JSON.stringify(configuration)};`,
      "process.stdout.write(JSON.stringify({use:config.use,projects:config.projects.map(({name,use})=>({name,use}))}));",
    ].join("");
    const result = spawnSync("bun", ["--eval", source], {
      cwd: packageRoot,
      encoding: "utf8",
      env: {
        ...minimalVerificationEnvironment(process.env),
        E2E_AUTH_LIVE: "1",
        E2E_AUTH_STORAGE_STATE: join(directory, "user.json"),
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const config = JSON.parse(result.stdout);
    assert.equal(config.use.trace, "retain-on-failure");
    assert.equal(config.use.screenshot, "only-on-failure");
    for (const name of ["auth-live-setup", "authenticated-live"]) {
      const project = config.projects.find((item) => item.name === name);
      assert.ok(project, name);
      for (const media of ["trace", "video", "screenshot"]) {
        assert.equal(project.use[media], "off", `${name} must explicitly disable ${media}`);
      }
    }
    for (const name of ["chromium", "mobile-webkit"]) {
      const project = config.projects.find((item) => item.name === name);
      assert.equal(project.use.trace ?? config.use.trace, "retain-on-failure", name);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
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

test("every CI and daily browser job gives Playwright a budget under its job timeout", () => {
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
