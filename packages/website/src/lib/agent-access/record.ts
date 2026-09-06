import "server-only";

import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reportApiError } from "@/lib/observability/api-error";
import { tryCreateServiceClient } from "@/lib/supabase/server";

/**
 * Writer for the agent audit trail (public.agent_access_events).
 *
 * Two rules shape everything below.
 *
 * 1. It never blocks and never fails its caller. An audit row is a record of
 *    a tool call, not part of it: a missing service client, a rejected insert,
 *    a malformed event, or a store outage must all end as a log line and a
 *    returned outcome, never as a thrown error or a slower answer. Inside a
 *    request scope the write is handed to `after()` so it runs once the
 *    response is out and the platform still keeps the worker alive for it;
 *    outside one it becomes an unawaited promise that cannot reject.
 *
 * 2. It stores no arguments and no results. Only a client label, a tool name,
 *    an outcome flag, and a duration reach the table. Both text values are
 *    normalised here: control characters removed, whitespace collapsed, length
 *    clamped by code point so the value cannot exceed the column CHECK and a
 *    clamp can never split a surrogate pair into invalid text.
 */

export const AGENT_ACCESS_EVENTS_TABLE = "agent_access_events";

/** Matches the char_length CHECK constraints on the two text columns. */
export const AGENT_ACCESS_CLIENT_MAX_LENGTH = 96;
export const AGENT_ACCESS_TOOL_MAX_LENGTH = 64;
/** Matches the duration_ms CHECK constraint. */
export const AGENT_ACCESS_DURATION_MS_MAX = 600_000;

/** Client label for tool calls made by the chat inside the account. */
export const KONTO_CHAT_CLIENT = "konto-chat";

const PERSONAL_TOKEN_CLIENT_PREFIX = "pat:";
const OAUTH_CLIENT_PREFIX = "oauth:";
const UNKNOWN_CLIENT_SUFFIX = "unknown";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const C0_CONTROL_END = 0x1f;
const DELETE_CODE_POINT = 0x7f;
const C1_CONTROL_END = 0x9f;

export interface AgentAccessEvent {
  /** Owner of the account the agent acted on. Server-derived, never a claim. */
  readonly userId: string;
  /** Which client acted: `pat:<name>`, `oauth:<client id>`, `konto-chat`. */
  readonly client: string;
  /** Registered tool name. */
  readonly tool: string;
  readonly ok: boolean;
  readonly durationMs: number;
}

interface AgentAccessEventRow {
  readonly user_id: string;
  readonly client: string;
  readonly tool: string;
  readonly ok: boolean;
  readonly duration_ms: number;
}

export type AgentAccessRecordOutcome = "written" | "skipped" | "failed";

type DroppedReason = "invalid_event" | "store_unavailable";

function isControlCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    codePoint <= C0_CONTROL_END ||
    (codePoint >= DELETE_CODE_POINT && codePoint <= C1_CONTROL_END)
  );
}

/**
 * Bound and clean one caller-influenced label. Clamping walks code points, not
 * UTF-16 units, so the result matches PostgreSQL's `char_length` and can never
 * end in half a surrogate pair.
 */
function sanitizeLabel(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  // Array.from walks code points, so a control sweep and a length clamp both
  // operate on whole characters. A regex range over the control block would
  // work too, but embedding raw control characters in source is exactly the
  // habit that produces unreadable, unreviewable patterns.
  const withoutControls = Array.from(value, (character) =>
    isControlCharacter(character) ? " " : character,
  ).join("");
  const collapsed = withoutControls.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) return null;
  const codePoints = Array.from(collapsed);
  if (codePoints.length <= maxLength) return collapsed;
  // Whitespace is already collapsed and trimmed, so the first code point is
  // never a space and the clamped head can never trim away to nothing.
  return codePoints.slice(0, maxLength).join("").trimEnd();
}

function normalizeDuration(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(Math.round(value), AGENT_ACCESS_DURATION_MS_MAX);
}

/**
 * Build the exact row shape the table accepts, or refuse the event. A refusal
 * is deliberate: an event without a real owner cannot be attributed, and an
 * unattributable row in an audit trail is worse than a missing one.
 */
export function normalizeAgentAccessEvent(
  event: AgentAccessEvent,
): AgentAccessEventRow | null {
  const userId = typeof event.userId === "string" ? event.userId.trim() : "";
  if (!UUID_PATTERN.test(userId)) return null;

  const client = sanitizeLabel(event.client, AGENT_ACCESS_CLIENT_MAX_LENGTH);
  if (client === null) return null;

  const tool = sanitizeLabel(event.tool, AGENT_ACCESS_TOOL_MAX_LENGTH);
  if (tool === null) return null;

  return {
    user_id: userId,
    client,
    tool,
    ok: event.ok === true,
    duration_ms: normalizeDuration(event.durationMs),
  };
}

/** Client label for a personal access token, named by its owner-chosen name. */
export function personalTokenClientLabel(name: string): string {
  const label = sanitizeLabel(
    name,
    AGENT_ACCESS_CLIENT_MAX_LENGTH - PERSONAL_TOKEN_CLIENT_PREFIX.length,
  );
  return `${PERSONAL_TOKEN_CLIENT_PREFIX}${label ?? UNKNOWN_CLIENT_SUFFIX}`;
}

/** Client label for an OAuth grant, named by the registered client id. */
export function oauthClientLabel(clientId: string): string {
  const label = sanitizeLabel(
    clientId,
    AGENT_ACCESS_CLIENT_MAX_LENGTH - OAUTH_CLIENT_PREFIX.length,
  );
  return `${OAUTH_CLIENT_PREFIX}${label ?? UNKNOWN_CLIENT_SUFFIX}`;
}

/**
 * `console.warn` on purpose: a dropped audit row is an operational warning,
 * not an exception, and the production Node boundary replaces `console.error`
 * with a fixed redaction marker. The line carries only a fixed enum value, so
 * it can never leak a caller-controlled string.
 */
function logDropped(reason: DroppedReason): void {
  try {
    console.warn(
      JSON.stringify({
        event: "agent-access-record",
        outcome: "dropped",
        reason,
      }),
    );
  } catch {
    // Logging must never break a tool call.
  }
}

/**
 * Insert one audit row. Resolves with the outcome and never rejects, so every
 * caller can treat it as a promise that always settles successfully.
 */
export async function writeAgentAccessEvent(
  event: AgentAccessEvent,
): Promise<AgentAccessRecordOutcome> {
  let row: AgentAccessEventRow | null;
  try {
    row = normalizeAgentAccessEvent(event);
  } catch {
    row = null;
  }
  if (!row) {
    logDropped("invalid_event");
    return "skipped";
  }

  let serviceClient: SupabaseClient | null;
  try {
    serviceClient = tryCreateServiceClient();
  } catch {
    serviceClient = null;
  }
  if (!serviceClient) {
    logDropped("store_unavailable");
    return "skipped";
  }

  try {
    const { error } = await serviceClient
      .from(AGENT_ACCESS_EVENTS_TABLE)
      .insert(row);
    if (error) {
      reportApiError({ step: "supabase-insert", error });
      return "failed";
    }
  } catch (error) {
    reportApiError({ step: "supabase-insert", error });
    return "failed";
  }
  return "written";
}

/**
 * Fire and forget. Returns immediately; the caller never awaits, never sees a
 * rejection, and never changes its own outcome because of this call.
 */
export function recordAgentAccessEvent(event: AgentAccessEvent): void {
  try {
    // Inside a request scope the write runs after the response is sent, so
    // the audit trail costs the tool call no latency and still completes on a
    // platform that freezes the worker once the response is out.
    after(() => writeAgentAccessEvent(event));
    return;
  } catch {
    // `after` throws outside a request scope (a scheduled job, a test). Fall
    // through to an unawaited write.
  }
  try {
    void writeAgentAccessEvent(event).catch(() => undefined);
  } catch {
    // An audit write must never break the tool call it describes.
  }
}
