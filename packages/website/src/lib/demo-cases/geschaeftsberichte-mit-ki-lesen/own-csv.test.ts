import { describe, expect, it } from "vitest";
import { compareMonths, detectColumns, direction, numberStyle, parseCsv, parseDate, parseNumber, separatorOf, splitLine, type CsvTable } from "./own-csv";

const table = (text: string) => parseCsv(text) as CsvTable;

describe("the own CSV (invented rows only)", () => {
  it("takes the separator from the header and honours quotes", () => {
    expect(separatorOf("a;b;c")).toBe(";");
    expect(separatorOf("a\tb")).toBe("\t");
    expect(separatorOf("a,b")).toBe(",");
    expect(splitLine('x;"a;b";"say ""hi"""', ";")).toEqual(["x", "a;b", 'say "hi"']);
  });

  it("reads ISO and German dates and both number styles", () => {
    expect(parseDate("2024-03-31")).toEqual([2024, 3, 31]);
    expect(parseDate("1.2.2024")).toEqual([2024, 2, 1]);
    expect(parseDate("2024-13-01")).toBeNull();
    expect(parseNumber("1.234,5", "de")).toBe(1234.5);
    expect(parseNumber("1,234.5", "en")).toBe(1234.5);
    expect(numberStyle(["1.234,5", "2,5", "7"])).toBe("de");
    expect(numberStyle(["1,234.5", "2.5"])).toBe("en");
  });

  it("finds the date and the quantity column", () => {
    const t = table("datum;menge;notiz\n01.01.2024;3;a\n15.01.2024;4;b\n");
    expect(detectColumns(t)).toEqual({ dates: [0], numbers: [1] });
  });

  it("compares the last two complete months: fewer rows, more quantity", () => {
    const lines = ["date,qty"];
    for (let day = 1; day <= 31; day += 1) lines.push(`2024-01-${String(day).padStart(2, "0")},1`);
    for (let day = 1; day <= 29; day += 2) lines.push(`2024-02-${String(day).padStart(2, "0")},4`);
    lines.push("2024-03-02,9");
    const result = compareMonths(table(lines.join("\n")), 0, 1);
    expect(result).toEqual({
      m1: "2024-01",
      m2: "2024-02",
      rows: [31, 15],
      qty: [31, 60],
    });
    expect(direction(31, 15)).toBe("down");
    expect(direction(31, 60)).toBe("up");
  });

  it("says why it cannot compare", () => {
    expect(parseCsv("only a header\n")).toBe("empty");
    expect(compareMonths(table("date\n2024-01-05\n2024-01-20"), 0, null)).toBe("noMonths");
    expect(compareMonths(table("date\nfoo\nbar"), 0, null)).toBe("noDate");
  });
});
