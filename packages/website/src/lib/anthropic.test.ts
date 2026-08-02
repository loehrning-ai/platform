/**
 * anthropic.test.ts (regression coverage)
 *
 * Unit-tests the lazy singleton in `@/lib/anthropic`. The real
 * `@anthropic-ai/sdk` is stubbed at the module boundary with a stable class, so
 * these tests exercise this module's OWN behaviour (the fail-closed provider
 * readiness guard, one-time construction, cached reuse, and try/catch fallback)
 * instead of the SDK.
 *
 * The stub is also what keeps the happy path deterministic: the real SDK
 * constructor throws in a browser-like environment (jsdom is the default vitest
 * env here) unless `dangerouslyAllowBrowser` is set, which `anthropic.ts` never
 * passes.
 *
 * `client` is module-level state, so every test resets the module registry and
 * re-imports to get a fresh singleton, and ANTHROPIC_API_KEY is saved/restored
 * so no test leaks into another.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A stable stub class + a spy on its constructor. `vi.hoisted` runs once (before
// any import) and survives `vi.resetModules`, so the class identity stays fixed
// across re-imports and `toBeInstanceOf` remains meaningful.
const { AnthropicMock, ctorSpy } = vi.hoisted(() => {
  const ctorSpy = vi.fn();
  class AnthropicMock {
    apiKey: string;
    constructor(opts: { apiKey: string }) {
      ctorSpy(opts);
      this.apiKey = opts.apiKey;
    }
  }
  return { AnthropicMock, ctorSpy };
});

vi.mock("@anthropic-ai/sdk", () => ({ default: AnthropicMock }));

beforeEach(() => {
  // Drop the cached module so the next import starts with `client = null`.
  vi.resetModules();
  ctorSpy.mockClear();
});

function configureCompleteRuntime(apiKey = "sk-ant-test-key"): void {
  vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
  vi.stubEnv("ANTHROPIC_API_KEY", apiKey);
  vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
  vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAnthropicClient", () => {
  it("fails closed when ANTHROPIC_API_KEY is unset", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", undefined);
    const { getAnthropicClient } = await import("./anthropic");
    expect(() => getAnthropicClient()).toThrow(
      "Anthropic runtime compliance gate is not ready",
    );
    expect(ctorSpy).not.toHaveBeenCalled();
  });

  it("treats an empty-string key as an incomplete compliance gate", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { getAnthropicClient } = await import("./anthropic");
    expect(() => getAnthropicClient()).toThrow(/compliance gate is not ready/);
    expect(ctorSpy).not.toHaveBeenCalled();
  });

  it("constructs an Anthropic client with the key from the environment", async () => {
    configureCompleteRuntime();
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const { getAnthropicClient } = await import("./anthropic");
    const client = getAnthropicClient();
    expect(client).toBeInstanceOf(Anthropic);
    expect(ctorSpy).toHaveBeenCalledWith({ apiKey: "sk-ant-test-key" });
  });

  it("caches the client and constructs it only once (singleton)", async () => {
    configureCompleteRuntime();
    const { getAnthropicClient } = await import("./anthropic");
    const first = getAnthropicClient();
    const second = getAnthropicClient();
    expect(second).toBe(first);
    expect(ctorSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps the warmed client even after the env var changes", async () => {
    configureCompleteRuntime("sk-ant-first");
    const { getAnthropicClient } = await import("./anthropic");
    const first = getAnthropicClient();
    // The singleton is now warm; mutating the env must not rebuild it.
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-second");
    const second = getAnthropicClient();
    expect(second).toBe(first);
    expect(ctorSpy).toHaveBeenCalledTimes(1);
    expect(ctorSpy).toHaveBeenCalledWith({ apiKey: "sk-ant-first" });
  });

  it("refuses a warmed client when the compliance gate later becomes incomplete", async () => {
    configureCompleteRuntime();
    const { getAnthropicClient } = await import("./anthropic");
    const first = getAnthropicClient();
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "");
    expect(() => getAnthropicClient()).toThrow(/compliance gate is not ready/);
    configureCompleteRuntime();
    expect(getAnthropicClient()).toBe(first);
    expect(ctorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("tryGetAnthropicClient", () => {
  it("returns null instead of throwing when the key is unset", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", undefined);
    const { tryGetAnthropicClient } = await import("./anthropic");
    expect(tryGetAnthropicClient()).toBeNull();
    expect(ctorSpy).not.toHaveBeenCalled();
  });

  it("returns the same singleton as getAnthropicClient when configured", async () => {
    configureCompleteRuntime();
    const { getAnthropicClient, tryGetAnthropicClient } =
      await import("./anthropic");
    const viaTry = tryGetAnthropicClient();
    expect(viaTry).not.toBeNull();
    expect(viaTry).toBe(getAnthropicClient());
    expect(ctorSpy).toHaveBeenCalledTimes(1);
  });
});
