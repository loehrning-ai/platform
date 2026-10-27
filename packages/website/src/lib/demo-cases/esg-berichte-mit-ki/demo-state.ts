/**
 * Every lever of the five scenes as one pure reducer: the card's quotes, the
 * workbench, the electricity file (its quote, the morph and the guess), the
 * September invoice and the folder. The visitor's own data is not in here: it
 * lives in the own-data step and survives a restart (contract section 7).
 */
import { CARD_START, cardReducer, type CardAction, type CardState } from "./card-state";
import { offsetOf, type BenchPlace, type BenchScope } from "./bench";
import { DRAFT_LINE, type FileId, STICHTAG } from "./kit";
import type { RowId } from "./ledger";

/** The September guess runs from 0 to 50 MWh in steps of 0,5. */
export const GUESS_MAX = 50;
export const GUESS_STEP = 0.5;
/** The electricity chart's fixed scale, so the guess bar and the bars share one axis. */
export const STROM_SCALE = 50_000;

export interface StromState {
  /** The F2 figure is connected to the draft's line 5. */
  readonly linked: boolean;
  /** The last line the figure was dropped on without carrying it. */
  readonly miss: number | null;
  /** The morph, 0 (rows) to 1 (months). */
  readonly t: number;
  /** The visitor's guess for September in MWh, or null. */
  readonly guess: number | null;
  readonly guessKept: boolean;
  /** The same check on the water file ("Mehr dazu"). */
  readonly water: boolean;
}

export interface DemoState {
  readonly card: CardState;
  readonly bench: { readonly scope: BenchScope; readonly place: BenchPlace; readonly offset: number };
  readonly strom: StromState;
  /** The September invoice sits in the September slot (S4) and on the strom chip (S5). */
  readonly invoiceIn: boolean;
  /** The invoice went in or out at least once in the folder, so the four rechecks show their reasons. */
  readonly rechecked: boolean;
  readonly folder: { readonly file: FileId | null; readonly highlight: readonly RowId[] };
}

export const STROM_START: StromState = { linked: false, miss: null, t: 0, guess: null, guessKept: false, water: false };

export const DEMO_START: DemoState = {
  card: CARD_START,
  bench: { scope: "alle", place: "regalkarte", offset: offsetOf(STICHTAG) },
  strom: STROM_START,
  invoiceIn: false,
  rechecked: false,
  folder: { file: null, highlight: [] },
};

export type DemoAction =
  | { readonly type: "card"; readonly action: CardAction }
  | { readonly type: "scope"; readonly scope: BenchScope }
  | { readonly type: "place"; readonly place: BenchPlace }
  | { readonly type: "offset"; readonly offset: number }
  | { readonly type: "stromLand"; readonly line: number }
  | { readonly type: "morph"; readonly t: number }
  | { readonly type: "guess"; readonly value: number }
  | { readonly type: "keepGuess" }
  | { readonly type: "water"; readonly on: boolean }
  | { readonly type: "invoice"; readonly in: boolean; readonly inFolder?: boolean }
  | { readonly type: "file"; readonly file: FileId | null }
  | { readonly type: "highlight"; readonly rows: readonly RowId[] }
  /** Reaching a beat (guided seek, deep link, free play) sets what the earlier beats would have left. */
  | { readonly type: "reach"; readonly index: number }
  /** Free play: every scene from its finished state. */
  | { readonly type: "free" }
  | { readonly type: "restart" };

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

export function roundGuess(value: number): number {
  const stepped = Math.round(value / GUESS_STEP) * GUESS_STEP;
  return Math.min(GUESS_MAX, Math.max(0, stepped));
}

/** Beat indices: 0 Regalkarte, 1 Zitate, 2 Umschreiben, 3 Strom, 4 Rechnung, 5 Ordner, 6 Deine Datei, 7 Mitnehmen. */
export const BEAT_INDEX = { zitate: 1, umschreiben: 2, strom: 3, rechnung: 4, ordner: 5 } as const;

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "card":
      return { ...state, card: cardReducer(state.card, action.action) };
    case "scope":
      return { ...state, bench: { ...state.bench, scope: action.scope } };
    case "place":
      return { ...state, bench: { ...state.bench, place: action.place } };
    case "offset":
      return { ...state, bench: { ...state.bench, offset: Math.round(action.offset) } };
    case "stromLand":
      return action.line === DRAFT_LINE.figure
        ? { ...state, strom: { ...state.strom, linked: true, miss: null } }
        : { ...state, strom: { ...state.strom, miss: action.line } };
    case "morph":
      return { ...state, strom: { ...state.strom, t: clamp01(action.t) } };
    case "guess":
      return { ...state, strom: { ...state.strom, guess: roundGuess(action.value) } };
    case "keepGuess":
      return state.strom.guess === null ? state : { ...state, strom: { ...state.strom, guessKept: true } };
    case "water":
      return { ...state, strom: { ...state.strom, water: action.on } };
    case "invoice":
      return { ...state, invoiceIn: action.in, rechecked: state.rechecked || Boolean(action.inFolder) };
    case "file":
      return { ...state, folder: { file: action.file, highlight: [] } };
    case "highlight":
      return { ...state, folder: { ...state.folder, highlight: action.rows } };
    case "reach": {
      let next = state;
      if (action.index > BEAT_INDEX.zitate && !Object.keys(state.card.links).length) next = { ...next, card: cardReducer(next.card, { type: "all" }) };
      if (action.index > BEAT_INDEX.strom) next = { ...next, strom: { ...next.strom, linked: true, t: 1, water: false } };
      if (action.index === BEAT_INDEX.ordner && !state.rechecked) next = { ...next, invoiceIn: true };
      return next;
    }
    case "free":
      return freeState(state);
    case "restart":
      return DEMO_START;
  }
}

/** Free play: every scene starts from its finished state, and every lever stays live. */
export function freeState(state: DemoState): DemoState {
  const card = Object.keys(state.card.links).length === 3 ? state.card : cardReducer(state.card, { type: "all" });
  return { ...state, card, strom: { ...state.strom, linked: true, t: state.strom.linked ? state.strom.t : 1 } };
}
