import type { Bill, FactId, Request, RowId } from "./types";

/*
 * The demo's numbers and ids: no words in any locale. Client code imports
 * this module (never facts.ts, rows.ts, copy.ts or takeaways.ts, which carry
 * both locales); the page's own text arrives as a locale pack (pack.ts).
 */

/** The ten facts in card order (facts.ts builds FACTS in this order; logic.test.ts checks it). */
export const FACT_IDS: readonly FactId[] = [
  "bussgeld",
  "wasser",
  "kopf",
  "unfall",
  "ghg",
  "mix",
  "zert",
  "pv",
  "glas",
  "strom",
];

export const REQUESTS: readonly Request[] = ["nordvik", "bank"];

/** The rows the Monday prediction offers (the ones that depend on electricity). */
export const PREDICTION_ROWS: readonly RowId[] = ["Q1", "Q2", "F2", "F3", "F4"];

/** energy_bills_2025.csv, one entry per month; September has no bill on Friday. */
export const BILLS_2025: readonly Bill[] = [
  { month: "2025-01", kWh: 21400, line: 3 },
  { month: "2025-02", kWh: 19800, line: 4 },
  { month: "2025-03", kWh: 20600, line: 5 },
  { month: "2025-04", kWh: 19200, line: 6 },
  { month: "2025-05", kWh: 22500, line: 7 },
  { month: "2025-06", kWh: 26800, line: 8 },
  { month: "2025-07", kWh: 30400, line: 9 },
  { month: "2025-08", kWh: 32100, line: 10 },
  { month: "2025-09", kWh: null, line: null },
  { month: "2025-10", kWh: 38700, line: 11 },
  { month: "2025-11", kWh: 25300, line: 12 },
  { month: "2025-12", kWh: 22900, line: 13 },
];

/** The invoice that accounting finds on the following Monday. */
export const INVOICE_FILE = "inbox/4-september-invoice.png";

/** Invoice EL-25-09 (inbox/4-september-invoice.png), the fields as printed. */
export const INVOICE_EL_25_09 = {
  number: "EL-25-09",
  period: "01.09.2025-30.09.2025",
  readings: { previous: 1_284_350, current: 1_325_550 },
  printedReadings: "1.284.350 / 1.325.550 kWh",
  printedQuantity: "41.200 kWh",
  kWh: 41_200,
  tariff: "9,50 ден./kWh",
  amount: "391.400,00 ден.",
  supplyMix: "не е наведен",
} as const;

/** The year once the September invoice is in. */
export const BILLS_2025_MONDAY: readonly Bill[] = BILLS_2025.map((bill) =>
  bill.month === "2025-09" ? { ...bill, kWh: INVOICE_EL_25_09.kWh } : bill,
);

/** The unsigned offer and the bank's formula inputs. */
export const PV = { offerMWh: 180, priceMKD: 8_550_000, tariffMKDperKWh: 9.5 } as const;

/** The key among the three quantities offered for the invoice: the printed one. */
export const INVOICE_KEY = "41200";
