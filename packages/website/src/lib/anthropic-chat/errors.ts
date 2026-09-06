/**
 * Named failures for the account chat.
 *
 * Every rejection carries a stable machine code and an HTTP status. Nothing
 * here ever embeds a provider message, a header value, a key, or a fragment of
 * a transcript: an error body crosses back to the browser and into logs, and
 * neither may learn anything about the student's credential beyond the fact
 * that the provider refused it.
 */

import {
  ACCOUNT_CHAT_DEFAULT_RETRY_AFTER_SECONDS,
  ACCOUNT_CHAT_MAX_RETRY_AFTER_SECONDS,
} from "./config";

export const ACCOUNT_CHAT_ERROR_CODES = [
  "unsupported_media_type",
  "unauthorized",
  "auth_unavailable",
  "auth_not_configured",
  "chat_not_enabled",
  "rate_limit_exceeded",
  "rate_limit_unavailable",
  "payload_too_large",
  "message_too_large",
  "invalid_chat_request",
  "chat_owner_mismatch",
  "model_not_allowed",
  "llm_key_missing",
  "llm_key_unavailable",
  "llm_key_rejected",
  "llm_credit_required",
  "llm_request_rejected",
  "llm_busy",
  "llm_timeout",
  "llm_unavailable",
  "llm_empty_response",
  "tool_budget_exhausted",
  "tool_input_invalid",
  "tool_failed",
] as const;

export type AccountChatErrorCode = (typeof ACCOUNT_CHAT_ERROR_CODES)[number];

export class AccountChatError extends Error {
  readonly code: AccountChatErrorCode;
  readonly status: number;
  /** Seconds a client should wait. Only set for `llm_busy`. */
  readonly retryAfterSeconds?: number;

  constructor(
    code: AccountChatErrorCode,
    status: number,
    options?: { readonly retryAfterSeconds?: number },
  ) {
    super(`Account chat failure: ${code}`);
    this.name = "AccountChatError";
    this.code = code;
    this.status = status;
    if (typeof options?.retryAfterSeconds === "number") {
      this.retryAfterSeconds = options.retryAfterSeconds;
    }
  }
}

export function isAccountChatError(
  error: unknown,
): error is AccountChatError {
  return error instanceof AccountChatError;
}

function readField(value: unknown, field: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  try {
    return Reflect.get(value, field);
  } catch {
    return undefined;
  }
}

/** HTTP status carried by an SDK error, or undefined for a transport failure. */
function providerStatus(error: unknown): number | undefined {
  const status = readField(error, "status");
  return typeof status === "number" && Number.isInteger(status)
    ? status
    : undefined;
}

function errorName(error: unknown): string {
  const name = readField(error, "name");
  return typeof name === "string" ? name : "";
}

/**
 * Read `retry-after` from whatever the SDK attached: a `Headers` instance, or
 * a plain record in the shimmed builds. Only a small positive integer count of
 * seconds is accepted; an HTTP-date form or an absurd value falls back to the
 * fixed default rather than being echoed to the browser.
 */
export function retryAfterSecondsFrom(error: unknown): number {
  const headers = readField(error, "headers");
  let raw: unknown;
  const get = readField(headers, "get");
  if (typeof get === "function") {
    try {
      raw = (get as (name: string) => unknown).call(headers, "retry-after");
    } catch {
      raw = undefined;
    }
  } else {
    raw = readField(headers, "retry-after");
  }
  if (typeof raw !== "string" || !/^\d{1,6}$/.test(raw.trim())) {
    return ACCOUNT_CHAT_DEFAULT_RETRY_AFTER_SECONDS;
  }
  const seconds = Number(raw.trim());
  if (seconds <= 0) return ACCOUNT_CHAT_DEFAULT_RETRY_AFTER_SECONDS;
  return Math.min(seconds, ACCOUNT_CHAT_MAX_RETRY_AFTER_SECONDS);
}

/**
 * Translate a provider failure into one of this route's named errors.
 *
 * The mapping reads `status` and `name` structurally instead of testing
 * `instanceof` against the SDK's classes. That keeps the module free of any
 * import that could reach the operator client, and it stays correct when the
 * SDK is replaced by a test double or its error classes are re-bundled.
 */
export function mapProviderError(
  error: unknown,
  context?: { readonly timedOut?: boolean },
): AccountChatError {
  if (context?.timedOut === true) {
    return new AccountChatError("llm_timeout", 504);
  }

  const name = errorName(error);
  if (name === "APIConnectionTimeoutError" || name === "TimeoutError") {
    return new AccountChatError("llm_timeout", 504);
  }

  const status = providerStatus(error);
  if (status === 401 || status === 403) {
    // The stored key is present but the provider will not accept it. This is
    // the one provider failure the student can actually fix.
    return new AccountChatError("llm_key_rejected", 502);
  }
  if (status === 402) {
    return new AccountChatError("llm_credit_required", 502);
  }
  if (status === 429 || status === 529) {
    return new AccountChatError("llm_busy", 503, {
      retryAfterSeconds: retryAfterSecondsFrom(error),
    });
  }
  if (status === 408 || status === 504) {
    return new AccountChatError("llm_timeout", 504);
  }
  if (status === 400 || status === 404 || status === 422) {
    return new AccountChatError("llm_request_rejected", 502);
  }
  if (typeof status === "number" && status >= 500) {
    return new AccountChatError("llm_unavailable", 502);
  }
  if (name === "APIUserAbortError" || name === "AbortError") {
    return new AccountChatError("llm_timeout", 504);
  }
  return new AccountChatError("llm_unavailable", 502);
}
