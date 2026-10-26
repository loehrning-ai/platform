/**
 * The caption of each scene as a pure function of the state: what just
 * happened and why it matters, in two or three full sentences. Every number
 * comes from reading() and friends, formatted by the pack's locale.
 */
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import type { BeatId } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/beats";
import { decide } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import {
  addDays,
  daysCovered,
  growth,
  growthWith,
  maxMerges,
  meanQty,
  mergeCells,
  mergeStepRate,
  rate,
  reading,
  recordsOf,
  unitsShipped,
  type Counter,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { cardChoice, freeKey, totalMerges, type DemoState } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/demo-state";
import { FOUR_WEEKS_RANGE, matchesReport, rowsIn, traceSum, type WeekRange } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trace";
import { REPORT, WEEK_STARTS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import type { Fmt } from "./fmt";

const LAST_WEEK = WEEK_STARTS[WEEK_STARTS.length - 1] as string;
const sameRange = (a: WeekRange, b: WeekRange) => a.from === b.from && a.to === b.to;

/** "Zählst du …" for a counter per 1.000 units shipped. */
function counterSentence(pack: DemoPack, fmt: Fmt, counter: Counter): string {
  const r = reading({ counter });
  return fmt.t(pack.count[counter], {
    a: fmt.rate(counter, r.aug),
    b: fmt.rate(counter, r.sep),
    qAug: fmt.n(meanQty("aug")),
    qSep: fmt.n(meanQty("sep")),
  });
}

function countCaption(pack: DemoPack, fmt: Fmt, state: DemoState, guessLabel: string | null): readonly string[] {
  const c = pack.count;
  const more = fmt.n(unitsShipped("sep") - unitsShipped("aug"));
  if (state.denom === "none") {
    const r = reading({ counter: state.counter, denom: "none" });
    return [
      fmt.t(c.denomOff[state.counter], {
        a: fmt.n(r.aug),
        b: fmt.n(r.sep),
        more,
      }),
    ];
  }
  if (state.countEvent === "entry")
    return [
      fmt.t(c.entry, {
        aug: recordsOf("aug").length,
        sep: recordsOf("sep").length,
      }),
      c.invite,
    ];
  if (state.countEvent === "denomOn") return [counterSentence(pack, fmt, state.counter), fmt.t(c.denomOn)];
  const sentence = counterSentence(pack, fmt, state.counter);
  if (state.visited.length < 3) return [sentence];
  if (state.countEvent === "counterNew") {
    const all = fmt.t(c.allThree, { sep: recordsOf("sep").length });
    return guessLabel ? [all, fmt.t(c.guessEcho, { guess: guessLabel })] : [sentence, all];
  }
  return [
    sentence,
    fmt.t(c.denomEntry, {
      uAug: fmt.n(unitsShipped("aug")),
      uSep: fmt.n(unitsShipped("sep")),
    }),
  ];
}

function mergeCaption(pack: DemoPack, fmt: Fmt, state: DemoState): readonly string[] {
  const m = pack.merge;
  const merges = totalMerges(state);
  if (merges === 0) return [fmt.t(m.entry, { cells: mergeCells().length })];
  if (merges < maxMerges()) return [fmt.t(m.first, { r: fmt.n(mergeStepRate(merges), 2) })];
  return [
    fmt.t(m.all, {
      from: recordsOf("sep").length,
      to: recordsOf("sep").length - maxMerges(),
      aff: fmt.rate("affected", rate("affected", "sep")),
      scr: fmt.rate("scrapped", rate("scrapped", "sep")),
    }),
    m.closing,
  ];
}

function periodCaption(pack: DemoPack, fmt: Fmt, state: DemoState): readonly string[] {
  const p = pack.period;
  if (state.period === "week")
    return [
      fmt.t(p.perWeek, {
        g3: fmt.share(Math.abs(growthWith(state.septemberEnds, "week"))),
      }),
    ];
  if (state.septemberEnds === "sep29")
    return [
      fmt.t(p.dropped, {
        last: fmt.date(LAST_WEEK),
        g2: fmt.share(Math.abs(growthWith("sep29", "month"))),
      }),
    ];
  const sep = daysCovered("sep");
  return [
    fmt.t(p.entry, {
      g: fmt.share(Math.abs(growth("month"))),
      from: fmt.date(sep.from),
      to: fmt.date(sep.to),
      sepDays: sep.days,
      augDays: daysCovered("aug").days,
      last: fmt.date(LAST_WEEK),
    }),
  ];
}

function traceCaption(pack: DemoPack, fmt: Fmt, state: DemoState): readonly string[] {
  const t = pack.trace;
  if (!state.rangeTouched)
    return [
      fmt.t(t.entry, {
        eur: fmt.eur(REPORT.craftRevenueEur),
        rows: rowsIn({ from: 0, to: WEEK_STARTS.length - 1 }).length,
      }),
    ];
  if (matchesReport(state.range))
    return [
      fmt.t(t.match, {
        last: fmt.date(LAST_WEEK),
        rows: rowsIn(state.range).length,
      }),
    ];
  const sum = traceSum(state.range);
  if (sameRange(state.range, FOUR_WEEKS_RANGE)) {
    return [
      fmt.t(t.four, {
        from: fmt.date(WEEK_STARTS[FOUR_WEEKS_RANGE.from] as string),
        to: fmt.date(WEEK_STARTS[FOUR_WEEKS_RANGE.to] as string),
        sum: fmt.eur(sum),
        diff: fmt.eur(REPORT.craftRevenueEur - sum),
      }),
    ];
  }
  return [fmt.t(t.other, { sum: fmt.eur(sum), eur: fmt.eur(REPORT.craftRevenueEur) })];
}

function decideCaption(pack: DemoPack, fmt: Fmt, state: DemoState): readonly string[] {
  const d = pack.decide;
  const choice = cardChoice(state);
  const changed = state.triggerTouched || state.cardDenom !== null || state.cardPeriod !== null;
  if (!changed) return [fmt.t(d.entry)];
  return [fmt.t(d.decisions[decide(choice.counter, choice.period).key]), d.raster];
}

function freeCaption(pack: DemoPack, fmt: Fmt, state: DemoState): readonly string[] {
  const f = pack.free;
  const key = freeKey(state.free);
  const r = reading(key);
  const perBase = key.denom === "per1000";
  return [
    fmt.t(f.reading, {
      counter: pack.counters[key.counter].label,
      denom: perBase ? fmt.t(pack.per) : pack.absolute,
      a: fmt.value(key.counter, r.aug, perBase),
      b: fmt.value(key.counter, r.sep, perBase),
      change: fmt.pct(r.change),
      verdict: pack.verdictPhrase[r.verdict],
    }),
  ];
}

export function captionFor(pack: DemoPack, fmt: Fmt, beat: BeatId, state: DemoState, phase: "intro" | "guided" | "free", ownCards: number): readonly string[] {
  if (phase === "free") return freeCaption(pack, fmt, state);
  const guessLabel = state.guess ? pack.guess.options[state.guess] : null;
  switch (beat) {
    case "schaetzen":
      if (!state.guess) return [fmt.t(pack.guess.caption)];
      return [
        fmt.t(pack.guess.done, {
          guess: guessLabel ?? "",
          aug: recordsOf("aug").length,
          sep: recordsOf("sep").length,
        }),
      ];
    case "zaehlen":
      return countCaption(pack, fmt, state, guessLabel);
    case "zusammenfassen":
      return mergeCaption(pack, fmt, state);
    case "zeitraum":
      return periodCaption(pack, fmt, state);
    case "nachrechnen":
      return traceCaption(pack, fmt, state);
    case "entscheiden":
      return decideCaption(pack, fmt, state);
    case "deine-kennzahl":
      return [pack.own.caption];
    case "mitnehmen":
      return [ownCards > 0 ? pack.takehome.caption : pack.takehome.captionEmpty];
  }
}

/** Ends of the file's September as a date ("6. Oktober" or "29. September"). */
export function septemberEnd(fmt: Fmt, ends: "oct6" | "sep29"): string {
  return fmt.date(ends === "oct6" ? addDays(LAST_WEEK, 6) : addDays(LAST_WEEK, -1));
}
