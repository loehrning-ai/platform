import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
}));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    configured: true,
    user: { id: "user-1" },
  })),
  createAuthServerClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => true),
  hashedClientRateLimitKey: vi.fn(async (namespace: string) =>
    `${namespace}:sha256:${"a".repeat(64)}`,
  ),
}));

import { PUT } from "./route";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const mockedRateLimit = consumeRateLimit as unknown as ReturnType<typeof vi.fn>;

function streamingRequest(body: string): Request {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += 64 * 1024) {
        controller.enqueue(bytes.slice(offset, offset + 64 * 1024));
      }
      controller.close();
    },
  });

  return new Request("http://localhost/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("PUT /api/progress payload boundary", () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockMaybeSingle.mockReset();
    mockedRateLimit.mockReset();
    mockedRateLimit.mockResolvedValue(true);
  });

  it("rejects a declared oversized payload before parsing", async () => {
    const request = new Request("http://localhost/api/progress", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "262145",
      },
      body: "{}",
    });

    const response = await PUT(request);

    expect(response.status).toBe(413);
    expect((await response.json()) as unknown).toEqual({
      error: "payload_too_large",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects an oversized stream even when Content-Length is absent", async () => {
    const request = streamingRequest(
      JSON.stringify({ progress: { padding: "x".repeat(270_000) } }),
    );
    expect(request.headers.get("content-length")).toBeNull();

    const response = await PUT(request);

    expect(response.status).toBe(413);
    expect((await response.json()) as unknown).toEqual({
      error: "payload_too_large",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 429 before touching the body when the rate limit is exceeded", async () => {
    mockedRateLimit.mockResolvedValueOnce(false);

    const response = await PUT(
      new Request("http://localhost/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: {} }),
      }),
    );

    expect(response.status).toBe(429);
    expect((await response.json()) as unknown).toEqual({
      error: "rate_limit_exceeded",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
