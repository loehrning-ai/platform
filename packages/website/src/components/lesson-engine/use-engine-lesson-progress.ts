"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { CourseSlug } from "@/lib/course/types";
import {
  getCourseSlice,
  getLessonQuizScore,
  getReadSectionIds,
  isCheckpointDone,
  isEvidenceBackedLessonCompleted,
  markSectionRead,
  recordLessonCompletionEvidenceDurably,
  saveLessonQuizScore,
  subscribe,
} from "@/lib/progress";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
  type LearningOwnerContext,
} from "@/lib/progress/browser-learning-storage";
import { persistForActiveLearningOwner } from "@/components/course/owner-aware-progress";
import {
  ENGINE_EXERCISE_CHECKPOINT_ID,
  engineCheckpointLessonKey,
  engineExerciseStepId,
} from "@/lib/lesson-engine/types";

const SERVER_OWNER: LearningOwnerContext = { kind: "unknown", generation: 0 };

export interface EngineLessonProgressSnapshot {
  /** The store has been read for the active owner (client only). */
  readonly hydrated: boolean;
  /** A learning owner (anonymous or account) is resolved; writes persist. */
  readonly ownerReady: boolean;
  readonly exerciseDone: boolean;
  readonly checksPassed: boolean;
  readonly completed: boolean;
}

export interface EngineLessonProgress extends EngineLessonProgressSnapshot {
  /** Record the exercise step. Idempotent. Returns true when persisted. */
  readonly recordExerciseDone: () => boolean;
  /** Record that all `total` checks are answered correctly. Idempotent. */
  readonly recordChecksPassed: (total: number) => boolean;
}

function readSnapshot(
  courseSlug: CourseSlug,
  lessonId: string,
): Omit<EngineLessonProgressSnapshot, "hydrated" | "ownerReady"> {
  const step = engineExerciseStepId(lessonId);
  // Checkpoints are cross-course and never cleared, so after a course reset
  // only the lesson step counts: the learner has to redo the exercise (the
  // widget then notifies the reader, which records the step again).
  const wasReset = Boolean(getCourseSlice(courseSlug).resetAt);
  const exerciseDone =
    getReadSectionIds(courseSlug, lessonId).has(step) ||
    (!wasReset &&
      isCheckpointDone(
        engineCheckpointLessonKey(courseSlug, lessonId),
        ENGINE_EXERCISE_CHECKPOINT_ID,
      ));
  const score = getLessonQuizScore(courseSlug, lessonId);
  return {
    exerciseDone,
    checksPassed: score !== null && score.score === score.total,
    completed: isEvidenceBackedLessonCompleted(courseSlug, lessonId),
  };
}

/**
 * Progress for one lesson-engine lesson.
 *
 * - Exercise done: the lesson's `<id>_exercise` step is in `sectionsRead`,
 *   or the exercise widget completed its checkpoint
 *   (`<course>:<lesson>::exercise`). A checkpoint without the step is
 *   promoted to the step on the next owner-ready render. After a course
 *   reset the checkpoint no longer counts; only a fresh completion does.
 * - Checks passed: the lesson quiz score is perfect.
 * - When both hold, the lesson proof is written once
 *   (recordLessonCompletionEvidenceDurably). No button, no self-report.
 */
export function useEngineLessonProgress(
  courseSlug: CourseSlug,
  lessonId: string,
): EngineLessonProgress {
  const owner = useSyncExternalStore(
    subscribeLearningOwner,
    getLearningOwnerContext,
    () => SERVER_OWNER,
  );
  const ownerReady = owner.kind !== "unknown";
  const [state, setState] = useState<{
    readonly key: string;
    readonly snapshot: ReturnType<typeof readSnapshot>;
  } | null>(null);
  const identity = `${courseSlug}:${lessonId}:${owner.generation}`;

  useEffect(() => {
    return subscribe(() => {
      const resolved = getLearningOwnerContext().kind !== "unknown";
      setState({
        key: identity,
        snapshot: resolved
          ? readSnapshot(courseSlug, lessonId)
          : { exerciseDone: false, checksPassed: false, completed: false },
      });
    });
  }, [courseSlug, lessonId, identity]);

  const hydrated = state?.key === identity;
  const snapshot =
    hydrated && state
      ? state.snapshot
      : { exerciseDone: false, checksPassed: false, completed: false };

  const recordExerciseDone = useCallback(() => {
    const step = engineExerciseStepId(lessonId);
    return persistForActiveLearningOwner(
      () => markSectionRead(courseSlug, lessonId, step),
      () => getReadSectionIds(courseSlug, lessonId).has(step),
    );
  }, [courseSlug, lessonId]);

  const recordChecksPassed = useCallback(
    (total: number) =>
      persistForActiveLearningOwner(
        () => saveLessonQuizScore(courseSlug, lessonId, total, total),
        () => {
          const score = getLessonQuizScore(courseSlug, lessonId);
          return score !== null && score.score === score.total;
        },
      ),
    [courseSlug, lessonId],
  );

  // Promote a widget checkpoint to the lesson step, then write the lesson
  // proof once both requirements hold. Both writes are idempotent and fenced
  // to the active learning owner.
  const step = engineExerciseStepId(lessonId);
  useEffect(() => {
    if (!hydrated || !ownerReady) return;
    if (
      snapshot.exerciseDone &&
      !getReadSectionIds(courseSlug, lessonId).has(step)
    ) {
      recordExerciseDone();
      return;
    }
    if (snapshot.exerciseDone && snapshot.checksPassed && !snapshot.completed) {
      recordLessonCompletionEvidenceDurably(courseSlug, lessonId);
    }
  }, [
    hydrated,
    ownerReady,
    snapshot.exerciseDone,
    snapshot.checksPassed,
    snapshot.completed,
    courseSlug,
    lessonId,
    step,
    recordExerciseDone,
  ]);

  return {
    hydrated,
    ownerReady,
    ...snapshot,
    recordExerciseDone,
    recordChecksPassed,
  };
}
