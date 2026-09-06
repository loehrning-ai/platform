/**
 * The learner-progress payloads the authenticated MCP tools return.
 *
 * Pure functions over one progress snapshot and the canonical course
 * registries. Nothing here reads a request, a store, or an environment
 * variable, so both payloads are fully determined by their arguments and can
 * be asserted directly.
 *
 * Two rules shape what they say.
 *
 * 1. An empty account reports as an empty account. Zero stored rows becomes
 *    `has_stored_progress: false` with a null `updated_at`, never a
 *    synthesized record with fresh timestamps.
 * 2. Completion is evidence-backed. A lesson counts as done when the platform's
 *    own completion rules say so, and the next step is resolved through the
 *    same resume resolver the website's own "Weiterlernen" links use, so an
 *    agent and a browser can never name different lessons.
 */

import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { getCourseConfig } from "@/lib/course/config";
import type { CourseSlug } from "@/lib/course/types";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import {
  CANONICAL_LESSON_IDS,
  completedCanonicalLessonCount,
  isCourseCompletionEarned,
  isLessonCompletionEvidenceBacked,
} from "@/lib/courses/completion";
import { hasCourseStarted, resolveCourseResumeHref } from "@/lib/courses/resume";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { UnifiedProgress } from "@/lib/progress/types";
import { absoluteUrl } from "@/lib/seo/entity";
import {
  catalogCourse,
  courseUrl,
  findLesson,
  hasLessonBodies,
  localizedCourse,
} from "../catalog";
import { lessonUri } from "../uris";

/** What one progress read returns. `null` progress means no stored rows. */
export interface ProgressSnapshot {
  readonly progress: UnifiedProgress | null;
  readonly updatedAt: string | null;
}

function accountUrl(locale: Locale): string {
  return absoluteUrl(localizeHref("/konto", locale));
}

function percentComplete(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

function resumeUrl(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
  locale: Locale,
): string {
  return absoluteUrl(localizeHref(resolveCourseResumeHref(progress, slug), locale));
}

/**
 * The first canonical lesson whose completion is not evidence-backed. Same
 * rule the platform's own "Weiterlernen" resolver applies, so the lesson an
 * agent names and the lesson the website links to can never diverge.
 */
function firstIncompleteLessonId(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
): string | undefined {
  return CANONICAL_LESSON_IDS[slug].find(
    (lessonId) => !isLessonCompletionEvidenceBacked(progress, slug, lessonId),
  );
}

function courseSummary(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
  locale: Locale,
) {
  const course = catalogCourse(slug);
  const localized = course ? localizedCourse(course, locale) : undefined;
  const slice = progress?.courses[slug];
  const total = CANONICAL_LESSON_IDS[slug].length;
  const completed = completedCanonicalLessonCount(progress, slug);
  return {
    slug,
    title: localized?.title ?? slug,
    url: course ? courseUrl(course, locale) : accountUrl(locale),
    started: hasCourseStarted(progress, slug),
    total_lessons: total,
    completed_lessons: completed,
    percent_complete: percentComplete(completed, total),
    assessment_required: getCourseConfig(slug, locale).workshopQuizQuestionCount > 0,
    assessment_passed: slice?.workshopQuiz.passed ?? false,
    completion_earned: isCourseCompletionEarned(progress ?? null, slug),
    started_at: slice?.startedAt ?? null,
    last_activity: slice?.lastActivity ?? null,
    continue_url: resumeUrl(progress ?? null, slug, locale),
  };
}

type CourseSummary = ReturnType<typeof courseSummary>;

export function buildMyProgress(snapshot: ProgressSnapshot, locale: Locale) {
  const progress = snapshot.progress;
  const courses = COURSE_CATALOG.map((course) =>
    courseSummary(progress, course.slug, locale),
  );
  return {
    stand: SITE_CONTENT_DATE,
    locale,
    // Zero stored rows is reported as zero stored rows. An empty account is
    // never dressed up as a synthesized record with fresh timestamps.
    has_stored_progress: progress !== null,
    updated_at: snapshot.updatedAt,
    account_url: accountUrl(locale),
    xp: progress?.xp ?? 0,
    streak: {
      days: progress?.streak.days ?? 0,
      last: progress?.streak.last ?? null,
    },
    badges: Object.entries(progress?.badges ?? {}).map(([id, awardedAt]) => ({
      id,
      awarded_at: awardedAt,
    })),
    total_completed_lessons: courses.reduce(
      (sum, course) => sum + course.completed_lessons,
      0,
    ),
    courses_completed: courses.filter((course) => course.completion_earned).length,
    courses,
  };
}

type NextStepKind = "lesson" | "assessment" | "participation_record" | "done";

const NEXT_STEP_REASON: Readonly<Record<NextStepKind, string>> = {
  lesson: "This is the first lesson in the course that is not finished yet.",
  assessment:
    "Every lesson in this course is done. The assessment is what is left.",
  participation_record:
    "This course is finished. The certificate of participation is ready.",
  done: "Every course on the platform is finished. Nothing is open right now.",
};

/**
 * One next step always carries the same fields, whatever its kind. An agent
 * that reads `lesson_id` on a finished account gets an explicit null rather
 * than a missing key it has to guess about.
 */
export interface NextStep {
  readonly kind: NextStepKind;
  readonly course: CourseSlug | null;
  readonly course_title: string | null;
  readonly course_url: string | null;
  readonly lesson_id: string | null;
  readonly lesson_title: string | null;
  readonly lesson_duration_minutes: number | null;
  readonly resource_uri: string | null;
  readonly url: string;
  readonly completed_lessons: number;
  readonly total_lessons: number;
  readonly reason: string;
}

function nothingOpen(locale: Locale): NextStep {
  return {
    kind: "done",
    course: null,
    course_title: null,
    course_url: null,
    lesson_id: null,
    lesson_title: null,
    lesson_duration_minutes: null,
    resource_uri: null,
    url: accountUrl(locale),
    completed_lessons: 0,
    total_lessons: 0,
    reason: NEXT_STEP_REASON.done,
  };
}

/**
 * Classify one course's next action with the same branches the platform's own
 * resume resolver walks: first incomplete lesson, then the assessment, then
 * the completion record.
 */
function nextStepForCourse(
  progress: UnifiedProgress | null,
  summary: CourseSummary,
  locale: Locale,
): NextStep {
  const slug = summary.slug;
  const lessonId = firstIncompleteLessonId(progress, slug);
  const kind: NextStepKind = lessonId
    ? "lesson"
    : summary.completion_earned || !summary.assessment_required
      ? "participation_record"
      : "assessment";
  const lesson = lessonId ? findLesson(slug, lessonId, locale) : undefined;
  return {
    kind,
    course: slug,
    course_title: summary.title,
    course_url: summary.url,
    lesson_id: lessonId ?? null,
    lesson_title: lesson?.title ?? null,
    lesson_duration_minutes: lesson?.durationMinutes ?? null,
    resource_uri:
      lessonId && hasLessonBodies(slug) ? lessonUri(slug, lessonId, locale) : null,
    url: summary.continue_url,
    completed_lessons: summary.completed_lessons,
    total_lessons: summary.total_lessons,
    reason: NEXT_STEP_REASON[kind],
  };
}

export function buildNextStep(snapshot: ProgressSnapshot, locale: Locale) {
  const progress = snapshot.progress;
  const summaries = COURSE_CATALOG.map((course) =>
    courseSummary(progress, course.slug, locale),
  );
  const open = summaries.filter((summary) => !summary.completion_earned);
  // Courses already under way come first, most recently touched first; the
  // recommended path order (the catalog's own order) decides the rest.
  const started = open
    .filter((summary) => summary.started)
    .sort((left, right) =>
      (right.last_activity ?? "").localeCompare(left.last_activity ?? ""),
    );
  const fresh = open.filter((summary) => !summary.started);
  const ranked = [...started, ...fresh];

  return {
    stand: SITE_CONTENT_DATE,
    locale,
    has_stored_progress: progress !== null,
    account_url: accountUrl(locale),
    next_step:
      ranked.length === 0
        ? nothingOpen(locale)
        : nextStepForCourse(progress, ranked[0]!, locale),
    alternatives: ranked
      .slice(1, 3)
      .map((summary) => nextStepForCourse(progress, summary, locale)),
  };
}

