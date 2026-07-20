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

const { createServerClientMock, getUserMock } = vi.hoisted(() => {
  const getUserMock = vi.fn(async () => ({ data: { user: null } }));
  const createServerClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock },
  }));
  return { createServerClientMock, getUserMock };
});

vi.mock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }));

import { refreshAuthSession } from "./middleware";

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
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-abc";
}

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/dashboard", {
    headers: cookie ? { cookie } : {},
  });
}

/** Pull the cookie adapter this module handed to createServerClient. */
function capturedCookieAdapter() {
  const call = createServerClientMock.mock.calls[0];
  return (
    call[2] as {
      cookies: {
        getAll: () => { name: string; value: string }[];
        setAll: (
          cookies: { name: string; value: string; options?: unknown }[],
          headers: Record<string, string>,
        ) => void;
      };
    }
  ).cookies;
}

describe("refreshAuthSession", () => {
  it("returns an unconfigured result with a usable response and no client build", async () => {
    const request = makeRequest();
    const result = await refreshAuthSession(request, new Headers());

    expect(result.configured).toBe(false);
    expect(result.user).toBeNull();
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
    expect(createServerClientMock.mock.calls[0][1]).toBe("publishable-abc");
  });

  it("passes the user returned by supabase.auth.getUser() through", async () => {
    configure();
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-7" } } });

    const result = await refreshAuthSession(makeRequest(), new Headers());
    expect(result.user).toEqual({ id: "user-7" });
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
