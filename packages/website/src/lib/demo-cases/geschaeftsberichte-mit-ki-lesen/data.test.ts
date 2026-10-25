import { describe, expect, it } from "vitest";
import { COMPANY, CRAFT_MODELS, CRAFT_NCR_AUG, CRAFT_NCR_SEP, CRAFT_SEP_ROWS, CRAFT_WEEKS, DEMAND_ROWS, REPORT } from "./data";
import { csvRows, kitText, type KitLocale } from "@/test/northwind-kit";

/**
 * Every constant in data.ts re-derived from the published kit zips, both
 * editions: the demo cannot drift from the files the visitor downloads.
 */
const month = (date: string) => (date < "2023-09-01" ? "aug" : "sep");

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

  it("re-derives the nine CRAFT weeks and the row count", () => {
    expect(demand).toHaveLength(DEMAND_ROWS);
    const weeks = new Map<string, number>();
    for (const row of demand) {
      if (parts(row.sku ?? "")[1] !== "CRAFT") continue;
      weeks.set(row.week_start ?? "", (weeks.get(row.week_start ?? "") ?? 0) + Number(row.units_actual));
    }
    expect([...weeks.entries()].sort().map(([start, units]) => ({ start, units }))).toEqual(CRAFT_WEEKS);
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

  it("re-derives the 23 September CRAFT NCRs and August's sums", () => {
    const craft = ncr.filter((row) => row.line === "CRAFT");
    const sep = craft
      .filter((row) => month(row.ncr_date ?? "") === "sep")
      .sort((a, b) => (a.ncr_date ?? "").localeCompare(b.ncr_date ?? "") || (a.ncr_id ?? "").localeCompare(b.ncr_id ?? ""))
      .map((row) => ({
        id: row.ncr_id,
        date: row.ncr_date,
        machine: row.machine_id,
        type: row.ncr_type,
        qty: Number(row.qty_affected),
        scrap: row.scrap_or_rework === "scrap",
      }));
    expect(sep).toEqual(CRAFT_NCR_SEP);
    const aug = craft.filter((row) => month(row.ncr_date ?? "") === "aug");
    expect(aug).toHaveLength(CRAFT_NCR_AUG.records);
    expect(aug.reduce((sum, row) => sum + Number(row.qty_affected), 0)).toBe(CRAFT_NCR_AUG.affected);
    expect(aug.filter((row) => row.scrap_or_rework === "scrap").reduce((sum, row) => sum + Number(row.qty_affected), 0)).toBe(
      CRAFT_NCR_AUG.scrapped,
    );
    expect(new Set(aug.map((row) => `${row.machine_id}|${row.ncr_date}`)).size).toBe(CRAFT_NCR_AUG.merged);
  });

  it("re-derives the 95 September CRAFT rows in file order and the model prices", () => {
    const rows = demand
      .filter((row) => parts(row.sku ?? "")[1] === "CRAFT" && month(row.week_start ?? "") === "sep")
      .map((row) => [parts(row.sku ?? "")[2], Number(row.units_actual)]);
    expect(rows).toEqual(CRAFT_SEP_ROWS);
    for (const model of CRAFT_MODELS) expect(price.get(`CRAFT-${model.code}`)).toBe(model.price);
  });

  it("quotes the report's figures as the report prints them", () => {
    const report = kitText(locale, "reports/2023-09-monthly-report.md");
    const n = (value: number, digits = 0) =>
      new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    expect(report).toContain(n(REPORT.craftRevenueEur));
    expect(report).toContain(n(REPORT.avgPriceCents / 100, 2));
    expect(report).toContain(n(REPORT.vpDefectsAug, 2));
    expect(report).toContain(n(REPORT.vpDefectsSep, 2));
  });
});
