#!/usr/bin/env node

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const PLAYWRIGHT_CLI = require.resolve("@playwright/test/cli");
const DEFAULT_SUITE_TIMEOUT_MS = 70 * 60 * 1000;
const MINIMUM_CHILD_BUDGET_MS = 65_000;
const CHILD_SHUTDOWN_BUDGET_MS = 5_000;
export const MOBILE_WEBKIT_SHARD_COUNT = 21;

const ARTIFACT_DIRECTORIES = [
  ["PLAYWRIGHT_OUTPUT_DIR", "test-results"],
  ["PLAYWRIGHT_BLOB_OUTPUT_DIR", "blob-report"],
  ["PLAYWRIGHT_HTML_OUTPUT_DIR", "playwright-report"],
];

function boundedSuiteTimeout(raw) {
  if (raw === undefined) return DEFAULT_SUITE_TIMEOUT_MS;
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new Error("E2E_GLOBAL_TIMEOUT must be a positive integer.");
  }
  const value = Number(raw);
  if (
    !Number.isSafeInteger(value) ||
    value < MINIMUM_CHILD_BUDGET_MS ||
    value > 2 * 60 * 60 * 1000
  ) {
    throw new Error("E2E_GLOBAL_TIMEOUT must be between 65000 and 7200000.");
  }
  return value;
}

function artifactPath(base, root, label) {
  const configured = base ?? root;
  const segments = configured.split("/");
  if (
    configured.length === 0 ||
    configured.length > 280 ||
    configured.includes("\\") ||
    segments[0] !== root ||
    segments.length >= 4 ||
    segments.some(
      (segment) => !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(segment),
    )
  ) {
    throw new Error(
      `${root} artifact base must be a bounded relative path inside ${root}.`,
    );
  }
  return `${configured}/${label}`;
}

function boundedRunId(value) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value)
  ) {
    throw new Error("E2E run ID must be one bounded safe path segment.");
  }
  return value;
}

function generatedRunId() {
  return `run-${process.pid}-${randomUUID().slice(0, 12)}`;
}

export function artifactEnvironment(environment, runId, label) {
  const safeRunId = boundedRunId(runId);
  return Object.fromEntries(
    ARTIFACT_DIRECTORIES.map(([name, root]) => [
      name,
      artifactPath(environment[name], root, `${safeRunId}/${label}`),
    ]),
  );
}

function signalProcessTree(child, signal) {
  if (!child.pid) return;
  try {
    if (process.platform === "win32") {
      child.kill(signal);
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (
      !error ||
      typeof error !== "object" ||
      !("code" in error) ||
      error.code !== "ESRCH"
    ) {
      throw error;
    }
  }
}

function signalExitCode(signal) {
  if (signal === "SIGINT") return 130;
  if (signal === "SIGTERM") return 143;
  return 1;
}

export function runManagedProcess(options) {
  const timeoutMs = options.timeoutMs;
  const shutdownBudgetMs = options.shutdownBudgetMs ?? CHILD_SHUTDOWN_BUDGET_MS;
  if (
    !Number.isSafeInteger(timeoutMs) ||
    !Number.isSafeInteger(shutdownBudgetMs) ||
    shutdownBudgetMs < 100 ||
    timeoutMs <= shutdownBudgetMs
  ) {
    throw new Error("Managed process deadlines are invalid.");
  }

  return new Promise((resolveResult) => {
    const child = spawn(options.command, options.arguments ?? [], {
      cwd: options.cwd,
      detached: process.platform !== "win32",
      env: options.environment,
      stdio: options.stdio ?? "inherit",
    });
    const signalTarget = options.signalTarget ?? process;
    const executionBudgetMs = timeoutMs - shutdownBudgetMs;
    const killDelayMs = Math.max(50, Math.floor(shutdownBudgetMs / 2));
    let settled = false;
    let timedOut = false;
    let interruptedSignal;
    let killTimer;
    let forceTimer;

    const cleanup = () => {
      clearTimeout(executionTimer);
      clearTimeout(killTimer);
      clearTimeout(forceTimer);
      signalTarget.removeListener("SIGINT", onSigint);
      signalTarget.removeListener("SIGTERM", onSigterm);
    };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolveResult({
        ...result,
        timedOut,
        interruptedSignal,
      });
    };
    const forceKill = () => {
      try {
        signalProcessTree(child, "SIGKILL");
      } catch (error) {
        finish({ status: null, signal: null, error });
      }
    };
    const beginShutdown = (signal) => {
      if (killTimer || settled) return;
      try {
        signalProcessTree(child, signal);
      } catch (error) {
        finish({ status: null, signal: null, error });
        return;
      }
      killTimer = setTimeout(forceKill, killDelayMs);
      forceTimer = setTimeout(() => {
        forceKill();
        child.unref();
        finish({
          status: null,
          signal: "SIGKILL",
          error: new Error(
            "Managed process tree did not exit inside its shutdown budget.",
          ),
        });
      }, shutdownBudgetMs);
    };
    const onSigint = () => {
      interruptedSignal = "SIGINT";
      beginShutdown("SIGINT");
    };
    const onSigterm = () => {
      interruptedSignal = "SIGTERM";
      beginShutdown("SIGTERM");
    };

    signalTarget.once("SIGINT", onSigint);
    signalTarget.once("SIGTERM", onSigterm);
    const executionTimer = setTimeout(() => {
      timedOut = true;
      beginShutdown("SIGTERM");
    }, executionBudgetMs);

    child.once("error", (error) => {
      forceKill();
      finish({ status: null, signal: null, error });
    });
    child.once("exit", (status, signal) => {
      // A detached Playwright CLI owns a private process group. Kill any
      // descendant that survived its leader so a failed shard cannot retain
      // the Next port or browser processes for the next shard.
      forceKill();
      finish({ status, signal, error: null });
    });
  });
}

function publicSteps() {
  return [
    {
      label: "chromium",
      arguments: [
        "test",
        "--project=chromium",
        "--retries=0",
        "--trace=retain-on-failure",
      ],
    },
    {
      label: "mobile-chromium",
      arguments: [
        "test",
        "--project=mobile-chromium",
        "--retries=0",
        "--trace=retain-on-failure",
      ],
    },
    ...Array.from({ length: MOBILE_WEBKIT_SHARD_COUNT }, (_, index) => {
      const current = index + 1;
      const padded = String(current).padStart(2, "0");
      return {
        label: `mobile-webkit-${padded}-of-${MOBILE_WEBKIT_SHARD_COUNT}`,
        arguments: [
          "test",
          "--project=mobile-webkit",
          `--shard=${current}/${MOBILE_WEBKIT_SHARD_COUNT}`,
          "--retries=0",
          "--trace=retain-on-failure",
        ],
      };
    }),
  ];
}

export function buildE2ePlan(mode) {
  if (mode === "public") return publicSteps();
  if (mode === "auth-scaffold") {
    return [
      {
        label: "auth-scaffold",
        arguments: [
          "test",
          "--project=auth-scaffold",
          "--retries=0",
          "--trace=retain-on-failure",
        ],
      },
    ];
  }
  if (mode === "launch") {
    return [
      {
        label: "launch",
        arguments: [
          "test",
          "--grep",
          "@launch-gate",
          "--project=chromium",
          "--retries=0",
          "--trace=retain-on-failure",
        ],
      },
    ];
  }
  if (mode === "all") {
    return [
      ...publicSteps(),
      {
        label: "auth-scaffold",
        arguments: [
          "test",
          "--project=auth-scaffold",
          "--retries=0",
          "--trace=retain-on-failure",
        ],
      },
    ];
  }
  throw new Error(
    "Usage: node scripts/run-e2e-suite.mjs <public|all|auth-scaffold|launch>",
  );
}

export async function executeE2eSuite(options = {}) {
  const mode = options.mode ?? process.argv[2];
  const environment = options.environment ?? process.env;
  const run = options.run ?? runManagedProcess;
  const now = options.now ?? (() => performance.now());
  const log = options.log ?? ((message) => console.log(message));
  const logError = options.logError ?? ((message) => console.error(message));

  let plan;
  let timeout;
  let runId;
  try {
    plan = buildE2ePlan(mode);
    timeout = boundedSuiteTimeout(environment.E2E_GLOBAL_TIMEOUT);
    runId = boundedRunId(options.runId ?? generatedRunId());
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    return 2;
  }

  const deadline = now() + timeout;
  let failed = false;

  for (const [index, step] of plan.entries()) {
    const remaining = Math.floor(deadline - now());
    if (remaining < MINIMUM_CHILD_BUDGET_MS) {
      logError(
        `[e2e] overall ${timeout}ms deadline exhausted before ${step.label}`,
      );
      return 1;
    }

    const childGlobalTimeout = remaining - CHILD_SHUTDOWN_BUDGET_MS;
    const childEnvironment = {
      ...environment,
      ...artifactEnvironment(environment, runId, step.label),
      E2E_GLOBAL_TIMEOUT: String(childGlobalTimeout),
      PLAYWRIGHT_HTML_OPEN: "never",
    };

    log(`[e2e] ${index + 1}/${plan.length} ${step.label}`);
    let result;
    try {
      result = await run({
        command: process.execPath,
        arguments: [PLAYWRIGHT_CLI, ...step.arguments],
        cwd: options.cwd ?? process.cwd(),
        environment: childEnvironment,
        stdio: options.stdio ?? "inherit",
        timeoutMs: remaining,
        shutdownBudgetMs: CHILD_SHUTDOWN_BUDGET_MS,
      });
    } catch (error) {
      logError(
        `[e2e] ${step.label}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      failed = true;
      continue;
    }

    if (result.interruptedSignal) {
      logError(
        `[e2e] ${step.label}: interrupted by ${result.interruptedSignal}`,
      );
      return signalExitCode(result.interruptedSignal);
    }
    if (result.timedOut) {
      logError(`[e2e] ${step.label}: timed out`);
      return 1;
    }
    if (result.error) {
      logError(`[e2e] ${step.label}: ${result.error.message}`);
      failed = true;
    } else if (result.status !== 0) {
      logError(
        `[e2e] ${step.label}: ${
          result.signal ? `signal ${result.signal}` : `exit ${result.status}`
        }`,
      );
      failed = true;
    }
  }

  return failed ? 1 : 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  process.exitCode = await executeE2eSuite();
}
