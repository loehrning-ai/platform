import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { createAuthServerClient, reportApiError, signOut } = vi.hoisted(() => ({
  createAuthServerClient: vi.fn(),
  reportApiError: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createAuthServerClient,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError,
}));

import { GET, POST } from "./route";

function request(url = "https://loehrning.ai/auth/logout"): NextRequest {
  const origin = new URL(url).origin;
  return new Request(url, {
    method: "POST",
    headers: {
      Origin: origin,
      "Sec-Fetch-Site": "same-origin",
    },
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  createAuthServerClient.mockResolvedValue({
    auth: { signOut },
  });
  signOut.mockResolvedValue({ error: null });
});

describe("logout route", () => {
  it("redirects only after Supabase confirms sign-out", async () => {
    const response = await POST(request());

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://loehrning.ai/login");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rejects an untrusted request authority before touching auth", async () => {
    const response = await POST(
      request("https://attacker.example/auth/logout"),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each([
    ["missing Origin", {}],
    [
      "cross-origin Origin",
      {
        Origin: "https://attacker.example",
        "Sec-Fetch-Site": "cross-site",
      },
    ],
    [
      "same-site subdomain",
      {
        Origin: "https://subdomain.loehrning.ai",
        "Sec-Fetch-Site": "same-site",
      },
    ],
  ])("rejects %s sign-out requests", async (_label, headers) => {
    const response = await POST(
      new Request("https://loehrning.ai/auth/logout", {
        method: "POST",
        headers,
      }) as NextRequest,
    );
    expect(response.status).toBe(403);
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each([
    ["client creation throws", () => createAuthServerClient.mockRejectedValueOnce(new Error("outage"))],
    ["sign-out returns an error", () => signOut.mockResolvedValueOnce({ error: new Error("outage") })],
    ["sign-out throws", () => signOut.mockRejectedValueOnce(new Error("outage"))],
  ])("returns 503 when %s", async (_label, arrange) => {
    arrange();
    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(reportApiError).toHaveBeenCalledTimes(1);
  });

  it("rejects GET without attempting a state-changing sign-out", () => {
    const response = GET();
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(signOut).not.toHaveBeenCalled();
  });
});
