/**
 * The example files of "Deine Datei", each the export table of a kit case
 * (KIT, builder/domains/sql/*.sql and builder/claude-demo/A-export-tables/).
 * examples.test.ts reads the SQL and the CSV and pins every row. All
 * companies are invented; no row holds a person.
 */
import { EXPORT_ROWS } from "./data";

export type ExampleId = "foldline" | "retail" | "support" | "people";

export interface Example {
  readonly id: ExampleId;
  /** The file name the example is shown under. */
  readonly file: string;
  /** The column the example passes on, and what the kit says it is. */
  readonly value: string;
  readonly kind: "change" | "level";
  readonly csv: string;
}

const lines = (header: string, rows: readonly (readonly (string | number)[])[]) => [header, ...rows.map((row) => row.join(","))].join("\n");

/** builder/domains/sql/retail_inventory.sql, export_lane.inv_export (8 rows). */
export const RETAIL_ROWS: readonly (readonly [string, string, number, string])[] = [
  ["HBR", "HLM", 120, "2026-03-31 23:59"],
  ["HBR", "HLM", 110, "2026-04-30 23:59"],
  ["HBR", "HLM", 95, "2026-05-31 23:59"],
  ["HBR", "HLM", 110, "2026-06-30 23:59"],
  ["MKT", "HLM", 35, "2026-03-31 23:59"],
  ["MKT", "HLM", 38, "2026-04-30 23:59"],
  ["MKT", "HLM", 36, "2026-05-31 23:59"],
  ["MKT", "HLM", 40, "2026-06-30 23:59"],
];

/** builder/domains/sql/support_backlog.sql, export_lane.support_kpi_monthly (3 rows). */
export const SUPPORT_ROWS: readonly (readonly [string, number, number, number, string])[] = [
  ["2026-04-01", 300, 310, 70, "12.0"],
  ["2026-05-01", 310, 300, 80, "26.0"],
  ["2026-06-01", 290, 300, 70, "13.0"],
];

/** builder/domains/sql/people_headcount.sql, export_lane.hc_monthly (3 rows). */
export const PEOPLE_ROWS: readonly (readonly [string, number, string])[] = [
  ["2026-04-01", 206, "2.00"],
  ["2026-05-01", 202, "2.91"],
  ["2026-06-01", 206, "4.46"],
];

export const EXAMPLES: readonly Example[] = [
  {
    id: "foldline",
    file: "monthly_revenue.csv",
    value: "amount",
    kind: "change",
    csv: lines(
      "dt,segment,amount",
      EXPORT_ROWS.map((row) => [row.dt, row.segment, row.amount]),
    ),
  },
  { id: "retail", file: "inv_export.csv", value: "qty", kind: "level", csv: lines("loc,cat,qty,ts", RETAIL_ROWS) },
  { id: "support", file: "support_kpi_monthly.csv", value: "backlog", kind: "level", csv: lines("dt,opened,closed,backlog,avg_res", SUPPORT_ROWS) },
  { id: "people", file: "hc_monthly.csv", value: "hc", kind: "level", csv: lines("dt,hc,attrition", PEOPLE_ROWS) },
];
