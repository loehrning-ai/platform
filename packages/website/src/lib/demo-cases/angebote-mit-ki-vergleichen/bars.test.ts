import { describe, expect, it } from "vitest";
import { assemble, linesOf, paperScale, surcharge } from "./basis";
import { barRows, scaleFor } from "./bars";
import { HORIZON, kitRows, PAPER, STACK } from "./config";
import { compute, parse } from "./stack";

const rows = kitRows("de");
const paper = { option: PAPER.option, share: PAPER.index.share };
const all = linesOf(["lieferort", "einmalig", "zahlung"]);

describe("barRows: the bars are the engine's lines", () => {
  it("stacks the positive lines and cuts the discount from the end", () => {
    const bars = barRows(assemble(rows, all, STACK, HORIZON));
    const b = bars.find((row) => row.option === "B Poznań");
    expect(b?.segments.map((segment) => [segment.kind, segment.cents / 100])).toEqual([
      ["Ware", 20800],
      ["Fracht", 2800],
      ["Einmalig", 1450],
      ["Lager", 1920],
    ]);
    expect(b?.discount).toBe(41600);
    expect((b?.gross ?? 0) - (b?.discount ?? 0)).toBe(b?.total);
  });

  it("splits C's paper surcharge off the goods and keeps what the cap removes as a ghost", () => {
    const capped = assemble(rows, all, STACK, HORIZON, paperScale(paper, 10, 5));
    const bars = barRows(capped, { option: "C Brno", uncapped: surcharge(2300000, paper, 10) });
    const c = bars.find((row) => row.option === "C Brno");
    expect(c?.segments.filter((segment) => segment.line === "Papier").map((segment) => [segment.kind, segment.cents / 100])).toEqual([
      ["Papier", 690],
      ["Ghost", 690],
    ]);
    expect(c?.total).toBe(2560000);
  });

  it("draws a missing line as open, never as 0", () => {
    const own = compute(parse("angebot,zeile,betrag,je\nX,Ware,100,jährlich\nX,Fracht,10,jährlich\nY,Ware,90,jährlich\n", "de", STACK).rows, HORIZON, null, STACK);
    const y = barRows(own).find((row) => row.option === "Y");
    expect(y?.open).toBe(true);
    expect(y?.segments.map((segment) => segment.kind)).toEqual(["Ware", "Open"]);
  });

  it("keeps a fixed floor for the scale", () => {
    expect(scaleFor(barRows(assemble(rows, ["Ware"], STACK, HORIZON)), 2800000)).toBeCloseTo(2912000);
    expect(scaleFor([])).toBe(1);
  });
});
