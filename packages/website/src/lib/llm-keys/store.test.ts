/**
 * Storage boundary for the vault.
 *
 * The suite pins which columns each read names, that a write never resets
 * created_at, and that the object handed back to callers is rebuilt field by
 * field, so a row carrying extra columns cannot smuggle sealed key material
 * into something a route might serialise.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_LLM_KEYS_TABLE,
  ACCOUNT_LLM_KEY_SUMMARY_COLUMNS,
  AccountLlmKeyStoreError,
  deleteAccountLlmKey,
  fetchAccountLlmKeySummary,
  fetchSealedAccountLlmKey,
  upsertAccountLlmKey,
} from "./store";

const USER = "11111111-1111-4111-8111-111111111111";
const CIPHERTEXT = `${"c".repeat(60)}_-Ab`;
const IV = "abcdefghijklmnop";

interface QueryRecord {
  table: string;
  select: string | null;
  filters: [string, unknown][];
  upsert: { row: Record<string, unknown>; options: unknown } | null;
  deleted: boolean;
  maybeSingle: boolean;
}

type QueryResult = { data: unknown; error: unknown };

function fakeClient(
  result: QueryResult | (() => never),
): { client: SupabaseClient; records: QueryRecord[] } {
  const records: QueryRecord[] = [];
  const client = {
    from(table: string) {
      const record: QueryRecord = {
        table,
        select: null,
        filters: [],
        upsert: null,
        deleted: false,
        maybeSingle: false,
      };
      records.push(record);
      const builder = {
        select(columns: string) {
          record.select = columns;
          return builder;
        },
        eq(column: string, value: unknown) {
          record.filters.push([column, value]);
          return builder;
        },
        upsert(row: Record<string, unknown>, options: unknown) {
          record.upsert = { row, options };
          return builder;
        },
        delete() {
          record.deleted = true;
          return builder;
        },
        maybeSingle() {
          record.maybeSingle = true;
          return builder;
        },
        then(
          onFulfilled: (value: QueryResult) => unknown,
          onRejected: (reason: unknown) => unknown,
        ) {
          if (typeof result === "function") {
            return Promise.resolve()
              .then(() => result() as never)
              .then(onFulfilled, onRejected);
          }
          return Promise.resolve(result).then(onFulfilled, onRejected);
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, records };
}

const STORED_ROW = {
  provider: "anthropic",
  hint: "wxyz",
  created_at: "2026-09-01T10:00:00.000Z",
  validated_at: "2026-09-04T11:30:00.000Z",
};

describe("fetchAccountLlmKeySummary", () => {
  it("names only the columns the browser role holds a grant for", async () => {
    const { client, records } = fakeClient({ data: STORED_ROW, error: null });
    const outcome = await fetchAccountLlmKeySummary(
      client,
      USER,
      "anthropic",
    );

    expect(records[0].table).toBe(ACCOUNT_LLM_KEYS_TABLE);
    expect(records[0].select).toBe(ACCOUNT_LLM_KEY_SUMMARY_COLUMNS);
    expect(records[0].select).not.toContain("ciphertext");
    expect(records[0].select).not.toContain("iv");
    expect(records[0].filters).toEqual([
      ["user_id", USER],
      ["provider", "anthropic"],
    ]);
    expect(records[0].maybeSingle).toBe(true);
    expect(outcome).toEqual({
      ok: true,
      summary: {
        provider: "anthropic",
        hint: "wxyz",
        createdAt: "2026-09-01T10:00:00.000Z",
        validatedAt: "2026-09-04T11:30:00.000Z",
      },
    });
  });

  it("answers null for an account without a stored key", async () => {
    const { client } = fakeClient({ data: null, error: null });
    await expect(
      fetchAccountLlmKeySummary(client, USER, "anthropic"),
    ).resolves.toEqual({ ok: true, summary: null });
  });

  it("returns a store failure instead of throwing", async () => {
    const { client } = fakeClient({
      data: null,
      error: { code: "PGRST301", message: "denied" },
    });
    const outcome = await fetchAccountLlmKeySummary(client, USER, "anthropic");
    expect(outcome.ok).toBe(false);
  });

  it("catches a client that throws rather than resolves", async () => {
    const { client } = fakeClient(() => {
      throw new Error("transport down");
    });
    const outcome = await fetchAccountLlmKeySummary(client, USER, "anthropic");
    expect(outcome.ok).toBe(false);
  });

  it("refuses a row that does not match the stored shape", async () => {
    const { client } = fakeClient({
      data: { ...STORED_ROW, hint: "not-a-valid-hint" },
      error: null,
    });
    const outcome = await fetchAccountLlmKeySummary(client, USER, "anthropic");
    expect(outcome.ok).toBe(false);
    expect(outcome.ok ? null : outcome.error).toBeInstanceOf(
      AccountLlmKeyStoreError,
    );
  });

  it("rebuilds the summary field by field so extra columns cannot leak", async () => {
    const { client } = fakeClient({
      data: { ...STORED_ROW, ciphertext: CIPHERTEXT, iv: IV },
      error: null,
    });
    const outcome = await fetchAccountLlmKeySummary(client, USER, "anthropic");

    expect(outcome.ok).toBe(true);
    const serialized = JSON.stringify(outcome);
    expect(serialized).not.toContain(CIPHERTEXT);
    expect(serialized).not.toContain(IV);
    expect(Object.keys(outcome.ok ? outcome.summary ?? {} : {}).sort()).toEqual([
      "createdAt",
      "hint",
      "provider",
      "validatedAt",
    ]);
  });
});

describe("fetchSealedAccountLlmKey", () => {
  it("reads the sealed columns for the server path that opens the envelope", async () => {
    const { client, records } = fakeClient({
      data: { ...STORED_ROW, ciphertext: CIPHERTEXT, iv: IV },
      error: null,
    });
    const outcome = await fetchSealedAccountLlmKey(client, USER, "anthropic");

    expect(records[0].select).toContain("ciphertext");
    expect(records[0].select).toContain("iv");
    expect(outcome).toEqual({
      ok: true,
      record: {
        provider: "anthropic",
        hint: "wxyz",
        createdAt: "2026-09-01T10:00:00.000Z",
        validatedAt: "2026-09-04T11:30:00.000Z",
        ciphertext: CIPHERTEXT,
        iv: IV,
      },
    });
  });

  it("refuses a row whose sealed columns are missing", async () => {
    const { client } = fakeClient({ data: STORED_ROW, error: null });
    const outcome = await fetchSealedAccountLlmKey(client, USER, "anthropic");
    expect(outcome.ok).toBe(false);
  });
});

describe("upsertAccountLlmKey", () => {
  it("writes exactly the sealed row and leaves created_at alone", async () => {
    const { client, records } = fakeClient({ data: STORED_ROW, error: null });
    const outcome = await upsertAccountLlmKey(client, {
      userId: USER,
      provider: "anthropic",
      sealed: { ciphertext: CIPHERTEXT, iv: IV, hint: "wxyz" },
      validatedAt: "2026-09-04T11:30:00.000Z",
    });

    expect(records[0].upsert?.row).toEqual({
      user_id: USER,
      provider: "anthropic",
      ciphertext: CIPHERTEXT,
      iv: IV,
      hint: "wxyz",
      validated_at: "2026-09-04T11:30:00.000Z",
    });
    // Replacing a key must not restate when the account first stored one.
    expect(records[0].upsert?.row).not.toHaveProperty("created_at");
    expect(records[0].upsert?.options).toEqual({
      onConflict: "user_id,provider",
    });
    expect(records[0].select).toBe(ACCOUNT_LLM_KEY_SUMMARY_COLUMNS);
    expect(outcome.ok && outcome.summary.hint).toBe("wxyz");
    expect(JSON.stringify(outcome)).not.toContain(CIPHERTEXT);
  });

  it("returns a failure when the write is rejected", async () => {
    const { client } = fakeClient({
      data: null,
      error: { code: "23514", message: "account_llm_keys_hint_check" },
    });
    const outcome = await upsertAccountLlmKey(client, {
      userId: USER,
      provider: "anthropic",
      sealed: { ciphertext: CIPHERTEXT, iv: IV, hint: "wxyz" },
      validatedAt: "2026-09-04T11:30:00.000Z",
    });
    expect(outcome.ok).toBe(false);
  });
});

describe("deleteAccountLlmKey", () => {
  it("removes one owner's key for one provider", async () => {
    const { client, records } = fakeClient({
      data: [{ provider: "anthropic" }],
      error: null,
    });
    const outcome = await deleteAccountLlmKey(client, USER, "anthropic");

    expect(records[0].deleted).toBe(true);
    expect(records[0].filters).toEqual([
      ["user_id", USER],
      ["provider", "anthropic"],
    ]);
    expect(outcome).toEqual({ ok: true, deleted: true });
  });

  it("treats a missing key as a successful deletion", async () => {
    const { client } = fakeClient({ data: [], error: null });
    await expect(
      deleteAccountLlmKey(client, USER, "anthropic"),
    ).resolves.toEqual({ ok: true, deleted: false });
  });

  it("returns a failure when the delete is rejected", async () => {
    const { client } = fakeClient({
      data: null,
      error: { code: "PGRST301", message: "denied" },
    });
    const outcome = await deleteAccountLlmKey(client, USER, "anthropic");
    expect(outcome.ok).toBe(false);
  });
});
