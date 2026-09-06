/**
 * Server construction: the registry and the resource templates wired onto an
 * `McpServer` instance.
 *
 * The handler creates one server per request, so this function must stay pure
 * and cheap. It holds no per-caller state and never reads a request.
 */

import {
  McpServer,
  ResourceTemplate,
  type CallToolResult,
} from "@modelcontextprotocol/server";
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from "./config";
import { isMcpToolError, type McpErrorCode } from "./errors";
import {
  logMcpToolEvent,
  registerLoggableToolNames,
  type McpToolOutcome,
} from "./observability";
import { capJsonPayload } from "./output";
import { MCP_RESOURCE_TEMPLATES, readResource } from "./resources";
import {
  MCP_TOOLS,
  MCP_TOOL_NAMES,
  type McpToolDefinition,
} from "./tools/registry";

registerLoggableToolNames(MCP_TOOL_NAMES);

export const MCP_SERVER_INSTRUCTIONS = [
  "Read-only access to the public loehrning.ai catalogue: courses, lessons,",
  "self-study workshops, open book chapters, open-source tools and the",
  "learning graph. Nothing here writes progress or touches an account.",
  "Start with list_courses or search_content. Lessons, workshops and chapters",
  "are also addressable as resources under lesson://, workshop:// and book://.",
  "Every text tool takes an optional locale of de or en; de is canonical.",
].join(" ");

const OUTCOME_BY_ERROR_CODE: Readonly<Record<McpErrorCode, McpToolOutcome>> = {
  unknown_course: "not_found",
  unknown_lesson: "not_found",
  unknown_workshop: "not_found",
  unknown_book: "not_found",
  unknown_chapter: "not_found",
  unknown_tool_slug: "not_found",
  unsupported_locale: "invalid_input",
  content_unavailable: "unavailable",
  invalid_resource_uri: "invalid_input",
};

function errorResult(code: string, message: string): CallToolResult {
  return {
    content: [
      { type: "text", text: JSON.stringify({ error: code, message }, null, 2) },
    ],
    isError: true,
  };
}

async function callTool(
  tool: McpToolDefinition,
  args: unknown,
): Promise<CallToolResult> {
  const started = Date.now();
  try {
    const payload = await tool.run(args);
    const capped = capJsonPayload(payload, tool.overflow(args));
    logMcpToolEvent({
      tool: tool.name,
      outcome: "ok",
      durationMs: Date.now() - started,
      truncated: capped.truncated,
    });
    return { content: [{ type: "text", text: capped.text }] };
  } catch (error) {
    if (isMcpToolError(error)) {
      logMcpToolEvent({
        tool: tool.name,
        outcome: OUTCOME_BY_ERROR_CODE[error.code],
        durationMs: Date.now() - started,
      });
      return errorResult(error.code, error.message);
    }
    // An unexpected failure must not put an upstream message, a file path, or
    // a stack frame in front of an agent.
    logMcpToolEvent({
      tool: tool.name,
      outcome: "failed",
      durationMs: Date.now() - started,
    });
    return errorResult(
      "tool_failed",
      "This tool could not answer right now. Try again, or open the page on loehrning.ai.",
    );
  }
}

export function registerMcpTools(server: McpServer): void {
  for (const tool of MCP_TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          title: tool.title,
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (args: unknown) => callTool(tool, args),
    );
  }
}

export function registerMcpResources(server: McpServer): void {
  for (const template of MCP_RESOURCE_TEMPLATES) {
    server.registerResource(
      template.name,
      new ResourceTemplate(template.uriTemplate, {
        list: async () => ({ resources: [...(await template.list())] }),
      }),
      {
        title: template.title,
        description: template.description,
        mimeType: "text/markdown",
      },
      async (uri) => {
        const content = await readResource(uri.href, template.kind);
        return { contents: [content] };
      },
    );
  }
}

export function createLoehrningMcpServer(): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    { instructions: MCP_SERVER_INSTRUCTIONS },
  );
  registerMcpTools(server);
  registerMcpResources(server);
  return server;
}
