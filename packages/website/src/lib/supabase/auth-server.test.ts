/**
 * auth-server.test.ts (regression coverage)
 *
 * Unit-tests the RSC/server-action Supabase helpers in `./auth-server`. Two
 * module boundaries are stubbed:
 *   - `next/headers` `cookies()` -> a fake cookie store (getAll + set spies).
 *   - `@supabase/ssr` `createServerClient` -> a spy returning a fake client.
 * Config is driven through the real `./config` via env vars so the guard branch
 * is exercised for real.
 *
 * The valuable assertions here are on THIS module's cookie adapter: `getAll`
 * delegates to the Next cookie store, `setAll` writes each cookie, and `setAll`
 * swallows the write error that a Server Component raises (the documented
 * "middleware refreshes sessions" fallback). `getAuthenticatedUser` is asserted
 * across configured/unconfigured and session/no-session.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AuthCookieAdapter = {
  readonly getAll: () => unknown;
  readonly setAll: (
    cookies: {
      readonly name: string;
      readonly value: string;
      readonly options?: unknown;
    }[],
  ) => void;
};

type ClaimsResult = {
  data: { claims: Record<string, unknown> } | null;
  error: unknown;
};

const {
  cookiesMock,
  store,
  createServerClientMock,
  getUserMock,
  getClaimsMock,
  signOutMock,
} = vi.hoisted(() => {
  const getUserMock = vi.fn(
    async (): Promise<{ data: { user: unknown }; error?: unknown }> => ({
      data: { user: null },
    }),
  );
  // Verified claims of an ordinary first-party session for user-42, the user
  // the happy-path tests sign in.
  const getClaimsMock = vi.fn(
    async (): Promise<ClaimsResult> => ({
      data: {
        claims: {
          sub: "user-42",
          aud: "authenticated",
          role: "authenticated",
        },
      },
      error: null,
    }),
  );
  const signOutMock = vi.fn(async () => ({ error: null }));
  const store = {
    getAll: vi.fn((): { name: string; value: string }[] => []),
    set: vi.fn(),
  };
  const cookiesMock = vi.fn(async () => store);
  const createServerClientMock = vi.fn<
    (
      url: string,
      key: string,
      options: { readonly cookies: AuthCookieAdapter },
    ) => {
      auth: {
        getUser: typeof getUserMock;
        getClaims: typeof getClaimsMock;
        signOut: typeof signOutMock;
      };
    }
  >(() => ({
    auth: { getUser: getUserMock, getClaims: getClaimsMock, signOut: signOutMock },
  }));
  return {
    cookiesMock,
    store,
    createServerClientMock,
    getUserMock,
    getClaimsMock,
    signOutMock,
  };
});

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }));

import { createAuthServerClient, getAuthenticatedUser } from "./auth-server";

const PUBLIC_KEY_FIXTURE =
  "sb_publishable_abcdefghijklmnopqrstuv_12345678";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
const original: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of KEYS) {
    original[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});

function configure(): void {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    PUBLIC_KEY_FIXTURE;
}

/** Pull the cookie adapter options this module handed to createServerClient. */
function capturedCookieAdapter() {
  const call = createServerClientMock.mock.calls[0];
  if (!call) {
    throw new Error("expected createServerClient to be called");
  }
  return call[2].cookies;
}

describe("createAuthServerClient", () => {
  it("returns null and never reads cookies when Supabase is not configured", async () => {
    const client = await createAuthServerClient();
    expect(client).toBeNull();
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(cookiesMock).not.toHaveBeenCalled();
  });

  it("creates a server client with the resolved url + key when configured", async () => {
    configure();
    const client = await createAuthServerClient();

    expect(client).not.toBeNull();
    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(createServerClientMock.mock.calls[0][0]).toBe(
      "https://proj.supabase.co",
    );
    expect(createServerClientMock.mock.calls[0][1]).toBe(
      PUBLIC_KEY_FIXTURE,
    );
  });

  it("exposes a getAll cookie adapter that delegates to the Next cookie store", async () => {
    configure();
    // Once-scoped so this override cannot leak past clearAllMocks (which keeps
    // persistent mockReturnValue impls) into a later test's getAll.
    store.getAll.mockReturnValueOnce([{ name: "sb-access", value: "tok" }]);

    await createAuthServerClient();
    const adapter = capturedCookieAdapter();

    expect(adapter.getAll()).toEqual([{ name: "sb-access", value: "tok" }]);
    expect(store.getAll).toHaveBeenCalled();
  });

  it("exposes a setAll adapter that writes every cookie to the store", async () => {
    configure();
    await createAuthServerClient();
    const adapter = capturedCookieAdapter();

    adapter.setAll([
      { name: "a", value: "1", options: { path: "/" } },
      { name: "b", value: "2", options: { httpOnly: true } },
    ]);

    expect(store.set).toHaveBeenCalledTimes(2);
    expect(store.set).toHaveBeenNthCalledWith(1, "a", "1", { path: "/" });
    expect(store.set).toHaveBeenNthCalledWith(2, "b", "2", { httpOnly: true });
  });

  it("swallows the write error a Server Component raises inside setAll", async () => {
    configure();
    store.set.mockImplementationOnce(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });

    await createAuthServerClient();
    const adapter = capturedCookieAdapter();

    expect(() =>
      adapter.setAll([{ name: "a", value: "1", options: {} }]),
    ).not.toThrow();
  });
});

describe("getAuthenticatedUser", () => {
  it("reports unconfigured with a null user when Supabase is not set up", async () => {
    const result = await getAuthenticatedUser();
    expect(result).toEqual({ configured: false, user: null });
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("returns the authenticated user when a session exists", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });

    const result = await getAuthenticatedUser();
    expect(result.configured).toBe(true);
    expect(result.user).toEqual({ id: "user-42" });
  });

  it("returns configured with a null user when there is no session", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    const result = await getAuthenticatedUser();
    expect(result).toEqual({ configured: true, user: null });
  });

  it("surfaces the getUser error so callers can distinguish an outage from logged-out", async () => {
    configure();
    const outage = new Error("Supabase Auth unreachable");
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: outage });

    const result = await getAuthenticatedUser();
    expect(result.configured).toBe(true);
    expect(result.user).toBeNull();
    expect(result.error).toBe(outage);
  });

  it("surfaces a rejected getUser promise instead of throwing an unclassified 500", async () => {
    configure();
    const outage = new Error("network rejected");
    getUserMock.mockRejectedValueOnce(outage);

    const result = await getAuthenticatedUser();
    expect(result).toEqual({
      configured: true,
      user: null,
      error: outage,
    });
  });

  it("treats AuthSessionMissingError as logged-out, not an outage", async () => {
    // Supabase's documented, expected response for an anonymous request with
    // no session cookie — every earlier version of this helper mis-classified
    // it as a backend failure, which meant an anonymous visitor calling any
    // route that gates on `getAuthenticatedUser()` got 503 instead of being
    // correctly treated as logged-out.
    configure();
    const noSession = Object.assign(new Error("Auth session missing!"), {
      name: "AuthSessionMissingError",
    });
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: noSession });

    const result = await getAuthenticatedUser();
    expect(result).toEqual({ configured: true, user: null });
    expect("error" in result).toBe(false);
  });

  it("omits the error field on the happy path", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });

    const result = await getAuthenticatedUser();
    expect("error" in result).toBe(false);
  });
});

// An OAuth 2.1 access token issued to a third-party client passes getUser()
// just like a first-party session. Wrapped in an auth cookie, it must not act
// as the learner on the account routes.
describe("getAuthenticatedUser first-party session boundary", () => {
  function claimsFor(overrides: Record<string, unknown>): ClaimsResult {
    return {
      data: {
        claims: {
          sub: "user-42",
          aud: "authenticated",
          role: "authenticated",
          ...overrides,
        },
      },
      error: null,
    };
  }

  it("accepts a verified first-party session and keeps its cookie", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });

    const result = await getAuthenticatedUser();

    expect(result).toEqual({ configured: true, user: { id: "user-42" } });
    expect(getClaimsMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it.each([
    ["an OAuth client_id", { client_id: "9a1b7c3d-client" }],
    ["an empty client_id", { client_id: "" }],
    ["a null client_id", { client_id: null }],
    ["the MCP resource audience", { aud: "https://loehrning.ai/api/mcp" }],
    ["a widened audience", { aud: ["authenticated", "https://loehrning.ai/api/mcp"] }],
    ["no audience", { aud: undefined }],
    ["another role", { role: "service_role" }],
    ["another subject", { sub: "user-99" }],
  ])("treats a session with %s as signed out and clears it", async (_label, overrides) => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });
    getClaimsMock.mockResolvedValueOnce(claimsFor(overrides));

    const result = await getAuthenticatedUser();

    expect(result).toEqual({ configured: true, user: null });
    expect("error" in result).toBe(false);
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("accepts a single-element audience array", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });
    getClaimsMock.mockResolvedValueOnce(claimsFor({ aud: ["authenticated"] }));

    const result = await getAuthenticatedUser();

    expect(result.user).toEqual({ id: "user-42" });
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("stays signed out when clearing the rejected session fails", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });
    getClaimsMock.mockResolvedValueOnce(claimsFor({ client_id: "client-1" }));
    signOutMock.mockRejectedValueOnce(new Error("logout unreachable"));

    const result = await getAuthenticatedUser();

    expect(result).toEqual({ configured: true, user: null });
  });

  it("fails closed as an outage when the claims cannot be verified", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });
    const outage = Object.assign(new Error("jwks unreachable"), {
      name: "AuthRetryableFetchError",
      status: 0,
    });
    getClaimsMock.mockResolvedValueOnce({ data: null, error: outage });

    const result = await getAuthenticatedUser();

    expect(result).toEqual({ configured: true, user: null, error: outage });
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("fails closed as an outage when getClaims throws", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });
    const outage = new Error("claims threw");
    getClaimsMock.mockRejectedValueOnce(outage);

    const result = await getAuthenticatedUser();

    expect(result).toEqual({ configured: true, user: null, error: outage });
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("treats a refused token as signed out", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-42" } } });
    getClaimsMock.mockResolvedValueOnce({
      data: null,
      error: Object.assign(new Error("Invalid JWT signature"), {
        name: "AuthInvalidJwtError",
        status: 400,
      }),
    });

    const result = await getAuthenticatedUser();

    expect(result).toEqual({ configured: true, user: null });
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("never asks for claims when there is no user", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    await getAuthenticatedUser();

    expect(getClaimsMock).not.toHaveBeenCalled();
  });
});
