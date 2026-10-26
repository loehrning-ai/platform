import { describe, expect, it } from "vitest";
import { NET_NEW_2026 } from "./data";
import { EXAMPLES } from "./examples";
import { dateOf, defaultColumns, defaultGroup, lintColumns, monthly, numberOf, OWN_LIMITS, parseTable, profile, separatorOf, splitLine, type Table } from "./own-csv";

const table = (text: string): Table => {
  const parsed = parseTable(text);
  if (typeof parsed === "string") throw new Error(parsed);
  return parsed;
};
const example = (id: string) => {
  const found = EXAMPLES.find((entry) => entry.id === id);
  if (!found) throw new Error(id);
  return { ...found, table: table(found.csv) };
};

describe("reading a file in the browser", () => {
  it("finds the separator and keeps quoted cells whole", () => {
    expect([separatorOf("a;b;c"), separatorOf("a\tb"), separatorOf("a,b"), separatorOf("single")]).toEqual([";", "\t", ",", ","]);
    expect(splitLine('"a;b";"say ""hi""";3', ";")).toEqual(["a;b", 'say "hi"', "3"]);
  });

  it("refuses empty, too big, too long and too wide files", () => {
    expect(parseTable("only,a,header")).toBe("empty");
    expect(parseTable("a\n1", OWN_LIMITS.bytes + 1)).toBe("tooBig");
    expect(parseTable(["a", ...Array.from({ length: OWN_LIMITS.rows + 1 }, () => "1")].join("\n"))).toBe("tooManyRows");
    expect(parseTable([Array.from({ length: OWN_LIMITS.cols + 1 }, (_, i) => `c${i}`).join(","), "1"].join("\n"))).toBe("tooManyCols");
  });

  it("reads numbers in German and English notation", () => {
    expect(["1234", "-19960", "−19.960", "1.234,5", "1,234.5", "12,5", "12.5", "334.675 €", "x", ""].map(numberOf)).toEqual([
      1234, -19960, -19960, 1234.5, 1234.5, 12.5, 12.5, 334675, null, null,
    ]);
  });

  it("reads ISO dates, month dates and German dates", () => {
    expect(["2026-04-30 23:59", "2026-04", "2026-04-01", "30.4.2026", "April"].map(dateOf)).toEqual([
      "2026-04-30 23:59",
      "2026-04-01 00:00",
      "2026-04-01 00:00",
      "2026-04-30 00:00",
      null,
    ]);
  });
});

describe("the lints that prefill the card", () => {
  it("L1: a column with negative values is probably a change", () => {
    const foldline = example("foldline");
    const columns = profile(foldline.table);
    expect(columns.map((column) => column.type)).toEqual(["date", "text", "number"]);
    expect(lintColumns(columns, 2).negative).toBe(true);
    expect(lintColumns(columns, 2).vague).toEqual(["amount"]);
  });

  it("L2 and L6: short codes are found, names that look like people go into box 4", () => {
    const columns = profile(table("id,email,Vorname,status,amount\n1,x@y.z,A,A,3\n2,b@c.d,B,C,4\n3,e@f.g,C,N,5"));
    expect(columns.find((column) => column.name === "status")?.codes).toEqual(["A", "C", "N"]);
    const lints = lintColumns(columns, 4);
    expect(lints.identifiers).toEqual(["email", "Vorname"]);
    expect(lints.vague).toEqual(["status", "amount"]);
    expect(lints.negative).toBe(false);
  });
});

describe("monthly totals: a change is summed, a level never is", () => {
  it("sums the export file into the six monthly changes of the kit", () => {
    const foldline = example("foldline");
    expect(monthly(foldline.table, 2, 0, "change").map((entry) => entry.value)).toEqual(NET_NEW_2026);
  });

  it("takes the last day of a daily level file, never the sum of the days", () => {
    const daily = table(["day,stock", "2026-04-01,10", "2026-04-15,12", "2026-04-30,7", "2026-05-02,9", "2026-05-31,11"].join("\n"));
    expect(monthly(daily, 1, 0, "level")).toEqual([
      { month: "2026-04", value: 7 },
      { month: "2026-05", value: 11 },
    ]);
    expect(monthly(daily, 1, 0, "change")).toEqual([
      { month: "2026-04", value: 29 },
      { month: "2026-05", value: 20 },
    ]);
  });

  it("takes the last value per group and month, then adds the groups", () => {
    const retail = example("retail");
    const columns = profile(retail.table);
    expect(defaultGroup(columns)).toBe(0);
    expect(monthly(retail.table, 2, 3, "level", 0).map((entry) => entry.value)).toEqual([155, 148, 131, 150]);
  });

  it("prefills the first number and the first date column", () => {
    expect(defaultColumns(profile(example("support").table))).toEqual({ value: 1, date: 0 });
  });
});
