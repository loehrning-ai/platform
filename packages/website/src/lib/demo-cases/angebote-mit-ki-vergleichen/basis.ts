/**
 * The comparison basis as the visitor builds it, field by field: which cost lines are on the bars so
 * far, the paper surcharge of offer C with an optional cap, and the free-play sentence that says which
 * fields would change the cheapest offer. Pure functions over the stack engine; basis.test.ts holds
 * the kit's partial totals and the two key sentences of the contract.
 */
import { compute, type CostRow, type Scale, type StackConfig, type StackModel } from "./stack";

/** The three switchable fields and the cost lines each one adds (the field card's order). */
export type Field = "lieferort" | "einmalig" | "zahlung";
export const FIELDS: readonly Field[] = ["lieferort", "einmalig", "zahlung"];
export const FIELD_LINES: Readonly<Record<Field, readonly string[]>> = {
  lieferort: ["Fracht", "Lager"],
  einmalig: ["Einmalig"],
  zahlung: ["Skonto"],
};
/** The line every per-box view starts from. */
export const GOODS = "Ware";

export type Include = (option: string, line: string) => boolean;

/**
 * The model with only some cells counted: a row that is not included yet counts as 0 but stays a
 * row, so a line that is merely not added yet is never mistaken for a missing one.
 */
export function assemble(rows: readonly CostRow[], include: Include | readonly string[], config: StackConfig, horizon: number, scale: Scale | null = null): StackModel {
  const test: Include = typeof include === "function" ? include : (_option, line) => include.includes(line);
  const counted = rows.map((row) => (test(row.option, row.line) ? row : { ...row, cents: 0 }));
  return compute(counted, horizon, scale, config);
}

/** The lines of a set of fields, the goods first. */
export function linesOf(fields: Iterable<Field>): readonly string[] {
  const lines = [GOODS];
  for (const field of FIELDS) if ([...fields].includes(field)) lines.push(...FIELD_LINES[field]);
  return lines;
}

export interface Paper {
  /** The offer the clause is in ("C Brno"). */
  readonly option: string;
  /** Share of the goods price the surcharge applies to (0,6). */
  readonly share: number;
}

/** The paper rise that counts once a cap is set: min(v, cap). */
export function effectiveRise(v: number, cap: number | null): number {
  return cap === null ? v : Math.min(v, cap);
}

/** The scale on the goods line for a paper rise of v per cent, capped. Null at 0. */
export function paperScale(paper: Paper, v: number, cap: number | null = null): Scale | null {
  const rise = effectiveRise(v, cap);
  if (!(rise > 0)) return null;
  return { line: GOODS, option: paper.option, factor: 1 + (paper.share * rise) / 100 };
}

/** The surcharge in cents at a rise (goods of the clause's offer times share times rise). */
export function surcharge(goodsCents: number, paper: Paper, v: number, cap: number | null = null): number {
  const rise = effectiveRise(v, cap);
  return rise > 0 ? Math.floor(goodsCents * ((paper.share * rise) / 100) + 0.5) : 0;
}

export interface FlipState {
  readonly fields: ReadonlySet<Field>;
  readonly v: number;
  readonly cap: number | null;
}

export type FlipAnswer =
  | { readonly kind: "open" }
  | { readonly kind: "add"; readonly winner: string; readonly next: string; readonly sets: readonly (readonly Field[])[] }
  | { readonly kind: "remove"; readonly winner: string; readonly next: string; readonly sets: readonly (readonly Field[])[] }
  | { readonly kind: "none"; readonly winner: string; readonly side: "add" | "remove" };

function subsetsOfSize<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items as [T, ...T[]];
  return [...subsetsOfSize(rest, size - 1).map((set) => [first, ...set]), ...subsetsOfSize(rest, size)];
}

/**
 * Which change of fields would change the cheapest offer: the smallest sets of fields still off
 * that, switched on together, make another offer cheapest; with every field on, the smallest sets to
 * leave out. Sets that give the first-found new winner are kept, in the field card's order. A model
 * with a missing line names no winner ("open").
 */
export function fieldFlips(rows: readonly CostRow[], state: FlipState, paper: Paper | null, config: StackConfig, horizon: number): FlipAnswer {
  const model = (fields: Iterable<Field>) =>
    assemble(rows, linesOf(fields), config, horizon, paper ? paperScale(paper, state.v, state.cap) : null);
  const now = model(state.fields);
  if (!now.complete) return { kind: "open" };
  const winner = now.winner.name;
  const off = FIELDS.filter((field) => !state.fields.has(field));
  const side: "add" | "remove" = off.length > 0 ? "add" : "remove";
  const pool = side === "add" ? off : [...FIELDS];
  for (let size = 1; size <= pool.length; size++) {
    let next: string | null = null;
    const sets: Field[][] = [];
    for (const set of subsetsOfSize(pool, size)) {
      const fields = side === "add" ? [...state.fields, ...set] : FIELDS.filter((field) => !set.includes(field));
      const candidate = model(fields);
      if (!candidate.complete || candidate.winner.name === winner) continue;
      next ??= candidate.winner.name;
      if (candidate.winner.name === next) sets.push(set);
    }
    if (next && sets.length > 0) return { kind: side, winner, next, sets };
  }
  return { kind: "none", winner, side };
}

/** For two-field sets that all share one field: that field and the others, else null. */
export function sharedField(sets: readonly (readonly Field[])[]): { readonly shared: Field; readonly others: readonly Field[] } | null {
  if (sets.length === 0 || sets.some((set) => set.length !== 2)) return null;
  const shared = FIELDS.find((field) => sets.every((set) => set.includes(field)));
  if (!shared) return null;
  return { shared, others: sets.map((set) => set.find((field) => field !== shared) as Field) };
}
