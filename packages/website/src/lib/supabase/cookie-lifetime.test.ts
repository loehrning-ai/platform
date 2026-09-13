/**
 * cookie-lifetime.test.ts
 *
 * Drives the real @supabase/ssr write path through each of the three auth
 * cookie writers (server components, middleware, browser) and asserts the
 * lifetime that actually reaches the cookie. The library overwrites
 * `cookieOptions.maxAge` with its 400-day default on every session write, so
 * a writer that forwards the library's options unchanged fails here.
 *
 * Storing a PKCE code verifier is used as the write trigger: it flushes to
 * the cookie adapter immediately and needs no network call.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { store, createServerClientSpy, createBrowserClientSpy } = vi.hoisted(
  () => ({
    store: {
      getAll: vi.fn((): { name: string; value: string }[] => []),
      set: vi.fn(),
    },
    createServerClientSpy: vi.fn(),
    createBrowserClientSpy: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("@supabase/ssr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/ssr")>();
  createServerClientSpy.mockImplementation(actual.createServerClient);
  createBrowserClientSpy.mockImplementation(actual.createBrowserClient);
  return {
    ...actual,
    createServerClient: createServerClientSpy,
    createBrowserClient: createBrowserClientSpy,
  };
});

import { createAuthServerClient } from "./auth-server";
import { createBrowserSupabaseClient } from "./browser";
import { AUTH_COOKIE_MAX_AGE_SECONDS } from "./config";
import { refreshAuthSession } from "./middleware";

const PUBLIC_KEY_FIXTURE = "sb_publishable_abcdefghijklmnopqrstuv_12345678";
const VERIFIER_KEY = "sb-proj-auth-token-code-verifier";
const LIBRARY_DEFAULT_MAX_AGE = 400 * 24 * 60 * 60;

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
const original: Record<string, string | undefined> = {};

type StorageClient = {
  readonly auth: {
    readonly storage: { setItem: (key: string, value: string) => Promise<void> };
  };
};

function storageOf(client: unknown): StorageClient["auth"]["storage"] {
  return (client as StorageClient).auth.storage;
}

beforeEach(() => {
  store.set.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("no network in this test");
    }),
  );
  for (const key of KEYS) {
    original[key] = process.env[key];
    delete process.env[key];
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLIC_KEY_FIXTURE;
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("auth cookie lifetime reaching each writer", () => {
  it("bounds the server-component cookie store write", async () => {
    const client = await createAuthServerClient();
    expect(client).not.toBeNull();

    await storageOf(client).setItem(VERIFIER_KEY, "verifier");

    const writes = store.set.mock.calls.filter(([, value]) => value !== "");
    expect(writes.length).toBeGreaterThan(0);
    for (const [, , options] of writes) {
      expect(options.maxAge).toBe(AUTH_COOKIE_MAX_AGE_SECONDS);
    }
  });

  it("bounds the middleware response cookie", async () => {
    const { response } = await refreshAuthSession(
      new NextRequest("http://localhost/dashboard"),
      new Headers(),
    );
    const client = createServerClientSpy.mock.results.at(-1)?.value;

    await storageOf(client).setItem(VERIFIER_KEY, "verifier");

    const written = response.cookies.getAll();
    expect(written.length).toBeGreaterThan(0);
    for (const cookie of written) {
      expect(cookie.maxAge).toBe(AUTH_COOKIE_MAX_AGE_SECONDS);
    }
  });

  it("bounds the browser client's document.cookie write", async () => {
    const writes: string[] = [];
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "",
      set: (value: string) => {
        writes.push(value);
      },
    });
    try {
      const client = createBrowserSupabaseClient();
      expect(client).not.toBeNull();

      await storageOf(client).setItem(VERIFIER_KEY, "verifier");
    } finally {
      Reflect.deleteProperty(document, "cookie");
    }

    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) {
      expect(write).toContain(`Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}`);
      expect(write).not.toContain(`Max-Age=${LIBRARY_DEFAULT_MAX_AGE}`);
    }
  });
});
