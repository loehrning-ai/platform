import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  sentryOriginFromDsn,
  type SecurityHeaderEnvironment,
} from "../../security-headers";

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
