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

const {
  mockGetUser,
  mockAuthServerClient,
  mockServiceClient,
  mockResetCourseProgressRow,
  mockAdminClient,
  mockConsumeRateLimit,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn<
    () => Promise<{
      configured: boolean;
      user: { id: string; last_sign_in_at?: string } | null;
      error?: unknown;
    }>
  >(async () => ({
    configured: true,
    user: { id: "user-1", last_sign_in_at: new Date().toISOString() },
  })),
  mockAuthServerClient: vi.fn<() => Promise<unknown>>(async () => null),
  mockServiceClient: vi.fn<() => unknown>(() => ({
    id: "service-client",
  })),
  mockResetCourseProgressRow: vi.fn(),
  mockAdminClient: vi.fn<() => unknown>(() => {
    throw new Error("admin client unavailable");
  }),
  mockConsumeRateLimit: vi.fn<
    (args: {
      readonly key: string;
      readonly windowSeconds: number;
      readonly max: number;
    }) => Promise<boolean>
  >(async () => true),
}));
const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const ACCESS_TOKEN = ["verified", "access", "token"].join("-");

function validClaims(overrides: Record<string, unknown> = {}) {
  return {
    sub: "user-1",
    aud: "authenticated",
    role: "authenticated",
    is_anonymous: false,
    session_id: SESSION_ID,
    iat: Math.floor(Date.now() / 1000),
    amr: [
      {
        method: "magiclink",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ],
    ...overrides,
  };
}

function validDeleteAuthClient(claims = validClaims()) {
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: {
            access_token: ACCESS_TOKEN,
            user: { id: "user-1" },
          },
        },
        error: null,
      })),
      getUser: vi.fn<
        () => Promise<{
          data: { user: { id: string } | null };
          error: unknown | null;
        }>
      >(async () => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
      getClaims: vi.fn<
        () => Promise<{
          data: {
            claims: Record<string, unknown>;
            header: { alg: string; kid: string };
            signature: Uint8Array;
          } | null;
          error: unknown | null;
        }>
      >(async () => ({
        data: {
          claims,
          header: {
            alg: "RS256",
            kid: "22222222-2222-4222-8222-222222222222",
          },
          signature: new Uint8Array([1, 2, 3]),
        },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
}

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
vi.mock("@/lib/progress/server-sync", () => ({
  isUnifiedProgress: () => true,
}));
vi.mock("@/lib/progress/server-store", () => ({
  fetchUnifiedProgressForUser: vi.fn(),
  resetCourseProgressRow: (...args: unknown[]) =>
    mockResetCourseProgressRow(...args),
}));

import { DELETE } from "./delete/route";
import { GET as EXPORT_GET } from "./export/route";
import { POST as RESET_POST } from "./reset-progress/route";
import { reportApiError } from "@/lib/observability/api-error";
import { fetchUnifiedProgressForUser } from "@/lib/progress/server-store";

const mockedRateLimit = mockConsumeRateLimit;
const mockedReportApiError = vi.mocked(reportApiError);
const mockedFetchUnifiedProgress = vi.mocked(fetchUnifiedProgressForUser);
const NON_JSON_MEDIA_TYPES = [
  ["missing", undefined],
  ["unsupported", "text/plain"],
  ["JSON lookalike", "application/jsonp"],
] as const;

function mediaTypeRequest(
  url: string,
  method: "DELETE" | "POST",
  contentType: string | undefined,
): Request {
  return new Request(url, {
    method,
    headers: contentType ? { "Content-Type": contentType } : undefined,
    body: contentType ? "{}" : new Uint8Array([123, 125]),
  });
}

function deleteReq(expectedOwnerId = "user-1"): Request {
  return new Request("http://localhost/api/account/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedOwnerId }),
  });
}

function resetReq(body: unknown): Request {
  const payload =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? { expectedOwnerId: "user-1", ...body }
      : body;
  return new Request("http://localhost/api/account/reset-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function exportReq(expectedOwnerId = "user-1"): Request {
  return new Request("http://localhost/api/account/export", {
    headers: {
      "X-Loehrning-Expected-Owner-Id": expectedOwnerId,
    },
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
    mockAuthServerClient.mockResolvedValue(validDeleteAuthClient());
    mockServiceClient.mockReset();
    mockServiceClient.mockReturnValue({ id: "service-client" });
    mockResetCourseProgressRow.mockReset();
    mockResetCourseProgressRow.mockResolvedValue({
      ok: true,
      resetAt: "2026-07-29T00:00:00.000Z",
    });
    mockAdminClient.mockReset();
    mockAdminClient.mockImplementation(() => {
      throw new Error("admin client unavailable");
    });
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
    mockedReportApiError.mockClear();
  });

  it.each(NON_JSON_MEDIA_TYPES)(
    "DELETE returns 415 for a %s media type before auth, quotas, or deletion",
    async (_label, contentType) => {
      const request = mediaTypeRequest(
        "http://localhost/api/account/delete",
        "DELETE",
        contentType,
      );
      expect(request.headers.get("content-type")).toBe(contentType ?? null);
      const res = await DELETE(request);

      expect(res.status).toBe(415);
      expect(await res.json()).toEqual({
        error: "unsupported_media_type",
      });
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      expect(mockAuthServerClient).not.toHaveBeenCalled();
      expect(mockedRateLimit).not.toHaveBeenCalled();
      expect(mockAdminClient).not.toHaveBeenCalled();
      expect(mockServiceClient).not.toHaveBeenCalled();
      expect(mockedReportApiError).not.toHaveBeenCalled();
    },
  );

  it.each(NON_JSON_MEDIA_TYPES)(
    "reset-progress returns 415 for a %s media type before auth, quotas, or storage",
    async (_label, contentType) => {
      const request = mediaTypeRequest(
        "http://localhost/api/account/reset-progress",
        "POST",
        contentType,
      );
      expect(request.headers.get("content-type")).toBe(contentType ?? null);
      const res = await RESET_POST(request);

      expect(res.status).toBe(415);
      expect(await res.json()).toEqual({
        error: "unsupported_media_type",
      });
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockedRateLimit).not.toHaveBeenCalled();
      expect(mockServiceClient).not.toHaveBeenCalled();
      expect(mockResetCourseProgressRow).not.toHaveBeenCalled();
      expect(mockedReportApiError).not.toHaveBeenCalled();
    },
  );

  it("DELETE returns 503 when auth is not configured", async () => {
    mockAuthServerClient.mockResolvedValueOnce(null);
    expect((await DELETE(deleteReq())).status).toBe(503);
  });

  it("DELETE returns 401 when there is no authenticated user", async () => {
    mockAuthServerClient.mockResolvedValueOnce({
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: null },
          error: null,
        })),
      },
    });
    expect((await DELETE(deleteReq())).status).toBe(401);
  });

  it("DELETE returns 503 when the auth backend errors (outage is not logged-out)", async () => {
    const client = validDeleteAuthClient();
    client.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Supabase Auth unreachable"),
    });
    mockAuthServerClient.mockResolvedValueOnce(client);
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "auth_unavailable",
    );
  });

  it("DELETE returns owner-bound idempotent success when asymmetric claims verify an already-deleted user", async () => {
    const client = validDeleteAuthClient();
    client.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: Object.assign(new Error("User not found"), {
        code: "user_not_found",
        status: 404,
      }),
    });
    mockAuthServerClient.mockResolvedValueOnce(client);

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mockAdminClient).not.toHaveBeenCalled();
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it("DELETE keeps an already-absent user unknown when claims cannot be verified independently", async () => {
    const client = validDeleteAuthClient();
    const absentError = Object.assign(new Error("User not found"), {
      code: "user_not_found",
      status: 404,
    });
    client.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: absentError,
    });
    client.auth.getClaims.mockResolvedValueOnce({
      data: null,
      error: absentError,
    });
    mockAuthServerClient.mockResolvedValueOnce(client);

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "delete_status_unknown" });
    expect(client.auth.signOut).not.toHaveBeenCalled();
    expect(mockAdminClient).not.toHaveBeenCalled();
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it("DELETE rejects a stale browser owner before rate limits or destructive clients", async () => {
    const res = await DELETE(deleteReq("user-A"));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "account_owner_mismatch",
    });
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  it("DELETE rejects a missing owner binding before rate limits", async () => {
    const res = await DELETE(
      new Request("http://localhost/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "invalid_owner_binding",
    });
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it("DELETE returns 429 when the rate limit is exceeded", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toBe(
      "rate_limit_exceeded",
    );
    expect(mockAdminClient).not.toHaveBeenCalled();
    expect(mockedRateLimit.mock.calls.map(([argument]) => ({
      key: argument.key,
      max: argument.max,
    }))).toEqual([
      {
        key: `account-delete:user-hmac-sha256-v1:${"b".repeat(64)}`,
        max: 3,
      },
    ]);
  });

  it("DELETE returns 503 when the durable limiter is unavailable", async () => {
    mockedRateLimit.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "rate_limit_unavailable" });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  it("DELETE requires current-session authentication from the last 15 minutes", async () => {
    mockAuthServerClient.mockResolvedValueOnce(
      validDeleteAuthClient(
        validClaims({
          iat: Math.floor(Date.now() / 1000),
          amr: [{
            method: "magiclink",
            timestamp: Math.floor(Date.now() / 1000) - 16 * 60,
          }],
        }),
      ),
    );
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe(
      "reauthentication_required",
    );
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  it("DELETE rejects a fresh JWT whose current session authenticated too long ago", async () => {
    mockAuthServerClient.mockResolvedValueOnce(
      validDeleteAuthClient(
        validClaims({
          iat: Math.floor(Date.now() / 1000),
          amr: [{
            method: "magiclink",
            timestamp: Math.floor(Date.now() / 1000) - 16 * 60,
          }],
        }),
      ),
    );

    const res = await DELETE(deleteReq());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "reauthentication_required" });
  });

  it.each([
    ["missing AMR", undefined],
    ["string-only AMR", ["magiclink"]],
    [
      "future-dated AMR",
      [{ method: "magiclink", timestamp: Math.floor(Date.now() / 1000) + 120 }],
    ],
    [
      "unrecognized AMR method",
      [{ method: "token_refresh", timestamp: Math.floor(Date.now() / 1000) }],
    ],
  ])("DELETE rejects %s", async (_label, amr) => {
    mockAuthServerClient.mockResolvedValueOnce(
      validDeleteAuthClient(validClaims({ amr })),
    );
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "reauthentication_required" });
  });

  it("DELETE rejects signed claims for a different user", async () => {
    mockAuthServerClient.mockResolvedValueOnce(
      validDeleteAuthClient(validClaims({ sub: "user-2" })),
    );
    const res = await DELETE(deleteReq());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "reauthentication_required" });
  });

  it("DELETE revokes every refresh session before deleting the user", async () => {
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
              access_token: ACCESS_TOKEN,
              user: { id: "user-1" },
            },
          },
          error: null,
        })),
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        })),
        getClaims: vi.fn(async () => ({
          data: { claims: validClaims() },
          error: null,
        })),
        signOut: localSignOut,
      },
    });

    const res = await DELETE(deleteReq());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(globalSignOut).toHaveBeenCalledWith(
      ACCESS_TOKEN,
      "global",
    );
    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(globalSignOut.mock.invocationCallOrder[0]).toBeLessThan(
      deleteUser.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
    );
    expect(localSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("DELETE continues to the authoritative user deletion when global session revocation returns an error", async () => {
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
              access_token: ACCESS_TOKEN,
              user: { id: "user-1" },
            },
          },
          error: null,
        })),
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        })),
        getClaims: vi.fn(async () => ({
          data: { claims: validClaims() },
          error: null,
        })),
      },
    });

    const res = await DELETE(deleteReq());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/delete",
        step: "auth-revoke-sessions",
        error: expect.any(Error),
      }),
    );
  });

  it("DELETE continues to the authoritative user deletion when global revocation rejects", async () => {
    const revokeError = new Error("revocation transport rejected");
    const deleteUser = vi.fn(async () => ({ error: null }));
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => {
            throw revokeError;
          }),
          deleteUser,
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/delete",
        step: "auth-revoke-sessions",
        error: revokeError,
      }),
    );
  });

  it("DELETE reconciles a rejected delete response when the user is confirmed absent", async () => {
    const deleteError = new Error("delete response lost");
    const localSignOut = vi.fn(async () => ({ error: null }));
    const authClient = validDeleteAuthClient();
    authClient.auth.signOut = localSignOut;
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => {
            throw deleteError;
          }),
          getUserById: vi.fn(async () => ({
            data: { user: null },
            error: { code: "user_not_found" },
          })),
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(localSignOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "account-delete",
        error: deleteError,
      }),
    );
  });

  it("DELETE treats concurrent session-not-found and user-not-found results as idempotent success", async () => {
    const localSignOut = vi.fn(async () => ({ error: null }));
    const authClient = validDeleteAuthClient();
    authClient.auth.signOut = localSignOut;
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    const getUserById = vi.fn();
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({
            error: { code: "session_not_found", status: 403 },
          })),
          deleteUser: vi.fn(async () => ({
            data: { user: null },
            error: { code: "user_not_found", status: 404 },
          })),
          getUserById,
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(getUserById).not.toHaveBeenCalled();
    expect(localSignOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/delete",
        step: "auth-revoke-sessions",
        error: expect.objectContaining({ code: "session_not_found" }),
      }),
    );
  });

  it("DELETE reconciles a resolved retryable delete error when the user is confirmed absent", async () => {
    const deleteError = Object.assign(
      new Error("Auth service response lost"),
      {
        name: "AuthRetryableFetchError",
        status: 503,
      },
    );
    const getUserById = vi.fn(async () => ({
      data: { user: null },
      error: { code: "user_not_found" },
    }));
    const authClient = validDeleteAuthClient();
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => ({
            data: { user: null },
            error: deleteError,
          })),
          getUserById,
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(getUserById).toHaveBeenCalledWith("user-1");
    expect(authClient.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "account-delete",
        error: deleteError,
      }),
    );
  });

  it("DELETE keeps a resolved retryable outcome unknown when a point-in-time reconciliation still sees the user", async () => {
    const deleteError = Object.assign(
      new Error("upstream unavailable"),
      { status: 502 },
    );
    const authClient = validDeleteAuthClient();
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => ({
            data: { user: null },
            error: deleteError,
          })),
          getUserById: vi.fn(async () => ({
            data: { user: { id: "user-1" } },
            error: null,
          })),
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "delete_status_unknown" });
    expect(authClient.auth.signOut).not.toHaveBeenCalled();
  });

  it("DELETE reports an unknown status when a resolved retryable error cannot be reconciled", async () => {
    const deleteError = Object.assign(
      new Error("network request failed"),
      {
        name: "AuthRetryableFetchError",
        status: 0,
      },
    );
    const authClient = validDeleteAuthClient();
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => ({
            data: { user: null },
            error: deleteError,
          })),
          getUserById: vi.fn(async () => ({
            data: { user: null },
            error: new Error("reconciliation unavailable"),
          })),
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "delete_status_unknown" });
    expect(authClient.auth.signOut).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "account-delete",
        error: expect.any(AggregateError),
      }),
    );
  });

  it("DELETE reconciles a resolved Auth error whose HTTP status is unknown", async () => {
    const deleteError = Object.assign(
      new Error("response could not be decoded"),
      { name: "AuthUnknownError" },
    );
    const getUserById = vi.fn(async () => ({
      data: { user: null },
      error: { code: "user_not_found" },
    }));
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => ({
            data: { user: null },
            error: deleteError,
          })),
          getUserById,
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(getUserById).toHaveBeenCalledWith("user-1");
  });

  it("DELETE keeps a thrown transport outcome unknown when a point-in-time reconciliation still sees the user", async () => {
    const localSignOut = vi.fn(async () => ({ error: null }));
    const authClient = validDeleteAuthClient();
    authClient.auth.signOut = localSignOut;
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => {
            throw new Error("delete transport rejected");
          }),
          getUserById: vi.fn(async () => ({
            data: { user: { id: "user-1" } },
            error: null,
          })),
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "delete_status_unknown" });
    expect(localSignOut).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
  });

  it("DELETE returns a definite failure for a direct non-retryable delete response", async () => {
    const deleteError = Object.assign(
      new Error("delete request rejected"),
      { status: 400, code: "invalid_request" },
    );
    const authClient = validDeleteAuthClient();
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    const getUserById = vi.fn();
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => ({
            data: { user: null },
            error: deleteError,
          })),
          getUserById,
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "delete_failed" });
    expect(getUserById).not.toHaveBeenCalled();
    expect(authClient.auth.signOut).not.toHaveBeenCalled();
  });

  it("DELETE reports an explicitly unknown status when reconciliation also rejects", async () => {
    const localSignOut = vi.fn(async () => ({ error: null }));
    const authClient = validDeleteAuthClient();
    authClient.auth.signOut = localSignOut;
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => {
            throw new Error("delete transport rejected");
          }),
          getUserById: vi.fn(async () => {
            throw new Error("reconciliation transport rejected");
          }),
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "delete_status_unknown" });
    expect(localSignOut).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "account-delete",
        error: expect.any(AggregateError),
      }),
    );
  });

  it("DELETE still confirms deletion when local cookie cleanup rejects", async () => {
    const localSignOutError = new Error("local sign-out rejected");
    const authClient = validDeleteAuthClient();
    authClient.auth.signOut.mockRejectedValueOnce(localSignOutError);
    mockAuthServerClient.mockResolvedValueOnce(authClient);
    mockAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          deleteUser: vi.fn(async () => ({ error: null })),
        },
      },
    });

    const res = await DELETE(deleteReq());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deleted: true,
      ownerId: "user-1",
    });
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "auth-clear-session",
        error: localSignOutError,
      }),
    );
  });

  it("export returns 503 when auth is not configured", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: false, user: null });
    expect((await EXPORT_GET(exportReq())).status).toBe(503);
  });

  it("export returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    expect((await EXPORT_GET(exportReq())).status).toBe(401);
  });

  it("export returns 503 when the auth backend errors (outage is not logged-out)", async () => {
    mockGetUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: new Error("Supabase Auth unreachable"),
    });
    const res = await EXPORT_GET(exportReq());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "auth_unavailable",
    );
  });

  it("export rejects a stale browser owner before reading account data", async () => {
    const res = await EXPORT_GET(exportReq("user-A"));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "account_owner_mismatch",
    });
    expect(mockAuthServerClient).not.toHaveBeenCalled();
    expect(mockServiceClient).not.toHaveBeenCalled();
  });

  it("export returns 429 before creating clients or reading account data", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);

    const res = await EXPORT_GET(exportReq());

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "rate_limit_exceeded" });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(mockedRateLimit.mock.calls.map(([argument]) => ({
      key: argument.key,
      max: argument.max,
      windowSeconds: argument.windowSeconds,
    }))).toEqual([
      {
        key: `account-export:user-hmac-sha256-v1:${"b".repeat(64)}`,
        max: 10,
        windowSeconds: 3_600,
      },
    ]);
    expect(mockAuthServerClient).not.toHaveBeenCalled();
    expect(mockedFetchUnifiedProgress).not.toHaveBeenCalled();
    expect(mockServiceClient).not.toHaveBeenCalled();
  });

  it("export returns 503 before reads when the durable limiter is unavailable", async () => {
    mockedRateLimit.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });

    const res = await EXPORT_GET(exportReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "rate_limit_unavailable" });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(mockAuthServerClient).not.toHaveBeenCalled();
    expect(mockedFetchUnifiedProgress).not.toHaveBeenCalled();
    expect(mockServiceClient).not.toHaveBeenCalled();
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/export",
        step: "rate-limit",
      }),
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

  it("reset-progress rejects a stale browser owner before rate limits or writes", async () => {
    const res = await RESET_POST(
      resetReq({
        courseSlug: "ki-fuehrerschein",
        expectedOwnerId: "user-A",
      }),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "account_owner_mismatch",
    });
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockResetCourseProgressRow).not.toHaveBeenCalled();
  });

  it("reset-progress rejects a missing owner binding before rate limits", async () => {
    const res = await RESET_POST(
      new Request("http://localhost/api/account/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: "ki-fuehrerschein" }),
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "invalid_owner_binding",
    });
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it("reset-progress returns 429 when the rate limit is exceeded", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);
    const res = await RESET_POST(resetReq({ courseSlug: "ki-fuehrerschein" }));
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toBe(
      "rate_limit_exceeded",
    );
    expect(mockedRateLimit).toHaveBeenCalledTimes(1);
    expect(mockedRateLimit.mock.calls[0]?.[0].key).toBe(
      `account-reset-progress:user-hmac-sha256-v1:${"b".repeat(64)}`,
    );
  });

  it("reset-progress returns 503 when the durable limiter is unavailable", async () => {
    mockedRateLimit.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });
    const res = await RESET_POST(
      resetReq({ courseSlug: "ki-fuehrerschein" }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "rate_limit_unavailable" });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("reset-progress converts a rejected store write into one reported 500", async () => {
    const writeError = new Error("progress store transport rejected");
    mockResetCourseProgressRow.mockRejectedValueOnce(writeError);

    const res = await RESET_POST(
      resetReq({ courseSlug: "ki-fuehrerschein" }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "reset_failed" });
    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    expect(mockedReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/account/reset-progress",
        step: "supabase-write",
        error: writeError,
      }),
    );
  });

  it("reset-progress enforces independent authenticated-user and client-IP budgets", async () => {
    const res = await RESET_POST(
      resetReq({ courseSlug: "definitely-not-a-course" }),
    );
    expect(res.status).toBe(400);
    expect(mockedRateLimit).toHaveBeenCalledTimes(2);
    expect(mockedRateLimit.mock.calls.map(([argument]) => argument.key)).toEqual([
      `account-reset-progress:user-hmac-sha256-v1:${"b".repeat(64)}`,
      `account-reset-progress-ip:ip-hmac-sha256-v1:${"a".repeat(64)}`,
    ]);
    expect(mockedRateLimit.mock.calls.map(([argument]) => argument.max)).toEqual([
      10,
      100,
    ]);
  });

  it("reset-progress binds its mutation and success payload to the verified owner", async () => {
    const res = await RESET_POST(
      resetReq({ courseSlug: "ki-fuehrerschein" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      ownerId: "user-1",
      resetCourse: "ki-fuehrerschein",
      resetAt: "2026-07-29T00:00:00.000Z",
    });
    expect(mockResetCourseProgressRow).toHaveBeenCalledWith(
      { id: "service-client" },
      "user-1",
      "ki-fuehrerschein",
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
