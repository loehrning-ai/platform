/**
 * Sink for the report-only Content-Security-Policy canary.
 *
 * Browsers POST here on their own, with no session and without reading the
 * response, whenever a document violates the nonce policy the proxy publishes
 * as Content-Security-Policy-Report-Only. The route validates the media type,
 * bounds the body, rate-limits the client, and writes one structured,
 * PII-free line per kept report. Nothing is stored.
 */

import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  cspViolationLogLine,
  isCspReportMediaType,
  isSampledCspViolation,
  parseCspViolations,
} from "./csp-violation";

// The durable limiter and the structured log share the runtime every other
// public API route runs on.
export const runtime = "nodejs";

const ROUTE = "/api/csp-report";

// One report, original policy included, is well under 2 KB. 8 KB leaves room
// for a Reporting API batch and refuses anything that is not one.
const MAX_REPORT_PAYLOAD_BYTES = 8 * 1024;

// Reports arrive in bursts: one document can emit a dozen in the same second,
// and a learner opens many documents in one sitting. Six hundred per client
// per ten minutes absorbs that and still bounds a flood to one line a second.
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX = 600;

const PRIVATE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
});

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: PRIVATE_HEADERS },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isCspReportMediaType(request.headers.get("content-type"))) {
    return jsonError("unsupported_media_type", 415);
  }

  // Durable, forgery-resistant limit keyed on the hashed trusted client IP,
  // consulted before a single body byte is read.
  let allowed: boolean;
  try {
    allowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("csp-report", request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return jsonError("rate_limit_unavailable", 503);
  }
  if (!allowed) {
    return jsonError("rate_limit_exceeded", 429);
  }

  // Bound the streamed bytes themselves: Content-Length is advisory and a
  // report upload may be chunked.
  const body = await readBoundedJson(request, MAX_REPORT_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return jsonError("payload_too_large", 413);
  }
  if (!body.ok) {
    return jsonError("invalid_json", 400);
  }

  const violations = parseCspViolations(body.value);
  if (violations === null) {
    return jsonError("invalid_report", 400);
  }

  for (const violation of violations) {
    // A style report outside its sample is dropped here, whole: no counter
    // moves and no line is written, so a dropped report leaves no trace. The
    // sampleRate on every kept line is what makes the survivors countable.
    if (!isSampledCspViolation(violation)) continue;
    // Every field on this line was rebuilt from an allowlist or reduced to an
    // origin or a path in csp-violation.ts; the raw report never reaches it.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(cspViolationLogLine(violation)));
  }

  return new NextResponse(null, { status: 204, headers: PRIVATE_HEADERS });
}
