import type { DsChapterId } from "./types";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

// ─── Data Science route helpers ────────────────────
//
// Single source of truth for this course's URLs. "home" (the Overview)
// resolves to the bare course root — it is not a [chapterSlug] route entry
// (Done Criteria: no home route collision).

export const DS_COURSE_BASE_PATH = "/kurse/open-source/data-science";

export function dsChapterHref(id: DsChapterId, locale: Locale = "de"): string {
  const canonical =
    id === "home" ? DS_COURSE_BASE_PATH : `${DS_COURSE_BASE_PATH}/${id}`;
  return localizeHref(canonical, locale);
}
