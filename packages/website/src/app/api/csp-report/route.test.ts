import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /api/csp-report: the sink for the report-only canary. Every guard branch is
 * asserted with the durable limiter mocked, and the one structured line the
 * route writes is checked against the fields a report carries that must never
 * reach a log. vi.mock is hoisted, so factories delegate to handles configured
 * per test.
 */

const mockConsume = vi.fn<(...args: unknown[]) => Promise<boolean>>(
  async () => true,
);
const mockReportApiError = vi.fn<(...args: unknown[]) => void>();

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (...args: unknown[]) => mockConsume(...args),
  hashedClientRateLimitKey: vi.fn(
    async () => `csp-report:ip-hmac-sha256-v1:${"a".repeat(64)}`,
  ),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

import { POST, runtime } from "./route";
import { isSampledCspViolation, STYLE_SAMPLE_RATE } from "./csp-violation";
import { hashedClientRateLimitKey } from "@/lib/security/rate-limit";

const NONCE = "AbCdEfGhIjKlMnOpQrStUv";
const ORIGINAL_POLICY = `default-src 'self'; script-src 'self' 'nonce-${NONCE}' 'strict-dynamic'; report-uri /api/csp-report; report-to csp-canary`;
const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
const mockedClientKey = vi.mocked(hashedClientRateLimitKey);

function legacyReport(
  overrides: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  return {
    "csp-report": {
      "document-uri":
        "https://loehrning.ai/kurse?email=learner@example.com#private",
      referrer: "https://evil.example/?token=leaked",
      "violated-directive": `script-src 'self' 'nonce-${NONCE}' 'strict-dynamic'`,
      "effective-directive": "script-src-elem",
      "original-policy": ORIGINAL_POLICY,
      disposition: "report",
      "blocked-uri": "inline",
      "status-code": 200,
      "script-sample": "alert(document.cookie)",
      "source-file": "https://cdn.example/lib.js?sig=secret",
      "line-number": 1,
      "column-number": 2,
      ...overrides,
    },
  };
}

function reportingApiReport(
  overrides: Readonly<Record<string, unknown>> = {},
  type = "csp-violation",
): Readonly<Record<string, unknown>> {
  return {
    type,
    age: 12,
    url: "https://loehrning.ai/login?next=%2Fkonto",
    user_agent: USER_AGENT,
    body: {
      documentURL: "https://loehrning.ai/login?next=%2Fkonto",
      referrer: "https://evil.example/",
      effectiveDirective: "script-src-elem",
      originalPolicy: ORIGINAL_POLICY,
      disposition: "report",
      blockedURL: "inline",
      statusCode: 200,
      sample: "alert(1)",
      sourceFile: "https://loehrning.ai/login",
      lineNumber: 3,
      columnNumber: 4,
      ...overrides,
    },
  };
}

function makeReq(
  body: unknown,
  contentType: string | null = "application/csp-report",
  extraHeaders: Readonly<Record<string, string>> = {},
): Request {
  return new Request("http://localhost/api/csp-report", {
    method: "POST",
    headers: {
      ...(contentType === null ? {} : { "Content-Type": contentType }),
      "x-vercel-forwarded-for": "10.0.0.1",
      "User-Agent": USER_AGENT,
      Referer: "https://loehrning.ai/login?next=%2Fkonto",
      ...extraHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeStreamingReq(body: string): Request {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const midpoint = Math.floor(bytes.length / 2);
      controller.enqueue(bytes.slice(0, midpoint));
      controller.enqueue(bytes.slice(midpoint));
      controller.close();
    },
  });
  return new Request("http://localhost/api/csp-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/reports+json",
      "x-vercel-forwarded-for": "10.0.0.1",
    },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function loggedLines(): string[] {
  return vi
    .mocked(console.log)
    .mock.calls.map((call) => call.map(String).join(" "));
}

function expectPrivate(response: Response): void {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-robots-tag")).toBe(
    "noindex, nofollow, noarchive",
  );
}

/** A document path whose style report is kept, and one whose is dropped. */
function stylePaths(): { kept: string; dropped: string } {
  const decision = (documentPath: string) =>
    isSampledCspViolation({
      effectiveDirective: "style-src-elem",
      violatedDirective: "style-src-elem",
      disposition: "report",
      blockedUri: "inline",
      documentPath,
      statusCode: 200,
    });
  const paths = Array.from({ length: 1_000 }, (_, index) => `/probe/${index}`);
  const kept = paths.find((path) => decision(path));
  const dropped = paths.find((path) => !decision(path));
  if (!kept || !dropped) throw new Error("sampling produced no split");
  return { kept, dropped };
}

describe("POST /api/csp-report", () => {
  beforeEach(() => {
    mockConsume.mockReset();
    mockConsume.mockResolvedValue(true);
    mockReportApiError.mockReset();
    mockedClientKey.mockClear();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is pinned to the Node runtime", () => {
    expect(runtime).toBe("nodejs");
  });

  it.each([
    ["missing", null],
    ["JSON", "application/json"],
    ["text", "text/plain"],
    ["lookalike", "application/csp-report+x"],
  ])(
    "415 for a %s media type before the limiter or the body is touched",
    async (_label, contentType) => {
      const response = await POST(makeReq(legacyReport(), contentType));

      expect(response.status).toBe(415);
      expect(await response.json()).toEqual({ error: "unsupported_media_type" });
      expectPrivate(response);
      expect(mockedClientKey).not.toHaveBeenCalled();
      expect(mockConsume).not.toHaveBeenCalled();
      expect(loggedLines()).toEqual([]);
    },
  );

  it("429 when the durable limiter denies, before the body is read", async () => {
    mockConsume.mockResolvedValueOnce(false);

    const response = await POST(makeReq(legacyReport()));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limit_exceeded" });
    expectPrivate(response);
    expect(mockedClientKey).toHaveBeenCalledWith(
      "csp-report",
      expect.any(Request),
    );
    // Generous enough for bursty per-page reports, bounded all the same.
    expect(mockConsume).toHaveBeenCalledWith({
      key: `csp-report:ip-hmac-sha256-v1:${"a".repeat(64)}`,
      windowSeconds: 600,
      max: 600,
    });
    expect(loggedLines()).toEqual([]);
  });

  it("503 when the durable limiter is unavailable, and reports that once", async () => {
    const limitError = Object.assign(new Error("limiter down"), {
      code: "RATE_LIMIT_UNAVAILABLE",
    });
    mockConsume.mockRejectedValueOnce(limitError);

    const response = await POST(makeReq(legacyReport()));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "rate_limit_unavailable" });
    expectPrivate(response);
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/csp-report",
        step: "rate-limit",
        error: limitError,
      }),
    );
    expect(loggedLines()).toEqual([]);
  });

  it("413 when a no-length streamed body exceeds 8 KB", async () => {
    const request = makeStreamingReq(
      JSON.stringify(
        Array.from({ length: 12 }, () =>
          reportingApiReport({ sample: "x".repeat(1_000) }),
        ),
      ),
    );
    expect(request.headers.get("content-length")).toBeNull();

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "payload_too_large" });
    expectPrivate(response);
    expect(loggedLines()).toEqual([]);
  });

  it("413 when the declared length alone exceeds the bound", async () => {
    const response = await POST(
      makeReq(legacyReport(), "application/csp-report", {
        "Content-Length": String(8 * 1024 + 1),
      }),
    );

    expect(response.status).toBe(413);
    expect(loggedLines()).toEqual([]);
  });

  it("400 invalid_json on an unparseable body", async () => {
    const response = await POST(makeReq('{"csp-report": {'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_json" });
    expectPrivate(response);
    expect(loggedLines()).toEqual([]);
  });

  it.each([
    ["an unrelated object", { hello: "world" }],
    ["a JSON string", JSON.stringify("report")],
    ["a non-object csp-report", { "csp-report": "x" }],
    ["a batch with a malformed entry", [reportingApiReport(), 1]],
  ])("400 invalid_report for %s", async (_label, body) => {
    const response = await POST(makeReq(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_report" });
    expect(loggedLines()).toEqual([]);
  });

  it("204 for a CSP2 report-uri envelope and logs one reduced line", async () => {
    const response = await POST(makeReq(legacyReport()));

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expectPrivate(response);
    const lines = loggedLines();
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!)).toEqual({
      event: "csp-violation",
      effectiveDirective: "script-src-elem",
      violatedDirective: "script-src",
      disposition: "report",
      blockedUri: "inline",
      documentPath: "/kurse",
      statusCode: 200,
      sampleRate: 1,
    });
  });

  it("204 for WebKit's single Reporting API object on the report-uri channel", async () => {
    const response = await POST(
      makeReq(reportingApiReport(), "application/csp-report"),
    );

    expect(response.status).toBe(204);
    const lines = loggedLines();
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!)).toMatchObject({
      event: "csp-violation",
      effectiveDirective: "script-src-elem",
      violatedDirective: "script-src-elem",
      blockedUri: "inline",
      documentPath: "/login",
    });
  });

  it("204 for a Reporting API batch, one line per violation of ours", async () => {
    const response = await POST(
      makeReq(
        [
          reportingApiReport(),
          reportingApiReport({}, "deprecation"),
          reportingApiReport({
            documentURL: "https://loehrning.ai/konto",
            blockedURL: "https://cdn.example/x.js?sig=secret",
          }),
        ],
        "application/reports+json; charset=utf-8",
      ),
    );

    expect(response.status).toBe(204);
    const lines = loggedLines().map((line) => JSON.parse(line));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ documentPath: "/login", blockedUri: "inline" });
    expect(lines[1]).toMatchObject({
      documentPath: "/konto",
      blockedUri: "https://cdn.example",
    });
  });

  it("204 with nothing logged for a batch that carries none of our reports", async () => {
    const response = await POST(
      makeReq([reportingApiReport({}, "crash")], "application/reports+json"),
    );

    expect(response.status).toBe(204);
    expect(loggedLines()).toEqual([]);
  });

  it("logs script violations in full and samples style violations one in fifty", async () => {
    const { kept, dropped } = stylePaths();
    const styleReport = (documentPath: string) =>
      legacyReport({
        "document-uri": `https://loehrning.ai${documentPath}?q=1`,
        "violated-directive": "style-src-elem 'self'",
        "effective-directive": "style-src-elem",
      });

    // Dropped: 204 all the same, and no line, no counter, nothing.
    expect((await POST(makeReq(styleReport(dropped)))).status).toBe(204);
    expect(loggedLines()).toEqual([]);

    // Kept: one line that says what it stands for.
    expect((await POST(makeReq(styleReport(kept)))).status).toBe(204);
    expect(loggedLines()).toHaveLength(1);
    expect(JSON.parse(loggedLines()[0]!)).toMatchObject({
      effectiveDirective: "style-src-elem",
      documentPath: kept,
      sampleRate: STYLE_SAMPLE_RATE,
    });

    // A script violation on the dropped page is still logged: never sampled.
    expect(
      (
        await POST(
          makeReq(
            legacyReport({
              "document-uri": `https://loehrning.ai${dropped}`,
            }),
          ),
        )
      ).status,
    ).toBe(204);
    expect(loggedLines()).toHaveLength(2);
    expect(JSON.parse(loggedLines()[1]!)).toMatchObject({
      effectiveDirective: "script-src-elem",
      documentPath: dropped,
      sampleRate: 1,
    });
  });

  it("never logs the nonce, the user agent, the referrer, a query string, or a sample", async () => {
    await POST(makeReq(legacyReport()));
    await POST(makeReq([reportingApiReport()], "application/reports+json"));

    const lines = loggedLines();
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      expect(Object.keys(parsed).sort()).toEqual([
        "blockedUri",
        "disposition",
        "documentPath",
        "effectiveDirective",
        "event",
        "sampleRate",
        "statusCode",
        "violatedDirective",
      ]);
      for (const forbidden of [
        NONCE,
        "nonce",
        USER_AGENT,
        "Mozilla",
        "iPhone",
        "evil.example",
        "token=leaked",
        "?",
        "email=",
        "learner@example.com",
        "next=",
        "#private",
        "alert(",
        "sig=secret",
        "lib.js",
        "original",
        "referrer",
        '"sample"',
        "user_agent",
      ]) {
        expect(line, forbidden).not.toContain(forbidden);
      }
    }
  });
});
