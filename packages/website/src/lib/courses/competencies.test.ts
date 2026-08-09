import { describe, expect, it } from "vitest";
import {
  COURSE_COMPETENCIES,
  competencyProgress,
  earnedCompetencies,
  isCourseRecordEarned,
  totalCompetencyCount,
} from "./competencies";
import { COURSE_CATALOG } from "./catalog";
import { UNIFIED_SCHEMA_VERSION } from "@/lib/progress/types";
import type { UnifiedCourseSlice, UnifiedProgress } from "@/lib/progress/types";
import type { CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "./completion";

/**
 * competencies.test.ts — pins the honest "earned skills" contract:
 *   • every certified course grants competencies (nothing else does),
 *   • a competency is earned ONLY when the record bar is met,
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
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses,
    xp: 0,
    checkpoints: {},
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
        sectionsRead: [],
        quizScore: null,
        quizTotal: null,
        completed: true,
        exercisesCompleted: {},
      },
    ]),
  );
}

function competenciesFor(slug: CourseSlug) {
  const competencies = COURSE_COMPETENCIES[slug];
  if (!competencies) {
    throw new Error(`missing competencies for ${slug}`);
  }
  return competencies;
}

describe("earned competencies", () => {
  it("grants competencies to every certified course, and only those", () => {
    for (const course of COURSE_CATALOG) {
      expect(
        competenciesFor(course.slug).length,
        `no competencies for ${course.slug}`,
      ).toBeGreaterThan(0);
    }
    // total matches the sum of all lists
    const total = Object.values(COURSE_COMPETENCIES).reduce(
      (n, l) => n + l.length,
      0,
    );
    expect(totalCompetencyCount()).toBe(total);
  });

  it("uses unique competency ids across all courses", () => {
    const ids = Object.values(COURSE_COMPETENCIES)
      .flat()
      .map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns nothing for null or empty progress", () => {
    expect(earnedCompetencies(null)).toEqual([]);
    expect(earnedCompetencies(progressWith({}))).toEqual([]);
    expect(competencyProgress(null)).toEqual({
      earned: 0,
      total: totalCompetencyCount(),
    });
  });

  it("does not grant competencies for mere lesson progress without the record", () => {
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
    expect(earnedCompetencies(started)).toEqual([]);
  });

  it("grants records and competencies through complete canonical lesson paths", () => {
    for (const slug of [
      "data-engineering-fundamentals",
      "data-science",
    ] as const) {
      const completed = progressWith({
        [slug]: slice({
          lessons: Object.fromEntries(
            CANONICAL_LESSON_IDS[slug].map((lessonId) => [
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
        }),
      });
      expect(isCourseRecordEarned(completed, slug)).toBe(true);
      expect(earnedCompetencies(completed)).toHaveLength(
        competenciesFor(slug).length,
      );
    }
  });

  it("grants a course's competencies after all lessons and its workshop quiz", () => {
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
    const earned = earnedCompetencies(passed);
    expect(earned.map((c) => c.id)).toEqual(
      competenciesFor("eu-ai-act-kurs").map((c) => c.id),
    );
    expect(earned.every((c) => c.courseSlug === "eu-ai-act-kurs")).toBe(true);
    expect(earned[0].courseTitle).toBe("EU AI Act Kurs");
  });

  it("grants AI-Native competencies after all lessons via the capstone path", () => {
    const capstone = progressWith({
      "ai-native": slice({
        lessons: completedLessons("ai-native"),
        capstoneSubmitted: true,
      }),
    });
    expect(isCourseRecordEarned(capstone, "ai-native")).toBe(true);
    expect(earnedCompetencies(capstone)).toHaveLength(
      competenciesFor("ai-native").length,
    );
  });

  it("accumulates competencies across multiple completed courses, in course order", () => {
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
    const earned = earnedCompetencies(both);
    const expected =
      competenciesFor("ki-fuehrerschein").length +
      competenciesFor("ai-native").length;
    expect(earned).toHaveLength(expected);
    // ki-fuehrerschein (catalog step 1) comes before ai-native (step 4)
    expect(earned[0].courseSlug).toBe("ki-fuehrerschein");
    expect(earned.at(-1)?.courseSlug).toBe("ai-native");
    expect(competencyProgress(both)).toEqual({
      earned: expected,
      total: totalCompetencyCount(),
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

    const english = earnedCompetencies(state, "en");
    const german = earnedCompetencies(state, "de");

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
});
