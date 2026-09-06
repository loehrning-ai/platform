import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Ordering guarantees around the irreversible account deletion.
 *
 * `auth.admin.deleteUser()` removes the only owner reference the platform
 * keeps, so anything that must touch account-owned data has exactly one
 * window: after the caller is verified and rate limited, before the delete.
 * These tests pin that window - the registered pre-delete steps run first,
 * and a failing step stops the deletion instead of orphaning data.
 */

const {
  mockCreateAuthServerClient,
  mockCreateAdminClient,
  mockConsumeRateLimit,
  mockRunPreDeleteSteps,
} = vi.hoisted(() => ({
  mockCreateAuthServerClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockConsumeRateLimit: vi.fn(async (): Promise<boolean> => true),
  mockRunPreDeleteSteps: vi.fn(
    async (
      _context: unknown,
    ): Promise<
      | { readonly ok: true; readonly completedSteps: readonly string[] }
      | {
          readonly ok: false;
          readonly failedStep: string;
          readonly completedSteps: readonly string[];
          readonly error: unknown;
        }
    > => ({ ok: true, completedSteps: [] }),
  ),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createAuthServerClient: () => mockCreateAuthServerClient(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: () => mockConsumeRateLimit(),
  hashedAuthenticatedRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:user-hmac`,
  ),
  hashedClientRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:ip-hmac`,
  ),
}));
vi.mock("./pre-delete", () => ({
  runPreDeleteSteps: (context: unknown) => mockRunPreDeleteSteps(context),
}));

import { DELETE } from "./route";
import { reportApiError } from "@/lib/observability/api-error";

const mockedReportApiError = vi.mocked(reportApiError);
const ACCESS_TOKEN = ["verified", "access", "token"].join("-");
const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function validClaims() {
  return {
    sub: "user-1",
    aud: "authenticated",
    role: "authenticated",
    is_anonymous: false,
    session_id: SESSION_ID,
    iat: Math.floor(Date.now() / 1000),
    amr: [{ method: "magiclink", timestamp: Math.floor(Date.now() / 1000) }],
  };
}

function authClientDouble() {
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: ACCESS_TOKEN, user: { id: "user-1" } } },
        error: null,
      })),
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
      getClaims: vi.fn(async () => ({
        data: {
          claims: validClaims(),
          header: { alg: "RS256", kid: "22222222-2222-4222-8222-222222222222" },
          signature: new Uint8Array([1, 2, 3]),
        },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
}

function adminClientDouble() {
  return {
    auth: {
      admin: {
        signOut: vi.fn(async () => ({ error: null })),
        deleteUser: vi.fn(async () => ({ error: null })),
        getUserById: vi.fn(async () => ({
          data: { user: null },
          error: { code: "user_not_found" },
        })),
      },
    },
  };
}

function deleteRequest(expectedOwnerId = "user-1"): Request {
  return new Request("http://localhost/api/account/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedOwnerId }),
  });
}

let authClient: ReturnType<typeof authClientDouble>;
let adminClient: ReturnType<typeof adminClientDouble>;

beforeEach(() => {
  authClient = authClientDouble();
  adminClient = adminClientDouble();
  mockCreateAuthServerClient.mockReset();
  mockCreateAuthServerClient.mockResolvedValue(authClient);
  mockCreateAdminClient.mockReset();
  mockCreateAdminClient.mockReturnValue(adminClient);
  mockConsumeRateLimit.mockReset();
  mockConsumeRateLimit.mockResolvedValue(true);
  mockRunPreDeleteSteps.mockReset();
  mockRunPreDeleteSteps.mockResolvedValue({ ok: true, completedSteps: [] });
  mockedReportApiError.mockClear();
});

describe("DELETE /api/account/delete pre-delete ordering", () => {
  it("runs the pre-delete steps before revoking sessions and deleting the user", async () => {
    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true, ownerId: "user-1" });
    expect(mockRunPreDeleteSteps).toHaveBeenCalledWith({
      adminClient,
      userId: "user-1",
    });

    const [hookOrder] = mockRunPreDeleteSteps.mock.invocationCallOrder;
    expect(hookOrder).toBeLessThan(
      adminClient.auth.admin.signOut.mock.invocationCallOrder[0],
    );
    expect(hookOrder).toBeLessThan(
      adminClient.auth.admin.deleteUser.mock.invocationCallOrder[0],
    );
  });

  it("refuses the deletion and leaves the account intact when a step fails", async () => {
    const failure = new Error("artefact detach rejected");
    mockRunPreDeleteSteps.mockResolvedValueOnce({
      ok: false,
      failedStep: "cv-engine-detach",
      completedSteps: [],
      error: failure,
    });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "pre_delete_incomplete" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    // Nothing destructive may have happened: no deletion, no revoked
    // sessions, no cleared cookie. The caller can retry.
    expect(adminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
    expect(adminClient.auth.admin.signOut).not.toHaveBeenCalled();
    expect(authClient.auth.signOut).not.toHaveBeenCalled();

    expect(mockedReportApiError).toHaveBeenCalledTimes(1);
    const report = mockedReportApiError.mock.calls[0][0];
    expect(report.route).toBe("/api/account/delete");
    expect(report.step).toBe("account-delete");
    expect(report.error).toBeInstanceOf(Error);
    expect((report.error as Error).message).toBe(
      "Pre-delete step failed: cv-engine-detach",
    );
    expect((report.error as Error).cause).toBe(failure);
  });

  it("never starts pre-delete work for a stale owner", async () => {
    const response = await DELETE(deleteRequest("user-2"));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "account_owner_mismatch" });
    expect(mockRunPreDeleteSteps).not.toHaveBeenCalled();
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("never starts pre-delete work for a throttled caller", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce(false);

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limit_exceeded" });
    expect(mockRunPreDeleteSteps).not.toHaveBeenCalled();
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });
});
