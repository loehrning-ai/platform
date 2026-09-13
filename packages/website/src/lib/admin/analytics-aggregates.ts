import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/auth/admin-identity";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { reportApiError } from "@/lib/observability/api-error";
import { isAdminAnalyticsReady } from "@/lib/provider-readiness";
import { tryCreateServiceClient } from "@/lib/supabase/server";

/*
 * Operating statistics: platform-wide head-counts for the owner.
 *
 * INVARIANTS
 * - Head-counts only. Every query is `select("*", { count: "exact", head: true })`,
 *   so PostgREST returns a count and no row, and no named column is selected.
 * - No auth-schema read and no auth administration call. Account totals are
 *   deliberately not shown: counting accounts would mean reading user records.
 * - No new database object, grant or policy. Nothing here is reachable by the
 *   `authenticated` role; the service client stays on the server.
 * - The owner gate is re-checked here at runtime. A caller-supplied type or id
 *   is never trusted as proof of authorization.
 * - A failed count is reported as unavailable, never as zero.
 *
 * The two suppression constants below are privacy decisions, not UI tweaks:
 * below GLOBAL_ACTIVITY_FLOOR progress rows no figure is shown at all, and a
 * figure below MIN_REPORTABLE_COUNT is never rendered as a number.
 */

/** Below this many course-progress rows the page shows no figures at all. */
export const GLOBAL_ACTIVITY_FLOOR = 20;

/** Smallest count ever shown as a number (small-numbers rule, k = 5). */
export const MIN_REPORTABLE_COUNT = 5;

const PROGRESS_TABLE = "user_course_progress";

/**
 * The closed set of platform-wide head-counts. The agent-access and account
 * key tables are counted in total only and are never broken down further.
 * Those three tables come from recent migrations that may not be applied in
 * every environment, which is why each count tolerates its own failure.
 */
const TOTAL_METRICS = [
  { key: "courseProgress", table: PROGRESS_TABLE },
  { key: "assessmentRuns", table: "assessment_runs" },
  { key: "assessmentAnswers", table: "assessment_answers" },
  { key: "betaFeedback", table: "beta_feedback" },
  { key: "agentAccessEvents", table: "agent_access_events" },
  { key: "agentAccessTokens", table: "agent_access_tokens" },
  { key: "accountLlmKeys", table: "account_llm_keys" },
] as const;

export type AdminTotalMetric = (typeof TOTAL_METRICS)[number]["key"];

/** A shown figure, or the marker that it exists but is too small to show. */
export type ReportableCount = number | "suppressed";

export interface AdminCourseCount {
  readonly slug: string;
  readonly count: number;
}

export interface AdminAggregateSnapshot {
  readonly state: "ready";
  /** Totals that were read. A failed total is absent here, never zero. */
  readonly totals: Readonly<Partial<Record<AdminTotalMetric, ReportableCount>>>;
  /** Totals whose count could not be read in this environment. */
  readonly unavailableTotals: readonly AdminTotalMetric[];
  /** Course-progress rows per course; courses below the minimum are omitted. */
  readonly courses: readonly AdminCourseCount[];
  /** True when at least one per-course count could not be read. */
  readonly coursesIncomplete: boolean;
}

export type AdminAggregates =
  | { readonly state: "unavailable" }
  | { readonly state: "insufficient-data" }
  | AdminAggregateSnapshot;

const UNAVAILABLE: AdminAggregates = Object.freeze({ state: "unavailable" });
const INSUFFICIENT: AdminAggregates = Object.freeze({
  state: "insufficient-data",
});

function reportReadFailure(error: unknown): void {
  reportApiError({ route: "/konto/statistik", step: "supabase-read", error });
}

async function headCount(
  client: SupabaseClient,
  table: string,
  courseSlug?: string,
): Promise<number | null> {
  try {
    const base = client.from(table).select("*", { count: "exact", head: true });
    const query = courseSlug === undefined ? base : base.eq("course_slug", courseSlug);
    const { count, error } = await query;
    if (error) {
      reportReadFailure(error);
      return null;
    }
    return typeof count === "number" && Number.isSafeInteger(count) && count >= 0
      ? count
      : null;
  } catch (error) {
    reportReadFailure(error);
    return null;
  }
}

function reportable(count: number): ReportableCount {
  return count < MIN_REPORTABLE_COUNT ? "suppressed" : count;
}

async function readTotals(
  client: SupabaseClient,
  progressCount: number,
): Promise<Pick<AdminAggregateSnapshot, "totals" | "unavailableTotals">> {
  const results = await Promise.all(
    TOTAL_METRICS.map(async ({ key, table }) => ({
      key,
      count: table === PROGRESS_TABLE ? progressCount : await headCount(client, table),
    })),
  );
  const totals = Object.fromEntries(
    results.flatMap(({ key, count }) =>
      count === null ? [] : [[key, reportable(count)] as const],
    ),
  ) as Partial<Record<AdminTotalMetric, ReportableCount>>;
  const unavailableTotals = results
    .filter(({ count }) => count === null)
    .map(({ key }) => key);
  return { totals, unavailableTotals };
}

async function readCourses(
  client: SupabaseClient,
): Promise<Pick<AdminAggregateSnapshot, "courses" | "coursesIncomplete">> {
  const results = await Promise.all(
    COURSE_CATALOG.map(async ({ slug }) => ({
      slug,
      count: await headCount(client, PROGRESS_TABLE, slug),
    })),
  );
  const courses = results.flatMap(({ slug, count }) =>
    count !== null && count >= MIN_REPORTABLE_COUNT ? [{ slug, count }] : [],
  );
  return {
    courses,
    coursesIncomplete: results.some(({ count }) => count === null),
  };
}

/**
 * Owner-only head-count snapshot. Returns null unless the current request is
 * the verified owner with a recent sign-in.
 */
export async function readAdminAggregates(): Promise<AdminAggregates | null> {
  if ((await requireAdminUser()) !== "admin") return null;
  if (!isAdminAnalyticsReady()) return UNAVAILABLE;

  const client = tryCreateServiceClient();
  if (!client) return UNAVAILABLE;

  const progressCount = await headCount(client, PROGRESS_TABLE);
  if (progressCount === null) return UNAVAILABLE;
  if (progressCount < GLOBAL_ACTIVITY_FLOOR) return INSUFFICIENT;

  const [totals, courses] = await Promise.all([
    readTotals(client, progressCount),
    readCourses(client),
  ]);
  return { state: "ready", ...totals, ...courses };
}
