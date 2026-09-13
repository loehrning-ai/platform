import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_EVENTS } from "@/lib/analytics/registry";

const mockRequireAdminUser = vi.fn();
const mockReportApiError = vi.fn();

vi.mock("@/lib/auth/admin-identity", () => ({
  requireAdminUser: () => mockRequireAdminUser(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

import { readVercelAnalytics, type VercelAnalyticsReport } from "./vercel-analytics";

const TEST_TOKEN = "synthetic-analytics-test-credential";
const TEAM_ID = "team_SyntheticTeam01";
const PROJECT_ID = "prj_SyntheticProject01";
const NOW = new Date("2026-09-13T12:00:00.000Z");

type Handler = (url: URL) => Response | Promise<Response>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const HAPPY: Handler = (url) => {
  const by = url.searchParams.get("by");
  const filter = url.searchParams.get("filter");
  if (url.pathname.endsWith("/visits/count")) {
    return json({ data: { pageviews: 1200, visitors: 300 } });
  }
  if (url.pathname.endsWith("/visits/aggregate")) {
    return json({
      data: [
        { route: "/kurse", pageviews: 40 },
        { route: "/ki-fuehrerschein/kurs", pageviews: 90 },
        { route: "/rare", pageviews: 4 },
        { route: "/search?q=private", pageviews: 50 },
      ],
    });
  }
  if (by === "eventName") {
    return json({
      data: [
        { eventName: "course_started", count: 25 },
        { eventName: "login_flow", count: 3 },
        { eventName: "not_registered", count: 99 },
      ],
    });
  }
  if (filter === "eventName eq 'course_completion'") {
    return json({
      data: [
        { "eventData/facet": "exam_passed", count: 8 },
        { "eventData/facet": "exam_failed", count: 2 },
      ],
    });
  }
  return json({
    data: [
      { "eventData/subject": "ki-fuehrerschein", count: 12 },
      { "eventData/subject": "codex", count: 4 },
      { "eventData/subject": "someone@example.com", count: 50 },
    ],
  });
};

let handler: Handler = HAPPY;
const fetchMock = vi.fn(async (input: string | URL | Request) =>
  handler(new URL(typeof input === "string" ? input : input.toString())),
);

function requestedUrls(): URL[] {
  return fetchMock.mock.calls.map(([input]) => new URL(String(input)));
}

async function readyReport(): Promise<VercelAnalyticsReport> {
  const result = await readVercelAnalytics({ now: NOW });
  if (!result || result.state !== "ready") {
    throw new Error(`expected a ready report, got ${JSON.stringify(result)}`);
  }
  return result;
}

describe("readVercelAnalytics", () => {
  beforeEach(() => {
    handler = HAPPY;
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VERCEL_ANALYTICS_API_TOKEN", TEST_TOKEN);
    vi.stubEnv("VERCEL_ANALYTICS_TEAM_ID", TEAM_ID);
    vi.stubEnv("VERCEL_PROJECT_ID", PROJECT_ID);
    mockRequireAdminUser.mockResolvedValue("admin");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it.each(["reauth", "denied", "signed-out", "unavailable", "disabled"])(
    "returns null for the %s gate state without calling fetch",
    async (state) => {
      mockRequireAdminUser.mockResolvedValue(state);
      await expect(readVercelAnalytics({ now: NOW })).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    "VERCEL_ANALYTICS_API_TOKEN",
    "VERCEL_ANALYTICS_TEAM_ID",
    "VERCEL_PROJECT_ID",
  ])("is disabled without %s and makes no request", async (key) => {
    vi.stubEnv(key, "");
    await expect(readVercelAnalytics({ now: NOW })).resolves.toEqual({
      state: "disabled",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is disabled for a malformed team id", async () => {
    vi.stubEnv("VERCEL_ANALYTICS_TEAM_ID", "my-team");
    await expect(readVercelAnalytics({ now: NOW })).resolves.toEqual({
      state: "disabled",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("queries the documented endpoints with the bearer token, no cache and a timeout", async () => {
    await readyReport();
    expect(fetchMock).toHaveBeenCalledTimes(6);
    for (const [input, init] of fetchMock.mock.calls as unknown as [
      string,
      RequestInit,
    ][]) {
      const url = new URL(input);
      expect(url.origin).toBe("https://api.vercel.com");
      expect(url.pathname).toMatch(
        /^\/v1\/query\/web-analytics\/(visits|events)\/(count|aggregate)$/,
      );
      expect(url.searchParams.get("projectId")).toBe(PROJECT_ID);
      expect(url.searchParams.get("teamId")).toBe(TEAM_ID);
      expect(url.searchParams.get("since")).toBe("2026-08-14T12:00:00.000Z");
      expect(url.searchParams.get("until")).toBe("2026-09-13T12:00:00.000Z");
      expect(url.toString()).not.toContain(TEST_TOKEN);
      expect(init.cache).toBe("no-store");
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect((init.headers as Record<string, string>).Authorization).toBe(
        `Bearer ${TEST_TOKEN}`,
      );
    }
    const breakdowns = requestedUrls()
      .map((url) => url.searchParams.get("by"))
      .filter((by): by is string => by !== null)
      .sort();
    expect(breakdowns).toEqual([
      "eventData/facet",
      "eventData/subject",
      "eventData/subject",
      "eventName",
      "route",
    ]);
    for (const url of requestedUrls()) {
      if (url.searchParams.has("limit")) {
        expect(url.searchParams.get("limit")).toBe("20");
      }
    }
  });

  it("only ever filters on event names declared in the analytics registry", async () => {
    await readyReport();
    const filters = requestedUrls()
      .map((url) => url.searchParams.get("filter"))
      .filter((filter): filter is string => filter !== null);
    expect(filters.sort()).toEqual([
      "eventName eq 'course_completion'",
      "eventName eq 'course_started'",
      "eventName eq 'lesson_completed'",
    ]);
    for (const filter of filters) {
      const name = /^eventName eq '([a-z_]+)'$/.exec(filter)?.[1];
      expect(name && Object.hasOwn(ANALYTICS_EVENTS, name)).toBe(true);
    }
  });

  it("returns totals and omits every breakdown row below the minimum count", async () => {
    const report = await readyReport();
    expect(report.windowDays).toBe(30);
    expect(report.totals).toEqual({
      state: "ready",
      data: { pageviews: 1200, visitors: 300 },
    });
    expect(report.routes).toEqual({
      state: "ready",
      data: [
        { value: "/ki-fuehrerschein/kurs", count: 90 },
        { value: "/kurse", count: 40 },
      ],
    });
    expect(report.events).toEqual({
      state: "ready",
      data: [{ value: "course_started", count: 25 }],
    });
    expect(report.courseStarts).toEqual({
      state: "ready",
      data: [{ value: "ki-fuehrerschein", count: 12 }],
    });
    expect(report.courseCompletionSteps).toEqual({
      state: "ready",
      data: [{ value: "exam_passed", count: 8 }],
    });
  });

  it("reports not-enabled when Vercel Web Analytics is off for the project", async () => {
    handler = () =>
      json({ error: { code: "web_analytics_not_enabled", message: "off" } }, 400);
    await expect(readVercelAnalytics({ now: NOW })).resolves.toEqual({
      state: "not-enabled",
    });
  });

  it("makes a malformed section unavailable without guessing", async () => {
    handler = (url) => {
      if (url.pathname.endsWith("/visits/count")) {
        return json({ data: { pageviews: "1200", visitors: -1 } });
      }
      if (url.pathname.endsWith("/visits/aggregate")) {
        return json({ data: [{ route: 42, pageviews: "many" }] });
      }
      if (url.searchParams.get("by") === "eventName") {
        return json({ data: "nope" });
      }
      return HAPPY(url);
    };
    const report = await readyReport();
    expect(report.totals).toEqual({ state: "unavailable" });
    expect(report.routes).toEqual({ state: "unavailable" });
    expect(report.events).toEqual({ state: "unavailable" });
    expect(report.courseStarts.state).toBe("ready");
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ route: "/konto/statistik", step: "upstream-proxy" }),
    );
  });

  it("makes every section unavailable on HTTP failures and rejected requests", async () => {
    handler = () => json({ error: { code: "forbidden" } }, 403);
    const forbidden = await readyReport();
    expect(forbidden.totals.state).toBe("unavailable");
    expect(forbidden.courseCompletionSteps.state).toBe("unavailable");

    handler = () => {
      throw new TypeError(`network failure for ${TEST_TOKEN}`);
    };
    const offline = await readyReport();
    expect(offline.routes.state).toBe("unavailable");
  });

  it("never returns or reports the access token", async () => {
    const outcomes = [];
    outcomes.push(await readVercelAnalytics({ now: NOW }));
    handler = () => json({ error: { code: "forbidden", token: TEST_TOKEN } }, 403);
    outcomes.push(await readVercelAnalytics({ now: NOW }));
    handler = () => {
      throw new Error(`Bearer ${TEST_TOKEN} rejected`);
    };
    outcomes.push(await readVercelAnalytics({ now: NOW }));
    handler = () => json({ data: { note: TEST_TOKEN } });
    outcomes.push(await readVercelAnalytics({ now: NOW }));

    expect(mockReportApiError).toHaveBeenCalled();
    expect(JSON.stringify(outcomes)).not.toContain(TEST_TOKEN);
    for (const [report] of mockReportApiError.mock.calls) {
      const { error, ...rest } = report as { error: Error };
      expect(JSON.stringify(rest)).not.toContain(TEST_TOKEN);
      expect(String(error?.message)).not.toContain(TEST_TOKEN);
      expect(String(error?.stack)).not.toContain(TEST_TOKEN);
      expect(report).not.toHaveProperty("request");
    }
  });
});
