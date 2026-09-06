/**
 * The authenticated agent tools over the real protocol.
 *
 * The SDK's in-memory transport carries every call, so these tests see the
 * same handshake, the same schema validation, and the same result envelopes a
 * Claude Desktop or Codex client would. Only the wire and the two injected
 * dependencies (the progress read and the durable limiter) are stand-ins.
 *
 * Shadow paths covered: a null argument object, an argument the schema does
 * not know, a store that cannot answer, and a budget that is used up, plus the
 * limiter itself being unavailable and an account with no stored rows at all.
 */

import { McpServer } from "@modelcontextprotocol/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectInMemoryClient, type InMemoryMcpClient } from "@/test/mcp-client";

const mockConsumeMulti = vi.fn<(...args: unknown[]) => Promise<boolean>>(
  async () => true,
);
const mockUserKey = vi.fn<(...args: unknown[]) => Promise<string>>(
  async () => `mcp-authenticated:user-v1:${"a".repeat(64)}`,
);
const mockClientKey = vi.fn<(...args: unknown[]) => Promise<string>>(
  async () => `mcp-authenticated-ip:ip-v1:${"b".repeat(64)}`,
);

vi.mock("@/lib/security/rate-limit", () => ({
  consumeMultiRateLimit: (...args: unknown[]) => mockConsumeMulti(...args),
  hashedAuthenticatedRateLimitKey: (...args: unknown[]) => mockUserKey(...args),
  hashedClientRateLimitKey: (...args: unknown[]) => mockClientKey(...args),
}));

import type { AgentPrincipal } from "../auth";
import { MCP_TOOL_NAMES } from "./registry";
import {
  AGENT_TOOL_CLIENT_RATE_LIMIT_MAX,
  AGENT_TOOL_USER_RATE_LIMIT_MAX,
  assertAuthenticatedToolRegistry,
  AUTHENTICATED_MCP_TOOLS,
  AUTHENTICATED_MCP_TOOL_NAMES,
  registerAuthenticatedMcpTools,
  type AuthenticatedToolContext,
  type AuthenticatedToolDefinition,
  type AuthenticatedToolEvent,
  type ProgressSnapshot,
} from "./authenticated";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import {
  CANONICAL_LESSON_IDS,
  isLessonCompletionEvidenceBacked,
} from "@/lib/courses/completion";
import {
  legacyCompletionEvidenceCheckpointKey,
  UNIFIED_SCHEMA_VERSION,
  type UnifiedProgress,
} from "@/lib/progress/types";

const USER_ID = "9f1d7c2a-6f5b-4a3e-9d21-0f6b4c8e1a77";
const FIRST_COURSE = COURSE_CATALOG[0]!.slug;
const EMPTY_SNAPSHOT: ProgressSnapshot = { progress: null, updatedAt: null };

const PRINCIPAL: AgentPrincipal = {
  userId: USER_ID,
  kind: "personal-access-token",
  client: "pat:Laptop",
  scopes: [],
};

function startedProgress(): UnifiedProgress {
  const lessonId = CANONICAL_LESSON_IDS[FIRST_COURSE][0]!;
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {
      [FIRST_COURSE]: {
        lessons: {
          [lessonId]: {
            sectionsRead: [],
            quizScore: null,
            quizTotal: null,
            completed: true,
            exercisesCompleted: {},
          },
        },
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: "2026-09-01T10:00:00.000Z",
        lastActivity: "2026-09-02T10:00:00.000Z",
      },
    },
    xp: 25,
    checkpoints: {
      [legacyCompletionEvidenceCheckpointKey(FIRST_COURSE, lessonId)]: true,
    },
    badges: { "first-lesson": "2026-09-01T10:05:00.000Z" },
    streak: { days: 2, last: "2026-09-02" },
    lastActivity: "2026-09-02T10:00:00.000Z",
  };
}

let client: InMemoryMcpClient;
let recorded: AuthenticatedToolEvent[];
let readProgress: ReturnType<typeof vi.fn>;

function context(
  overrides: Partial<AuthenticatedToolContext> = {},
): AuthenticatedToolContext {
  return {
    principal: PRINCIPAL,
    request: new Request("https://loehrning.ai/api/mcp", { method: "POST" }),
    readProgress: readProgress as unknown as AuthenticatedToolContext["readProgress"],
    recordEvent: (event) => {
      recorded.push(event);
    },
    ...overrides,
  };
}

async function connect(
  overrides: Partial<AuthenticatedToolContext> = {},
): Promise<InMemoryMcpClient> {
  const server = new McpServer({ name: "test", version: "1.0.0" });
  registerAuthenticatedMcpTools(server, context(overrides));
  return connectInMemoryClient(server);
}

function errorOf(payload: Record<string, unknown>): string {
  return String(payload.error ?? "");
}

beforeEach(async () => {
  recorded = [];
  mockConsumeMulti.mockClear();
  mockConsumeMulti.mockImplementation(async () => true);
  mockUserKey.mockClear();
  mockClientKey.mockClear();
  readProgress = vi.fn(async () => EMPTY_SNAPSHOT);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  client = await connect();
});

afterEach(async () => {
  await client.close();
  vi.restoreAllMocks();
});

describe("the authenticated tool registry", () => {
  it("exposes exactly two read-only tools and no write tool", () => {
    expect([...AUTHENTICATED_MCP_TOOL_NAMES].sort()).toEqual([
      "get_my_progress",
      "get_next_step",
    ]);
    for (const name of AUTHENTICATED_MCP_TOOL_NAMES) {
      expect(name).not.toMatch(
        /^(set|save|update|write|record|mark|complete|delete|create|reset)_/,
      );
    }
  });

  it("never collides with a public tool name", () => {
    for (const name of AUTHENTICATED_MCP_TOOL_NAMES) {
      expect(MCP_TOOL_NAMES).not.toContain(name);
    }
    const clash: AuthenticatedToolDefinition = {
      ...AUTHENTICATED_MCP_TOOLS[0]!,
      name: MCP_TOOL_NAMES[0]!,
    };
    expect(() => assertAuthenticatedToolRegistry([clash])).toThrow(
      /already a public tool name/,
    );
  });

  it("refuses a definition whose schema accepts unknown keys", () => {
    const permissive: AuthenticatedToolDefinition = {
      ...AUTHENTICATED_MCP_TOOLS[0]!,
      name: "permissive_tool",
      inputSchema: {
        "~standard": {},
        safeParse: () => ({ success: true }),
      } as unknown as AuthenticatedToolDefinition["inputSchema"],
    };
    expect(() => assertAuthenticatedToolRegistry([permissive])).toThrow(
      /strict input schema/,
    );
  });

  it("advertises both tools as read only over tools/list", async () => {
    const response = await client.request("tools/list", {});
    const tools = (response.result as unknown as {
      tools: {
        name: string;
        description?: string;
        annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
        inputSchema?: { additionalProperties?: boolean };
      }[];
    }).tools;

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "get_my_progress",
      "get_next_step",
    ]);
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.destructiveHint).toBe(false);
      expect(tool.inputSchema?.additionalProperties).toBe(false);
      expect((tool.description ?? "").length).toBeGreaterThan(39);
    }
  });
});

describe("get_my_progress over the transport", () => {
  it("reads the principal's own account and nothing else", async () => {
    readProgress.mockImplementation(async () => ({
      progress: startedProgress(),
      updatedAt: "2026-09-02T10:00:00.000Z",
    }));
    const payload = await client.callToolJson("get_my_progress", {});

    expect(readProgress).toHaveBeenCalledWith(USER_ID);
    expect(payload.has_stored_progress).toBe(true);
    expect(payload.updated_at).toBe("2026-09-02T10:00:00.000Z");
    expect(payload.xp).toBe(25);
    const courses = payload.courses as readonly Record<string, unknown>[];
    expect(courses.find((course) => course.slug === FIRST_COURSE))
      .toMatchObject({ completed_lessons: 1, started: true });
  });

  it("answers an account with no stored rows honestly", async () => {
    const payload = await client.callToolJson("get_my_progress", {});

    expect(payload.has_stored_progress).toBe(false);
    expect(payload.updated_at).toBeNull();
    expect(payload.total_completed_lessons).toBe(0);
    expect(payload.courses_completed).toBe(0);
    expect((payload.courses as readonly unknown[]).length).toBe(
      COURSE_CATALOG.length,
    );
  });

  it("defaults to German and honours an explicit locale", async () => {
    const german = await client.callToolJson("get_my_progress", {});
    expect(german.locale).toBe("de");

    const english = await client.callToolJson("get_my_progress", {
      locale: "en",
    });
    expect(english.locale).toBe("en");
    expect(String(english.account_url)).toContain("/en/konto");
  });
});

describe("get_next_step over the transport", () => {
  it("names the first lesson that is not finished yet", async () => {
    readProgress.mockImplementation(async () => ({
      progress: startedProgress(),
      updatedAt: null,
    }));
    const payload = await client.callToolJson("get_next_step", {});
    const step = payload.next_step as Record<string, unknown>;

    expect(step.kind).toBe("lesson");
    expect(step.course).toBe(FIRST_COURSE);
    expect(step.lesson_id).toBe(CANONICAL_LESSON_IDS[FIRST_COURSE][1]);
    expect(
      isLessonCompletionEvidenceBacked(
        startedProgress(),
        FIRST_COURSE,
        String(step.lesson_id),
      ),
    ).toBe(false);
  });

  it("sends an empty account to the start of the recommended path", async () => {
    const payload = await client.callToolJson("get_next_step", {});
    const step = payload.next_step as Record<string, unknown>;

    expect(step.kind).toBe("lesson");
    expect(step.course).toBe(FIRST_COURSE);
    expect(step.completed_lessons).toBe(0);
  });
});

describe("shadow paths", () => {
  it("rejects a null argument object", async () => {
    const response = await client.request("tools/call", {
      name: "get_my_progress",
      arguments: null,
    });
    const result = response.result as unknown as
      | { isError?: boolean }
      | undefined;
    expect(Boolean(response.error) || result?.isError === true).toBe(true);
  });

  it("accepts an empty argument object and applies the default locale", async () => {
    const payload = await client.callToolJson("get_next_step", {});
    expect(payload.locale).toBe("de");
  });

  it("refuses an argument the schema does not know", async () => {
    const response = await client.request("tools/call", {
      name: "get_my_progress",
      arguments: { user_id: "someone-else" },
    });
    const result = response.result as unknown as
      | { isError?: boolean }
      | undefined;
    expect(Boolean(response.error) || result?.isError === true).toBe(true);
    // The refusal must not have reached the store with a foreign identity.
    expect(readProgress).not.toHaveBeenCalled();
  });

  it("names a store that cannot answer without leaking why", async () => {
    readProgress.mockImplementation(async () => {
      throw new Error("Postgres said: relation /secret/path does not exist");
    });
    const payload = await client.callToolJson("get_my_progress", {});

    expect(errorOf(payload)).toBe("store_unavailable");
    expect(JSON.stringify(payload)).not.toContain("/secret/path");
    expect(JSON.stringify(payload)).not.toContain("Postgres");
  });

  it("names an exhausted budget and never reaches the store", async () => {
    mockConsumeMulti.mockImplementation(async () => false);
    const payload = await client.callToolJson("get_my_progress", {});

    expect(errorOf(payload)).toBe("rate_limit_exceeded");
    expect(readProgress).not.toHaveBeenCalled();
  });

  it("refuses the call when the limiter itself is unavailable", async () => {
    mockConsumeMulti.mockImplementation(async () => {
      throw new Error("durable backend unavailable");
    });
    const payload = await client.callToolJson("get_next_step", {});

    expect(errorOf(payload)).toBe("rate_limit_unavailable");
    expect(readProgress).not.toHaveBeenCalled();
  });

  it("turns an unexpected failure into a generic tool error", async () => {
    const tool = AUTHENTICATED_MCP_TOOLS[0]!;
    const spy = vi.spyOn(tool, "run").mockImplementation(() => {
      throw new Error("registry exploded at /var/task/secret/file.ts");
    });
    const failing = await connect();
    try {
      const payload = await failing.callToolJson(tool.name, {});
      expect(errorOf(payload)).toBe("tool_failed");
      expect(JSON.stringify(payload)).not.toContain("/var/task/secret");
    } finally {
      await failing.close();
      spy.mockRestore();
    }
  });
});

describe("rate limiting", () => {
  it("reserves the account budget and the client budget together", async () => {
    await client.callToolJson("get_my_progress", {});

    expect(mockUserKey).toHaveBeenCalledWith(
      "mcp-authenticated",
      expect.any(Request),
      USER_ID,
    );
    expect(mockClientKey).toHaveBeenCalledWith(
      "mcp-authenticated-ip",
      expect.any(Request),
    );
    const args = mockConsumeMulti.mock.calls[0]?.[0] as {
      entries: { key: string; max: number }[];
      windowSeconds: number;
    };
    expect(args.windowSeconds).toBe(60 * 60);
    expect(args.entries.map((entry) => entry.max)).toEqual([
      AGENT_TOOL_USER_RATE_LIMIT_MAX,
      AGENT_TOOL_CLIENT_RATE_LIMIT_MAX,
    ]);
    // Neither key may carry a raw address or a raw account id.
    for (const entry of args.entries) {
      expect(entry.key).not.toContain(USER_ID);
    }
  });

  it("charges one reservation per tool call", async () => {
    await client.callToolJson("get_my_progress", {});
    await client.callToolJson("get_next_step", {});
    expect(mockConsumeMulti).toHaveBeenCalledTimes(2);
  });
});

describe("the audit hook", () => {
  it("reports the client, the tool, the outcome and a duration", async () => {
    await client.callToolJson("get_my_progress", {});

    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      userId: USER_ID,
      client: "pat:Laptop",
      tool: "get_my_progress",
      ok: true,
    });
    expect(recorded[0]!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("records a refused call as a failed one", async () => {
    mockConsumeMulti.mockImplementation(async () => false);
    await client.callToolJson("get_next_step", {});

    expect(recorded).toEqual([
      expect.objectContaining({ tool: "get_next_step", ok: false }),
    ]);
  });

  it("carries no arguments and no results into the audit record", async () => {
    await client.callToolJson("get_my_progress", { locale: "en" });
    expect(Object.keys(recorded[0]!).sort()).toEqual([
      "client",
      "durationMs",
      "ok",
      "tool",
      "userId",
    ]);
  });

  it("survives an audit hook that throws", async () => {
    const throwing = await connect({
      recordEvent: () => {
        throw new Error("audit sink is down");
      },
    });
    try {
      const payload = await throwing.callToolJson("get_my_progress", {});
      expect(payload.has_stored_progress).toBe(false);
    } finally {
      await throwing.close();
    }
  });

  it("is optional", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerAuthenticatedMcpTools(server, {
      principal: PRINCIPAL,
      request: new Request("https://loehrning.ai/api/mcp", { method: "POST" }),
      readProgress: async () => EMPTY_SNAPSHOT,
    });
    const bare = await connectInMemoryClient(server);
    try {
      const payload = await bare.callToolJson("get_next_step", {});
      expect(payload.has_stored_progress).toBe(false);
    } finally {
      await bare.close();
    }
  });
});

describe("structured logging", () => {
  it("logs the real tool name once the authenticated tools are registered", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fresh = await connect();
    try {
      await fresh.callToolJson("get_my_progress", {});
    } finally {
      await fresh.close();
    }
    const lines = warn.mock.calls
      .map(([line]) => String(line))
      .filter((line) => line.includes("mcp-tool"));
    expect(lines.some((line) => line.includes("get_my_progress"))).toBe(true);
    expect(lines.some((line) => line.includes(USER_ID))).toBe(false);
  });
});
