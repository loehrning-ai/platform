import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
}));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    configured: true,
    user: { id: "user-1" },
  })),
  createAuthServerClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => true),
  hashedClientRateLimitKey: vi.fn(async (namespace: string) =>
    `${namespace}:sha256:${"a".repeat(64)}`,
  ),
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
import { consumeRateLimit } from "@/lib/security/rate-limit";

const mockedRateLimit = consumeRateLimit as unknown as ReturnType<typeof vi.fn>;

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
  });

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
    expect(mockFrom).not.toHaveBeenCalled();
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
      progress: VALID_PROGRESS,
      updatedAt: "2026-06-03T00:00:00.000Z",
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
});

describe("PUT /api/progress happy path + conflict", () => {
  beforeEach(() => {
    mockUpsertUnifiedProgressForUser.mockReset();
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
  });

  function putRequest(progress: unknown): Request {
    return new Request("http://localhost/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
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
  });

  it("returns 400 for a payload that fails isUnifiedProgress before ever touching server-store", async () => {
    const response = await PUT(putRequest({ not: "valid" }));
    expect(response.status).toBe(400);
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
});
