import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The bearer resolver is the door to every authenticated agent tool, so the
 * tests below are mostly about refusals: no credential, a broken credential,
 * a credential of an unknown kind, one that expired, one issued for another
 * audience or by another issuer, one that was tampered with, and one the
 * owner revoked. Each has to end with no principal and a named reason.
 *
 * Two invariants are asserted everywhere: a rejection never carries the
 * presented credential, and a rejected request always receives a challenge
 * that names the metadata document a client needs in order to fix it.
 *
 * vi.mock is hoisted, so the factories below delegate to handles configured
 * per test.
 */

type PersonalTokenLookup =
  | { readonly ok: true; readonly userId: string; readonly client: string }
  | {
      readonly ok: false;
      readonly reason: "unknown" | "revoked" | "unavailable";
    };

const mockIsAgentAccessReady = vi.fn<() => boolean>(() => true);
const mockIsOAuthServerReady = vi.fn<() => boolean>(() => true);
const mockVerifyOAuthAccessToken = vi.fn<
  (token: string, options: unknown) => Promise<unknown>
>();
const mockLookupPersonalAccessToken = vi.fn<
  (token: string, now: Date) => Promise<PersonalTokenLookup>
>(async () => ({ ok: false, reason: "unknown" }));

// api-error.ts imports @sentry/nextjs at module scope, and loading that in
// the test runtime is not possible; every test that reaches it replaces it.
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));
vi.mock("@/lib/provider-readiness", () => ({
  isAgentAccessReady: () => mockIsAgentAccessReady(),
  isOAuthServerReady: () => mockIsOAuthServerReady(),
}));
vi.mock("@/lib/agent-access/personal-tokens", async (importOriginal) => {
  // The format helpers stay real, so dispatch is exercised against the exact
  // shape the mint route produces. Only the store lookup is replaced.
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    lookupPersonalAccessToken: (token: string, now: Date) =>
      mockLookupPersonalAccessToken(token, now),
  };
});
vi.mock("./oauth-jwt", () => ({
  verifyOAuthAccessToken: (token: string, options: unknown) =>
    mockVerifyOAuthAccessToken(token, options),
}));

import {
  agentUnauthorizedResponse,
  readBearerCredential,
  resolveAgentPrincipal,
  wwwAuthenticateHeader,
  type BearerRejection,
} from "./auth";

const OWNER = "3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const PERSONAL_TOKEN = "lat_obviously-fake-personal-access-token-abcdef";
const JWT_SHAPED_CREDENTIAL = "header.payload.signature";
const NOW = new Date("2026-09-05T12:00:00.000Z");
const METADATA_URL =
  "https://loehrning.ai/.well-known/oauth-protected-resource/api/mcp";

function requestWith(authorization?: string): Request {
  return new Request("https://loehrning.ai/api/mcp", {
    method: "POST",
    headers: authorization === undefined ? {} : { authorization },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  mockIsAgentAccessReady.mockReturnValue(true);
  mockIsOAuthServerReady.mockReturnValue(true);
  mockLookupPersonalAccessToken.mockImplementation(async () => ({
    ok: false,
    reason: "unknown",
  }));
});

describe("readBearerCredential", () => {
  it("reads one well formed Bearer credential", () => {
    expect(readBearerCredential(requestWith(`Bearer ${PERSONAL_TOKEN}`))).toBe(
      PERSONAL_TOKEN,
    );
    expect(readBearerCredential(requestWith(`bearer ${JWT_SHAPED_CREDENTIAL}`))).toBe(
      JWT_SHAPED_CREDENTIAL,
    );
  });

  it.each([
    ["no header", undefined],
    ["another scheme", `Token ${PERSONAL_TOKEN}`],
    ["a scheme without a value", "Bearer"],
    ["two values", `Bearer ${PERSONAL_TOKEN} extra`],
    ["a comma joined repeat", `Bearer ${PERSONAL_TOKEN}, Bearer other`],
    ["an oversized header", `Bearer ${"a".repeat(9000)}`],
  ])("returns nothing for %s", (_label, header) => {
    expect(readBearerCredential(requestWith(header))).toBeNull();
  });
});

describe("resolveAgentPrincipal", () => {
  it("refuses a request without credentials", async () => {
    expect(await resolveAgentPrincipal(requestWith(), NOW)).toEqual({
      ok: false,
      rejection: "missing_credentials",
    });
  });

  it("refuses a malformed Authorization header", async () => {
    expect(
      await resolveAgentPrincipal(requestWith("Basic abcdef"), NOW),
    ).toEqual({ ok: false, rejection: "malformed_credentials" });
  });

  it("refuses a credential of an unknown kind", async () => {
    expect(
      await resolveAgentPrincipal(requestWith("Bearer sk-not-ours"), NOW),
    ).toEqual({ ok: false, rejection: "unknown_token_format" });
    expect(mockLookupPersonalAccessToken).not.toHaveBeenCalled();
    expect(mockVerifyOAuthAccessToken).not.toHaveBeenCalled();
  });

  it("refuses a personal token prefix with the wrong shape without a lookup", async () => {
    expect(
      await resolveAgentPrincipal(requestWith("Bearer lat_tooshort"), NOW),
    ).toEqual({ ok: false, rejection: "invalid_token" });
    expect(mockLookupPersonalAccessToken).not.toHaveBeenCalled();
  });

  it("refuses every request when the agent surface is off", async () => {
    mockIsAgentAccessReady.mockReturnValue(false);

    expect(
      await resolveAgentPrincipal(
        requestWith(`Bearer ${PERSONAL_TOKEN}`),
        NOW,
      ),
    ).toEqual({ ok: false, rejection: "not_configured" });
    expect(mockLookupPersonalAccessToken).not.toHaveBeenCalled();
  });

  it("resolves a recognised personal access token", async () => {
    mockLookupPersonalAccessToken.mockImplementation(async () => ({
      ok: true,
      userId: OWNER,
      client: "pat:Laptop",
    }));

    const result = await resolveAgentPrincipal(
      requestWith(`Bearer ${PERSONAL_TOKEN}`),
      NOW,
    );

    expect(result).toEqual({
      ok: true,
      principal: {
        userId: OWNER,
        kind: "personal-access-token",
        client: "pat:Laptop",
        scopes: [],
      },
    });
    expect(mockLookupPersonalAccessToken).toHaveBeenCalledWith(
      PERSONAL_TOKEN,
      NOW,
    );
  });

  it.each([
    ["unknown", "invalid_token"],
    ["revoked", "revoked_token"],
    ["unavailable", "verifier_unavailable"],
  ] as const)(
    "maps the %s personal token lookup to %s",
    async (reason, rejection) => {
      mockLookupPersonalAccessToken.mockImplementation(async () => ({
        ok: false,
        reason,
      }));

      expect(
        await resolveAgentPrincipal(
          requestWith(`Bearer ${PERSONAL_TOKEN}`),
          NOW,
        ),
      ).toEqual({ ok: false, rejection });
    },
  );

  it("resolves a verified access token into an OAuth principal", async () => {
    mockVerifyOAuthAccessToken.mockResolvedValue({
      ok: true,
      token: {
        subject: OWNER,
        clientId: "claude-desktop",
        scopes: ["openid", "email"],
        expiresAt: 4102444800,
      },
    });

    const result = await resolveAgentPrincipal(
      requestWith(`Bearer ${JWT_SHAPED_CREDENTIAL}`),
      NOW,
    );

    expect(result).toEqual({
      ok: true,
      principal: {
        userId: OWNER,
        kind: "oauth",
        client: "oauth:claude-desktop",
        scopes: ["openid", "email"],
      },
    });
    expect(mockVerifyOAuthAccessToken).toHaveBeenCalledWith(JWT_SHAPED_CREDENTIAL, {
      issuer: "https://project.supabase.co/auth/v1",
      audience: "https://loehrning.ai/api/mcp",
      jwksUrl: "https://project.supabase.co/auth/v1/.well-known/jwks.json",
      now: NOW.getTime(),
    });
  });

  it("labels a token without a client id as an unknown OAuth client", async () => {
    mockVerifyOAuthAccessToken.mockResolvedValue({
      ok: true,
      token: {
        subject: OWNER,
        clientId: null,
        scopes: [],
        expiresAt: 4102444800,
      },
    });

    const result = await resolveAgentPrincipal(
      requestWith(`Bearer ${JWT_SHAPED_CREDENTIAL}`),
      NOW,
    );

    expect(result.ok && result.principal.client).toBe("oauth:unknown");
  });

  it.each([
    ["expired_token", "expired_token"],
    ["invalid_audience", "invalid_audience"],
    ["invalid_issuer", "invalid_issuer"],
    ["verifier_unavailable", "verifier_unavailable"],
    ["invalid_signature", "invalid_token"],
    ["unknown_key", "invalid_token"],
    ["unsupported_algorithm", "invalid_token"],
    ["malformed_token", "invalid_token"],
    ["invalid_subject", "invalid_token"],
    ["not_yet_valid", "invalid_token"],
  ])("maps the %s verification failure to %s", async (reason, rejection) => {
    mockVerifyOAuthAccessToken.mockResolvedValue({ ok: false, reason });

    expect(
      await resolveAgentPrincipal(requestWith(`Bearer ${JWT_SHAPED_CREDENTIAL}`), NOW),
    ).toEqual({ ok: false, rejection });
  });

  it("refuses an access token when no authorization server is confirmed", async () => {
    mockIsOAuthServerReady.mockReturnValue(false);

    expect(
      await resolveAgentPrincipal(requestWith(`Bearer ${JWT_SHAPED_CREDENTIAL}`), NOW),
    ).toEqual({ ok: false, rejection: "verifier_unavailable" });
    expect(mockVerifyOAuthAccessToken).not.toHaveBeenCalled();
  });

  it("refuses an access token when the project origin is unusable", async () => {
    vi.stubEnv("SUPABASE_URL", "https://not-a-project.example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    expect(
      await resolveAgentPrincipal(requestWith(`Bearer ${JWT_SHAPED_CREDENTIAL}`), NOW),
    ).toEqual({ ok: false, rejection: "verifier_unavailable" });
    expect(mockVerifyOAuthAccessToken).not.toHaveBeenCalled();
  });
});

describe("the challenge sent with a rejection", () => {
  it("names the metadata document so a client can start an authorization", () => {
    expect(wwwAuthenticateHeader("missing_credentials")).toBe(
      `Bearer realm="loehrning.ai", resource_metadata="${METADATA_URL}"`,
    );
  });

  it("omits an error code when no credential was presented", () => {
    expect(wwwAuthenticateHeader("missing_credentials")).not.toContain(
      "error=",
    );
  });

  it("still explains in the body that authentication has to start", async () => {
    const response = agentUnauthorizedResponse("missing_credentials");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "unauthorized",
      error_description: "This resource requires a Bearer credential.",
    });
  });

  it.each([
    ["malformed_credentials", "invalid_request"],
    ["unknown_token_format", "invalid_token"],
    ["invalid_token", "invalid_token"],
    ["expired_token", "invalid_token"],
    ["invalid_audience", "invalid_token"],
    ["invalid_issuer", "invalid_token"],
    ["revoked_token", "invalid_token"],
    ["verifier_unavailable", "invalid_token"],
  ] as const)("marks %s as %s", (rejection, code) => {
    const header = wwwAuthenticateHeader(rejection);

    expect(header).toContain(`error="${code}"`);
    expect(header).toContain(`resource_metadata="${METADATA_URL}"`);
    expect(header).toMatch(/^Bearer [\x20-\x7E]+$/);
  });

  it("omits the metadata link when this deployment serves no agent surface", () => {
    mockIsAgentAccessReady.mockReturnValue(false);

    expect(wwwAuthenticateHeader("not_configured")).toBe(
      'Bearer realm="loehrning.ai"',
    );
  });

  it("answers 401 with the challenge, an error body, and no caching", async () => {
    const response = agentUnauthorizedResponse("expired_token");

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain(
      `resource_metadata="${METADATA_URL}"`,
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      error: "invalid_token",
      error_description: "The access token has expired.",
    });
  });

  it("never echoes a credential in the challenge or the body", async () => {
    const rejections: readonly BearerRejection[] = [
      "missing_credentials",
      "malformed_credentials",
      "unknown_token_format",
      "invalid_token",
      "expired_token",
      "invalid_audience",
      "invalid_issuer",
      "revoked_token",
      "verifier_unavailable",
      "not_configured",
    ];

    for (const rejection of rejections) {
      const response = agentUnauthorizedResponse(rejection);
      const body = await response.text();
      const header = response.headers.get("www-authenticate") ?? "";

      expect(body).not.toContain(PERSONAL_TOKEN);
      expect(body).not.toContain(JWT_SHAPED_CREDENTIAL);
      expect(header).not.toContain(PERSONAL_TOKEN);
      expect(header).not.toContain(JWT_SHAPED_CREDENTIAL);
    }
  });
});
