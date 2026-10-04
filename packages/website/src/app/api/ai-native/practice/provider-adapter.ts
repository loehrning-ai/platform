import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { tryGetAnthropicClient } from "@/lib/anthropic";
import {
  isPracticeModelRuntimeReady,
  openaiPracticeModel,
} from "@/lib/provider-readiness";

import { buildUserMessage, systemPromptFor } from "./prompt";
import {
  PRACTICE_PROVIDER_BY_MODEL,
  type PracticeModelId,
  type PracticeProviderName,
} from "./types";
import type { PracticeRequestParsed } from "./validation";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

export type PracticeProvider = PracticeProviderName;
export type PracticeProviderFailureKind =
  | "not_ready"
  | "bad_request"
  | "payment_required"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "malformed_response";

export class PracticeProviderError extends Error {
  readonly kind: PracticeProviderFailureKind;
  readonly upstreamStatus?: number;

  constructor(kind: PracticeProviderFailureKind, upstreamStatus?: number) {
    super(`Practice provider failure:${kind}`);
    this.name = "PracticeProviderError";
    this.kind = kind;
    this.upstreamStatus = upstreamStatus;
  }
}

export interface PracticeProviderUsage {
  readonly inputTokens: number | null | undefined;
  readonly outputTokens: number | null | undefined;
  readonly cacheReadInputTokens: number | null | undefined;
  readonly cacheCreationInputTokens: number | null | undefined;
}

export interface PracticeProviderTextResult {
  readonly text: string;
  readonly model: PracticeModelId;
  readonly provider: PracticeProvider;
  readonly usage: PracticeProviderUsage;
}

interface AdapterDependencies {
  readonly anthropic?: Anthropic | null;
  readonly fetchImpl?: typeof fetch;
  readonly geminiApiKey?: string;
  readonly openaiApiKey?: string;
  /** Pinned upstream OpenAI model name; defaults to the readiness accessor. */
  readonly openaiModel?: string;
  /** Test seam only. Production calls must retain the readiness predicate. */
  readonly readiness?: (model: PracticeModelId) => boolean;
}

function finiteTokenCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function statusFromUnknown(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  try {
    const status = Reflect.get(error, "status");
    return typeof status === "number" && Number.isInteger(status)
      ? status
      : undefined;
  } catch {
    return undefined;
  }
}

function providerFailure(
  status: number | undefined,
  signal: AbortSignal,
): PracticeProviderError {
  if (signal.aborted) return new PracticeProviderError("timeout", status);
  if (status === 400 || status === 422) {
    return new PracticeProviderError("bad_request", status);
  }
  if (status === 402) {
    return new PracticeProviderError("payment_required", status);
  }
  if (status === 429) {
    return new PracticeProviderError("rate_limited", status);
  }
  return new PracticeProviderError("unavailable", status);
}

async function callAnthropic(
  req: PracticeRequestParsed,
  signal: AbortSignal,
  anthropic: Anthropic,
): Promise<PracticeProviderTextResult> {
  try {
    const result = await anthropic.messages.create(
      {
        model: ANTHROPIC_MODEL,
        max_tokens: req.mode === "complete" ? 800 : 200,
        temperature: req.mode === "complete" ? 0.4 : 0.1,
        system: [
          {
            type: "text",
            text: systemPromptFor(req.mode, req.locale),
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: buildUserMessage(req) }],
      },
      { signal },
    );

    const text = result.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (!text.trim()) throw new PracticeProviderError("malformed_response");

    return {
      text,
      model: req.model,
      provider: "anthropic",
      usage: {
        inputTokens: result.usage?.input_tokens,
        outputTokens: result.usage?.output_tokens,
        cacheReadInputTokens: result.usage?.cache_read_input_tokens,
        cacheCreationInputTokens: result.usage?.cache_creation_input_tokens,
      },
    };
  } catch (error) {
    if (error instanceof PracticeProviderError) throw error;
    throw providerFailure(statusFromUnknown(error), signal);
  }
}

const geminiResponseSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({
            content: z
              .object({
                parts: z.array(
                  z.object({ text: z.string().optional() }).passthrough(),
                ),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .optional(),
    usageMetadata: z
      .object({
        promptTokenCount: z.number().optional(),
        candidatesTokenCount: z.number().optional(),
        cachedContentTokenCount: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

async function callGemini(
  req: PracticeRequestParsed,
  signal: AbortSignal,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<PracticeProviderTextResult> {
  let response: Response;
  try {
    response = await fetchImpl(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPromptFor(req.mode, req.locale) }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserMessage(req) }],
          },
        ],
        generationConfig: {
          maxOutputTokens: req.mode === "complete" ? 800 : 200,
          temperature: req.mode === "complete" ? 0.4 : 0.1,
        },
      }),
      cache: "no-store",
      signal,
    });
  } catch {
    throw providerFailure(undefined, signal);
  }

  if (!response.ok) {
    // Do not parse or log provider error bodies: they can echo request data.
    throw providerFailure(response.status, signal);
  }

  let parsed: z.infer<typeof geminiResponseSchema>;
  try {
    parsed = geminiResponseSchema.parse(await response.json());
  } catch {
    throw new PracticeProviderError("malformed_response", response.status);
  }

  const text =
    parsed.candidates?.[0]?.content.parts
      .map((part) => part.text ?? "")
      .join("") ?? "";
  if (!text.trim()) {
    throw new PracticeProviderError("malformed_response", response.status);
  }

  return {
    text,
    model: req.model,
    provider: "google",
    usage: {
      inputTokens: finiteTokenCount(parsed.usageMetadata?.promptTokenCount),
      outputTokens: finiteTokenCount(
        parsed.usageMetadata?.candidatesTokenCount,
      ),
      cacheReadInputTokens: finiteTokenCount(
        parsed.usageMetadata?.cachedContentTokenCount,
      ),
      cacheCreationInputTokens: null,
    },
  };
}

const openaiResponseSchema = z
  .object({
    // `output_text` is an SDK convenience; accept it when present, but the
    // REST contract is the `output` item list below.
    output_text: z.string().nullish(),
    output: z
      .array(
        z
          .object({
            type: z.string().optional(),
            content: z
              .array(
                z
                  .object({
                    type: z.string().optional(),
                    text: z.string().optional(),
                  })
                  .passthrough(),
              )
              .nullish(),
          })
          .passthrough(),
      )
      .nullish(),
    usage: z
      .object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
        input_tokens_details: z
          .object({ cached_tokens: z.number().optional() })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

/**
 * Text from a Responses API body. Only assistant `message` items with
 * `output_text` parts count; reasoning summaries and refusals are ignored, so
 * a refusal surfaces as a malformed response instead of as model output.
 */
function extractOpenAIOutputText(
  body: z.infer<typeof openaiResponseSchema>,
): string {
  if (typeof body.output_text === "string" && body.output_text.trim()) {
    return body.output_text;
  }
  return (body.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text ?? "")
    .join("");
}

async function callOpenAI(
  req: PracticeRequestParsed,
  signal: AbortSignal,
  apiKey: string,
  model: string,
  fetchImpl: typeof fetch,
): Promise<PracticeProviderTextResult> {
  let response: Response;
  try {
    response = await fetchImpl(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions: systemPromptFor(req.mode, req.locale),
        input: buildUserMessage(req),
        // Reasoning tokens count toward this cap; minimal effort keeps the
        // cap available for the visible answer. GPT-5 models reject a custom
        // temperature, so none is sent.
        max_output_tokens: req.mode === "complete" ? 800 : 200,
        reasoning: { effort: "minimal" },
        // Do not keep the response on the provider side for later retrieval.
        store: false,
      }),
      cache: "no-store",
      signal,
    });
  } catch {
    throw providerFailure(undefined, signal);
  }

  if (!response.ok) {
    // Do not parse or log provider error bodies: they can echo request data.
    throw providerFailure(response.status, signal);
  }

  let parsed: z.infer<typeof openaiResponseSchema>;
  try {
    parsed = openaiResponseSchema.parse(await response.json());
  } catch {
    throw new PracticeProviderError("malformed_response", response.status);
  }

  const text = extractOpenAIOutputText(parsed);
  if (!text.trim()) {
    throw new PracticeProviderError("malformed_response", response.status);
  }

  return {
    text,
    model: req.model,
    provider: "openai",
    usage: {
      inputTokens: finiteTokenCount(parsed.usage?.input_tokens),
      outputTokens: finiteTokenCount(parsed.usage?.output_tokens),
      cacheReadInputTokens: finiteTokenCount(
        parsed.usage?.input_tokens_details?.cached_tokens,
      ),
      cacheCreationInputTokens: null,
    },
  };
}

/**
 * Server-only, fail-closed provider dispatcher. The request model is already a
 * Zod enum and is checked again against the deployment allowlist/readiness.
 */
export async function callPracticeProvider(
  req: PracticeRequestParsed,
  signal: AbortSignal,
  dependencies: AdapterDependencies = {},
): Promise<PracticeProviderTextResult> {
  const ready = dependencies.readiness ?? isPracticeModelRuntimeReady;
  if (!ready(req.model)) throw new PracticeProviderError("not_ready");

  switch (PRACTICE_PROVIDER_BY_MODEL[req.model]) {
    case "anthropic": {
      const anthropic = dependencies.anthropic ?? tryGetAnthropicClient();
      if (!anthropic) throw new PracticeProviderError("not_ready");
      return callAnthropic(req, signal, anthropic);
    }
    case "google": {
      const apiKey = dependencies.geminiApiKey ?? process.env.GEMINI_API_KEY;
      if (!apiKey) throw new PracticeProviderError("not_ready");
      return callGemini(req, signal, apiKey, dependencies.fetchImpl ?? fetch);
    }
    case "openai": {
      const apiKey = dependencies.openaiApiKey ?? process.env.OPENAI_API_KEY;
      const model = dependencies.openaiModel ?? openaiPracticeModel();
      if (!apiKey || !model) throw new PracticeProviderError("not_ready");
      return callOpenAI(
        req,
        signal,
        apiKey,
        model,
        dependencies.fetchImpl ?? fetch,
      );
    }
    default:
      throw new PracticeProviderError("not_ready");
  }
}

export function isPracticeProviderError(
  error: unknown,
): error is PracticeProviderError {
  return error instanceof PracticeProviderError;
}
