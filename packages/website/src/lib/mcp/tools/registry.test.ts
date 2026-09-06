/**
 * Tool coverage over the real protocol.
 *
 * Importing this module imports the registry, and the registry validates
 * itself at import time, so a malformed tool definition fails this suite (and
 * the build, since the route imports the same module) rather than surfacing on
 * an agent's first call.
 *
 * Every tool is exercised through the SDK's in-memory transport, plus the four
 * shadow paths: a null argument, an empty argument, an unknown slug, and an
 * upstream failure.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectInMemoryClient, type InMemoryMcpClient } from "@/test/mcp-client";
import { createLoehrningMcpServer } from "../server";
import {
  assertToolRegistry,
  MCP_TOOLS,
  MCP_TOOL_NAMES,
  type McpToolDefinition,
} from "./registry";

let client: InMemoryMcpClient;

beforeEach(async () => {
  client = await connectInMemoryClient(createLoehrningMcpServer());
});

afterEach(async () => {
  await client.close();
  vi.restoreAllMocks();
});

function errorOf(payload: Record<string, unknown>): string {
  return String(payload.error ?? "");
}

describe("MCP tool registry", () => {
  it("validates itself at import time", () => {
    expect(MCP_TOOLS.length).toBe(10);
    expect(() => assertToolRegistry(MCP_TOOLS)).not.toThrow();
  });

  it("names every planned public tool exactly once", () => {
    expect([...MCP_TOOL_NAMES].sort()).toEqual([
      "get_book_chapter",
      "get_course",
      "get_knowledge_graph",
      "get_lesson",
      "get_open_source_tool",
      "get_workshop",
      "list_courses",
      "list_open_source_tools",
      "list_workshops",
      "search_content",
    ]);
    expect(new Set(MCP_TOOL_NAMES).size).toBe(MCP_TOOL_NAMES.length);
  });

  it("rejects a registry entry whose schema accepts unknown keys", () => {
    const permissive: McpToolDefinition = {
      ...MCP_TOOLS[0]!,
      name: "permissive_tool",
      inputSchema: {
        "~standard": {},
        safeParse: () => ({ success: true }),
      } as unknown as McpToolDefinition["inputSchema"],
    };
    expect(() => assertToolRegistry([permissive])).toThrow(
      /strict input schema/,
    );
  });

  it("rejects a registry entry with a duplicate name", () => {
    expect(() => assertToolRegistry([MCP_TOOLS[0]!, MCP_TOOLS[0]!])).toThrow(
      /Duplicate/,
    );
  });

  it("advertises every tool as read only over tools/list", async () => {
    const response = await client.request("tools/list", {});
    const tools = (response.result?.tools ?? []) as readonly {
      name: string;
      description?: string;
      annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
      inputSchema?: { additionalProperties?: boolean };
    }[];

    expect(tools.map((tool) => tool.name).sort()).toEqual(
      [...MCP_TOOL_NAMES].sort(),
    );
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.destructiveHint).toBe(false);
      expect(tool.inputSchema?.additionalProperties).toBe(false);
      expect((tool.description ?? "").length).toBeGreaterThan(39);
    }
  });
});

describe("read-only boundary", () => {
  const MCP_ROOT = resolve(process.cwd(), "src/lib/mcp");

  function sourceFiles(directory: string): readonly string[] {
    return readdirSync(directory).flatMap((entry) => {
      const full = join(directory, entry);
      if (statSync(full).isDirectory()) return sourceFiles(full);
      return entry.endsWith(".ts") && !entry.endsWith(".test.ts") ? [full] : [];
    });
  }

  it("never imports a write path", () => {
    const forbidden = [
      "@/lib/progress/server-store",
      "@/lib/supabase/server",
      "@/lib/supabase/admin",
      "@/lib/supabase/auth-server",
      "tryCreateServiceClient",
      "getAuthenticatedUser",
    ];
    const offenders: string[] = [];
    for (const file of sourceFiles(MCP_ROOT)) {
      const source = readFileSync(file, "utf8");
      for (const marker of forbidden) {
        if (source.includes(marker)) {
          offenders.push(`${file.slice(MCP_ROOT.length + 1)}: ${marker}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("covers every module in the directory", () => {
    expect(sourceFiles(MCP_ROOT).length).toBeGreaterThan(10);
  });
});

describe("public tools over the in-memory transport", () => {
  it("list_courses returns the whole catalogue with lesson availability", async () => {
    const payload = await client.callToolJson("list_courses", {});
    const courses = payload.courses as readonly Record<string, unknown>[];
    expect(courses.length).toBeGreaterThan(5);
    expect(payload.count).toBe(courses.length);
    expect(courses.some((course) => course.lesson_bodies_available === true)).toBe(
      true,
    );
    for (const course of courses) {
      expect(String(course.url)).toMatch(/^https:\/\/loehrning\.ai\//);
      expect(String(course.title).length).toBeGreaterThan(0);
    }
  });

  it("list_courses honours the locale", async () => {
    const german = await client.callToolJson("list_courses", { locale: "de" });
    const english = await client.callToolJson("list_courses", { locale: "en" });
    expect(english.locale).toBe("en");
    const germanFirst = (german.courses as Record<string, unknown>[])[0]!;
    const englishFirst = (english.courses as Record<string, unknown>[])[0]!;
    expect(englishFirst.slug).toBe(germanFirst.slug);
    expect(String(englishFirst.url)).toContain("/en/");
  });

  it("get_course returns blocks with addressable lessons", async () => {
    const payload = await client.callToolJson("get_course", {
      slug: "ki-fuehrerschein",
    });
    const blocks = payload.blocks as readonly Record<string, unknown>[];
    expect(blocks.length).toBeGreaterThan(0);
    const lessons = blocks.flatMap(
      (block) => block.lessons as readonly Record<string, unknown>[],
    );
    expect(lessons.length).toBeGreaterThan(0);
    expect(String(lessons[0]!.resource_uri)).toMatch(
      /^lesson:\/\/ki-fuehrerschein\//,
    );
  });

  it("get_course explains a reader-only course instead of inventing lessons", async () => {
    const payload = await client.callToolJson("get_course", { slug: "claude" });
    expect(payload.blocks).toEqual([]);
    expect(String(payload.lesson_index_note)).toContain("own reader");
  });

  it("get_lesson returns the body with immutable ids in both locales", async () => {
    const course = await client.callToolJson("get_course", {
      slug: "ki-fuehrerschein",
    });
    const firstBlock = (course.blocks as Record<string, unknown>[])[0]!;
    const firstLesson = (firstBlock.lessons as Record<string, unknown>[])[0]!;
    const lessonId = String(firstLesson.id);

    const german = await client.callToolJson("get_lesson", {
      course: "ki-fuehrerschein",
      lesson_id: lessonId,
    });
    const english = await client.callToolJson("get_lesson", {
      course: "ki-fuehrerschein",
      lesson_id: lessonId,
      locale: "en",
    });

    expect(german.id).toBe(lessonId);
    expect(english.id).toBe(lessonId);
    expect(german.locale).toBe("de");
    expect(english.locale).toBe("en");
    expect(german.title).not.toBe(english.title);
    expect((german.sections as unknown[]).length).toBeGreaterThan(0);
    expect(String(german.resource_uri)).toBe(
      `lesson://ki-fuehrerschein/${lessonId}`,
    );
  });

  it("list_workshops counts the materials each workshop actually ships", async () => {
    const payload = await client.callToolJson("list_workshops", {});
    const workshops = payload.workshops as readonly Record<string, unknown>[];
    expect(workshops.length).toBeGreaterThan(0);
    for (const workshop of workshops) {
      expect(Number(workshop.material_count)).toBeGreaterThan(0);
      expect(String(workshop.resource_uri)).toMatch(/^workshop:\/\//);
    }
  });

  it("get_workshop returns a manifest of resolvable material URLs", async () => {
    const list = await client.callToolJson("list_workshops", {});
    const slug = String(
      (list.workshops as Record<string, unknown>[])[0]!.slug,
    );
    const payload = await client.callToolJson("get_workshop", { slug });
    const materials = payload.materials as readonly Record<string, unknown>[];
    expect(materials.length).toBeGreaterThan(0);
    for (const material of materials) {
      expect(String(material.url)).toMatch(/^https:\/\/loehrning\.ai\//);
    }
    expect((payload.steps as unknown[]).length).toBeGreaterThan(0);
    expect(payload.case_study).toBeTruthy();
  });

  it("get_book_chapter returns the chapter Markdown", async () => {
    const payload = await client.callToolJson("get_book_chapter", {
      book: "ki-landschaft",
      chapter: "01_eisberg",
    });
    expect(payload.body_available).toBe(true);
    expect(String(payload.markdown).length).toBeGreaterThan(200);
    expect(String(payload.resource_uri)).toBe("book://ki-landschaft/01_eisberg");
  });

  it("list_open_source_tools pins every source revision", async () => {
    const payload = await client.callToolJson("list_open_source_tools", {});
    const tools = payload.tools as readonly Record<string, unknown>[];
    expect(tools.length).toBeGreaterThan(0);
    for (const tool of tools) {
      expect(String(tool.source_revision).length).toBeGreaterThan(6);
      expect(String(tool.source_url)).toMatch(/^https:\/\//);
    }
  });

  it("get_open_source_tool returns clone, install and license detail", async () => {
    const list = await client.callToolJson("list_open_source_tools", {});
    const slug = String((list.tools as Record<string, unknown>[])[0]!.slug);
    const payload = await client.callToolJson("get_open_source_tool", { slug });
    const source = payload.source as Record<string, unknown>;
    expect(String(source.clone_command)).toContain("git clone");
    expect(String(source.checkout_command)).toContain("git checkout");
    expect(
      ((payload.installation as Record<string, unknown>).steps as unknown[])
        .length,
    ).toBeGreaterThan(0);
    expect(String((payload.license as Record<string, unknown>).sha256)).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it("search_content finds a lesson and returns its resource URI", async () => {
    const payload = await client.callToolJson("search_content", {
      query: "Datenschutz",
      limit: 5,
    });
    const results = payload.results as readonly Record<string, unknown>[];
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
    for (const result of results) {
      expect(String(result.url)).toMatch(/^https:\/\/loehrning\.ai/);
    }
  });

  it("get_knowledge_graph mirrors the canonical registry", async () => {
    const payload = await client.callToolJson("get_knowledge_graph", {});
    expect(Number(payload.node_count)).toBeGreaterThan(0);
    expect((payload.nodes as unknown[]).length).toBe(payload.node_count);
    expect((payload.edges as unknown[]).length).toBe(payload.edge_count);
    expect(String(payload.full_document_url)).toBe(
      "https://loehrning.ai/api/knowledge-graph.json",
    );
  });
});

describe("shadow paths", () => {
  it("rejects a null argument object", async () => {
    const response = await client.request("tools/call", {
      name: "get_course",
      arguments: null,
    });
    const result = response.result as unknown as {
      isError?: boolean;
      content?: { text?: string }[];
    } | undefined;
    // Either a protocol-level rejection or an in-band tool error is correct;
    // silently succeeding on a null argument object is not.
    const failed =
      Boolean(response.error) || result?.isError === true;
    expect(failed).toBe(true);
  });

  it("rejects an empty argument object where a slug is required", async () => {
    const result = await client.callTool("get_course", {});
    expect(result.isError).toBe(true);
    expect(String(result.content?.[0]?.text)).toContain("validation");
  });

  it("names an unknown slug without echoing it back", async () => {
    const payload = await client.callToolJson("get_course", {
      slug: "kurs-den-es-nicht-gibt",
    });
    expect(errorOf(payload)).toBe("unknown_course");
    expect(String(payload.message)).toContain("list_courses");
    expect(String(payload.message)).not.toContain("kurs-den-es-nicht-gibt");
  });

  it("names an unknown lesson, workshop, book and tool", async () => {
    const lesson = await client.callToolJson("get_lesson", {
      course: "ki-fuehrerschein",
      lesson_id: "block_9_lesson_9",
    });
    expect(errorOf(lesson)).toBe("unknown_lesson");

    const workshop = await client.callToolJson("get_workshop", {
      slug: "kein-workshop",
    });
    expect(errorOf(workshop)).toBe("unknown_workshop");

    const book = await client.callToolJson("get_book_chapter", {
      book: "kein-buch",
      chapter: "kein-kapitel",
    });
    expect(errorOf(book)).toBe("unknown_book");

    const tool = await client.callToolJson("get_open_source_tool", {
      slug: "kein-werkzeug",
    });
    expect(errorOf(tool)).toBe("unknown_tool_slug");
  });

  it("turns an upstream failure into a generic tool error", async () => {
    const broken = MCP_TOOLS.find((tool) => tool.name === "list_courses")!;
    const spy = vi.spyOn(broken, "run").mockImplementation(() => {
      throw new Error("upstream registry exploded with /secret/path");
    });

    const failing = await connectInMemoryClient(createLoehrningMcpServer());
    try {
      const payload = await failing.callToolJson("list_courses", {});
      expect(errorOf(payload)).toBe("tool_failed");
      expect(JSON.stringify(payload)).not.toContain("/secret/path");
    } finally {
      await failing.close();
      spy.mockRestore();
    }
  });

  it("reports an unknown tool name as an error result", async () => {
    const response = await client.request("tools/call", {
      name: "delete_everything",
      arguments: {},
    });
    const failed =
      Boolean(response.error) ||
      (response.result as unknown as { isError?: boolean } | undefined)
        ?.isError === true;
    expect(failed).toBe(true);
  });
});
