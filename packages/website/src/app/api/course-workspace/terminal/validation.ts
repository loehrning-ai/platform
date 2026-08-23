import { z } from "zod";

import {
  DATA_WORKSPACE_COMMANDS,
  REPOSITORY_TERMINAL_COMMANDS,
  SYNTHETIC_TERMINAL_COMMANDS,
  SYNTHETIC_WORKSPACE_IDS,
} from "./types";

export const syntheticTerminalRequestSchema = z
  .object({
    workspace: z.enum(SYNTHETIC_WORKSPACE_IDS),
    commands: z
      .array(z.enum(SYNTHETIC_TERMINAL_COMMANDS))
      .min(1)
      .max(SYNTHETIC_TERMINAL_COMMANDS.length),
  })
  .strict()
  .superRefine((request, context) => {
    const expected =
      request.workspace === "pipeline-quality"
        ? REPOSITORY_TERMINAL_COMMANDS
        : DATA_WORKSPACE_COMMANDS[
            request.workspace as keyof typeof DATA_WORKSPACE_COMMANDS
          ];
    if (!expected) {
      context.addIssue({
        code: "custom",
        path: ["workspace"],
        message: "Unsupported workspace contract",
      });
      return;
    }
    if (
      request.commands.length !== expected.length ||
      request.commands.some((command, index) => command !== expected[index])
    ) {
      context.addIssue({
        code: "custom",
        path: ["commands"],
        message: "Workspaces require their complete fixed command sequence",
      });
    }
  });

const baseAttestation = z.object({
  schema: z.literal("data-workspace-attestation-v1"),
  runtime: z.literal("node24"),
  testsPassed: z.literal(true),
});

/** Exact fixture-output contract. Any partial, stale, or edited run fails. */
export const rawDataWorkspaceAttestationSchema = z.discriminatedUnion(
  "workspace",
  [
    baseAttestation.extend({
      workspace: z.literal("data-science-experiment"),
      fixtureVersion: z.literal("ds-leakage-v1"),
      variant: z.literal("experiment"),
      rowsRead: z.literal(249),
      controlN: z.literal(120),
      treatmentN: z.literal(118),
      missingRows: z.literal(11),
      controlRatePct: z.literal(42),
      safeTreatmentRatePct: z.literal(47),
      leakedTreatmentRatePct: z.literal(64),
      safeEffectPoints: z.literal(5),
      leakageInflationPoints: z.literal(17),
      interimLooks: z.literal(5),
      leakageDetected: z.literal(true),
    }).strict(),
    baseAttestation.extend({
      workspace: z.literal("data-engineering-pipeline"),
      fixtureVersion: z.literal("de-events-v1"),
      variant: z.literal("pipeline"),
      inputEvents: z.literal(117),
      acceptedEvents: z.literal(102),
      duplicateEvents: z.literal(14),
      invalidEvents: z.literal(1),
      lateEvents: z.literal(8),
      firstOutput: z.literal(94),
      backfillOutput: z.literal(102),
      replayOutput: z.literal(102),
      reconciled: z.literal(true),
      idempotent: z.literal(true),
    }).strict(),
    baseAttestation.extend({
      workspace: z.literal("data-infrastructure-recovery"),
      fixtureVersion: z.literal("di-partition-v1"),
      variant: z.literal("control-room"),
      peakBacklog: z.literal(9200),
      failureP95Ms: z.literal(684),
      recoveryP95Ms: z.literal(210),
      sloTargetMs: z.literal(250),
      failureDuplicateRatePct: z.literal(14.2),
      recoveryDuplicateRatePct: z.literal(0.8),
      dataLoss: z.literal(0),
      costMultiple: z.literal(2.4),
      sloBreached: z.literal(true),
      recovered: z.literal(true),
    }).strict(),
  ],
);

export type SyntheticTerminalRequest = z.infer<
  typeof syntheticTerminalRequestSchema
>;
