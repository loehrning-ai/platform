import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const mockGetAuthenticatedUser = vi.fn();
const mockGetClaims = vi.fn();
const mockCreateAuthServerClient = vi.fn();

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
  createAuthServerClient: () => mockCreateAuthServerClient(),
}));

import {
  ADMIN_RECENT_AUTH_MAX_AGE_SECONDS,
  configuredAdminUserId,
  requireAdminUser,
} from "./admin-identity";

const OWNER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const HOUR = 60 * 60;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function claimsFor(userId: string, ageSeconds: number, method = "oauth") {
  return {
    sub: userId,
    aud: "authenticated",
    role: "authenticated",
    is_anonymous: false,
    session_id: SESSION_ID,
    amr: [{ method, timestamp: nowSeconds() - ageSeconds }],
  };
}

function signedIn(userId: string, ageSeconds = HOUR): void {
  mockGetAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: { id: userId },
  });
  mockGetClaims.mockResolvedValue({
    data: { claims: claimsFor(userId, ageSeconds) },
    error: null,
  });
}

describe("owner identity gate", () => {
  beforeEach(() => {
    vi.stubEnv("LOEHRNING_ADMIN_USER_ID", OWNER_ID);
    mockCreateAuthServerClient.mockResolvedValue({
      auth: { getClaims: () => mockGetClaims() },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    mockGetAuthenticatedUser.mockReset();
    mockGetClaims.mockReset();
    mockCreateAuthServerClient.mockReset();
  });

  it("allows one signed-in day before a fresh sign-in is required", () => {
    expect(ADMIN_RECENT_AUTH_MAX_AGE_SECONDS).toBe(24 * HOUR);
  });

  it("admits the configured owner with a sign-in inside the last day", async () => {
    signedIn(OWNER_ID, 23 * HOUR);
    await expect(requireAdminUser()).resolves.toBe("admin");
  });

  it("asks the owner to sign in again when the last sign-in is older than a day", async () => {
    signedIn(OWNER_ID, 25 * HOUR);
    await expect(requireAdminUser()).resolves.toBe("reauth");
  });

  it("asks for a fresh sign-in when the session only carries a token refresh", async () => {
    signedIn(OWNER_ID);
    mockGetClaims.mockResolvedValue({
      data: { claims: claimsFor(OWNER_ID, 60, "token_refresh") },
      error: null,
    });
    await expect(requireAdminUser()).resolves.toBe("reauth");
  });

  it("denies a different signed-in account without reading its claims", async () => {
    signedIn(OTHER_ID);
    await expect(requireAdminUser()).resolves.toBe("denied");
    expect(mockGetClaims).not.toHaveBeenCalled();
  });

  it("denies an account id of a different length", async () => {
    signedIn(`${OWNER_ID}-extra`);
    await expect(requireAdminUser()).resolves.toBe("denied");
  });

  it("reports a signed-out visitor as signed-out", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ configured: true, user: null });
    await expect(requireAdminUser()).resolves.toBe("signed-out");
  });

  it("resolves the user first even when no owner id is configured", async () => {
    vi.stubEnv("LOEHRNING_ADMIN_USER_ID", "");
    signedIn(OWNER_ID);
    await expect(requireAdminUser()).resolves.toBe("disabled");
    expect(mockGetAuthenticatedUser).toHaveBeenCalledTimes(1);
    expect(mockGetClaims).not.toHaveBeenCalled();
  });

  it("reports a signed-out visitor before the missing configuration", async () => {
    vi.stubEnv("LOEHRNING_ADMIN_USER_ID", "");
    mockGetAuthenticatedUser.mockResolvedValue({ configured: true, user: null });
    await expect(requireAdminUser()).resolves.toBe("signed-out");
    expect(mockGetAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["empty", ""],
    ["whitespace", "   "],
    ["a flag", "true"],
    ["a wildcard", "*"],
    ["a contact address", "owner@example.com"],
    ["an uppercase UUID", OWNER_ID.toUpperCase()],
    ["a UUID with a suffix", `${OWNER_ID}0`],
  ])("keeps the surface disabled for %s", async (_label, value) => {
    vi.stubEnv("LOEHRNING_ADMIN_USER_ID", value);
    signedIn(OWNER_ID);
    expect(configuredAdminUserId()).toBeNull();
    await expect(requireAdminUser()).resolves.toBe("disabled");
  });

  it("accepts a canonical id with surrounding whitespace after trimming", () => {
    vi.stubEnv("LOEHRNING_ADMIN_USER_ID", ` ${OWNER_ID} `);
    expect(configuredAdminUserId()).toBe(OWNER_ID);
  });

  it.each([
    ["an auth backend throw", () => mockGetAuthenticatedUser.mockRejectedValue(new Error("down"))],
    [
      "a returned auth error",
      () =>
        mockGetAuthenticatedUser.mockResolvedValue({
          configured: true,
          user: { id: OWNER_ID },
          error: new Error("upstream"),
        }),
    ],
    [
      "an unconfigured auth backend",
      () => mockGetAuthenticatedUser.mockResolvedValue({ configured: false, user: null }),
    ],
  ])("is unavailable, never denied or admin, on %s", async (_label, arrange) => {
    arrange();
    await expect(requireAdminUser()).resolves.toBe("unavailable");
    vi.stubEnv("LOEHRNING_ADMIN_USER_ID", "");
    await expect(requireAdminUser()).resolves.toBe("unavailable");
  });

  it("is unavailable when reading the session claims throws", async () => {
    signedIn(OWNER_ID);
    mockGetClaims.mockRejectedValue(new Error("jwks unavailable"));
    await expect(requireAdminUser()).resolves.toBe("unavailable");
  });

  it("is unavailable when the claims read returns an error or nothing", async () => {
    signedIn(OWNER_ID);
    mockGetClaims.mockResolvedValue({ data: null, error: new Error("invalid") });
    await expect(requireAdminUser()).resolves.toBe("unavailable");
    mockGetClaims.mockResolvedValue({ data: null, error: null });
    await expect(requireAdminUser()).resolves.toBe("unavailable");
  });

  it("is unavailable when no cookie-bound client can be created", async () => {
    signedIn(OWNER_ID);
    mockCreateAuthServerClient.mockResolvedValue(null);
    await expect(requireAdminUser()).resolves.toBe("unavailable");
    mockCreateAuthServerClient.mockRejectedValue(new Error("cookies"));
    await expect(requireAdminUser()).resolves.toBe("unavailable");
  });

  it("never admits claims issued for another subject", async () => {
    signedIn(OWNER_ID);
    mockGetClaims.mockResolvedValue({
      data: { claims: claimsFor(OTHER_ID, 60) },
      error: null,
    });
    await expect(requireAdminUser()).resolves.toBe("reauth");
  });

  it("never reads editable profile or identity data for authorization", () => {
    const source = readFileSync(path.resolve(__dirname, "admin-identity.ts"), "utf8");
    expect(source).not.toMatch(/user_metadata|app_metadata|identity_data|email/i);
  });
});
