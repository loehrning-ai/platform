"use client";

import { useEffect, useState, type JSX } from "react";
import { LessonProofCheckpoint } from "@/components/course/lesson-proof-checkpoint";
import {
  getOwnerRequiredHint,
  useOwnerAwareProgressReadiness,
} from "@/components/course/owner-aware-progress";
import { type EvidenceGatedCourseSlug } from "@/lib/courses/completion";
import type { Locale } from "@/lib/i18n/locale";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import {
  getEvidenceBackedCompletedLessonIds,
  isEvidenceBackedLessonCompleted,
  recordLessonCompletionEvidenceDurably,
  subscribe,
} from "@/lib/progress";
import {
  lessonOrdinal,
  trackCourseStarted,
  trackLessonCompleted,
} from "@/lib/analytics/events";

type TransferOnlyCourseSlug = Extract<
  EvidenceGatedCourseSlug,
  "data-engineering-fundamentals" | "data-science"
>;

interface ChapterTransferCheckpointProps {
  readonly courseSlug: TransferOnlyCourseSlug;
  readonly chapterId: string;
  readonly locale: Locale;
}

/**
 * Evidence gate for technical chapters without a quiz or authored section
 * checkpoints. Learner prose stays in LessonProofCheckpoint's component state;
 * only a versioned boolean checkpoint and the legacy completion bit persist.
 */
export function ChapterTransferCheckpoint({
  courseSlug,
  chapterId,
  locale,
}: ChapterTransferCheckpointProps): JSX.Element {
  const identity = `${courseSlug}:${chapterId}`;
  const [readyIdentity, setReadyIdentity] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setReadyIdentity(null);
    setLoadedOwnerGeneration(null);
    setCompleted(false);

    const unsubscribeOwner = subscribeLearningOwner(() => {
      // Hide the previous namespace before the progress store emits the next
      // owner's state. The changed component key also drops ephemeral prose.
      setReadyIdentity(null);
      setLoadedOwnerGeneration(null);
      setCompleted(false);
    });
    const unsubscribeProgress = subscribe(() => {
      const owner = getLearningOwnerContext();
      const resolved = owner.kind !== "unknown";
      setLoadedOwnerGeneration(owner.generation);
      setCompleted(
        resolved && isEvidenceBackedLessonCompleted(courseSlug, chapterId),
      );
      setReadyIdentity(identity);
    });

    return () => {
      unsubscribeOwner();
      unsubscribeProgress();
    };
  }, [chapterId, courseSlug, identity]);

  const readiness = useOwnerAwareProgressReadiness(
    identity,
    readyIdentity,
    loadedOwnerGeneration,
  );

  const commitTransfer = () => {
    // Read before the write: the first durable completion starts the course,
    // and a repeat commit of a completed chapter is not a new completion.
    const completedBefore = getEvidenceBackedCompletedLessonIds(courseSlug);
    const courseWasUnstarted = completedBefore.size === 0;
    const chapterWasCompleted = completedBefore.has(chapterId);
    const persisted = recordLessonCompletionEvidenceDurably(
      courseSlug,
      chapterId,
    );
    if (!persisted) return;
    // The learner's prose is never read here; only course and position leave.
    const ordinal = lessonOrdinal(courseSlug, chapterId);
    if (!chapterWasCompleted && ordinal !== null) {
      trackLessonCompleted(courseSlug, ordinal);
    }
    if (courseWasUnstarted) trackCourseStarted(courseSlug);
  };

  return (
    <div data-chapter-transfer-checkpoint={identity}>
      <LessonProofCheckpoint
        key={readiness.checkpointKey}
        locale={locale}
        completed={readiness.interactionReady && completed}
        progressReady={readiness.hydrated}
        prerequisitesMet={readiness.ownerReady}
        prerequisiteHint={getOwnerRequiredHint(locale)}
        onCommit={commitTransfer}
      />
    </div>
  );
}
