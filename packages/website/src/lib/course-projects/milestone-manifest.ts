import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { COURSE_PROJECT_STAGE_IDS, type CourseProjectStageId } from "./types";

export interface CourseProjectMilestone {
  readonly stageId: CourseProjectStageId;
  readonly stageIndex: number;
}

export type CourseProjectMilestoneManifest = Readonly<
  Record<CourseSlug, Readonly<Record<CourseProjectStageId, readonly string[]>>>
>;

function authoredUnits(
  courseSlug: CourseSlug,
  prefixes: readonly string[],
): readonly string[] {
  return CANONICAL_LESSON_IDS[courseSlug].filter((lessonId) =>
    prefixes.some((prefix) => lessonId.startsWith(prefix)),
  );
}

function defineCourseMilestones(
  courseSlug: CourseSlug,
  assignments: Readonly<Record<CourseProjectStageId, readonly string[]>>,
): Readonly<Record<CourseProjectStageId, readonly string[]>> {
  const canonicalLessonIds = CANONICAL_LESSON_IDS[courseSlug];
  const canonical = new Set(canonicalLessonIds);
  const assigned = COURSE_PROJECT_STAGE_IDS.flatMap(
    (stageId) => assignments[stageId],
  );
  const assignedSet = new Set(assigned);

  if (
    COURSE_PROJECT_STAGE_IDS.some(
      (stageId) => assignments[stageId].length === 0,
    ) ||
    assignedSet.size !== assigned.length ||
    assigned.some((lessonId) => !canonical.has(lessonId)) ||
    canonicalLessonIds.some((lessonId) => !assignedSet.has(lessonId))
  ) {
    throw new Error(
      `Invalid course-project milestone manifest for ${courseSlug}`,
    );
  }

  const stageIndexByLesson = new Map(
    COURSE_PROJECT_STAGE_IDS.flatMap((stageId, stageIndex) =>
      assignments[stageId].map((lessonId) => [lessonId, stageIndex] as const),
    ),
  );
  let priorStageIndex = -1;
  for (const lessonId of canonicalLessonIds) {
    const stageIndex = stageIndexByLesson.get(lessonId);
    if (stageIndex === undefined || stageIndex < priorStageIndex) {
      throw new Error(
        `Non-monotone course-project milestone manifest for ${courseSlug}`,
      );
    }
    priorStageIndex = stageIndex;
  }

  return Object.freeze(
    Object.fromEntries(
      COURSE_PROJECT_STAGE_IDS.map((stageId) => [
        stageId,
        Object.freeze([...assignments[stageId]]),
      ]),
    ),
  ) as Readonly<Record<CourseProjectStageId, readonly string[]>>;
}

/**
 * Explicit curriculum milestones. Block/module prefixes keep new lessons in an
 * authored unit stable; flat curricula list semantic milestones directly.
 * The constructor rejects gaps, duplicates, unknown lessons, empty stages, and
 * backward stage movement.
 */
export const COURSE_PROJECT_MILESTONE_MANIFEST: CourseProjectMilestoneManifest =
  Object.freeze({
    "ki-fuehrerschein": defineCourseMilestones("ki-fuehrerschein", {
      ground: authoredUnits("ki-fuehrerschein", ["block_1_lesson_"]),
      build: authoredUnits("ki-fuehrerschein", ["block_2_lesson_"]),
      run: authoredUnits("ki-fuehrerschein", ["block_3_lesson_"]),
      verify: authoredUnits("ki-fuehrerschein", ["block_4_lesson_"]),
      transfer: authoredUnits("ki-fuehrerschein", ["block_5_lesson_"]),
    }),
    "eu-ai-act-kurs": defineCourseMilestones("eu-ai-act-kurs", {
      ground: authoredUnits("eu-ai-act-kurs", ["block_1_lesson_"]),
      build: authoredUnits("eu-ai-act-kurs", ["block_2_lesson_"]),
      run: authoredUnits("eu-ai-act-kurs", ["block_3_lesson_"]),
      verify: authoredUnits("eu-ai-act-kurs", [
        "block_4_lesson_",
        "block_5_lesson_",
      ]),
      transfer: authoredUnits("eu-ai-act-kurs", ["block_6_lesson_"]),
    }),
    "ai-native": defineCourseMilestones("ai-native", {
      ground: authoredUnits("ai-native", ["modul_1_lesson_"]),
      build: authoredUnits("ai-native", ["modul_2_lesson_"]),
      run: authoredUnits("ai-native", ["modul_3_lesson_"]),
      verify: [
        "modul_4_lesson_1",
        "modul_4_lesson_2",
        "modul_4_lesson_3",
        "modul_4_lesson_4",
        "modul_4_lesson_5",
        "modul_4_lesson_6",
      ],
      transfer: ["modul_4_lesson_7", "modul_4_lesson_8"],
    }),
    "ki-und-gesellschaft": defineCourseMilestones("ki-und-gesellschaft", {
      ground: authoredUnits("ki-und-gesellschaft", ["arbeit-"]),
      build: ["deepfake-2-1", "deepfake-2-2"],
      run: ["deepfake-2-3"],
      verify: ["ethik-3-1", "ethik-3-2"],
      transfer: ["ethik-3-3"],
    }),
    "data-engineering-fundamentals": defineCourseMilestones(
      "data-engineering-fundamentals",
      {
        ground: ["home", "fund"],
        build: ["ingest", "stream", "store", "comp"],
        run: ["orch", "qual"],
        verify: ["disc", "serve", "gov"],
        transfer: ["cap"],
      },
    ),
    "data-science": defineCourseMilestones("data-science", {
      ground: ["fund", "explore", "clean"],
      build: ["feature", "model"],
      run: ["eval", "interp", "exp"],
      verify: ["causal", "peek"],
      transfer: ["deploy", "cap"],
    }),
    "data-infrastructure": defineCourseMilestones("data-infrastructure", {
      ground: ["mental-model", "cap-pacelc", "modeling"],
      build: ["storage-formats", "lakehouse", "partitioning"],
      run: ["batch-elt", "streaming", "cdc-lambda-kappa"],
      verify: ["idempotency", "sla-quality"],
      transfer: ["interview-playbook"],
    }),
    codex: defineCourseMilestones("codex", {
      ground: ["L01", "L02", "L03"],
      build: ["L04", "L05", "L06"],
      run: ["L07", "L08", "L09"],
      verify: ["L10", "L11"],
      transfer: ["L12"],
    }),
    claude: defineCourseMilestones("claude", {
      ground: ["mental-model", "anatomy", "context"],
      build: ["claude-md", "iteration", "gdocs"],
      run: ["agents", "reviews", "grounding"],
      verify: ["team", "evals"],
      transfer: ["safety"],
    }),
    "ai-native-operator": defineCourseMilestones("ai-native-operator", {
      ground: authoredUnits("ai-native-operator", ["mindset/"]),
      build: authoredUnits("ai-native-operator", ["engineering/", "product/"]),
      run: authoredUnits("ai-native-operator", ["operations/"]),
      verify: authoredUnits("ai-native-operator", [
        "talent/",
        "orgmodel/",
        "data/",
        "governance/",
      ]),
      transfer: authoredUnits("ai-native-operator", ["measurement/"]),
    }),
  });

const MILESTONE_BY_LESSON: ReadonlyMap<
  CourseSlug,
  ReadonlyMap<string, CourseProjectMilestone>
> = new Map(
  COURSE_SLUGS.map((courseSlug) => [
    courseSlug,
    new Map(
      COURSE_PROJECT_STAGE_IDS.flatMap((stageId, stageIndex) =>
        COURSE_PROJECT_MILESTONE_MANIFEST[courseSlug][stageId].map(
          (lessonId) =>
            [lessonId, Object.freeze({ stageId, stageIndex })] as const,
        ),
      ),
    ),
  ]),
);

/** Unknown/non-canonical lessons return null so UI callers can fail closed. */
export function resolveCourseProjectMilestone(
  courseSlug: CourseSlug,
  lessonId: string,
): CourseProjectMilestone | null {
  return MILESTONE_BY_LESSON.get(courseSlug)?.get(lessonId) ?? null;
}
