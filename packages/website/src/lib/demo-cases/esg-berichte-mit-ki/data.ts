import { round } from "./numbers";
import type { MonthCell, Series } from "./types";

/*
 * The two built-in datasets, from crvena-zemja-esg-kit (fictional training data):
 * project-files/energy_bills_2025.csv (kWh, eleven rows, 2025-09 absent),
 * project-files/energy_summary_2025_draft.txt (the draft: 279.7 MWh "full year"),
 * inbox/4-september-invoice.png (assets/proof/september-invoice.png: 41 200 kWh),
 * project-files/water_bills_2025.csv (m3, twelve rows).
 * data.test.ts recomputes every constant from the kit's own CSV.
 */

export const ELECTRICITY_KWH: readonly (number | null)[] = [
  21400, 19800, 20600, 19200, 22500, 26800, 30400, 32100, null, 38700, 25300, 22900,
];
export const SEPTEMBER_KWH = 41200;
export const WATER_M3: readonly number[] = [210, 190, 230, 260, 280, 300, 320, 410, 980, 870, 340, 240];

const pad = (month: number) => String(month).padStart(2, "0");

/** The constants of the one hole in the electricity series. */
export const HOLE = {
  month: 9,
  index: 8,
  invoiceNo: "EL-25-09",
  truth: SEPTEMBER_KWH / 1000,
  draftTotal: 279.7,
  truthTotal: 320.9,
  axisMax: 45,
} as const;

function electricityCells(): readonly MonthCell[] {
  return ELECTRICITY_KWH.map((kwh, index) => {
    const month = index + 1;
    const invoiceNo = `EL-25-${pad(month)}`;
    return kwh === null
      ? { month, value: null, state: "missing" as const, invoiceNo }
      : { month, value: round(kwh / 1000), state: "proven" as const, invoiceNo };
  });
}

export const ELECTRICITY: Series = {
  id: "electricity",
  label: "",
  unit: "MWh",
  source: "energy_bills_2025.csv",
  year: 2025,
  digits: 1,
  cells: electricityCells(),
};

export const WATER: Series = {
  id: "water",
  label: "",
  unit: "m³",
  source: "water_bills_2025.csv",
  year: 2025,
  digits: 0,
  cells: WATER_M3.map((value, index) => ({
    month: index + 1,
    value,
    state: "proven" as const,
    invoiceNo: `W-25-${pad(index + 1)}`,
  })),
};

/** The electricity series as the chart shows it: the hole, a guess in it, or the bill. */
export function electricityWith(
  guess: number | null,
  billOpen: boolean,
  label: string,
): Series {
  const cells = ELECTRICITY.cells.map((cell) => {
    if (cell.month !== HOLE.month) return cell;
    if (billOpen) return { ...cell, value: HOLE.truth, state: "proven" as const };
    if (guess !== null && guess > 0) return { ...cell, value: guess, state: "estimate" as const };
    return cell;
  });
  return { ...ELECTRICITY, label, cells };
}
