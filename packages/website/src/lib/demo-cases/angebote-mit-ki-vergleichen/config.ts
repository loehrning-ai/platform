/**
 * rotfaden's demo.json for this workshop, unchanged (scripts/workshop06/PORT-LOG.md, item 1), read
 * into typed pieces: the stack settings, the apply beat's paper index and the take-home basis. The
 * German captions of copy.ts come from the same file.
 */
import DEMO from "./demo.json";
import { CASE_CSV } from "./kit-data";
import { compute, factorsOf, flipPoint, parse, type CostRow, type Lang, type StackConfig, type StackModel } from "./stack";

export { DEMO };

export const STACK: StackConfig = {
  columns: DEMO.stack.columns,
  headline: DEMO.stack.headline,
  once: DEMO.stack.once,
  recurring: DEMO.stack.recurring,
  horizon: DEMO.stack.horizon,
  better: DEMO.stack.better === "higher" ? "higher" : "lower",
};

/** The demo counts one year, the kit's horizon. */
export const HORIZON = DEMO.stack.horizon.value;

type DemoBeat = (typeof DEMO.beats)[number];

export function demoBeat(id: string): DemoBeat {
  const beat = DEMO.beats.find((candidate) => candidate.id === id);
  if (!beat) throw new Error(`demo.json has no beat "${id}"`);
  return beat;
}

function paperBlock() {
  const papier = demoBeat("papier");
  const apply = "apply" in papier ? papier.apply : undefined;
  if (!apply) throw new Error('demo.json: the "papier" beat has no apply block');
  return apply;
}

/** The paper index of offer C: which line, which offer, the stops and the share of the goods price. */
export const PAPER = paperBlock();
export const PAPER_FACTORS = factorsOf(PAPER.index);

/** The basis lines the take-home template gets for the kit's case. */
export const KIT_BASIS: readonly string[] = DEMO.takehome.basis;

/** The kit's cost lines, parsed once per language (only the number format differs). */
export function kitRows(lang: Lang): readonly CostRow[] {
  const parsed = parse(CASE_CSV, lang, STACK);
  if (parsed.errors.length > 0) throw new Error(`kostenzeilen.csv does not parse: ${JSON.stringify(parsed.errors)}`);
  return parsed.rows;
}

/** The model at a paper index stop (0 = no surcharge). */
export function modelAt(rows: readonly CostRow[], stop: number): StackModel {
  const factor = PAPER_FACTORS[stop] ?? 1;
  return compute(rows, HORIZON, factor === 1 ? null : { line: PAPER.line, option: PAPER.option, factor }, STACK);
}

/** Where C loses first place as the paper index rises, from the kit's own numbers. */
export function paperFlip(rows: readonly CostRow[]) {
  return flipPoint(rows, HORIZON, PAPER, STACK);
}
