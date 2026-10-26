/** The example files of "Deine Datei" against the kit's SQL and CSV. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXAMPLES, PEOPLE_ROWS, RETAIL_ROWS, SUPPORT_ROWS } from "./examples";

const KIT = join(__dirname, "../../../../public/workshops/datenbereitschaft-fuer-ki/data-readiness-kit");
const read = (path: string): string => readFileSync(join(KIT, path), "utf8");

/** The tuples of one INSERT ... VALUES statement, as strings without quotes. */
function insertValues(sql: string, table: string): readonly (readonly string[])[] {
  const start = sql.indexOf(`INSERT INTO ${table} VALUES`);
  const end = sql.indexOf(";", start);
  const body = sql.slice(start, end);
  return [...body.matchAll(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)].map((match) =>
    (match[1] ?? "").split(",").map((cell) => cell.trim().replace(/^DATE\s+/, "").replace(/^'|'$/g, "")),
  );
}

describe("example files", () => {
  it("are the kit's export rows, value for value", () => {
    const retail = insertValues(read("builder/domains/sql/retail_inventory.sql"), "export_lane.inv_export");
    expect(retail).toEqual(RETAIL_ROWS.map((row) => row.map(String)));
    const support = insertValues(read("builder/domains/sql/support_backlog.sql"), "export_lane.support_kpi_monthly");
    expect(support).toEqual(SUPPORT_ROWS.map((row) => row.map(String)));
    const people = insertValues(read("builder/domains/sql/people_headcount.sql"), "export_lane.hc_monthly");
    expect(people).toEqual(PEOPLE_ROWS.map((row) => row.map(String)));
  });

  it("serves the FOLDLINE export exactly as the kit file", () => {
    const csv = read("builder/claude-demo/A-export-tables/monthly_revenue.csv").trim();
    expect(EXAMPLES.find((example) => example.id === "foldline")?.csv).toBe(csv);
  });
});
