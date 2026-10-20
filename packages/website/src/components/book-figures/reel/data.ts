/**
 * The frozen aggregate behind the reel and the way numbers leave it. Every
 * number on screen is produced by `tok`, which formats a value of the JSON
 * with the figure engine's German formatter and records what it printed, so
 * the truth check can diff the picture against the file.
 */

import { NBSP, formatDecimal } from "../../../lib/figures/format.ts";
import raw from "./reel-data.json";

export interface ReelData {
  readonly id: string;
  readonly asOf: string;
  readonly book: {
    readonly firms: number;
    readonly heroes: number;
    readonly asOf: string;
    /** URL audit: share of company-website pairs that are the right firm, with its 95 % interval. */
    readonly urlMatchPct: number;
    readonly urlMatchLoPct: number;
    readonly urlMatchHiPct: number;
  };
  readonly h05: {
    readonly pairs: number;
    readonly days: number;
    readonly of: number;
    readonly lost: number;
    readonly sharePct: number;
    readonly ciLoPct: number;
    readonly ciHiPct: number;
  };
  readonly h01: {
    readonly n: number;
    readonly hits: number;
    readonly ratio: number;
    readonly perSquare: number;
    readonly window: readonly [string, string];
    readonly fifths: readonly { n: number; k: number; pct: number; lo: number; hi: number }[];
    readonly network: {
      readonly features: number;
      readonly edgesRaw: number;
      readonly edgesEqual: number;
      readonly space: readonly [number, number];
      readonly nodes: readonly { x: number; y: number; ki: boolean }[];
      readonly stay: readonly (readonly [number, number])[];
      readonly fade: readonly (readonly [number, number])[];
      readonly add: readonly (readonly [number, number])[];
    };
  };
  readonly h02: {
    readonly raw: number;
    readonly window: readonly [string, string];
    readonly blocks: number;
    readonly perBlock: number;
    readonly a: Bins;
    readonly b: Bins;
    readonly techAPct: number;
    readonly techBPct: number;
  };
  readonly h03: {
    readonly consult: { n: number; k: number; pct: number; window: readonly [string, string] };
    readonly firm: { n: number; k: number; pct: number; perSquare: number; squares: number; window: readonly [string, string] };
    readonly cond: {
      readonly consult: { n: number; k: number; pct: number };
      readonly firm: { n: number; k: number; pct: number };
      readonly ratio: number;
    };
  };
  readonly h06: {
    readonly kreise: number;
    readonly firms: number;
    readonly top: number;
    readonly minFirms: number;
    readonly topA: number;
    readonly topB: number;
    readonly bandLo: number;
    readonly bandHi: number;
  };
}

export interface Bins {
  readonly dup: number;
  readonly gig: number;
  readonly student: number;
  readonly intermediary: number;
  readonly business: number;
  readonly tech: number;
}

export const REEL_DATA = raw as unknown as ReelData;

/** How a value is written. */
export type TokKind =
  | "int"
  | "pct0"
  | "pct1"
  | "pct2"
  | "x0"
  | "x1"
  | "x2"
  | "dec1"
  | "num0"
  | "ymRange"
  | "ym";

/** One number or date as it is drawn, with its place in the JSON. */
export interface LoggedToken {
  readonly path: string;
  readonly kind: TokKind;
  readonly s: string;
}

const DIGITS: Readonly<Record<string, number>> = {
  int: 0, num0: 0, pct0: 0, pct1: 1, pct2: 2, x0: 0, x1: 1, x2: 2, dec1: 1,
};

/** The value at a dotted path of the JSON, or throws. */
export function lookup(data: ReelData, path: string): unknown {
  let cur: unknown = data;
  for (const key of path.split(".")) {
    if (cur === null || typeof cur !== "object") throw new Error(`reel token ${path}: no ${key}`);
    cur = (cur as Record<string, unknown>)[key];
  }
  if (cur === undefined) throw new Error(`reel token ${path}: missing`);
  return cur;
}

/** Format a value of the JSON. */
export function formatToken(data: ReelData, path: string, kind: TokKind): string {
  const v = lookup(data, path);
  if (kind === "ymRange") {
    const [a, b] = v as readonly [string, string];
    return `${a.slice(0, 7)} bis ${b.slice(5, 7)}`;
  }
  if (kind === "ym") return (v as string).slice(0, 7);
  const x = v as number;
  const d = DIGITS[kind] ?? 0;
  const body = formatDecimal(x, d);
  if (kind.startsWith("pct")) return `${body}${NBSP}%`;
  if (kind.startsWith("x")) return `${body}×`;
  return body;
}

/**
 * Build a string from a template with `{{path:kind}}` slots. Returns the text
 * and the tokens it printed.
 */
export function render(
  data: ReelData,
  template: string,
): { readonly text: string; readonly tokens: readonly LoggedToken[] } {
  const tokens: LoggedToken[] = [];
  const text = template.replace(/\{\{([\w.]+):(\w+)\}\}/g, (_m, path: string, kind: string) => {
    const s = formatToken(data, path, kind as TokKind);
    tokens.push({ path, kind: kind as TokKind, s });
    return s;
  });
  return { text, tokens };
}

/** Largest-remainder split of `total` units over the counts, in the given order. */
export function largestRemainder(counts: readonly number[], total: number): number[] {
  const sum = counts.reduce((s, c) => s + c, 0);
  const exact = counts.map((c) => (c / sum) * total);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((s, c) => s + c, 0);
  const order = exact
    .map((e, i) => ({ i, r: e - Math.floor(e) }))
    .sort((p, q) => q.r - p.r || p.i - q.i);
  for (const { i } of order) {
    if (left <= 0) break;
    out[i] = (out[i] as number) + 1;
    left -= 1;
  }
  return out;
}

/** The six bins of H02 in drawing order. */
export const BIN_ORDER = ["dup", "gig", "student", "intermediary", "business", "tech"] as const;
export type BinId = (typeof BIN_ORDER)[number];

export function binCounts(bins: Bins): number[] {
  return BIN_ORDER.map((id) => bins[id]);
}
