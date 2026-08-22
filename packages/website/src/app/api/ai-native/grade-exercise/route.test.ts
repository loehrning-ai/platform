import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();
const mockGetAuthenticatedUser = vi.fn<
  () => Promise<{
    configured: boolean;
    user: { id: string } | null;
  }>
>(async () => ({
  configured: true,
  user: { id: "user-1" },
}));
const mockHashedClientRateLimitKey = vi.fn<
  (namespace: string, request: Request) => Promise<string>
>(
  async (namespace, request) =>
    `${namespace}:ip-hmac-sha256-v1:${
      request.headers.get("x-vercel-forwarded-for") === "10.0.0.2"
        ? "b".repeat(64)
        : "a".repeat(64)
    }`,
);
const mockHashedAuthenticatedRateLimitKey = vi.fn<
  (namespace: string, request: Request, userId: string) => Promise<string>
>(async (namespace) => `${namespace}:user-hmac-sha256-v1:${"c".repeat(64)}`);
const mockConsumeRateLimit = vi.fn<(args: unknown) => Promise<boolean>>(
  async () => true,
);
const mockConsumeUsageBudget = vi.fn<(args: unknown) => Promise<boolean>>(
  async () => true,
);
const mockReportApiError = vi.fn<(...args: unknown[]) => void>();
const mockResolveCanonicalExercise = vi.fn();
const mockTryGetAnthropicClient = vi.fn(() => ({
  messages: { create: mockCreate },
}));

vi.mock("@/lib/anthropic", () => ({
  tryGetAnthropicClient: () => mockTryGetAnthropicClient(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (args: unknown) => mockConsumeRateLimit(args),
  consumeMultiRateLimit: (args: unknown) => mockConsumeRateLimit(args),
  consumePairedUsageBudget: (args: unknown) => mockConsumeUsageBudget(args),
  hashedClientRateLimitKey: (namespace: string, req: Request) =>
    mockHashedClientRateLimitKey(namespace, req),
  hashedAuthenticatedRateLimitKey: (
    namespace: string,
    req: Request,
    userId: string,
  ) => mockHashedAuthenticatedRateLimitKey(namespace, req, userId),
  isRateLimitUnavailableError: (error: unknown) =>
    (error as { code?: string })?.code === "RATE_LIMIT_UNAVAILABLE",
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

vi.mock("./canonical-exercise", () => ({
  resolveCanonicalExercise: (...args: unknown[]) =>
    mockResolveCanonicalExercise(...args),
}));

import { __resetEngineState } from "./engine";
import { POST } from "./route";

const VALID_REQUEST = {
  kind: "exercise-fix-prompt",
  lessonId: "modul_1_lesson_1",
  exerciseId: "modul_1_lesson_1_ex_1",
  userInput: "Mein verbesserter Prompt.",
};
const NON_JSON_MEDIA_TYPES = [
  ["missing", undefined],
  ["unsupported", "text/plain"],
  ["JSON lookalike", "application/jsonp"],
] as const;

function makeReq(ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/ai-native/grade-exercise", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-forwarded-for": ip,
    },
    body: JSON.stringify(VALID_REQUEST),
  });
}

function gradeBlock(summary: string) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          rubric: [
            { id: "criterion", passed: true, rationale: "Kriterium erfüllt." },
          ],
          summary,
        }),
      },
    ],
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

function expectPrivateNoStore(res: Response) {
  expect(res.headers.get("cache-control")).toBe("private, no-store");
  expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
}

async function responseBody(res: Response) {
  return (await res.json()) as {
    summary: string;
    cached: boolean;
  };
}

describe("POST /api/ai-native/grade-exercise cache isolation", () => {
  beforeEach(() => {
    __resetEngineState();
    mockCreate.mockReset();
    mockTryGetAnthropicClient.mockClear();
    mockGetAuthenticatedUser.mockReset();
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: { id: "user-1" },
    });
    mockHashedClientRateLimitKey.mockReset();
    mockHashedClientRateLimitKey.mockImplementation(
      async (namespace, request) =>
        `${namespace}:ip-hmac-sha256-v1:${
          request.headers.get("x-vercel-forwarded-for") === "10.0.0.2"
            ? "b".repeat(64)
            : "a".repeat(64)
        }`,
    );
    mockHashedAuthenticatedRateLimitKey.mockReset();
    mockHashedAuthenticatedRateLimitKey.mockImplementation(
      async (namespace) => `${namespace}:user-hmac-sha256-v1:${"c".repeat(64)}`,
    );
    mockConsumeRateLimit.mockReset();
    mockConsumeRateLimit.mockResolvedValue(true);
    mockConsumeUsageBudget.mockReset();
    mockConsumeUsageBudget.mockResolvedValue(true);
    mockReportApiError.mockReset();
    mockResolveCanonicalExercise.mockReset();
    mockResolveCanonicalExercise.mockResolvedValue({
      kind: "exercise-fix-prompt",
      lessonId: "modul_1_lesson_1",
      exerciseId: "modul_1_lesson_1_ex_1",
      scenario: "Verbessere den Prompt.",
      rubric: [{ id: "criterion", label: "Kriterium", pattern: "Kriterium" }],
      rubricIds: ["criterion"],
    });
    vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
    vi.stubEnv(
      "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
      "anthropic/claude-haiku-4.5",
    );
    vi.stubEnv("AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET", "10000");
    vi.stubEnv("AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET", "100000");
    vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
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
    "returns 415 for a %s media type before auth, quotas, canonical content, or Anthropic",
    async (_label, contentType) => {
      const request = new Request(
        "http://localhost/api/ai-native/grade-exercise",
        {
          method: "POST",
          headers: contentType ? { "Content-Type": contentType } : undefined,
          body: contentType ? "{}" : new Uint8Array([123, 125]),
        },
      );
      expect(request.headers.get("content-type")).toBe(contentType ?? null);
      const res = await POST(request);

      expect(res.status).toBe(415);
      expect(await res.json()).toEqual({
        code: "unsupported_media_type",
        error: "Nicht unterstützter Medientyp.",
      });
      expectPrivateNoStore(res);
      expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
      expect(mockHashedAuthenticatedRateLimitKey).not.toHaveBeenCalled();
      expect(mockHashedClientRateLimitKey).not.toHaveBeenCalled();
      expect(mockConsumeRateLimit).not.toHaveBeenCalled();
      expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
      expect(mockResolveCanonicalExercise).not.toHaveBeenCalled();
      expect(mockTryGetAnthropicClient).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockReportApiError).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed JSON before auth, quotas, canonical loading, or provider work", async () => {
    const res = await POST(
      new Request("http://localhost/api/ai-native/grade-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      code: "invalid_json",
      error: "Ungültiger JSON-Body.",
    });
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockResolveCanonicalExercise).not.toHaveBeenCalled();
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
    expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
    expect(mockTryGetAnthropicClient).not.toHaveBeenCalled();
  });

  it("rejects unknown exercises before request or paid-token quota", async () => {
    mockResolveCanonicalExercise.mockResolvedValueOnce(null);

    const res = await POST(makeReq());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      code: "unknown_exercise",
      error: "Unbekannte Aufgabe.",
    });
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
    expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
    expect(mockTryGetAnthropicClient).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("scopes authenticated cache entries by user ID and reports hits truthfully", async () => {
    mockCreate
      .mockResolvedValueOnce(gradeBlock("Antwort für Nutzer eins."))
      .mockResolvedValueOnce(gradeBlock("Antwort für Nutzer zwei."));

    const first = await POST(makeReq());
    expectPrivateNoStore(first);
    expect(await responseBody(first)).toEqual(
      expect.objectContaining({
        summary: "Antwort für Nutzer eins.",
        cached: false,
      }),
    );

    mockGetAuthenticatedUser.mockResolvedValueOnce({
      configured: true,
      user: { id: "user-2" },
    });
    const second = await POST(makeReq());
    expectPrivateNoStore(second);
    expect(await responseBody(second)).toEqual(
      expect.objectContaining({
        summary: "Antwort für Nutzer zwei.",
        cached: false,
      }),
    );

    const third = await POST(makeReq());
    expectPrivateNoStore(third);
    expect(await responseBody(third)).toEqual(
      expect.objectContaining({
        summary: "Antwort für Nutzer eins.",
        cached: true,
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockConsumeUsageBudget).toHaveBeenCalledTimes(2);
    expect(mockConsumeUsageBudget).toHaveBeenCalledWith(
      expect.objectContaining({
        callerKey: `ai-model-token-day:user-hmac-sha256-v1:${"c".repeat(64)}`,
        globalKey: "ai-practice-global-token-day-v1",
        windowSeconds: 86_400,
        callerMax: 10000,
        globalMax: 100000,
        cost: expect.any(Number),
      }),
    );
  });

  it("scopes anonymous cache entries by trusted-IP digest and reports hits truthfully", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
    });
    mockCreate
      .mockResolvedValueOnce(gradeBlock("Antwort für IP eins."))
      .mockResolvedValueOnce(gradeBlock("Antwort für IP zwei."));

    const first = await POST(makeReq());
    expect(await responseBody(first)).toEqual(
      expect.objectContaining({
        summary: "Antwort für IP eins.",
        cached: false,
      }),
    );

    const second = await POST(makeReq("10.0.0.2"));
    expect(await responseBody(second)).toEqual(
      expect.objectContaining({
        summary: "Antwort für IP zwei.",
        cached: false,
      }),
    );

    const third = await POST(makeReq());
    expect(await responseBody(third)).toEqual(
      expect.objectContaining({
        summary: "Antwort für IP eins.",
        cached: true,
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockConsumeUsageBudget).toHaveBeenCalledTimes(2);
    expect(mockConsumeUsageBudget).toHaveBeenCalledWith(
      expect.objectContaining({
        callerKey: `ai-grade-token-day:ip-hmac-sha256-v1:${"a".repeat(64)}`,
        globalKey: "ai-practice-global-token-day-v1",
        windowSeconds: 86_400,
        callerMax: 10000,
        globalMax: 100000,
        cost: expect.any(Number),
      }),
    );
  });

  it("keeps the provider-disabled fallback private and non-indexable", async () => {
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;
    const res = await POST(makeReq());

    expect(res.status).toBe(200);
    expectPrivateNoStore(res);
    expect(await responseBody(res)).toEqual(
      expect.objectContaining({ cached: false }),
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockConsumeUsageBudget).not.toHaveBeenCalled();
  });

  it("returns 503 when the durable limiter is unavailable", async () => {
    mockConsumeRateLimit.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });
    const res = await POST(makeReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "rate_limit_unavailable",
      error: "Anfragelimit ist vorübergehend nicht verfügbar.",
    });
    expectPrivateNoStore(res);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("fails closed before Anthropic when the daily token ledger is unavailable", async () => {
    mockConsumeUsageBudget.mockRejectedValueOnce({
      code: "RATE_LIMIT_UNAVAILABLE",
    });

    const res = await POST(makeReq());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      code: "budget_unavailable",
      error: "Das Nutzungsbudget ist vorübergehend nicht verfügbar.",
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "rate-limit" }),
    );
  });

  it("fails closed before Anthropic when the atomic caller/global reservation is refused", async () => {
    mockConsumeUsageBudget.mockResolvedValueOnce(false);

    const res = await POST(makeReq());

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      code: "budget_exhausted",
      error: "Das Tagesbudget für Modell-Tokens ist erreicht.",
    });
    expect(mockConsumeUsageBudget).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("falls back to the anonymous tier when the auth helper rejects", async () => {
    const authError = new Error("auth helper rejected");
    mockGetAuthenticatedUser.mockRejectedValueOnce(authError);
    mockCreate.mockResolvedValueOnce(gradeBlock("Anonyme Antwort."));

    const res = await POST(makeReq());

    expect(res.status).toBe(200);
    expect((await responseBody(res)).summary).toBe("Anonyme Antwort.");
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "auth-get-user",
        error: authError,
      }),
    );
  });

  it("returns a reported 503 when trusted-client hashing rejects", async () => {
    const hashError = new Error("trusted-client hash rejected");
    mockHashedClientRateLimitKey.mockRejectedValueOnce(hashError);

    const res = await POST(makeReq());

    expect(res.status).toBe(503);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "rate-limit",
        error: hashError,
      }),
    );
  });

  it("returns a reported 500 when canonical content loading rejects", async () => {
    const contentError = new Error("canonical content import rejected");
    mockResolveCanonicalExercise.mockRejectedValueOnce(contentError);

    const res = await POST(makeReq());

    expect(res.status).toBe(500);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "unhandled",
        error: contentError,
      }),
    );
  });

  it("returns a reported 500 when request hashing rejects", async () => {
    const hashError = new Error("request hash rejected");
    const digest = vi
      .spyOn(globalThis.crypto.subtle, "digest")
      .mockRejectedValueOnce(hashError);

    const res = await POST(makeReq());

    expect(res.status).toBe(500);
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
