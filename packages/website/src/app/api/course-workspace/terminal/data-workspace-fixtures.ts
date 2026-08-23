import "server-only";

const WORKSPACE_DIRECTORY = "/vercel/sandbox/workspace";

interface SyntheticWorkspaceFile {
  readonly path: string;
  readonly content: string;
}

type DataWorkspaceId =
  | "data-science-experiment"
  | "data-engineering-pipeline"
  | "data-infrastructure-recovery";

const EXPERIMENT_SOURCE = `const percent = (numerator, denominator) =>
  Math.round((numerator / denominator) * 100);

export function executeExperiment() {
  const control = Array.from({ length: 120 }, (_, index) => ({
    arm: "control",
    completion7d: index < 50,
    postCompletionScore: index < 50 ? 0.9 : 0.2,
  }));
  const treatment = Array.from({ length: 118 }, (_, index) => ({
    arm: "treatment",
    completion7d: index < 55,
    postCompletionScore: index < 75 ? 0.9 : 0.2,
  }));
  const missing = Array.from({ length: 11 }, () => ({
    arm: null,
    completion7d: null,
    postCompletionScore: null,
  }));
  const rows = [...control, ...treatment, ...missing];
  const controlSuccesses = control.filter((row) => row.completion7d).length;
  const treatmentSuccesses = treatment.filter((row) => row.completion7d).length;
  const postOutcomeHighScores = treatment.filter(
    (row) => row.postCompletionScore >= 0.8,
  ).length;
  const columns = Object.keys(rows[0]);
  const leakageColumns = columns.filter((column) =>
    ["postCompletionScore"].includes(column),
  );
  const controlRatePct = percent(controlSuccesses, control.length);
  const safeTreatmentRatePct = percent(treatmentSuccesses, treatment.length);
  const leakedTreatmentRatePct = percent(
    postOutcomeHighScores,
    treatment.length,
  );
  const interimCheckpoints = [25, 50, 75, 100, treatment.length];

  return {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    workspace: "data-science-experiment",
    fixtureVersion: "ds-leakage-v1",
    variant: "experiment",
    rowsRead: rows.length,
    controlN: control.length,
    treatmentN: treatment.length,
    missingRows: missing.length,
    controlRatePct,
    safeTreatmentRatePct,
    leakedTreatmentRatePct,
    safeEffectPoints: safeTreatmentRatePct - controlRatePct,
    leakageInflationPoints:
      leakedTreatmentRatePct - safeTreatmentRatePct,
    interimLooks: interimCheckpoints.length,
    leakageDetected: leakageColumns.length > 0,
  };
}

if (import.meta.url === "file://" + process.argv[1]) {
  console.log(JSON.stringify(executeExperiment()));
}
`;

const EXPERIMENT_TEST = `import assert from "node:assert/strict";
import test from "node:test";
import { executeExperiment } from "./src/experiment.mjs";

test("compares the registered metric with the post-outcome leakage proxy", () => {
  const result = executeExperiment();
  assert.equal(result.rowsRead, 249);
  assert.equal(result.controlRatePct, 42);
  assert.equal(result.safeTreatmentRatePct, 47);
  assert.equal(result.leakedTreatmentRatePct, 64);
  assert.equal(result.safeEffectPoints, 5);
  assert.equal(result.leakageInflationPoints, 17);
  assert.equal(result.leakageDetected, true);
});

test("records missingness and the five prohibited interim looks", () => {
  const result = executeExperiment();
  assert.equal(result.missingRows, 11);
  assert.equal(result.interimLooks, 5);
});
`;

const PIPELINE_SOURCE = `const VALID_STATUSES = new Set(["received", "sorted", "loaded"]);

export function executePipeline() {
  const onTime = Array.from({ length: 94 }, (_, index) => ({
    eventId: "evt-" + String(index + 1).padStart(3, "0"),
    eventMinute: index % 30,
    status: VALID_STATUSES.has("received") ? "received" : "invalid",
  }));
  const late = Array.from({ length: 8 }, (_, index) => ({
    eventId: "late-" + String(index + 1).padStart(3, "0"),
    eventMinute: 31 + index,
    status: "sorted",
  }));
  const duplicates = onTime.slice(0, 14).map((event) => ({ ...event }));
  const invalid = [{ eventId: "bad-001", eventMinute: 12, status: "unknown" }];
  const input = [...onTime, ...late, ...duplicates, ...invalid];
  const valid = input.filter((event) => VALID_STATUSES.has(event.status));
  const accepted = new Map();
  for (const event of valid) accepted.set(event.eventId, event);
  const duplicateEvents = valid.length - accepted.size;
  const invalidEvents = input.length - valid.length;
  const watermarkMinutes = 30;
  const firstOutput = [...accepted.values()].filter(
    (event) => event.eventMinute <= watermarkMinutes,
  );
  const backfill = new Map(firstOutput.map((event) => [event.eventId, event]));
  for (const event of accepted.values()) backfill.set(event.eventId, event);
  const beforeReplay = backfill.size;
  for (const event of valid) backfill.set(event.eventId, event);
  const replayOutput = backfill.size;
  const lateEvents = [...accepted.values()].filter(
    (event) => event.eventMinute > watermarkMinutes,
  ).length;

  return {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    workspace: "data-engineering-pipeline",
    fixtureVersion: "de-events-v1",
    variant: "pipeline",
    inputEvents: input.length,
    acceptedEvents: accepted.size,
    duplicateEvents,
    invalidEvents,
    lateEvents,
    firstOutput: firstOutput.length,
    backfillOutput: beforeReplay,
    replayOutput,
    reconciled:
      input.length === accepted.size + duplicateEvents + invalidEvents,
    idempotent: replayOutput === beforeReplay,
  };
}

if (import.meta.url === "file://" + process.argv[1]) {
  console.log(JSON.stringify(executePipeline()));
}
`;

const PIPELINE_TEST = `import assert from "node:assert/strict";
import test from "node:test";
import { executePipeline } from "./src/backfill.mjs";

test("deduplicates, rejects invalid status, and reconciles the input", () => {
  const result = executePipeline();
  assert.deepEqual(
    [result.inputEvents, result.acceptedEvents, result.duplicateEvents, result.invalidEvents],
    [117, 102, 14, 1],
  );
  assert.equal(result.reconciled, true);
});

test("backfills late events and remains idempotent under replay", () => {
  const result = executePipeline();
  assert.deepEqual(
    [result.lateEvents, result.firstOutput, result.backfillOutput, result.replayOutput],
    [8, 94, 102, 102],
  );
  assert.equal(result.idempotent, true);
});
`;

const CONTROL_ROOM_SOURCE = `function percentile95(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

export function executeRecovery() {
  const failureLatencyMs = [
    180, 210, 240, 270, 300, 330, 360, 390, 420, 450,
    480, 510, 540, 570, 590, 600, 610, 620, 684, 900,
  ];
  const recoveryLatencyMs = [
    90, 96, 102, 108, 114, 120, 126, 132, 138, 144,
    150, 156, 162, 168, 174, 180, 190, 200, 210, 240,
  ];
  const backlog = [120, 1200, 4600, 9200, 7100, 3600, 800, 0];
  const failureDuplicates = 142;
  const recoveryDuplicates = 8;
  const observedEvents = 1000;
  const baselineHourlyCost = 4.8;
  const incidentHourlyCost = 11.52;
  const sloTargetMs = 250;
  const failureP95Ms = percentile95(failureLatencyMs);
  const recoveryP95Ms = percentile95(recoveryLatencyMs);
  const dataLoss = 0;

  return {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    workspace: "data-infrastructure-recovery",
    fixtureVersion: "di-partition-v1",
    variant: "control-room",
    peakBacklog: Math.max(...backlog),
    failureP95Ms,
    recoveryP95Ms,
    sloTargetMs,
    failureDuplicateRatePct:
      Math.round((failureDuplicates / observedEvents) * 1000) / 10,
    recoveryDuplicateRatePct:
      Math.round((recoveryDuplicates / observedEvents) * 1000) / 10,
    dataLoss,
    costMultiple:
      Math.round((incidentHourlyCost / baselineHourlyCost) * 10) / 10,
    sloBreached: failureP95Ms > sloTargetMs,
    recovered: recoveryP95Ms <= sloTargetMs && dataLoss === 0,
  };
}

if (import.meta.url === "file://" + process.argv[1]) {
  console.log(JSON.stringify(executeRecovery()));
}
`;

const CONTROL_ROOM_TEST = `import assert from "node:assert/strict";
import test from "node:test";
import { executeRecovery } from "./src/control-room.mjs";

test("observes the partition incident and its SLO breach", () => {
  const result = executeRecovery();
  assert.deepEqual(
    [result.peakBacklog, result.failureP95Ms, result.failureDuplicateRatePct, result.costMultiple],
    [9200, 684, 14.2, 2.4],
  );
  assert.equal(result.sloBreached, true);
});

test("recovers below the SLO without dropping an event", () => {
  const result = executeRecovery();
  assert.equal(result.recoveryP95Ms, 210);
  assert.equal(result.recoveryDuplicateRatePct, 0.8);
  assert.equal(result.dataLoss, 0);
  assert.equal(result.recovered, true);
});
`;

function files(
  title: string,
  sourceName: string,
  source: string,
  test: string,
): readonly SyntheticWorkspaceFile[] {
  return [
    {
      path: `${WORKSPACE_DIRECTORY}/README.md`,
      content: `# ${title}\n\nGenerated records only. Network access is disabled. The source program derives every published metric from the fixture and the test process independently checks the required invariants.\n`,
    },
    {
      path: `${WORKSPACE_DIRECTORY}/src/${sourceName}`,
      content: source,
    },
    {
      path: `${WORKSPACE_DIRECTORY}/workspace.test.mjs`,
      content: test,
    },
  ];
}

export const DATA_WORKSPACE_FILES: Readonly<
  Record<DataWorkspaceId, readonly SyntheticWorkspaceFile[]>
> = {
  "data-science-experiment": files(
    "Executable leakage and peeking experiment",
    "experiment.mjs",
    EXPERIMENT_SOURCE,
    EXPERIMENT_TEST,
  ),
  "data-engineering-pipeline": files(
    "Executable late-event and idempotent backfill pipeline",
    "backfill.mjs",
    PIPELINE_SOURCE,
    PIPELINE_TEST,
  ),
  "data-infrastructure-recovery": files(
    "Executable partition recovery control room",
    "control-room.mjs",
    CONTROL_ROOM_SOURCE,
    CONTROL_ROOM_TEST,
  ),
};
