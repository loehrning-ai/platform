// ─── Unified progress module (shared course architecture) ──
//
// ONE progress store across all three courses. Both legacy schemas migrate
// forward into `loehrning-progress-v2` and are never wiped (R1).

export * from "./types";
export * from "./badges";
export {
  freshUnified,
  migrateLegacyToUnified,
  LEGACY_COURSE_KEY_PREFIX,
  LEGACY_AI_NATIVE_KEY,
  LEGACY_KI_F_FLAT_KEY,
} from "./migrate";
export {
  subscribe,
  replaceUnifiedState,
  getUnifiedState,
  getCourseSlice,
  getLesson,
  markSectionRead,
  isSectionRead,
  getReadSectionIds,
  markLessonCompleted,
  isLessonCompleted,
  getCompletedLessonIds,
  getCompletedLessonsCount,
  saveLessonQuizScore,
  getLessonQuizScore,
  saveExerciseResult,
  saveExerciseResultWithCheckpoint,
  getExerciseResult,
  isExerciseCompleted,
  saveWorkshopQuizResult,
  getWorkshopQuizResult,
  isWorkshopQuizPassed,
  markCapstoneSubmitted,
  isCapstoneSubmitted,
  isCertificateEligible,
  isCheckpointDone,
  completeCheckpoint,
  getXp,
  getStreak,
  getEarnedBadgeIds,
  getTotalCompletedLessons,
  getBlockCompletedLessons,
  areAllBlockLessonsCompleted,
  getOverallProgress,
  rollStreak,
  resetCourse,
  resetAll,
  __resetCacheForTests,
} from "./store";
export { useCheckpoint } from "./use-checkpoint";
export type { UseCheckpointResult } from "./use-checkpoint";

export { isAppliedProjectCompleted } from "@/lib/course-projects/applied-completion";
