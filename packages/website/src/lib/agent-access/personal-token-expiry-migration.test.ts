import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contract for the migration that gives every personal access token an expiry
 * and lets the bearer resolver refuse the token of a banned or soft-deleted
 * account. The behaviour itself is exercised against a real Postgres in the
 * F5 verification; these assertions keep the statements from drifting.
 */

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");
const FILE = "20260927100200_add_agent_access_token_expiry.sql";

/** SQL without `--` comments, lowercased and whitespace-collapsed. */
function statements(name: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, name), "utf8")
    .toLowerCase()
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n")
    .replace(/\s+/g, " ");
}

describe("personal access token expiry", () => {
  const sql = statements(FILE);

  it("adds expires_at, backfills it, then makes it mandatory", () => {
    const add = sql.indexOf(
      "alter table public.agent_access_tokens add column if not exists expires_at timestamptz;",
    );
    const backfill = sql.indexOf(
      "update public.agent_access_tokens set expires_at =",
    );
    const notNull = sql.indexOf(
      "alter table public.agent_access_tokens alter column expires_at set not null;",
    );
    expect(add).toBeGreaterThanOrEqual(0);
    expect(backfill).toBeGreaterThan(add);
    expect(notNull).toBeGreaterThan(backfill);
    // Only rows without an expiry are touched, so a replay changes nothing.
    expect(sql).toContain("where expires_at is null;");
  });

  it("backfills to the default lifetime, with a month's notice, under the ceiling", () => {
    expect(sql).toContain(
      "set expires_at = least( created_at + interval '365 days', greatest( created_at + interval '90 days', pg_catalog.now() + interval '30 days' ) )",
    );
  });

  it("bounds every expiry to after creation and at most 366 days later", () => {
    expect(sql).toContain(
      "add constraint agent_access_tokens_expires_at_check check ( expires_at > created_at and expires_at <= created_at + interval '366 days' );",
    );
    expect(sql).toContain(
      "drop constraint if exists agent_access_tokens_expires_at_check;",
    );
  });

  it("defaults to the 90-day lifetime so the mint route live during the deploy keeps working", () => {
    expect(sql).toContain(
      "alter column expires_at set default (pg_catalog.now() + interval '90 days');",
    );
  });

  it("lets the owner read the expiry and still never the digest", () => {
    const grants = [...sql.matchAll(/grant select \(([^)]*)\) on table public\.agent_access_tokens to (\w+)/g)];
    expect(grants.map(([, columns, role]) => [columns?.trim(), role])).toEqual([
      ["expires_at", "authenticated"],
    ]);
    expect(sql).not.toContain("token_hash");
    expect(sql).not.toMatch(/grant select on table public\.agent_access_tokens/);
    expect(sql).not.toMatch(
      /grant [^;]*\b(insert|update|delete|all)\b[^;]*to (anon|authenticated|public)/,
    );
  });
});

describe("personal access token owner standing", () => {
  const sql = statements(FILE);

  it("is a pinned-search-path security definer returning a boolean", () => {
    expect(sql).toContain(
      "create or replace function public.agent_access_token_owner_active( p_user_id uuid ) returns boolean language sql stable security definer set search_path = ''",
    );
  });

  it("answers true only for an existing account that is neither banned nor soft-deleted", () => {
    expect(sql).toContain("select exists (");
    expect(sql).toContain("from auth.users as u");
    expect(sql).toContain("where u.id = p_user_id");
    expect(sql).toContain(
      "and (u.banned_until is null or u.banned_until <= pg_catalog.now())",
    );
    expect(sql).toContain("and u.deleted_at is null");
  });

  it("applies the same account conditions as the OAuth session liveness check", () => {
    const liveness = statements(
      "20260927100100_add_agent_oauth_session_liveness.sql",
    );
    for (const condition of [
      "(u.banned_until is null or u.banned_until <= pg_catalog.now())",
      "u.deleted_at is null",
    ]) {
      expect(liveness).toContain(condition);
      expect(sql).toContain(condition);
    }
  });

  it("is executable by the service role only", () => {
    expect(sql).toContain(
      "revoke all on function public.agent_access_token_owner_active(uuid) from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.agent_access_token_owner_active(uuid) to service_role;",
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.agent_access_token_owner_active\(uuid\) to [^;]*\b(anon|authenticated|public)\b/,
    );
  });
});
