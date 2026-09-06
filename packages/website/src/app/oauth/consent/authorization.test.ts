import { describe, expect, it, vi } from "vitest";
import {
  classifyAuthorizationError,
  oauthServerApi,
  parseScopes,
  readAuthorizationId,
  redirectHost,
  resolveAuthorizationRequest,
  safeClientRedirect,
  submitConsentDecision,
  toConsentDetails,
} from "./authorization";

const AUTHORIZATION_ID = "1f4d2a4e-5b6c-4d7e-8f90-a1b2c3d4e5f6";

function authClient(oauth: Record<string, unknown>) {
  return { auth: { oauth } } as unknown as Parameters<
    typeof resolveAuthorizationRequest
  >[0];
}

function detailsPayload(overrides: Record<string, unknown> = {}) {
  return {
    authorization_id: AUTHORIZATION_ID,
    redirect_uri: "https://claude.ai/api/mcp/auth_callback",
    client: {
      id: "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0",
      name: "Claude Desktop",
      uri: "https://claude.ai",
      logo_uri: "https://claude.ai/logo.png",
    },
    user: { id: "learner-1", email: "lernende@example.com" },
    scope: "openid email",
    ...overrides,
  };
}

describe("readAuthorizationId", () => {
  it("accepts the UUID the authorization server issues", () => {
    expect(readAuthorizationId(AUTHORIZATION_ID)).toEqual({
      ok: true,
      authorizationId: AUTHORIZATION_ID,
    });
  });

  it("reports a missing parameter separately from a malformed one", () => {
    expect(readAuthorizationId(undefined)).toEqual({
      ok: false,
      error: "missing-request",
    });
    expect(readAuthorizationId("")).toEqual({
      ok: false,
      error: "missing-request",
    });
    expect(readAuthorizationId("zu-kurz")).toEqual({
      ok: false,
      error: "invalid-request",
    });
  });

  it.each([
    ["path traversal", "../../admin/users/aaaaaaaaaaaaaaaa"],
    ["percent escape", "%2e%2e%2fadmin%2fusers%2faaaaaaaa"],
    ["query smuggling", "1f4d2a4e5b6c4d7e?foo=bar&baz=quux12345"],
    ["whitespace", "1f4d2a4e5b6c4d7e 8f90a1b2c3d4e5f6"],
    ["overlong", "a".repeat(65)],
    ["repeated parameter", ["a".repeat(20), "b".repeat(20)]],
  ])("rejects %s before it can reach a request path", (_label, value) => {
    expect(readAuthorizationId(value)).toEqual({
      ok: false,
      error: "invalid-request",
    });
  });
});

describe("parseScopes", () => {
  it("splits the space-separated scope string and drops duplicates", () => {
    expect(parseScopes("openid email openid profile")).toEqual([
      "openid",
      "email",
      "profile",
    ]);
  });

  it("returns nothing for a missing or non-string scope", () => {
    expect(parseScopes(undefined)).toEqual([]);
    expect(parseScopes(42)).toEqual([]);
    expect(parseScopes("")).toEqual([]);
  });

  it("drops tokens outside the scope character set", () => {
    expect(parseScopes('email "quoted" back\\slash profile')).toEqual([
      "email",
      "profile",
    ]);
  });

  it("bounds the list so one request cannot flood the consent screen", () => {
    const many = Array.from({ length: 40 }, (_v, index) => `scope${index}`);
    expect(parseScopes(many.join(" ")).length).toBe(16);
  });

  it("drops an oversized single token", () => {
    expect(parseScopes(`${"a".repeat(65)} email`)).toEqual(["email"]);
  });
});

describe("redirectHost", () => {
  it("shows the host the browser will be sent to", () => {
    expect(redirectHost("https://claude.ai/api/mcp/auth_callback")).toBe(
      "claude.ai",
    );
    expect(redirectHost("http://127.0.0.1:6274/oauth/callback")).toBe(
      "127.0.0.1:6274",
    );
  });

  it.each([
    ["credentials", "https://user:pass@claude.ai/callback"],
    ["a non-HTTP scheme", "javascript:alert(1)"],
    ["a relative reference", "/callback"],
    ["a non-string", 42],
  ])("refuses to name a host for %s", (_label, value) => {
    expect(redirectHost(value)).toBeNull();
  });
});

describe("safeClientRedirect", () => {
  it("keeps the completed redirect the authorization server produced", () => {
    expect(
      safeClientRedirect("https://claude.ai/callback?code=abc&state=xyz"),
    ).toBe("https://claude.ai/callback?code=abc&state=xyz");
  });

  it.each([
    ["a javascript URL", "javascript:alert(1)"],
    ["a data URL", "data:text/html,<script>alert(1)</script>"],
    ["embedded credentials", "https://user:pass@claude.ai/callback"],
    ["a relative path", "/konto"],
    ["an oversized value", `https://claude.ai/?x=${"a".repeat(2_100)}`],
  ])("never follows %s", (_label, value) => {
    expect(safeClientRedirect(value)).toBeNull();
  });
});

describe("toConsentDetails", () => {
  it("keeps the fields the consent screen has to show", () => {
    expect(toConsentDetails(detailsPayload(), AUTHORIZATION_ID)).toEqual({
      authorizationId: AUTHORIZATION_ID,
      clientId: "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0",
      clientName: "Claude Desktop",
      clientSite: "https://claude.ai",
      redirectHost: "claude.ai",
      scopes: ["openid", "email"],
      userEmail: "lernende@example.com",
    });
  });

  it("returns nothing without a client id, because it cannot be shown honestly", () => {
    expect(toConsentDetails(detailsPayload({ client: {} }), AUTHORIZATION_ID))
      .toBeNull();
    expect(toConsentDetails({ redirect_url: "https://x.example" }, AUTHORIZATION_ID))
      .toBeNull();
    expect(toConsentDetails(null, AUTHORIZATION_ID)).toBeNull();
  });

  it("caps registered client text so a long name cannot take over the page", () => {
    const details = toConsentDetails(
      detailsPayload({
        client: { id: "client-1234567890", name: "N".repeat(500) },
      }),
      AUTHORIZATION_ID,
    );
    expect(details?.clientName).toHaveLength(200);
  });

  it("reports an unparseable redirect target as unknown rather than guessing", () => {
    const details = toConsentDetails(
      detailsPayload({ redirect_uri: "not-a-url" }),
      AUTHORIZATION_ID,
    );
    expect(details?.redirectHost).toBeNull();
  });
});

describe("classifyAuthorizationError", () => {
  it("treats a 4xx as a spent or unknown request", () => {
    expect(classifyAuthorizationError({ status: 404 })).toBe("unknown-request");
    expect(classifyAuthorizationError({ status: 400 })).toBe("unknown-request");
  });

  it("treats everything else as an outage the learner should retry", () => {
    expect(classifyAuthorizationError({ status: 500 })).toBe(
      "backend-unavailable",
    );
    expect(classifyAuthorizationError(new TypeError("fetch failed"))).toBe(
      "backend-unavailable",
    );
    expect(
      classifyAuthorizationError({ name: "AuthSessionMissingError", status: 401 }),
    ).toBe("backend-unavailable");
  });
});

describe("oauthServerApi", () => {
  it("returns nothing when the auth client has no OAuth server namespace", () => {
    expect(oauthServerApi({ auth: {} } as never)).toBeNull();
    expect(
      oauthServerApi(authClient({ getAuthorizationDetails: vi.fn() })),
    ).toBeNull();
  });
});

describe("resolveAuthorizationRequest", () => {
  function api(overrides: Record<string, unknown> = {}) {
    return {
      getAuthorizationDetails: vi.fn(),
      approveAuthorization: vi.fn(),
      denyAuthorization: vi.fn(),
      ...overrides,
    };
  }

  it("asks for consent when the authorization server returns client details", async () => {
    const oauth = api({
      getAuthorizationDetails: vi
        .fn()
        .mockResolvedValue({ data: detailsPayload(), error: null }),
    });

    const result = await resolveAuthorizationRequest(
      authClient(oauth),
      AUTHORIZATION_ID,
    );

    expect(oauth.getAuthorizationDetails).toHaveBeenCalledWith(AUTHORIZATION_ID);
    expect(result).toEqual({
      kind: "consent",
      details: expect.objectContaining({ clientName: "Claude Desktop" }),
    });
  });

  it("follows the redirect the server produced for an existing grant", async () => {
    const result = await resolveAuthorizationRequest(
      authClient(
        api({
          getAuthorizationDetails: vi.fn().mockResolvedValue({
            data: { redirect_url: "https://claude.ai/callback?code=abc" },
            error: null,
          }),
        }),
      ),
      AUTHORIZATION_ID,
    );

    expect(result).toEqual({
      kind: "redirect",
      url: "https://claude.ai/callback?code=abc",
    });
  });

  it("renders an error for an expired request instead of redirecting", async () => {
    const result = await resolveAuthorizationRequest(
      authClient(
        api({
          getAuthorizationDetails: vi
            .fn()
            .mockResolvedValue({ data: null, error: { status: 404 } }),
        }),
      ),
      AUTHORIZATION_ID,
    );

    expect(result).toEqual({ kind: "error", error: "unknown-request" });
  });

  it("never follows a redirect the authorization server did not produce safely", async () => {
    const result = await resolveAuthorizationRequest(
      authClient(
        api({
          getAuthorizationDetails: vi.fn().mockResolvedValue({
            data: { redirect_url: "javascript:alert(1)" },
            error: null,
          }),
        }),
      ),
      AUTHORIZATION_ID,
    );

    expect(result).toEqual({ kind: "error", error: "unknown-request" });
  });

  it("answers a thrown transport failure as an outage", async () => {
    const result = await resolveAuthorizationRequest(
      authClient(
        api({
          getAuthorizationDetails: vi
            .fn()
            .mockRejectedValue(new TypeError("fetch failed")),
        }),
      ),
      AUTHORIZATION_ID,
    );

    expect(result).toEqual({ kind: "error", error: "backend-unavailable" });
  });

  it("answers an auth client without the OAuth namespace as an outage", async () => {
    const result = await resolveAuthorizationRequest(
      { auth: {} } as never,
      AUTHORIZATION_ID,
    );

    expect(result).toEqual({ kind: "error", error: "backend-unavailable" });
  });
});

describe("submitConsentDecision", () => {
  function api() {
    return {
      getAuthorizationDetails: vi.fn(),
      approveAuthorization: vi.fn().mockResolvedValue({
        data: { redirect_url: "https://claude.ai/callback?code=abc" },
        error: null,
      }),
      denyAuthorization: vi.fn().mockResolvedValue({
        data: { redirect_url: "https://claude.ai/callback?error=access_denied" },
        error: null,
      }),
    };
  }

  it("approves without letting the SDK drive the browser", async () => {
    const oauth = api();

    const result = await submitConsentDecision(
      authClient(oauth),
      AUTHORIZATION_ID,
      "approve",
    );

    expect(oauth.approveAuthorization).toHaveBeenCalledWith(AUTHORIZATION_ID, {
      skipBrowserRedirect: true,
    });
    expect(oauth.denyAuthorization).not.toHaveBeenCalled();
    expect(result).toEqual({
      kind: "redirect",
      url: "https://claude.ai/callback?code=abc",
    });
  });

  it("denies through the deny endpoint and returns the error redirect", async () => {
    const oauth = api();

    const result = await submitConsentDecision(
      authClient(oauth),
      AUTHORIZATION_ID,
      "deny",
    );

    expect(oauth.denyAuthorization).toHaveBeenCalledWith(AUTHORIZATION_ID, {
      skipBrowserRedirect: true,
    });
    expect(oauth.approveAuthorization).not.toHaveBeenCalled();
    expect(result).toEqual({
      kind: "redirect",
      url: "https://claude.ai/callback?error=access_denied",
    });
  });

  it("reports a decision the server accepted without a usable redirect", async () => {
    const oauth = api();
    oauth.approveAuthorization.mockResolvedValue({ data: {}, error: null });

    expect(
      await submitConsentDecision(
        authClient(oauth),
        AUTHORIZATION_ID,
        "approve",
      ),
    ).toEqual({ kind: "error", error: "decision-failed" });
  });

  it("reports a rejected decision as an expired request", async () => {
    const oauth = api();
    oauth.approveAuthorization.mockResolvedValue({
      data: null,
      error: { status: 410 },
    });

    expect(
      await submitConsentDecision(
        authClient(oauth),
        AUTHORIZATION_ID,
        "approve",
      ),
    ).toEqual({ kind: "error", error: "unknown-request" });
  });

  it("reports a thrown decision as an outage", async () => {
    const oauth = api();
    oauth.denyAuthorization.mockRejectedValue(new TypeError("fetch failed"));

    expect(
      await submitConsentDecision(authClient(oauth), AUTHORIZATION_ID, "deny"),
    ).toEqual({ kind: "error", error: "backend-unavailable" });
  });
});
