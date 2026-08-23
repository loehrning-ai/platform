/**
 * Structured API error reporting (performance hardening).
 *
 * One console.error JSON line (greppable in Vercel logs) + one Sentry
 * captureException with {route, step} tags. Safe in BOTH node and edge
 * runtimes, and guaranteed to never throw — when SENTRY_DSN is unset the
 * SDK is a no-op client, and every capture is wrapped defensively so
 * logging can never break a response path.
 */
import * as Sentry from "@sentry/nextjs";
import { writeSafeApiErrorLog } from "./server-log-privacy";

export interface ApiErrorReport {
  /** Route path; derived from `request` URL pathname when omitted. */
  route?: string;
  /** Short stable step name, e.g. "rate-limit", "supabase-insert",
   * "resend-send", "llm-call", "upstream-proxy", "unhandled". */
  step: string;
  error: unknown;
  request?: Request;
  /** Extra structured context (durationMs, status, ...). Unknown keys and
   * values outside the stable enums below are discarded. */
  extra?: Record<string, unknown>;
}

const SAFE_EXTRA_KEYS = new Set([
  "durationMs",
  "status",
  "upstreamStatus",
  "code",
  "mode",
  "kind",
]);
const SAFE_ROUTES = new Set([
  "unknown",
  "/api/account/delete",
  "/api/account/export",
  "/api/account/reset-progress",
  "/api/ai-native/grade-exercise",
  "/api/ai-native/practice",
  "/api/course-workspace/terminal",
  "/api/buecher/[slug]/download.pdf",
  "/api/feedback",
  "/api/progress",
  "/auth/logout",
  "/konto",
]);
const SAFE_STEPS = new Set([
  "unknown",
  "account-delete",
  "assessment-read",
  "auth-clear-session",
  "auth-create-client",
  "auth-get-session",
  "auth-get-user",
  "auth-revoke-sessions",
  "auth-sign-out",
  "auth-verify-session",
  "llm-call",
  "pdf-generate",
  "rate-limit",
  "sandbox-run",
  "resend-send",
  "retention-prune",
  "supabase-delete",
  "supabase-insert",
  "supabase-read",
  "supabase-write",
  "unhandled",
  "upstream-proxy",
]);
const SAFE_ERROR_NAMES = new Set([
  "AbortError",
  "AggregateError",
  "AuthApiError",
  "AuthSessionMissingError",
  "DOMException",
  "Error",
  "EvalError",
  "PostgrestError",
  "RangeError",
  "RateLimitUnavailableError",
  "SyntheticTerminalExecutionError",
  "PracticeProviderError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "UnknownError",
]);
const SAFE_MODES = new Set(["complete", "place-word"]);
const SAFE_KINDS = new Set([
  "exercise-fix-prompt",
  "exercise-rctfc-checklist",
  "exercise-free-response",
]);

/** Generate a server-owned correlation ID. Incoming request headers are
 * attacker-controlled and must not be promoted into logs. */
export function requestIdFrom(_request?: Request): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "unknown";
  }
}

function safeRoute(value: unknown): string {
  return typeof value === "string" && SAFE_ROUTES.has(value)
    ? value
    : "unknown";
}

function validatedStep(value: unknown): string {
  return typeof value === "string" && SAFE_STEPS.has(value)
    ? value
    : "unknown";
}

function safeErrorName(value: unknown): string {
  return typeof value === "string" && SAFE_ERROR_NAMES.has(value)
    ? value
    : "UnknownError";
}

function safeErrorCode(value: unknown): string {
  if (value === "RATE_LIMIT_UNAVAILABLE") return value;
  return typeof value === "string" && /^PGRST[0-9]{3}$/.test(value)
    ? value
    : "unknown";
}

function readSafeErrorField(error: unknown, field: string): unknown {
  if (typeof error !== "object" || error === null) return undefined;
  try {
    return Reflect.get(error, field);
  } catch {
    return undefined;
  }
}

function safeErrorMetadata(error: unknown): {
  errorName: string;
  errorCode: string;
  errorStatus?: number;
} {
  try {
    const name = readSafeErrorField(error, "name");
    const code = readSafeErrorField(error, "code");
    const status = readSafeErrorField(error, "status");
    return {
      errorName: safeErrorName(name),
      errorCode: safeErrorCode(code),
      ...(typeof status === "number" && Number.isInteger(status) && status >= 100
        && status <= 599
        ? { errorStatus: status }
        : {}),
    };
  } catch {
    return { errorName: "UnknownError", errorCode: "unknown" };
  }
}

function safeExtra(extra?: Record<string, unknown>): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (!extra) return result;
  try {
    for (const [key, value] of Object.entries(extra)) {
      if (!SAFE_EXTRA_KEYS.has(key)) continue;
      if (
        key === "durationMs" &&
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
      ) {
        result[key] = value;
      } else if (
        (key === "status" || key === "upstreamStatus") &&
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 100 &&
        value <= 599
      ) {
        result[key] = value;
      } else if (key === "code") {
        const code = safeErrorCode(value);
        if (code !== "unknown") result[key] = code;
      } else if (
        key === "mode" &&
        typeof value === "string" &&
        SAFE_MODES.has(value)
      ) {
        result[key] = value;
      } else if (
        key === "kind" &&
        typeof value === "string" &&
        SAFE_KINDS.has(value)
      ) {
        result[key] = value;
      }
    }
  } catch {
    return {};
  }
  return result;
}

export function reportApiError(opts: ApiErrorReport): void {
  const { step, error, request, extra } = opts;
  let route = opts.route ?? "unknown";
  if (!opts.route && request) {
    try {
      route = new URL(request.url).pathname;
    } catch {
      route = "unknown";
    }
  }
  route = safeRoute(route);
  const safeStep = validatedStep(step);
  const requestId = requestIdFrom(request);
  const metadata = safeErrorMetadata(error);
  const context = safeExtra(extra);
  const event = {
    route,
    step: safeStep,
    requestId,
    ...metadata,
    ...context,
  };
  try {
    writeSafeApiErrorLog(event);
  } catch {
    // Logging must never break a response path.
  }
  try {
    // Never forward the original object, message, or stack: provider and
    // database errors can contain learner text, emails, tokens, or row data.
    const sanitizedError = new Error(
      `API failure:${safeStep}:${metadata.errorCode}`,
    );
    sanitizedError.name = metadata.errorName;
    Sentry.captureException(sanitizedError, {
      tags: {
        route,
        step: safeStep,
        errorCode: metadata.errorCode,
        errorName: metadata.errorName,
      },
      extra: event,
    });
  } catch {
    // Sentry no-op/unset/edge quirks must never break the response path.
  }
}
