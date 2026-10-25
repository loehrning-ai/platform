/** Data parity: every constant of "Die Fragekarte" against the Workshop 03 kit files. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_ACCOUNTS,
  CLAUDE_ANSWER,
  ENDING_MRR,
  EXPORT_ROWS,
  EXPORT_TABLES,
  LOAD_UTC,
  NET_NEW_2026,
  OPENING_DEC_2025,
  STATUS,
  TABLE_TRAPS,
  WARN_AFTER_H,
} from "./data";
import { monthlyTotals } from "./logic";

const KIT = join(__dirname, "../../../../public/workshops/datenbereitschaft-fuer-ki/data-readiness-kit");
const read = (path: string): string => readFileSync(join(KIT, path), "utf8");

function csv(path: string): Record<string, string>[] {
  const [header = "", ...lines] = read(path).trim().split("\n");
  const keys = header.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [keys[index], value])));
}

const summary = csv("builder/claude/project/mrr_summary_monthly.csv");
const row = (month: string) => summary.find((candidate) => candidate.month_start === `${month}-01`);

describe("FOLDLINE against the kit", () => {
  it("pins the opening level, the changes and the levels to the approved view", () => {
    expect(Number(row("2025-12")?.ending_mrr_eur)).toBe(OPENING_DEC_2025);
    const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
    expect(months.map((month) => Number(row(month)?.net_new_mrr_eur))).toEqual(NET_NEW_2026);
    for (const [month, level] of Object.entries(ENDING_MRR)) expect(Number(row(month)?.ending_mrr_eur), month).toBe(level);
    for (const [month, count] of Object.entries(ACTIVE_ACCOUNTS)) expect(Number(row(month)?.active_accounts), month).toBe(count);
  });

  it("holds the 18 export rows of monthly_revenue.csv, and each month adds up to the close (6 of 6)", () => {
    const rows = csv("builder/claude-demo/A-export-tables/monthly_revenue.csv");
    expect(rows.map((entry) => ({ dt: entry.dt, segment: entry.segment, amount: Number(entry.amount) }))).toEqual(EXPORT_ROWS);
    expect([...monthlyTotals(EXPORT_ROWS).values()]).toEqual(NET_NEW_2026);
  });

  it("holds the status column of customer_master.csv in file order", () => {
    const codes = csv("builder/claude-demo/A-export-tables/customer_master.csv").map((entry) => entry.status).join("");
    expect(codes).toBe(STATUS);
    const count = (code: string) => [...STATUS].filter((value) => value === code).length;
    expect([STATUS.length, count("A"), count("C"), count("N")]).toEqual([144, 108, 12, 24]);
  });

  it("quotes Claude's recorded answer from the run log", () => {
    const log = read("builder/claude-demo/AI-RUN-LOG.md");
    expect(log).toContain(CLAUDE_ANSWER.map((value) => value.toLocaleString("en-US")).join(" / "));
    expect(log).toContain("MRR added since 1 Jan 2026, not total MRR");
    expect(log).toContain("said 120 active at 30 June");
  });

  it("names the seven export tables and the three traps as the kit does", () => {
    const sql = read("builder/warehouse/sql/10_export_lane.sql");
    for (const table of EXPORT_TABLES) expect(sql).toContain(`CREATE TABLE public.${table} (`);
    const patterns = read("builder/ANTI-PATTERNS.md");
    for (const [table, id] of Object.entries(TABLE_TRAPS)) {
      const line = patterns.split("\n").find((entry) => entry.startsWith(`| ${id} |`));
      expect(line, id).toContain(table);
    }
  });

  it("takes the load time and the warning threshold from data_status_by_view.csv", () => {
    const status = csv("builder/claude/project/data_status_by_view.csv").find((entry) => entry.view_name === "analytics.mrr_summary_monthly");
    expect(status?.data_loaded_at_utc).toBe(LOAD_UTC);
    expect(Number(status?.warn_after_hours)).toBe(WARN_AFTER_H);
    expect(status?.hard_expiry_hours).toBe("");
  });
});
