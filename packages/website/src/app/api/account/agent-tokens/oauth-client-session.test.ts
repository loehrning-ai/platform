/**
 * An OAuth client's access token must never act as a first-party session.
 *
 * The Supabase OAuth server issues ordinary project JWTs to the third-party
 * clients a learner approves, and the Auth server accepts them on getUser().
 * A client could wrap one in an `sb-<ref>-auth-token` cookie and call this
 * route server to server to mint a personal token that outlives the grant.
 *
 * Unlike route.test.ts, this file keeps the real getAuthenticatedUser and
 * stubs only the Supabase client underneath it, so the first-party check is
 * exercised on the actual route path.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OWNER_ID = "9f1d7c2a-6f5b-4a3e-9d21-0f6b4c8e1a77";

const {
  cookieStore,
  getUserMock,
  getClaimsMock,
  signOutMock,
  serviceFromMock,
  consumeRateLimitMock,
} = vi.hoisted(() => ({
  cookieStore: {
    getAll: vi.fn(() => [
      { name: "sb-fake-project-auth-token", value: "base64-oauth-client-token" },
    ]),
    set: vi.fn(),
  },
  getUserMock: vi.fn(),
  getClaimsMock: vi.fn(),
  signOutMock: vi.fn(async () => ({ error: null })),
  serviceFromMock: vi.fn(),
  consumeRateLimitMock: vi.fn(async () => true),
}));

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: getUserMock,
      getClaims: getClaimsMock,
      signOut: signOutMock,
    },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => ({ from: serviceFromMock }),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  hashedAuthenticatedRateLimitKey: async () => "user-key",
  hashedClientRateLimitKey: async () => "client-key",
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));

import { DELETE, POST } from "./route";

const ENDPOINT = "https://loehrning.ai/api/account/agent-tokens";

function enableAgentAccess(): void {
  vi.stubEnv("MCP_SERVER_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  // getAuthenticatedUser runs for real here, so the public config has to
  // classify as a publishable key (the same fixture auth-server.test.ts uses).
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "sb_publishable_abcdefghijklmnopqrstuv_12345678",
  );
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-07-01");
}

function mintRequest(): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedOwnerId: OWNER_ID, name: "Laptop" }),
  });
}

function claims(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      claims: {
        sub: OWNER_ID,
        aud: "authenticated",
        role: "authenticated",
        session_id: "11111111-1111-4111-8111-111111111111",
        ...overrides,
      },
    },
    error: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  enableAgentAccess();
  getUserMock.mockResolvedValue({ data: { user: { id: OWNER_ID } }, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("an OAuth client token presented as a session cookie", () => {
  it("cannot mint a personal access token", async () => {
    getClaimsMock.mockResolvedValue(
      claims({
        client_id: "b7f0c2d4-malicious-client",
        amr: [{ method: "oauth_provider/authorization_code", timestamp: 1 }],
      }),
    );

    const response = await POST(mintRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    // Nothing past the session gate ran: no budget, no store access.
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
    expect(serviceFromMock).not.toHaveBeenCalled();
  });

  it("cannot revoke a personal access token either", async () => {
    getClaimsMock.mockResolvedValue(claims({ client_id: "b7f0c2d4-client" }));

    const response = await DELETE(
      new Request(ENDPOINT, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedOwnerId: OWNER_ID,
          tokenId: "1b2c3d4e-5f60-4718-8293-a4b5c6d7e8f9",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(serviceFromMock).not.toHaveBeenCalled();
  });

  it("is refused for a token issued to another audience", async () => {
    getClaimsMock.mockResolvedValue(
      claims({ aud: "https://loehrning.ai/api/mcp" }),
    );

    const response = await POST(mintRequest());

    expect(response.status).toBe(401);
    expect(serviceFromMock).not.toHaveBeenCalled();
  });

  it("answers 503, not 401, when the claims cannot be verified", async () => {
    getClaimsMock.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("jwks unreachable"), {
        name: "AuthRetryableFetchError",
        status: 0,
      }),
    });

    const response = await POST(mintRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(signOutMock).not.toHaveBeenCalled();
    expect(serviceFromMock).not.toHaveBeenCalled();
  });

  it("lets a first-party session through the session gate", async () => {
    getClaimsMock.mockResolvedValue(
      claims({ amr: [{ method: "oauth", timestamp: 1 }] }),
    );
    consumeRateLimitMock.mockResolvedValueOnce(false);

    const response = await POST(mintRequest());

    // The rate limit is the next gate: reaching it proves the session passed.
    expect(response.status).toBe(429);
    expect(consumeRateLimitMock).toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
