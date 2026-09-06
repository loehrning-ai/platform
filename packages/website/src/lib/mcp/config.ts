/**
 * Fixed limits and identity for the public MCP server.
 *
 * Everything here is a constant on purpose. The agent surface is a public,
 * unauthenticated JSON-RPC endpoint, so its ceilings must be readable in one
 * place and must not depend on request content.
 */

export const MCP_SERVER_NAME = "loehrning-ai";
export const MCP_SERVER_VERSION = "1.0.0";
export const MCP_ENDPOINT_PATH = "/api/mcp";

/**
 * The human setup guide for this surface. It is what `resource_documentation`
 * in the RFC 9728 metadata points at, because the walkthroughs there cover
 * more than the endpoint's own GET explainer can. The help page owns the same
 * literal in its copy module; protected-resource.test.ts binds the two so a
 * rename cannot leave one of them pointing at a dead path.
 */
export const MCP_HELP_PATH = "/hilfe/eigene-ki";

/**
 * Hard ceiling on a single tool result. Course lessons and book chapters are
 * long; a tool that would exceed this returns a truncated payload plus the
 * canonical URL instead of a multi-megabyte JSON-RPC frame.
 */
export const MCP_MAX_OUTPUT_BYTES = 64 * 1024;

/**
 * Hard ceiling on a JSON-RPC request body. A batch of tool calls is small;
 * anything larger is rejected before the SDK sees it.
 */
export const MCP_MAX_REQUEST_BYTES = 256 * 1024;

/** Per-client budget: one hour, 240 JSON-RPC requests. */
export const MCP_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
export const MCP_RATE_LIMIT_MAX = 240;
export const MCP_RATE_LIMIT_NAMESPACE = "mcp";

/** Maximum results a single search_content call may return. */
export const MCP_SEARCH_RESULT_LIMIT = 25;
export const MCP_SEARCH_DEFAULT_LIMIT = 10;
export const MCP_SEARCH_MAX_QUERY_LENGTH = 200;
