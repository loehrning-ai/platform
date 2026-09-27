import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A personal access token is only ever recognised, never recovered. These
 * tests hold that line: the clear value reaches nothing but a digest, the
 * digest column is never selected back out, a revoked row stops working, and
 * a failed lookup never turns into an accepted credential.
 *
 * vi.mock is hoisted, so the factories below delegate to handles configured
 * per test.
 */

const mockReportApiError = vi.fn<(report: unknown) => void>();
const mockAfter = vi.fn<(task: () => unknown) => void>((task) => {
  void task();
});

const mockMaybeSingle = vi.fn<() => Promise<unknown>>(async () => ({
  data: null,
  error: null,
}));
const mockSelectEq = vi.fn<(column: string, value: string) => unknown>(() => ({
  maybeSingle: () => mockMaybeSingle(),
}));
const mockSelect = vi.fn<(columns: string) => unknown>(() => ({
  eq: (column: string, value: string) => mockSelectEq(column, value),
}));
const mockUpdateEq = vi.fn<(column: string, value: string) => Promise<unknown>>(
  async () => ({ error: null }),
);
const mockUpdate = vi.fn<(patch: Record<string, unknown>) => unknown>(() => ({
  eq: (column: string, value: string) => mockUpdateEq(column, value),
}));
const mockFrom = vi.fn<(table: string) => unknown>(() => ({
  select: (columns: string) => mockSelect(columns),
  update: (patch: Record<string, unknown>) => mockUpdate(patch),
}));
const mockTryCreateServiceClient = vi.fn<() => unknown>(() => ({
  from: (table: string) => mockFrom(table),
}));

vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockTryCreateServiceClient(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (report: unknown) => mockReportApiError(report),
}));
vi.mock("next/server", () => ({
  after: (task: () => unknown) => mockAfter(task),
}));

import {
  AGENT_ACCESS_TOKENS_TABLE,
  hashPersonalAccessToken,
  isPersonalAccessToken,
  lookupPersonalAccessToken,
  personalAccessTokenDisplayPrefix,
  PERSONAL_ACCESS_TOKEN_SECRET_LENGTH,
} from "./personal-tokens";

const OWNER = "3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const TOKEN_ID = "6d2c8f1e-8a4b-4c2d-9e1f-0a1b2c3d4e5f";
const PERSONAL_TOKEN = "lat_obviously-fake-personal-access-token-abcdef";
/** Independent vector: `printf '%s' "<token>" | shasum -a 256`. */
const PERSONAL_TOKEN_DIGEST =
  "1b58c0acc2fcf72d97837442ecb662cd398ecc41a407c5b4f35ff01c300f27b1";
const NOW = new Date("2026-09-05T12:00:00.000Z");

function tokenRow(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: TOKEN_ID,
      user_id: OWNER,
      name: "Laptop",
      revoked_at: null,
      ...overrides,
    },
    error: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMaybeSingle.mockImplementation(async () => ({ data: null, error: null }));
  mockSelectEq.mockImplementation(() => ({
    maybeSingle: () => mockMaybeSingle(),
  }));
  mockSelect.mockImplementation(() => ({
    eq: (column: string, value: string) => mockSelectEq(column, value),
  }));
  mockUpdateEq.mockImplementation(async () => ({ error: null }));
  mockUpdate.mockImplementation(() => ({
    eq: (column: string, value: string) => mockUpdateEq(column, value),
  }));
  mockFrom.mockImplementation(() => ({
    select: (columns: string) => mockSelect(columns),
    update: (patch: Record<string, unknown>) => mockUpdate(patch),
  }));
  mockTryCreateServiceClient.mockImplementation(() => ({
    from: (table: string) => mockFrom(table),
  }));
  mockAfter.mockImplementation((task) => {
    void task();
  });
});

describe("the token format", () => {
  it("accepts only the minted shape", () => {
    expect(PERSONAL_TOKEN.length).toBe(
      "lat_".length + PERSONAL_ACCESS_TOKEN_SECRET_LENGTH,
    );
    expect(isPersonalAccessToken(PERSONAL_TOKEN)).toBe(true);
    expect(isPersonalAccessToken("lat_short")).toBe(false);
    expect(isPersonalAccessToken(`${PERSONAL_TOKEN}x`)).toBe(false);
    expect(isPersonalAccessToken("pat_0123456789")).toBe(false);
    expect(isPersonalAccessToken(`lat_${"!".repeat(43)}`)).toBe(false);
  });

  it("derives a display prefix the account can show and the table accepts", () => {
    const prefix = personalAccessTokenDisplayPrefix(PERSONAL_TOKEN);

    expect(prefix).toBe("lat_obviousl");
    expect(prefix).toMatch(/^lat_[A-Za-z0-9_-]{4,32}$/);
    expect(PERSONAL_TOKEN.startsWith(prefix ?? "")).toBe(true);
    expect(personalAccessTokenDisplayPrefix("lat_nope")).toBeNull();
  });

  it("hashes to the documented SHA-256 digest", async () => {
    await expect(hashPersonalAccessToken(PERSONAL_TOKEN)).resolves.toBe(
      PERSONAL_TOKEN_DIGEST,
    );
  });
});

describe("lookupPersonalAccessToken", () => {
  it("recognises a token by its digest and records the use", async () => {
    mockMaybeSingle.mockImplementation(async () => tokenRow());

    const result = await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW);

    expect(result).toEqual({
      ok: true,
      userId: OWNER,
      client: "pat:Laptop",
    });
    expect(mockFrom).toHaveBeenCalledWith(AGENT_ACCESS_TOKENS_TABLE);
    expect(mockSelectEq).toHaveBeenCalledWith(
      "token_hash",
      PERSONAL_TOKEN_DIGEST,
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      last_used_at: NOW.toISOString(),
    });
    expect(mockUpdateEq).toHaveBeenCalledWith("id", TOKEN_ID);
  });

  it("never selects the stored digest back out of the table", async () => {
    mockMaybeSingle.mockImplementation(async () => tokenRow());

    await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW);

    const [columns] = mockSelect.mock.calls[0] as [string];
    expect(columns).toBe("id, user_id, name, revoked_at");
    expect(columns).not.toContain("token_hash");
  });

  it("refuses a revoked token and does not touch it", async () => {
    mockMaybeSingle.mockImplementation(async () =>
      tokenRow({ revoked_at: "2026-09-01T09:00:00.000Z" }),
    );

    expect(await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW)).toEqual({
      ok: false,
      reason: "revoked",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses a token that is not on file", async () => {
    expect(await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW)).toEqual({
      ok: false,
      reason: "unknown",
    });
  });

  it("refuses a value outside the minted shape without a lookup", async () => {
    expect(await lookupPersonalAccessToken("lat_tooshort", NOW)).toEqual({
      ok: false,
      reason: "unknown",
    });
    expect(mockTryCreateServiceClient).not.toHaveBeenCalled();
  });

  it("reports the store as unavailable when there is no service client", async () => {
    mockTryCreateServiceClient.mockReturnValue(null);

    expect(await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("reports the store as unavailable when the query fails", async () => {
    mockMaybeSingle.mockImplementation(async () => ({
      data: null,
      error: { message: "connection reset" },
    }));

    expect(await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW)).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "supabase-read" }),
    );
  });

  it("reports the store as unavailable when the query throws", async () => {
    mockMaybeSingle.mockImplementation(async () => {
      throw new Error("boom");
    });

    expect(await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("still recognises the token when the use cannot be recorded", async () => {
    mockMaybeSingle.mockImplementation(async () => tokenRow());
    mockUpdateEq.mockImplementation(async () => ({
      error: { message: "read only" },
    }));

    const result = await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW);

    expect(result.ok).toBe(true);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "supabase-write" }),
    );
  });

  it("records the use outside a request scope too", async () => {
    mockMaybeSingle.mockImplementation(async () => tokenRow());
    mockAfter.mockImplementation(() => {
      throw new Error("after() called outside a request scope");
    });

    expect((await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW)).ok).toBe(
      true,
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      last_used_at: NOW.toISOString(),
    });
  });

  it("never passes the clear token or its digest to error reporting", async () => {
    mockMaybeSingle.mockImplementation(async () => {
      throw new Error("boom");
    });

    await lookupPersonalAccessToken(PERSONAL_TOKEN, NOW);

    const reported = JSON.stringify(mockReportApiError.mock.calls);
    expect(reported).not.toContain(PERSONAL_TOKEN);
    expect(reported).not.toContain(PERSONAL_TOKEN_DIGEST);
  });
});
