export const SYNTHETIC_WORKSPACE_IDS = [
  "pipeline-quality",
  "data-science-experiment",
  "data-engineering-pipeline",
  "data-infrastructure-recovery",
] as const;
export type SyntheticWorkspaceId = (typeof SYNTHETIC_WORKSPACE_IDS)[number];

/**
 * Public request IDs, not learner-controlled argv. Distinct before/after test
 * IDs make the repository sequence unambiguous and reject repetitions.
 */
export const REPOSITORY_TERMINAL_COMMANDS = [
  "workspace-path",
  "workspace-list",
  "baseline-run",
  "test-before-fix",
  "apply-bounded-fix",
  "test-after-fix",
  "source-check",
  "diff-check",
  "git-status",
  "git-diff",
] as const;

export const DATA_WORKSPACE_COMMANDS = {
  "data-science-experiment": ["node src/experiment.mjs", "node --test"],
  "data-engineering-pipeline": ["node src/backfill.mjs", "node --test"],
  "data-infrastructure-recovery": [
    "node src/control-room.mjs",
    "node --test",
  ],
} as const;

export const SYNTHETIC_TERMINAL_COMMANDS = [
  ...REPOSITORY_TERMINAL_COMMANDS,
  "node src/experiment.mjs",
  "node src/backfill.mjs",
  "node src/control-room.mjs",
  "node --test",
] as const;
export type SyntheticTerminalCommand =
  | (typeof REPOSITORY_TERMINAL_COMMANDS)[number]
  | (typeof DATA_WORKSPACE_COMMANDS)[keyof typeof DATA_WORKSPACE_COMMANDS][number];

export const SYNTHETIC_TERMINAL_CONTRACT = "pipeline-quality-v1" as const;

export const SYNTHETIC_TERMINAL_COMMAND_LABELS: Readonly<
  Record<SyntheticTerminalCommand, string>
> = {
  "workspace-path": "pwd",
  "workspace-list": "ls -la",
  "baseline-run": "node src/pipeline.mjs",
  "test-before-fix": "node --test",
  "apply-bounded-fix": "node scripts/apply-fix.mjs",
  "test-after-fix": "node --test",
  "source-check": "node --check src/pipeline.mjs",
  "diff-check": "git diff --check",
  "git-status": "git status --short",
  "git-diff": "git diff",
  "node src/experiment.mjs": "node src/experiment.mjs",
  "node src/backfill.mjs": "node src/backfill.mjs",
  "node src/control-room.mjs": "node src/control-room.mjs",
  "node --test": "node --test",
};

export interface SyntheticTerminalCommandResult {
  readonly commandId: SyntheticTerminalCommand;
  readonly command: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly durationMs: number | null;
  readonly truncated: boolean;
}

export interface SyntheticTerminalAttestation {
  readonly contract: typeof SYNTHETIC_TERMINAL_CONTRACT;
  readonly workspace: "pipeline-quality";
  readonly outcome: "verified";
  readonly commandCount: typeof REPOSITORY_TERMINAL_COMMANDS.length;
}

interface DataWorkspaceAttestationBase {
  readonly schema: "data-workspace-attestation-v1";
  readonly runtime: "node24";
  readonly testsPassed: true;
}

export type DataWorkspaceAttestation = DataWorkspaceAttestationBase &
  (
    | {
        readonly workspace: "data-science-experiment";
        readonly fixtureVersion: "ds-leakage-v1";
        readonly variant: "experiment";
        readonly rowsRead: 249;
        readonly controlN: 120;
        readonly treatmentN: 118;
        readonly missingRows: 11;
        readonly controlRatePct: 42;
        readonly safeTreatmentRatePct: 47;
        readonly leakedTreatmentRatePct: 64;
        readonly safeEffectPoints: 5;
        readonly leakageInflationPoints: 17;
        readonly interimLooks: 5;
        readonly leakageDetected: true;
      }
    | {
        readonly workspace: "data-engineering-pipeline";
        readonly fixtureVersion: "de-events-v1";
        readonly variant: "pipeline";
        readonly inputEvents: 117;
        readonly acceptedEvents: 102;
        readonly duplicateEvents: 14;
        readonly invalidEvents: 1;
        readonly lateEvents: 8;
        readonly firstOutput: 94;
        readonly backfillOutput: 102;
        readonly replayOutput: 102;
        readonly reconciled: true;
        readonly idempotent: true;
      }
    | {
        readonly workspace: "data-infrastructure-recovery";
        readonly fixtureVersion: "di-partition-v1";
        readonly variant: "control-room";
        readonly peakBacklog: 9200;
        readonly failureP95Ms: 684;
        readonly recoveryP95Ms: 210;
        readonly sloTargetMs: 250;
        readonly failureDuplicateRatePct: 14.2;
        readonly recoveryDuplicateRatePct: 0.8;
        readonly dataLoss: 0;
        readonly costMultiple: 2.4;
        readonly sloBreached: true;
        readonly recovered: true;
      }
  );

export interface SyntheticTerminalResponse {
  readonly workspace: SyntheticWorkspaceId;
  readonly runtime: "node24";
  readonly network: "deny-all";
  readonly persistent: false;
  readonly commands: readonly SyntheticTerminalCommandResult[];
  readonly diff: string;
  readonly diffTruncated: boolean;
  readonly attestation: SyntheticTerminalAttestation | DataWorkspaceAttestation;
}

export type VerifiedRepositoryTerminalResponse = SyntheticTerminalResponse & {
  readonly workspace: "pipeline-quality";
  readonly attestation: SyntheticTerminalAttestation;
};

export type VerifiedDataTerminalResponse = SyntheticTerminalResponse & {
  readonly workspace: Exclude<SyntheticWorkspaceId, "pipeline-quality">;
  readonly attestation: DataWorkspaceAttestation;
};

export interface SyntheticTerminalError {
  readonly error: string;
}

const MAX_PUBLIC_OUTPUT_CHARS = 12_040;
const EXPECTED_REPOSITORY_EXIT_CODES = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0] as const;

function isBoundedText(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_PUBLIC_OUTPUT_CHARS;
}

function isCommandResult(value: unknown): value is SyntheticTerminalCommandResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const result = value as Partial<SyntheticTerminalCommandResult>;
  return (
    typeof result.commandId === "string" &&
    typeof result.command === "string" &&
    isBoundedText(result.stdout) &&
    isBoundedText(result.stderr) &&
    Number.isInteger(result.exitCode) &&
    (result.durationMs === null ||
      (typeof result.durationMs === "number" &&
        Number.isFinite(result.durationMs) &&
        result.durationMs >= 0)) &&
    typeof result.truncated === "boolean"
  );
}

function hasScopedPipelineDiff(diff: string): boolean {
  const fileHeaders = diff.match(/^diff --git /gmu) ?? [];
  return (
    diff.length > 0 &&
    fileHeaders.length === 1 &&
    diff.includes("diff --git a/src/pipeline.mjs b/src/pipeline.mjs") &&
    diff.includes("--- a/src/pipeline.mjs") &&
    diff.includes("+++ b/src/pipeline.mjs") &&
    diff.includes(
      "-  return records; // BUG: duplicate event IDs pass through",
    ) &&
    diff.includes(
      "+  return [...new Map(records.map((record) => [record.id, record])).values()];",
    )
  );
}

/**
 * Semantic evidence gate shared by the server adapter and browser. Nominal
 * success cannot verify the project unless every canonical step ran in order
 * with the expected before/fix/after outcomes and one bounded, scoped diff.
 */
export function hasVerifiedSyntheticTerminalEvidence(
  commands: readonly SyntheticTerminalCommandResult[],
  diff: string,
  diffTruncated: boolean,
): boolean {
  if (
    commands.length !== REPOSITORY_TERMINAL_COMMANDS.length ||
    diffTruncated ||
    !isBoundedText(diff) ||
    !hasScopedPipelineDiff(diff)
  ) {
    return false;
  }

  for (const [index, commandId] of REPOSITORY_TERMINAL_COMMANDS.entries()) {
    const result = commands[index];
    if (
      !isCommandResult(result) ||
      result.commandId !== commandId ||
      result.command !== SYNTHETIC_TERMINAL_COMMAND_LABELS[commandId] ||
      result.exitCode !== EXPECTED_REPOSITORY_EXIT_CODES[index] ||
      result.truncated
    ) {
      return false;
    }
  }

  const baseline = commands[2];
  const failingTest = commands[3];
  const fix = commands[4];
  const passingTest = commands[5];
  const status = commands[8];
  const diffCommand = commands[9];
  if (!baseline || !failingTest || !fix || !passingTest || !status || !diffCommand) {
    return false;
  }

  return (
    baseline.stdout.trim() === '{"input":4,"output":4}' &&
    /(?:^|\s)fail\s+1(?:\s|$)/u.test(
      `${failingTest.stdout}\n${failingTest.stderr}`,
    ) &&
    fix.stdout.trim() === "bounded fix applied to src/pipeline.mjs" &&
    /(?:^|\s)pass\s+1(?:\s|$)/u.test(
      `${passingTest.stdout}\n${passingTest.stderr}`,
    ) &&
    /(?:^|\s)fail\s+0(?:\s|$)/u.test(
      `${passingTest.stdout}\n${passingTest.stderr}`,
    ) &&
    status.stdout.trim() === "M src/pipeline.mjs" &&
    diffCommand.stdout === diff
  );
}

export function isVerifiedSyntheticTerminalResponse(
  value: unknown,
): value is VerifiedRepositoryTerminalResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<SyntheticTerminalResponse>;
  const attestation = candidate.attestation as
    | Partial<SyntheticTerminalAttestation>
    | undefined;
  return (
    candidate.workspace === "pipeline-quality" &&
    candidate.runtime === "node24" &&
    candidate.network === "deny-all" &&
    candidate.persistent === false &&
    Array.isArray(candidate.commands) &&
    typeof candidate.diff === "string" &&
    typeof candidate.diffTruncated === "boolean" &&
    hasVerifiedSyntheticTerminalEvidence(
      candidate.commands,
      candidate.diff,
      candidate.diffTruncated,
    ) &&
    typeof attestation === "object" &&
    attestation !== null &&
    Object.keys(attestation).length === 4 &&
    attestation.contract === SYNTHETIC_TERMINAL_CONTRACT &&
    attestation.workspace === "pipeline-quality" &&
    attestation.outcome === "verified" &&
    attestation.commandCount === REPOSITORY_TERMINAL_COMMANDS.length
  );
}

function hasExactDataAttestationKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  return (
    actual.length === expected.length &&
    [...expected].sort().every((key, index) => key === actual[index])
  );
}

function isExpectedDataAttestation(
  value: unknown,
  workspace: Exclude<SyntheticWorkspaceId, "pipeline-quality">,
): value is DataWorkspaceAttestation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const attestation = value as Record<string, unknown>;
  const base =
    attestation.schema === "data-workspace-attestation-v1" &&
    attestation.runtime === "node24" &&
    attestation.testsPassed === true &&
    attestation.workspace === workspace;
  if (!base) return false;

  if (workspace === "data-science-experiment") {
    return (
      hasExactDataAttestationKeys(attestation, [
        "schema", "runtime", "testsPassed", "workspace", "fixtureVersion",
        "variant", "rowsRead", "controlN", "treatmentN", "missingRows",
        "controlRatePct", "safeTreatmentRatePct", "leakedTreatmentRatePct",
        "safeEffectPoints", "leakageInflationPoints", "interimLooks",
        "leakageDetected",
      ]) &&
      attestation.fixtureVersion === "ds-leakage-v1" &&
      attestation.variant === "experiment" &&
      attestation.rowsRead === 249 &&
      attestation.controlN === 120 &&
      attestation.treatmentN === 118 &&
      attestation.missingRows === 11 &&
      attestation.controlRatePct === 42 &&
      attestation.safeTreatmentRatePct === 47 &&
      attestation.leakedTreatmentRatePct === 64 &&
      attestation.safeEffectPoints === 5 &&
      attestation.leakageInflationPoints === 17 &&
      attestation.interimLooks === 5 &&
      attestation.leakageDetected === true
    );
  }
  if (workspace === "data-engineering-pipeline") {
    return (
      hasExactDataAttestationKeys(attestation, [
        "schema", "runtime", "testsPassed", "workspace", "fixtureVersion",
        "variant", "inputEvents", "acceptedEvents", "duplicateEvents",
        "invalidEvents", "lateEvents", "firstOutput", "backfillOutput",
        "replayOutput", "reconciled", "idempotent",
      ]) &&
      attestation.fixtureVersion === "de-events-v1" &&
      attestation.variant === "pipeline" &&
      attestation.inputEvents === 117 &&
      attestation.acceptedEvents === 102 &&
      attestation.duplicateEvents === 14 &&
      attestation.invalidEvents === 1 &&
      attestation.lateEvents === 8 &&
      attestation.firstOutput === 94 &&
      attestation.backfillOutput === 102 &&
      attestation.replayOutput === 102 &&
      attestation.reconciled === true &&
      attestation.idempotent === true
    );
  }
  return (
    hasExactDataAttestationKeys(attestation, [
      "schema", "runtime", "testsPassed", "workspace", "fixtureVersion",
      "variant", "peakBacklog", "failureP95Ms", "recoveryP95Ms",
      "sloTargetMs", "failureDuplicateRatePct", "recoveryDuplicateRatePct",
      "dataLoss", "costMultiple", "sloBreached", "recovered",
    ]) &&
    attestation.fixtureVersion === "di-partition-v1" &&
    attestation.variant === "control-room" &&
    attestation.peakBacklog === 9200 &&
    attestation.failureP95Ms === 684 &&
    attestation.recoveryP95Ms === 210 &&
    attestation.sloTargetMs === 250 &&
    attestation.failureDuplicateRatePct === 14.2 &&
    attestation.recoveryDuplicateRatePct === 0.8 &&
    attestation.dataLoss === 0 &&
    attestation.costMultiple === 2.4 &&
    attestation.sloBreached === true &&
    attestation.recovered === true
  );
}

export function isVerifiedDataWorkspaceResponse(
  value: unknown,
  expectedWorkspace: Exclude<SyntheticWorkspaceId, "pipeline-quality">,
): value is VerifiedDataTerminalResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<SyntheticTerminalResponse>;
  const expectedCommands = DATA_WORKSPACE_COMMANDS[expectedWorkspace];
  if (
    candidate.workspace !== expectedWorkspace ||
    candidate.runtime !== "node24" ||
    candidate.network !== "deny-all" ||
    candidate.persistent !== false ||
    candidate.diff !== "" ||
    candidate.diffTruncated !== false ||
    !Array.isArray(candidate.commands) ||
    candidate.commands.length !== expectedCommands.length ||
    !candidate.commands.every((result, index) => {
      const command = expectedCommands[index];
      return (
        isCommandResult(result) &&
        result.commandId === command &&
        result.command === command &&
        result.exitCode === 0 &&
        result.truncated === false
      );
    }) ||
    !isExpectedDataAttestation(candidate.attestation, expectedWorkspace)
  ) {
    return false;
  }

  const execution = candidate.commands[0];
  const tests = candidate.commands[1];
  if (!execution || !tests || execution.stderr.trim()) return false;

  let rawExecution: unknown;
  try {
    rawExecution = JSON.parse(execution.stdout.trim());
  } catch {
    return false;
  }
  if (
    typeof rawExecution !== "object" ||
    rawExecution === null ||
    Array.isArray(rawExecution)
  ) {
    return false;
  }
  const rawWithTestOutcome: Record<string, unknown> = {
    ...(rawExecution as Record<string, unknown>),
    testsPassed: true,
  };
  const exactAttestation = candidate.attestation as unknown as Record<
    string,
    unknown
  >;
  const attestationKeys = Object.keys(exactAttestation);
  const testTranscript = `${tests.stdout}\n${tests.stderr}`;
  return (
    Object.keys(rawWithTestOutcome).length === attestationKeys.length &&
    attestationKeys.every(
      (key) => rawWithTestOutcome[key] === exactAttestation[key],
    ) &&
    /(?:^|\s)pass\s+2(?:\s|$)/u.test(testTranscript) &&
    /(?:^|\s)fail\s+0(?:\s|$)/u.test(testTranscript)
  );
}
