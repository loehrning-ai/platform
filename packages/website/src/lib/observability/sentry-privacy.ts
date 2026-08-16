import { COURSE_SLUGS } from "@/lib/course/types";

const TOP_LEVEL_COURSE_SLUGS = new Set([
  "ki-fuehrerschein",
  "ki-und-gesellschaft",
  "eu-ai-act-kurs",
  "ai-native",
]);

export function certificateVerificationPath(courseSlug: string): string {
  return TOP_LEVEL_COURSE_SLUGS.has(courseSlug)
    ? `/${courseSlug}/verifizierung`
    : `/kurse/open-source/${courseSlug}/verifizierung`;
}

const VERIFICATION_PATHS = COURSE_SLUGS.map(certificateVerificationPath);
const VERIFICATION_PATH_ALTERNATION = VERIFICATION_PATHS.join("|");
const VERIFICATION_PATH = new RegExp(
  `^(?:${VERIFICATION_PATH_ALTERNATION})/?$`,
);
const VERIFICATION_REFERENCE = new RegExp(
  `(?:^|[^a-z0-9_-])(?:https?://[^/\\s"'<>]+)?(?:${VERIFICATION_PATH_ALTERNATION})(?:[/?#\\s"'<>),.;!?]|$)`,
  "i",
);

type UnknownRecord = Record<string, unknown>;

const SAFE_EVENT_LEVELS = new Set([
  "fatal",
  "error",
  "warning",
  "log",
  "info",
  "debug",
]);
const SAFE_ENVIRONMENTS = new Set([
  "production",
  "preview",
  "development",
  "test",
]);
const SAFE_ERROR_TYPES = new Set([
  "AbortError",
  "AggregateError",
  "ApplicationError",
  "AuthApiError",
  "AuthSessionMissingError",
  "DOMException",
  "Error",
  "EvalError",
  "PostgrestError",
  "PracticeProviderError",
  "RangeError",
  "RateLimitUnavailableError",
  "ReferenceError",
  "SyntheticTerminalExecutionError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "UnknownError",
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
const SAFE_CLIENT_BOUNDARIES = new Set([
  "unknown-client-boundary",
  "app-root",
  "app-global",
  "app-blog",
  "app-books",
  "demos-index",
  "demos-detail",
  "ai-native-course",
  "ai-native-module",
  "ai-native-lesson",
  "eu-ai-act-course",
  "eu-ai-act-block",
  "ki-fuehrerschein-course",
  "ki-fuehrerschein-block",
  "ki-und-gesellschaft-course",
  "ki-und-gesellschaft-block",
  "data-engineering-chapter",
  "ai-native-exercise",
  "workshop-quiz",
]);
const SAFE_SPAN_STATUS = new Set([
  "ok",
  "cancelled",
  "unknown_error",
  "invalid_argument",
  "deadline_exceeded",
  "not_found",
  "already_exists",
  "permission_denied",
  "resource_exhausted",
  "failed_precondition",
  "aborted",
  "out_of_range",
  "unimplemented",
  "internal_error",
  "unavailable",
  "data_loss",
  "unauthenticated",
]);
const EVENT_ID = /^[0-9a-f]{32}$/i;
const TRACE_ID = /^[0-9a-f]{32}$/i;
const SPAN_ID = /^[0-9a-f]{16}$/i;
const DEBUG_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const SOURCE_BASENAME = /^[A-Za-z0-9_.-]{1,160}\.(?:[cm]?[jt]sx?|wasm)$/;
const ERROR_ONLY_INTEGRATIONS = new Set([
  "BrowserApiErrors",
  "Dedupe",
  "FunctionToString",
  "GlobalHandlers",
  "InboundFilters",
  "LinkedErrors",
  "NodeSystemError",
]);

export function errorOnlySentryIntegrations<T extends { readonly name: string }>(
  defaults: readonly T[],
): T[] {
  return defaults.filter(
    (integration) => ERROR_ONLY_INTEGRATIONS.has(integration.name),
  );
}

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
  if (parsed && VERIFICATION_PATH.test(parsed.pathname)) return true;
  if (parsed) {
    try {
      if (VERIFICATION_PATH.test(decodeURIComponent(parsed.pathname))) {
        return true;
      }
    } catch {
      // A malformed route segment is not a canonical application route.
    }
  }
  if (VERIFICATION_REFERENCE.test(value)) return true;
  try {
    return VERIFICATION_REFERENCE.test(decodeURIComponent(value));
  } catch {
    // A malformed suffix cannot override a canonical path matched above.
    return false;
  }
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

function safeFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function safeInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : undefined;
}

function replaceRecord(target: UnknownRecord, source: UnknownRecord): void {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, source);
}

function safeSourceBasename(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = asUrl(value);
  const withoutPrivateSuffix = parsed
    ? parsed.pathname
    : value.split(/[?#]/u, 1)[0]?.replaceAll("\\", "/");
  const basename = withoutPrivateSuffix?.split("/").at(-1);
  return basename && SOURCE_BASENAME.test(basename) ? basename : undefined;
}

function sanitizeStacktrace(stacktrace: unknown): UnknownRecord | undefined {
  if (!stacktrace || typeof stacktrace !== "object") return undefined;
  const frames = (stacktrace as UnknownRecord).frames;
  if (!Array.isArray(frames)) return undefined;

  const sanitizedFrames = frames.flatMap((frame): UnknownRecord[] => {
    if (!frame || typeof frame !== "object") return [];
    const source = frame as UnknownRecord;
    const sanitized: UnknownRecord = {};
    const filename = safeSourceBasename(source.filename ?? source.abs_path);
    if (filename) sanitized.filename = filename;
    const line = safeInteger(source.lineno, 0, 10_000_000);
    const column = safeInteger(source.colno, 0, 10_000_000);
    if (line !== undefined) sanitized.lineno = line;
    if (column !== undefined) sanitized.colno = column;
    if (typeof source.in_app === "boolean") sanitized.in_app = source.in_app;
    if (
      typeof source.debug_id === "string" &&
      DEBUG_ID.test(source.debug_id)
    ) {
      sanitized.debug_id = source.debug_id;
    }
    return [sanitized];
  });

  return sanitizedFrames.length > 0 ? { frames: sanitizedFrames } : undefined;
}

function safeErrorType(value: unknown): string {
  return typeof value === "string" && SAFE_ERROR_TYPES.has(value)
    ? value
    : "ApplicationError";
}

function sanitizeException(exception: unknown): UnknownRecord | undefined {
  if (!exception || typeof exception !== "object") return undefined;
  const values = (exception as UnknownRecord).values;
  if (!Array.isArray(values)) return undefined;

  const sanitizedValues = values.flatMap((value): UnknownRecord[] => {
    if (!value || typeof value !== "object") return [];
    const source = value as UnknownRecord;
    const type = safeErrorType(source.type);
    const sanitized: UnknownRecord = { type, value: type };
    const stacktrace = sanitizeStacktrace(source.stacktrace);
    if (stacktrace) sanitized.stacktrace = stacktrace;
    if (source.mechanism && typeof source.mechanism === "object") {
      const mechanism = source.mechanism as UnknownRecord;
      sanitized.mechanism = {
        type: "generic",
        ...(typeof mechanism.handled === "boolean"
          ? { handled: mechanism.handled }
          : {}),
        ...(typeof mechanism.synthetic === "boolean"
          ? { synthetic: mechanism.synthetic }
          : {}),
      };
    }
    return [sanitized];
  });

  return sanitizedValues.length > 0 ? { values: sanitizedValues } : undefined;
}

function safeErrorCode(value: unknown): string | undefined {
  if (value === "unknown" || value === "RATE_LIMIT_UNAVAILABLE") return value;
  return typeof value === "string" && /^PGRST[0-9]{3}$/.test(value)
    ? value
    : undefined;
}

function safeTagValue(key: string, value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  switch (key) {
    case "route":
      return SAFE_ROUTES.has(value) ? value : undefined;
    case "step":
      return SAFE_STEPS.has(value) ? value : undefined;
    case "errorCode":
      return safeErrorCode(value);
    case "errorName":
      return SAFE_ERROR_TYPES.has(value) ? value : undefined;
    case "client.boundary":
      return SAFE_CLIENT_BOUNDARIES.has(value) ? value : undefined;
    case "next.digest": {
      if (!/^(?:0|[1-9][0-9]{0,9})$/.test(value)) return undefined;
      const digest = Number(value);
      return Number.isInteger(digest) && digest <= 0xffff_ffff
        ? value
        : undefined;
    }
    default:
      return undefined;
  }
}

function sanitizeTags(tags: unknown): UnknownRecord | undefined {
  if (!tags || typeof tags !== "object") return undefined;
  const sanitized: UnknownRecord = {};
  for (const [key, value] of Object.entries(tags as UnknownRecord)) {
    const safeValue = safeTagValue(key, value);
    if (safeValue !== undefined) sanitized[key] = safeValue;
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeRequest(request: unknown): UnknownRecord | undefined {
  if (!request || typeof request !== "object") return undefined;
  const method = (request as UnknownRecord).method;
  return typeof method === "string" &&
    /^(?:GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/.test(method)
    ? { method }
    : undefined;
}

function sanitizeDebugMeta(debugMeta: unknown): UnknownRecord | undefined {
  if (!debugMeta || typeof debugMeta !== "object") return undefined;
  const images = (debugMeta as UnknownRecord).images;
  if (!Array.isArray(images)) return undefined;
  const sanitizedImages = images.flatMap((image): UnknownRecord[] => {
    if (!image || typeof image !== "object") return [];
    const source = image as UnknownRecord;
    const codeFile = safeSourceBasename(source.code_file);
    if (
      source.type !== "sourcemap" ||
      !codeFile ||
      typeof source.debug_id !== "string" ||
      !DEBUG_ID.test(source.debug_id)
    ) {
      return [];
    }
    return [{
      type: "sourcemap",
      code_file: codeFile,
      debug_id: source.debug_id,
    }];
  });
  return sanitizedImages.length > 0 ? { images: sanitizedImages } : undefined;
}

export function prepareSentryEvent<T extends object>(
  event: T,
  currentHref?: string,
): T | null {
  try {
    if (
      isCertificateVerificationUrl(currentHref) ||
      containsVerificationReference(event)
    ) {
      return null;
    }

    const record = event as UnknownRecord;
    // Runtime performance, replay, feedback, and profile payloads are outside
    // the configured error-diagnosis purpose. Drop them even if an SDK upgrade
    // or inherited trace tries to create one.
    if (record.type !== undefined) return null;

    const sanitized: UnknownRecord = {};
    if (typeof record.event_id === "string" && EVENT_ID.test(record.event_id)) {
      sanitized.event_id = record.event_id;
    }
    const timestamp = safeFiniteNumber(record.timestamp);
    if (timestamp !== undefined) sanitized.timestamp = timestamp;
    if (
      typeof record.level === "string" &&
      SAFE_EVENT_LEVELS.has(record.level)
    ) {
      sanitized.level = record.level;
    }
    if (record.platform === "javascript" || record.platform === "node") {
      sanitized.platform = record.platform;
    }
    if (
      typeof record.release === "string" &&
      /^[0-9a-f]{7,64}$/i.test(record.release)
    ) {
      sanitized.release = record.release;
    }
    if (
      typeof record.environment === "string" &&
      SAFE_ENVIRONMENTS.has(record.environment)
    ) {
      sanitized.environment = record.environment;
    }

    const request = sanitizeRequest(record.request);
    if (request) sanitized.request = request;
    const exception = sanitizeException(record.exception);
    if (exception) sanitized.exception = exception;
    if (typeof record.message === "string" || !exception) {
      sanitized.message = "application-error";
    }
    if (typeof record.transaction === "string") {
      sanitized.transaction = "application-route";
    }
    const tags = sanitizeTags(record.tags);
    if (tags) sanitized.tags = tags;
    const debugMeta = sanitizeDebugMeta(record.debug_meta);
    if (debugMeta) sanitized.debug_meta = debugMeta;

    replaceRecord(record, sanitized);
    return event;
  } catch {
    // A hostile proxy/getter or an unexpected SDK schema must fail closed.
    return null;
  }
}

export function prepareSentryBreadcrumb<T extends object>(
  _breadcrumb: T,
  _currentHref?: string,
): null {
  // Automatic browser breadcrumbs include clicks, key presses, console
  // arguments, request URLs, and navigation history. None is required for the
  // error-only purpose, so every breadcrumb is rejected.
  return null;
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
  const record = span as UnknownRecord;
  const sanitized: UnknownRecord = {};
  try {
    if (typeof record.trace_id === "string" && TRACE_ID.test(record.trace_id)) {
      sanitized.trace_id = record.trace_id;
    }
    if (typeof record.span_id === "string" && SPAN_ID.test(record.span_id)) {
      sanitized.span_id = record.span_id;
    }
    if (
      typeof record.parent_span_id === "string" &&
      SPAN_ID.test(record.parent_span_id)
    ) {
      sanitized.parent_span_id = record.parent_span_id;
    }
    const startTimestamp = safeFiniteNumber(record.start_timestamp);
    const endTimestamp = safeFiniteNumber(record.timestamp);
    if (startTimestamp !== undefined) {
      sanitized.start_timestamp = startTimestamp;
    }
    if (endTimestamp !== undefined) sanitized.timestamp = endTimestamp;
    if (
      typeof record.status === "string" &&
      SAFE_SPAN_STATUS.has(record.status)
    ) {
      sanitized.status = record.status;
    }
    const verificationRelated =
      isCertificateVerificationUrl(currentHref) ||
      containsVerificationReference(span);
    sanitized.description = verificationRelated
      ? "certificate-verification-redacted"
      : "application-operation";
    sanitized.op = verificationRelated ? "navigation" : "application";
    sanitized.data = {};
    replaceRecord(record, sanitized);
  } catch {
    // beforeSendSpan cannot drop a span. Remove everything when an unexpected
    // object cannot be inspected safely.
    try {
      replaceRecord(record, {
        description: "application-operation",
        op: "application",
        data: {},
      });
    } catch {
      // The SDK will discard an unusable hostile object.
    }
  }
  return span;
}
