/**
 * POST /api/ai-native/practice — provider-backed Practice Room execution
 * widgets (PromptOrrery, PromptTransform, SemanticSpace).
 *
 * Mirrors `../grade-exercise/route.ts`:
 *  - durable rate limit (20/hr) keyed on a pseudonymous trusted-IP digest
 *  - exact server allowlist for provider/model selection
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

import { hasJsonContentType, readBoundedJson } from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumePairedUsageBudget,
  consumeMultiRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  practiceModelAllowlistDecision,
  practiceGlobalDailyTokenBudget,
  practiceUserDailyTokenBudget,
} from "@/lib/provider-readiness";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import {
  callPracticeModel,
  hashRequest,
  isPracticeEnabled,
  readCache,
  reservedTokenBudget,
  writeCache,
} from "./engine";
import {
  isPracticeProviderError,
  type PracticeProviderFailureKind,
} from "./provider-adapter";
import type {
  PracticeError,
  PracticeErrorCode,
  PracticeResponse,
} from "./types";
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
      {
        code: "unsupported_media_type",
        error: "unsupported_media_type",
      } satisfies PracticeError,
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
      {
        code: "auth_unavailable",
        error: "auth_unavailable",
      } satisfies PracticeError,
      503,
    );
  }
  const { configured, user, error: authError } = auth;
  if (configured && authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ request: req, step: "auth-get-user", error: authError });
    return jsonResponse(
      {
        code: "auth_unavailable",
        error: "auth_unavailable",
      } satisfies PracticeError,
      503,
    );
  }
  if (!configured || !user) {
    return jsonResponse(
      {
        code: configured ? "unauthorized" : "auth_not_configured",
        error: configured ? "unauthorized" : "auth_not_configured",
      } satisfies PracticeError,
      configured ? 401 : 503,
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
      {
        code: "request_read_failed",
        error: "request_read_failed",
      } satisfies PracticeError,
      500,
    );
  }
  if (!body.ok && body.error === "body_too_large") {
    return jsonResponse(
      {
        code: "request_too_large",
        error: "request_too_large",
      } satisfies PracticeError,
      413,
    );
  }
  if (!body.ok) {
    return jsonResponse(
      { code: "invalid_json", error: "invalid_json" } satisfies PracticeError,
      400,
    );
  }

  const parsed = practiceRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonResponse(
      {
        code: "validation_failed",
        error: "validation_failed",
      } satisfies PracticeError,
      400,
    );
  }
  const request = parsed.data;

  if (process.env.AI_NATIVE_PRACTICE_ENABLED !== "true") {
    return jsonResponse(
      {
        code: "practice_disabled",
        error: practiceRouteMessage(request.locale, "disabled"),
      } satisfies PracticeError,
      503,
    );
  }

  const userTokenBudget = practiceUserDailyTokenBudget();
  const globalTokenBudget = practiceGlobalDailyTokenBudget();
  if (userTokenBudget === null || globalTokenBudget === null) {
    return jsonResponse(
      {
        code: "budget_not_configured",
        error: practiceRouteMessage(request.locale, "budget_not_configured"),
      } satisfies PracticeError,
      503,
    );
  }

  const allowlistDecision = practiceModelAllowlistDecision(request.model);
  if (allowlistDecision === "denied") {
    return jsonResponse(
      {
        code: "model_not_allowed",
        error: practiceRouteMessage(request.locale, "model_not_allowed"),
      } satisfies PracticeError,
      503,
    );
  }

  if (allowlistDecision === "invalid" || !isPracticeEnabled(request.model)) {
    return jsonResponse(
      {
        code: "model_not_ready",
        error: practiceRouteMessage(request.locale, "model_not_ready"),
      } satisfies PracticeError,
      503,
    );
  }

  let withinRequestLimits: boolean;
  try {
    withinRequestLimits = await consumeMultiRateLimit({
      windowSeconds: 3600,
      entries: [
        {
          key: await hashedAuthenticatedRateLimitKey(
            "ai-native-practice",
            req,
            user.id,
          ),
          max: 20,
        },
        {
          key: await hashedClientRateLimitKey("ai-native-practice", req),
          max: 100,
        },
      ],
    });
  } catch (rateLimitError) {
    reportApiError({
      request: req,
      step: "rate-limit",
      error: rateLimitError,
    });
    return jsonResponse(
      {
        code: "rate_limit_unavailable",
        error: practiceRouteMessage(request.locale, "rate_limit_unavailable"),
      } satisfies PracticeError,
      503,
    );
  }
  if (!withinRequestLimits) {
    return jsonResponse(
      {
        code: "rate_limited",
        error: practiceRouteMessage(request.locale, "rate_limited"),
      } satisfies PracticeError,
      429,
    );
  }

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
      {
        code: "request_hash_failed",
        error: practiceRouteMessage(request.locale, "request_hash_failed"),
      } satisfies PracticeError,
      500,
    );
  }
  const cached = readCache(cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  const tokenReservation = reservedTokenBudget(request);
  let withinTokenBudget: boolean;
  try {
    withinTokenBudget = await consumePairedUsageBudget({
      callerKey: await hashedAuthenticatedRateLimitKey(
        "ai-model-token-day",
        req,
        user.id,
      ),
      globalKey: "ai-practice-global-token-day-v1",
      windowSeconds: 86_400,
      callerMax: userTokenBudget,
      globalMax: globalTokenBudget,
      cost: tokenReservation,
    });
  } catch (budgetError) {
    reportApiError({
      request: req,
      step: "rate-limit",
      error: budgetError,
      extra: { mode: request.mode },
    });
    return jsonResponse(
      {
        code: "budget_unavailable",
        error: practiceRouteMessage(request.locale, "budget_unavailable"),
      } satisfies PracticeError,
      503,
    );
  }
  if (!withinTokenBudget) {
    return jsonResponse(
      {
        code: "budget_exhausted",
        error: practiceRouteMessage(request.locale, "budget_exhausted"),
      } satisfies PracticeError,
      429,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const { response, usage } = await callPracticeModel({
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
        model: request.model,
        provider: response.provider,
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
    const providerFailure = isPracticeProviderError(err) ? err.kind : null;
    const status = providerFailureStatus(providerFailure);
    return jsonResponse(
      {
        code: providerFailureCode(providerFailure),
        error: providerFailureMessage(request.locale, providerFailure),
      } satisfies PracticeError,
      status,
    );
  } finally {
    clearTimeout(timeout);
  }
}

type PracticeRouteMessageKey =
  | "disabled"
  | "model_not_allowed"
  | "model_not_ready"
  | "rate_limit_unavailable"
  | "rate_limited"
  | "request_hash_failed"
  | "budget_not_configured"
  | "budget_unavailable"
  | "budget_exhausted";

function practiceRouteMessage(
  locale: "de" | "en",
  key: PracticeRouteMessageKey,
): string {
  const messages =
    locale === "de"
      ? {
          disabled: "Live-Modus ist nicht aktiviert.",
          model_not_allowed:
            "Das angeforderte Modell ist durch die Kursrichtlinie nicht freigegeben.",
          model_not_ready:
            "Das angeforderte Modell ist betrieblich nicht einsatzbereit.",
          rate_limit_unavailable:
            "Anfragelimit ist vorübergehend nicht verfügbar.",
          rate_limited:
            "Zu viele Anfragen. Versuche es in einer Stunde erneut.",
          request_hash_failed: "Live-Modus fehlgeschlagen.",
          budget_not_configured: "Das Nutzungsbudget ist nicht konfiguriert.",
          budget_unavailable:
            "Das Nutzungsbudget ist vorübergehend nicht verfügbar.",
          budget_exhausted: "Das Tagesbudget für Modell-Tokens ist erreicht.",
        }
      : {
          disabled: "Live mode is not enabled.",
          model_not_allowed:
            "The requested model is not enabled by the course policy.",
          model_not_ready: "The requested model is not operationally ready.",
          rate_limit_unavailable:
            "The request limit is temporarily unavailable.",
          rate_limited: "Too many requests. Try again in one hour.",
          request_hash_failed: "Live mode failed.",
          budget_not_configured: "The usage budget is not configured.",
          budget_unavailable: "The usage budget is temporarily unavailable.",
          budget_exhausted: "The daily model-token budget is exhausted.",
        };
  return messages[key];
}

function providerFailureStatus(
  kind: PracticeProviderFailureKind | null,
): number {
  if (kind === "timeout") return 504;
  if (kind === "bad_request" || kind === "malformed_response") return 502;
  if (
    kind === "not_ready" ||
    kind === "payment_required" ||
    kind === "rate_limited" ||
    kind === "unavailable"
  ) {
    return 503;
  }
  return 500;
}

function providerFailureCode(
  kind: PracticeProviderFailureKind | null,
): PracticeErrorCode {
  if (kind === "timeout") return "provider_timeout";
  if (kind === "payment_required") return "provider_payment_required";
  if (kind === "rate_limited") return "provider_rate_limited";
  if (kind === "not_ready") return "provider_not_ready";
  if (kind === "unavailable") return "provider_unavailable";
  if (kind === "bad_request") return "provider_bad_request";
  if (kind === "malformed_response") {
    return "provider_malformed_response";
  }
  return "provider_failed";
}

function providerFailureMessage(
  locale: "de" | "en",
  kind: PracticeProviderFailureKind | null,
): string {
  const messages =
    locale === "de"
      ? {
          timeout: "Der Provider hat das Zeitlimit überschritten.",
          payment_required: "Das Provider-Budget ist ausgeschöpft.",
          rate_limited: "Der Provider ist vorübergehend ausgelastet.",
          not_ready: "Das Modell ist nicht einsatzbereit.",
          unavailable: "Der Provider ist vorübergehend nicht verfügbar.",
          generic: "Der Providerlauf ist fehlgeschlagen.",
        }
      : {
          timeout: "The provider exceeded the time limit.",
          payment_required: "The provider budget is exhausted.",
          rate_limited: "The provider is temporarily rate limited.",
          not_ready: "The model is not ready.",
          unavailable: "The provider is temporarily unavailable.",
          generic: "The provider run failed.",
        };
  if (kind === "timeout") return messages.timeout;
  if (kind === "payment_required") return messages.payment_required;
  if (kind === "rate_limited") return messages.rate_limited;
  if (kind === "not_ready") return messages.not_ready;
  if (kind === "unavailable") return messages.unavailable;
  return messages.generic;
}
