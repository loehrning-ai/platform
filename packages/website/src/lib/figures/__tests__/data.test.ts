import { describe, expect, it } from "vitest";
import { figureCsv, figureTable } from "../data.ts";
import { ALL_FIXTURES, BARS_H, DUMBBELL, TILEMAP, WATERFALL, WAFFLE, withData } from "./fixtures.ts";

describe.each(ALL_FIXTURES.map((spec) => [spec.id, spec] as const))("%s table", (_id, spec) => {
  it("has a rectangular table and a matching CSV", () => {
    const table = figureTable(spec);
    expect(table.columns.length).toBeGreaterThan(1);
    expect(table.rows.length).toBeGreaterThan(1);
    table.rows.forEach((row) => expect(row).toHaveLength(table.columns.length));
    const lines = figureCsv(spec).trimEnd().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(table.rows.length + 1);
    expect(figureCsv(spec).endsWith("\n")).toBe(true);
  });
});

describe("table content", () => {
  it("flags suppressed values with an empty cell and the label", () => {
    const row = figureTable(BARS_H).rows.find((r) => r[0] === "Mitte");
    expect(row?.[1]).toBeNull();
    expect(row?.at(-1)).toBe("weniger als 5");
    const sl = figureTable(TILEMAP).rows.find((r) => r[0] === "SL");
    expect(sl?.at(-1)).toBe("weniger als 5");
  });

  it("writes raw numbers with a dot in the CSV", () => {
    expect(figureCsv(BARS_H)).toContain("Zweites Fünftel,2.1,1.5,2.8,400,");
  });

  it("adds the remainder of a waffle as its own row", () => {
    const rows = figureTable(WAFFLE).rows;
    expect(rows.map((r) => r[1])).toEqual([21, 70, 9]);
  });

  it("carries the running level of a waterfall", () => {
    const rows = figureTable(WATERFALL).rows;
    expect(rows[1]).toEqual(["Geteilte Adressen entfernt", "Veränderung", -3.9, 4.3, null]);
  });

  it("marks incomplete dumbbell rows", () => {
    const spec = withData(DUMBBELL, { rows: [{ id: "x", label: "X", a: null, b: 3 }, { id: "y", label: "Y", a: 1, b: 2 }] });
    expect(figureTable(spec).rows[0]?.at(-1)).toBe("weniger als 5");
  });

  it("quotes cells that hold commas, quotes or line breaks", () => {
    const spec = withData(BARS_H, { items: [{ id: "a", label: 'Eins, "zwei"', value: 1 }, { id: "b", label: "Drei", value: 2 }] });
    expect(figureCsv(spec)).toContain('"Eins, ""zwei""",1');
  });
});
