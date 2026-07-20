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

const { cookiesMock, store, createServerClientMock, getUserMock } = vi.hoisted(
  () => {
    const getUserMock = vi.fn(
      async (): Promise<{ data: { user: unknown }; error?: unknown }> => ({
        data: { user: null },
      }),
    );
    const store = {
      getAll: vi.fn((): { name: string; value: string }[] => []),
      set: vi.fn(),
    };
    const cookiesMock = vi.fn(async () => store);
    const createServerClientMock = vi.fn(() => ({
      auth: { getUser: getUserMock },
    }));
    return { cookiesMock, store, createServerClientMock, getUserMock };
  },
);

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }));

import { createAuthServerClient, getAuthenticatedUser } from "./auth-server";

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

/** Pull the cookie adapter options this module handed to createServerClient. */
function capturedCookieAdapter() {
  const call = createServerClientMock.mock.calls[0];
  return (call[2] as { cookies: {
    getAll: () => unknown;
    setAll: (
      cookies: { name: string; value: string; options?: unknown }[],
    ) => void;
  } }).cookies;
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
    expect(createServerClientMock.mock.calls[0][1]).toBe("publishable-abc");
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
