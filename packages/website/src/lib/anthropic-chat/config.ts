/**
 * Fixed limits for the account chat that runs on a student's own provider key.
 *
 * Every number here is a constant. The route spends someone else's budget with
 * someone else's credential, so its ceilings must be readable in one place and
 * must never depend on request content.
 */

export const ACCOUNT_CHAT_ROUTE = "/api/account/chat";

/** Rate-limit namespace. Matches the limiter's `[a-z0-9-]{1,64}` contract. */
export const ACCOUNT_CHAT_RATE_LIMIT_NAMESPACE = "account-chat";
export const ACCOUNT_CHAT_IP_RATE_LIMIT_NAMESPACE = "account-chat-ip";
export const ACCOUNT_CHAT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

/** Per-account budget: 60 messages an hour. */
export const ACCOUNT_CHAT_USER_RATE_LIMIT_MAX = 60;
/**
 * Independent per-client ceiling. Cheap account creation must not multiply the
 * account budget from one machine, so the two limits are consumed together.
 */
export const ACCOUNT_CHAT_CLIENT_RATE_LIMIT_MAX = 240;

/** Hard ceiling on one message. */
export const ACCOUNT_CHAT_MAX_MESSAGE_BYTES = 32 * 1024;
/** Hard ceiling on the whole request body, history included. */
export const ACCOUNT_CHAT_MAX_PAYLOAD_BYTES = 256 * 1024;
/** How many prior turns a client may replay. */
export const ACCOUNT_CHAT_MAX_HISTORY_MESSAGES = 24;

/** Tool calls one message may spend. The 9th request is refused, not run. */
export const ACCOUNT_CHAT_MAX_TOOL_CALLS = 8;

/** Output ceiling per provider turn. */
export const ACCOUNT_CHAT_MAX_OUTPUT_TOKENS = 4096;

/**
 * Wall clock for the whole exchange, tool calls included. Comfortably inside
 * the route's `maxDuration = 120`, so a provider that stalls ends as a named
 * timeout rather than as a platform-level function kill with no answer.
 */
export const ACCOUNT_CHAT_DEADLINE_MS = 100_000;

/** Retry hint used when the provider rate-limits without naming a delay. */
export const ACCOUNT_CHAT_DEFAULT_RETRY_AFTER_SECONDS = 30;
export const ACCOUNT_CHAT_MAX_RETRY_AFTER_SECONDS = 600;

/**
 * Newline-delimited JSON. One event per line, so the browser can render text
 * as it arrives without a parser for a bespoke framing format and without the
 * reconnect semantics of `text/event-stream`, which this route does not want.
 */
export const ACCOUNT_CHAT_MEDIA_TYPE = "application/x-ndjson";
