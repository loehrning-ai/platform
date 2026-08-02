import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
}));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockServiceClient = { id: "service-client" };
const mockCreateAuthServerClient = vi.fn<() => Promise<unknown>>(
  async () => ({ from: mockFrom }),
);
const mockTryCreateServiceClient = vi.fn<() => unknown>(
  () => mockServiceClient,
);
const mockConsumeRateLimit = vi.fn<
  (args: {
    readonly key: string;
    readonly windowSeconds: number;
    readonly max: number;
  }) => Promise<boolean>
>(async () => true);

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    configured: true,
    user: {
      id: "user-1",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  })),
  createAuthServerClient: () => mockCreateAuthServerClient(),
}));

vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockTryCreateServiceClient(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (args: {
    readonly key: string;
    readonly windowSeconds: number;
    readonly max: number;
  }) => mockConsumeRateLimit(args),
  hashedClientRateLimitKey: vi.fn(async (namespace: string) =>
    `${namespace}:ip-hmac-sha256-v1:${"a".repeat(64)}`,
  ),
  hashedAuthenticatedRateLimitKey: vi.fn(async (namespace: string) =>
    `${namespace}:user-hmac-sha256-v1:${"b".repeat(64)}`,
  ),
  isRateLimitUnavailableError: (error: unknown) =>
    (error as { code?: string })?.code === "RATE_LIMIT_UNAVAILABLE",
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));

// server-store.ts's own read/merge/write/conflict logic is covered in
// server-store.test.ts (against a fake DB). Mocked here so this file stays
// focused on ONE thing: does route.ts correctly translate a server-store
// outcome into the right HTTP status + body (the client-facing contract).
const mockFetchUnifiedProgressForUser = vi.fn();
const mockUpsertUnifiedProgressForUser = vi.fn();
vi.mock("@/lib/progress/server-store", () => ({
  fetchUnifiedProgressForUser: (...args: unknown[]) =>
    mockFetchUnifiedProgressForUser(...args),
  upsertUnifiedProgressForUser: (...args: unknown[]) =>
    mockUpsertUnifiedProgressForUser(...args),
}));

import { GET, PUT } from "./route";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { reportApiError } from "@/lib/observability/api-error";

const mockedRateLimit = mockConsumeRateLimit;
const mockedAuthClient = mockCreateAuthServerClient;
const mockedGetAuthenticatedUser = vi.mocked(getAuthenticatedUser);
const mockedReportApiError = vi.mocked(reportApiError);
const mockedServiceClient = mockTryCreateServiceClient;
const NON_JSON_MEDIA_TYPES = [
  ["missing", undefined],
  ["unsupported", "text/plain"],
  ["JSON lookalike", "application/jsonp"],
] as const;

beforeEach(() => {
  mockedGetAuthenticatedUser.mockReset();
  mockedGetAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: {
      id: "user-1",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  });
  mockedReportApiError.mockClear();
});

const VALID_PROGRESS = {
  schemaVersion: 3,
  courses: {},
  xp: 0,
  checkpoints: {},
  badges: {},
  streak: { days: 0, last: null },
  lastActivity: "2026-06-03T00:00:00.000Z",
};

function streamingRequest(body: string): Request {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += 64 * 1024) {
        controller.enqueue(bytes.slice(offset, offset + 64 * 1024));
      }
      controller.close();
    },
  });

  return new Request("http://localhost/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("PUT /api/progress payload boundary", () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockMaybeSingle.mockReset();
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
    mockedAuthClient.mockReset();
    mockedAuthClient.mockResolvedValue({ from: mockFrom });
    mockedServiceClient.mockReset();
    mockedServiceClient.mockReturnValue(mockServiceClient);
    mockUpsertUnifiedProgressForUser.mockReset();
  });

  it.each(NON_JSON_MEDIA_TYPES)(
    "returns 415 for a %s media type before auth, quotas, or progress storage",
    async (_label, contentType) => {
      const request = new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: contentType
          ? { "Content-Type": contentType }
          : undefined,
        body: contentType ? "{}" : new Uint8Array([123, 125]),
      });
      expect(request.headers.get("content-type")).toBe(contentType ?? null);
      const response = await PUT(request);
      if (!response) {
        throw new Error("PUT must return a response for unsupported media.");
      }

      expect(response.status).toBe(415);
      expect(await response.json()).toEqual({
        error: "unsupported_media_type",
      });
      expect(response.headers.get("cache-control")).toBe(
        "private, no-store",
      );
      expect(mockedGetAuthenticatedUser).not.toHaveBeenCalled();
      expect(mockedAuthClient).not.toHaveBeenCalled();
      expect(mockedRateLimit).not.toHaveBeenCalled();
      expect(mockedServiceClient).not.toHaveBeenCalled();
      expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockedReportApiError).not.toHaveBeenCalled();
    },
  );

  it("rejects a declared oversized payload before parsing", async () => {
    const request = new Request("http://localhost/api/progress", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "262145",
      },
      body: "{}",
    });

    const response = await PUT(request);

    expect(response.status).toBe(413);
    expect((await response.json()) as unknown).toEqual({
      error: "payload_too_large",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects an oversized stream even when Content-Length is absent", async () => {
    const request = streamingRequest(
      JSON.stringify({ progress: { padding: "x".repeat(270_000) } }),
    );
    expect(request.headers.get("content-length")).toBeNull();

    const response = await PUT(request);

    expect(response.status).toBe(413);
    expect((await response.json()) as unknown).toEqual({
      error: "payload_too_large",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 429 before touching the body when the rate limit is exceeded", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);

    const response = await PUT(
      new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: {} }),
      }),
    );

    expect(response.status).toBe(429);
    expect((await response.json()) as unknown).toEqual({
      error: "rate_limit_exceeded",
    });
    expect(mockedRateLimit).toHaveBeenCalledTimes(1);
    expect(mockedRateLimit.mock.calls[0]?.[0].key).toBe(
      `progress:user-hmac-sha256-v1:${"b".repeat(64)}`,
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 503 when the durable limiter is unavailable", async () => {
    mockedRateLimit.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });

    const response = await PUT(
      new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: {} }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "rate_limit_unavailable",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 503 for an unexpected limiter rejection without escaping", async () => {
    const limitError = new Error("limiter transport rejected");
    mockedRateLimit.mockRejectedValueOnce(limitError);

    const response = await PUT(
      new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: {} }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "rate_limit_unavailable",
    });
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress",
        step: "rate-limit",
        error: limitError,
      }),
    );
  });

  it("returns 503 before rate limiting when auth-client creation fails", async () => {
    mockedAuthClient.mockRejectedValueOnce(
      new Error("cookie store unavailable"),
    );
    const response = await PUT(
      new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: {} }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it("enforces independent authenticated-user and client-IP budgets", async () => {
    const response = await PUT(
      new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: {} }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockedRateLimit).toHaveBeenCalledTimes(2);
    expect(mockedRateLimit.mock.calls.map(([argument]) => argument.key)).toEqual([
      `progress:user-hmac-sha256-v1:${"b".repeat(64)}`,
      `progress-ip:ip-hmac-sha256-v1:${"a".repeat(64)}`,
    ]);
    expect(mockedRateLimit.mock.calls.map(([argument]) => argument.max)).toEqual([
      120,
      600,
    ]);
  });
});

describe("GET /api/progress", () => {
  beforeEach(() => {
    mockFetchUnifiedProgressForUser.mockReset();
  });

  it("returns the assembled progress + updatedAt from server-store", async () => {
    mockFetchUnifiedProgressForUser.mockResolvedValueOnce({
      ok: true,
      result: { progress: VALID_PROGRESS, updatedAt: "2026-06-03T00:00:00.000Z" },
    });
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()) as unknown).toEqual({
      ownerId: "user-1",
      progress: VALID_PROGRESS,
      updatedAt: "2026-06-03T00:00:00.000Z",
    });
  });

  it("returns an owner-bound empty state when the account has no progress rows", async () => {
    mockFetchUnifiedProgressForUser.mockResolvedValueOnce({
      ok: true,
      result: { progress: null, updatedAt: null },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      ownerId: "user-1",
      progress: null,
      updatedAt: null,
    });
  });

  it("answers 500 when server-store reports a read failure", async () => {
    mockFetchUnifiedProgressForUser.mockResolvedValueOnce({
      ok: false,
      error: new Error("db down"),
    });
    const response = await GET();
    expect(response.status).toBe(500);
    expect((await response.json()) as unknown).toEqual({
      error: "progress_read_failed",
    });
  });

  it("answers one reported 500 when server-store rejects unexpectedly", async () => {
    const readError = new Error("progress read transport rejected");
    mockFetchUnifiedProgressForUser.mockRejectedValueOnce(readError);

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "progress_read_failed",
    });
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress",
        step: "supabase-read",
        error: readError,
      }),
    );
  });

  it("answers one reported 503 when the auth lookup rejects", async () => {
    const authError = new Error("auth helper rejected");
    mockedGetAuthenticatedUser.mockRejectedValueOnce(authError);

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(mockFetchUnifiedProgressForUser).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress",
        step: "auth-get-user",
        error: authError,
      }),
    );
  });
});

describe("PUT /api/progress happy path + conflict", () => {
  beforeEach(() => {
    mockUpsertUnifiedProgressForUser.mockReset();
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
    mockedServiceClient.mockReset();
    mockedServiceClient.mockReturnValue(mockServiceClient);
  });

  function putRequest(progress: unknown): Request {
    return new Request("http://localhost/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expectedOwnerId: "user-1",
        progress,
      }),
    });
  }

  it("returns ok + the full assembled state on a successful write", async () => {
    mockUpsertUnifiedProgressForUser.mockResolvedValueOnce({
      ok: true,
      result: { progress: VALID_PROGRESS, updatedAt: "2026-06-03T00:00:00.000Z" },
    });
    const response = await PUT(putRequest(VALID_PROGRESS));
    expect(response.status).toBe(200);
    expect((await response.json()) as unknown).toEqual({
      ok: true,
      progress: VALID_PROGRESS,
      updatedAt: "2026-06-03T00:00:00.000Z",
    });
    expect(mockUpsertUnifiedProgressForUser).toHaveBeenCalledWith(
      mockServiceClient,
      "user-1",
      VALID_PROGRESS,
    );
  });

  it("fails closed when the server-only progress store is unavailable", async () => {
    mockedServiceClient.mockReturnValueOnce(null);
    const response = await PUT(putRequest(VALID_PROGRESS));
    expect(response.status).toBe(503);
    expect((await response.json()) as unknown).toEqual({
      error: "progress_store_unavailable",
    });
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 400 for a payload that fails isUnifiedProgress before ever touching server-store", async () => {
    const response = await PUT(putRequest({ not: "valid" }));
    expect(response.status).toBe(400);
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("rejects a stale write after the cookie-bound account changes", async () => {
    const response = await PUT(
      new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedOwnerId: "account-a",
          progress: VALID_PROGRESS,
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "progress_owner_mismatch",
    });
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 409 with the latest assembled state on a per-row conflict", async () => {
    mockUpsertUnifiedProgressForUser.mockResolvedValueOnce({
      ok: false,
      conflict: true,
      result: { progress: VALID_PROGRESS, updatedAt: "2026-06-03T00:00:00.000Z" },
    });
    const response = await PUT(putRequest(VALID_PROGRESS));
    expect(response.status).toBe(409);
    expect((await response.json()) as unknown).toEqual({
      error: "progress_conflict",
      progress: VALID_PROGRESS,
      updatedAt: "2026-06-03T00:00:00.000Z",
    });
  });

  it("answers 500 when server-store reports a non-conflict write failure", async () => {
    mockUpsertUnifiedProgressForUser.mockResolvedValueOnce({
      ok: false,
      error: new Error("db down"),
    });
    const response = await PUT(putRequest(VALID_PROGRESS));
    expect(response.status).toBe(500);
    expect((await response.json()) as unknown).toEqual({
      error: "progress_write_failed",
    });
  });

  it("answers one reported 500 when server-store rejects a write", async () => {
    const writeError = new Error("progress write transport rejected");
    mockUpsertUnifiedProgressForUser.mockRejectedValueOnce(writeError);

    const response = await PUT(putRequest(VALID_PROGRESS));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "progress_write_failed",
    });
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress",
        step: "supabase-write",
        error: writeError,
      }),
    );
  });
});
