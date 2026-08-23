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
