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
import type {
  UnifiedCourseSlice,
  UnifiedProgress,
} from "@/lib/progress/types";
import type { CourseSlug } from "@/lib/course/types";

/**
 * competencies.test.ts — pins the honest "earned skills" contract:
 *   • every certified course grants competencies (nothing else does),
 *   • a competency is earned ONLY when the record bar is met,
 *   • the selectors are pure and null-safe.
 */

function slice(overrides: Partial<UnifiedCourseSlice> = {}): UnifiedCourseSlice {
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

describe("earned competencies", () => {
  it("grants competencies to every certified course, and only those", () => {
    for (const course of COURSE_CATALOG) {
      expect(
        COURSE_COMPETENCIES[course.slug].length,
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
        lessons: { l1: { sectionsRead: ["s1"], quizScore: null, quizTotal: null, completed: true, exercisesCompleted: {} } },
      }),
    });
    expect(isCourseRecordEarned(started, "ki-fuehrerschein")).toBe(false);
    expect(earnedCompetencies(started)).toEqual([]);
  });

  it("grants a course's competencies once its workshop quiz passes", () => {
    const passed = progressWith({
      "eu-ai-act-kurs": slice({
        workshopQuiz: { passed: true, score: 0.9, completedAt: "2026-01-02T00:00:00.000Z" },
      }),
    });
    expect(isCourseRecordEarned(passed, "eu-ai-act-kurs")).toBe(true);
    const earned = earnedCompetencies(passed);
    expect(earned.map((c) => c.id)).toEqual(
      COURSE_COMPETENCIES["eu-ai-act-kurs"].map((c) => c.id),
    );
    expect(earned.every((c) => c.courseSlug === "eu-ai-act-kurs")).toBe(true);
    expect(earned[0].courseTitle).toBe("EU AI Act Kurs");
  });

  it("grants AI-Native competencies via the capstone path", () => {
    const capstone = progressWith({
      "ai-native": slice({ capstoneSubmitted: true }),
    });
    expect(isCourseRecordEarned(capstone, "ai-native")).toBe(true);
    expect(earnedCompetencies(capstone)).toHaveLength(
      COURSE_COMPETENCIES["ai-native"].length,
    );
  });

  it("accumulates competencies across multiple completed courses, in course order", () => {
    const both = progressWith({
      "ki-fuehrerschein": slice({
        workshopQuiz: { passed: true, score: 0.8, completedAt: "x" },
      }),
      "ai-native": slice({ capstoneSubmitted: true }),
    });
    const earned = earnedCompetencies(both);
    const expected =
      COURSE_COMPETENCIES["ki-fuehrerschein"].length +
      COURSE_COMPETENCIES["ai-native"].length;
    expect(earned).toHaveLength(expected);
    // ki-fuehrerschein (catalog step 1) comes before ai-native (step 4)
    expect(earned[0].courseSlug).toBe("ki-fuehrerschein");
    expect(earned.at(-1)?.courseSlug).toBe("ai-native");
    expect(competencyProgress(both)).toEqual({
      earned: expected,
      total: totalCompetencyCount(),
    });
  });
});
