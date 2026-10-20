/**
 * Number tokens for the prose: `{{c4.weighted_share}}` is replaced at build
 * time by the number the figure draws, so a sentence cannot drift from its
 * chart. Pure functions, no file access (the reader loads the specs).
 *
 *   {{figure.key}}                  the value, with its unit: "3,8 %"
 *   {{figure.key.num}}              the number alone: "3,8"
 *   {{figure.key.lo}} / .hi         interval ends, with unit
 *   {{figure.key.range}}            "3,6 bis 4,1 %"
 *   {{figure.key.n}}                the sample size behind the value: "24.944"
 *   {{figure.key.a}} / .b           the two marks of a dumbbell row
 *   {{figure.key:0}}                digits override (after the field)
 *
 * `key` is, in this order: a name in `meta.values`, a name in `meta.aliases`,
 * an element id of the figure (case does not matter), or one of `n`, `asof`,
 * `overall` (funnel), `gini` (lorenz), `visible` and `total` (iceberg).
 * A suppressed value (fewer than 5) never resolves: the build fails instead.
 */

import {
  formatBare,
  formatDateDe,
  formatDecimal,
  formatInterval,
  formatValue,
  NBSP,
} from "./format.ts";
import type { FigureMetaValue, FigureSpec, NumFmt } from "./types.ts";

export type TokenLocale = "de" | "en";

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenError";
  }
}

/** A number the prose may cite, in plotted units. */
export interface Quantity {
  readonly value: number;
  readonly lo?: number;
  readonly hi?: number;
  readonly n?: number;
  readonly a?: number | null;
  readonly b?: number | null;
  readonly fmt: NumFmt;
}

const DEFAULT_FMT: NumFmt = { style: "percent", digits: 1 };
const COUNT_FMT: NumFmt = { style: "number", digits: 0 };
type Field = "value" | "num" | "lo" | "hi" | "range" | "n" | "a" | "b";

export const TOKEN_PATTERN =
  /\{\{\s*([a-z0-9][a-z0-9_-]*)\.([A-Za-z0-9_]+)(?:\.(value|num|lo|hi|range|n|a|b))?(?::(\d))?\s*\}\}/g;

function dataFmt(spec: FigureSpec): NumFmt {
  const data = spec.data as { fmt?: NumFmt };
  return data.fmt ?? DEFAULT_FMT;
}

interface Element {
  readonly id: string;
  readonly q: Omit<Quantity, "fmt"> & { readonly fmt?: NumFmt };
  readonly suppressed: boolean;
}

/** Every element of a figure that the prose can point at. */
function elements(spec: FigureSpec): Element[] {
  const out: Element[] = [];
  const add = (id: string, q: Element["q"], suppressed = false): void => {
    out.push({ id, q, suppressed });
  };
  switch (spec.kind) {
    case "waffle":
      for (const g of spec.data.groups) add(g.id, { value: g.dots, n: spec.data.total, fmt: COUNT_FMT });
      break;
    case "bars":
    case "dotplot":
      for (const i of spec.data.items) {
        add(i.id, { value: i.value ?? 0, lo: i.lo, hi: i.hi, n: i.n }, i.value === null);
      }
      break;
    case "tilemap":
      for (const t of spec.data.tiles) add(t.id, { value: t.value ?? 0, lo: t.lo, hi: t.hi, n: t.n }, t.value === null);
      break;
    case "funnel":
      for (const p of spec.data.points) add(p.id, { value: p.value, n: p.n });
      add("overall", { value: spec.data.overall });
      break;
    case "dumbbell":
      for (const r of spec.data.rows) {
        add(r.id, { value: r.a ?? 0, a: r.a, b: r.b }, r.a === null && r.b === null);
      }
      break;
    case "waterfall":
      for (const i of spec.data.items) add(i.id, { value: i.value, n: i.n });
      break;
    case "ladder":
      for (const r of spec.data.rungs) add(r.id, { value: r.value });
      if (spec.data.ours) {
        const o = spec.data.ours;
        add(o.id, { value: o.value, lo: o.lo, hi: o.hi, fmt: o.fmt });
      }
      break;
    case "iceberg":
      add("visible", { value: spec.data.visible.value });
      add("total", { value: spec.data.total.value });
      break;
    case "network": {
      const counts = spec.data.variants.map((v) => v.edges.length);
      spec.data.variants.forEach((v, i) => add(v.id, { value: counts[i] ?? 0, fmt: COUNT_FMT }));
      for (const nb of spec.data.neighbours ?? []) add(nb.node, { value: nb.odds, lo: nb.lo, hi: nb.hi, fmt: { style: "decimal", digits: 1 } });
      break;
    }
    case "blocks": {
      const dv = spec.data.variants.find((v) => v.id === spec.data.defaultVariant) ?? spec.data.variants[0];
      for (const b of spec.data.bins) add(b.id, { value: dv?.counts[b.id] ?? 0, n: spec.data.total, fmt: COUNT_FMT });
      for (const v of spec.data.variants) {
        for (const b of spec.data.bins) add(`${v.id}_${b.id}`, { value: v.counts[b.id] ?? 0, n: spec.data.total, fmt: COUNT_FMT });
      }
      break;
    }
    case "strip":
      for (const row of spec.data.rows) {
        for (const mark of row.marks) {
          add(`${row.id}_${mark.layer}`, { value: mark.value ?? 0, lo: mark.lo, hi: mark.hi, n: mark.n }, mark.value === null);
          for (const [vid, q] of Object.entries(mark.by ?? {})) {
            add(`${row.id}_${mark.layer}_${vid}`, { value: q.value ?? 0, lo: q.lo, hi: q.hi, n: q.n }, q.value === null);
          }
        }
      }
      break;
    case "curve":
      for (const q of spec.data.points) add(q.id, { value: q.value ?? 0, lo: q.lo, hi: q.hi, n: q.n }, q.value === null);
      for (const r of spec.data.panel?.rows ?? []) add(r.id, { value: r.value, fmt: spec.data.panel?.fmt });
      break;
    case "slope": {
      const ratio: NumFmt = spec.data.fmt;
      add("pooled_a", { value: spec.data.pooled.a, fmt: ratio });
      add("pooled_b", { value: spec.data.pooled.b, lo: spec.data.pooled.lo, hi: spec.data.pooled.hi, fmt: ratio });
      for (const s of spec.data.splits) add(s.id, { value: s.top.b, lo: s.top.lo, hi: s.top.hi, fmt: ratio });
      break;
    }
    case "nulldist":
      add("observed", { value: spec.data.observed.value, lo: spec.data.observed.lo, hi: spec.data.observed.hi });
      for (const w of spec.data.words) add(w.id, { value: w.ratio, lo: w.lo, hi: w.hi, fmt: { style: "decimal", digits: 1 } });
      for (const v of spec.data.variants) add(`band_${v.id}`, { value: v.band.hi, lo: v.band.lo, hi: v.band.hi, n: v.n });
      break;
    case "field":
      for (const scene of spec.data.scenes) {
        if (scene.numeral) add(scene.id, { value: scene.numeral.value, fmt: scene.numeral.fmt });
        const byClass = new Map<string, number>();
        for (const bin of scene.bins) for (const seg of bin.segments) byClass.set(seg.cls, (byClass.get(seg.cls) ?? 0) + seg.count);
        for (const [cls, count] of byClass) add(`${scene.id}_${cls}`, { value: count, n: scene.base, fmt: COUNT_FMT });
      }
      break;
    case "lorenz":
      if (spec.data.gini !== undefined) add("gini", { value: spec.data.gini, fmt: { style: "decimal", digits: 2 } });
      break;
    case "timeline":
      break;
  }
  return out;
}

function findElement(spec: FigureSpec, key: string): Element | undefined {
  const lower = key.toLowerCase();
  return elements(spec).find((e) => e.id.toLowerCase() === lower);
}

/** The quantity a key names in a figure, or undefined. Throws for a suppressed value. */
function quantityOf(spec: FigureSpec, key: string): Quantity | undefined {
  const lower = key.toLowerCase();
  const meta = spec.meta;

  const named = meta?.values?.[lower];
  if (named) return fromMetaValue(spec, named, key);

  const alias = meta?.aliases?.[lower];
  if (alias) {
    const target = findElement(spec, alias);
    if (!target) throw new TokenError(`${spec.id}: alias "${key}" points at the unknown element "${alias}"`);
    return fromElement(spec, target, key);
  }

  if (lower === "n") return { value: spec.n, fmt: COUNT_FMT };

  const el = findElement(spec, lower);
  return el ? fromElement(spec, el, key) : undefined;
}

function fromElement(spec: FigureSpec, el: Element, key: string): Quantity {
  if (el.suppressed) {
    throw new TokenError(`${spec.id}.${key}: the value is suppressed (fewer than 5); do not cite it`);
  }
  return { ...el.q, fmt: el.q.fmt ?? dataFmt(spec) };
}

function fromMetaValue(spec: FigureSpec, entry: FigureMetaValue, key: string): Quantity {
  let value = entry.value;
  let fmt = entry.fmt;
  let extra: Partial<Quantity> = {};
  if (entry.ref !== undefined) {
    const target = findElement(spec, entry.ref);
    if (!target) throw new TokenError(`${spec.id}.${key}: ref "${entry.ref}" is not an element of the figure`);
    const base = fromElement(spec, target, key);
    value = base.value;
    fmt = fmt ?? base.fmt;
    extra = { n: base.n, lo: base.lo, hi: base.hi };
  }
  if (value === undefined) throw new TokenError(`${spec.id}.${key}: no value`);
  return {
    ...extra,
    value,
    lo: entry.lo ?? extra.lo,
    hi: entry.hi ?? extra.hi,
    n: entry.n ?? extra.n,
    fmt: fmt ?? dataFmt(spec),
  };
}

/** German output turned into English: 1.234,5 -> 1,234.5, "3 %" -> "3%", "bis" -> "to". */
function toEnglish(text: string): string {
  return text
    .replace(/[.,]/g, (ch) => (ch === "." ? "," : "."))
    .replace(new RegExp(`${NBSP}%`, "g"), "%")
    .replace(/ bis /g, " to ")
    .replace(/−/g, "-");
}

function withDigits(fmt: NumFmt, digits: number | undefined): NumFmt {
  return digits === undefined ? fmt : { ...fmt, digits };
}

function renderField(q: Quantity, field: Field, digits: number | undefined, spec: FigureSpec, key: string): string {
  const fmt = withDigits(q.fmt, digits);
  const need = (v: number | null | undefined, name: string): number => {
    if (v === undefined || v === null) throw new TokenError(`${spec.id}.${key}: no ${name}`);
    return v;
  };
  switch (field) {
    case "value":
      return formatValue(fmt, q.value);
    case "num":
      return formatBare(fmt, q.value);
    case "lo":
      return formatValue(fmt, need(q.lo, "lower bound"));
    case "hi":
      return formatValue(fmt, need(q.hi, "upper bound"));
    case "range":
      return formatInterval(fmt, need(q.lo, "lower bound"), need(q.hi, "upper bound"));
    case "n":
      return formatDecimal(need(q.n, "sample size"), 0);
    case "a":
      return formatValue(fmt, need(q.a, "first mark"));
    case "b":
      return formatValue(fmt, need(q.b, "second mark"));
  }
}

/** The number a key names in a figure with its interval, sample size and format, or undefined. */
export function quantityFor(spec: FigureSpec, key: string): Quantity | undefined {
  return quantityOf(spec, key);
}

/** One token to its text. Throws TokenError with a list of what the figure offers. */
export function resolveToken(
  spec: FigureSpec,
  key: string,
  field: Field = "value",
  digits?: number,
  locale: TokenLocale = "de",
): string {
  if (key.toLowerCase() === "asof") {
    const date = formatDateDe(spec.asOf);
    return locale === "de" ? date : spec.asOf;
  }
  const q = quantityOf(spec, key);
  if (!q) {
    throw new TokenError(`${spec.id}: unknown token "${key}". Available: ${tokenKeys(spec).slice(0, 24).join(", ")}`);
  }
  const text = renderField(q, field, digits, spec, key);
  return locale === "de" ? text : toEnglish(text);
}

/** All keys a figure offers to the prose, for the author list. */
export function tokenKeys(spec: FigureSpec): string[] {
  const keys = new Set<string>(["n", "asof"]);
  for (const k of Object.keys(spec.meta?.values ?? {})) keys.add(k);
  for (const k of Object.keys(spec.meta?.aliases ?? {})) keys.add(k);
  for (const e of elements(spec)) if (!e.suppressed) keys.add(e.id.toLowerCase());
  return [...keys];
}

export type SpecLookup = (figureId: string) => FigureSpec | undefined;

/** Replaces every token in a text. Unknown figure or key fails the build, never prints a placeholder. */
export function resolveTokens(text: string, lookup: SpecLookup, locale: TokenLocale = "de"): string {
  return text.replace(TOKEN_PATTERN, (_match, figureId: string, key: string, field: string | undefined, digits: string | undefined) => {
    const spec = lookup(figureId);
    if (!spec) throw new TokenError(`unknown figure "${figureId}" in token {{${figureId}.${key}}}`);
    return resolveToken(spec, key, (field as Field | undefined) ?? "value", digits === undefined ? undefined : Number(digits), locale);
  });
}

/** True when a text still holds a token (used to fail loudly on a leftover). */
export function hasToken(text: string): boolean {
  return /\{\{[^}]*\}\}/.test(text);
}

/** Resolves tokens in every string of a JSON value (copy files of the figures). */
export function resolveTokensDeep<T>(value: T, lookup: SpecLookup, locale: TokenLocale = "de"): T {
  if (typeof value === "string") return resolveTokens(value, lookup, locale) as T;
  if (Array.isArray(value)) return value.map((v) => resolveTokensDeep(v, lookup, locale)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, resolveTokensDeep(v, lookup, locale)]),
    ) as T;
  }
  return value;
}
