import type Anthropic from "@anthropic-ai/sdk";
import { isAnthropicRuntimeReady } from "@/lib/provider-readiness";

import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import type {
  GradeRubricEntry,
  GradeResponse,
  GradeableKind,
} from "./types";

const HOUR_MS = 3_600_000;

/**
 * All Anthropic-backed AI-native exercises share one fail-closed provider
 * readiness gate covering the feature flag, credentials, DPA/retention
 * declarations, and persistence configuration.
 */
export function isGradeEnabled(): boolean {
  return isAnthropicRuntimeReady();
}

/**
 * Build a rule-based fallback grade response when the feature flag is off or
 * the Anthropic client is unavailable. Returns a structurally valid GradeResponse
 * so the exercise widget can degrade gracefully.
 */
export function buildFallbackGrade(): Omit<GradeResponse, "cached"> {
  return {
    score: 0,
    rubric: [],
    summary:
      "KI-Bewertung ist derzeit nicht verfügbar. Überprüfe deine Antwort selbst anhand der Rubrik.",
  };
}

/** Response cache keyed on caller scope plus request payload hash — 1h TTL. */
interface CachedResponse {
  readonly response: GradeResponse;
  readonly expires: number;
}
const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = HOUR_MS;
const CACHE_MAX_ENTRIES = 500;

export async function hashRequest(
  scope: string,
  kind: string,
  lessonId: string,
  exerciseId: string,
  scenario: string,
  rubric: unknown,
  userInput: unknown,
): Promise<string> {
  const payload = JSON.stringify({
    scope,
    kind,
    lessonId,
    exerciseId,
    scenario,
    rubric,
    userInput,
  });
  const data = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function readCache(key: string): GradeResponse | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return entry.response;
}

export function writeCache(key: string, response: GradeResponse): void {
  responseCache.set(key, {
    response,
    expires: Date.now() + CACHE_TTL_MS,
  });
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

interface RawGrade {
  readonly rubric?: unknown;
  readonly summary?: unknown;
}

/** Parse Haiku's JSON output into a typed GradeResponse. Throws on malformed. */
export function parseGradeJson(
  raw: string,
  expectedRubricIds: readonly string[],
): Omit<GradeResponse, "cached"> {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as RawGrade;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON is not an object");
  }
  if (typeof parsed.summary !== "string") {
    throw new Error("summary is not a string");
  }
  const summary = parsed.summary.trim().slice(0, 250);
  if (!Array.isArray(parsed.rubric)) {
    throw new Error("rubric is not an array");
  }

  if (
    expectedRubricIds.length === 0 ||
    parsed.rubric.length !== expectedRubricIds.length
  ) {
    throw new Error("rubric does not match canonical criteria");
  }

  const rubric: GradeRubricEntry[] = parsed.rubric.map((entry, idx) => {
    const obj = (entry ?? {}) as Record<string, unknown>;
    const expectedId = expectedRubricIds[idx];
    if (obj.id !== expectedId) {
      throw new Error("rubric id/order does not match canonical criteria");
    }
    if (typeof obj.passed !== "boolean") {
      throw new Error("rubric passed is not a boolean");
    }
    if (typeof obj.rationale !== "string") {
      throw new Error("rubric rationale is not a string");
    }
    const id = expectedId;
    const passed = obj.passed;
    const rationale = obj.rationale.trim().slice(0, 140);
    return { id, passed, rationale };
  });

  const score = rubric.filter((entry) => entry.passed).length / rubric.length;

  return {
    score: Math.max(0, Math.min(1, score)),
    rubric,
    summary: summary || "Bewertung abgeschlossen.",
  };
}

interface CallHaikuArgs {
  readonly anthropic: Anthropic;
  readonly kind: GradeableKind;
  readonly scenario: string;
  readonly rubric: unknown;
  readonly rubricIds: readonly string[];
  readonly userInput: unknown;
  readonly signal: AbortSignal;
}

export interface HaikuResult {
  readonly grade: Omit<GradeResponse, "cached">;
  readonly usage: {
    readonly inputTokens: number | null | undefined;
    readonly outputTokens: number | null | undefined;
    readonly cacheReadInputTokens: number | null | undefined;
    readonly cacheCreationInputTokens: number | null | undefined;
  };
}

export async function callHaiku({
  anthropic,
  kind,
  scenario,
  rubric,
  rubricIds,
  userInput,
  signal,
}: CallHaikuArgs): Promise<HaikuResult> {
  const response = await anthropic.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      temperature: 0.1,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: buildUserMessage({ kind, scenario, rubric, userInput }),
        },
      ],
    },
    { signal },
  );

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  const grade = parseGradeJson(text, rubricIds);
  return {
    grade,
    usage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
      cacheReadInputTokens: response.usage?.cache_read_input_tokens,
      cacheCreationInputTokens: response.usage?.cache_creation_input_tokens,
    },
  };
}

/** Reset in-memory state. Used by unit tests only. */
export function __resetEngineState(): void {
  responseCache.clear();
}
