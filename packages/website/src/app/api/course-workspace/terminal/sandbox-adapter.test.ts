import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  REPOSITORY_TERMINAL_COMMANDS,
  type SyntheticTerminalCommand,
} from "./types";
import {
  executeSyntheticWorkspace,
  SyntheticTerminalExecutionError,
} from "./sandbox-adapter";

interface FakeCommandResult {
  readonly exitCode: number;
  readonly durationMs: number;
  stdout(): Promise<string>;
  stderr(): Promise<string>;
}

interface FakeCommandParams {
  readonly cmd: string;
  readonly args?: string[];
  readonly cwd?: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

interface FakeWorkspaceFile {
  readonly path: string;
  readonly content: string | Uint8Array;
  readonly mode?: number;
}

const PINNED_IMAGE = `vercel/sandbox/node@sha256:${"a".repeat(64)}`;
const SCOPED_DIFF = `diff --git a/src/pipeline.mjs b/src/pipeline.mjs
index 1234567..89abcde 100644
--- a/src/pipeline.mjs
+++ b/src/pipeline.mjs
@@ -8,1 +8,1 @@
-  return records; // BUG: duplicate event IDs pass through
+  return [...new Map(records.map((record) => [record.id, record])).values()];
`;

function commandResult(
  stdout = "",
  stderr = "",
  exitCode = 0,
): FakeCommandResult {
  return {
    exitCode,
    durationMs: 5,
    stdout: async () => stdout,
    stderr: async () => stderr,
  };
}

function fakeSandbox(overrides?: {
  readonly truncatePwd?: boolean;
  readonly passingTestFails?: boolean;
  readonly unrelatedDiff?: boolean;
  readonly hangSetup?: boolean;
  readonly hangWorkload?: boolean;
}) {
  let testRuns = 0;
  const diff = overrides?.unrelatedDiff
    ? `${SCOPED_DIFF}diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n`
    : SCOPED_DIFF;
  const runCommand = vi.fn(async (params: FakeCommandParams) => {
    if (
      (overrides?.hangSetup &&
        params.cmd === "git" &&
        params.args?.[0] === "init") ||
      (overrides?.hangWorkload && params.cmd === "pwd")
    ) {
      return new Promise<FakeCommandResult>(() => undefined);
    }
    if (params.cmd === "pwd") {
      return commandResult(
        overrides?.truncatePwd ? "x".repeat(13_000) : "/vercel/sandbox/workspace\n",
      );
    }
    if (params.cmd === "node" && params.args?.[0] === "src/pipeline.mjs") {
      return commandResult('{"input":4,"output":4}\n');
    }
    if (params.cmd === "node" && params.args?.[0] === "--test") {
      testRuns += 1;
      if (testRuns === 1) return commandResult("# pass 0\n# fail 1\n", "", 1);
      return overrides?.passingTestFails
        ? commandResult("# pass 0\n# fail 1\n", "", 1)
        : commandResult("# pass 1\n# fail 0\n");
    }
    if (
      params.cmd === "node" &&
      params.args?.[0] === "scripts/apply-fix.mjs"
    ) {
      return commandResult("bounded fix applied to src/pipeline.mjs\n");
    }
    if (params.cmd === "git" && params.args?.[0] === "status") {
      return commandResult(" M src/pipeline.mjs\n");
    }
    if (
      params.cmd === "git" &&
      params.args?.[0] === "diff" &&
      params.args?.includes("src/pipeline.mjs")
    ) {
      return commandResult(diff);
    }
    return commandResult();
  });
  return {
    sandbox: {
      writeFiles: vi.fn(async (_files: FakeWorkspaceFile[]) => undefined),
      runCommand,
      stop: vi.fn(async () => undefined),
    },
    runCommand,
  };
}

function repositoryRequest() {
  return {
    workspace: "pipeline-quality" as const,
    commands: [...REPOSITORY_TERMINAL_COMMANDS],
  };
}

describe("synthetic Vercel Sandbox adapter", () => {
  beforeEach(() => {
    vi.stubEnv("COURSE_TERMINAL_SANDBOX_IMAGE", PINNED_IMAGE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("uses the reviewed digest, deny-all network, hard bounds, and always stops", async () => {
    const { sandbox, runCommand } = fakeSandbox();
    const createSandbox = vi.fn(
      async (_params: { signal?: AbortSignal }) => sandbox,
    );

    const response = await executeSyntheticWorkspace(
      repositoryRequest(),
      createSandbox,
    );

    expect(createSandbox).toHaveBeenCalledWith(
      expect.objectContaining({
        image: PINNED_IMAGE,
        timeout: 45_000,
        persistent: false,
        networkPolicy: "deny-all",
        env: { CI: "1", NO_COLOR: "1" },
        signal: expect.any(AbortSignal),
      }),
    );
    const createSignal = createSandbox.mock.calls[0]?.[0].signal;
    expect(createSignal?.aborted).toBe(false);
    expect(sandbox.writeFiles).toHaveBeenCalledTimes(1);
    const files = sandbox.writeFiles.mock.calls[0]?.[0];
    expect(files).toBeDefined();
    if (!files) throw new Error("synthetic workspace was not seeded");
    expect(files.map((file) => file.path)).toEqual([
      "/vercel/sandbox/workspace/README.md",
      "/vercel/sandbox/workspace/src/pipeline.mjs",
      "/vercel/sandbox/workspace/pipeline.test.mjs",
      "/vercel/sandbox/workspace/scripts/apply-fix.mjs",
    ]);
    expect(JSON.stringify(files)).not.toMatch(/api[_-]?key|token|credential/i);
    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        cmd: "node",
        args: ["--test"],
        cwd: "/vercel/sandbox/workspace",
        timeoutMs: 10_000,
      }),
    );
    expect(response).toMatchObject({
      runtime: "node24",
      network: "deny-all",
      persistent: false,
      diff: SCOPED_DIFF,
      attestation: {
        contract: "pipeline-quality-v1",
        workspace: "pipeline-quality",
        outcome: "verified",
        commandCount: 10,
      },
    });
    expect(response.commands.map((result) => result.commandId)).toEqual(
      REPOSITORY_TERMINAL_COMMANDS,
    );
    expect(response.commands.map((result) => result.exitCode)).toEqual([
      0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ]);
    expect(runCommand.mock.calls.slice(5).map(([params]) => [
      params.cmd,
      params.args ?? [],
    ])).toEqual([
      ["pwd", []],
      ["ls", ["-la"]],
      ["node", ["src/pipeline.mjs"]],
      ["node", ["--test"]],
      ["node", ["scripts/apply-fix.mjs"]],
      ["node", ["--test"]],
      ["node", ["--check", "src/pipeline.mjs"]],
      ["git", ["diff", "--check"]],
      ["git", ["status", "--short"]],
      ["git", ["diff", "--no-ext-diff", "--", "src/pipeline.mjs"]],
    ]);
    expect(sandbox.stop).toHaveBeenCalledTimes(1);
  });

  it("derives command timeouts from the remaining overall budget", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { sandbox, runCommand } = fakeSandbox();
    const createSandbox = vi.fn(async () => {
      vi.setSystemTime(40_000);
      return sandbox;
    });

    await executeSyntheticWorkspace(repositoryRequest(), createSandbox);

    expect(runCommand).not.toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 10_000 }),
    );
    for (const [params] of runCommand.mock.calls) {
      expect(params.timeoutMs).toBe(5_000);
    }
    expect(sandbox.stop).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["setup", { hangSetup: true }, 1],
    ["workload", { hangWorkload: true }, 6],
  ] as const)(
    "classifies a hanging %s command as timeout and stops the sandbox",
    async (_label, overrides, expectedCallCount) => {
      vi.useFakeTimers();
      const { sandbox, runCommand } = fakeSandbox(overrides);
      const execution = executeSyntheticWorkspace(
        repositoryRequest(),
        vi.fn(async () => sandbox),
      ).catch((error: unknown) => error);

      await vi.advanceTimersByTimeAsync(0);
      expect(runCommand).toHaveBeenCalledTimes(expectedCallCount);
      await vi.advanceTimersByTimeAsync(10_000);

      const error = await execution;
      expect(error).toBeInstanceOf(SyntheticTerminalExecutionError);
      expect(error).toMatchObject({ kind: "timeout" });
      expect(sandbox.stop).toHaveBeenCalledTimes(1);
    },
  );

  it("bounds teardown after a workload timeout", async () => {
    vi.useFakeTimers();
    const { sandbox } = fakeSandbox({ hangWorkload: true });
    sandbox.stop.mockImplementation(
      async () => new Promise<never>(() => undefined),
    );
    let settled = false;
    const execution = executeSyntheticWorkspace(
      repositoryRequest(),
      vi.fn(async () => sandbox),
    )
      .catch((error: unknown) => error)
      .finally(() => {
        settled = true;
      });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(sandbox.stop).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(4_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const error = await execution;
    expect(error).toMatchObject({ kind: "timeout" });
    expect(settled).toBe(true);
  });

  it("never invokes a shell and maps every public ID to fixed argv", async () => {
    const { sandbox, runCommand } = fakeSandbox();
    await executeSyntheticWorkspace(
      repositoryRequest(),
      vi.fn(async () => sandbox),
    );

    for (const [params] of runCommand.mock.calls) {
      expect(params.cmd).not.toMatch(/^(?:sh|bash|zsh)$/);
      expect(params).not.toHaveProperty("shell");
      expect(params.timeoutMs).toBe(10_000);
    }
    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({ cmd: "node", args: ["--check", "src/pipeline.mjs"] }),
    );
    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({ cmd: "git", args: ["diff", "--check"] }),
    );
  });

  it.each([
    ["subset", ["workspace-path"]],
    ["reordered", [...REPOSITORY_TERMINAL_COMMANDS].reverse()],
    [
      "repeated",
      REPOSITORY_TERMINAL_COMMANDS.map((command, index) =>
        index === 1 ? "workspace-path" : command,
      ),
    ],
  ] as const)("rejects a %s sequence before Sandbox creation", async (_label, commands) => {
    const createSandbox = vi.fn();
    const error = await executeSyntheticWorkspace(
      {
        workspace: "pipeline-quality",
        commands: [...commands] as SyntheticTerminalCommand[],
      },
      createSandbox,
    ).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ kind: "not_ready" });
    expect(createSandbox).not.toHaveBeenCalled();
  });

  it("fails closed without a reviewed immutable image", async () => {
    vi.stubEnv("COURSE_TERMINAL_SANDBOX_IMAGE", "vercel/sandbox/node:24");
    const createSandbox = vi.fn();
    const error = await executeSyntheticWorkspace(
      repositoryRequest(),
      createSandbox,
    ).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ kind: "not_ready" });
    expect(createSandbox).not.toHaveBeenCalled();
  });

  it.each([
    ["truncated output", { truncatePwd: true }],
    ["failed post-fix test", { passingTestFails: true }],
    ["unrelated diff", { unrelatedDiff: true }],
  ] as const)("refuses attestation for %s", async (_label, overrides) => {
    const { sandbox } = fakeSandbox(overrides);
    const error = await executeSyntheticWorkspace(
      repositoryRequest(),
      vi.fn(async () => sandbox),
    ).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ kind: "unavailable" });
    expect(sandbox.stop).toHaveBeenCalledTimes(1);
  });

  it("sanitizes creation and command failures", async () => {
    const creationError = await executeSyntheticWorkspace(
      repositoryRequest(),
      vi.fn(async () => {
        throw new Error("private infrastructure metadata");
      }),
    ).catch((error: unknown) => error);
    expect(creationError).toBeInstanceOf(SyntheticTerminalExecutionError);
    expect(String(creationError)).not.toContain("private infrastructure");

    const { sandbox } = fakeSandbox();
    sandbox.runCommand.mockRejectedValueOnce(
      new Error("private infrastructure metadata"),
    );
    const commandError = await executeSyntheticWorkspace(
      repositoryRequest(),
      vi.fn(async () => sandbox),
    ).catch((error: unknown) => error);
    expect(commandError).toMatchObject({ kind: "unavailable" });
    expect(sandbox.stop).toHaveBeenCalledTimes(1);
  });
});
