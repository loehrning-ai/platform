/**
 * The vault is not exportable.
 *
 * A sealed provider key is the student's credential with a third party, not
 * their personal data in any useful sense: shipping it inside a data export
 * would turn one downloaded file into a spendable secret. The account export
 * therefore never reads public.account_llm_keys, and this suite is what keeps
 * that true when someone later adds a table to the export.
 *
 * Two independent guards. A behavioural one runs the real export route against
 * a store that would happily hand over a poisoned vault row, and a structural
 * one reads the route source, so a future export path that streams rows some
 * other way is still caught.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_LLM_KEYS_TABLE } from "./store";

const USER = "11111111-1111-4111-8111-111111111111";
const POISON_CIPHERTEXT = `${"z".repeat(60)}_-Ab`;
const POISON_HINT = "wxyz";
const POISON_IV = "abcdefghijklmnop";

const { mockGetUser, mockAuthClient, mockConsume, requestedTables } = vi.hoisted(
  () => ({
    mockGetUser: vi.fn<
      () => Promise<{
        configured: boolean;
        user: { id: string; email: string | null } | null;
      }>
    >(async () => ({
      configured: true,
      user: { id: "11111111-1111-4111-8111-111111111111", email: null },
    })),
    mockAuthClient: vi.fn<() => Promise<unknown>>(async () => ({
      id: "auth-client",
    })),
    mockConsume: vi.fn<() => Promise<boolean>>(async () => true),
    requestedTables: [] as string[],
  }),
);

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetUser(),
  createAuthServerClient: () => mockAuthClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: () => mockConsume(),
  hashedAuthenticatedRateLimitKey: async (namespace: string) =>
    `${namespace}:user-hmac-sha256-v1:${"b".repeat(64)}`,
  hashedClientRateLimitKey: async (namespace: string) =>
    `${namespace}:ip-hmac-sha256-v1:${"a".repeat(64)}`,
}));
vi.mock("@/lib/progress/server-store", () => ({
  fetchUnifiedProgressForUser: async () => ({
    ok: true,
    result: {
      progress: { schemaVersion: 3, courses: {} },
      updatedAt: "2026-09-01T10:00:00.000Z",
      courseResetAt: {},
      rawRows: [],
    },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => ({
    from(table: string) {
      requestedTables.push(table);
      const rows =
        table === "account_llm_keys"
          ? [
              {
                user_id: "11111111-1111-4111-8111-111111111111",
                provider: "anthropic",
                ciphertext: `${"z".repeat(60)}_-Ab`,
                iv: "abcdefghijklmnop",
                hint: "wxyz",
              },
            ]
          : [];
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        range: () => builder,
        then: (
          onFulfilled: (value: unknown) => unknown,
          onRejected: (reason: unknown) => unknown,
        ) =>
          Promise.resolve({
            data: rows,
            error: null,
            count: rows.length,
          }).then(onFulfilled, onRejected),
      };
      return builder;
    },
  }),
}));

import { GET } from "@/app/api/account/export/route";

beforeEach(() => {
  requestedTables.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("account data export", () => {
  it("never reads the vault and never carries a sealed key", async () => {
    const response = await GET(
      new Request("http://localhost/api/account/export", {
        headers: { "x-loehrning-expected-owner-id": USER },
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.text();

    // The store would have answered with a vault row. The export never asks.
    expect(requestedTables).not.toContain(ACCOUNT_LLM_KEYS_TABLE);
    expect(requestedTables.length).toBeGreaterThan(0);

    expect(body).toContain('"export_complete": true');
    expect(body).not.toContain(POISON_CIPHERTEXT);
    expect(body).not.toContain(POISON_IV);
    expect(body).not.toContain(ACCOUNT_LLM_KEYS_TABLE);
    expect(body).not.toContain("ciphertext");
    // The hint is short and could appear by chance in a base64 blob, so assert
    // on the field name that would carry it rather than on the value alone.
    expect(body).not.toContain(`"hint"`);
    expect(body).not.toContain(`"${POISON_HINT}"`);
  });

  it("keeps the vault out of the export route by construction", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/account/export/route.ts"),
      "utf8",
    );
    for (const forbidden of [
      ACCOUNT_LLM_KEYS_TABLE,
      "llm-key",
      "llmKey",
      "ciphertext",
      "ACCOUNT_LLM_KEK",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
