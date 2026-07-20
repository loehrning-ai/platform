// ─── Per-course-row persistence layer (plan 007 stage 5) ──
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
import type { CourseSlug } from "@/lib/course/types";
import {
  META_ROW_COURSE_SLUG,
  isUnifiedCourseSlice,
  isUnifiedMetaFields,
  isUnifiedProgress,
  mergeCourseSlice,
  mergeMetaFields,
  type UnifiedMetaFields,
} from "./server-sync";
import {
  UNIFIED_SCHEMA_VERSION,
  type UnifiedCourseSlice,
  type UnifiedProgress,
} from "./types";

export const PROGRESS_TABLE = "user_course_progress";

type RowSlug = CourseSlug | typeof META_ROW_COURSE_SLUG;

interface CourseRowPayload {
  readonly schemaVersion: typeof UNIFIED_SCHEMA_VERSION;
  readonly slice: UnifiedCourseSlice;
}

interface MetaRowPayload extends UnifiedMetaFields {
  readonly schemaVersion: typeof UNIFIED_SCHEMA_VERSION;
}

function isCourseRowPayload(value: unknown): value is CourseRowPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === UNIFIED_SCHEMA_VERSION &&
    isUnifiedCourseSlice(record.slice)
  );
}

function isMetaRowPayload(value: unknown): value is MetaRowPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.schemaVersion === UNIFIED_SCHEMA_VERSION && isUnifiedMetaFields(record);
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

interface DbRow {
  readonly course_slug: string;
  readonly progress: unknown;
  readonly updated_at: string;
}

/**
 * Assemble every row for a user into the full aggregated UnifiedProgress.
 * Zero rows means the user has never touched any course -> null (matches the
 * old single-row contract's `data === null` case, and stays honest for the
 * DSGVO export route: no row means no data, not a synthesized empty record).
 */
function assemble(rows: readonly DbRow[]): UnifiedProgress | null {
  if (rows.length === 0) return null;

  const courses: Partial<Record<CourseSlug, UnifiedCourseSlice>> = {};
  let meta: UnifiedMetaFields | null = null;

  for (const row of rows) {
    if (row.course_slug === META_ROW_COURSE_SLUG) {
      if (isMetaRowPayload(row.progress)) meta = row.progress;
      continue;
    }
    if (isCourseRowPayload(row.progress)) {
      courses[row.course_slug as CourseSlug] = row.progress.slice;
    }
  }

  const assembled: UnifiedProgress = {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses,
    ...(meta ?? freshMetaFields()),
  };
  return isUnifiedProgress(assembled) ? assembled : null;
}

function latestUpdatedAt(rows: readonly DbRow[]): string | null {
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
}

export type FetchOutcome =
  | { readonly ok: true; readonly result: FetchResult }
  | { readonly ok: false; readonly error: unknown };

/** Read every row for a user and assemble the full aggregated UnifiedProgress. */
export async function fetchUnifiedProgressForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<FetchOutcome> {
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select("course_slug, progress, updated_at")
    .eq("user_id", userId);

  if (error) return { ok: false, error };
  const rows = (data ?? []) as DbRow[];
  return { ok: true, result: { progress: assemble(rows), updatedAt: latestUpdatedAt(rows) } };
}

type UpsertRowOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly conflict: true }
  | { readonly ok: false; readonly conflict?: false; readonly error: unknown };

/**
 * Upsert exactly one row with per-row optimistic concurrency (same
 * read-merge-write-with-retry dance the old single-row route used, now
 * scoped to one (user_id, course_slug) instead of the whole blob).
 */
async function upsertRow<T extends { schemaVersion: typeof UNIFIED_SCHEMA_VERSION }>(
  supabase: SupabaseClient,
  userId: string,
  rowSlug: RowSlug,
  incomingPayload: T,
  mergeExisting: (incoming: T, existingRaw: unknown) => T,
): Promise<UpsertRowOutcome> {
  let incoming = incomingPayload;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data: existing, error: readError } = await supabase
      .from(PROGRESS_TABLE)
      .select("progress, updated_at")
      .eq("user_id", userId)
      .eq("course_slug", rowSlug)
      .maybeSingle();

    if (readError) return { ok: false, error: readError };

    const merged = existing?.progress ? mergeExisting(incoming, existing.progress) : incoming;
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

    const { data, error } = await supabase
      .from(PROGRESS_TABLE)
      .insert({ user_id: userId, course_slug: rowSlug, progress: merged, updated_at: updatedAt })
      .select("progress, updated_at")
      .maybeSingle();

    if (!error && data) return { ok: true };
    incoming = merged;
  }

  return { ok: false, conflict: true };
}

export type UpsertOutcome =
  | { readonly ok: true; readonly result: FetchResult }
  | { readonly ok: false; readonly conflict: true; readonly result: FetchResult }
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
  let conflict = false;

  for (const [slug, courseSlice] of Object.entries(incoming.courses) as [
    CourseSlug,
    UnifiedCourseSlice,
  ][]) {
    const payload: CourseRowPayload = { schemaVersion: UNIFIED_SCHEMA_VERSION, slice: courseSlice };
    const outcome = await upsertRow<CourseRowPayload>(
      supabase,
      userId,
      slug,
      payload,
      (inc, existingRaw) =>
        isCourseRowPayload(existingRaw)
          ? {
              schemaVersion: UNIFIED_SCHEMA_VERSION,
              slice: mergeCourseSlice(inc.slice, existingRaw.slice) ?? inc.slice,
            }
          : inc,
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
        ? { schemaVersion: UNIFIED_SCHEMA_VERSION, ...mergeMetaFields(inc, existingRaw) }
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

export type DeleteOutcome = { readonly ok: true } | { readonly ok: false; readonly error: unknown };

/**
 * Delete exactly one course's row. Replaces the old "read the whole blob,
 * delete one key, write the whole blob back" reset — the per-course-row
 * schema makes a course reset a single-row delete.
 */
export async function deleteCourseProgressRow(
  supabase: SupabaseClient,
  userId: string,
  courseSlug: CourseSlug,
): Promise<DeleteOutcome> {
  const { error } = await supabase
    .from(PROGRESS_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("course_slug", courseSlug);

  if (error) return { ok: false, error };
  return { ok: true };
}
