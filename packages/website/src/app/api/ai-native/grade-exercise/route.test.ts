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
const mockHashedClientRateLimitKey = vi.fn(async () =>
  `ai-native-grade:sha256:${"a".repeat(64)}`,
);
const mockConsumeRateLimit = vi.fn(async () => true);

vi.mock("@/lib/anthropic", () => ({
  tryGetAnthropicClient: () => ({
    messages: { create: mockCreate },
  }),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (args: unknown) => mockConsumeRateLimit(args),
  hashedClientRateLimitKey: (namespace: string, req: Request) =>
    mockHashedClientRateLimitKey(namespace, req),
}));

vi.mock("./canonical-exercise", () => ({
  resolveCanonicalExercise: vi.fn(async () => ({
    kind: "exercise-fix-prompt",
    lessonId: "modul_1_lesson_1",
    exerciseId: "modul_1_lesson_1_ex_1",
    scenario: "Verbessere den Prompt.",
    rubric: [{ id: "criterion", label: "Kriterium", pattern: "Kriterium" }],
    rubricIds: ["criterion"],
  })),
}));

import { __resetEngineState } from "./engine";
import { POST } from "./route";

const VALID_REQUEST = {
  kind: "exercise-fix-prompt",
  lessonId: "modul_1_lesson_1",
  exerciseId: "modul_1_lesson_1_ex_1",
  userInput: "Mein verbesserter Prompt.",
};

function makeReq(): Request {
  return new Request("http://localhost/api/ai-native/grade-exercise", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-forwarded-for": "10.0.0.1",
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
  expect(res.headers.get("x-robots-tag")).toBe(
    "noindex, nofollow, noarchive",
  );
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
    mockGetAuthenticatedUser.mockReset();
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: { id: "user-1" },
    });
    mockHashedClientRateLimitKey.mockReset();
    mockHashedClientRateLimitKey.mockResolvedValue(
      `ai-native-grade:sha256:${"a".repeat(64)}`,
    );
    mockConsumeRateLimit.mockReset();
    mockConsumeRateLimit.mockResolvedValue(true);
    vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
    vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("scopes authenticated cache entries by user ID without disclosing hits", async () => {
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
        cached: false,
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("scopes anonymous cache entries by trusted-IP digest without disclosing hits", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
    });
    const ipOne = `ai-native-grade:sha256:${"a".repeat(64)}`;
    const ipTwo = `ai-native-grade:sha256:${"b".repeat(64)}`;
    mockHashedClientRateLimitKey
      .mockResolvedValueOnce(ipOne)
      .mockResolvedValueOnce(ipTwo)
      .mockResolvedValueOnce(ipOne);
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

    const second = await POST(makeReq());
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
        cached: false,
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
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
  });
});
