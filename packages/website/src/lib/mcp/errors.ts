/**
 * Named failures for MCP tools and resources.
 *
 * Every rejection carries a stable machine code so an agent can branch on it,
 * and a short human sentence it can show. Nothing here ever embeds a caller's
 * argument, so an error message can never echo untrusted text back into a log
 * line or a transcript.
 */

export const MCP_ERROR_CODES = [
  "unknown_course",
  "unknown_lesson",
  "unknown_workshop",
  "unknown_book",
  "unknown_chapter",
  "unknown_tool_slug",
  "unsupported_locale",
  "content_unavailable",
  "invalid_resource_uri",
] as const;

export type McpErrorCode = (typeof MCP_ERROR_CODES)[number];

export class McpToolError extends Error {
  readonly code: McpErrorCode;

  constructor(code: McpErrorCode, message: string) {
    super(message);
    this.name = "McpToolError";
    this.code = code;
  }
}

export function isMcpToolError(error: unknown): error is McpToolError {
  return error instanceof McpToolError;
}

/**
 * The one place a caller-supplied identifier is refused. The message names the
 * kind of thing that was not found and how to list the valid values, never the
 * value the caller sent.
 */
export function notFound(
  code: McpErrorCode,
  what: string,
  listTool: string,
): never {
  throw new McpToolError(
    code,
    `No such ${what}. Call ${listTool} for the valid identifiers.`,
  );
}
