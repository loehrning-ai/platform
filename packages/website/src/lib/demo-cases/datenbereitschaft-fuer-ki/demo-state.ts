/**
 * The state of "Die Fragekarte" between the scenes, as one pure reducer.
 * Every number the stage prints is computed from this state and the kit
 * values (logic.ts), never stored here. Own data lives in its own component
 * state and is never touched by "restart".
 */
import { EDGE_STARTS, openingFromStart } from "./logic";

export const OPENING_MAX = 350_000;
export const OPENING_STEP = 5_000;
export const OPENING_BIG_STEP = 50_000;
/** Within this distance of zero (in euros) the water line snaps to Claude's start. */
export const NOTCH_EUR = 6_000;
/** The first drag counts as "moved the water" from this distance on. */
export const MOVED_EUR = 20_000;
/** A chip placed against the card glides to the card's side after this long (scene 5). */
export const SETTLE_MS = 1_200;

export type Sent = "report" | "ask";
export type GapId = "kind" | "period" | "unit" | "date";
export const GAPS: readonly GapId[] = ["kind", "period", "unit", "date"];
export type ChipId = "kindRight" | "kindWrong" | "periodRight" | "periodWrong" | "unit" | "dateRight" | "dateWrong";
export const CHIP_GAP: Readonly<Record<ChipId, GapId>> = {
  kindRight: "kind",
  kindWrong: "kind",
  periodRight: "period",
  periodWrong: "period",
  unit: "unit",
  dateRight: "date",
  dateWrong: "date",
};
export const RIGHT_CHIPS: readonly ChipId[] = ["kindRight", "periodRight", "unit", "dateRight"];
/** The order the chips lie in the tray: mixed, so the right one is never always first. */
export const CHIP_ORDER: readonly ChipId[] = ["kindWrong", "periodRight", "dateWrong", "unit", "kindRight", "periodWrong", "dateRight"];

export type TileId = "monthly_revenue" | "subscription_export" | "billing_events" | "acct_history" | "customer_master" | "usage_log" | "tickets" | "view";
export const TILES: readonly TileId[] = ["monthly_revenue", "subscription_export", "billing_events", "acct_history", "customer_master", "usage_log", "tickets", "view"];

export type PourKind = "none" | "june" | "levels" | "changes";
export interface Pour {
  readonly kind: PourKind;
  /** Quarter months (0 April, 1 May, 2 June) poured together, in the order they were stacked. */
  readonly members: readonly number[];
}

export type Code = "A" | "N" | "C";
export const CODES: readonly Code[] = ["A", "N", "C"];

export type FileId = "view" | "definitions" | "instructions" | "export" | "contacts" | "testlist";
export const FILES: readonly FileId[] = ["view", "definitions", "instructions", "export", "contacts", "testlist"];
export type Side = "in" | "out";
/** Where the question card puts each file: in Claude's Project, or with you. */
export const CARD_SIDE: Readonly<Record<FileId, Side>> = {
  view: "in",
  definitions: "in",
  instructions: "in",
  export: "out",
  contacts: "out",
  testlist: "out",
};

export interface DemoState {
  readonly sent: Sent | null;
  readonly run: 1 | 2;
  readonly opening: number;
  readonly dragged: boolean;
  readonly edge: number;
  readonly wanneMove: 1 | 2;
  readonly readAsLevel: boolean;
  readonly gaps: Readonly<Record<GapId, ChipId | null>>;
  /** The chip that landed last, for its one sentence. */
  readonly lastChip: ChipId | null;
  readonly sichtMove: 1 | 2;
  /** The tile that landed last in box 2 (an export tile springs back out). */
  readonly lastTile: TileId | null;
  readonly viewPlaced: boolean;
  readonly pour: Pour;
  readonly seenLevels: boolean;
  readonly seenOther: boolean;
  readonly werMove: 1 | 2;
  readonly codes: Readonly<Record<Code, boolean>>;
  /** "Nach dem Wort ‚active‘ suchen" is on: the codes are ignored. */
  readonly search: boolean;
  readonly codesSeen: boolean;
  readonly placed: Readonly<Record<FileId, Side | null>>;
  /** The chip that landed last and whether it still waits to glide to the card's side. */
  readonly lastFile: FileId | null;
  /** Whether the visitor's own placement of lastFile matched the card (kept after the glide). */
  readonly lastMatched: boolean;
  readonly pending: FileId | null;
  readonly projektMove: 1 | 2;
  readonly tested: boolean;
}

const NO_GAPS: Readonly<Record<GapId, ChipId | null>> = { kind: null, period: null, unit: null, date: null };
const NOTHING_PLACED: Readonly<Record<FileId, Side | null>> = { view: null, definitions: null, instructions: null, export: null, contacts: null, testlist: null };

export const INITIAL_STATE: DemoState = {
  sent: null,
  run: 2,
  opening: 0,
  dragged: false,
  edge: 0,
  wanneMove: 1,
  readAsLevel: false,
  gaps: NO_GAPS,
  lastChip: null,
  sichtMove: 1,
  lastTile: null,
  viewPlaced: false,
  pour: { kind: "none", members: [] },
  seenLevels: false,
  seenOther: false,
  werMove: 1,
  codes: { A: false, N: false, C: false },
  search: false,
  codesSeen: false,
  placed: NOTHING_PLACED,
  lastFile: null,
  lastMatched: false,
  pending: null,
  projektMove: 1,
  tested: false,
};

export type Action =
  | { readonly type: "restart" }
  | { readonly type: "send"; readonly to: Sent }
  | { readonly type: "run"; readonly run: 1 | 2 }
  /** `snap` (pointer drags only) pulls a value near zero onto Claude's start; keys step freely. */
  | { readonly type: "opening"; readonly value: number; readonly snap?: boolean }
  | { readonly type: "edge"; readonly edge: number }
  | { readonly type: "wanneMove"; readonly move: 1 | 2 }
  | { readonly type: "readAsLevel"; readonly on: boolean }
  | { readonly type: "chip"; readonly chip: ChipId }
  | { readonly type: "unchip"; readonly gap: GapId }
  | { readonly type: "sichtMove"; readonly move: 1 | 2 }
  | { readonly type: "tile"; readonly tile: TileId }
  | { readonly type: "pour"; readonly pour: Pour }
  | { readonly type: "werMove"; readonly move: 1 | 2 }
  | { readonly type: "code"; readonly code: Code; readonly on: boolean }
  | { readonly type: "search"; readonly on: boolean }
  | { readonly type: "place"; readonly file: FileId; readonly side: Side }
  | { readonly type: "settle" }
  | { readonly type: "projektMove"; readonly move: 1 | 2 }
  | { readonly type: "test" }
  | { readonly type: "reach"; readonly beat: number; readonly move?: 1 | 2 };

export function clampOpening(value: number): number {
  return Math.min(OPENING_MAX, Math.max(0, Math.round(value)));
}

/** The opening the tub shows: dragged by hand, or computed from where the file starts. */
export function openingOf(state: DemoState): number {
  return state.edge > 0 ? openingFromStart(EDGE_STARTS[state.edge] ?? "2026-01") : state.opening;
}

export function gapRight(state: DemoState, gap: GapId): boolean {
  const chip = state.gaps[gap];
  return chip !== null && RIGHT_CHIPS.includes(chip);
}

export function questionDone(state: DemoState): boolean {
  return GAPS.every((gap) => gapRight(state, gap));
}

export function pourDone(state: DemoState): boolean {
  return state.seenLevels && state.seenOther;
}

export function codesRight(state: DemoState): boolean {
  return !state.search && state.codes.A && state.codes.N && !state.codes.C;
}

export function sortDone(state: DemoState): boolean {
  return FILES.every((file) => state.placed[file] === CARD_SIDE[file]) && state.pending === null;
}

export type BoxFill = "empty" | "half" | "full";

/** The five boxes of the card as glyph states (shape, never colour alone). */
export function boxes(state: DemoState): readonly BoxFill[] {
  const anyGap = GAPS.some((gap) => state.gaps[gap] !== null);
  return [
    questionDone(state) ? "full" : anyGap ? "half" : "empty",
    state.viewPlaced ? "full" : "empty",
    pourDone(state) && codesRight(state) ? "full" : pourDone(state) || codesRight(state) ? "half" : "empty",
    state.placed.contacts === "out" ? "full" : "empty",
    state.tested ? "full" : "empty",
  ];
}

/** Whether the inner move of a beat is done (the dock shows "Weiter" prominent then). */
export function moveDone(state: DemoState, beat: string): boolean {
  switch (beat) {
    case "antwort":
      return state.sent !== null;
    case "wanne":
      return state.wanneMove === 1 ? state.dragged : state.edge === EDGE_STARTS.length - 1;
    case "sicht":
      return state.sichtMove === 1 ? questionDone(state) : state.viewPlaced;
    case "wer-zaehlt":
      return state.werMove === 1 ? pourDone(state) : codesRight(state);
    case "projekt":
      return state.projektMove === 1 ? sortDone(state) : state.tested;
    default:
      return true;
  }
}

const RIGHT_GAPS: Readonly<Record<GapId, ChipId>> = { kind: "kindRight", period: "periodRight", unit: "unit", date: "dateRight" };

/**
 * Fills what the scenes before `beat` would have filled, with the card's own
 * answers (the FOLDLINE column of FRAGEKARTE.md), so a deep link or a jump on
 * the path never shows a half empty card for no reason. Never undoes a move.
 */
function reach(state: DemoState, beat: number, move: 1 | 2 | undefined): DemoState {
  let next = state;
  if (beat >= 3) {
    next = {
      ...next,
      gaps: questionDone(next) ? next.gaps : RIGHT_GAPS,
      viewPlaced: true,
      sichtMove: 2,
      wanneMove: 2,
      edge: next.edge === 0 ? EDGE_STARTS.length - 1 : next.edge,
      dragged: true,
    };
  }
  if (beat >= 4) {
    next = { ...next, seenLevels: true, seenOther: true, codes: { A: true, N: true, C: false }, search: false, codesSeen: true, werMove: 2 };
  }
  if (beat >= 5 || (beat === 4 && move === 2)) {
    next = { ...next, placed: { ...CARD_SIDE }, pending: null, projektMove: 2 };
  }
  if (beat >= 5) next = { ...next, tested: true };
  if (beat === 1 && move !== undefined) next = { ...next, wanneMove: move };
  return next;
}

export function demoReducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "restart":
      return INITIAL_STATE;
    case "send":
      return { ...state, sent: action.to };
    case "run":
      return { ...state, run: action.run };
    case "opening": {
      const value = clampOpening(action.snap && action.value < NOTCH_EUR ? 0 : action.value);
      return { ...state, opening: value, edge: 0, dragged: state.dragged || value >= MOVED_EUR };
    }
    case "edge":
      return { ...state, edge: Math.min(EDGE_STARTS.length - 1, Math.max(0, Math.round(action.edge))) };
    case "wanneMove":
      return { ...state, wanneMove: action.move, readAsLevel: false };
    case "readAsLevel":
      return { ...state, readAsLevel: action.on };
    case "chip":
      return { ...state, gaps: { ...state.gaps, [CHIP_GAP[action.chip]]: action.chip }, lastChip: action.chip };
    case "unchip":
      return { ...state, gaps: { ...state.gaps, [action.gap]: null }, lastChip: null };
    case "sichtMove":
      return { ...state, sichtMove: action.move };
    case "tile":
      return { ...state, lastTile: action.tile, viewPlaced: state.viewPlaced || action.tile === "view" };
    case "pour": {
      const pour = action.pour;
      return {
        ...state,
        pour,
        seenLevels: state.seenLevels || (pour.kind === "levels" && pour.members.length >= 2),
        seenOther: state.seenOther || pour.kind === "june" || (pour.kind === "changes" && pour.members.length >= 2),
      };
    }
    case "werMove":
      return { ...state, werMove: action.move };
    case "code":
      return { ...state, codes: { ...state.codes, [action.code]: action.on }, search: false, codesSeen: true };
    case "search":
      return { ...state, search: action.on };
    case "place": {
      const settled = state.pending ? { ...state.placed, [state.pending]: CARD_SIDE[state.pending] } : state.placed;
      const placed = { ...settled, [action.file]: action.side };
      const matched = action.side === CARD_SIDE[action.file];
      return { ...state, placed, lastFile: action.file, lastMatched: matched, pending: matched ? null : action.file };
    }
    case "settle":
      return state.pending ? { ...state, placed: { ...state.placed, [state.pending]: CARD_SIDE[state.pending] }, pending: null } : state;
    case "projektMove":
      return { ...state, projektMove: action.move };
    case "test":
      return sortDone(state) || state.projektMove === 2 ? { ...state, tested: true } : state;
    case "reach":
      return reach(state, action.beat, action.move);
  }
}
