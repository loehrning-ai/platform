// ─── Forward migrator (shared course architecture, risk R1) ──
//
// Reads BOTH legacy schemas and folds them into the unified store. NEVER
// wipes: an unknown/corrupt legacy payload is skipped (logged), not deleted,
// so a future code version can still recover it. The previous AI-Native
// `deleteOnMismatch` guard is replaced by this migrate-or-preserve path.
//
// Legacy keys:
//   • course-progress::<slug>   — the two free courses (CourseProgress shape)
//   • ai-native-progress-v1      — AI-Native (AiNativeCourseProgress shape)

import type { CourseSlug } from "@/lib/course/types";
import { COURSE_SLUGS } from "@/lib/course/types";
import {
  UNIFIED_SCHEMA_VERSION,
  type UnifiedCourseSlice,
  type UnifiedExerciseResult,
  type UnifiedLessonProgress,
  type UnifiedProgress,
} from "./types";

/** Legacy storage keys (kept in sync with the two old progress modules). */
export const LEGACY_COURSE_KEY_PREFIX = "course-progress::";
export const LEGACY_AI_NATIVE_KEY = "ai-native-progress-v1";
/** Pre-namespace KI-Führerschein key (oldest schema). */
export const LEGACY_KI_F_FLAT_KEY = "ki-fuehrerschein-progress";

const AI_NATIVE_SLUG: CourseSlug = "ai-native";

function nowIso(): string {
  return new Date().toISOString();
}

export function freshUnified(): UnifiedProgress {
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: nowIso(),
  };
}

// ─── Per-shape coercion (defensive: never throw, never wipe) ────

function coerceLesson(raw: unknown): UnifiedLessonProgress | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const sectionsRead = Array.isArray(r.sectionsRead)
    ? (r.sectionsRead.filter((s) => typeof s === "string") as string[])
    : [];
  const exercisesCompleted: Record<string, UnifiedExerciseResult> = {};
  if (typeof r.exercisesCompleted === "object" && r.exercisesCompleted !== null) {
    for (const [exId, exRaw] of Object.entries(
      r.exercisesCompleted as Record<string, unknown>,
    )) {
      if (typeof exRaw !== "object" || exRaw === null) continue;
      const ex = exRaw as Record<string, unknown>;
      exercisesCompleted[exId] = {
        exerciseId: typeof ex.exerciseId === "string" ? ex.exerciseId : exId,
        kind: typeof ex.kind === "string" ? ex.kind : "unknown",
        completed: ex.completed === true,
        score: typeof ex.score === "number" ? ex.score : null,
        attempts: typeof ex.attempts === "number" ? ex.attempts : 0,
        completedAt:
          typeof ex.completedAt === "string" ? ex.completedAt : null,
        skipped: ex.skipped === true,
      };
    }
  }
  return {
    sectionsRead,
    quizScore: typeof r.quizScore === "number" ? r.quizScore : null,
    quizTotal: typeof r.quizTotal === "number" ? r.quizTotal : null,
    completed: r.completed === true,
    exercisesCompleted,
  };
}

function coerceSlice(raw: unknown): UnifiedCourseSlice | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.lessons !== "object" || r.lessons === null) return null;

  const lessons: Record<string, UnifiedLessonProgress> = {};
  for (const [lessonId, lessonRaw] of Object.entries(
    r.lessons as Record<string, unknown>,
  )) {
    const lesson = coerceLesson(lessonRaw);
    if (lesson) lessons[lessonId] = lesson;
  }

  const wqRaw =
    typeof r.workshopQuiz === "object" && r.workshopQuiz !== null
      ? (r.workshopQuiz as Record<string, unknown>)
      : {};

  return {
    lessons,
    workshopQuiz: {
      passed: wqRaw.passed === true,
      score: typeof wqRaw.score === "number" ? wqRaw.score : 0,
      completedAt:
        typeof wqRaw.completedAt === "string" ? wqRaw.completedAt : null,
    },
    capstoneSubmitted: r.capstoneSubmitted === true,
    startedAt: typeof r.startedAt === "string" ? r.startedAt : nowIso(),
    lastActivity:
      typeof r.lastActivity === "string" ? r.lastActivity : nowIso(),
  };
}

/** Safe JSON parse from localStorage; null on miss or corruption (no wipe). */
function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Build a unified store from any legacy localStorage payloads present.
 * Pure with respect to localStorage: it only READS legacy keys, never removes
 * them (R1: never wipe). Returns a fresh store if nothing legacy exists.
 */
export function migrateLegacyToUnified(): UnifiedProgress {
  const unified = freshUnified();
  const courses: Partial<Record<CourseSlug, UnifiedCourseSlice>> = {};

  // 1) Free-course slices: course-progress::<slug> (+ oldest flat KI-F key).
  for (const slug of COURSE_SLUGS) {
    if (slug === AI_NATIVE_SLUG) continue; // AI-Native handled below.
    const slice =
      coerceSlice(readJson(`${LEGACY_COURSE_KEY_PREFIX}${slug}`)) ??
      (slug === "ki-fuehrerschein"
        ? coerceSlice(readJson(LEGACY_KI_F_FLAT_KEY))
        : null);
    if (slice) courses[slug] = slice;
  }

  // 2) AI-Native slice: ai-native-progress-v1.
  //    Note any schemaVersion: we MIGRATE forward, we do not wipe on mismatch.
  const aiRaw = readJson(LEGACY_AI_NATIVE_KEY);
  const aiSlice = coerceSlice(aiRaw);
  if (aiSlice) {
    courses[AI_NATIVE_SLUG] = aiSlice;
    if (
      typeof aiRaw === "object" &&
      aiRaw !== null &&
      "schemaVersion" in aiRaw &&
      (aiRaw as { schemaVersion: unknown }).schemaVersion !== 1
    ) {
      console.warn(
        "[progress.migrate] ai-native legacy schemaVersion unrecognized; migrated forward (not wiped).",
      );
    }
  }

  return { ...unified, courses };
}
