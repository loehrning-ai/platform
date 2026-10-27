import { describe, expect, it } from "vitest";
import { assemble } from "./basis";
import { HORIZON, kitRows, STACK } from "./config";
import { demoReducer, included, INITIAL_STATE, moveDone, type Action, type DemoState } from "./demo-state";
import { keyOf } from "./konditionen";

const rows = kitRows("de");
const run = (...actions: Action[]) => actions.reduce<DemoState>(demoReducer, INITIAL_STATE);
const totals = (state: DemoState) => Object.fromEntries(assemble(rows, included(state, keyOf), STACK, HORIZON).options.map((option) => [option.name.slice(0, 1), option.total / 100]));

describe("the guided basis, move by move", () => {
  it("shows no bars until the unit is per box", () => {
    expect(totals(run({ type: "qty" }))).toEqual({ A: 0, B: 0, C: 0 });
    expect(totals(run({ type: "qty" }, { type: "unit", unit: "piece" }))).toEqual({ A: 26400, B: 20800, C: 23000 });
  });

  it("adds freight and storage per sorted delivery term, and a wrong drop still lands right", () => {
    const state = run({ type: "qty" }, { type: "unit", unit: "piece" }, { type: "nextMove" }, { type: "nextMove" }, { type: "term", key: "B", payer: "supplier" });
    expect(state.terms.B).toBe("buyer");
    expect(state.lastTerm).toEqual({ key: "B", wrong: true });
    expect(totals(state)).toEqual({ A: 26400, B: 25520, C: 23000 });
  });

  it("reorders only after the third find", () => {
    let state = run({ type: "complete" });
    state = { ...state, move: 3, finds: ["A", "B"], discount: false };
    expect(totals(state)).toEqual({ A: 26400, B: 25520, C: 25600 });
    state = demoReducer(state, { type: "find", key: "C" });
    expect(totals(state)).toEqual({ A: 26400, B: 26970, C: 25600 });
  });

  it("takes the kit's value for a skipped move and switches the discount on at payment", () => {
    let state = INITIAL_STATE;
    for (let index = 0; index < 4; index++) state = demoReducer(state, { type: "nextMove" });
    expect(state.move).toBe(4);
    expect(state.taken).toEqual(["menge", "einheit", "lieferort", "einmalig"]);
    expect(state.discount).toBe(true);
    expect(totals(state)).toEqual({ A: 25872, B: 26554, C: 24910 });
    expect(totals(demoReducer(state, { type: "discount", on: false }))).toEqual({ A: 26400, B: 26970, C: 25600 });
  });

  it("opens the method at the end of the basis, and marks the turning point once it is passed", () => {
    const state = run({ type: "method" });
    expect(state.move).toBe(5);
    expect(moveDone(state, "einmalig")).toBe(true);
    const paper = run({ type: "paper", v: 7, flip: 6.97 }, { type: "paper", v: 2, flip: 6.97 });
    expect(paper.crossed).toBe(true);
    expect(run({ type: "cap", cap: 12 }).cap).toBe(10);
  });

  it("forgets everything on restart", () => {
    expect(run({ type: "guess", key: "B" }, { type: "restart" })).toEqual(INITIAL_STATE);
  });
});
