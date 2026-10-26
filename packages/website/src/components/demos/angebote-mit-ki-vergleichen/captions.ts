/**
 * The dock's caption for every state of the stage: what just happened and what it means. Pure, so
 * captions.test.ts can read them aloud for the kit's case. Every number is filled from the engine
 * (stage.ts, basis.ts, konditionen.ts), never typed into the copy.
 */
import { assemble, fieldFlips, sharedField, type Field } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/basis";
import { HORIZON, STACK } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { MOVES, type DemoState } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/demo-state";
import {
  derivedCells,
  externalPallets,
  INTERNAL,
  keyOf,
  OFFER_KEYS,
  pallets,
  REQUEST,
  TERMS,
  trips,
  unitCents,
  type OfferKey,
} from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import { ALL_LINES, PAPER_CLAUSE, paperNumbers, type View } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stage";
import { compute, type CostRow, type StackModel } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import type { Fmt } from "./fmt";

export type TermStage = "trucks" | "pallets" | "done";

export interface CaptionInput {
  readonly view: View;
  readonly state: DemoState;
  readonly kit: readonly CostRow[];
  /** 2c: the trucks of the last sorted term arrive, then its pallets land, then (all sorted) the sum. */
  readonly termStage: TermStage;
  /** 2e: the result is shown (after the first "Weiter" or a toggle back on). */
  readonly paid: boolean;
  /** The visitor's own rows, once read; and whether they are the kit's second case. */
  readonly own: readonly CostRow[] | null;
  readonly second: boolean;
}

const total = (model: StackModel, key: OfferKey) => model.options.find((option) => option.name === TERMS[key].option)?.total ?? 0;
const line = (model: StackModel, key: OfferKey, name: string) => model.options.find((option) => option.name === TERMS[key].option)?.lines[name] ?? 0;

function nameOf(pack: DemoPack, option: string): string {
  const key = keyOf(option);
  return key ? pack.offers[key].name : option;
}

function lineName(pack: DemoPack, name: string): string {
  return pack.lineNames[name as keyof DemoPack["lineNames"]] ?? name;
}

function termCaption(pack: DemoPack, fmt: Fmt, key: OfferKey, stage: "trucks" | "pallets"): string {
  const l = pack.lieferort;
  const cells = derivedCells(key);
  if (key === "A") return fmt.t(l.A, { pallets: pallets("A") });
  const lot = fmt.qty(TERMS[key].lot.boxes);
  if (stage === "trucks") {
    return fmt.t(key === "B" ? l.Btrucks : l.Ctrucks, { lot, trips: trips(key), rate: fmt.money(INTERNAL.trip[key].cents), freight: fmt.money(cells.Fracht) });
  }
  return fmt.t(key === "B" ? l.Bpallets : l.Cpallets, {
    pallets: pallets(key),
    free: INTERNAL.freePlaces,
    extern: externalPallets(key),
    storage: fmt.money(cells.Lager),
  });
}

function basisCaption(pack: DemoPack, fmt: Fmt, input: CaptionInput): readonly string[] {
  const { state, kit } = input;
  const move = MOVES[state.move];
  const previous = MOVES[state.move - 1];
  const fromKit = previous && state.taken.includes(previous) ? [pack.fromKit] : [];
  const full = assemble(kit, ALL_LINES, STACK, HORIZON);
  switch (move) {
    case "menge":
      return state.qty ? [fmt.t(pack.menge.after, { qty: fmt.qty(REQUEST.qty) })] : [pack.menge.instruction];
    case "einheit":
      if (state.unit === "printed") return [...fromKit, pack.einheit.instruction];
      return [
        ...fromKit,
        fmt.t(pack.einheit.after, { a_unit: fmt.unit(unitCents("A")), b_unit: fmt.unit(unitCents("B")), c_unit: fmt.unit(unitCents("C")), qty: fmt.qty(REQUEST.qty) }),
        pack.einheit.afterRank,
      ];
    case "lieferort": {
      const sorted = OFFER_KEYS.filter((key) => state.terms[key] !== null);
      if (sorted.length === OFFER_KEYS.length && (!state.lastTerm || input.termStage === "done")) {
        const partial = assemble(kit, ["Ware", "Fracht", "Lager"], STACK, HORIZON);
        return [...fromKit, fmt.t(pack.lieferort.all, { gap_bc: fmt.money(total(partial, "C") - total(partial, "B")) })];
      }
      if (!state.lastTerm) return [...fromKit, pack.lieferort.instruction, pack.lieferort.define];
      const wrong = state.lastTerm.wrong ? [pack.lieferort.wrong] : [];
      return [...wrong, termCaption(pack, fmt, state.lastTerm.key, input.termStage === "trucks" ? "trucks" : "pallets")];
    }
    case "einmalig": {
      if (state.finds.length === OFFER_KEYS.length) return [pack.einmalig.after];
      const last = state.finds[state.finds.length - 1];
      if (!last) return [...fromKit, pack.einmalig.instruction];
      return [fmt.t(pack.einmalig.finds[last], { oneoff: fmt.money(TERMS.B.oneOff.cents) })];
    }
    case "zahlung":
    case undefined: {
      if (!state.discount) {
        const gross = assemble(kit, ALL_LINES.filter((name) => name !== "Skonto"), STACK, HORIZON);
        return [fmt.t(pack.zahlung.off, { a_nodisc: fmt.money(total(gross, "A")), b_nodisc: fmt.money(total(gross, "B")), c_nodisc: fmt.money(total(gross, "C")) })];
      }
      if (move === "zahlung" && !input.paid) return [...fromKit, pack.zahlung.arrival];
      const guess = state.guess ? [fmt.t(pack.zahlung.guess, { bet: pack.offers[state.guess].name })] : [];
      return [fmt.t(pack.zahlung.result, { c_total: fmt.money(total(full, "C")), gap: fmt.money(full.gap), b_total: fmt.money(total(full, "B")) }), ...guess];
    }
  }
}

/** The deciding-line sentence of the method sheet (C against A: goods against freight). */
export function deciderSentence(pack: DemoPack, fmt: Fmt, kit: readonly CostRow[]): string {
  const full = assemble(kit, ALL_LINES, STACK, HORIZON);
  return fmt.t(pack.methode.decider, {
    ware_diff: fmt.money(line(full, "A", "Ware") - line(full, "C", "Ware")),
    freight_diff: fmt.money(line(full, "C", "Fracht") - line(full, "A", "Fracht")),
  });
}

export function paperCaption(pack: DemoPack, fmt: Fmt, kit: readonly CostRow[], state: DemoState): readonly string[] {
  const p = pack.papier;
  const n = paperNumbers(kit, state.v, state.cap);
  const flip = fmt.pct(n.flip, 2);
  if (state.cap !== null) {
    return [n.cCapped !== null && state.cap < n.flip ? fmt.t(p.capBelow, { cap: fmt.pct(state.cap, 1), c_capped: fmt.money(n.cCapped) }) : fmt.t(p.capAbove, { cap: fmt.pct(state.cap, 1), flip })];
  }
  if (state.v <= 0) return [p.zero];
  const gap = fmt.money(Math.abs(n.cMinusA));
  // Once the turning point was crossed, the second sentence shows where the cap is set.
  const capHint = state.crossed ? [p.capAppears] : [];
  if (n.cMinusA < 0) return [fmt.t(p.below, { v: fmt.pct(state.v, 1), gap }), ...capHint];
  if (state.v >= 10) return [fmt.t(p.ten, { v: fmt.pct(state.v, 1), gap }), ...capHint];
  return [fmt.t(p.flip, { flip, lead: fmt.money(n.lead) }), ...capHint];
}

/** The readout over the dragged thumb: who is cheaper, and by how much. */
export function paperReadout(pack: DemoPack, fmt: Fmt, kit: readonly CostRow[], v: number, cap: number | null): string {
  const n = paperNumbers(kit, v, cap);
  return n.cMinusA < 0 ? fmt.t(pack.papier.still, { gap: fmt.money(-n.cMinusA) }) : fmt.t(pack.papier.now, { gap: fmt.money(n.cMinusA) });
}

export function ownCaption(pack: DemoPack, fmt: Fmt, rows: readonly CostRow[] | null, second: boolean): readonly string[] {
  if (!rows) return [pack.deins.lead];
  const model = compute(rows, HORIZON, null, STACK);
  const first = model.missing[0];
  if (first) return [fmt.t(pack.deins.open, { option: first.option, line: lineName(pack, first.line) })];
  if (second) return [fmt.t(pack.deins.secondResult, { gap: fmt.money(model.gap) }), pack.deins.secondZero];
  return [fmt.t(pack.deins.result, { winner: model.winner.name, gap: fmt.money(model.gap), runner: model.runner.name, decider: lineName(pack, model.decider) })];
}

function joinWith(items: readonly string[], word: string): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${word} ${items[items.length - 1]}`;
}

/** Free play's answering sentence: which smallest change of fields changes the cheapest offer. */
export function freeSentence(pack: DemoPack, fmt: Fmt, state: DemoState, kit: readonly CostRow[], own: readonly CostRow[] | null): string {
  const f = pack.free;
  const ownData = state.free.data === "own" && own !== null;
  if (!ownData && state.free.unit === "printed") return f.printed;
  const rows = ownData ? own : kit;
  if (ownData) {
    const model = compute(rows, HORIZON, null, STACK);
    if (!model.complete) return f.open_;
    return fmt.t(pack.deins.result, { winner: model.winner.name, gap: fmt.money(model.gap), runner: model.runner.name, decider: lineName(pack, model.decider) });
  }
  const answer = fieldFlips(rows, { fields: new Set(state.free.fields), v: state.free.v, cap: state.free.cap }, PAPER_CLAUSE, STACK, HORIZON);
  const acc = (field: Field) => f.fields[field].acc;
  const sets = (list: readonly (readonly Field[])[]) => joinWith(list.map((set) => joinWith(set.map(acc), f.and)), f.or);
  switch (answer.kind) {
    case "open":
      return f.open_;
    case "none":
      return fmt.t(answer.side === "add" ? f.none : f.noneRemove, { winner: nameOf(pack, answer.winner) });
    case "add": {
      const vars = { winner: nameOf(pack, answer.winner), next: nameOf(pack, answer.next) };
      if (answer.sets.every((set) => set.length === 1)) return fmt.t(f.addOne, { ...vars, field: joinWith(answer.sets.map((set) => acc(set[0] as Field)), f.or) });
      const shared = sharedField(answer.sets);
      if (shared) return fmt.t(f.addShared, { ...vars, shared: f.fields[shared.shared].dat, others: joinWith(shared.others.map(acc), f.or) });
      return fmt.t(f.addSets, { ...vars, sets: sets(answer.sets) });
    }
    case "remove": {
      const vars = { winner: nameOf(pack, answer.winner), next: nameOf(pack, answer.next) };
      if (answer.sets.every((set) => set.length === 1)) return fmt.t(f.removeOne, { ...vars, field: joinWith(answer.sets.map((set) => acc(set[0] as Field)), f.or) });
      return fmt.t(f.removeSets, { ...vars, sets: sets(answer.sets) });
    }
  }
}

export function captionFor(pack: DemoPack, fmt: Fmt, input: CaptionInput): readonly string[] {
  switch (input.view) {
    case "tipp":
      return input.state.guess ? [fmt.t(pack.tipp.after, { bet: pack.offers[input.state.guess].name })] : [pack.tipp.prompt];
    case "kipp":
      return basisCaption(pack, fmt, input);
    case "papier":
      return paperCaption(pack, fmt, input.kit, input.state);
    case "deins":
      return ownCaption(pack, fmt, input.own, input.second);
    case "free":
      return [freeSentence(pack, fmt, input.state, input.kit, input.own)];
    case "mitnehmen":
      return [];
  }
}
