// ─── Per-course-row persistence layer ──
//
// The DB table `user_course_progress` is one row per (user_id, course_slug)
// instead of one shared JSONB blob per user (supabase/migrations/009). This
// module is the ONLY place that talks to that table; every route/page that
// used to read/write the old single-row shape now goes through it:
//   • src/app/api/progress/route.ts        (GET/PUT, client sync contract)
//   • src/app/api/account/export/route.ts  (DSGVO data export)
//   • src/app/api/account/reset-progress/route.ts (single-course reset)
//   • src/app/konto/page.tsx               (server-rendered dashboard)
//
// Two row shapes share the table, keyed by course_slug:
//   • a real CourseSlug        -> progress = { schemaVersion, slice }
//   • META_ROW_COURSE_SLUG     -> progress = { schemaVersion, ...UnifiedMetaFields }
//
// The client-facing contract is unchanged: callers here always get/put the
// full aggregated UnifiedProgress shape (see server-sync.ts's
// isUnifiedProgress/mergeUnifiedProgress) — only persistence is per-row.

import type { SupabaseClient } from "@supabase/supabase-js";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import {
  META_ROW_COURSE_SLUG,
  calculateEarnedXp,
  isUnifiedCourseSlice,
  isUnifiedMetaFields,
  isUnifiedProgress,
  mergeCourseSlice,
  mergeMetaFields,
  type UnifiedMetaFields,
} from "./server-sync";
import { upgradeHistoricalCompletionEvidence } from "./migrate";
import {
  UNIFIED_SCHEMA_VERSION,
  normalizeWorkshopQuizScore,
  type UnifiedCourseSlice,
  type UnifiedProgress,
} from "./types";

export const PROGRESS_TABLE = "user_course_progress";

type RowSlug = CourseSlug | typeof META_ROW_COURSE_SLUG;

interface CourseRowPayload {
  readonly schemaVersion: typeof UNIFIED_SCHEMA_VERSION;
  readonly slice: UnifiedCourseSlice;
}

interface CourseResetPayload {
  readonly schemaVersion: typeof UNIFIED_SCHEMA_VERSION;
  readonly reset: true;
  readonly resetAt: string;
}

type CoursePersistencePayload = CourseRowPayload | CourseResetPayload;

interface MetaRowPayload extends UnifiedMetaFields {
  readonly schemaVersion: typeof UNIFIED_SCHEMA_VERSION;
}

const COURSE_SLUG_SET = new Set<string>(COURSE_SLUGS);

function isCourseSlug(value: string): value is CourseSlug {
  return COURSE_SLUG_SET.has(value);
}

function isCourseRowPayload(
  value: unknown,
  slug: CourseSlug,
): value is CourseRowPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === UNIFIED_SCHEMA_VERSION &&
    isUnifiedCourseSlice(record.slice, slug)
  );
}

/**
 * Repair historical DB rows whose workshop score was stored as a whole
 * percentage. Impossible stored scores become zero so corrupt data cannot
 * inflate a merge or certificate; every other field still has to satisfy the
 * current strict course-slice validator.
 */
function coerceStoredCourseRowPayload(
  value: unknown,
  slug: CourseSlug,
): CourseRowPayload | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    record.schemaVersion !== UNIFIED_SCHEMA_VERSION ||
    typeof record.slice !== "object" ||
    record.slice === null
  ) {
    return null;
  }

  const rawSlice = record.slice as Record<string, unknown>;
  if (
    typeof rawSlice.workshopQuiz !== "object" ||
    rawSlice.workshopQuiz === null
  ) {
    return null;
  }
  const rawWorkshopQuiz = rawSlice.workshopQuiz as Record<string, unknown>;
  const normalizedSlice = {
    ...rawSlice,
    workshopQuiz: {
      ...rawWorkshopQuiz,
      score: normalizeWorkshopQuizScore(rawWorkshopQuiz.score) ?? 0,
    },
  };
  if (!isUnifiedCourseSlice(normalizedSlice, slug)) return null;
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    slice: normalizedSlice,
  };
}

function isCourseResetPayload(value: unknown): value is CourseResetPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === UNIFIED_SCHEMA_VERSION &&
    record.reset === true &&
    typeof record.resetAt === "string" &&
    Number.isFinite(Date.parse(record.resetAt))
  );
}

function isMetaRowPayload(value: unknown): value is MetaRowPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === UNIFIED_SCHEMA_VERSION &&
    isUnifiedMetaFields(record)
  );
}

function freshMetaFields(): UnifiedMetaFields {
  return {
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: new Date().toISOString(),
  };
}

function resetSlice(resetAt: string): UnifiedCourseSlice {
  return {
    lessons: {},
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: resetAt,
    lastActivity: resetAt,
    resetAt,
  };
}

export interface StoredProgressRow {
  readonly user_id: string;
  readonly course_slug: string;
  readonly progress: unknown;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Assemble every row for a user into the full aggregated UnifiedProgress.
 * Zero rows means the user has never touched any course -> null (matches the
 * old single-row contract's `data === null` case, and stays honest for the
 * DSGVO export route: no row means no data, not a synthesized empty record).
 */
function assemble(rows: readonly StoredProgressRow[]): UnifiedProgress | null {
  if (rows.length === 0) return null;

  const courses: Partial<Record<CourseSlug, UnifiedCourseSlice>> = {};
  let meta: UnifiedMetaFields | null = null;

  for (const row of rows) {
    if (row.course_slug === META_ROW_COURSE_SLUG) {
      if (isMetaRowPayload(row.progress)) meta = row.progress;
      continue;
    }
    if (!isCourseSlug(row.course_slug)) continue;
    if (isCourseResetPayload(row.progress)) {
      courses[row.course_slug] = resetSlice(row.progress.resetAt);
      continue;
    }
    const payload = coerceStoredCourseRowPayload(row.progress, row.course_slug);
    if (payload) {
      courses[row.course_slug] = payload.slice;
    }
  }

  const assembled: UnifiedProgress = {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses,
    ...(meta ?? freshMetaFields()),
  };
  const upgraded = upgradeHistoricalCompletionEvidence(assembled);
  if (!isUnifiedProgress(upgraded)) return null;
  return {
    ...upgraded,
    xp: Math.max(upgraded.xp, calculateEarnedXp(upgraded)),
  };
}

function latestUpdatedAt(rows: readonly StoredProgressRow[]): string | null {
  let latest: string | null = null;
  for (const row of rows) {
    if (!latest || Date.parse(row.updated_at) > Date.parse(latest)) {
      latest = row.updated_at;
    }
  }
  return latest;
}

export interface FetchResult {
  readonly progress: UnifiedProgress | null;
  readonly updatedAt: string | null;
  readonly courseResetAt: Readonly<Partial<Record<CourseSlug, string>>>;
  /** Complete owned storage rows, including rows canonical assembly rejects. */
  readonly rawRows: readonly StoredProgressRow[];
}

export type FetchOutcome =
  | { readonly ok: true; readonly result: FetchResult }
  | { readonly ok: false; readonly error: unknown };

/** Read every row for a user and assemble the full aggregated UnifiedProgress. */
export async function fetchUnifiedProgressForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<FetchOutcome> {
  let queryResult;
  try {
    queryResult = await supabase
      .from(PROGRESS_TABLE)
      .select("user_id, course_slug, progress, created_at, updated_at")
      .eq("user_id", userId)
      .order("course_slug", { ascending: true });
  } catch (error) {
    return { ok: false, error };
  }
  const { data, error } = queryResult;

  if (error) return { ok: false, error };
  const rows = (data ?? []) as StoredProgressRow[];
  const courseResetAt: Partial<Record<CourseSlug, string>> = {};
  for (const row of rows) {
    if (!isCourseSlug(row.course_slug)) continue;
    if (isCourseResetPayload(row.progress)) {
      courseResetAt[row.course_slug] = row.progress.resetAt;
    } else {
      const payload = coerceStoredCourseRowPayload(
        row.progress,
        row.course_slug,
      );
      if (payload?.slice.resetAt) {
        courseResetAt[row.course_slug] = payload.slice.resetAt;
      }
    }
  }
  return {
    ok: true,
    result: {
      progress: assemble(rows),
      updatedAt: latestUpdatedAt(rows),
      courseResetAt,
      rawRows: rows,
    },
  };
}

type UpsertRowOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly conflict: true }
  | { readonly ok: false; readonly conflict?: false; readonly error: unknown };

interface StoredProgressRowSnapshot {
  readonly progress: unknown;
  readonly updated_at: string;
}

type StoredProgressRowRead =
  | { readonly ok: true; readonly row: StoredProgressRowSnapshot | null }
  | { readonly ok: false; readonly error: unknown };

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return (error as { readonly code?: unknown }).code === "23505";
}

/**
 * A single course row exceeded `pg_column_size(progress) <= 65536`
 * (`user_course_progress_size_check`, migration 009). The request-body cap is
 * a different unit — it bounds the whole multi-course payload — so a write
 * can pass every request-level check and still be rejected here. Callers must
 * name this outcome rather than reporting a generic write failure, or the
 * learner loses the write with no indication why.
 */
export function isRowSizeViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, message } = error as {
    readonly code?: unknown;
    readonly message?: unknown;
  };
  if (code !== "23514") return false;
  return (
    typeof message === "string" &&
    message.includes("user_course_progress_size_check")
  );
}

async function readStoredProgressRow(
  supabase: SupabaseClient,
  userId: string,
  rowSlug: RowSlug,
): Promise<StoredProgressRowRead> {
  try {
    const { data, error } = await supabase
      .from(PROGRESS_TABLE)
      .select("progress, updated_at")
      .eq("user_id", userId)
      .eq("course_slug", rowSlug)
      .maybeSingle();

    if (error) return { ok: false, error };
    return {
      ok: true,
      row: data
        ? {
            progress: data.progress,
            updated_at: data.updated_at,
          }
        : null,
    };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Upsert exactly one row with per-row optimistic concurrency (same
 * read-merge-write-with-retry dance the old single-row route used, now
 * scoped to one (user_id, course_slug) instead of the whole blob).
 */
async function upsertRow<
  T extends { schemaVersion: typeof UNIFIED_SCHEMA_VERSION },
>(
  supabase: SupabaseClient,
  userId: string,
  rowSlug: RowSlug,
  incomingPayload: T,
  mergeExisting: (incoming: T, existingRaw: unknown) => T,
): Promise<UpsertRowOutcome> {
  let incoming = incomingPayload;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const read = await readStoredProgressRow(supabase, userId, rowSlug);
    if (!read.ok) return { ok: false, error: read.error };
    const existing = read.row;

    const merged = existing?.progress
      ? mergeExisting(incoming, existing.progress)
      : incoming;
    const updatedAt = new Date().toISOString();

    if (existing?.updated_at) {
      const { data, error } = await supabase
        .from(PROGRESS_TABLE)
        .update({ progress: merged, updated_at: updatedAt })
        .eq("user_id", userId)
        .eq("course_slug", rowSlug)
        .eq("updated_at", existing.updated_at)
        .select("progress, updated_at")
        .maybeSingle();

      if (error) return { ok: false, error };
      if (data) return { ok: true };
      incoming = merged;
      continue;
    }

    let insertResult;
    try {
      insertResult = await supabase
        .from(PROGRESS_TABLE)
        .insert({
          user_id: userId,
          course_slug: rowSlug,
          progress: merged,
          updated_at: updatedAt,
        })
        .select("progress, updated_at")
        .maybeSingle();
    } catch (error) {
      if (isUniqueViolation(error)) {
        incoming = merged;
        continue;
      }

      // A rejected transport can be ambiguous: Postgres may have committed
      // before the response was lost. Re-read only this composite-key row. If
      // it exists, the next bounded attempt merges against the committed or
      // concurrently-created value; if it does not, propagate the real error.
      const reconciliation = await readStoredProgressRow(
        supabase,
        userId,
        rowSlug,
      );
      if (!reconciliation.ok || !reconciliation.row) {
        return { ok: false, error };
      }
      incoming = merged;
      continue;
    }

    const { data, error } = insertResult;
    if (error) {
      if (!isUniqueViolation(error)) return { ok: false, error };
      incoming = merged;
      continue;
    }
    if (data) return { ok: true };

    // A successful insert with no returned row is also ambiguous under the
    // requested `.select().maybeSingle()` contract. Confirm the exact key
    // before treating it as a retryable race.
    const missingRepresentationError = new Error(
      "Progress insert returned neither a row nor an error",
    );
    const reconciliation = await readStoredProgressRow(
      supabase,
      userId,
      rowSlug,
    );
    if (!reconciliation.ok || !reconciliation.row) {
      return { ok: false, error: missingRepresentationError };
    }
    incoming = merged;
  }

  return { ok: false, conflict: true };
}

export type UpsertOutcome =
  | { readonly ok: true; readonly result: FetchResult }
  | {
      readonly ok: false;
      readonly conflict: true;
      readonly result: FetchResult;
    }
  | { readonly ok: false; readonly conflict?: false; readonly error: unknown };

/**
 * Persist the full incoming UnifiedProgress as per-row writes: one row per
 * course present in `incoming.courses`, plus the "_meta" ledger row. A
 * course absent from `incoming.courses` is never touched — this is the fix
 * for the write-amplification flagged in review (a checkpoint in one course
 * no longer requires re-serializing every other course's progress).
 * Always returns the full assembled state, so the client-facing contract
 * (GET/PUT return the whole aggregated UnifiedProgress) is unchanged.
 */
export async function upsertUnifiedProgressForUser(
  supabase: SupabaseClient,
  userId: string,
  incoming: UnifiedProgress,
): Promise<UpsertOutcome> {
  try {
    return await upsertUnifiedProgressForUserUnchecked(
      supabase,
      userId,
      incoming,
    );
  } catch (error) {
    return { ok: false, error };
  }
}

async function upsertUnifiedProgressForUserUnchecked(
  supabase: SupabaseClient,
  userId: string,
  incoming: UnifiedProgress,
): Promise<UpsertOutcome> {
  let conflict = false;

  for (const [slug, courseSlice] of Object.entries(incoming.courses) as [
    CourseSlug,
    UnifiedCourseSlice,
  ][]) {
    const canonicalCourseSlice: UnifiedCourseSlice = {
      ...courseSlice,
      workshopQuiz: {
        ...courseSlice.workshopQuiz,
        score: normalizeWorkshopQuizScore(courseSlice.workshopQuiz.score) ?? 0,
      },
    };
    const payload: CourseRowPayload = {
      schemaVersion: UNIFIED_SCHEMA_VERSION,
      slice: canonicalCourseSlice,
    };
    const outcome = await upsertRow<CoursePersistencePayload>(
      supabase,
      userId,
      slug,
      payload,
      (inc, existingRaw) => {
        if (!isCourseRowPayload(inc, slug)) return inc;
        if (isCourseResetPayload(existingRaw)) {
          return inc.slice.resetAt === existingRaw.resetAt ? inc : existingRaw;
        }
        const existing = coerceStoredCourseRowPayload(existingRaw, slug);
        return existing
          ? {
              schemaVersion: UNIFIED_SCHEMA_VERSION,
              slice: mergeCourseSlice(inc.slice, existing.slice) ?? inc.slice,
            }
          : inc;
      },
    );
    if (!outcome.ok) {
      if (outcome.conflict) conflict = true;
      else return { ok: false, error: outcome.error };
    }
  }

  const metaPayload: MetaRowPayload = {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    xp: incoming.xp,
    checkpoints: incoming.checkpoints,
    badges: incoming.badges,
    streak: incoming.streak,
    lastActivity: incoming.lastActivity,
  };
  const metaOutcome = await upsertRow<MetaRowPayload>(
    supabase,
    userId,
    META_ROW_COURSE_SLUG,
    metaPayload,
    (inc, existingRaw) =>
      isMetaRowPayload(existingRaw)
        ? {
            schemaVersion: UNIFIED_SCHEMA_VERSION,
            ...mergeMetaFields(inc, existingRaw),
          }
        : inc,
  );
  if (!metaOutcome.ok) {
    if (metaOutcome.conflict) conflict = true;
    else return { ok: false, error: metaOutcome.error };
  }

  const fetched = await fetchUnifiedProgressForUser(supabase, userId);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  return conflict
    ? { ok: false, conflict: true, result: fetched.result }
    : { ok: true, result: fetched.result };
}

export type DeleteOutcome =
  | { readonly ok: true; readonly resetAt: string }
  | { readonly ok: false; readonly error: unknown };

/**
 * Replace one course row with a server-timestamped reset tombstone. The
 * tombstone is omitted from assembled learner progress, but prevents stale
 * in-flight, cross-tab, or offline snapshots from recreating data that was
 * reset. A genuinely new lesson after reset carries a later lastActivity and
 * replaces the tombstone.
 */
export async function resetCourseProgressRow(
  supabase: SupabaseClient,
  userId: string,
  courseSlug: CourseSlug,
): Promise<DeleteOutcome> {
  try {
    const resetPayload: CourseResetPayload = {
      schemaVersion: UNIFIED_SCHEMA_VERSION,
      reset: true,
      resetAt: new Date().toISOString(),
    };
    const outcome = await upsertRow<CoursePersistencePayload>(
      supabase,
      userId,
      courseSlug,
      resetPayload,
      (incoming) => incoming,
    );
    return outcome.ok
      ? { ok: true, resetAt: resetPayload.resetAt }
      : {
          ok: false,
          error:
            "error" in outcome
              ? outcome.error
              : new Error("Reset tombstone write conflict"),
        };
  } catch (error) {
    return { ok: false, error };
  }
}
