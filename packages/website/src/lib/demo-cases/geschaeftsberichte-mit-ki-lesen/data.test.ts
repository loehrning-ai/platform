import { describe, expect, it } from "vitest";
import { COMPANY, CRAFT_MODELS, CRAFT_NCR, CRAFT_SKUS, DEMAND_ROWS, REPORT, WEEK_STARTS } from "./data";
import { csvRows, kitText, type KitLocale } from "@/test/northwind-kit";

/**
 * Every constant in data.ts re-derived from the published kit zips, both
 * editions: the demo cannot drift from the files the visitor downloads.
 */
const month = (date: string) => (date < "2023-09-01" ? "aug" : "sep");
const SATURDAY = 6;

describe.each(["en", "de"] as KitLocale[])("data.ts against the %s kit", (locale) => {
  const demand = csvRows(kitText(locale, "data/demand_actuals.csv"));
  const ncr = csvRows(kitText(locale, "data/ncr_records.csv"));
  const products = csvRows(kitText(locale, "data/product_lines.csv"));
  const price = new Map(products.map((row) => [`${row.line}-${row.model_code}`, Number(row.base_price_eur)]));
  const parts = (sku: string) => sku.split("-");

  it("has the CSVs byte for byte in both editions", () => {
    for (const file of ["data/demand_actuals.csv", "data/ncr_records.csv", "data/product_lines.csv"]) {
      expect(kitText(locale, file)).toBe(kitText("en", file));
    }
  });

  it("has nine week_start values, every one a Saturday", () => {
    expect(demand).toHaveLength(DEMAND_ROWS);
    const weeks = [...new Set(demand.map((row) => row.week_start ?? ""))].sort();
    expect(weeks).toEqual([...WEEK_STARTS]);
    for (const week of weeks) expect(new Date(`${week}T00:00:00Z`).getUTCDay()).toBe(SATURDAY);
  });

  it("re-derives the 19 CRAFT SKUs and their units per week, in file order", () => {
    const craft = demand.filter((row) => parts(row.sku ?? "")[1] === "CRAFT");
    expect(craft).toHaveLength(171);
    const bySku = new Map<string, number[]>();
    for (const row of craft) {
      const units = bySku.get(row.sku ?? "") ?? Array.from({ length: WEEK_STARTS.length }, () => 0);
      units[WEEK_STARTS.indexOf(row.week_start as (typeof WEEK_STARTS)[number])] = Number(row.units_actual);
      bySku.set(row.sku ?? "", units);
    }
    expect(
      [...bySku.entries()].map(([sku, units]) => ({
        sku,
        model: parts(sku)[2],
        units,
      })),
    ).toEqual(
      CRAFT_SKUS.map((row) => ({
        sku: row.sku,
        model: row.model,
        units: [...row.units],
      })),
    );
    for (const model of CRAFT_MODELS) expect(price.get(`CRAFT-${model.code}`)).toBe(model.price);
  });

  it("re-derives the company totals per month", () => {
    const units = { aug: 0, sep: 0 };
    const revenue = { aug: 0, sep: 0 };
    for (const row of demand) {
      const [, line, code] = parts(row.sku ?? "");
      const m = month(row.week_start ?? "");
      units[m] += Number(row.units_actual);
      revenue[m] += Number(row.units_actual) * (price.get(`${line}-${code}`) ?? Number.NaN);
    }
    expect(units).toEqual(COMPANY.units);
    expect(revenue).toEqual(COMPANY.revenueEur);
  });

  it("re-derives all 47 CRAFT records, each dated on a week_start", () => {
    const craft = ncr
      .filter((row) => row.line === "CRAFT")
      .sort((a, b) => (a.ncr_date ?? "").localeCompare(b.ncr_date ?? "") || (a.ncr_id ?? "").localeCompare(b.ncr_id ?? ""))
      .map((row) => ({
        id: row.ncr_id,
        date: row.ncr_date,
        machine: row.machine_id,
        type: row.ncr_type,
        qty: Number(row.qty_affected),
        scrap: row.scrap_or_rework === "scrap",
      }));
    expect(craft).toEqual(CRAFT_NCR);
    for (const row of CRAFT_NCR) expect(WEEK_STARTS).toContain(row.date);
  });

  it("quotes the report's figures as the report prints them", () => {
    const report = kitText(locale, "reports/2023-09-monthly-report.md");
    const n = (value: number, digits = 0) =>
      new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value);
    expect(report).toContain(n(REPORT.craftRevenueEur));
    expect(report).toContain(n(REPORT.avgPriceCents / 100, 2));
    expect(report).toContain(n(REPORT.vpDefectsAug, 2));
    expect(report).toContain(n(REPORT.vpDefectsSep, 2));
    expect(report).toContain(n(REPORT.unitsGrowthPermille / 10, 1));
    expect(report).toContain(`+${n(REPORT.companyWeekGrowthPermille / 10, 1)}`);
  });
});
