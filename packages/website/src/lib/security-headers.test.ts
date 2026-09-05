import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  createCspNonce,
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
    expect(NONCE_REQUEST_HEADER).toBe("x-nonce");
    // While report-only, the enforced baseline must stay permissive so no
    // document can break on a policy nothing has verified in a browser yet.
    expect(
      directive(buildContentSecurityPolicy(production, null), "script-src"),
    ).toContain("'unsafe-inline'");
  });
});
