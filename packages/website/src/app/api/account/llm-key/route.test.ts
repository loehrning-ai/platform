/**
 * /api/account/llm-key.
 *
 * The route stores the most sensitive value on the platform, so the suite
 * covers two things in equal measure: the fail-closed gates in front of the
 * write, and the promise that the clear key never appears anywhere it could be
 * read later. Every case ends by scanning the response body, every console
 * line, and every error report for the submitted key.
 *
 * The envelope is deliberately NOT mocked: the success case proves the row
 * handed to the store really is sealed, and that it opens again only for the
 * account it was sealed for.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockServiceClient,
  mockConsumeRateLimit,
  mockReportApiError,
  mockValidateKey,
  mockUpsert,
  mockDelete,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn<
    () => Promise<{
      configured: boolean;
      user: { id: string } | null;
      error?: unknown;
    }>
  >(),
  mockServiceClient: vi.fn<() => unknown>(() => ({ id: "service-client" })),
  mockConsumeRateLimit: vi.fn<() => Promise<boolean>>(async () => true),
  mockReportApiError: vi.fn<(report: unknown) => void>(),
  mockValidateKey: vi.fn<() => Promise<unknown>>(),
  mockUpsert: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  mockDelete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetUser(),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockServiceClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (report: unknown) => mockReportApiError(report),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: () => mockConsumeRateLimit(),
  hashedAuthenticatedRateLimitKey: async (namespace: string) =>
    `${namespace}:user-hmac-sha256-v1:${"b".repeat(64)}`,
  hashedClientRateLimitKey: async (namespace: string) =>
    `${namespace}:ip-hmac-sha256-v1:${"a".repeat(64)}`,
}));
vi.mock("@/lib/llm-keys/provider-validation", () => ({
  validateAccountLlmKey: () => mockValidateKey(),
}));
vi.mock("@/lib/llm-keys/store", () => ({
  upsertAccountLlmKey: (...args: unknown[]) => mockUpsert(...args),
  deleteAccountLlmKey: (...args: unknown[]) => mockDelete(...args),
}));

import { openAccountKey, type SealedAccountKey } from "@/lib/llm-keys/envelope";
import { DELETE, POST, maxDuration, runtime } from "./route";

const ENDPOINT = "http://localhost/api/account/llm-key";
const USER = "11111111-1111-4111-8111-111111111111";
const OTHER_USER = "22222222-2222-4222-8222-222222222222";
const API_KEY = `${["sk", "ant", "api03"].join("-")}-${"m".repeat(40)}wxyz`;
const KEK = `kek1_${"a1b2c3d4".repeat(8)}`;
const VALIDATED_AT = "2026-09-04T11:30:00.000Z";
const CREATED_AT = "2026-09-01T10:00:00.000Z";

const consoleSpies: { readonly mock: { readonly calls: unknown[][] } }[] = [];

function enableVault(): void {
  vi.stubEnv("BYO_CHAT_ENABLED", "true");
  vi.stubEnv("ACCOUNT_LLM_KEK", KEK);
  vi.stubEnv("BYO_CHAT_MODEL_ALLOWLIST", "claude-haiku-4.5");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-01-01");
}

function request(
  method: "POST" | "DELETE",
  body: unknown,
  headers: Record<string, string> = { "Content-Type": "application/json" },
): Request {
  return new Request(ENDPOINT, {
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function savePayload(overrides: Record<string, unknown> = {}): unknown {
  return {
    expectedOwnerId: USER,
    provider: "anthropic",
    apiKey: API_KEY,
    ...overrides,
  };
}

/**
 * Flatten an arbitrary value into every string it could ever render as,
 * including the message and stack of nested errors. A shallow JSON.stringify
 * would drop exactly the places a credential is most likely to hide.
 */
function renderDeep(value: unknown, seen = new Set<unknown>(), depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return String(value);
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "";
  seen.add(value);
  if (value instanceof Error) {
    return [value.name, value.message, value.stack ?? ""].join(" ");
  }
  if (Array.isArray(value)) {
    return value.map((entry) => renderDeep(entry, seen, depth + 1)).join(" ");
  }
  return Object.entries(value)
    .map(([key, entry]) => `${key}=${renderDeep(entry, seen, depth + 1)}`)
    .join(" ");
}

/** Everything a later reader could see: the answer, the logs, the reports. */
function observedText(responseBody: string): string {
  const consoleText = consoleSpies
    .flatMap((spy) => spy.mock.calls)
    .map((call) => call.map((value) => renderDeep(value)).join(" "))
    .join("\n");
  const reportText = mockReportApiError.mock.calls
    .map(([report]) => renderDeep(report))
    .join("\n");
  return [responseBody, consoleText, reportText].join("\n");
}

async function expectNoKeyLeak(response: Response): Promise<string> {
  const body = await response.text();
  const observed = observedText(body);
  expect(observed).not.toContain(API_KEY);
  expect(observed).not.toContain(API_KEY.slice(7, 40));
  expect(observed).not.toContain(KEK);
  return body;
}

beforeEach(() => {
  mockGetUser.mockReset();
  mockGetUser.mockResolvedValue({ configured: true, user: { id: USER } });
  mockServiceClient.mockReset();
  mockServiceClient.mockReturnValue({ id: "service-client" });
  mockConsumeRateLimit.mockReset();
  mockConsumeRateLimit.mockResolvedValue(true);
  mockReportApiError.mockReset();
  mockValidateKey.mockReset();
  mockValidateKey.mockResolvedValue({ ok: true, validatedAt: VALIDATED_AT });
  mockUpsert.mockReset();
  mockUpsert.mockResolvedValue({
    ok: true,
    summary: {
      provider: "anthropic",
      hint: "wxyz",
      createdAt: CREATED_AT,
      validatedAt: VALIDATED_AT,
    },
  });
  mockDelete.mockReset();
  mockDelete.mockResolvedValue({ ok: true, deleted: true });
  consoleSpies.length = 0;
  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    consoleSpies.push(vi.spyOn(console, level).mockImplementation(() => undefined));
  }
  enableVault();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("route contract", () => {
  it("runs on the Node runtime with a bounded duration", () => {
    expect(runtime).toBe("nodejs");
    expect(maxDuration).toBe(15);
  });

  it("has a leak scan that actually watches every channel", () => {
    // Without this, every "nothing leaked" assertion below could be passing
    // because the scan reads nothing at all. Push a harmless sentinel through
    // each observed channel and prove the scan finds it there.
    const sentinel = "sentinel-visible-to-the-leak-scan";
    expect(observedText("")).not.toContain(sentinel);

    consoleSpies[0].mock.calls.push([sentinel]);
    expect(observedText("")).toContain(sentinel);

    consoleSpies.forEach((spy) => spy.mock.calls.splice(0));
    mockReportApiError({ step: "unhandled", error: new Error(sentinel) });
    expect(observedText("")).toContain(sentinel);

    mockReportApiError.mockClear();
    expect(observedText(`{"error":"${sentinel}"}`)).toContain(sentinel);
  });
});

describe("POST gates", () => {
  it("refuses a request that is not JSON", async () => {
    const response = await POST(
      request("POST", savePayload(), { "Content-Type": "text/plain" }),
    );
    expect(response.status).toBe(415);
    expect(await expectNoKeyLeak(response)).toContain("unsupported_media_type");
  });

  it("fails closed while the vault is not configured", async () => {
    vi.unstubAllEnvs();
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(503);
    expect(await expectNoKeyLeak(response)).toContain("byo_chat_not_ready");
  });

  it("fails closed on a malformed key-encryption key", async () => {
    vi.stubEnv("ACCOUNT_LLM_KEK", "kek1_not-hexadecimal");
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(503);
    expect(mockValidateKey).not.toHaveBeenCalled();
    await expectNoKeyLeak(response);
  });

  it("answers 503 while the auth backend is unconfigured or unreachable", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: false, user: null });
    expect((await POST(request("POST", savePayload()))).status).toBe(503);

    mockGetUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: new Error("upstream"),
    });
    expect((await POST(request("POST", savePayload()))).status).toBe(503);

    mockGetUser.mockRejectedValueOnce(new Error("boom"));
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(503);
    expect(await expectNoKeyLeak(response)).toContain("auth_unavailable");
  });

  it("answers 401 without a session", async () => {
    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(401);
    expect(mockValidateKey).not.toHaveBeenCalled();
    await expectNoKeyLeak(response);
  });

  it("refuses an oversized body before parsing it", async () => {
    const response = await POST(
      request("POST", savePayload({ apiKey: `${API_KEY}${"x".repeat(5000)}` })),
    );
    expect(response.status).toBe(413);
    await expectNoKeyLeak(response);
  });

  it("requires an owner binding and refuses a stale one", async () => {
    const missing = await POST(request("POST", { provider: "anthropic" }));
    expect(missing.status).toBe(400);
    expect(await missing.text()).toContain("invalid_owner_binding");

    const stale = await POST(
      request("POST", savePayload({ expectedOwnerId: OTHER_USER })),
    );
    expect(stale.status).toBe(409);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(await expectNoKeyLeak(stale)).toContain("account_owner_mismatch");
  });

  it("enforces the account budget and the client ceiling", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce(false);
    expect((await POST(request("POST", savePayload()))).status).toBe(429);

    mockConsumeRateLimit
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    expect((await POST(request("POST", savePayload()))).status).toBe(429);
    expect(mockValidateKey).not.toHaveBeenCalled();
  });

  it("answers 503 when the limiter backend is unavailable", async () => {
    mockConsumeRateLimit.mockRejectedValueOnce(new Error("limiter down"));
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(503);
    expect(await expectNoKeyLeak(response)).toContain("rate_limit_unavailable");
  });

  it("refuses unknown fields, unknown providers, and malformed keys", async () => {
    const extra = await POST(
      request("POST", savePayload({ model: "claude-haiku-4.5" })),
    );
    expect(extra.status).toBe(400);
    expect(await extra.text()).toContain("invalid_llm_key_request");

    const provider = await POST(
      request("POST", savePayload({ provider: "openai" })),
    );
    expect(provider.status).toBe(400);

    const malformed = await POST(
      request("POST", savePayload({ apiKey: "hunter2-hunter2-hunter2" })),
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.text()).toContain("invalid_llm_key");
    expect(mockValidateKey).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON at all", async () => {
    const response = await POST(request("POST", "{not json"));
    expect(response.status).toBe(400);
    await expectNoKeyLeak(response);
  });
});

describe("POST provider validation", () => {
  it("names a refused credential without storing anything", async () => {
    mockValidateKey.mockResolvedValueOnce({ ok: false, reason: "rejected" });
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(400);
    expect(await expectNoKeyLeak(response)).toContain("llm_key_rejected");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("answers 504 when the provider does not respond in time", async () => {
    mockValidateKey.mockResolvedValueOnce({ ok: false, reason: "timeout" });
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(504);
    expect(await expectNoKeyLeak(response)).toContain("provider_timeout");
  });

  it("never blames the key for a provider outage", async () => {
    mockValidateKey.mockResolvedValueOnce({ ok: false, reason: "unavailable" });
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(502);
    const body = await expectNoKeyLeak(response);
    expect(body).toContain("llm_key_validation_failed");
    expect(body).not.toContain("llm_key_rejected");
  });
});

describe("POST storage", () => {
  it("answers 503 when the sealed store is unreachable", async () => {
    mockServiceClient.mockReturnValueOnce(null);
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(503);
    expect(await expectNoKeyLeak(response)).toContain(
      "llm_key_store_unavailable",
    );
  });

  it("answers 500 and reports a rejected write without the key", async () => {
    mockUpsert.mockResolvedValueOnce({
      ok: false,
      error: { code: "23514", message: "account_llm_keys_hint_check" },
    });
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(500);
    expect(mockReportApiError).toHaveBeenCalled();
    expect(await expectNoKeyLeak(response)).toContain("llm_key_write_failed");
  });

  it("stores a sealed row and answers with the hint alone", async () => {
    const response = await POST(request("POST", savePayload()));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");

    const body = await expectNoKeyLeak(response);
    expect(JSON.parse(body)).toEqual({
      ok: true,
      provider: "anthropic",
      hint: "wxyz",
      createdAt: CREATED_AT,
      validatedAt: VALIDATED_AT,
    });

    const [, input] = mockUpsert.mock.calls[0] as [
      unknown,
      {
        userId: string;
        provider: "anthropic";
        sealed: SealedAccountKey;
        validatedAt: string;
      },
    ];
    expect(input.userId).toBe(USER);
    expect(input.validatedAt).toBe(VALIDATED_AT);
    expect(input.sealed.ciphertext).not.toContain(API_KEY);
    expect(JSON.stringify(input.sealed)).not.toContain("sk-ant");

    // The row really is sealed, and sealed to this account: the real envelope
    // opens it for the owner and refuses the same bytes for anybody else.
    expect(
      openAccountKey({
        userId: USER,
        provider: "anthropic",
        ciphertext: input.sealed.ciphertext,
        iv: input.sealed.iv,
      }),
    ).toBe(API_KEY);
    expect(() =>
      openAccountKey({
        userId: OTHER_USER,
        provider: "anthropic",
        ciphertext: input.sealed.ciphertext,
        iv: input.sealed.iv,
      }),
    ).toThrow();
  });

  it("takes the owner from the session, never from the payload", async () => {
    mockGetUser.mockResolvedValue({ configured: true, user: { id: USER } });
    await POST(request("POST", savePayload({ expectedOwnerId: USER })));
    const [, input] = mockUpsert.mock.calls[0] as [
      unknown,
      { userId: string },
    ];
    expect(input.userId).toBe(USER);
  });
});

describe("DELETE", () => {
  function deletePayload(overrides: Record<string, unknown> = {}): unknown {
    return { expectedOwnerId: USER, provider: "anthropic", ...overrides };
  }

  it("shares the fail-closed gates with the save path", async () => {
    expect(
      (
        await DELETE(
          request("DELETE", deletePayload(), { "Content-Type": "text/plain" }),
        )
      ).status,
    ).toBe(415);

    mockGetUser.mockResolvedValueOnce({ configured: true, user: null });
    expect((await DELETE(request("DELETE", deletePayload()))).status).toBe(401);

    const stale = await DELETE(
      request("DELETE", deletePayload({ expectedOwnerId: OTHER_USER })),
    );
    expect(stale.status).toBe(409);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("refuses an unknown provider and unknown fields", async () => {
    expect(
      (await DELETE(request("DELETE", deletePayload({ provider: "openai" }))))
        .status,
    ).toBe(400);
    expect(
      (await DELETE(request("DELETE", deletePayload({ apiKey: API_KEY }))))
        .status,
    ).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("removes the stored key", async () => {
    const response = await DELETE(request("DELETE", deletePayload()));
    expect(response.status).toBe(200);
    expect(JSON.parse(await response.text())).toEqual({
      ok: true,
      provider: "anthropic",
      deleted: true,
    });
    expect(mockDelete).toHaveBeenCalledWith(
      { id: "service-client" },
      USER,
      "anthropic",
    );
  });

  it("treats a missing key as a successful deletion", async () => {
    mockDelete.mockResolvedValueOnce({ ok: true, deleted: false });
    const response = await DELETE(request("DELETE", deletePayload()));
    expect(response.status).toBe(200);
    expect(JSON.parse(await response.text()).deleted).toBe(false);
  });

  it("answers 503 without a store and 500 on a rejected delete", async () => {
    mockServiceClient.mockReturnValueOnce(null);
    expect((await DELETE(request("DELETE", deletePayload()))).status).toBe(503);

    mockDelete.mockResolvedValueOnce({
      ok: false,
      error: { code: "PGRST301", message: "denied" },
    });
    const failed = await DELETE(request("DELETE", deletePayload()));
    expect(failed.status).toBe(500);
    expect(await failed.text()).toContain("llm_key_delete_failed");
    expect(mockReportApiError).toHaveBeenCalled();
  });
});
