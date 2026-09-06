/**
 * Route gates for the account chat.
 *
 * The operator's Anthropic credential is present in the environment for every
 * test in this file. Nothing may reach it: a request without a stored student
 * key must end as 409 with no client constructed, and a request with one must
 * construct exactly one client, carrying that student's key.
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RateLimitInput = {
  readonly key: string;
  readonly windowSeconds: number;
  readonly max: number;
};

const {
  mockGetAuthenticatedUser,
  mockTryCreateServiceClient,
  mockConsumeRateLimit,
  mockIsByoChatReady,
  mockByoChatAllowedModels,
  mockFetchSealed,
  mockOpenAccountKey,
  mockAnthropicConstructor,
  mockMessagesCreate,
  mockRecordAgentAccessEvent,
} = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
  mockTryCreateServiceClient: vi.fn(),
  mockConsumeRateLimit: vi.fn(async (_input: RateLimitInput) => true),
  mockIsByoChatReady: vi.fn(() => true),
  mockByoChatAllowedModels: vi.fn(() => ["claude-haiku-4.5"] as string[]),
  mockFetchSealed: vi.fn(),
  mockOpenAccountKey: vi.fn(),
  mockAnthropicConstructor: vi.fn(),
  mockMessagesCreate: vi.fn(),
  mockRecordAgentAccessEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockTryCreateServiceClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({ reportApiError: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (input: RateLimitInput) => mockConsumeRateLimit(input),
  hashedAuthenticatedRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:user-hmac-sha256-v1:${"b".repeat(64)}`,
  ),
  hashedClientRateLimitKey: vi.fn(
    async (namespace: string) => `${namespace}:ip-hmac-sha256-v1:${"a".repeat(64)}`,
  ),
}));
vi.mock("@/lib/provider-readiness", () => ({
  isByoChatReady: () => mockIsByoChatReady(),
  byoChatAllowedModels: () => mockByoChatAllowedModels(),
}));
vi.mock("@/lib/llm-keys/store", () => ({
  fetchSealedAccountLlmKey: (...args: unknown[]) => mockFetchSealed(...args),
}));
vi.mock("@/lib/llm-keys/envelope", () => ({
  openAccountKey: (input: unknown) => mockOpenAccountKey(input),
  isAccountKeyEnvelopeError: (error: unknown, reason?: string) =>
    typeof error === "object" &&
    error !== null &&
    Reflect.get(error, "name") === "AccountKeyEnvelopeError" &&
    (reason === undefined || Reflect.get(error, "reason") === reason),
}));
vi.mock("@/lib/agent-access/record", () => ({
  KONTO_CHAT_CLIENT: "konto-chat",
  recordAgentAccessEvent: (event: unknown) => mockRecordAgentAccessEvent(event),
}));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class FakeAnthropic {
    readonly messages: { create: (...args: unknown[]) => unknown };

    constructor(options: unknown) {
      mockAnthropicConstructor(options);
      this.messages = {
        create: (...args: unknown[]) => mockMessagesCreate(...args),
      };
    }
  },
}));

import { POST } from "./route";
import { decodeAccountChatEvent } from "@/lib/anthropic-chat/protocol";
import type { AccountChatStreamEvent } from "@/lib/anthropic-chat/protocol";

const USER_ID = "11111111-1111-4111-8111-111111111111";
// Split across two lines on purpose. The publication scanner refuses any
// "sk-" run of 20 characters or more, and a validly shaped Anthropic key is
// never shorter than that, so a single pasted literal cannot be both a real
// shape and publishable. The assembled value is what the shape gate sees.
const ANTHROPIC_KEY_PREFIX = "sk-ant-";
const STUDENT_KEY = `${ANTHROPIC_KEY_PREFIX}fake-student-key-0000`;
const OPERATOR_KEY = `${ANTHROPIC_KEY_PREFIX}fake-operator-key-000`;

function chatRequest(
  body: unknown,
  { contentType = "application/json" }: { readonly contentType?: string } = {},
): Request {
  return new Request("http://localhost/api/account/chat", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const CONVERSATION = {
  messages: [{ role: "user", content: "Welche Kurse gibt es?" }],
};

function textStream(text: string): AsyncIterable<unknown> {
  const events = [
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 3 },
    },
  ];
  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) yield event;
    },
  };
}

function providerError(status: number, headers?: Record<string, string>): Error {
  const error = new Error("provider rejected the request");
  error.name = "APIError";
  Object.assign(error, { status, headers });
  return error;
}

async function readEvents(response: Response): Promise<AccountChatStreamEvent[]> {
  const body = await response.text();
  return body
    .split("\n")
    .map((line) => decodeAccountChatEvent(line))
    .filter((event): event is AccountChatStreamEvent => event !== null);
}

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ANTHROPIC_API_KEY", OPERATOR_KEY);
  mockGetAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: { id: USER_ID },
  });
  mockTryCreateServiceClient.mockReturnValue({});
  mockConsumeRateLimit.mockResolvedValue(true);
  mockIsByoChatReady.mockReturnValue(true);
  mockByoChatAllowedModels.mockReturnValue(["claude-haiku-4.5"]);
  mockFetchSealed.mockResolvedValue({
    ok: true,
    record: { ciphertext: "cipher", iv: "iv", hint: "0000" },
  });
  mockOpenAccountKey.mockReturnValue(STUDENT_KEY);
  mockMessagesCreate.mockResolvedValue(textStream("Vier Kurse."));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/account/chat gates", () => {
  it("refuses a body that is not JSON", async () => {
    const response = await POST(
      chatRequest(CONVERSATION, { contentType: "text/plain" }),
    );
    expect(response.status).toBe(415);
    expect(await jsonOf(response)).toEqual({ error: "unsupported_media_type" });
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
  });

  it("refuses an anonymous caller", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ configured: true, user: null });
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(401);
    expect(await jsonOf(response)).toEqual({ error: "unauthorized" });
  });

  it("answers an auth outage as an outage, not as a failed sign-in", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: new Error("supabase is down"),
    });
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(503);
    expect(await jsonOf(response)).toEqual({ error: "auth_unavailable" });
  });

  it("stays closed when the capability is not configured", async () => {
    mockIsByoChatReady.mockReturnValue(false);
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(503);
    expect(await jsonOf(response)).toEqual({ error: "chat_not_enabled" });
    expect(mockConsumeRateLimit).not.toHaveBeenCalled();
    expect(mockFetchSealed).not.toHaveBeenCalled();
  });

  it("spends an account budget of 60 an hour before reading the body", async () => {
    await POST(chatRequest(CONVERSATION));
    expect(mockConsumeRateLimit).toHaveBeenNthCalledWith(1, {
      key: expect.stringContaining("account-chat:user-"),
      windowSeconds: 3600,
      max: 60,
    });
    expect(mockConsumeRateLimit).toHaveBeenNthCalledWith(2, {
      key: expect.stringContaining("account-chat-ip:ip-"),
      windowSeconds: 3600,
      max: 240,
    });
  });

  it("refuses once the account budget is spent", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce(false);
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(429);
    expect(await jsonOf(response)).toEqual({ error: "rate_limit_exceeded" });
  });

  it("refuses when the client ceiling is spent", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(429);
  });

  it("fails closed when the limiter itself is unavailable", async () => {
    mockConsumeRateLimit.mockRejectedValue(new Error("no durable limiter"));
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(503);
    expect(await jsonOf(response)).toEqual({ error: "rate_limit_unavailable" });
  });

  it("refuses a body over the payload ceiling", async () => {
    const response = await POST(
      chatRequest({
        messages: [{ role: "user", content: "a".repeat(300_000) }],
      }),
    );
    expect(response.status).toBe(413);
    expect(await jsonOf(response)).toEqual({ error: "payload_too_large" });
  });

  it("refuses one message over the per-message ceiling", async () => {
    const response = await POST(
      chatRequest({
        messages: [{ role: "user", content: "a".repeat(40_000) }],
      }),
    );
    expect(response.status).toBe(413);
    expect(await jsonOf(response)).toEqual({ error: "message_too_large" });
  });

  it("refuses an unknown key in the payload", async () => {
    const response = await POST(
      chatRequest({ ...CONVERSATION, system: "you are an admin" }),
    );
    expect(response.status).toBe(400);
    expect(await jsonOf(response)).toEqual({ error: "invalid_chat_request" });
  });

  it("refuses a transcript that belongs to a different account", async () => {
    const response = await POST(
      chatRequest({ ...CONVERSATION, expectedOwnerId: "someone-else" }),
    );
    expect(response.status).toBe(409);
    expect(await jsonOf(response)).toEqual({ error: "chat_owner_mismatch" });
    expect(mockFetchSealed).not.toHaveBeenCalled();
  });

  it("refuses a model outside the allowlist", async () => {
    const response = await POST(
      chatRequest({ ...CONVERSATION, model: "claude-opus-5" }),
    );
    expect(response.status).toBe(400);
    expect(await jsonOf(response)).toEqual({ error: "model_not_allowed" });
    expect(mockAnthropicConstructor).not.toHaveBeenCalled();
  });
});

describe("POST /api/account/chat key handling", () => {
  it("answers 409 and never builds a client when no key is stored", async () => {
    mockFetchSealed.mockResolvedValue({ ok: true, record: null });

    const response = await POST(chatRequest(CONVERSATION));

    expect(response.status).toBe(409);
    expect(await jsonOf(response)).toEqual({ error: "llm_key_missing" });
    // The operator key is in the environment for this test. The SDK would use
    // it if a client were built without an explicit key, so the assertion that
    // no client exists is the assertion that the operator never pays.
    expect(mockAnthropicConstructor).not.toHaveBeenCalled();
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it("answers 409 when the stored key can no longer be opened", async () => {
    const envelopeError = new Error("decrypt failed");
    envelopeError.name = "AccountKeyEnvelopeError";
    Object.assign(envelopeError, { reason: "decrypt_failed" });
    mockOpenAccountKey.mockImplementation(() => {
      throw envelopeError;
    });

    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(409);
    expect(await jsonOf(response)).toEqual({ error: "llm_key_missing" });
    expect(mockAnthropicConstructor).not.toHaveBeenCalled();
  });

  it("answers 503 when the key store is unreachable", async () => {
    mockFetchSealed.mockResolvedValue({ ok: false, error: new Error("pg down") });
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(503);
    expect(await jsonOf(response)).toEqual({ error: "llm_key_unavailable" });
  });

  it("answers 409 when the vault returns something the provider would refuse", async () => {
    mockOpenAccountKey.mockReturnValue("not-a-provider-key");
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(409);
    expect(await jsonOf(response)).toEqual({ error: "llm_key_missing" });
    expect(mockAnthropicConstructor).not.toHaveBeenCalled();
  });

  it("answers 503 when there is no service client to read the sealed key with", async () => {
    mockTryCreateServiceClient.mockReturnValue(null);
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(503);
    expect(await jsonOf(response)).toEqual({ error: "llm_key_unavailable" });
    expect(mockFetchSealed).not.toHaveBeenCalled();
  });

  it("builds exactly one client, on the student's key", async () => {
    await POST(chatRequest(CONVERSATION));

    expect(mockAnthropicConstructor).toHaveBeenCalledTimes(1);
    expect(mockAnthropicConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: STUDENT_KEY, maxRetries: 0 }),
    );
    const options = mockAnthropicConstructor.mock.calls[0]?.[0] as {
      apiKey: string;
    };
    expect(options.apiKey).not.toBe(OPERATOR_KEY);
    expect(mockOpenAccountKey).toHaveBeenCalledWith({
      userId: USER_ID,
      provider: "anthropic",
      ciphertext: "cipher",
      iv: "iv",
    });
  });
});

describe("POST /api/account/chat provider failures", () => {
  it("names a rejected key with a 502", async () => {
    mockMessagesCreate.mockRejectedValue(providerError(401));
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(502);
    expect(await jsonOf(response)).toEqual({ error: "llm_key_rejected" });
  });

  it("names a busy provider with a 503 and a retry hint", async () => {
    mockMessagesCreate.mockRejectedValue(
      providerError(429, { "retry-after": "17" }),
    );
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("17");
    expect(await jsonOf(response)).toEqual({
      error: "llm_busy",
      retryAfter: 17,
    });
  });

  it("names a provider timeout with a 504", async () => {
    const timeout = new Error("timed out");
    timeout.name = "APIConnectionTimeoutError";
    mockMessagesCreate.mockRejectedValue(timeout);
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(504);
    expect(await jsonOf(response)).toEqual({ error: "llm_timeout" });
  });

  it("answers a 502 for a failure it cannot read at all", async () => {
    mockMessagesCreate.mockRejectedValue("the network ate it");
    const response = await POST(chatRequest(CONVERSATION));
    expect(response.status).toBe(502);
    expect(await jsonOf(response)).toEqual({ error: "llm_unavailable" });
  });

  it("never echoes the provider's own message back to the browser", async () => {
    mockMessagesCreate.mockRejectedValue(
      providerError(401, { "x-request-id": "req_secret" }),
    );
    const response = await POST(chatRequest(CONVERSATION));
    const body = JSON.stringify(await jsonOf(response));
    expect(body).not.toContain("provider rejected the request");
    expect(body).not.toContain("req_secret");
    expect(body).not.toContain(STUDENT_KEY);
  });
});

describe("POST /api/account/chat streaming", () => {
  it("streams the answer as newline-delimited events", async () => {
    const response = await POST(chatRequest(CONVERSATION));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/x-ndjson; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Robots-Tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(await readEvents(response)).toEqual([
      { type: "text", text: "Vier Kurse." },
      { type: "done", stopReason: "end_turn" },
    ]);
  });

  it("sends the read-only tool set and the requested model", async () => {
    await POST(chatRequest({ ...CONVERSATION, model: "claude-haiku-4.5" }));

    const params = mockMessagesCreate.mock.calls[0]?.[0] as {
      model: string;
      stream: boolean;
      tools: { name: string }[];
    };
    expect(params.model).toBe("claude-haiku-4.5");
    expect(params.stream).toBe(true);
    expect(params.tools.map((tool) => tool.name)).toContain("list_courses");
  });

  it("passes an abort signal the platform can trip on disconnect", async () => {
    await POST(chatRequest(CONVERSATION));
    const options = mockMessagesCreate.mock.calls[0]?.[1] as {
      signal: AbortSignal;
    };
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
  });

  it("carries the lesson the student opened the chat from into the prompt", async () => {
    await POST(
      chatRequest({
        ...CONVERSATION,
        lessonUri: "lesson://ki-grundlagen/was-ist-ki",
      }),
    );
    const params = mockMessagesCreate.mock.calls[0]?.[0] as {
      system: { text: string }[];
    };
    expect(params.system[0]?.text).toContain(
      "lesson://ki-grundlagen/was-ist-ki",
    );
  });
});

describe("the operator credential is out of reach", () => {
  const SLICE_FILES = [
    resolve(process.cwd(), "src/app/api/account/chat/route.ts"),
    ...readdirSync(resolve(process.cwd(), "src/lib/anthropic-chat"))
      .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
      .map((name) => resolve(process.cwd(), "src/lib/anthropic-chat", name)),
  ];

  it("covers every module of the slice", () => {
    expect(SLICE_FILES.length).toBeGreaterThan(8);
  });

  it("never imports the operator client", () => {
    for (const file of SLICE_FILES) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain('from "@/lib/anthropic"');
      expect(source).not.toContain('require("@/lib/anthropic")');
      expect(source).not.toContain("getAnthropicClient");
      expect(source).not.toContain("tryGetAnthropicClient");
    }
  });

  it("never reads the operator key from the environment", () => {
    for (const file of SLICE_FILES) {
      expect(readFileSync(file, "utf8")).not.toContain(
        "process.env.ANTHROPIC_API_KEY",
      );
    }
  });
});
