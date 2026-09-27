import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The liveness check that lets a grant revocation, a global sign-out, or an
 * account deletion stop an OAuth access token before it expires. The store
 * is a scripted RPC fake, so the exact call and every failure shape are
 * observable.
 */

type RpcResult = { data: unknown; error: unknown };

const { rpcMock, reportApiErrorMock, serviceClient } = vi.hoisted(() => {
  const rpcMock = vi.fn<
    (name: string, args: Record<string, unknown>) => Promise<RpcResult>
  >(async () => ({ data: true, error: null }));
  return {
    rpcMock,
    reportApiErrorMock: vi.fn(),
    serviceClient: { available: true },
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () =>
    serviceClient.available ? { rpc: rpcMock } : null,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: reportApiErrorMock,
}));

import {
  AGENT_OAUTH_SESSION_LIVE_RPC,
  checkOAuthSessionLive,
  clearOAuthSessionLivenessCache,
  OAUTH_SESSION_LIVE_CACHE_TTL_MS,
} from "./oauth-sessions";

const SESSION_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const USER_ID = "3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const NOW = new Date("2026-09-27T12:00:00.000Z");
const TOKEN_EXPIRES_AT = Math.floor(NOW.getTime() / 1000) + 3600;

function at(offsetMs: number): Date {
  return new Date(NOW.getTime() + offsetMs);
}

beforeEach(() => {
  vi.clearAllMocks();
  clearOAuthSessionLivenessCache();
  serviceClient.available = true;
  rpcMock.mockImplementation(async () => ({ data: true, error: null }));
});

describe("checkOAuthSessionLive", () => {
  it("asks the database about exactly this session and user", async () => {
    await expect(
      checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT),
    ).resolves.toEqual({ ok: true });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(AGENT_OAUTH_SESSION_LIVE_RPC, {
      p_session_id: SESSION_ID,
      p_user_id: USER_ID,
    });
    expect(AGENT_OAUTH_SESSION_LIVE_RPC).toBe("agent_oauth_session_live");
  });

  it("refuses a session that has ended", async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null });

    await expect(
      checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT),
    ).resolves.toEqual({ ok: false, reason: "revoked" });
  });

  it("never caches a refusal", async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null });
    await checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT);
    await checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT);

    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it("reuses a positive answer for at most a minute", async () => {
    await checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT);
    await checkOAuthSessionLive(
      SESSION_ID,
      USER_ID,
      at(OAUTH_SESSION_LIVE_CACHE_TTL_MS - 1),
      TOKEN_EXPIRES_AT,
    );
    expect(rpcMock).toHaveBeenCalledTimes(1);

    // Revoked meanwhile: the next check after the window sees it.
    rpcMock.mockResolvedValueOnce({ data: false, error: null });
    await expect(
      checkOAuthSessionLive(
        SESSION_ID,
        USER_ID,
        at(OAUTH_SESSION_LIVE_CACHE_TTL_MS),
        TOKEN_EXPIRES_AT,
      ),
    ).resolves.toEqual({ ok: false, reason: "revoked" });
    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(OAUTH_SESSION_LIVE_CACHE_TTL_MS).toBeLessThanOrEqual(60_000);
  });

  it("never reuses a positive answer past the token's own expiry", async () => {
    const expiresSoon = Math.floor(NOW.getTime() / 1000) + 10;
    await checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, expiresSoon);
    await checkOAuthSessionLive(SESSION_ID, USER_ID, at(10_000), expiresSoon);

    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it("keeps separate answers for another user on the same session id", async () => {
    const otherUser = "5d2f7a1e-3c9b-4e4f-8b62-8c3d9f1e2a47";
    await checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT);
    rpcMock.mockResolvedValueOnce({ data: false, error: null });

    await expect(
      checkOAuthSessionLive(SESSION_ID, otherUser, NOW, TOKEN_EXPIRES_AT),
    ).resolves.toEqual({ ok: false, reason: "revoked" });
  });

  it("fails closed when the store answers with an error", async () => {
    const error = { code: "PGRST202", message: "function not found" };
    rpcMock.mockResolvedValueOnce({ data: null, error });

    await expect(
      checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(reportApiErrorMock).toHaveBeenCalledWith({
      step: "supabase-read",
      error,
    });
    // Not cached either way.
    await checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT);
    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it("fails closed when the store call throws", async () => {
    rpcMock.mockRejectedValueOnce(new Error("network"));

    await expect(
      checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it.each([null, "true", 1, {}])(
    "fails closed on the non-boolean answer %j",
    async (data) => {
      rpcMock.mockResolvedValueOnce({ data, error: null });

      await expect(
        checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT),
      ).resolves.toEqual({ ok: false, reason: "unavailable" });
    },
  );

  it("fails closed without a store", async () => {
    serviceClient.available = false;

    await expect(
      checkOAuthSessionLive(SESSION_ID, USER_ID, NOW, TOKEN_EXPIRES_AT),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it.each([
    ["session id", "not-a-session", USER_ID],
    ["user id", SESSION_ID, "service-account"],
  ])("refuses a malformed %s without a lookup", async (_label, sessionId, userId) => {
    await expect(
      checkOAuthSessionLive(sessionId, userId, NOW, TOKEN_EXPIRES_AT),
    ).resolves.toEqual({ ok: false, reason: "revoked" });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
