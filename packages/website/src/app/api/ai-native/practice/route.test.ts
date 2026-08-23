import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Controllable mock Anthropic client. Each test sets `mockCreate`'s behavior.
const mockCreate = vi.fn();
const mockHashedClientRateLimitKey = vi.fn<
  (namespace: string, request: Request) => Promise<string>
>(async () => `ai-native-practice:ip-hmac-sha256-v1:${"b".repeat(64)}`);
const mockHashedAuthenticatedRateLimitKey = vi.fn<
  (namespace: string, request: Request, userId: string) => Promise<string>
>(async () => `ai-native-practice:user-hmac-sha256-v1:${"c".repeat(64)}`);
const mockReportApiError = vi.fn<(...args: unknown[]) => void>();
const mockTryGetAnthropicClient = vi.fn(() => ({
  messages: { create: mockCreate },
}));
const mockGetAuthenticatedUser = vi.fn<
  () => Promise<{
    configured: boolean;
    user: { id: string } | null;
    error?: unknown;
  }>
>(async () => ({
  configured: true,
  user: { id: "user-1" },
}));
const mockConsumeRateLimit = vi.fn<
  (args: {
    readonly key: string;
    readonly windowSeconds: number;
    readonly max: number;
  }) => Promise<boolean>
>(async () => true);
const mockConsumeUsageBudget = vi.fn<
  (args: {
    readonly callerKey: string;
    readonly globalKey: string;
    readonly windowSeconds: number;
    readonly callerMax: number;
    readonly globalMax: number;
    readonly cost: number;
  }) => Promise<boolean>
>(async () => true);

vi.mock("@/lib/anthropic", () => ({
  tryGetAnthropicClient: () => mockTryGetAnthropicClient(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (args: {
    readonly key: string;
    readonly windowSeconds: number;
    readonly max: number;
  }) => mockConsumeRateLimit(args),
  consumeMultiRateLimit: (args: unknown) => mockConsumeRateLimit(args as never),
  consumePairedUsageBudget: (args: {
    readonly callerKey: string;
    readonly globalKey: string;
    readonly windowSeconds: number;
    readonly callerMax: number;
    readonly globalMax: number;
    readonly cost: number;
  }) => mockConsumeUsageBudget(args),
  hashedClientRateLimitKey: (namespace: string, request: Request) =>
    mockHashedClientRateLimitKey(namespace, request),
  hashedAuthenticatedRateLimitKey: (
    namespace: string,
    request: Request,
    userId: string,
  ) => mockHashedAuthenticatedRateLimitKey(namespace, request, userId),
  isRateLimitUnavailableError: (error: unknown) =>
    (error as { code?: string })?.code === "RATE_LIMIT_UNAVAILABLE",
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

import { POST } from "./route";
import { __resetEngineState } from "./engine";

const mockedAuth = mockGetAuthenticatedUser;
const mockedRateLimit = mockConsumeRateLimit;

function makeReq(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost/api/ai-native/practice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.1.1.1",
      "x-vercel-forwarded-for": "10.0.0.1",
      ...(headers ?? {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeStreamingReq(body: string): Request {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, 16 * 1024));
      controller.enqueue(bytes.slice(16 * 1024));
      controller.close();
    },
  });
  return new Request("http://localhost/api/ai-native/practice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

const VALID_COMPLETE = { mode: "complete", prompt: "Schreibe eine Mail." };
const NON_JSON_MEDIA_TYPES = [
  ["missing", undefined],
  ["unsupported", "text/plain"],
  ["JSON lookalike", "application/jsonp"],
] as const;
const VALID_PLACE = {
  mode: "place-word",
  word: "Lieferung",
  existing: [{ w: "Kunde", x: 0.8, y: 0.2 }],
};

function textBlock(text: string) {
  return {
    content: [{ type: "text", text }],
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

function expectPrivateNoStore(res: Response) {
  expect(res.headers.get("cache-control")).toBe("private, no-store");
  expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
}

describe("POST /api/ai-native/practice", () => {
  beforeEach(() => {
    __resetEngineState();
    mockCreate.mockReset();
    mockTryGetAnthropicClient.mockClear();
    mockedAuth.mockClear();
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
    mockConsumeUsageBudget.mockReset();
    mockConsumeUsageBudget.mockResolvedValue(true);
    mockHashedClientRateLimitKey.mockReset();
    mockHashedClientRateLimitKey.mockResolvedValue(
      `ai-native-practice:ip-hmac-sha256-v1:${"b".repeat(64)}`,
    );
    mockHashedAuthenticatedRateLimitKey.mockReset();
    mockHashedAuthenticatedRateLimitKey.mockImplementation(
      async (namespace) => `${namespace}:user-hmac-sha256-v1:${"c".repeat(64)}`,
    );
    mockReportApiError.mockReset();
    mockedAuth.mockResolvedValue({
      configured: true,
      user: { id: "user-1" },
    });
    vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
    vi.stubEnv(
      "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
      "anthropic/claude-haiku-4.5",
    );
    vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
    vi.stubEnv("AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET", "100000");
    vi.stubEnv("AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET", "1000000");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each(NON_JSON_MEDIA_TYPES)(
    "returns 415 for a %s media type before auth, quotas, or Anthropic",
    async (_label, contentType) => {
      const request = new Request("http://localhost/api/ai-native/practice", {
        method: "POST",
        headers: contentType ? { "Content-Type": contentType } : undefined,
        body: contentType ? "{}" : new Uint8Array([123, 125]),
      });
      expect(request.headers.get("content-type")).toBe(contentType ?? null);
      const res = await POST(request);

      expect(res.status).toBe(415);
      expect(await res.json()).toEqual({
        code: "unsupported_media_type",
        error: "unsupported_media_type",
      });
      expectPrivateNoStore(res);
      expect(mockedAuth).not.toHaveBeenCalled();
      expect(mockHashedAuthenticatedRateLimitKey).not.toHaveBeenCalled();
      expect(mockHashedClientRateLimitKey).not.toHaveBeenCalled();
      expect(mockedRateLimit).not.toHaveBeenCalled();
      expect(mockTryGetAnthropicClient).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockReportApiError).not.toHaveBeenCalled();
    },
  );

  it("returns 503 when the feature flag is OFF by default", async () => {
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;
    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "practice_disabled",
      error: "Live mode is not enabled.",
    });
    expectPrivateNoStore(res);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 401 before feature checks when the learning account is missing", async () => {
    mockedAuth.mockResolvedValueOnce({ configured: true, user: null });
    const res = await POST(makeReq(VALID_COMPLETE));
    expect(res.status).toBe(401);
    expectPrivateNoStore(res);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(makeReq("not-json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      code: "invalid_json",
      error: "invalid_json",
    });
  });

  it("returns 400 when payload fails Zod validation", async () => {
    const res = await POST(makeReq({ mode: "complete" }));
    expect(res.status).toBe(400);
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
    expect(mockHashedAuthenticatedRateLimitKey).not.toHaveBeenCalled();
    expect(mockHashedClientRateLimitKey).not.toHaveBeenCalled();
  });

  it("returns 400 when prompt exceeds the length cap", async () => {
    const res = await POST(
      makeReq({ mode: "complete", prompt: "x".repeat(5000) }),
    );
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns an explicit policy code when the configured allowlist excludes the model", async () => {
    vi.stubEnv(
      "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
      "google/gemini-2.5-flash-lite",
    );

    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "model_not_allowed",
      error: "The requested model is not enabled by the course policy.",
    });
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["missing allowlist", "AI_NATIVE_PRACTICE_ALLOWED_MODELS"],
    ["missing credential", "ANTHROPIC_API_KEY"],
    ["missing DPA attestation", "ANTHROPIC_DPA_CONFIRMED_AT"],
    ["missing retention declaration", "ANTHROPIC_RETENTION_DAYS"],
    ["missing durable backend", "SUPABASE_SERVICE_ROLE_KEY"],
  ])(
    "returns operational model-not-ready for %s",
    async (_label, missingVariable) => {
      vi.stubEnv(missingVariable, "");

      const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({
        code: "model_not_ready",
        error: "The requested model is not operationally ready.",
      });
      expect(mockedRateLimit).not.toHaveBeenCalled();
      expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    },
  );

  it("returns 413 when a no-length streamed body exceeds the byte cap", async () => {
    const request = makeStreamingReq(
      JSON.stringify({ mode: "complete", prompt: "x".repeat(40_000) }),
    );
    expect(request.headers.get("content-length")).toBeNull();
    const res = await POST(request);
    expect(res.status).toBe(413);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // ── ok ─────────────────────────────────────────────────────────
  it("ok: returns the completion text for a 'complete' request", async () => {
    mockCreate.mockResolvedValueOnce(textBlock("Hier ist deine Mail."));
    const res = await POST(makeReq(VALID_COMPLETE));
    expect(res.status).toBe(200);
    expectPrivateNoStore(res);
    const json = (await res.json()) as { mode: string; text: string };
    expect(json.mode).toBe("complete");
    expect(json.text).toBe("Hier ist deine Mail.");
    expect(json).toMatchObject({
      model: "anthropic/claude-haiku-4.5",
      provider: "anthropic",
    });
    expect(mockedRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({
            key: `ai-native-practice:user-hmac-sha256-v1:${"c".repeat(64)}`,
          }),
          expect.objectContaining({
            key: `ai-native-practice:ip-hmac-sha256-v1:${"b".repeat(64)}`,
          }),
        ]),
      }),
    );
    expect(mockConsumeUsageBudget).toHaveBeenCalledTimes(1);
    expect(mockConsumeUsageBudget).toHaveBeenCalledWith(
      expect.objectContaining({
        callerKey: `ai-model-token-day:user-hmac-sha256-v1:${"c".repeat(64)}`,
        globalKey: "ai-practice-global-token-day-v1",
        windowSeconds: 86_400,
        callerMax: 100000,
        globalMax: 1000000,
        cost: expect.any(Number),
      }),
    );
    expect(mockedRateLimit).toHaveBeenCalledTimes(1);
  });

  it("ok: parses placement JSON for a 'place-word' request", async () => {
    mockCreate.mockResolvedValueOnce(
      textBlock(
        JSON.stringify({ x: 0.82, y: 0.25, near: "Kunde", why: "Vertrieb." }),
      ),
    );
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      mode: string;
      x: number;
      y: number;
      near: string;
    };
    expect(json.mode).toBe("place-word");
    expect(json.near).toBe("Kunde");
    expect(json.x).toBeGreaterThanOrEqual(0.05);
    expect(json.x).toBeLessThanOrEqual(0.95);
  });

  it("scopes cached responses by user and reports hits truthfully", async () => {
    mockCreate
      .mockResolvedValueOnce(textBlock("Antwort für Nutzer eins."))
      .mockResolvedValueOnce(textBlock("Antwort für Nutzer zwei."));

    const first = await POST(makeReq(VALID_COMPLETE));
    expect(first.status).toBe(200);
    expectPrivateNoStore(first);
    expect((await first.json()) as { cached: boolean }).toMatchObject({
      cached: false,
    });

    mockedAuth.mockResolvedValueOnce({
      configured: true,
      user: { id: "user-2" },
    });
    const second = await POST(makeReq(VALID_COMPLETE));
    expect(second.status).toBe(200);
    expectPrivateNoStore(second);
    expect((await second.json()) as { text: string; cached: boolean }).toEqual(
      expect.objectContaining({
        text: "Antwort für Nutzer zwei.",
        cached: false,
      }),
    );

    const third = await POST(makeReq(VALID_COMPLETE));
    expect(third.status).toBe(200);
    expectPrivateNoStore(third);
    expect((await third.json()) as { text: string; cached: boolean }).toEqual(
      expect.objectContaining({
        text: "Antwort für Nutzer eins.",
        cached: true,
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  // ── timeout / error ─────────────────────────────────────────────
  it("maps an opaque SDK rejection to a sanitized provider-unavailable response", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Request was aborted"));
    const res = await POST(makeReq(VALID_COMPLETE));
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("Der Provider ist vorübergehend nicht verfügbar.");
    expect(json.error).not.toContain("aborted");
  });

  // ── malformed ───────────────────────────────────────────────────
  it("malformed: returns 500 when place-word JSON is unparseable", async () => {
    mockCreate.mockResolvedValueOnce(textBlock("definitely not json {{{"));
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(500);
  });

  it("malformed: clamps out-of-range coordinates rather than crashing", async () => {
    mockCreate.mockResolvedValueOnce(
      textBlock(JSON.stringify({ x: 9, y: -4, near: "Kunde", why: "x" })),
    );
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { x: number; y: number };
    expect(json.x).toBeLessThanOrEqual(0.95);
    expect(json.y).toBeGreaterThanOrEqual(0.05);
  });

  it("malformed: falls back to first existing word when 'near' hallucinated", async () => {
    mockCreate.mockResolvedValueOnce(
      textBlock(
        JSON.stringify({ x: 0.5, y: 0.5, near: "Phantasiewort", why: "x" }),
      ),
    );
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { near: string };
    expect(json.near).toBe("Kunde");
  });

  // ── rate limit ──────────────────────────────────────────────────
  it("returns 429 after 20 requests from one IP in an hour", async () => {
    mockCreate.mockResolvedValue(textBlock("ok"));
    for (let i = 0; i < 20; i++) {
      // Unique prompt each time to avoid the cache short-circuit.
      const res = await POST(
        makeReq({ mode: "complete", prompt: `Mail ${i}` }),
      );
      expect(res.status).toBe(200);
    }
    mockedRateLimit.mockResolvedValueOnce(false);
    const blocked = await POST(
      makeReq({ mode: "complete", prompt: "one too many" }),
    );
    expect(blocked.status).toBe(429);
  });

  it("localizes an hourly request-limit rejection for English consumers", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);

    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      code: "rate_limited",
      error: "Too many requests. Try again in one hour.",
    });
  });

  it("returns 503 when the durable limiter is unavailable", async () => {
    mockedRateLimit.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });
    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "rate_limit_unavailable",
      error: "The request limit is temporarily unavailable.",
    });
    expectPrivateNoStore(res);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("fails closed before the provider when the durable token budget is unavailable", async () => {
    mockConsumeUsageBudget.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });
    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "budget_unavailable",
      error: "The usage budget is temporarily unavailable.",
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "rate-limit" }),
    );
  });

  it("localizes a missing daily budget for English consumers", async () => {
    delete process.env.AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET;

    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "budget_not_configured",
      error: "The usage budget is not configured.",
    });
    expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("localizes an exhausted daily budget for English consumers", async () => {
    mockConsumeUsageBudget.mockResolvedValueOnce(false);

    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      code: "budget_exhausted",
      error: "The daily model-token budget is exhausted.",
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects arbitrary model IDs before any provider call", async () => {
    const res = await POST(
      makeReq({
        mode: "complete",
        prompt: "bounded test",
        model: "google/arbitrary-latest",
        locale: "en",
      }),
    );

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockHashedAuthenticatedRateLimitKey).not.toHaveBeenCalled();
    expect(mockHashedClientRateLimitKey).not.toHaveBeenCalled();
  });

  it("returns one reported 503 when the auth helper rejects", async () => {
    const authError = new Error("auth helper rejected");
    mockedAuth.mockRejectedValueOnce(authError);

    const res = await POST(makeReq(VALID_COMPLETE));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "auth_unavailable",
      error: "auth_unavailable",
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "auth-get-user",
        error: authError,
      }),
    );
  });

  it("returns one reported 503 when trusted-client hashing rejects", async () => {
    const hashError = new Error("trusted-client hash rejected");
    mockHashedClientRateLimitKey.mockRejectedValueOnce(hashError);

    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "rate_limit_unavailable",
      error: "The request limit is temporarily unavailable.",
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "rate-limit",
        error: hashError,
      }),
    );
  });

  it("returns one reported 500 when request hashing rejects", async () => {
    const hashError = new Error("request hash rejected");
    const digest = vi
      .spyOn(globalThis.crypto.subtle, "digest")
      .mockRejectedValueOnce(hashError);

    const res = await POST(makeReq({ ...VALID_COMPLETE, locale: "en" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      code: "request_hash_failed",
      error: "Live mode failed.",
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "unhandled",
        error: hashError,
      }),
    );
    digest.mockRestore();
  });
});
