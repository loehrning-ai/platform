// ─── Unified progress store (shared course architecture) ──
//
// ONE store across all three courses. In-memory cache + cross-tab `storage`
// sync. On first read it loads `loehrning-progress-v2`; if absent, it forward-
// migrates the two legacy schemas (NEVER wipes, R1) and persists the result.
//
// xp / streak / badges / checkpoints are cross-course. Per-course read/write
// helpers back the legacy `lib/course/progress.ts` + `lib/ai-native/progress.ts`
// facades, so existing consumers keep their API while sharing one store.

import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import {
  MAX_EXERCISE_SUMMARY_BYTES,
  UNIFIED_SCHEMA_VERSION,
  UNIFIED_STORAGE_KEY,
  XP,
  checkpointKey,
  normalizeWorkshopQuizScore,
  truncateToByteLength,
  type UnifiedCourseSlice,
  type UnifiedExerciseResult,
  type UnifiedLessonProgress,
  type UnifiedProgress,
} from "./types";
import {
  CANONICAL_LESSON_IDS,
  completedCanonicalLessonCount,
  isCanonicalLessonId,
  isCanonicalSectionId,
  isCourseCompletionEarned,
  normalizeCanonicalProgress,
} from "@/lib/courses/completion";
import { hasAppliedProjectCompletion } from "@/lib/course-projects/identity";
import {
  getCourseProjectDraftStorageKey,
  getLessonMissionStorageKey,
} from "@/lib/course-projects/storage-keys";
import { computeNewlyEarnedBadges } from "./badges";
import {
  freshUnified,
  LEGACY_AI_NATIVE_KEY,
  LEGACY_COURSE_KEY_PREFIX,
  LEGACY_KI_F_FLAT_KEY,
  migrateLegacyToUnified,
  truncateExerciseSummaries,
  normalizeWorkshopQuizScores,
} from "./migrate";
import {
  __resetLearningOwnerForTests,
  activateAccountLearningOwner,
  activateAnonymousLearningOwner,
  clearAccountLearningStorage,
  continueWithAnonymousLearningOwner,
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
  ownedLearningStorageKey,
  removeOwnedLocalLearningItem,
  setUnknownLearningOwner,
  setOwnedLocalLearningItem,
} from "./browser-learning-storage";
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

/**
 * Subscribe only to future writes. Sync code uses this after reading its own
 * initial snapshot so registration does not schedule a redundant server PUT.
 */
export function subscribeChanges(fn: (s: UnifiedProgress) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function installStorageListener(): void {
  if (storageListenerInstalled || typeof window === "undefined") return;
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== ownedLearningStorageKey(UNIFIED_STORAGE_KEY)) return;
    cache = null;
    emit(getState());
  });
  storageListenerInstalled = true;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
      return normalizeCanonicalProgress(
        normalizeWorkshopQuizScores(
          truncateExerciseSummaries({
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
          }),
        ),
      );
    }
  } catch {
    // corrupt unified payload — fall through to migration (never wipe)
  }
  return null;
}

function readRaw(): string | null {
  return getOwnedLocalLearningItem(UNIFIED_STORAGE_KEY);
}

function load(): UnifiedProgress {
  if (typeof window === "undefined") return freshUnified();
  installStorageListener();
  const raw = readRaw();
  if (raw) {
    const parsed = parseUnified(raw);
    if (parsed) {
      // Persist canonicalized active course slices once. Legacy/fabricated
      // lesson and section keys can no longer poison sync or inflate active
      // completion, while valid lesson/quiz/exercise data and the historical
      // cross-course ledger remain intact.
      persist(parsed);
      return parsed;
    }
    // Corrupt unified payload: recover what we can from legacy keys instead
    // of wiping. The corrupt v2 blob is left in place for forensic recovery.
    console.warn(
      "[progress.store] unified payload unreadable; recovering from legacy keys (not wiped).",
    );
  }
  // Historical browser progress has no trustworthy account identity. Keep it
  // in the anonymous namespace: assigning it to whichever account signs in
  // next would leak one learner's record into another learner's account.
  const migrated =
    getLearningOwnerContext().kind === "anonymous"
      ? normalizeCanonicalProgress(migrateLegacyToUnified())
      : freshUnified();
  persist(migrated); // write the migrated shape so future reads are fast
  return migrated;
}

function persist(state: UnifiedProgress): void {
  setOwnedLocalLearningItem(UNIFIED_STORAGE_KEY, JSON.stringify(state));
}

function persistDurably(state: UnifiedProgress): boolean {
  return setOwnedLocalLearningItem(UNIFIED_STORAGE_KEY, JSON.stringify(state));
}

function getState(): UnifiedProgress {
  if (cache) return cache;
  cache = bumpStreak(load());
  return cache;
}

/** Persist + cache + notify. Always stamps lastActivity. */
function commit(next: UnifiedProgress): UnifiedProgress {
  if (getLearningOwnerContext().kind === "unknown") {
    // Identity is unresolved, so this write cannot be attributed safely.
    // Never replay it into whichever account happens to verify next.
    return getState();
  }
  const stamped: UnifiedProgress = { ...next, lastActivity: nowIso() };
  cache = stamped;
  persist(stamped);
  emit(stamped);
  return stamped;
}

/** Replace the local cache from a trusted sync payload without awarding XP. */
export function replaceUnifiedState(next: UnifiedProgress): void {
  if (getLearningOwnerContext().kind === "unknown") return;
  const normalized = normalizeCanonicalProgress(
    normalizeWorkshopQuizScores(next),
  );
  cache = normalized;
  persist(normalized);
  emit(normalized);
}

export function getAccountProgressStorageKey(userId: string): string {
  return (
    ownedLearningStorageKey(UNIFIED_STORAGE_KEY, {
      kind: "account",
      accountId: userId,
      generation: 0,
    }) ?? UNIFIED_STORAGE_KEY
  );
}

function reloadActiveNamespace(): UnifiedProgress {
  cache = null;
  const state = getState();
  emit(state);
  return state;
}

/**
 * Select the local namespace for a server-verified account. This never copies
 * anonymous or another account's state into the target namespace.
 */
export function activateAccountProgress(userId: string): UnifiedProgress {
  const previous = getLearningOwnerContext();
  cache = null;
  const next = activateAccountLearningOwner(userId);
  if (next === previous) return getState();
  return reloadActiveNamespace();
}

/** Return to the persistent signed-out/offline namespace. */
export function activateAnonymousProgress(): UnifiedProgress {
  const previous = getLearningOwnerContext();
  if (previous.kind === "anonymous") return getState();
  cache = null;
  const next = activateAnonymousLearningOwner();
  if (next === previous) return getState();
  return reloadActiveNamespace();
}

/** Explicitly continue in the isolated local namespace for this page load. */
export function continueWithAnonymousProgress(): UnifiedProgress {
  const previous = getLearningOwnerContext();
  cache = null;
  const next = continueWithAnonymousLearningOwner();
  if (next === previous) return getState();
  return reloadActiveNamespace();
}

/**
 * Hide every persistent namespace while Auth identity is unresolved. Reads
 * return a fresh in-memory state and writes are discarded until verification
 * selects either the anonymous or one account namespace.
 */
export function activateUnknownProgress(): UnifiedProgress {
  const previous = getLearningOwnerContext();
  cache = null;
  const next = setUnknownLearningOwner();
  if (next === previous) return getState();
  return reloadActiveNamespace();
}

/** Active key for cross-tab consumers and development diagnostics. */
export function getActiveProgressStorageKey(): string | null {
  return ownedLearningStorageKey(UNIFIED_STORAGE_KEY);
}

export function isActiveProgressStorageKey(key: string | null): boolean {
  const activeKey = getActiveProgressStorageKey();
  return activeKey !== null && key === activeKey;
}

export function getActiveProgressAccountId(): string | null {
  const owner = getLearningOwnerContext();
  return owner.kind === "account" ? owner.accountId : null;
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
  const next = rollStreak(state.streak, localDateKey());
  if (next === state.streak) return state;
  const updated: UnifiedProgress = { ...state, streak: next };
  persist(updated);
  return updated;
}

// ─── XP + badges ───────────────────────────────────────────────

function totalLessonsCompleted(state: UnifiedProgress): number {
  return COURSE_SLUGS.reduce(
    (total, slug) => total + completedCanonicalLessonCount(state, slug),
    0,
  );
}

/** Add XP and award any newly-qualified badges (immutable). Returns next state. */
function applyXpAndBadges(
  state: UnifiedProgress,
  deltaXp: number,
): UnifiedProgress {
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

function lessonOf(
  slice: UnifiedCourseSlice,
  lessonId: string,
): UnifiedLessonProgress {
  return slice.lessons[lessonId] ?? defaultLesson();
}

// ─── Public read API (used by the two legacy facades + UI) ─────

export function getUnifiedState(): UnifiedProgress {
  return getState();
}

export function getCourseSlice(slug: CourseSlug): UnifiedCourseSlice {
  return sliceOf(getState(), slug);
}

export function getLesson(
  slug: CourseSlug,
  lessonId: string,
): UnifiedLessonProgress {
  return lessonOf(getCourseSlice(slug), lessonId);
}

// ─── Section progress ──────────────────────────────────────────

export function markSectionRead(
  slug: CourseSlug,
  lessonId: string,
  sectionId: string,
): void {
  if (
    !isCanonicalLessonId(slug, lessonId) ||
    !isCanonicalSectionId(slug, lessonId, sectionId)
  ) {
    return;
  }
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
  if (!isCanonicalLessonId(slug, lessonId)) return;
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
      .filter(
        ([lessonId, value]) =>
          isCanonicalLessonId(slug, lessonId) && value.completed,
      )
      .map(([k]) => k),
  );
}

export function getCompletedLessonsCount(slug: CourseSlug): number {
  return completedCanonicalLessonCount(getState(), slug);
}

// ─── Lesson quiz scores ────────────────────────────────────────

export function saveLessonQuizScore(
  slug: CourseSlug,
  lessonId: string,
  score: number,
  total: number,
): void {
  if (!isCanonicalLessonId(slug, lessonId) || total <= 0) return;
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
  if (!isCanonicalLessonId(slug, lessonId)) return;
  const state = getState();
  const slice = sliceOf(state, slug);
  const lesson = lessonOf(slice, lessonId);
  const prev = lesson.exercisesCompleted[result.exerciseId];
  const merged: UnifiedExerciseResult = {
    ...result,
    // Ordinary submissions pass attempts=1 and therefore still increment.
    // A validated cross-device import can carry a higher historical count;
    // retain it instead of collapsing every imported exercise to one attempt.
    attempts: Math.max((prev?.attempts ?? 0) + 1, result.attempts),
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

/**
 * Record one exercise result and its XP checkpoint in one store commit. This
 * is the project-studio boundary: subscribers cannot switch owner or reset the
 * course between two separately emitting writes.
 */
export function saveExerciseResultWithCheckpoint(
  slug: CourseSlug,
  lessonId: string,
  result: UnifiedExerciseResult,
  checkpointId: string,
): { readonly checkpointWasNew: boolean; readonly durable: boolean } {
  if (!isCanonicalLessonId(slug, lessonId)) {
    return { checkpointWasNew: false, durable: false };
  }
  const state = getState();
  const slice = sliceOf(state, slug);
  const lesson = lessonOf(slice, lessonId);
  const previousResult = lesson.exercisesCompleted[result.exerciseId];
  const mergedResult: UnifiedExerciseResult = {
    ...result,
    attempts: Math.max((previousResult?.attempts ?? 0) + 1, result.attempts),
    score:
      previousResult?.score != null && result.score != null
        ? Math.max(previousResult.score, result.score)
        : (result.score ?? previousResult?.score ?? null),
    completed: (previousResult?.completed ?? false) || result.completed,
    summary:
      result.summary !== undefined
        ? truncateToByteLength(result.summary, MAX_EXERCISE_SUMMARY_BYTES)
        : result.summary,
  };
  const checkpoint = checkpointKey(lessonId, checkpointId);
  const checkpointWasNew = state.checkpoints[checkpoint] !== true;
  const withExercise = withSlice(state, slug, {
    ...slice,
    lessons: {
      ...slice.lessons,
      [lessonId]: {
        ...lesson,
        exercisesCompleted: {
          ...lesson.exercisesCompleted,
          [result.exerciseId]: mergedResult,
        },
      },
    },
  });
  const withCheckpoint = checkpointWasNew
    ? {
        ...withExercise,
        checkpoints: { ...withExercise.checkpoints, [checkpoint]: true },
      }
    : withExercise;
  const next = checkpointWasNew
    ? applyXpAndBadges(withCheckpoint, XP.CHECKPOINT)
    : withCheckpoint;
  const ownerAtStart = getLearningOwnerContext();
  if (ownerAtStart.kind === "unknown") {
    return { checkpointWasNew: false, durable: false };
  }
  const stamped: UnifiedProgress = { ...next, lastActivity: nowIso() };
  const persisted = persistDurably(stamped);
  const ownerAfterWrite = getLearningOwnerContext();
  if (
    !persisted ||
    ownerAfterWrite.generation !== ownerAtStart.generation ||
    ownerAfterWrite.kind !== ownerAtStart.kind ||
    (ownerAfterWrite.kind === "account" &&
      (ownerAtStart.kind !== "account" ||
        ownerAfterWrite.accountId !== ownerAtStart.accountId))
  ) {
    return { checkpointWasNew: false, durable: false };
  }
  cache = stamped;
  emit(stamped);
  return { checkpointWasNew, durable: true };
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
  const normalizedScore = normalizeWorkshopQuizScore(score);
  if (normalizedScore === null) return;
  const state = getState();
  const slice = sliceOf(state, slug);
  const alreadyPassed = slice.workshopQuiz.passed;
  const previousScore =
    normalizeWorkshopQuizScore(slice.workshopQuiz.score) ?? 0;
  const improvedScore = normalizedScore > previousScore;
  const firstPass = passed && !alreadyPassed;
  const withQuiz = withSlice(state, slug, {
    ...slice,
    workshopQuiz: {
      passed: alreadyPassed || passed,
      score: Math.max(previousScore, normalizedScore),
      completedAt:
        !slice.workshopQuiz.completedAt || improvedScore || firstPass
          ? nowIso()
          : slice.workshopQuiz.completedAt,
    },
  });
  // Award the quiz-pass XP only on the first pass.
  commit(
    passed && !alreadyPassed
      ? applyXpAndBadges(withQuiz, XP.QUIZ_PASS)
      : withQuiz,
  );
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
  if (slug !== "ai-native") return;
  const state = getState();
  const slice = sliceOf(state, slug);
  if (slice.capstoneSubmitted) return;
  commit(withSlice(state, slug, { ...slice, capstoneSubmitted: true }));
}

export function isCapstoneSubmitted(slug: CourseSlug): boolean {
  return slug === "ai-native" && getCourseSlice(slug).capstoneSubmitted;
}

/** Read the exact, artifact-bearing applied-project exercise milestone. */
export function isAppliedProjectCompleted(slug: CourseSlug): boolean {
  return hasAppliedProjectCompletion(getState(), slug);
}

/**
 * Certificate eligibility (shared course architecture; fallback performance hardening).
 *
 * Every course requires all canonical lessons. Courses with a final
 * assessment additionally require a passed workshop quiz; AI-Native retains
 * its historical capstone self-review compatibility path. Applied-project
 * evidence is additional learning evidence, not a certificate substitute.
 * Never throws: corrupted storage reads as not-eligible instead of crashing
 * the zertifikat page.
 */
export function isCertificateEligible(slug: CourseSlug): boolean {
  try {
    return isCourseCompletionEarned(getState(), slug);
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
  return lessonIds.filter(
    (id) => isCanonicalLessonId(slug, id) && slice.lessons[id]?.completed,
  ).length;
}

export function areAllBlockLessonsCompleted(
  slug: CourseSlug,
  lessonIds: readonly string[],
): boolean {
  if (lessonIds.length === 0) return false;
  const slice = getCourseSlice(slug);
  return lessonIds.every(
    (id) => isCanonicalLessonId(slug, id) && slice.lessons[id]?.completed,
  );
}

export function getOverallProgress(
  slug: CourseSlug,
  totalLessons: number,
): number {
  if (!Number.isFinite(totalLessons) || totalLessons <= 0) return 0;
  const percentage = Math.round(
    (getCompletedLessonsCount(slug) / totalLessons) * 100,
  );
  return Math.min(100, Math.max(0, percentage));
}

// ─── Reset ─────────────────────────────────────────────────────

function clearCourseProjectBrowserState(
  slug: CourseSlug,
  expectedGeneration = getLearningOwnerContext().generation,
): void {
  removeOwnedLocalLearningItem(
    getCourseProjectDraftStorageKey(slug),
    expectedGeneration,
  );
  const mountedLessonIds =
    slug === "data-science"
      ? [...CANONICAL_LESSON_IDS[slug], "home"]
      : CANONICAL_LESSON_IDS[slug];
  for (const lessonId of mountedLessonIds) {
    removeOwnedLocalLearningItem(
      getLessonMissionStorageKey(slug, lessonId),
      expectedGeneration,
    );
  }
}

/** Reset a single course slice (keeps other courses + xp/streak/badges). */
export function resetCourse(slug: CourseSlug, resetAt = nowIso()): void {
  const state = getState();
  const ownerGeneration = getLearningOwnerContext().generation;
  const resetSlice: UnifiedCourseSlice = {
    lessons: {},
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: resetAt,
    lastActivity: resetAt,
    resetAt,
  };
  clearCourseProjectBrowserState(slug, ownerGeneration);
  commit({
    ...state,
    courses: { ...state.courses, [slug]: resetSlice },
  });
}

/** Reset the entire unified store (all courses + gamification). */
export function resetAll(): void {
  const resetAt = nowIso();
  const fresh = freshUnified();
  const ownerGeneration = getLearningOwnerContext().generation;
  for (const slug of COURSE_SLUGS) {
    clearCourseProjectBrowserState(slug, ownerGeneration);
  }
  commit({
    ...fresh,
    courses: Object.fromEntries(
      COURSE_SLUGS.map((slug) => [
        slug,
        {
          lessons: {},
          workshopQuiz: { passed: false, score: 0, completedAt: null },
          capstoneSubmitted: false,
          startedAt: resetAt,
          lastActivity: resetAt,
          resetAt,
        } satisfies UnifiedCourseSlice,
      ]),
    ),
    lastActivity: resetAt,
  });
}

const LOCAL_LEARNING_STORAGE_PREFIXES = [
  LEGACY_COURSE_KEY_PREFIX,
  "reader:progress:",
  "reflect::",
  "slots::",
  "selfrate::",
  "matrix::",
  "plays::",
  "loehrning:lesson-mission:v1:",
  "loehrning:course-project-draft:v1:",
] as const;
const SESSION_LEARNING_STORAGE_PREFIXES = [
  "ai-native-exercise-draft-",
  "ai-native-challenge-draft-",
] as const;

function removeMatchingStorageKeys(
  storage: Storage,
  exactKeys: readonly string[],
  prefixes: readonly string[],
): void {
  const keys = Array.from({ length: storage.length }, (_, index) =>
    storage.key(index),
  ).filter((key): key is string => key !== null);
  for (const key of keys) {
    if (
      exactKeys.includes(key) ||
      prefixes.some((prefix) => key.startsWith(prefix))
    ) {
      storage.removeItem(key);
    }
  }
}

/**
 * Delete one verified account's browser learning namespace without touching
 * anonymous learning or another account on the same browser.
 */
export function clearAccountLocalLearningData(userId: string): void {
  clearAccountLearningStorage(userId);
  const owner = getLearningOwnerContext();
  if (owner.kind === "account" && owner.accountId === userId) {
    activateAnonymousProgress();
  }
}

/**
 * Same-tab deletion completion fallback. It is deliberately a no-op while the
 * active namespace is anonymous; only an account namespace selected after
 * identity verification can be removed.
 */
export function clearActiveAccountLocalLearningData(): void {
  const owner = getLearningOwnerContext();
  if (owner.kind !== "account") return;
  clearAccountLocalLearningData(owner.accountId);
}

/**
 * Remove learning records only from the active verified-account or anonymous
 * namespace. Unknown identity is a no-op. No wildcard may erase another
 * account's offline data on a shared browser.
 */
export function clearAllLocalLearningData(): void {
  const owner = getLearningOwnerContext();
  if (owner.kind === "account") {
    clearAccountLocalLearningData(owner.accountId);
    return;
  }
  const resetAt = nowIso();
  const fresh = freshUnified();
  cache = {
    ...fresh,
    courses: Object.fromEntries(
      COURSE_SLUGS.map((slug) => [
        slug,
        {
          lessons: {},
          workshopQuiz: { passed: false, score: 0, completedAt: null },
          capstoneSubmitted: false,
          startedAt: resetAt,
          lastActivity: resetAt,
          resetAt,
        } satisfies UnifiedCourseSlice,
      ]),
    ),
    lastActivity: resetAt,
  };
  if (typeof window === "undefined" || owner.kind === "unknown") return;
  try {
    removeMatchingStorageKeys(
      window.localStorage,
      [LEGACY_AI_NATIVE_KEY, LEGACY_KI_F_FLAT_KEY],
      LOCAL_LEARNING_STORAGE_PREFIXES,
    );
    // Keep the empty reset-stamped root as the durable tombstone. Deleting the
    // root would make other or later tabs reconstruct resetAt=null and accept
    // stale pre-reset project drafts.
    persist(cache);
  } catch {
    // Browser storage can be unavailable; the in-memory cache is still reset.
  }
  emit(cache);
  try {
    removeMatchingStorageKeys(
      window.sessionStorage,
      ["ai-native-continue-dismissed"],
      SESSION_LEARNING_STORAGE_PREFIXES,
    );
  } catch {
    // Session storage can be unavailable independently of local storage.
  }
}

// ─── Test-only helpers ─────────────────────────────────────────

/** Internal: drop the in-memory cache so the next read re-loads from storage. */
export function __resetCacheForTests(): void {
  __resetLearningOwnerForTests("anonymous");
  cache = null;
}
