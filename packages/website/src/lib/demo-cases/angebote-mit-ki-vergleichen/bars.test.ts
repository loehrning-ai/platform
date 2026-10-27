import { describe, expect, it } from "vitest";
import { assemble, linesOf, paperScale, surcharge } from "./basis";
import { axisFloor, barRows, scaleFor, span } from "./bars";
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

  it("starts the bars at a round amount below the cheapest goods, and says where", () => {
    const bars = barRows(assemble(rows, all, STACK, HORIZON));
    // B's goods are 20.800 €: 80 % is 16.640 €, rounded down to the thousand.
    expect(axisFloor(bars)).toBe(1600000);
    expect(axisFloor([])).toBe(0);
    const second = compute(parse("angebot,zeile,betrag,je\nX,Ware,8000,jährlich\nY,Ware,9100,jährlich\n", "de", STACK).rows, HORIZON, null, STACK);
    expect(axisFloor(barRows(second))).toBe(640000);
  });

  it("measures each stretch from the floor, and the goods lose only the part below it", () => {
    expect(span(0, 2080000, 1600000, 2600000)).toEqual({ left: 0, width: 0.48 });
    expect(span(2080000, 280000, 1600000, 2600000)).toEqual({ left: 0.48, width: 0.28 });
    expect(span(0, 1000000, 1600000, 2600000)).toEqual({ left: 0, width: 0 });
  });
});
