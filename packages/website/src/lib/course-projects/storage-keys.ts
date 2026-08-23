import type { CourseSlug } from "@/lib/course/types";

export const COURSE_PROJECT_DRAFT_STORAGE_PREFIX =
  "loehrning:course-project-draft:v1:";
export const LESSON_MISSION_STORAGE_PREFIX = "loehrning:lesson-mission:v1:";

export function getCourseProjectDraftStorageKey(
  courseSlug: CourseSlug,
): string {
  return `${COURSE_PROJECT_DRAFT_STORAGE_PREFIX}${courseSlug}`;
}

export function getLessonMissionStorageKey(
  courseSlug: CourseSlug,
  lessonId: string,
): string {
  return `${LESSON_MISSION_STORAGE_PREFIX}${courseSlug}:${encodeURIComponent(lessonId)}`;
}
