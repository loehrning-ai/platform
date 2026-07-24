import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { AuthApiError } from "@supabase/supabase-js";

const {
  createAuthServerClientMock,
  exchangeCodeForSessionMock,
  getUserMock,
  signOutMock,
} = vi.hoisted(() => {
  const exchangeCodeForSessionMock = vi.fn();
  const getUserMock = vi.fn();
  const signOutMock = vi.fn();
  const createAuthServerClientMock = vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      getUser: getUserMock,
      signOut: signOutMock,
    },
  }));
  return {
    createAuthServerClientMock,
    exchangeCodeForSessionMock,
    getUserMock,
    signOutMock,
  };
});

vi.mock("@/lib/supabase/auth-server", () => ({
  createAuthServerClient: createAuthServerClientMock,
}));

import { GET } from "./route";

const VALID_CODE = "34e770dd-9ff9-416c-87fa-43b31d7ef225";
const OTHER_VALID_CODE = "79a5d1ce-d890-42d1-aeb9-9af22be85a56";

function callbackRequest(url: string, headers?: HeadersInit): NextRequest {
  return new Request(url, { headers }) as NextRequest;
}

function location(response: Response): URL {
  const value = response.headers.get("location");
  expect(value).not.toBeNull();
  return new URL(value ?? "https://invalid.test");
}

function expectPrivateRedirect(response: Response): void {
  expect(response.status).toBe(307);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-robots-tag")).toBe(
    "noindex, nofollow, noarchive",
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSessionMock.mockResolvedValue({
    data: {
      session: { access_token: "test-access-token" },
      user: { id: "user-1" },
    },
    error: null,
  });
  getUserMock.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  signOutMock.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase PKCE callback code validation", () => {
  it("fails a callback with no code before creating an auth client", async () => {
    const response = await GET(
      callbackRequest("https://loehrning.ai/auth/callback?next=/kurse"),
    );

    expectPrivateRedirect(response);
    const target = location(response);
    expect(target.origin).toBe("https://loehrning.ai");
    expect(target.pathname).toBe("/login");
    expect(target.searchParams.get("reason")).toBe("missing-code");
    expect(createAuthServerClientMock).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "arbitrary",
    "34e770dd-9ff9-116c-87fa-43b31d7ef225",
    "34e770dd-9ff9-416c-87fa-43b31d7ef225-extra",
    "%0D%0ASet-Cookie%3Aattacker",
  ])("fails malformed callback code %s without exchanging it", async (code) => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${code}&next=/kurse`,
      ),
    );

    expectPrivateRedirect(response);
    expect(location(response).searchParams.get("reason")).toBe(
      "invalid-code-format",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("fails an arbitrary well-formed but unissued code", async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: new AuthApiError("Flow state not found", 400, "flow_state_not_found"),
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${OTHER_VALID_CODE}`,
      ),
    );

    expectPrivateRedirect(response);
    expect(location(response).searchParams.get("reason")).toBe("ungueltig");
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("classifies an expired one-time code and never verifies a user", async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: new AuthApiError("Auth code expired", 400, "otp_expired"),
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${OTHER_VALID_CODE}`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe("abgelaufen");
    expect(getUserMock).not.toHaveBeenCalled();
  });
});

describe("Supabase PKCE callback session verification", () => {
  it("redirects to a sanitized internal path only after exchange and getUser succeed", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/kurse?persona=einsteiger%23start`,
      ),
    );

    expectPrivateRedirect(response);
    const target = location(response);
    expect(target.href).toBe(
      "https://loehrning.ai/kurse?persona=einsteiger#start",
    );
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith(VALID_CODE);
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(
      exchangeCodeForSessionMock.mock.invocationCallOrder[0],
    ).toBeLessThan(getUserMock.mock.invocationCallOrder[0] ?? 0);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("uses the safe fallback when next is an external URL", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=https://evil.example`,
      ),
    );

    expect(location(response).href).toBe("https://loehrning.ai/konto");
  });

  it("fails closed when exchange returns no error but no session", async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe("invalid-link");
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("fails closed when exchange throws", async () => {
    exchangeCodeForSessionMock.mockRejectedValueOnce(
      new Error("Auth backend unavailable"),
    );

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe("invalid-link");
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("clears the exchanged session when getUser returns an error", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: new AuthApiError("JWT expired", 401, "bad_jwt"),
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}`,
      ),
    );

    expect(location(response).pathname).toBe("/login");
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("clears the exchanged session when getUser throws", async () => {
    getUserMock.mockRejectedValueOnce(new Error("Auth network failure"));

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe("invalid-link");
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rejects a missing or mismatched verified user", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: "different-user" } },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe("invalid-link");
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });
});

describe("callback redirect-origin policy", () => {
  it.each([
    "https://loehrning.ai.evil.example",
    "https://evil.example",
    "http://loehrning.ai",
    "https://loehrning.ai:444",
    "https://localhost.evil.example:3000",
  ])("rejects untrusted request origin %s", async (origin) => {
    const response = await GET(
      callbackRequest(`${origin}/auth/callback?code=${VALID_CODE}`),
    );
    expect(location(response).origin).toBe("https://loehrning.ai");
    expect(location(response).searchParams.get("reason")).toBe(
      "untrusted-origin",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("does not exchange a code received on an untrusted origin", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai.evil.example/auth/callback?code=${VALID_CODE}`,
        { "x-forwarded-host": "loehrning.ai" },
      ),
    );

    expectPrivateRedirect(response);
    const target = location(response);
    expect(target.origin).toBe("https://loehrning.ai");
    expect(target.searchParams.get("reason")).toBe("untrusted-origin");
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("canonicalizes the trusted www production host", async () => {
    const response = await GET(
      callbackRequest(
        `https://www.loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).href).toBe("https://loehrning.ai/konto");
  });

  it("preserves an exact loopback origin outside production", async () => {
    const response = await GET(
      callbackRequest(
        `http://127.0.0.1:3137/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).href).toBe("http://127.0.0.1:3137/konto");
  });

  it("rejects loopback origins in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await GET(
      callbackRequest(
        `http://localhost:3000/auth/callback?code=${VALID_CODE}`,
      ),
    );
    expect(location(response).origin).toBe("https://loehrning.ai");
    expect(location(response).searchParams.get("reason")).toBe(
      "untrusted-origin",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("preserves only the exact Vercel preview system hostname", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv(
      "VERCEL_URL",
      "platform-git-security-loehrning-ai.vercel.app",
    );

    const response = await GET(
      callbackRequest(
        `https://platform-git-security-loehrning-ai.vercel.app/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).href).toBe(
      "https://platform-git-security-loehrning-ai.vercel.app/konto",
    );
  });

  it("rejects a Vercel preview hostname lookalike", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv(
      "VERCEL_URL",
      "platform-git-security-loehrning-ai.vercel.app",
    );

    const response = await GET(
      callbackRequest(
        `https://platform-git-security-loehrning-ai.vercel.app.evil.example/auth/callback?code=${VALID_CODE}`,
      ),
    );

    expect(location(response).origin).toBe("https://loehrning.ai");
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });
});
