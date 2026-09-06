import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  createCspNonce,
  CSP_REPORT_GROUP,
  CSP_REPORT_PATH,
  CSP_REPORTING_ENDPOINTS,
  cspDispositionOf,
  isCspNonce,
  isSharedCacheable,
  NONCE_CSP_HEADER,
  NONCE_REQUEST_HEADER,
  sentryOriginFromDsn,
  type SecurityHeaderEnvironment,
} from "../../security-headers";
import { cacheHeaderFor, type CrawlRoute } from "@/lib/crawl/contract";

const production = {
  NODE_ENV: "production",
} satisfies SecurityHeaderEnvironment;

function directive(policy: string, name: string): string {
  const match = policy
    .split("; ")
    .find(
      (candidate) => candidate.startsWith(`${name} `) || candidate === name,
    );
  if (!match) throw new Error(`Missing CSP directive: ${name}`);
  return match;
}

/**
 * Byte-for-byte reimplementation of Next's own nonce extractor
 * (next/dist/server/app-render/get-script-nonce-from-header.js in 16.3.0).
 * Rendering the correct nonce depends on this exact algorithm, including the
 * `startsWith("script-src")` prefix match, which `script-src-attr` would also
 * satisfy if it were ever ordered first.
 */
function nextScriptNonceFromHeader(policy: string): string | undefined {
  const directives = policy.split(";").map((entry) => entry.trim());
  const scriptDirective =
    directives.find((entry) => entry.startsWith("script-src")) ||
    directives.find((entry) => entry.startsWith("default-src"));
  if (!scriptDirective) return undefined;
  for (const source of scriptDirective.split(/\s+/).slice(1)) {
    const match = source.trim().match(/^'nonce-([A-Za-z0-9+/_-]+={0,2})'$/);
    if (match) return match[1];
  }
  return undefined;
}

function directiveNames(policy: string): string[] {
  return policy.split("; ").map((entry) => entry.split(" ")[0]);
}

function crawlRoute(cache: CrawlRoute["cache"]): CrawlRoute {
  return {
    pattern: "/test",
    routeClass: "public-indexable",
    auth: "public",
    robots: "allow",
    includeInSitemap: true,
    cache,
    explanation: "Fixture.",
    owner: "test",
  };
}

describe("security headers", () => {
  it("keeps the provider-free production policy closed", () => {
    const headers = buildSecurityHeaders(production, null);
    const policy = headers.find(
      ({ key }) => key === "Content-Security-Policy",
    )?.value;

    expect(policy).toBeDefined();
    expect(directive(policy!, "connect-src")).toBe("connect-src 'self'");
    expect(directive(policy!, "frame-src")).toBe("frame-src 'none'");
    expect(directive(policy!, "script-src")).not.toContain("'unsafe-eval'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain("manifest-src 'self'");
    expect(policy).toContain("media-src 'self'");
  });

  it("permits unsafe-eval only in development and omits HTTPS upgrading there", () => {
    const policy = buildContentSecurityPolicy(
      { NODE_ENV: "development" },
      null,
    );

    expect(directive(policy, "script-src")).toContain("'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("omits HTTPS upgrading only for the exact local verification origin", () => {
    const policy = buildContentSecurityPolicy(
      {
        ...production,
        LOEHRNING_LOCAL_VERIFICATION_ORIGIN: "http://localhost:3492",
      },
      null,
    );

    expect(directive(policy, "script-src")).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");

    for (const value of [
      "https://localhost:3492",
      "http://127.0.0.1:3492",
      "http://localhost",
      "http://localhost:0",
      "http://localhost:70000",
      "http://localhost:3492/path",
      "http://user@localhost:3492",
      "http://localhost.evil.example:3492",
    ]) {
      expect(
        buildContentSecurityPolicy(
          { ...production, LOEHRNING_LOCAL_VERIFICATION_ORIGIN: value },
          null,
        ),
      ).toContain("upgrade-insecure-requests");
    }
  });

  it("retains HTTPS upgrading on Vercel even if a local origin is injected", () => {
    expect(
      buildContentSecurityPolicy(
        {
          ...production,
          VERCEL: "1",
          LOEHRNING_LOCAL_VERIFICATION_ORIGIN: "http://localhost:3492",
        },
        null,
      ),
    ).toContain("upgrade-insecure-requests");
  });

  it("admits only explicitly enabled fixed provider origins", () => {
    const policy = buildContentSecurityPolicy(
      {
        ...production,
        NEXT_PUBLIC_SENTRY_DSN:
          "https://012345abcdef@o123.ingest.sentry.io/456",
        VERCEL: "1",
        VERCEL_TELEMETRY_ENABLED: "true",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "configured",
      },
      "https://project-ref.supabase.co",
    );

    expect(directive(policy, "connect-src")).toBe(
      "connect-src 'self' https://project-ref.supabase.co wss://project-ref.supabase.co https://o123.ingest.sentry.io https://vitals.vercel-insights.com https://va.vercel-scripts.com",
    );
    expect(directive(policy, "script-src")).toContain(
      "https://va.vercel-scripts.com",
    );
    expect(directive(policy, "script-src")).toContain(
      "https://challenges.cloudflare.com",
    );
    expect(directive(policy, "frame-src")).toBe(
      "frame-src https://challenges.cloudflare.com",
    );
  });

  it("does not enable Vercel origins outside Vercel or without exact opt-in", () => {
    for (const environment of [
      { ...production, VERCEL_TELEMETRY_ENABLED: "true" },
      { ...production, VERCEL: "1", VERCEL_TELEMETRY_ENABLED: "TRUE" },
    ]) {
      const policy = buildContentSecurityPolicy(environment, null);
      expect(policy).not.toContain("vercel");
    }
  });

  it("canonicalizes an accepted Sentry DSN to its HTTPS origin", () => {
    expect(
      sentryOriginFromDsn("https://012345abcdef@o123.ingest.sentry.io/456"),
    ).toBe("https://o123.ingest.sentry.io");
  });

  it.each([
    "http://012345abcdef@o123.ingest.sentry.io/456",
    "https://012345abcdef@attacker.example/456",
    "https://012345abcdef@o123.ingest.sentry.io/456; script-src *",
    " https://012345abcdef@o123.ingest.sentry.io/456",
    `https://012345abcdef@o123.ingest.sentry.io/${"1".repeat(2050)}`,
  ])("rejects malformed or injection-bearing Sentry DSNs: %s", (value) => {
    expect(sentryOriginFromDsn(value)).toBeNull();
    expect(
      buildContentSecurityPolicy(
        { ...production, NEXT_PUBLIC_SENTRY_DSN: value },
        null,
      ),
    ).not.toContain("attacker.example");
  });

  it("ships the complete browser-boundary header set", () => {
    const headers = buildSecurityHeaders(production, null);
    const headerRecord = Object.fromEntries(
      headers.map(({ key, value }) => [key, value]),
    );

    expect(headerRecord).toMatchObject({
      "Strict-Transport-Security":
        "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cross-Origin-Opener-Policy": "same-origin",
    });
    expect(new Set(headers.map(({ key }) => key)).size).toBe(headers.length);
    expect(headers.every(({ key, value }) => !/[\r\n]/.test(key + value))).toBe(
      true,
    );

    const permissions = headerRecord["Permissions-Policy"];
    for (const capability of [
      "accelerometer=()",
      "browsing-topics=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ]) {
      expect(permissions).toContain(capability);
    }
  });

  it("keeps framework fingerprinting and public production source maps disabled", () => {
    const configSource = readFileSync(
      resolve(process.cwd(), "next.config.ts"),
      "utf8",
    );

    expect(configSource).toContain("poweredByHeader: false");
    expect(configSource).toContain("productionBrowserSourceMaps: false");
    expect(configSource).toContain("deleteSourcemapsAfterUpload: true");
  });
});

describe("content security policy nonce", () => {
  const nonce = "AbCdEfGhIjKlMnOpQrStUv";

  it("leaves the nonce-free policy byte-identical to the baseline", () => {
    // next.config.ts builds the enforced baseline with two arguments. The new
    // parameter must not have moved a single byte of it.
    const baseline = buildContentSecurityPolicy(production, null);

    expect(buildContentSecurityPolicy(production, null, null)).toBe(baseline);
    expect(directive(baseline, "script-src")).toBe(
      "script-src 'self' 'unsafe-inline'",
    );
    expect(directive(baseline, "style-src")).toBe(
      "style-src 'self' 'unsafe-inline'",
    );
  });

  it("forbids inline script that the nonce-free policy permits", () => {
    const policy = buildContentSecurityPolicy(production, null, nonce);
    const scriptSrc = directive(policy, "script-src");

    // The whole point of the stage: arbitrary inline script is no longer a
    // permitted source, and only a nonce-bearing script can execute.
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).toBe(
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    );
    expect(policy).toContain("script-src-attr 'none'");
  });

  it("changes script-src and nothing else", () => {
    const environment = {
      ...production,
      NEXT_PUBLIC_SENTRY_DSN: "https://012345abcdef@o123.ingest.sentry.io/456",
      VERCEL: "1",
      VERCEL_TELEMETRY_ENABLED: "true",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "configured",
    } satisfies SecurityHeaderEnvironment;
    const origin = "https://project-ref.supabase.co";
    const baseline = buildContentSecurityPolicy(environment, origin);
    const nonced = buildContentSecurityPolicy(environment, origin, nonce);

    // Report-only measurement is only trustworthy, and the later flip to
    // enforcement only safe, if the two policies differ in exactly one
    // directive.
    expect(directiveNames(nonced)).toEqual(directiveNames(baseline));
    const baselineDirectives = baseline.split("; ");
    const changed = nonced
      .split("; ")
      .filter((entry, index) => entry !== baselineDirectives[index])
      .map((entry) => entry.split(" ")[0]);
    expect(changed).toEqual(["script-src"]);
  });

  it("keeps the CSP2 fallback allowlist inside the nonce policy", () => {
    // A CSP2 browser ignores 'strict-dynamic' and enforces the host list, so
    // dropping these entries would break Turnstile and analytics there.
    const policy = buildContentSecurityPolicy(
      {
        ...production,
        VERCEL: "1",
        VERCEL_TELEMETRY_ENABLED: "true",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "configured",
      },
      null,
      nonce,
    );

    expect(directive(policy, "script-src")).toBe(
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com https://challenges.cloudflare.com`,
    );
    expect(directive(policy, "frame-src")).toBe(
      "frame-src https://challenges.cloudflare.com",
    );
  });

  it("still admits unsafe-eval in development alongside the nonce", () => {
    expect(
      directive(
        buildContentSecurityPolicy({ NODE_ENV: "development" }, null, nonce),
        "script-src",
      ),
    ).toBe(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`);
  });

  it("is readable by Next's own nonce extractor", () => {
    // Next finds the first directive whose name starts with "script-src".
    // "script-src-attr 'none'" also satisfies that prefix, so directive order
    // decides whether any nonce is stamped at all.
    const generated = createCspNonce();
    expect(generated).not.toBeNull();

    const policy = buildContentSecurityPolicy(production, null, generated);
    expect(nextScriptNonceFromHeader(policy)).toBe(generated);
    expect(policy.indexOf("script-src ")).toBeLessThan(
      policy.indexOf("script-src-attr "),
    );
  });

  it.each([
    ["empty", ""],
    ["too short", "abc"],
    ["directive injection", "abcdefghijklmnop'; script-src *"],
    ["header injection", "abcdefghijklmnop\r\nX-Injected: 1"],
    ["whitespace", "abcdefghij klmnopqr"],
    ["semicolon", "abcdefghijklmnop;style-src *"],
    ["over length", "a".repeat(200)],
  ])("falls back to the nonce-free policy for a %s nonce", (_label, value) => {
    const policy = buildContentSecurityPolicy(production, null, value);

    expect(isCspNonce(value)).toBe(false);
    expect(policy).toBe(buildContentSecurityPolicy(production, null));
    if (value.length > 0) expect(policy).not.toContain(value);
    expect(nextScriptNonceFromHeader(policy)).toBeUndefined();
  });

  it("generates unguessable, unique, Next-compatible nonces", () => {
    const generated = Array.from({ length: 64 }, () => createCspNonce());

    expect(generated.every((value) => value !== null)).toBe(true);
    expect(new Set(generated).size).toBe(generated.length);
    for (const value of generated) {
      expect(isCspNonce(value!)).toBe(true);
      // 18 random bytes is 144 bits of entropy, base64 as 24 unpadded symbols.
      expect(value).toHaveLength(24);
      expect(value).not.toContain("=");
    }
  });

  it("emits no nonce when the runtime exposes no random source", () => {
    // Fail closed: a missing primitive degrades to the nonce-free policy rather
    // than to a guessable value.
    expect(
      createCspNonce({} as unknown as Pick<Crypto, "getRandomValues">),
    ).toBeNull();

    vi.stubGlobal("crypto", undefined);
    try {
      expect(createCspNonce()).toBeNull();
      expect(buildContentSecurityPolicy(production, null, null)).toBe(
        buildContentSecurityPolicy(production, null),
      );
    } finally {
      vi.unstubAllGlobals();
    }

    expect(createCspNonce()).not.toBeNull();
  });

  it("treats every cache policy this app emits as shared unless it is private", () => {
    // The fail-closed rule behind NONCE_CSP_HEADER: an enforced nonce may only
    // ride a response a shared cache must not store, because a cached nonce is
    // a fixed nonce that authorizes anyone who reads the document.
    expect(isSharedCacheable(cacheHeaderFor(crawlRoute("public-short")))).toBe(
      true,
    );
    expect(isSharedCacheable(cacheHeaderFor(crawlRoute("public-static")))).toBe(
      true,
    );
    expect(
      isSharedCacheable(cacheHeaderFor(crawlRoute("private-no-store"))),
    ).toBe(false);

    // Absent, empty, or unrecognized policies fail closed.
    expect(isSharedCacheable(null)).toBe(true);
    expect(isSharedCacheable(undefined)).toBe(true);
    expect(isSharedCacheable("")).toBe(true);
    expect(isSharedCacheable("max-age=0, must-revalidate")).toBe(true);

    expect(isSharedCacheable("private, no-cache, no-store, max-age=0")).toBe(
      false,
    );
    expect(isSharedCacheable("  PRIVATE ,  Max-Age=60 ")).toBe(false);
  });

  it("stages the nonce policy as report-only until the remaining work lands", () => {
    // Enforcing requires the component <style> refactor, the noscript
    // stylesheet, and a Turnstile nonce, all of which live outside this file.
    expect(NONCE_CSP_HEADER).toBe("Content-Security-Policy-Report-Only");
    expect(cspDispositionOf(NONCE_CSP_HEADER)).toBe("report");
    expect(cspDispositionOf("Content-Security-Policy")).toBe("enforce");
    expect(NONCE_REQUEST_HEADER).toBe("x-nonce");
    // While report-only, the enforced baseline must stay permissive so no
    // document can break on a policy nothing has verified in a browser yet.
    expect(
      directive(buildContentSecurityPolicy(production, null), "script-src"),
    ).toContain("'unsafe-inline'");
  });
});

describe("report-only canary", () => {
  const nonce = "AbCdEfGhIjKlMnOpQrStUv";

  // The exact string next.config.ts shipped as the enforced policy before the
  // canary grew a reporting destination. Pinned byte for byte: the report-only
  // work must not move the enforced baseline at all.
  const ENFORCED_PRODUCTION_POLICY =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; media-src 'self'; manifest-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";

  it("leaves the enforced policy byte-identical", () => {
    expect(buildContentSecurityPolicy(production, null)).toBe(
      ENFORCED_PRODUCTION_POLICY,
    );
    expect(buildContentSecurityPolicy(production, null, null, "enforce")).toBe(
      ENFORCED_PRODUCTION_POLICY,
    );
    expect(
      buildSecurityHeaders(production, null).find(
        ({ key }) => key === "Content-Security-Policy",
      )?.value,
    ).toBe(ENFORCED_PRODUCTION_POLICY);
  });

  it("omits the directives browsers ignore in a report-only policy", () => {
    // WebKit and Chromium each log an error-level console message for every
    // directive they ignore in report-only mode; both of these can only be
    // enforced, so a report-only variant carrying them is a defect.
    const reported = buildContentSecurityPolicy(production, null, nonce, "report");

    expect(reported).not.toContain("frame-ancestors");
    expect(reported).not.toContain("upgrade-insecure-requests");
    // They stay with the enforced variant, where they work.
    const enforced = buildContentSecurityPolicy(production, null, nonce, "enforce");
    expect(enforced).toContain("frame-ancestors 'none'");
    expect(enforced).toContain("upgrade-insecure-requests");
  });

  it("names the reporting destination on both channels", () => {
    // WebKit complains, in the console, about a report-only policy with no
    // destination. report-uri serves WebKit; report-to names the Reporting
    // API group Chromium delivers on.
    const reported = buildContentSecurityPolicy(production, null, nonce, "report");

    expect(directive(reported, "report-uri")).toBe("report-uri /api/csp-report");
    expect(directive(reported, "report-to")).toBe("report-to csp-canary");
    expect(CSP_REPORT_PATH).toBe("/api/csp-report");
    expect(CSP_REPORT_GROUP).toBe("csp-canary");
    // The enforced variant reports nothing, exactly as the baseline does.
    expect(buildContentSecurityPolicy(production, null, nonce)).not.toContain(
      "report-",
    );
  });

  it("differs from the enforced nonce policy only where report-only mode demands", () => {
    const environment = {
      ...production,
      NEXT_PUBLIC_SENTRY_DSN: "https://012345abcdef@o123.ingest.sentry.io/456",
      VERCEL: "1",
      VERCEL_TELEMETRY_ENABLED: "true",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "configured",
    } satisfies SecurityHeaderEnvironment;
    const origin = "https://project-ref.supabase.co";
    const enforced = buildContentSecurityPolicy(environment, origin, nonce);
    const reported = buildContentSecurityPolicy(environment, origin, nonce, "report");

    // Measurement is only trustworthy if the reported policy is the enforced
    // one minus the two directives report-only mode cannot carry, plus the
    // two reporting directives, and nothing else.
    const enforcedNames = directiveNames(enforced);
    expect(directiveNames(reported)).toEqual([
      ...enforcedNames.filter(
        (name) => name !== "frame-ancestors" && name !== "upgrade-insecure-requests",
      ),
      "report-uri",
      "report-to",
    ]);
    const enforcedDirectives = new Set(enforced.split("; "));
    for (const entry of reported.split("; ")) {
      if (entry.startsWith("report-")) continue;
      expect(enforcedDirectives.has(entry), entry).toBe(true);
    }
  });

  it("keeps the report-only variant readable by Next's nonce extractor", () => {
    const generated = createCspNonce();
    expect(generated).not.toBeNull();

    const reported = buildContentSecurityPolicy(production, null, generated, "report");
    expect(nextScriptNonceFromHeader(reported)).toBe(generated);
    expect(directive(reported, "script-src")).toBe(
      `script-src 'self' 'nonce-${generated}' 'strict-dynamic'`,
    );
  });

  it("falls back to the nonce-free shape for a malformed nonce in report-only mode too", () => {
    const reported = buildContentSecurityPolicy(
      production,
      null,
      "abcdefghijklmnop'; script-src *",
      "report",
    );

    expect(reported).not.toContain("script-src *");
    expect(directive(reported, "script-src")).toBe(
      "script-src 'self' 'unsafe-inline'",
    );
    expect(nextScriptNonceFromHeader(reported)).toBeUndefined();
  });

  it("ships a correctly quoted Reporting-Endpoints header for the report-to group", () => {
    const headers = buildSecurityHeaders(production, null);
    const reportingEndpoints = headers.find(
      ({ key }) => key === "Reporting-Endpoints",
    )?.value;

    expect(reportingEndpoints).toBe('csp-canary="/api/csp-report"');
    expect(reportingEndpoints).toBe(CSP_REPORTING_ENDPOINTS);
    // A Structured Field dictionary: bare key, quoted string value, and the
    // key is the exact group the report-only policy's report-to names.
    expect(reportingEndpoints).toMatch(/^[a-z][a-z0-9_.*-]*="[^"\\\s]+"$/);
    expect(reportingEndpoints?.split("=")[0]).toBe(CSP_REPORT_GROUP);
    expect(reportingEndpoints).toContain(`"${CSP_REPORT_PATH}"`);
  });
});
