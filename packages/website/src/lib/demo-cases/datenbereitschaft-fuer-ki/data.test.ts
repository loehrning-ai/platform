/** Data parity: every constant of "Die Fragekarte" against the Workshop 03 kit files. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_ACCOUNTS,
  CLAUDE_ANSWER,
  ENDING_MRR,
  REHEARSAL_RUNS,
  RUN2_ACTIVE,
  SUMMARY,
  T1_EXPECTED,
  EXPORT_ROWS,
  EXPORT_TABLES,
  NET_NEW_2026,
  OPENING_DEC_2025,
  STATUS,
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

  it("names the seven export tables as the kit does", () => {
    const sql = read("builder/warehouse/sql/10_export_lane.sql");
    for (const table of EXPORT_TABLES) expect(sql).toContain(`CREATE TABLE public.${table} (`);
  });

  it("holds the approved view row for row, and the tub starts empty in January 2025", () => {
    expect(summary.map((entry) => ({ month: entry.month_start?.slice(0, 7), ending: Number(entry.ending_mrr_eur), netNew: Number(entry.net_new_mrr_eur), active: Number(entry.active_accounts) }))).toEqual(SUMMARY);
    const first = SUMMARY[0];
    expect(first?.ending).toBe(first?.netNew);
    expect(SUMMARY.filter((entry) => entry.month.startsWith("2025")).reduce((sum, entry) => sum + entry.netNew, 0)).toBe(OPENING_DEC_2025);
  });

  it("shows both rehearsal runs as the log records them", () => {
    const log = read("builder/claude-demo/AI-RUN-LOG.md");
    const line = (run: number) => log.split("\n").find((entry) => entry.startsWith("| rehearsal | Claude chat") && entry.includes(`| A | G01 | ${run} |`)) ?? "";
    for (const run of REHEARSAL_RUNS) {
      expect(line(run.run)).toContain(run.values.map((value) => value.toLocaleString("en-US")).join(" / "));
      expect(line(run.run)).toContain(`**${run.caveat}** the table`);
      if (run.quote) expect(line(run.run)).toContain(`("${run.quote}")`);
    }
    expect(line(1)).toContain("Flagged that April falls while accounts grow.");
    expect(line(2)).toContain(`said ${RUN2_ACTIVE} active at 30 June`);
    expect(Number(row("2026-03")?.active_accounts)).toBe(RUN2_ACTIVE);
    const refusal = log.split("\n").find((entry) => entry.includes("| B | R02 | 1 |")) ?? "";
    expect(refusal).toContain("true then, false now");
  });

  it("takes test T1 from the finance close, the same values in all three kit files", () => {
    const de = read("claude/PRUEFLISTE-VORLAGE.md").split("\n").find((entry) => entry.startsWith("| T1 |")) ?? "";
    const en = read("claude/TEST-LIST-TEMPLATE.md").split("\n").find((entry) => entry.startsWith("| T1 |")) ?? "";
    expect(de).toContain(T1_EXPECTED.map((value) => value.toLocaleString("de-DE")).join(" / "));
    expect(de).toContain("| Monatsabschluss Finanzen |");
    expect(en).toContain(T1_EXPECTED.map((value) => value.toLocaleString("en-US")).join(" / "));
    expect(en).toContain("| Finance month-end close |");
    const truth = read("builder/claude-demo/CHECK-YOUR-RESULT.md");
    for (const value of T1_EXPECTED) expect(truth).toContain(`**${value.toLocaleString("en-US")}**`);
    expect(T1_EXPECTED).toEqual([ENDING_MRR["2026-04"], ENDING_MRR["2026-05"], ENDING_MRR["2026-06"]]);
  });
});
