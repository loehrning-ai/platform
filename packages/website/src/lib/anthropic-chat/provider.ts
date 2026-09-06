/**
 * The provider client for one chat request, bound to one student's key.
 *
 * This module is the only place in the account chat that constructs an SDK
 * client, and it refuses to construct one without an explicit key. That
 * refusal is the whole point: the SDK falls back to `ANTHROPIC_API_KEY` when
 * `apiKey` is undefined, so an unchecked construction here would silently bill
 * the operator's credential for a student's conversation. The chat never
 * touches the operator client in `@/lib/anthropic`, and it never reads the
 * operator key from the environment.
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { isAccountLlmKeyShape } from "@/lib/llm-keys/providers";
import type { AccountLlmProvider } from "@/lib/llm-keys/providers";
import { ACCOUNT_CHAT_DEADLINE_MS } from "./config";
import type { AccountChatProvider } from "./conversation";

export class AccountChatKeyRequiredError extends Error {
  constructor() {
    super("Account chat requires an explicit student key");
    this.name = "AccountChatKeyRequiredError";
  }
}

/**
 * Build the provider for one request.
 *
 * `maxRetries: 0` on purpose. Every retry is another billed call against
 * someone else's account, and this route already reports a rate limit or an
 * outage as a named error with a retry hint, so the decision to try again
 * belongs to the page and to the student, not to a library default.
 */
export function createAccountChatProvider(
  provider: AccountLlmProvider,
  apiKey: string,
): AccountChatProvider {
  if (!isAccountLlmKeyShape(provider, apiKey)) {
    throw new AccountChatKeyRequiredError();
  }
  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: ACCOUNT_CHAT_DEADLINE_MS,
  });
  return {
    createMessageStream: (params, options) =>
      client.messages.create(params, { signal: options.signal }),
  };
}
