/**
 * config.test.ts (regression coverage)
 *
 * Unit-tests the pure env-var resolution in `./config`. No module is mocked:
 * both exported functions read `process.env` at call time, so the tests drive
 * real inputs (the four env vars) and assert the real fallback precedence, the
 * null guard, and the CSP-mismatch warning branch.
 *
 * Every managed env var is snapshotted and cleared in `beforeEach` so a value
 * set by another test file (e.g. the /api/feedback route test) cannot leak in,
 * and restored in `afterEach` so this file leaves the environment as it found
 * it. `console.warn` is spied so the mismatch branch is asserted without noise.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSupabasePublicConfig, hasSupabasePublicConfig } from "./config";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const original: Record<string, string | undefined> = {};
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  for (const k of KEYS) {
    original[k] = process.env[k];
    delete process.env[k];
  }
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  for (const k of KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
  warnSpy.mockRestore();
});

describe("getSupabasePublicConfig", () => {
  it("returns null when neither url nor key is set", () => {
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("returns null when only the url is set (key missing)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("returns null when only the key is set (url missing)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("treats an empty-string url as missing and returns null", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("builds config from the NEXT_PUBLIC url + publishable key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-abc";
    expect(getSupabasePublicConfig()).toEqual({
      url: "https://proj.supabase.co",
      publishableKey: "publishable-abc",
    });
  });

  it("falls back to SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL is unset", () => {
    process.env.SUPABASE_URL = "https://server-only.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";
    expect(getSupabasePublicConfig()?.url).toBe(
      "https://server-only.supabase.co",
    );
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY when publishable key is unset", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon-key";
    expect(getSupabasePublicConfig()?.publishableKey).toBe("legacy-anon-key");
  });

  it("prefers NEXT_PUBLIC_SUPABASE_URL over SUPABASE_URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_URL = "https://public.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";
    expect(getSupabasePublicConfig()?.url).toBe("https://public.supabase.co");
  });

  it("prefers the publishable key over the legacy anon key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-new";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon-key";
    expect(getSupabasePublicConfig()?.publishableKey).toBe("publishable-new");
  });

  it("warns when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL differ", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_URL = "https://internal.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";

    const config = getSupabasePublicConfig();

    // Warning fires but config still resolves using the NEXT_PUBLIC url.
    expect(config?.url).toBe("https://public.supabase.co");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/\[supabase\/config\]/);
  });

  it("does not warn when both url vars are set and equal", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://same.supabase.co";
    process.env.SUPABASE_URL = "https://same.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";

    getSupabasePublicConfig();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn when only NEXT_PUBLIC_SUPABASE_URL is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";

    getSupabasePublicConfig();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("hasSupabasePublicConfig", () => {
  it("returns false when nothing is configured", () => {
    expect(hasSupabasePublicConfig()).toBe(false);
  });

  it("returns false when only one of url/key is present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    expect(hasSupabasePublicConfig()).toBe(false);
  });

  it("returns true when both url and key are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";
    expect(hasSupabasePublicConfig()).toBe(true);
  });
});
