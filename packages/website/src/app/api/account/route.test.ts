import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Account routes fail-closed tests (regression coverage). The DSGVO-sensitive
 * delete / export / reset-progress handlers must refuse to do anything without
 * a configured auth backend AND an authenticated user - the highest legal +
 * data-loss gap. These unit tests pin the early-return gates (503 not-configured,
 * 503 auth-backend outage, 401 unauthorized), the durable rate limit (429),
 * plus reset-progress' Zod course-slug rejection; the full authenticated
 * round-trips (export blob, delete two-step, reset) are exercised end-to-end
 * in . Mocks mirror ai-native/practice/route.test.ts.
 */

const mockGetUser = vi.fn<
  () => Promise<{
    configured: boolean;
    user: { id: string; last_sign_in_at?: string } | null;
    error?: unknown;
  }>
>(async () => ({
  configured: true,
  user: { id: "user-1", last_sign_in_at: new Date().toISOString() },
}));
const mockAuthServerClient = vi.fn<() => Promise<unknown>>(async () => null);
const mockServiceClient = vi.fn<() => unknown>(() => ({ id: "service-client" }));
const mockAdminClient = vi.fn<() => unknown>(() => {
  throw new Error("admin client unavailable");
});

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetUser(),
  createAuthServerClient: () => mockAuthServerClient(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient(),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockServiceClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({ reportApiError: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => true),
  hashedClientRateLimitKey: vi.fn(async (namespace: string) =>
    `${namespace}:sha256:${"a".repeat(64)}`,
  ),
}));
vi.mock("@/lib/progress/server-sync", () => ({
  isUnifiedProgress: () => true,
}));

import { DELETE } from "./delete/route";
import { GET as EXPORT_GET } from "./export/route";
import { POST as RESET_POST } from "./reset-progress/route";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const mockedRateLimit = consumeRateLimit as unknown as ReturnType<typeof vi.fn>;

function deleteReq(): Request {
  return new Request("http://localhost/api/account/delete", {
    method: "DELETE",
  });
}

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
    mockGetUser.mockResolvedValue({
      configured: true,
      user: { id: "user-1", last_sign_in_at: new Date().toISOString() },
    });
    mockAuthServerClient.mockReset();
    mockAuthServerClient.mockResolvedValue(null);
    mockServiceClient.mockReset();
    mockServiceClient.mockReturnValue({ id: "service-client" });
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
  });

  it("DELETE returns 503 when auth is not configured", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: false, user: null });
    expect((await DELETE(deleteReq())).status).toBe(503);
  });

  it("DELETE returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    expect((await DELETE(deleteReq())).status).toBe(401);
  });

  it("DELETE returns 503 when the auth backend errors (outage is not logged-out)", async () => {
    mockGetUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: new Error("Supabase Auth unreachable"),
    });
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "auth_unavailable",
    );
  });

  it("DELETE returns 429 when the rate limit is exceeded", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toBe(
      "rate_limit_exceeded",
    );
    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  it("DELETE requires a sign-in from the last 15 minutes", async () => {
    mockGetUser.mockResolvedValueOnce({
      configured: true,
      user: {
        id: "user-1",
        last_sign_in_at: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
      },
    });
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe(
      "reauthentication_required",
    );
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  it("DELETE revokes every refresh session before deleting the user", async () => {
    const accessToken = ["verified", "access", "token"].join("-");
    const globalSignOut = vi.fn(async () => ({ error: null }));
    const deleteUser = vi.fn(async () => ({ error: null }));
    const localSignOut = vi.fn(async () => ({ error: null }));
    mockAdminClient.mockReturnValueOnce({
      auth: { admin: { signOut: globalSignOut, deleteUser } },
    });
    mockAuthServerClient.mockResolvedValueOnce({
      auth: {
        getSession: vi.fn(async () => ({
          data: {
            session: {
              access_token: accessToken,
              user: { id: "user-1" },
            },
          },
          error: null,
        })),
        signOut: localSignOut,
      },
    });

    const res = await DELETE(deleteReq());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(globalSignOut).toHaveBeenCalledWith(
      accessToken,
      "global",
    );
    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(globalSignOut.mock.invocationCallOrder[0]).toBeLessThan(
      deleteUser.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
    );
    expect(localSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("DELETE fails closed when global session revocation fails", async () => {
    const accessToken = ["verified", "access", "token"].join("-");
    const deleteUser = vi.fn(async () => ({ error: null }));
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({
            error: new Error("auth revoke failed"),
          })),
          deleteUser,
        },
      },
    });
    mockAuthServerClient.mockResolvedValueOnce({
      auth: {
        getSession: vi.fn(async () => ({
          data: {
            session: {
              access_token: accessToken,
              user: { id: "user-1" },
            },
          },
          error: null,
        })),
      },
    });

    const res = await DELETE(deleteReq());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "session_revocation_failed",
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("export returns 503 when auth is not configured", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: false, user: null });
    expect((await EXPORT_GET()).status).toBe(503);
  });

  it("export returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    expect((await EXPORT_GET()).status).toBe(401);
  });

  it("export returns 503 when the auth backend errors (outage is not logged-out)", async () => {
    mockGetUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: new Error("Supabase Auth unreachable"),
    });
    const res = await EXPORT_GET();
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "auth_unavailable",
    );
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

  it("reset-progress returns 503 when the auth backend errors (outage is not logged-out)", async () => {
    mockGetUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: new Error("Supabase Auth unreachable"),
    });
    const res = await RESET_POST(resetReq({ courseSlug: "ki-fuehrerschein" }));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "auth_unavailable",
    );
  });

  it("reset-progress returns 429 when the rate limit is exceeded", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);
    const res = await RESET_POST(resetReq({ courseSlug: "ki-fuehrerschein" }));
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toBe(
      "rate_limit_exceeded",
    );
  });

  it("reset-progress returns 400 on an unknown course slug (Zod refine)", async () => {
    const res = await RESET_POST(
      resetReq({ courseSlug: "definitely-not-a-course" }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_course_slug",
    );
  });

  it("reset-progress rejects an oversized stream without Content-Length", async () => {
    const request = oversizedResetReq();
    expect(request.headers.get("content-length")).toBeNull();
    const res = await RESET_POST(request);
    expect(res.status).toBe(413);
    expect(((await res.json()) as { error: string }).error).toBe(
      "payload_too_large",
    );
  });
});
