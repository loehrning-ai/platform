export { COURSE_PROJECT_CONFIGS, getCourseProjectConfig } from "./configs";
export {
  COURSE_PROJECT_IDENTITIES,
  getCourseProjectIdentity,
  hasAppliedProjectCompletion,
} from "./identity";
export type { CourseProjectIdentity } from "./identity";
export {
  hasValidCourseProjectArtifact,
  parseCourseProjectProgress,
  serializeCourseProjectProgress,
} from "./persistence";
export type { ParsedCourseProjectProgress } from "./persistence";
export {
  getCourseProjectDraftStorageKey,
  parseCourseProjectDraft,
  serializeCourseProjectDraft,
} from "./project-draft";
export type { CourseProjectDraft } from "./project-draft";
export {
  deriveCompletedCourseProjectStages,
  getCourseLessonMissions,
  getLessonMissionDefinition,
  hasCompletedAllCourseProjectStages,
  LESSON_MISSION_CATALOG,
  normalizeCompletedLessonMissionIds,
} from "./lesson-mission-catalog";
export type {
  LessonMissionDefinition,
  LessonMissionId,
} from "./lesson-mission-catalog";
export { bindLessonMission } from "./lesson-mission-binding";
export type {
  AuthoredLessonMissionContext,
  BoundLessonMission,
  LessonMissionFrame,
} from "./lesson-mission-binding";
export {
  COURSE_PROJECT_MILESTONE_MANIFEST,
  resolveCourseProjectMilestone,
} from "./milestone-manifest";
export type {
  CourseProjectMilestone,
  CourseProjectMilestoneManifest,
} from "./milestone-manifest";
export {
  COURSE_PROJECT_EXECUTION_RECEIPTS,
  COURSE_PROJECT_LOCAL_LEARNING_FAILURE_CLASSES,
  COURSE_PROJECT_LOCAL_LEARNING_RECEIPTS,
  COURSE_PROJECT_STAGE_IDS,
  COURSE_PROJECT_STAGE_LABELS,
  getCourseProjectExecutionReceipt,
  getCourseProjectLocalLearningReceipt,
  hasCourseProjectExecutionEvidence,
  hasCourseProjectLearningEvidence,
  isCourseProjectExecutionReceipt,
  isCourseProjectLocalLearningFailureClass,
} from "./types";
export type {
  CourseProjectConfig,
  CourseProjectArtifactState,
  CourseProjectArtifactValue,
  CourseProjectEngineKind,
  CourseProjectEngineProps,
  CourseProjectExecutionReceipt,
  CourseProjectLearningReceipt,
  CourseProjectLocalLearningFailureClass,
  CourseProjectLocalLearningReceipt,
  CourseProjectStage,
  CourseProjectStageId,
  CourseProjectStages,
  LocalizedProjectText,
} from "./types";
