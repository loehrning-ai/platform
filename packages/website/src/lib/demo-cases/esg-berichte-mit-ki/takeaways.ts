import { ASCII, stripOf } from "./analyse";
import { formatNumber, formatPercent, formatSmart } from "./numbers";
import type { Analysis, Locale, Series, TakeawayId, TextTemplates } from "./types";

/*
 * The three things to take away, generated from the series as the folder
 * holds it. A guess and the revealed bill never enter: a hole stays a hole.
 */

export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** "September", "A und B", "A, B und C", with the year once at the end when known. */
export function monthsText(months: readonly number[], names: readonly string[], and: string, year?: number): string {
  const list = months.map((month) => names[month - 1] ?? String(month));
  const joined =
    list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} ${and} ${list[list.length - 1]}`;
  return year === undefined ? joined : `${joined} ${year}`;
}

export interface BuildOptions {
  readonly locale: Locale;
  readonly texts: TextTemplates;
  readonly months: readonly string[];
  readonly ascii: boolean;
}

const swapGlyphs = (text: string): string =>
  text.replace(/■/g, ASCII.proven).replace(/▨/g, ASCII.estimate).replace(/□/g, ASCII.missing);

const isEnergyUnit = (unit: string) => /^[km]?wh$/i.test(unit.trim());

/** The label the visitor or the folder gave; empty when none, so no placeholder name leaks into a copied line. */
function labelOf(series: Series): string {
  return series.label.trim();
}

/** Antwortzeile: one sentence per fact, a hole is NOT FOUND, never "full year". */
export function buildAnswerLine(series: Series, analysis: Analysis, options: BuildOptions): string {
  const { texts, locale } = options;
  const digits = series.digits;
  const common = {
    lead: labelOf(series) === "" ? "" : `${labelOf(series)}: `,
    // Own data: only the decimals a sum needs ("30.000", not "30.000,0"). Built-in series keep their fixed look.
    sum: series.id === "own" ? formatSmart(analysis.provenSum, locale, digits) : formatNumber(analysis.provenSum, locale, digits),
    unit: series.unit,
    n: analysis.provenMonths,
    pct: formatPercent(analysis.monthCoverage, locale, 1),
    range: texts.stripRange,
    strip: stripOf(series.cells, false),
  };
  const source = series.source ? fill(texts.source, { source: series.source }) : "";
  const estimated =
    analysis.estimatedMonths.length > 0
      ? fill(texts.estimatedTail, { months: monthsText(analysis.estimatedMonths, options.months, texts.and, series.year) })
      : "";
  let line: string;
  if (analysis.missingMonths.length > 0) {
    const many = analysis.missingMonths.length > 1;
    line = fill(texts.holes, {
      ...common,
      missing: fill(many ? texts.missingMany : texts.missingOne, {
        months: monthsText(analysis.missingMonths, options.months, texts.and, series.year),
      }),
      notFound: many ? texts.notFoundMany : texts.notFoundOne,
      estimated,
      source,
    });
  } else if (analysis.estimatedMonths.length > 0) {
    line = fill(texts.estimatedOnly, { ...common, estimated, source });
  } else {
    line = fill(texts.complete, { ...common, src: series.source ? ` (${series.source})` : "" });
  }
  // An empty unit leaves a double space: close it, so the line asserts nothing the visitor did not type.
  const tidied = line.replace(/ {2,}/g, " ").replace(/ +([.,;:])/g, "$1");
  // No label: the line opens with "mindestens", so it opens with a capital.
  const closed = labelOf(series) === "" ? tidied.charAt(0).toUpperCase() + tidied.slice(1) : tidied;
  return options.ascii ? swapGlyphs(closed) : closed;
}

/** Mail to accounting for the missing months. Null when nothing is missing. */
export function buildMail(series: Series, analysis: Analysis, options: BuildOptions): string | null {
  if (analysis.missingMonths.length === 0) return null;
  const { texts } = options;
  const many = analysis.missingMonths.length > 1;
  const first = analysis.missingMonths[0] as number;
  const cell = series.cells[first - 1];
  const months = monthsText(analysis.missingMonths, options.months, texts.and, series.year);
  const others = texts.numberWords[12 - analysis.missingMonths.length] ?? String(12 - analysis.missingMonths.length);
  const meter = isEnergyUnit(series.unit) ? texts.mailMeter : "";
  const builtIn = series.id !== "own" && !many && cell?.invoiceNo !== undefined;
  let number = "";
  if (builtIn) {
    number = fill(texts.mailNumber, {
      no: cell?.invoiceNo ?? "",
      prev: series.cells[first - 2]?.invoiceNo ?? "",
      next: series.cells[first]?.invoiceNo ?? "",
    });
  }
  const subject = builtIn
    ? fill(texts.mailSubjectNumber, {
        mm: String(first).padStart(2, "0"),
        year: series.year ?? "",
        no: cell?.invoiceNo ?? "",
      })
    : fill(many ? texts.mailSubjectMany : texts.mailSubjectOne, { months });
  const topic = series.id === "electricity" ? texts.mailTopic : labelOf(series) === "" ? texts.mailTopicGeneric : labelOf(series);
  const body = fill(many ? texts.mailBodyMany : texts.mailBodyOne, {
    topic,
    months,
    number,
    meter,
    others,
  });
  return `${subject}\n\n${body}`;
}

/** Regel 4 for the Claude project: static, with the legend in the chosen notation. */
export function buildRule(options: BuildOptions): string {
  return options.ascii ? swapGlyphs(options.texts.rule) : options.texts.rule;
}

export interface Takeaway {
  readonly id: TakeawayId;
  /** Null: nothing to copy (no hole, no data). */
  readonly text: string | null;
}

export function buildTakeaways(series: Series, analysis: Analysis, options: BuildOptions): readonly Takeaway[] {
  return [
    { id: "answer", text: buildAnswerLine(series, analysis, options) },
    { id: "mail", text: buildMail(series, analysis, options) },
    { id: "rule", text: buildRule(options) },
  ];
}
