import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRevokeGrant = vi.fn<
  (options: { clientId: string }) => Promise<{ data: unknown; error: unknown }>
>(async () => ({ data: {}, error: null }));
const mockAuthClient = vi.fn<() => Promise<unknown>>(async () => ({
  auth: { oauth: { revokeGrant: mockRevokeGrant } },
}));
const mockGetAuthenticatedUser = vi.fn<() => Promise<unknown>>(async () => ({
  configured: true,
  user: { id: "user-1" },
}));
const mockConsumeRateLimit = vi.fn<
  (args: { key: string; windowSeconds: number; max: number }) => Promise<boolean>
>(async () => true);
const mockReportApiError = vi.fn();

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
  createAuthServerClient: () => mockAuthClient(),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (args: {
    key: string;
    windowSeconds: number;
    max: number;
  }) => mockConsumeRateLimit(args),
  hashedClientRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:ip:${"a".repeat(64)}`,
  ),
  hashedAuthenticatedRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:user:${"b".repeat(64)}`,
  ),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

import { DELETE } from "./route";

const CLIENT_ID = "6b2f4a11-2222-4333-8444-555566667777";

function request(body: unknown, contentType = "application/json"): Request {
  return new Request("https://loehrning.ai/api/account/oauth-grants", {
    method: "DELETE",
    headers: contentType ? { "content-type": contentType } : {},
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("DELETE /api/account/oauth-grants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRevokeGrant.mockResolvedValue({ data: {}, error: null });
    mockAuthClient.mockResolvedValue({
      auth: { oauth: { revokeGrant: mockRevokeGrant } },
    });
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: { id: "user-1" },
    });
    mockConsumeRateLimit.mockResolvedValue(true);
  });

  it("revokes the caller's own grant and answers privately", async () => {
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await json(response)).toEqual({
      ok: true,
      ownerId: "user-1",
      clientId: CLIENT_ID,
    });
    expect(mockRevokeGrant).toHaveBeenCalledWith({ clientId: CLIENT_ID });
  });

  it("refuses a request that is not JSON", async () => {
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }, "text/plain"),
    );
    expect(response.status).toBe(415);
    expect((await json(response)).error).toBe("unsupported_media_type");
    expect(mockRevokeGrant).not.toHaveBeenCalled();
  });

  it("answers 401 when there is no session", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
    });
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(401);
    expect((await json(response)).error).toBe("unauthorized");
  });

  it("separates an auth outage from a signed-out caller", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: new Error("supabase down"),
    });
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(503);
    expect((await json(response)).error).toBe("auth_unavailable");
    expect(mockReportApiError).toHaveBeenCalled();
  });

  it("spends both budgets and refuses when either is exhausted", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce(false);
    const first = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(first.status).toBe(429);
    expect(mockRevokeGrant).not.toHaveBeenCalled();

    mockConsumeRateLimit
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const second = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(second.status).toBe(429);
    expect(mockRevokeGrant).not.toHaveBeenCalled();
  });

  it("answers 503 when the limiter itself is unavailable", async () => {
    mockConsumeRateLimit.mockRejectedValue(new Error("limiter down"));
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(503);
    expect((await json(response)).error).toBe("rate_limit_unavailable");
  });

  it("refuses a body that is too large", async () => {
    const response = await DELETE(
      request({
        expectedOwnerId: "user-1",
        clientId: CLIENT_ID,
        padding: "x".repeat(8 * 1024),
      }),
    );
    expect(response.status).toBe(413);
    expect((await json(response)).error).toBe("payload_too_large");
  });

  const INVALID_BODIES: [string, Record<string, unknown>][] = [
    ["nothing at all", {}],
    ["no client id", { expectedOwnerId: "user-1" }],
    ["an empty client id", { expectedOwnerId: "user-1", clientId: "" }],
    [
      "path syntax in the client id",
      { expectedOwnerId: "user-1", clientId: "a/../b" },
    ],
    [
      "an oversized client id",
      { expectedOwnerId: "user-1", clientId: "c".repeat(65) },
    ],
    [
      "an unknown key",
      { expectedOwnerId: "user-1", clientId: CLIENT_ID, extra: true },
    ],
  ];

  it.each(INVALID_BODIES)("refuses a body with %s", async (_why, body) => {
    const response = await DELETE(request(body));
    expect(response.status).toBe(400);
    expect((await json(response)).error).toBe("invalid_grant_request");
    expect(mockRevokeGrant).not.toHaveBeenCalled();
  });

  it("refuses when the session changed under the tab", async () => {
    const response = await DELETE(
      request({ expectedOwnerId: "someone-else", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(409);
    expect((await json(response)).error).toBe("account_owner_mismatch");
    expect(mockRevokeGrant).not.toHaveBeenCalled();
  });

  it("answers 503 when the deployment has no OAuth namespace", async () => {
    mockAuthClient.mockResolvedValue({ auth: {} });
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(503);
    expect((await json(response)).error).toBe("oauth_server_unavailable");
  });

  it("reports and answers 502 when the authorization server refuses", async () => {
    mockRevokeGrant.mockResolvedValue({ data: null, error: { status: 400 } });
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(502);
    expect((await json(response)).error).toBe("grant_revoke_failed");
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "oauth-revoke-grant" }),
    );
  });

  it("reports and answers 502 when the call throws", async () => {
    mockRevokeGrant.mockRejectedValue(new Error("offline"));
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(502);
    expect((await json(response)).error).toBe("grant_revoke_failed");
  });

  it("answers 503 when the auth client cannot be built", async () => {
    mockAuthClient.mockResolvedValue(null);
    const response = await DELETE(
      request({ expectedOwnerId: "user-1", clientId: CLIENT_ID }),
    );
    expect(response.status).toBe(503);
    expect((await json(response)).error).toBe("auth_not_configured");
  });
});
