/**
 * AI-Native progress (FACADE over the unified store).
 *
 * As of shared course architecture all three courses share ONE progress store
 * (`src/lib/progress/store.ts`). This module keeps the AI-Native-shaped public
 * API (module-scoped, no slug arg; analytics events; hardened URL-hash import)
 * while reading/writing the unified store under the `"ai-native"` slug.
 *
 * The previous `deleteOnMismatch` guard is GONE: the legacy
 * `ai-native-progress-v1` payload is migrated forward by the unified store and
 * is never wiped (risk R1).
 */

import {
  AI_NATIVE_SCHEMA_VERSION,
  isExerciseKind,
  type AiNativeCourseProgress,
  type ExerciseResult,
  type ModuleId,
} from "./types";
import {
  recordForDebug,
  trackEvent,
  type ExerciseSubmitProps,
  type ModuleCompleteProps,
  type SectionReadProps,
  type UrlhashImportProps,
} from "./analytics";
import {
  getCourseSlice,
  markSectionRead as uMarkSectionRead,
  isSectionRead as uIsSectionRead,
  getReadSectionIds as uGetReadSectionIds,
  markLessonCompleted as uMarkLessonCompleted,
  isLessonCompleted as uIsLessonCompleted,
  getCompletedLessonIds as uGetCompletedLessonIds,
  getCompletedLessonsCount as uGetCompletedLessonsCount,
  saveExerciseResult as uSaveExerciseResult,
  getExerciseResult as uGetExerciseResult,
  isExerciseCompleted as uIsExerciseCompleted,
  getOverallProgress as uGetOverallProgress,
  resetCourse,
  __resetCacheForTests as uResetCacheForTests,
} from "@/lib/progress/store";

const SLUG = "ai-native" as const;

/** Hard caps on imported payloads to prevent DoS. */
const MAX_IMPORT_BYTES = 200 * 1024; // 200 KB
const MAX_IMPORT_LESSONS = 500;
const MAX_IMPORT_EXERCISES_PER_LESSON = 100;

// ─── Section Progress ──────────────────────────────────────────

export function markSectionRead(
  moduleId: ModuleId,
  lessonId: string,
  sectionId: string,
  sectionIndex: number,
): void {
  if (uIsSectionRead(SLUG, lessonId, sectionId)) return;
  uMarkSectionRead(SLUG, lessonId, sectionId);
  const evt: { name: "ai_native_section_read"; props: SectionReadProps } = {
    name: "ai_native_section_read",
    props: { moduleId, lessonId, sectionId, sectionIndex },
  };
  trackEvent(evt);
  recordForDebug(evt);
}

export function isSectionRead(lessonId: string, sectionId: string): boolean {
  return uIsSectionRead(SLUG, lessonId, sectionId);
}

export function getReadSectionIds(lessonId: string): ReadonlySet<string> {
  return uGetReadSectionIds(SLUG, lessonId);
}

// ─── Lesson Progress ───────────────────────────────────────────

export function markLessonCompleted(lessonId: string): void {
  uMarkLessonCompleted(SLUG, lessonId);
}

export function isLessonCompleted(lessonId: string): boolean {
  return uIsLessonCompleted(SLUG, lessonId);
}

export function getCompletedLessonIds(): ReadonlySet<string> {
  return uGetCompletedLessonIds(SLUG);
}

// ─── Exercise Progress ─────────────────────────────────────────

export function saveExerciseResult(
  moduleId: ModuleId,
  lessonId: string,
  result: ExerciseResult,
): void {
  uSaveExerciseResult(SLUG, lessonId, result);
  const merged = uGetExerciseResult(SLUG, lessonId, result.exerciseId);
  const evt: {
    name: "ai_native_exercise_submit";
    props: ExerciseSubmitProps;
  } = {
    name: "ai_native_exercise_submit",
    props: {
      moduleId,
      lessonId,
      exerciseId: result.exerciseId,
      kind: result.kind,
      score: merged?.score ?? result.score,
      maxScore: null,
      attempts: merged?.attempts ?? 1,
    },
  };
  trackEvent(evt);
  recordForDebug(evt);
}

export function getExerciseResult(
  lessonId: string,
  exerciseId: string,
): ExerciseResult | undefined {
  const r = uGetExerciseResult(SLUG, lessonId, exerciseId);
  if (!r) return undefined;
  return r as ExerciseResult;
}

export function isExerciseCompleted(
  lessonId: string,
  exerciseId: string,
): boolean {
  return uIsExerciseCompleted(SLUG, lessonId, exerciseId);
}

// ─── Aggregate helpers ─────────────────────────────────────────

export function getCompletedLessonsCount(): number {
  return uGetCompletedLessonsCount(SLUG);
}

export function getModuleCompletedLessonCount(
  moduleId: ModuleId,
  lessonIds: readonly string[],
): number {
  const slice = getCourseSlice(SLUG);
  return lessonIds.filter((id) => slice.lessons[id]?.completed).length;
}

export function areAllModuleLessonsCompleted(
  lessonIds: readonly string[],
): boolean {
  if (lessonIds.length === 0) return false;
  const slice = getCourseSlice(SLUG);
  return lessonIds.every((id) => slice.lessons[id]?.completed);
}

export function notifyModuleCompleted(
  moduleId: ModuleId,
  completedLessonCount: number,
  totalLessonCount: number,
): void {
  const evt: {
    name: "ai_native_module_complete";
    props: ModuleCompleteProps;
  } = {
    name: "ai_native_module_complete",
    props: { moduleId, completedLessonCount, totalLessonCount },
  };
  trackEvent(evt);
  recordForDebug(evt);
}

export function getOverallProgress(totalLessons: number): number {
  return uGetOverallProgress(SLUG, totalLessons);
}

/** Project the unified AI-Native slice down to the legacy progress shape. */
export function getAllProgress(): AiNativeCourseProgress {
  const slice = getCourseSlice(SLUG);
  return {
    schemaVersion: AI_NATIVE_SCHEMA_VERSION,
    lessons: Object.fromEntries(
      Object.entries(slice.lessons).map(([id, l]) => [
        id,
        {
          sectionsRead: l.sectionsRead,
          quizScore: l.quizScore,
          quizTotal: l.quizTotal,
          completed: l.completed,
          exercisesCompleted: l.exercisesCompleted as Record<
            string,
            ExerciseResult
          >,
        },
      ]),
    ),
    capstoneSubmitted: slice.capstoneSubmitted,
    premiumUnlocked: false,
    startedAt: slice.startedAt,
    lastActivity: slice.lastActivity,
  };
}

export function resetProgress(): void {
  resetCourse(SLUG);
}

// ─── URL-hash Serialize + Import (hardened) ────────────────────

/**
 * Stripped projection of ExerciseResult for URL-hash sharing:
 * excludes any free-form user text + completedAt.
 */
interface SanitizedExerciseResult {
  readonly kind: string;
  readonly completed: boolean;
  readonly score: number | null;
  readonly attempts: number;
  readonly skipped: boolean;
}

interface SerializedProgress {
  readonly schemaVersion: number;
  readonly lessons: Record<
    string,
    {
      readonly sectionsRead: readonly string[];
      readonly quizScore: number | null;
      readonly quizTotal: number | null;
      readonly completed: boolean;
      readonly exercisesCompleted: Record<string, SanitizedExerciseResult>;
    }
  >;
  readonly capstoneSubmitted: boolean;
  readonly startedAt: string;
  readonly lastActivity: string;
}

function sanitizeForExport(state: AiNativeCourseProgress): SerializedProgress {
  return {
    schemaVersion: state.schemaVersion,
    lessons: Object.fromEntries(
      Object.entries(state.lessons).map(([id, lesson]) => [
        id,
        {
          sectionsRead: lesson.sectionsRead,
          quizScore: lesson.quizScore,
          quizTotal: lesson.quizTotal,
          completed: lesson.completed,
          exercisesCompleted: Object.fromEntries(
            Object.entries(lesson.exercisesCompleted).map(([exId, r]) => [
              exId,
              {
                kind: r.kind,
                completed: r.completed,
                score: r.score,
                attempts: r.attempts,
                skipped: r.skipped,
              },
            ]),
          ),
        },
      ]),
    ),
    capstoneSubmitted: state.capstoneSubmitted,
    startedAt: state.startedAt,
    lastActivity: state.lastActivity,
  };
}

/**
 * Serialize current progress to a base64url string for sharing.
 * User-typed text is NEVER included (§3 PII constraint).
 */
export function serializeProgress(): string | null {
  const state = getAllProgress();
  const hasProgress =
    Object.keys(state.lessons).length > 0 || state.capstoneSubmitted;
  if (!hasProgress) return null;

  const sanitized = sanitizeForExport(state);
  const json = JSON.stringify(sanitized);
  const encoded = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Validate imported payload. Returns parsed object or null on any rejection. */
function deserializeAndValidate(encoded: string): SerializedProgress | null {
  if (encoded.length * 0.75 > MAX_IMPORT_BYTES) return null;
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decoded = atob(base64);
    const json = decodeURIComponent(
      decoded
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    if (json.length > MAX_IMPORT_BYTES) return null;
    const parsed = JSON.parse(json);

    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.schemaVersion !== AI_NATIVE_SCHEMA_VERSION) return null;
    if (typeof parsed.lessons !== "object" || parsed.lessons === null)
      return null;
    const lessonEntries = Object.entries(parsed.lessons);
    if (lessonEntries.length > MAX_IMPORT_LESSONS) return null;
    for (const [, lesson] of lessonEntries) {
      if (typeof lesson !== "object" || lesson === null) return null;
      const l = lesson as {
        sectionsRead?: unknown;
        exercisesCompleted?: unknown;
      };
      if (!Array.isArray(l.sectionsRead)) return null;
      if (
        typeof l.exercisesCompleted !== "object" ||
        l.exercisesCompleted === null
      )
        return null;
      const exEntries = Object.entries(l.exercisesCompleted);
      if (exEntries.length > MAX_IMPORT_EXERCISES_PER_LESSON) return null;
      for (const [, result] of exEntries) {
        if (typeof result !== "object" || result === null) return null;
        const r = result as { kind?: unknown };
        if (!isExerciseKind(r.kind)) return null;
      }
    }
    return parsed as SerializedProgress;
  } catch {
    return null;
  }
}

export function deserializeProgress(
  encoded: string,
): AiNativeCourseProgress | null {
  const parsed = deserializeAndValidate(encoded);
  if (!parsed) return null;
  return {
    schemaVersion: AI_NATIVE_SCHEMA_VERSION,
    lessons: Object.fromEntries(
      Object.entries(parsed.lessons).map(([id, l]) => {
        const lesson = l as SerializedProgress["lessons"][string];
        return [
          id,
          {
            sectionsRead: lesson.sectionsRead,
            quizScore: lesson.quizScore,
            quizTotal: lesson.quizTotal,
            completed: lesson.completed,
            exercisesCompleted: Object.fromEntries(
              Object.entries(lesson.exercisesCompleted).map(([exId, r]) => {
                const result = r as SanitizedExerciseResult;
                return [
                  exId,
                  {
                    exerciseId: exId,
                    kind: result.kind as ExerciseResult["kind"],
                    completed: result.completed,
                    score: result.score,
                    attempts: result.attempts,
                    completedAt: null, // Stripped on export
                    skipped: result.skipped,
                  },
                ];
              }),
            ),
          },
        ];
      }),
    ),
    capstoneSubmitted: parsed.capstoneSubmitted,
    premiumUnlocked: false, // Never imported — premium is server-granted
    startedAt: parsed.startedAt,
    lastActivity: parsed.lastActivity,
  };
}

export function importProgress(encoded: string): boolean {
  const imported = deserializeProgress(encoded);
  if (!imported) return false;

  const before = getAllProgress();
  let conflictCount = 0;

  for (const [lessonId, incoming] of Object.entries(imported.lessons)) {
    const existing = before.lessons[lessonId];
    if (
      existing &&
      (existing.completed !== incoming.completed ||
        existing.quizScore !== incoming.quizScore)
    ) {
      conflictCount += 1;
    }
    for (const sectionId of incoming.sectionsRead) {
      uMarkSectionRead(SLUG, lessonId, sectionId);
    }
    for (const [exId, ex] of Object.entries(incoming.exercisesCompleted)) {
      uSaveExerciseResult(SLUG, lessonId, { ...ex, exerciseId: exId });
    }
    if (incoming.completed) uMarkLessonCompleted(SLUG, lessonId);
  }

  const evt: {
    name: "ai_native_urlhash_import_success";
    props: UrlhashImportProps;
  } = {
    name: "ai_native_urlhash_import_success",
    props: { merged: true, conflictCount },
  };
  trackEvent(evt);
  recordForDebug(evt);
  return true;
}

export function buildProgressUrl(baseUrl: string): string | null {
  const encoded = serializeProgress();
  if (!encoded) return null;
  return `${baseUrl}#ai-native-progress=${encoded}`;
}

// ─── Test-only helpers ─────────────────────────────────────────

/** Internal: reset the unified store's in-memory cache. Used by unit tests. */
export function __resetCacheForTests(): void {
  uResetCacheForTests();
}
