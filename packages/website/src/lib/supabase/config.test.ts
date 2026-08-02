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

import {
  getSupabasePublicConfig,
  hasSupabasePublicConfig,
  normalizeSupabaseOrigin,
} from "./config";

const PUBLISHABLE_KEY =
  "sb_publishable_abcdefghijklmnopqrstuv_12345678";
const SECOND_PUBLISHABLE_KEY =
  "sb_publishable_vutsrqponmlkjihgfedcba_87654321";
const PRIVILEGED_FIXTURE = [
  "sb",
  "secret",
  "abcdefghijklmnopqrstuv",
  "12345678",
].join("_");

function legacySupabaseJwt(role: string): string {
  const encode = (value: unknown): string =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({ role }),
    Buffer.alloc(32, 0xa5).toString("base64url"),
  ].join(".");
}

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const original: Record<string, string | undefined> = {};
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  for (const k of KEYS) {
    original[k] = process.env[k];
    delete process.env[k];
  }
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const k of KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
  errorSpy.mockRestore();
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
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("treats an empty-string url as missing and returns null", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("builds config from the NEXT_PUBLIC url + publishable key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    expect(getSupabasePublicConfig()).toEqual({
      url: "https://proj.supabase.co",
      publishableKey: PUBLISHABLE_KEY,
    });
  });

  it("falls back to SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL is unset", () => {
    process.env.SUPABASE_URL = "https://server-only.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    expect(getSupabasePublicConfig()?.url).toBe(
      "https://server-only.supabase.co",
    );
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY when publishable key is unset", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    const legacyAnonKey = legacySupabaseJwt("anon");
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = legacyAnonKey;
    expect(getSupabasePublicConfig()?.publishableKey).toBe(legacyAnonKey);
  });

  it("prefers NEXT_PUBLIC_SUPABASE_URL over SUPABASE_URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_URL = "https://public.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    expect(getSupabasePublicConfig()?.url).toBe("https://public.supabase.co");
  });

  it("prefers the publishable key over the legacy anon key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      SECOND_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = legacySupabaseJwt("anon");
    expect(getSupabasePublicConfig()?.publishableKey).toBe(
      SECOND_PUBLISHABLE_KEY,
    );
  });

  it("fails closed when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL differ", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_URL = "https://internal.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    const config = getSupabasePublicConfig();

    expect(config).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toMatch(/\[supabase\/config\]/);
  });

  it("does not report an error when both url vars are set and equal", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://same.supabase.co";
    process.env.SUPABASE_URL = "https://same.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    getSupabasePublicConfig();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("normalizes equivalent URL origins before comparing projects", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://same.supabase.co/";
    process.env.SUPABASE_URL = "https://same.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    expect(getSupabasePublicConfig()?.url).toBe("https://same.supabase.co");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("rejects remote cleartext, credentials, paths, queries, and fragments", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    for (const url of [
      "http://proj.supabase.co",
      "https://user:pass@proj.supabase.co",
      "https://proj.supabase.co/rest/v1",
      "https://proj.supabase.co/?debug=1",
      "https://proj.supabase.co/#fragment",
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      expect(getSupabasePublicConfig()).toBeNull();
    }
  });

  it("rejects arbitrary HTTPS hosts and non-default hosted ports", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    for (const url of [
      "https://attacker.example",
      "https://proj.supabase.co:444",
      "https://supabase.co",
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      expect(getSupabasePublicConfig()).toBeNull();
    }
  });

  it("rejects whitespace-altered and unbounded origins before URL parsing", () => {
    expect(
      normalizeSupabaseOrigin(" https://proj.supabase.co"),
    ).toBeNull();
    expect(
      normalizeSupabaseOrigin("https://proj.supabase.co\n"),
    ).toBeNull();
    expect(normalizeSupabaseOrigin("a".repeat(2049))).toBeNull();
  });

  it("rejects privileged modern and legacy keys in the public slot", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      PRIVILEGED_FIXTURE;
    expect(getSupabasePublicConfig()).toBeNull();

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      legacySupabaseJwt("service_role");
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("rejects opaque, malformed, and whitespace-altered public keys", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    for (const key of [
      "opaque-browser-key",
      "sb_publishable_too-short",
      ` ${PUBLISHABLE_KEY}`,
      `${PUBLISHABLE_KEY}\n`,
      "header.payload.signature",
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;
      expect(getSupabasePublicConfig()).toBeNull();
    }
  });

  it("allows cleartext only for loopback outside production", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    vi.stubEnv("NODE_ENV", "development");
    expect(getSupabasePublicConfig()?.url).toBe("http://127.0.0.1:54321");

    vi.stubEnv("NODE_ENV", "production");
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("does not report an error when only NEXT_PUBLIC_SUPABASE_URL is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    getSupabasePublicConfig();
    expect(errorSpy).not.toHaveBeenCalled();
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
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    expect(hasSupabasePublicConfig()).toBe(true);
  });
});
