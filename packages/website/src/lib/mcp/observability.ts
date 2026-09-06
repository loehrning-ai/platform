/**
 * Structured, PII-free logging for the agent surface.
 *
 * The endpoint is public, so its request stream is untrusted input. A log line
 * is therefore built only from values this module already knows: a tool name
 * that has to exist in the registry, an outcome from a fixed enum, and a
 * duration. Search queries, slugs, locales, headers, addresses, and payloads
 * are never read here, so no log line can carry caller-controlled text.
 *
 * `console.warn` is the sink on purpose. The production Node boundary replaces
 * `console.error` with a fixed redaction marker, so a structured diagnostic
 * written there would vanish; `warn` is the same escape hatch the durable rate
 * limiter already uses for its own structured line.
 */

export const MCP_TOOL_OUTCOMES = [
  "ok",
  "not_found",
  "unavailable",
  "invalid_input",
  "failed",
] as const;

export type McpToolOutcome = (typeof MCP_TOOL_OUTCOMES)[number];

export interface McpToolEvent {
  readonly tool: string;
  readonly outcome: McpToolOutcome;
  readonly durationMs: number;
  /** Whether the payload hit the output ceiling. */
  readonly truncated?: boolean;
}

const OUTCOMES: ReadonlySet<string> = new Set(MCP_TOOL_OUTCOMES);

/** Tool names accepted in a log line. Registered once at server construction. */
let knownToolNames: ReadonlySet<string> = new Set<string>();

export function registerLoggableToolNames(names: readonly string[]): void {
  knownToolNames = new Set(names);
}

function safeToolName(value: string): string {
  return knownToolNames.has(value) ? value : "unknown";
}

function safeDuration(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

export function logMcpToolEvent(event: McpToolEvent): void {
  const line = {
    event: "mcp-tool",
    tool: safeToolName(event.tool),
    outcome: OUTCOMES.has(event.outcome) ? event.outcome : "failed",
    durationMs: safeDuration(event.durationMs),
    ...(event.truncated === true ? { truncated: true } : {}),
  };
  try {
    console.warn(JSON.stringify(line));
  } catch {
    // Logging must never break a tool call.
  }
}

export interface McpRequestEvent {
  readonly outcome:
    | "served"
    | "disabled"
    | "unsupported_media_type"
    | "payload_too_large"
    | "rate_limited"
    | "rate_limit_unavailable"
    // A credential was presented and refused. Distinct from "failed": the
    // endpoint answered correctly, the caller's bearer did not hold up. The
    // named reason stays out of the log line on purpose.
    | "unauthorized"
    | "failed";
  readonly status: number;
  readonly durationMs: number;
}

const REQUEST_OUTCOMES: ReadonlySet<string> = new Set([
  "served",
  "disabled",
  "unsupported_media_type",
  "payload_too_large",
  "rate_limited",
  "rate_limit_unavailable",
  "unauthorized",
  "failed",
]);

export function logMcpRequestEvent(event: McpRequestEvent): void {
  const status = Number.isInteger(event.status) ? event.status : 0;
  const line = {
    event: "mcp-request",
    outcome: REQUEST_OUTCOMES.has(event.outcome) ? event.outcome : "failed",
    status: status >= 100 && status <= 599 ? status : 0,
    durationMs: safeDuration(event.durationMs),
  };
  try {
    console.warn(JSON.stringify(line));
  } catch {
    // Logging must never break a response path.
  }
}
