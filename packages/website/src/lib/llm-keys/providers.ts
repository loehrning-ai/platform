/**
 * Providers a student may store a key for, and the exact shape each key must
 * have before the platform will touch it.
 *
 * The shape check is not a substitute for the provider validation call: it is
 * the cheap gate in front of it. It fails a pasted password, a session cookie,
 * or a whole curl command before any network request happens, and it
 * guarantees the four-character hint derived from the key satisfies the
 * account_llm_keys.hint column constraint.
 *
 * This module holds no key material and is safe to import from a client
 * bundle boundary check; the sealing, storage, and validation modules next to
 * it are all server-only.
 */

export const ACCOUNT_LLM_PROVIDERS = ["anthropic"] as const;

export type AccountLlmProvider = (typeof ACCOUNT_LLM_PROVIDERS)[number];

const PROVIDERS: ReadonlySet<string> = new Set(ACCOUNT_LLM_PROVIDERS);

export function isAccountLlmProvider(
  value: unknown,
): value is AccountLlmProvider {
  return typeof value === "string" && PROVIDERS.has(value);
}

/** Length of the clear fragment stored next to the sealed key. */
export const ACCOUNT_LLM_KEY_HINT_LENGTH = 4;

/** Matches the account_llm_keys.hint column CHECK constraint. */
export const ACCOUNT_LLM_KEY_HINT_PATTERN = /^[A-Za-z0-9_-]{4}$/;

/**
 * Accepted clear-key shapes, one per provider.
 *
 * Anthropic keys carry the fixed `sk-ant-` prefix followed by URL-safe
 * characters. Restricting the tail to that class is what makes the last four
 * characters a valid hint for every key the platform accepts, so a provider
 * whose keys can end in another character needs both a new pattern here and a
 * widened hint constraint in the migration.
 */
const KEY_PATTERNS: Readonly<Record<AccountLlmProvider, RegExp>> = {
  anthropic: /^sk-ant-[A-Za-z0-9_-]{16,480}$/,
};

export const ACCOUNT_LLM_KEY_MIN_LENGTH = 24;
export const ACCOUNT_LLM_KEY_MAX_LENGTH = 512;

export function isAccountLlmKeyShape(
  provider: AccountLlmProvider,
  apiKey: unknown,
): apiKey is string {
  if (
    typeof apiKey !== "string" ||
    apiKey.length < ACCOUNT_LLM_KEY_MIN_LENGTH ||
    apiKey.length > ACCOUNT_LLM_KEY_MAX_LENGTH ||
    apiKey !== apiKey.trim()
  ) {
    return false;
  }
  return KEY_PATTERNS[provider].test(apiKey);
}

export class AccountLlmKeyHintError extends Error {
  constructor() {
    // No key material, not even a fragment, reaches the message. A hint that
    // fails the column shape means the accepted-key pattern and the migration
    // have drifted apart, and that is what the reader needs to know.
    super("Derived account key hint does not match the stored hint shape");
    this.name = "AccountLlmKeyHintError";
  }
}

/**
 * The only clear fragment of a student key that ever leaves the server: the
 * last four characters, shown so the owner can tell which key is stored.
 */
export function accountLlmKeyHint(apiKey: string): string {
  const hint = apiKey.slice(-ACCOUNT_LLM_KEY_HINT_LENGTH);
  if (!ACCOUNT_LLM_KEY_HINT_PATTERN.test(hint)) {
    throw new AccountLlmKeyHintError();
  }
  return hint;
}
