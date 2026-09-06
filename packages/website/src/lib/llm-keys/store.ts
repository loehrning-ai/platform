import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SealedAccountKey } from "./envelope";
import { ACCOUNT_LLM_KEY_HINT_PATTERN, type AccountLlmProvider } from "./providers";

/**
 * Storage boundary for the bring-your-own-key vault.
 *
 * Two column sets, and the difference between them is the whole point of the
 * table. `ACCOUNT_LLM_KEY_SUMMARY_COLUMNS` is what the browser role holds a
 * grant for: provider, hint, and the two timestamps. `SEALED_COLUMNS` adds the
 * ciphertext and the initialisation vector and is reachable only through the
 * service client, from server code that is about to open the envelope for a
 * provider request.
 *
 * Every function returns an outcome object instead of throwing, so a caller
 * cannot accidentally let a Postgres error carrying row data escape into an
 * error reporter. Nothing here logs.
 */

export const ACCOUNT_LLM_KEYS_TABLE = "account_llm_keys";

/**
 * Exactly the columns granted to the `authenticated` role. A browser-side
 * read must name these; the table refuses `select *` by design.
 */
export const ACCOUNT_LLM_KEY_SUMMARY_COLUMNS =
  "provider, hint, created_at, validated_at";

const SEALED_COLUMNS = "provider, hint, created_at, validated_at, ciphertext, iv";

export interface AccountLlmKeySummary {
  readonly provider: AccountLlmProvider;
  readonly hint: string;
  readonly createdAt: string;
  readonly validatedAt: string;
}

export interface SealedAccountLlmKeyRecord extends AccountLlmKeySummary {
  readonly ciphertext: string;
  readonly iv: string;
}

export class AccountLlmKeyStoreError extends Error {
  readonly reason: "malformed_row";

  constructor() {
    // No column values in the message: a malformed row is a schema problem,
    // and the row itself may hold sealed key material.
    super("Stored account key row does not match the expected shape");
    this.name = "AccountLlmKeyStoreError";
    this.reason = "malformed_row";
  }
}

export type AccountLlmKeySummaryOutcome =
  | { readonly ok: true; readonly summary: AccountLlmKeySummary | null }
  | { readonly ok: false; readonly error: unknown };

export type SealedAccountLlmKeyOutcome =
  | { readonly ok: true; readonly record: SealedAccountLlmKeyRecord | null }
  | { readonly ok: false; readonly error: unknown };

export type AccountLlmKeyWriteOutcome =
  | { readonly ok: true; readonly summary: AccountLlmKeySummary }
  | { readonly ok: false; readonly error: unknown };

export type AccountLlmKeyDeleteOutcome =
  | { readonly ok: true; readonly deleted: boolean }
  | { readonly ok: false; readonly error: unknown };

function readField(row: unknown, field: string): unknown {
  if (typeof row !== "object" || row === null) return undefined;
  try {
    return Reflect.get(row, field);
  } catch {
    return undefined;
  }
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 &&
    !Number.isNaN(Date.parse(value))
  );
}

function toSummary(
  row: unknown,
  provider: AccountLlmProvider,
): AccountLlmKeySummary {
  const hint = readField(row, "hint");
  const createdAt = readField(row, "created_at");
  const validatedAt = readField(row, "validated_at");
  if (
    readField(row, "provider") !== provider ||
    typeof hint !== "string" ||
    !ACCOUNT_LLM_KEY_HINT_PATTERN.test(hint) ||
    !isIsoTimestamp(createdAt) ||
    !isIsoTimestamp(validatedAt)
  ) {
    throw new AccountLlmKeyStoreError();
  }
  return {
    provider,
    hint,
    createdAt: new Date(createdAt).toISOString(),
    validatedAt: new Date(validatedAt).toISOString(),
  };
}

/** Hint-only read. Safe to answer to the account owner. */
export async function fetchAccountLlmKeySummary(
  client: SupabaseClient,
  userId: string,
  provider: AccountLlmProvider,
): Promise<AccountLlmKeySummaryOutcome> {
  try {
    const { data, error } = await client
      .from(ACCOUNT_LLM_KEYS_TABLE)
      .select(ACCOUNT_LLM_KEY_SUMMARY_COLUMNS)
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) return { ok: false, error };
    if (!data) return { ok: true, summary: null };
    return { ok: true, summary: toSummary(data, provider) };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Sealed read for the server path that is about to open the envelope. Never
 * call this from anything that serialises its result into a response.
 */
export async function fetchSealedAccountLlmKey(
  client: SupabaseClient,
  userId: string,
  provider: AccountLlmProvider,
): Promise<SealedAccountLlmKeyOutcome> {
  try {
    const { data, error } = await client
      .from(ACCOUNT_LLM_KEYS_TABLE)
      .select(SEALED_COLUMNS)
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) return { ok: false, error };
    if (!data) return { ok: true, record: null };
    const summary = toSummary(data, provider);
    const ciphertext = readField(data, "ciphertext");
    const iv = readField(data, "iv");
    if (typeof ciphertext !== "string" || typeof iv !== "string") {
      throw new AccountLlmKeyStoreError();
    }
    return { ok: true, record: { ...summary, ciphertext, iv } };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Store or replace the sealed key for one account and provider.
 *
 * `created_at` is deliberately absent from the written row: on a replace the
 * column keeps the original value, so the account page can still say since
 * when this account has had a key stored. `validated_at` is server-supplied
 * rather than defaulted, because it means "last answered a provider call",
 * which only the caller that made that call knows.
 */
export async function upsertAccountLlmKey(
  client: SupabaseClient,
  input: {
    readonly userId: string;
    readonly provider: AccountLlmProvider;
    readonly sealed: SealedAccountKey;
    readonly validatedAt: string;
  },
): Promise<AccountLlmKeyWriteOutcome> {
  try {
    const { data, error } = await client
      .from(ACCOUNT_LLM_KEYS_TABLE)
      .upsert(
        {
          user_id: input.userId,
          provider: input.provider,
          ciphertext: input.sealed.ciphertext,
          iv: input.sealed.iv,
          hint: input.sealed.hint,
          validated_at: input.validatedAt,
        },
        { onConflict: "user_id,provider" },
      )
      .select(ACCOUNT_LLM_KEY_SUMMARY_COLUMNS)
      .maybeSingle();
    if (error) return { ok: false, error };
    if (!data) throw new AccountLlmKeyStoreError();
    return { ok: true, summary: toSummary(data, input.provider) };
  } catch (error) {
    return { ok: false, error };
  }
}

/** Remove the stored key. Deleting a key that is not there is not an error. */
export async function deleteAccountLlmKey(
  client: SupabaseClient,
  userId: string,
  provider: AccountLlmProvider,
): Promise<AccountLlmKeyDeleteOutcome> {
  try {
    const { data, error } = await client
      .from(ACCOUNT_LLM_KEYS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider)
      .select("provider");
    if (error) return { ok: false, error };
    return { ok: true, deleted: Array.isArray(data) && data.length > 0 };
  } catch (error) {
    return { ok: false, error };
  }
}
