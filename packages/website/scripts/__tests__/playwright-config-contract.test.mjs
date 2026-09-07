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
    24,
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

function assertBrowserReportContract(workflow) {
  const job = (name) => {
    const block = workflow
      .split(/\n {2}(?=[a-z][a-z0-9-]*:\n)/)
      .find((candidate) => candidate.startsWith(`${name}:\n`));
    assert.ok(block, `expected the ${name} job`);
    return block;
  };
  const step = (block, name) => {
    const result = block
      .split(/\n {6}- /)
      .find((candidate) => candidate.startsWith(`name: ${name}\n`));
    assert.ok(result, `expected the ${name} step`);
    return `${result}\n`;
  };
  const e2e = job("e2e");
  const producer = step(e2e, "Upload blob report");
  const report = job("merge-reports");
  const download = step(report, "Download blob reports");
  const merge = step(report, "Merge into one HTML report");
  const upload = step(report, "Upload merged report");
  const verify = job("verify");
  const shardDirectory =
    "blob-report/${{ matrix.project }}-${{ matrix.shard }}";

  assert.ok(e2e.includes(`PLAYWRIGHT_BLOB_OUTPUT_DIR: ${shardDirectory}\n`));
  assert.ok(
    producer.includes(`path: packages/website/${shardDirectory}/\n`),
    "upload the shard directory itself so report ZIPs are at the artifact root",
  );
  assert.match(
    producer,
    /name: blob-\$\{\{ matrix\.project \}\}-\$\{\{ matrix\.shard \}\}\n/,
  );
  for (const artifact of [producer, upload]) {
    assert.match(artifact, /if: always\(\)\n/);
    assert.match(
      artifact,
      /if-no-files-found: error\n/,
      "missing reports must fail",
    );
  }
  assert.match(report, /needs: \[e2e\]\n/);
  assert.match(report, /if: \$\{\{ always\(\) \}\}\n/);
  assert.match(download, /path: packages\/website\/all-blob-reports\n/);
  assert.match(download, /pattern: blob-\*\n/);
  assert.match(download, /merge-multiple: true\n/);
  assert.match(merge, /working-directory: packages\/website\n/);
  assert.match(
    merge,
    /run: node scripts\/run-playwright\.mjs merge-reports --reporter=html all-blob-reports\n/,
  );
  assert.doesNotMatch(
    report,
    /continue-on-error:/,
    "report failures must propagate",
  );
  assert.match(upload, /path: packages\/website\/playwright-report\/\n/);
  const needs = /\n    needs:\n([\s\S]*?)\n    steps:/.exec(verify)?.[1];
  assert.ok(
    needs?.split("\n").includes("      - merge-reports"),
    "verify must require the merged report",
  );
  assert.match(verify, /if: \$\{\{ always\(\) \}\}\n/);
  for (const result of ["failure", "cancelled", "skipped"]) {
    assert.ok(verify.includes(`contains(needs.*.result, '${result}')`));
  }
}

test("CI browser report preserves flat shard reports and fails closed", () => {
  const workflow = readFileSync(
    new URL("../../../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  assertBrowserReportContract(workflow);
});

for (const [name, before, after, error] of [
  [
    "the old parent upload layout",
    "path: packages/website/blob-report/${{ matrix.project }}-${{ matrix.shard }}/",
    "path: packages/website/blob-report/",
    /upload the shard directory itself/,
  ],
  [
    "a missing producer report",
    "path: packages/website/blob-report/${{ matrix.project }}-${{ matrix.shard }}/\n          if-no-files-found: error",
    "path: packages/website/blob-report/${{ matrix.project }}-${{ matrix.shard }}/\n          if-no-files-found: ignore",
    /missing reports must fail/,
  ],
  [
    "a suppressed merge error",
    "run: node scripts/run-playwright.mjs merge-reports --reporter=html all-blob-reports\n",
    "run: node scripts/run-playwright.mjs merge-reports --reporter=html all-blob-reports\n        continue-on-error: true\n",
    /report failures must propagate/,
  ],
  [
    "a missing HTML report",
    "path: packages/website/playwright-report/\n          if-no-files-found: error",
    "path: packages/website/playwright-report/\n          if-no-files-found: ignore",
    /missing reports must fail/,
  ],
  [
    "a report omitted from the required aggregate",
    "      - merge-reports\n",
    "",
    /verify must require the merged report/,
  ],
]) {
  test(`CI browser report rejects ${name}`, () => {
    const workflow = readFileSync(
      new URL("../../../../.github/workflows/ci.yml", import.meta.url),
      "utf8",
    );
    assertBrowserReportContract(workflow);
    assert.equal(
      workflow.split(before).length,
      2,
      "mutate exactly one contract input",
    );
    assert.throws(
      () => assertBrowserReportContract(workflow.replace(before, after)),
      error,
    );
  });
}
