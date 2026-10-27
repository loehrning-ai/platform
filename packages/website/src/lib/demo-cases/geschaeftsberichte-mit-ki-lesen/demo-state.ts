/**
 * The state of the guided path and free play, as one pure reducer. Every
 * number the stage shows is computed from this state through reading() and
 * friends; nothing here holds a number from the kit. Own cards live apart
 * (demo.tsx), because "Von vorn" never clears them.
 */
import { startTrigger } from "./decide";
import { COUNTERS, maxMerges, mergeCells, readingId, type Counter, type Denom, type Period, type SeptemberEnds, type Verdict } from "./definitions";
import { AUGUST_RANGE, clampRange, type WeekRange } from "./trace";

export type CountEvent = "entry" | "counter" | "counterNew" | "denomOff" | "denomOn";
export type PeriodEvent = "entry" | "drop" | "back" | "period";

export interface FreeSettings {
  readonly counter: Counter;
  readonly denom: Denom;
  readonly merged: boolean;
  readonly septemberEnds: SeptemberEnds;
}

export interface DemoState {
  /** Scene 1: the visitor's guess, null while open or skipped. */
  readonly guess: Verdict | null;
  /** Scene 2: the Zähler and the Nenner on the trays and the scale. */
  readonly counter: Counter;
  readonly denom: Denom;
  /** Counters the visitor has looked at in scene 2, in order (the report's comes first). */
  readonly visited: readonly Counter[];
  readonly countEvent: CountEvent;
  /** Scene 3: merges per cell ("M-023|2023-09-23"), and their order for undo. */
  readonly merged: Readonly<Record<string, number>>;
  readonly mergeLog: readonly string[];
  /** Scene 3's closing question: the counter that goes on the card. */
  readonly cardCounter: Counter | null;
  /** Scene 4: where the file's September ends, and month total or per week. */
  readonly septemberEnds: SeptemberEnds;
  readonly period: Period;
  readonly periodEvent: PeriodEvent;
  /** Scene 5: the brushed weeks. */
  readonly range: WeekRange;
  readonly rangeTouched: boolean;
  /** Scene 6: the trigger per counter, and lines changed on the card. */
  readonly trigger: Readonly<Record<Counter, number>>;
  readonly triggerTouched: boolean;
  readonly cardDenom: Denom | null;
  readonly cardPeriod: Period | null;
  /** Free play. */
  readonly free: FreeSettings;
  /** Readings the visitor has seen (ids from readingId), for the ticks on the scale. */
  readonly seen: readonly string[];
  /** The furthest beat the visitor reached: the card fills line by line up to it. */
  readonly reached: number;
}

export const cellKey = (machine: string, date: string) => `${machine}|${date}`;

const INITIAL_TRIGGER = Object.fromEntries(COUNTERS.map((counter) => [counter, startTrigger(counter).value])) as Record<Counter, number>;

export const INITIAL_STATE: DemoState = {
  guess: null,
  counter: "records",
  denom: "per1000",
  visited: ["records"],
  countEvent: "entry",
  merged: {},
  mergeLog: [],
  cardCounter: null,
  septemberEnds: "oct6",
  period: "month",
  periodEvent: "entry",
  range: AUGUST_RANGE,
  rangeTouched: false,
  trigger: INITIAL_TRIGGER,
  triggerTouched: false,
  cardDenom: null,
  cardPeriod: null,
  free: {
    counter: "records",
    denom: "per1000",
    merged: false,
    septemberEnds: "oct6",
  },
  seen: [readingId({ counter: "records" })],
  reached: 0,
};

export type DemoAction =
  | { readonly type: "guess"; readonly guess: Verdict }
  | { readonly type: "counter"; readonly counter: Counter }
  | { readonly type: "denom"; readonly denom: Denom }
  | { readonly type: "merge"; readonly cell: string }
  | { readonly type: "mergeAll" }
  | { readonly type: "undo" }
  | { readonly type: "cardCounter"; readonly counter: Counter }
  | { readonly type: "septemberEnds"; readonly ends: SeptemberEnds }
  | { readonly type: "period"; readonly period: Period }
  | { readonly type: "range"; readonly range: WeekRange }
  | {
      readonly type: "trigger";
      readonly counter: Counter;
      readonly value: number;
    }
  | {
      readonly type: "cardLine";
      readonly counter?: Counter;
      readonly denom?: Denom;
      readonly period?: Period;
    }
  | { readonly type: "free"; readonly patch: Partial<FreeSettings> }
  | { readonly type: "reach"; readonly index: number }
  | { readonly type: "restart" };

const CELLS = new Map(mergeCells().map((cell) => [cellKey(cell.machine, cell.date), cell.rows.length - 1]));

/** Merges applied so far, all cells together. */
export function totalMerges(state: DemoState): number {
  return Object.values(state.merged).reduce((sum, value) => sum + value, 0);
}

/** How many merges a cell still allows. */
export function mergesLeft(state: DemoState, cell: string): number {
  return (CELLS.get(cell) ?? 0) - (state.merged[cell] ?? 0);
}

function seeing(state: DemoState, id: string): readonly string[] {
  return state.seen.includes(id) ? state.seen : [...state.seen, id];
}

function freeId(free: FreeSettings): string {
  return readingId({
    counter: free.counter,
    denom: free.denom,
    septemberEnds: free.septemberEnds,
    merges: free.merged ? maxMerges(free.septemberEnds) : 0,
  });
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "guess":
      return { ...state, guess: action.guess };
    case "counter": {
      if (action.counter === state.counter) return state;
      const visited = state.visited.includes(action.counter) ? state.visited : [...state.visited, action.counter];
      return {
        ...state,
        counter: action.counter,
        visited,
        countEvent: state.visited.includes(action.counter) ? "counter" : "counterNew",
        seen: seeing(state, readingId({ counter: action.counter, denom: state.denom })),
      };
    }
    case "denom":
      if (action.denom === state.denom) return state;
      return {
        ...state,
        denom: action.denom,
        countEvent: action.denom === "none" ? "denomOff" : "denomOn",
        seen: seeing(state, readingId({ counter: state.counter, denom: action.denom })),
      };
    case "merge": {
      if (mergesLeft(state, action.cell) <= 0) return state;
      return {
        ...state,
        merged: {
          ...state.merged,
          [action.cell]: (state.merged[action.cell] ?? 0) + 1,
        },
        mergeLog: [...state.mergeLog, action.cell],
      };
    }
    case "mergeAll": {
      const log = [...state.mergeLog];
      const merged: Record<string, number> = { ...state.merged };
      for (const [cell, most] of CELLS) {
        while ((merged[cell] ?? 0) < most) {
          merged[cell] = (merged[cell] ?? 0) + 1;
          log.push(cell);
        }
      }
      return { ...state, merged, mergeLog: log };
    }
    case "undo": {
      const cell = state.mergeLog[state.mergeLog.length - 1];
      if (!cell) return state;
      const left = (state.merged[cell] ?? 1) - 1;
      const merged = Object.fromEntries(Object.entries({ ...state.merged, [cell]: left }).filter(([, value]) => value > 0));
      return { ...state, merged, mergeLog: state.mergeLog.slice(0, -1) };
    }
    case "cardCounter":
      return { ...state, cardCounter: action.counter };
    case "septemberEnds":
      if (action.ends === state.septemberEnds) return state;
      return {
        ...state,
        septemberEnds: action.ends,
        periodEvent: action.ends === "sep29" ? "drop" : "back",
      };
    case "period":
      if (action.period === state.period) return state;
      // Per shipping week the kit's month rule applies again: the week from 30 September goes back to September.
      return {
        ...state,
        period: action.period,
        periodEvent: "period",
        septemberEnds: action.period === "week" ? "oct6" : state.septemberEnds,
      };
    case "range":
      return { ...state, range: clampRange(action.range), rangeTouched: true };
    case "trigger":
      return {
        ...state,
        trigger: { ...state.trigger, [action.counter]: action.value },
        triggerTouched: true,
      };
    case "cardLine":
      return {
        ...state,
        cardCounter: action.counter ?? state.cardCounter,
        cardDenom: action.denom ?? state.cardDenom,
        cardPeriod: action.period ?? state.cardPeriod,
      };
    case "free": {
      const free = { ...state.free, ...action.patch };
      return { ...state, free, seen: seeing(state, freeId(free)) };
    }
    case "reach":
      return action.index > state.reached ? { ...state, reached: action.index } : state;
    case "restart":
      return INITIAL_STATE;
  }
}

/** The choices on the visitor's CRAFT card: scene 3 and 6 can override what scenes 2 and 4 left. */
export function cardChoice(state: DemoState): {
  readonly counter: Counter;
  readonly denom: Denom;
  readonly period: Period;
} {
  return {
    counter: state.cardCounter ?? state.counter,
    denom: state.cardDenom ?? state.denom,
    period: state.cardPeriod ?? state.period,
  };
}

/** The seven lines of the card and the beat that writes each (Entscheidung after the guess, Auslöser in scene 6). */
export const CARD_LINES = ["decision", "numerator", "denominator", "period", "source", "limit", "trigger"] as const;
export type CardLine = (typeof CARD_LINES)[number];
const WRITTEN_AT: Readonly<Record<CardLine, number>> = {
  decision: 0,
  numerator: 1,
  denominator: 1,
  period: 3,
  source: 4,
  limit: 4,
  trigger: 5,
};

/** Is a card line written once the visitor reached beat `reached` (0-based)? Each scene writes its lines while it is open. */
export function lineWritten(line: CardLine, reached: number): boolean {
  return reached >= WRITTEN_AT[line];
}

export function linesWritten(reached: number): number {
  return CARD_LINES.filter((line) => lineWritten(line, reached)).length;
}

/** The free-play reading key. */
export function freeKey(free: FreeSettings) {
  return {
    counter: free.counter,
    denom: free.denom,
    septemberEnds: free.septemberEnds,
    merges: free.merged ? maxMerges(free.septemberEnds) : 0,
  };
}
