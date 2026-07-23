import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");

function migration(name: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, name), "utf8").toLowerCase();
}

describe("production database migration contract", () => {
  it("uses migration versions that match the live Supabase history", () => {
    expect(readdirSync(MIGRATIONS_DIR).sort()).toEqual([
      "20260716160504_004_user_course_progress.sql",
      "20260716160506_006_assessment_runs.sql",
      "20260716160507_20260714182753_feedback_retention.sql",
      "20260716160837_003_rate_limits.sql",
      "20260716160839_005_drop_scan_insight_cache.sql",
      "20260716160842_008_feedback.sql",
      "20260723150000_009_user_course_progress_per_course.sql",
      "20260723150137_harden_data_api_boundaries.sql",
    ]);
  });

  it("never drops the live progress table during the per-course transition", () => {
    const sql = migration(
      "20260723150000_009_user_course_progress_per_course.sql",
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
    const sql = migration("20260723150137_harden_data_api_boundaries.sql");
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
    expect(sql).toContain(
      "where expires_at < now() - interval '7 days'",
    );
    expect(sql).toContain(
      "delete from public.journey_consultations",
    );
    expect(sql).toContain(
      "drop table if exists public.zz_legacy_rate_limits_businesssite",
    );
    expect(sql).toContain("create extension if not exists pg_cron");
    expect(sql).toContain("'journey-gdpr-cleanup-daily'");
    expect(sql).toContain(
      "revoke execute on functions from public",
    );
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
});
