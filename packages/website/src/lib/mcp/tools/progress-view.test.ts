/**
 * The two authenticated payloads, asserted as pure functions.
 *
 * Fixtures are built from the platform's own exported completion helpers
 * rather than hand-written checkpoint strings, so a change to the completion
 * rules shows up here as a failing expectation instead of a fixture that
 * quietly stops describing a completed lesson.
 */

import { describe, expect, it } from "vitest";
import { getCourseConfig } from "@/lib/course/config";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import {
  CANONICAL_LESSON_IDS,
  isLessonCompletionEvidenceBacked,
} from "@/lib/courses/completion";
import { resolveCourseResumeHref } from "@/lib/courses/resume";
import { localizeHref } from "@/lib/i18n/locale";
import {
  legacyCompletionEvidenceCheckpointKey,
  UNIFIED_SCHEMA_VERSION,
  type UnifiedCourseSlice,
  type UnifiedProgress,
} from "@/lib/progress/types";
import { absoluteUrl } from "@/lib/seo/entity";
import { buildMyProgress, buildNextStep } from "./progress-view";

const FIRST_COURSE = COURSE_CATALOG[0]!.slug;
const LAST_ACTIVITY = "2026-09-01T10:00:00.000Z";

const EMPTY_SNAPSHOT = { progress: null, updatedAt: null } as const;

function emptyProgress(): UnifiedProgress {
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: LAST_ACTIVITY,
  };
}

function completedSlice(
  lessonIds: readonly string[],
  options: { readonly quizPassed?: boolean; readonly lastActivity?: string } = {},
): UnifiedCourseSlice {
  return {
    lessons: Object.fromEntries(
      lessonIds.map((lessonId) => [
        lessonId,
        {
          sectionsRead: [],
          quizScore: null,
          quizTotal: null,
          completed: true,
          exercisesCompleted: {},
        },
      ]),
    ),
    workshopQuiz: {
      passed: options.quizPassed === true,
      score: options.quizPassed === true ? 1 : 0,
      completedAt: options.quizPassed === true ? LAST_ACTIVITY : null,
    },
    capstoneSubmitted: false,
    startedAt: LAST_ACTIVITY,
    lastActivity: options.lastActivity ?? LAST_ACTIVITY,
  };
}

/**
 * Grandfathered completion markers. `isLessonCompletionEvidenceBacked` accepts
 * them directly, which keeps a fixture from having to reproduce every course's
 * own section, quiz, and exercise proof shape.
 */
function evidenceCheckpoints(
  slug: CourseSlug,
  lessonIds: readonly string[],
): Record<string, boolean> {
  return Object.fromEntries(
    lessonIds.map((lessonId) => [
      legacyCompletionEvidenceCheckpointKey(slug, lessonId),
      true,
    ]),
  );
}

function withCompletedLessons(
  base: UnifiedProgress,
  slug: CourseSlug,
  lessonIds: readonly string[],
  options: { readonly quizPassed?: boolean; readonly lastActivity?: string } = {},
): UnifiedProgress {
  return {
    ...base,
    courses: { ...base.courses, [slug]: completedSlice(lessonIds, options) },
    checkpoints: {
      ...base.checkpoints,
      ...evidenceCheckpoints(slug, lessonIds),
    },
  };
}

function everyCourseFinished(): UnifiedProgress {
  return COURSE_SLUGS.reduce<UnifiedProgress>(
    (progress, slug) =>
      withCompletedLessons(progress, slug, CANONICAL_LESSON_IDS[slug], {
        quizPassed: true,
      }),
    emptyProgress(),
  );
}

function courseOf(payload: ReturnType<typeof buildMyProgress>, slug: string) {
  return payload.courses.find((course) => course.slug === slug)!;
}

describe("the fixture really describes completed lessons", () => {
  it("satisfies the platform's own evidence rule", () => {
    const lessonId = CANONICAL_LESSON_IDS[FIRST_COURSE][0]!;
    const progress = withCompletedLessons(emptyProgress(), FIRST_COURSE, [
      lessonId,
    ]);
    expect(
      isLessonCompletionEvidenceBacked(progress, FIRST_COURSE, lessonId),
    ).toBe(true);
    expect(
      isLessonCompletionEvidenceBacked(
        progress,
        FIRST_COURSE,
        CANONICAL_LESSON_IDS[FIRST_COURSE][1]!,
      ),
    ).toBe(false);
  });
});

describe("get_my_progress payload", () => {
  it("reports an account with no stored rows as empty", () => {
    const payload = buildMyProgress(EMPTY_SNAPSHOT, "de");

    expect(payload.has_stored_progress).toBe(false);
    expect(payload.updated_at).toBeNull();
    expect(payload.xp).toBe(0);
    expect(payload.badges).toEqual([]);
    expect(payload.streak).toEqual({ days: 0, last: null });
    expect(payload.total_completed_lessons).toBe(0);
    expect(payload.courses_completed).toBe(0);
    expect(payload.courses).toHaveLength(COURSE_CATALOG.length);
    for (const course of payload.courses) {
      expect(course.started).toBe(false);
      expect(course.completed_lessons).toBe(0);
      expect(course.percent_complete).toBe(0);
      expect(course.completion_earned).toBe(false);
      expect(course.started_at).toBeNull();
      expect(course.last_activity).toBeNull();
      expect(course.total_lessons).toBeGreaterThan(0);
    }
  });

  it("counts only evidence-backed lessons and keeps the timestamp it was given", () => {
    const lessons = CANONICAL_LESSON_IDS[FIRST_COURSE].slice(0, 2);
    const progress = withCompletedLessons(
      emptyProgress(),
      FIRST_COURSE,
      lessons,
    );
    const payload = buildMyProgress(
      { progress, updatedAt: "2026-09-02T08:00:00.000Z" },
      "de",
    );
    const course = courseOf(payload, FIRST_COURSE);

    expect(payload.has_stored_progress).toBe(true);
    expect(payload.updated_at).toBe("2026-09-02T08:00:00.000Z");
    expect(course.started).toBe(true);
    expect(course.completed_lessons).toBe(2);
    expect(course.percent_complete).toBe(
      Math.round((2 / CANONICAL_LESSON_IDS[FIRST_COURSE].length) * 100),
    );
    expect(course.completion_earned).toBe(false);
    expect(payload.total_completed_lessons).toBe(2);
  });

  it("marks a course earned once its lessons and its assessment are done", () => {
    const progress = withCompletedLessons(
      emptyProgress(),
      FIRST_COURSE,
      CANONICAL_LESSON_IDS[FIRST_COURSE],
      { quizPassed: true },
    );
    const course = courseOf(buildMyProgress({ progress, updatedAt: null }, "de"), FIRST_COURSE);

    expect(course.percent_complete).toBe(100);
    expect(course.assessment_passed).toBe(true);
    expect(course.completion_earned).toBe(true);
  });

  it("withholds the record while the assessment is still open", () => {
    const progress = withCompletedLessons(
      emptyProgress(),
      FIRST_COURSE,
      CANONICAL_LESSON_IDS[FIRST_COURSE],
    );
    const course = courseOf(buildMyProgress({ progress, updatedAt: null }, "de"), FIRST_COURSE);

    expect(course.percent_complete).toBe(100);
    expect(course.assessment_required).toBe(
      getCourseConfig(FIRST_COURSE).workshopQuizQuestionCount > 0,
    );
    expect(course.assessment_passed).toBe(false);
    expect(course.completion_earned).toBe(false);
  });

  it("serves absolute, locale-correct URLs", () => {
    const payload = buildMyProgress(EMPTY_SNAPSHOT, "en");
    for (const course of payload.courses) {
      expect(course.url.startsWith("https://")).toBe(true);
      expect(new URL(course.url).pathname.startsWith("/en")).toBe(true);
      expect(new URL(course.continue_url).pathname.startsWith("/en")).toBe(true);
    }
    expect(new URL(payload.account_url).pathname).toBe("/en/konto");
  });

  it("stays well inside the agent output ceiling for a finished account", () => {
    const payload = buildMyProgress(
      { progress: everyCourseFinished(), updatedAt: LAST_ACTIVITY },
      "de",
    );
    expect(payload.courses_completed).toBe(COURSE_CATALOG.length);
    expect(new TextEncoder().encode(JSON.stringify(payload)).length).toBeLessThan(
      64 * 1024,
    );
  });
});

describe("get_next_step payload", () => {
  it("sends an untouched account to the first lesson of the recommended path", () => {
    const step = buildNextStep(EMPTY_SNAPSHOT, "de").next_step;

    expect(step.kind).toBe("lesson");
    expect(step).toMatchObject({
      course: FIRST_COURSE,
      lesson_id: CANONICAL_LESSON_IDS[FIRST_COURSE][0],
    });
    expect(step.url.startsWith("https://")).toBe(true);
  });

  it("names the first lesson that is not finished yet", () => {
    const progress = withCompletedLessons(
      emptyProgress(),
      FIRST_COURSE,
      CANONICAL_LESSON_IDS[FIRST_COURSE].slice(0, 2),
    );
    const step = buildNextStep({ progress, updatedAt: null }, "de").next_step;

    expect(step.lesson_id).toBe(CANONICAL_LESSON_IDS[FIRST_COURSE][2]);
    expect(step.completed_lessons).toBe(2);
    expect(step.lesson_title).toEqual(expect.any(String));
    expect(step.resource_uri).toContain(`lesson://${FIRST_COURSE}/`);
  });

  it("never links anywhere other than the platform's own resume resolver", () => {
    for (const lessonCount of [0, 1, CANONICAL_LESSON_IDS[FIRST_COURSE].length]) {
      const progress = withCompletedLessons(
        emptyProgress(),
        FIRST_COURSE,
        CANONICAL_LESSON_IDS[FIRST_COURSE].slice(0, lessonCount),
      );
      const step = buildNextStep({ progress, updatedAt: null }, "de").next_step;
      expect(step.url).toBe(
        absoluteUrl(
          localizeHref(resolveCourseResumeHref(progress, FIRST_COURSE), "de"),
        ),
      );
    }
  });

  it("moves to the assessment once every lesson of a course is done", () => {
    const progress = withCompletedLessons(
      emptyProgress(),
      FIRST_COURSE,
      CANONICAL_LESSON_IDS[FIRST_COURSE],
    );
    const step = buildNextStep({ progress, updatedAt: null }, "de").next_step;

    expect(step.kind).toBe("assessment");
    expect(step.lesson_id).toBeNull();
    expect(step.resource_uri).toBeNull();
    expect(new URL(step.url).pathname.endsWith("/quiz")).toBe(true);
  });

  it("prefers the course that was touched most recently", () => {
    const older = withCompletedLessons(emptyProgress(), FIRST_COURSE, [
      CANONICAL_LESSON_IDS[FIRST_COURSE][0]!,
    ]);
    const second = COURSE_CATALOG[1]!.slug;
    const progress = withCompletedLessons(
      older,
      second,
      [CANONICAL_LESSON_IDS[second][0]!],
      { lastActivity: "2026-09-04T09:00:00.000Z" },
    );
    const payload = buildNextStep({ progress, updatedAt: null }, "de");

    expect(payload.next_step.course).toBe(second);
    expect(payload.alternatives[0]?.course).toBe(FIRST_COURSE);
  });

  it("ranks started courses ahead of untouched ones", () => {
    const second = COURSE_CATALOG[1]!.slug;
    const progress = withCompletedLessons(emptyProgress(), second, [
      CANONICAL_LESSON_IDS[second][0]!,
    ]);
    const payload = buildNextStep({ progress, updatedAt: null }, "de");

    expect(payload.next_step.course).toBe(second);
    expect(payload.alternatives).toHaveLength(2);
  });

  it("skips a course that is already finished", () => {
    const progress = withCompletedLessons(
      emptyProgress(),
      FIRST_COURSE,
      CANONICAL_LESSON_IDS[FIRST_COURSE],
      { quizPassed: true },
    );
    const payload = buildNextStep({ progress, updatedAt: null }, "de");

    expect(payload.next_step.course).not.toBe(FIRST_COURSE);
    for (const alternative of payload.alternatives) {
      expect(alternative.course).not.toBe(FIRST_COURSE);
    }
  });

  it("says so plainly when nothing is open", () => {
    const payload = buildNextStep(
      { progress: everyCourseFinished(), updatedAt: LAST_ACTIVITY },
      "de",
    );

    expect(payload.next_step.kind).toBe("done");
    expect(payload.alternatives).toEqual([]);
    // No en dash (U+2013), no em dash (U+2014): the reason is copy an agent
    // reads back to a learner, so it answers to the same typography rule a
    // page does.
    expect(payload.next_step.reason).not.toMatch(/[\u2013\u2014]/);
  });
});
