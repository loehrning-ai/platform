import { beforeEach, describe, expect, it, vi } from "vitest";

type RateLimitInput = {
  readonly key: string;
  readonly windowSeconds: number;
  readonly max: number;
};

const {
  mockGetAuthenticatedUser,
  mockCreateAuthServerClient,
  mockFetchProgress,
  mockTryCreateServiceClient,
  mockConsumeRateLimit,
} = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
  mockCreateAuthServerClient: vi.fn(),
  mockFetchProgress: vi.fn(),
  mockTryCreateServiceClient: vi.fn(),
  mockConsumeRateLimit: vi.fn(
    async (_input: RateLimitInput): Promise<boolean> => true,
  ),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
  createAuthServerClient: () => mockCreateAuthServerClient(),
}));
vi.mock("@/lib/progress/server-store", () => ({
  fetchUnifiedProgressForUser: (...args: unknown[]) => mockFetchProgress(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockTryCreateServiceClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (input: RateLimitInput) => mockConsumeRateLimit(input),
  hashedAuthenticatedRateLimitKey: vi.fn(async (namespace: string) =>
    `${namespace}:user-hmac-sha256-v1:${"b".repeat(64)}`,
  ),
  hashedClientRateLimitKey: vi.fn(async (namespace: string) =>
    `${namespace}:ip-hmac-sha256-v1:${"a".repeat(64)}`,
  ),
}));

import { GET, POST } from "./route";
import { reportApiError } from "@/lib/observability/api-error";

const mockedReportApiError = vi.mocked(reportApiError);

function exportRequest(expectedOwnerId = "user-1"): Request {
  return new Request("http://localhost/api/account/export", {
    headers: {
      "X-Loehrning-Expected-Owner-Id": expectedOwnerId,
    },
  });
}

function exportPostRequest(
  body: string,
  contentType: string,
  {
    origin = "http://localhost",
    fetchSite = "same-origin",
  }: {
    readonly origin?: string;
    readonly fetchSite?: string;
  } = {},
): Request {
  return new Request("http://localhost/api/account/export", {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      Origin: origin,
      "Sec-Fetch-Site": fetchSite,
    },
    body,
  });
}

function queryResult(
  data: readonly unknown[],
  error: unknown = null,
  { serverCap = 1_000 }: { readonly serverCap?: number } = {},
) {
  const rangeErrors = new Map<number, unknown>();
  const rangeRejections = new Map<number, unknown>();
  const countOverrides = new Map<number, number | null>();
  const emptyRanges = new Set<number>();
  if (error) rangeErrors.set(0, error);

  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(async (from: number, to: number) => {
      const rejection = rangeRejections.get(from);
      if (rejection) throw rejection;
      const rangeError = rangeErrors.get(from);
      const cappedTo = Math.min(to, from + serverCap - 1);
      return {
        data:
          rangeError || emptyRanges.has(from)
            ? []
            : data.slice(from, cappedTo + 1),
        error: rangeError ?? null,
        count: countOverrides.has(from)
          ? countOverrides.get(from)
          : data.length,
      };
    }),
    rangeErrors,
    rangeRejections,
    countOverrides,
    emptyRanges,
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  return builder;
}

const EMPTY_PROGRESS = {
  schemaVersion: 3,
  courses: {},
  xp: 0,
  checkpoints: {},
  badges: {},
  streak: { days: 0, last: null },
  lastActivity: null,
};

beforeEach(() => {
  mockGetAuthenticatedUser.mockReset();
  mockGetAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: { id: "user-1", email: "learner@example.test" },
  });
  mockCreateAuthServerClient.mockReset();
  mockCreateAuthServerClient.mockResolvedValue({ id: "cookie-client" });
  mockFetchProgress.mockReset();
  mockFetchProgress.mockResolvedValue({
    ok: true,
    result: {
      progress: EMPTY_PROGRESS,
      updatedAt: "2026-07-28T20:00:00.000Z",
      courseResetAt: { "ai-native": "2026-07-28T19:00:00.000Z" },
      rawRows: [],
    },
  });
  mockTryCreateServiceClient.mockReset();
  mockConsumeRateLimit.mockReset();
  mockConsumeRateLimit.mockResolvedValue(true);
  mockedReportApiError.mockClear();
});

describe("GET /api/account/export", () => {
  it.each([
    ["missing", new Request("http://localhost/api/account/export"), 400],
    ["stale", exportRequest("user-A"), 409],
  ])(
    "rejects a %s owner binding before reading account data",
    async (_label, request, status) => {
      const response = await GET(request);

      expect(response.status).toBe(status);
      expect(mockCreateAuthServerClient).not.toHaveBeenCalled();
      expect(mockFetchProgress).not.toHaveBeenCalled();
      expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
      if (_label === "missing") {
        expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
      } else {
        expect(mockGetAuthenticatedUser).toHaveBeenCalledTimes(1);
      }
    },
  );

  it.each([
    ["authenticated user", 0],
    ["trusted client", 1],
  ])(
    "returns 429 when the %s export budget is exhausted before any read",
    async (_label, deniedCall) => {
      mockConsumeRateLimit.mockImplementation(async () =>
        mockConsumeRateLimit.mock.calls.length - 1 !== deniedCall,
      );

      const response = await GET(exportRequest());

      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({ error: "rate_limit_exceeded" });
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("retry-after")).toBe("3600");
      expect(mockConsumeRateLimit).toHaveBeenCalledTimes(deniedCall + 1);
      expect(
        mockConsumeRateLimit.mock.calls.map(([argument]) =>
          (argument as { key: string }).key,
        ),
      ).toEqual(
        deniedCall === 0
          ? [`account-export:user-hmac-sha256-v1:${"b".repeat(64)}`]
          : [
              `account-export:user-hmac-sha256-v1:${"b".repeat(64)}`,
              `account-export-ip:ip-hmac-sha256-v1:${"a".repeat(64)}`,
            ],
      );
      expect(mockCreateAuthServerClient).not.toHaveBeenCalled();
      expect(mockFetchProgress).not.toHaveBeenCalled();
      expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
    },
  );

  it("returns 503 when the durable export limiter is unavailable before any read", async () => {
    mockConsumeRateLimit.mockRejectedValueOnce(
      Object.assign(new Error("limiter unavailable"), {
        code: "RATE_LIMIT_UNAVAILABLE",
      }),
    );

    const response = await GET(exportRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "rate_limit_unavailable" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockCreateAuthServerClient).not.toHaveBeenCalled();
    expect(mockFetchProgress).not.toHaveBeenCalled();
    expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/export",
        step: "rate-limit",
      }),
    );
  });

  it("includes dormant account-linked assessment records", async () => {
    const runs = [{ id: "run-1", user_id: "user-1", score: 80 }];
    const answers = [{ id: "answer-1", user_id: "user-1", is_correct: true }];
    const rawProgressRows = [
      {
        user_id: "user-1",
        course_slug: "ai-native",
        progress: { schemaVersion: 3, malformed_owned_payload: true },
        created_at: "2026-07-28T19:00:00.000Z",
        updated_at: "2026-07-28T20:00:00.000Z",
      },
    ];
    mockFetchProgress.mockResolvedValueOnce({
      ok: true,
      result: {
        progress: EMPTY_PROGRESS,
        updatedAt: "2026-07-28T20:00:00.000Z",
        courseResetAt: {},
        rawRows: rawProgressRows,
      },
    });
    const runsQuery = queryResult(runs);
    const answersQuery = queryResult(answers);
    const from = vi.fn((table: string) =>
      table === "assessment_runs" ? runsQuery : answersQuery,
    );
    mockTryCreateServiceClient.mockReturnValue({ from });

    const response = await GET(exportRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="loehrning-export-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(payload.owner_id).toBe("user-1");
    expect(payload.progress).toEqual(EMPTY_PROGRESS);
    expect(payload.user_course_progress_rows).toEqual(rawProgressRows);
    expect(payload.assessment_runs).toEqual(runs);
    expect(payload.assessment_answers).toEqual(answers);
    expect(payload.export_complete).toBe(true);
    expect(payload).not.toHaveProperty("export_error");
    expect(runsQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(answersQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(runsQuery.select).toHaveBeenCalledWith("*", { count: "exact" });
    expect(answersQuery.select).toHaveBeenCalledWith("*", { count: "exact" });
    expect(runsQuery.order.mock.calls).toEqual([
      ["started_at", { ascending: true }],
      ["id", { ascending: true }],
    ]);
    expect(answersQuery.order.mock.calls).toEqual([
      ["answered_at", { ascending: true }],
      ["id", { ascending: true }],
    ]);
    expect(runsQuery.range).toHaveBeenCalledWith(0, 999);
    expect(answersQuery.range).toHaveBeenCalledWith(0, 999);
  });

  it("paginates by actual rows returned when the project cap is below the requested range", async () => {
    const runs = Array.from({ length: 1_003 }, (_, index) => ({
      id: `run-${String(index).padStart(4, "0")}`,
      user_id: "user-1",
      started_at: "2026-07-28T20:00:00.000Z",
    }));
    const answers = Array.from({ length: 237 }, (_, index) => ({
      id: `answer-${String(index).padStart(4, "0")}`,
      user_id: "user-1",
      answered_at: "2026-07-28T20:00:00.000Z",
    }));
    const runsQuery = queryResult(runs, null, { serverCap: 137 });
    const answersQuery = queryResult(answers, null, { serverCap: 97 });
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.assessment_runs).toEqual(runs);
    expect(payload.assessment_answers).toEqual(answers);
    expect(payload.export_complete).toBe(true);
    expect(runsQuery.range.mock.calls.map(([from]) => from)).toEqual([
      0, 137, 274, 411, 548, 685, 822, 959,
    ]);
    expect(answersQuery.range.mock.calls.map(([from]) => from)).toEqual([
      0, 97, 194,
    ]);
  });

  it("fails instead of silently omitting assessments when a read fails", async () => {
    const runsQuery = queryResult([], new Error("assessment store down"));
    const answersQuery = queryResult([]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "export_failed" });
  });

  it("closes valid JSON with an incomplete marker when a later assessment page fails", async () => {
    const pageOne = Array.from({ length: 1_001 }, (_, index) => ({
      id: `run-${index}`,
      user_id: "user-1",
    }));
    const laterError = new Error("second assessment page failed");
    const runsQuery = queryResult(pageOne);
    runsQuery.rangeErrors.set(1_000, laterError);
    const answersQuery = queryResult([]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());
    const serialized = await response.text();
    const payload = JSON.parse(serialized);

    expect(response.status).toBe(200);
    expect(payload.assessment_runs).toHaveLength(1_000);
    expect(payload.assessment_answers).toEqual([]);
    expect(payload.certificates).toEqual([]);
    expect(payload.export_error).toBe("export_failed");
    expect(payload.export_complete).toBe(false);
    expect(serialized).not.toContain(laterError.message);
    expect(serialized).toMatch(/"export_complete": false\n}\n$/);
    expect(runsQuery.range.mock.calls).toEqual([
      [0, 999],
      [1_000, 1_999],
    ]);
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/export",
        step: "assessment-read",
        error: laterError,
      }),
    );
  });

  it("fails closed when exact count metadata is missing", async () => {
    const runsQuery = queryResult([{ id: "run-1" }]);
    runsQuery.countOverrides.set(0, null);
    const answersQuery = queryResult([]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "export_failed" });
  });

  it("marks the stream incomplete when a later page is empty before exact count", async () => {
    const runsQuery = queryResult(
      Array.from({ length: 1_001 }, (_, index) => ({ id: `run-${index}` })),
    );
    runsQuery.emptyRanges.add(1_000);
    const answersQuery = queryResult([]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.assessment_runs).toHaveLength(1_000);
    expect(payload.export_error).toBe("export_failed");
    expect(payload.export_complete).toBe(false);
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
  });

  it("marks the stream incomplete when exact count changes between pages", async () => {
    const runs = Array.from({ length: 1_001 }, (_, index) => ({
      id: `run-${index}`,
      user_id: "user-1",
    }));
    const runsQuery = queryResult(runs);
    runsQuery.countOverrides.set(1_000, 1_002);
    const answersQuery = queryResult([]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.assessment_runs).toHaveLength(1_000);
    expect(payload.export_error).toBe("export_failed");
    expect(payload.export_complete).toBe(false);
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
  });

  it("streams a production-shape export larger than Vercel's 4.5 MB buffered limit", async () => {
    const rowPayload = "x".repeat(5_000);
    const runs = Array.from({ length: 1_001 }, (_, index) => ({
      id: `run-${String(index).padStart(4, "0")}`,
      user_id: "user-1",
      started_at: "2026-07-28T20:00:00.000Z",
      response_snapshot: rowPayload,
    }));
    const runsQuery = queryResult(runs);
    const answersQuery = queryResult([]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());
    expect(response.body).not.toBeNull();
    expect(runsQuery.range.mock.calls).toEqual([[0, 999]]);

    const serialized = await response.text();
    const payload = JSON.parse(serialized);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBeNull();
    expect(new TextEncoder().encode(serialized).byteLength).toBeGreaterThan(
      4.5 * 1024 * 1024,
    );
    expect(payload.assessment_runs).toHaveLength(1_001);
    expect(payload.export_complete).toBe(true);
    expect(serialized).toMatch(/"export_complete": true\n}\n$/);
    expect(runsQuery.range.mock.calls).toEqual([
      [0, 999],
      [1_000, 1_999],
    ]);
  });

  it("fails closed when the service-only assessment store is unavailable", async () => {
    mockTryCreateServiceClient.mockReturnValue(null);
    const response = await GET(exportRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "export_store_unavailable",
    });
  });

  it("returns 503 when the cookie-bound auth client cannot be created", async () => {
    mockCreateAuthServerClient.mockRejectedValueOnce(
      new Error("cookie store unavailable"),
    );
    const response = await GET(exportRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockFetchProgress).not.toHaveBeenCalled();
  });

  it("converts a rejected progress read into one reported export failure", async () => {
    const readError = new Error("progress transport rejected");
    mockFetchProgress.mockRejectedValueOnce(readError);

    const response = await GET(exportRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "export_failed" });
    expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/export",
        step: "supabase-read",
        error: readError,
      }),
    );
  });

  it("converts a rejected assessment query into one reported export failure", async () => {
    const queryError = new Error("assessment transport rejected");
    const runsQuery = queryResult([]);
    runsQuery.rangeRejections.set(0, queryError);
    const answersQuery = queryResult([]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await GET(exportRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "export_failed" });
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/export",
        step: "assessment-read",
        error: queryError,
      }),
    );
  });

  it("converts a rejected auth lookup into one reported 503", async () => {
    const authError = new Error("auth helper rejected");
    mockGetAuthenticatedUser.mockRejectedValueOnce(authError);

    const response = await GET(exportRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(mockCreateAuthServerClient).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/export",
        step: "auth-get-user",
        error: authError,
      }),
    );
  });
});

describe("POST /api/account/export", () => {
  it("returns a bounded owner-bound preflight without consuming the export budget", async () => {
    mockTryCreateServiceClient.mockReturnValue({ id: "service-client" });
    const response = await POST(
      exportPostRequest(
        JSON.stringify({
          expectedOwnerId: "user-1",
          preflight: true,
        }),
        "application/json",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ready: true,
      ownerId: "user-1",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("cross-origin-resource-policy")).toBe(
      "same-origin",
    );
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
    expect(mockCreateAuthServerClient).not.toHaveBeenCalled();
    expect(mockFetchProgress).not.toHaveBeenCalled();
    expect(mockTryCreateServiceClient).toHaveBeenCalledTimes(1);
  });

  it("does not claim native-download readiness without the service-only export store", async () => {
    mockTryCreateServiceClient.mockReturnValue(null);

    const response = await POST(
      exportPostRequest(
        JSON.stringify({
          expectedOwnerId: "user-1",
          preflight: true,
        }),
        "application/json",
      ),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "export_store_unavailable",
    });
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
    expect(mockFetchProgress).not.toHaveBeenCalled();
  });

  it.each([
    ["cross-site origin", "https://attacker.example", "cross-site"],
    ["missing origin", "", "same-origin"],
    ["contradictory fetch metadata", "http://localhost", "cross-site"],
  ])("rejects a %s before authentication", async (_label, origin, fetchSite) => {
    const request = exportPostRequest(
      JSON.stringify({
        expectedOwnerId: "user-1",
        preflight: true,
      }),
      "application/json",
      { origin, fetchSite },
    );
    if (!origin) request.headers.delete("origin");

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "cross_origin_request_rejected",
    });
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("rejects an arbitrary self-consistent request authority", async () => {
    const response = await POST(
      new Request("https://attacker.example/api/account/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.example",
          "Sec-Fetch-Site": "same-origin",
        },
        body: JSON.stringify({
          expectedOwnerId: "user-1",
          preflight: true,
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "cross_origin_request_rejected",
    });
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("rejects oversized and malformed POST bodies before authentication", async () => {
    const oversized = await POST(
      exportPostRequest("x".repeat(2_049), "application/json"),
    );
    expect(oversized.status).toBe(400);

    const malformed = await POST(
      exportPostRequest(
        JSON.stringify({
          expectedOwnerId: "user-1",
          preflight: false,
        }),
        "application/json",
      ),
    );
    expect(malformed.status).toBe(400);
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("rejects dishonest length metadata and invalid UTF-8 before authentication", async () => {
    const dishonestLength = exportPostRequest(
      "{}",
      "application/json",
    );
    dishonestLength.headers.set("Content-Length", "2049");
    const invalidLength = exportPostRequest("{}", "application/json");
    invalidLength.headers.set("Content-Length", "2e3");
    const invalidUtf8 = new Request(
      "http://localhost/api/account/export",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost",
          "Sec-Fetch-Site": "same-origin",
        },
        body: new Uint8Array([0xc3, 0x28]),
      },
    );

    expect((await POST(dishonestLength)).status).toBe(400);
    expect((await POST(invalidLength)).status).toBe(400);
    expect((await POST(invalidUtf8)).status).toBe(400);
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("rejects duplicate form owner bindings before authentication", async () => {
    const response = await POST(
      exportPostRequest(
        "expectedOwnerId=user-1&expectedOwnerId=user-2",
        "application/x-www-form-urlencoded",
      ),
    );

    expect(response.status).toBe(400);
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("rejects unsupported POST media types before authentication", async () => {
    const response = await POST(
      exportPostRequest(
        "expectedOwnerId=user-1",
        "text/plain; charset=utf-8",
      ),
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: "invalid_export_request",
    });
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("owner-binds the native form POST before consuming budget or reading data", async () => {
    const response = await POST(
      exportPostRequest(
        "expectedOwnerId=user-2",
        "application/x-www-form-urlencoded",
      ),
    );

    expect(response.status).toBe(409);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(response.headers.get("content-language")).toBe("de");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    const html = await response.text();
    expect(html).toContain("<h1>Datenexport fehlgeschlagen</h1>");
    expect(html).toContain(
      "<code>account_owner_mismatch</code>",
    );
    expect(html).toContain('href="/konto/datenschutz"');
    expect(html).not.toContain("user-1");
    expect(html).not.toContain("user-2");
    expect(html).not.toContain("<script");
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
    expect(mockFetchProgress).not.toHaveBeenCalled();
    expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
  });

  it("localizes the bounded native form error without weakening owner binding", async () => {
    const response = await POST(
      exportPostRequest(
        "expectedOwnerId=user-2&locale=en",
        "application/x-www-form-urlencoded",
      ),
    );

    expect(response.status).toBe(409);
    expect(response.headers.get("content-language")).toBe("en");
    const html = await response.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<h1>Data export failed</h1>");
    expect(html).toContain("<code>account_owner_mismatch</code>");
    expect(html).toContain('href="/en/konto/datenschutz"');
    expect(html).toContain("Back to privacy and data management");
    expect(html).not.toContain("user-1");
    expect(html).not.toContain("user-2");
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
    expect(mockFetchProgress).not.toHaveBeenCalled();
  });

  it("rejects duplicate or unsupported form locales before authentication", async () => {
    for (const body of [
      "expectedOwnerId=user-1&locale=en&locale=de",
      "expectedOwnerId=user-1&locale=fr",
    ]) {
      const response = await POST(
        exportPostRequest(body, "application/x-www-form-urlencoded"),
      );
      expect(response.status).toBe(400);
    }
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("renders a bounded, retryable native form error when export quota is exhausted", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce(false);

    const response = await POST(
      exportPostRequest(
        "expectedOwnerId=user-1",
        "application/x-www-form-urlencoded",
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(429);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(html).toContain("<code>rate_limit_exceeded</code>");
    expect(html).toContain("Warte bis zu einer Stunde");
    expect(mockConsumeRateLimit).toHaveBeenCalledTimes(1);
    expect(mockFetchProgress).not.toHaveBeenCalled();
    expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
  });

  it("streams an owner-bound native form POST with hardened attachment headers", async () => {
    const runsQuery = queryResult([{ id: "run-1", user_id: "user-1" }]);
    const answersQuery = queryResult([
      { id: "answer-1", user_id: "user-1" },
    ]);
    mockTryCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "assessment_runs" ? runsQuery : answersQuery,
      ),
    });

    const response = await POST(
      exportPostRequest(
        "expectedOwnerId=user-1",
        "application/x-www-form-urlencoded; charset=UTF-8",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="loehrning-export-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cross-origin-resource-policy")).toBe(
      "same-origin",
    );
    expect(payload.owner_id).toBe("user-1");
    expect(payload.assessment_runs).toHaveLength(1);
    expect(payload.assessment_answers).toHaveLength(1);
    expect(payload.export_complete).toBe(true);
    expect(mockConsumeRateLimit).toHaveBeenCalledTimes(2);
  });
});
