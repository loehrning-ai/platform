/**
 * The tool registry: the single list of everything the public MCP server can
 * do. Importing this module validates it, so a malformed tool is a build
 * failure rather than a runtime surprise on an agent's first call.
 *
 * Every tool here is read-only. Nothing on this surface writes progress,
 * records a checkpoint, or touches an account.
 */

import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import { z } from "zod";
import { absoluteUrl } from "@/lib/seo/entity";
import { DEFAULT_LOCALE } from "@/lib/i18n/locale";
import {
  MCP_SEARCH_DEFAULT_LIMIT,
  MCP_SEARCH_MAX_QUERY_LENGTH,
  MCP_SEARCH_RESULT_LIMIT,
} from "../config";
import { getBookChapter } from "./books";
import { getCourse, getLesson, listCourses } from "./courses";
import {
  getKnowledgeGraph,
  KNOWLEDGE_GRAPH_DOCUMENT_URL,
} from "./knowledge-graph";
import { getOpenSourceTool, listOpenSourceTools } from "./open-source";
import { searchContent } from "./search";
import { getWorkshop, listWorkshops } from "./workshops";

export interface McpToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: StandardSchemaWithJSON;
  readonly run: (args: unknown) => unknown | Promise<unknown>;
  /**
   * Small stand-in returned when the real payload exceeds the output ceiling.
   * It always names a URL, so an agent that hits the cap still has a way in.
   */
  readonly overflow: (args: unknown) => Record<string, unknown>;
}

const localeField = z
  .enum(["de", "en"])
  .default(DEFAULT_LOCALE)
  .describe("Content language. de is the canonical language of the platform.");

const slugField = (what: string) =>
  z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9_-]*$/, `A ${what} slug is lowercase and hyphenated.`);

function defineTool<Shape extends z.ZodRawShape>(definition: {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly shape: Shape;
  readonly run: (
    args: z.infer<z.ZodObject<Shape>>,
  ) => unknown | Promise<unknown>;
  readonly overflow: (
    args: z.infer<z.ZodObject<Shape>>,
  ) => Record<string, unknown>;
}): McpToolDefinition {
  const schema = z.object(definition.shape).strict();
  return {
    name: definition.name,
    title: definition.title,
    description: definition.description,
    inputSchema: schema as unknown as StandardSchemaWithJSON,
    run: (args) => definition.run(args as z.infer<z.ZodObject<Shape>>),
    overflow: (args) =>
      definition.overflow(args as z.infer<z.ZodObject<Shape>>),
  };
}

export const MCP_TOOLS: readonly McpToolDefinition[] = [
  defineTool({
    name: "list_courses",
    title: "List courses",
    description:
      "List every course on loehrning.ai with its level, duration, lesson count and URL, and say whether its lesson bodies are readable through get_lesson.",
    shape: { locale: localeField },
    run: (args) => listCourses(args.locale),
    overflow: () => ({ courses_url: absoluteUrl("/kurse") }),
  }),
  defineTool({
    name: "get_course",
    title: "Get a course",
    description:
      "Return one course with its blocks and the id, title and resource URI of every lesson in it. Use list_courses for the valid slugs.",
    shape: { slug: slugField("course"), locale: localeField },
    run: (args) => getCourse(args.slug, args.locale),
    overflow: (args) => ({
      slug: args.slug,
      courses_url: absoluteUrl("/kurse"),
    }),
  }),
  defineTool({
    name: "get_lesson",
    title: "Get a lesson",
    description:
      "Return one lesson in the requested language: its sections, key concepts and reading time. Lesson ids are stable and come from get_course.",
    shape: {
      course: slugField("course"),
      lesson_id: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9][a-z0-9_-]*$/, "A lesson id is lowercase."),
      locale: localeField,
    },
    run: (args) => getLesson(args.course, args.lesson_id, args.locale),
    overflow: (args) => ({
      course: args.course,
      lesson_id: args.lesson_id,
      courses_url: absoluteUrl("/kurse"),
    }),
  }),
  defineTool({
    name: "list_workshops",
    title: "List workshops",
    description:
      "List the self-study workshops with format, duration and how many downloadable materials each one carries.",
    shape: { locale: localeField },
    run: (args) => listWorkshops(args.locale),
    overflow: () => ({ workshops_url: absoluteUrl("/workshops") }),
  }),
  defineTool({
    name: "get_workshop",
    title: "Get a workshop",
    description:
      "Return one workshop with its steps, its practice case, its limitations and a manifest of every downloadable material with a resolvable URL.",
    shape: { slug: slugField("workshop"), locale: localeField },
    run: (args) => getWorkshop(args.slug, args.locale),
    overflow: (args) => ({
      slug: args.slug,
      workshop_url: absoluteUrl(`/workshops/${args.slug}`),
    }),
  }),
  defineTool({
    name: "get_book_chapter",
    title: "Get a book chapter",
    description:
      "Return one chapter of an open book as Markdown, with its headings and reading time. The books and their chapter slugs are discoverable through search_content.",
    shape: {
      book: slugField("book"),
      chapter: slugField("chapter"),
      locale: localeField,
    },
    run: (args) => getBookChapter(args.book, args.chapter, args.locale),
    overflow: (args) => ({
      book: args.book,
      chapter: args.chapter,
      reader_url: absoluteUrl(`/buecher/${args.book}`),
    }),
  }),
  defineTool({
    name: "list_open_source_tools",
    title: "List open-source tools",
    description:
      "List the published open-source tools and projects with their pinned source revision, delivery mode and launch URL.",
    shape: { locale: localeField },
    run: (args) => listOpenSourceTools(args.locale),
    overflow: () => ({ open_source_url: absoluteUrl("/open-source") }),
  }),
  defineTool({
    name: "get_open_source_tool",
    title: "Get an open-source tool",
    description:
      "Return the full guide for one open-source tool: prerequisites, the clone and checkout commands for its pinned revision, installation, usage, integration and the license record.",
    shape: { slug: slugField("tool"), locale: localeField },
    run: (args) => getOpenSourceTool(args.slug, args.locale),
    overflow: (args) => ({
      slug: args.slug,
      open_source_url: absoluteUrl("/open-source"),
    }),
  }),
  defineTool({
    name: "search_content",
    title: "Search the catalogue",
    description:
      "Search courses, lessons, workshops, books, open-source tools and public pages. Every word of the query has to match. Results carry a URL and, where one exists, a resource URI.",
    shape: {
      query: z.string().trim().min(1).max(MCP_SEARCH_MAX_QUERY_LENGTH),
      locale: localeField,
      limit: z
        .number()
        .int()
        .min(1)
        .max(MCP_SEARCH_RESULT_LIMIT)
        .default(MCP_SEARCH_DEFAULT_LIMIT),
    },
    run: (args) => searchContent(args.query, args.locale, args.limit),
    overflow: () => ({ search_url: absoluteUrl("/kurse") }),
  }),
  defineTool({
    name: "get_knowledge_graph",
    title: "Get the learning graph",
    description:
      "Return the learning graph: every public node with its access class and crawl class, plus the edges between them. The complete JSON document is served separately.",
    shape: { locale: localeField },
    run: (args) => getKnowledgeGraph(args.locale),
    overflow: () => ({ full_document_url: KNOWLEDGE_GRAPH_DOCUMENT_URL }),
  }),
];

const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;
const PROBE_KEY = "__loehrning_registry_probe__";

/**
 * Structural validation of the registry. Runs at import time so a broken tool
 * definition fails the build, the unit suite, and the route module together.
 */
export function assertToolRegistry(tools: readonly McpToolDefinition[]): void {
  if (tools.length === 0) {
    throw new Error("The MCP tool registry is empty.");
  }
  const seen = new Set<string>();
  for (const tool of tools) {
    if (!TOOL_NAME_PATTERN.test(tool.name)) {
      throw new Error(`Invalid MCP tool name "${tool.name}".`);
    }
    if (seen.has(tool.name)) {
      throw new Error(`Duplicate MCP tool name "${tool.name}".`);
    }
    seen.add(tool.name);
    if (tool.title.trim().length === 0) {
      throw new Error(`MCP tool "${tool.name}" has no title.`);
    }
    if (tool.description.trim().length < 40) {
      throw new Error(
        `MCP tool "${tool.name}" needs a description an agent can choose from.`,
      );
    }
    // Behavioural strictness check: a schema that silently accepts an unknown
    // key would let a caller smuggle a field past validation.
    const probe = (
      tool.inputSchema as unknown as {
        safeParse?: (value: unknown) => {
          success: boolean;
          error?: { issues?: readonly { code?: string }[] };
        };
      }
    ).safeParse;
    if (typeof probe !== "function") {
      throw new Error(`MCP tool "${tool.name}" has no validating schema.`);
    }
    const outcome = probe.call(tool.inputSchema, { [PROBE_KEY]: 1 });
    const rejectsUnknownKeys =
      !outcome.success &&
      (outcome.error?.issues ?? []).some(
        (issue) => issue.code === "unrecognized_keys",
      );
    if (!rejectsUnknownKeys) {
      throw new Error(
        `MCP tool "${tool.name}" must declare a strict input schema.`,
      );
    }
  }
}

assertToolRegistry(MCP_TOOLS);

export const MCP_TOOL_NAMES: readonly string[] = MCP_TOOLS.map(
  (tool) => tool.name,
);
