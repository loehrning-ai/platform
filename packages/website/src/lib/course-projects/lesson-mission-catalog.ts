import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { COURSE_PROJECT_STAGE_IDS, type CourseProjectStageId } from "./types";
import { resolveCourseProjectMilestone } from "./milestone-manifest";

export type LessonMissionId = `${CourseSlug}:${string}:v1`;

export interface LessonMissionDefinition {
  readonly id: LessonMissionId;
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  readonly stageId: CourseProjectStageId;
  /** Stable, one-based scenario selector for lesson-specific mission content. */
  readonly scenarioSeed: number;
  /** Stable skill family. Authored skill templates can bind to this identifier. */
  readonly skillId: `${CourseSlug}:${CourseProjectStageId}`;
}

function missionId(courseSlug: CourseSlug, lessonId: string): LessonMissionId {
  return `${courseSlug}:${lessonId}:v1`;
}

const definitions = COURSE_SLUGS.flatMap((courseSlug) =>
  CANONICAL_LESSON_IDS[courseSlug].map((lessonId, lessonIndex) => {
    const milestone = resolveCourseProjectMilestone(courseSlug, lessonId);
    if (!milestone) {
      throw new Error(
        `Canonical lesson has no project stage: ${courseSlug}/${lessonId}`,
      );
    }
    return {
      id: missionId(courseSlug, lessonId),
      courseSlug,
      lessonId,
      stageId: milestone.stageId,
      scenarioSeed: lessonIndex + 1,
      skillId: `${courseSlug}:${milestone.stageId}`,
    } satisfies LessonMissionDefinition;
  }),
);

export const LESSON_MISSION_CATALOG: Readonly<
  Record<LessonMissionId, LessonMissionDefinition>
> = Object.freeze(
  Object.fromEntries(
    definitions.map((definition) => [definition.id, definition]),
  ),
) as Readonly<Record<LessonMissionId, LessonMissionDefinition>>;

const COURSE_MISSIONS: Readonly<
  Record<CourseSlug, readonly LessonMissionDefinition[]>
> = Object.freeze(
  Object.fromEntries(
    COURSE_SLUGS.map((courseSlug) => [
      courseSlug,
      Object.freeze(
        definitions.filter(
          (definition) => definition.courseSlug === courseSlug,
        ),
      ),
    ]),
  ),
) as Readonly<Record<CourseSlug, readonly LessonMissionDefinition[]>>;

export function getLessonMissionDefinition(
  courseSlug: CourseSlug,
  lessonId: string,
): LessonMissionDefinition {
  const definition = LESSON_MISSION_CATALOG[missionId(courseSlug, lessonId)];
  if (
    !definition ||
    definition.courseSlug !== courseSlug ||
    definition.lessonId !== lessonId
  ) {
    throw new Error(
      `Unknown canonical lesson mission: ${courseSlug}/${lessonId}`,
    );
  }
  return definition;
}

export function getCourseLessonMissions(
  courseSlug: CourseSlug,
): readonly LessonMissionDefinition[] {
  return COURSE_MISSIONS[courseSlug];
}

export function normalizeCompletedLessonMissionIds(
  courseSlug: CourseSlug,
  value: unknown,
): readonly LessonMissionId[] {
  if (!Array.isArray(value)) return [];
  const courseMissions = COURSE_MISSIONS[courseSlug];
  if (value.length > courseMissions.length) return [];
  const requested = new Set(value);
  if (
    requested.size !== value.length ||
    value.some(
      (entry) =>
        typeof entry !== "string" ||
        LESSON_MISSION_CATALOG[entry as LessonMissionId]?.courseSlug !==
          courseSlug,
    )
  ) {
    return [];
  }
  return courseMissions
    .filter((definition) => requested.has(definition.id))
    .map((definition) => definition.id);
}

export function deriveCompletedCourseProjectStages(
  courseSlug: CourseSlug,
  completedMissionIds: readonly LessonMissionId[],
): readonly CourseProjectStageId[] {
  const completed = new Set(
    normalizeCompletedLessonMissionIds(courseSlug, completedMissionIds),
  );
  const courseMissions = COURSE_MISSIONS[courseSlug];
  const completedStages: CourseProjectStageId[] = [];

  for (const stageId of COURSE_PROJECT_STAGE_IDS) {
    const requiredMissions = courseMissions.filter(
      (definition) => definition.stageId === stageId,
    );
    if (
      requiredMissions.length === 0 ||
      requiredMissions.some((definition) => !completed.has(definition.id))
    ) {
      break;
    }
    completedStages.push(stageId);
  }
  return completedStages;
}

export function hasCompletedAllCourseProjectStages(
  courseSlug: CourseSlug,
  completedMissionIds: readonly LessonMissionId[],
): boolean {
  return (
    deriveCompletedCourseProjectStages(courseSlug, completedMissionIds)
      .length === COURSE_PROJECT_STAGE_IDS.length
  );
}
