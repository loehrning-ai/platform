import { COURSE_SLUGS } from "@/lib/course/types";

// Derived from the canonical COURSE_SLUGS union so a
// course outside the original 4 still gets its verification route redacted
// — every course slug is a bare kebab-case identifier (letters, digits,
// hyphens only), so no regex-escaping is needed for the alternation.
const COURSE_SLUG_ALTERNATION = COURSE_SLUGS.join("|");
const VERIFICATION_PATH = new RegExp(
  `^/(?:${COURSE_SLUG_ALTERNATION})/verifizierung/?$`,
);
const VERIFICATION_REFERENCE = new RegExp(
  `(?:^|[^a-z0-9_-])(?:https?://[^/\\s"'<>]+)?/(?:${COURSE_SLUG_ALTERNATION})/verifizierung(?:[/?#\\s"'<>),.;!?]|$)`,
  "i",
);

type UnknownRecord = Record<string, unknown>;

function asUrl(value: string): URL | null {
  if (!/^(?:https?:\/\/|\/)/i.test(value)) return null;
  try {
    return new URL(value, "https://telemetry.invalid");
  } catch {
    return null;
  }
}

export function isCertificateVerificationUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const parsed = asUrl(value);
  return Boolean(
    (parsed && VERIFICATION_PATH.test(parsed.pathname)) ||
      VERIFICATION_REFERENCE.test(value),
  );
}

export function currentBrowserHref(): string | undefined {
  return typeof globalThis.location?.href === "string"
    ? globalThis.location.href
    : undefined;
}

function containsVerificationReference(
  value: unknown,
  seen = new WeakSet<object>(),
): boolean {
  if (typeof value === "string") return isCertificateVerificationUrl(value);
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => containsVerificationReference(entry, seen));
  }
  return Object.values(value as UnknownRecord).some((entry) =>
    containsVerificationReference(entry, seen),
  );
}

function stripUrlQueryAndFragment(value: string): string {
  const parsed = asUrl(value);
  if (parsed) {
    const absolute = /^https?:\/\//i.test(value);
    return absolute ? `${parsed.origin}${parsed.pathname}` : parsed.pathname;
  }

  // Error messages can embed URLs inside prose. Strip their private suffixes
  // as well instead of sanitizing only structured request.url fields.
  return value.replace(
    /https?:\/\/[^\s"'<>]+|\/[a-z0-9][^\s"'<>]*/gi,
    (candidate) => {
      const trailing = candidate.match(/[),.;!?]+$/)?.[0] ?? "";
      const urlPart = trailing ? candidate.slice(0, -trailing.length) : candidate;
      const embedded = asUrl(urlPart);
      if (!embedded) return candidate;
      const absolute = /^https?:\/\//i.test(urlPart);
      const sanitized = absolute
        ? `${embedded.origin}${embedded.pathname}`
        : embedded.pathname;
      return `${sanitized}${trailing}`;
    },
  );
}

/** Mutates the SDK payload immediately before transmission. */
export function scrubTelemetryPayload<T>(
  payload: T,
  seen = new WeakSet<object>(),
): T {
  if (typeof payload === "string") {
    return stripUrlQueryAndFragment(payload) as T;
  }
  if (!payload || typeof payload !== "object" || seen.has(payload)) {
    return payload;
  }
  seen.add(payload);
  if (Array.isArray(payload)) {
    for (let index = 0; index < payload.length; index += 1) {
      payload[index] = scrubTelemetryPayload(payload[index], seen);
    }
    return payload;
  }
  const record = payload as UnknownRecord;
  for (const [key, value] of Object.entries(record)) {
    record[key] = scrubTelemetryPayload(value, seen);
  }
  return payload;
}

export function prepareSentryEvent<T extends object>(
  event: T,
  currentHref?: string,
): T | null {
  if (
    isCertificateVerificationUrl(currentHref) ||
    containsVerificationReference(event)
  ) {
    return null;
  }

  scrubTelemetryPayload(event);
  const record = event as UnknownRecord;
  const request = record.request as UnknownRecord | undefined;
  if (request) {
    // The RequestData integration attaches full headers and parsed cookies even
    // with sendDefaultPii: false — the Supabase sb-*-auth-token cookie is a
    // session token and must never leave the process.
    delete request.headers;
    delete request.cookies;
  }
  const env = request?.env as UnknownRecord | undefined;
  if (env) delete env.REMOTE_ADDR;
  const user = record.user as UnknownRecord | undefined;
  if (user) delete user.ip_address;
  return event;
}

export function prepareSentryBreadcrumb<T extends object>(
  breadcrumb: T,
  currentHref?: string,
): T | null {
  if (
    isCertificateVerificationUrl(currentHref) ||
    containsVerificationReference(breadcrumb)
  ) {
    return null;
  }
  return scrubTelemetryPayload(breadcrumb);
}

/**
 * `beforeSendSpan` cannot drop spans in Sentry v10. Sampling is disabled on
 * verification routes; this sanitizer is the final defense for an already
 * active trace during client-side navigation.
 */
export function prepareSentrySpan<T extends object>(
  span: T,
  currentHref?: string,
): T {
  if (
    isCertificateVerificationUrl(currentHref) ||
    containsVerificationReference(span)
  ) {
    const record = span as UnknownRecord;
    const traceId = record.trace_id;
    const spanId = record.span_id;
    const parentSpanId = record.parent_span_id;
    for (const key of Object.keys(record)) delete record[key];
    if (traceId) record.trace_id = traceId;
    if (spanId) record.span_id = spanId;
    if (parentSpanId) record.parent_span_id = parentSpanId;
    record.description = "certificate verification route redacted";
    record.op = "navigation";
    record.data = {};
    return span;
  }
  return scrubTelemetryPayload(span);
}
