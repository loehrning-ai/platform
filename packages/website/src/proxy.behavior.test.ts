import { beforeEach, describe, expect, it, vi } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import {
  isSharedCacheable,
  NONCE_CSP_HEADER,
  NONCE_REQUEST_HEADER,
} from "../security-headers";

function directive(policy: string, name: string): string {
  const match = policy
    .split("; ")
    .find(
      (candidate) => candidate.startsWith(`${name} `) || candidate === name,
    );
  if (!match) throw new Error(`Missing CSP directive: ${name}`);
  return match;
}

const mockRefreshAuthSession = vi.fn();
const mockReportApiError = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  refreshAuthSession: (...args: unknown[]) => mockRefreshAuthSession(...args),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

import { config, proxy } from "./proxy";

function authContinuation() {
  const response = NextResponse.next();
  response.headers.set("x-arbitrary-internal", "must-not-copy");
  response.headers.set("pragma", "no-cache");
  response.cookies.set({
    name: "sb-access",
    value: "access-token",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set({
    name: "sb-refresh",
    value: "refresh-token",
    httpOnly: true,
    secure: true,
    path: "/auth",
  });
  return response;
}

beforeEach(() => {
  mockRefreshAuthSession.mockReset();
  mockReportApiError.mockReset();
});

describe("proxy matcher", () => {
  it.each([
    ["/kurse", true],
    ["/api/progress", true],
    ["/downloads/example.pdf", true],
    ["/_next/static/chunks/app.js", false],
    ["/_next/image?url=%2Fcourse-card.png&w=640&q=75", false],
    ["/images/course-card.png", false],
    ["/images/course-card.webp", false],
    ["/logo.svg", false],
    ["/favicon.ico", false],
  ] as const)("matches %s: %s", (url, expected) => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url,
      }),
    ).toBe(expected);
  });
});

describe("protected proxy terminal responses", () => {
  it("returns a real 503 without leaking the continuation control header", async () => {
    mockRefreshAuthSession.mockResolvedValue({
      configured: true,
      response: authContinuation(),
      user: null,
      error: new Error("auth backend unavailable"),
    });

    const response = await proxy(
      new NextRequest("http://localhost/api/progress"),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(response.headers.get("x-arbitrary-internal")).toBeNull();
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(
      response.cookies
        .getAll()
        .map(({ name }) => name)
        .sort(),
    ).toEqual(["sb-access", "sb-refresh"]);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("sb-access=access-token");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toContain("sb-refresh=refresh-token");
    expect(setCookie).toContain("Path=/auth");
    expect(setCookie).toContain("Secure");
  });

  it("returns a real 401 for an anonymous protected API request", async () => {
    mockRefreshAuthSession.mockResolvedValue({
      configured: true,
      response: authContinuation(),
      user: null,
      error: null,
    });

    const response = await proxy(
      new NextRequest("http://localhost/api/progress"),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

  it("never reflects an untrusted authority into the login redirect", async () => {
    mockRefreshAuthSession.mockResolvedValue({
      configured: true,
      response: authContinuation(),
      user: null,
      error: null,
    });

    const response = await proxy(
      new NextRequest("https://attacker.example/konto?private=value"),
    );

    expect(response.status).toBe(307);
    const target = new URL(response.headers.get("location") ?? "");
    expect(target.origin).toBe("https://loehrning.ai");
    expect(target.pathname).toBe("/login");
    expect(target.searchParams.get("next")).toBe("/konto?private=value");
  });

  it("converts a rejected auth refresh into one reported protected-API 503", async () => {
    const refreshError = new Error("middleware auth refresh rejected");
    mockRefreshAuthSession.mockRejectedValueOnce(refreshError);

    const response = await proxy(
      new NextRequest("http://localhost/api/progress"),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "auth-get-user",
        error: refreshError,
      }),
    );
  });

  it("preserves existing Vary tokens when adding the Cookie variance", async () => {
    const continuation = authContinuation();
    continuation.headers.set("Vary", "RSC, Next-Router-State-Tree");
    mockRefreshAuthSession.mockResolvedValue({
      configured: true,
      response: continuation,
      user: { id: "user-1" },
      error: null,
    });

    const response = await proxy(
      new NextRequest("http://localhost/api/progress"),
    );

    const vary = (response.headers.get("vary") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase());
    expect(response.status).toBe(200);
    expect(vary).toEqual(["rsc", "next-router-state-tree", "cookie"]);
  });
});

describe("route-level authentication boundaries", () => {
  it("continues the exact book PDF route with private crawl and cache headers", async () => {
    const response = await proxy(
      new NextRequest(
        "http://localhost/api/buecher/ki-landschaft/download.pdf",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(
      (response.headers.get("vary") ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase()),
    ).toContain("cookie");
    expect(mockRefreshAuthSession).not.toHaveBeenCalled();
  });

  it.each([
    "/api/buecher/ki-landschaft/download.pdf/extra",
    "/api/buecher/ki-landschaft/other.pdf",
    "/api/unknown",
  ])("keeps unknown or near-miss API %s fail-closed", async (path) => {
    mockRefreshAuthSession.mockResolvedValue({
      configured: true,
      response: authContinuation(),
      user: null,
      error: null,
    });

    const response = await proxy(new NextRequest(`http://localhost${path}`));

    expect(response.status).toBe(401);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1);
  });
});

describe("public cache contract", () => {
  it.each(["/", "/en", "/robots.txt", "/sitemap.xml"])(
    "applies the declared public cache policy to %s",
    async (path) => {
      const response = await proxy(new NextRequest(`http://localhost${path}`));

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe(
        "public, max-age=3600, s-maxage=3600",
      );
      expect(
        (response.headers.get("vary") ?? "")
          .split(",")
          .map((value) => value.trim().toLowerCase()),
      ).not.toContain("cookie");
      expect(mockRefreshAuthSession).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["POST", "/api/feedback"],
    ["POST", "/api/ai-native/grade-exercise"],
    ["GET", "/api/health"],
  ])(
    "leaves final cache authority to the %s %s route handler",
    async (method, path) => {
      const response = await proxy(
        new NextRequest(`http://localhost${path}`, { method }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBeNull();
      expect(mockRefreshAuthSession).not.toHaveBeenCalled();
    },
  );
});

describe("retired API boundaries", () => {
  it.each(["/api/scan", "/api/journey/scan-insight", "/api/journey/leads"])(
    "returns an exact terminal 410 for %s without consulting auth",
    async (path) => {
      const response = await proxy(
        new NextRequest(`http://localhost${path}`, { method: "POST" }),
      );

      expect(response.status).toBe(410);
      expect(response.headers.get("x-middleware-next")).toBeNull();
      expect(response.headers.get("x-robots-tag")).toBe(
        "noindex, nofollow, noarchive",
      );
      expect(response.headers.get("cache-control")).toBe(
        "public, max-age=3600, s-maxage=3600",
      );
      expect(mockRefreshAuthSession).not.toHaveBeenCalled();
    },
  );

  it.each([
    "/api/scan/extra",
    "/api/journey/scan-insight/extra",
    "/api/journey/leads/extra",
  ])("does not retire the unknown descendant %s", async (path) => {
    mockRefreshAuthSession.mockResolvedValue({
      configured: true,
      response: authContinuation(),
      user: null,
      error: null,
    });

    const response = await proxy(
      new NextRequest(`http://localhost${path}`, { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1);
  });
});

describe("retired redirect authority", () => {
  it("uses the canonical origin for an untrusted request authority", async () => {
    const response = await proxy(
      new NextRequest("https://attacker.example/blog/digify?secret=value"),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://loehrning.ai/blog");
    expect(response.headers.get("x-robots-tag")).toBeNull();
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=3600, s-maxage=3600",
    );
    expect(mockRefreshAuthSession).not.toHaveBeenCalled();
  });
});

describe("locale routing and authentication boundaries", () => {
  it("forwards an English filesystem route with a trusted locale header", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/en/kurse", {
        headers: { "x-loehrning-locale": "de" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(
      response.headers.get("x-middleware-request-x-loehrning-locale"),
    ).toBe("en");
    expect(response.headers.get("x-robots-tag")).toBeNull();
    expect(mockRefreshAuthSession).not.toHaveBeenCalled();
  });

  it("keeps unprefixed German canonical and overwrites a spoofed locale header", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/kurse", {
        headers: { "x-loehrning-locale": "en" },
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(
      response.headers.get("x-middleware-request-x-loehrning-locale"),
    ).toBe("de");
  });

  it("permanently removes an explicit German prefix while preserving query state", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/de/kurse?persona=technik"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "http://localhost/kurse?persona=technik",
    );
  });

  it.each([
    ["/en/auth/callback?code=opaque", "/auth/callback?code=opaque"],
    ["/en/api/progress", "/api/progress"],
    ["/en/robots.txt", "/robots.txt"],
    ["/en/schema/knowledge-graph/v1", "/schema/knowledge-graph/v1"],
  ])("keeps the infrastructure path %s unprefixed", async (source, target) => {
    const response = await proxy(new NextRequest(`http://localhost${source}`));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`http://localhost${target}`);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockRefreshAuthSession).not.toHaveBeenCalled();
  });

  it.each(["ki-fuehrerschein", "ki-und-gesellschaft"] as const)(
    "classifies the English %s reader by its stripped path",
    async (courseSlug) => {
      mockRefreshAuthSession.mockImplementationOnce(
        async (
          _request: NextRequest,
          _headers: Headers,
          response: NextResponse,
        ) => ({
          configured: true,
          response,
          user: null,
          error: null,
        }),
      );

      const response = await proxy(
        new NextRequest(
          `http://localhost/en/${courseSlug}/kurs/block-1?step=2`,
        ),
      );

      expect(response.status).toBe(307);
      const target = new URL(response.headers.get("location") ?? "");
      expect(target.pathname).toBe("/en/login");
      expect(target.searchParams.get("next")).toBe(
        `/en/${courseSlug}/kurs/block-1?step=2`,
      );
      expect(target.searchParams.get("reason")).toBe("kurs-login");
      const forwardedHeaders = mockRefreshAuthSession.mock
        .calls[0]?.[1] as Headers;
      expect(forwardedHeaders.get("x-loehrning-locale")).toBe("en");
    },
  );

  it.each(["ki-fuehrerschein", "ki-und-gesellschaft"] as const)(
    "preserves refreshed auth cookies on the authenticated English %s route",
    async (courseSlug) => {
      mockRefreshAuthSession.mockImplementationOnce(
        async (
          _request: NextRequest,
          _headers: Headers,
          response: NextResponse,
        ) => {
          response.cookies.set({
            name: "sb-access",
            value: "refreshed",
            httpOnly: true,
            path: "/",
          });
          return {
            configured: true,
            response,
            user: { id: "user-1" },
            error: null,
          };
        },
      );

      const response = await proxy(
        new NextRequest(`http://localhost/en/${courseSlug}/kurs/block-1`),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(response.cookies.get("sb-access")?.value).toBe("refreshed");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("x-robots-tag")).toBe(
        "noindex, nofollow, noarchive",
      );
    },
  );

  it("localizes retired human-route redirects without trusting the request authority", async () => {
    const response = await proxy(
      new NextRequest("https://attacker.example/en/leistungen"),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://loehrning.ai/en/ueber-mich",
    );
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });

  it.each([
    ["/en/wie-ki-funktioniert", "/en/einstieg"],
    ["/en/wie-ki-funktioniert/lektion-1-vorhersage", "/en/einstieg"],
    ["/en/bekannte-grenzen", "/en/hilfe#grenzen"],
    ["/en/ueber-die-plattform", "/en/ueber-mich"],
  ])("permanently redirects retired route %s to %s", async (from, to) => {
    const response = await proxy(
      new NextRequest(`https://loehrning.ai${from}`),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`https://loehrning.ai${to}`);
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });

  it("terminates ambiguous encoded path separators before route classification", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/en/%252fapi/progress"),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(mockRefreshAuthSession).not.toHaveBeenCalled();
  });
});

function forwardedRequestHeader(
  response: NextResponse,
  key: string,
): string | null {
  return response.headers.get(`x-middleware-request-${key}`);
}

function forwardedHeaderKeys(response: NextResponse): string[] {
  return (response.headers.get("x-middleware-override-headers") ?? "")
    .split(",")
    .map((key) => key.trim().toLowerCase())
    .filter(Boolean);
}

function nonceOf(policy: string | null): string | null {
  const match = policy?.match(/'nonce-([A-Za-z0-9+/_-]+={0,2})'/);
  return match ? match[1] : null;
}

/** Mirror the real refresh, which returns the continuation it was handed. */
function passThroughAuth(user: { id: string } | null) {
  return async (
    _request: NextRequest,
    _headers: Headers,
    response: NextResponse,
  ) => ({ configured: true, response, user, error: null });
}

describe("content security policy nonce", () => {
  it("forwards a per-request nonce policy and publishes the same policy", async () => {
    const response = await proxy(new NextRequest("http://localhost/"));

    const forwarded = forwardedRequestHeader(
      response,
      "content-security-policy-report-only",
    );
    // Next reads the request header to decide which nonce to stamp into the
    // document, so the published policy must be the identical string.
    expect(forwarded).toBeTruthy();
    expect(response.headers.get(NONCE_CSP_HEADER)).toBe(forwarded);

    const nonce = nonceOf(forwarded);
    expect(nonce).toBeTruthy();
    expect(forwardedRequestHeader(response, NONCE_REQUEST_HEADER)).toBe(nonce);
    expect(directive(forwarded!, "script-src")).toBe(
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    );
    expect(directive(forwarded!, "script-src")).not.toContain(
      "'unsafe-inline'",
    );
  });

  it("never lets a client choose the nonce Next stamps", async () => {
    // Before this guard, proxy.ts copied every inbound header, so a request
    // carrying Content-Security-Policy reached Next and made it stamp an
    // attacker-chosen nonce into every script tag on the page.
    const response = await proxy(
      new NextRequest("http://localhost/", {
        headers: {
          "content-security-policy": "script-src 'nonce-ATTACKERNONCEAAAAAAAA'",
          "content-security-policy-report-only":
            "script-src 'nonce-ATTACKERNONCEBBBBBBBB'",
          "x-nonce": "ATTACKERNONCECCCCCCCC",
        },
      }),
    );

    // The enforced request header is dropped outright: Next prefers it over the
    // report-only one, so forwarding it would override the proxy's policy.
    expect(forwardedHeaderKeys(response)).not.toContain(
      "content-security-policy",
    );
    expect(
      forwardedRequestHeader(response, "content-security-policy"),
    ).toBeNull();

    const forwarded = forwardedRequestHeader(
      response,
      "content-security-policy-report-only",
    );
    expect(forwarded).not.toContain("ATTACKER");
    expect(forwardedRequestHeader(response, NONCE_REQUEST_HEADER)).not.toBe(
      "ATTACKERNONCECCCCCCCC",
    );
    expect(nonceOf(forwarded)).toBe(
      forwardedRequestHeader(response, NONCE_REQUEST_HEADER),
    );
    expect(response.headers.get(NONCE_CSP_HEADER)).not.toContain("ATTACKER");
  });

  it("issues a fresh nonce per request", async () => {
    const nonces = await Promise.all(
      Array.from({ length: 8 }, async () =>
        nonceOf(
          forwardedRequestHeader(
            await proxy(new NextRequest("http://localhost/kurse")),
            "content-security-policy-report-only",
          ),
        ),
      ),
    );

    expect(nonces.every(Boolean)).toBe(true);
    expect(new Set(nonces).size).toBe(nonces.length);
  });

  it.each([
    ["/", "public, max-age=3600, s-maxage=3600"],
    ["/en", "public, max-age=3600, s-maxage=3600"],
    ["/login", null],
  ])(
    "reports rather than enforces on the shared-cacheable document %s",
    async (path, cacheControl) => {
      mockRefreshAuthSession.mockImplementation(passThroughAuth(null));

      const response = await proxy(new NextRequest(`http://localhost${path}`));

      expect(response.headers.get("cache-control")).toBe(cacheControl);
      // A nonce inside a document a shared cache may store is a fixed nonce.
      // Report-only carries no capability, so it is safe here; an enforced
      // policy would not be.
      expect(isSharedCacheable(response.headers.get("cache-control"))).toBe(
        true,
      );
      expect(response.headers.get(NONCE_CSP_HEADER)).toBeTruthy();
    },
  );

  it.each([
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/api/knowledge-graph.json",
    "/api/health",
    "/favicon.ico",
    "/og-image.png",
  ])("issues no nonce for the script-free machine route %s", async (path) => {
    const response = await proxy(new NextRequest(`http://localhost${path}`));

    expect(response.headers.get(NONCE_CSP_HEADER)).toBeNull();
    expect(
      forwardedRequestHeader(response, "content-security-policy-report-only"),
    ).toBeNull();
    expect(forwardedRequestHeader(response, NONCE_REQUEST_HEADER)).toBeNull();
  });

  it.each([
    "/",
    "/en",
    "/kurse",
    "/login",
    "/konto",
    "/api/progress",
    "/robots.txt",
    "/favicon.ico",
    "/api/feedback",
  ])(
    "never enforces a nonce policy on a shared-cacheable response for %s",
    async (path) => {
      // The invariant that survives the flip to enforcement: whatever else
      // changes, an enforced nonce may only ride a response a shared cache must
      // not store.
      mockRefreshAuthSession.mockImplementation(
        passThroughAuth({ id: "user-1" }),
      );

      const response = await proxy(new NextRequest(`http://localhost${path}`));
      const enforced = response.headers.get("content-security-policy");

      if (enforced && nonceOf(enforced)) {
        expect(isSharedCacheable(response.headers.get("cache-control"))).toBe(
          false,
        );
      }
      expect(response.headers.get("content-security-policy")).toBeNull();
    },
  );

  it("keeps the nonce on an authenticated private document", async () => {
    mockRefreshAuthSession.mockImplementation(
      passThroughAuth({ id: "user-1" }),
    );

    const response = await proxy(new NextRequest("http://localhost/konto"));

    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(isSharedCacheable(response.headers.get("cache-control"))).toBe(
      false,
    );
    expect(nonceOf(response.headers.get(NONCE_CSP_HEADER))).toBe(
      forwardedRequestHeader(response, NONCE_REQUEST_HEADER),
    );
  });

  it("leaves terminal responses without a nonce policy", async () => {
    // Redirects and gone responses render no document, so there is nothing for
    // a nonce to authorize.
    for (const path of ["/de/kurse", "/blog/digify", "/en/%252fapi/progress"]) {
      const response = await proxy(new NextRequest(`http://localhost${path}`));

      expect(response.headers.get(NONCE_CSP_HEADER)).toBeNull();
      expect(response.headers.get("content-security-policy")).toBeNull();
    }
  });
});
