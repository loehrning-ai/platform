import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The audit writer's whole contract is negative: it must never block, never
 * throw, never reject, and never carry a tool argument or result into the
 * table. Every branch below is therefore a failure branch, plus one assertion
 * on the exact row shape that reaches the service client.
 *
 * vi.mock is hoisted, so the factories delegate to handles configured per test.
 */

interface InsertResult {
  error: { message: string } | null;
}

const mockInsert = vi.fn<(row: unknown) => Promise<InsertResult>>(async () => ({
  error: null,
}));
const mockFrom = vi.fn<(table: string) => { insert: typeof mockInsert }>(
  () => ({ insert: mockInsert }),
);
const mockTryCreateServiceClient = vi.fn<() => unknown>(() => ({
  from: (table: string) => mockFrom(table),
}));
const mockReportApiError = vi.fn<(report: unknown) => void>();
const mockAfter = vi.fn<(task: () => unknown) => void>((task) => {
  void task();
});

vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockTryCreateServiceClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (report: unknown) => mockReportApiError(report),
}));
vi.mock("next/server", () => ({
  after: (task: () => unknown) => mockAfter(task),
}));

import {
  AGENT_ACCESS_CLIENT_MAX_LENGTH,
  AGENT_ACCESS_DURATION_MS_MAX,
  AGENT_ACCESS_EVENTS_TABLE,
  AGENT_ACCESS_TOOL_MAX_LENGTH,
  KONTO_CHAT_CLIENT,
  normalizeAgentAccessEvent,
  oauthClientLabel,
  personalTokenClientLabel,
  recordAgentAccessEvent,
  writeAgentAccessEvent,
  type AgentAccessEvent,
} from "./record";

const OWNER = "3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";

function event(overrides: Partial<AgentAccessEvent> = {}): AgentAccessEvent {
  return {
    userId: OWNER,
    client: "pat:Laptop",
    tool: "get_my_progress",
    ok: true,
    durationMs: 12,
    ...overrides,
  };
}

function droppedReason(warn: { mock: { calls: unknown[][] } }): unknown {
  const [line] = warn.mock.calls[0] as [string];
  return JSON.parse(line);
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockInsert.mockReset();
  mockInsert.mockImplementation(async () => ({ error: null }));
  mockFrom.mockReset();
  mockFrom.mockImplementation(() => ({ insert: mockInsert }));
  mockTryCreateServiceClient.mockReset();
  mockTryCreateServiceClient.mockImplementation(() => ({
    from: (table: string) => mockFrom(table),
  }));
  mockReportApiError.mockReset();
  mockAfter.mockReset();
  mockAfter.mockImplementation((task) => {
    void task();
  });
});

describe("agent access audit writer", () => {
  it("writes exactly the columns the audit table accepts", async () => {
    const outcome = await writeAgentAccessEvent(event({ durationMs: 12.6 }));

    expect(outcome).toBe("written");
    expect(mockFrom).toHaveBeenCalledWith(AGENT_ACCESS_EVENTS_TABLE);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>];
    expect(Object.keys(row).sort()).toEqual([
      "client",
      "duration_ms",
      "ok",
      "tool",
      "user_id",
    ]);
    expect(row).toEqual({
      user_id: OWNER,
      client: "pat:Laptop",
      tool: "get_my_progress",
      ok: true,
      duration_ms: 13,
    });
  });

  it("never copies anything but the five audit fields out of an event", () => {
    const row = normalizeAgentAccessEvent({
      ...event(),
      arguments: { query: "Gehaltsverhandlung" },
      result: "a long model answer",
    } as unknown as AgentAccessEvent);

    expect(row).not.toBeNull();
    expect(Object.keys(row ?? {})).toEqual([
      "user_id",
      "client",
      "tool",
      "ok",
      "duration_ms",
    ]);
  });

  it("bounds and cleans both caller-influenced labels", async () => {
    await writeAgentAccessEvent(
      event({
        userId: `  ${OWNER}  `,
        // Two code units per character: a naive slice would leave half a
        // surrogate pair and PostgreSQL would refuse the row.
        client: `pat:${"\u{1f9ea}".repeat(200)}`,
        tool: "  get\u0000_next\n  step  ",
        ok: false,
        durationMs: -5,
      }),
    );

    const [row] = mockInsert.mock.calls[0] as [Record<string, string | boolean | number>];
    expect(row.user_id).toBe(OWNER);
    expect(Array.from(String(row.client))).toHaveLength(
      AGENT_ACCESS_CLIENT_MAX_LENGTH,
    );
    expect(String(row.client).startsWith("pat:\u{1f9ea}")).toBe(true);
    expect(row.tool).toBe("get _next step");
    expect(row.ok).toBe(false);
    expect(row.duration_ms).toBe(0);
  });

  it("clamps an impossible duration instead of failing the CHECK constraint", async () => {
    await writeAgentAccessEvent(event({ durationMs: 10_000_000 }));
    await writeAgentAccessEvent(event({ durationMs: Number.NaN }));

    const [first] = mockInsert.mock.calls[0] as [Record<string, unknown>];
    const [second] = mockInsert.mock.calls[1] as [Record<string, unknown>];
    expect(first.duration_ms).toBe(AGENT_ACCESS_DURATION_MS_MAX);
    expect(second.duration_ms).toBe(0);
  });

  it("keeps a tool name inside the column bound", async () => {
    await writeAgentAccessEvent(event({ tool: "t".repeat(500) }));

    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>];
    expect(String(row.tool)).toHaveLength(AGENT_ACCESS_TOOL_MAX_LENGTH);
  });

  it("refuses an event that cannot be attributed to an owner", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const outcome = await writeAgentAccessEvent(
      event({ userId: "not-a-uuid" }),
    );

    expect(outcome).toBe("skipped");
    expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(droppedReason(warn)).toEqual({
      event: "agent-access-record",
      outcome: "dropped",
      reason: "invalid_event",
    });
  });

  it("refuses an event whose labels are empty after cleaning", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await writeAgentAccessEvent(event({ client: "   " }))).toBe(
      "skipped",
    );
    expect(await writeAgentAccessEvent(event({ tool: "\u0000\u0000" }))).toBe(
      "skipped",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("skips quietly when the store is not configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockTryCreateServiceClient.mockReturnValue(null);

    expect(await writeAgentAccessEvent(event())).toBe("skipped");
    expect(mockInsert).not.toHaveBeenCalled();
    expect(droppedReason(warn)).toEqual({
      event: "agent-access-record",
      outcome: "dropped",
      reason: "store_unavailable",
    });
  });

  it("skips when creating the service client throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockTryCreateServiceClient.mockImplementation(() => {
      throw new Error("Missing SUPABASE_URL");
    });

    expect(await writeAgentAccessEvent(event())).toBe("skipped");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("reports a rejected insert without throwing", async () => {
    mockInsert.mockResolvedValue({ error: { message: "permission denied" } });

    expect(await writeAgentAccessEvent(event())).toBe("failed");
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
    expect(mockReportApiError).toHaveBeenCalledWith({
      step: "supabase-insert",
      error: { message: "permission denied" },
    });
  });

  it("reports an insert that rejects without throwing", async () => {
    const failure = new Error("connection reset");
    mockInsert.mockRejectedValue(failure);

    expect(await writeAgentAccessEvent(event())).toBe("failed");
    expect(mockReportApiError).toHaveBeenCalledWith({
      step: "supabase-insert",
      error: failure,
    });
  });

  it("reports a store that throws before the insert is issued", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("client destroyed");
    });

    expect(await writeAgentAccessEvent(event())).toBe("failed");
    expect(mockReportApiError).toHaveBeenCalledTimes(1);
  });
});

describe("fire-and-forget recording", () => {
  it("returns immediately and defers the write past the response", async () => {
    expect(recordAgentAccessEvent(event())).toBeUndefined();

    expect(mockAfter).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));
  });

  it("still writes when there is no request scope to defer into", async () => {
    mockAfter.mockImplementation(() => {
      throw new Error("`after` was called outside a request scope.");
    });

    expect(() => recordAgentAccessEvent(event())).not.toThrow();
    await vi.waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));
  });

  it("never throws at the call site when every layer fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockAfter.mockImplementation(() => {
      throw new Error("no request scope");
    });
    mockTryCreateServiceClient.mockImplementation(() => {
      throw new Error("no service configuration");
    });

    expect(() => recordAgentAccessEvent(event())).not.toThrow();
    await vi.waitFor(() =>
      expect(mockTryCreateServiceClient).toHaveBeenCalledTimes(1),
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("never surfaces an unhandled rejection when the insert rejects", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    mockInsert.mockRejectedValue(new Error("connection reset"));

    try {
      recordAgentAccessEvent(event());
      await vi.waitFor(() =>
        expect(mockReportApiError).toHaveBeenCalledTimes(1),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});

describe("client labels", () => {
  it("names a personal access token by its owner-chosen name", () => {
    expect(personalTokenClientLabel("Mein Büro-Laptop")).toBe(
      "pat:Mein Büro-Laptop",
    );
  });

  it("falls back to a fixed label when a name cleans away to nothing", () => {
    expect(personalTokenClientLabel("  \u0000 ")).toBe("pat:unknown");
    expect(oauthClientLabel("")).toBe("oauth:unknown");
  });

  it("keeps every label inside the column bound", () => {
    expect(
      Array.from(personalTokenClientLabel("n".repeat(400))),
    ).toHaveLength(AGENT_ACCESS_CLIENT_MAX_LENGTH);
    expect(Array.from(oauthClientLabel("c".repeat(400)))).toHaveLength(
      AGENT_ACCESS_CLIENT_MAX_LENGTH,
    );
    expect(Array.from(KONTO_CHAT_CLIENT).length).toBeLessThanOrEqual(
      AGENT_ACCESS_CLIENT_MAX_LENGTH,
    );
  });

  it("names an OAuth grant by its registered client id", () => {
    expect(oauthClientLabel("mcp-client-42")).toBe("oauth:mcp-client-42");
  });
});
