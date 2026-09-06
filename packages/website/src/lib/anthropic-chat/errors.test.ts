import { describe, expect, it } from "vitest";
import {
  ACCOUNT_CHAT_DEFAULT_RETRY_AFTER_SECONDS,
  ACCOUNT_CHAT_MAX_RETRY_AFTER_SECONDS,
} from "./config";
import { mapProviderError, retryAfterSecondsFrom } from "./errors";

function apiError(
  status: number | undefined,
  extras: Record<string, unknown> = {},
): Error {
  const error = new Error("provider said no");
  error.name = "APIError";
  Object.assign(error, { status, ...extras });
  return error;
}

describe("mapProviderError", () => {
  it("names a rejected key so the student can replace it", () => {
    expect(mapProviderError(apiError(401))).toMatchObject({
      code: "llm_key_rejected",
      status: 502,
    });
    expect(mapProviderError(apiError(403))).toMatchObject({
      code: "llm_key_rejected",
    });
  });

  it("separates an exhausted budget from a rejected key", () => {
    expect(mapProviderError(apiError(402))).toMatchObject({
      code: "llm_credit_required",
      status: 502,
    });
  });

  it("carries a retry hint for a busy provider", () => {
    const mapped = mapProviderError(
      apiError(429, { headers: { "retry-after": "12" } }),
    );
    expect(mapped).toMatchObject({
      code: "llm_busy",
      status: 503,
      retryAfterSeconds: 12,
    });
  });

  it("treats an overloaded provider as busy, not as an outage", () => {
    expect(mapProviderError(apiError(529))).toMatchObject({
      code: "llm_busy",
      status: 503,
    });
  });

  it("answers a timeout with its own status", () => {
    expect(mapProviderError(apiError(undefined), { timedOut: true })).toMatchObject({
      code: "llm_timeout",
      status: 504,
    });
    const timeout = new Error("connection timed out");
    timeout.name = "APIConnectionTimeoutError";
    expect(mapProviderError(timeout)).toMatchObject({ code: "llm_timeout" });
  });

  it("keeps a malformed request apart from an upstream outage", () => {
    expect(mapProviderError(apiError(400))).toMatchObject({
      code: "llm_request_rejected",
    });
    expect(mapProviderError(apiError(500))).toMatchObject({
      code: "llm_unavailable",
    });
  });

  it("falls back to an outage for an error it cannot read", () => {
    expect(mapProviderError("something odd")).toMatchObject({
      code: "llm_unavailable",
      status: 502,
    });
  });
});

describe("retryAfterSecondsFrom", () => {
  it("reads a Headers instance", () => {
    const headers = new Headers({ "retry-after": "30" });
    expect(retryAfterSecondsFrom({ headers })).toBe(30);
  });

  it("reads a plain header record", () => {
    expect(retryAfterSecondsFrom({ headers: { "retry-after": "5" } })).toBe(5);
  });

  it("falls back when the delay is an HTTP date rather than seconds", () => {
    expect(
      retryAfterSecondsFrom({
        headers: { "retry-after": "Wed, 21 Oct 2026 07:28:00 GMT" },
      }),
    ).toBe(ACCOUNT_CHAT_DEFAULT_RETRY_AFTER_SECONDS);
  });

  it("clamps an absurd delay instead of echoing it to the browser", () => {
    expect(retryAfterSecondsFrom({ headers: { "retry-after": "999999" } })).toBe(
      ACCOUNT_CHAT_MAX_RETRY_AFTER_SECONDS,
    );
  });

  it("falls back when there are no headers at all", () => {
    expect(retryAfterSecondsFrom(new Error("no headers"))).toBe(
      ACCOUNT_CHAT_DEFAULT_RETRY_AFTER_SECONDS,
    );
  });
});
