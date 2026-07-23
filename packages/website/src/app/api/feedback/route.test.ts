import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * /api/feedback negative-path and resilience coverage. Every guard branch is
 * asserted with the service-role insert and durable limiter mocked. vi.mock is
 * hoisted, so factories delegate to handles configured per test.
 */

const mockConsume = vi.fn(async () => true);
const mockInsert = vi.fn(
  async () => ({ error: null as { message: string } | null }),
);
const mockPrune = vi.fn(
  async () => ({ error: null as { message: string } | null }),
);

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (...args: unknown[]) => mockConsume(...args),
  hashedClientRateLimitKey: vi.fn(async () =>
    `feedback:sha256:${"a".repeat(64)}`,
  ),
}));

const mockServiceClient = {
  from: () => ({ insert: (...args: unknown[]) => mockInsert(...args) }),
  rpc: (...args: unknown[]) => mockPrune(...args),
};

vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: vi.fn(() => mockServiceClient),
}));

import { POST } from "./route";

const OK_BODY = {
  category: "inhalt",
  message: "Das ist ein ausreichend langer Hinweis zum Inhalt.",
};

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-forwarded-for": "10.0.0.1",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeStreamingReq(body: string): Request {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const midpoint = Math.floor(bytes.length / 2);
      controller.enqueue(bytes.slice(0, midpoint));
      controller.enqueue(bytes.slice(midpoint));
      controller.close();
    },
  });
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-forwarded-for": "10.0.0.1",
    },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("POST /api/feedback negative paths", () => {
  beforeEach(() => {
    process.env.FEEDBACK_ENABLED = "true";
    process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT = "2026-07-14";
    mockConsume.mockReset();
    mockConsume.mockResolvedValue(true);
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockPrune.mockReset();
    mockPrune.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    delete process.env.FEEDBACK_ENABLED;
    delete process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT;
  });

  it("503 feedback_disabled unless the explicit retention gate is active", async () => {
    delete process.env.FEEDBACK_ENABLED;
    const res = await POST(makeReq(OK_BODY));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "feedback_disabled",
    );
    expect(mockConsume).not.toHaveBeenCalled();
    expect(mockPrune).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("keeps the database retention function restricted and fixed at 180 days", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260716160507_20260714182753_feedback_retention.sql",
      ),
      "utf8",
    ).toLowerCase();
    expect(migration).toContain("security invoker");
    expect(migration).toContain("interval '180 days'");
    expect(migration).toContain(
      "revoke execute on function public.prune_beta_feedback() from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.prune_beta_feedback() to service_role",
    );
  });

  it("429 fail-closed when the durable rate limit denies, before any insert", async () => {
    mockConsume.mockResolvedValueOnce(false);
    const res = await POST(makeReq(OK_BODY));
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toBe(
      "rate_limit_exceeded",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("400 invalid_json on an unparseable body", async () => {
    const res = await POST(makeReq("{not valid json"));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_json",
    );
  });

  it("400 invalid_input when the category is outside the enum", async () => {
    const res = await POST(
      makeReq({ category: "spam", message: "lang genug fuer die Pruefung" }),
    );
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("400 invalid_input when the message is shorter than 10 chars", async () => {
    const res = await POST(makeReq({ category: "technik", message: "kurz" }));
    expect(res.status).toBe(400);
  });

  it("400 invalid_input (oversized) when the message exceeds the 2000-char cap", async () => {
    const res = await POST(
      makeReq({ category: "technik", message: "x".repeat(2001) }),
    );
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("413 payload_too_large when a no-length streamed body exceeds the byte cap", async () => {
    const req = makeStreamingReq(
      JSON.stringify({ category: "technik", message: "x".repeat(20_000) }),
    );
    expect(req.headers.get("content-length")).toBeNull();

    const res = await POST(req);

    expect(res.status).toBe(413);
    expect(((await res.json()) as { error: string }).error).toBe(
      "payload_too_large",
    );
    expect(mockPrune).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a context URL that could retain origin, query, or fragment data", async () => {
    for (const contextUrl of [
      "https://loehrning.ai/feedback",
      "/feedback?email=person@example.com",
      "/feedback#private-note",
      "/\\external",
    ]) {
      const res = await POST(makeReq({ ...OK_BODY, contextUrl }));
      expect(res.status, contextUrl).toBe(400);
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("503 feedback_storage_unavailable when Supabase env is absent", async () => {
    const { tryCreateServiceClient } = await import("@/lib/supabase/server");
    vi.mocked(tryCreateServiceClient).mockReturnValueOnce(null);
    const res = await POST(makeReq(OK_BODY));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "feedback_storage_unavailable",
    );
    expect(mockConsume).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("500 db_error when the Supabase insert returns an error", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "insert boom" } });
    const res = await POST(makeReq(OK_BODY));
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toBe("db_error");
  });

  it("503 when the fixed-retention migration is not callable", async () => {
    mockPrune.mockResolvedValueOnce({ error: { message: "missing function" } });
    const res = await POST(makeReq(OK_BODY));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "retention_policy_unavailable",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("200 ok persists a valid submission and reports it as stored", async () => {
    const res = await POST(makeReq({ ...OK_BODY, contextUrl: "/feedback" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; persisted: boolean };
    expect(json.ok).toBe(true);
    expect(json.persisted).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockPrune).toHaveBeenCalledWith("prune_beta_feedback");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ context_url: "/feedback" }),
    );
    expect(mockConsume).toHaveBeenCalledWith(
      expect.objectContaining({
        key: `feedback:sha256:${"a".repeat(64)}`,
      }),
    );
  });
});
