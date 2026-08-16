import type Anthropic from "@anthropic-ai/sdk";
import { isPracticeModelRuntimeReady } from "@/lib/provider-readiness";

import { buildUserMessage, systemPromptFor } from "./prompt";
import {
  callPracticeProvider,
  type PracticeProviderUsage,
} from "./provider-adapter";
import type { PracticeModelId, PlacedWord, PracticeResponse } from "./types";
import { DEFAULT_PRACTICE_MODEL_ID } from "./types";
import type { PracticeRequestParsed } from "./validation";

/**
 * Distributive Omit so the discriminated union is preserved when we strip
 * `cached` (a plain `Omit<Union, K>` collapses the union into one shape).
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type PracticeResponseBody = DistributiveOmit<PracticeResponse, "cached">;

const HOUR_MS = 3_600_000;

/** Max chars of prose returned to the client (defends against runaway output). */
const MAX_OUTPUT_CHARS = 4000;

/**
 * Practice Room live mode is OFF by default. Enable only through the complete
 * provider-readiness contract: exact feature flag, credentials, DPA and
 * retention declarations, and persistence configuration.
 */
export function isPracticeEnabled(
  model: PracticeModelId = DEFAULT_PRACTICE_MODEL_ID,
): boolean {
  return isPracticeModelRuntimeReady(model);
}

/** Response cache keyed on authenticated-user scope plus request hash — 1h TTL. */
interface CachedResponse {
  readonly response: PracticeResponse;
  readonly expires: number;
}
const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = HOUR_MS;
const CACHE_MAX_ENTRIES = 500;

export async function hashRequest(
  userId: string,
  req: PracticeRequestParsed,
): Promise<string> {
  const payload = JSON.stringify({ userId, request: req });
  const data = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function readCache(key: string): PracticeResponse | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return entry.response;
}

export function writeCache(key: string, response: PracticeResponse): void {
  responseCache.set(key, { response, expires: Date.now() + CACHE_TTL_MS });
  if (responseCache.size > CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of responseCache) {
      if (v.expires < now) responseCache.delete(k);
    }
    while (responseCache.size > CACHE_MAX_ENTRIES) {
      const first = responseCache.keys().next().value;
      if (!first) break;
      responseCache.delete(first);
    }
  }
}

/** Strip markdown fences a model sometimes wraps JSON in. */
function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Parse the place-word JSON. Throws on malformed / out-of-range output, so the
 * route can fall through to the honest static-fallback path (ZodError row in
 * the Error Map). `existingWords` validates that `near` is a real point.
 */
export function parsePlacement(
  raw: string,
  existingWords: readonly string[],
  locale: "de" | "en" = "de",
): PlacedWord {
  const cleaned = stripFences(raw);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("placement is not an object");
  }
  const x = Number(parsed.x);
  const y = Number(parsed.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("x/y not finite");
  }
  const near = typeof parsed.near === "string" ? parsed.near : "";
  const why =
    typeof parsed.why === "string" ? parsed.why.trim().slice(0, 160) : "";
  // Clamp coordinates into the visible field [0.05, 0.95].
  const clamp = (n: number) => Math.max(0.05, Math.min(0.95, n));
  // If "near" hallucinated a word that doesn't exist, fall back to the first.
  const resolvedNear = existingWords.includes(near)
    ? near
    : (existingWords[0] ?? "");
  return {
    x: clamp(x),
    y: clamp(y),
    near: resolvedNear,
    why:
      why ||
      (locale === "de"
        ? "Nahe an thematisch verwandten Begriffen platziert."
        : "Placed near semantically related terms."),
  };
}

interface CallClaudeArgs {
  readonly anthropic: Anthropic;
  readonly req: PracticeRequestParsed;
  readonly signal: AbortSignal;
}

export type ClaudeUsage = PracticeProviderUsage;

export interface CallClaudeResult {
  readonly response: PracticeResponseBody;
  readonly usage: ClaudeUsage;
}

export async function callClaude({
  anthropic,
  req,
  signal,
}: CallClaudeArgs): Promise<CallClaudeResult> {
  const providerResult = await callPracticeProvider(
    { ...req, model: DEFAULT_PRACTICE_MODEL_ID },
    signal,
    {
      anthropic,
      readiness: () => true,
    },
  );
  const { text, usage, model, provider } = providerResult;

  if (req.mode === "complete") {
    return {
      response: {
        mode: "complete",
        text: text.slice(0, MAX_OUTPUT_CHARS),
        model,
        provider,
      },
      usage,
    };
  }

  const placement = parsePlacement(
    text,
    req.existing.map((p) => p.w),
    req.locale,
  );
  return {
    response: { mode: "place-word", ...placement, model, provider },
    usage,
  };
}

export async function callPracticeModel({
  req,
  signal,
}: {
  readonly req: PracticeRequestParsed;
  readonly signal: AbortSignal;
}): Promise<CallClaudeResult> {
  const { text, usage, model, provider } = await callPracticeProvider(
    req,
    signal,
  );

  if (req.mode === "complete") {
    return {
      response: {
        mode: "complete",
        text: text.slice(0, MAX_OUTPUT_CHARS),
        model,
        provider,
      },
      usage,
    };
  }

  return {
    response: {
      mode: "place-word",
      ...parsePlacement(
        text,
        req.existing.map((point) => point.w),
        req.locale,
      ),
      model,
      provider,
    },
    usage,
  };
}

/**
 * Conservative token reservation used by the durable pre-call budget. UTF-8
 * byte count is a safe upper bound for input tokens, including adversarial
 * Unicode; provider output is reserved at its configured token ceiling.
 * Providers may bill fewer tokens and reservations are deliberately not
 * refunded.
 */
export function reservedTokenBudget(req: PracticeRequestParsed): number {
  const inputBytes = new TextEncoder().encode(
    `${systemPromptFor(req.mode, req.locale)}${buildUserMessage(req)}`,
  ).byteLength;
  return inputBytes + (req.mode === "complete" ? 800 : 200);
}

/** Reset in-memory state. Used by unit tests only. */
export function __resetEngineState(): void {
  responseCache.clear();
}
