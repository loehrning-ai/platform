"use client";

import { useEffect, useState } from "react";
import {
  isChapterVisited,
  markChapterVisited,
} from "@/lib/data-science/progress";
import { subscribe } from "@/lib/progress/store";
import type { DsNumberedChapterId } from "@/lib/data-science/types";

// ─── MarkChapterVisited ───────────────────────────
//
// This course has no final quiz. A learner explicitly confirms each chapter
// after reading it; merely opening a URL never earns certificate progress.

export function MarkChapterVisited({ chapterId }: { readonly chapterId: DsNumberedChapterId }) {
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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
      {completed ? "Chapter completed" : "Mark chapter complete"}
    </button>
  );
}

export default MarkChapterVisited;
