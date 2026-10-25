import { describe, expect, it } from "vitest";
import { KIT_CSV } from "./kit-series";
import { MAX_ROWS, parseCell, parseDate, parseTable, sniffDelimiter } from "./parse";

describe("parseCell (pruefen.py zahl)", () => {
  it.each([
    ["1.180", 1180],
    ["1,180", 1180],
    ["1 180", 1180],
    ["1 180", 1180],
    ["1 180", 1180],
    ["1180,5", 1180.5],
    ["1180.5", 1180.5],
    ["", null],
  ])("%s -> %s", (input, value) => {
    expect(parseCell(input)).toEqual({ ok: true, value });
  });

  it("refuses text and negatives, and says which", () => {
    expect(parseCell("ca. 600")).toEqual({ ok: false, negative: false });
    expect(parseCell("-5")).toEqual({ ok: false, negative: true });
    expect(parseCell("−5")).toEqual({ ok: false, negative: true });
  });
});

describe("parseDate (pruefen.py datum)", () => {
  it.each([
    ["2025-10-27", "2025-10-27"],
    ["27.10.2025", "2025-10-27"],
    ["27.10.25", "2025-10-27"],
    ["27/10/2025", "2025-10-27"],
    ["KW 44/2025", "2025-10-27"],
    ["kw44 2025", "2025-10-27"],
    ["2025-W44", "2025-10-27"],
    ["KW 1/2025", "2024-12-30"],
  ])("%s -> %s", (input, iso) => {
    expect(parseDate(input)).toBe(iso);
  });

  it("refuses what it cannot read", () => {
    expect(parseDate("Okt 25")).toBeNull();
    expect(parseDate("31.02.2025")).toBeNull();
    expect(parseDate("2025-W60")).toBeNull();
  });
});

describe("parseTable", () => {
  it("reads the kit file: 105 weeks, one duplicate counted once, forecast present", () => {
    const table = parseTable(KIT_CSV);
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    expect(table.rows).toHaveLength(105);
    expect(table.notices).toEqual([{ key: "duplicate", date: "2024-09-16" }]);
    expect(table.hasForecast).toBe(true);
    expect(table.rows.filter((row) => row.zensiert).map((row) => row.woche)).toEqual(["2024-11-04", "2025-03-10"]);
    expect(table.rows.at(-1)).toMatchObject({ woche: "2025-12-29", ist: null, f: 729 });
  });

  it("sniffs tab and comma, strips a BOM and maps aliases, listing ignored columns", () => {
    expect(sniffDelimiter("a\tb")).toBe("\t");
    expect(sniffDelimiter("a,b")).toBe(",");
    const table = parseTable("﻿Week\tSales\tForecast\tFiliale\n2025-01-06\t1.180\t1.200\tA\n2025-01-13\t1.100\t1.150\tA\n");
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    expect(table.ignored).toEqual(["Filiale"]);
    expect(table.rows.map((row) => [row.ist, row.f])).toEqual([[1180, 1200], [1100, 1150]]);
  });

  it("marks bestand_ende = 0 and sold-out notes as censored", () => {
    const table = parseTable("woche;ist;bestand_ende;hinweis\n2025-01-06;10;0;\n2025-01-13;10;4;Sold out Friday\n2025-01-20;10;4;\n");
    expect(table.ok && table.rows.map((row) => row.zensiert)).toEqual([true, true, false]);
  });

  it("inserts missing weeks empty, with a notice", () => {
    const table = parseTable("woche;ist\n2025-01-06;10\n2025-01-27;12\n");
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    expect(table.rows.map((row) => row.woche)).toEqual(["2025-01-06", "2025-01-13", "2025-01-20", "2025-01-27"]);
    expect(table.notices).toEqual([
      { key: "gap", date: "2025-01-13" },
      { key: "gap", date: "2025-01-20" },
    ]);
  });

  it.each([
    ["", { key: "empty" }],
    ["woche;ist", { key: "empty" }],
    ["datum;menge\n2025-01-06;5", { key: "header" }],
    ["woche;ist\nOkt 25;5", { key: "date", line: 2, value: "Okt 25" }],
    ["woche;ist\n2025-01-06;ca. 600", { key: "number", line: 2, column: "ist", value: "ca. 600" }],
    ["woche;ist\n2025-01-06;-5", { key: "negative", line: 2, column: "ist", value: "-5" }],
    ["woche;ist\n2025-03-03;512\n2025-03-10;500\n2025-03-03;498", { key: "conflict", date: "2025-03-03", first: 2, line: 4 }],
    ["woche;ist\n2025-01-06;5\n2025-01-07;6", { key: "daily" }],
  ])("refuses %j", (text, error) => {
    expect(parseTable(text)).toEqual({ ok: false, error });
  });

  it("refuses more than 1 MB and more than 1,000 rows", () => {
    expect(parseTable(`woche;ist\n${"x".repeat(1_000_001)}`)).toEqual({ ok: false, error: { key: "tooBig" } });
    const rows = Array.from({ length: MAX_ROWS + 1 }, () => "2025-01-06;1").join("\n");
    expect(parseTable(`woche;ist\n${rows}`)).toMatchObject({ ok: false, error: { key: "tooManyRows" } });
  });
});
