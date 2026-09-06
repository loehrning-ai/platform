import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createAuthServerClient: vi.fn(),
  isOAuthServerReady: vi.fn(),
  reportApiError: vi.fn(),
  consumeRateLimit: vi.fn(),
  approveAuthorization: vi.fn(),
  denyAuthorization: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  createAuthServerClient: mocks.createAuthServerClient,
}));
vi.mock("@/lib/provider-readiness", () => ({
  isOAuthServerReady: mocks.isOAuthServerReady,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.reportApiError,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  hashedAuthenticatedRateLimitKey: vi.fn(
    async (namespace: string, _request: Request, userId: string) =>
      `${namespace}:user:${userId}`,
  ),
  hashedClientRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:ip`,
  ),
}));

import { GET, POST } from "./route";

const AUTHORIZATION_ID = "1f4d2a4e-5b6c-4d7e-8f90-a1b2c3d4e5f6";
const APPROVED = "https://claude.ai/callback?code=abc&state=xyz";
const DENIED = "https://claude.ai/callback?error=access_denied&state=xyz";

function decisionRequest(
  fields: Record<string, string> = {
    authorization_id: AUTHORIZATION_ID,
    entscheidung: "zustimmen",
    sprache: "de",
  },
  options: {
    url?: string;
    headers?: Record<string, string>;
    body?: string;
    contentType?: string | null;
    omitOrigin?: boolean;
    omitFetchSite?: boolean;
  } = {},
): NextRequest {
  const url = options.url ?? "https://loehrning.ai/oauth/consent/entscheidung";
  const headers: Record<string, string> = {
    ...(options.omitOrigin ? {} : { Origin: new URL(url).origin }),
    ...(options.omitFetchSite ? {} : { "Sec-Fetch-Site": "same-origin" }),
    ...(options.contentType === null
      ? {}
      : {
          "Content-Type":
            options.contentType ?? "application/x-www-form-urlencoded",
        }),
    ...options.headers,
  };
  return new Request(url, {
    method: "POST",
    headers,
    body: options.body ?? new URLSearchParams(fields).toString(),
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isOAuthServerReady.mockReturnValue(true);
  mocks.getAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: { id: "learner-1", email: "lernende@example.com" },
  });
  mocks.consumeRateLimit.mockResolvedValue(true);
  mocks.approveAuthorization.mockResolvedValue({
    data: { redirect_url: APPROVED },
    error: null,
  });
  mocks.denyAuthorization.mockResolvedValue({
    data: { redirect_url: DENIED },
    error: null,
  });
  mocks.createAuthServerClient.mockResolvedValue({
    auth: {
      oauth: {
        getAuthorizationDetails: vi.fn(),
        approveAuthorization: mocks.approveAuthorization,
        denyAuthorization: mocks.denyAuthorization,
      },
    },
  });
});

describe("consent decision route method and readiness", () => {
  it("answers GET with 405 and names the accepted method", () => {
    const response = GET();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does not exist while the OAuth server is unconfirmed", async () => {
    mocks.isOAuthServerReady.mockReturnValue(false);

    const response = await POST(decisionRequest());

    expect(response.status).toBe(404);
    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });
});

describe("consent decision route origin checks", () => {
  it("rejects an untrusted request authority before touching auth", async () => {
    const response = await POST(
      decisionRequest(undefined, {
        url: "https://attacker.example/oauth/consent/entscheidung",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("rejects a request that carries no Origin header at all", async () => {
    const response = await POST(decisionRequest(undefined, { omitOrigin: true }));

    expect(response.status).toBe(403);
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });

  it.each([
    [
      "cross-origin Origin",
      { Origin: "https://attacker.example", "Sec-Fetch-Site": "cross-site" },
    ],
    [
      "same-site subdomain",
      { Origin: "https://sub.loehrning.ai", "Sec-Fetch-Site": "same-site" },
    ],
    ["cross-site fetch metadata", { "Sec-Fetch-Site": "cross-site" }],
  ])("rejects %s", async (_label, headers) => {
    const response = await POST(decisionRequest(undefined, { headers }));

    expect(response.status).toBe(403);
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });

  it("still accepts a submit from a browser that sends no fetch metadata", async () => {
    const response = await POST(
      decisionRequest(undefined, { omitFetchSite: true }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(APPROVED);
  });
});

describe("consent decision route body handling", () => {
  it("rejects a body that is not a URL-encoded form", async () => {
    const response = await POST(
      decisionRequest(undefined, {
        contentType: "application/json",
        body: JSON.stringify({ entscheidung: "zustimmen" }),
      }),
    );

    expect(response.status).toBe(415);
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });

  it("rejects an oversized body", async () => {
    const response = await POST(
      decisionRequest(undefined, {
        headers: { "Content-Length": "99999" },
      }),
    );

    expect(response.status).toBe(413);
  });

  it.each([
    ["an unknown decision", { authorization_id: AUTHORIZATION_ID, entscheidung: "vielleicht" }],
    ["a missing decision", { authorization_id: AUTHORIZATION_ID }],
    ["a missing request id", { entscheidung: "zustimmen" }],
    [
      "a request id shaped like a path escape",
      { authorization_id: "../../admin/users", entscheidung: "zustimmen" },
    ],
  ])("rejects %s with 400", async (_label, fields) => {
    const response = await POST(decisionRequest(fields));

    expect(response.status).toBe(400);
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
    expect(mocks.denyAuthorization).not.toHaveBeenCalled();
  });
});

describe("consent decision route authentication", () => {
  it("hands a signed-out learner back to the consent page, which signs them in", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
    });

    const response = await POST(decisionRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `https://loehrning.ai/oauth/consent?authorization_id=${AUTHORIZATION_ID}`,
    );
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });

  it("reports an auth outage and never records a decision", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: new Error("supabase down"),
    });

    const response = await POST(decisionRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `https://loehrning.ai/oauth/consent?authorization_id=${AUTHORIZATION_ID}&fehler=backend-unavailable`,
    );
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "auth-get-user" }),
    );
  });
});

describe("consent decision route limits", () => {
  it("answers 429 once the per-account window is spent", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce(false).mockResolvedValue(true);

    const response = await POST(decisionRequest());

    expect(response.status).toBe(429);
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });

  it("answers 429 once the per-address window is spent", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce(true).mockResolvedValue(false);

    const response = await POST(decisionRequest());

    expect(response.status).toBe(429);
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });

  it("answers 503 when the limiter itself is unavailable", async () => {
    mocks.consumeRateLimit.mockRejectedValue(new Error("limiter down"));

    const response = await POST(decisionRequest());

    expect(response.status).toBe(503);
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "rate-limit" }),
    );
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
  });
});

describe("consent decision route decisions", () => {
  it("approves and sends the learner to the client with the code", async () => {
    const response = await POST(decisionRequest());

    expect(mocks.approveAuthorization).toHaveBeenCalledWith(AUTHORIZATION_ID, {
      skipBrowserRedirect: true,
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(APPROVED);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
  });

  it("denies and sends the learner back to the client without access", async () => {
    const response = await POST(
      decisionRequest({
        authorization_id: AUTHORIZATION_ID,
        entscheidung: "ablehnen",
        sprache: "de",
      }),
    );

    expect(mocks.denyAuthorization).toHaveBeenCalledWith(AUTHORIZATION_ID, {
      skipBrowserRedirect: true,
    });
    expect(mocks.approveAuthorization).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(DENIED);
  });

  it("returns an expired request to our own page, never to the client", async () => {
    mocks.approveAuthorization.mockResolvedValue({
      data: null,
      error: { status: 410 },
    });

    const response = await POST(decisionRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `https://loehrning.ai/oauth/consent?authorization_id=${AUTHORIZATION_ID}&fehler=unknown-request`,
    );
  });

  it("keeps an English submission on the English consent page", async () => {
    mocks.approveAuthorization.mockResolvedValue({
      data: null,
      error: { status: 410 },
    });

    const response = await POST(
      decisionRequest({
        authorization_id: AUTHORIZATION_ID,
        entscheidung: "zustimmen",
        sprache: "en",
      }),
    );

    expect(response.headers.get("location")).toBe(
      `https://loehrning.ai/en/oauth/consent?authorization_id=${AUTHORIZATION_ID}&fehler=unknown-request`,
    );
  });

  it("falls back to German for an unknown language field", async () => {
    mocks.approveAuthorization.mockResolvedValue({
      data: null,
      error: { status: 500 },
    });

    const response = await POST(
      decisionRequest({
        authorization_id: AUTHORIZATION_ID,
        entscheidung: "zustimmen",
        sprache: "fr",
      }),
    );

    expect(response.headers.get("location")).toBe(
      `https://loehrning.ai/oauth/consent?authorization_id=${AUTHORIZATION_ID}&fehler=backend-unavailable`,
    );
  });

  it("never follows a redirect target that is not an absolute HTTP address", async () => {
    mocks.approveAuthorization.mockResolvedValue({
      data: { redirect_url: "javascript:alert(1)" },
      error: null,
    });

    const response = await POST(decisionRequest());

    expect(response.headers.get("location")).toBe(
      `https://loehrning.ai/oauth/consent?authorization_id=${AUTHORIZATION_ID}&fehler=decision-failed`,
    );
  });

  it("returns to our own page when the auth client cannot be built", async () => {
    mocks.createAuthServerClient.mockRejectedValue(new Error("no cookies"));

    const response = await POST(decisionRequest());

    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "auth-create-client" }),
    );
    expect(response.headers.get("location")).toBe(
      `https://loehrning.ai/oauth/consent?authorization_id=${AUTHORIZATION_ID}&fehler=backend-unavailable`,
    );
  });
});
