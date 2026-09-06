import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockAuthClient = { from: mockFrom };
const mockServiceClient = { id: "service-client" };
const mockCreateAuthServerClient = vi.fn<() => Promise<unknown>>(
  async () => mockAuthClient,
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
  getAuthenticatedUser: vi.fn(),
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
  hashedClientRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:ip-hmac:${"a".repeat(8)}`,
  ),
  hashedAuthenticatedRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:user-hmac:${"b".repeat(8)}`,
  ),
}));

vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));

// server-store owns its own read/merge/write/conflict behaviour and is covered
// in server-store.test.ts against a fake DB. It is mocked here so this file
// answers one question: does the route translate a store outcome and a merge
// decision into the right status and body? merge.ts is deliberately NOT
// mocked; it is the contract this route exists to enforce.
const mockFetchUnifiedProgressForUser = vi.fn();
const mockUpsertUnifiedProgressForUser = vi.fn();
vi.mock("@/lib/progress/server-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/progress/server-store")>();
  return {
    isRowSizeViolation: actual.isRowSizeViolation,
    fetchUnifiedProgressForUser: (...args: unknown[]) =>
      mockFetchUnifiedProgressForUser(...args),
    upsertUnifiedProgressForUser: (...args: unknown[]) =>
      mockUpsertUnifiedProgressForUser(...args),
  };
});

import { POST } from "./route";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { reportApiError } from "@/lib/observability/api-error";
import { LOCAL_IMPORT_MARKER_ID } from "@/lib/progress/merge";
import { UNIFIED_SCHEMA_VERSION, type UnifiedProgress } from "@/lib/progress/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";

const mockedGetAuthenticatedUser = vi.mocked(getAuthenticatedUser);
const mockedReportApiError = vi.mocked(reportApiError);

const USER_ID = "user-1";
const COURSE_SLUG = "ki-fuehrerschein";
const LESSON_ID = CANONICAL_LESSON_IDS[COURSE_SLUG][0] as string;

const AUTHENTICATED_USER = {
  configured: true as const,
  user: {
    id: USER_ID,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
  },
};

const EMPTY_PROGRESS: UnifiedProgress = {
  schemaVersion: UNIFIED_SCHEMA_VERSION,
  courses: {},
  xp: 0,
  checkpoints: {},
  badges: {},
  streak: { days: 0, last: null },
  lastActivity: "2026-06-03T00:00:00.000Z",
};

const SNAPSHOT_WITH_ONE_LESSON: UnifiedProgress = {
  ...EMPTY_PROGRESS,
  courses: {
    [COURSE_SLUG]: {
      lessons: {
        [LESSON_ID]: {
          sectionsRead: [],
          quizScore: null,
          quizTotal: null,
          completed: true,
          exercisesCompleted: {},
        },
      },
      workshopQuiz: { passed: false, score: 0, completedAt: null },
      capstoneSubmitted: false,
      startedAt: "2026-05-01T00:00:00.000Z",
      lastActivity: "2026-06-01T00:00:00.000Z",
    },
  },
};

function importRequest(body: unknown, init: RequestInit = {}): Request {
  return new Request("http://localhost/api/progress/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...init,
  });
}

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
  return new Request("http://localhost/api/progress/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function storedAccount(progress: UnifiedProgress | null) {
  return {
    ok: true,
    result: {
      progress,
      updatedAt: progress ? "2026-06-02T00:00:00.000Z" : null,
      courseResetAt: {},
      rawRows: [],
    },
  };
}

beforeEach(() => {
  mockedGetAuthenticatedUser.mockReset();
  mockedGetAuthenticatedUser.mockResolvedValue(AUTHENTICATED_USER);
  mockedReportApiError.mockClear();
  mockCreateAuthServerClient.mockReset();
  mockCreateAuthServerClient.mockResolvedValue(mockAuthClient);
  mockTryCreateServiceClient.mockReset();
  mockTryCreateServiceClient.mockReturnValue(mockServiceClient);
  mockConsumeRateLimit.mockReset();
  mockConsumeRateLimit.mockResolvedValue(true);
  mockFetchUnifiedProgressForUser.mockReset();
  mockFetchUnifiedProgressForUser.mockResolvedValue(storedAccount(null));
  mockUpsertUnifiedProgressForUser.mockReset();
  mockUpsertUnifiedProgressForUser.mockImplementation(
    async (_client: unknown, _userId: string, progress: UnifiedProgress) => ({
      ok: true,
      result: {
        progress,
        updatedAt: "2026-09-05T12:00:00.000Z",
        courseResetAt: {},
        rawRows: [],
      },
    }),
  );
  mockFrom.mockReset();
});

describe("POST /api/progress/import request gates", () => {
  it.each([
    ["missing", undefined],
    ["unsupported", "text/plain"],
    ["JSON lookalike", "application/jsonp"],
  ])(
    "returns 415 for a %s media type before auth, quotas, or storage",
    async (_label, contentType) => {
      const request = new Request("http://localhost/api/progress/import", {
        method: "POST",
        headers: contentType ? { "Content-Type": contentType } : undefined,
        body: contentType ? "{}" : new Uint8Array([123, 125]),
      });

      const response = await POST(request);

      expect(response.status).toBe(415);
      expect(await response.json()).toEqual({
        error: "unsupported_media_type",
      });
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(mockedGetAuthenticatedUser).not.toHaveBeenCalled();
      expect(mockConsumeRateLimit).not.toHaveBeenCalled();
      expect(mockFetchUnifiedProgressForUser).not.toHaveBeenCalled();
      expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
    },
  );

  it("returns 401 for a signed-out visitor", async () => {
    mockedGetAuthenticatedUser.mockResolvedValueOnce({
      configured: true,
      user: null,
    });

    const response = await POST(importRequest({}));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
  });

  it("returns 503 when auth is not configured", async () => {
    mockedGetAuthenticatedUser.mockResolvedValueOnce({
      configured: false,
      user: null,
    });

    const response = await POST(importRequest({}));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_not_configured" });
  });

  it("reports and returns 503 when the auth backend is unreachable", async () => {
    const authError = new Error("auth backend unreachable");
    mockedGetAuthenticatedUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: authError,
    });

    const response = await POST(importRequest({}));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress/import",
        step: "auth-get-user",
        error: authError,
      }),
    );
  });

  it("returns 503 before rate limiting when the auth client cannot be built", async () => {
    mockCreateAuthServerClient.mockRejectedValueOnce(
      new Error("cookie store unavailable"),
    );

    const response = await POST(importRequest({}));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
  });

  it("enforces independent account and client-IP budgets", async () => {
    await POST(importRequest({ expectedOwnerId: USER_ID, progress: {} }));

    expect(mockConsumeRateLimit.mock.calls.map(([args]) => args.key)).toEqual([
      `progress-import:user-hmac:${"b".repeat(8)}`,
      `progress-import-ip:ip-hmac:${"a".repeat(8)}`,
    ]);
    expect(mockConsumeRateLimit.mock.calls.map(([args]) => args.max)).toEqual([
      10, 100,
    ]);
  });

  it("returns 429 before touching the body once a budget is spent", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce(false);

    const response = await POST(
      importRequest({ expectedOwnerId: USER_ID, progress: {} }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limit_exceeded" });
    expect(mockConsumeRateLimit).toHaveBeenCalledTimes(1);
    expect(mockFetchUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("reports and returns 503 when the limiter itself is unavailable", async () => {
    const limitError = new Error("limiter transport rejected");
    mockConsumeRateLimit.mockRejectedValueOnce(limitError);

    const response = await POST(
      importRequest({ expectedOwnerId: USER_ID, progress: {} }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "rate_limit_unavailable" });
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress/import",
        step: "rate-limit",
        error: limitError,
      }),
    );
  });

  it("rejects a declared oversized payload before parsing", async () => {
    const response = await POST(
      new Request("http://localhost/api/progress/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "262145",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "payload_too_large" });
    expect(mockFetchUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("rejects an oversized stream even when Content-Length is absent", async () => {
    const request = streamingRequest(
      JSON.stringify({ progress: { padding: "x".repeat(270_000) } }),
    );
    expect(request.headers.get("content-length")).toBeNull();

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "payload_too_large" });
    expect(mockFetchUnifiedProgressForUser).not.toHaveBeenCalled();
  });
});

describe("POST /api/progress/import payload validation", () => {
  it.each([
    ["an unrecognized envelope key", { expectedOwnerId: USER_ID, progress: {}, extra: 1 }, "body"],
    ["a missing owner binding", { progress: {} }, "expectedOwnerId"],
    ["a blank owner binding", { expectedOwnerId: "   ", progress: {} }, "expectedOwnerId"],
  ])("returns 400 naming the path for %s", async (_label, body, path) => {
    const response = await POST(importRequest(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_import", path });
    expect(mockFetchUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 400 naming the invalid path inside the snapshot", async () => {
    const response = await POST(
      importRequest({
        expectedOwnerId: USER_ID,
        progress: { ...EMPTY_PROGRESS, streak: { days: -1, last: null } },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "invalid_import",
      path: "progress.streak",
    });
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 400 naming a missing snapshot", async () => {
    const response = await POST(importRequest({ expectedOwnerId: USER_ID }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "invalid_import",
      path: "progress",
    });
  });

  it("returns 400 with the expected version for an older snapshot schema", async () => {
    const response = await POST(
      importRequest({
        expectedOwnerId: USER_ID,
        progress: { ...EMPTY_PROGRESS, schemaVersion: 2 },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "unsupported_schema_version",
      path: "progress.schemaVersion",
      expected: UNIFIED_SCHEMA_VERSION,
    });
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 409 when the browser bound the snapshot to another account", async () => {
    const response = await POST(
      importRequest({
        expectedOwnerId: "someone-else",
        progress: SNAPSHOT_WITH_ONE_LESSON,
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "progress_owner_mismatch",
    });
    expect(mockFetchUnifiedProgressForUser).not.toHaveBeenCalled();
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });
});

describe("POST /api/progress/import one-shot behaviour", () => {
  it("imports once and answers with what actually merged", async () => {
    const response = await POST(
      importRequest({
        expectedOwnerId: USER_ID,
        progress: SNAPSHOT_WITH_ONE_LESSON,
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      importedAt: string;
      merged: { courses: number; lessons: number };
    };
    expect(body.ok).toBe(true);
    expect(body.merged).toEqual({ courses: 1, lessons: 1 });
    expect(Number.isFinite(Date.parse(body.importedAt))).toBe(true);
    expect(response.headers.get("cache-control")).toBe("private, no-store");

    // Read under RLS with the cookie-bound client; write with the service one.
    expect(mockFetchUnifiedProgressForUser).toHaveBeenCalledWith(
      mockAuthClient,
      USER_ID,
    );
    expect(mockUpsertUnifiedProgressForUser).toHaveBeenCalledTimes(1);
    const [client, userId, written] = mockUpsertUnifiedProgressForUser.mock
      .calls[0] as [unknown, string, UnifiedProgress];
    expect(client).toBe(mockServiceClient);
    expect(userId).toBe(USER_ID);
    expect(written.courses[COURSE_SLUG]?.lessons[LESSON_ID]?.completed).toBe(
      true,
    );
    expect(written.badges[LOCAL_IMPORT_MARKER_ID]).toBe(body.importedAt);
  });

  it("refuses a second import and names when the first one happened", async () => {
    const alreadyImportedAt = "2026-07-07T07:07:07.000Z";
    mockFetchUnifiedProgressForUser.mockResolvedValueOnce(
      storedAccount({
        ...EMPTY_PROGRESS,
        badges: { [LOCAL_IMPORT_MARKER_ID]: alreadyImportedAt },
      }),
    );

    const response = await POST(
      importRequest({
        expectedOwnerId: USER_ID,
        progress: SNAPSHOT_WITH_ONE_LESSON,
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "progress_already_imported",
      importedAt: alreadyImportedAt,
    });
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("keeps the snapshot out of a course the account has reset", async () => {
    const resetAt = "2026-06-15T00:00:00.000Z";
    mockFetchUnifiedProgressForUser.mockResolvedValueOnce({
      ok: true,
      result: {
        progress: {
          ...EMPTY_PROGRESS,
          courses: {
            [COURSE_SLUG]: {
              lessons: {},
              workshopQuiz: { passed: false, score: 0, completedAt: null },
              capstoneSubmitted: false,
              startedAt: resetAt,
              lastActivity: resetAt,
              resetAt,
            },
          },
        },
        updatedAt: resetAt,
        courseResetAt: { [COURSE_SLUG]: resetAt },
        rawRows: [],
      },
    });

    const response = await POST(
      importRequest({
        expectedOwnerId: USER_ID,
        progress: SNAPSHOT_WITH_ONE_LESSON,
      }),
    );

    expect(response.status).toBe(200);
    expect(((await response.json()) as { merged: unknown }).merged).toEqual({
      courses: 0,
      lessons: 0,
    });
    const [, , written] = mockUpsertUnifiedProgressForUser.mock.calls[0] as [
      unknown,
      string,
      UnifiedProgress,
    ];
    expect(written.courses[COURSE_SLUG]?.lessons).toEqual({});
    expect(written.courses[COURSE_SLUG]?.resetAt).toBe(resetAt);
  });
});

describe("POST /api/progress/import storage failures", () => {
  const validBody = {
    expectedOwnerId: USER_ID,
    progress: SNAPSHOT_WITH_ONE_LESSON,
  };

  it("returns 500 when the account read fails", async () => {
    const readError = new Error("db down");
    mockFetchUnifiedProgressForUser.mockResolvedValueOnce({
      ok: false,
      error: readError,
    });

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "progress_read_failed" });
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress/import",
        step: "supabase-read",
        error: readError,
      }),
    );
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 500 when the account read rejects", async () => {
    mockFetchUnifiedProgressForUser.mockRejectedValueOnce(
      new Error("read transport rejected"),
    );

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "progress_read_failed" });
  });

  it("returns 500 when stored account progress does not validate", async () => {
    mockFetchUnifiedProgressForUser.mockResolvedValueOnce({
      ok: true,
      result: {
        progress: { schemaVersion: 3, courses: "broken" },
        updatedAt: "2026-06-02T00:00:00.000Z",
        courseResetAt: {},
        rawRows: [],
      },
    });

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "progress_read_failed" });
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 503 when the progress store is not configured", async () => {
    mockTryCreateServiceClient.mockReturnValueOnce(null);

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "progress_store_unavailable",
    });
    expect(mockUpsertUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("returns 413 when one course row exceeds the database size check", async () => {
    mockUpsertUnifiedProgressForUser.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "23514",
        message: 'violates check constraint "user_course_progress_size_check"',
      },
    });

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "progress_too_large" });
  });

  it("returns 500 when the import write fails", async () => {
    const writeError = new Error("insert failed");
    mockUpsertUnifiedProgressForUser.mockResolvedValueOnce({
      ok: false,
      error: writeError,
    });

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "progress_write_failed" });
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/progress/import",
        step: "supabase-write",
        error: writeError,
      }),
    );
  });

  it("returns 500 when the import write rejects", async () => {
    mockUpsertUnifiedProgressForUser.mockRejectedValueOnce(
      new Error("write transport rejected"),
    );

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "progress_write_failed" });
  });

  it("returns 409 with the current state when the write conflicts", async () => {
    mockUpsertUnifiedProgressForUser.mockResolvedValueOnce({
      ok: false,
      conflict: true,
      result: {
        progress: EMPTY_PROGRESS,
        updatedAt: "2026-06-04T00:00:00.000Z",
        courseResetAt: {},
        rawRows: [],
      },
    });

    const response = await POST(importRequest(validBody));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "progress_conflict",
      progress: EMPTY_PROGRESS,
      updatedAt: "2026-06-04T00:00:00.000Z",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
