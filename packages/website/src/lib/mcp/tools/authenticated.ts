/**
 * Authenticated MCP tools.
 *
 * Two tools, both read-only by decision: `get_my_progress` and
 * `get_next_step`. There is deliberately no write tool on this surface. An
 * agent may read what a learner has done and say what comes next; recording a
 * lesson, a checkpoint, or an assessment result stays in the reader, where the
 * learner's own answers produce the evidence a completion is built from.
 *
 * Identity is never a claim. The caller resolves a bearer (an OAuth access
 * token or a personal access token) into an `AgentPrincipal` and hands the
 * resolved user id in; nothing here reads a header, a cookie, or an argument
 * to decide whose progress it returns.
 *
 * The store is injected. `src/lib/mcp` holds no database client of its own, so
 * the progress read arrives as a `ProgressReader` the caller supplies (see
 * `@/lib/agent-access/progress-snapshot`). That keeps the whole agent tool
 * directory free of a write path while the read itself still goes through the
 * one canonical server-side progress store.
 *
 * Wiring, once a bearer resolves to a principal:
 *
 *   registerAuthenticatedMcpTools(server, {
 *     principal,
 *     request,
 *     readProgress: readAgentProgressSnapshot,
 *     recordEvent: recordAgentAccessEvent,
 *   });
 *
 * Nothing is registered without a principal, so an unauthenticated session
 * does not even see these two names in `tools/list`.
 *
 * The payloads themselves are pure functions in `./progress-view`.
 */

import type {
  CallToolResult,
  McpServer,
  StandardSchemaWithJSON,
} from "@modelcontextprotocol/server";
import { z } from "zod";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import {
  consumeMultiRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { absoluteUrl } from "@/lib/seo/entity";
import type { AgentPrincipal } from "../auth";
import {
  logMcpToolEvent,
  registerLoggableToolNames,
  type McpToolOutcome,
} from "../observability";
import { capJsonPayload } from "../output";
import {
  buildMyProgress,
  buildNextStep,
  type ProgressSnapshot,
} from "./progress-view";
import { assertToolRegistry, MCP_TOOL_NAMES } from "./registry";

export type { ProgressSnapshot };

// ─── Caller contract ─────────────────────────────────────────────

/** Injected read path. A rejection becomes a named `store_unavailable`. */
export type ProgressReader = (userId: string) => Promise<ProgressSnapshot>;

/** One completed tool call, shaped for the agent audit trail. */
export interface AuthenticatedToolEvent {
  readonly userId: string;
  readonly client: string;
  readonly tool: string;
  readonly ok: boolean;
  readonly durationMs: number;
}

export interface AuthenticatedToolContext {
  readonly principal: AgentPrincipal;
  /** The originating request, used only to derive the client rate-limit key. */
  readonly request: Request;
  readonly readProgress: ProgressReader;
  /** Fire-and-forget audit hook. Must never throw and never block. */
  readonly recordEvent?: (event: AuthenticatedToolEvent) => void;
}

// ─── Limits and errors ───────────────────────────────────────────

/**
 * Per-account and per-client budgets for authenticated tool calls, reserved
 * in one transaction so a rejected pair mutates neither counter. The account
 * budget survives a client changing address; the client ceiling survives cheap
 * account creation. The endpoint's own per-client request limiter sits in
 * front of this and bounds the unauthenticated surface separately.
 */
export const AGENT_TOOL_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
export const AGENT_TOOL_USER_RATE_LIMIT_MAX = 120;
export const AGENT_TOOL_CLIENT_RATE_LIMIT_MAX = 240;
export const AGENT_TOOL_RATE_LIMIT_NAMESPACE = "mcp-authenticated";
export const AGENT_TOOL_CLIENT_RATE_LIMIT_NAMESPACE = "mcp-authenticated-ip";

export const AUTHENTICATED_TOOL_ERROR_CODES = [
  "rate_limit_exceeded",
  "rate_limit_unavailable",
  "store_unavailable",
] as const;

export type AuthenticatedToolErrorCode =
  (typeof AUTHENTICATED_TOOL_ERROR_CODES)[number];

export class AuthenticatedToolError extends Error {
  readonly code: AuthenticatedToolErrorCode;

  constructor(code: AuthenticatedToolErrorCode, message: string) {
    super(message);
    this.name = "AuthenticatedToolError";
    this.code = code;
  }
}

const OUTCOME_BY_ERROR_CODE: Readonly<
  Record<AuthenticatedToolErrorCode, McpToolOutcome>
> = {
  rate_limit_exceeded: "unavailable",
  rate_limit_unavailable: "unavailable",
  store_unavailable: "unavailable",
};

// ─── Registry ────────────────────────────────────────────────────

export interface AuthenticatedToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: StandardSchemaWithJSON;
  readonly run: (
    args: unknown,
    context: AuthenticatedToolContext,
  ) => Promise<unknown>;
  readonly overflow: (args: unknown) => Record<string, unknown>;
}

const localeField = z
  .enum(["de", "en"])
  .default(DEFAULT_LOCALE)
  .describe("Content language. de is the canonical language of the platform.");

const localeShape = { locale: localeField };
const localeSchema = z.object(localeShape).strict();

function localeOf(args: unknown): Locale {
  return localeSchema.parse(args).locale;
}

export const AUTHENTICATED_MCP_TOOLS: readonly AuthenticatedToolDefinition[] = [
  {
    name: "get_my_progress",
    title: "Get my progress",
    description:
      "Return the signed-in learner's own progress: completed lessons and assessment state per course, plus experience points, streak and badges. Reads one account, writes nothing.",
    inputSchema: localeSchema as unknown as StandardSchemaWithJSON,
    run: async (args, context) => {
      const locale = localeOf(args);
      return buildMyProgress(await readSnapshot(context), locale);
    },
    overflow: () => ({ account_url: absoluteUrl("/konto") }),
  },
  {
    name: "get_next_step",
    title: "Get my next step",
    description:
      "Return the single next thing the signed-in learner should do: the first lesson that is not finished yet, or the assessment once every lesson of a course is done.",
    inputSchema: localeSchema as unknown as StandardSchemaWithJSON,
    run: async (args, context) => {
      const locale = localeOf(args);
      return buildNextStep(await readSnapshot(context), locale);
    },
    overflow: () => ({ account_url: absoluteUrl("/konto") }),
  },
];

export const AUTHENTICATED_MCP_TOOL_NAMES: readonly string[] =
  AUTHENTICATED_MCP_TOOLS.map((tool) => tool.name);

/**
 * Structural validation, reusing the public registry's own validator so both
 * surfaces answer to one rule set. The probe supplies a `run` the validator
 * never calls; only names, titles, descriptions and schema strictness are
 * inspected there.
 */
export function assertAuthenticatedToolRegistry(
  tools: readonly AuthenticatedToolDefinition[],
): void {
  assertToolRegistry(
    tools.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      run: () => {
        throw new Error("Structural probe: run is never called here.");
      },
      overflow: tool.overflow,
    })),
  );
  const publicNames = new Set(MCP_TOOL_NAMES);
  for (const tool of tools) {
    if (publicNames.has(tool.name)) {
      throw new Error(
        `MCP tool "${tool.name}" is already a public tool name.`,
      );
    }
  }
}

assertAuthenticatedToolRegistry(AUTHENTICATED_MCP_TOOLS);

// ─── Call path ───────────────────────────────────────────────────

async function readSnapshot(
  context: AuthenticatedToolContext,
): Promise<ProgressSnapshot> {
  try {
    return await context.readProgress(context.principal.userId);
  } catch {
    // The upstream reason stays in the caller's own error report. An agent
    // receives a stable code and never a provider message or a path.
    throw new AuthenticatedToolError(
      "store_unavailable",
      "Progress could not be read right now. Try again shortly.",
    );
  }
}

/**
 * Reserve one call from the account budget and the client budget together. A
 * limiter outage refuses the call: an unmetered authenticated read path is not
 * something to degrade into silently.
 */
async function reserveBudget(context: AuthenticatedToolContext): Promise<void> {
  let allowed: boolean;
  try {
    const [userKey, clientKey] = await Promise.all([
      hashedAuthenticatedRateLimitKey(
        AGENT_TOOL_RATE_LIMIT_NAMESPACE,
        context.request,
        context.principal.userId,
      ),
      hashedClientRateLimitKey(
        AGENT_TOOL_CLIENT_RATE_LIMIT_NAMESPACE,
        context.request,
      ),
    ]);
    allowed = await consumeMultiRateLimit({
      entries: [
        { key: userKey, max: AGENT_TOOL_USER_RATE_LIMIT_MAX },
        { key: clientKey, max: AGENT_TOOL_CLIENT_RATE_LIMIT_MAX },
      ],
      windowSeconds: AGENT_TOOL_RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch {
    throw new AuthenticatedToolError(
      "rate_limit_unavailable",
      "Rate-limit protection is unavailable, so this call was refused.",
    );
  }
  if (!allowed) {
    throw new AuthenticatedToolError(
      "rate_limit_exceeded",
      "Too many agent calls for this account or client. Try again later.",
    );
  }
}

function errorResult(code: string, message: string): CallToolResult {
  return {
    content: [
      { type: "text", text: JSON.stringify({ error: code, message }, null, 2) },
    ],
    isError: true,
  };
}

function record(
  context: AuthenticatedToolContext,
  tool: string,
  ok: boolean,
  durationMs: number,
): void {
  if (!context.recordEvent) return;
  try {
    context.recordEvent({
      userId: context.principal.userId,
      client: context.principal.client,
      tool,
      ok,
      durationMs,
    });
  } catch {
    // An audit hook must never change the outcome of the call it describes.
  }
}

export async function callAuthenticatedTool(
  tool: AuthenticatedToolDefinition,
  args: unknown,
  context: AuthenticatedToolContext,
): Promise<CallToolResult> {
  const started = Date.now();
  try {
    await reserveBudget(context);
    const payload = await tool.run(args, context);
    const capped = capJsonPayload(payload, tool.overflow(args));
    const durationMs = Date.now() - started;
    logMcpToolEvent({
      tool: tool.name,
      outcome: "ok",
      durationMs,
      truncated: capped.truncated,
    });
    record(context, tool.name, true, durationMs);
    return { content: [{ type: "text", text: capped.text }] };
  } catch (error) {
    const durationMs = Date.now() - started;
    const named = error instanceof AuthenticatedToolError ? error : null;
    logMcpToolEvent({
      tool: tool.name,
      outcome: named ? OUTCOME_BY_ERROR_CODE[named.code] : "failed",
      durationMs,
    });
    record(context, tool.name, false, durationMs);
    if (named) return errorResult(named.code, named.message);
    // An unexpected failure must not put an upstream message, a file path, or
    // a stack frame in front of an agent.
    return errorResult(
      "tool_failed",
      "This tool could not answer right now. Try again, or open loehrning.ai/konto.",
    );
  }
}

/**
 * Register both authenticated tools on a per-request server.
 *
 * Called only once a bearer has been resolved, so an unauthenticated session
 * never sees these names in `tools/list` at all: there is nothing to attempt
 * and nothing to guess at.
 */
export function registerAuthenticatedMcpTools(
  server: McpServer,
  context: AuthenticatedToolContext,
): void {
  // Registration happens per request, after every tool module has loaded, so
  // widening the loggable set here cannot lose the public names to an import
  // order the route does not control.
  registerLoggableToolNames([
    ...MCP_TOOL_NAMES,
    ...AUTHENTICATED_MCP_TOOL_NAMES,
  ]);
  for (const tool of AUTHENTICATED_MCP_TOOLS) {
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
      async (args: unknown) => callAuthenticatedTool(tool, args, context),
    );
  }
}
