import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Account routes fail-closed tests (regression coverage). The DSGVO-sensitive
 * delete / export / reset-progress handlers must refuse to do anything without
 * a configured auth backend AND an authenticated user - the highest legal +
 * data-loss gap. These unit tests pin the early-return gates (503 not-configured,
 * 401 unauthorized) plus reset-progress' Zod course-slug rejection; the full
 * authenticated round-trips (export blob, delete two-step, reset) are exercised
 * end-to-end in . Mocks mirror ai-native/practice/route.test.ts.
 */

const mockGetUser = vi.fn<
  () => Promise<{ configured: boolean; user: { id: string } | null }>
>(async () => ({ configured: true, user: { id: "user-1" } }));
const mockAuthServerClient = vi.fn<() => Promise<unknown>>(async () => null);
const mockAdminClient = vi.fn(() => {
  throw new Error("admin client unavailable");
});

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetUser(),
  createAuthServerClient: () => mockAuthServerClient(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({ reportApiError: vi.fn() }));
vi.mock("@/lib/progress/server-sync", () => ({
  isUnifiedProgress: () => true,
}));

import { DELETE } from "./delete/route";
import { GET as EXPORT_GET } from "./export/route";
import { POST as RESET_POST } from "./reset-progress/route";

function resetReq(body: unknown): Request {
  return new Request("http://localhost/api/account/reset-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function oversizedResetReq(): Request {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ courseSlug: "x".repeat(5000) }),
  );
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return new Request("http://localhost/api/account/reset-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("account routes fail closed without a valid session", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({ configured: true, user: { id: "user-1" } });
    mockAuthServerClient.mockReset();
    mockAuthServerClient.mockResolvedValue(null);
  });

  it("DELETE returns 503 when auth is not configured", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: false, user: null });
    expect((await DELETE()).status).toBe(503);
  });

  it("DELETE returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    expect((await DELETE()).status).toBe(401);
  });

  it("export returns 503 when auth is not configured", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: false, user: null });
    expect((await EXPORT_GET()).status).toBe(503);
  });

  it("export returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    expect((await EXPORT_GET()).status).toBe(401);
  });

  it("reset-progress returns 503 when auth is not configured", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: false, user: null });
    const res = await RESET_POST(resetReq({ courseSlug: "ki-fuehrerschein" }));
    expect(res.status).toBe(503);
  });

  it("reset-progress returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    const res = await RESET_POST(resetReq({ courseSlug: "ki-fuehrerschein" }));
    expect(res.status).toBe(401);
  });

  it("reset-progress returns 400 on an unknown course slug (Zod refine)", async () => {
    // Reach the body validation: authed user + a truthy auth-server client.
    mockAuthServerClient.mockResolvedValueOnce({});
    const res = await RESET_POST(
      resetReq({ courseSlug: "definitely-not-a-course" }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_course_slug",
    );
  });

  it("reset-progress rejects an oversized stream without Content-Length", async () => {
    mockAuthServerClient.mockResolvedValueOnce({});
    const request = oversizedResetReq();
    expect(request.headers.get("content-length")).toBeNull();
    const res = await RESET_POST(request);
    expect(res.status).toBe(413);
    expect(((await res.json()) as { error: string }).error).toBe(
      "payload_too_large",
    );
  });
});
