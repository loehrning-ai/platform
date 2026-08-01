"use client";

import { useEffect, useState } from "react";
import {
  isLessonCompleted,
  markLessonCompleted,
} from "@/lib/course/progress";
import { subscribe } from "@/lib/progress/store";
import type { DefChapterId } from "@/lib/data-engineering-fundamentals/types";

// ─── MarkChapterVisited ──────────────────────────
// This course has no final quiz. A learner explicitly confirms each chapter
// after reading it; merely opening a URL never earns certificate progress.

export function MarkChapterVisited({ chapterId }: { readonly chapterId: DefChapterId }) {
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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
      {completed ? "Chapter completed" : "Mark chapter complete"}
    </button>
  );
}

export default MarkChapterVisited;
