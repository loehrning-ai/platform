// ─── Unified Progress Types (shared course architecture) ──
//
// ONE progress store across all three courses (KI-Führerschein,
// EU-AI-Act-Kurs, AI-Native). Both legacy schemas migrate FORWARD into this
// shape and are NEVER wiped:
//   • `course-progress::<slug>`  (the two free courses; lib/course/progress.ts)
//   • `ai-native-progress-v1`     (AI-Native; lib/ai-native/progress.ts)
//
// XP, streaks, badges, and checkpoints live here so gamification and the
// /kurse hub read one source of truth.

import type { CourseSlug } from "@/lib/course/types";

/** Root localStorage key for the unified store. Bump suffix on breaking change. */
export const UNIFIED_STORAGE_KEY = "loehrning-progress-v2";

/** Schema version. Increment on any shape change + extend the migrator. */
export const UNIFIED_SCHEMA_VERSION = 2 as const;

/** Per-exercise result, mirroring the widget `ExerciseResult`. */
export interface UnifiedExerciseResult {
  readonly exerciseId: string;
  readonly kind: string;
  readonly completed: boolean;
  readonly score: number | null;
  readonly attempts: number;
  readonly completedAt: string | null;
  readonly skipped: boolean;
}

/** One lesson's progress within a course. Superset of both legacy lesson shapes. */
export interface UnifiedLessonProgress {
  readonly sectionsRead: readonly string[];
  readonly quizScore: number | null;
  readonly quizTotal: number | null;
  readonly completed: boolean;
  /** Keyed by exerciseId. Empty for the two MC-quiz-only free courses. */
  readonly exercisesCompleted: Readonly<Record<string, UnifiedExerciseResult>>;
}

/** Workshop-quiz pass state (parity across all three courses). */
export interface UnifiedWorkshopQuiz {
  readonly passed: boolean;
  readonly score: number;
  readonly completedAt: string | null;
}

/** Daily-visit streak. `last` is an ISO yyyy-mm-dd date string. */
export interface UnifiedStreak {
  readonly days: number;
  readonly last: string | null;
}

/** One course's progress slice inside the unified store. */
export interface UnifiedCourseSlice {
  readonly lessons: Record<string, UnifiedLessonProgress>;
  readonly workshopQuiz: UnifiedWorkshopQuiz;
  /** AI-Native capstone submission flag (false for the free courses). */
  readonly capstoneSubmitted: boolean;
  readonly startedAt: string;
  readonly lastActivity: string;
}

/**
 * The unified root. One object holding every course's progress plus the
 * cross-course gamification ledger.
 */
export interface UnifiedProgress {
  readonly schemaVersion: typeof UNIFIED_SCHEMA_VERSION;
  /** Per-course slices, keyed by `CourseSlug`. Created lazily on first write. */
  readonly courses: Partial<Record<CourseSlug, UnifiedCourseSlice>>;
  /** Cumulative experience points across all courses. */
  readonly xp: number;
  /** Completed checkpoints, keyed `"<lessonId>::<cpId>"`. */
  readonly checkpoints: Readonly<Record<string, boolean>>;
  /** Earned badges, keyed by badge id → award timestamp (ISO). */
  readonly badges: Readonly<Record<string, string>>;
  readonly streak: UnifiedStreak;
  /** ISO timestamp of the most recent store touch. */
  readonly lastActivity: string;
}

/** XP awarded per kind of accomplishment (immutable constants). */
export const XP = {
  SECTION: 2,
  CHECKPOINT: 10,
  LESSON: 25,
  QUIZ_PASS: 50,
} as const;

/** Build the canonical checkpoint key. */
export function checkpointKey(lessonId: string, cpId: string): string {
  return `${lessonId}::${cpId}`;
}
