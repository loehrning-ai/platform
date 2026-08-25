import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { EventEmitter } from "node:events";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { minimalVerificationEnvironment } from "../../../../scripts/environment-policy.mjs";
import {
  artifactEnvironment,
  buildE2ePlan,
  executeE2eSuite,
  MOBILE_WEBKIT_SHARD_COUNT,
  runManagedProcess,
} from "../run-e2e-suite.mjs";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");

function collectSpecIds(suites) {
  return suites.flatMap((suite) => [
    ...(suite.specs ?? []).map((spec) => spec.id),
    ...collectSpecIds(suite.suites ?? []),
  ]);
}

function collectSpecKeys(suites, parents = []) {
  return suites.flatMap((suite) => {
    const titles = [...parents, suite.title];
    return [
      ...(suite.specs ?? []).map(
        (spec) =>
          `${spec.file}:${spec.line}:${spec.column}:${titles.join(" > ")}:${spec.title}`,
      ),
      ...collectSpecKeys(suite.suites ?? [], titles),
    ];
  });
}

function listReport(arguments_) {
  const result = spawnSync(
    process.execPath,
    [playwrightCli, ...arguments_, "--list", "--reporter=json"],
    {
      encoding: "utf8",
      env: minimalVerificationEnvironment(process.env),
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.errors, []);
  return report;
}

function listIds(arguments_) {
  return collectSpecIds(listReport(arguments_).suites);
}

function listKeys(arguments_) {
  return collectSpecKeys(listReport(arguments_).suites);
}

async function assertProcessGone(pid, timeoutMs = 1_500) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error?.code === "ESRCH") return;
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail(`process ${pid} survived process-tree cleanup`);
}

test("public plan isolates Chromium engines and recycles WebKit processes", () => {
  const plan = buildE2ePlan("public");
  assert.equal(plan.length, 4 + MOBILE_WEBKIT_SHARD_COUNT);
  assert.deepEqual(
    plan.slice(0, 4).map((step) => step.label),
    [
      "chromium",
      "chromium-ai-native-operator",
      "chromium-claude-responsive",
      "mobile-chromium",
    ],
  );
  const webkit = plan.slice(4);
  assert.equal(new Set(webkit.map((step) => step.label)).size, webkit.length);
  assert.deepEqual(
    webkit.map((step) =>
      step.arguments.find((argument) => argument.startsWith("--shard=")),
    ),
    Array.from(
      { length: MOBILE_WEBKIT_SHARD_COUNT },
      (_, index) => `--shard=${index + 1}/${MOBILE_WEBKIT_SHARD_COUNT}`,
    ),
  );
  for (const step of plan) {
    assert.ok(step.arguments.includes("--retries=0"));
    assert.ok(step.arguments.includes("--trace=retain-on-failure"));
  }
});

test("public plan covers every desktop Chromium test exactly once", () => {
  const desktopSteps = buildE2ePlan("public").slice(0, 3);
  const projectKeys = desktopSteps.map((step) => listKeys(step.arguments));
  for (const [index, keys] of projectKeys.entries()) {
    assert.ok(keys.length > 0, `${desktopSteps[index].label} must not be empty`);
    assert.equal(new Set(keys).size, keys.length);
  }

  const combined = projectKeys.flat();
  assert.equal(new Set(combined).size, combined.length);

  // Mobile Chromium carries every public spec except the intentionally
  // desktop-only course-workspace matrix. Together they are the authoritative
  // public inventory the three managed desktop projects must partition.
  const reference = new Set([
    ...listKeys(["test", "--project=mobile-chromium", "--retries=0"]),
    ...listKeys([
      "test",
      "course-workspace.spec.ts",
      "--project=chromium",
      "--retries=0",
    ]),
  ]);
  assert.deepEqual([...new Set(combined)].sort(), [...reference].sort());
});

test("real WebKit shard lists cover the complete project exactly once", () => {
  const full = listIds(["test", "--project=mobile-webkit", "--retries=0"]);
  assert.ok(full.length > 0, "the mobile WebKit project must not be empty");
  assert.equal(new Set(full).size, full.length);

  const shardIds = [];
  const webkitSteps = buildE2ePlan("public").slice(4);
  assert.equal(webkitSteps.length, MOBILE_WEBKIT_SHARD_COUNT);
  for (const step of webkitSteps) {
    const ids = listIds(step.arguments);
    assert.ok(ids.length > 0, `${step.label} must not be empty`);
    assert.ok(
      ids.length <= 32,
      `${step.label} exceeds the bounded WebKit worker lifetime`,
    );
    shardIds.push(...ids);
  }

  assert.equal(shardIds.length, full.length);
  assert.equal(new Set(shardIds).size, shardIds.length);
  assert.deepEqual([...new Set(shardIds)].sort(), [...full].sort());
});

test("all mode adds the provider-free authentication scaffold", () => {
  const plan = buildE2ePlan("all");
  assert.equal(plan.at(-1).label, "auth-scaffold");
  assert.ok(plan.at(-1).arguments.includes("--project=auth-scaffold"));
});

test("artifact directories remain isolated inside their dedicated roots", () => {
  assert.deepEqual(
    artifactEnvironment(
      {
        PLAYWRIGHT_OUTPUT_DIR: "test-results/public",
        PLAYWRIGHT_BLOB_OUTPUT_DIR: "blob-report/public",
      },
      "run-one",
      "mobile-webkit-01-of-16",
    ),
    {
      PLAYWRIGHT_OUTPUT_DIR:
        "test-results/public/run-one/mobile-webkit-01-of-16",
      PLAYWRIGHT_BLOB_OUTPUT_DIR:
        "blob-report/public/run-one/mobile-webkit-01-of-16",
      PLAYWRIGHT_HTML_OUTPUT_DIR:
        "playwright-report/run-one/mobile-webkit-01-of-16",
    },
  );
  assert.throws(
    () =>
      artifactEnvironment(
        { PLAYWRIGHT_OUTPUT_DIR: "../escaped" },
        "run-one",
        "chromium",
      ),
    /inside test-results/,
  );
  assert.throws(
    () => artifactEnvironment({}, "../escaped", "chromium"),
    /run ID/,
  );
});

test("suite execution continues after a failed shard and returns failure", async () => {
  const invocations = [];
  let tick = 0;
  const status = await executeE2eSuite({
    mode: "public",
    runId: "run-one",
    environment: { E2E_GLOBAL_TIMEOUT: "4200000" },
    now: () => tick++ * 1000,
    run: async (options) => {
      const label = options.environment.PLAYWRIGHT_OUTPUT_DIR.split("/").at(-1);
      invocations.push({
        args: options.arguments,
        label,
        timeout: options.timeoutMs,
      });
      return {
        status:
          label === `mobile-webkit-03-of-${MOBILE_WEBKIT_SHARD_COUNT}` ? 1 : 0,
      };
    },
    log: () => {},
    logError: () => {},
    stdio: "ignore",
  });
  assert.equal(status, 1);
  assert.equal(invocations.length, 4 + MOBILE_WEBKIT_SHARD_COUNT);
  assert.equal(
    new Set(invocations.map((entry) => entry.label)).size,
    4 + MOBILE_WEBKIT_SHARD_COUNT,
  );
  assert.ok(invocations.every((entry) => entry.args.includes("--retries=0")));
});

test("the aggregate deadline decreases child budgets and fails closed", async () => {
  const invocations = [];
  const timestamps = [0, 1_000, 4_150_000];
  const status = await executeE2eSuite({
    mode: "public",
    runId: "run-one",
    environment: { E2E_GLOBAL_TIMEOUT: "4200000" },
    now: () => timestamps.shift() ?? 4_150_000,
    run: async (options) => {
      invocations.push({
        globalTimeout: Number(options.environment.E2E_GLOBAL_TIMEOUT),
        timeout: options.timeoutMs,
      });
      return { status: 0 };
    },
    log: () => {},
    logError: () => {},
    stdio: "ignore",
  });
  assert.equal(status, 1);
  assert.equal(invocations.length, 1);
  assert.equal(invocations[0].globalTimeout, 4_194_000);
  assert.equal(invocations[0].timeout, 4_199_000);
});

test("rejects a suite budget too short to start one managed child", async () => {
  let invoked = false;
  const errors = [];
  const status = await executeE2eSuite({
    mode: "auth-scaffold",
    environment: { E2E_GLOBAL_TIMEOUT: "64999" },
    run: async () => {
      invoked = true;
      return { status: 0 };
    },
    log: () => {},
    logError: (message) => errors.push(message),
  });
  assert.equal(status, 2);
  assert.equal(invoked, false);
  assert.match(errors.join("\n"), /between 65000 and 7200000/);
});

test("signals propagate as failure while a forced timeout is terminal", async () => {
  let signalInvocations = 0;
  const signalled = await executeE2eSuite({
    mode: "public",
    runId: "run-one",
    environment: { E2E_GLOBAL_TIMEOUT: "4200000" },
    now: () => 0,
    run: async () => {
      signalInvocations += 1;
      return signalInvocations === 1
        ? { status: null, signal: "SIGABRT" }
        : { status: 0 };
    },
    log: () => {},
    logError: () => {},
    stdio: "ignore",
  });
  assert.equal(signalled, 1);
  assert.equal(signalInvocations, 4 + MOBILE_WEBKIT_SHARD_COUNT);

  let timeoutInvocations = 0;
  const timedOut = await executeE2eSuite({
    mode: "public",
    runId: "run-two",
    environment: { E2E_GLOBAL_TIMEOUT: "4200000" },
    now: () => 0,
    run: async () => {
      timeoutInvocations += 1;
      return {
        status: null,
        timedOut: true,
      };
    },
    log: () => {},
    logError: () => {},
    stdio: "ignore",
  });
  assert.equal(timedOut, 1);
  assert.equal(timeoutInvocations, 1);
});

test("managed timeout kills a TERM-resistant child and descendant process group", async () => {
  if (process.platform === "win32") return;
  const directory = mkdtempSync(join(tmpdir(), "loehrning-e2e-tree-"));
  const descendantPath = join(directory, "descendant.pid");
  const childScript = `
    const { spawn } = require("node:child_process");
    const { writeFileSync } = require("node:fs");
    const descendant = spawn(
      process.execPath,
      ["-e", "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"],
      { stdio: "ignore" },
    );
    writeFileSync(${JSON.stringify(descendantPath)}, String(descendant.pid));
    process.on("SIGTERM", () => {});
    setInterval(() => {}, 1000);
  `;
  try {
    const started = performance.now();
    const result = await runManagedProcess({
      command: process.execPath,
      arguments: ["-e", childScript],
      environment: process.env,
      stdio: "ignore",
      timeoutMs: 900,
      shutdownBudgetMs: 500,
    });
    const elapsed = performance.now() - started;
    assert.equal(result.timedOut, true);
    assert.ok(elapsed < 2_000, `managed timeout took ${elapsed}ms`);

    const descendantPid = Number(readFileSync(descendantPath, "utf8"));
    assert.ok(Number.isSafeInteger(descendantPid));
    await assertProcessGone(descendantPid);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("managed child receives parent termination and reports interruption", async () => {
  if (process.platform === "win32") return;
  const signals = new EventEmitter();
  const resultPromise = runManagedProcess({
    command: process.execPath,
    arguments: ["-e", "setInterval(() => {}, 1000)"],
    environment: process.env,
    signalTarget: signals,
    stdio: "ignore",
    timeoutMs: 5_000,
    shutdownBudgetMs: 500,
  });
  setTimeout(() => signals.emit("SIGTERM"), 100);
  const result = await resultPromise;
  assert.equal(result.interruptedSignal, "SIGTERM");
  assert.equal(result.signal, "SIGTERM");
  assert.equal(result.timedOut, false);
});

test("managed completion kills a descendant abandoned by its leader", async () => {
  if (process.platform === "win32") return;
  const directory = mkdtempSync(join(tmpdir(), "loehrning-e2e-orphan-"));
  const descendantPath = join(directory, "descendant.pid");
  const childScript = `
    const { spawn } = require("node:child_process");
    const { writeFileSync } = require("node:fs");
    const descendant = spawn(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      { stdio: "ignore" },
    );
    writeFileSync(${JSON.stringify(descendantPath)}, String(descendant.pid));
    descendant.unref();
  `;
  try {
    const result = await runManagedProcess({
      command: process.execPath,
      arguments: ["-e", childScript],
      environment: process.env,
      stdio: "ignore",
      timeoutMs: 5_000,
      shutdownBudgetMs: 500,
    });
    assert.equal(result.status, 0);
    const descendantPid = Number(readFileSync(descendantPath, "utf8"));
    assert.ok(Number.isSafeInteger(descendantPid));
    await assertProcessGone(descendantPid);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("automatic run IDs isolate artifacts across suite invocations", async () => {
  const paths = [];
  for (let invocation = 0; invocation < 2; invocation += 1) {
    await executeE2eSuite({
      mode: "auth-scaffold",
      environment: { E2E_GLOBAL_TIMEOUT: "600000" },
      now: () => 0,
      run: async (options) => {
        paths.push(options.environment.PLAYWRIGHT_OUTPUT_DIR);
        assert.ok(Number.isSafeInteger(options.timeoutMs));
        assert.ok(
          Number.isSafeInteger(Number(options.environment.E2E_GLOBAL_TIMEOUT)),
        );
        return { status: 0 };
      },
      log: () => {},
      logError: () => {},
      stdio: "ignore",
    });
  }
  assert.equal(paths.length, 2);
  assert.notEqual(paths[0], paths[1]);
  assert.match(paths[0], /^test-results\/run-\d+-[a-f0-9-]+\/auth-scaffold$/);
});
