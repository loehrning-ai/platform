import { describe, expect, it } from "vitest";
import { COURSE_CATALOG } from "./catalog";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
  completedCanonicalLessonCount,
  evidenceBackedCompletedCanonicalLessonCount,
  getCanonicalSectionIds,
  isCanonicalLessonId,
  isCanonicalSectionId,
  isCourseCompletionEarned,
  isLessonCompletionEvidenceBacked,
  lessonCompletionEvidenceCheckpointId,
  normalizeCanonicalProgress,
  OPERATOR_TRANSFER_CHECKPOINT_ID,
  operatorLessonEvidenceCheckpointIds,
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
import {
  checkpointKey,
  legacyCompletionEvidenceCheckpointKey,
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

function addCurrentLessonEvidence(
  progress: UnifiedProgress,
  slug: CourseSlug,
  lessonIds: readonly string[],
): UnifiedProgress {
  const slice = progress.courses[slug]!;
  const lessons = Object.fromEntries(
    Object.entries(slice.lessons).map(([lessonId, lesson]) => [
      lessonId,
      lessonIds.includes(lessonId)
        ? {
            ...lesson,
            sectionsRead: CANONICAL_SECTION_IDS[slug][lessonId] ?? [],
            quizScore:
              slug === "claude" ||
              slug === "codex" ||
              slug === "data-infrastructure" ||
              slug === "data-engineering-fundamentals" ||
              slug === "data-science" ||
              (slug === "ai-native" && lessonId === "modul_3_lesson_0")
                ? null
                : 1,
            quizTotal:
              slug === "claude" ||
              slug === "codex" ||
              slug === "data-infrastructure" ||
              slug === "data-engineering-fundamentals" ||
              slug === "data-science" ||
              (slug === "ai-native" && lessonId === "modul_3_lesson_0")
                ? null
                : 1,
          }
        : lesson,
    ]),
  );
  return {
    ...progress,
    courses: { ...progress.courses, [slug]: { ...slice, lessons } },
    checkpoints: {
      ...progress.checkpoints,
      ...Object.fromEntries(
        lessonIds.map((lessonId) => [
          checkpointKey(lessonId, lessonCompletionEvidenceCheckpointId(slug)),
          true,
        ]),
      ),
    },
  };
}

function withCurrentLessonEvidence(
  slug: CourseSlug,
  lessonIds: readonly string[],
): UnifiedProgress {
  return addCurrentLessonEvidence(
    withLessons(slug, lessonIds),
    slug,
    lessonIds,
  );
}

function withLegacyCompletionEvidence(
  slug: CourseSlug,
  lessonIds: readonly string[],
): UnifiedProgress {
  const progress = withLessons(slug, lessonIds);
  return {
    ...progress,
    checkpoints: {
      ...progress.checkpoints,
      ...Object.fromEntries(
        lessonIds.map((lessonId) => [
          legacyCompletionEvidenceCheckpointKey(slug, lessonId),
          true,
        ]),
      ),
    },
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
        expect(
          getCanonicalSectionIds(slug, lesson.id),
          `${slug}/${lesson.id}`,
        ).toEqual(authored);
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
    const progress = withCurrentLessonEvidence(
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
    const progress = withCurrentLessonEvidence(
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
    const progress = withCurrentLessonEvidence(
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
    const progress = withCurrentLessonEvidence(
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

  it("does not present an unmarked post-cutover completion bit as evidence", () => {
    const lessonId = CANONICAL_LESSON_IDS["ki-fuehrerschein"][0];
    const progress = withLessons("ki-fuehrerschein", [lessonId]);

    expect(
      progress.courses["ki-fuehrerschein"]!.lessons[lessonId].completed,
    ).toBe(true);
    expect(
      isLessonCompletionEvidenceBacked(progress, "ki-fuehrerschein", lessonId),
    ).toBe(false);
    expect(
      evidenceBackedCompletedCanonicalLessonCount(progress, "ki-fuehrerschein"),
    ).toBe(0);
    expect(completedCanonicalLessonCount(progress, "ki-fuehrerschein")).toBe(0);
  });

  it("rejects unmarked completion bits for every migrated technical reader", () => {
    const cases = [
      ["claude", CANONICAL_LESSON_IDS.claude[0]],
      ["codex", CANONICAL_LESSON_IDS.codex[0]],
      ["data-infrastructure", CANONICAL_LESSON_IDS["data-infrastructure"][0]],
      ["ai-native-operator", "mindset/1"],
    ] as const;

    for (const [slug, lessonId] of cases) {
      const legacy = withLessons(slug, [lessonId]);
      expect(
        isLessonCompletionEvidenceBacked(legacy, slug, lessonId),
        `${slug}/${lessonId}`,
      ).toBe(false);
      expect(completedCanonicalLessonCount(legacy, slug), slug).toBe(0);
    }
  });

  it("preserves migration-marked historical completion for every course", () => {
    for (const slug of Object.keys(CANONICAL_LESSON_IDS) as CourseSlug[]) {
      const lessonId = CANONICAL_LESSON_IDS[slug][0];
      const legacy = withLegacyCompletionEvidence(slug, [lessonId]);

      expect(
        isLessonCompletionEvidenceBacked(legacy, slug, lessonId),
        `${slug}/${lessonId}`,
      ).toBe(true);
      expect(completedCanonicalLessonCount(legacy, slug), slug).toBe(1);
    }
  });

  it("preserves historical certificate eligibility without weakening new proof", () => {
    const slug = "data-engineering-fundamentals" as const;
    const legacy = withLegacyCompletionEvidence(
      slug,
      CANONICAL_LESSON_IDS[slug],
    );

    expect(isCourseCompletionEarned(legacy, slug)).toBe(true);
  });

  it("suppresses grow-only historical markers after a course reset", () => {
    const slug = "data-science" as const;
    const lessonId = CANONICAL_LESSON_IDS[slug][0];
    const legacy = withLegacyCompletionEvidence(slug, [lessonId]);
    legacy.courses[slug] = {
      ...legacy.courses[slug]!,
      resetAt: "2026-08-26T00:00:00.000Z",
    };

    expect(isLessonCompletionEvidenceBacked(legacy, slug, lessonId)).toBe(
      false,
    );
    expect(completedCanonicalLessonCount(legacy, slug)).toBe(0);
  });

  it("accepts section plus transfer proof for Claude, Codex, and Data Infrastructure", () => {
    for (const slug of ["claude", "codex", "data-infrastructure"] as const) {
      const lessonId = CANONICAL_LESSON_IDS[slug][0];
      const progress = withCurrentLessonEvidence(slug, [lessonId]);
      expect(
        isLessonCompletionEvidenceBacked(progress, slug, lessonId),
        `${slug}/${lessonId}`,
      ).toBe(true);
    }
  });

  it("requires every Operator quiz checkpoint in addition to the transfer proof", async () => {
    const lessonId = "mindset/5";
    const progress = withCurrentLessonEvidence("ai-native-operator", [
      lessonId,
    ]);
    const lesson = (await getAllOperatorLessons()).find(
      (candidate) => candidate.id === lessonId,
    );
    expect(lesson?.quiz.length).toBeGreaterThan(0);
    expect(
      isLessonCompletionEvidenceBacked(
        progress,
        "ai-native-operator",
        lessonId,
      ),
    ).toBe(false);

    const withQuizEvidence: UnifiedProgress = {
      ...progress,
      checkpoints: {
        ...progress.checkpoints,
        ...Object.fromEntries(
          (lesson?.quiz ?? []).map((question) => [
            checkpointKey(lessonId, question.id),
            true,
          ]),
        ),
      },
    };
    expect(
      isLessonCompletionEvidenceBacked(
        withQuizEvidence,
        "ai-native-operator",
        lessonId,
      ),
    ).toBe(true);
  });

  it("keeps every Operator evidence checkpoint aligned with authored interactions", async () => {
    for (const lesson of await getAllOperatorLessons()) {
      const required = operatorLessonEvidenceCheckpointIds(lesson.id);
      if (lesson.kind === "quiz") {
        expect(required, lesson.id).toEqual(
          lesson.quiz.map((question) => question.id),
        );
      } else {
        expect(required, lesson.id).toEqual([OPERATOR_TRANSFER_CHECKPOINT_ID]);
        expect(
          (lesson.widgets?.[0]?.props as { cpId?: string } | undefined)?.cpId,
          lesson.id,
        ).toBe(OPERATOR_TRANSFER_CHECKPOINT_ID);
      }
    }
  });

  it("requires the Operator reading lesson's applied transfer exercise", () => {
    const lessonId = "mindset/1";
    const progress = withCurrentLessonEvidence("ai-native-operator", [
      lessonId,
    ]);
    expect(
      isLessonCompletionEvidenceBacked(
        progress,
        "ai-native-operator",
        lessonId,
      ),
    ).toBe(false);

    const withTransferExercise: UnifiedProgress = {
      ...progress,
      checkpoints: {
        ...progress.checkpoints,
        [checkpointKey(lessonId, OPERATOR_TRANSFER_CHECKPOINT_ID)]: true,
      },
    };
    expect(
      isLessonCompletionEvidenceBacked(
        withTransferExercise,
        "ai-native-operator",
        lessonId,
      ),
    ).toBe(true);
  });

  it("accepts the versioned checkpoint as transfer proof for zero-quiz evidence lessons", () => {
    const aiNativeLessonId = "modul_3_lesson_0";
    const dataLessonId = CANONICAL_LESSON_IDS["data-science"][0];
    const aiNative = withCurrentLessonEvidence("ai-native", [aiNativeLessonId]);
    const dataScience = withCurrentLessonEvidence("data-science", [
      dataLessonId,
    ]);

    expect(
      isLessonCompletionEvidenceBacked(aiNative, "ai-native", aiNativeLessonId),
    ).toBe(true);
    expect(
      isLessonCompletionEvidenceBacked(
        dataScience,
        "data-science",
        dataLessonId,
      ),
    ).toBe(true);
  });
});
