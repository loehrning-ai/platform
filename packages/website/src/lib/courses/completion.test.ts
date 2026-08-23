import { describe, expect, it } from "vitest";
import { COURSE_CATALOG } from "./catalog";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
  completedCanonicalLessonCount,
  getCanonicalSectionIds,
  isCanonicalLessonId,
  isCanonicalSectionId,
  isCourseCompletionEarned,
  normalizeCanonicalProgress,
} from "./completion";
import { getAllLessons as getAllSpineLessons } from "@/lib/course/data";
import { getAllLessons as getAllAiNativeLessons } from "@/lib/ai-native/data";
import { getAllLessons as getAllOperatorLessons } from "@/lib/ai-native-operator/data";
import { getAllClaudeLessons } from "@/lib/claude-course/data";
import { getAllCodexLessons } from "@/lib/codex/data";
import { getAllDataInfraLessons } from "@/lib/data-infrastructure/data";
import type { CourseSlug } from "@/lib/course/types";
import type {
  UnifiedCourseSlice,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "@/lib/progress/types";
import { getCourseProjectIdentity } from "@/lib/course-projects/identity";
import { serializeCourseProjectProgress } from "@/lib/course-projects/persistence";
import { verifiedCourseProjectArtifact } from "@/lib/course-projects/test-artifact";

const completedLesson: UnifiedLessonProgress = {
  sectionsRead: [],
  quizScore: null,
  quizTotal: null,
  completed: true,
  exercisesCompleted: {},
};

function withLessons(
  slug: CourseSlug,
  lessonIds: readonly string[],
): UnifiedProgress {
  const slice: UnifiedCourseSlice = {
    lessons: Object.fromEntries(lessonIds.map((id) => [id, completedLesson])),
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: "2026-07-28T00:00:00.000Z",
    lastActivity: "2026-07-28T00:00:00.000Z",
  };
  return {
    schemaVersion: 3,
    courses: { [slug]: slice },
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-07-28T00:00:00.000Z",
  };
}

function addCompletedProject(
  progress: UnifiedProgress,
  slug: CourseSlug,
): void {
  const identity = getCourseProjectIdentity(slug);
  const slice = progress.courses[slug]!;
  const lesson = slice.lessons[identity.progressLessonId] ?? completedLesson;
  slice.lessons[identity.progressLessonId] = {
    ...lesson,
    exercisesCompleted: {
      ...lesson.exercisesCompleted,
      [identity.id]: {
        exerciseId: identity.id,
        kind: `course-project-${identity.engineKind}`,
        completed: true,
        score: 1,
        attempts: 1,
        completedAt: "2026-08-13T10:00:00.000Z",
        skipped: false,
        summary: serializeCourseProjectProgress(
          "Verified project",
          verifiedCourseProjectArtifact(slug),
        ),
      },
    },
  };
}

describe("canonical course completion", () => {
  it("matches every catalog lesson count", () => {
    for (const course of COURSE_CATALOG) {
      expect(CANONICAL_LESSON_IDS[course.slug], course.slug).toHaveLength(
        course.totalLessons,
      );
      expect(new Set(CANONICAL_LESSON_IDS[course.slug]).size).toBe(
        course.totalLessons,
      );
    }
  });

  it("matches source content for dynamic native courses", async () => {
    for (const slug of [
      "ki-fuehrerschein",
      "ki-und-gesellschaft",
      "eu-ai-act-kurs",
    ] as const) {
      expect(CANONICAL_LESSON_IDS[slug]).toEqual(
        getAllSpineLessons(slug).map((lesson) => lesson.id),
      );
    }
    expect(CANONICAL_LESSON_IDS["ai-native"]).toEqual(
      (await getAllAiNativeLessons()).map((lesson) => lesson.id),
    );
    expect(CANONICAL_LESSON_IDS["ai-native-operator"]).toEqual(
      (await getAllOperatorLessons()).map((lesson) => lesson.id),
    );
  });

  it("matches every authored section without pulling the content graph into the client store", async () => {
    const lessonsBySlug = {
      "ki-fuehrerschein": getAllSpineLessons("ki-fuehrerschein"),
      "ki-und-gesellschaft": getAllSpineLessons("ki-und-gesellschaft"),
      "eu-ai-act-kurs": getAllSpineLessons("eu-ai-act-kurs"),
      "ai-native": await getAllAiNativeLessons(),
      claude: await getAllClaudeLessons(),
      codex: await getAllCodexLessons("en"),
      "data-infrastructure": await getAllDataInfraLessons(),
      "ai-native-operator": await getAllOperatorLessons(),
    } as const;

    for (const [slug, lessons] of Object.entries(lessonsBySlug) as [
      keyof typeof lessonsBySlug,
      (typeof lessonsBySlug)[keyof typeof lessonsBySlug],
    ][]) {
      expect(Object.keys(CANONICAL_SECTION_IDS[slug])).toEqual(
        CANONICAL_LESSON_IDS[slug],
      );
      for (const lesson of lessons) {
        const authored = lesson.sections.map((section) => section.id);
        expect(getCanonicalSectionIds(slug, lesson.id), `${slug}/${lesson.id}`).toEqual(
          authored,
        );
        expect(isCanonicalLessonId(slug, lesson.id)).toBe(true);
        for (const sectionId of authored) {
          expect(isCanonicalSectionId(slug, lesson.id, sectionId)).toBe(true);
        }
      }
    }

    for (const slug of [
      "data-engineering-fundamentals",
      "data-science",
    ] as const) {
      for (const lessonId of CANONICAL_LESSON_IDS[slug]) {
        expect(getCanonicalSectionIds(slug, lessonId)).toEqual([]);
      }
    }
  });

  it("normalizes stale lesson and section keys while preserving canonical data and the historical ledger", () => {
    const progress = withLessons("ki-fuehrerschein", [
      "block_1_lesson_1",
      "retired-lesson",
    ]);
    progress.courses["ki-fuehrerschein"] = {
      ...progress.courses["ki-fuehrerschein"]!,
      lessons: {
        ...progress.courses["ki-fuehrerschein"]!.lessons,
        block_1_lesson_1: {
          ...completedLesson,
          sectionsRead: [
            "block_1_lesson_1_section_1",
            "stale-section",
            "block_1_lesson_1_section_1",
          ],
        },
      },
    };
    const withLedger: UnifiedProgress = {
      ...progress,
      xp: 777,
      checkpoints: { "historic::checkpoint": true },
      badges: { "first-light": "2026-07-28T00:00:00.000Z" },
    };

    const normalized = normalizeCanonicalProgress(withLedger);

    expect(
      Object.keys(normalized.courses["ki-fuehrerschein"]!.lessons),
    ).toEqual(["block_1_lesson_1"]);
    expect(
      normalized.courses["ki-fuehrerschein"]!.lessons.block_1_lesson_1
        .sectionsRead,
    ).toEqual(["block_1_lesson_1_section_1"]);
    expect(normalized.xp).toBe(777);
    expect(normalized.checkpoints).toEqual({ "historic::checkpoint": true });
    expect(normalized.badges).toEqual({
      "first-light": "2026-07-28T00:00:00.000Z",
    });
  });

  it("ignores fabricated and stale lesson IDs", () => {
    const progress = withLessons("data-science", ["fake-1", "fake-2"]);
    expect(completedCanonicalLessonCount(progress, "data-science")).toBe(0);
    expect(isCourseCompletionEarned(progress, "data-science")).toBe(false);
  });

  it("earns completion when every canonical lesson is complete", () => {
    const progress = withLessons(
      "data-engineering-fundamentals",
      CANONICAL_LESSON_IDS["data-engineering-fundamentals"],
    );
    expect(
      isCourseCompletionEarned(progress, "data-engineering-fundamentals"),
    ).toBe(true);
  });

  it("does not let a passed quiz bypass canonical lessons", () => {
    const progress = withLessons("eu-ai-act-kurs", []);
    progress.courses["eu-ai-act-kurs"] = {
      ...progress.courses["eu-ai-act-kurs"]!,
      workshopQuiz: {
        passed: true,
        score: 0.9,
        completedAt: "2026-07-28T00:00:00.000Z",
      },
    };
    expect(isCourseCompletionEarned(progress, "eu-ai-act-kurs")).toBe(false);
  });

  it("requires both canonical lessons and the configured assessment", () => {
    const progress = withLessons(
      "eu-ai-act-kurs",
      CANONICAL_LESSON_IDS["eu-ai-act-kurs"],
    );
    expect(isCourseCompletionEarned(progress, "eu-ai-act-kurs")).toBe(false);
    progress.courses["eu-ai-act-kurs"] = {
      ...progress.courses["eu-ai-act-kurs"]!,
      workshopQuiz: {
        passed: true,
        score: 0.9,
        completedAt: "2026-07-28T00:00:00.000Z",
      },
    };
    expect(isCourseCompletionEarned(progress, "eu-ai-act-kurs")).toBe(true);
  });

  it("preserves the historical AI-Native capstone certificate path", () => {
    const progress = withLessons(
      "ai-native",
      CANONICAL_LESSON_IDS["ai-native"],
    );
    progress.courses["ai-native"] = {
      ...progress.courses["ai-native"]!,
      capstoneSubmitted: true,
    };

    expect(isCourseCompletionEarned(progress, "ai-native")).toBe(true);
  });

  it("records the exact AI-Native project without treating unsigned client evidence as certificate proof", () => {
    const progress = withLessons(
      "ai-native",
      CANONICAL_LESSON_IDS["ai-native"],
    );
    addCompletedProject(progress, "ai-native");

    expect(progress.courses["ai-native"]!.capstoneSubmitted).toBe(false);
    expect(isCourseCompletionEarned(progress, "ai-native")).toBe(false);
  });

  it("does not let a non-AI capstone bit or applied project bypass its quiz", () => {
    const progress = withLessons("claude", CANONICAL_LESSON_IDS.claude);
    progress.courses.claude = {
      ...progress.courses.claude!,
      capstoneSubmitted: true,
    };
    addCompletedProject(progress, "claude");

    expect(isCourseCompletionEarned(progress, "claude")).toBe(false);
  });
});
