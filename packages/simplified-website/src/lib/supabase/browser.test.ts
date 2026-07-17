/**
 * browser.test.ts (regression coverage)
 *
 * Unit-tests the memoized browser-client factory in `./browser`. The real
 * `@supabase/ssr` `createBrowserClient` is stubbed at the module boundary with a
 * spy returning a sentinel, so these tests exercise THIS module's own behaviour:
 * the config guard (null when unconfigured), one-time construction, and the
 * cached-singleton reuse.
 *
 * `browserClient` is module-level state, so every test resets the module
 * registry (`vi.resetModules`) and re-imports to start from `browserClient =
 * null`. The four Supabase env vars are snapshotted/cleared per test so config
 * resolution is deterministic and nothing leaks across files.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const original: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  createBrowserClientMock.mockReset();
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

describe("createBrowserSupabaseClient", () => {
  it("returns null and never constructs a client when config is missing", async () => {
    const { createBrowserSupabaseClient } = await import("./browser");
    expect(createBrowserSupabaseClient()).toBeNull();
    expect(createBrowserClientMock).not.toHaveBeenCalled();
  });

  it("constructs a client with the resolved url + publishable key", async () => {
    configure();
    const sentinel = { id: "browser-client" };
    createBrowserClientMock.mockReturnValue(sentinel);

    const { createBrowserSupabaseClient } = await import("./browser");
    const client = createBrowserSupabaseClient();

    expect(client).toBe(sentinel);
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "publishable-abc",
      // Auth cookie hardening: Secure (prod-gated) + SameSite=Lax are passed
      // through so the browser client sets the same flags as the server clients.
      expect.objectContaining({
        cookieOptions: expect.objectContaining({ sameSite: "lax" }),
      }),
    );
  });

  it("caches the client and constructs it only once (singleton)", async () => {
    configure();
    createBrowserClientMock.mockReturnValue({ id: "browser-client" });

    const { createBrowserSupabaseClient } = await import("./browser");
    const first = createBrowserSupabaseClient();
    const second = createBrowserSupabaseClient();

    expect(second).toBe(first);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the warmed client even after the env vars change", async () => {
    configure();
    createBrowserClientMock.mockReturnValue({ id: "browser-client" });

    const { createBrowserSupabaseClient } = await import("./browser");
    const first = createBrowserSupabaseClient();

    // The singleton is warm; mutating the env must not rebuild it.
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://other.supabase.co";
    const second = createBrowserSupabaseClient();

    expect(second).toBe(first);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
  });
});
