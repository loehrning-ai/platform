/**
 * Data Science progress (FACADE over the unified store).
 *
 * Mirrors `lib/ai-native/progress.ts`'s module-scoped facade pattern: no
 * `courseSlug` argument at call sites, a fixed `SLUG` constant instead. This
 * course has no quiz/exercise mechanism (grepped across all 15 source
 * files — nothing), so certificate eligibility resolves via the unified
 * store's generic all-lessons-completed fallback path
 * (`isCertificateEligible`), keyed off `ALL_COURSE_CATALOG`'s `totalLessons`
 * for this slug (12 — the numbered chapters, set in ).
 *
 * Only the 12 numbered chapters are mappable through this facade — "home"
 * (the Overview) is deliberately excluded at the type level. The client
 * completion control calls `markChapterVisited` only after an explicit learner
 * action; route entry alone never changes certificate progress.
 */

import type { DsNumberedChapterId } from "./types";
import { DS_NUMBERED_CHAPTER_IDS } from "./types";
import {
  markLessonCompleted as uMarkLessonCompleted,
  isLessonCompleted as uIsLessonCompleted,
  getCompletedLessonIds as uGetCompletedLessonIds,
  getCompletedLessonsCount as uGetCompletedLessonsCount,
  getOverallProgress as uGetOverallProgress,
  resetCourse,
  __resetCacheForTests as uResetCacheForTests,
} from "@/lib/progress/store";

const SLUG = "data-science" as const;

export function markChapterVisited(chapterId: DsNumberedChapterId): void {
  uMarkLessonCompleted(SLUG, chapterId);
}

export function isChapterVisited(chapterId: DsNumberedChapterId): boolean {
  return uIsLessonCompleted(SLUG, chapterId);
}

export function getVisitedChapterIds(): ReadonlySet<DsNumberedChapterId> {
  return uGetCompletedLessonIds(SLUG) as ReadonlySet<DsNumberedChapterId>;
}

export function getVisitedChapterCount(): number {
  return uGetCompletedLessonsCount(SLUG);
}

export function getOverallProgress(): number {
  return uGetOverallProgress(SLUG, DS_NUMBERED_CHAPTER_IDS.length);
}

export function resetProgress(): void {
  resetCourse(SLUG);
}

/** Test-only: reset the unified store's in-memory cache. */
export function __resetCacheForTests(): void {
  uResetCacheForTests();
}
