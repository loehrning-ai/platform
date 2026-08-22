import { describe, expect, it } from "vitest";
import {
  createEmptyLessonMissionState,
  getLessonMissionStorageKey,
  parseLessonMissionState,
  serializeLessonMissionState,
} from "./lesson-mission-persistence";
import { getLessonMissionProfile } from "./lesson-missions";
import {
  getCourseProjectExecutionReceipt,
  getCourseProjectLocalLearningReceipt,
} from "./types";

const profile = getLessonMissionProfile("data-science");

describe("lesson mission persistence", () => {
  it("round-trips only bounded retrieval evidence and excludes written recall", () => {
    const state = {
      version: 1,
      predictionId: profile.predictionChoices[1].id,
      revealed: true,
      workspaceOpened: true,
      manipulated: true,
      executionReceipt: getCourseProjectExecutionReceipt("data-science"),
      evidenceId: profile.evidence.correctId,
      retrievalId: profile.retrieval.correctId,
      retrievalMastered: true,
      retrievalFirstChoiceId: profile.retrieval.choices[0].id,
      retrievalAttemptCount: 2,
      retrievalSuccessLevel: 1,
      retrievalLastAttemptAt: "2026-08-13T12:00:00.000Z",
      retrievalNextDueAt: "2026-08-14T12:00:00.000Z",
      retrievalMisconceptionId: profile.retrieval.choices[0].id,
      revisionId: profile.revision.correctId,
      transferId: profile.transfer.correctId,
      collapsed: false,
    } as const;

    const runtimeState: typeof state & { retrievalRecall: string } = {
      ...state,
      retrievalRecall:
        "private-written-recall-that-must-never-enter-browser-storage",
    };
    const serialized = serializeLessonMissionState(
      runtimeState,
      "2026-08-13T12:00:00.000Z",
    );
    expect(
      parseLessonMissionState(serialized, profile, "2026-08-13T12:00:00.000Z"),
    ).toEqual(state);
    expect(parseLessonMissionState(serialized, profile, null)).toBeNull();
    expect(serialized.length).toBeLessThan(1_024);
    expect(serialized).not.toContain("scratch");
    expect(serialized).not.toContain("prompt");
    expect(serialized).not.toContain("private-written-recall");
    expect(serialized).not.toContain("retrievalRecall");
  });

  it("migrates the previous fixed-choice envelope without inventing timestamps", () => {
    const legacy = JSON.stringify({
      version: 2,
      resetAt: null,
      predictionId: profile.predictionChoices[0].id,
      revealed: true,
      workspaceOpened: true,
      manipulated: true,
      evidenceId: profile.evidence.correctId,
      retrievalId: profile.retrieval.correctId,
      revisionId: profile.revision.correctId,
      transferId: null,
      collapsed: false,
    });

    expect(parseLessonMissionState(legacy, profile, null)).toMatchObject({
      executionReceipt: null,
      evidenceId: null,
      revisionId: null,
      retrievalId: null,
      retrievalMastered: true,
      retrievalFirstChoiceId: profile.retrieval.correctId,
      retrievalAttemptCount: 1,
      retrievalSuccessLevel: 1,
      retrievalLastAttemptAt: null,
      retrievalNextDueAt: null,
      retrievalMisconceptionId: null,
    });
  });

  it("preserves the fixed v3 schedule while refusing to invent a Run receipt", () => {
    const legacy = JSON.stringify({
      version: 3,
      resetAt: null,
      predictionId: profile.predictionChoices[0].id,
      revealed: true,
      workspaceOpened: true,
      manipulated: true,
      evidenceId: profile.evidence.correctId,
      retrievalId: profile.retrieval.correctId,
      retrievalMastered: true,
      retrievalFirstChoiceId: profile.retrieval.correctId,
      retrievalAttemptCount: 1,
      retrievalSuccessLevel: 1,
      retrievalLastAttemptAt: "2026-08-13T12:00:00.000Z",
      retrievalNextDueAt: "2026-08-14T12:00:00.000Z",
      retrievalMisconceptionId: null,
      revisionId: profile.revision.correctId,
      transferId: null,
      collapsed: false,
    });

    expect(parseLessonMissionState(legacy, profile, null)).toMatchObject({
      executionReceipt: null,
      evidenceId: null,
      retrievalId: profile.retrieval.correctId,
      retrievalMastered: true,
      retrievalSuccessLevel: 1,
      retrievalLastAttemptAt: "2026-08-13T12:00:00.000Z",
      retrievalNextDueAt: "2026-08-14T12:00:00.000Z",
      revisionId: null,
    });
  });

  it("rejects unknown top-level fields in every persisted envelope version", () => {
    const v2 = {
      version: 2,
      resetAt: null,
      predictionId: profile.predictionChoices[0].id,
      revealed: true,
      workspaceOpened: true,
      manipulated: true,
      evidenceId: profile.evidence.correctId,
      retrievalId: profile.retrieval.correctId,
      revisionId: profile.revision.correctId,
      transferId: null,
      collapsed: false,
    };
    const v3 = {
      ...v2,
      version: 3,
      retrievalMastered: true,
      retrievalFirstChoiceId: profile.retrieval.correctId,
      retrievalAttemptCount: 1,
      retrievalSuccessLevel: 1,
      retrievalLastAttemptAt: "2026-08-13T12:00:00.000Z",
      retrievalNextDueAt: "2026-08-14T12:00:00.000Z",
      retrievalMisconceptionId: null,
    };
    const v4 = JSON.parse(
      serializeLessonMissionState(createEmptyLessonMissionState(), null),
    ) as Record<string, unknown>;

    for (const envelope of [v2, v3, v4]) {
      expect(
        parseLessonMissionState(
          JSON.stringify({
            ...envelope,
            retrievalRecall: "private learner text",
          }),
          profile,
          null,
        ),
      ).toBeNull();
    }
  });

  it("accepts only the prompt course's fixed local-learning receipt", () => {
    const promptProfile = getLessonMissionProfile("ai-native");
    const localReceipt = getCourseProjectLocalLearningReceipt("ai-native");
    const state = {
      ...createEmptyLessonMissionState(),
      predictionId: promptProfile.predictionChoices[0].id,
      revealed: true,
      workspaceOpened: true,
      manipulated: true,
      executionReceipt: localReceipt,
    } as const;

    expect(
      parseLessonMissionState(
        serializeLessonMissionState(state, null),
        promptProfile,
        null,
      )?.executionReceipt,
    ).toBe(localReceipt);
    expect(
      parseLessonMissionState(
        serializeLessonMissionState(
          {
            ...state,
            executionReceipt: getCourseProjectLocalLearningReceipt("claude"),
          },
          null,
        ),
        promptProfile,
        null,
      ),
    ).toBeNull();
  });

  it("rejects forged current schedules but keeps legacy attempts due now", () => {
    const wrongChoice = profile.retrieval.choices.find(
      (choice) => choice.id !== profile.retrieval.correctId,
    )!;
    const evidenceComplete = {
      ...createEmptyLessonMissionState(),
      predictionId: profile.predictionChoices[0].id,
      revealed: true,
      workspaceOpened: true,
      manipulated: true,
      executionReceipt: getCourseProjectExecutionReceipt("data-science"),
      evidenceId: profile.evidence.correctId,
      revisionId: profile.revision.correctId,
    } as const;
    const lastAttemptAt = "2026-08-13T12:00:00.000Z";
    const forgedSchedules = [
      {
        retrievalId: wrongChoice.id,
        retrievalMastered: false,
        retrievalFirstChoiceId: wrongChoice.id,
        retrievalAttemptCount: 1,
        retrievalSuccessLevel: 0 as const,
        retrievalLastAttemptAt: lastAttemptAt,
        retrievalNextDueAt: "2026-08-14T12:00:00.000Z",
        retrievalMisconceptionId: wrongChoice.id,
      },
      {
        retrievalId: profile.retrieval.correctId,
        retrievalMastered: true,
        retrievalFirstChoiceId: profile.retrieval.correctId,
        retrievalAttemptCount: 1,
        retrievalSuccessLevel: 1 as const,
        retrievalLastAttemptAt: lastAttemptAt,
        retrievalNextDueAt: lastAttemptAt,
        retrievalMisconceptionId: null,
      },
      {
        retrievalId: profile.retrieval.correctId,
        retrievalMastered: true,
        retrievalFirstChoiceId: profile.retrieval.correctId,
        retrievalAttemptCount: 2,
        retrievalSuccessLevel: 2 as const,
        retrievalLastAttemptAt: lastAttemptAt,
        retrievalNextDueAt: "2026-08-14T12:00:00.000Z",
        retrievalMisconceptionId: null,
      },
      {
        retrievalId: profile.retrieval.correctId,
        retrievalMastered: true,
        retrievalFirstChoiceId: profile.retrieval.correctId,
        retrievalAttemptCount: 3,
        retrievalSuccessLevel: 3 as const,
        retrievalLastAttemptAt: lastAttemptAt,
        retrievalNextDueAt: "2026-08-20T12:00:00.000Z",
        retrievalMisconceptionId: null,
      },
      {
        retrievalId: profile.retrieval.correctId,
        retrievalMastered: true,
        retrievalFirstChoiceId: profile.retrieval.correctId,
        retrievalAttemptCount: 1,
        retrievalSuccessLevel: 1 as const,
        retrievalLastAttemptAt: null,
        retrievalNextDueAt: null,
        retrievalMisconceptionId: null,
      },
    ];

    for (const forgedSchedule of forgedSchedules) {
      expect(
        parseLessonMissionState(
          serializeLessonMissionState(
            { ...evidenceComplete, ...forgedSchedule },
            null,
          ),
          profile,
          null,
        ),
      ).toBeNull();
    }

    const migrated = parseLessonMissionState(
      JSON.stringify({
        version: 2,
        resetAt: null,
        predictionId: profile.predictionChoices[0].id,
        revealed: true,
        workspaceOpened: true,
        manipulated: true,
        evidenceId: profile.evidence.correctId,
        retrievalId: profile.retrieval.correctId,
        revisionId: null,
        transferId: null,
        collapsed: false,
      }),
      profile,
      null,
    );
    expect(migrated?.retrievalLastAttemptAt).toBeNull();
    expect(migrated?.retrievalNextDueAt).toBeNull();
  });

  it("fails closed on unknown choice IDs and oversized input", () => {
    const invalid = {
      ...createEmptyLessonMissionState(),
      predictionId: "learner-controlled-value",
    };
    expect(
      parseLessonMissionState(
        serializeLessonMissionState(invalid, null),
        profile,
        null,
      ),
    ).toBeNull();
    expect(
      parseLessonMissionState(`{"x":"${"a".repeat(800)}"}`, profile, null),
    ).toBeNull();
  });

  it("fails closed on forged first-choice and misconception records", () => {
    const invalid = {
      ...createEmptyLessonMissionState(),
      predictionId: profile.predictionChoices[0].id,
      revealed: true,
      workspaceOpened: true,
      manipulated: true,
      evidenceId: profile.evidence.correctId,
      retrievalId: profile.retrieval.correctId,
      retrievalMastered: true,
      retrievalFirstChoiceId: "forged-choice",
      retrievalAttemptCount: 1,
      retrievalSuccessLevel: 1 as const,
      retrievalLastAttemptAt: "2026-08-13T12:00:00.000Z",
      retrievalNextDueAt: "2026-08-14T12:00:00.000Z",
    };

    expect(
      parseLessonMissionState(
        serializeLessonMissionState(invalid, null),
        profile,
        null,
      ),
    ).toBeNull();
  });

  it("removes impossible later-step state instead of unlocking it", () => {
    const impossible = {
      ...createEmptyLessonMissionState(),
      predictionId: profile.predictionChoices[0].id,
      revealed: false,
      workspaceOpened: true,
      manipulated: true,
      evidenceId: profile.evidence.correctId,
      retrievalId: profile.retrieval.correctId,
    };

    expect(
      parseLessonMissionState(
        serializeLessonMissionState(impossible, null),
        profile,
        null,
      ),
    ).toEqual({
      ...createEmptyLessonMissionState(),
      predictionId: profile.predictionChoices[0].id,
    });
  });

  it("uses a course-and-lesson-scoped encoded storage key", () => {
    expect(getLessonMissionStorageKey("codex", "track/lesson 1")).toBe(
      "loehrning:lesson-mission:v1:codex:track%2Flesson%201",
    );
  });
});
