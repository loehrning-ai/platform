import type { CourseSlug } from "@/lib/course/types";
import { resolveCourseProjectMilestone } from "@/lib/course-projects/milestone-manifest";
import { COURSE_PROJECT_STAGE_IDS } from "@/lib/course-projects/types";

export const COURSE_PROJECT_STAGE_COUNT = COURSE_PROJECT_STAGE_IDS.length;

/**
 * Maps a canonical lesson through the shared authored milestone manifest.
 * Unknown or non-canonical entry points fail closed to Ground rather than
 * implying progress the learner has not established.
 */
export function getCourseProjectStageIndex(
  courseSlug: CourseSlug,
  lessonId: string,
): number {
  return resolveCourseProjectMilestone(courseSlug, lessonId)?.stageIndex ?? 0;
}
