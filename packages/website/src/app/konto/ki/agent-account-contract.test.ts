import { describe, expect, it, vi } from "vitest";

// api-error.ts imports @sentry/nextjs at module scope, and loading that in
// the test runtime is not possible; every test that reaches it replaces it.
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));

import {
  ACCOUNT_CHAT_MAX_HISTORY_MESSAGES,
  ACCOUNT_CHAT_MAX_MESSAGE_BYTES,
  ACCOUNT_CHAT_ROUTE,
} from "@/lib/anthropic-chat/config";
import { ACCOUNT_LLM_PROVIDERS } from "@/lib/llm-keys/providers";
import {
  AGENT_ACCESS_TOKEN_NAME_MAX_LENGTH,
  MAX_ACTIVE_AGENT_ACCESS_TOKENS,
} from "@/app/api/account/agent-tokens/mint";
import {
  ACCOUNT_CHAT_ENDPOINT,
  ACCOUNT_CHAT_PROVIDER,
  CHAT_MAX_HISTORY_MESSAGES,
  CHAT_MESSAGE_MAX_BYTES,
  MAX_ACTIVE_TOKENS,
  TOKEN_NAME_MAX_LENGTH,
} from "./agent-account-contract";
import {
  AGENT_ACCESS_EVENTS_TABLE,
  AGENT_ACCESS_TOKENS_TABLE,
} from "./account-agent-data";
import { TRANSCRIPT_MAX_TURNS } from "./chat-transcript";

/**
 * The client islands cannot import the server modules that own these numbers,
 * so this file is the seam. If a limit moves on the server and not here, the
 * form would let a learner type something the route refuses, or refuse
 * something the route accepts.
 */
describe("agent account client contract", () => {
  it("mirrors the personal access token limits", () => {
    expect(MAX_ACTIVE_TOKENS).toBe(MAX_ACTIVE_AGENT_ACCESS_TOKENS);
    expect(TOKEN_NAME_MAX_LENGTH).toBe(AGENT_ACCESS_TOKEN_NAME_MAX_LENGTH);
  });

  it("mirrors the chat ceilings and endpoint", () => {
    expect(CHAT_MESSAGE_MAX_BYTES).toBe(ACCOUNT_CHAT_MAX_MESSAGE_BYTES);
    expect(CHAT_MAX_HISTORY_MESSAGES).toBe(ACCOUNT_CHAT_MAX_HISTORY_MESSAGES);
    expect(ACCOUNT_CHAT_ENDPOINT).toBe(ACCOUNT_CHAT_ROUTE);
  });

  it("never stores more local turns than the route accepts as history", () => {
    expect(TRANSCRIPT_MAX_TURNS).toBeLessThanOrEqual(
      ACCOUNT_CHAT_MAX_HISTORY_MESSAGES,
    );
  });

  it("names a provider the key vault actually accepts", () => {
    expect(ACCOUNT_LLM_PROVIDERS).toContain(ACCOUNT_CHAT_PROVIDER);
  });

  it("names the two tables the account regions read", () => {
    expect(AGENT_ACCESS_EVENTS_TABLE).toBe("agent_access_events");
    expect(AGENT_ACCESS_TOKENS_TABLE).toBe("agent_access_tokens");
  });
});
