import { CHAT_MAX_HISTORY_MESSAGES } from "./agent-account-contract";

/**
 * The account chat transcript, as it lives in the browser.
 *
 * Nothing here reaches the server. The route stores no conversation, so the
 * only copy of a transcript is this one, written under the account namespace
 * of the learning storage so two accounts on one machine never see each
 * other's messages.
 *
 * The module is pure: it parses, bounds, and serialises. Reading and writing
 * storage is the island's job, which keeps every rule below testable without
 * a DOM.
 */

/** Storage key, namespaced per account by ownedLearningStorageKey(). */
export const CHAT_TRANSCRIPT_STORAGE_KEY = "loehrning-account-chat-v1";

/** Turns kept locally. Matches what the route accepts as history. */
export const TRANSCRIPT_MAX_TURNS = CHAT_MAX_HISTORY_MESSAGES;
/** Characters kept per turn in storage, so one long answer cannot fill it. */
export const TRANSCRIPT_MAX_TURN_LENGTH = 8_000;
/** Tool names recorded next to one assistant turn. */
const TRANSCRIPT_MAX_TOOLS = 8;
const TOOL_NAME_MAX_LENGTH = 64;

export interface ChatTurn {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  /** Read-only tools the answer used. Names only, never arguments. */
  readonly tools: readonly string[];
}

interface StoredTranscript {
  readonly version: 1;
  readonly turns: readonly ChatTurn[];
}

function field(source: unknown, key: string): unknown {
  if (typeof source !== "object" || source === null) return undefined;
  try {
    return Reflect.get(source, key);
  } catch {
    return undefined;
  }
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0) return null;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function toTurn(value: unknown): ChatTurn | null {
  const role = field(value, "role");
  if (role !== "user" && role !== "assistant") return null;
  const content = boundedText(
    field(value, "content"),
    TRANSCRIPT_MAX_TURN_LENGTH,
  );
  if (content === null) return null;
  const id = boundedText(field(value, "id"), 64);
  const rawTools = field(value, "tools");
  const tools = Array.isArray(rawTools)
    ? rawTools
        .map((tool) => boundedText(tool, TOOL_NAME_MAX_LENGTH))
        .filter((tool): tool is string => tool !== null)
        .slice(0, TRANSCRIPT_MAX_TOOLS)
    : [];
  return { id: id ?? `${role}-${content.length}`, role, content, tools };
}

/**
 * Keep the newest turns only. A transcript is trimmed from the front so the
 * conversation the student can still see is the conversation the route will
 * be asked to continue.
 */
export function trimTranscript(
  turns: readonly ChatTurn[],
  maxTurns = TRANSCRIPT_MAX_TURNS,
): readonly ChatTurn[] {
  if (maxTurns <= 0) return [];
  return turns.length <= maxTurns ? turns : turns.slice(turns.length - maxTurns);
}

/**
 * Read a stored transcript. Anything unparseable, of the wrong version, or of
 * the wrong shape yields an empty transcript rather than a thrown error: a
 * corrupt local value must not keep a student out of their own chat.
 */
export function parseStoredTranscript(raw: string | null): readonly ChatTurn[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (field(parsed, "version") !== 1) return [];
  const turns = field(parsed, "turns");
  if (!Array.isArray(turns)) return [];
  return trimTranscript(
    turns.map(toTurn).filter((turn): turn is ChatTurn => turn !== null),
  );
}

export function serializeTranscript(turns: readonly ChatTurn[]): string {
  const payload: StoredTranscript = {
    version: 1,
    turns: trimTranscript(turns).map((turn) => ({
      id: turn.id,
      role: turn.role,
      content:
        turn.content.length > TRANSCRIPT_MAX_TURN_LENGTH
          ? turn.content.slice(0, TRANSCRIPT_MAX_TURN_LENGTH)
          : turn.content,
      tools: turn.tools.slice(0, TRANSCRIPT_MAX_TOOLS),
    })),
  };
  return JSON.stringify(payload);
}

/**
 * The history the route is given. The assistant's tool notes are local
 * annotations, so only role and content cross the wire, and an empty
 * assistant turn (an answer that failed before its first token) is dropped
 * rather than sent as an empty message the schema would reject.
 */
export function toRequestMessages(
  turns: readonly ChatTurn[],
): readonly { readonly role: "user" | "assistant"; readonly content: string }[] {
  return trimTranscript(turns)
    .filter((turn) => turn.content.trim().length > 0)
    .map((turn) => ({ role: turn.role, content: turn.content }));
}

/** Immutable append with the local cap applied. */
export function appendTurn(
  turns: readonly ChatTurn[],
  turn: ChatTurn,
): readonly ChatTurn[] {
  return trimTranscript([...turns, turn]);
}

/** Immutable replacement of one turn, addressed by id. */
export function replaceTurn(
  turns: readonly ChatTurn[],
  id: string,
  update: (turn: ChatTurn) => ChatTurn,
): readonly ChatTurn[] {
  return turns.map((turn) => (turn.id === id ? update(turn) : turn));
}
