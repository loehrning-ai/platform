import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import {
  UNIFIED_SCHEMA_VERSION,
  UNIFIED_STORAGE_KEY,
  type UnifiedCourseSlice,
  type UnifiedExerciseResult,
  type UnifiedLessonProgress,
  type UnifiedProgress,
} from "@/lib/progress/types";

/**
 * ─── Reading the anonymous namespace, defensively ──
 *
 * The browser's anonymous learning namespace is the bare `loehrning-progress-v2`
 * key: `ownedLearningStorageKey` returns the key unchanged for an anonymous
 * owner, and prefixes it only for a verified account. Reading it directly here
 * keeps the whole account-storage machinery, and the hashing it depends on, out
 * of the account page's first-load JavaScript.
 *
 * Everything below is a COUNTING VIEW and nothing else. The object posted to
 * the import route is always the raw parsed snapshot, because the server's own
 * validator decides what is storable and this projection deliberately drops
 * checkpoints, badges, XP and the reset epoch. Rebuilding a payload from these
 * fields would silently discard learner data on the way to the server.
 *
 * The snapshot is untrusted input: any browser extension, any older build and
 * any hand-edited value can be behind that key, so every field is narrowed
 * before it is read and nothing here throws.
 */

const EPOCH = "1970-01-01T00:00:00.000Z";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function finiteNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coerceExercise(
  exerciseId: string,
  value: unknown,
): UnifiedExerciseResult | null {
  if (!isRecord(value)) return null;
  return {
    exerciseId,
    kind: typeof value.kind === "string" ? value.kind : "unknown",
    completed: value.completed === true,
    score: finiteNumberOrNull(value.score),
    attempts: finiteNumberOrNull(value.attempts) ?? 0,
    completedAt:
      typeof value.completedAt === "string" ? value.completedAt : null,
    skipped: value.skipped === true,
  };
}

function coerceLesson(value: unknown): UnifiedLessonProgress | null {
  if (!isRecord(value)) return null;
  const exercisesCompleted: Record<string, UnifiedExerciseResult> = {};
  if (isRecord(value.exercisesCompleted)) {
    for (const [exerciseId, result] of Object.entries(
      value.exercisesCompleted,
    )) {
      const exercise = coerceExercise(exerciseId, result);
      if (exercise) exercisesCompleted[exerciseId] = exercise;
    }
  }
  return {
    sectionsRead: Array.isArray(value.sectionsRead)
      ? value.sectionsRead.filter(
          (sectionId): sectionId is string => typeof sectionId === "string",
        )
      : [],
    quizScore: finiteNumberOrNull(value.quizScore),
    quizTotal: finiteNumberOrNull(value.quizTotal),
    completed: value.completed === true,
    exercisesCompleted,
  };
}

function coerceSlice(value: unknown): UnifiedCourseSlice | null {
  if (!isRecord(value)) return null;
  const lessons: Record<string, UnifiedLessonProgress> = {};
  if (isRecord(value.lessons)) {
    for (const [lessonId, lesson] of Object.entries(value.lessons)) {
      const coerced = coerceLesson(lesson);
      if (coerced) lessons[lessonId] = coerced;
    }
  }
  const quiz = isRecord(value.workshopQuiz) ? value.workshopQuiz : {};
  return {
    lessons,
    workshopQuiz: {
      passed: quiz.passed === true,
      score: finiteNumberOrNull(quiz.score) ?? 0,
      completedAt:
        typeof quiz.completedAt === "string" ? quiz.completedAt : null,
    },
    capstoneSubmitted: value.capstoneSubmitted === true,
    startedAt: typeof value.startedAt === "string" ? value.startedAt : EPOCH,
    lastActivity:
      typeof value.lastActivity === "string" ? value.lastActivity : EPOCH,
  };
}

/** A fresh empty record: the comparison base for an account with no rows. */
export function emptyProgressView(): UnifiedProgress {
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: EPOCH,
  };
}

/**
 * Narrow untrusted JSON to the fields the shared import counter reads.
 *
 * A snapshot from an older build returns null, so nothing is ever offered that
 * the server would refuse as an unreadable schema version.
 */
export function coerceProgressView(value: unknown): UnifiedProgress | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== UNIFIED_SCHEMA_VERSION) return null;
  const courses: Partial<Record<CourseSlug, UnifiedCourseSlice>> = {};
  if (isRecord(value.courses)) {
    for (const slug of COURSE_SLUGS) {
      const slice = coerceSlice(value.courses[slug]);
      if (slice) courses[slug] = slice;
    }
  }
  return { ...emptyProgressView(), courses };
}

export interface LocalSnapshot {
  /** Exactly what was stored, sent to the server untouched. */
  readonly raw: unknown;
  /** The counting projection of the same data. */
  readonly view: UnifiedProgress;
}

/** Read and parse the ANONYMOUS namespace. Never writes, never throws. */
export function readAnonymousSnapshot(): LocalSnapshot | null {
  let stored: string | null;
  try {
    stored = window.localStorage.getItem(UNIFIED_STORAGE_KEY);
  } catch {
    // Storage denied (private mode, blocked site data). Nothing to offer.
    return null;
  }
  if (!stored) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(stored);
  } catch {
    return null;
  }
  const view = coerceProgressView(raw);
  return view ? { raw, view } : null;
}
