/**
 * What the Rangliste shows in each view, as one pure function of the visitor's state: printed prices,
 * empty outlines, or bars over exactly the cells counted so far; the order (cheapest first once there
 * is a basis); the offer in the lead; and the paper numbers of beat 3. The client draws this and
 * nothing else, so every bar width and every number in a caption comes from the engine.
 */
import { assemble, effectiveRise, FIELDS, linesOf, paperScale, surcharge, type Paper } from "./basis";
import { axisFloor, barRows, scaleFor, type BarRow, type Surcharge } from "./bars";
import { HORIZON, PAPER, paperFlip, STACK } from "./config";
import { included, type DemoState } from "./demo-state";
import { keyOf, OFFER_KEYS, TERMS } from "./konditionen";
import { compute, type CostRow, type StackModel } from "./stack";

export type View = "tipp" | "kipp" | "papier" | "deins" | "mitnehmen" | "free";
export type Mode = "printed" | "outline" | "bars";

/** C's paper clause: 60 % of the goods price (demo.json and angebot-c-brno.md). */
export const PAPER_CLAUSE: Paper = { option: PAPER.option, share: PAPER.index.share };

/** Every line of the basis: the goods, freight, storage, one-off costs and the discount. */
export const ALL_LINES = linesOf(FIELDS);

export interface StageView {
  readonly mode: Mode;
  readonly model: StackModel | null;
  readonly bars: readonly BarRow[] | null;
  /** Option names top to bottom. */
  readonly order: readonly string[];
  readonly cheapest: string | null;
  readonly scale: number;
  /** Where the bars start (axisFloor): one amount for every kit state, its own for own offers. */
  readonly floor: number;
  readonly surcharge: Surcharge | null;
  /** The view shows the visitor's own rows, not the kit's. */
  readonly own: boolean;
}

export interface StageInput {
  readonly view: View;
  readonly state: DemoState;
  readonly kit: readonly CostRow[];
  /** The visitor's own rows once "Angebote vergleichen" read them, else null. */
  readonly own: readonly CostRow[] | null;
}

const KIT_ORDER = OFFER_KEYS.map((key) => TERMS[key].option);

/** The paper model of offer C at a rise, capped, with every line of the basis. */
export function paperModel(kit: readonly CostRow[], v: number, cap: number | null): StackModel {
  return assemble(kit, ALL_LINES, STACK, HORIZON, paperScale(PAPER_CLAUSE, v, cap));
}

/** The surcharge on C's goods without the cap, for the ghost hatching beyond the cap stop. */
export function surchargeOf(kit: readonly CostRow[], v: number): Surcharge | null {
  const goods = kit.find((row) => row.option === PAPER_CLAUSE.option && row.line === "Ware");
  if (!goods || v <= 0) return null;
  return { option: PAPER_CLAUSE.option, uncapped: surcharge(goods.cents * HORIZON, PAPER_CLAUSE, v) };
}

/** A scale that holds every kit state still: the full basis, and C at the top of the paper slider. */
export function kitScale(kit: readonly CostRow[]): number {
  const full = barRows(assemble(kit, ALL_LINES, STACK, HORIZON));
  const top = barRows(paperModel(kit, 10, null), surchargeOf(kit, 10));
  return scaleFor([...full, ...top]);
}

/** The floor of every kit state: the full basis decides it, so the bars never jump between moves. */
export function kitFloor(kit: readonly CostRow[]): number {
  return axisFloor(barRows(assemble(kit, ALL_LINES, STACK, HORIZON)));
}

function ranked(model: StackModel): { readonly order: readonly string[]; readonly cheapest: string | null } {
  if (!model.complete) return { order: model.options.map((option) => option.name), cheapest: null };
  return { order: model.ranked.map((option) => option.name), cheapest: model.winner.name };
}

function withBars(model: StackModel, scale: number, floor: number, own: boolean, sur: Surcharge | null = null): StageView {
  return { mode: "bars", model, bars: barRows(model, sur), ...ranked(model), scale, floor, surcharge: sur, own };
}

function printed(mode: "printed" | "outline", scale: number, floor: number): StageView {
  return { mode, model: null, bars: null, order: KIT_ORDER, cheapest: null, scale, floor, surcharge: null, own: false };
}

function ownView(rows: readonly CostRow[]): StageView {
  const model = compute(rows, HORIZON, null, STACK);
  const bars = barRows(model);
  return withBars(model, scaleFor(bars), axisFloor(bars), true);
}

export function stageView({ view, state, kit, own }: StageInput): StageView {
  const scale = kitScale(kit);
  const floor = kitFloor(kit);
  const full = () => withBars(assemble(kit, ALL_LINES, STACK, HORIZON), scale, floor, false);
  switch (view) {
    case "tipp":
      return printed("printed", scale, floor);
    case "kipp": {
      if (!state.qty) return printed("printed", scale, floor);
      if (state.unit === "printed") return printed(state.move === 0 ? "outline" : "printed", scale, floor);
      return withBars(assemble(kit, included(state, keyOf), STACK, HORIZON), scale, floor, false);
    }
    case "papier":
      return withBars(paperModel(kit, state.v, state.cap), scale, floor, false, surchargeOf(kit, state.v));
    case "deins":
      return own ? ownView(own) : full();
    case "mitnehmen":
      return full();
    case "free": {
      if (state.free.data === "own" && own) return ownView(own);
      if (state.free.unit === "printed") return printed("printed", scale, floor);
      const { v, cap, fields } = state.free;
      const model = assemble(kit, linesOf(fields), STACK, HORIZON, paperScale(PAPER_CLAUSE, v, cap));
      return withBars(model, scale, floor, false, surchargeOf(kit, v));
    }
  }
}

export interface PaperNumbers {
  /** Where A becomes cheaper than C, in per cent (6,97). */
  readonly flip: number;
  /** C's lead over A without a surcharge, in cents (962 €). */
  readonly lead: number;
  /** Surcharge per percentage point, in cents (138 €). */
  readonly perPoint: number;
  /** C minus A at this rise and cap: negative while C is cheaper. */
  readonly cMinusA: number;
  /** C's total at the cap (the most C can cost with that cap), or null without a cap. */
  readonly cCapped: number | null;
  readonly decider: string;
  readonly winner: string;
}

const A_NAME = TERMS.A.option;
const C_NAME = TERMS.C.option;

export function paperNumbers(kit: readonly CostRow[], v: number, cap: number | null): PaperNumbers {
  const flip = paperFlip(kit);
  if (!flip) throw new Error("kostenzeilen.csv: no turning point for the paper index");
  const base = paperModel(kit, 0, null);
  const total = (model: StackModel, name: string) => model.options.find((option) => option.name === name)?.total ?? 0;
  const now = paperModel(kit, v, cap);
  const goods = kit.find((row) => row.option === C_NAME && row.line === "Ware")?.cents ?? 0;
  return {
    flip: flip.v,
    lead: total(base, A_NAME) - total(base, C_NAME),
    perPoint: surcharge(goods * HORIZON, PAPER_CLAUSE, 1),
    cMinusA: total(now, C_NAME) - total(now, A_NAME),
    cCapped: cap === null ? null : total(paperModel(kit, effectiveRise(10, cap), null), C_NAME),
    decider: now.decider,
    winner: now.winner.name,
  };
}
