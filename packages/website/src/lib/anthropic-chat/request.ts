/**
 * Request shape for the account chat.
 *
 * The schema is strict: an unknown key is a rejection, not a field the server
 * quietly ignores. Byte ceilings are measured in UTF-8, because the browser
 * sends bytes and a code-point count would let a message of emoji sail past a
 * limit expressed in characters.
 */

import { z } from "zod";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";
import { lessonUri, parseResourceUri } from "@/lib/mcp/uris";
import {
  ACCOUNT_CHAT_MAX_HISTORY_MESSAGES,
  ACCOUNT_CHAT_MAX_MESSAGE_BYTES,
} from "./config";

const encoder = new TextEncoder();

export function utf8ByteLength(value: string): number {
  return encoder.encode(value).length;
}

const messageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1),
  })
  .strict();

export const accountChatRequestSchema = z
  .object({
    /**
     * Optional. When present it must match the signed-in account, so a stale
     * tab cannot replay account A's transcript into account B's key.
     */
    expectedOwnerId: z.string().trim().min(1).max(256).optional(),
    model: z.string().trim().min(1).max(64).optional(),
    locale: z.enum(SUPPORTED_LOCALES).optional(),
    /**
     * Optional reading context from the lesson the student opened the chat
     * from. Only the canonical `lesson://` address is accepted.
     */
    lessonUri: z.string().trim().min(1).max(512).optional(),
    messages: z
      .array(messageSchema)
      .min(1)
      .max(ACCOUNT_CHAT_MAX_HISTORY_MESSAGES),
  })
  .strict();

export type AccountChatRequest = z.infer<typeof accountChatRequestSchema>;

export interface AccountChatLessonContext {
  readonly uri: string;
  readonly course: string;
  readonly lessonId: string;
  readonly locale: Locale;
}

export type ParsedAccountChatRequest = {
  readonly expectedOwnerId?: string;
  readonly model?: string;
  readonly locale?: Locale;
  readonly lesson?: AccountChatLessonContext;
  readonly messages: readonly {
    readonly role: "user" | "assistant";
    readonly content: string;
  }[];
};

export type AccountChatRequestParseResult =
  | { readonly ok: true; readonly value: ParsedAccountChatRequest }
  | {
      readonly ok: false;
      readonly reason: "invalid_chat_request" | "message_too_large";
    };

function parseLessonContext(
  raw: string | undefined,
): AccountChatLessonContext | null | "invalid" {
  if (raw === undefined) return null;
  let parsed;
  try {
    // The URI parser refuses an unknown scheme, an extra path segment, an
    // unsupported locale, and any syntax that could escape a lookup. Every one
    // of those is the same answer here: this is not a lesson address.
    parsed = parseResourceUri(raw);
  } catch {
    return "invalid";
  }
  if (parsed.kind !== "lesson") return "invalid";
  return {
    // Rebuilt from the parsed parts, never echoed. The parser validates the
    // scheme, the host, the segment count and the locale, and ignores
    // everything else the caller wrote: a second query parameter, a fragment,
    // literal spaces, a newline. This value is interpolated into the SYSTEM
    // prompt, so echoing the caller's string would let a crafted link append
    // its own instructions to it. `resources.ts` canonicalises for the same
    // reason.
    uri: lessonUri(parsed.course, parsed.lessonId, parsed.locale),
    course: parsed.course,
    lessonId: parsed.lessonId,
    locale: parsed.locale,
  };
}

/**
 * Validate a decoded body into the exact conversation the route will run.
 *
 * Two rules beyond the schema. The transcript has to end on a user turn, since
 * the model is being asked to answer something; and no single message may
 * exceed the per-message ceiling, which is checked in bytes here rather than
 * left to the whole-body cap, so one enormous turn cannot hide inside an
 * otherwise small payload.
 */
export function parseAccountChatRequest(
  body: unknown,
): AccountChatRequestParseResult {
  const parsed = accountChatRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: "invalid_chat_request" };

  const { messages } = parsed.data;
  if (messages[messages.length - 1]?.role !== "user") {
    return { ok: false, reason: "invalid_chat_request" };
  }
  for (const message of messages) {
    if (utf8ByteLength(message.content) > ACCOUNT_CHAT_MAX_MESSAGE_BYTES) {
      return { ok: false, reason: "message_too_large" };
    }
  }

  const lesson = parseLessonContext(parsed.data.lessonUri);
  if (lesson === "invalid") {
    return { ok: false, reason: "invalid_chat_request" };
  }

  return {
    ok: true,
    value: {
      ...(parsed.data.expectedOwnerId !== undefined
        ? { expectedOwnerId: parsed.data.expectedOwnerId }
        : {}),
      ...(parsed.data.model !== undefined ? { model: parsed.data.model } : {}),
      ...(parsed.data.locale !== undefined
        ? { locale: parsed.data.locale }
        : {}),
      ...(lesson !== null ? { lesson } : {}),
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    },
  };
}

/**
 * Pick the model this request runs on.
 *
 * An empty allowlist authorizes nothing, and a requested model outside the
 * list is refused rather than silently replaced: a student who asked for one
 * model must never be billed for a different one.
 */
export function resolveChatModel(
  requested: string | undefined,
  allowed: readonly string[],
): string | null {
  if (allowed.length === 0) return null;
  if (requested === undefined) return allowed[0] ?? null;
  return allowed.includes(requested) ? requested : null;
}
