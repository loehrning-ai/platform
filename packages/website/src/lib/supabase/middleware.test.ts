/**
 * middleware.test.ts (regression coverage)
 *
 * Unit-tests the middleware session refresher in `./middleware`. The real
 * `@supabase/ssr` `createServerClient` is stubbed with a spy returning a fake
 * client; the real `next/server` `NextRequest` / `NextResponse` are used (they
 * are Web-standard constructs and work in the vitest env, as the route tests in
 * this repo already rely on). Config is driven through real env vars.
 *
 * The load-bearing assertions are on THIS module's cookie adapter: `getAll`
 * delegates to the request cookies, and `setAll` mirrors each cookie onto BOTH
 * the mutable request and the outgoing response while copying the extra headers
 * onto the response. The unconfigured branch is asserted to still return a
 * usable response and to skip client construction entirely.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

type MiddlewareCookieAdapter = {
  readonly getAll: () => { readonly name: string; readonly value: string }[];
  readonly setAll: (
    cookies: {
      readonly name: string;
      readonly value: string;
      readonly options?: unknown;
    }[],
    headers: Record<string, string>,
  ) => void;
};

type ClaimsResult = {
  data: { claims: Record<string, unknown> } | null;
  error: unknown;
};

const { createServerClientMock, getUserMock, getClaimsMock, signOutMock } =
  vi.hoisted(() => {
    const getUserMock = vi.fn<
      () => Promise<{
        data: { user: { id: string } | null };
        error?: Error;
      }>
    >(async () => ({ data: { user: null } }));
    // Verified claims of an ordinary first-party session for user-7, the user
    // the happy-path test signs in.
    const getClaimsMock = vi.fn<() => Promise<ClaimsResult>>(async () => ({
      data: {
        claims: {
          sub: "user-7",
          aud: "authenticated",
          role: "authenticated",
        },
      },
      error: null,
    }));
    const signOutMock = vi.fn<
      (options: { scope: string }) => Promise<{ error: null }>
    >(async () => ({ error: null }));
    const createServerClientMock = vi.fn<
      (
        url: string,
        key: string,
        options: { readonly cookies: MiddlewareCookieAdapter },
      ) => {
        auth: {
          getUser: typeof getUserMock;
          getClaims: typeof getClaimsMock;
          signOut: typeof signOutMock;
        };
      }
    >(() => ({
      auth: {
        getUser: getUserMock,
        getClaims: getClaimsMock,
        signOut: signOutMock,
      },
    }));
    return { createServerClientMock, getUserMock, getClaimsMock, signOutMock };
  });

vi.mock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }));

import { refreshAuthSession } from "./middleware";

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

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/dashboard", {
    headers: cookie ? { cookie } : {},
  });
}

/** Pull the cookie adapter this module handed to createServerClient. */
function capturedCookieAdapter() {
  const call = createServerClientMock.mock.calls[0];
  if (!call) {
    throw new Error("expected createServerClient to be called");
  }
  return call[2].cookies;
}

describe("refreshAuthSession", () => {
  it("returns an unconfigured result with a usable response and no client build", async () => {
    const request = makeRequest();
    const result = await refreshAuthSession(request, new Headers());

    expect(result.configured).toBe(false);
    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
    expect(result.response).toBeInstanceOf(NextResponse);
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("builds the server client with the resolved url + key when configured", async () => {
    configure();
    const request = makeRequest();

    const result = await refreshAuthSession(request, new Headers());

    expect(result.configured).toBe(true);
    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(createServerClientMock.mock.calls[0][0]).toBe(
      "https://proj.supabase.co",
    );
    expect(createServerClientMock.mock.calls[0][1]).toBe(
      PUBLIC_KEY_FIXTURE,
    );
  });

  it("passes the user returned by supabase.auth.getUser() through", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-7" } } });

    const result = await refreshAuthSession(makeRequest(), new Headers());
    expect(result.user).toEqual({ id: "user-7" });
  });

  it("passes an auth backend error through instead of collapsing it to logout", async () => {
    configure();
    const authError = new Error("auth backend unavailable");
    getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: authError,
    });

    const result = await refreshAuthSession(makeRequest(), new Headers());
    expect(result.user).toBeNull();
    expect(result.error).toBe(authError);
  });

  it("treats a missing session as an ordinary anonymous request", async () => {
    configure();
    const missingSession = Object.assign(new Error("Auth session missing!"), {
      name: "AuthSessionMissingError",
    });
    getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: missingSession,
    });

    const result = await refreshAuthSession(makeRequest(), new Headers());
    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
  });

  it("normalizes a rejected auth request into the typed error result", async () => {
    configure();
    const backendError = new Error("network rejected");
    getUserMock.mockRejectedValueOnce(backendError);

    const result = await refreshAuthSession(makeRequest(), new Headers());
    expect(result.user).toBeNull();
    expect(result.error).toBe(backendError);
  });

  it("normalizes a synchronous provider-client construction failure", async () => {
    configure();
    const constructionError = new Error("client construction rejected");
    createServerClientMock.mockImplementationOnce(() => {
      throw constructionError;
    });

    const result = await refreshAuthSession(makeRequest(), new Headers());

    expect(result.configured).toBe(true);
    expect(result.user).toBeNull();
    expect(result.error).toBe(constructionError);
    expect(result.response).toBeInstanceOf(NextResponse);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("exposes a getAll adapter that reads the incoming request cookies", async () => {
    configure();
    const request = makeRequest("a=1; b=2");

    await refreshAuthSession(request, new Headers());
    const adapter = capturedCookieAdapter();

    expect(adapter.getAll()).toEqual([
      { name: "a", value: "1" },
      { name: "b", value: "2" },
    ]);
  });

  it("setAll mirrors cookies onto request + response and copies extra headers", async () => {
    configure();
    const request = makeRequest();
    const { response } = await refreshAuthSession(request, new Headers());
    const adapter = capturedCookieAdapter();

    adapter.setAll(
      [{ name: "sb-access", value: "tok", options: { path: "/" } }],
      { "x-mw-flag": "on" },
    );

    expect(request.cookies.get("sb-access")?.value).toBe("tok");
    expect(response.cookies.get("sb-access")?.value).toBe("tok");
    expect(response.headers.get("x-mw-flag")).toBe("on");
  });
});

// An OAuth 2.1 access token issued to a third-party client passes getUser()
// just like a first-party session. The proxy must not let it through the
// protected pages and account APIs as a signed-in learner.
describe("refreshAuthSession first-party session boundary", () => {
  function claimsFor(overrides: Record<string, unknown>): ClaimsResult {
    return {
      data: {
        claims: {
          sub: "user-7",
          aud: "authenticated",
          role: "authenticated",
          ...overrides,
        },
      },
      error: null,
    };
  }

  it("keeps a verified first-party session signed in", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-7" } } });

    const result = await refreshAuthSession(makeRequest(), new Headers());

    expect(result.user).toEqual({ id: "user-7" });
    expect(result.error).toBeNull();
    expect(getClaimsMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it.each([
    ["an OAuth client_id", { client_id: "9a1b7c3d-client" }],
    ["the MCP resource audience", { aud: "https://loehrning.ai/api/mcp" }],
    ["a widened audience", { aud: ["authenticated", "https://loehrning.ai/api/mcp"] }],
    ["another role", { role: "anon" }],
    ["another subject", { sub: "user-8" }],
  ])("treats a session with %s as signed out and clears its cookie", async (_label, overrides) => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-7" } } });
    getClaimsMock.mockResolvedValueOnce(claimsFor(overrides));
    signOutMock.mockImplementationOnce(async () => {
      // What auth-js does on a local sign-out: it removes the session cookie
      // through the adapter this module handed to createServerClient.
      capturedCookieAdapter().setAll(
        [{ name: "sb-proj-auth-token", value: "", options: { maxAge: 0 } }],
        {},
      );
      return { error: null };
    });

    const request = makeRequest("sb-proj-auth-token=oauth-client-token");
    const result = await refreshAuthSession(request, new Headers());

    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    expect(result.response.cookies.get("sb-proj-auth-token")?.value).toBe("");
  });

  it("fails closed as an outage when the claims cannot be verified", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-7" } } });
    const outage = Object.assign(new Error("jwks unreachable"), {
      name: "AuthRetryableFetchError",
      status: 503,
    });
    getClaimsMock.mockResolvedValueOnce({ data: null, error: outage });

    const result = await refreshAuthSession(makeRequest(), new Headers());

    expect(result.user).toBeNull();
    expect(result.error).toBe(outage);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("does not verify claims for an anonymous request or an auth outage", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    await refreshAuthSession(makeRequest(), new Headers());

    const authError = new Error("auth backend unavailable");
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: authError });
    const outage = await refreshAuthSession(makeRequest(), new Headers());

    expect(outage.error).toBe(authError);
    expect(getClaimsMock).not.toHaveBeenCalled();
  });
});
