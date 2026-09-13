import "server-only";
import { MIN_REPORTABLE_COUNT } from "@/lib/admin/analytics-aggregates";
import { requireAdminUser } from "@/lib/auth/admin-identity";
import {
  ANALYTICS_EVENTS,
  SAFE_VALUE,
  isAnalyticsEventName,
  type AnalyticsEventName,
} from "@/lib/analytics/registry";
import { reportApiError } from "@/lib/observability/api-error";

/*
 * Owner-only reader for aggregate Vercel Web Analytics figures.
 *
 * INVARIANTS
 * - Server-only. The access token is read from the environment per request,
 *   sent only as a bearer header to the Vercel API, and never logged, returned
 *   or placed in an error.
 * - The owner gate is re-checked before any request is made.
 * - Nothing is stored. Figures are fetched on each request with no cache.
 * - Breakdowns use the dynamic `route` dimension, never the raw request path,
 *   and every breakdown row below MIN_REPORTABLE_COUNT is omitted.
 * - Filters only ever interpolate event names declared in the analytics
 *   registry; breakdown values are kept only when they belong to that event's
 *   declared vocabulary.
 * - Row shapes of the aggregate endpoints are not fully documented, so every
 *   body is parsed as unknown and a section that does not match is reported as
 *   unavailable rather than guessed at.
 */

const VERCEL_API_ORIGIN = "https://api.vercel.com";
const REQUEST_TIMEOUT_MS = 8000;
export const VERCEL_ANALYTICS_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const BREAKDOWN_LIMIT = "20";
const TEAM_ID_PATTERN = /^team_[A-Za-z0-9]{8,64}$/;
const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const TOKEN_PATTERN = /^[\x21-\x7e]{1,512}$/;
const ROUTE_MAX_LENGTH = 200;
const NOT_ENABLED_CODE = "web_analytics_not_enabled";

export interface AnalyticsBreakdownRow {
  readonly value: string;
  readonly count: number;
}

export interface AnalyticsTotals {
  readonly pageviews: number;
  readonly visitors: number;
}

export type AnalyticsSection<T> =
  | { readonly state: "ready"; readonly data: T }
  | { readonly state: "unavailable" };

export interface VercelAnalyticsReport {
  readonly state: "ready";
  readonly windowDays: number;
  readonly totals: AnalyticsSection<AnalyticsTotals>;
  readonly routes: AnalyticsSection<readonly AnalyticsBreakdownRow[]>;
  readonly events: AnalyticsSection<readonly AnalyticsBreakdownRow[]>;
  readonly courseStarts: AnalyticsSection<readonly AnalyticsBreakdownRow[]>;
  readonly lessonCompletions: AnalyticsSection<readonly AnalyticsBreakdownRow[]>;
  readonly courseCompletionSteps: AnalyticsSection<
    readonly AnalyticsBreakdownRow[]
  >;
}

export type VercelAnalytics =
  | { readonly state: "disabled" }
  | { readonly state: "not-enabled" }
  | VercelAnalyticsReport;

type FunnelKey = "courseStarts" | "lessonCompletions" | "courseCompletionSteps";

const FUNNEL_BREAKDOWNS: readonly {
  readonly key: FunnelKey;
  readonly event: AnalyticsEventName;
  readonly property: "subject" | "facet";
}[] = [
  { key: "courseStarts", event: "course_started", property: "subject" },
  { key: "lessonCompletions", event: "lesson_completed", property: "subject" },
  { key: "courseCompletionSteps", event: "course_completion", property: "facet" },
];

const UNAVAILABLE_SECTION = Object.freeze({ state: "unavailable" as const });

interface VercelApiConfig {
  readonly token: string;
  readonly teamId: string;
  readonly projectId: string;
}

type QueryOutcome =
  | { readonly kind: "ok"; readonly body: unknown }
  | { readonly kind: "not-enabled" }
  | { readonly kind: "failed" };

function readConfig(): VercelApiConfig | null {
  const token = process.env.VERCEL_ANALYTICS_API_TOKEN;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (
    !token ||
    !TOKEN_PATTERN.test(token) ||
    !teamId ||
    !TEAM_ID_PATTERN.test(teamId) ||
    !projectId ||
    !PROJECT_ID_PATTERN.test(projectId)
  ) {
    return null;
  }
  return { token, teamId, projectId };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function errorCodeOf(body: unknown): string | null {
  if (!isRecord(body)) return null;
  if (typeof body.code === "string") return body.code;
  return isRecord(body.error) && typeof body.error.code === "string"
    ? body.error.code
    : null;
}

/** Reports a failure without the request, its headers or the original error text. */
function reportFailure(kind: string, status?: number): void {
  const error = new Error(kind);
  reportApiError({
    route: "/konto/statistik",
    step: "upstream-proxy",
    error,
    ...(status === undefined ? {} : { extra: { upstreamStatus: status } }),
  });
}

async function queryVercel(
  config: VercelApiConfig,
  path: string,
  params: Readonly<Record<string, string>>,
): Promise<QueryOutcome> {
  const search = new URLSearchParams({
    ...params,
    projectId: config.projectId,
    teamId: config.teamId,
  });
  let response: Response;
  try {
    response = await fetch(`${VERCEL_API_ORIGIN}${path}?${search.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    reportFailure("vercel_analytics_request_failed");
    return { kind: "failed" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (response.status === 400 && errorCodeOf(body) === NOT_ENABLED_CODE) {
    return { kind: "not-enabled" };
  }
  if (!response.ok || body === undefined) {
    reportFailure("vercel_analytics_response_failed", response.status);
    return { kind: "failed" };
  }
  return { kind: "ok", body };
}

function eventNameFilter(event: AnalyticsEventName): string {
  if (!isAnalyticsEventName(event) || !SAFE_VALUE.test(event)) {
    throw new Error("unregistered_analytics_event");
  }
  return `eventName eq '${event}'`;
}

function parseTotals(body: unknown): AnalyticsSection<AnalyticsTotals> {
  if (!isRecord(body) || !isRecord(body.data)) return UNAVAILABLE_SECTION;
  const { pageviews, visitors } = body.data;
  return isCount(pageviews) && isCount(visitors)
    ? { state: "ready", data: { pageviews, visitors } }
    : UNAVAILABLE_SECTION;
}

interface BreakdownSpec {
  readonly dimensionKeys: readonly string[];
  readonly metricKeys: readonly string[];
  readonly accepts: (value: string) => boolean;
}

function parseBreakdown(
  body: unknown,
  spec: BreakdownSpec,
): AnalyticsSection<readonly AnalyticsBreakdownRow[]> {
  if (!isRecord(body) || !Array.isArray(body.data)) return UNAVAILABLE_SECTION;
  const parsed = body.data.flatMap((row): AnalyticsBreakdownRow[] => {
    if (!isRecord(row)) return [];
    const value = spec.dimensionKeys
      .map((key) => row[key])
      .find((candidate) => typeof candidate === "string");
    const count = spec.metricKeys.map((key) => row[key]).find(isCount);
    return typeof value === "string" && count !== undefined
      ? [{ value, count }]
      : [];
  });
  if (body.data.length > 0 && parsed.length === 0) return UNAVAILABLE_SECTION;
  const rows = parsed
    .filter(({ value, count }) => spec.accepts(value) && count >= MIN_REPORTABLE_COUNT)
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
  return { state: "ready", data: rows };
}

const VISIT_METRIC_KEYS = ["pageviews", "count", "total"] as const;
const EVENT_METRIC_KEYS = ["count", "events", "total"] as const;

function acceptsRoute(value: string): boolean {
  return (
    value.startsWith("/") &&
    value.length <= ROUTE_MAX_LENGTH &&
    !/[?#\s]/.test(value)
  );
}

function vocabularyOf(
  event: AnalyticsEventName,
  property: "subject" | "facet",
): ReadonlySet<string> {
  const definition: { readonly subject: readonly string[]; readonly facet?: readonly string[] } =
    ANALYTICS_EVENTS[event];
  return new Set(property === "subject" ? definition.subject : (definition.facet ?? []));
}

function windowParams(now: Date): Readonly<Record<string, string>> {
  return {
    since: new Date(now.getTime() - VERCEL_ANALYTICS_WINDOW_DAYS * DAY_MS).toISOString(),
    until: now.toISOString(),
  };
}

function allUnavailable(): VercelAnalyticsReport {
  return {
    state: "ready",
    windowDays: VERCEL_ANALYTICS_WINDOW_DAYS,
    totals: UNAVAILABLE_SECTION,
    routes: UNAVAILABLE_SECTION,
    events: UNAVAILABLE_SECTION,
    courseStarts: UNAVAILABLE_SECTION,
    lessonCompletions: UNAVAILABLE_SECTION,
    courseCompletionSteps: UNAVAILABLE_SECTION,
  };
}

function sectionFrom<T>(
  outcome: QueryOutcome,
  parse: (body: unknown) => AnalyticsSection<T>,
): AnalyticsSection<T> {
  if (outcome.kind !== "ok") return UNAVAILABLE_SECTION;
  const section = parse(outcome.body);
  if (section.state === "unavailable") {
    reportFailure("vercel_analytics_unexpected_shape");
  }
  return section;
}

/**
 * Aggregate Web Analytics for the last 30 days before `now`. Returns null
 * unless the current request is the verified owner; no request is made then.
 */
export async function readVercelAnalytics({
  now,
}: {
  readonly now: Date;
}): Promise<VercelAnalytics | null> {
  if ((await requireAdminUser()) !== "admin") return null;

  const config = readConfig();
  if (!config) return { state: "disabled" };
  if (!Number.isFinite(now.getTime())) return allUnavailable();

  const window = windowParams(now);
  const funnelQueries = FUNNEL_BREAKDOWNS.map(({ event, property }) =>
    queryVercel(config, "/v1/query/web-analytics/events/aggregate", {
      ...window,
      by: `eventData/${property}`,
      limit: BREAKDOWN_LIMIT,
      filter: eventNameFilter(event),
    }),
  );
  const [totals, routes, events, ...funnels] = await Promise.all([
    queryVercel(config, "/v1/query/web-analytics/visits/count", window),
    queryVercel(config, "/v1/query/web-analytics/visits/aggregate", {
      ...window,
      by: "route",
      limit: BREAKDOWN_LIMIT,
    }),
    queryVercel(config, "/v1/query/web-analytics/events/aggregate", {
      ...window,
      by: "eventName",
      limit: BREAKDOWN_LIMIT,
    }),
    ...funnelQueries,
  ]);

  if ([totals, routes, events, ...funnels].some((outcome) => outcome.kind === "not-enabled")) {
    return { state: "not-enabled" };
  }

  const funnelSections = Object.fromEntries(
    FUNNEL_BREAKDOWNS.map(({ key, event, property }, index) => {
      const vocabulary = vocabularyOf(event, property);
      const outcome = funnels[index] ?? { kind: "failed" as const };
      return [
        key,
        sectionFrom(outcome, (body) =>
          parseBreakdown(body, {
            dimensionKeys: [`eventData/${property}`, property, "eventData"],
            metricKeys: EVENT_METRIC_KEYS,
            accepts: (value) => vocabulary.has(value),
          }),
        ),
      ];
    }),
  ) as Record<FunnelKey, AnalyticsSection<readonly AnalyticsBreakdownRow[]>>;

  return {
    state: "ready",
    windowDays: VERCEL_ANALYTICS_WINDOW_DAYS,
    totals: sectionFrom(totals, parseTotals),
    routes: sectionFrom(routes, (body) =>
      parseBreakdown(body, {
        dimensionKeys: ["route"],
        metricKeys: VISIT_METRIC_KEYS,
        accepts: acceptsRoute,
      }),
    ),
    events: sectionFrom(events, (body) =>
      parseBreakdown(body, {
        dimensionKeys: ["eventName"],
        metricKeys: EVENT_METRIC_KEYS,
        accepts: isAnalyticsEventName,
      }),
    ),
    courseStarts: funnelSections.courseStarts,
    lessonCompletions: funnelSections.lessonCompletions,
    courseCompletionSteps: funnelSections.courseCompletionSteps,
  };
}
