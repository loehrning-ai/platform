import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");
const REPOSITORY_ROOT = resolve(process.cwd(), "../..");

function migration(name: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, name), "utf8").toLowerCase();
}

describe("production database migration contract", () => {
  it("uses migration versions that match the live Supabase history", () => {
    expect(
      readdirSync(MIGRATIONS_DIR)
        .filter((name) => name.endsWith(".sql"))
        .sort(),
    ).toEqual([
      "20260716160504_004_user_course_progress.sql",
      "20260716160506_006_assessment_runs.sql",
      "20260716160507_20260714182753_feedback_retention.sql",
      "20260716160837_003_rate_limits.sql",
      "20260716160839_005_drop_scan_insight_cache.sql",
      "20260716160842_008_feedback.sql",
      "20260723163401_009_user_course_progress_per_course.sql",
      "20260723163429_harden_data_api_boundaries.sql",
      "20260723164006_optimize_rls_and_foreign_keys.sql",
      "20260728190500_drop_dormant_assessment_browser_policies.sql",
      "20260728235900_close_retention_and_legacy_data_gaps.sql",
      "20260730010000_retire_unkeyed_rate_limit_identifiers.sql",
      "20260813000000_add_usage_budget_counter.sql",
      "20260905120000_add_agent_access_tokens.sql",
      "20260905120100_add_agent_access_events.sql",
      "20260905120200_add_account_llm_keys.sql",
    ]);
  });

  it("never drops the live progress table during the per-course transition", () => {
    const sql = migration(
      "20260723163401_009_user_course_progress_per_course.sql",
    );
    expect(sql).not.toMatch(/\bdrop\s+table\b/);
    expect(sql).toContain("user_course_progress_v4_legacy");
    expect(sql).toContain("on conflict (user_id, course_slug) do nothing");
    expect(sql).toContain("grant select on table public.user_course_progress");
    expect(sql).not.toContain(
      "grant select, insert, update, delete on table public.user_course_progress",
    );
  });

  it("revokes direct mutation and worker-function access from browser roles", () => {
    const sql = migration("20260723163429_harden_data_api_boundaries.sql");
    expect(sql).toContain(
      "revoke insert, update, delete on table public.user_course_progress",
    );
    expect(sql).toContain(
      "revoke execute on function public.rls_auto_enable()",
    );
    expect(sql).toContain(
      "alter function public.rate_limit_consume(text, integer, integer)",
    );
    expect(sql).toContain(
      "create or replace function public.journey_gdpr_cleanup()",
    );
    expect(sql).toContain("where expires_at < now() - interval '7 days'");
    expect(sql).toContain("delete from public.journey_consultations");
    expect(sql).toContain(
      "drop table if exists public.zz_legacy_rate_limits_businesssite",
    );
    expect(sql).toContain("create extension if not exists pg_cron");
    expect(sql).toContain("'journey-gdpr-cleanup-daily'");
    expect(sql).toContain("revoke execute on functions from public");
    expect(sql).toContain(
      "revoke execute on functions from anon, authenticated",
    );
    expect(sql).toContain(
      "alter default privileges for role postgres\n  revoke execute on functions",
    );
    expect(sql).not.toContain(
      "alter default privileges for role supabase_admin",
    );
  });

  it("optimizes RLS evaluation without widening who can read a row", () => {
    const sql = migration("20260723164006_optimize_rls_and_foreign_keys.sql");

    // The whole point of the rewrite: `auth.uid()` called bare is re-evaluated
    // once per row, while `(select auth.uid())` is evaluated once per
    // statement. Every occurrence must be wrapped or the migration bought
    // nothing.
    const calls = sql.match(/auth\.uid\(\)/g) ?? [];
    const wrapped = sql.match(/\(select auth\.uid\(\)\)/g) ?? [];
    expect(calls).not.toHaveLength(0);
    expect(wrapped).toHaveLength(calls.length);

    // Owner-scoped policies stay owner-scoped: a rewrite that dropped the
    // predicate would still parse, still be fast, and expose every row.
    const ownerScoped = [
      ...sql.matchAll(/to (\w+)\s+using \(\(select auth\.uid\(\)\)/g),
    ].map(([, role]) => role);
    expect(ownerScoped).not.toHaveLength(0);
    expect(new Set(ownerScoped)).toEqual(new Set(["authenticated"]));

    // `using (true)` is legitimate for service_role only — that key already
    // bypasses RLS and never reaches a browser. Note the clause order:
    // PostgreSQL writes `to <role>` before `using`, so an assertion written
    // the other way round matches nothing and passes vacuously.
    const unrestricted = [...sql.matchAll(/to (\w+)\s+using \(true\)/g)].map(
      ([, role]) => role,
    );
    expect(unrestricted).not.toHaveLength(0);
    expect(new Set(unrestricted)).toEqual(new Set(["service_role"]));

    // Recreating a policy must not become a privilege grant.
    expect(sql).not.toMatch(/^\s*grant\b/m);
    expect(sql).toContain("to_regclass('public.journey_leads')");
    expect(sql).toContain("to_regclass('public.journey_consultations')");
    expect(sql).toContain("to_regclass('public.daily_usage')");
    expect(sql).toContain("to_regclass('public.deep_analysis_jobs')");
    expect(sql).not.toContain(
      'create policy "users can insert own assessment_runs"',
    );

    // The foreign keys this migration exists to cover.
    expect(sql).toContain("assessment_answers_run_id_idx");
    expect(sql).toContain("assessment_answers_user_id_idx");
    expect(sql).toContain("assessment_runs_user_id_idx");
  });

  it("removes dormant assessment browser policies from already-migrated projects", () => {
    const sql = migration(
      "20260728190500_drop_dormant_assessment_browser_policies.sql",
    );
    expect(sql.match(/drop policy if exists/g)).toHaveLength(4);
    expect(sql).not.toContain("create policy");
    expect(sql).not.toMatch(/^\s*grant\b/m);
  });

  it("schedules feedback retention and drops legacy progress only after conversion proof", () => {
    const sql = migration(
      "20260728235900_close_retention_and_legacy_data_gaps.sql",
    );
    const readme = readFileSync(resolve(REPOSITORY_ROOT, "README.md"), "utf8");
    const environmentExample = readFileSync(
      resolve(process.cwd(), ".env.example"),
      "utf8",
    );
    expect(sql).toContain("'beta-feedback-retention-daily'");
    expect(sql).toContain("'29 3 * * *'");
    expect(sql).toContain("select public.prune_beta_feedback()");
    expect(readme).toContain("`beta-feedback-retention-daily`");
    expect(readme).toContain("`29 3 * * *`");
    expect(readme).not.toContain("prune-beta-feedback-daily");
    expect(environmentExample).toContain(
      "migration-created beta-feedback-retention-daily job",
    );
    expect(environmentExample).toContain("Do not create a second job manually");
    expect(sql).toContain(
      "to_regclass('private.user_course_progress_v4_legacy')",
    );
    expect(sql).toContain("current_progress.course_slug = '_meta'");
    expect(sql).toContain("jsonb_object_keys");
    expect(sql).not.toContain(
      "current_progress.updated_at > legacy.updated_at",
    );
    expect(
      sql.match(/current_progress\.created_at = legacy\.created_at/g),
    ).toHaveLength(2);
    expect(
      sql.match(/current_progress\.updated_at = legacy\.updated_at/g),
    ).toHaveLength(2);
    expect(sql).toMatch(
      /current_progress\.progress = jsonb_build_object\(\s*'schemaversion', 3,\s*'xp'/,
    );
    expect(sql).toMatch(
      /'slice',\s*legacy\.progress -> 'courses' -> source_course\.course_slug/,
    );
    expect(sql).not.toContain("coalesce(legacy.progress");
    expect(sql).toContain("drop table private.user_course_progress_v4_legacy");
    expect(sql).not.toMatch(/\bdrop\s+table\b[^;]*\bcascade\b/);
  });

  it("fails closed before destructive legacy cleanup when any source shape or byte is unproved", () => {
    const sql = migration(
      "20260728235900_close_retention_and_legacy_data_gaps.sql",
    );
    const dropIndex = sql.indexOf(
      "drop table private.user_course_progress_v4_legacy",
    );
    const requiredPreDropGuards = [
      "lock table private.user_course_progress_v4_legacy",
      "lock table public.user_course_progress in share mode",
      "unexpected source table columns",
      "missing or unexpected top-level keys",
      "legacy_row.progress -> 'schemaversion' is distinct from '2'::jsonb",
      "malformed root shape",
      "malformed checkpoints",
      "malformed badges",
      "malformed streak",
      "unknown course slug",
      "malformed course",
      "malformed workshop quiz",
      "malformed lesson",
      "malformed section list",
      "malformed exercise",
      "metadata conversion is not exact",
      "course conversion is not exact",
    ];

    expect(dropIndex).toBeGreaterThan(-1);
    for (const guard of requiredPreDropGuards) {
      const guardIndex = sql.indexOf(guard);
      expect(guardIndex, `missing guard: ${guard}`).toBeGreaterThan(-1);
      expect(guardIndex, `guard after DROP: ${guard}`).toBeLessThan(dropIndex);
    }

    expect(sql).toContain(
      "legacy_row.progress ?& array[\n        'schemaversion',\n        'courses',\n        'xp',\n        'checkpoints',\n        'badges',\n        'streak',\n        'lastactivity'",
    );
    expect(sql).toContain(
      "from jsonb_object_keys(legacy_row.progress) as root_key(key)",
    );
    expect(sql).toContain(
      "column_name::text || ':' || udt_name::text || ':' || is_nullable::text",
    );
  });

  it("retires only the obsolete deterministic rate-limit key formats", () => {
    const sql = migration(
      "20260730010000_retire_unkeyed_rate_limit_identifiers.sql",
    );
    expect(sql).toContain("delete from public.rate_limits");
    expect(sql).toContain(
      "^[a-z0-9-]{1,64}:(sha256|user-sha256):[0-9a-f]{64}$",
    );
    expect(sql).not.toContain("truncate");
    expect(sql).not.toContain("drop table");
    expect(sql).not.toContain("hmac-sha256-v1");
  });

  it("reserves multi-unit usage budgets atomically for service-role callers only", () => {
    const sql = migration("20260813000000_add_usage_budget_counter.sql");
    const pairStart = sql.indexOf(
      "create or replace function public.usage_budget_consume_pair",
    );
    const pairSql = sql.slice(pairStart);
    const pairOnlySql = pairSql.slice(
      0,
      pairSql.indexOf("create or replace function public.rate_limit_consume("),
    );

    expect(pairStart).toBeGreaterThan(-1);
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("on conflict (key) do update");
    expect(sql).toContain("public.rate_limits.count + _cost");
    expect(sql).toContain("current_count <= _max");
    expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(pairSql).toContain(
      "pg_catalog.hashtextextended(least(_caller_key, _global_key), 0)",
    );
    expect(pairSql).toContain(
      "pg_catalog.hashtextextended(greatest(_caller_key, _global_key), 0)",
    );
    expect(pairSql).toContain("_caller_key = _global_key");
    expect(pairOnlySql.match(/insert into public\.rate_limits/g)).toHaveLength(
      2,
    );
    expect(pairSql.indexOf("caller_count > _caller_max - _cost")).toBeLessThan(
      pairSql.indexOf("insert into public.rate_limits"),
    );
    expect(pairSql.indexOf("global_count > _global_max - _cost")).toBeLessThan(
      pairSql.indexOf("insert into public.rate_limits"),
    );
    expect(pairSql).not.toMatch(/\bexception\b/);
    expect(sql).toContain(
      "revoke all on function public.usage_budget_consume(text, integer, integer, integer)\n  from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.usage_budget_consume(text, integer, integer, integer)\n  to service_role",
    );
    expect(sql).toContain(
      "revoke all on function public.usage_budget_consume_pair(\n  text, text, integer, integer, integer, integer\n) from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.usage_budget_consume_pair(\n  text, text, integer, integer, integer, integer\n) to service_role",
    );
    expect(sql).toContain(
      "create or replace function public.rate_limit_consume_multi",
    );
    const singleStart = sql.indexOf(
      "create or replace function public.rate_limit_consume(",
    );
    const multiStart = sql.indexOf(
      "create or replace function public.rate_limit_consume_multi",
    );
    const singleSql = sql.slice(singleStart, multiStart);
    expect(singleStart).toBeGreaterThan(-1);
    expect(singleSql).toContain("_window_s is null");
    expect(singleSql).toContain("_max is null");
    expect(singleSql).toContain(
      "pg_catalog.pg_advisory_xact_lock(\n    pg_catalog.hashtextextended(_key, 0)",
    );
    expect(singleSql).toContain("if current_count >= _max then return false");
    expect(singleSql).toContain("on conflict (key) do update");
    expect(sql).toContain(
      "revoke all on function public.rate_limit_consume(text, integer, integer)\n  from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.rate_limit_consume(text, integer, integer)\n  to service_role",
    );
    expect(sql).toContain("current_max is null");
    expect(sql).toContain("from unnest(_keys) as entries(key)");
    expect(sql).toContain(
      "revoke all on function public.rate_limit_consume_multi(text[], integer, integer[])",
    );
    expect(sql).toContain(
      "grant execute on function public.rate_limit_consume_multi(text[], integer, integer[])",
    );
    expect(sql).not.toMatch(
      /\b(raw_prompt|user_id|ip_address|command_text|response_body)\b/,
    );
  });

  it("stores agent access tokens as a digest the browser role can never read", () => {
    const sql = migration("20260905120000_add_agent_access_tokens.sql");
    const createBlock = sql.slice(
      sql.indexOf("create table if not exists public.agent_access_tokens"),
      sql.indexOf("create index if not exists agent_access_tokens_"),
    );

    expect(createBlock).not.toHaveLength(0);
    expect(
      [
        ...createBlock.matchAll(
          /^ {2}([a-z_]+) (?:uuid|text|boolean|integer|timestamptz)/gm,
        ),
      ].map(([, column]) => column),
    ).toEqual([
      "id",
      "user_id",
      "name",
      "prefix",
      "token_hash",
      "created_at",
      "last_used_at",
      "revoked_at",
    ]);

    // The digest column accepts exactly one shape. A clear token, a JWT, or a
    // base64 blob cannot satisfy it, so a mint-route mistake fails at the
    // INSERT instead of persisting a usable credential.
    expect(createBlock).toContain("check (token_hash ~ '^[0-9a-f]{64}$')");
    expect(createBlock).toContain("unique (token_hash)");
    expect(createBlock).toContain(
      "check (prefix ~ '^lat_[a-za-z0-9_-]{4,32}$')",
    );
    expect(createBlock).toContain("check (char_length(name) between 1 and 64)");
    expect(createBlock).toContain(
      "user_id uuid not null references auth.users(id) on delete cascade",
    );

    expect(sql).toContain(
      "alter table public.agent_access_tokens enable row level security",
    );

    // Same authorization contract as public.user_course_progress: owner-scoped
    // reads for the browser role, statement-constant uid, writes service-role
    // only.
    const calls = sql.match(/auth\.uid\(\)/g) ?? [];
    const wrapped = sql.match(/\(select auth\.uid\(\)\)/g) ?? [];
    expect(calls).not.toHaveLength(0);
    expect(wrapped).toHaveLength(calls.length);
    expect(
      new Set(
        [...sql.matchAll(/to (\w+)\s+using \(\(select auth\.uid\(\)\)/g)].map(
          ([, role]) => role,
        ),
      ),
    ).toEqual(new Set(["authenticated"]));
    expect(
      new Set(
        [...sql.matchAll(/to (\w+)\s+using \(true\)/g)].map(([, role]) => role),
      ),
    ).toEqual(new Set(["service_role"]));
    expect(sql).toMatch(/for select\n {2}to authenticated/);
    expect(sql).not.toMatch(/for (insert|update|delete|all)\n {2}to authenticated/);

    // Column-level grant: the owner lists their own tokens, but no browser
    // result set can ever contain the verifier value.
    const browserGrant =
      /grant select \(([^)]*)\) on table public\.agent_access_tokens to authenticated/.exec(
        sql,
      );
    expect(browserGrant).not.toBeNull();
    const grantedColumns = (browserGrant?.[1] ?? "")
      .split(",")
      .map((column) => column.trim())
      .filter((column) => column.length > 0);
    expect(grantedColumns).not.toContain("token_hash");
    expect(new Set(grantedColumns)).toEqual(
      new Set([
        "id",
        "user_id",
        "name",
        "prefix",
        "created_at",
        "last_used_at",
        "revoked_at",
      ]),
    );
    expect(sql).not.toMatch(
      /grant select on table public\.agent_access_tokens/,
    );
    expect(sql).toContain(
      "revoke all on table public.agent_access_tokens\n  from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant all on table public.agent_access_tokens to service_role",
    );
    expect(sql).not.toMatch(
      /grant [^;]*\b(insert|update|delete)\b[^;]*to (anon|authenticated)/,
    );
  });

  it("keeps the agent audit trail free of arguments and results and prunes it after 30 days", () => {
    const sql = migration("20260905120100_add_agent_access_events.sql");
    const createBlock = sql.slice(
      sql.indexOf("create table if not exists public.agent_access_events"),
      sql.indexOf("create index if not exists agent_access_events_"),
    );

    expect(createBlock).not.toHaveLength(0);
    expect(
      [
        ...createBlock.matchAll(
          /^ {2}([a-z_]+) (?:uuid|text|boolean|integer|timestamptz)/gm,
        ),
      ].map(([, column]) => column),
    ).toEqual([
      "id",
      "user_id",
      "client",
      "tool",
      "ok",
      "duration_ms",
      "created_at",
    ]);

    // The point of the table: who ran what, not what was said. A column that
    // could hold caller text, provider output, or a credential must never be
    // added here.
    expect(createBlock).not.toMatch(
      /\b(arguments|payload|result|response|prompt|query|input|output|content|message|token|ip_address|user_agent)\b/,
    );
    expect(createBlock).toContain(
      "user_id uuid not null references auth.users(id) on delete cascade",
    );
    expect(createBlock).toContain(
      "check (char_length(client) between 1 and 96)",
    );
    expect(createBlock).toContain("check (char_length(tool) between 1 and 64)");
    expect(createBlock).toContain(
      "check (duration_ms between 0 and 600000)",
    );

    expect(sql).toContain(
      "alter table public.agent_access_events enable row level security",
    );
    const calls = sql.match(/auth\.uid\(\)/g) ?? [];
    const wrapped = sql.match(/\(select auth\.uid\(\)\)/g) ?? [];
    expect(calls).not.toHaveLength(0);
    expect(wrapped).toHaveLength(calls.length);
    expect(
      new Set(
        [...sql.matchAll(/to (\w+)\s+using \(\(select auth\.uid\(\)\)/g)].map(
          ([, role]) => role,
        ),
      ),
    ).toEqual(new Set(["authenticated"]));
    expect(
      new Set(
        [...sql.matchAll(/to (\w+)\s+using \(true\)/g)].map(([, role]) => role),
      ),
    ).toEqual(new Set(["service_role"]));

    // An audit trail the audited party can write is not an audit trail.
    expect(sql).toContain(
      "grant select on table public.agent_access_events to authenticated",
    );
    expect(sql).toContain(
      "revoke all on table public.agent_access_events\n  from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant all on table public.agent_access_events to service_role",
    );
    expect(sql).not.toMatch(
      /grant [^;]*\b(insert|update|delete)\b[^;]*to (anon|authenticated)/,
    );

    // Retention: same function shape and privilege contract as
    // public.prune_beta_feedback(), scheduled so it cannot depend on someone
    // remembering to create the job.
    expect(sql).toContain(
      "create or replace function public.prune_agent_access_events()",
    );
    expect(sql).toContain("security invoker");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("delete from public.agent_access_events");
    expect(sql).toContain("where created_at < now() - interval '30 days'");
    expect(sql).toContain(
      "revoke execute on function public.prune_agent_access_events()\n  from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.prune_agent_access_events() to service_role",
    );
    expect(sql).toContain("'agent-access-events-retention-daily'");
    expect(sql).toContain("select public.prune_agent_access_events()");
    expect(sql).toContain(
      "to_regprocedure('public.prune_agent_access_events()') is null",
    );

    // The job has to be documented where an operator looks, exactly like the
    // feedback job: a scheduled deletion nobody knows about is a deletion
    // nobody can verify, and a second hand-made job would double-run it.
    const readme = readFileSync(resolve(REPOSITORY_ROOT, "README.md"), "utf8");
    const environmentExample = readFileSync(
      resolve(process.cwd(), ".env.example"),
      "utf8",
    );
    expect(readme).toContain("`agent-access-events-retention-daily`");
    expect(readme).toContain("`41 3 * * *`");
    expect(environmentExample).toContain(
      "migration-created agent-access-events-retention-daily job",
    );
    expect(environmentExample).toContain("Do not create a second job manually");

    // Two daily retention jobs must not land on the same minute.
    const legacy = migration(
      "20260728235900_close_retention_and_legacy_data_gaps.sql",
    );
    const feedbackSchedule =
      /cron\.schedule\(\s*'beta-feedback-retention-daily',\s*'([^']+)'/.exec(
        legacy,
      )?.[1];
    const eventsSchedule =
      /cron\.schedule\(\s*'agent-access-events-retention-daily',\s*'([^']+)'/.exec(
        sql,
      )?.[1];
    expect(feedbackSchedule).toBeDefined();
    expect(eventsSchedule).toMatch(/^\d{1,2} \d{1,2} \* \* \*$/);
    expect(eventsSchedule).not.toEqual(feedbackSchedule);
  });

  it("lets the owner read the hint of a stored provider key and never the sealed bytes", () => {
    const sql = migration("20260905120200_add_account_llm_keys.sql");
    const createBlock = sql.slice(
      sql.indexOf("create table if not exists public.account_llm_keys"),
      sql.indexOf(
        "alter table public.account_llm_keys enable row level security",
      ),
    );

    expect(createBlock).not.toHaveLength(0);
    expect(
      [
        ...createBlock.matchAll(
          /^ {2}([a-z_]+) (?:uuid|text|boolean|integer|timestamptz)/gm,
        ),
      ].map(([, column]) => column),
    ).toEqual([
      "user_id",
      "provider",
      "ciphertext",
      "iv",
      "hint",
      "created_at",
      "validated_at",
    ]);

    // One key per account and provider, and the row dies with the account.
    expect(createBlock).toContain("primary key (user_id, provider)");
    expect(createBlock).toContain(
      "user_id uuid not null references auth.users(id) on delete cascade",
    );

    // Column shapes the writer in src/lib/llm-keys/envelope.ts produces. A
    // clear key, a JWT, or an empty string cannot satisfy them, so a sealing
    // mistake fails at the INSERT instead of persisting a readable credential.
    expect(createBlock).toContain("check (provider in ('anthropic'))");
    expect(createBlock).toContain(
      "check (ciphertext ~ '^[a-za-z0-9_-]{32,1024}$')",
    );
    expect(createBlock).toContain("check (iv ~ '^[a-za-z0-9_-]{16}$')");
    expect(createBlock).toContain("check (hint ~ '^[a-za-z0-9_-]{4}$')");

    expect(sql).toContain(
      "alter table public.account_llm_keys enable row level security",
    );

    // Same authorization contract as the other owner-scoped tables:
    // statement-constant uid, owner-scoped reads, service-role writes.
    const calls = sql.match(/auth\.uid\(\)/g) ?? [];
    const wrapped = sql.match(/\(select auth\.uid\(\)\)/g) ?? [];
    expect(calls).not.toHaveLength(0);
    expect(wrapped).toHaveLength(calls.length);
    expect(
      new Set(
        [...sql.matchAll(/to (\w+)\s+using \(\(select auth\.uid\(\)\)/g)].map(
          ([, role]) => role,
        ),
      ),
    ).toEqual(new Set(["authenticated"]));
    expect(
      new Set(
        [...sql.matchAll(/to (\w+)\s+using \(true\)/g)].map(([, role]) => role),
      ),
    ).toEqual(new Set(["service_role"]));
    expect(sql).toMatch(/for select\n {2}to authenticated/);
    expect(sql).not.toMatch(
      /for (insert|update|delete|all)\n {2}to authenticated/,
    );

    // The whole point of the table: the owner sees which key is stored, never
    // the key. Sealed bytes stay outside every browser-reachable result set,
    // so a future policy mistake cannot hand them to a client.
    const browserGrant =
      /grant select \(([^)]*)\) on table public\.account_llm_keys to authenticated/.exec(
        sql,
      );
    expect(browserGrant).not.toBeNull();
    const grantedColumns = (browserGrant?.[1] ?? "")
      .split(",")
      .map((column) => column.trim())
      .filter((column) => column.length > 0);
    expect(grantedColumns).not.toContain("ciphertext");
    expect(grantedColumns).not.toContain("iv");
    expect(new Set(grantedColumns)).toEqual(
      new Set(["user_id", "provider", "hint", "created_at", "validated_at"]),
    );
    expect(sql).not.toMatch(/grant select on table public\.account_llm_keys/);
    expect(sql).toContain(
      "revoke all on table public.account_llm_keys\n  from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant all on table public.account_llm_keys to service_role",
    );
    expect(sql).not.toMatch(
      /grant [^;]*\b(insert|update|delete)\b[^;]*to (anon|authenticated)/,
    );
  });
});
