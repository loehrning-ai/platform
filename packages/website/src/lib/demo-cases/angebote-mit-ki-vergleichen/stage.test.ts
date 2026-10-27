import { describe, expect, it } from "vitest";
import { kitRows, STACK } from "./config";
import { SECOND_CASE_CSV } from "./kit-data";
import { parse } from "./stack";
import { demoReducer, INITIAL_STATE, type Action, type DemoState } from "./demo-state";
import { kitScale, paperNumbers, stageView, type View } from "./stage";

const kit = kitRows("de");
const SECOND = parse(SECOND_CASE_CSV, "de", STACK).rows;
const run = (...actions: Action[]) => actions.reduce<DemoState>(demoReducer, INITIAL_STATE);
const view = (name: View, state: DemoState, own: Parameters<typeof stageView>[0]["own"] = null) => stageView({ view: name, state, kit, own });
const euros = (name: View, state: DemoState) => {
  const shown = view(name, state);
  return { order: shown.order.map((option) => option.slice(0, 1)).join(""), totals: shown.bars?.map((bar) => bar.total / 100) ?? null };
};

describe("stageView: what the Rangliste shows", () => {
  it("shows only printed prices for the guess, in the kit's order", () => {
    const shown = view("tipp", INITIAL_STATE);
    expect(shown.mode).toBe("printed");
    expect(shown.bars).toBeNull();
    expect(shown.order).toEqual(["A Nürnberg", "B Poznań", "C Brno"]);
  });

  it("draws empty outlines once the quantity is set, bars only per box", () => {
    expect(view("kipp", run({ type: "qty" })).mode).toBe("outline");
    expect(euros("kipp", run({ type: "qty" }, { type: "unit", unit: "piece" }))).toEqual({ order: "BCA", totals: [26400, 20800, 23000] });
  });

  it("puts C first after the third find and ends at the kit's totals", () => {
    const found = run({ type: "nextMove" }, { type: "nextMove" }, { type: "nextMove" }, { type: "find", key: "A" }, { type: "find", key: "B" }, { type: "find", key: "C" });
    expect(euros("kipp", found).order).toBe("CAB");
    expect(euros("kipp", run({ type: "method" }))).toEqual({ order: "CAB", totals: [25872, 26554, 24910] });
  });

  it("raises C's goods with the paper price and swaps A and C past the turning point", () => {
    expect(euros("papier", { ...INITIAL_STATE, v: 10 })).toEqual({ order: "ACB", totals: [25872, 26554, 26290] });
    expect(euros("papier", { ...INITIAL_STATE, v: 10, cap: 5 })).toEqual({ order: "CAB", totals: [25872, 26554, 25600] });
    const shown = view("papier", { ...INITIAL_STATE, v: 10, cap: 5 });
    const c = shown.bars?.find((bar) => bar.option === "C Brno");
    expect(c?.segments.filter((segment) => segment.line === "Papier").map((segment) => [segment.kind, segment.cents / 100])).toEqual([
      ["Papier", 690],
      ["Ghost", 690],
    ]);
  });

  it("opens free play as printed, then counts only the fields switched on", () => {
    expect(view("free", INITIAL_STATE).mode).toBe("printed");
    expect(euros("free", { ...INITIAL_STATE, free: { ...INITIAL_STATE.free, unit: "piece", fields: ["lieferort"] } }).totals).toEqual([26400, 25520, 25600]);
  });

  it("shows own rows with an open line and no cheapest offer", () => {
    const shown = view("deins", INITIAL_STATE, SECOND);
    expect(shown.own).toBe(true);
    expect(shown.cheapest).toBe("X Kassel");
    const open = view("deins", INITIAL_STATE, SECOND.filter((row) => !(row.option === "Y Leipzig" && row.line === "Fracht")));
    expect(open.cheapest).toBeNull();
    expect(open.bars?.find((bar) => bar.option === "Y Leipzig")?.open).toBe(true);
  });

  it("keeps one scale for every kit state", () => {
    expect(kitScale(kit)).toBe(Math.round(2698000 * 1.04));
  });
});

describe("paperNumbers: the numbers of beat 3", () => {
  it("has the turning point, the lead and 138 € a point", () => {
    const at = paperNumbers(kit, 0, null);
    expect(at.flip).toBeCloseTo(6.97, 2);
    expect(at.lead).toBe(96200);
    expect(at.perPoint).toBe(13800);
    expect(at.decider).toBe("Ware");
  });

  it("names freight as the deciding line at 10 %, and C at most 25.600 € with a cap of 5 %", () => {
    const ten = paperNumbers(kit, 10, null);
    expect(ten.cMinusA).toBe(41800);
    expect(ten.decider).toBe("Fracht");
    expect(paperNumbers(kit, 10, 5).cCapped).toBe(2560000);
  });
});
