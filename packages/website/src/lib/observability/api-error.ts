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

export interface ApiErrorReport {
  /** Route path; derived from `request` URL pathname when omitted. */
  route?: string;
  /** Short stable step name, e.g. "rate-limit", "supabase-insert",
   * "resend-send", "llm-call", "upstream-proxy", "unhandled". */
  step: string;
  error: unknown;
  request?: Request;
  /** Extra structured context (durationMs, status, ...). NEVER include
   * PII — no emails, names, or free-text user input. A `requestId` here
   * overrides the derived one (proxy correlation). */
  extra?: Record<string, unknown>;
}

/** x-request-id from the incoming request, else a fresh UUID. Exported so
 * proxy routes can forward the same id upstream for request correlation
 * and report it via `extra.requestId`. */
export function requestIdFrom(request?: Request): string {
  try {
    return request?.headers.get("x-request-id") ?? crypto.randomUUID();
  } catch {
    return "unknown";
  }
}

/** Human-readable message without serializing whole error objects
 * (Supabase PostgrestError etc. expose `.message` but are not Errors). */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" && error !== null && "message" in error
    && typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  try {
    return String(error);
  } catch {
    return "unknown";
  }
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
  const requestId = requestIdFrom(request);
  try {
    // Spread last so callers can override requestId (proxy correlation).
    console.error(
      JSON.stringify({ route, step, requestId, error: errorMessage(error), ...extra }),
    );
  } catch {
    // Circular extras must never crash a handler.
  }
  try {
    Sentry.captureException(error, { tags: { route, step }, extra: { requestId, ...extra } });
  } catch {
    // Sentry no-op/unset/edge quirks must never break the response path.
  }
}
