// ─── Unified progress store (shared course architecture) ──
//
// ONE store across all three courses. In-memory cache + cross-tab `storage`
// sync. On first read it loads `loehrning-progress-v2`; if absent, it forward-
// migrates the two legacy schemas (NEVER wipes, R1) and persists the result.
//
// xp / streak / badges / checkpoints are cross-course. Per-course read/write
// helpers back the legacy `lib/course/progress.ts` + `lib/ai-native/progress.ts`
// facades, so existing consumers keep their API while sharing one store.

import type { CourseSlug } from "@/lib/course/types";
import {
  MAX_EXERCISE_SUMMARY_BYTES,
  UNIFIED_SCHEMA_VERSION,
  UNIFIED_STORAGE_KEY,
  XP,
  checkpointKey,
  truncateToByteLength,
  type UnifiedCourseSlice,
  type UnifiedExerciseResult,
  type UnifiedLessonProgress,
  type UnifiedProgress,
} from "./types";
import { ALL_COURSE_CATALOG, COURSE_CATALOG } from "@/lib/courses/catalog";
import { computeNewlyEarnedBadges } from "./badges";
import {
  freshUnified,
  migrateLegacyToUnified,
  truncateExerciseSummaries,
} from "./migrate";

// ─── In-memory cache + cross-tab sync ──────────────────────────

let cache: UnifiedProgress | null = null;
let storageListenerInstalled = false;
const listeners = new Set<(s: UnifiedProgress) => void>();

function emit(state: UnifiedProgress): void {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      // a misbehaving subscriber must never break the store
    }
  });
}

/** Subscribe to store changes (local writes + cross-tab). Returns unsubscribe. */
export function subscribe(fn: (s: UnifiedProgress) => void): () => void {
  listeners.add(fn);
  fn(getState());
  return () => {
    listeners.delete(fn);
  };
}

function installStorageListener(): void {
  if (storageListenerInstalled || typeof window === "undefined") return;
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== UNIFIED_STORAGE_KEY) return;
    cache = null;
    emit(getState());
  });
  storageListenerInstalled = true;
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function freshSlice(): UnifiedCourseSlice {
  const now = nowIso();
  return {
    lessons: {},
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: now,
    lastActivity: now,
  };
}

function defaultLesson(): UnifiedLessonProgress {
  return {
    sectionsRead: [],
    quizScore: null,
    quizTotal: null,
    completed: false,
    exercisesCompleted: {},
  };
}

// ─── Load / persist ────────────────────────────────────────────

function parseUnified(raw: string): UnifiedProgress | null {
  try {
    const parsed = JSON.parse(raw) as Partial<UnifiedProgress>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.courses === "object" &&
      parsed.courses !== null
    ) {
      // Fill in any fields a slightly-older v2 payload might miss, then run
      // the v2->v3 migration step: any exercise summary written before
      // MAX_EXERCISE_SUMMARY_BYTES existed gets re-normalized here so it can
      // never violate the new per-row DB size constraint on next sync.
      return truncateExerciseSummaries({
        schemaVersion: UNIFIED_SCHEMA_VERSION,
        courses: parsed.courses ?? {},
        xp: typeof parsed.xp === "number" ? parsed.xp : 0,
        checkpoints: parsed.checkpoints ?? {},
        badges: parsed.badges ?? {},
        streak: parsed.streak ?? { days: 0, last: null },
        lastActivity:
          typeof parsed.lastActivity === "string"
            ? parsed.lastActivity
            : nowIso(),
      });
    }
  } catch {
    // corrupt unified payload — fall through to migration (never wipe)
  }
  return null;
}

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(UNIFIED_STORAGE_KEY);
  } catch {
    return null;
  }
}

function load(): UnifiedProgress {
  if (typeof window === "undefined") return freshUnified();
  installStorageListener();
  const raw = readRaw();
  if (raw) {
    const parsed = parseUnified(raw);
    if (parsed) return parsed;
    // Corrupt unified payload: recover what we can from legacy keys instead
    // of wiping. The corrupt v2 blob is left in place for forensic recovery.
    console.warn(
      "[progress.store] unified payload unreadable; recovering from legacy keys (not wiped).",
    );
  }
  // No (valid) unified payload yet — forward-migrate the legacy schemas.
  const migrated = migrateLegacyToUnified();
  persist(migrated); // write the migrated shape so future reads are fast
  return migrated;
}

function persist(state: UnifiedProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — state stays in memory for this session
  }
}

function getState(): UnifiedProgress {
  if (cache) return cache;
  cache = bumpStreak(load());
  return cache;
}

/** Persist + cache + notify. Always stamps lastActivity. */
function commit(next: UnifiedProgress): UnifiedProgress {
  const stamped: UnifiedProgress = { ...next, lastActivity: nowIso() };
  cache = stamped;
  persist(stamped);
  emit(stamped);
  return stamped;
}

/** Replace the local cache from a trusted sync payload without awarding XP. */
export function replaceUnifiedState(next: UnifiedProgress): void {
  cache = next;
  persist(next);
  emit(next);
}

// ─── Streak (daily-visit) ──────────────────────────────────────

/** Pure streak roll-forward. Increments on a consecutive day, resets on a gap. */
export function rollStreak(
  streak: UnifiedProgress["streak"],
  today: string,
): UnifiedProgress["streak"] {
  if (streak.last === today) return streak;
  const yesterday = new Date(Date.parse(today) - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const days = streak.last === yesterday ? streak.days + 1 : 1;
  return { days, last: today };
}

function bumpStreak(state: UnifiedProgress): UnifiedProgress {
  if (typeof window === "undefined") return state; // SSR: no streak side effect
  const next = rollStreak(state.streak, todayKey());
  if (next === state.streak) return state;
  const updated: UnifiedProgress = { ...state, streak: next };
  persist(updated);
  return updated;
}

// ─── XP + badges ───────────────────────────────────────────────

function totalLessonsCompleted(state: UnifiedProgress): number {
  let n = 0;
  for (const course of COURSE_CATALOG) {
    const slice = state.courses[course.slug];
    if (!slice) continue;
    for (const lesson of Object.values(slice.lessons)) {
      if (lesson.completed) n += 1;
    }
  }
  return n;
}

/** Add XP and award any newly-qualified badges (immutable). Returns next state. */
function applyXpAndBadges(state: UnifiedProgress, deltaXp: number): UnifiedProgress {
  const xp = state.xp + deltaXp;
  const lessonsDone = totalLessonsCompleted(state);
  const newBadges = computeNewlyEarnedBadges(state, lessonsDone);
  if (newBadges.length === 0) {
    return { ...state, xp };
  }
  const ts = nowIso();
  const badges = { ...state.badges };
  for (const id of newBadges) badges[id] = ts;
  return { ...state, xp, badges };
}

// ─── Per-course slice access ───────────────────────────────────

function sliceOf(state: UnifiedProgress, slug: CourseSlug): UnifiedCourseSlice {
  return state.courses[slug] ?? freshSlice();
}

function withSlice(
  state: UnifiedProgress,
  slug: CourseSlug,
  slice: UnifiedCourseSlice,
): UnifiedProgress {
  return {
    ...state,
    courses: {
      ...state.courses,
      [slug]: { ...slice, lastActivity: nowIso() },
    },
  };
}

function lessonOf(slice: UnifiedCourseSlice, lessonId: string): UnifiedLessonProgress {
  return slice.lessons[lessonId] ?? defaultLesson();
}

// ─── Public read API (used by the two legacy facades + UI) ─────

export function getUnifiedState(): UnifiedProgress {
  return getState();
}

export function getCourseSlice(slug: CourseSlug): UnifiedCourseSlice {
  return sliceOf(getState(), slug);
}

export function getLesson(slug: CourseSlug, lessonId: string): UnifiedLessonProgress {
  return lessonOf(getCourseSlice(slug), lessonId);
}

// ─── Section progress ──────────────────────────────────────────

export function markSectionRead(
  slug: CourseSlug,
  lessonId: string,
  sectionId: string,
): void {
  const state = getState();
  const slice = sliceOf(state, slug);
  const lesson = lessonOf(slice, lessonId);
  if (lesson.sectionsRead.includes(sectionId)) return;
  const nextLesson: UnifiedLessonProgress = {
    ...lesson,
    sectionsRead: [...lesson.sectionsRead, sectionId],
  };
  const withSection = withSlice(state, slug, {
    ...slice,
    lessons: { ...slice.lessons, [lessonId]: nextLesson },
  });
  commit(applyXpAndBadges(withSection, XP.SECTION));
}

export function isSectionRead(
  slug: CourseSlug,
  lessonId: string,
  sectionId: string,
): boolean {
  return getLesson(slug, lessonId).sectionsRead.includes(sectionId);
}

export function getReadSectionIds(
  slug: CourseSlug,
  lessonId: string,
): ReadonlySet<string> {
  return new Set(getLesson(slug, lessonId).sectionsRead);
}

// ─── Lesson completion ─────────────────────────────────────────

export function markLessonCompleted(slug: CourseSlug, lessonId: string): void {
  const state = getState();
  const slice = sliceOf(state, slug);
  const lesson = lessonOf(slice, lessonId);
  if (lesson.completed) return;
  const withLesson = withSlice(state, slug, {
    ...slice,
    lessons: { ...slice.lessons, [lessonId]: { ...lesson, completed: true } },
  });
  commit(applyXpAndBadges(withLesson, XP.LESSON));
}

export function isLessonCompleted(slug: CourseSlug, lessonId: string): boolean {
  return getLesson(slug, lessonId).completed;
}

export function getCompletedLessonIds(slug: CourseSlug): ReadonlySet<string> {
  const slice = getCourseSlice(slug);
  return new Set(
    Object.entries(slice.lessons)
      .filter(([, v]) => v.completed)
      .map(([k]) => k),
  );
}

export function getCompletedLessonsCount(slug: CourseSlug): number {
  return Object.values(getCourseSlice(slug).lessons).filter((l) => l.completed)
    .length;
}

// ─── Lesson quiz scores ────────────────────────────────────────

export function saveLessonQuizScore(
  slug: CourseSlug,
  lessonId: string,
  score: number,
  total: number,
): void {
  if (total <= 0) return;
  const state = getState();
  const slice = sliceOf(state, slug);
  const lesson = lessonOf(slice, lessonId);
  const normalizedNew = score / total;
  if (normalizedNew <= (lesson.quizScore ?? -1)) return;
  commit(
    withSlice(state, slug, {
      ...slice,
      lessons: {
        ...slice.lessons,
        [lessonId]: { ...lesson, quizScore: normalizedNew, quizTotal: total },
      },
    }),
  );
}

export function getLessonQuizScore(
  slug: CourseSlug,
  lessonId: string,
): { score: number; total: number } | null {
  const lesson = getLesson(slug, lessonId);
  if (lesson.quizScore != null && lesson.quizTotal != null) {
    return {
      score: Math.round(lesson.quizScore * lesson.quizTotal),
      total: lesson.quizTotal,
    };
  }
  return null;
}

// ─── Exercise results (AI-Native + future widget courses) ──────

export function saveExerciseResult(
  slug: CourseSlug,
  lessonId: string,
  result: UnifiedExerciseResult,
): void {
  const state = getState();
  const slice = sliceOf(state, slug);
  const lesson = lessonOf(slice, lessonId);
  const prev = lesson.exercisesCompleted[result.exerciseId];
  const merged: UnifiedExerciseResult = {
    ...result,
    attempts: (prev?.attempts ?? 0) + 1,
    score:
      prev?.score != null && result.score != null
        ? Math.max(prev.score, result.score)
        : (result.score ?? prev?.score ?? null),
    completed: (prev?.completed ?? false) || result.completed,
    // Byte-cap (not char-cap) at write time: the DB's per-row size budget is
    // byte-based, and German umlauts/ß are 2 bytes each.
    summary:
      result.summary !== undefined
        ? truncateToByteLength(result.summary, MAX_EXERCISE_SUMMARY_BYTES)
        : result.summary,
  };
  commit(
    withSlice(state, slug, {
      ...slice,
      lessons: {
        ...slice.lessons,
        [lessonId]: {
          ...lesson,
          exercisesCompleted: {
            ...lesson.exercisesCompleted,
            [result.exerciseId]: merged,
          },
        },
      },
    }),
  );
}

export function getExerciseResult(
  slug: CourseSlug,
  lessonId: string,
  exerciseId: string,
): UnifiedExerciseResult | undefined {
  return getLesson(slug, lessonId).exercisesCompleted[exerciseId];
}

export function isExerciseCompleted(
  slug: CourseSlug,
  lessonId: string,
  exerciseId: string,
): boolean {
  return getExerciseResult(slug, lessonId, exerciseId)?.completed ?? false;
}

// ─── Workshop quiz ─────────────────────────────────────────────

export function saveWorkshopQuizResult(
  slug: CourseSlug,
  score: number,
  passed: boolean,
): void {
  const state = getState();
  const slice = sliceOf(state, slug);
  const alreadyPassed = slice.workshopQuiz.passed;
  const withQuiz = withSlice(state, slug, {
    ...slice,
    workshopQuiz: { passed, score, completedAt: nowIso() },
  });
  // Award the quiz-pass XP only on the first pass.
  commit(passed && !alreadyPassed ? applyXpAndBadges(withQuiz, XP.QUIZ_PASS) : withQuiz);
}

export function getWorkshopQuizResult(slug: CourseSlug): {
  passed: boolean;
  score: number;
  completedAt: string | null;
} {
  return getCourseSlice(slug).workshopQuiz;
}

export function isWorkshopQuizPassed(slug: CourseSlug): boolean {
  return getCourseSlice(slug).workshopQuiz.passed;
}

// ─── Capstone (AI-Native) ──────────────────────────────────────

export function markCapstoneSubmitted(slug: CourseSlug): void {
  const state = getState();
  const slice = sliceOf(state, slug);
  if (slice.capstoneSubmitted) return;
  commit(withSlice(state, slug, { ...slice, capstoneSubmitted: true }));
}

export function isCapstoneSubmitted(slug: CourseSlug): boolean {
  return getCourseSlice(slug).capstoneSubmitted;
}

/**
 * Certificate eligibility (shared course architecture; fallback performance hardening).
 *
 * Three equally valid paths: workshop quiz passed, capstone submitted
 * (AI-Native only), or every catalog lesson of the course completed. The
 * completion fallback covers learners with fully worked-through courses whose
 * quiz state was lost or migrated. Never throws: corrupted storage reads as
 * not-eligible instead of crashing the zertifikat page.
 */
export function isCertificateEligible(slug: CourseSlug): boolean {
  try {
    const slice = getCourseSlice(slug);
    if (slice.workshopQuiz.passed || slice.capstoneSubmitted) return true;
    // ALL_COURSE_CATALOG (native + imported), not COURSE_CATALOG alone: a
    // course outside the 4-course native spine (e.g. once it wires up
    // progress tracking) must be able to reach this fallback too, instead
    // of silently resolving totalLessons as undefined.
    const total = ALL_COURSE_CATALOG.find((c) => c.slug === slug)?.totalLessons;
    if (!total) return false;
    let done = 0;
    for (const lesson of Object.values(slice.lessons)) {
      if (lesson.completed) done += 1;
    }
    return done >= total;
  } catch {
    return false;
  }
}

// ─── Checkpoints (cross-course gamification, backs useCheckpoint) ──

export function isCheckpointDone(lessonId: string, cpId: string): boolean {
  return getState().checkpoints[checkpointKey(lessonId, cpId)] === true;
}

/**
 * Mark a checkpoint complete. Idempotent: a second call is a no-op and awards
 * no extra XP. Returns true only on the first completion.
 */
export function completeCheckpoint(lessonId: string, cpId: string): boolean {
  const state = getState();
  const key = checkpointKey(lessonId, cpId);
  if (state.checkpoints[key]) return false;
  const withCp: UnifiedProgress = {
    ...state,
    checkpoints: { ...state.checkpoints, [key]: true },
  };
  commit(applyXpAndBadges(withCp, XP.CHECKPOINT));
  return true;
}

// ─── XP + badges read API ──────────────────────────────────────

export function getXp(): number {
  return getState().xp;
}

export function getStreak(): UnifiedProgress["streak"] {
  return getState().streak;
}

export function getEarnedBadgeIds(): readonly string[] {
  return Object.keys(getState().badges);
}

export function getTotalCompletedLessons(): number {
  return totalLessonsCompleted(getState());
}

// ─── Aggregate progress ────────────────────────────────────────

export function getBlockCompletedLessons(
  slug: CourseSlug,
  lessonIds: readonly string[],
): number {
  const slice = getCourseSlice(slug);
  return lessonIds.filter((id) => slice.lessons[id]?.completed).length;
}

export function areAllBlockLessonsCompleted(
  slug: CourseSlug,
  lessonIds: readonly string[],
): boolean {
  if (lessonIds.length === 0) return false;
  const slice = getCourseSlice(slug);
  return lessonIds.every((id) => slice.lessons[id]?.completed);
}

export function getOverallProgress(slug: CourseSlug, totalLessons: number): number {
  if (totalLessons === 0) return 0;
  return Math.round((getCompletedLessonsCount(slug) / totalLessons) * 100);
}

// ─── Reset ─────────────────────────────────────────────────────

/** Reset a single course slice (keeps other courses + xp/streak/badges). */
export function resetCourse(slug: CourseSlug): void {
  const state = getState();
  const courses = { ...state.courses };
  delete courses[slug];
  commit({ ...state, courses });
}

/** Reset the entire unified store (all courses + gamification). */
export function resetAll(): void {
  commit(freshUnified());
}

// ─── Test-only helpers ─────────────────────────────────────────

/** Internal: drop the in-memory cache so the next read re-loads from storage. */
export function __resetCacheForTests(): void {
  cache = null;
}
