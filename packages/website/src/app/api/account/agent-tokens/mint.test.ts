/**
 * Minting one personal access token.
 *
 * The assertions deliberately check the minted value against the resolver's
 * own predicates and against the database CHECK constraints, so a token this
 * route produces cannot be one the resolver refuses or the table rejects.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  hashPersonalAccessToken,
  isPersonalAccessToken,
  PERSONAL_ACCESS_TOKEN_PREFIX,
} from "@/lib/agent-access/personal-tokens";
import {
  MAX_ACTIVE_AGENT_ACCESS_TOKENS,
  mintPersonalAccessToken,
} from "./mint";

const MIGRATION = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260905120000_add_agent_access_tokens.sql",
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
