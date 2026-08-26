/**
 * Data Science progress (FACADE over the unified store).
 *
 * Mirrors `lib/ai-native/progress.ts`'s module-scoped facade pattern: no
 * `courseSlug` argument at call sites, a fixed `SLUG` constant instead. This
 * course has no quiz/exercise mechanism. Current completion is therefore a
 * versioned transfer checkpoint plus the retained lesson completion bit.
 * Historical click-only booleans stay in storage but never render or count.
 *
 * Only the 12 numbered chapters are mappable through this facade — "home"
 * (the Overview) is deliberately excluded at the type level. Route entry
 * alone never changes completion-record progress.
 */

import type { DsNumberedChapterId } from "./types";
import { DS_NUMBERED_CHAPTER_IDS } from "./types";
import {
  resetCourse,
  __resetCacheForTests as uResetCacheForTests,
} from "@/lib/progress/store";
import {
  getEvidenceBackedCompletedLessonIds,
  getEvidenceBackedCompletedLessonsCount,
  getEvidenceBackedOverallProgress,
  isEvidenceBackedLessonCompleted,
} from "@/lib/progress/completion-evidence";

const SLUG = "data-science" as const;

export function isChapterVisited(chapterId: DsNumberedChapterId): boolean {
  return isEvidenceBackedLessonCompleted(SLUG, chapterId);
}

export function getVisitedChapterIds(): ReadonlySet<DsNumberedChapterId> {
  return getEvidenceBackedCompletedLessonIds(
    SLUG,
  ) as ReadonlySet<DsNumberedChapterId>;
}

export function getVisitedChapterCount(): number {
  return getEvidenceBackedCompletedLessonsCount(SLUG);
}

export function getOverallProgress(): number {
  return getEvidenceBackedOverallProgress(SLUG, DS_NUMBERED_CHAPTER_IDS.length);
}

export function resetProgress(): void {
  resetCourse(SLUG);
}

/** Test-only: reset the unified store's in-memory cache. */
export function __resetCacheForTests(): void {
  uResetCacheForTests();
}
