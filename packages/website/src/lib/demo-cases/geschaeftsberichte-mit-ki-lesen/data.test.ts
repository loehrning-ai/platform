import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFECTS, REVENUES, UNITS, WEEKS } from "./data";

const ZIP = join(process.cwd(), "public/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit.zip");
const READY = existsSync(ZIP);

function entry(name: string): string {
  return execFileSync("unzip", ["-p", ZIP, `northwind-analyst-kit/${name}`], { encoding: "utf8" });
}

function rows(csv: string): Record<string, string>[] {
  const [head, ...lines] = csv.trim().split(/\r?\n/);
  const keys = (head as string).split(",");
  return lines.map((line) => {
    // product_lines.csv quotes the colour list; no other field holds a comma.
    const cells = line.match(/("[^"]*"|[^,]*)(,|$)/g)?.map((cell) => cell.replace(/,$/, "").replace(/^"|"$/g, "")) ?? [];
    return Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""]));
  });
}

describe("embedded NORTHWIND data", () => {
  it("holds nine weeks, four in August and five in September by start date", () => {
    expect(WEEKS).toHaveLength(9);
    expect(WEEKS.filter((week) => week.start < "2023-09-01")).toHaveLength(4);
    expect(WEEKS.filter((week) => week.start >= "2023-09-01")).toHaveLength(5);
  });

  it("sums to the printed report totals", () => {
    const sum = (list: readonly number[]) => list.reduce((a, b) => a + b, 0);
    expect(sum(REVENUES.slice(0, 4))).toBe(17233647);
    expect(sum(REVENUES.slice(4))).toBe(21687544);
    expect(sum(UNITS.slice(0, 4))).toBe(110373);
    expect(sum(UNITS.slice(4))).toBe(139056);
  });

  it("defect rows add up to the report's September units per line", () => {
    const by = Object.fromEntries(DEFECTS.map((row) => [row.line, row]));
    expect(by.CRAFT?.sepUnits).toBe(9162);
    expect(by.AURA?.sepUnits).toBe(42197);
    expect(DEFECTS.map((row) => row.sepRecords)).toEqual([23, 19, 18, 11]);
  });

  it.skipIf(!READY)("re-derives every week and defect row from the kit CSVs", () => {
    const price = new Map(rows(entry("data/product_lines.csv")).map((r) => [`${r.line}-${r.model_code}`, Number(r.base_price_eur)]));
    const weeks = new Map<string, { revenueEur: number; units: number }>();
    const lineUnits = new Map<string, number>();
    const demand = rows(entry("data/demand_actuals.csv"));
    expect(demand).toHaveLength(2115);
    for (const r of demand) {
      const [, line, code] = (r.sku as string).split("-");
      const unitPrice = price.get(`${line}-${code}`);
      expect(unitPrice, r.sku).toBeGreaterThan(0);
      const units = Number(r.units_actual);
      const week = weeks.get(r.week_start as string) ?? { revenueEur: 0, units: 0 };
      weeks.set(r.week_start as string, { revenueEur: week.revenueEur + units * (unitPrice as number), units: week.units + units });
      const key = `${line}-${(r.week_start as string) < "2023-09-01" ? "aug" : "sep"}`;
      lineUnits.set(key, (lineUnits.get(key) ?? 0) + units);
    }
    expect([...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([start, w]) => ({ start, ...w }))).toEqual(
      WEEKS.map((week) => ({ ...week })),
    );
    const records = new Map<string, number>();
    for (const r of rows(entry("data/ncr_records.csv"))) {
      const key = `${r.line}-${(r.ncr_date as string) < "2023-09-01" ? "aug" : "sep"}`;
      records.set(key, (records.get(key) ?? 0) + 1);
    }
    for (const row of DEFECTS) {
      expect(records.get(`${row.line}-aug`), row.line).toBe(row.augRecords);
      expect(records.get(`${row.line}-sep`), row.line).toBe(row.sepRecords);
      expect(lineUnits.get(`${row.line}-aug`), row.line).toBe(row.augUnits);
      expect(lineUnits.get(`${row.line}-sep`), row.line).toBe(row.sepUnits);
    }
  });
});
