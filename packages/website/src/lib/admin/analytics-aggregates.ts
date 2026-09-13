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
 * below GLOBAL_ACTIVITY_FLOOR course-progress rows no figure is shown at all,
 * and a figure below MIN_REPORTABLE_COUNT is never rendered as a number, not
 * even as the difference between a shown total and the shown courses.
 */

/**
 * Below this many course-progress rows the page shows no figures at all. The
 * ledger row is not a course-progress row and does not count towards it.
 */
export const GLOBAL_ACTIVITY_FLOOR = 20;

/** Smallest count ever shown as a number (small-numbers rule, k = 5). */
export const MIN_REPORTABLE_COUNT = 5;

const PROGRESS_TABLE = "user_course_progress";

/**
 * The reserved cross-course ledger row every syncing account writes once. It
 * is not course progress: counting it would make the total minus the shown
 * courses equal the number of syncing accounts, which the page withholds.
 */
const LEDGER_COURSE_SLUG = "_meta";

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

/** A closed filter on course_slug: one course, or every course row. */
type CourseSlugFilter =
  | { readonly kind: "course"; readonly slug: string }
  | { readonly kind: "all-courses" };

async function headCount(
  client: SupabaseClient,
  table: string,
  filter?: CourseSlugFilter,
): Promise<number | null> {
  try {
    const base = client.from(table).select("*", { count: "exact", head: true });
    const query =
      filter === undefined
        ? base
        : filter.kind === "course"
          ? base.eq("course_slug", filter.slug)
          : base.neq("course_slug", LEDGER_COURSE_SLUG);
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

/**
 * Complementary suppression for the course-progress total. The rows not
 * accounted for by the shown courses are the omitted small courses plus any
 * unreadable ones. When that remainder is positive but below
 * MIN_REPORTABLE_COUNT, subtracting the shown courses from the total would
 * reveal a figure the small-numbers rule withholds, so the total is withheld
 * too. The input is never mutated.
 */
function withComplementarySuppression(
  totals: AdminAggregateSnapshot["totals"],
  progressCount: number,
  courses: readonly AdminCourseCount[],
): AdminAggregateSnapshot["totals"] {
  const shown = courses.reduce((sum, course) => sum + course.count, 0);
  const remainder = progressCount - shown;
  if (remainder <= 0 || remainder >= MIN_REPORTABLE_COUNT) return totals;
  return { ...totals, courseProgress: "suppressed" };
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
      count: await headCount(client, PROGRESS_TABLE, { kind: "course", slug }),
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

  const progressCount = await headCount(client, PROGRESS_TABLE, {
    kind: "all-courses",
  });
  if (progressCount === null) return UNAVAILABLE;
  if (progressCount < GLOBAL_ACTIVITY_FLOOR) return INSUFFICIENT;

  const [totals, courses] = await Promise.all([
    readTotals(client, progressCount),
    readCourses(client),
  ]);
  return {
    state: "ready",
    ...totals,
    totals: withComplementarySuppression(totals.totals, progressCount, courses.courses),
    ...courses,
  };
}
