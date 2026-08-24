"use client";

import { useEffect, useState } from "react";
import {
  isChapterVisited,
  markChapterVisited,
} from "@/lib/data-science/progress";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { subscribe } from "@/lib/progress/store";
import type { DsNumberedChapterId } from "@/lib/data-science/types";
import type { Locale } from "@/lib/i18n/locale";

// ─── MarkChapterVisited ───────────────────────────
//
// This course has no final quiz. A learner explicitly confirms each chapter
// after reading it; merely opening a URL never earns certificate progress.

export function MarkChapterVisited({
  chapterId,
  locale,
}: {
  readonly chapterId: DsNumberedChapterId;
  readonly locale: Locale;
}) {
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [ownerReady, setOwnerReady] = useState(false);
  const copy = getDataScienceCourseCopy(locale).reader;
  const ownerMessageId = `data-science-${chapterId}-completion-owner`;

  useEffect(() => {
    setHydrated(true);
    const unsubscribeOwner = subscribeLearningOwner(() => {
      // Drop the previous owner's state before the progress store switches
      // namespaces. The matching progress emission resolves the next owner.
      setOwnerReady(false);
      setCompleted(false);
    });
    const unsubscribeProgress = subscribe(() => {
      const resolved = getLearningOwnerContext().kind !== "unknown";
      setOwnerReady(resolved);
      setCompleted(resolved && isChapterVisited(chapterId));
    });
    return () => {
      unsubscribeOwner();
      unsubscribeProgress();
    };
  }, [chapterId]);

  const ownerUnresolved = hydrated && !ownerReady;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => markChapterVisited(chapterId)}
        disabled={!hydrated || !ownerReady || completed}
        aria-pressed={completed}
        aria-describedby={ownerUnresolved ? ownerMessageId : undefined}
        className="btn btn-primary"
      >
        {completed ? copy.completed : copy.markComplete}
      </button>
      {ownerUnresolved ? (
        <p
          id={ownerMessageId}
          role="status"
          className="max-w-[42ch] text-xs leading-snug text-muted-foreground"
        >
          {copy.completionOwnerRequired}
        </p>
      ) : null}
    </div>
  );
}

export default MarkChapterVisited;
