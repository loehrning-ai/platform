/**
 * server.test.ts (regression coverage)
 *
 * Unit-tests the memoized service-role client in `./server`. The real
 * `@supabase/supabase-js` `createClient` is stubbed with a spy so the tests
 * exercise THIS module's behaviour: the env-var guard, the exact url/key/options
 * forwarded, the cached singleton, and `tryCreateServiceClient`'s try/catch that
 * turns the "missing config" throw into a graceful `null`.
 *
 * `client` is module-level state, so each test resets the module registry and
 * re-imports to start from `client = null`. `server.ts` imports "server-only",
 * aliased to a no-op stub by vitest.config. Env vars are snapshotted/cleared per
 * test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

const KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const original: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  createClientMock.mockReset();
  createClientMock.mockReturnValue({ id: "service-client" });
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

function configure(): void {
  process.env.SUPABASE_URL = "https://proj.supabase.co";
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
}

describe("createServiceClient", () => {
  it("throws when SUPABASE_URL is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    const { createServiceClient } = await import("./server");
    expect(() => createServiceClient()).toThrow(/Missing SUPABASE_URL/);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.SUPABASE_URL = "https://proj.supabase.co";
    const { createServiceClient } = await import("./server");
    expect(() => createServiceClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("builds the client with the url, key, no-persist auth and public schema", async () => {
    configure();
    const { createServiceClient } = await import("./server");
    const client = createServiceClient();

    expect(client).toEqual({ id: "service-client" });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "service-role-key",
      { auth: { persistSession: false }, db: { schema: "public" } },
    );
  });

  it("caches the client and constructs it only once (singleton)", async () => {
    configure();
    const { createServiceClient } = await import("./server");
    const first = createServiceClient();
    const second = createServiceClient();

    expect(second).toBe(first);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});

describe("tryCreateServiceClient", () => {
  it("returns null instead of throwing when config is missing", async () => {
    const { tryCreateServiceClient } = await import("./server");
    expect(tryCreateServiceClient()).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns the client when configured", async () => {
    configure();
    const { tryCreateServiceClient } = await import("./server");
    expect(tryCreateServiceClient()).toEqual({ id: "service-client" });
  });

  it("returns the same singleton as createServiceClient", async () => {
    configure();
    const { createServiceClient, tryCreateServiceClient } =
      await import("./server");
    const direct = createServiceClient();
    const viaTry = tryCreateServiceClient();

    expect(viaTry).toBe(direct);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});
