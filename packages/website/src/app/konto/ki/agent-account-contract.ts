/**
 * The few numbers and route names the client islands on this page need.
 *
 * They are duplicated here rather than imported from the API routes on
 * purpose: the mint helper is `server-only` and reaches for `node:crypto`, so
 * importing it from a client island would either fail the bundle boundary or
 * drag Node primitives into the browser. `agent-account-contract.test.ts`
 * imports the real modules and asserts these values still match, so a drift
 * is a failing test rather than a silently wrong form.
 */

export const AGENT_TOKENS_ENDPOINT = "/api/account/agent-tokens";
export const LLM_KEY_ENDPOINT = "/api/account/llm-key";
export const ACCOUNT_CHAT_ENDPOINT = "/api/account/chat";
export const OAUTH_GRANTS_ENDPOINT = "/api/account/oauth-grants";

/** Mirrors MAX_ACTIVE_AGENT_ACCESS_TOKENS in the mint helper. */
export const MAX_ACTIVE_TOKENS = 5;
/** Mirrors AGENT_ACCESS_TOKEN_NAME_MAX_LENGTH and the column CHECK. */
export const TOKEN_NAME_MAX_LENGTH = 64;
/** Mirrors ACCOUNT_CHAT_MAX_MESSAGE_BYTES; used as a cheap length gate. */
export const CHAT_MESSAGE_MAX_BYTES = 32 * 1024;
/** Mirrors ACCOUNT_CHAT_MAX_HISTORY_MESSAGES. */
export const CHAT_MAX_HISTORY_MESSAGES = 24;

/** The one provider the vault accepts today. */
export const ACCOUNT_CHAT_PROVIDER = "anthropic";
