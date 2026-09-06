import { describe, expect, it } from "vitest";
import {
  cspViolationLogLine,
  cspViolationSampleRate,
  isCspReportMediaType,
  isSampledCspViolation,
  MAX_BATCH_REPORTS,
  parseCspViolations,
  STYLE_SAMPLE_RATE,
  type CspViolation,
} from "./csp-violation";

const NONCE = "AbCdEfGhIjKlMnOpQrStUv";
const ORIGINAL_POLICY = `default-src 'self'; script-src 'self' 'nonce-${NONCE}' 'strict-dynamic'; report-uri /api/csp-report; report-to csp-canary`;

/** Chromium's CSP2 report-uri envelope, carrying everything we must not log. */
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
      "blocked-uri": "https://cdn.example/lib.js?sig=secret",
      "status-code": 200,
      "script-sample": "alert(document.cookie)",
      "source-file": "https://cdn.example/lib.js?sig=secret",
      "line-number": 1,
      "column-number": 2,
      ...overrides,
    },
  };
}

/** A Reporting API report object, as WebKit posts singly and Chromium batches. */
function reportingApiReport(
  overrides: Readonly<Record<string, unknown>> = {},
  type = "csp-violation",
): Readonly<Record<string, unknown>> {
  return {
    type,
    age: 12,
    url: "https://loehrning.ai/login?next=%2Fkonto",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
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

function violation(overrides: Partial<CspViolation> = {}): CspViolation {
  return {
    effectiveDirective: "script-src-elem",
    violatedDirective: "script-src-elem",
    disposition: "report",
    blockedUri: "inline",
    documentPath: "/login",
    statusCode: 200,
    ...overrides,
  };
}

describe("CSP report media types", () => {
  it.each([
    "application/csp-report",
    "application/reports+json",
    "application/reports+json; charset=utf-8",
    "APPLICATION/CSP-REPORT",
  ])("accepts %s", (contentType) => {
    expect(isCspReportMediaType(contentType)).toBe(true);
  });

  it.each([
    [null],
    ["application/json"],
    ["text/plain"],
    ["application/csp-report-x"],
    ["application/reports+json".padEnd(5_000, ";")],
  ])("rejects %s", (contentType) => {
    expect(isCspReportMediaType(contentType)).toBe(false);
  });
});

describe("parseCspViolations", () => {
  it("reduces a CSP2 envelope to the allowlisted shape", () => {
    expect(parseCspViolations(legacyReport())).toEqual([
      {
        effectiveDirective: "script-src-elem",
        violatedDirective: "script-src",
        disposition: "report",
        blockedUri: "https://cdn.example",
        documentPath: "/kurse",
        statusCode: 200,
      },
    ]);
  });

  it("reduces a single Reporting API object, as WebKit posts on report-uri", () => {
    expect(parseCspViolations(reportingApiReport())).toEqual([
      {
        effectiveDirective: "script-src-elem",
        violatedDirective: "script-src-elem",
        disposition: "report",
        blockedUri: "inline",
        documentPath: "/login",
        statusCode: 200,
      },
    ]);
  });

  it("reads a Reporting API batch and skips report types that are not ours", () => {
    const parsed = parseCspViolations([
      reportingApiReport(),
      reportingApiReport({ id: "x" }, "deprecation"),
      reportingApiReport({ effectiveDirective: "style-src-elem" }),
    ]);

    expect(parsed).toHaveLength(2);
    expect(parsed?.map((entry) => entry.effectiveDirective)).toEqual([
      "script-src-elem",
      "style-src-elem",
    ]);
  });

  it("returns an empty list for a well-formed delivery with nothing of ours", () => {
    expect(parseCspViolations([])).toEqual([]);
    expect(parseCspViolations([reportingApiReport({}, "crash")])).toEqual([]);
    expect(parseCspViolations(reportingApiReport({}, "intervention"))).toEqual(
      [],
    );
  });

  it.each([
    ["a string", "report"],
    ["a number", 42],
    ["null", null],
    ["an empty object", {}],
    ["a bare CSP2 body", { "document-uri": "https://loehrning.ai/" }],
    ["a non-object csp-report", { "csp-report": "text" }],
    ["an envelope without a body", { type: "csp-violation" }],
    ["an envelope with a non-object body", { type: "csp-violation", body: 1 }],
    ["a batch with a malformed entry", [reportingApiReport(), "x"]],
    [
      "a batch over the bound",
      Array.from({ length: MAX_BATCH_REPORTS + 1 }, () => reportingApiReport()),
    ],
  ])("rejects %s", (_label, payload) => {
    expect(parseCspViolations(payload)).toBeNull();
  });

  it("keeps only the directive name, never the sources carried with it", () => {
    const [parsed] = parseCspViolations(
      legacyReport({
        "violated-directive": `style-src 'self' 'nonce-${NONCE}'`,
        "effective-directive": `STYLE-SRC-ELEM 'nonce-${NONCE}'`,
      }),
    )!;

    expect(parsed.violatedDirective).toBe("style-src");
    expect(parsed.effectiveDirective).toBe("style-src-elem");
    expect(JSON.stringify(parsed)).not.toContain(NONCE);
  });

  it("falls back between the two directive fields and to unknown", () => {
    expect(
      parseCspViolations(
        legacyReport({ "effective-directive": undefined }),
      )?.[0],
    ).toMatchObject({
      effectiveDirective: "script-src",
      violatedDirective: "script-src",
    });
    expect(
      parseCspViolations(
        legacyReport({
          "violated-directive": "made-up-src 'self'",
          "effective-directive": 7,
        }),
      )?.[0],
    ).toMatchObject({
      effectiveDirective: "unknown",
      violatedDirective: "unknown",
    });
  });

  it.each([
    ["inline", "inline"],
    ["eval", "eval"],
    ["data", "data"],
    ["blob", "blob"],
    ["https://cdn.example:8443/lib.js?sig=secret#x", "https://cdn.example:8443"],
    ["https://user:pass@cdn.example/lib.js", "https://cdn.example"],
    ["data:text/javascript;base64,YWxlcnQoMSk=", "data"],
    ["about:blank", "about"],
    ["blob:https://loehrning.ai/2b1f0c0e", "https://loehrning.ai"],
    ["not a url", "unknown"],
    ["", "unknown"],
    [12, "unknown"],
    [`https://cdn.example/${"a".repeat(3_000)}`, "unknown"],
  ])("reduces the blocked URI %s to %s", (blocked, expected) => {
    expect(
      parseCspViolations(legacyReport({ "blocked-uri": blocked }))?.[0]
        ?.blockedUri,
    ).toBe(expected);
  });

  it.each([
    ["https://loehrning.ai/", "/"],
    ["https://loehrning.ai/buecher/ki-landschaft/01-einleitung", "/buecher/ki-landschaft/01-einleitung"],
    ["https://loehrning.ai/kurse?email=learner@example.com", "/kurse"],
    ["https://loehrning.ai/konto#token=abc", "/konto"],
    ["https://loehrning.ai/b%C3%BCcher", "/b%C3%BCcher"],
    ["https://loehrning.ai/a b", "/a%20b"],
    ["/kurse", "unknown"],
    ["about:blank", "unknown"],
    ["", "unknown"],
    [null, "unknown"],
    [`https://loehrning.ai/${"a".repeat(600)}`, "unknown"],
  ])("reduces the document URI %s to %s", (documentUri, expected) => {
    expect(
      parseCspViolations(legacyReport({ "document-uri": documentUri }))?.[0]
        ?.documentPath,
    ).toBe(expected);
  });

  it.each([
    ["enforce", "enforce"],
    ["report", "report"],
    ["other", "unknown"],
    [undefined, "unknown"],
  ])("keeps only a known disposition: %s", (disposition, expected) => {
    expect(
      parseCspViolations(legacyReport({ disposition }))?.[0]?.disposition,
    ).toBe(expected);
  });

  it.each([
    [0, 0],
    [200, 200],
    [599, 599],
    [99, null],
    [600, null],
    ["200", null],
    [200.5, null],
    [undefined, null],
  ])("keeps only a plausible status code: %s", (statusCode, expected) => {
    expect(
      parseCspViolations(legacyReport({ "status-code": statusCode }))?.[0]
        ?.statusCode,
    ).toBe(expected);
  });

  it("never reads inherited properties as report fields", () => {
    const hostile = Object.create({
      "document-uri": "https://loehrning.ai/inherited",
      "effective-directive": "script-src",
    }) as Record<string, unknown>;
    hostile["blocked-uri"] = "inline";

    expect(parseCspViolations({ "csp-report": hostile })?.[0]).toMatchObject({
      documentPath: "unknown",
      effectiveDirective: "unknown",
      blockedUri: "inline",
    });
  });
});

describe("sampling", () => {
  it("never samples script violations", () => {
    for (const path of ["/", "/login", "/konto", "/kurse/open-source/claude"]) {
      const scriptViolation = violation({ documentPath: path });
      expect(cspViolationSampleRate(scriptViolation)).toBe(1);
      expect(isSampledCspViolation(scriptViolation)).toBe(true);
    }
  });

  it("samples style violations one in fifty by a stable hash, not by chance", () => {
    expect(STYLE_SAMPLE_RATE).toBe(50);
    const paths = Array.from({ length: 2_000 }, (_, index) => `/probe/${index}`);
    const styleViolation = (documentPath: string) =>
      violation({
        effectiveDirective: "style-src-elem",
        violatedDirective: "style-src-elem",
        documentPath,
      });
    const kept = paths.filter((path) => isSampledCspViolation(styleViolation(path)));

    expect(cspViolationSampleRate(styleViolation("/"))).toBe(STYLE_SAMPLE_RATE);
    // Roughly one in fifty over a wide spread of paths.
    expect(kept.length).toBeGreaterThan(paths.length / 200);
    expect(kept.length).toBeLessThan(paths.length / 20);
    // Deterministic: the same page gives the same answer on every call.
    for (const path of paths.slice(0, 100)) {
      const first = isSampledCspViolation(styleViolation(path));
      expect(isSampledCspViolation(styleViolation(path))).toBe(first);
      expect(isSampledCspViolation(styleViolation(path))).toBe(first);
    }
  });

  it("keys the sample on the violated directive as well as the path", () => {
    const paths = Array.from({ length: 2_000 }, (_, index) => `/probe/${index}`);
    const decisions = paths.map((documentPath) => [
      isSampledCspViolation(
        violation({
          effectiveDirective: "style-src-elem",
          violatedDirective: "style-src-elem",
          documentPath,
        }),
      ),
      isSampledCspViolation(
        violation({
          effectiveDirective: "style-src-attr",
          violatedDirective: "style-src-attr",
          documentPath,
        }),
      ),
    ]);

    expect(decisions.some(([elem, attr]) => elem !== attr)).toBe(true);
  });

  it("treats a report as a style report by either directive field", () => {
    expect(
      cspViolationSampleRate(
        violation({ effectiveDirective: "unknown", violatedDirective: "style-src" }),
      ),
    ).toBe(STYLE_SAMPLE_RATE);
    expect(
      cspViolationSampleRate(
        violation({ effectiveDirective: "style-src-attr", violatedDirective: "unknown" }),
      ),
    ).toBe(STYLE_SAMPLE_RATE);
  });
});

describe("cspViolationLogLine", () => {
  it("carries exactly the allowlisted fields and the sample rate", () => {
    const line = cspViolationLogLine(violation());

    expect(Object.keys(line)).toEqual([
      "event",
      "effectiveDirective",
      "violatedDirective",
      "disposition",
      "blockedUri",
      "documentPath",
      "statusCode",
      "sampleRate",
    ]);
    expect(line).toEqual({
      event: "csp-violation",
      effectiveDirective: "script-src-elem",
      violatedDirective: "script-src-elem",
      disposition: "report",
      blockedUri: "inline",
      documentPath: "/login",
      statusCode: 200,
      sampleRate: 1,
    });
    expect(Object.isFrozen(line)).toBe(true);
  });

  it("carries nothing from the raw report but the reductions", () => {
    const serialized = JSON.stringify(
      parseCspViolations(legacyReport())!.map(cspViolationLogLine),
    );

    for (const forbidden of [
      NONCE,
      "nonce",
      "evil.example",
      "token=leaked",
      "email=",
      "learner@example.com",
      "#private",
      "alert(",
      "sig=secret",
      "lib.js",
      "original-policy",
      "originalPolicy",
      "referrer",
      "script-sample",
      "source-file",
      "line-number",
    ]) {
      expect(serialized, forbidden).not.toContain(forbidden);
    }
  });
});
