import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import type { Counter, Denom, Period } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import type { CardLine } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/demo-state";
import { EMPTY_CARD, type OwnCard } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import type { Fmt } from "./fmt";

export interface CraftChoice {
  readonly counter: Counter;
  readonly denom: Denom;
  readonly period: Period;
}

/** The trigger sentence of a counter, the kit's wording, with the visitor's threshold. */
export function triggerText(pack: DemoPack, fmt: Fmt, counter: Counter, value: number): string {
  return fmt.t(pack.decide.triggers[counter], { t: fmt.rate(counter, value) });
}

/** The seven lines of the visitor's CRAFT card, as they read on stage. */
export function craftLines(pack: DemoPack, fmt: Fmt, choice: CraftChoice, trigger: number): Readonly<Record<CardLine, string>> {
  const v = pack.decide.values;
  const counter = pack.counters[choice.counter];
  return {
    decision: fmt.t(v.decision),
    numerator: fmt.t(v.kind, { counter: counter.label, kind: counter.kind }),
    denominator: choice.denom === "per1000" ? fmt.t(v.denominator) : v.denominatorNone,
    period: v.period[choice.period],
    source: v.source,
    limit: v.limit,
    trigger: triggerText(pack, fmt, choice.counter, trigger),
  };
}

/** The same card as an OwnCard, so lintCard and cardToMarkdown treat it like the visitor's own. */
export function craftOwnCard(pack: DemoPack, fmt: Fmt, choice: CraftChoice, trigger: number): OwnCard {
  const lines = craftLines(pack, fmt, choice, trigger);
  const source = pack.decide.values.source;
  return {
    ...EMPTY_CARD,
    name: fmt.t(pack.chip.title),
    decision: lines.decision,
    numerator: pack.counters[choice.counter].label,
    numeratorKind: choice.counter === "records" ? "events" : "quantity",
    denominator: choice.denom === "per1000" ? lines.denominator : "",
    noDenominator: choice.denom === "none",
    period: choice.period,
    sourceFile: source,
    sourceColumn: "",
    limit: lines.limit,
    trigger: lines.trigger,
  };
}
