/**
 * Minting one personal access token.
 *
 * The assertions deliberately check the minted value against the resolver's
 * own predicates and against the database CHECK constraints, so a token this
 * route produces cannot be one the resolver refuses or the table rejects.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

// api-error.ts imports @sentry/nextjs at module scope, and loading that in
// the test runtime is not possible; every test that reaches it replaces it.
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));
import {
  hashPersonalAccessToken,
  isPersonalAccessToken,
  PERSONAL_ACCESS_TOKEN_PREFIX,
} from "@/lib/agent-access/personal-tokens";
import {
  AGENT_ACCESS_TOKEN_LIFETIME_DAYS,
  DEFAULT_AGENT_ACCESS_TOKEN_LIFETIME_DAYS,
  isAgentAccessTokenLifetime,
  MAX_ACTIVE_AGENT_ACCESS_TOKENS,
  mintPersonalAccessToken,
  personalAccessTokenExpiry,
} from "./mint";

const MIGRATION = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260905120000_add_agent_access_tokens.sql",
  ),
  "utf8",
);
const EXPIRY_MIGRATION = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260927100200_add_agent_access_token_expiry.sql",
  ),
  "utf8",
);

describe("mintPersonalAccessToken", () => {
  it("produces a token the bearer resolver recognises", async () => {
    const minted = await mintPersonalAccessToken();

    expect(minted.token.startsWith(PERSONAL_ACCESS_TOKEN_PREFIX)).toBe(true);
    expect(isPersonalAccessToken(minted.token)).toBe(true);
    expect(minted.token).toHaveLength(47);
  });

  it("stores a digest the resolver recomputes from the clear token", async () => {
    const minted = await mintPersonalAccessToken();

    expect(minted.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(minted.tokenHash).toBe(await hashPersonalAccessToken(minted.token));
    expect(minted.tokenHash).not.toContain(minted.token);
  });

  it("keeps the display prefix non-secret and short", async () => {
    const minted = await mintPersonalAccessToken();

    expect(minted.prefix).toBe(minted.token.slice(0, 12));
    expect(minted.prefix).not.toBe(minted.token);
    expect(isPersonalAccessToken(minted.prefix)).toBe(false);
  });

  it("satisfies the column constraints the migration declares", async () => {
    const minted = await mintPersonalAccessToken();

    expect(MIGRATION).toContain("check (prefix ~ '^lat_[A-Za-z0-9_-]{4,32}$')");
    expect(MIGRATION).toContain("check (token_hash ~ '^[0-9a-f]{64}$')");
    expect(/^lat_[A-Za-z0-9_-]{4,32}$/.test(minted.prefix)).toBe(true);
    expect(/^[0-9a-f]{64}$/.test(minted.tokenHash)).toBe(true);
  });

  it("never repeats a token", async () => {
    const minted = await Promise.all(
      Array.from({ length: 32 }, () => mintPersonalAccessToken()),
    );
    expect(new Set(minted.map((one) => one.token)).size).toBe(32);
    expect(new Set(minted.map((one) => one.tokenHash)).size).toBe(32);
  });

  it("caps an account at five live credentials", () => {
    expect(MAX_ACTIVE_AGENT_ACCESS_TOKENS).toBe(5);
  });
});

describe("personal access token lifetimes", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it("offers 30, 90 and 365 days and defaults to 90", () => {
    expect(AGENT_ACCESS_TOKEN_LIFETIME_DAYS).toEqual([30, 90, 365]);
    expect(DEFAULT_AGENT_ACCESS_TOKEN_LIFETIME_DAYS).toBe(90);
    expect(AGENT_ACCESS_TOKEN_LIFETIME_DAYS).toContain(
      DEFAULT_AGENT_ACCESS_TOKEN_LIFETIME_DAYS,
    );
  });

  it("stays inside the column CHECK and matches the column default", () => {
    // The CHECK is the ceiling; every offered lifetime keeps a day of
    // headroom under it for clock drift between app and database.
    expect(EXPIRY_MIGRATION).toContain(
      "expires_at <= created_at + interval '366 days'",
    );
    expect(EXPIRY_MIGRATION).toContain("expires_at > created_at");
    for (const days of AGENT_ACCESS_TOKEN_LIFETIME_DAYS) {
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(365);
    }
    expect(EXPIRY_MIGRATION).toContain(
      `set default (pg_catalog.now() + interval '${DEFAULT_AGENT_ACCESS_TOKEN_LIFETIME_DAYS} days')`,
    );
  });

  it("accepts only the offered numbers", () => {
    for (const days of AGENT_ACCESS_TOKEN_LIFETIME_DAYS) {
      expect(isAgentAccessTokenLifetime(days)).toBe(true);
    }
    for (const value of [0, -30, 7, 366, 90.5, "90", null, undefined, [90], NaN]) {
      expect(isAgentAccessTokenLifetime(value)).toBe(false);
    }
  });

  it("computes the expiry from the issue instant", () => {
    const issuedAt = new Date("2026-09-27T08:00:00.000Z");

    expect(personalAccessTokenExpiry(issuedAt, 30).toISOString()).toBe(
      "2026-10-27T08:00:00.000Z",
    );
    expect(
      personalAccessTokenExpiry(issuedAt, 365).getTime() - issuedAt.getTime(),
    ).toBe(365 * DAY_MS);
  });
});
