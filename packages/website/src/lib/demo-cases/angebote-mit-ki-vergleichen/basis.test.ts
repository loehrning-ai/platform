import { describe, expect, it } from "vitest";
import { assemble, effectiveRise, fieldFlips, linesOf, paperScale, sharedField, surcharge, type Field } from "./basis";
import { HORIZON, kitRows, PAPER, STACK } from "./config";
import { parse, type CostRow } from "./stack";

const rows = kitRows("de");
const paper = { option: PAPER.option, share: PAPER.index.share };
const totals = (include: Parameters<typeof assemble>[1], v = 0, cap: number | null = null) => {
  const model = assemble(rows, include, STACK, HORIZON, paperScale(paper, v, cap));
  return Object.fromEntries(model.options.map((option) => [option.name.slice(0, 1), option.total / 100]));
};
const flips = (fields: readonly Field[], v = 0, cap: number | null = null, data: readonly CostRow[] = rows) =>
  fieldFlips(data, { fields: new Set(fields), v, cap }, paper, STACK, HORIZON);

describe("assemble: the partial totals of beat 2", () => {
  it("counts the goods price only after the unit switch", () => {
    expect(totals(["Ware"])).toEqual({ A: 26400, B: 20800, C: 23000 });
  });

  it("adds freight, then storage, then the one-off line, then the discount", () => {
    expect(totals(["Ware", "Fracht"])).toEqual({ A: 26400, B: 23600, C: 25600 });
    expect(totals(["Ware", "Fracht", "Lager"])).toEqual({ A: 26400, B: 25520, C: 25600 });
    expect(totals(["Ware", "Fracht", "Lager", "Einmalig"])).toEqual({ A: 26400, B: 26970, C: 25600 });
    expect(totals(linesOf(["lieferort", "einmalig", "zahlung"]))).toEqual({ A: 25872, B: 26554, C: 24910 });
  });

  it("can add a line for one offer at a time, and a line not added yet is not missing", () => {
    const model = assemble(rows, (option, line) => line === "Ware" || (option === "B Poznań" && line === "Fracht"), STACK, HORIZON);
    expect(model.complete).toBe(true);
    expect(model.options.map((option) => option.total / 100)).toEqual([26400, 23600, 23000]);
  });

  it("keeps the order the same without the discount, only the gap shrinks", () => {
    const model = assemble(rows, linesOf(["lieferort", "einmalig"]), STACK, HORIZON);
    expect(model.ranked.map((option) => option.name)).toEqual(["C Brno", "A Nürnberg", "B Poznań"]);
    expect(model.gap).toBe(80000);
  });
});

describe("the paper surcharge of offer C, with the visitor's cap", () => {
  const all = linesOf(["lieferort", "einmalig", "zahlung"]);

  it("adds 60 % of the goods times the rise, 138 € per point, not discountable", () => {
    expect(surcharge(2300000, paper, 1)).toBe(13800);
    expect(totals(all, 10)).toMatchObject({ C: 26290, A: 25872 });
  });

  it("caps the rise: at 10 % with a cap of 5 %, C costs 25.600 €", () => {
    expect(effectiveRise(10, 5)).toBe(5);
    expect(effectiveRise(3, 5)).toBe(3);
    expect(totals(all, 10, 5).C).toBe(25600);
    expect(paperScale(paper, 0)).toBeNull();
  });
});

describe("fieldFlips: which fields would change the cheapest offer", () => {
  it("per box with every field off: only the delivery term plus one-off costs or discount make C cheapest", () => {
    const answer = flips([]);
    expect(answer).toMatchObject({ kind: "add", winner: "B Poznań", next: "C Brno" });
    if (answer.kind !== "add") throw new Error("add");
    expect(answer.sets).toEqual([
      ["lieferort", "einmalig"],
      ["lieferort", "zahlung"],
    ]);
    expect(sharedField(answer.sets)).toEqual({ shared: "lieferort", others: ["einmalig", "zahlung"] });
  });

  it("with every field on: leaving out the delivery term makes B cheapest instead of C", () => {
    expect(flips(["lieferort", "einmalig", "zahlung"])).toEqual({ kind: "remove", winner: "C Brno", next: "B Poznań", sets: [["lieferort"]] });
  });

  it("names a single field when one is enough", () => {
    expect(flips(["einmalig", "zahlung"])).toMatchObject({ kind: "add", winner: "B Poznań", next: "C Brno", sets: [["lieferort"]] });
  });

  it("says nothing changes when no off field moves the winner", () => {
    expect(flips(["lieferort", "einmalig"])).toEqual({ kind: "none", winner: "C Brno", side: "add" });
  });

  it("applies the paper rise: at 10 % with every field on, A is cheapest", () => {
    expect(flips(["lieferort", "einmalig", "zahlung"], 10)).toMatchObject({ kind: "remove", winner: "A Nürnberg" });
  });

  it("names no winner while a line is missing", () => {
    const own = parse("angebot,zeile,betrag,je\nX,Ware,100,jährlich\nX,Fracht,10,jährlich\nY,Ware,90,jährlich\n", "de", STACK).rows;
    expect(flips([], 0, null, own)).toEqual({ kind: "open" });
  });

  it("finds no shared field in sets that share none", () => {
    expect(sharedField([["lieferort"], ["einmalig"]])).toBeNull();
    expect(sharedField([])).toBeNull();
  });
});
