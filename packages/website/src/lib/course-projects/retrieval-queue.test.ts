import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import {
  __resetLearningOwnerForTests,
  activateAccountLearningOwner,
  activateAnonymousLearningOwner,
  prepareAccountLearningStorage,
  setOwnedLocalLearningItem,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import {
  createEmptyLessonMissionState,
  getLessonMissionStorageKey,
  serializeLessonMissionState,
  type LessonMissionState,
} from "./lesson-mission-persistence";
import { getLessonMissionProfile } from "./lesson-missions";
import {
  getRetrievalStanding,
  readCourseRetrievalQueue,
} from "./retrieval-queue";
import type { RetrievalSuccessLevel } from "./retrieval-schedule";
import { getCourseProjectExecutionReceipt } from "./types";

const COURSE: CourseSlug = "data-science";
const RESET_AT = "2026-08-01T00:00:00.000Z";

function scheduledMissionState(
  successLevel: RetrievalSuccessLevel,
  lastAttemptAt: string,
  nextDueAt: string,
): LessonMissionState {
  const profile = getLessonMissionProfile(COURSE);
  const correct = profile.retrieval.correctId;
  const incorrect = profile.retrieval.choices.find(
    (choice) => choice.id !== correct,
  )!.id;
  const retrievalId = successLevel === 0 ? incorrect : correct;

  return {
    ...createEmptyLessonMissionState(),
    predictionId: profile.predictionChoices[0].id,
    revealed: true,
    workspaceOpened: true,
    manipulated: true,
    executionReceipt: getCourseProjectExecutionReceipt(COURSE),
    evidenceId: profile.evidence.correctId,
    revisionId: profile.revision.correctId,
    retrievalId,
    retrievalMastered: successLevel > 0,
    retrievalFirstChoiceId: retrievalId,
    retrievalAttemptCount: Math.max(1, successLevel),
    retrievalSuccessLevel: successLevel,
    retrievalLastAttemptAt: lastAttemptAt,
    retrievalNextDueAt: nextDueAt,
    retrievalMisconceptionId: successLevel === 0 ? incorrect : null,
  };
}

function seedSchedule(
  lessonId: string,
  successLevel: RetrievalSuccessLevel,
  lastAttemptAt: string,
  nextDueAt: string,
  resetAt = RESET_AT,
): void {
  expect(
    setOwnedLocalLearningItem(
      getLessonMissionStorageKey(COURSE, lessonId),
      serializeLessonMissionState(
        scheduledMissionState(successLevel, lastAttemptAt, nextDueAt),
        resetAt,
      ),
    ),
  ).toBe(true);
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime("2026-08-13T12:00:00.000Z");
  window.localStorage.clear();
  window.sessionStorage.clear();
  Object.defineProperty(window.navigator, "locks", {
    configurable: true,
    value: {
      request: vi.fn(
        async (
          name: string,
          _options: LockOptions,
          callback: (lock: Lock | null) => unknown,
        ) => callback({ name, mode: "exclusive" } as Lock),
      ),
    },
  });
  __resetLearningOwnerForTests("unknown");
  expect(await prepareAccountLearningStorage()).toBe(true);
  activateAnonymousLearningOwner();
});

afterEach(() => {
  __resetLearningOwnerForTests("anonymous");
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("course retrieval queue", () => {
  it("makes the canonical 1, 7, and 21 day schedules actionable at their exact boundaries", () => {
    const [oneDayLesson, sevenDayLesson, twentyOneDayLesson] =
      CANONICAL_LESSON_IDS[COURSE];
    seedSchedule(
      oneDayLesson,
      1,
      "2026-08-13T12:00:00.000Z",
      "2026-08-14T12:00:00.000Z",
    );
    seedSchedule(
      sevenDayLesson,
      2,
      "2026-08-13T12:00:00.000Z",
      "2026-08-20T12:00:00.000Z",
    );
    seedSchedule(
      twentyOneDayLesson,
      3,
      "2026-08-13T12:00:00.000Z",
      "2026-09-03T12:00:00.000Z",
    );

    vi.setSystemTime("2026-08-14T12:00:00.000Z");
    expect(
      readCourseRetrievalQueue(COURSE, oneDayLesson, RESET_AT),
    ).toMatchObject({
      dueCount: 1,
      scheduledCount: 3,
      dueLessonIds: [oneDayLesson],
      currentLesson: {
        successLevel: 1,
        standing: "passed",
        due: true,
      },
    });

    vi.setSystemTime("2026-08-20T12:00:00.000Z");
    expect(
      readCourseRetrievalQueue(COURSE, sevenDayLesson, RESET_AT),
    ).toMatchObject({
      dueCount: 2,
      dueLessonIds: [oneDayLesson, sevenDayLesson],
      currentLesson: {
        successLevel: 2,
        standing: "established",
        due: true,
      },
    });

    vi.setSystemTime("2026-09-03T12:00:00.000Z");
    expect(
      readCourseRetrievalQueue(COURSE, twentyOneDayLesson, RESET_AT),
    ).toMatchObject({
      dueCount: 3,
      dueLessonIds: [oneDayLesson, sevenDayLesson, twentyOneDayLesson],
      currentLesson: {
        successLevel: 3,
        standing: "spaced-mastery",
        due: true,
      },
    });
  });

  it("uses conservative level names and reserves spaced mastery for level 3", () => {
    expect([
      getRetrievalStanding(0),
      getRetrievalStanding(1),
      getRetrievalStanding(2),
      getRetrievalStanding(3),
    ]).toEqual(["repair-required", "passed", "established", "spaced-mastery"]);
  });

  it("surfaces a validated v2 migration as due now without inventing a timestamp", () => {
    const lessonId = CANONICAL_LESSON_IDS[COURSE][0];
    const profile = getLessonMissionProfile(COURSE);
    expect(
      setOwnedLocalLearningItem(
        getLessonMissionStorageKey(COURSE, lessonId),
        JSON.stringify({
          version: 2,
          resetAt: RESET_AT,
          predictionId: profile.predictionChoices[0].id,
          revealed: true,
          workspaceOpened: true,
          manipulated: true,
          evidenceId: profile.evidence.correctId,
          retrievalId: profile.retrieval.correctId,
          revisionId: profile.revision.correctId,
          transferId: null,
          collapsed: false,
        }),
      ),
    ).toBe(true);

    expect(readCourseRetrievalQueue(COURSE, lessonId, RESET_AT)).toMatchObject({
      dueCount: 1,
      scheduledCount: 1,
      dueLessonIds: [lessonId],
      currentLesson: {
        lessonId,
        successLevel: 1,
        standing: "passed",
        nextDueAt: null,
        due: true,
      },
    });
  });

  it("reads every canonical mission key exactly once and no invented key", () => {
    const getItem = vi.spyOn(window.localStorage, "getItem");

    const snapshot = readCourseRetrievalQueue(
      COURSE,
      CANONICAL_LESSON_IDS[COURSE][0],
      RESET_AT,
    );

    expect(snapshot.available).toBe(true);
    expect(getItem.mock.calls.map(([key]) => key)).toEqual(
      CANONICAL_LESSON_IDS[COURSE].map((lessonId) =>
        getLessonMissionStorageKey(COURSE, lessonId),
      ),
    );
  });

  it("fails closed across course reset and account-owner boundaries", () => {
    const lessonId = CANONICAL_LESSON_IDS[COURSE][0];
    seedSchedule(
      lessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );

    expect(readCourseRetrievalQueue(COURSE, lessonId, RESET_AT)).toMatchObject({
      available: true,
      dueCount: 1,
    });
    expect(
      readCourseRetrievalQueue(COURSE, lessonId, "2026-08-02T00:00:00.000Z"),
    ).toMatchObject({
      available: true,
      dueCount: 0,
      scheduledCount: 0,
      currentLesson: null,
    });

    activateAccountLearningOwner("account-a");
    expect(readCourseRetrievalQueue(COURSE, lessonId, RESET_AT)).toMatchObject({
      available: true,
      dueCount: 0,
    });
    seedSchedule(
      lessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );
    expect(readCourseRetrievalQueue(COURSE, lessonId, RESET_AT)).toMatchObject({
      available: true,
      dueCount: 1,
    });

    activateAccountLearningOwner("account-b");
    expect(readCourseRetrievalQueue(COURSE, lessonId, RESET_AT)).toMatchObject({
      available: true,
      dueCount: 0,
    });

    setUnknownLearningOwner();
    expect(readCourseRetrievalQueue(COURSE, lessonId, RESET_AT)).toMatchObject({
      available: false,
      dueCount: 0,
    });
  });

  it("drops malformed schedules and never returns or writes unexpected free text", () => {
    const [malformedLesson, forgedLesson, privateTextLesson] =
      CANONICAL_LESSON_IDS[COURSE];
    window.localStorage.setItem(
      getLessonMissionStorageKey(COURSE, malformedLesson),
      "{not-json",
    );

    const forged = JSON.parse(
      serializeLessonMissionState(
        scheduledMissionState(
          2,
          "2026-08-13T12:00:00.000Z",
          "2026-08-20T12:00:00.000Z",
        ),
        RESET_AT,
      ),
    ) as Record<string, unknown>;
    forged.retrievalNextDueAt = "2026-08-14T12:00:00.000Z";
    window.localStorage.setItem(
      getLessonMissionStorageKey(COURSE, forgedLesson),
      JSON.stringify(forged),
    );

    const withPrivateText = JSON.parse(
      serializeLessonMissionState(
        scheduledMissionState(
          1,
          "2026-08-12T12:00:00.000Z",
          "2026-08-13T12:00:00.000Z",
        ),
        RESET_AT,
      ),
    ) as Record<string, unknown>;
    withPrivateText.retrievalRecall = "private written recall";
    window.localStorage.setItem(
      getLessonMissionStorageKey(COURSE, privateTextLesson),
      JSON.stringify(withPrivateText),
    );
    window.localStorage.setItem(
      `${getLessonMissionStorageKey(COURSE, privateTextLesson)}:invented`,
      JSON.stringify(withPrivateText),
    );
    const setItem = vi.spyOn(window.localStorage, "setItem");

    const snapshot = readCourseRetrievalQueue(
      COURSE,
      privateTextLesson,
      RESET_AT,
    );

    expect(snapshot.dueCount).toBe(0);
    expect(snapshot.dueLessonIds).not.toContain(malformedLesson);
    expect(snapshot.dueLessonIds).not.toContain(forgedLesson);
    expect(snapshot.dueLessonIds).not.toContain(privateTextLesson);
    expect(snapshot.currentLesson).toBeNull();
    expect(JSON.stringify(snapshot)).not.toContain("private written recall");
    expect(JSON.stringify(snapshot)).not.toContain("retrievalRecall");
    expect(setItem).not.toHaveBeenCalled();
  });
});
