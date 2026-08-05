/**
 * POST /api/ai-native/practice — live-Claude backend for the Practice Room
 * widgets (PromptOrrery, PromptTransform, SemanticSpace).
 *
 * Mirrors `../grade-exercise/route.ts`:
 *  - durable rate limit (20/hr) keyed on a pseudonymous trusted-IP digest
 *  - shared `tryGetAnthropicClient()` (returns null when unconfigured)
 *  - fixed STATIC system prompts (ephemeral-cached); user data goes only in the
 *    DYNAMIC user message, wrapped in XML boundary tags
 *  - input length capped + Zod-validated; model JSON Zod/throw-validated
 *  - NEVER logs the prompt / word (PII) — only mode, tokens, duration, status
 *
 * Provider-backed mode is OFF by default. Unless the complete feature,
 * credential, DPA, retention, and persistence gate is ready, this returns
 * 503 and widgets degrade to the deterministic static quality score.
 */
import { NextResponse } from "next/server";

import { tryGetAnthropicClient } from "@/lib/anthropic";
import {
  hasJsonContentType,
  readBoundedJson,
} from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import {
  callClaude,
  hashRequest,
  isPracticeEnabled,
  readCache,
  writeCache,
} from "./engine";
import type { PracticeError, PracticeResponse } from "./types";
import { practiceRequestSchema } from "./validation";

export const runtime = "edge";

const MAX_BODY_BYTES = 32 * 1024;
const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

function jsonResponse(
  body: PracticeResponse | PracticeError,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_RESPONSE_HEADERS,
  });
}

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();

  if (!hasJsonContentType(req)) {
    return jsonResponse(
      { error: "unsupported_media_type" } satisfies PracticeError,
      415,
    );
  }

  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({
      request: req,
      step: "auth-get-user",
      error,
    });
    return jsonResponse(
      { error: "auth_unavailable" } satisfies PracticeError,
      503,
    );
  }
  const { configured, user, error: authError } = auth;
  if (configured && authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ request: req, step: "auth-get-user", error: authError });
    return jsonResponse(
      { error: "auth_unavailable" } satisfies PracticeError,
      503,
    );
  }
  if (!configured || !user) {
    return jsonResponse(
      {
        error: configured ? "unauthorized" : "auth_not_configured",
      } satisfies PracticeError,
      configured ? 401 : 503,
    );
  }

  if (!isPracticeEnabled()) {
    return jsonResponse(
      { error: "Live-Modus ist nicht aktiviert." } satisfies PracticeError,
      503,
    );
  }

  let withinUserLimit: boolean;
  let withinIpLimit: boolean;
  try {
    withinUserLimit = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "ai-native-practice",
        req,
        user.id,
      ),
      windowSeconds: 3600,
      max: 20,
    });
    withinIpLimit = withinUserLimit
      ? await consumeRateLimit({
          key: await hashedClientRateLimitKey("ai-native-practice", req),
          windowSeconds: 3600,
          max: 100,
        })
      : false;
  } catch (rateLimitError) {
    reportApiError({
      request: req,
      step: "rate-limit",
      error: rateLimitError,
    });
    return jsonResponse(
      { error: "Anfragelimit ist vorübergehend nicht verfügbar." } satisfies PracticeError,
      503,
    );
  }
  if (!withinUserLimit || !withinIpLimit) {
    return jsonResponse(
      {
        error: "Zu viele Anfragen. Versuch's in einer Stunde erneut.",
      } satisfies PracticeError,
      429,
    );
  }

  let body;
  try {
    body = await readBoundedJson(req, MAX_BODY_BYTES);
  } catch (error) {
    reportApiError({
      request: req,
      step: "unhandled",
      error,
    });
    return jsonResponse(
      { error: "Live-Modus fehlgeschlagen." } satisfies PracticeError,
      500,
    );
  }
  if (!body.ok && body.error === "body_too_large") {
    return jsonResponse(
      { error: "Anfrage zu groß." } satisfies PracticeError,
      413,
    );
  }
  if (!body.ok) {
    return jsonResponse(
      { error: "Ungültiger JSON-Body." } satisfies PracticeError,
      400,
    );
  }

  const parsed = practiceRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Validierung fehlgeschlagen." } satisfies PracticeError,
      400,
    );
  }
  const request = parsed.data;

  let cacheKey: string;
  try {
    cacheKey = await hashRequest(user.id, request);
  } catch (error) {
    reportApiError({
      request: req,
      step: "unhandled",
      error,
      extra: { mode: request.mode },
    });
    return jsonResponse(
      { error: "Live-Modus fehlgeschlagen." } satisfies PracticeError,
      500,
    );
  }
  const cached = readCache(cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  const anthropic = tryGetAnthropicClient();
  if (!anthropic) {
    return jsonResponse(
      { error: "Live-Modus ist nicht konfiguriert." } satisfies PracticeError,
      503,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {

    const { response, usage } = await callClaude({
      anthropic,
      req: request,
      signal: controller.signal,
    });

    const result: PracticeResponse = { ...response, cached: false };
    writeCache(cacheKey, result);

    // PII hygiene: never log the prompt/word — only mode + token accounting.
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        route: "ai-native/practice",
        status: "success",
        mode: request.mode,
        durationMs: Date.now() - start,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadInputTokens: usage.cacheReadInputTokens,
        cacheCreationInputTokens: usage.cacheCreationInputTokens,
      }),
    );

    return jsonResponse(result);
  } catch (err) {
    // PII hygiene preserved: mode + duration only, never the prompt/word.
    reportApiError({
      request: req,
      step: "llm-call",
      error: err,
      extra: { mode: request.mode, durationMs: Date.now() - start },
    });
    return jsonResponse(
      { error: "Live-Modus fehlgeschlagen." } satisfies PracticeError,
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
}
