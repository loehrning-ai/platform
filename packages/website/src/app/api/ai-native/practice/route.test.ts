import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Controllable mock Anthropic client. Each test sets `mockCreate`'s behavior.
const mockCreate = vi.fn();

vi.mock("@/lib/anthropic", () => ({
  tryGetAnthropicClient: () => ({
    messages: { create: mockCreate },
  }),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    configured: true,
    user: { id: "user-1" },
  })),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => true),
  hashedClientRateLimitKey: vi.fn(async () =>
    `ai-native-practice:sha256:${"b".repeat(64)}`,
  ),
}));

import { POST } from "./route";
import { __resetEngineState } from "./engine";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const mockedAuth = getAuthenticatedUser as unknown as ReturnType<typeof vi.fn>;
const mockedRateLimit = consumeRateLimit as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost/api/ai-native/practice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.1.1.1",
      "x-vercel-forwarded-for": "10.0.0.1",
      ...(headers ?? {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeStreamingReq(body: string): Request {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, 16 * 1024));
      controller.enqueue(bytes.slice(16 * 1024));
      controller.close();
    },
  });
  return new Request("http://localhost/api/ai-native/practice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

const VALID_COMPLETE = { mode: "complete", prompt: "Schreibe eine Mail." };
const VALID_PLACE = {
  mode: "place-word",
  word: "Lieferung",
  existing: [{ w: "Kunde", x: 0.8, y: 0.2 }],
};

function textBlock(text: string) {
  return {
    content: [{ type: "text", text }],
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

describe("POST /api/ai-native/practice", () => {
  beforeEach(() => {
    __resetEngineState();
    mockCreate.mockReset();
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
    mockedAuth.mockResolvedValue({
      configured: true,
      user: { id: "user-1" },
    });
    vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
    vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 when the feature flag is OFF by default", async () => {
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;
    const res = await POST(makeReq(VALID_COMPLETE));
    expect(res.status).toBe(503);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 401 before feature checks when the learning account is missing", async () => {
    mockedAuth.mockResolvedValueOnce({ configured: true, user: null });
    const res = await POST(makeReq(VALID_COMPLETE));
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(makeReq("not-json"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/JSON/);
  });

  it("returns 400 when payload fails Zod validation", async () => {
    const res = await POST(makeReq({ mode: "complete" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when prompt exceeds the length cap", async () => {
    const res = await POST(
      makeReq({ mode: "complete", prompt: "x".repeat(5000) }),
    );
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 413 when a no-length streamed body exceeds the byte cap", async () => {
    const request = makeStreamingReq(
      JSON.stringify({ mode: "complete", prompt: "x".repeat(40_000) }),
    );
    expect(request.headers.get("content-length")).toBeNull();
    const res = await POST(request);
    expect(res.status).toBe(413);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // ── ok ─────────────────────────────────────────────────────────
  it("ok: returns the completion text for a 'complete' request", async () => {
    mockCreate.mockResolvedValueOnce(textBlock("Hier ist deine Mail."));
    const res = await POST(makeReq(VALID_COMPLETE));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { mode: string; text: string };
    expect(json.mode).toBe("complete");
    expect(json.text).toBe("Hier ist deine Mail.");
    expect(mockedRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        key: `ai-native-practice:sha256:${"b".repeat(64)}`,
      }),
    );
  });

  it("ok: parses placement JSON for a 'place-word' request", async () => {
    mockCreate.mockResolvedValueOnce(
      textBlock(
        JSON.stringify({ x: 0.82, y: 0.25, near: "Kunde", why: "Vertrieb." }),
      ),
    );
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      mode: string;
      x: number;
      y: number;
      near: string;
    };
    expect(json.mode).toBe("place-word");
    expect(json.near).toBe("Kunde");
    expect(json.x).toBeGreaterThanOrEqual(0.05);
    expect(json.x).toBeLessThanOrEqual(0.95);
  });

  it("ok: serves a cached response on the second identical request", async () => {
    mockCreate.mockResolvedValueOnce(textBlock("Einmalig."));
    const first = await POST(makeReq(VALID_COMPLETE));
    expect(first.status).toBe(200);
    const second = await POST(makeReq(VALID_COMPLETE));
    expect(second.status).toBe(200);
    const json = (await second.json()) as { cached: boolean };
    expect(json.cached).toBe(true);
    // Claude was only called once.
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── timeout / error ─────────────────────────────────────────────
  it("timeout: returns 500 with an honest German error when the SDK rejects", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Request was aborted"));
    const res = await POST(makeReq(VALID_COMPLETE));
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/Live-Modus/);
  });

  // ── malformed ───────────────────────────────────────────────────
  it("malformed: returns 500 when place-word JSON is unparseable", async () => {
    mockCreate.mockResolvedValueOnce(textBlock("definitely not json {{{"));
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(500);
  });

  it("malformed: clamps out-of-range coordinates rather than crashing", async () => {
    mockCreate.mockResolvedValueOnce(
      textBlock(JSON.stringify({ x: 9, y: -4, near: "Kunde", why: "x" })),
    );
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { x: number; y: number };
    expect(json.x).toBeLessThanOrEqual(0.95);
    expect(json.y).toBeGreaterThanOrEqual(0.05);
  });

  it("malformed: falls back to first existing word when 'near' hallucinated", async () => {
    mockCreate.mockResolvedValueOnce(
      textBlock(
        JSON.stringify({ x: 0.5, y: 0.5, near: "Phantasiewort", why: "x" }),
      ),
    );
    const res = await POST(makeReq(VALID_PLACE));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { near: string };
    expect(json.near).toBe("Kunde");
  });

  // ── rate limit ──────────────────────────────────────────────────
  it("returns 429 after 20 requests from one IP in an hour", async () => {
    mockCreate.mockResolvedValue(textBlock("ok"));
    for (let i = 0; i < 20; i++) {
      // Unique prompt each time to avoid the cache short-circuit.
      const res = await POST(
        makeReq({ mode: "complete", prompt: `Mail ${i}` }),
      );
      expect(res.status).toBe(200);
    }
    mockedRateLimit.mockResolvedValueOnce(false);
    const blocked = await POST(
      makeReq({ mode: "complete", prompt: "one too many" }),
    );
    expect(blocked.status).toBe(429);
  });
});
