import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockRefreshAuthSession = vi.fn();
const mockReportApiError = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  refreshAuthSession: (...args: unknown[]) => mockRefreshAuthSession(...args),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

import { middleware } from "./middleware";

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

describe("protected middleware terminal responses", () => {
  it("returns a real 503 without leaking the continuation control header", async () => {
    mockRefreshAuthSession.mockResolvedValue({
      configured: true,
      response: authContinuation(),
      user: null,
      error: new Error("auth backend unavailable"),
    });

    const response = await middleware(
      new NextRequest("http://localhost/api/progress"),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(response.headers.get("x-arbitrary-internal")).toBeNull();
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expect(response.cookies.getAll().map(({ name }) => name).sort()).toEqual([
      "sb-access",
      "sb-refresh",
    ]);
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

    const response = await middleware(
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

    const response = await middleware(
      new NextRequest("https://attacker.example/konto?private=value"),
    );

    expect(response.status).toBe(307);
    const target = new URL(response.headers.get("location") ?? "");
    expect(target.origin).toBe("https://loehrning.ai");
    expect(target.pathname).toBe("/login");
    expect(target.searchParams.get("next")).toBe(
      "/konto?private=value",
    );
  });

  it("converts a rejected auth refresh into one reported protected-API 503", async () => {
    const refreshError = new Error("middleware auth refresh rejected");
    mockRefreshAuthSession.mockRejectedValueOnce(refreshError);

    const response = await middleware(
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

    const response = await middleware(
      new NextRequest("http://localhost/api/progress"),
    );

    const vary = (response.headers.get("vary") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase());
    expect(response.status).toBe(200);
    expect(vary).toEqual([
      "rsc",
      "next-router-state-tree",
      "cookie",
    ]);
  });
});

describe("route-level authentication boundaries", () => {
  it("continues the exact book PDF route with private crawl and cache headers", async () => {
    const response = await middleware(
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

    const response = await middleware(
      new NextRequest(`http://localhost${path}`),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1);
  });
});

describe("retired API boundaries", () => {
  it.each([
    "/api/scan",
    "/api/journey/scan-insight",
    "/api/journey/leads",
  ])("returns an exact terminal 410 for %s without consulting auth", async (path) => {
    const response = await middleware(
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
  });

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

    const response = await middleware(
      new NextRequest(`http://localhost${path}`, { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1);
  });
});

describe("retired redirect authority", () => {
  it("uses the canonical origin for an untrusted request authority", async () => {
    const response = await middleware(
      new NextRequest("https://attacker.example/blog/digify?secret=value"),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://loehrning.ai/blog",
    );
    expect(mockRefreshAuthSession).not.toHaveBeenCalled();
  });
});
