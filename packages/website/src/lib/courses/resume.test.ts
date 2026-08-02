import { describe, expect, it } from "vitest";
import type { BlockId, CourseSlug } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";
import { getBlock } from "@/lib/course/data";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import type {
  UnifiedCourseSlice,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "@/lib/progress/types";
import { generateStaticParams as kiFuehrerscheinBlockParams } from "@/app/ki-fuehrerschein/kurs/[blockId]/page";
import { generateStaticParams as gesellschaftBlockParams } from "@/app/ki-und-gesellschaft/kurs/[blockId]/page";
import { generateStaticParams as euAiActBlockParams } from "@/app/eu-ai-act-kurs/kurs/[blockId]/page";
import { generateStaticParams as aiNativeLessonParams } from "@/app/ai-native/kurs/[moduleId]/[lessonId]/page";
import { generateStaticParams as claudeLessonParams } from "@/app/kurse/open-source/claude/kurs/[lessonId]/page";
import { generateStaticParams as codexLessonParams } from "@/app/kurse/open-source/codex/kurs/[lessonId]/page";
import { generateStaticParams as dataInfrastructureLessonParams } from "@/app/kurse/open-source/data-infrastructure/kurs/[lessonId]/page";
import { generateStaticParams as dataEngineeringChapterParams } from "@/app/kurse/open-source/data-engineering-fundamentals/[chapterId]/page";
import { generateStaticParams as dataScienceChapterParams } from "@/app/kurse/open-source/data-science/[chapterSlug]/page";
import { generateStaticParams as operatorLessonParams } from "@/app/kurse/open-source/ai-native-operator/[moduleId]/[lessonNum]/page";
import {
  courseLessonHref,
  hasCourseStarted,
  resolveCourseResumeHref,
} from "./resume";

const COMPLETED_LESSON: UnifiedLessonProgress = {
  sectionsRead: [],
  quizScore: null,
  quizTotal: null,
  completed: true,
  exercisesCompleted: {},
};

function progress(
  slug: CourseSlug,
  completedCount: number,
  assessmentPassed = false,
): UnifiedProgress {
  const slice: UnifiedCourseSlice = {
    lessons: Object.fromEntries(
      CANONICAL_LESSON_IDS[slug]
        .slice(0, completedCount)
        .map((lessonId) => [lessonId, COMPLETED_LESSON]),
    ),
    workshopQuiz: {
      passed: assessmentPassed,
      score: assessmentPassed ? 0.9 : 0,
      completedAt: assessmentPassed
        ? "2026-07-29T12:00:00.000Z"
        : null,
    },
    capstoneSubmitted: false,
    startedAt: "2026-07-29T10:00:00.000Z",
    lastActivity: "2026-07-29T12:00:00.000Z",
  };
  return {
    schemaVersion: 3,
    courses: { [slug]: slice },
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-07-29T12:00:00.000Z",
  };
}

describe("course resume routes", () => {
  it("maps every canonical lesson to an exact route emitted by its route module", async () => {
    const expected = new Map<string, string>();
    const register = (slug: CourseSlug, lessonId: string, href: string) => {
      const key = `${slug}:${lessonId}`;
      expect(expected.has(key), `duplicate route registry key ${key}`).toBe(false);
      expected.set(key, href);
    };

    for (const [slug, params] of [
      ["ki-fuehrerschein", kiFuehrerscheinBlockParams()],
      ["ki-und-gesellschaft", gesellschaftBlockParams()],
      ["eu-ai-act-kurs", euAiActBlockParams()],
    ] as const) {
      const config = getCourseConfig(slug);
      for (const { blockId } of params) {
        const block = getBlock(slug, blockId as BlockId);
        expect(block, `${slug}:${blockId}`).toBeDefined();
        for (const lesson of block?.lessons ?? []) {
          register(
            slug,
            lesson.id,
            `${config.coursePath}/${blockId}#lesson=${encodeURIComponent(lesson.id)}`,
          );
        }
      }
    }

    for (const { moduleId, lessonId } of await aiNativeLessonParams()) {
      register(
        "ai-native",
        lessonId,
        `/ai-native/kurs/${moduleId}/${lessonId}`,
      );
    }
    for (const { lessonId } of claudeLessonParams()) {
      register(
        "claude",
        lessonId,
        `/kurse/open-source/claude/kurs/${lessonId}`,
      );
    }
    for (const { lessonId } of codexLessonParams()) {
      register(
        "codex",
        lessonId,
        `/kurse/open-source/codex/kurs/${lessonId}`,
      );
    }
    for (const { lessonId } of dataInfrastructureLessonParams()) {
      register(
        "data-infrastructure",
        lessonId,
        `/kurse/open-source/data-infrastructure/kurs/${lessonId}`,
      );
    }
    for (const { chapterId } of dataEngineeringChapterParams()) {
      register(
        "data-engineering-fundamentals",
        chapterId,
        `/kurse/open-source/data-engineering-fundamentals/${chapterId}`,
      );
    }
    for (const { chapterSlug } of dataScienceChapterParams()) {
      register(
        "data-science",
        chapterSlug,
        `/kurse/open-source/data-science/${chapterSlug}`,
      );
    }
    for (const { moduleId, lessonNum } of await operatorLessonParams()) {
      register(
        "ai-native-operator",
        `${moduleId}/${lessonNum}`,
        `/kurse/open-source/ai-native-operator/${moduleId}/${lessonNum}`,
      );
    }

    const canonicalKeys = Object.entries(CANONICAL_LESSON_IDS).flatMap(
      ([slug, lessonIds]) =>
        lessonIds.map((lessonId) => `${slug}:${lessonId}`),
    );
    expect([...expected.keys()].sort()).toEqual([...canonicalKeys].sort());

    for (const key of canonicalKeys) {
      const separator = key.indexOf(":");
      const slug = key.slice(0, separator) as CourseSlug;
      const lessonId = key.slice(separator + 1);
      expect(courseLessonHref(slug, lessonId), key).toBe(expected.get(key));
    }
  });

  it("deep-links block readers to the first incomplete lesson", () => {
    expect(
      resolveCourseResumeHref(progress("ki-fuehrerschein", 1), "ki-fuehrerschein"),
    ).toBe(
      "/ki-fuehrerschein/kurs/block_1#lesson=block_1_lesson_2",
    );
    expect(
      resolveCourseResumeHref(
        progress("ki-und-gesellschaft", 3),
        "ki-und-gesellschaft",
      ),
    ).toBe(
      "/ki-und-gesellschaft/kurs/block_2#lesson=deepfake-2-1",
    );
  });

  it("routes one-page lessons and chapters directly", () => {
    expect(resolveCourseResumeHref(progress("codex", 1), "codex")).toBe(
      "/kurse/open-source/codex/kurs/L02",
    );
    expect(
      resolveCourseResumeHref(progress("data-science", 1), "data-science"),
    ).toBe("/kurse/open-source/data-science/explore");
    expect(
      resolveCourseResumeHref(
        progress("ai-native-operator", 1),
        "ai-native-operator",
      ),
    ).toBe("/kurse/open-source/ai-native-operator/mindset/2");
  });

  it("routes completed lesson sets to their assessment or record", () => {
    expect(
      resolveCourseResumeHref(
        progress(
          "ki-fuehrerschein",
          CANONICAL_LESSON_IDS["ki-fuehrerschein"].length,
        ),
        "ki-fuehrerschein",
      ),
    ).toBe("/ki-fuehrerschein/kurs/quiz");
    expect(
      resolveCourseResumeHref(
        progress(
          "ki-fuehrerschein",
          CANONICAL_LESSON_IDS["ki-fuehrerschein"].length,
          true,
        ),
        "ki-fuehrerschein",
      ),
    ).toBe("/ki-fuehrerschein/kurs/zertifikat");
    expect(
      resolveCourseResumeHref(
        progress("codex", CANONICAL_LESSON_IDS.codex.length),
        "codex",
      ),
    ).toBe("/kurse/open-source/codex/kurs/zertifikat");
  });

  it("recognizes partial lesson state even before a lesson is completed", () => {
    const state = progress("claude", 0);
    state.courses.claude!.lessons["mental-model"] = {
      ...COMPLETED_LESSON,
      completed: false,
      sectionsRead: ["what-it-is"],
    };
    expect(hasCourseStarted(state, "claude")).toBe(true);
    expect(resolveCourseResumeHref(state, "claude")).toBe(
      "/kurse/open-source/claude/kurs/mental-model",
    );
    expect(hasCourseStarted(null, "claude")).toBe(false);
  });
});
