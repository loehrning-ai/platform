// ─── Local progress import merge (account import boundary) ──
//
// POST /api/progress/import folds a browser's ANONYMOUS localStorage snapshot
// into the signed-in account's stored progress exactly once. This module is
// the whole decision layer for that fold: pure, total, and immutable. It
// never touches storage, never reads a clock, and never mutates either input,
// so the route can hand it unvalidated JSON and get back either the object to
// persist or a named rejection with the invalid path.
//
// Conflict rules, all resolving upward so an import can never take anything
// away:
//   • completed wins            (a lesson completed on either side stays completed)
//   • the higher quiz score wins
//   • the latest timestamp wins (earliest for startedAt: the learner did start then)
//   • resetAt is respected      (see below)
//
// Field-level resolution is delegated to mergeUnifiedProgress in
// server-sync.ts on purpose. That is the merge the ordinary cross-device sync
// already uses; a second, independent implementation here is exactly how two
// merge semantics drift apart and lose learner data.
//
// What this module adds on top of it is the import-specific trust boundary.
// The anonymous namespace is foreign input, so it may not:
//   • introduce or move a reset epoch. Whatever resetAt the snapshot claims is
//     discarded and the account's own epoch is stamped back on. A snapshot
//     slice that predates the account's reset is dropped whole.
//   • carry the one-shot import marker.
//   • assert an XP total. XP is an index over immutable achievements, so the
//     imported side contributes achievements and mergeUnifiedProgress
//     recomputes the earned floor.
//   • smuggle unknown keys into stored rows. Every slice, lesson and exercise
//     is rebuilt from its known fields (the shared validators accept extra
//     keys, and stored rows are size-capped).

import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { summarizeImport, type ImportSummary } from "./import-summary";
import {
  isUnifiedCourseSlice,
  isUnifiedProgress,
  mergeUnifiedProgress,
} from "./server-sync";
import {
  UNIFIED_SCHEMA_VERSION,
  type UnifiedCourseSlice,
  type UnifiedExerciseResult,
  type UnifiedLessonProgress,
  type UnifiedProgress,
} from "./types";

export type { ImportSummary } from "./import-summary";

/**
 * Reserved ledger id recording when this account absorbed a local snapshot.
 * A second import is refused on its presence.
 *
 * It rides in the `_meta` row's badge ledger because that is the only durable
 * field of that row shaped like "id -> ISO timestamp": mergeMetaFields keeps
 * the EARLIEST timestamp per id, so the marker pins the FIRST import and
 * survives every later progress write and cross-device merge. A plain extra
 * field on the `_meta` row payload would not survive: upsertUnifiedProgressForUser
 * rebuilds that payload from the five known ledger fields, so the next
 * ordinary sync would drop it and the one-shot guarantee with it.
 *
 * The reserved prefix cannot collide with a catalog badge id, the marker earns
 * no XP (XP counts checkpoints, never badges), and getBadgeDefinition returns
 * undefined for it, so no surface renders it.
 */
export const LOCAL_IMPORT_MARKER_ID = "__import__:local-progress-v1";

/** Root fields probed one at a time to blame the right path on a rejection. */
const PROBED_ROOT_FIELDS = [
  "xp",
  "checkpoints",
  "badges",
  "streak",
  "lastActivity",
] as const;

const COURSE_SLUG_SET: ReadonlySet<string> = new Set<string>(COURSE_SLUGS);

/** Known-valid root used to probe one field at a time against the real validator. */
const PROBE_BASE: UnifiedProgress = {
  schemaVersion: UNIFIED_SCHEMA_VERSION,
  courses: {},
  xp: 0,
  checkpoints: {},
  badges: {},
  streak: { days: 0, last: null },
  lastActivity: "1970-01-01T00:00:00.000Z",
};

export type MergeProgressRejection =
  /** The snapshot declares a schema version this build cannot read. */
  | "unsupported_schema_version"
  /** The snapshot is not a valid unified progress object. */
  | "invalid_import"
  /** The caller's import timestamp is not an ISO instant. */
  | "invalid_import_timestamp"
  /** The account's own stored progress did not validate: a server-side fault. */
  | "invalid_account";

export interface MergeProgressInput {
  /** The account's assembled progress, or null when it has no rows yet. */
  readonly account: unknown;
  /** The browser's anonymous namespace snapshot, exactly as received. */
  readonly incoming: unknown;
  /** ISO instant recorded as the one-shot marker. Passed in to stay pure. */
  readonly importedAt: string;
  /** Reset epochs from the store, including courses assembled from a tombstone. */
  readonly courseResetAt?: Readonly<Partial<Record<CourseSlug, string>>>;
}

export type MergeProgressResult =
  | {
      readonly ok: true;
      /** The full state to persist, marker stamped. */
      readonly merged: UnifiedProgress;
      readonly summary: ImportSummary;
    }
  | {
      readonly ok: false;
      readonly reason: MergeProgressRejection;
      /** Dotted path of the first field to blame. Never echoes caller keys. */
      readonly path: string;
    };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The shared root validator owns the ISO grammar. Probing it keeps one
 * implementation instead of a second regex that can drift away from it.
 */
function isIsoTimestampValue(value: unknown): value is string {
  return isUnifiedProgress({ ...PROBE_BASE, lastActivity: value });
}

function isAfter(candidate: string, reference: string): boolean {
  const candidateTime = Date.parse(candidate);
  const referenceTime = Date.parse(reference);
  if (!Number.isFinite(candidateTime) || !Number.isFinite(referenceTime)) {
    return false;
  }
  return candidateTime > referenceTime;
}

function latestIsoOf(
  a: string | undefined,
  b: string | undefined,
): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return isAfter(b, a) ? b : a;
}

/**
 * Narrow an invalid snapshot down to one field so the 400 can name it.
 * isUnifiedProgress stays the authority; this only assigns blame, and every
 * segment it emits comes from our own slug list, never from caller keys.
 */
function invalidImportPath(value: unknown): string {
  if (!isPlainRecord(value)) return "progress";
  if (!isPlainRecord(value.courses)) return "progress.courses";
  for (const [slug, slice] of Object.entries(value.courses)) {
    if (!COURSE_SLUG_SET.has(slug)) return "progress.courses";
    if (!isUnifiedCourseSlice(slice, slug as CourseSlug)) {
      return `progress.courses.${slug}`;
    }
  }
  for (const field of PROBED_ROOT_FIELDS) {
    if (!isUnifiedProgress({ ...PROBE_BASE, [field]: value[field] })) {
      return `progress.${field}`;
    }
  }
  return "progress";
}

/**
 * A fresh empty account, used as the merge base when the account holds no
 * rows. Built field by field rather than spread from PROBE_BASE: a spread
 * would hand the caller that module constant's nested objects, and the shared
 * merge can return one of its inputs by reference.
 */
function emptyProgress(lastActivity: string): UnifiedProgress {
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity,
  };
}

function canonicalExercise(
  result: UnifiedExerciseResult,
): UnifiedExerciseResult {
  const rebuilt: UnifiedExerciseResult = {
    exerciseId: result.exerciseId,
    kind: result.kind,
    completed: result.completed,
    score: result.score,
    attempts: result.attempts,
    completedAt: result.completedAt,
    skipped: result.skipped,
  };
  return result.summary === undefined
    ? rebuilt
    : { ...rebuilt, summary: result.summary };
}

function canonicalLesson(lesson: UnifiedLessonProgress): UnifiedLessonProgress {
  const exercisesCompleted: Record<string, UnifiedExerciseResult> = {};
  for (const [exerciseId, result] of Object.entries(
    lesson.exercisesCompleted,
  )) {
    exercisesCompleted[exerciseId] = canonicalExercise(result);
  }
  return {
    sectionsRead: [...lesson.sectionsRead],
    quizScore: lesson.quizScore,
    quizTotal: lesson.quizTotal,
    completed: lesson.completed,
    exercisesCompleted,
  };
}

/**
 * Rebuild one imported slice from its known fields and bind it to the
 * account's reset epoch. `startedAt` is clamped forward to the epoch so a
 * reset course cannot claim to have started before its own reset.
 */
function canonicalSlice(
  slice: UnifiedCourseSlice,
  resetAt: string | null,
): UnifiedCourseSlice {
  const lessons: Record<string, UnifiedLessonProgress> = {};
  for (const [lessonId, lesson] of Object.entries(slice.lessons)) {
    lessons[lessonId] = canonicalLesson(lesson);
  }
  const rebuilt: UnifiedCourseSlice = {
    lessons,
    workshopQuiz: {
      passed: slice.workshopQuiz.passed,
      score: slice.workshopQuiz.score,
      completedAt: slice.workshopQuiz.completedAt,
    },
    capstoneSubmitted: slice.capstoneSubmitted,
    startedAt:
      resetAt && isAfter(resetAt, slice.startedAt) ? resetAt : slice.startedAt,
    lastActivity: slice.lastActivity,
  };
  return resetAt ? { ...rebuilt, resetAt } : rebuilt;
}

function prepareImportedCourses(
  incoming: UnifiedProgress,
  account: UnifiedProgress | null,
  courseResetAt: Readonly<Partial<Record<CourseSlug, string>>>,
): UnifiedProgress["courses"] {
  const prepared: Partial<Record<CourseSlug, UnifiedCourseSlice>> = {};
  for (const slug of COURSE_SLUGS) {
    const slice = incoming.courses[slug];
    if (!slice) continue;
    const accountReset = latestIsoOf(
      account?.courses[slug]?.resetAt,
      courseResetAt[slug],
    );
    // Everything the snapshot did up to the account's reset was reset. Only
    // work that happened strictly after the epoch survives the import.
    if (accountReset && !isAfter(slice.lastActivity, accountReset)) continue;
    prepared[slug] = canonicalSlice(slice, accountReset);
  }
  return prepared;
}

/**
 * Read the one-shot import marker, or null when this account never imported.
 * Takes `unknown` on purpose: the route checks the marker on rows straight out
 * of the database, before anything has established that they are a valid
 * UnifiedProgress, and a corrupt row must read as "never imported" rather than
 * throw on the way to its own named error.
 */
export function readLocalImportMarker(progress: unknown): string | null {
  if (!isPlainRecord(progress)) return null;
  const { badges } = progress;
  if (!isPlainRecord(badges)) return null;
  const importedAt = badges[LOCAL_IMPORT_MARKER_ID];
  return typeof importedAt === "string" ? importedAt : null;
}

function readAccount(value: unknown): UnifiedProgress | null | "invalid" {
  if (value === null || value === undefined) return null;
  return isUnifiedProgress(value) ? value : "invalid";
}

/**
 * Merge an anonymous snapshot into an account's progress. Pure: same inputs,
 * same output, no mutation of either side.
 */
export function mergeProgress(input: MergeProgressInput): MergeProgressResult {
  const { account, incoming, importedAt } = input;
  const courseResetAt = input.courseResetAt ?? {};

  if (!isIsoTimestampValue(importedAt)) {
    return {
      ok: false,
      reason: "invalid_import_timestamp",
      path: "importedAt",
    };
  }

  const accountProgress = readAccount(account);
  if (accountProgress === "invalid") {
    return { ok: false, reason: "invalid_account", path: "account" };
  }

  // A snapshot written by an older build is named as such rather than being
  // reported as a malformed object: the browser can migrate and retry.
  if (
    isPlainRecord(incoming) &&
    incoming.schemaVersion !== UNIFIED_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      reason: "unsupported_schema_version",
      path: "progress.schemaVersion",
    };
  }
  if (!isUnifiedProgress(incoming)) {
    return {
      ok: false,
      reason: "invalid_import",
      path: invalidImportPath(incoming),
    };
  }

  const importedBadges: Record<string, string> = {};
  for (const [badgeId, awardedAt] of Object.entries(incoming.badges)) {
    if (badgeId === LOCAL_IMPORT_MARKER_ID) continue;
    importedBadges[badgeId] = awardedAt;
  }

  const prepared: UnifiedProgress = {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: prepareImportedCourses(incoming, accountProgress, courseResetAt),
    // No XP is taken from the snapshot. mergeUnifiedProgress recomputes the
    // earned floor from the merged achievements, so imported work still pays
    // out while a claimed total cannot.
    xp: 0,
    checkpoints: { ...incoming.checkpoints },
    badges: importedBadges,
    streak: { days: incoming.streak.days, last: incoming.streak.last },
    lastActivity: incoming.lastActivity,
  };

  const base = accountProgress ?? emptyProgress(incoming.lastActivity);
  const mergedState = mergeUnifiedProgress(base, prepared);
  const merged: UnifiedProgress = {
    ...mergedState,
    badges: {
      ...mergedState.badges,
      // Keep an existing marker: the first import is the one that counts.
      [LOCAL_IMPORT_MARKER_ID]: readLocalImportMarker(mergedState) ?? importedAt,
    },
  };

  return { ok: true, merged, summary: summarizeImport(base, merged) };
}
