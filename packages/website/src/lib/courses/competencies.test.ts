import { describe, expect, it } from "vitest";
import {
  COURSE_OUTCOMES,
  courseOutcomeCoverage,
  coveredCourseOutcomes,
  isCourseRecordEarned,
  totalCourseOutcomeCount,
} from "./competencies";
import { COURSE_CATALOG } from "./catalog";
import { checkpointKey, UNIFIED_SCHEMA_VERSION } from "@/lib/progress/types";
import type { UnifiedCourseSlice, UnifiedProgress } from "@/lib/progress/types";
import type { CourseSlug } from "@/lib/course/types";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
  isEvidenceGatedCourseSlug,
  lessonCompletionEvidenceCheckpointId,
} from "./completion";

/**
 * competencies.test.ts — pins the covered-course-outcomes contract:
 *   • every catalog course publishes outcomes,
 *   • outcomes appear only after the course record bar is met,
 *   • visible descriptions name covered content, not demonstrated ability,
 *   • the selectors are pure and null-safe.
 */

function slice(
  overrides: Partial<UnifiedCourseSlice> = {},
): UnifiedCourseSlice {
  return {
    lessons: {},
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: "2026-01-01T00:00:00.000Z",
    lastActivity: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function progressWith(
  courses: Partial<Record<CourseSlug, UnifiedCourseSlice>>,
): UnifiedProgress {
  const checkpoints = Object.fromEntries(
    Object.entries(courses).flatMap(([slug, courseSlice]) => {
      const courseSlug = slug as CourseSlug;
      if (!courseSlice || !isEvidenceGatedCourseSlug(courseSlug)) return [];
      return Object.entries(courseSlice.lessons)
        .filter(([, lesson]) => lesson.completed)
        .map(([lessonId]) => [
          checkpointKey(
            lessonId,
            lessonCompletionEvidenceCheckpointId(courseSlug),
          ),
          true,
        ]);
    }),
  );
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses,
    xp: 0,
    checkpoints,
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-01-01T00:00:00.000Z",
  };
}

function completedLessons(slug: CourseSlug): UnifiedCourseSlice["lessons"] {
  return Object.fromEntries(
    CANONICAL_LESSON_IDS[slug].map((lessonId) => [
      lessonId,
      {
        sectionsRead: isEvidenceGatedCourseSlug(slug)
          ? (CANONICAL_SECTION_IDS[slug][lessonId] ?? [])
          : [],
        quizScore:
          isEvidenceGatedCourseSlug(slug) &&
          slug !== "data-engineering-fundamentals" &&
          slug !== "data-science"
            ? 1
            : null,
        quizTotal:
          isEvidenceGatedCourseSlug(slug) &&
          slug !== "data-engineering-fundamentals" &&
          slug !== "data-science"
            ? 1
            : null,
        completed: true,
        exercisesCompleted: {},
      },
    ]),
  );
}

function outcomesFor(slug: CourseSlug) {
  const outcomes = COURSE_OUTCOMES[slug];
  if (!outcomes) {
    throw new Error(`missing outcomes for ${slug}`);
  }
  return outcomes;
}

describe("covered course outcomes", () => {
  it("publishes outcomes for every catalog course", () => {
    for (const course of COURSE_CATALOG) {
      expect(
        outcomesFor(course.slug).length,
        `no outcomes for ${course.slug}`,
      ).toBeGreaterThan(0);
    }
    // total matches the sum of all lists
    const total = Object.values(COURSE_OUTCOMES).reduce(
      (n, l) => n + l.length,
      0,
    );
    expect(totalCourseOutcomeCount()).toBe(total);
  });

  it("uses unique outcome ids across all courses", () => {
    const ids = Object.values(COURSE_OUTCOMES)
      .flat()
      .map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns nothing for null or empty progress", () => {
    expect(coveredCourseOutcomes(null)).toEqual([]);
    expect(coveredCourseOutcomes(progressWith({}))).toEqual([]);
    expect(courseOutcomeCoverage(null)).toEqual({
      covered: 0,
      total: totalCourseOutcomeCount(),
    });
  });

  it("does not show outcomes for mere lesson progress without the record", () => {
    const started = progressWith({
      "ki-fuehrerschein": slice({
        lessons: {
          l1: {
            sectionsRead: ["s1"],
            quizScore: null,
            quizTotal: null,
            completed: true,
            exercisesCompleted: {},
          },
        },
      }),
    });
    expect(isCourseRecordEarned(started, "ki-fuehrerschein")).toBe(false);
    expect(coveredCourseOutcomes(started)).toEqual([]);
  });

  it("shows covered outcomes through complete canonical lesson paths", () => {
    for (const slug of [
      "data-engineering-fundamentals",
      "data-science",
    ] as const) {
      const completed = progressWith({
        [slug]: slice({
          lessons: completedLessons(slug),
        }),
      });
      expect(isCourseRecordEarned(completed, slug)).toBe(true);
      expect(coveredCourseOutcomes(completed)).toHaveLength(
        outcomesFor(slug).length,
      );
    }
  });

  it("shows a course's covered outcomes after all lessons and its workshop quiz", () => {
    const passed = progressWith({
      "eu-ai-act-kurs": slice({
        lessons: completedLessons("eu-ai-act-kurs"),
        workshopQuiz: {
          passed: true,
          score: 0.9,
          completedAt: "2026-01-02T00:00:00.000Z",
        },
      }),
    });
    expect(isCourseRecordEarned(passed, "eu-ai-act-kurs")).toBe(true);
    const covered = coveredCourseOutcomes(passed);
    expect(covered.map((outcome) => outcome.id)).toEqual(
      outcomesFor("eu-ai-act-kurs").map((outcome) => outcome.id),
    );
    expect(
      covered.every((outcome) => outcome.courseSlug === "eu-ai-act-kurs"),
    ).toBe(true);
    expect(covered[0].courseTitle).toBe("EU AI Act Kurs");
  });

  it("shows AI-Native outcomes after all lessons via the capstone path", () => {
    const capstone = progressWith({
      "ai-native": slice({
        lessons: completedLessons("ai-native"),
        capstoneSubmitted: true,
      }),
    });
    expect(isCourseRecordEarned(capstone, "ai-native")).toBe(true);
    expect(coveredCourseOutcomes(capstone)).toHaveLength(
      outcomesFor("ai-native").length,
    );
  });

  it("accumulates covered outcomes across completed courses, in course order", () => {
    const both = progressWith({
      "ki-fuehrerschein": slice({
        lessons: completedLessons("ki-fuehrerschein"),
        workshopQuiz: { passed: true, score: 0.8, completedAt: "x" },
      }),
      "ai-native": slice({
        lessons: completedLessons("ai-native"),
        capstoneSubmitted: true,
      }),
    });
    const covered = coveredCourseOutcomes(both);
    const expected =
      outcomesFor("ki-fuehrerschein").length + outcomesFor("ai-native").length;
    expect(covered).toHaveLength(expected);
    // ki-fuehrerschein (catalog step 1) comes before ai-native (step 4)
    expect(covered[0].courseSlug).toBe("ki-fuehrerschein");
    expect(covered.at(-1)?.courseSlug).toBe("ai-native");
    expect(courseOutcomeCoverage(both)).toEqual({
      covered: expected,
      total: totalCourseOutcomeCount(),
    });
  });

  it("localizes visible competency and course copy without changing identity", () => {
    const state = progressWith({
      "ki-fuehrerschein": slice({
        lessons: completedLessons("ki-fuehrerschein"),
        workshopQuiz: {
          passed: true,
          score: 0.8,
          completedAt: "2026-01-02T00:00:00.000Z",
        },
      }),
      "data-science": slice({
        lessons: completedLessons("data-science"),
      }),
    });

    const english = coveredCourseOutcomes(state, "en");
    const german = coveredCourseOutcomes(state, "de");

    expect(
      english.find((item) => item.id === "ki-grundlagen-verstehen"),
    ).toMatchObject({
      label: "Understand AI fundamentals",
      courseTitle: "AI Fundamentals",
    });
    expect(
      german.find((item) => item.id === "metric-before-model"),
    ).toMatchObject({
      label: "Metrik vor dem Modell wählen",
      courseTitle: "Data Science Fundamentals",
    });
    expect(english.map((item) => item.id)).toEqual(
      german.map((item) => item.id),
    );
  });

  it("describes curriculum coverage without claiming demonstrated competence", () => {
    const descriptions = Object.values(COURSE_OUTCOMES)
      .flat()
      .map((outcome) => outcome.description);

    expect(
      descriptions.every((description) =>
        /^(Behandelt|Covers)\b/.test(description),
      ),
    ).toBe(true);
    expect(descriptions.join(" ")).not.toMatch(
      /\b(?:earns?|demonstrates?|masters?|beherrscht|erreicht)\b/i,
    );
  });
});
