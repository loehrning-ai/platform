"use client";

import { useEffect, useState } from "react";
import { isLessonCompleted, markLessonCompleted } from "@/lib/course/progress";
import { subscribe } from "@/lib/progress/store";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import type { DefChapterId } from "@/lib/data-engineering-fundamentals/types";
import type { Locale } from "@/lib/i18n/locale";

// ─── MarkChapterVisited ──────────────────────────
// This course has no final quiz. A learner explicitly confirms each chapter
// after reading it; merely opening a URL never earns certificate progress.

export function MarkChapterVisited({
  chapterId,
  locale,
}: {
  readonly chapterId: DefChapterId;
  readonly locale: Locale;
}) {
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).reader;

  useEffect(() => {
    setHydrated(true);
    return subscribe(() => {
      setCompleted(
        isLessonCompleted("data-engineering-fundamentals", chapterId),
      );
    });
  }, [chapterId]);

  return (
    <button
      type="button"
      onClick={() =>
        markLessonCompleted("data-engineering-fundamentals", chapterId)
      }
      disabled={!hydrated || completed}
      aria-pressed={completed}
      className="btn btn-primary"
    >
      {completed ? copy.completed : copy.markComplete}
    </button>
  );
}

export default MarkChapterVisited;
