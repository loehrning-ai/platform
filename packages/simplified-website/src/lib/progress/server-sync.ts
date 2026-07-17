import type {
  UnifiedCourseSlice,
  UnifiedExerciseResult,
  UnifiedLessonProgress,
  UnifiedProgress,
  UnifiedStreak,
  UnifiedWorkshopQuiz,
} from "./types";
import { UNIFIED_SCHEMA_VERSION } from "./types";

const COURSE_SLUGS = new Set(["ki-fuehrerschein", "eu-ai-act-kurs", "ai-native"]);

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

function isUnifiedCourseSlice(value: unknown): value is UnifiedCourseSlice {
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

function mergeCourseSlice(
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

  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses,
    xp: Math.max(local.xp, remote.xp),
    checkpoints: { ...remote.checkpoints, ...local.checkpoints },
    badges: { ...remote.badges, ...local.badges },
    streak: mergeStreak(local.streak, remote.streak),
    lastActivity:
      latestIso(local.lastActivity, remote.lastActivity) ?? new Date().toISOString(),
  };
}
