import "server-only";

import type { AccountLlmProvider } from "./providers";

/**
 * One cheap provider call that answers a single question: does this key work?
 *
 * A models list is the smallest authenticated read every supported provider
 * offers. It costs no tokens, returns no learner data, and distinguishes the
 * three outcomes the account route has to tell apart: the key is refused, the
 * provider did not answer in time, or the provider is having a bad day and the
 * key deserves the benefit of the doubt.
 *
 * The response body is never read. Only the status code informs the outcome,
 * so no provider-controlled text can reach a log line, an error report, or a
 * response. The key itself travels in a request header, never in the URL,
 * never in a log, and never back out of this module.
 */

export const ACCOUNT_LLM_KEY_VALIDATION_TIMEOUT_MS = 5_000;

const ANTHROPIC_VERSION = "2023-06-01";

const MODELS_ENDPOINT: Readonly<Record<AccountLlmProvider, string>> = {
  anthropic: "https://api.anthropic.com/v1/models?limit=1",
};

function providerHeaders(
  provider: AccountLlmProvider,
  apiKey: string,
): Headers {
  const headers = new Headers({ accept: "application/json" });
  if (provider === "anthropic") {
    headers.set("x-api-key", apiKey);
    headers.set("anthropic-version", ANTHROPIC_VERSION);
  }
  return headers;
}

export type AccountKeyValidationOutcome =
  | { readonly ok: true; readonly validatedAt: string }
  | {
      readonly ok: false;
      /**
       * `rejected` means the provider refused the credential and the student
       * has to supply another one. `timeout` and `unavailable` say nothing
       * about the key, so neither may ever be reported as a bad key.
       */
      readonly reason: "rejected" | "timeout" | "unavailable";
    };

export interface ValidateAccountLlmKeyInput {
  readonly provider: AccountLlmProvider;
  readonly apiKey: string;
  readonly timeoutMs?: number;
  /** Injection point for tests. Production always uses the global fetch. */
  readonly fetchImpl?: typeof fetch;
}

export async function validateAccountLlmKey(
  input: ValidateAccountLlmKeyInput,
): Promise<AccountKeyValidationOutcome> {
  const timeoutMs =
    typeof input.timeoutMs === "number" &&
    Number.isFinite(input.timeoutMs) &&
    input.timeoutMs > 0
      ? input.timeoutMs
      : ACCOUNT_LLM_KEY_VALIDATION_TIMEOUT_MS;
  const call = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await call(MODELS_ENDPOINT[input.provider], {
      method: "GET",
      headers: providerHeaders(input.provider, input.apiKey),
      signal: controller.signal,
      cache: "no-store",
      // A redirect would resend the credential header to whatever host the
      // response names. Refuse instead of following.
      redirect: "error",
    });
  } catch {
    // The thrown error can carry the request, and the request carries the key
    // header. It never leaves this catch.
    return controller.signal.aborted
      ? { ok: false, reason: "timeout" }
      : { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }

  // Release the socket without ever decoding provider text.
  try {
    await response.body?.cancel();
  } catch {
    // A body that cannot be cancelled must not change the outcome.
  }

  const status =
    typeof response.status === "number" ? response.status : 0;
  if (status >= 200 && status <= 299) {
    return { ok: true, validatedAt: new Date().toISOString() };
  }
  if (status === 401 || status === 403) {
    return { ok: false, reason: "rejected" };
  }
  return { ok: false, reason: "unavailable" };
}
