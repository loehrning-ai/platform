import { LAMP_KEYS, type CheckResult, type Checker, type LampKey, type Lamps } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { longestRun, redRuns } from "@/lib/demo-cases/ki-prognosen-einschaetzen/derive";
import type { RuleFill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/export";
import { formatDay, formatEuro, formatNumber, formatPercent, fill, plural } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { parseCell } from "@/lib/demo-cases/ki-prognosen-einschaetzen/parse";

/**
 * Small pure helpers of the W01 demo: number words, the cost fields, the
 * lamp sentences, the rule file's fill and the visitor's personal line.
 * No state, so every scene and the take-home say the same thing.
 */
export const SLUG = "ki-prognosen-einschaetzen";

export type Locale = DemoPack["locale"];

/** A cost field's text as euros ("1,50", "1.50", "1,50 €"); null when empty, zero or not a number. */
export function parseCost(text: string): number | null {
  const cell = parseCell(text.replace(/€/g, ""));
  return cell.ok && cell.value !== null && cell.value > 0 ? cell.value : null;
}

/** True when a cost field holds text that is not a number at all. */
export function notANumber(text: string): boolean {
  return text.trim() !== "" && !parseCell(text.replace(/€/g, "")).ok;
}

export const jars = (value: number, locale: Locale) => formatNumber(Math.round(value), locale);
export const euro0 = (value: number, locale: Locale) => formatEuro(value, locale, 0);
export const euro2 = (value: number, locale: Locale) => formatEuro(value, locale, 2);
export const percent = (share: number, locale: Locale, decimals = 1) => formatPercent(share, locale, { decimals });

/** "Woche ab 7. April 2025". */
export function weekOf(copy: DemoPack, check: Checker, t: number): string {
  const iso = check.rows[t]?.woche;
  return iso ? fill(copy.ui.weekOf, { date: formatDay(iso, copy.locale, true) }) : "";
}

/** "7. April" (no year), for sentences inside 2025. */
export function day(copy: DemoPack, check: Checker, t: number): string {
  const iso = check.rows[t]?.woche;
  return iso ? formatDay(iso, copy.locale) : "";
}

/** "Bias und Spanne", "bias and range". */
export function joinWords(words: readonly string[], and: string): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} ${and} ${words[words.length - 1]}`;
}

export const ownerOr = (copy: DemoPack, owner: string) => owner.trim() || copy.s5.ownerFallback;

/** The red lamps of a week, in lamp order. */
export function redLamps(lamps: Lamps | null): readonly LampKey[] {
  return lamps ? LAMP_KEYS.filter((key) => lamps[key] === false) : [];
}

/** "Bias ist rot. Es entscheidet Leitung Disposition." or the all-green sentence. */
export function weekSentence(copy: DemoPack, lamps: Lamps | null, owner: string): string {
  if (!lamps) return copy.s5.weekNone;
  if (lamps.frei) return copy.s5.weekFree;
  const red = redLamps(lamps);
  const names = joinWords(
    red.map((key) => copy.s5.lampNames[key]),
    copy.s5.and,
  );
  return fill(red.length > 1 ? copy.s5.weekRedMany : copy.s5.weekRed, { lamps: names, owner: ownerOr(copy, owner) });
}

/** The bias in words, never signed: "5,4 % zu hoch" (bias_wert is forecast over actual minus one). */
export function biasWords(copy: DemoPack, lamps: Lamps): string {
  const value = percent(Math.abs(lamps.bias_wert), copy.locale);
  return fill(lamps.bias_wert >= 0 ? copy.s5.values.bias : copy.s5.values.biasLow, { value });
}

export function biasSentence(copy: DemoPack, lamps: Lamps, max: number): string {
  const state = lamps.bias ? copy.s5.state.green : copy.s5.state.red;
  const value = percent(Math.abs(lamps.bias_wert), copy.locale);
  return fill(lamps.bias_wert >= 0 ? copy.s5.biasSentence : copy.s5.biasSentenceLow, {
    value,
    max: percent(max, copy.locale, 0),
    state,
  });
}

/** The rule file's sentence about the longest red run; "" without a red week. */
export function longestRedSentence(copy: DemoPack, check: Checker): string {
  const longest = longestRun(redRuns(check));
  return longest ? plural(longest.to - longest.from + 1, copy.ruleFile.longestRed) : "";
}

export function ruleFill(
  copy: DemoPack,
  series: string,
  owner: string,
  target: { readonly result: CheckResult; readonly check: Checker },
  fehlmenge: number | null,
  rest: number | null,
  system: string | null,
): RuleFill {
  return {
    reihe: series,
    system,
    longestRed: longestRedSentence(copy, target.check),
    messlatte: copy.own.ruleNames[target.result.messlatte],
    owner: ownerOr(copy, owner),
    fehlmenge,
    rest,
    lampWords: copy.ruleFile.lampWords,
    lampSummary: (green: number, red: number) => fill(copy.ruleFile.lampSummary, { green, red }),
  };
}

/** The visitor's sentence above the take-home rows: the plan week, its number and who decides. */
export function personalLine(copy: DemoPack, series: string, owner: string, result: CheckResult): string {
  const next = result.naechste;
  if (!next) return "";
  const who = ownerOr(copy, owner);
  const forecast = formatNumber(next.prognose, copy.locale);
  if (next.lampen?.frei && next.planzahl !== undefined) {
    return fill(copy.takeHome.line, { series, forecast, plan: formatNumber(next.planzahl, copy.locale), owner: who });
  }
  return fill(copy.takeHome.lineRed, { series, forecast, owner: who });
}

/**
 * The kit's project instructions with the visitor's values in the brackets,
 * in the file's order: series, baseline, missing unit, leftover unit, owner.
 * A bracket without a value (the deputy) stays for the reader to fill.
 */
export function fillProject(
  text: string,
  values: { readonly series: string; readonly rule: string; readonly cu: string | null; readonly co: string | null; readonly owner: string | null },
): string {
  const order = [values.series, values.rule, values.cu, values.co, values.owner];
  let index = 0;
  return text.replace(/\[[^\]\n]+\]/g, (bracket) => {
    const value = order[index];
    index += 1;
    return value ? value : bracket;
  });
}
