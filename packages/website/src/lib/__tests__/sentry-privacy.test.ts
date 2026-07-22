import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isCertificateVerificationUrl,
  prepareSentryBreadcrumb,
  prepareSentryEvent,
  prepareSentrySpan,
} from "@/lib/observability/sentry-privacy";
import { COURSE_SLUGS } from "@/lib/course/types";

function certificateFragment(): string {
  return btoa(
    JSON.stringify({
      n: "Erika Mustermann",
      s: 92,
      d: "2026-07-14T10:00:00.000Z",
      c: "ki-fuehrerschein",
    }),
  );
}

describe("Sentry certificate and URL privacy", () => {
  //: derived from the canonical COURSE_SLUGS union (now 10
  // values) instead of a hardcoded 4-slug list — a course outside the
  // original 4 must redact its verification route just as reliably, or its
  // learner's name + score would leak to Sentry.
  it("recognizes every certificate verification route with a private fragment, for every canonical course slug", () => {
    for (const course of COURSE_SLUGS) {
      expect(
        isCertificateVerificationUrl(
          `https://loehrning.ai/${course}/verifizierung#${certificateFragment()}`,
        ),
        course,
      ).toBe(true);
    }
  });

  it("drops browser errors and transactions on a verification route", () => {
    const href = `https://loehrning.ai/ki-fuehrerschein/verifizierung#${certificateFragment()}`;
    const event = {
      request: { url: href },
      transaction: `/ki-fuehrerschein/verifizierung#${certificateFragment()}`,
    };
    expect(prepareSentryEvent(event, href)).toBeNull();
    expect(
      JSON.stringify(prepareSentryEvent({ request: { url: href } })),
    ).not.toContain("Erika Mustermann");
  });

  it("drops verification breadcrumbs even after navigation away", () => {
    expect(
      prepareSentryBreadcrumb(
        {
          category: "navigation",
          data: {
            from: `https://loehrning.ai/ai-native/verifizierung#${certificateFragment()}`,
            to: "https://loehrning.ai/kurse",
          },
        },
        "https://loehrning.ai/kurse",
      ),
    ).toBeNull();

    expect(
      prepareSentryEvent(
        {
          message: `Navigation failed at https://loehrning.ai/ai-native/verifizierung#${certificateFragment()}`,
        },
        "https://loehrning.ai/kurse",
      ),
    ).toBeNull();
  });

  it("strips request headers and cookies so session tokens never reach Sentry", () => {
    // The RequestData integration attaches full request headers and parsed
    // cookies even with sendDefaultPii: false — a server error would otherwise
    // upload the Supabase sb-*-auth-token session cookie.
    const event = {
      request: {
        url: "https://loehrning.ai/feedback",
        headers: {
          cookie: "sb-project-ref-auth-token=topsecret; other=1",
          authorization: "Bearer topsecret",
          "user-agent": "vitest",
        },
        cookies: { "sb-project-ref-auth-token": "topsecret" },
        env: { REMOTE_ADDR: "203.0.113.42", OTHER_VAR: "kept" },
      },
    };
    const result = prepareSentryEvent(event);

    expect(result?.request.url).toBe("https://loehrning.ai/feedback");
    expect(result?.request.headers).toBeUndefined();
    expect(result?.request.cookies).toBeUndefined();
    expect(result?.request.env.OTHER_VAR).toBe("kept");
    expect(JSON.stringify(result)).not.toContain("topsecret");
  });

  it("strips query strings and fragments from all other event URLs", () => {
    const event = {
      request: {
        url: "https://loehrning.ai/feedback?email=person%40example.invalid#private",
        env: { REMOTE_ADDR: "203.0.113.42", OTHER_VAR: "kept" },
      },
      user: { ip_address: "203.0.113.42" },
      breadcrumbs: [{ data: { url: "/kurse?persona=einsteiger#start" } }],
    };
    const result = prepareSentryEvent(event);

    expect(result?.request.url).toBe("https://loehrning.ai/feedback");
    expect(result?.request.env.REMOTE_ADDR).toBeUndefined();
    expect(result?.request.env.OTHER_VAR).toBe("kept");
    expect(result?.user.ip_address).toBeUndefined();
    expect(result?.breadcrumbs[0]?.data.url).toBe("/kurse");

    const embedded = prepareSentryEvent({
      message:
        "Request failed at https://loehrning.ai/feedback?email=person%40example.invalid#private.",
    });
    expect(embedded?.message).toBe(
      "Request failed at https://loehrning.ai/feedback.",
    );
  });

  it("removes private verification data from an already active span", () => {
    const fragment = certificateFragment();
    const span = {
      trace_id: "a".repeat(32),
      span_id: "b".repeat(16),
      description: `GET /ai-native/verifizierung#${fragment}`,
      data: { url: `https://loehrning.ai/ai-native/verifizierung#${fragment}` },
    };
    const result = prepareSentrySpan(span);
    const serialized = JSON.stringify(result);

    expect(result.trace_id).toBe("a".repeat(32));
    expect(result.description).toBe("certificate verification route redacted");
    expect(serialized).not.toContain(fragment);
    expect(serialized).not.toContain("Mustermann");
  });

  it("wires every browser SDK transmission hook to the privacy boundary", () => {
    const instrumentation = readFileSync(
      resolve(process.cwd(), "src/instrumentation-client.ts"),
      "utf8",
    );

    for (const hook of [
      "tracesSampler",
      "beforeSend:",
      "beforeSendTransaction:",
      "beforeBreadcrumb:",
      "beforeSendSpan:",
      "onRouterTransitionStart",
    ]) {
      expect(instrumentation, hook).toContain(hook);
    }
    expect(instrumentation).toContain("isCertificateVerificationUrl");
    expect(instrumentation).toContain("prepareSentryEvent");
    expect(instrumentation).toContain("prepareSentryBreadcrumb");
    expect(instrumentation).toContain("prepareSentrySpan");

    for (const configPath of [
      "sentry.server.config.ts",
      "sentry.edge.config.ts",
    ]) {
      const config = readFileSync(resolve(process.cwd(), configPath), "utf8");
      expect(config, configPath).toContain("tracesSampler");
      expect(config, configPath).toContain("isCertificateVerificationUrl");
      expect(config, configPath).toContain("beforeSendTransaction:");
      expect(config, configPath).toContain("beforeSendSpan:");
      expect(config, configPath).toContain("prepareSentryEvent");
      expect(config, configPath).toContain("prepareSentrySpan");
    }

    const nextConfig = readFileSync(
      resolve(process.cwd(), "next.config.ts"),
      "utf8",
    );
    expect(nextConfig).toContain("telemetry: false");
  });
});
