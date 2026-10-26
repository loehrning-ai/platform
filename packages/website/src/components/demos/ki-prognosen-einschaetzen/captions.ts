import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill, plural } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { hitsUpTo, shiftedAccuracy, type Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { KIT_COSTS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/kit";
import { LAMP_WEEKS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/own";
import { day, euro0, euro2, jars, ownerOr, percent } from "./helpers";

/**
 * Every caption of the stage, as plain sentences filled from the model. A
 * caption is a list of paragraphs: before a scene's goal is met it says
 * what to do, afterwards what just happened and why it matters. Pure, so
 * tests can read every slot.
 */
export type Paragraphs = readonly string[];

export interface Progress {
  readonly guess: "open" | "locked" | "skipped";
  readonly guessValue: number;
  readonly baselineDone: boolean;
  readonly errorsAt: number;
  readonly errorsDone: boolean;
  readonly guess3: "open" | "locked" | "skipped";
  readonly guess3Value: number;
  readonly rangeAt: number;
  readonly rangeDone: boolean;
  readonly planDone: boolean;
  readonly canteen: boolean;
  readonly ruleDone: boolean;
  readonly owner: string;
  readonly kit: boolean;
  readonly lampsReady: boolean;
}

const lead = (model: Model, locale: DemoPack["locale"]) => percent(Math.abs(model.result.vorsprung ?? 0), locale, 0);

export function baselineCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  const locale = copy.locale;
  const tool = model.toolAccuracy;
  if (tool === null) return state.baselineDone ? [copy.s1.term] : [copy.s1.build];
  if (state.guess === "open") return [fill(copy.s1.ask, { toolAccuracy: percent(tool, locale), wape: percent(model.wape ?? 0, locale) })];
  if (!state.baselineDone) return [copy.s1.build];
  const rule = shiftedAccuracy(model, 1);
  return [
    fill(copy.s1.caption, { ruleAccuracy: percent(rule, locale), points: percent(tool - rule, locale).replace(/\s?%$/, "") }),
    copy.s1.term,
  ];
}

/** Scene 2's notes on the way: a week that does not count, or the promotion week. */
export function errorsMoment(copy: DemoPack, model: Model, t: number, kit: boolean): string | null {
  const { check, result, pin } = model;
  const iso = check.rows[t]?.woche;
  const skipped = result.nicht_bewertet.find(([week]) => week === iso);
  if (skipped) return skipped[1] === "prognose" ? copy.s2.noForecast : skipped[1] === "ausverkauft" ? copy.s2.soldOut : copy.s2.otherSkip;
  if (pin && pin.t === t) {
    return kit
      ? fill(copy.s2.pin, { rule: pin.ruleError, forecast: pin.forecastError })
      : fill(copy.s2.pinOther, { rule: pin.ruleError, forecast: pin.forecastError, note: pin.note });
  }
  return null;
}

export function errorsCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  const locale = copy.locale;
  const moment = errorsMoment(copy, model, state.errorsAt, state.kit);
  if (moment) return [moment];
  if (!state.errorsDone) return [copy.s2.ask];
  const { result, closer } = model;
  const values = {
    mae: jars(result.tabelle.Prognose?.mae ?? 0, locale),
    maeRule: jars(result.tabelle[result.messlatte]?.mae ?? 0, locale),
    lead: lead(model, locale),
    closer: closer.tool,
    weeks: result.wochen,
    ruleCloser: closer.rule,
    ties: closer.ties,
  };
  const template = (result.vorsprung ?? 0) < 0 ? copy.s2.captionWorse : closer.ties > 0 ? copy.s2.captionTies : copy.s2.caption;
  const points = model.points === null ? null : fill(copy.s2.points, { points: percent(model.points / 100, locale).replace(/\s?%$/, ""), lead: values.lead });
  return points ? [fill(template, values), points] : [fill(template, values)];
}

function lampsMissing(copy: DemoPack, model: Model): Paragraphs {
  if (!model.check.hasForecast) return [fill(copy.own.noForecast, { min: LAMP_WEEKS })];
  return [fill(copy.own.needMore, { min: LAMP_WEEKS, weeks: model.check.wochen.length })];
}

export function rangeCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  if (!state.lampsReady) return lampsMissing(copy, model);
  const { result, split, check } = model;
  const promised = Math.round(result.spanne_wochen * 0.8);
  if (state.guess3 === "open") return [fill(copy.s3.askGuess, { weeks: result.spanne_wochen, promised })];
  if (!state.rangeDone) {
    const tally = hitsUpTo(check, state.rangeAt);
    return tally.seen > tally.hits ? [copy.s3.ask, copy.s3.missTerm] : [copy.s3.ask];
  }
  const base = { hits: result.spanne_treffer, weeks: result.spanne_wochen, promised };
  const head = split
    ? fill(state.kit ? copy.s3.caption : copy.s3.captionPlain, {
        ...base,
        missesAfter: split.missesAfter,
        misses: split.misses,
        date: day(copy, check, split.cause.t),
        note: split.cause.note,
      })
    : fill(copy.s3.captionNoCause, base);
  return state.guess3 === "locked" ? [head, fill(copy.s3.guessLine, { guess: state.guess3Value })] : [head];
}

export function planCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  const locale = copy.locale;
  const { plan, result, check } = model;
  if (!plan) return [result.anteil === undefined ? copy.s4.noCosts : copy.s4.noPlan];
  if (!state.planDone) return [copy.s4.term, copy.s4.ask];
  const next = result.naechste;
  const date = next ? day(copy, check, check.naechste ?? 0) : "";
  const euro = result.kosten
    ? fill(copy.s4.euro, {
        weeks: result.kosten_wochen ?? result.wochen,
        saveTool: euro0(result.kosten.Messlatte - result.kosten.Prognose, locale),
        saveBuffer: euro0(result.kosten.Prognose - result.kosten.Planzahl, locale),
      })
    : null;
  const buffer = plan.planzahl - plan.forecast;
  let head: string;
  if (!state.kit) head = fill(copy.s4.captionSame, { plan: jars(plan.planzahl, locale), date });
  else if (state.canteen)
    head = fill(copy.s4.captionOn, { cu: euro2(KIT_COSTS.fehlmenge, locale), co: euro2(KIT_COSTS.restKantine, locale), plan: jars(plan.planzahl, locale), buffer: jars(buffer, locale), date });
  else head = fill(copy.s4.captionOff, { co: euro2(KIT_COSTS.restOhne, locale), argmin: jars(plan.forecast + plan.argmin, locale), plan: jars(plan.planzahl, locale) });
  return euro ? [head, euro] : [head];
}

/** The "Über 26 Wochen …" sentence, when the kit's interpolated number and the curve's lowest jar differ. */
export function planGap(copy: DemoPack, model: Model): string | null {
  const plan = model.plan;
  if (!plan || plan.planzahl === plan.forecast + plan.argmin) return null;
  return fill(copy.s4.gap, { argmin: jars(plan.forecast + plan.argmin, copy.locale), plan: jars(plan.planzahl, copy.locale), gap: euro2(plan.gap, copy.locale) });
}

export function ruleCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  if (!state.lampsReady) return lampsMissing(copy, model);
  if (!state.ruleDone) return [copy.s5.ask, copy.s5.term];
  const locale = copy.locale;
  const { result, longest, lag, spanning, check, toolAccuracy } = model;
  const owner = ownerOr(copy, state.owner);
  const red = result.regel_rot.length;
  let head: string;
  if (red === 0) head = fill(copy.s5.captionAllFree, { free: result.regel_frei });
  else if (longest && lag !== null && lag >= 0 && spanning.length >= 2 && toolAccuracy !== null) {
    const length = plural(longest.to - longest.from + 1, copy.s5.weeks);
    head = fill(copy.s5.caption, {
      free: result.regel_frei,
      red,
      owner,
      lag: plural(lag, copy.s5.weeks),
      lampA: copy.s5.lampNames[spanning[0]!],
      lampB: copy.s5.lampNames[spanning[1]!],
      length,
      toolAccuracy: percent(toolAccuracy, locale),
    });
  } else {
    head = fill(copy.s5.captionFallback, {
      free: result.regel_frei,
      red,
      owner,
      length: plural(longest ? longest.to - longest.from + 1 : 1, copy.s5.weeks),
    });
  }
  const next = result.naechste;
  const date = check.naechste !== null ? day(copy, check, check.naechste) : "";
  const plan = next?.lampen?.frei
    ? next.planzahl !== undefined
      ? fill(copy.s5.planFree, { date, plan: jars(next.planzahl, locale) })
      : null
    : next
      ? fill(copy.s5.planRed, { date, owner })
      : null;
  return plan ? [head, plan] : [head];
}

export function freeCaption(copy: DemoPack, model: Model): Paragraphs {
  const vorsprung = model.result.vorsprung;
  if (vorsprung === undefined) return [copy.s2.ask];
  return [fill(vorsprung >= 0 ? copy.free.lead : copy.free.leadWorse, { lead: lead(model, copy.locale) })];
}
