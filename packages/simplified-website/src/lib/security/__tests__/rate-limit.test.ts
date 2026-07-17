import { beforeEach, describe, expect, it, vi } from "vitest";

// The rate-limit module dynamically imports supabase/server. In tests we
// want the in-memory fallback path, so mock tryCreateServiceClient to
// always return null.
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => null,
}));

import {
  __resetInMemoryRateLimit,
  consumeRateLimit,
  hashedClientRateLimitKey,
  trustedClientIp,
} from "../rate-limit";

beforeEach(() => __resetInMemoryRateLimit());

describe("consumeRateLimit (in-memory fallback)", () => {
  it("returns true when under the cap", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect(await consumeRateLimit({ key: "t", windowSeconds: 60, max: 5 })).toBe(true);
    }
  });

  it("returns false once the cap is hit", async () => {
    for (let i = 0; i < 3; i += 1) {
      await consumeRateLimit({ key: "t", windowSeconds: 60, max: 3 });
    }
    expect(await consumeRateLimit({ key: "t", windowSeconds: 60, max: 3 })).toBe(false);
  });

  it("resets after the window expires", async () => {
    // Burn the cap.
    for (let i = 0; i < 3; i += 1) {
      await consumeRateLimit({ key: "t", windowSeconds: 1, max: 3 });
    }
    expect(await consumeRateLimit({ key: "t", windowSeconds: 1, max: 3 })).toBe(false);
    // Move time forward.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 2_000);
    expect(await consumeRateLimit({ key: "t", windowSeconds: 1, max: 3 })).toBe(true);
    vi.useRealTimers();
  });

  it("isolates counters per key", async () => {
    await consumeRateLimit({ key: "a", windowSeconds: 60, max: 1 });
    expect(await consumeRateLimit({ key: "a", windowSeconds: 60, max: 1 })).toBe(false);
    // Different key: still has budget.
    expect(await consumeRateLimit({ key: "b", windowSeconds: 60, max: 1 })).toBe(true);
  });
});

describe("trustedClientIp", () => {
  function req(headers: Record<string, string>): Request {
    return new Request("https://example.com/", { headers });
  }

  it("prefers x-vercel-forwarded-for over x-forwarded-for", () => {
    expect(
      trustedClientIp(req({
        "x-forwarded-for": "1.1.1.1",              // spoofable
        "x-vercel-forwarded-for": "9.9.9.9",       // trusted
      })),
    ).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip when x-vercel-* is absent", () => {
    expect(
      trustedClientIp(req({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" })),
    ).toBe("9.9.9.9");
  });

  it("falls back to cf-connecting-ip when both Vercel headers absent", () => {
    expect(
      trustedClientIp(req({ "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" })),
    ).toBe("9.9.9.9");
  });

  it("returns 'unknown' when no trusted header present (ignores user-settable x-forwarded-for)", () => {
    expect(trustedClientIp(req({ "x-forwarded-for": "1.1.1.1" }))).toBe("unknown");
  });

  it("handles comma-separated x-vercel-forwarded-for (takes first)", () => {
    expect(
      trustedClientIp(req({ "x-vercel-forwarded-for": "9.9.9.9, 2.2.2.2" })),
    ).toBe("9.9.9.9");
  });
});

describe("hashedClientRateLimitKey", () => {
  it("is stable and never contains the raw trusted address", async () => {
    const request = new Request("https://example.com/", {
      headers: { "x-vercel-forwarded-for": "203.0.113.42" },
    });
    const first = await hashedClientRateLimitKey("ai-native-grade", request);
    const second = await hashedClientRateLimitKey("ai-native-grade", request);

    expect(first).toBe(second);
    expect(first).toMatch(/^ai-native-grade:sha256:[0-9a-f]{64}$/);
    expect(first).not.toContain("203.0.113.42");
  });

  it("separates namespaces and rejects unsafe ones", async () => {
    const request = new Request("https://example.com/", {
      headers: { "x-real-ip": "203.0.113.42" },
    });
    expect(await hashedClientRateLimitKey("feedback", request)).not.toBe(
      await hashedClientRateLimitKey("ai-native-grade", request),
    );
    await expect(
      hashedClientRateLimitKey("../unsafe", request),
    ).rejects.toThrow("Invalid rate-limit namespace");
  });
});
