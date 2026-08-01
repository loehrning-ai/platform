/**
 * Production Node log boundary.
 *
 * Next.js logs route, render, uncaught-exception, and unhandled-rejection
 * values through `console.error`. Those values may contain request bodies,
 * provider responses, tokens, or learner text and do not pass through Sentry's
 * `beforeSend` hook. In the production Node runtime, replace that raw sink with
 * one fixed marker. Structured API diagnostics use the separately validated
 * writer below.
 */

export const SERVER_ERROR_REDACTED_LINE =
  '{"event":"server-error-redacted"}';
export const SERVER_LOG_PRIVACY_STATE_KEY =
  "loehrning.server-log-privacy.v1";

const SERVER_LOG_PRIVACY_STATE = Symbol.for(SERVER_LOG_PRIVACY_STATE_KEY);
const SERVER_LOG_PRIVACY_STATE_BRAND = Symbol.for(
  "loehrning.server-log-privacy.state-brand.v1",
);
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ROUTES = new Set([
  "unknown",
  "/api/account/delete",
  "/api/account/export",
  "/api/account/reset-progress",
  "/api/ai-native/grade-exercise",
  "/api/ai-native/practice",
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
  "ApplicationError",
  "AuthApiError",
  "AuthSessionMissingError",
  "DOMException",
  "Error",
  "EvalError",
  "PostgrestError",
  "RangeError",
  "RateLimitUnavailableError",
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

type ErrorSink = (message?: unknown, ...optionalParams: unknown[]) => void;
type UnknownRecord = Record<string, unknown>;

export interface SafeApiErrorLog {
  readonly route?: unknown;
  readonly step?: unknown;
  readonly requestId?: unknown;
  readonly errorName?: unknown;
  readonly errorCode?: unknown;
  readonly errorStatus?: unknown;
  readonly durationMs?: unknown;
  readonly status?: unknown;
  readonly upstreamStatus?: unknown;
  readonly code?: unknown;
  readonly mode?: unknown;
  readonly kind?: unknown;
}

interface ServerLogPrivacyState {
  readonly [SERVER_LOG_PRIVACY_STATE_BRAND]: true;
  readonly installed: true;
  readonly guardedError: ErrorSink;
  readonly writeRedactedServerErrorMarker: () => void;
  readonly writeSafeApiErrorLog: (input: unknown) => void;
}

function globalStateRecord(): Record<PropertyKey, unknown> {
  return globalThis as unknown as Record<PropertyKey, unknown>;
}

function currentState(): ServerLogPrivacyState | undefined {
  try {
    const candidate = globalStateRecord()[SERVER_LOG_PRIVACY_STATE];
    if (!candidate || typeof candidate !== "object") return undefined;
    const ownValue = (key: PropertyKey): unknown => {
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
      return descriptor && "value" in descriptor
        ? descriptor.value
        : undefined;
    };
    return ownValue(SERVER_LOG_PRIVACY_STATE_BRAND) === true &&
      ownValue("installed") === true &&
      typeof ownValue("guardedError") === "function" &&
      typeof ownValue("writeRedactedServerErrorMarker") === "function" &&
      typeof ownValue("writeSafeApiErrorLog") === "function"
      ? (candidate as ServerLogPrivacyState)
      : undefined;
  } catch {
    // A corrupt or hostile global Symbol value must not disable installation.
    return undefined;
  }
}

function readField(input: unknown, key: string): unknown {
  if (!input || (typeof input !== "object" && typeof input !== "function")) {
    return undefined;
  }
  try {
    return Reflect.get(input, key);
  } catch {
    return undefined;
  }
}

function safeEnum(
  value: unknown,
  allowed: ReadonlySet<string>,
  fallback: string,
): string {
  return typeof value === "string" && allowed.has(value) ? value : fallback;
}

function safeErrorCode(value: unknown): string {
  if (value === "unknown" || value === "RATE_LIMIT_UNAVAILABLE") return value;
  return typeof value === "string" && /^PGRST[0-9]{3}$/.test(value)
    ? value
    : "unknown";
}

function safeStatus(value: unknown): number | undefined {
  return typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 100 &&
      value <= 599
    ? value
    : undefined;
}

function safeDuration(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function reconstructApiErrorLog(input: unknown): UnknownRecord {
  const requestId = readField(input, "requestId");
  const errorStatus = safeStatus(readField(input, "errorStatus"));
  const durationMs = safeDuration(readField(input, "durationMs"));
  const status = safeStatus(readField(input, "status"));
  const upstreamStatus = safeStatus(readField(input, "upstreamStatus"));
  const code = safeErrorCode(readField(input, "code"));
  const mode = readField(input, "mode");
  const kind = readField(input, "kind");

  const reconstructed = Object.create(null) as UnknownRecord;
  reconstructed.route = safeEnum(
    readField(input, "route"),
    SAFE_ROUTES,
    "unknown",
  );
  reconstructed.step = safeEnum(
    readField(input, "step"),
    SAFE_STEPS,
    "unknown",
  );
  reconstructed.requestId =
    typeof requestId === "string" &&
      (requestId === "unknown" || UUID.test(requestId))
      ? requestId
      : "unknown";
  reconstructed.errorName = safeEnum(
    readField(input, "errorName"),
    SAFE_ERROR_NAMES,
    "UnknownError",
  );
  reconstructed.errorCode = safeErrorCode(readField(input, "errorCode"));
  if (errorStatus !== undefined) reconstructed.errorStatus = errorStatus;
  if (durationMs !== undefined) reconstructed.durationMs = durationMs;
  if (status !== undefined) reconstructed.status = status;
  if (upstreamStatus !== undefined) {
    reconstructed.upstreamStatus = upstreamStatus;
  }
  if (code !== "unknown") reconstructed.code = code;
  if (typeof mode === "string" && SAFE_MODES.has(mode)) {
    reconstructed.mode = mode;
  }
  if (typeof kind === "string" && SAFE_KINDS.has(kind)) {
    reconstructed.kind = kind;
  }
  return reconstructed;
}

function writeLine(sink: ErrorSink, line: string): void {
  try {
    sink(line);
  } catch {
    // Logging must never break a request or error path.
  }
}

function writeSafeApiErrorLogWithSink(
  sink: ErrorSink,
  input: unknown,
): void {
  try {
    writeLine(sink, JSON.stringify(reconstructApiErrorLog(input)));
  } catch {
    // A hostile getter or unexpected runtime object fails to one fixed marker.
    writeLine(sink, SERVER_ERROR_REDACTED_LINE);
  }
}

/**
 * Install the Node production guard. The guarded function deliberately never
 * reads, formats, serializes, or forwards any of its arguments.
 */
export function installProductionServerLogPrivacyBoundary(): boolean {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_RUNTIME !== "nodejs"
  ) {
    return false;
  }

  const existing = currentState();
  if (existing) {
    if (console.error !== existing.guardedError) {
      try {
        console.error = existing.guardedError;
      } catch {
        existing.writeRedactedServerErrorMarker();
        return false;
      }
      if (console.error !== existing.guardedError) {
        existing.writeRedactedServerErrorMarker();
      }
    }
    return false;
  }

  const originalError: ErrorSink = console.error.bind(console);
  const writeRedactedMarker = () => {
    writeLine(originalError, SERVER_ERROR_REDACTED_LINE);
  };
  const guardedError: ErrorSink = (..._untrustedArgs: unknown[]) => {
    writeRedactedMarker();
  };
  const writeSafeApiError = (input: unknown) => {
    writeSafeApiErrorLogWithSink(originalError, input);
  };
  const state = Object.freeze({
    [SERVER_LOG_PRIVACY_STATE_BRAND]: true as const,
    installed: true as const,
    guardedError,
    writeRedactedServerErrorMarker: writeRedactedMarker,
    writeSafeApiErrorLog: writeSafeApiError,
  });

  try {
    console.error = guardedError;
  } catch {
    writeRedactedMarker();
    return false;
  }
  if (console.error !== guardedError) {
    writeRedactedMarker();
    return false;
  }
  try {
    globalStateRecord()[SERVER_LOG_PRIVACY_STATE] = state;
  } catch {
    writeRedactedMarker();
    return false;
  }
  return true;
}

/** Emit the fixed marker without exposing an SDK/provider failure. */
export function writeRedactedServerErrorMarker(): void {
  const state = currentState();
  if (state) {
    state.writeRedactedServerErrorMarker();
    return;
  }
  writeLine(console.error.bind(console), SERVER_ERROR_REDACTED_LINE);
}

/**
 * Structured API log escape hatch. It reconstructs a new record from exact
 * allowlists before using the original production sink.
 */
export function writeSafeApiErrorLog(input: SafeApiErrorLog): void {
  const state = currentState();
  if (state) {
    state.writeSafeApiErrorLog(input);
    return;
  }
  writeSafeApiErrorLogWithSink(console.error.bind(console), input);
}
