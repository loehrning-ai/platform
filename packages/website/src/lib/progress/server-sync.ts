import type {
  UnifiedCourseSlice,
  UnifiedExerciseResult,
  UnifiedLessonProgress,
  UnifiedProgress,
  UnifiedStreak,
  UnifiedWorkshopQuiz,
} from "./types";
import { UNIFIED_SCHEMA_VERSION } from "./types";
import { truncateExerciseSummaries } from "./migrate";
import { COURSE_SLUGS as CANONICAL_COURSE_SLUGS } from "@/lib/course/types";

// Derive the valid-slug set from the single canonical list so a new course can
// never silently break progress sync. (This previously hardcoded only 3 of the
// 4 slugs, missing "ki-und-gesellschaft" — any learner who touched that course
// had their entire unified progress rejected as invalid on PUT.)
const COURSE_SLUGS = new Set<string>(CANONICAL_COURSE_SLUGS);

/**
 * Reserved course_slug value for the per-user cross-course ledger row
 * (xp/checkpoints/badges/streak) in the per-course-row DB schema (
 * stage 5). Can never collide with a real CourseSlug: every course slug is a
 * bare kebab-case identifier with no leading underscore.
 */
export const META_ROW_COURSE_SLUG = "_meta" as const;

/** The cross-course fields of UnifiedProgress, persisted as their own DB row. */
export type UnifiedMetaFields = Pick<
  UnifiedProgress,
  "xp" | "checkpoints" | "badges" | "streak" | "lastActivity"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isBooleanRecord(value: unknown): value is Readonly<Record<string, boolean>> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "boolean");
}

function isStringRecord(value: unknown): value is Readonly<Record<string, string>> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function isUnifiedExerciseResult(value: unknown): value is UnifiedExerciseResult {
  return (
    isRecord(value) &&
    typeof value.exerciseId === "string" &&
    typeof value.kind === "string" &&
    typeof value.completed === "boolean" &&
    (value.score === null || isFiniteNonNegativeNumber(value.score)) &&
    typeof value.attempts === "number" &&
    Number.isInteger(value.attempts) &&
    value.attempts >= 0 &&
    isStringOrNull(value.completedAt) &&
    typeof value.skipped === "boolean"
  );
}

function isExerciseResultRecord(
  value: unknown,
): value is Readonly<Record<string, UnifiedExerciseResult>> {
  return isRecord(value) && Object.values(value).every(isUnifiedExerciseResult);
}

function isUnifiedLessonProgress(value: unknown): value is UnifiedLessonProgress {
  return (
    isRecord(value) &&
    isStringArray(value.sectionsRead) &&
    (value.quizScore === null || isFiniteNonNegativeNumber(value.quizScore)) &&
    (value.quizTotal === null || isFiniteNonNegativeNumber(value.quizTotal)) &&
    typeof value.completed === "boolean" &&
    isExerciseResultRecord(value.exercisesCompleted)
  );
}

function isLessonProgressRecord(
  value: unknown,
): value is Readonly<Record<string, UnifiedLessonProgress>> {
  return isRecord(value) && Object.values(value).every(isUnifiedLessonProgress);
}

function isUnifiedWorkshopQuiz(value: unknown): value is UnifiedWorkshopQuiz {
  return (
    isRecord(value) &&
    typeof value.passed === "boolean" &&
    isFiniteNonNegativeNumber(value.score) &&
    isStringOrNull(value.completedAt)
  );
}

export function isUnifiedCourseSlice(value: unknown): value is UnifiedCourseSlice {
  return (
    isRecord(value) &&
    isLessonProgressRecord(value.lessons) &&
    isUnifiedWorkshopQuiz(value.workshopQuiz) &&
    typeof value.capstoneSubmitted === "boolean" &&
    typeof value.startedAt === "string" &&
    typeof value.lastActivity === "string"
  );
}

function isCourseRecord(
  value: unknown,
): value is Partial<Record<keyof UnifiedProgress["courses"], UnifiedCourseSlice>> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, course]) => COURSE_SLUGS.has(key) && isUnifiedCourseSlice(course),
    )
  );
}

function isUnifiedStreak(value: unknown): value is UnifiedStreak {
  return (
    isRecord(value) &&
    typeof value.days === "number" &&
    Number.isInteger(value.days) &&
    value.days >= 0 &&
    isStringOrNull(value.last)
  );
}

/** Row-shape validator for the "_meta" DB row. */
export function isUnifiedMetaFields(value: unknown): value is UnifiedMetaFields {
  return (
    isRecord(value) &&
    isFiniteNonNegativeNumber(value.xp) &&
    isBooleanRecord(value.checkpoints) &&
    isStringRecord(value.badges) &&
    isUnifiedStreak(value.streak) &&
    typeof value.lastActivity === "string"
  );
}

function latestIso(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function earliestIso(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return Date.parse(a) <= Date.parse(b) ? a : b;
}

function scoreRatio(score: number | null, total: number | null): number {
  if (score === null || total === null || total <= 0) return -1;
  return score / total;
}

/**
 * Deterministic, order-independent pick for a merged exercise's `summary`:
 * prefer whichever side has the LATER completedAt (mirrors how completedAt
 * itself resolves); on a tie (including both null), prefer the longer
 * summary, then fall back to a lexicographic tie-break. Order-independence
 * matters here specifically: mergeUnifiedProgress(x, y) must equal
 * mergeUnifiedProgress(y, x) regardless of which side is "local".
 */
function pickSummary(a: UnifiedExerciseResult, b: UnifiedExerciseResult): string | undefined {
  const latest = latestIso(a.completedAt, b.completedAt);
  if (latest === a.completedAt && latest !== b.completedAt) return a.summary;
  if (latest === b.completedAt && latest !== a.completedAt) return b.summary;
  const aLen = a.summary?.length ?? 0;
  const bLen = b.summary?.length ?? 0;
  if (aLen !== bLen) return aLen > bLen ? a.summary : b.summary;
  if (a.summary === b.summary) return a.summary;
  return (a.summary ?? "") < (b.summary ?? "") ? a.summary : b.summary;
}

function mergeLesson(
  local: UnifiedLessonProgress | undefined,
  remote: UnifiedLessonProgress | undefined,
): UnifiedLessonProgress {
  const left: UnifiedLessonProgress = local ?? {
    sectionsRead: [],
    quizScore: null,
    quizTotal: null,
    completed: false,
    exercisesCompleted: {},
  };
  const right = remote ?? left;
  const preferRemoteQuiz =
    scoreRatio(right.quizScore, right.quizTotal) > scoreRatio(left.quizScore, left.quizTotal);
  const exerciseIds = new Set([
    ...Object.keys(left.exercisesCompleted),
    ...Object.keys(right.exercisesCompleted),
  ]);
  const exercisesCompleted: Record<string, UnifiedExerciseResult> = {};

  for (const id of exerciseIds) {
    const a = left.exercisesCompleted[id];
    const b = right.exercisesCompleted[id];
    if (!a || !b) {
      exercisesCompleted[id] = a ?? b;
      continue;
    }
    exercisesCompleted[id] = {
      ...a,
      completed: a.completed || b.completed,
      score: Math.max(a.score ?? -1, b.score ?? -1) < 0
        ? null
        : Math.max(a.score ?? -1, b.score ?? -1),
      attempts: Math.max(a.attempts, b.attempts),
      completedAt: latestIso(a.completedAt, b.completedAt),
      skipped: a.skipped || b.skipped,
      summary: pickSummary(a, b),
    };
  }

  return {
    sectionsRead: Array.from(new Set([...left.sectionsRead, ...right.sectionsRead])),
    quizScore: preferRemoteQuiz ? right.quizScore : left.quizScore,
    quizTotal: preferRemoteQuiz ? right.quizTotal : left.quizTotal,
    completed: left.completed || right.completed,
    exercisesCompleted,
  };
}

function mergeWorkshopQuiz(
  local: UnifiedWorkshopQuiz,
  remote: UnifiedWorkshopQuiz,
): UnifiedWorkshopQuiz {
  return {
    passed: local.passed || remote.passed,
    score: Math.max(local.score, remote.score),
    completedAt: latestIso(local.completedAt, remote.completedAt),
  };
}

/**
 * Merge one course's slice. Exported so the per-course-row
 * persistence layer (server-store.ts) can merge a single DB row without
 * touching every other course's row.
 */
export function mergeCourseSlice(
  local: UnifiedCourseSlice | undefined,
  remote: UnifiedCourseSlice | undefined,
): UnifiedCourseSlice | undefined {
  if (!local) return remote;
  if (!remote) return local;
  const lessonIds = new Set([
    ...Object.keys(local.lessons),
    ...Object.keys(remote.lessons),
  ]);
  const lessons: Record<string, UnifiedLessonProgress> = {};
  for (const id of lessonIds) {
    lessons[id] = mergeLesson(local.lessons[id], remote.lessons[id]);
  }

  return {
    lessons,
    workshopQuiz: mergeWorkshopQuiz(local.workshopQuiz, remote.workshopQuiz),
    capstoneSubmitted: local.capstoneSubmitted || remote.capstoneSubmitted,
    startedAt: earliestIso(local.startedAt, remote.startedAt) ?? local.startedAt,
    lastActivity: latestIso(local.lastActivity, remote.lastActivity) ?? local.lastActivity,
  };
}

function mergeStreak(local: UnifiedStreak, remote: UnifiedStreak): UnifiedStreak {
  if (remote.days > local.days) return remote;
  if (local.days > remote.days) return local;
  return {
    days: local.days,
    last: latestIso(local.last, remote.last),
  };
}

export function isUnifiedProgress(value: unknown): value is UnifiedProgress {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== UNIFIED_SCHEMA_VERSION) return false;
  return (
    isCourseRecord(value.courses) &&
    isFiniteNonNegativeNumber(value.xp) &&
    isBooleanRecord(value.checkpoints) &&
    isStringRecord(value.badges) &&
    isUnifiedStreak(value.streak) &&
    typeof value.lastActivity === "string"
  );
}

/**
 * Merge the cross-course ledger fields (the "_meta" DB row's payload).
 * Decomposed out of mergeUnifiedProgress so the per-row
 * persistence layer can merge this one row without touching any course row.
 */
export function mergeMetaFields(
  local: UnifiedMetaFields,
  remote: UnifiedMetaFields,
): UnifiedMetaFields {
  return {
    xp: Math.max(local.xp, remote.xp),
    checkpoints: { ...remote.checkpoints, ...local.checkpoints },
    badges: { ...remote.badges, ...local.badges },
    streak: mergeStreak(local.streak, remote.streak),
    lastActivity:
      latestIso(local.lastActivity, remote.lastActivity) ?? new Date().toISOString(),
  };
}

export function mergeUnifiedProgress(
  local: UnifiedProgress,
  remote: UnifiedProgress,
): UnifiedProgress {
  const courseIds = new Set([
    ...Object.keys(local.courses),
    ...Object.keys(remote.courses),
  ]);
  const courses: UnifiedProgress["courses"] = {};
  for (const id of courseIds) {
    courses[id as keyof UnifiedProgress["courses"]] = mergeCourseSlice(
      local.courses[id as keyof UnifiedProgress["courses"]],
      remote.courses[id as keyof UnifiedProgress["courses"]],
    );
  }

  const meta = mergeMetaFields(local, remote);

  // v2->v3 migration step, wired into this real read path:
  // any exercise summary carried over from a payload that predates the byte
  // cap gets re-normalized here, so a merge can never produce a result that
  // violates the per-row DB size constraint.
  return truncateExerciseSummaries({
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses,
    ...meta,
  });
}
