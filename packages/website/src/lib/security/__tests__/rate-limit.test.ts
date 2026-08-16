import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const { mockTryCreateServiceClient } = vi.hoisted(() => ({
  mockTryCreateServiceClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: mockTryCreateServiceClient,
}));

import {
  __resetInMemoryRateLimit,
  consumePairedUsageBudget,
  consumeMultiRateLimit,
  consumeRateLimit,
  consumeUsageBudget,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
  RateLimitUnavailableError,
  trustedClientIp,
} from "../rate-limit";

const VALID_LIMITER_SECRET = `rlh1_${"a".repeat(64)}`;
const ROTATED_RATE_LIMIT_HMAC_SECRET = `rlh1_${"b".repeat(64)}`;

beforeEach(() => {
  __resetInMemoryRateLimit();
  mockTryCreateServiceClient.mockReset();
  mockTryCreateServiceClient.mockReturnValue(null);
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", VALID_LIMITER_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("consumeRateLimit (in-memory fallback)", () => {
  it("returns true when under the cap", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect(
        await consumeRateLimit({ key: "t", windowSeconds: 60, max: 5 }),
      ).toBe(true);
    }
  });

  it("returns false once the cap is hit", async () => {
    for (let i = 0; i < 3; i += 1) {
      await consumeRateLimit({ key: "t", windowSeconds: 60, max: 3 });
    }
    expect(
      await consumeRateLimit({ key: "t", windowSeconds: 60, max: 3 }),
    ).toBe(false);
  });

  it("resets after the window expires", async () => {
    // Burn the cap.
    for (let i = 0; i < 3; i += 1) {
      await consumeRateLimit({ key: "t", windowSeconds: 1, max: 3 });
    }
    expect(await consumeRateLimit({ key: "t", windowSeconds: 1, max: 3 })).toBe(
      false,
    );
    // Move time forward.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 2_000);
    expect(await consumeRateLimit({ key: "t", windowSeconds: 1, max: 3 })).toBe(
      true,
    );
    vi.useRealTimers();
  });

  it("isolates counters per key", async () => {
    await consumeRateLimit({ key: "a", windowSeconds: 60, max: 1 });
    expect(
      await consumeRateLimit({ key: "a", windowSeconds: 60, max: 1 }),
    ).toBe(false);
    // Different key: still has budget.
    expect(
      await consumeRateLimit({ key: "b", windowSeconds: 60, max: 1 }),
    ).toBe(true);
  });
});

describe("consumeRateLimit (production durable backend)", () => {
  it.each([
    ["missing client", null],
    [
      "RPC error",
      {
        rpc: vi.fn(async () => ({
          data: null,
          error: { code: "PGRST500", message: "private row data" },
        })),
      },
    ],
    [
      "RPC throw",
      {
        rpc: vi.fn(async () => {
          throw new Error("service_role=private");
        }),
      },
    ],
    [
      "malformed RPC response",
      { rpc: vi.fn(async () => ({ data: "true", error: null })) },
    ],
  ])("throws an unavailable error for %s", async (_label, client) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockTryCreateServiceClient.mockReturnValue(client);

    await expect(
      consumeRateLimit({ key: "production", windowSeconds: 60, max: 2 }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    "preserves an authoritative RPC decision %s",
    async (decision, expected) => {
      vi.stubEnv("NODE_ENV", "production");
      mockTryCreateServiceClient.mockReturnValue({
        rpc: vi.fn(async () => ({ data: decision, error: null })),
      });

      await expect(
        consumeRateLimit({ key: "production", windowSeconds: 60, max: 2 }),
      ).resolves.toBe(expected);
    },
  );

  it("does not log an RPC error message containing private data", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockTryCreateServiceClient.mockReturnValue({
      rpc: vi.fn(async () => ({
        data: null,
        error: {
          code: "PGRST500",
          message: "learner@example.com service_role=private",
        },
      })),
    });

    await expect(
      consumeRateLimit({ key: "production", windowSeconds: 60, max: 2 }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
    expect(JSON.stringify(warning.mock.calls)).not.toContain(
      "learner@example.com",
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain("service_role");
  });
});

describe("consumeUsageBudget", () => {
  it("reserves multiple units atomically in the development fallback", async () => {
    await expect(
      consumeUsageBudget({
        key: "tokens",
        windowSeconds: 60,
        max: 10,
        cost: 6,
      }),
    ).resolves.toBe(true);
    await expect(
      consumeUsageBudget({
        key: "tokens",
        windowSeconds: 60,
        max: 10,
        cost: 4,
      }),
    ).resolves.toBe(true);
    await expect(
      consumeUsageBudget({
        key: "tokens",
        windowSeconds: 60,
        max: 10,
        cost: 1,
      }),
    ).resolves.toBe(false);
  });

  it("calls the dedicated production RPC with exact bounded units", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    mockTryCreateServiceClient.mockReturnValue({ rpc });

    await expect(
      consumeUsageBudget({
        key: "pseudonymous-budget",
        windowSeconds: 86_400,
        max: 500_000,
        cost: 1_234,
      }),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("usage_budget_consume", {
      _key: "pseudonymous-budget",
      _window_s: 86_400,
      _max: 500_000,
      _cost: 1_234,
    });
  });

  it("fails closed for invalid units and a missing production backend", async () => {
    await expect(
      consumeUsageBudget({
        key: "tokens",
        windowSeconds: 60,
        max: 10,
        cost: 0,
      }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);

    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mockTryCreateServiceClient.mockReturnValue(null);
    await expect(
      consumeUsageBudget({
        key: "tokens",
        windowSeconds: 60,
        max: 10,
        cost: 1,
      }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
  });

  it("does not log private RPC messages on failure", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    mockTryCreateServiceClient.mockReturnValue({
      rpc: vi.fn(async () => ({
        data: null,
        error: {
          code: "PGRST500",
          message: "learner@example.com raw prompt",
        },
      })),
    });

    await expect(
      consumeUsageBudget({
        key: "tokens",
        windowSeconds: 60,
        max: 10,
        cost: 1,
      }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
    expect(JSON.stringify(warning.mock.calls)).not.toContain(
      "learner@example.com",
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain("raw prompt");
  });
});

describe("consumePairedUsageBudget", () => {
  it("does not debit the caller when the global development budget refuses", async () => {
    await expect(
      consumePairedUsageBudget({
        callerKey: "caller-a",
        globalKey: "global-shared",
        windowSeconds: 60,
        callerMax: 10,
        globalMax: 10,
        cost: 8,
      }),
    ).resolves.toBe(true);

    await expect(
      consumePairedUsageBudget({
        callerKey: "caller-b",
        globalKey: "global-shared",
        windowSeconds: 60,
        callerMax: 3,
        globalMax: 10,
        cost: 3,
      }),
    ).resolves.toBe(false);

    await expect(
      consumePairedUsageBudget({
        callerKey: "caller-b",
        globalKey: "global-fresh",
        windowSeconds: 60,
        callerMax: 3,
        globalMax: 3,
        cost: 3,
      }),
    ).resolves.toBe(true);
  });

  it("does not debit the global budget when the caller development budget refuses", async () => {
    await expect(
      consumePairedUsageBudget({
        callerKey: "caller-full",
        globalKey: "global-seed",
        windowSeconds: 60,
        callerMax: 10,
        globalMax: 10,
        cost: 8,
      }),
    ).resolves.toBe(true);

    await expect(
      consumePairedUsageBudget({
        callerKey: "caller-full",
        globalKey: "global-unmutated",
        windowSeconds: 60,
        callerMax: 10,
        globalMax: 3,
        cost: 3,
      }),
    ).resolves.toBe(false);

    await expect(
      consumePairedUsageBudget({
        callerKey: "caller-fresh",
        globalKey: "global-unmutated",
        windowSeconds: 60,
        callerMax: 3,
        globalMax: 3,
        cost: 3,
      }),
    ).resolves.toBe(true);
  });

  it("calls the paired production RPC once with both bounded ledgers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    mockTryCreateServiceClient.mockReturnValue({ rpc });

    await expect(
      consumePairedUsageBudget({
        callerKey: "pseudonymous-caller",
        globalKey: "deployment-global",
        windowSeconds: 86_400,
        callerMax: 50_000,
        globalMax: 500_000,
        cost: 1_234,
      }),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("usage_budget_consume_pair", {
      _caller_key: "pseudonymous-caller",
      _global_key: "deployment-global",
      _window_s: 86_400,
      _caller_max: 50_000,
      _global_max: 500_000,
      _cost: 1_234,
    });
  });

  it("preserves an authoritative paired refusal without a fallback debit", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const rpc = vi.fn(async () => ({ data: false, error: null }));
    mockTryCreateServiceClient.mockReturnValue({ rpc });

    await expect(
      consumePairedUsageBudget({
        callerKey: "pseudonymous-caller",
        globalKey: "deployment-global",
        windowSeconds: 86_400,
        callerMax: 50_000,
        globalMax: 500_000,
        cost: 1_234,
      }),
    ).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["missing client", null],
    [
      "RPC error",
      {
        rpc: vi.fn(async () => ({
          data: null,
          error: { code: "PGRST500", message: "learner@example.com prompt" },
        })),
      },
    ],
    [
      "RPC throw",
      {
        rpc: vi.fn(async () => {
          throw new Error("service_role=private");
        }),
      },
    ],
    [
      "malformed RPC response",
      { rpc: vi.fn(async () => ({ data: "true", error: null })) },
    ],
  ])("fails closed in production for %s", async (_label, client) => {
    vi.stubEnv("NODE_ENV", "production");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockTryCreateServiceClient.mockReturnValue(client);

    await expect(
      consumePairedUsageBudget({
        callerKey: "pseudonymous-caller",
        globalKey: "deployment-global",
        windowSeconds: 86_400,
        callerMax: 50_000,
        globalMax: 500_000,
        cost: 1_234,
      }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
    expect(JSON.stringify(warning.mock.calls)).not.toContain(
      "learner@example.com",
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain("service_role");
  });

  it("rejects malformed or aliased ledger inputs before backend access", async () => {
    await expect(
      consumePairedUsageBudget({
        callerKey: "same",
        globalKey: "same",
        windowSeconds: 86_400,
        callerMax: 50_000,
        globalMax: 500_000,
        cost: 1,
      }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
    expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
  });
});

describe("consumeMultiRateLimit", () => {
  it("rejects every scope without partially debiting an earlier scope", async () => {
    expect(
      await consumeMultiRateLimit({
        windowSeconds: 60,
        entries: [
          { key: "multi-user", max: 2 },
          { key: "multi-ip", max: 1 },
        ],
      }),
    ).toBe(true);
    expect(
      await consumeMultiRateLimit({
        windowSeconds: 60,
        entries: [
          { key: "multi-user", max: 2 },
          { key: "multi-ip", max: 1 },
        ],
      }),
    ).toBe(false);
    expect(
      await consumeMultiRateLimit({
        windowSeconds: 60,
        entries: [
          { key: "multi-user", max: 2 },
          { key: "multi-other", max: 2 },
        ],
      }),
    ).toBe(true);
  });

  it("uses the durable multi-scope RPC in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    mockTryCreateServiceClient.mockReturnValue({ rpc } as never);

    await expect(
      consumeMultiRateLimit({
        windowSeconds: 3600,
        entries: [
          { key: "one", max: 20 },
          { key: "two", max: 100 },
        ],
      }),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("rate_limit_consume_multi", {
      _keys: ["one", "two"],
      _window_s: 3600,
      _maxes: [20, 100],
    });
  });
});

describe("trustedClientIp", () => {
  function req(headers: Record<string, string>): Request {
    return new Request("https://example.com/", { headers });
  }

  it("prefers x-vercel-forwarded-for over x-forwarded-for", () => {
    vi.stubEnv("VERCEL", "1");
    expect(
      trustedClientIp(
        req({
          "x-forwarded-for": "1.1.1.1", // spoofable
          "x-vercel-forwarded-for": "9.9.9.9", // trusted
        }),
      ),
    ).toBe("9.9.9.9");
  });

  it("fails to the coarse bucket when the Vercel header is absent", () => {
    vi.stubEnv("VERCEL", "1");
    expect(
      trustedClientIp(
        req({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" }),
      ),
    ).toBe("unknown");
  });

  it("does not trust proxy headers outside an attested Vercel runtime", () => {
    expect(
      trustedClientIp(
        req({
          "x-vercel-forwarded-for": "9.9.9.9",
          "x-real-ip": "8.8.8.8",
          "cf-connecting-ip": "7.7.7.7",
          "x-forwarded-for": "1.1.1.1",
        }),
      ),
    ).toBe("unknown");
  });

  it("returns 'unknown' when no trusted header is present", () => {
    vi.stubEnv("VERCEL", "1");
    expect(trustedClientIp(req({ "x-forwarded-for": "1.1.1.1" }))).toBe(
      "unknown",
    );
  });

  it("handles comma-separated x-vercel-forwarded-for (takes first)", () => {
    vi.stubEnv("VERCEL", "1");
    expect(
      trustedClientIp(req({ "x-vercel-forwarded-for": "9.9.9.9, 2.2.2.2" })),
    ).toBe("9.9.9.9");
  });

  it("rejects malformed or unbounded Vercel address values", () => {
    vi.stubEnv("VERCEL", "1");
    expect(
      trustedClientIp(req({ "x-vercel-forwarded-for": "not-an-ip" })),
    ).toBe("unknown");
    expect(
      trustedClientIp(req({ "x-vercel-forwarded-for": "1".repeat(65) })),
    ).toBe("unknown");
  });
});

describe("hashedClientRateLimitKey", () => {
  it("is a stable keyed HMAC and never contains the raw trusted address", async () => {
    vi.stubEnv("VERCEL", "1");
    const request = new Request("https://example.com/", {
      headers: { "x-vercel-forwarded-for": "203.0.113.42" },
    });
    const first = await hashedClientRateLimitKey("ai-native-grade", request);
    const second = await hashedClientRateLimitKey("ai-native-grade", request);

    expect(first).toBe(second);
    expect(first).toMatch(/^ai-native-grade:ip-hmac-sha256-v1:[0-9a-f]{64}$/);
    expect(first).not.toContain("203.0.113.42");

    const expected = createHmac("sha256", Buffer.from("a".repeat(64), "hex"))
      .update(
        JSON.stringify([
          "hmac-sha256-v1",
          "ip",
          "ai-native-grade",
          "203.0.113.42",
        ]),
      )
      .digest("hex");
    expect(first).toBe(`ai-native-grade:ip-hmac-sha256-v1:${expected}`);
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

  it("changes every derived key when the dedicated secret rotates", async () => {
    vi.stubEnv("VERCEL", "1");
    const request = new Request("https://example.com/", {
      headers: { "x-vercel-forwarded-for": "203.0.113.42" },
    });
    const beforeRotation = await hashedClientRateLimitKey("feedback", request);
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", ROTATED_RATE_LIMIT_HMAC_SECRET);
    const afterRotation = await hashedClientRateLimitKey("feedback", request);

    expect(afterRotation).not.toBe(beforeRotation);
  });

  it.each([
    ["missing", ""],
    ["short", "rlh1_deadbeef"],
    ["uppercase", `rlh1_${"A".repeat(64)}`],
    ["unversioned", "a".repeat(64)],
  ])("fails closed for a %s HMAC secret", async (_label, secret) => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", secret);
    const request = new Request("https://example.com/");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const error = await hashedClientRateLimitKey("feedback", request).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(RateLimitUnavailableError);
    expect(error).toMatchObject({
      code: "RATE_LIMIT_UNAVAILABLE",
      message: "Durable rate-limit protection unavailable",
    });
    if (secret) expect((error as Error).message).not.toContain(secret);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("hashedAuthenticatedRateLimitKey", () => {
  it("binds the digest to verified user identity without resetting by IP", async () => {
    const firstIp = new Request("https://example.com/", {
      headers: { "x-real-ip": "203.0.113.42" },
    });
    const secondIp = new Request("https://example.com/", {
      headers: { "x-real-ip": "198.51.100.7" },
    });
    const userA = await hashedAuthenticatedRateLimitKey(
      "book-pdf",
      firstIp,
      "user-a",
    );
    const userB = await hashedAuthenticatedRateLimitKey(
      "book-pdf",
      firstIp,
      "user-b",
    );
    const userAAfterIpChange = await hashedAuthenticatedRateLimitKey(
      "book-pdf",
      secondIp,
      "user-a",
    );
    expect(userA).toMatch(/^book-pdf:user-hmac-sha256-v1:[0-9a-f]{64}$/);
    expect(userA).not.toBe(userB);
    expect(userAAfterIpChange).toBe(userA);
    expect(userA).not.toContain("user-a");
    expect(userA).not.toContain("203.0.113.42");
  });

  it("rejects empty or unbounded identities", async () => {
    const request = new Request("https://example.com/");
    await expect(
      hashedAuthenticatedRateLimitKey("book-pdf", request, ""),
    ).rejects.toThrow("Invalid authenticated rate-limit identity");
    await expect(
      hashedAuthenticatedRateLimitKey("book-pdf", request, "x".repeat(129)),
    ).rejects.toThrow("Invalid authenticated rate-limit identity");
  });
});
