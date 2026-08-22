import type { CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import {
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
} from "@/lib/progress/browser-learning-storage";
import {
  getLessonMissionStorageKey,
  parseLessonMissionState,
} from "./lesson-mission-persistence";
import { getLessonMissionProfile } from "./lesson-missions";
import {
  isRetrievalDue,
  type RetrievalSuccessLevel,
} from "./retrieval-schedule";

export type RetrievalStanding =
  "repair-required" | "passed" | "established" | "spaced-mastery";

export interface ScheduledLessonRetrieval {
  readonly lessonId: string;
  readonly successLevel: RetrievalSuccessLevel;
  readonly standing: RetrievalStanding;
  /** Null only for a validated legacy fixed-choice attempt, which is due now. */
  readonly nextDueAt: string | null;
  readonly due: boolean;
}

export interface CourseRetrievalQueueSnapshot {
  readonly available: boolean;
  readonly checkedAt: string;
  readonly dueCount: number;
  readonly scheduledCount: number;
  readonly dueLessonIds: readonly string[];
  readonly currentLesson: ScheduledLessonRetrieval | null;
}

function unavailableSnapshot(now: number): CourseRetrievalQueueSnapshot {
  return {
    available: false,
    checkedAt: new Date(Number.isFinite(now) ? now : 0).toISOString(),
    dueCount: 0,
    scheduledCount: 0,
    dueLessonIds: [],
    currentLesson: null,
  };
}

export function getRetrievalStanding(
  successLevel: RetrievalSuccessLevel,
): RetrievalStanding {
  if (successLevel === 0) return "repair-required";
  if (successLevel === 1) return "passed";
  if (successLevel === 2) return "established";
  return "spaced-mastery";
}

/**
 * Reads exactly the canonical lesson-mission keys for one course through the
 * owner-scoped browser-learning boundary. Invalid, reset-mismatched, and
 * owner-raced records fail closed and never enter the queue. A validated
 * legacy fixed-choice attempt enters as due now with no invented timestamp.
 * The returned projection contains only fixed canonical IDs, bounded levels,
 * and validated timestamps; written recall and other free text are absent.
 */
export function readCourseRetrievalQueue(
  courseSlug: CourseSlug,
  currentLessonId: string,
  resetAt: string | null,
  now = Date.now(),
  expectedOwnerGeneration = getLearningOwnerContext().generation,
): CourseRetrievalQueueSnapshot {
  if (!Number.isFinite(now)) return unavailableSnapshot(now);

  const ownerAtStart = getLearningOwnerContext();
  if (
    ownerAtStart.kind === "unknown" ||
    ownerAtStart.generation !== expectedOwnerGeneration
  ) {
    return unavailableSnapshot(now);
  }

  const profile = getLessonMissionProfile(courseSlug);
  const scheduled: ScheduledLessonRetrieval[] = [];

  for (const lessonId of CANONICAL_LESSON_IDS[courseSlug]) {
    const activeOwner = getLearningOwnerContext();
    if (
      activeOwner.kind !== ownerAtStart.kind ||
      activeOwner.generation !== expectedOwnerGeneration ||
      (activeOwner.kind === "account" &&
        (ownerAtStart.kind !== "account" ||
          activeOwner.accountId !== ownerAtStart.accountId))
    ) {
      return unavailableSnapshot(now);
    }

    const parsed = parseLessonMissionState(
      getOwnedLocalLearningItem(
        getLessonMissionStorageKey(courseSlug, lessonId),
      ),
      profile,
      resetAt,
    );
    if (
      !parsed ||
      parsed.retrievalAttemptCount < 1 ||
      (parsed.retrievalLastAttemptAt === null) !==
        (parsed.retrievalNextDueAt === null)
    ) {
      continue;
    }

    scheduled.push({
      lessonId,
      successLevel: parsed.retrievalSuccessLevel,
      standing: getRetrievalStanding(parsed.retrievalSuccessLevel),
      nextDueAt: parsed.retrievalNextDueAt,
      due:
        parsed.retrievalNextDueAt === null ||
        isRetrievalDue(parsed.retrievalNextDueAt, now),
    });
  }

  const ownerAtEnd = getLearningOwnerContext();
  if (
    ownerAtEnd.kind !== ownerAtStart.kind ||
    ownerAtEnd.generation !== expectedOwnerGeneration ||
    (ownerAtEnd.kind === "account" &&
      (ownerAtStart.kind !== "account" ||
        ownerAtEnd.accountId !== ownerAtStart.accountId))
  ) {
    return unavailableSnapshot(now);
  }

  const due = scheduled.filter((entry) => entry.due);
  return {
    available: true,
    checkedAt: new Date(now).toISOString(),
    dueCount: due.length,
    scheduledCount: scheduled.length,
    dueLessonIds: due.map((entry) => entry.lessonId),
    currentLesson:
      scheduled.find((entry) => entry.lessonId === currentLessonId) ?? null,
  };
}
