/** From the visitor's four fields to a series, or to one of two calm states. */
import { classify, type Likely } from "./classify";
import { parseList, parseOptional, sanitizeName } from "./parse";
import { buildSeries, type Reading, type Series } from "./series";

export interface Fields {
  readonly values: string;
  readonly start: string;
  readonly name: string;
  readonly table: string;
  readonly neverNeg: boolean;
}

export const EMPTY_FIELDS: Fields = { values: "", start: "", name: "", table: "", neverNeg: true };

export type Read =
  | { readonly status: "empty" }
  | { readonly status: "fail"; readonly reason: "count" | "token" | "start" }
  | { readonly status: "ok"; readonly series: Series; readonly likely: Likely; readonly kind: Reading | "unclear" };

/** `override` is the visitor's own call (Stufe or Treppe) for numbers the guess cannot decide. */
export function readFields(fields: Fields, override: Reading | null, monthLabel: (n: number) => string): Read {
  if (fields.values.trim() === "") return { status: "empty" };
  const list = parseList(fields.values);
  const start = parseOptional(fields.start);
  if (!list.ok) return { status: "fail", reason: list.reason };
  if (start === undefined) return { status: "fail", reason: "start" };
  const likely = classify(list.values, fields.neverNeg);
  const kind = override ?? likely;
  const series = buildSeries({
    values: list.values,
    start,
    kind,
    name: sanitizeName(fields.name),
    table: sanitizeName(fields.table),
    monthLabel,
  });
  return { status: "ok", series, likely, kind };
}
