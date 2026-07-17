import type Anthropic from "@anthropic-ai/sdk";
import { isAnthropicRuntimeReady } from "@/lib/provider-readiness";

import {
  buildUserMessage,
  COMPLETE_SYSTEM_PROMPT,
  PLACE_SYSTEM_PROMPT,
} from "./prompt";
import type {
  PlacedWord,
  PracticeResponse,
} from "./types";
import type { PracticeRequestParsed } from "./validation";

/**
 * Distributive Omit so the discriminated union is preserved when we strip
 * `cached` (a plain `Omit<Union, K>` collapses the union into one shape).
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type PracticeResponseBody = DistributiveOmit<PracticeResponse, "cached">;

const RATE_LIMIT_PER_HOUR = 20;
const HOUR_MS = 3_600_000;

/** Max chars of prose returned to the client (defends against runaway output). */
const MAX_OUTPUT_CHARS = 4000;

/**
 * Practice Room live mode is OFF by default. Enable only through the complete
 * provider-readiness contract: exact feature flag, credentials, DPA and
 * retention declarations, and persistence configuration.
 */
export function isPracticeEnabled(): boolean {
  return isAnthropicRuntimeReady();
}

/** Per-IP rate limit — in-memory, edge-local (matches grade-exercise). */
const requestCounts = new Map<string, { count: number; reset: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.reset) {
    requestCounts.set(ip, { count: 1, reset: now + HOUR_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_PER_HOUR) return true;
  entry.count++;
  return false;
}

/** Response cache keyed on request payload hash — 1h TTL. */
interface CachedResponse {
  readonly response: PracticeResponse;
  readonly expires: number;
}
const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = HOUR_MS;
const CACHE_MAX_ENTRIES = 500;

export async function hashRequest(req: PracticeRequestParsed): Promise<string> {
  const payload = JSON.stringify(req);
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
  const resolvedNear =
    existingWords.includes(near) ? near : (existingWords[0] ?? "");
  return {
    x: clamp(x),
    y: clamp(y),
    near: resolvedNear,
    why: why || "Nahe an thematisch verwandten Begriffen platziert.",
  };
}

interface CallClaudeArgs {
  readonly anthropic: Anthropic;
  readonly req: PracticeRequestParsed;
  readonly signal: AbortSignal;
}

export interface ClaudeUsage {
  readonly inputTokens: number | null | undefined;
  readonly outputTokens: number | null | undefined;
  readonly cacheReadInputTokens: number | null | undefined;
  readonly cacheCreationInputTokens: number | null | undefined;
}

export interface CallClaudeResult {
  readonly response: PracticeResponseBody;
  readonly usage: ClaudeUsage;
}

export async function callClaude({
  anthropic,
  req,
  signal,
}: CallClaudeArgs): Promise<CallClaudeResult> {
  const system =
    req.mode === "complete" ? COMPLETE_SYSTEM_PROMPT : PLACE_SYSTEM_PROMPT;

  const result = await anthropic.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: req.mode === "complete" ? 800 : 200,
      temperature: req.mode === "complete" ? 0.4 : 0.1,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserMessage(req) }],
    },
    { signal },
  );

  const text =
    result.content[0]?.type === "text" ? result.content[0].text : "";

  const usage: ClaudeUsage = {
    inputTokens: result.usage?.input_tokens,
    outputTokens: result.usage?.output_tokens,
    cacheReadInputTokens: result.usage?.cache_read_input_tokens,
    cacheCreationInputTokens: result.usage?.cache_creation_input_tokens,
  };

  if (req.mode === "complete") {
    return {
      response: { mode: "complete", text: text.slice(0, MAX_OUTPUT_CHARS) },
      usage,
    };
  }

  const placement = parsePlacement(
    text,
    req.existing.map((p) => p.w),
  );
  return { response: { mode: "place-word", ...placement }, usage };
}

/** Reset in-memory state. Used by unit tests only. */
export function __resetEngineState(): void {
  requestCounts.clear();
  responseCache.clear();
}
