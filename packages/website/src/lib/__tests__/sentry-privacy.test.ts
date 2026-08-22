import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  certificateVerificationPath,
  errorOnlySentryIntegrations,
  isCertificateVerificationUrl,
  prepareSentryBreadcrumb,
  prepareSentryEvent,
  prepareSentrySpan,
} from "@/lib/observability/sentry-privacy";
import { COURSE_SLUGS } from "@/lib/course/types";

const JWT_HEADER_CANARY = ["eyJ", "hbGci", "OiJIUzI1NiJ9"].join("");
const JWT_CANARY = `${JWT_HEADER_CANARY}.payload.sig`;
const PRIVATE_SOURCE_PATH_CANARY = [
  "",
  "Users",
  "alice",
  "Clients",
  "private-project",
  "src",
  "route.ts",
].join("/");

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

describe("Sentry certificate and payload privacy", () => {
  // Derived from the canonical COURSE_SLUGS union instead of a hardcoded
  // four-slug list: a course outside the original set must redact its
  // verification route just as reliably, or its learner's name and score
  // would leak to Sentry.
  it("recognizes every certificate verification route with a private fragment, for every canonical course slug", () => {
    for (const course of COURSE_SLUGS) {
      expect(
        isCertificateVerificationUrl(
          `https://loehrning.ai${certificateVerificationPath(course)}#${certificateFragment()}`,
        ),
        course,
      ).toBe(true);
    }
  });

  it("canonicalizes encoded route segments and rejects malformed encodings", () => {
    expect(
      isCertificateVerificationUrl(
        "https://loehrning.ai/ki-fuehrerschein/%76erifizierung#private",
      ),
    ).toBe(true);
    expect(
      isCertificateVerificationUrl(
        "https://loehrning.ai/kurse/open-source/codex/%76erifizierung",
      ),
    ).toBe(true);
    expect(
      isCertificateVerificationUrl(
        "https://loehrning.ai/ki-fuehrerschein/%ZZerifizierung",
      ),
    ).toBe(false);
    expect(
      isCertificateVerificationUrl(
        "https://loehrning.ai/ki-fuehrerschein/verifizierung#%ZZ-private",
      ),
    ).toBe(true);
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

    expect(result?.request).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("topsecret");
  });

  it("omits request URLs, user context, and breadcrumbs", () => {
    const event = {
      request: {
        url: "https://loehrning.ai/feedback?email=person%40example.invalid#private",
        env: { REMOTE_ADDR: "203.0.113.42", OTHER_VAR: "kept" },
      },
      user: { ip_address: "203.0.113.42" },
      breadcrumbs: [{ data: { url: "/kurse?persona=einsteiger#start" } }],
    };
    const result = prepareSentryEvent(event);

    expect(result?.request).toBeUndefined();
    expect(result?.user).toBeUndefined();
    expect(result?.breadcrumbs).toBeUndefined();

    const embedded = prepareSentryEvent({
      message:
        "Request failed at https://loehrning.ai/feedback?email=person%40example.invalid#private.",
    });
    expect(embedded?.message).toBe(
      "application-error",
    );
  });

  it("removes arbitrary free text from every automatic error surface", () => {
    const secret = `learner@example.com private-prompt ${JWT_HEADER_CANARY}`;
    const event = {
      message: secret,
      culprit: secret,
      logger: secret,
      fingerprint: [secret],
      template: secret,
      params: [secret],
      request: {
        url: "https://loehrning.ai/api/progress?email=learner@example.com",
        method: "POST",
        data: secret,
        query_string: secret,
        headers: { authorization: secret },
        cookies: { session: secret },
        env: { PRIVATE: secret },
      },
      user: { id: secret, email: secret, ip_address: secret },
      extra: { prompt: secret },
      contexts: { response: { body: secret } },
      tags: {
        route: "/api/progress",
        prompt: secret,
        errorCode: "PGRST500",
      },
      exception: {
        values: [
          {
            type: "PostgrestError",
            value: secret,
            mechanism: { type: "generic", data: { body: secret } },
            stacktrace: {
              frames: [
                {
                  filename: "/var/task/route.ts?token=private",
                  vars: { answer: secret },
                  pre_context: [secret],
                  context_line: secret,
                  post_context: [secret],
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: [
        {
          category: "console",
          message: secret,
          data: { arguments: [secret], url: `/${secret}` },
        },
      ],
      spans: [
        {
          trace_id: "a".repeat(32),
          span_id: "b".repeat(16),
          description: secret,
          data: { requestBody: secret },
        },
      ],
      unknown_protocol_extension: {
        token: secret,
      },
    };

    const result = prepareSentryEvent(event);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("learner@example.com");
    expect(serialized).not.toContain("private-prompt");
    expect(serialized).not.toContain("eyJhbGci");
    expect(result?.message).toBe("application-error");
    expect(result?.request).toEqual({ method: "POST" });
    expect(result?.tags).toEqual({
      route: "/api/progress",
      errorCode: "PGRST500",
    });
    expect(result?.exception.values[0]).toMatchObject({
      type: "PostgrestError",
      value: "PostgrestError",
    });
    expect(result?.breadcrumbs).toBeUndefined();
    expect(result?.spans).toBeUndefined();
    expect(result).not.toHaveProperty("unknown_protocol_extension");
  });

  it("rejects identifier-shaped secrets and non-error event types", () => {
    const jwt = JWT_CANARY;
    const event = {
      type: undefined,
      release: jwt,
      transaction: `/reset/${jwt}`,
      tags: {
        route: `/reset/${jwt}`,
        step: jwt,
        errorCode: "ALICE",
        errorName: jwt,
      },
      exception: {
        values: [
          {
            type: "sk-ant-api03-secret",
            value: jwt,
            module: jwt,
            stacktrace: {
              frames: [
                {
                  filename: PRIVATE_SOURCE_PATH_CANARY,
                  function: jwt,
                  module: jwt,
                  module_metadata: { token: jwt },
                  vars: { token: jwt },
                },
              ],
            },
          },
        ],
      },
    };

    const result = prepareSentryEvent(event);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("eyJhbGci");
    expect(serialized).not.toContain("sk-ant");
    expect(serialized).not.toContain("ALICE");
    expect(serialized).not.toContain("/Users/alice");
    expect(serialized).not.toContain("private-project");
    expect(result?.transaction).toBe("application-route");
    expect(result?.tags).toBeUndefined();
    expect(result?.exception.values[0]).toMatchObject({
      type: "ApplicationError",
      value: "ApplicationError",
      stacktrace: { frames: [{ filename: "route.ts" }] },
    });

    expect(
      prepareSentryEvent({
        type: "transaction",
        transaction: "/api/progress",
      }),
    ).toBeNull();
    expect(
      prepareSentryEvent({ type: "feedback", message: "private" }),
    ).toBeNull();
  });

  it("filters integrations that emit unsanitized envelope or context data", () => {
    const integrations = [
      "BrowserSession",
      "Breadcrumbs",
      "Http",
      "RequestData",
      "LocalVariables",
      "HttpContext",
      "CultureContext",
      "VercelAI",
      "ProcessSession",
      "NodeFetch",
      "WinterCGFetch",
      "OnUncaughtException",
      "OnUnhandledRejection",
      "GlobalHandlers",
      "Dedupe",
    ].map((name) => ({ name }));

    expect(
      errorOnlySentryIntegrations(integrations).map(({ name }) => name),
    ).toEqual(["GlobalHandlers", "Dedupe"]);
  });

  it("retains only stable provider-execution error classes", () => {
    for (const type of [
      "PracticeProviderError",
      "SyntheticTerminalExecutionError",
    ]) {
      const result = prepareSentryEvent({
        exception: {
          values: [{ type, value: "private provider detail" }],
        },
      });
      expect(result?.exception.values[0]).toEqual({ type, value: type });
      expect(JSON.stringify(result)).not.toContain("private provider detail");
    }
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
    expect(result.description).toBe("certificate-verification-redacted");
    expect(serialized).not.toContain(fragment);
    expect(serialized).not.toContain("Mustermann");
  });

  it("reconstructs direct spans without descriptions, links, or attributes", () => {
    const secret = JWT_CANARY;
    const span = {
      trace_id: "a".repeat(32),
      span_id: "b".repeat(16),
      parent_span_id: "c".repeat(16),
      start_timestamp: 1,
      timestamp: 2,
      description: secret,
      op: secret,
      origin: secret,
      status: "ok",
      profile_id: secret,
      data: { prompt: secret },
      links: [{ attributes: { prompt: secret } }],
      measurements: { [secret]: { value: 1 } },
    };

    expect(prepareSentrySpan(span)).toEqual({
      trace_id: "a".repeat(32),
      span_id: "b".repeat(16),
      parent_span_id: "c".repeat(16),
      start_timestamp: 1,
      timestamp: 2,
      status: "ok",
      description: "application-operation",
      op: "application",
      data: {},
    });
    expect(JSON.stringify(span)).not.toContain("eyJhbGci");
  });

  it("wires every browser SDK transmission hook to the privacy boundary", () => {
    const instrumentation = readFileSync(
      resolve(process.cwd(), "src/instrumentation-client.ts"),
      "utf8",
    );
    const serverInstrumentation = readFileSync(
      resolve(process.cwd(), "src/instrumentation.ts"),
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
    expect(instrumentation).toContain("tracesSampler: () => 0");
    expect(instrumentation).toContain("errorOnlySentryIntegrations");
    expect(instrumentation).toContain("maxBreadcrumbs: 0");
    expect(instrumentation).toContain("sendClientReports: false");
    expect(instrumentation).toContain("prepareSentryEvent");
    expect(instrumentation).toContain("prepareSentryBreadcrumb");
    expect(instrumentation).toContain("prepareSentrySpan");
    const registerStart = serverInstrumentation.indexOf(
      "export async function register",
    );
    const guardInstall = serverInstrumentation.indexOf(
      "installProductionServerLogPrivacyBoundary();",
      registerStart,
    );
    const dsnRead = serverInstrumentation.indexOf(
      "const dsn =",
      registerStart,
    );
    expect(registerStart).toBeGreaterThanOrEqual(0);
    expect(guardInstall).toBeGreaterThan(registerStart);
    expect(guardInstall).toBeLessThan(dsnRead);
    expect(serverInstrumentation).toContain(
      "writeRedactedServerErrorMarker();",
    );
    expect(serverInstrumentation.match(/catch \{/g)?.length).toBeGreaterThanOrEqual(
      2,
    );

    for (const configPath of [
      "sentry.server.config.ts",
      "sentry.edge.config.ts",
    ]) {
      const config = readFileSync(resolve(process.cwd(), configPath), "utf8");
      expect(config, configPath).toContain("tracesSampler");
      expect(config, configPath).toContain("tracesSampler: () => 0");
      expect(config, configPath).toContain("errorOnlySentryIntegrations");
      expect(config, configPath).toContain("maxBreadcrumbs: 0");
      expect(config, configPath).toContain("sendClientReports: false");
      expect(config, configPath).toContain("beforeSendTransaction:");
      expect(config, configPath).toContain("beforeSendSpan:");
      expect(config, configPath).toContain("prepareSentryEvent");
      expect(config, configPath).toContain("prepareSentrySpan");
    }

    const serverConfig = readFileSync(
      resolve(process.cwd(), "sentry.server.config.ts"),
      "utf8",
    );
    expect(serverConfig).toContain("trackIncomingRequestsAsSessions: false");
    expect(serverConfig).toContain("tracePropagation: false");
    expect(serverConfig).toContain('maxIncomingRequestBodySize: "none"');

    const nextConfig = readFileSync(
      resolve(process.cwd(), "next.config.ts"),
      "utf8",
    );
    expect(nextConfig).toContain("telemetry: false");
  });
});
