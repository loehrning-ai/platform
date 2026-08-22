import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/provider-readiness", () => ({
  courseTerminalSandboxImage: () =>
    `registry.example.invalid/course-node@sha256:${"a".repeat(64)}`,
}));

import {
  executeSyntheticWorkspace,
  SyntheticTerminalExecutionError,
} from "./sandbox-adapter";
import { DATA_WORKSPACE_COMMANDS } from "./types";
import { isVerifiedDataWorkspaceResponse } from "./types";
import type {
  DataWorkspaceAttestation,
  SyntheticWorkspaceId,
} from "./types";

type DataWorkspaceId = Exclude<SyntheticWorkspaceId, "pipeline-quality">;

const ATTESTATIONS = {
  "data-science-experiment": {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    testsPassed: true,
    workspace: "data-science-experiment",
    fixtureVersion: "ds-leakage-v1",
    variant: "experiment",
    rowsRead: 249,
    controlN: 120,
    treatmentN: 118,
    missingRows: 11,
    controlRatePct: 42,
    safeTreatmentRatePct: 47,
    leakedTreatmentRatePct: 64,
    safeEffectPoints: 5,
    leakageInflationPoints: 17,
    interimLooks: 5,
    leakageDetected: true,
  },
  "data-engineering-pipeline": {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    testsPassed: true,
    workspace: "data-engineering-pipeline",
    fixtureVersion: "de-events-v1",
    variant: "pipeline",
    inputEvents: 117,
    acceptedEvents: 102,
    duplicateEvents: 14,
    invalidEvents: 1,
    lateEvents: 8,
    firstOutput: 94,
    backfillOutput: 102,
    replayOutput: 102,
    reconciled: true,
    idempotent: true,
  },
  "data-infrastructure-recovery": {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    testsPassed: true,
    workspace: "data-infrastructure-recovery",
    fixtureVersion: "di-partition-v1",
    variant: "control-room",
    peakBacklog: 9200,
    failureP95Ms: 684,
    recoveryP95Ms: 210,
    sloTargetMs: 250,
    failureDuplicateRatePct: 14.2,
    recoveryDuplicateRatePct: 0.8,
    dataLoss: 0,
    costMultiple: 2.4,
    sloBreached: true,
    recovered: true,
  },
} as const satisfies Readonly<Record<DataWorkspaceId, DataWorkspaceAttestation>>;

function commandResult(stdout: string, stderr = "", exitCode = 0) {
  return {
    exitCode,
    durationMs: 8,
    stdout: async () => stdout,
    stderr: async () => stderr,
  };
}

function fakeSandbox(workspace: DataWorkspaceId) {
  const rawAttestation = { ...ATTESTATIONS[workspace] } as Record<
    string,
    unknown
  >;
  delete rawAttestation.testsPassed;
  const runCommand = vi.fn(
    async (params: { cmd: string; args?: string[]; timeoutMs?: number }) =>
      params.cmd === "node" && params.args?.[0] === "--test"
        ? commandResult("tests 2\npass 2\nfail 0\n")
        : commandResult(`${JSON.stringify(rawAttestation)}\n`),
  );
  return {
    writeFiles: vi.fn(async () => undefined),
    runCommand,
    stop: vi.fn(async () => undefined),
  };
}

describe("data workspace sandbox adapter", () => {
  it.each(Object.keys(ATTESTATIONS) as DataWorkspaceId[])(
    "attests actual program output and a passing two-test process for %s",
    async (workspace) => {
      const sandbox = fakeSandbox(workspace);
      const createSandbox = vi.fn(
        async (_params: { signal?: AbortSignal }) => sandbox,
      );
      const response = await executeSyntheticWorkspace(
        { workspace, commands: [...DATA_WORKSPACE_COMMANDS[workspace]] },
        createSandbox,
      );

      expect(createSandbox).toHaveBeenCalledWith(
        expect.objectContaining({
          image: `registry.example.invalid/course-node@sha256:${"a".repeat(64)}`,
          timeout: 45_000,
          persistent: false,
          networkPolicy: "deny-all",
          signal: expect.any(AbortSignal),
        }),
      );
      const createSignal = createSandbox.mock.calls[0]?.[0].signal;
      expect(createSignal?.aborted).toBe(false);
      expect(response).toMatchObject({
        workspace,
        runtime: "node24",
        network: "deny-all",
        persistent: false,
        commands: [
          { exitCode: 0, truncated: false },
          { commandId: "node --test", exitCode: 0, truncated: false },
        ],
        diff: "",
        diffTruncated: false,
        attestation: ATTESTATIONS[workspace],
      });
      expect(isVerifiedDataWorkspaceResponse(response, workspace)).toBe(true);
      expect(sandbox.writeFiles).toHaveBeenCalledTimes(1);
      expect(sandbox.stop).toHaveBeenCalledTimes(1);
      expect(
        sandbox.runCommand.mock.calls.every(
          ([params]) => params.cmd !== "sh" && params.cmd !== "bash",
        ),
      ).toBe(true);
    },
  );

  it("rejects output that merely claims metrics without passing tests", async () => {
    const workspace = "data-science-experiment" as const;
    const sandbox = fakeSandbox(workspace);
    sandbox.runCommand.mockImplementation(
      async (params: { cmd: string; args?: string[] }) =>
        params.cmd === "node" && params.args?.[0] === "--test"
          ? commandResult("tests 2\npass 1\nfail 1\n", "", 1)
          : commandResult(
              `${JSON.stringify({
                ...ATTESTATIONS[workspace],
                testsPassed: undefined,
              })}\n`,
            ),
    );

    const error = await executeSyntheticWorkspace(
      { workspace, commands: [...DATA_WORKSPACE_COMMANDS[workspace]] },
      vi.fn(async () => sandbox),
    ).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(SyntheticTerminalExecutionError);
    expect(error).toMatchObject({ kind: "unavailable" });
    expect(sandbox.stop).toHaveBeenCalledTimes(1);
  });

  it("rejects an attestation with any unreviewed output field", async () => {
    const workspace = "data-science-experiment" as const;
    const sandbox = fakeSandbox(workspace);
    const raw = { ...ATTESTATIONS[workspace], testsPassed: undefined, extra: 1 };
    sandbox.runCommand.mockImplementation(
      async (params: { cmd: string; args?: string[] }) =>
        params.cmd === "node" && params.args?.[0] === "--test"
          ? commandResult("tests 2\npass 2\nfail 0\n")
          : commandResult(`${JSON.stringify(raw)}\n`),
    );

    const error = await executeSyntheticWorkspace(
      { workspace, commands: [...DATA_WORKSPACE_COMMANDS[workspace]] },
      vi.fn(async () => sandbox),
    ).catch((reason: unknown) => reason);
    expect(error).toMatchObject({ kind: "unavailable" });
    expect(sandbox.stop).toHaveBeenCalledTimes(1);
  });

  it("client verification rejects inconsistent stdout and test transcripts", async () => {
    const workspace = "data-science-experiment" as const;
    const sandbox = fakeSandbox(workspace);
    const response = await executeSyntheticWorkspace(
      { workspace, commands: [...DATA_WORKSPACE_COMMANDS[workspace]] },
      vi.fn(async () => sandbox),
    );

    const inconsistentOutput = {
      ...structuredClone(response),
      commands: response.commands.map((command, index) =>
        index === 0
          ? {
              ...command,
              stdout: command.stdout.replace(
                '"rowsRead":249',
                '"rowsRead":250',
              ),
            }
          : command,
      ),
    };
    expect(
      isVerifiedDataWorkspaceResponse(inconsistentOutput, workspace),
    ).toBe(false);

    const falseTranscript = {
      ...structuredClone(response),
      commands: response.commands.map((command, index) =>
        index === 1
          ? { ...command, stdout: "tests 2\npass 1\nfail 1\n" }
          : command,
      ),
    };
    expect(
      isVerifiedDataWorkspaceResponse(falseTranscript, workspace),
    ).toBe(false);
  });

  it("rejects a direct adapter call whose fixed sequence is incomplete", async () => {
    const error = await executeSyntheticWorkspace(
      {
        workspace: "data-engineering-pipeline",
        commands: ["node src/backfill.mjs"],
      },
      vi.fn(async () => fakeSandbox("data-engineering-pipeline")),
    ).catch((reason: unknown) => reason);

    expect(error).toMatchObject({ kind: "not_ready" });
  });
});
