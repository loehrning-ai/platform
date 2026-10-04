import { describe, expect, it } from "vitest";
import type { BlockId, CourseSlug } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";
import { getBlock } from "@/lib/course/data";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
  isEvidenceGatedCourseSlug,
  lessonCompletionEvidenceCheckpointId,
  operatorLessonEvidenceCheckpointIds,
} from "@/lib/courses/completion";
import type {
  UnifiedCourseSlice,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "@/lib/progress/types";
import { checkpointKey } from "@/lib/progress/types";
import { generateStaticParams as kiFuehrerscheinBlockParams } from "@/app/ki-fuehrerschein/kurs/[blockId]/page";
import { generateStaticParams as gesellschaftBlockParams } from "@/app/ki-und-gesellschaft/kurs/[blockId]/page";
import { generateStaticParams as euAiActBlockParams } from "@/app/eu-ai-act-kurs/kurs/[blockId]/page";
import { generateStaticParams as aiNativeLessonParams } from "@/app/ai-native/kurs/[moduleId]/[lessonId]/page";
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
      CANONICAL_LESSON_IDS[slug].slice(0, completedCount).map((lessonId) => [
        lessonId,
        isEvidenceGatedCourseSlug(slug)
          ? {
              ...COMPLETED_LESSON,
              sectionsRead: CANONICAL_SECTION_IDS[slug][lessonId] ?? [],
              quizScore:
                slug === "data-engineering-fundamentals" ||
                slug === "data-science"
                  ? null
                  : 1,
              quizTotal:
                slug === "data-engineering-fundamentals" ||
                slug === "data-science"
                  ? null
                  : 1,
            }
          : COMPLETED_LESSON,
      ]),
    ),
    workshopQuiz: {
      passed: assessmentPassed,
      score: assessmentPassed ? 0.9 : 0,
      completedAt: assessmentPassed ? "2026-07-29T12:00:00.000Z" : null,
    },
    capstoneSubmitted: false,
    startedAt: "2026-07-29T10:00:00.000Z",
    lastActivity: "2026-07-29T12:00:00.000Z",
  };
  return {
    schemaVersion: 3,
    courses: { [slug]: slice },
    xp: 0,
    checkpoints: isEvidenceGatedCourseSlug(slug)
      ? Object.fromEntries(
          CANONICAL_LESSON_IDS[slug]
            .slice(0, completedCount)
            .flatMap((lessonId) => [
              [
                checkpointKey(
                  lessonId,
                  lessonCompletionEvidenceCheckpointId(slug),
                ),
                true,
              ],
              ...(slug === "ai-native-operator"
                ? operatorLessonEvidenceCheckpointIds(lessonId).map(
                    (checkpointId) => [
                      checkpointKey(lessonId, checkpointId),
                      true,
                    ],
                  )
                : []),
            ]),
        )
      : {},
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
      expect(expected.has(key), `duplicate route registry key ${key}`).toBe(
        false,
      );
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
      ([slug, lessonIds]) => lessonIds.map((lessonId) => `${slug}:${lessonId}`),
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
      resolveCourseResumeHref(
        progress("ki-fuehrerschein", 1),
        "ki-fuehrerschein",
      ),
    ).toBe("/ki-fuehrerschein/kurs/block_1#lesson=daten-1-2");
    expect(
      resolveCourseResumeHref(
        progress("ki-und-gesellschaft", 3),
        "ki-und-gesellschaft",
      ),
    ).toBe("/ki-und-gesellschaft/kurs/block_2#lesson=fakes-2-2");
  });

  it("routes one-page lessons and chapters directly", () => {
    expect(
      resolveCourseResumeHref(
        progress("data-infrastructure", 1),
        "data-infrastructure",
      ),
    ).toBe("/kurse/open-source/data-infrastructure/kurs/cap-pacelc");
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

  it("retains legacy navigation data without skipping its first ungated proof", () => {
    const withEvidence = progress("ki-fuehrerschein", 1);
    const legacy = { ...withEvidence, checkpoints: {} };

    expect(resolveCourseResumeHref(legacy, "ki-fuehrerschein")).toBe(
      "/ki-fuehrerschein/kurs/block_1#lesson=daten-1-1",
    );
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
        progress(
          "data-infrastructure",
          CANONICAL_LESSON_IDS["data-infrastructure"].length,
        ),
        "data-infrastructure",
      ),
    ).toBe("/kurse/open-source/data-infrastructure/kurs/zertifikat");
  });

  it("recognizes partial lesson state even before a lesson is completed", () => {
    const state = progress("data-infrastructure", 0);
    state.courses["data-infrastructure"]!.lessons["mental-model"] = {
      ...COMPLETED_LESSON,
      completed: false,
      sectionsRead: ["s1"],
    };
    expect(hasCourseStarted(state, "data-infrastructure")).toBe(true);
    expect(resolveCourseResumeHref(state, "data-infrastructure")).toBe(
      "/kurse/open-source/data-infrastructure/kurs/mental-model",
    );
    expect(hasCourseStarted(null, "data-infrastructure")).toBe(false);
  });

  it("treats capstoneSubmitted as an AI-Native legacy signal only", () => {
    const dataInfra = progress("data-infrastructure", 0);
    dataInfra.courses["data-infrastructure"] = {
      ...dataInfra.courses["data-infrastructure"]!,
      capstoneSubmitted: true,
    };
    const aiNative = progress("ai-native", 0);
    aiNative.courses["ai-native"] = {
      ...aiNative.courses["ai-native"]!,
      capstoneSubmitted: true,
    };

    expect(hasCourseStarted(dataInfra, "data-infrastructure")).toBe(false);
    expect(hasCourseStarted(aiNative, "ai-native")).toBe(true);
  });
});
