import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({ captureException }));

import { reportApiError, requestIdFrom } from "../api-error";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JWT_HEADER_CANARY = ["eyJ", "hbGci", "OiJIUzI1NiJ9"].join("");
const JWT_CANARY = `${JWT_HEADER_CANARY}.payload.sig`;

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  captureException.mockReset();
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

  it("drops unknown circular extras without breaking logging", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() =>
      reportApiError({ step: "llm-call", error: new Error("x"), extra: circular }),
    ).not.toThrow();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(lastLogLine()).not.toHaveProperty("self");
  });
});

describe("reportApiError — console JSON line", () => {
  it("emits one parseable JSON line with stable metadata, never the message", () => {
    reportApiError({
      route: "/api/progress",
      step: "llm-call",
      error: new Error("model timeout"),
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = lastLogLine();
    expect(line.route).toBe("/api/progress");
    expect(line.step).toBe("llm-call");
    expect(line.errorName).toBe("Error");
    expect(line.errorCode).toBe("unknown");
    expect(line).not.toHaveProperty("error");
    expect(JSON.stringify(line)).not.toContain("model timeout");
    expect(String(line.requestId)).toMatch(UUID_RE);
  });

  it("derives the route from the request URL pathname when route is omitted", () => {
    const request = new Request("http://localhost/api/ai-native/practice?x=1", {
      method: "POST",
    });
    reportApiError({ step: "rate-limit", error: "limited", request });
    expect(lastLogLine().route).toBe("/api/ai-native/practice");
  });

  it("falls back to route 'unknown' without route and request", () => {
    reportApiError({ step: "unhandled", error: "no context" });
    expect(lastLogLine().route).toBe("unknown");
  });

  it("prefers an explicit route over the request-derived one", () => {
    const request = new Request("http://localhost/api/progress");
    reportApiError({
      route: "/api/feedback",
      step: "unhandled",
      error: "e",
      request,
    });
    expect(lastLogLine().route).toBe("/api/feedback");
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

  it("extracts allowlisted stable PostgREST metadata without its message", () => {
    reportApiError({
      step: "supabase-delete",
      error: {
        message: "row contains learner@example.com",
        code: "PGRST301",
        status: 503,
      },
    });
    expect(lastLogLine()).toMatchObject({
      errorName: "UnknownError",
      errorCode: "PGRST301",
      errorStatus: 503,
    });
    expect(JSON.stringify(lastLogLine())).not.toContain("learner@example.com");
  });

  it("uses generic metadata for primitive values", () => {
    reportApiError({ step: "unhandled", error: 42 });
    expect(lastLogLine()).toMatchObject({
      errorName: "UnknownError",
      errorCode: "unknown",
    });
  });

  it("drops unknown or unsafe extra fields", () => {
    reportApiError({
      step: "llm-call",
      error: new Error("secret"),
      extra: {
        durationMs: 12,
        prompt: "private learner text",
        email: "learner@example.com",
        code: "SAFE_CODE",
        lessonId: "lesson-1",
        kind: "exercise-fix-prompt",
        mode: "complete",
        status: 42,
        upstreamStatus: 999,
        unsafeCode: "sk-ant-secret",
      },
    });
    expect(lastLogLine()).toMatchObject({
      durationMs: 12,
      kind: "exercise-fix-prompt",
      mode: "complete",
    });
    expect(lastLogLine()).not.toHaveProperty("code");
    expect(lastLogLine()).not.toHaveProperty("lessonId");
    expect(lastLogLine()).not.toHaveProperty("status");
    expect(lastLogLine()).not.toHaveProperty("upstreamStatus");
    const serialized = JSON.stringify(lastLogLine());
    expect(serialized).not.toContain("private learner text");
    expect(serialized).not.toContain("learner@example.com");
    expect(serialized).not.toContain("sk-ant-secret");
  });

  it("rejects identifier-shaped secrets in routes, steps, names, and codes", () => {
    const secret = JWT_CANARY;
    reportApiError({
      route: `/api/${secret}`,
      step: secret,
      error: { name: "sk-ant-api03-secret", code: "ALICE" },
      extra: { code: "TOKEN" },
    });
    const line = lastLogLine();
    expect(line).toMatchObject({
      route: "unknown",
      step: "unknown",
      errorName: "UnknownError",
      errorCode: "unknown",
    });
    expect(JSON.stringify(line)).not.toContain("eyJhbGci");
    expect(JSON.stringify(line)).not.toContain("sk-ant");
    expect(JSON.stringify(line)).not.toContain("ALICE");
    expect(JSON.stringify(line)).not.toContain("TOKEN");
  });

  it("never forwards raw secrets, free text, or provider stacks to Sentry", () => {
    const leaked = new Error(
      `learner@example.com prompt=confidential jwt=${JWT_HEADER_CANARY}`,
    );
    leaked.stack = "service_role=super-secret";
    reportApiError({
      route: "/api/private",
      step: "llm-call",
      error: leaked,
      extra: { prompt: "confidential answer", durationMs: 20 },
    });

    expect(captureException).toHaveBeenCalledTimes(1);
    const [captured, context] = captureException.mock.calls[0] ?? [];
    expect(captured).toBeInstanceOf(Error);
    const serialized = JSON.stringify({
      name: (captured as Error).name,
      message: (captured as Error).message,
      context,
    });
    expect(serialized).not.toContain("learner@example.com");
    expect(serialized).not.toContain("confidential");
    expect(serialized).not.toContain("eyJhbGci");
    expect(serialized).not.toContain("super-secret");
  });
});

describe("reportApiError — server-owned request id", () => {
  it("ignores an incoming x-request-id header", () => {
    const request = new Request("http://localhost/api/example/action", {
      headers: { "x-request-id": "upstream-req-7" },
    });
    reportApiError({ step: "supabase-insert", error: "e", request });
    expect(lastLogLine().requestId).not.toBe("upstream-req-7");
    expect(String(lastLogLine().requestId)).toMatch(UUID_RE);
  });

  it("falls back to a fresh UUID without the header", () => {
    const request = new Request("http://localhost/api/example/action");
    reportApiError({ step: "unhandled", error: "e", request });
    expect(String(lastLogLine().requestId)).toMatch(UUID_RE);
  });

  it("ignores an extra requestId override", () => {
    const request = new Request("http://localhost/api/scan", {
      headers: { "x-request-id": "derived-id" },
    });
    reportApiError({
      step: "upstream-proxy",
      error: "e",
      request,
      extra: { requestId: "forwarded-id" },
    });
    expect(lastLogLine().requestId).not.toBe("forwarded-id");
    expect(String(lastLogLine().requestId)).toMatch(UUID_RE);
  });
});

describe("requestIdFrom", () => {
  it("never returns an attacker-controlled header value", () => {
    const request = new Request("http://localhost/x", {
      headers: { "x-request-id": "abc-123" },
    });
    expect(requestIdFrom(request)).not.toBe("abc-123");
    expect(requestIdFrom(request)).toMatch(UUID_RE);
  });

  it("returns a UUID when no request is given", () => {
    expect(requestIdFrom()).toMatch(UUID_RE);
  });

  it("rejects oversized or control-character request IDs", () => {
    const oversized = new Request("http://localhost/x", {
      headers: { "x-request-id": "x".repeat(129) },
    });
    const unsafe = new Request("http://localhost/x", {
      headers: { "x-request-id": "request id with spaces" },
    });
    expect(requestIdFrom(oversized)).toMatch(UUID_RE);
    expect(requestIdFrom(unsafe)).toMatch(UUID_RE);
  });

  it("does not inspect hostile request headers", () => {
    const evil = {
      headers: {
        get() {
          throw new Error("headers detached");
        },
      },
    } as unknown as Request;
    expect(requestIdFrom(evil)).toMatch(UUID_RE);
  });
});
