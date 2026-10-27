import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill, plural } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { hitsUpTo, shiftedAccuracy, type Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { KIT_COSTS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/kit";
import { LAMP_WEEKS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/own";
import { day, euro0, euro2, jars, ownerOr, percent } from "./helpers";

/**
 * Every caption of the stage, as plain sentences filled from the model. A
 * caption is a list of paragraphs: before a scene's goal is met it says what
 * to do first and then explains the term it needs; afterwards it says what
 * just happened and why it matters. Pure, so tests can read every slot.
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

/** "1,6" / "1.6": a difference of two shares in percentage points, without the % sign. */
const points = (share: number, locale: DemoPack["locale"]) => percent(share, locale).replace(/\s?%$/, "");

export function baselineCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  const locale = copy.locale;
  const tool = model.toolAccuracy;
  const skipped = state.guess === "skipped" ? `${copy.s1.skipped} ` : "";
  if (tool === null) return state.baselineDone ? [copy.s1.term] : [skipped + copy.s1.build];
  if (state.guess === "open") return [copy.s1.ask, fill(copy.s1.askTool, { toolAccuracy: percent(tool, locale), wape: percent(model.wape ?? 0, locale) })];
  if (!state.baselineDone) return [skipped + copy.s1.build];
  const rule = shiftedAccuracy(model, 1);
  const values = { ruleAccuracy: percent(rule, locale), points: points(tool - rule, locale) };
  const guess = state.guess === "locked" ? ` ${fill(copy.s1.guessLine, { guess: percent(state.guessValue / 100, locale) })}` : "";
  return [fill(copy.s1.caption, values) + guess, `${copy.s1.term} ${fill(copy.s1.next, values)}`];
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
  if (!state.errorsDone) return [copy.s2.ask, copy.s2.term];
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
  const worse = (result.vorsprung ?? 0) < 0;
  const head = fill(worse ? copy.s2.captionWorse : copy.s2.caption, values);
  const why = !worse && model.points !== null ? ` ${fill(copy.s2.points, { points: points(model.points / 100, locale) })}` : "";
  const tail = fill(worse ? copy.s2.closerWorse : closer.ties > 0 ? copy.s2.closerTies : copy.s2.closer, values);
  return [head + why, tail];
}

function lampsMissing(copy: DemoPack, model: Model): Paragraphs {
  if (!model.check.hasForecast) return [fill(copy.own.noForecast, { min: LAMP_WEEKS })];
  return [fill(copy.own.needMore, { min: LAMP_WEEKS, weeks: model.check.wochen.length })];
}

export function rangeCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  if (!state.lampsReady) return lampsMissing(copy, model);
  const { result, split, check } = model;
  const promised = Math.round(result.spanne_wochen * 0.8);
  if (state.guess3 === "open") return [fill(copy.s3.askGuess, { weeks: result.spanne_wochen, promised }), copy.s3.termShort];
  if (!state.rangeDone) {
    const tally = hitsUpTo(check, state.rangeAt);
    return [copy.s3.ask, tally.seen > tally.hits ? `${copy.s3.edgesTerm} ${copy.s3.missTerm}` : copy.s3.edgesTerm];
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
  return state.guess3 === "locked" ? [`${head} ${fill(copy.s3.guessLine, { guess: state.guess3Value })}`] : [head];
}

export function planCaption(copy: DemoPack, model: Model, state: Progress): Paragraphs {
  const locale = copy.locale;
  const { plan, result, check } = model;
  if (!plan) return [result.anteil === undefined ? copy.s4.noCosts : copy.s4.noPlan];
  if (!state.planDone) return [copy.s4.ask, copy.s4.term];
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
  let run: string | null = null;
  if (red === 0) head = fill(copy.s5.captionAllFree, { free: result.regel_frei });
  else {
    head = fill(copy.s5.caption, { free: result.regel_frei, red, owner });
    const length = plural(longest ? longest.to - longest.from + 1 : 1, copy.s5.weeks);
    if (longest && lag !== null && lag >= 0 && spanning.length >= 2 && toolAccuracy !== null) {
      const lagText = plural(lag, copy.s5.weeks);
      run = fill(copy.s5.captionRun, {
        lag: lagText.charAt(0).toUpperCase() + lagText.slice(1),
        lampA: copy.s5.lampNames[spanning[0]!],
        lampB: copy.s5.lampNames[spanning[1]!],
        length,
        toolAccuracy: percent(toolAccuracy, locale),
      });
    } else run = fill(copy.s5.captionFallback, { length });
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
  return [head, ...(run ? [run] : []), ...(plan ? [plan] : [])];
}

export function freeCaption(copy: DemoPack, model: Model): Paragraphs {
  const vorsprung = model.result.vorsprung;
  if (vorsprung === undefined) return [copy.s2.ask];
  return [fill(vorsprung >= 0 ? copy.free.lead : copy.free.leadWorse, { lead: lead(model, copy.locale) })];
}
