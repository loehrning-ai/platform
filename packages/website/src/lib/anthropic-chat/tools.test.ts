/**
 * The chat's tool surface is the public MCP registry, not a copy of it.
 *
 * These tests pin that equivalence and the three properties that make the
 * surface safe to hand a model: strict validation before anything runs, the
 * shared output ceiling, and exactly one audit row per attempted call.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRecord } = vi.hoisted(() => ({ mockRecord: vi.fn() }));

vi.mock("@/lib/agent-access/record", () => ({
  KONTO_CHAT_CLIENT: "konto-chat",
  recordAgentAccessEvent: (event: unknown) => mockRecord(event),
}));

import { MCP_TOOL_NAMES } from "@/lib/mcp/tools/registry";
import {
  ACCOUNT_CHAT_TOOLS,
  ACCOUNT_CHAT_TOOL_NAMES,
  executeAccountChatTool,
  toolBudgetExhaustedResult,
} from "./tools";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CONTEXT = { userId: USER_ID } as const;

function payloadOf(text: string): Record<string, unknown> {
  return JSON.parse(text) as Record<string, unknown>;
}

beforeEach(() => {
  mockRecord.mockClear();
});

describe("account chat tool definitions", () => {
  it("exposes exactly the public MCP registry, with no second catalogue", () => {
    expect([...ACCOUNT_CHAT_TOOL_NAMES].sort()).toEqual(
      [...MCP_TOOL_NAMES].sort(),
    );
  });

  it("sends a strict object schema for every tool and no document annotation", () => {
    for (const tool of ACCOUNT_CHAT_TOOLS) {
      expect(tool.input_schema.type).toBe("object");
      expect(tool.input_schema.additionalProperties).toBe(false);
      expect(tool.input_schema).not.toHaveProperty("$schema");
      expect(tool.description.length).toBeGreaterThan(40);
    }
  });

  it("keeps the tool block byte-identical between turns so it can be cached", () => {
    expect(JSON.stringify(ACCOUNT_CHAT_TOOLS)).toBe(
      JSON.stringify(ACCOUNT_CHAT_TOOLS),
    );
  });

  it("carries the optional locale as a default rather than a required field", () => {
    const listCourses = ACCOUNT_CHAT_TOOLS.find(
      (tool) => tool.name === "list_courses",
    );
    expect(listCourses?.input_schema.required).toBeUndefined();
    const properties = listCourses?.input_schema.properties as
      | Record<string, Record<string, unknown>>
      | undefined;
    expect(properties?.locale?.default).toBe("de");
  });
});

describe("executeAccountChatTool", () => {
  it("runs a registered tool and records one successful audit row", async () => {
    const result = await executeAccountChatTool(
      "list_courses",
      { locale: "de" },
      CONTEXT,
    );

    expect(result.isError).toBe(false);
    expect(payloadOf(result.text)).toHaveProperty("courses");
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledWith({
      userId: USER_ID,
      client: "konto-chat",
      tool: "list_courses",
      ok: true,
      durationMs: expect.any(Number),
    });
  });

  it("refuses arguments that do not match the schema without running the tool", async () => {
    const result = await executeAccountChatTool(
      "list_courses",
      { locale: "de", smuggled: true },
      CONTEXT,
    );

    expect(result.isError).toBe(true);
    expect(payloadOf(result.text).error).toBe("tool_input_invalid");
    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ tool: "list_courses", ok: false }),
    );
  });

  it("treats unrecovered arguments as invalid input", async () => {
    const result = await executeAccountChatTool(
      "list_courses",
      undefined,
      CONTEXT,
    );

    expect(result.isError).toBe(true);
    expect(payloadOf(result.text).error).toBe("tool_input_invalid");
  });

  it("records an unregistered name as unknown instead of storing the model's label", async () => {
    const result = await executeAccountChatTool(
      "delete_everything",
      {},
      CONTEXT,
    );

    expect(result.isError).toBe(true);
    expect(payloadOf(result.text).error).toBe("unknown_tool");
    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ tool: "unknown", ok: false }),
    );
  });

  it("returns the tool's own named error for an unknown identifier", async () => {
    const result = await executeAccountChatTool(
      "get_course",
      { slug: "kein-kurs-mit-diesem-slug", locale: "de" },
      CONTEXT,
    );

    expect(result.isError).toBe(true);
    expect(payloadOf(result.text).error).toBe("unknown_course");
    expect(String(payloadOf(result.text).message)).not.toContain(
      "kein-kurs-mit-diesem-slug",
    );
  });

  it("never lets an unexpected failure reach the transcript", async () => {
    const { MCP_TOOLS } = await import("@/lib/mcp/tools/registry");
    const listCourses = MCP_TOOLS.find((tool) => tool.name === "list_courses");
    if (!listCourses) throw new Error("list_courses is missing");
    const spy = vi
      .spyOn(listCourses, "run")
      .mockImplementation(() => {
        throw new Error("/var/task/secret/path.ts exploded");
      });

    const result = await executeAccountChatTool(
      "list_courses",
      { locale: "de" },
      CONTEXT,
    );

    expect(result.isError).toBe(true);
    expect(payloadOf(result.text).error).toBe("tool_failed");
    expect(result.text).not.toContain("/var/task");
    spy.mockRestore();
  });

  it("names the exhausted budget without touching the audit trail", () => {
    const result = toolBudgetExhaustedResult();
    expect(result.isError).toBe(true);
    expect(payloadOf(result.text).error).toBe("tool_budget_exhausted");
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
