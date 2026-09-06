/**
 * The agent endpoint is public, so its log lines must be provably built from
 * allow-listed values only. These tests pin that: an unregistered tool name, a
 * bogus outcome, and a nonsense duration all collapse to fixed values.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  logMcpRequestEvent,
  logMcpToolEvent,
  registerLoggableToolNames,
  type McpToolOutcome,
} from "./observability";
import { MCP_TOOL_NAMES } from "./tools/registry";

let logged: string[];

beforeEach(() => {
  logged = [];
  vi.spyOn(console, "warn").mockImplementation((line: unknown) => {
    logged.push(String(line));
  });
  registerLoggableToolNames(MCP_TOOL_NAMES);
});

afterEach(() => {
  vi.restoreAllMocks();
  registerLoggableToolNames(MCP_TOOL_NAMES);
});

function lastLine(): Record<string, unknown> {
  return JSON.parse(logged[logged.length - 1]!) as Record<string, unknown>;
}

describe("tool event logs", () => {
  it("writes one JSON line for a registered tool", () => {
    logMcpToolEvent({ tool: "list_courses", outcome: "ok", durationMs: 12.4 });
    expect(lastLine()).toEqual({
      event: "mcp-tool",
      tool: "list_courses",
      outcome: "ok",
      durationMs: 12,
    });
  });

  it("replaces an unregistered tool name", () => {
    logMcpToolEvent({
      tool: "../../etc/passwd",
      outcome: "ok",
      durationMs: 1,
    });
    expect(lastLine().tool).toBe("unknown");
  });

  it("replaces an outcome outside the fixed enum", () => {
    logMcpToolEvent({
      tool: "list_courses",
      outcome: "leaked-secret" as McpToolOutcome,
      durationMs: 1,
    });
    expect(lastLine().outcome).toBe("failed");
  });

  it("normalizes a nonsense duration", () => {
    for (const durationMs of [Number.NaN, -5, Number.POSITIVE_INFINITY]) {
      logMcpToolEvent({ tool: "list_courses", outcome: "ok", durationMs });
      expect(lastLine().durationMs).toBe(0);
    }
  });

  it("records the truncation flag only when it is set", () => {
    logMcpToolEvent({ tool: "get_lesson", outcome: "ok", durationMs: 1 });
    expect("truncated" in lastLine()).toBe(false);
    logMcpToolEvent({
      tool: "get_lesson",
      outcome: "ok",
      durationMs: 1,
      truncated: true,
    });
    expect(lastLine().truncated).toBe(true);
  });

  it("never breaks a tool call when the sink throws", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("sink is gone");
    });
    expect(() =>
      logMcpToolEvent({ tool: "list_courses", outcome: "ok", durationMs: 1 }),
    ).not.toThrow();
  });
});

describe("request event logs", () => {
  it("writes the outcome and status", () => {
    logMcpRequestEvent({ outcome: "served", status: 200, durationMs: 4 });
    expect(lastLine()).toEqual({
      event: "mcp-request",
      outcome: "served",
      status: 200,
      durationMs: 4,
    });
  });

  it("normalizes a status outside the HTTP range", () => {
    logMcpRequestEvent({ outcome: "served", status: 9001, durationMs: 1 });
    expect(lastLine().status).toBe(0);
  });

  it("replaces an outcome outside the fixed enum", () => {
    logMcpRequestEvent({
      outcome: "secret" as "served",
      status: 200,
      durationMs: 1,
    });
    expect(lastLine().outcome).toBe("failed");
  });
});
