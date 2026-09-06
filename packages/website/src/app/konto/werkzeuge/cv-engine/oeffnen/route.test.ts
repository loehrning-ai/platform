import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const {
  consumeRateLimit,
  createAdminClient,
  generateLink,
  getAuthenticatedUser,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
  reportApiError,
} = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createAdminClient: vi.fn(),
  generateLink: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  hashedAuthenticatedRateLimitKey: vi.fn(),
  hashedClientRateLimitKey: vi.fn(),
  reportApiError: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({ getAuthenticatedUser }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/observability/api-error", () => ({ reportApiError }));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
}));

import { GET, POST } from "./route";

const ROUTE_URL = "https://loehrning.ai/konto/werkzeuge/cv-engine/oeffnen";
const HOSTED_ORIGIN = "https://cv.loehrning.ai";
const SIGN_IN_FALLBACK = `${HOSTED_ORIGIN}/?hinweis=anmelden`;
const EMAIL = "lernende@example.com";
const USER_ID = "11111111-2222-3333-4444-555555555555";
const FIRST_TOKEN = "aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888";
const SECOND_TOKEN = "9999cccc8888dddd7777eeee6666ffff5555aaaa4444bbbb3333cccc2222dddd";

function linkResponse(hashedToken: unknown) {
  return {
    data: {
      properties: {
        action_link: `https://fake-project.supabase.co/auth/v1/verify?token=${String(hashedToken)}`,
        email_otp: "123456",
        hashed_token: hashedToken,
        redirect_to: "",
        verification_type: "magiclink",
      },
      user: { id: USER_ID, email: EMAIL },
    },
    error: null,
  };
}

function configureHostedRuntime(): void {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-07-01");
  vi.stubEnv("CV_ENGINE_HOSTED_URL", HOSTED_ORIGIN);
  vi.stubEnv("CV_ENGINE_HOSTED_CONFIRMED_AT", "2026-08-20");
}

function formRequest(
  overrides: Record<string, string> = {},
  url = ROUTE_URL,
): NextRequest {
  const headers: Record<string, string> = {
    Origin: new URL(url).origin,
    "Sec-Fetch-Site": "same-origin",
    "Content-Type": "application/x-www-form-urlencoded",
    ...overrides,
  };
  for (const [key, value] of Object.entries(headers)) {
    if (value === "") delete headers[key];
  }
  return new Request(url, { method: "POST", headers }) as NextRequest;
}

/** Everything this route handed to the reporter, flattened for leak checks. */
function reportedText(): string {
  return reportApiError.mock.calls
    .map((call) => {
      const report = call[0] as { route?: string; step?: string; error?: unknown };
      const error = report.error;
      const described =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : JSON.stringify(error);
      return `${report.route} ${report.step} ${described}`;
    })
    .join("\n");
}

beforeEach(() => {
  vi.clearAllMocks();
  configureHostedRuntime();
  getAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: { id: USER_ID, email: EMAIL },
  });
  hashedAuthenticatedRateLimitKey.mockResolvedValue("cv-engine-handoff:user-1:hash");
  hashedClientRateLimitKey.mockResolvedValue("cv-engine-handoff-ip:ip-1:hash");
  consumeRateLimit.mockResolvedValue(true);
  createAdminClient.mockReturnValue({ auth: { admin: { generateLink } } });
  generateLink.mockResolvedValue(linkResponse(FIRST_TOKEN));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("hosted cv-engine handoff", () => {
  it("mints a one-time link and carries it in the fragment", async () => {
    const response = await POST(formRequest());

    expect(generateLink).toHaveBeenCalledTimes(1);
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EMAIL,
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `${HOSTED_ORIGIN}/auth/handoff#token_hash=${FIRST_TOKEN}&type=magiclink`,
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(await response.text()).toBe("");
    expect(reportApiError).not.toHaveBeenCalled();
  });

  it("charges the account budget before minting anything", async () => {
    await POST(formRequest());

    expect(hashedAuthenticatedRateLimitKey).toHaveBeenCalledWith(
      "cv-engine-handoff",
      expect.anything(),
      USER_ID,
    );
    expect(hashedClientRateLimitKey).toHaveBeenCalledWith(
      "cv-engine-handoff-ip",
      expect.anything(),
    );
    expect(consumeRateLimit).toHaveBeenNthCalledWith(1, {
      key: "cv-engine-handoff:user-1:hash",
      windowSeconds: 60,
      max: 5,
    });
    expect(consumeRateLimit).toHaveBeenNthCalledWith(2, {
      key: "cv-engine-handoff-ip:ip-1:hash",
      windowSeconds: 60,
      max: 30,
    });
  });

  it("sends a refused mint to the hosted sign-in instead of an error page", async () => {
    const refusal = Object.assign(
      new Error("Signups not allowed for this instance"),
      { name: "AuthApiError", status: 422 },
    );
    generateLink.mockResolvedValueOnce({
      data: { properties: null, user: null },
      error: refusal,
    });

    const response = await POST(formRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(SIGN_IN_FALLBACK);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(reportApiError).toHaveBeenCalledTimes(1);
    expect(reportApiError.mock.calls[0]?.[0]).toMatchObject({
      route: "/konto/werkzeuge/cv-engine/oeffnen",
      step: "auth-generate-link",
      error: refusal,
    });
  });

  it("falls back when the admin call rejects at the transport level", async () => {
    generateLink.mockRejectedValueOnce(new Error("fetch failed"));

    const response = await POST(formRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(SIGN_IN_FALLBACK);
    expect(reportApiError).toHaveBeenCalledTimes(1);
  });

  it("falls back when the admin client cannot be constructed", async () => {
    createAdminClient.mockImplementationOnce(() => {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable");
    });

    const response = await POST(formRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(SIGN_IN_FALLBACK);
    expect(generateLink).not.toHaveBeenCalled();
    expect(reportApiError.mock.calls[0]?.[0]).toMatchObject({
      step: "auth-create-client",
    });
  });

  it("falls back on a timed-out mint without waiting for the response", async () => {
    vi.useFakeTimers();
    generateLink.mockReturnValueOnce(new Promise(() => {}));

    const pending = POST(formRequest());
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5_000);
    const response = await pending;

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(SIGN_IN_FALLBACK);
    expect(reportedText()).toContain("CvEngineHandoffTimeoutError");
  });

  it.each([
    ["a missing token", undefined],
    ["a null token", null],
    ["a non-string token", 42],
    ["a token with a fragment separator", "abc#type=recovery"],
    ["a token with a path separator", "abc/../evil"],
  ])("falls back on %s rather than building a half-formed link", async (
    _label,
    token,
  ) => {
    generateLink.mockResolvedValueOnce(linkResponse(token));

    const response = await POST(formRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(SIGN_IN_FALLBACK);
    expect(reportedText()).toContain("CvEngineHandoffPayloadError");
  });

  it("never lets a token reach the reporter", async () => {
    generateLink.mockResolvedValueOnce(linkResponse(`bad ${FIRST_TOKEN}`));

    await POST(formRequest());

    expect(reportApiError).toHaveBeenCalledTimes(1);
    expect(reportedText()).not.toContain(FIRST_TOKEN);
    expect(JSON.stringify(reportApiError.mock.calls)).not.toContain(FIRST_TOKEN);
  });

  it("gives a double submission two independent tokens and charges both", async () => {
    generateLink
      .mockResolvedValueOnce(linkResponse(FIRST_TOKEN))
      .mockResolvedValueOnce(linkResponse(SECOND_TOKEN));

    const [first, second] = await Promise.all([
      POST(formRequest()),
      POST(formRequest()),
    ]);

    expect(first.status).toBe(303);
    expect(second.status).toBe(303);
    expect(
      [first.headers.get("location"), second.headers.get("location")].sort(),
    ).toEqual(
      [
        `${HOSTED_ORIGIN}/auth/handoff#token_hash=${FIRST_TOKEN}&type=magiclink`,
        `${HOSTED_ORIGIN}/auth/handoff#token_hash=${SECOND_TOKEN}&type=magiclink`,
      ].sort(),
    );
    expect(generateLink).toHaveBeenCalledTimes(2);
    // Two submissions cost two account units and two client units: a second
    // click must never ride on the first one's reservation.
    expect(consumeRateLimit).toHaveBeenCalledTimes(4);
  });

  it("refuses an exhausted account budget without minting a credential", async () => {
    consumeRateLimit.mockResolvedValueOnce(false);

    const response = await POST(formRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(consumeRateLimit).toHaveBeenCalledTimes(1);
    expect(generateLink).not.toHaveBeenCalled();
    expect(await response.text()).toContain("Zu viele Versuche");
  });

  it("refuses an exhausted client ceiling without minting a credential", async () => {
    consumeRateLimit
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const response = await POST(formRequest());

    expect(response.status).toBe(429);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("fails closed when the durable limiter is unavailable", async () => {
    consumeRateLimit.mockRejectedValueOnce(new Error("limiter down"));

    const response = await POST(formRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(generateLink).not.toHaveBeenCalled();
    expect(reportApiError.mock.calls[0]?.[0]).toMatchObject({
      step: "rate-limit",
    });
  });

  it.each([
    ["no hosted origin", "CV_ENGINE_HOSTED_URL"],
    ["no dated review", "CV_ENGINE_HOSTED_CONFIRMED_AT"],
    ["no account boundary", "SUPABASE_SERVICE_ROLE_KEY"],
  ])("answers 404 with %s and touches no account state", async (
    _label,
    variable,
  ) => {
    vi.stubEnv(variable, "");

    const response = await POST(formRequest());

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(getAuthenticatedUser).not.toHaveBeenCalled();
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
  });

  it.each([
    ["a cross-origin submission", { Origin: "https://attacker.example", "Sec-Fetch-Site": "cross-site" }],
    ["a same-site subdomain submission", { Origin: "https://cv.loehrning.ai", "Sec-Fetch-Site": "same-site" }],
    ["a submission without an Origin header", { Origin: "" }],
  ])("refuses %s before any account work", async (_label, overrides) => {
    const response = await POST(formRequest(overrides));

    expect(response.status).toBe(403);
    expect(getAuthenticatedUser).not.toHaveBeenCalled();
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses an untrusted request authority", async () => {
    const response = await POST(
      formRequest({}, "https://attacker.example/konto/werkzeuge/cv-engine/oeffnen"),
    );

    expect(response.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it.each([
    ["no content type", { "Content-Type": "" }],
    ["a JSON body", { "Content-Type": "application/json" }],
    ["a text body", { "Content-Type": "text/plain" }],
  ])("refuses %s", async (_label, overrides) => {
    const response = await POST(formRequest(overrides));

    expect(response.status).toBe(415);
    expect(getAuthenticatedUser).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("accepts the multipart form encoding a browser may choose", async () => {
    const response = await POST(
      formRequest({ "Content-Type": "multipart/form-data; boundary=x" }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("token_hash=");
  });

  it("sends an anonymous submission to the login page, not to the tool", async () => {
    getAuthenticatedUser.mockResolvedValueOnce({ configured: true, user: null });

    const response = await POST(formRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://loehrning.ai/login?next=%2Fkonto",
    );
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
  });

  it.each([
    ["auth is unconfigured", { configured: false, user: null }],
    ["auth reports an outage", { configured: true, user: null, error: new Error("down") }],
  ])("answers 503 when %s", async (_label, authState) => {
    getAuthenticatedUser.mockResolvedValueOnce(authState);

    const response = await POST(formRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("answers 503 when reading the session throws", async () => {
    getAuthenticatedUser.mockRejectedValueOnce(new Error("network"));

    const response = await POST(formRequest());

    expect(response.status).toBe(503);
    expect(reportApiError.mock.calls[0]?.[0]).toMatchObject({
      step: "auth-get-user",
    });
  });

  it("sends an account without a usable address to the hosted sign-in", async () => {
    getAuthenticatedUser.mockResolvedValueOnce({
      configured: true,
      user: { id: USER_ID, email: "   " },
    });

    const response = await POST(formRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(SIGN_IN_FALLBACK);
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
    expect(reportApiError).not.toHaveBeenCalled();
  });

  it("rejects GET without minting anything", async () => {
    const response = GET();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toContain("POST");
    expect(generateLink).not.toHaveBeenCalled();
  });
});
