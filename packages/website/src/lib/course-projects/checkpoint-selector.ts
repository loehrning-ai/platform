import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { COURSE_PROJECT_MILESTONE_MANIFEST } from "./milestone-manifest";
import { COURSE_PROJECT_STAGE_IDS, type CourseProjectStageId } from "./types";

export interface CourseProjectCheckpoint {
  readonly stageId: CourseProjectStageId;
  readonly stageIndex: number;
  readonly lessonId: string;
}

const COURSE_PROJECT_CHECKPOINTS: Readonly<
  Record<CourseSlug, readonly CourseProjectCheckpoint[]>
> = Object.freeze(
  Object.fromEntries(
    COURSE_SLUGS.map((courseSlug) => [
      courseSlug,
      Object.freeze(
        COURSE_PROJECT_STAGE_IDS.map((stageId, stageIndex) => {
          const lessonId =
            COURSE_PROJECT_MILESTONE_MANIFEST[courseSlug][stageId][0];
          if (!lessonId) {
            throw new Error(
              `Missing course-project checkpoint: ${courseSlug}/${stageId}`,
            );
          }
          return Object.freeze({ stageId, stageIndex, lessonId });
        }),
      ),
    ]),
  ),
) as Readonly<Record<CourseSlug, readonly CourseProjectCheckpoint[]>>;

const CHECKPOINT_BY_LESSON: Readonly<
  Record<CourseSlug, ReadonlyMap<string, CourseProjectCheckpoint>>
> = Object.freeze(
  Object.fromEntries(
    COURSE_SLUGS.map((courseSlug) => [
      courseSlug,
      new Map(
        COURSE_PROJECT_CHECKPOINTS[courseSlug].map((checkpoint) => [
          checkpoint.lessonId,
          checkpoint,
        ]),
      ),
    ]),
  ),
) as unknown as Readonly<
  Record<CourseSlug, ReadonlyMap<string, CourseProjectCheckpoint>>
>;

/** Selects one stable, existing lesson at the start of each project stage. */
export function selectCourseProjectCheckpoints(
  courseSlug: CourseSlug,
): readonly CourseProjectCheckpoint[] {
  return COURSE_PROJECT_CHECKPOINTS[courseSlug];
}

/** Unknown and non-checkpoint lessons fail closed. */
export function resolveCourseProjectCheckpoint(
  courseSlug: CourseSlug,
  lessonId: string,
): CourseProjectCheckpoint | null {
  return CHECKPOINT_BY_LESSON[courseSlug].get(lessonId) ?? null;
}

export function isCourseProjectCheckpointLesson(
  courseSlug: CourseSlug,
  lessonId: string,
): boolean {
  return resolveCourseProjectCheckpoint(courseSlug, lessonId) !== null;
}
