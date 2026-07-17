import { describe, it, expect, beforeEach, vi } from "vitest";

import { gradeWithAI } from "./_ai-grade";

describe("gradeWithAI — hybrid fallback helper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseArgs = {
    kind: "exercise-fix-prompt" as const,
    lessonId: "m1l1",
    exerciseId: "m1l1_ex_1",
    userInput: "my draft prompt",
    fallbackScore: 0.5,
    fallbackRubric: [{ id: "a", passed: true, rationale: "rule-matched" }],
    fallbackSummary: "fallback summary",
    timeoutMs: 500,
  };

  it("returns AI result on 200 success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            score: 0.9,
            rubric: [{ id: "a", passed: true, rationale: "AI-rationale" }],
            summary: "AI summary",
            cached: false,
          }),
      } as Response),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.source).toBe("ai");
    expect(result.score).toBe(0.9);
    expect(result.summary).toBe("AI summary");
    expect(result.rubric[0]?.rationale).toBe("AI-rationale");
    const [, request] = vi.mocked(fetch).mock.calls[0] ?? [];
    const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
    expect(body).toEqual({
      kind: baseArgs.kind,
      lessonId: baseArgs.lessonId,
      exerciseId: baseArgs.exerciseId,
      userInput: baseArgs.userInput,
    });
    expect(body).not.toHaveProperty("scenario");
    expect(body).not.toHaveProperty("rubric");
  });

  it("falls back on 503 (no API key)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 503 } as Response),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.source).toBe("fallback");
    expect(result.score).toBe(0.5);
    expect(result.summary).toBe("fallback summary");
  });

  it("falls back on 429 (rate-limited)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 429 } as Response),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.source).toBe("fallback");
  });

  it("falls back on 500 (server error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500 } as Response),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.source).toBe("fallback");
    expect(result.rubric).toEqual(baseArgs.fallbackRubric);
  });

  it("falls back on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("fetch failed")),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.source).toBe("fallback");
  });

  it("falls back on malformed response JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ score: "not a number" }),
      } as Response),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.source).toBe("fallback");
  });

  it("preserves cached flag from AI response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            score: 1,
            rubric: [{ id: "a", passed: true, rationale: "ok" }],
            summary: "summary",
            cached: true,
          }),
      } as Response),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.cached).toBe(true);
  });

  it("clamps score to [0, 1] even if AI returns out-of-range", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            score: 1.5,
            rubric: [{ id: "a", passed: true, rationale: "" }],
            summary: "",
          }),
      } as Response),
    );

    const result = await gradeWithAI(baseArgs);
    expect(result.score).toBe(1);
  });
});
