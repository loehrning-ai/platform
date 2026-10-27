import { describe, expect, it } from "vitest";
import { STACK } from "./config";
import { compute, fill, fmtEur, fmtNumber, parse, parseCents, scaled, splitRow } from "./stack";

describe("Workshop 06 demo: the stack engine", () => {
  it("reads German and English amounts the way the original does", () => {
    expect(parseCents("1.234,56", "de")).toEqual({ cents: 123456 });
    expect(parseCents("1,234.56", "en")).toEqual({ cents: 123456 });
    expect(parseCents("1.400", "de")).toEqual({ cents: 140000 });
    expect(parseCents("1.400", "en")).toEqual({ err: "decimals" });
    expect(parseCents("14.5", "en")).toEqual({ cents: 1450 });
    expect(parseCents("1,400", "en")).toEqual({ cents: 140000 });
    expect(parseCents("−528", "de")).toEqual({ cents: -52800 });
    expect(parseCents("(528)", "de")).toEqual({ cents: -52800 });
    expect(parseCents("520,00 EUR", "de")).toEqual({ cents: 52000 });
    expect(parseCents("1.2.3", "de")).toEqual({ err: "nan" });
    expect(parseCents("0,575", "de")).toEqual({ err: "decimals" });
    expect(parseCents("abc", "de")).toEqual({ err: "nan" });
  });

  it("splits quoted cells", () => {
    expect(splitRow('A,"x, y",3', ",")).toEqual(["A", "x, y", "3"]);
    expect(splitRow('A,"say ""hi""",3', ",")).toEqual(["A", 'say "hi"', "3"]);
  });

  it("never counts a missing line as 0: an incomplete model names the gap", () => {
    const parsed = parse("Angebot A, Ware, 1000, jährlich\nAngebot A, Fracht, 200, jährlich\nAngebot B, Ware, 900, jährlich", "de", STACK);
    expect(parsed.errors).toEqual([]);
    const model = compute(parsed.rows, 1, null, STACK);
    expect(model.complete).toBe(false);
    expect(model.missing).toEqual([{ option: "Angebot B", line: "Fracht" }]);
    expect(model.options.find((option) => option.name === "Angebot B")?.missing).toEqual(["Fracht"]);
  });

  it("counts one-off lines once and recurring lines per year", () => {
    const parsed = parse("angebot,zeile,betrag,je\nA,Ware,100,jährlich\nA,Werkzeug,50,einmalig\nB,Ware,120,jährlich\nB,Werkzeug,0,einmalig", "de", STACK);
    const three = compute(parsed.rows, 3, null, STACK);
    expect(three.options.map((option) => option.total)).toEqual([35000, 36000]);
  });

  it("names the row of every line it cannot read", () => {
    const parsed = parse("A, Ware, zehn, jährlich\nB, Ware, 10, monatlich\n, Ware, 1, jährlich", "de", STACK);
    expect(parsed.rows).toEqual([]);
    expect(parsed.errors).toEqual([
      { kind: "amount", n: 1, value: "zehn" },
      { kind: "per", n: 2, value: "monatlich" },
      { kind: "option", n: 3 },
    ]);
    expect(parse("A, Ware, 10, jährlich", "de", STACK).errors).toEqual([{ kind: "two" }]);
    expect(parse("   ", "de", STACK).errors).toEqual([{ kind: "empty" }]);
  });

  it("rounds a scaled line half away from zero and formats euros with a real minus", () => {
    expect(scaled(2300000, 1.018)).toBe(2341400);
    expect(scaled(-150, 1.01)).toBe(-152);
    expect(fmtEur(2655400, "de")).toBe("26.554 €");
    expect(fmtEur(2655400, "en")).toBe("€26,554");
    expect(fmtEur(-52800, "de")).toBe("−528 €");
    expect(fill("{a} und {b}", { a: 1 })).toBe("1 und {b}");
  });

  it("drops trailing zeros only after a decimal point", () => {
    expect(fmtNumber(10, 0, "de")).toBe("10");
    expect(fmtNumber(0, 0, "de")).toBe("0");
    expect(fmtNumber(100, 2, "en")).toBe("100");
    expect(fmtNumber(6.5, 2, "de")).toBe("6,5");
    expect(fmtNumber(6.966, 2, "en")).toBe("6.97");
    expect(fmtNumber(10, 1, "de")).toBe("10");
  });
});
