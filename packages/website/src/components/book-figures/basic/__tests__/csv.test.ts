import { describe, expect, it } from "vitest";
import { columnDigits, csvDataUri, formatCell, tableToCsv } from "../csv";

const table = {
  columns: ["Gruppe", "Wert", "n"],
  rows: [
    ["Berlin, Mitte", 2, 100],
    ["Ost \"alt\"", 1.55, 2500],
    ["Klein", null, 12],
  ],
} as const;

describe("csv", () => {
  it("writes raw numbers with a dot, quotes cells that need it, and ends with a newline", () => {
    const csv = tableToCsv({ columns: [...table.columns], rows: table.rows.map((r) => [...r]) });
    expect(csv).toBe('Gruppe,Wert,n\n"Berlin, Mitte",2,100\n"Ost ""alt""",1.55,2500\nKlein,,12\n');
  });

  it("becomes a data link that carries a BOM and survives a round trip", () => {
    const uri = csvDataUri("Größe,Wert\nA,1\n");
    expect(uri.startsWith("data:text/csv;charset=utf-8,")).toBe(true);
    const body = decodeURIComponent(uri.slice(uri.indexOf(",") + 1));
    expect(body.charCodeAt(0)).toBe(0xfeff);
    expect(body.slice(1)).toBe("Größe,Wert\nA,1\n");
  });

  it("prints a steady number of decimals per column, German style", () => {
    const t = { columns: [...table.columns], rows: table.rows.map((r) => [...r]) };
    const digits = columnDigits(t);
    expect(digits).toEqual([0, 2, 0]);
    expect(formatCell(2, digits[1])).toBe("2,00");
    expect(formatCell(1.55, digits[1])).toBe("1,55");
    expect(formatCell(2500, digits[2])).toBe("2.500");
    expect(formatCell(null, 2)).toBe("");
    expect(formatCell("Text")).toBe("Text");
  });
});
