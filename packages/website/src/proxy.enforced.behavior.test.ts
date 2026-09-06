import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

/**
 * The proxy with NONCE_CSP_HEADER forced to the enforcing name. Flipping that
 * constant is the whole of the enforcement step, so the shape it will produce
 * is proven here, ahead of the flip: private documents receive an enforced
 * nonce policy, shared-cacheable ones receive no nonce at all.
 */
vi.mock("../security-headers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../security-headers")>();
  return { ...actual, NONCE_CSP_HEADER: "Content-Security-Policy" };
});

const mockRefreshAuthSession = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  refreshAuthSession: (...args: unknown[]) => mockRefreshAuthSession(...args),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));

import {
  buildContentSecurityPolicy,
  isSharedCacheable,
  NONCE_CSP_HEADER,
  NONCE_REQUEST_HEADER,
} from "../security-headers";
import { proxy } from "./proxy";

function forwardedRequestHeader(
  response: NextResponse,
  key: string,
): string | null {
  return response.headers.get(`x-middleware-request-${key}`);
}

function nonceOf(policy: string | null): string | null {
  const match = policy?.match(/'nonce-([A-Za-z0-9+/_-]+={0,2})'/);
  return match ? match[1] : null;
}

function directiveNames(policy: string): string[] {
  return policy.split("; ").map((entry) => entry.split(" ")[0]);
}

function directive(policy: string, name: string): string {
  const match = policy
    .split("; ")
    .find(
      (candidate) => candidate.startsWith(`${name} `) || candidate === name,
    );
  if (!match) throw new Error(`Missing CSP directive: ${name}`);
  return match;
}

function passThroughAuth(user: { id: string } | null) {
  return async (
    _request: NextRequest,
    _headers: Headers,
    response: NextResponse,
  ) => ({ configured: true, response, user, error: null });
}

beforeEach(() => {
  mockRefreshAuthSession.mockReset();
});

describe("proxy with the nonce policy forced to enforce", () => {
  it("is running against the enforcing header name", () => {
    expect(NONCE_CSP_HEADER).toBe("Content-Security-Policy");
  });

  it.each([
    ["/login", null],
    ["/konto", { id: "user-1" }],
  ] as const)(
    "publishes an enforced nonce policy on the private document %s",
    async (path, user) => {
      mockRefreshAuthSession.mockImplementation(passThroughAuth(user));

      const response = await proxy(new NextRequest(`http://localhost${path}`));
      const enforced = response.headers.get("content-security-policy");
      const forwarded = forwardedRequestHeader(
        response,
        "content-security-policy",
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(isSharedCacheable(response.headers.get("cache-control"))).toBe(
        false,
      );
      expect(enforced).toBeTruthy();
      expect(enforced).toBe(forwarded);
      expect(response.headers.get("content-security-policy-report-only")).toBeNull();

      const nonce = nonceOf(enforced);
      expect(nonce).toBeTruthy();
      expect(forwardedRequestHeader(response, NONCE_REQUEST_HEADER)).toBe(nonce);
      // Inline script is gone; inline style stays until its own stage lands.
      expect(directive(enforced!, "script-src")).toBe(
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      );
      // The enforced variant is the baseline shape with the nonce: it keeps
      // frame-ancestors and reports nothing, exactly like next.config.ts.
      expect(enforced).toContain("frame-ancestors 'none'");
      expect(enforced).not.toContain("report-uri");
      expect(directiveNames(enforced!)).toEqual(
        directiveNames(buildContentSecurityPolicy({ NODE_ENV: "test" }, null)),
      );
    },
  );

  it.each(["/", "/en", "/kurse"])(
    "withholds both the enforced policy and the nonce from the shared-cacheable %s",
    async (path) => {
      const response = await proxy(new NextRequest(`http://localhost${path}`));

      expect(isSharedCacheable(response.headers.get("cache-control"))).toBe(
        true,
      );
      expect(response.headers.get("content-security-policy")).toBeNull();
      expect(
        forwardedRequestHeader(response, "content-security-policy"),
      ).toBeNull();
      expect(forwardedRequestHeader(response, NONCE_REQUEST_HEADER)).toBeNull();
    },
  );

  it("mints nothing for a public API whose handler owns the cache policy", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/api/csp-report", { method: "POST" }),
    );

    expect(response.headers.get("cache-control")).toBeNull();
    expect(response.headers.get("content-security-policy")).toBeNull();
    expect(forwardedRequestHeader(response, NONCE_REQUEST_HEADER)).toBeNull();
  });
});
