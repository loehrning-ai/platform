/**
 * /api/mcp route guards.
 *
 * The readiness predicate, the media-type check, the per-client limiter and
 * the request ceiling are asserted with the durable limiter mocked, exactly
 * like the other API routes. The transport itself is covered by the in-memory
 * client suites next to the tool registry.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockConsume = vi.fn<(...args: unknown[]) => Promise<boolean>>(
  async () => true,
);
const mockConsumeMulti = vi.fn<(...args: unknown[]) => Promise<boolean>>(
  async () => true,
);
const mockClientKey = vi.fn<(...args: unknown[]) => Promise<string>>(
  async () => `mcp:ip-hmac-sha256-v1:${"a".repeat(64)}`,
);
const mockAuthenticatedKey = vi.fn<(...args: unknown[]) => Promise<string>>(
  async () => `mcp-authenticated:user-hmac-sha256-v1:${"b".repeat(64)}`,
);
const mockReportApiError = vi.fn<(...args: unknown[]) => void>();
const mockLookupToken = vi.fn<(...args: unknown[]) => Promise<unknown>>(
  async () => ({ ok: false, reason: "unknown" }),
);
const mockReadProgress = vi.fn<(...args: unknown[]) => Promise<unknown>>(
  async () => ({ progress: null, updatedAt: null }),
);
const mockRecordEvent = vi.fn<(...args: unknown[]) => void>();

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (...args: unknown[]) => mockConsume(...args),
  consumeMultiRateLimit: (...args: unknown[]) => mockConsumeMulti(...args),
  hashedClientRateLimitKey: (...args: unknown[]) => mockClientKey(...args),
  hashedAuthenticatedRateLimitKey: (...args: unknown[]) =>
    mockAuthenticatedKey(...args),
  isRateLimitUnavailableError: (error: unknown) =>
    (error as { code?: string })?.code === "RATE_LIMIT_UNAVAILABLE",
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));
// Only the store lookup is replaced: the real bearer resolver, the real token
// pattern and the real digest still run, so this asserts the wiring rather
// than a stand-in for it.
vi.mock("@/lib/agent-access/personal-tokens", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/agent-access/personal-tokens")
  >()),
  lookupPersonalAccessToken: (...args: unknown[]) => mockLookupToken(...args),
}));
vi.mock("@/lib/agent-access/progress-snapshot", () => ({
  readAgentProgressSnapshot: (...args: unknown[]) => mockReadProgress(...args),
}));
vi.mock("@/lib/agent-access/record", () => ({
  recordAgentAccessEvent: (...args: unknown[]) => mockRecordEvent(...args),
}));

import { GET, POST, maxDuration, runtime } from "./route";

const ENDPOINT = "http://localhost/api/mcp";
const PERSONAL_TOKEN = `lat_${"A".repeat(43)}`;

function enableAgentAccess(): void {
  vi.stubEnv("MCP_SERVER_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
  // The server needs the complete EU account runtime, not only the limiter
  // backend: its authenticated tools read one learner's account.
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-07-01");
}

function jsonRequest(
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...extraHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const INITIALIZE = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "route-test", version: "1.0.0" },
  },
};

beforeEach(() => {
  mockConsume.mockClear();
  mockConsumeMulti.mockClear();
  mockClientKey.mockClear();
  mockAuthenticatedKey.mockClear();
  mockReportApiError.mockClear();
  mockLookupToken.mockClear();
  mockReadProgress.mockClear();
  mockRecordEvent.mockClear();
  mockConsume.mockImplementation(async () => true);
  mockConsumeMulti.mockImplementation(async () => true);
  mockLookupToken.mockImplementation(async () => ({
    ok: false,
    reason: "unknown",
  }));
  mockReadProgress.mockImplementation(async () => ({
    progress: null,
    updatedAt: null,
  }));
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("/api/mcp route contract", () => {
  it("runs on the Node runtime with a bounded duration", () => {
    expect(runtime).toBe("nodejs");
    expect(maxDuration).toBe(30);
  });
});

describe("GET /api/mcp", () => {
  it("fails closed while agent access is not enabled", async () => {
    const response = await GET(new Request(ENDPOINT));
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("stays closed when the switch is on but the limiter backend is absent", async () => {
    vi.stubEnv("MCP_SERVER_ENABLED", "true");
    expect((await GET(new Request(ENDPOINT))).status).toBe(503);
  });

  it("serves the German explainer page by default", async () => {
    enableAgentAccess();
    const response = await GET(new Request(ENDPOINT));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, follow");
    const html = await response.text();
    expect(html).toContain('<html lang="de">');
    expect(html).toContain("Claude Desktop");
  });

  it("serves the English explainer page on request", async () => {
    enableAgentAccess();
    const response = await GET(new Request(`${ENDPOINT}?locale=en`));
    expect(await response.text()).toContain('<html lang="en">');
  });

  it("falls back to the canonical locale for an unknown one", async () => {
    enableAgentAccess();
    const response = await GET(new Request(`${ENDPOINT}?locale=fr`));
    expect(await response.text()).toContain('<html lang="de">');
  });
});

describe("POST /api/mcp", () => {
  it("fails closed while agent access is not enabled", async () => {
    const response = await POST(jsonRequest(INITIALIZE));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe(-32000);
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("rejects a request without a JSON content type", async () => {
    enableAgentAccess();
    for (const contentType of [undefined, "text/plain", "application/jsonp"]) {
      const response = await POST(
        new Request(ENDPOINT, {
          method: "POST",
          headers: contentType ? { "Content-Type": contentType } : {},
          body: JSON.stringify(INITIALIZE),
        }),
      );
      expect(response.status).toBe(415);
    }
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("answers 429 once the per-client budget is spent", async () => {
    enableAgentAccess();
    mockConsume.mockResolvedValueOnce(false);
    const response = await POST(jsonRequest(INITIALIZE));
    expect(response.status).toBe(429);
    expect(mockClientKey).toHaveBeenCalledWith("mcp", expect.any(Request));
  });

  it("answers 503 when the durable limiter is unavailable", async () => {
    enableAgentAccess();
    mockConsume.mockRejectedValueOnce(
      Object.assign(new Error("down"), { code: "RATE_LIMIT_UNAVAILABLE" }),
    );
    const response = await POST(jsonRequest(INITIALIZE));
    expect(response.status).toBe(503);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ route: "/api/mcp", step: "rate-limit" }),
    );
  });

  it("answers 413 for an oversize body", async () => {
    enableAgentAccess();
    const oversize = JSON.stringify({
      ...INITIALIZE,
      padding: "x".repeat(300_000),
    });
    const response = await POST(jsonRequest(oversize));
    expect(response.status).toBe(413);
  });

  it("answers 413 for a declared content-length above the ceiling", async () => {
    enableAgentAccess();
    const response = await POST(
      jsonRequest(JSON.stringify(INITIALIZE), {
        "Content-Length": "999999",
      }),
    );
    expect(response.status).toBe(413);
  });

  it("completes the initialize handshake over the transport", async () => {
    enableAgentAccess();
    const response = await POST(jsonRequest(INITIALIZE));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("loehrning-ai");
    expect(body).toContain("protocolVersion");
  });

  it("serves tools/list over the transport", async () => {
    enableAgentAccess();
    const response = await POST(
      jsonRequest({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("list_courses");
    expect(body).toContain("search_content");
  });

  it("serves a real tool call over the Streamable HTTP transport", async () => {
    enableAgentAccess();
    const response = await POST(
      jsonRequest({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "list_workshops", arguments: { locale: "en" } },
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("workshops");
    expect(body).toContain("workshop://");
  });

  it("serves resources/list over the Streamable HTTP transport", async () => {
    enableAgentAccess();
    const response = await POST(
      jsonRequest({
        jsonrpc: "2.0",
        id: 4,
        method: "resources/list",
        params: {},
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("lesson://");
  });

  it("answers malformed JSON without leaking an internal error", async () => {
    enableAgentAccess();
    const response = await POST(jsonRequest("{ not json"));
    expect(response.status).toBeGreaterThanOrEqual(400);
    const body = await response.text();
    expect(body).not.toContain("at Object.");
  });
});

describe("POST /api/mcp bearer handling", () => {
  it("keeps the authenticated tools out of tools/list without a credential", async () => {
    enableAgentAccess();
    const response = await POST(
      jsonRequest({
        jsonrpc: "2.0",
        id: 10,
        method: "tools/list",
        params: {},
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("list_courses");
    expect(body).not.toContain("get_my_progress");
    expect(body).not.toContain("get_next_step");
    expect(mockLookupToken).not.toHaveBeenCalled();
  });

  it("refuses a presented credential that does not resolve", async () => {
    enableAgentAccess();
    const response = await POST(
      jsonRequest(
        { jsonrpc: "2.0", id: 11, method: "tools/list", params: {} },
        { Authorization: `Bearer ${PERSONAL_TOKEN}` },
      ),
    );
    expect(response.status).toBe(401);
    const challenge = response.headers.get("WWW-Authenticate") ?? "";
    expect(challenge).toContain("Bearer");
    expect(challenge).toContain("invalid_token");
    expect(challenge).toContain(
      "/.well-known/oauth-protected-resource/api/mcp",
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await response.text();
    expect(body).not.toContain(PERSONAL_TOKEN);
    expect(body).not.toContain("list_courses");
  });

  it("adds the authenticated tools for a resolved personal access token", async () => {
    enableAgentAccess();
    mockLookupToken.mockImplementation(async () => ({
      ok: true,
      userId: "11111111-2222-3333-4444-555555555555",
      client: "pat:laptop",
    }));
    const response = await POST(
      jsonRequest(
        { jsonrpc: "2.0", id: 12, method: "tools/list", params: {} },
        { Authorization: `Bearer ${PERSONAL_TOKEN}` },
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("get_my_progress");
    expect(body).toContain("get_next_step");
    expect(body).toContain("list_courses");
  });

  it("reads the resolved account and records the call for an authenticated tool", async () => {
    enableAgentAccess();
    mockLookupToken.mockImplementation(async () => ({
      ok: true,
      userId: "11111111-2222-3333-4444-555555555555",
      client: "pat:laptop",
    }));
    const response = await POST(
      jsonRequest(
        {
          jsonrpc: "2.0",
          id: 13,
          method: "tools/call",
          params: { name: "get_my_progress", arguments: { locale: "en" } },
        },
        { Authorization: `Bearer ${PERSONAL_TOKEN}` },
      ),
    );
    expect(response.status).toBe(200);
    // The transport answers as a stream, so the tool result has to be drained
    // before the call it describes has finished.
    expect(await response.text()).toContain("has_stored_progress");
    expect(mockReadProgress).toHaveBeenCalledWith(
      "11111111-2222-3333-4444-555555555555",
    );
    expect(mockRecordEvent).toHaveBeenCalledWith({
      userId: "11111111-2222-3333-4444-555555555555",
      client: "pat:laptop",
      tool: "get_my_progress",
      ok: true,
      durationMs: expect.any(Number),
    });
  });
});
