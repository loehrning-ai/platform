import { describe, expect, it } from "vitest";
import { computeStripState } from "./lernbegleiter-strip";
import type {
  UnifiedCourseSlice,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "@/lib/progress/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import type { CourseSlug } from "@/lib/course/types";

function lesson(completed = true): UnifiedLessonProgress {
  return {
    sectionsRead: [],
    quizScore: null,
    quizTotal: null,
    completed,
    exercisesCompleted: {},
  };
}

function courseSlice(
  slug: CourseSlug,
  completedLessons: number,
  assessmentPassed = false,
): UnifiedCourseSlice {
  return {
    lessons: Object.fromEntries(
      CANONICAL_LESSON_IDS[slug]
        .slice(0, completedLessons)
        .map((lessonId) => [
        lessonId,
        lesson(),
      ]),
    ),
    workshopQuiz: {
      passed: assessmentPassed,
      score: assessmentPassed ? 0.8 : 0,
      completedAt: assessmentPassed
        ? "2026-07-28T00:00:00.000Z"
        : null,
    },
    capstoneSubmitted: false,
    startedAt: "2026-07-28T00:00:00.000Z",
    lastActivity: "2026-07-28T00:00:00.000Z",
  };
}

function progress(
  courses: UnifiedProgress["courses"] = {},
): UnifiedProgress {
  return {
    schemaVersion: 3,
    courses,
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-07-28T00:00:00.000Z",
  };
}

describe("computeStripState", () => {
  it("starts at the first canonical spine course", () => {
    expect(computeStripState(progress())).toMatchObject({
      currentCourseIndex: 0,
      completedCourseCount: 0,
      nextLabel: "Starten: KI-Führerschein",
      nextHref: "/ki-fuehrerschein/kurs",
      allComplete: false,
    });
  });

  it("does not advance after only one completed lesson", () => {
    expect(
      computeStripState(
        progress({ "ki-fuehrerschein": courseSlice("ki-fuehrerschein", 1) }),
      ),
    ).toMatchObject({
      currentCourseIndex: 0,
      completedCourseCount: 0,
      nextLabel: "Weiterlernen: KI-Führerschein",
      nextHref:
        "/ki-fuehrerschein/kurs/block_1#lesson=block_1_lesson_2",
      allComplete: false,
    });
  });

  it("resumes the first partially read lesson before any completion", () => {
    const slice = courseSlice("ki-fuehrerschein", 0);
    slice.lessons.block_1_lesson_1 = {
      ...lesson(false),
      sectionsRead: ["block_1_lesson_1_section_1"],
    };
    expect(
      computeStripState(
        progress({ "ki-fuehrerschein": slice }),
      ),
    ).toMatchObject({
      currentCourseIndex: 0,
      nextLabel: "Weiterlernen: KI-Führerschein",
      nextHref:
        "/ki-fuehrerschein/kurs/block_1#lesson=block_1_lesson_1",
    });
  });

  it("prefers a later course with partial canonical progress over an untouched first course", () => {
    const slice = courseSlice("eu-ai-act-kurs", 0);
    slice.lessons.block_1_lesson_1 = {
      ...lesson(false),
      sectionsRead: ["block_1_lesson_1_section_1"],
    };
    expect(
      computeStripState(
        progress({ "eu-ai-act-kurs": slice }),
      ),
    ).toMatchObject({
      currentCourseIndex: 2,
      nextLabel: "Weiterlernen: EU AI Act Kurs",
      nextHref:
        "/eu-ai-act-kurs/kurs/block_1#lesson=block_1_lesson_1",
    });
  });

  it("includes KI und Gesellschaft before the EU AI Act course", () => {
    expect(
      computeStripState(
        progress({
          "ki-fuehrerschein": courseSlice("ki-fuehrerschein", 18, true),
        }),
      ),
    ).toMatchObject({
      currentCourseIndex: 1,
      completedCourseCount: 1,
      nextLabel: "Starten: KI und Gesellschaft",
      nextHref: "/ki-und-gesellschaft/kurs",
    });
  });

  it("points beyond the spine only after all four courses are complete", () => {
    expect(
      computeStripState(
        progress({
          "ki-fuehrerschein": courseSlice("ki-fuehrerschein", 18, true),
          "ki-und-gesellschaft": courseSlice("ki-und-gesellschaft", 9, true),
          "eu-ai-act-kurs": courseSlice("eu-ai-act-kurs", 24, true),
          "ai-native": courseSlice("ai-native", 27, true),
        }),
      ),
    ).toMatchObject({
      completedCourseCount: 4,
      nextHref: "/kurse#tiefer-gehen",
      allComplete: true,
    });
  });

  it("follows a KI-Check recommendation route instead of forcing course one", () => {
    expect(computeStripState(progress(), "/eu-ai-act-kurs")).toMatchObject({
      currentCourseIndex: 2,
      nextLabel: "Starten: EU AI Act Kurs",
      nextHref: "/eu-ai-act-kurs/kurs",
    });
  });

  it("ignores fabricated completion records", () => {
    const fakeSlice: UnifiedCourseSlice = {
      ...courseSlice("ki-fuehrerschein", 0),
      lessons: Object.fromEntries(
        Array.from({ length: 18 }, (_, index) => [
          `stale-${index}`,
          lesson(),
        ]),
      ),
    };
    expect(
      computeStripState(progress({ "ki-fuehrerschein": fakeSlice })),
    ).toMatchObject({
      currentCourseIndex: 0,
      completedCourseCount: 0,
      nextLabel: "Starten: KI-Führerschein",
    });
  });
});
