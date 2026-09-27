import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contract for the two migrations that keep OAuth client tokens inside the
 * boundary the consent screen promises: no account-table reads through the
 * Data API, and no agent access once the grant's Auth session has ended.
 */

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");

function migration(name: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, name), "utf8").toLowerCase();
}

/** SQL without `--` comments, so assertions only ever match statements. */
function statements(sql: string): string {
  return sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n")
    .replace(/\s+/g, " ");
}

describe("restrictive RLS against OAuth client tokens", () => {
  const sql = statements(
    migration("20260927100000_restrict_oauth_client_tokens_on_account_tables.sql"),
  );

  it.each([
    "public.agent_access_tokens",
    "public.agent_access_events",
    "public.account_llm_keys",
  ])("adds a restrictive select policy to %s", (table) => {
    expect(sql).toContain(
      `create policy "no oauth client tokens" on ${table} as restrictive for select to authenticated using ((select auth.jwt() ->> 'client_id') is null);`,
    );
    // Replayable, like every policy in this directory.
    expect(sql).toContain(
      `drop policy if exists "no oauth client tokens" on ${table};`,
    );
  });

  it("touches exactly the three account tables and nothing else", () => {
    expect(sql.match(/create policy/g)).toHaveLength(3);
    expect(sql).not.toContain("user_course_progress");
    expect(sql).not.toMatch(/\bas permissive\b/);
    expect(sql).not.toMatch(/\b(grant|revoke|alter table|drop table)\b/);
  });
});

describe("OAuth session liveness function", () => {
  const sql = statements(
    migration("20260927100100_add_agent_oauth_session_liveness.sql"),
  );

  it("is a pinned-search-path security definer returning a boolean", () => {
    expect(sql).toContain(
      "create or replace function public.agent_oauth_session_live( p_session_id uuid, p_user_id uuid ) returns boolean language sql stable security definer set search_path = ''",
    );
  });

  it("answers only for a live session of the same, active user", () => {
    expect(sql).toContain("from auth.sessions as s");
    expect(sql).toContain("join auth.users as u on u.id = s.user_id");
    expect(sql).toContain("where s.id = p_session_id");
    expect(sql).toContain("and s.user_id = p_user_id");
    expect(sql).toContain(
      "and (s.not_after is null or s.not_after > pg_catalog.now())",
    );
    expect(sql).toContain(
      "and (u.banned_until is null or u.banned_until <= pg_catalog.now())",
    );
    expect(sql).toContain("and u.deleted_at is null");
    expect(sql).toContain("select exists (");
  });

  it("is executable by the service role only", () => {
    expect(sql).toContain(
      "revoke all on function public.agent_oauth_session_live(uuid, uuid) from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.agent_oauth_session_live(uuid, uuid) to service_role;",
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.agent_oauth_session_live\(uuid, uuid\) to [^;]*\b(anon|authenticated|public)\b/,
    );
  });
});
