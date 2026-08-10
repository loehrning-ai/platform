import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { AuthApiError } from "@supabase/supabase-js";

const {
  createAuthServerClientMock,
  exchangeCodeForSessionMock,
  getClaimsMock,
  getUserMock,
  isAccountRuntimeReadyMock,
  isGoogleOAuthRuntimeReadyMock,
  isMagicLinkRuntimeReadyMock,
  signOutMock,
} = vi.hoisted(() => {
  const exchangeCodeForSessionMock = vi.fn();
  const getClaimsMock = vi.fn();
  const getUserMock = vi.fn();
  const signOutMock = vi.fn();
  const isAccountRuntimeReadyMock = vi.fn(() => true);
  const isGoogleOAuthRuntimeReadyMock = vi.fn(() => true);
  const isMagicLinkRuntimeReadyMock = vi.fn(() => true);
  const createAuthServerClientMock = vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      getClaims: getClaimsMock,
      getUser: getUserMock,
      signOut: signOutMock,
    },
  }));
  return {
    createAuthServerClientMock,
    exchangeCodeForSessionMock,
    getClaimsMock,
    getUserMock,
    isAccountRuntimeReadyMock,
    isGoogleOAuthRuntimeReadyMock,
    isMagicLinkRuntimeReadyMock,
    signOutMock,
  };
});

vi.mock("@/lib/supabase/auth-server", () => ({
  createAuthServerClient: createAuthServerClientMock,
}));

vi.mock("@/lib/provider-readiness", () => ({
  isAccountRuntimeReady: isAccountRuntimeReadyMock,
  isGoogleOAuthRuntimeReady: isGoogleOAuthRuntimeReadyMock,
  isMagicLinkRuntimeReady: isMagicLinkRuntimeReadyMock,
}));

import { GET } from "./route";

const VALID_CODE = "opaque.authorization-code_~A9";
const OTHER_VALID_CODE = "unissued-code.without-assumed-internal-format";

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
  isAccountRuntimeReadyMock.mockReturnValue(true);
  isGoogleOAuthRuntimeReadyMock.mockReturnValue(true);
  isMagicLinkRuntimeReadyMock.mockReturnValue(true);
  exchangeCodeForSessionMock.mockResolvedValue({
    data: {
      session: { access_token: "test-access-token" },
      user: { id: "user-1" },
    },
    error: null,
  });
  getUserMock.mockResolvedValue({
    data: {
      user: {
        id: "user-1",
        app_metadata: { provider: "email", providers: ["email"] },
        identities: [
          {
            provider: "email",
            last_sign_in_at: "2026-08-08T23:20:00.000Z",
          },
        ],
      },
    },
    error: null,
  });
  getClaimsMock.mockResolvedValue({
    data: {
      claims: {
        sub: "user-1",
        amr: [{ method: "magiclink", timestamp: 1_786_140_000 }],
      },
    },
    error: null,
  });
  signOutMock.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase callback authorization-code validation", () => {
  it("rejects a direct callback when no login method has a complete server attestation", async () => {
    isGoogleOAuthRuntimeReadyMock.mockReturnValue(false);
    isMagicLinkRuntimeReadyMock.mockReturnValue(false);

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expectPrivateRedirect(response);
    expect(location(response).searchParams.get("reason")).toBe(
      "auth-not-configured",
    );
    expect(createAuthServerClientMock).not.toHaveBeenCalled();
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("rejects a direct callback when the account runtime itself is incomplete", async () => {
    isAccountRuntimeReadyMock.mockReturnValue(false);

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expectPrivateRedirect(response);
    expect(location(response).searchParams.get("reason")).toBe(
      "auth-not-configured",
    );
    expect(createAuthServerClientMock).not.toHaveBeenCalled();
  });

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

  it("keeps an English continuation in the English login space after callback failure", async () => {
    const response = await GET(
      callbackRequest(
        "https://loehrning.ai/auth/callback?next=/en/kurse%3Fpersona%3Dtechnical",
      ),
    );

    expectPrivateRedirect(response);
    const target = location(response);
    expect(target.origin).toBe("https://loehrning.ai");
    expect(target.pathname).toBe("/en/login");
    expect(target.searchParams.get("next")).toBe(
      "/en/kurse?persona=technical",
    );
    expect(target.searchParams.get("reason")).toBe("missing-code");
    expect(createAuthServerClientMock).not.toHaveBeenCalled();
  });

  it("uses the German login fallback when an English-looking external continuation is rejected", async () => {
    const response = await GET(
      callbackRequest(
        "https://loehrning.ai/auth/callback?next=https://evil.example/en/konto",
      ),
    );

    const target = location(response);
    expect(target.pathname).toBe("/login");
    expect(target.searchParams.get("next")).toBe("/konto");
    expect(target.searchParams.get("reason")).toBe("missing-code");
  });

  it.each([
    ["empty", ""],
    ["whitespace-only", "   "],
    ["NUL-bearing", "opaque\u0000code"],
    ["CRLF-bearing", "opaque\r\ncode"],
    ["oversized", "a".repeat(2_049)],
  ])("fails a %s callback code without exchanging it", async (_label, code) => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${encodeURIComponent(code)}&next=/kurse`,
      ),
    );

    expectPrivateRedirect(response);
    expect(location(response).searchParams.get("reason")).toBe(
      "invalid-code-format",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate code parameters before creating an auth client", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&code=${OTHER_VALID_CODE}`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe(
      "invalid-code-format",
    );
    expect(createAuthServerClientMock).not.toHaveBeenCalled();
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("passes a bounded opaque code through byte-for-byte without assuming UUID structure", async () => {
    await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${encodeURIComponent(VALID_CODE)}`,
      ),
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith(VALID_CODE);
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
  it("requires the Google attestation for an exchanged OAuth session", async () => {
    isGoogleOAuthRuntimeReadyMock.mockReturnValue(false);
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          app_metadata: { provider: "google", providers: ["google"] },
          identities: [
            {
              provider: "google",
              last_sign_in_at: "2026-08-07T22:00:00.000Z",
            },
          ],
        },
      },
      error: null,
    });
    getClaimsMock.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-1",
          amr: [{ method: "oauth", timestamp: 1_786_140_000 }],
        },
      },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-not-configured",
    );
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("accepts Google OAuth when the verified Google identity matches the AMR event", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          // `provider` is the first sign-up method, not necessarily the
          // provider used for this session. A linked Google identity remains
          // valid when the account was originally created by email.
          app_metadata: {
            provider: "email",
            providers: ["email", "google"],
          },
          identities: [
            {
              provider: "email",
              last_sign_in_at: "2026-08-01T12:00:00.000Z",
            },
            {
              provider: "google",
              last_sign_in_at: "2026-08-07T22:00:00.000Z",
            },
          ],
        },
      },
      error: null,
    });
    getClaimsMock.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-1",
          amr: [{ method: "oauth", timestamp: 1_786_140_000 }],
        },
      },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).href).toBe("https://loehrning.ai/konto");
    expect(signOutMock).not.toHaveBeenCalled();
  });

  // GoTrue writes identities.last_sign_in_at when the identity is linked and
  // does not advance it on later sign-ins, so a returning Google user arrives
  // with a timestamp days or months behind the AMR event. Attribution must not
  // depend on the two agreeing.
  it("accepts a returning Google user whose identity timestamp is stale", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          app_metadata: { provider: "google", providers: ["google"] },
          identities: [
            {
              provider: "google",
              last_sign_in_at: "2026-01-04T09:15:00.000Z",
            },
          ],
        },
      },
      error: null,
    });
    getClaimsMock.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-1",
          amr: [{ method: "oauth", timestamp: 1_786_140_000 }],
        },
      },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).href).toBe("https://loehrning.ai/konto");
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("rejects a generic OAuth AMR when the verified current identity is not Google", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          app_metadata: { provider: "github", providers: ["github"] },
          identities: [
            {
              provider: "github",
              last_sign_in_at: "2026-08-07T22:00:00.000Z",
            },
          ],
        },
      },
      error: null,
    });
    getClaimsMock.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-1",
          amr: [{ method: "oauth", timestamp: 1_786_140_000 }],
        },
      },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-not-configured",
    );
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rejects linked Google metadata when another OAuth identity owns the current AMR event", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          app_metadata: {
            provider: "email",
            providers: ["email", "google", "github"],
          },
          identities: [
            {
              provider: "google",
              last_sign_in_at: "2026-08-01T12:00:00.000Z",
            },
            {
              provider: "github",
              last_sign_in_at: "2026-08-07T22:00:00.000Z",
            },
          ],
        },
      },
      error: null,
    });
    getClaimsMock.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-1",
          amr: [{ method: "oauth", timestamp: 1_786_140_000 }],
        },
      },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-not-configured",
    );
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("requires the magic-link attestation for an exchanged email session", async () => {
    isMagicLinkRuntimeReadyMock.mockReturnValue(false);

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-not-configured",
    );
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rejects a session whose verified claims do not identify a supported login method", async () => {
    getClaimsMock.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-1",
          amr: [{ method: "password", timestamp: 1_786_140_000 }],
        },
      },
      error: null,
    });

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-not-configured",
    );
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

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
    expect(getClaimsMock).toHaveBeenCalledTimes(1);
    expect(getUserMock).toHaveBeenCalledWith("test-access-token");
    expect(getClaimsMock).toHaveBeenCalledWith("test-access-token");
    expect(
      exchangeCodeForSessionMock.mock.invocationCallOrder[0],
    ).toBeLessThan(getUserMock.mock.invocationCallOrder[0] ?? 0);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("returns a verified English session to its localized continuation", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/en/konto%3Fview%3Dprogress`,
      ),
    );

    expectPrivateRedirect(response);
    expect(location(response).href).toBe(
      "https://loehrning.ai/en/konto?view=progress",
    );
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith(VALID_CODE);
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it("uses the safe fallback when next is an external URL", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=https://evil.example`,
      ),
    );

    expect(location(response).href).toBe("https://loehrning.ai/konto");
  });

  it("uses the safe fallback when dot normalization creates a scheme-relative URL", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/%252e%252e//evil.example`,
      ),
    );

    expect(location(response).href).toBe("https://loehrning.ai/konto");
  });

  it("rejects a localized login return target to prevent redirect loops", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/en/login`,
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

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-unavailable",
    );
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

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-unavailable",
    );
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("distinguishes auth-client creation outage from an invalid link", async () => {
    createAuthServerClientMock.mockRejectedValueOnce(
      new Error("Auth configuration backend unavailable"),
    );

    const response = await GET(
      callbackRequest(
        `https://loehrning.ai/auth/callback?code=${VALID_CODE}`,
      ),
    );

    expect(location(response).searchParams.get("reason")).toBe(
      "auth-unavailable",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
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

  // A forwarded host is only applied alongside a forwarded protocol. Supplying
  // the host alone leaves the request on its real authority, so this case is
  // rejected for the same reason as any other hostile host.
  it("ignores a forwarded host that arrives without a forwarded protocol", async () => {
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

  // The complementary case, asserted so the contract is visible rather than
  // implied: a COMPLETE forwarded pair naming an allowlisted host is applied
  // over the real authority. That is deliberate — behind the platform proxy the
  // real authority is a placeholder, so the forwarded pair is the only true
  // record of the request. Safety comes from trustedRequestOrigin accepting
  // just the production hostnames and returning a fixed origin constant, never
  // the forwarded value. Without this test the header path had no coverage at
  // an allowlisted host, and a widened allowlist would have shipped green.
  it("applies a complete forwarded pair that names an allowlisted host", async () => {
    const response = await GET(
      callbackRequest(
        `https://loehrning.ai.evil.example/auth/callback?code=${VALID_CODE}`,
        {
          "x-forwarded-host": "loehrning.ai",
          "x-forwarded-proto": "https",
        },
      ),
    );

    expect(location(response).searchParams.get("reason")).not.toBe(
      "untrusted-origin",
    );
  });

  it("canonicalizes the trusted www production host before consuming the one-time code", async () => {
    const response = await GET(
      callbackRequest(
        `https://www.loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
      ),
    );

    expect(location(response).href).toBe(
      `https://loehrning.ai/auth/callback?code=${VALID_CODE}&next=/konto`,
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
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
