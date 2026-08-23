import type {
  UnifiedCourseSlice,
  UnifiedExerciseResult,
  UnifiedLessonProgress,
  UnifiedProgress,
  UnifiedStreak,
  UnifiedWorkshopQuiz,
} from "./types";
import {
  MAX_EXERCISE_SUMMARY_BYTES,
  UNIFIED_SCHEMA_VERSION,
  XP,
  normalizeWorkshopQuizScore,
  truncateToByteLength,
} from "./types";
import { truncateExerciseSummaries } from "./migrate";
import {
  COURSE_SLUGS as CANONICAL_COURSE_SLUGS,
  type CourseSlug,
} from "@/lib/course/types";
import {
  getCanonicalSectionIds,
  isCanonicalLessonId,
  isCanonicalSectionId,
} from "@/lib/courses/completion";
import { getCourseProjectIdentity } from "@/lib/course-projects/identity";
import { hasValidCourseProjectArtifact } from "@/lib/course-projects/persistence";

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

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/u.exec(
      value,
    );
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[10] ?? 0);
  const offsetMinute = Number(match[11] ?? 0);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function isTimestampRecord(value: unknown): value is Readonly<Record<string, string>> {
  return isRecord(value) && Object.values(value).every(isIsoTimestamp);
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
    (value.completedAt === null || isIsoTimestamp(value.completedAt)) &&
    typeof value.skipped === "boolean" &&
    (value.summary === undefined ||
      (typeof value.summary === "string" &&
        new TextEncoder().encode(value.summary).length <=
          MAX_EXERCISE_SUMMARY_BYTES))
  );
}

function isExerciseResultRecord(
  value: unknown,
): value is Readonly<Record<string, UnifiedExerciseResult>> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, item]) =>
        isUnifiedExerciseResult(item) && item.exerciseId === key,
    )
  );
}

function hasOnlyValidCourseProjectResults(
  slug: CourseSlug,
  lessonId: string,
  exercises: Readonly<Record<string, UnifiedExerciseResult>>,
): boolean {
  const identity = getCourseProjectIdentity(slug);
  const expectedKind = `course-project-${identity.engineKind}`;

  return Object.entries(exercises).every(([exerciseId, result]) => {
    const usesReservedId = exerciseId === identity.id;
    const usesProjectKind = result.kind.startsWith("course-project-");
    if (!usesReservedId && !usesProjectKind) return true;

    return (
      lessonId === identity.progressLessonId &&
      usesReservedId &&
      result.exerciseId === identity.id &&
      result.kind === expectedKind &&
      hasValidCourseProjectArtifact(result.summary, identity.engineKind, slug)
    );
  });
}

function isUnifiedLessonProgress(value: unknown): value is UnifiedLessonProgress {
  return (
    isRecord(value) &&
    isStringArray(value.sectionsRead) &&
    (value.quizScore === null ||
      (isFiniteNonNegativeNumber(value.quizScore) && value.quizScore <= 1)) &&
    (value.quizTotal === null || isFiniteNonNegativeNumber(value.quizTotal)) &&
    typeof value.completed === "boolean" &&
    isExerciseResultRecord(value.exercisesCompleted)
  );
}

function isLessonProgressRecord(
  value: unknown,
  slug?: CourseSlug,
): value is Readonly<Record<string, UnifiedLessonProgress>> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([lessonId, lesson]) => {
    if (!isUnifiedLessonProgress(lesson)) return false;
    if (!slug) return true;
    if (!isCanonicalLessonId(slug, lessonId)) return false;
    if (new Set(lesson.sectionsRead).size !== lesson.sectionsRead.length) {
      return false;
    }
    return (
      lesson.sectionsRead.every((sectionId) =>
        isCanonicalSectionId(slug, lessonId, sectionId),
      ) &&
      hasOnlyValidCourseProjectResults(
        slug,
        lessonId,
        lesson.exercisesCompleted,
      )
    );
  });
}

function isUnifiedWorkshopQuiz(value: unknown): value is UnifiedWorkshopQuiz {
  return (
    isRecord(value) &&
    typeof value.passed === "boolean" &&
    isFiniteNonNegativeNumber(value.score) &&
    value.score <= 1 &&
    isStringOrNull(value.completedAt) &&
    (value.completedAt === null || isIsoTimestamp(value.completedAt))
  );
}

export function isUnifiedCourseSlice(
  value: unknown,
  slug?: CourseSlug,
): value is UnifiedCourseSlice {
  return (
    isRecord(value) &&
    isLessonProgressRecord(value.lessons, slug) &&
    isUnifiedWorkshopQuiz(value.workshopQuiz) &&
    typeof value.capstoneSubmitted === "boolean" &&
    isIsoTimestamp(value.startedAt) &&
    isIsoTimestamp(value.lastActivity) &&
    (value.resetAt === undefined || isIsoTimestamp(value.resetAt))
  );
}

function isCourseRecord(
  value: unknown,
): value is Partial<Record<keyof UnifiedProgress["courses"], UnifiedCourseSlice>> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, course]) =>
        COURSE_SLUGS.has(key) &&
        isUnifiedCourseSlice(course, key as CourseSlug),
    )
  );
}

function isUnifiedStreak(value: unknown): value is UnifiedStreak {
  return (
    isRecord(value) &&
    typeof value.days === "number" &&
    Number.isInteger(value.days) &&
    value.days >= 0 &&
    isStringOrNull(value.last) &&
    (value.last === null ||
      (/^\d{4}-\d{2}-\d{2}$/u.test(value.last) &&
        isIsoTimestamp(`${value.last}T00:00:00.000Z`)))
  );
}

/** Row-shape validator for the "_meta" DB row. */
export function isUnifiedMetaFields(value: unknown): value is UnifiedMetaFields {
  return (
    isRecord(value) &&
    isFiniteNonNegativeNumber(value.xp) &&
    isBooleanRecord(value.checkpoints) &&
    isTimestampRecord(value.badges) &&
    isUnifiedStreak(value.streak) &&
    isIsoTimestamp(value.lastActivity)
  );
}

function latestIso(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  const aTime = Date.parse(a);
  const bTime = Date.parse(b);
  if (aTime !== bTime) return aTime > bTime ? a : b;
  return a >= b ? a : b;
}

function earliestIso(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  const aTime = Date.parse(a);
  const bTime = Date.parse(b);
  if (aTime !== bTime) return aTime < bTime ? a : b;
  return a <= b ? a : b;
}

function normalizedScore(score: number | null, total: number | null): number {
  if (score === null || total === null || total <= 0) return -1;
  return score;
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
  const leftScore = normalizedScore(left.quizScore, left.quizTotal);
  const rightScore = normalizedScore(right.quizScore, right.quizTotal);
  const preferRemoteQuiz =
    rightScore > leftScore ||
    (rightScore === leftScore &&
      (right.quizTotal ?? -1) > (left.quizTotal ?? -1));
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
      exerciseId: id,
      kind: a.kind === b.kind ? a.kind : [a.kind, b.kind].sort()[0],
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
    sectionsRead: Array.from(
      new Set([...left.sectionsRead, ...right.sectionsRead]),
    ).sort(),
    quizScore: preferRemoteQuiz ? right.quizScore : left.quizScore,
    quizTotal: preferRemoteQuiz ? right.quizTotal : left.quizTotal,
    completed: left.completed || right.completed,
    exercisesCompleted,
  };
}

function truncateCourseSlice(slice: UnifiedCourseSlice): UnifiedCourseSlice {
  const lessons: Record<string, UnifiedLessonProgress> = {};
  for (const [lessonId, lesson] of Object.entries(slice.lessons)) {
    const exercisesCompleted: Record<string, UnifiedExerciseResult> = {};
    for (const [exerciseId, result] of Object.entries(
      lesson.exercisesCompleted,
    )) {
      exercisesCompleted[exerciseId] =
        result.summary === undefined
          ? result
          : {
              ...result,
              summary: truncateToByteLength(
                result.summary,
                MAX_EXERCISE_SUMMARY_BYTES,
              ),
            };
    }
    lessons[lessonId] = { ...lesson, exercisesCompleted };
  }
  return {
    ...slice,
    lessons,
    workshopQuiz: {
      ...slice.workshopQuiz,
      score: normalizeWorkshopQuizScore(slice.workshopQuiz.score) ?? 0,
    },
  };
}

function mergeWorkshopQuiz(
  local: UnifiedWorkshopQuiz,
  remote: UnifiedWorkshopQuiz,
): UnifiedWorkshopQuiz {
  return {
    passed: local.passed || remote.passed,
    score: Math.max(
      normalizeWorkshopQuizScore(local.score) ?? 0,
      normalizeWorkshopQuizScore(remote.score) ?? 0,
    ),
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
  const resetAt = latestIso(local?.resetAt, remote?.resetAt);
  if (resetAt) {
    if (local?.resetAt !== resetAt) local = undefined;
    if (remote?.resetAt !== resetAt) remote = undefined;
  }
  if (!local) return remote ? truncateCourseSlice(remote) : undefined;
  if (!remote) return truncateCourseSlice(local);
  const lessonIds = new Set([
    ...Object.keys(local.lessons),
    ...Object.keys(remote.lessons),
  ]);
  const lessons: Record<string, UnifiedLessonProgress> = {};
  for (const id of lessonIds) {
    lessons[id] = mergeLesson(local.lessons[id], remote.lessons[id]);
  }

  return truncateCourseSlice({
    lessons,
    workshopQuiz: mergeWorkshopQuiz(local.workshopQuiz, remote.workshopQuiz),
    capstoneSubmitted: local.capstoneSubmitted || remote.capstoneSubmitted,
    startedAt: earliestIso(local.startedAt, remote.startedAt) ?? local.startedAt,
    lastActivity: latestIso(local.lastActivity, remote.lastActivity) ?? local.lastActivity,
    ...(resetAt ? { resetAt } : {}),
  });
}

function mergeStreak(local: UnifiedStreak, remote: UnifiedStreak): UnifiedStreak {
  if (!local.last) return remote.last ? remote : { days: Math.max(local.days, remote.days), last: null };
  if (!remote.last) return local;
  if (local.last !== remote.last) {
    return local.last > remote.last ? local : remote;
  }
  return {
    days: Math.max(local.days, remote.days),
    last: local.last,
  };
}

/**
 * XP is an index over immutable achievements, not an independent counter.
 * Recomputing its earned floor makes disjoint multi-device achievements
 * additive without introducing a new per-device counter schema. A larger
 * legacy XP value is still preserved by callers.
 */
export function calculateEarnedXp(progress: UnifiedProgress): number {
  let sections = 0;
  let lessons = 0;
  let passedWorkshopQuizzes = 0;
  for (const slug of CANONICAL_COURSE_SLUGS) {
    const course = progress.courses[slug];
    if (!course) continue;
    for (const lessonId of Object.keys(course.lessons)) {
      if (!isCanonicalLessonId(slug, lessonId)) continue;
      const lesson = course.lessons[lessonId];
      const canonicalSections = new Set(
        getCanonicalSectionIds(slug, lessonId),
      );
      sections += new Set(
        lesson.sectionsRead.filter((sectionId) =>
          canonicalSections.has(sectionId),
        ),
      ).size;
      if (lesson.completed) lessons += 1;
    }
    if (course.workshopQuiz.passed) passedWorkshopQuizzes += 1;
  }
  const checkpoints = Object.values(progress.checkpoints).filter(Boolean).length;
  return (
    sections * XP.SECTION +
    lessons * XP.LESSON +
    checkpoints * XP.CHECKPOINT +
    passedWorkshopQuizzes * XP.QUIZ_PASS
  );
}

export function isUnifiedProgress(value: unknown): value is UnifiedProgress {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== UNIFIED_SCHEMA_VERSION) return false;
  return (
    isCourseRecord(value.courses) &&
    isFiniteNonNegativeNumber(value.xp) &&
    isBooleanRecord(value.checkpoints) &&
    isTimestampRecord(value.badges) &&
    isUnifiedStreak(value.streak) &&
    isIsoTimestamp(value.lastActivity)
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
  const checkpointKeys = new Set([
    ...Object.keys(local.checkpoints),
    ...Object.keys(remote.checkpoints),
  ]);
  const checkpoints: Record<string, boolean> = {};
  for (const key of [...checkpointKeys].sort()) {
    checkpoints[key] =
      local.checkpoints[key] === true || remote.checkpoints[key] === true;
  }

  const badgeIds = new Set([
    ...Object.keys(local.badges),
    ...Object.keys(remote.badges),
  ]);
  const badges: Record<string, string> = {};
  for (const id of [...badgeIds].sort()) {
    const awardedAt = earliestIso(local.badges[id], remote.badges[id]);
    if (awardedAt) badges[id] = awardedAt;
  }

  return {
    xp: Math.max(local.xp, remote.xp),
    checkpoints,
    badges,
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
  const merged = truncateExerciseSummaries({
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses,
    ...meta,
  });
  return {
    ...merged,
    xp: Math.max(merged.xp, calculateEarnedXp(merged)),
  };
}
