/**
 * The two files the demo hands out, built in the browser from the visitor's
 * own check: the filled release rule (pruefregel.md / release-rule.md, the
 * kit template with its brackets filled) and the audit CSV (every row plus
 * the error, the range, the hit and the lamps, so each verdict can be
 * checked in Excel). Pure: strings in, strings out.
 */
import type { CheckResult, Checker, Lamps, LampKey } from "./check";
import { LAMP_KEYS } from "./check";
import type { DemoLocale } from "./format";
import { formatCsvNumber, formatNumber, formatEuro } from "./format";

/** The bracketed slots of the template, in order of appearance (20 in both languages). */
export const TEMPLATE_SLOTS = 20;
const SLOT = /\[[^\]\n]*\]/g;

/** Fills the template's brackets in order; null keeps a bracket for the reader to fill. */
export function fillSlots(template: string, values: readonly (string | null)[]): string {
  let index = 0;
  return template.replace(SLOT, (slot) => {
    const value = values[index];
    index += 1;
    return value === null || value === undefined ? slot : value;
  });
}

/** Text a person typed, safe inside a Markdown table cell and on one line. */
export function cellText(text: string): string {
  return text.replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

/** A text cell a spreadsheet would run as a formula (=, +, -, @ first) gets a leading '. Numbers never pass through here. */
export function csvText(text: string): string {
  const cell = cellText(text);
  return /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
}

export interface RuleFill {
  readonly reihe: string;
  /** The forecasting system; null keeps "[System]" for the reader (an own file). */
  readonly system: string | null;
  readonly messlatte: string;
  readonly owner: string;
  readonly fehlmenge: number | null;
  readonly rest: number | null;
  /** The sentence about this series' longest red run; "" when it had none. */
  readonly longestRed: string;
  readonly lampWords: Readonly<Record<"green" | "red" | "none", string>>;
  /** "4 grün" / "2 rot" for the log line. */
  readonly lampSummary: (green: number, red: number) => string;
}

function lampWord(lamps: Lamps | null, key: LampKey, words: RuleFill["lampWords"]): string {
  if (!lamps) return words.none;
  const value = lamps[key];
  return value === null ? words.none : value ? words.green : words.red;
}

export function toRuleMarkdown(template: string, result: CheckResult, fill: RuleFill, locale: DemoLocale): string {
  const next = result.naechste;
  const lamps = next?.lampen ?? null;
  const green = lamps ? LAMP_KEYS.filter((key) => lamps[key] === true).length : 0;
  const red = lamps ? LAMP_KEYS.filter((key) => lamps[key] === false).length : 0;
  const decimals = (value: number) => formatNumber(value, locale, 2, 2);
  const values: (string | null)[] = [
    cellText(fill.reihe) || null,
    fill.system,
    null,
    fill.messlatte,
    next ? next.woche : null,
    ...LAMP_KEYS.map((key) => lampWord(lamps, key, fill.lampWords)),
    cellText(fill.owner) || null,
    null,
    fill.fehlmenge ? formatEuro(fill.fehlmenge, locale, 2) : null,
    fill.rest ? formatEuro(fill.rest, locale, 2) : null,
    result.anteil !== undefined ? decimals(result.anteil) : null,
    null,
    fill.longestRed,
    next ? next.woche : null,
    next ? formatNumber(next.prognose, locale) : null,
    lamps ? fill.lampSummary(green, red) : null,
    next?.planzahl !== undefined ? formatNumber(next.planzahl, locale) : null,
  ];
  return fillSlots(template, values);
}

const CSV_HEADER = "woche;ist;prognose;hinweis;messlatte;fehler;p10;p90;in_spanne;lampen;frei";

/** Every row of the visitor's file with the check's readings, `;`-separated. */
export function toResultCsv(
  check: Checker,
  locale: DemoLocale,
  words: { readonly yes: string; readonly no: string; readonly allGreen: string },
): string {
  const num = (value: number | null) => (value === null ? "" : formatCsvNumber(value, locale));
  const lines = check.rows.map((row, t) => {
    const forecast = check.forecast(t);
    const rule = check.rule(t);
    const band = forecast === null ? null : check.band(t);
    const scored = check.valid(t) && forecast !== null && rule !== null;
    const hit = scored ? check.hit(t) : null;
    const lamps = t >= 1 ? check.lamps(t) : null;
    const red = lamps ? LAMP_KEYS.filter((key) => lamps[key] === false) : [];
    return [
      csvText(row.woche).replaceAll(";", ","),
      num(row.ist),
      num(row.f),
      csvText(row.hinweis).replaceAll(";", ","),
      num(rule),
      row.ist !== null && forecast !== null ? num(row.ist - forecast) : "",
      band && forecast !== null ? num(forecast + band[0]) : "",
      band && forecast !== null ? num(forecast + band[1]) : "",
      hit === null ? "" : hit ? words.yes : words.no,
      lamps ? (red.length === 0 ? words.allGreen : red.join("+")) : "",
      lamps ? (lamps.frei ? words.yes : words.no) : "",
    ].join(";");
  });
  return `${CSV_HEADER}\n${lines.join("\n")}\n`;
}

/** A file-name-safe slug of the series name: "Linsensuppe 500 ml" -> "linsensuppe-500-ml". */
export function slugify(text: string, fallback: string): string {
  const slug = text
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || fallback;
}
