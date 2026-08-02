/**
 * admin.test.ts (regression coverage)
 *
 * Unit-tests the service-role admin factory in `./admin`. The real
 * `@supabase/supabase-js` `createClient` is stubbed with a spy so the tests
 * exercise THIS module's behaviour: the env-var guard (both vars required), the
 * exact url/key/auth options forwarded, and the fact that (unlike server.ts) it
 * builds a FRESH client on every call (no memoization).
 *
 * `admin.ts` imports "server-only", which vitest.config aliases to a no-op stub,
 * so the module loads in the jsdom test env. The two managed env vars are
 * snapshotted/cleared per test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

import { createAdminClient } from "./admin";

const PRIVILEGED_KEY_FIXTURE = [
  "sb",
  "secret",
  "abcdefghijklmnopqrstuv",
  "12345678",
].join("_");

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const original: Record<string, string | undefined> = {};

beforeEach(() => {
  createClientMock.mockReset();
  createClientMock.mockReturnValue({ id: "admin-client" });
  for (const k of KEYS) {
    original[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const k of KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});

describe("createAdminClient", () => {
  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", PRIVILEGED_KEY_FIXTURE);
    expect(() => createAdminClient()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    expect(() => createAdminClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("throws when both env vars are missing", () => {
    expect(() => createAdminClient()).toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
    );
  });

  it("builds the client with the url, service-role key, and no-refresh auth options", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", PRIVILEGED_KEY_FIXTURE);

    const client = createAdminClient();

    expect(client).toEqual({ id: "admin-client" });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      PRIVILEGED_KEY_FIXTURE,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  });

  it("builds a fresh client on every call (no memoization)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", PRIVILEGED_KEY_FIXTURE);

    createAdminClient();
    createAdminClient();

    expect(createClientMock).toHaveBeenCalledTimes(2);
  });

  it("prefers the server URL and rejects an arbitrary credential destination", () => {
    process.env.SUPABASE_URL = "https://server-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://server-project.supabase.co";
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", PRIVILEGED_KEY_FIXTURE);

    createAdminClient();
    expect(createClientMock).toHaveBeenCalledWith(
      "https://server-project.supabase.co",
      PRIVILEGED_KEY_FIXTURE,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    createClientMock.mockClear();
    delete process.env.SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://attacker.example";
    expect(() => createAdminClient()).toThrow(
      /Invalid NEXT_PUBLIC_SUPABASE_URL/,
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("rejects split public and server projects", () => {
    process.env.SUPABASE_URL = "https://server-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://public-project.supabase.co";
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", PRIVILEGED_KEY_FIXTURE);

    expect(() => createAdminClient()).toThrow(/same approved project origin/);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
