/**
 * Data parity: every number of demo 03 against the Workshop 03 kit files.
 * Reads the CSVs, SEED-FACTS.md, PEOPLE-HEADCOUNT.md and people_headcount.sql;
 * never the deck's data-ev values.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENDING_MRR, FOLDLINE, FRESHNESS, HEADCOUNT, NET_NEW_MRR, type Month } from "./data";

const KIT = join(__dirname, "../../../../public/workshops/datenbereitschaft-fuer-ki/data-readiness-kit");
const read = (path: string): string => readFileSync(join(KIT, path), "utf8");

function csv(path: string): Record<string, string>[] {
  const [header, ...lines] = read(path).trim().split("\n");
  const keys = header.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [keys[index], value])));
}

describe("FOLDLINE against the kit CSVs", () => {
  const summary = csv("builder/claude/project/mrr_summary_monthly.csv");

  it("matches ending and net new MRR for March to June 2026", () => {
    for (const month of ["2026-03", "2026-04", "2026-05", "2026-06"] as Month[]) {
      const row = summary.find((candidate) => candidate.month_start === `${month}-01`);
      expect(row, month).toBeDefined();
      expect(Number(row!.ending_mrr_eur)).toBe(ENDING_MRR[month]);
      expect(Number(row!.net_new_mrr_eur)).toBe(NET_NEW_MRR[month]);
      expect(row!.data_loaded_at_utc).toBe(FRESHNESS.loadedAt);
    }
  });

  it("matches logo churn Q2 2026: 4 of 40 = 10.0 % per segment", () => {
    const churn = csv("builder/claude/project/logo_churn_by_segment_quarter.csv").filter(
      (row) => row.period_start === "2026-04-01",
    );
    expect(churn.map((row) => row.customer_segment)).toEqual([...FOLDLINE.segments]);
    for (const row of churn) {
      expect(Number(row.starting_accounts)).toBe(FOLDLINE.activeEndOfMarch);
      expect(Number(row.churned_accounts)).toBe(FOLDLINE.churnedQ2);
      expect(Number(row.logo_churn_rate_pct)).toBe(10);
    }
  });

  it("matches the data status: 36 h warning, no hard expiry, version 1.0.0, owner", () => {
    const status = csv("builder/claude/project/data_status_by_view.csv");
    expect(status.length).toBeGreaterThan(0);
    for (const row of status) {
      expect(Number(row.warn_after_hours)).toBe(FRESHNESS.warnAfterHours);
      expect(row.hard_expiry_hours).toBe("");
      expect(row.definition_version).toBe(FRESHNESS.definitionVersion);
      expect(row.owner_team).toBe(FRESHNESS.owner);
      expect(row.data_loaded_at_utc).toBe(FRESHNESS.loadedAt);
    }
    expect(status.map((row) => row.view_name)).toContain("analytics.mrr_summary_monthly");
    expect(status.map((row) => row.view_name)).toContain("analytics.account_mrr_monthly");
  });
});

describe("FOLDLINE against SEED-FACTS.md", () => {
  const facts = read("builder/warehouse/seed/SEED-FACTS.md");

  it("states the recorded answers and the export-lane checks", () => {
    expect(facts).toContain("−17,595");
    expect(facts).toContain("42,565 − 60,160");
    expect(facts).toContain("−19,960 / 9,775 / 42,565");
    expect(facts).toContain("0 of 0, no rate");
    expect(facts).toContain("| 27,055 |");
    expect(facts).toContain("32,380 − 225 − 5,100 = 27,055");
    expect(FOLDLINE.netNewQ2 + FOLDLINE.billingRetryDelta - FOLDLINE.billingPending).toBe(FOLDLINE.billingEventsQ2);
    expect(facts).toContain("1,066,140");
    expect(facts).toContain("4 of 48 = 8.33 %");
  });

  it("states 40 / 4 / 8 / 44 per segment, 144 accounts and the 06:00 load", () => {
    expect(facts).toContain("120 (40 per segment)");
    expect(facts).toContain("4 per segment");
    expect(facts).toContain("8 per segment");
    expect(facts).toContain("44 per segment = 40 − 4 + 8");
    expect(facts).toContain("144 business accounts");
    expect(facts).toContain("2026-07-01 06:00 UTC");
    expect(facts).toContain("2026-07-03 18:00 UTC, age 60 h");
    expect(facts).toContain("cited it 0 of 3");
  });

  it("never quotes a GENERATED MRR component", () => {
    const source = readFileSync(join(__dirname, "data.ts"), "utf8");
    for (const generated of ["48060", "48_060", "31130", "31_130", "10120", "10_120", "13330", "13_330"]) {
      expect(source).not.toContain(generated);
    }
  });
});

describe("the freshness and access facts", () => {
  it("matches CHECK-YOUR-RESULT: 60 h, 36 h, the invented 48 h expiry", () => {
    const check = read("builder/claude-demo/CHECK-YOUR-RESULT.md");
    expect(check).toContain("**60 h** old, over the 36 h warning threshold");
    expect(check).toContain("data older than 48 h is invalid");
    expect(check).toContain("computes age from today's real date");
  });

  it("matches FOLDLINE-SCENARIOS: SQLSTATE 42501 on the forced read", () => {
    const scenarios = read("FOLDLINE-SCENARIOS.md");
    expect(scenarios).toContain("`core.accounts.contact_email`");
    expect(scenarios).toContain(`SQLSTATE \`${FOLDLINE.sqlstateDenied}\``);
  });
});

describe("the transfer firm against the headcount pack", () => {
  const pack = read("builder/domains/PEOPLE-HEADCOUNT.md");
  const sql = read("builder/domains/sql/people_headcount.sql");

  it("states 19 ÷ 200 = 9.5 %, 9.34 %, 3.12 %, 9.8 %, 206, 25 and 19", () => {
    expect(pack).toContain("19 ÷ 200 = **9.5 %**");
    expect(pack).toContain("19 ÷ 203.5 = **9.34 %**");
    expect(pack).toContain("**3.12 %**");
    expect(pack).toContain("| | | 9.8 % |");
    expect(pack).toContain("**200 + 25 − 19 = 206.**");
    expect(pack).toContain("Hires 10 / 2 / 13 = **25**");
    expect(pack).toContain("leavers 4 / 6 / 9 = **19**");
    expect(pack).toContain("Mar 200 · Apr 206 · May 202 · Jun 206");
    expect(pack).toContain("Who left the Legal team in Q2?");
    expect(pack).toContain("HR system leaver list, counted independently");
  });

  it("lists the four department rows", () => {
    const labels = {
      engineering: "Engineering",
      sales: "Sales",
      support: "Customer Support",
      other: "Other departments (Finance 16 + Legal 4, merged)",
    } as const;
    for (const department of HEADCOUNT.departments) {
      const line = `| ${labels[department.id]} | ${department.start} | ${department.leavers} | ${department.ratePct.toFixed(1)} % |`;
      expect(pack, department.id).toContain(line);
    }
  });

  it("has the hc_monthly rows 2.00 / 2.91 / 4.46 and no leavers column", () => {
    expect(sql).toContain("(DATE '2026-04-01', 206, 2.00)");
    expect(sql).toContain("(DATE '2026-05-01', 202, 2.91)");
    expect(sql).toContain("(DATE '2026-06-01', 206, 4.46)");
    const start = sql.indexOf("CREATE TABLE export_lane.hc_monthly");
    const table = sql.slice(start, sql.indexOf(");", start)).replace(/--.*$/gm, "");
    expect(table).toMatch(/\bdt\b/);
    expect(table).toMatch(/\bhc\b/);
    expect(table).toMatch(/\battrition\b/);
    expect(table).not.toMatch(/leaver/i);
    expect(Object.values(HEADCOUNT.monthlyExportRatesPct)).toEqual([2.0, 2.91, 4.46]);
  });
});
