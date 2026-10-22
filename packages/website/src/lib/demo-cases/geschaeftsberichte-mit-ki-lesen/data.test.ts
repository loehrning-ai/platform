import { describe, expect, it } from "vitest";
import {
  CLAIMS,
  CRAFT_LIST_PRICES,
  CRAFT_MEAN_LIST_PRICE,
  DEMAND_ROWS,
  LINE_IDS,
  LINES,
  MARKETING_TOTAL_EUR,
  MONTHS,
  NCR_ROWS_TOTAL,
  OCTOBER_2023_WEEK_STARTS,
  REPORT,
  type MonthId,
} from "./data";

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

function lineUnits(month: MonthId): number {
  return sum(LINE_IDS.map((line) => MONTHS[month].lines[line].units));
}

describe("NORTHWIND data, recomputed from the kit", () => {
  it("line units sum to the month totals", () => {
    expect(lineUnits("2023-08")).toBe(110_373);
    expect(lineUnits("2023-09")).toBe(139_056);
  });

  it("weekly units sum to the month", () => {
    expect(sum(MONTHS["2023-08"].weeklyUnits)).toBe(110_373);
    expect(sum(MONTHS["2023-09"].weeklyUnits)).toBe(139_056);
    for (const month of Object.values(MONTHS)) {
      expect(month.weeklyUnits).toHaveLength(month.weekStarts.length);
    }
  });

  it("the report's printed revenue per line sums to 21.687.544", () => {
    expect(sum(LINES.map((line) => line.revenueSepEur))).toBe(REPORT.revenueSepEur);
    expect(REPORT.revenueSepEur).toBe(21_687_544);
  });

  it("keeps the report's revenue order", () => {
    expect(LINES.map((line) => line.id)).toEqual([...LINE_IDS]);
    const revenues = LINES.map((line) => line.revenueSepEur);
    expect([...revenues].sort((a, b) => b - a)).toEqual(revenues);
  });

  it("NCR counts equal the report", () => {
    const aug = MONTHS["2023-08"].lines;
    const sep = MONTHS["2023-09"].lines;
    expect([aug.CRAFT.ncr, aug.NEST.ncr, aug.AURA.ncr, aug.PULSE.ncr]).toEqual([24, 12, 11, 9]);
    expect([sep.CRAFT.ncr, sep.NEST.ncr, sep.AURA.ncr, sep.PULSE.ncr]).toEqual([23, 19, 18, 11]);
    const all = Object.values(MONTHS).flatMap((month) =>
      LINE_IDS.map((line) => month.lines[line].ncr ?? 0),
    );
    expect(sum(all)).toBe(NCR_ROWS_TOTAL);
  });

  it("lines without NCRs carry null, never 0", () => {
    for (const month of Object.values(MONTHS)) {
      for (const line of ["ECHO", "BREW", "BEAM"] as const) {
        expect(month.lines[line].ncr).toBeNull();
        expect(month.lines[line].scrapUnits).toBeNull();
      }
    }
  });

  it("CRAFT scrap units are 924 and 1.539", () => {
    expect(MONTHS["2023-08"].lines.CRAFT.scrapUnits).toBe(924);
    expect(MONTHS["2023-09"].lines.CRAFT.scrapUnits).toBe(1_539);
  });

  it("CRAFT_MEAN_LIST_PRICE is the plain mean of CRAFT's three list prices, not the report's average", () => {
    expect(sum(CRAFT_LIST_PRICES) / CRAFT_LIST_PRICES.length).toBe(CRAFT_MEAN_LIST_PRICE);
    expect(CRAFT_MEAN_LIST_PRICE).not.toBe(REPORT.craftAvgPriceEur);
    const craft = LINES.find((line) => line.id === "CRAFT")!;
    expect(craft.priceBand).toEqual([Math.min(...CRAFT_LIST_PRICES), Math.max(...CRAFT_LIST_PRICES)]);
  });

  it("the marketing total is 2.032.716 €", () => {
    expect(MARKETING_TOTAL_EUR).toBe(2_032_716);
    expect(Math.round(MARKETING_TOTAL_EUR / 7)).toBe(290_388);
  });

  it("every week start is a Saturday; the 30.09 bucket is in September and October has four", () => {
    const saturday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 6;
    for (const month of Object.values(MONTHS)) {
      for (const start of month.weekStarts) expect(saturday(start), start).toBe(true);
    }
    expect(MONTHS["2023-09"].weekStarts.at(-1)).toBe("2023-09-30");
    expect(OCTOBER_2023_WEEK_STARTS).toHaveLength(4);
    for (const start of OCTOBER_2023_WEEK_STARTS) expect(saturday(start), start).toBe(true);
    // Every Saturday of October 2023 is in the list.
    const saturdays = Array.from({ length: 31 }, (_, day) => `2023-10-${String(day + 1).padStart(2, "0")}`).filter(
      saturday,
    );
    expect(saturdays).toEqual([...OCTOBER_2023_WEEK_STARTS]);
  });

  it("the report's printed MoM units match the recomputed totals", () => {
    for (const line of LINES) {
      const aug = MONTHS["2023-08"].lines[line.id].units;
      const sep = MONTHS["2023-09"].lines[line.id].units;
      expect(Math.round((sep / aug - 1) * 1000) / 10, line.id).toBe(line.reportMomUnitsPct);
    }
  });

  it("demand rows: 2.115 in the extract, 95 CRAFT rows in September", () => {
    expect(DEMAND_ROWS.aug + DEMAND_ROWS.sep).toBe(2_115);
    expect(DEMAND_ROWS.craftSep).toBe(95);
  });

  it("orders the claims so the two matching cards are not adjacent", () => {
    const truths = CLAIMS.map((claim) => claim.truth);
    expect(truths).toEqual(["match", "differs", "match", "nowhere"]);
  });

  it("claim sample rows are consistent", () => {
    const units = CLAIMS.find((claim) => claim.id === "craft-units")!;
    expect(units.rows.length + units.more).toBe(DEMAND_ROWS.craftSep);
    expect(units.sourceValue).toBe(MONTHS["2023-09"].lines.CRAFT.units);

    const nest = CLAIMS.find((claim) => claim.id === "nest-ncr")!;
    expect(nest.rows.length + nest.more).toBe(MONTHS["2023-09"].lines.NEST.ncr);
    expect(nest.value).toBe(MONTHS["2023-08"].lines.NEST.ncr);
    for (const row of nest.rows) {
      expect(row[1]).toMatchObject({ t: "text" });
      expect((row[1] as { v: string }).v.startsWith("2023-09")).toBe(true);
    }

    const revenue = CLAIMS.find((claim) => claim.id === "craft-revenue")!;
    expect(revenue.sourceValue).toBe(LINES.find((line) => line.id === "CRAFT")!.revenueSepEur);
    for (const row of revenue.rows) {
      const [qty, , price, , total] = row as readonly { v: number }[];
      expect(qty.v * price.v).toBe(total.v);
    }

    const marketing = CLAIMS.find((claim) => claim.id === "craft-marketing")!;
    expect(marketing.sourceValue).toBeNull();
    expect(marketing.rows).toHaveLength(0);
    expect(marketing.header).not.toContain("line");
    expect(marketing.header).not.toContain("name_value");
  });
});
