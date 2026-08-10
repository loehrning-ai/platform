"use client";

import { useEffect, useState } from "react";
import {
  isChapterVisited,
  markChapterVisited,
} from "@/lib/data-science/progress";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
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
  const copy = getDataScienceCourseCopy(locale).reader;

  useEffect(() => {
    setHydrated(true);
    return subscribe(() => {
      setCompleted(isChapterVisited(chapterId));
    });
  }, [chapterId]);

  return (
    <button
      type="button"
      onClick={() => markChapterVisited(chapterId)}
      disabled={!hydrated || completed}
      aria-pressed={completed}
      className="btn btn-primary"
    >
      {completed ? copy.completed : copy.markComplete}
    </button>
  );
}

export default MarkChapterVisited;
