/**
 * Tests for the structured API error reporter (performance hardening).
 *
 * Uses the REAL @sentry/nextjs module on purpose: with no SENTRY_DSN the
 * SDK is an uninitialized no-op, and the helper's contract is that
 * captureException can never throw or break a response path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportApiError, requestIdFrom } from "../api-error";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  vi.unstubAllEnvs();
});

function lastLogLine(): Record<string, unknown> {
  const call = errorSpy.mock.calls.at(-1);
  expect(call).toBeTruthy();
  return JSON.parse(String(call?.[0])) as Record<string, unknown>;
}

describe("reportApiError — never throws", () => {
  it("does not throw without SENTRY_DSN, for any error shape", () => {
    vi.stubEnv("SENTRY_DSN", undefined);
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", undefined);
    const shapes: unknown[] = [
      new Error("boom"),
      "plain string failure",
      { message: "postgrest-style error", code: "PGRST301" },
      { code: 500 },
      null,
      undefined,
      42,
    ];
    for (const error of shapes) {
      expect(() => reportApiError({ step: "unhandled", error })).not.toThrow();
    }
  });

  it("does not throw when extra contains a circular reference (and skips the console line)", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() =>
      reportApiError({ step: "llm-call", error: new Error("x"), extra: circular }),
    ).not.toThrow();
    // JSON.stringify throws before console.error runs — line is skipped.
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("reportApiError — console JSON line", () => {
  it("emits one parseable JSON line with {route, step, requestId, error}", () => {
    reportApiError({
      route: "/api/example/report",
      step: "llm-call",
      error: new Error("model timeout"),
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = lastLogLine();
    expect(line.route).toBe("/api/example/report");
    expect(line.step).toBe("llm-call");
    expect(line.error).toBe("model timeout");
    expect(String(line.requestId)).toMatch(UUID_RE);
  });

  it("derives the route from the request URL pathname when route is omitted", () => {
    const request = new Request("http://localhost/api/example/action?x=1", {
      method: "POST",
    });
    reportApiError({ step: "rate-limit", error: "limited", request });
    expect(lastLogLine().route).toBe("/api/example/action");
  });

  it("falls back to route 'unknown' without route and request", () => {
    reportApiError({ step: "unhandled", error: "no context" });
    expect(lastLogLine().route).toBe("unknown");
  });

  it("prefers an explicit route over the request-derived one", () => {
    const request = new Request("http://localhost/api/actual-path");
    reportApiError({ route: "/api/explicit", step: "s", error: "e", request });
    expect(lastLogLine().route).toBe("/api/explicit");
  });

  it("merges extra fields into the log line", () => {
    reportApiError({
      step: "resend-send",
      error: "resend responded 500",
      extra: { status: 500, durationMs: 1234 },
    });
    const line = lastLogLine();
    expect(line.status).toBe(500);
    expect(line.durationMs).toBe(1234);
  });

  it("extracts .message from non-Error objects (PostgrestError shape)", () => {
    reportApiError({ step: "supabase-delete", error: { message: "pg down" } });
    expect(lastLogLine().error).toBe("pg down");
  });

  it("stringifies messageless error values", () => {
    reportApiError({ step: "s", error: 42 });
    expect(lastLogLine().error).toBe("42");
  });
});

describe("reportApiError — request id correlation", () => {
  it("uses the incoming x-request-id header when present", () => {
    const request = new Request("http://localhost/api/example/action", {
      headers: { "x-request-id": "upstream-req-7" },
    });
    reportApiError({ step: "supabase-insert", error: "e", request });
    expect(lastLogLine().requestId).toBe("upstream-req-7");
  });

  it("falls back to a fresh UUID without the header", () => {
    const request = new Request("http://localhost/api/example/action");
    reportApiError({ step: "s", error: "e", request });
    expect(String(lastLogLine().requestId)).toMatch(UUID_RE);
  });

  it("lets extra.requestId override the derived id (proxy correlation)", () => {
    const request = new Request("http://localhost/api/scan", {
      headers: { "x-request-id": "derived-id" },
    });
    reportApiError({
      step: "upstream-proxy",
      error: "e",
      request,
      extra: { requestId: "forwarded-id" },
    });
    // Extra is spread LAST in the JSON line, so the override wins.
    expect(lastLogLine().requestId).toBe("forwarded-id");
  });
});

describe("requestIdFrom", () => {
  it("returns the header value when present", () => {
    const request = new Request("http://localhost/x", {
      headers: { "x-request-id": "abc-123" },
    });
    expect(requestIdFrom(request)).toBe("abc-123");
  });

  it("returns a UUID when no request is given", () => {
    expect(requestIdFrom()).toMatch(UUID_RE);
  });

  it("returns 'unknown' when reading headers throws", () => {
    const evil = {
      headers: {
        get() {
          throw new Error("headers detached");
        },
      },
    } as unknown as Request;
    expect(requestIdFrom(evil)).toBe("unknown");
  });
});
