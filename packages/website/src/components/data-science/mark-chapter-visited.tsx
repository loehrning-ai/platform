"use client";

import { useEffect } from "react";
import { markChapterVisited } from "@/lib/data-science/progress";
import type { DsNumberedChapterId } from "@/lib/data-science/types";

// ─── MarkChapterVisited ───────────────────────────
//
// This course has no quiz/capstone gate and no per-widget checkpoint ledger
// (grepped across all 15 source files — nothing). Certificate eligibility
// resolves via the unified store's generic all-lessons-completed
// "completion" path, so the completion criterion is "all 12 numbered
// chapters visited": mounting a chapter's route marks that one chapter
// complete. Mark-on-entry (this mounts inside the route being entered) is
// the deliberate fix for source App.js's `goTo` stale-completion bug,
// which marked the chapter being LEFT — see lib/data-science/progress.ts's
// own doc comment. Renders nothing; exists purely for its mount effect.

export function MarkChapterVisited({ chapterId }: { readonly chapterId: DsNumberedChapterId }) {
  useEffect(() => {
    markChapterVisited(chapterId);
  }, [chapterId]);

  return null;
}

export default MarkChapterVisited;
