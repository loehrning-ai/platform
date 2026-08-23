import "server-only";

import { courseTerminalSandboxImage } from "@/lib/provider-readiness";

import { DATA_WORKSPACE_FILES } from "./data-workspace-fixtures";
import type {
  DataWorkspaceAttestation,
  SyntheticTerminalCommand,
  SyntheticTerminalCommandResult,
  SyntheticTerminalResponse,
} from "./types";
import {
  DATA_WORKSPACE_COMMANDS,
  hasVerifiedSyntheticTerminalEvidence,
  REPOSITORY_TERMINAL_COMMANDS,
  SYNTHETIC_TERMINAL_COMMAND_LABELS,
  SYNTHETIC_TERMINAL_CONTRACT,
} from "./types";
import {
  rawDataWorkspaceAttestationSchema,
  type SyntheticTerminalRequest,
} from "./validation";

const EXECUTION_DEADLINE_MS = 45_000;
const SANDBOX_LIFETIME_MS = 45_000;
const CREATE_TIMEOUT_MS = 10_000;
const COMMAND_TIMEOUT_MS = 10_000;
const TEARDOWN_TIMEOUT_MS = 5_000;
const MAX_OUTPUT_CHARS = 12_000;
const WORKSPACE_DIRECTORY = "/vercel/sandbox/workspace";

interface FinishedCommandLike {
  readonly exitCode: number;
  readonly durationMs?: number;
  stdout(): Promise<string>;
  stderr(): Promise<string>;
}

interface SandboxLike {
  writeFiles(
    files: {
      path: string;
      content: string | Uint8Array;
      mode?: number;
    }[],
    options?: { signal?: AbortSignal },
  ): Promise<void>;
  runCommand(params: {
    cmd: string;
    args?: string[];
    cwd?: string;
    timeoutMs?: number;
    signal?: AbortSignal;
  }): Promise<FinishedCommandLike>;
  stop(): Promise<unknown>;
}

type SandboxConstructor = typeof import("@vercel/sandbox")["Sandbox"];
type CreateSandboxParams = NonNullable<
  Parameters<SandboxConstructor["create"]>[0]
>;

type CreateSandbox = (
  params: CreateSandboxParams,
) => Promise<SandboxLike>;

export type SyntheticTerminalFailureKind =
  | "not_ready"
  | "timeout"
  | "unavailable";

export class SyntheticTerminalExecutionError extends Error {
  readonly kind: SyntheticTerminalFailureKind;

  constructor(kind: SyntheticTerminalFailureKind) {
    super(`Synthetic terminal failure:${kind}`);
    this.name = "SyntheticTerminalExecutionError";
    this.kind = kind;
  }
}

class ExecutionDeadline {
  private readonly controller = new AbortController();
  private readonly expiresAt = Date.now() + EXECUTION_DEADLINE_MS;
  private overallTimeout: ReturnType<typeof setTimeout> | undefined;
  private readonly overallDeadline: Promise<never>;

  constructor() {
    this.overallDeadline = new Promise<never>((_resolve, reject) => {
      this.overallTimeout = setTimeout(() => {
        reject(new SyntheticTerminalExecutionError("timeout"));
        this.controller.abort();
      }, EXECUTION_DEADLINE_MS);
    });
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  async run<T>(
    operation: (timeoutMs: number, signal: AbortSignal) => Promise<T>,
    maximumTimeoutMs: number,
  ): Promise<T> {
    const remainingMs = this.expiresAt - Date.now();
    if (remainingMs <= 0 || this.signal.aborted) {
      throw new SyntheticTerminalExecutionError("timeout");
    }
    const timeoutMs = Math.max(
      1,
      Math.min(maximumTimeoutMs, remainingMs),
    );
    let operationTimeout: ReturnType<typeof setTimeout> | undefined;
    const operationDeadline = new Promise<never>((_resolve, reject) => {
      operationTimeout = setTimeout(() => {
        reject(new SyntheticTerminalExecutionError("timeout"));
        this.controller.abort();
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        operationDeadline,
        this.overallDeadline,
        operation(timeoutMs, this.signal),
      ]);
    } finally {
      if (operationTimeout) clearTimeout(operationTimeout);
    }
  }

  dispose(): void {
    if (this.overallTimeout) clearTimeout(this.overallTimeout);
  }
}

async function stopSandbox(sandbox: SandboxLike): Promise<void> {
  let teardownTimeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      sandbox.stop(),
      new Promise<void>((resolve) => {
        teardownTimeout = setTimeout(resolve, TEARDOWN_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // Never expose SDK errors, which can contain infrastructure metadata.
  } finally {
    if (teardownTimeout) clearTimeout(teardownTimeout);
  }
}

const COMMAND_MAP: Readonly<
  Record<SyntheticTerminalCommand, { cmd: string; args: readonly string[] }>
> = {
  "workspace-path": { cmd: "pwd", args: [] },
  "workspace-list": { cmd: "ls", args: ["-la"] },
  "baseline-run": {
    cmd: "node",
    args: ["src/pipeline.mjs"],
  },
  "test-before-fix": { cmd: "node", args: ["--test"] },
  "apply-bounded-fix": {
    cmd: "node",
    args: ["scripts/apply-fix.mjs"],
  },
  "test-after-fix": { cmd: "node", args: ["--test"] },
  "source-check": { cmd: "node", args: ["--check", "src/pipeline.mjs"] },
  "diff-check": { cmd: "git", args: ["diff", "--check"] },
  "git-status": { cmd: "git", args: ["status", "--short"] },
  "git-diff": {
    cmd: "git",
    args: ["diff", "--no-ext-diff", "--", "src/pipeline.mjs"],
  },
  "node src/experiment.mjs": { cmd: "node", args: ["src/experiment.mjs"] },
  "node src/backfill.mjs": { cmd: "node", args: ["src/backfill.mjs"] },
  "node src/control-room.mjs": {
    cmd: "node",
    args: ["src/control-room.mjs"],
  },
  "node --test": { cmd: "node", args: ["--test"] },
};

const SYNTHETIC_FILES = [
  {
    path: `${WORKSPACE_DIRECTORY}/README.md`,
    content: `# Synthetic pipeline quality lab

This workspace contains fictional event records only. Diagnose the duplicate
handling bug, run the tests, apply the provided bounded fix, and inspect the
real Git diff. Network access is disabled for the complete sandbox lifetime.
`,
  },
  {
    path: `${WORKSPACE_DIRECTORY}/src/pipeline.mjs`,
    content: `export const events = [
  { id: "evt-101", value: 12 },
  { id: "evt-102", value: 18 },
  { id: "evt-101", value: 12 },
  { id: "evt-103", value: 7 },
];

export function deduplicate(records) {
  return records; // BUG: duplicate event IDs pass through
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const result = deduplicate(events);
  console.log(JSON.stringify({ input: events.length, output: result.length }));
}
`,
  },
  {
    path: `${WORKSPACE_DIRECTORY}/pipeline.test.mjs`,
    content: `import assert from "node:assert/strict";
import test from "node:test";
import { deduplicate, events } from "./src/pipeline.mjs";

test("emits one row per synthetic event id", () => {
  assert.equal(deduplicate(events).length, 3);
});
`,
  },
  {
    path: `${WORKSPACE_DIRECTORY}/scripts/apply-fix.mjs`,
    content: `import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../src/pipeline.mjs", import.meta.url);
const before = await readFile(path, "utf8");
const marker = "  return records; // BUG: duplicate event IDs pass through";
const replacement =
  "  return [...new Map(records.map((record) => [record.id, record])).values()];";
if (!before.includes(marker)) {
  console.error("expected synthetic bug marker not found");
  process.exit(2);
}
await writeFile(path, before.replace(marker, replacement));
console.log("bounded fix applied to src/pipeline.mjs");
`,
  },
] as const;

function boundedOutput(value: string): {
  readonly text: string;
  readonly truncated: boolean;
} {
  if (value.length <= MAX_OUTPUT_CHARS) {
    return { text: value, truncated: false };
  }
  return {
    text: `${value.slice(0, MAX_OUTPUT_CHARS)}\n[output truncated]`,
    truncated: true,
  };
}

async function defaultCreateSandbox(
  params: CreateSandboxParams,
): Promise<SandboxLike> {
  const { Sandbox } = await import("@vercel/sandbox");
  return Sandbox.create(params);
}

async function runFixedCommand(
  sandbox: SandboxLike,
  command: SyntheticTerminalCommand,
  deadline: ExecutionDeadline,
): Promise<SyntheticTerminalCommandResult> {
  const spec = COMMAND_MAP[command];
  const result = await deadline.run(
    (timeoutMs, signal) =>
      sandbox.runCommand({
        cmd: spec.cmd,
        args: [...spec.args],
        cwd: WORKSPACE_DIRECTORY,
        timeoutMs,
        signal,
      }),
    COMMAND_TIMEOUT_MS,
  );
  const [rawStdout, rawStderr] = await deadline.run(
    () => Promise.all([result.stdout(), result.stderr()]),
    COMMAND_TIMEOUT_MS,
  );
  const stdout = boundedOutput(rawStdout);
  const stderr = boundedOutput(rawStderr);
  return {
    commandId: command,
    command: SYNTHETIC_TERMINAL_COMMAND_LABELS[command],
    stdout: stdout.text,
    stderr: stderr.text,
    exitCode: result.exitCode,
    durationMs: result.durationMs ?? null,
    truncated: stdout.truncated || stderr.truncated,
  };
}

async function seedWorkspace(
  sandbox: SandboxLike,
  workspace: SyntheticTerminalRequest["workspace"],
  deadline: ExecutionDeadline,
): Promise<void> {
  const files =
    workspace === "pipeline-quality"
      ? SYNTHETIC_FILES
      : DATA_WORKSPACE_FILES[workspace];
  await deadline.run(
    (_timeoutMs, signal) => sandbox.writeFiles([...files], { signal }),
    COMMAND_TIMEOUT_MS,
  );
  if (workspace !== "pipeline-quality") return;
  const setupCommands = [
    { cmd: "git", args: ["init", "--quiet"] },
    {
      cmd: "git",
      args: ["config", "user.email", "course-sandbox@example.invalid"],
    },
    { cmd: "git", args: ["config", "user.name", "Course Sandbox"] },
    { cmd: "git", args: ["add", "--", "."] },
    { cmd: "git", args: ["commit", "--quiet", "-m", "synthetic baseline"] },
  ] as const;
  for (const command of setupCommands) {
    const result = await deadline.run(
      (timeoutMs, signal) =>
        sandbox.runCommand({
          cmd: command.cmd,
          args: [...command.args],
          cwd: WORKSPACE_DIRECTORY,
          timeoutMs,
          signal,
        }),
      COMMAND_TIMEOUT_MS,
    );
    if (result.exitCode !== 0) {
      throw new SyntheticTerminalExecutionError("unavailable");
    }
  }
}

function requestHasCanonicalSequence(request: SyntheticTerminalRequest): boolean {
  const expected =
    request.workspace === "pipeline-quality"
      ? REPOSITORY_TERMINAL_COMMANDS
      : DATA_WORKSPACE_COMMANDS[request.workspace];
  return (
    request.commands.length === expected.length &&
    request.commands.every((command, index) => command === expected[index])
  );
}

function attestDataWorkspace(
  workspace: Exclude<SyntheticTerminalRequest["workspace"], "pipeline-quality">,
  commands: readonly SyntheticTerminalCommandResult[],
): DataWorkspaceAttestation {
  const [execution, tests] = commands;
  if (
    !execution ||
    !tests ||
    commands.length !== 2 ||
    execution.exitCode !== 0 ||
    tests.exitCode !== 0 ||
    execution.truncated ||
    tests.truncated ||
    execution.stderr.trim() ||
    !/(?:^|\s)pass\s+2(?:\s|$)/u.test(
      `${tests.stdout}\n${tests.stderr}`,
    ) ||
    !/(?:^|\s)fail\s+0(?:\s|$)/u.test(
      `${tests.stdout}\n${tests.stderr}`,
    )
  ) {
    throw new SyntheticTerminalExecutionError("unavailable");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(execution.stdout.trim());
  } catch {
    throw new SyntheticTerminalExecutionError("unavailable");
  }
  const parsed = rawDataWorkspaceAttestationSchema.safeParse({
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    testsPassed: true,
  });
  if (!parsed.success || parsed.data.workspace !== workspace) {
    throw new SyntheticTerminalExecutionError("unavailable");
  }
  return parsed.data;
}

export async function executeSyntheticWorkspace(
  request: SyntheticTerminalRequest,
  createSandbox: CreateSandbox = defaultCreateSandbox,
): Promise<SyntheticTerminalResponse> {
  let sandbox: SandboxLike | null = null;
  const deadline = new ExecutionDeadline();
  try {
    if (!requestHasCanonicalSequence(request)) {
      throw new SyntheticTerminalExecutionError("not_ready");
    }
    const sandboxImage = courseTerminalSandboxImage();
    if (!sandboxImage) {
      throw new SyntheticTerminalExecutionError("not_ready");
    }
    sandbox = await deadline.run(
      (_timeoutMs, signal) =>
        createSandbox({
          image: sandboxImage,
          timeout: SANDBOX_LIFETIME_MS,
          persistent: false,
          networkPolicy: "deny-all",
          env: { CI: "1", NO_COLOR: "1" },
          signal,
        }),
      CREATE_TIMEOUT_MS,
    );
    await seedWorkspace(sandbox, request.workspace, deadline);

    const commands: SyntheticTerminalCommandResult[] = [];
    for (const command of request.commands) {
      commands.push(await runFixedCommand(sandbox, command, deadline));
    }

    if (request.workspace !== "pipeline-quality") {
      const attestation = attestDataWorkspace(request.workspace, commands);
      return {
        workspace: request.workspace,
        runtime: "node24",
        network: "deny-all",
        persistent: false,
        commands,
        diff: "",
        diffTruncated: false,
        attestation,
      };
    }

    const diffCommand = commands.at(-1);
    const diff = {
      text: diffCommand?.stdout ?? "",
      truncated: diffCommand?.truncated ?? true,
    };
    if (
      !hasVerifiedSyntheticTerminalEvidence(
        commands,
        diff.text,
        diff.truncated,
      )
    ) {
      throw new SyntheticTerminalExecutionError("unavailable");
    }
    return {
      workspace: request.workspace,
      runtime: "node24",
      network: "deny-all",
      persistent: false,
      commands,
      diff: diff.text,
      diffTruncated: diff.truncated,
      attestation: {
        contract: SYNTHETIC_TERMINAL_CONTRACT,
        workspace: "pipeline-quality",
        outcome: "verified",
        commandCount: REPOSITORY_TERMINAL_COMMANDS.length,
      },
    };
  } catch (error) {
    if (error instanceof SyntheticTerminalExecutionError) throw error;
    throw new SyntheticTerminalExecutionError(
      deadline.signal.aborted ? "timeout" : "unavailable",
    );
  } finally {
    deadline.dispose();
    if (sandbox) {
      await stopSandbox(sandbox);
    }
  }
}
