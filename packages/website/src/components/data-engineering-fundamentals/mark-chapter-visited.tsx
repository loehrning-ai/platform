"use client";

import { useEffect } from "react";
import { markLessonCompleted } from "@/lib/course/progress";
import type { DefChapterId } from "@/lib/data-engineering-fundamentals/types";

// ─── MarkChapterVisited (plan 011 stage 11) ──────────────────────────
// This course has no quiz/capstone gate (grepped across all 14 source
// chapter files — nothing) and no per-widget checkpoint ledger (its
// chapter-visit tracking mirrors codex/data-infrastructure's own
// no-quiz precedent). Certificate eligibility resolves via plan 007's
// generic all-lessons-completed "completion" path, so the chosen
// completion criterion for this course is literally "all 12 chapters
// visited": mounting a chapter's route marks that one chapter complete,
// nothing more (source's own App.js backfills every *preceding* chapter
// too via a scroll-position side effect — not replicated here, since it
// would silently mark chapters the learner never actually opened).
// Renders nothing; exists purely for its mount-effect.

export function MarkChapterVisited({ chapterId }: { readonly chapterId: DefChapterId }) {
  useEffect(() => {
    markLessonCompleted("data-engineering-fundamentals", chapterId);
  }, [chapterId]);

  return null;
}

export default MarkChapterVisited;
