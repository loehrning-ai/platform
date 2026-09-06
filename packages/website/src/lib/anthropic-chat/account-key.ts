/**
 * Reading the student's stored provider key for one chat request.
 *
 * The clear key exists only inside the returned value and only for as long as
 * the request that asked for it. Nothing here logs, and no branch puts key
 * material, ciphertext, or an initialisation vector into an error, a message,
 * or a returned object.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isAccountKeyEnvelopeError,
  openAccountKey,
} from "@/lib/llm-keys/envelope";
import { fetchSealedAccountLlmKey } from "@/lib/llm-keys/store";
import type { AccountLlmProvider } from "@/lib/llm-keys/providers";
import { AccountChatError } from "./errors";

export type AccountChatKeyOutcome =
  | { readonly ok: true; readonly apiKey: string }
  | {
      readonly ok: false;
      readonly error: AccountChatError;
      /**
       * Present when the failure is an operator problem rather than a student
       * one. The route reports it; it is never sent to the browser.
       */
      readonly cause?: unknown;
    };

/**
 * Resolve the key this request will run on.
 *
 * Three distinguishable outcomes, and the difference matters to the person
 * waiting for an answer:
 *
 *  - no row at all: the student has not stored a key yet, which the account
 *    page can fix with a form.
 *  - a row that will not open: the key-encryption key changed under it, or the
 *    row was tampered with. The student's fix is the same form, so the answer
 *    is the same code, but the operator is told through the reported cause.
 *  - the store itself is unreachable: nothing about the account is known, so
 *    the answer is an outage, not a statement about the student's key.
 */
export async function resolveAccountChatKey(
  serviceClient: SupabaseClient,
  userId: string,
  provider: AccountLlmProvider,
): Promise<AccountChatKeyOutcome> {
  const sealed = await fetchSealedAccountLlmKey(
    serviceClient,
    userId,
    provider,
  );
  if (!sealed.ok) {
    return {
      ok: false,
      error: new AccountChatError("llm_key_unavailable", 503),
      cause: sealed.error,
    };
  }
  if (!sealed.record) {
    return { ok: false, error: new AccountChatError("llm_key_missing", 409) };
  }

  try {
    const apiKey = openAccountKey({
      userId,
      provider,
      ciphertext: sealed.record.ciphertext,
      iv: sealed.record.iv,
    });
    return { ok: true, apiKey };
  } catch (error) {
    if (isAccountKeyEnvelopeError(error, "kek_unavailable")) {
      // The readiness predicate passed a moment ago, so this is a deployment
      // that changed under the request, not a student-visible fault.
      return {
        ok: false,
        error: new AccountChatError("llm_key_unavailable", 503),
        cause: error,
      };
    }
    return {
      ok: false,
      error: new AccountChatError("llm_key_missing", 409),
      cause: error,
    };
  }
}
