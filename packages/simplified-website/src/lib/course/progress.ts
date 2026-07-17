// ─── KI-Führerschein / EU-AI-Act course progress (FACADE) ────────
//
// As of shared course architecture there is ONE progress store. This module is a
// thin, backward-compatible facade over `src/lib/progress/store.ts`: the same
// function signatures the two free-course pages + course components already
// import, now reading/writing the unified store (which migrated the legacy
// `course-progress::<slug>` payloads forward — never wiped, R1).

import type { CourseProgress, CourseSlug } from "./types";
import {
  getCourseSlice,
  markSectionRead as uMarkSectionRead,
  isSectionRead as uIsSectionRead,
  getReadSectionIds as uGetReadSectionIds,
  markLessonCompleted as uMarkLessonCompleted,
  isLessonCompleted as uIsLessonCompleted,
  getCompletedLessonIds as uGetCompletedLessonIds,
  getCompletedLessonsCount as uGetCompletedLessonsCount,
  saveLessonQuizScore as uSaveLessonQuizScore,
  getLessonQuizScore as uGetLessonQuizScore,
  saveWorkshopQuizResult as uSaveWorkshopQuizResult,
  getWorkshopQuizResult as uGetWorkshopQuizResult,
  isWorkshopQuizPassed as uIsWorkshopQuizPassed,
  isCertificateEligible as uIsCertificateEligible,
  getBlockCompletedLessons as uGetBlockCompletedLessons,
  areAllBlockLessonsCompleted as uAreAllBlockLessonsCompleted,
  getOverallProgress as uGetOverallProgress,
  resetCourse,
} from "@/lib/progress/store";

// ─── Section Progress ───────────────────────────────────────────

export function markSectionRead(
  courseSlug: CourseSlug,
  lessonId: string,
  sectionId: string,
): void {
  uMarkSectionRead(courseSlug, lessonId, sectionId);
}

export function isSectionRead(
  courseSlug: CourseSlug,
  lessonId: string,
  sectionId: string,
): boolean {
  return uIsSectionRead(courseSlug, lessonId, sectionId);
}

export function getReadSectionIds(
  courseSlug: CourseSlug,
  lessonId: string,
): ReadonlySet<string> {
  return uGetReadSectionIds(courseSlug, lessonId);
}

// ─── Lesson Progress ────────────────────────────────────────────

export function markLessonCompleted(
  courseSlug: CourseSlug,
  lessonId: string,
): void {
  uMarkLessonCompleted(courseSlug, lessonId);
}

export function isLessonCompleted(
  courseSlug: CourseSlug,
  lessonId: string,
): boolean {
  return uIsLessonCompleted(courseSlug, lessonId);
}

export function getCompletedLessonIds(
  courseSlug: CourseSlug,
): ReadonlySet<string> {
  return uGetCompletedLessonIds(courseSlug);
}

// ─── Quiz Scores ────────────────────────────────────────────────

export function saveLessonQuizScore(
  courseSlug: CourseSlug,
  lessonId: string,
  score: number,
  total: number,
): void {
  uSaveLessonQuizScore(courseSlug, lessonId, score, total);
}

export function getLessonQuizScore(
  courseSlug: CourseSlug,
  lessonId: string,
): { score: number; total: number } | null {
  return uGetLessonQuizScore(courseSlug, lessonId);
}

// ─── Workshop Quiz ──────────────────────────────────────────────

export function saveWorkshopQuizResult(
  courseSlug: CourseSlug,
  score: number,
  passed: boolean,
): void {
  uSaveWorkshopQuizResult(courseSlug, score, passed);
}

export function getWorkshopQuizResult(courseSlug: CourseSlug): {
  passed: boolean;
  score: number;
  completedAt: string | null;
} {
  return uGetWorkshopQuizResult(courseSlug);
}

export function isWorkshopQuizPassed(courseSlug: CourseSlug): boolean {
  return uIsWorkshopQuizPassed(courseSlug);
}

/**
 * Certificate gate (shared course architecture): quiz passed OR capstone
 * submitted. Identical to `isWorkshopQuizPassed` for the two free courses
 * (capstone is always false there); AI-Native adds the capstone path.
 */
export function isCertificateEligible(courseSlug: CourseSlug): boolean {
  return uIsCertificateEligible(courseSlug);
}

// ─── Aggregate Stats ────────────────────────────────────────────

export function getCompletedLessonsCount(courseSlug: CourseSlug): number {
  return uGetCompletedLessonsCount(courseSlug);
}

export function getBlockCompletedLessons(
  courseSlug: CourseSlug,
  lessonIds: readonly string[],
): number {
  return uGetBlockCompletedLessons(courseSlug, lessonIds);
}

export function areAllBlockLessonsCompleted(
  courseSlug: CourseSlug,
  lessonIds: readonly string[],
): boolean {
  return uAreAllBlockLessonsCompleted(courseSlug, lessonIds);
}

export function getOverallProgress(
  courseSlug: CourseSlug,
  totalLessons: number,
): number {
  return uGetOverallProgress(courseSlug, totalLessons);
}

/** Project the unified course slice down to the legacy `CourseProgress` shape. */
export function getAllProgress(courseSlug: CourseSlug): CourseProgress {
  const slice = getCourseSlice(courseSlug);
  return {
    lessons: Object.fromEntries(
      Object.entries(slice.lessons).map(([id, l]) => [
        id,
        {
          sectionsRead: l.sectionsRead,
          quizScore: l.quizScore,
          quizTotal: l.quizTotal,
          completed: l.completed,
        },
      ]),
    ),
    workshopQuiz: slice.workshopQuiz,
    startedAt: slice.startedAt,
    lastActivity: slice.lastActivity,
  };
}

export function resetProgress(courseSlug: CourseSlug): void {
  resetCourse(courseSlug);
}

// ─── Cross-Device Progress Sharing (URL-based) ─────────────────

/**
 * Serialize current progress to a base64url string for sharing.
 * Returns null if no progress exists.
 */
export function serializeProgress(courseSlug: CourseSlug): string | null {
  const state = getAllProgress(courseSlug);
  const hasProgress =
    Object.keys(state.lessons).length > 0 || state.workshopQuiz.passed;
  if (!hasProgress) return null;

  const json = JSON.stringify(state);
  const encoded = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Deserialize a base64url string back to CourseProgress.
 */
export function deserializeProgress(encoded: string): CourseProgress | null {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const parsed = JSON.parse(json);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.lessons !== "object" ||
      typeof parsed.workshopQuiz !== "object"
    ) {
      return null;
    }

    return parsed as CourseProgress;
  } catch {
    return null;
  }
}

/**
 * Import progress from a serialized string, merging with existing progress.
 * Merges directly into the unified store (higher quiz score wins, sections
 * union, completion sticky) without ever wiping existing progress.
 */
export function importProgress(
  courseSlug: CourseSlug,
  encoded: string,
): boolean {
  const imported = deserializeProgress(encoded);
  if (!imported) return false;

  // Merge into the unified store via the public write API.
  if (imported.workshopQuiz.passed && !uIsWorkshopQuizPassed(courseSlug)) {
    uSaveWorkshopQuizResult(courseSlug, imported.workshopQuiz.score, true);
  }
  for (const [lessonId, lesson] of Object.entries(imported.lessons)) {
    for (const sectionId of lesson.sectionsRead) {
      uMarkSectionRead(courseSlug, lessonId, sectionId);
    }
    if (lesson.quizScore != null && lesson.quizTotal != null) {
      uSaveLessonQuizScore(
        courseSlug,
        lessonId,
        Math.round(lesson.quizScore * lesson.quizTotal),
        lesson.quizTotal,
      );
    }
    if (lesson.completed) {
      uMarkLessonCompleted(courseSlug, lessonId);
    }
  }
  return true;
}

/**
 * Build a full shareable URL with progress encoded in the hash.
 */
export function buildProgressUrl(
  courseSlug: CourseSlug,
  baseUrl: string,
): string | null {
  const encoded = serializeProgress(courseSlug);
  if (!encoded) return null;
  return `${baseUrl}#progress=${encoded}`;
}
