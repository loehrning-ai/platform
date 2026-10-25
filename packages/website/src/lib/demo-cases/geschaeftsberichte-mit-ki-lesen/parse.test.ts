import { describe, expect, it } from "vitest";
import { detectGranularity, hasScaleWord, parseLine, parseMonth, parseNumber, parsePaste } from "./parse";

describe("parseNumber", () => {
  it.each([
    ["17.233.647", 17233647],
    ["17,23", 17.23],
    ["17233647,5", 17233647.5],
    ["1 234", 1234],
    ["1\u00a0234,5", 1234.5],
    ["€ 17.233.647", 17233647],
    ["17,233,647.5", 17233647.5],
    ["1.234,56", 1234.56],
    ["-5,5", -5.5],
    ["17.5", 17.5],
  ])("reads %s as %f (German)", (text, value) => {
    expect(parseNumber(text, "de")).toBe(value);
  });

  it("reads English separators in the English pack", () => {
    expect(parseNumber("1,234", "en")).toBe(1234);
    expect(parseNumber("1,5", "en")).toBe(1.5);
    expect(parseNumber("1.234", "en")).toBe(1.234);
  });

  it("refuses Mio and other scale words, and text", () => {
    expect(parseNumber("€ 17,2 Mio", "de")).toBeNull();
    expect(hasScaleWord("21,7 Mio.")).toBe(true);
    expect(hasScaleWord("17233647")).toBe(false);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("1.2.3,4,5x")).toBeNull();
  });
});

describe("parseMonth", () => {
  it("accepts ISO and dotted months and rejects the rest", () => {
    expect(parseMonth("2023-08")).toEqual({ year: 2023, month: 8 });
    expect(parseMonth("08/2023")).toEqual({ year: 2023, month: 8 });
    expect(parseMonth("8.2023")).toEqual({ year: 2023, month: 8 });
    expect(parseMonth("2023-13")).toBeNull();
    expect(parseMonth("August")).toBeNull();
  });
});

describe("parseLine", () => {
  it("reads dd.mm.yyyy and ISO with tab, semicolon, comma or space", () => {
    expect(parseLine("02.09.2023\t4.409.249", "de")).toEqual({ year: 2023, month: 9, day: 2, value: 4409249 });
    expect(parseLine("2023-09-02;4409249,5", "de")).toEqual({ year: 2023, month: 9, day: 2, value: 4409249.5 });
    expect(parseLine("2023-09-02,4409249.5", "en")).toEqual({ year: 2023, month: 9, day: 2, value: 4409249.5 });
    expect(parseLine("2.9.2023 4409249", "de")?.value).toBe(4409249);
  });

  it("skips headers and unreadable values", () => {
    expect(parseLine("Datum\tUmsatz", "de")).toBeNull();
    expect(parseLine("02.09.2023\tviel", "de")).toBeNull();
    expect(parseLine("32.09.2023\t5", "de")).toBeNull();
  });
});

const weekly = (rows: readonly [string, number][]) => rows.map(([d, v]) => `${d}\t${v}`).join("\n");

describe("parsePaste", () => {
  it("detects weekly data and groups by calendar month of the week start", () => {
    const result = parsePaste(
      weekly([
        ["2023-08-05", 4295459], ["2023-08-12", 4442950], ["2023-08-19", 4042856], ["2023-08-26", 4452382],
        ["2023-09-02", 4409249], ["2023-09-09", 4307325], ["2023-09-16", 4293319], ["2023-09-23", 4202199], ["2023-09-30", 4475452],
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.granularity).toBe("weekly");
    expect([result.a.key, result.a.count, result.a.value]).toEqual(["2023-08", 4, 17233647]);
    expect([result.b.key, result.b.count, result.b.value]).toEqual(["2023-09", 5, 21687544]);
  });

  const isoDay = (month: number, day: number) => `2023-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const daysOf = (month: number, last: number, keep: (weekday: number, day: number) => boolean) =>
    Array.from({ length: last }, (_, index) => index + 1)
      .filter((day) => keep(new Date(Date.UTC(2023, month - 1, day)).getUTCDay(), day))
      .map((day) => `${isoDay(month, day)}\t100`);

  it("detects weekday-only daily data, counts Mo-Fr rows and reports the days without a value", () => {
    const rows = [
      ...daysOf(9, 30, (weekday) => weekday !== 0 && weekday !== 6),
      ...daysOf(8, 31, (weekday, day) => weekday !== 0 && weekday !== 6 && day !== 15),
    ];
    const result = parsePaste(rows.join("\n"));
    expect(result.ok && result.granularity).toBe("daily");
    if (!result.ok) return;
    expect(result.calendar).toBe(false);
    expect(result.a.count).toBe(22);
    expect(result.a.gapDays).toBe(1);
    expect(result.b.count).toBe(21);
    expect(result.b.value).toBe(2100);
  });

  it("sums every row and counts every day when the paste has weekend rows (a shop must not lose its weekends)", () => {
    const rows = [...daysOf(9, 30, () => true), ...daysOf(8, 31, (_, day) => day !== 15)];
    const result = parsePaste(rows.join("\n"));
    expect(result.ok && result.granularity).toBe("daily");
    if (!result.ok) return;
    expect(result.calendar).toBe(true);
    expect(result.a).toMatchObject({ key: "2023-08", count: 30, value: 3000, gapDays: 1 });
    expect(result.b).toMatchObject({ key: "2023-09", count: 30, value: 3000, gapDays: 0 });
  });

  it("reads monthly rows with a count of one and no unit", () => {
    const result = parsePaste("31.07.2023;100\n31.08.2023;120\n30.09.2023;130");
    expect(result.ok && result.granularity).toBe("monthly");
    expect(result.ok && result.a.key).toBe("2023-08");
    expect(result.ok && result.b.key).toBe("2023-09");
  });

  it("names what is missing when there are fewer than two months with enough points", () => {
    const result = parsePaste(weekly([["2023-09-02", 1], ["2023-09-09", 2], ["2023-09-16", 3], ["2023-08-05", 4], ["2023-08-12", 5]]));
    expect(result).toMatchObject({ ok: false, reason: "thin", needed: 3 });
    expect(!result.ok && result.found).toEqual(["2023-08: 2", "2023-09: 3"]);
    expect(parsePaste("nur Text")).toMatchObject({ ok: false, reason: "empty" });
  });

  it("detects granularity from the median gap", () => {
    const row = (day: number) => ({ year: 2023, month: 9, day, value: 1 });
    expect(detectGranularity([row(1), row(2), row(3), row(4)])).toBe("daily");
    expect(detectGranularity([row(1), row(8), row(15)])).toBe("weekly");
    expect(detectGranularity([row(1)])).toBe("monthly");
  });
});
