/**
 * Wire format of the chat response: newline-delimited JSON, one event per line.
 *
 * Events carry codes, never prose. The page owns every sentence a student
 * reads, in both languages, so this module stays free of copy that would
 * otherwise have to be kept in sync with the account page.
 */

import type { AccountChatErrorCode } from "./errors";

export const ACCOUNT_CHAT_STOP_REASONS = [
  "end_turn",
  "max_tokens",
  "stop_sequence",
  "refusal",
  "tool_budget",
  "aborted",
  "failed",
] as const;

export type AccountChatStopReason =
  (typeof ACCOUNT_CHAT_STOP_REASONS)[number];

export type AccountChatStreamEvent =
  /** A piece of the answer, in order. */
  | { readonly type: "text"; readonly text: string }
  /** A read-only tool ran. Arguments and results are deliberately absent. */
  | { readonly type: "tool"; readonly name: string; readonly ok: boolean }
  /** A failure that happened after the response headers were already sent. */
  | {
      readonly type: "error";
      readonly error: AccountChatErrorCode;
      readonly retryAfter?: number;
    }
  /** Always the last line of a completed stream. */
  | { readonly type: "done"; readonly stopReason: AccountChatStopReason };

const KNOWN_STOP_REASONS: ReadonlySet<string> = new Set(
  ACCOUNT_CHAT_STOP_REASONS,
);

/**
 * Translate a provider `stop_reason` into one of this route's values.
 *
 * The parameter is typed as a plain string on purpose: the field is a wire
 * value, and a provider may introduce a reason the installed SDK's union does
 * not know yet. An unrecognised value ends the stream as `end_turn` rather
 * than as a type error at the edge of the system.
 */
export function toAccountChatStopReason(
  raw: string | null | undefined,
): AccountChatStopReason {
  if (typeof raw !== "string") return "end_turn";
  return KNOWN_STOP_REASONS.has(raw)
    ? (raw as AccountChatStopReason)
    : "end_turn";
}

export function encodeAccountChatEvent(
  event: AccountChatStreamEvent,
): string {
  return `${JSON.stringify(event)}\n`;
}

/**
 * Parse one NDJSON line. Exported for tests and for any consumer that has to
 * read the stream without trusting that every line is well formed.
 */
export function decodeAccountChatEvent(
  line: string,
): AccountChatStreamEvent | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const type = Reflect.get(parsed, "type");
  if (
    type !== "text" &&
    type !== "tool" &&
    type !== "error" &&
    type !== "done"
  ) {
    return null;
  }
  return parsed as AccountChatStreamEvent;
}
