import type { CourseSlug } from "@/lib/course/types";
import {
  evidenceBackedCompletedLessonIds,
  isLessonCompletionEvidenceBacked,
} from "@/lib/courses/completion";
import {
  getCompletedLessonsCount,
  getOverallProgress,
  getUnifiedState,
  isCertificateEligible,
} from "./store";

/** Store-bound completion reads for UI and certificate surfaces. */
export function isEvidenceBackedLessonCompleted(
  courseSlug: CourseSlug,
  lessonId: string,
): boolean {
  return isLessonCompletionEvidenceBacked(
    getUnifiedState(),
    courseSlug,
    lessonId,
  );
}

export function getEvidenceBackedCompletedLessonIds(
  courseSlug: CourseSlug,
): ReadonlySet<string> {
  return evidenceBackedCompletedLessonIds(getUnifiedState(), courseSlug);
}

export function getEvidenceBackedCompletedLessonsCount(
  courseSlug: CourseSlug,
): number {
  return getCompletedLessonsCount(courseSlug);
}

export function getEvidenceBackedBlockCompletedLessons(
  courseSlug: CourseSlug,
  lessonIds: readonly string[],
): number {
  const completed = getEvidenceBackedCompletedLessonIds(courseSlug);
  return lessonIds.filter((lessonId) => completed.has(lessonId)).length;
}

export function getEvidenceBackedOverallProgress(
  courseSlug: CourseSlug,
  totalLessons: number,
): number {
  return getOverallProgress(courseSlug, totalLessons);
}

export function isEvidenceBackedCertificateEligible(
  courseSlug: CourseSlug,
): boolean {
  return isCertificateEligible(courseSlug);
}
