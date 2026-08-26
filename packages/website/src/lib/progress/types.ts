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

/**
 * Semantic cutover for evidence-backed lesson completion. The unified storage
 * shape remains v3; these reserved checkpoint keys let the v3 migrator
 * distinguish progress that existed before the cutover from raw completion
 * bits written afterwards.
 */
export const COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY =
  "__progress__::completion-evidence-cutover-v1";
export const LEGACY_COMPLETION_EVIDENCE_VERSION = "legacy-completion-v1";

/**
 * Schema version. Increment on any shape change + extend the migrator.
 * v3: server-side progress storage moves from one shared
 * JSONB blob per user to one row per (user_id, course_slug), and exercise
 * summaries are capped at MAX_EXERCISE_SUMMARY_BYTES. The client-side shape
 * (UnifiedProgress/UnifiedCourseSlice) is otherwise unchanged.
 */
export const UNIFIED_SCHEMA_VERSION = 3 as const;

/**
 * Cap on `UnifiedExerciseResult.summary`, enforced in UTF-8 BYTES (not
 * characters): the real Postgres constraint (`pg_column_size`) is byte-based,
 * and German umlauts/ß are 2 bytes each, so a naive `.length` cap
 * under-protects the actual per-row size budget. 500 bytes covers the
 * "1-2 sentence" summary the widget layer generates with comfortable margin.
 */
export const MAX_EXERCISE_SUMMARY_BYTES = 500;

/**
 * Truncate a string to at most `maxBytes` UTF-8 bytes without splitting a
 * multi-byte character in half. Returns the input unchanged if it already
 * fits.
 */
export function truncateToByteLength(value: string, maxBytes: number): string {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length <= maxBytes) return value;
  const truncatedBytes = bytes.slice(0, maxBytes);
  return new TextDecoder("utf-8").decode(truncatedBytes).replace(/�+$/, "");
}

/** Per-exercise result, mirroring the widget `ExerciseResult`. */
export interface UnifiedExerciseResult {
  readonly exerciseId: string;
  readonly kind: string;
  readonly completed: boolean;
  readonly score: number | null;
  readonly attempts: number;
  readonly completedAt: string | null;
  readonly skipped: boolean;
  /** 1-2 sentence AI/rule-graded summary, capped at MAX_EXERCISE_SUMMARY_BYTES. */
  readonly summary?: string;
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
  /** Best result as a normalized ratio in the inclusive 0..1 range. */
  readonly score: number;
  readonly completedAt: string | null;
}

/**
 * Normalize the historical workshop-quiz score formats at trust boundaries.
 *
 * Current code stores a ratio in 0..1. Older course payloads and callers stored
 * a whole percentage in (1, 100]. Values outside either representation are
 * impossible scores and return null so callers can reject the write or replace
 * corrupt persisted data with a non-inflating zero.
 */
export function normalizeWorkshopQuizScore(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    return null;
  }
  return value <= 1 ? value : value / 100;
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
  /**
   * Historical AI-Native capstone self-review. This remains a certificate
   * compatibility signal for that course only; applied-project completion is
   * derived from the exact course-project exercise result.
   */
  readonly capstoneSubmitted: boolean;
  readonly startedAt: string;
  readonly lastActivity: string;
  /**
   * Reset epoch propagated through local storage and server sync. A slice
   * without the same epoch is older than the reset and must not be merged back
   * in by another tab or offline device.
   */
  readonly resetAt?: string;
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

/** Reserved compatibility marker for one lesson completed before the cutover. */
export function legacyCompletionEvidenceCheckpointKey(
  slug: CourseSlug,
  lessonId: string,
  resetAt?: string,
): string {
  return checkpointKey(
    lessonId,
    `${LEGACY_COMPLETION_EVIDENCE_VERSION}:${slug}${
      resetAt ? `:reset:${resetAt}` : ""
    }`,
  );
}

/** Compatibility metadata is persisted in the checkpoint ledger but earns no XP. */
export function isCompletionCompatibilityCheckpointKey(key: string): boolean {
  return (
    key === COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY ||
    key.includes(`::${LEGACY_COMPLETION_EVIDENCE_VERSION}:`)
  );
}
