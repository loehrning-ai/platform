/**
 * What the visitor did on the guided path, as plain data and a reducer: the guess, the five fields of
 * the basis (beat 2, in the field card's order), the paper rise and the cap (beat 3), and the levers of
 * free play. `included()` turns the state into the cells the bars show, so every partial total is
 * assemble() over exactly what the visitor has added. Own offers are not here: "Von vorn" resets this
 * state and never the visitor's rows.
 */
import type { Field } from "./basis";
import { OFFER_KEYS, TERMS, type OfferKey, type Payer } from "./konditionen";

export type Move = "menge" | "einheit" | "lieferort" | "einmalig" | "zahlung";
export const MOVES: readonly Move[] = ["menge", "einheit", "lieferort", "einmalig", "zahlung"];
export type Unit = "printed" | "piece";

export interface FreeState {
  readonly unit: Unit;
  readonly fields: readonly Field[];
  readonly v: number;
  readonly cap: number | null;
  readonly data: "kit" | "own";
}

export interface DemoState {
  readonly guess: OfferKey | null;
  /** The move of beat 2 in view (0 to 4); 5 is the method sheet at its end. */
  readonly move: number;
  readonly qty: boolean;
  readonly unit: Unit;
  readonly terms: Readonly<Record<OfferKey, Payer | null>>;
  /** The last delivery term the visitor sorted, wrong drops included. */
  readonly lastTerm: { readonly key: OfferKey; readonly wrong: boolean } | null;
  readonly finds: readonly OfferKey[];
  readonly discount: boolean;
  /** Moves whose value came from the kit because the visitor went on without doing them. */
  readonly taken: readonly Move[];
  readonly v: number;
  readonly cap: number | null;
  /** The paper rise passed the turning point once: only then does the cap appear. */
  readonly crossed: boolean;
  readonly free: FreeState;
}

const NO_TERMS: Readonly<Record<OfferKey, Payer | null>> = { A: null, B: null, C: null };
const KIT_TERMS: Readonly<Record<OfferKey, Payer>> = { A: TERMS.A.delivery.payer, B: TERMS.B.delivery.payer, C: TERMS.C.delivery.payer };

export const FREE_START: FreeState = { unit: "printed", fields: [], v: 0, cap: null, data: "kit" };

export const INITIAL_STATE: DemoState = {
  guess: null,
  move: 0,
  qty: false,
  unit: "printed",
  terms: NO_TERMS,
  lastTerm: null,
  finds: [],
  discount: false,
  taken: [],
  v: 0,
  cap: null,
  crossed: false,
  free: FREE_START,
};

/** The basis with every field filled the kit's way: where beat 3 and later start. */
export const COMPLETE: Omit<DemoState, "guess" | "free" | "v" | "cap" | "crossed"> = {
  move: 5,
  qty: true,
  unit: "piece",
  terms: KIT_TERMS,
  lastTerm: null,
  finds: ["A", "B", "C"],
  discount: true,
  taken: [],
};

export type Action =
  | { readonly type: "guess"; readonly key: OfferKey }
  | { readonly type: "qty" }
  | { readonly type: "unit"; readonly unit: Unit }
  | { readonly type: "term"; readonly key: OfferKey; readonly payer: Payer }
  | { readonly type: "find"; readonly key: OfferKey }
  | { readonly type: "discount"; readonly on: boolean }
  | { readonly type: "nextMove" }
  | { readonly type: "prevMove" }
  | { readonly type: "complete" }
  | { readonly type: "method" }
  | { readonly type: "paper"; readonly v: number; readonly flip: number | null }
  | { readonly type: "cap"; readonly cap: number | null }
  | { readonly type: "free"; readonly patch: Partial<FreeState> }
  | { readonly type: "restart" };

export function moveDone(state: DemoState, move: Move): boolean {
  switch (move) {
    case "menge":
      return state.qty;
    case "einheit":
      return state.unit === "piece";
    case "lieferort":
      return OFFER_KEYS.every((key) => state.terms[key] !== null);
    case "einmalig":
      return state.finds.length === OFFER_KEYS.length;
    case "zahlung":
      return true;
  }
}

/** Fills one move the kit's way (the visitor pressed on without doing it). */
function takeFromKit(state: DemoState, move: Move): DemoState {
  if (moveDone(state, move)) return state;
  const taken = [...state.taken, move];
  switch (move) {
    case "menge":
      return { ...state, qty: true, taken };
    case "einheit":
      return { ...state, unit: "piece", taken };
    case "lieferort":
      return { ...state, terms: KIT_TERMS, lastTerm: null, taken };
    case "einmalig":
      return { ...state, finds: [...OFFER_KEYS], taken };
    case "zahlung":
      return state;
  }
}

/** The moves before `move` filled the kit's way, so a later move never shows a half-built basis. */
function upTo(state: DemoState, move: number): DemoState {
  let next = state;
  for (const earlier of MOVES.slice(0, move)) next = takeFromKit(next, earlier);
  // Arriving at payment switches the discount on: Brandtwerk always takes it (kosten-intern.md).
  if (move >= 4 && state.move < 4) next = { ...next, discount: true };
  return next;
}

export function demoReducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "guess":
      return { ...state, guess: action.key };
    case "qty":
      return { ...state, qty: true };
    case "unit":
      return state.qty || action.unit === "printed" ? { ...state, unit: action.unit } : { ...state, qty: true, unit: action.unit };
    case "term": {
      const wrong = KIT_TERMS[action.key] !== action.payer;
      // A wrong drop scores nothing: the chip springs over to the right pocket.
      return { ...state, terms: { ...state.terms, [action.key]: KIT_TERMS[action.key] }, lastTerm: { key: action.key, wrong } };
    }
    case "find":
      return state.finds.includes(action.key) ? state : { ...state, finds: [...state.finds, action.key] };
    case "discount":
      return { ...state, discount: action.on };
    case "nextMove": {
      const current = MOVES[state.move];
      const filled = current ? takeFromKit(state, current) : state;
      const move = Math.min(5, state.move + 1);
      return { ...upTo(filled, move), move };
    }
    case "prevMove":
      return { ...state, move: Math.max(0, state.move - 1) };
    case "complete":
      return { ...state, ...COMPLETE, taken: state.taken, discount: state.move >= 4 ? state.discount : true };
    case "method":
      return { ...state, ...COMPLETE, taken: state.taken, discount: state.move >= 4 ? state.discount : true, move: 5 };
    case "paper": {
      const v = Math.max(0, Math.min(10, Math.round(action.v * 10) / 10));
      return { ...state, v, crossed: state.crossed || (action.flip !== null && v >= action.flip) };
    }
    case "cap":
      return { ...state, cap: action.cap === null ? null : Math.max(0, Math.min(10, Math.round(action.cap * 10) / 10)) };
    case "free":
      return { ...state, free: { ...state.free, ...action.patch } };
    case "restart":
      return INITIAL_STATE;
  }
}

/**
 * Which cells the bars count in beat 2: the goods once the unit is per box; freight and storage for
 * each offer whose delivery term is sorted; the one-off line only after all three finds (the rows
 * reorder only then); the discount from the payment move on, while the switch is on.
 */
export function included(state: DemoState, keyOf: (option: string) => OfferKey | null): (option: string, line: string) => boolean {
  return (option, line) => {
    if (state.unit !== "piece") return false;
    const key = keyOf(option);
    switch (line) {
      case "Ware":
        return true;
      case "Fracht":
      case "Lager":
        return key !== null && state.terms[key] !== null;
      case "Einmalig":
        return state.finds.length === OFFER_KEYS.length;
      case "Skonto":
        return state.move >= 4 && state.discount;
      default:
        return false;
    }
  };
}
