import type { CourseSlug } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";
import {
  CANONICAL_LESSON_IDS,
  isEvidenceBackedCourseCompletionEarned,
  isLessonCompletionEvidenceBacked,
} from "@/lib/courses/completion";
import type { UnifiedProgress } from "@/lib/progress/types";

/**
 * Lesson-engine IDs in block courses end in "-<module>-<lesson>" (for example
 * "daten-1-2" lives in block_1). See docs/lesson-engine.md.
 */
const ENGINE_LESSON_ID_SUFFIX = /-(\d+)-\d+$/;

function engineBlockForLesson(lessonId: string): string | null {
  const moduleNumber = ENGINE_LESSON_ID_SUFFIX.exec(lessonId)?.[1];
  return moduleNumber ? `block_${moduleNumber}` : null;
}

function blockForGermanLesson(
  slug: CourseSlug,
  lessonId: string,
): string | null {
  if (
    slug === "ki-fuehrerschein" ||
    slug === "ki-und-gesellschaft" ||
    slug === "eu-ai-act-kurs"
  ) {
    return (
      /^(block_\d+)_lesson_\d+$/.exec(lessonId)?.[1] ??
      engineBlockForLesson(lessonId)
    );
  }

  return null;
}

/**
 * Resolve a canonical lesson ID to its real route.
 *
 * The three block-based German readers render several lessons at one URL, so
 * they use a validated fragment that LessonLayout resolves client-side. Every
 * other course has one lesson/chapter per route; AI-Native lesson IDs encode
 * the containing module ("messen-1-2" lives at /ai-native/kurs/modul_1/...).
 */
export function courseLessonHref(slug: CourseSlug, lessonId: string): string {
  const config = getCourseConfig(slug);
  const blockId = blockForGermanLesson(slug, lessonId);
  if (blockId) {
    return `${config.coursePath}/${blockId}#lesson=${encodeURIComponent(lessonId)}`;
  }

  if (slug === "ai-native") {
    // Engine IDs end in "-<module>-<lesson>" and live at /modul_<module>/<id>.
    const moduleNumber = ENGINE_LESSON_ID_SUFFIX.exec(lessonId)?.[1];
    return moduleNumber
      ? `${config.coursePath}/modul_${moduleNumber}/${lessonId}`
      : config.coursePath;
  }

  return `${config.coursePath}/${lessonId}`;
}

export function hasCourseStarted(
  progress: UnifiedProgress | null | undefined,
  slug: CourseSlug,
): boolean {
  const slice = progress?.courses[slug];
  if (!slice) return false;
  return (
    CANONICAL_LESSON_IDS[slug].some((lessonId) =>
      Object.hasOwn(slice.lessons, lessonId),
    ) ||
    slice.workshopQuiz.completedAt !== null ||
    (slug === "ai-native" && slice.capstoneSubmitted)
  );
}

/**
 * Return the first incomplete canonical lesson, then the real assessment or
 * completion record once every lesson is done.
 *
 * Per-lesson timestamps are intentionally absent from the progress schema.
 * Canonical first-incomplete order therefore gives every "Weiterlernen"
 * surface one deterministic and honest resume target without inventing a
 * last-visited route.
 */
export function resolveCourseResumeHref(
  progress: UnifiedProgress | null | undefined,
  slug: CourseSlug,
): string {
  const config = getCourseConfig(slug);
  const lessons = progress?.courses[slug]?.lessons;
  const firstIncomplete = CANONICAL_LESSON_IDS[slug].find(
    (lessonId) =>
      !lessons?.[lessonId]?.completed ||
      !isLessonCompletionEvidenceBacked(progress, slug, lessonId),
  );

  if (firstIncomplete) return courseLessonHref(slug, firstIncomplete);
  if (isEvidenceBackedCourseCompletionEarned(progress ?? null, slug)) {
    return `${config.coursePath}/zertifikat`;
  }
  if (config.workshopQuizQuestionCount > 0) {
    return `${config.coursePath}/quiz`;
  }
  return `${config.coursePath}/zertifikat`;
}
