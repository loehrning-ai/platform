import { describe, expect, it, vi } from "vitest";

import type { PracticeRequestParsed } from "./validation";
import {
  callPracticeProvider,
  PracticeProviderError,
} from "./provider-adapter";

const ANTHROPIC_REQUEST: PracticeRequestParsed = {
  mode: "complete",
  prompt: "Return one synthetic result.",
  model: "anthropic/claude-haiku-4.5",
  locale: "en",
};

const GEMINI_REQUEST: PracticeRequestParsed = {
  ...ANTHROPIC_REQUEST,
  model: "google/gemini-2.5-flash-lite",
};

const OPENAI_REQUEST: PracticeRequestParsed = {
  ...ANTHROPIC_REQUEST,
  model: "openai/gpt-5-mini",
};

function openaiJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const OPENAI_DEPENDENCIES = {
  openaiApiKey: "obviously-fake-openai-key",
  openaiModel: "gpt-5-mini",
  readiness: () => true,
} as const;

describe("practice provider adapter", () => {
  it("preserves the reviewed pinned Anthropic request contract", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "Anthropic result" }],
      usage: {
        input_tokens: 14,
        output_tokens: 3,
        cache_read_input_tokens: 4,
        cache_creation_input_tokens: 7,
      },
    });
    const controller = new AbortController();

    await expect(
      callPracticeProvider(ANTHROPIC_REQUEST, controller.signal, {
        anthropic: { messages: { create } } as never,
        readiness: () => true,
      }),
    ).resolves.toEqual({
      text: "Anthropic result",
      model: "anthropic/claude-haiku-4.5",
      provider: "anthropic",
      usage: {
        inputTokens: 14,
        outputTokens: 3,
        cacheReadInputTokens: 4,
        cacheCreationInputTokens: 7,
      },
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("<user_prompt>"),
          }),
        ],
      }),
      { signal: controller.signal },
    );
  });

  it("uses the official Gemini REST shape with a server-only key header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: "Gemini " }, { text: "result" }] } },
          ],
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 2,
            cachedContentTokenCount: 1,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const controller = new AbortController();

    const result = await callPracticeProvider(
      GEMINI_REQUEST,
      controller.signal,
      {
        fetchImpl,
        geminiApiKey: "obviously-fake-server-key",
        readiness: () => true,
      },
    );

    expect(result).toEqual({
      text: "Gemini result",
      model: "google/gemini-2.5-flash-lite",
      provider: "google",
      usage: {
        inputTokens: 12,
        outputTokens: 2,
        cacheReadInputTokens: 1,
        cacheCreationInputTokens: null,
      },
    });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    );
    expect(init).toMatchObject({ method: "POST", cache: "no-store" });
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe(
      "obviously-fake-server-key",
    );
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toEqual(
      expect.objectContaining({
        system_instruction: expect.objectContaining({
          parts: [expect.objectContaining({ text: expect.any(String) })],
        }),
        contents: [
          expect.objectContaining({
            role: "user",
            parts: [
              expect.objectContaining({
                text: expect.stringContaining("<user_prompt>"),
              }),
            ],
          }),
        ],
      }),
    );
    expect(JSON.stringify(body)).not.toContain("obviously-fake-server-key");
  });

  it("fails closed when a selected model is not runtime-ready", async () => {
    await expect(
      callPracticeProvider(
        GEMINI_REQUEST,
        new AbortController().signal,
        {
          readiness: () => false,
          fetchImpl: vi.fn(),
          geminiApiKey: "obviously-fake-server-key",
        },
      ),
    ).rejects.toMatchObject({ kind: "not_ready" });
  });

  it("does not parse or expose an upstream error body", async () => {
    const response = new Response("raw prompt echoed here", { status: 429 });
    const body = vi.spyOn(response, "json");

    const error = await callPracticeProvider(
      GEMINI_REQUEST,
      new AbortController().signal,
      {
        readiness: () => true,
        geminiApiKey: "obviously-fake-server-key",
        fetchImpl: vi.fn().mockResolvedValue(response),
      },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PracticeProviderError);
    expect(error).toMatchObject({ kind: "rate_limited", upstreamStatus: 429 });
    expect(String(error)).not.toContain("raw prompt");
    expect(body).not.toHaveBeenCalled();
  });

  it("classifies an aborted request as a timeout without exposing SDK errors", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await callPracticeProvider(GEMINI_REQUEST, controller.signal, {
      readiness: () => true,
      geminiApiKey: "obviously-fake-server-key",
      fetchImpl: vi.fn().mockRejectedValue(new Error("secret transport detail")),
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ kind: "timeout" });
    expect(String(error)).not.toContain("secret transport detail");
  });
});

describe("practice provider adapter: OpenAI Responses API", () => {
  it("posts the pinned model to the Responses endpoint with a server-only bearer key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      openaiJson({
        id: "resp_synthetic",
        status: "completed",
        output: [
          { type: "reasoning", summary: [] },
          {
            type: "message",
            role: "assistant",
            content: [
              { type: "output_text", text: "OpenAI ", annotations: [] },
              { type: "output_text", text: "result", annotations: [] },
            ],
          },
        ],
        usage: {
          input_tokens: 21,
          output_tokens: 5,
          input_tokens_details: { cached_tokens: 3 },
          output_tokens_details: { reasoning_tokens: 0 },
        },
      }),
    );
    const controller = new AbortController();

    const result = await callPracticeProvider(
      OPENAI_REQUEST,
      controller.signal,
      { ...OPENAI_DEPENDENCIES, fetchImpl },
    );

    expect(result).toEqual({
      text: "OpenAI result",
      model: "openai/gpt-5-mini",
      provider: "openai",
      usage: {
        inputTokens: 21,
        outputTokens: 5,
        cacheReadInputTokens: 3,
        cacheCreationInputTokens: null,
      },
    });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
    });
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer obviously-fake-openai-key",
    );
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toEqual(
      expect.objectContaining({
        model: "gpt-5-mini",
        instructions: expect.any(String),
        input: expect.stringContaining("<user_prompt>"),
        max_output_tokens: 800,
        store: false,
      }),
    );
    expect(body).not.toHaveProperty("temperature");
    expect(JSON.stringify(body)).not.toContain("obviously-fake-openai-key");
  });

  it("uses the smaller output cap for word placement", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(openaiJson({ output_text: '{"x":0.5}' }));

    await callPracticeProvider(
      {
        mode: "place-word",
        word: "Synthese",
        existing: [{ w: "Analyse", x: 0.2, y: 0.3 }],
        model: "openai/gpt-5-mini",
        locale: "de",
      } as PracticeRequestParsed,
      new AbortController().signal,
      { ...OPENAI_DEPENDENCIES, fetchImpl },
    );

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      max_output_tokens: 200,
    });
  });

  it("accepts the SDK-style output_text convenience field", async () => {
    const result = await callPracticeProvider(
      OPENAI_REQUEST,
      new AbortController().signal,
      {
        ...OPENAI_DEPENDENCIES,
        fetchImpl: vi
          .fn()
          .mockResolvedValue(openaiJson({ output_text: "Flat result" })),
      },
    );

    expect(result.text).toBe("Flat result");
    expect(result.usage).toEqual({
      inputTokens: null,
      outputTokens: null,
      cacheReadInputTokens: null,
      cacheCreationInputTokens: null,
    });
  });

  it("tolerates null fields the Responses API may send", async () => {
    const result = await callPracticeProvider(
      OPENAI_REQUEST,
      new AbortController().signal,
      {
        ...OPENAI_DEPENDENCIES,
        fetchImpl: vi.fn().mockResolvedValue(
          openaiJson({
            output_text: null,
            output: [
              { type: "reasoning", content: null },
              {
                type: "message",
                content: [{ type: "output_text", text: "Null-safe" }],
              },
            ],
            usage: null,
          }),
        ),
      },
    );

    expect(result.text).toBe("Null-safe");
    expect(result.usage.inputTokens).toBeNull();
  });

  it("does not parse or expose an upstream error body", async () => {
    const response = new Response("raw prompt echoed here", { status: 401 });
    const body = vi.spyOn(response, "json");
    const text = vi.spyOn(response, "text");

    const error = await callPracticeProvider(
      OPENAI_REQUEST,
      new AbortController().signal,
      { ...OPENAI_DEPENDENCIES, fetchImpl: vi.fn().mockResolvedValue(response) },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PracticeProviderError);
    expect(error).toMatchObject({ kind: "unavailable", upstreamStatus: 401 });
    expect(String(error)).not.toContain("raw prompt");
    expect(body).not.toHaveBeenCalled();
    expect(text).not.toHaveBeenCalled();
  });

  it.each([
    [400, "bad_request"],
    [402, "payment_required"],
    [429, "rate_limited"],
    [500, "unavailable"],
  ])("maps upstream status %i to %s", async (status, kind) => {
    const error = await callPracticeProvider(
      OPENAI_REQUEST,
      new AbortController().signal,
      {
        ...OPENAI_DEPENDENCIES,
        fetchImpl: vi
          .fn()
          .mockResolvedValue(new Response("synthetic", { status })),
      },
    ).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ kind, upstreamStatus: status });
  });

  it("classifies an aborted request as a timeout without exposing transport errors", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await callPracticeProvider(OPENAI_REQUEST, controller.signal, {
      ...OPENAI_DEPENDENCIES,
      fetchImpl: vi.fn().mockRejectedValue(new Error("secret transport detail")),
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ kind: "timeout" });
    expect(String(error)).not.toContain("secret transport detail");
  });

  it.each([
    ["no output items", { output: [] }],
    [
      "only a refusal",
      {
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "synthetic refusal" }],
          },
        ],
      },
    ],
    [
      "only reasoning",
      { output: [{ type: "reasoning", content: [{ type: "reasoning_text", text: "x" }] }] },
    ],
    ["whitespace text", { output_text: "   " }],
    ["a non-object body", "not an object"],
  ])("fails closed as malformed when the body has %s", async (_label, payload) => {
    const error = await callPracticeProvider(
      OPENAI_REQUEST,
      new AbortController().signal,
      {
        ...OPENAI_DEPENDENCIES,
        fetchImpl: vi.fn().mockResolvedValue(openaiJson(payload)),
      },
    ).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ kind: "malformed_response" });
  });

  it("fails closed when the key or pinned model is missing", async () => {
    const fetchImpl = vi.fn();
    vi.stubEnv("OPENAI_API_KEY", "");
    try {
      await expect(
        callPracticeProvider(OPENAI_REQUEST, new AbortController().signal, {
          readiness: () => true,
          fetchImpl,
        }),
      ).rejects.toMatchObject({ kind: "not_ready" });
      vi.stubEnv("OPENAI_API_KEY", "obviously-fake-openai-key");
      vi.stubEnv("OPENAI_PRACTICE_MODEL", "gpt-4o");
      await expect(
        callPracticeProvider(OPENAI_REQUEST, new AbortController().signal, {
          readiness: () => true,
          fetchImpl,
        }),
      ).rejects.toMatchObject({ kind: "not_ready" });
    } finally {
      vi.unstubAllEnvs();
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("uses the server-pinned snapshot from OPENAI_PRACTICE_MODEL", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(openaiJson({ output_text: "Pinned" }));
    vi.stubEnv("OPENAI_API_KEY", "obviously-fake-openai-key");
    vi.stubEnv("OPENAI_PRACTICE_MODEL", "gpt-5-mini-2025-08-07");
    try {
      await callPracticeProvider(OPENAI_REQUEST, new AbortController().signal, {
        readiness: () => true,
        fetchImpl,
      });
    } finally {
      vi.unstubAllEnvs();
    }
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "gpt-5-mini-2025-08-07",
    });
  });

  it("fails closed when OpenAI is not runtime-ready", async () => {
    const fetchImpl = vi.fn();
    await expect(
      callPracticeProvider(OPENAI_REQUEST, new AbortController().signal, {
        ...OPENAI_DEPENDENCIES,
        readiness: () => false,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ kind: "not_ready" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
