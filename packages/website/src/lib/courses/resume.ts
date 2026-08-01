import type { CourseSlug } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";
import {
  CANONICAL_LESSON_IDS,
  isCourseCompletionEarned,
} from "@/lib/courses/completion";
import type { UnifiedProgress } from "@/lib/progress/types";

const SOCIETY_BLOCK_BY_LESSON_PREFIX = Object.freeze({
  arbeit: "block_1",
  deepfake: "block_2",
  ethik: "block_3",
});

function blockForGermanLesson(
  slug: CourseSlug,
  lessonId: string,
): string | null {
  if (slug === "ki-und-gesellschaft") {
    const prefix = lessonId.split("-", 1)[0];
    return (
      SOCIETY_BLOCK_BY_LESSON_PREFIX[
        prefix as keyof typeof SOCIETY_BLOCK_BY_LESSON_PREFIX
      ] ?? null
    );
  }

  if (slug === "ki-fuehrerschein" || slug === "eu-ai-act-kurs") {
    return /^(block_\d+)_lesson_\d+$/.exec(lessonId)?.[1] ?? null;
  }

  return null;
}

/**
 * Resolve a canonical lesson ID to its real route.
 *
 * The three block-based German readers render several lessons at one URL, so
 * they use a validated fragment that LessonLayout resolves client-side. Every
 * other course has one lesson/chapter per route, except the German AI-Native
 * course whose lesson IDs already encode the containing module.
 */
export function courseLessonHref(
  slug: CourseSlug,
  lessonId: string,
): string {
  const config = getCourseConfig(slug);
  const blockId = blockForGermanLesson(slug, lessonId);
  if (blockId) {
    return `${config.coursePath}/${blockId}#lesson=${encodeURIComponent(lessonId)}`;
  }

  if (slug === "ai-native") {
    const moduleId = /^(modul_\d+)_lesson_\d+$/.exec(lessonId)?.[1];
    return moduleId
      ? `${config.coursePath}/${moduleId}/${lessonId}`
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
    slice.capstoneSubmitted
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
    (lessonId) => !lessons?.[lessonId]?.completed,
  );

  if (firstIncomplete) return courseLessonHref(slug, firstIncomplete);
  if (isCourseCompletionEarned(progress ?? null, slug)) {
    return `${config.coursePath}/zertifikat`;
  }
  if (config.workshopQuizQuestionCount > 0) {
    return `${config.coursePath}/quiz`;
  }
  return `${config.coursePath}/zertifikat`;
}
