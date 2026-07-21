import type { DsChapterId } from "./types";

// ─── Data Science route helpers (plan 012 stage 5) ────────────────────
//
// Single source of truth for this course's URLs. "home" (the Overview)
// resolves to the bare course root — it is not a [chapterSlug] route entry
// (Done Criteria: no home route collision).

export const DS_COURSE_BASE_PATH = "/kurse/open-source/data-science";

export function dsChapterHref(id: DsChapterId): string {
  return id === "home" ? DS_COURSE_BASE_PATH : `${DS_COURSE_BASE_PATH}/${id}`;
}
