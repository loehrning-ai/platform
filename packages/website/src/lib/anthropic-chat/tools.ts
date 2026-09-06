/**
 * The read-only tool surface the account chat hands to the provider.
 *
 * There is no second catalogue. The definitions are derived from the same
 * registry the public MCP server exposes, through the Standard Schema each
 * tool already carries, so a tool cannot exist for the chat that an agent
 * cannot also reach over `/api/mcp`, and neither surface can drift.
 *
 * Every call is validated against the tool's own strict schema, capped at the
 * shared output ceiling, and written to the agent audit trail as `konto-chat`.
 */

import "server-only";

import {
  KONTO_CHAT_CLIENT,
  recordAgentAccessEvent,
} from "@/lib/agent-access/record";
import { isMcpToolError } from "@/lib/mcp/errors";
import {
  logMcpToolEvent,
  registerLoggableToolNames,
  type McpToolOutcome,
} from "@/lib/mcp/observability";
import { capJsonPayload } from "@/lib/mcp/output";
import {
  MCP_TOOLS,
  MCP_TOOL_NAMES,
  type McpToolDefinition,
} from "@/lib/mcp/tools/registry";

// The MCP route registers the same list when its server module loads. The
// chat reaches the registry without that module, so it registers the names
// itself; the value is identical, so the call is idempotent.
registerLoggableToolNames(MCP_TOOL_NAMES);

/** Anthropic Messages tool definition. Shaped exactly like the wire format. */
export interface AccountChatToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly input_schema: { readonly type: "object" } & Record<string, unknown>;
}

export interface AccountChatToolResult {
  readonly text: string;
  readonly isError: boolean;
  readonly truncated: boolean;
}

const TOOLS_BY_NAME: ReadonlyMap<string, McpToolDefinition> = new Map(
  MCP_TOOLS.map((tool) => [tool.name, tool]),
);

function jsonSchemaFor(tool: McpToolDefinition): {
  readonly type: "object";
} & Record<string, unknown> {
  const converted = tool.inputSchema["~standard"].jsonSchema.input({
    target: "draft-2020-12",
  });
  // `$schema` is a document-level annotation. It is meaningless inside a tool
  // definition and only widens the prompt, so it is dropped rather than sent.
  const { $schema: _ignored, ...rest } = converted as Record<string, unknown>;
  return { ...rest, type: "object" };
}

/**
 * The tool list sent with every provider turn.
 *
 * Built once at module load. The order is the registry's order and never
 * depends on a request, which keeps the tool block byte-identical between
 * turns so the provider's prompt cache can hold it.
 */
export const ACCOUNT_CHAT_TOOLS: readonly AccountChatToolDefinition[] =
  MCP_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: jsonSchemaFor(tool),
  }));

export const ACCOUNT_CHAT_TOOL_NAMES: readonly string[] = ACCOUNT_CHAT_TOOLS.map(
  (tool) => tool.name,
);

function errorPayload(code: string, message: string): string {
  return JSON.stringify({ error: code, message }, null, 2);
}

function outcomeForMcpError(code: string): McpToolOutcome {
  if (code.startsWith("unknown_")) return "not_found";
  if (code === "unsupported_locale" || code === "invalid_resource_uri") {
    return "invalid_input";
  }
  return "unavailable";
}

async function validateInput(
  tool: McpToolDefinition,
  raw: unknown,
): Promise<{ readonly ok: true; readonly value: unknown } | { readonly ok: false }> {
  const validate = tool.inputSchema["~standard"].validate;
  const result = await validate(raw);
  if (result.issues) return { ok: false };
  return { ok: true, value: result.value };
}

export interface AccountChatToolContext {
  /** Owner of the account. Server-derived, never a value from the model. */
  readonly userId: string;
}

/**
 * Run one tool call requested by the model.
 *
 * Never throws. Every path returns a result the loop can hand back as a
 * `tool_result` block, because a thrown error here would abandon a conversation
 * the student is already paying for. Every path also records exactly one audit
 * row, so the account page shows what the chat did on the student's behalf.
 */
export async function executeAccountChatTool(
  name: string,
  rawInput: unknown,
  context: AccountChatToolContext,
): Promise<AccountChatToolResult> {
  const started = Date.now();
  const tool = TOOLS_BY_NAME.get(name);

  const finish = (
    result: AccountChatToolResult,
    outcome: McpToolOutcome,
  ): AccountChatToolResult => {
    const durationMs = Date.now() - started;
    logMcpToolEvent({
      tool: name,
      outcome,
      durationMs,
      truncated: result.truncated,
    });
    recordAgentAccessEvent({
      userId: context.userId,
      client: KONTO_CHAT_CLIENT,
      // An unregistered name is never written through: the audit trail records
      // what the platform recognises, not a label the model invented.
      tool: tool ? tool.name : "unknown",
      ok: !result.isError,
      durationMs,
    });
    return result;
  };

  if (!tool) {
    return finish(
      {
        text: errorPayload(
          "unknown_tool",
          "This tool does not exist. Use one of the listed tools.",
        ),
        isError: true,
        truncated: false,
      },
      "not_found",
    );
  }

  let validated;
  try {
    validated = await validateInput(tool, rawInput);
  } catch {
    validated = { ok: false } as const;
  }
  if (!validated.ok) {
    return finish(
      {
        text: errorPayload(
          "tool_input_invalid",
          "The arguments did not match this tool's schema. Check the required fields and try again.",
        ),
        isError: true,
        truncated: false,
      },
      "invalid_input",
    );
  }

  try {
    const payload = await tool.run(validated.value);
    const capped = capJsonPayload(payload, tool.overflow(validated.value));
    return finish(
      { text: capped.text, isError: false, truncated: capped.truncated },
      "ok",
    );
  } catch (error) {
    if (isMcpToolError(error)) {
      return finish(
        {
          text: errorPayload(error.code, error.message),
          isError: true,
          truncated: false,
        },
        outcomeForMcpError(error.code),
      );
    }
    // An unexpected failure must not put a file path or a stack frame into a
    // transcript that is stored in the student's browser.
    return finish(
      {
        text: errorPayload(
          "tool_failed",
          "This tool could not answer right now. Try again, or open the page on loehrning.ai.",
        ),
        isError: true,
        truncated: false,
      },
      "failed",
    );
  }
}

/** Result handed back when the per-message tool budget is spent. */
export function toolBudgetExhaustedResult(): AccountChatToolResult {
  return {
    text: errorPayload(
      "tool_budget_exhausted",
      "The tool budget for this message is used up. Answer with what you already have.",
    ),
    isError: true,
    truncated: false,
  };
}
