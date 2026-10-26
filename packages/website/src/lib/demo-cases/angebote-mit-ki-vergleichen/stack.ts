/**
 * The "stack" engine of rotfaden's demo (assets/demo/demo.js, commit b31ba1c), ported to typed, pure
 * functions: one parser for the kit's kostenzeilen.csv and the visitor's own lines, one model for
 * totals, ranking and the line that decides, one money format. Same rules as the original:
 *
 *   - amounts are whole cents, never floats; a scaled line rounds half away from zero;
 *   - a line one offer has and another lacks is MISSING there, never 0: only the visitor knows
 *     whether it is 0, so an incomplete model names no winner;
 *   - recurring lines count once per year of the horizon, one-off lines once.
 *
 * No imports apart from types: the tests, the client demo and the lockstep check run the same code.
 */

export type Lang = "de" | "en";
export type Per = "once" | "recurring";

export interface StackConfig {
  readonly columns: { readonly option: string; readonly line: string; readonly amount: string; readonly per: string; readonly source: string };
  /** The line a quick answer ranks by ("Ware"). */
  readonly headline: string;
  /** The words in the `je` column for a one-off and a recurring line. */
  readonly once: string;
  readonly recurring: string;
  readonly horizon: { readonly value: number; readonly unit: string; readonly unit_one: string };
  readonly better: "lower" | "higher";
}

export interface CostRow {
  readonly option: string;
  readonly line: string;
  readonly cents: number;
  readonly per: Per;
  readonly src: string;
}

/** Why a line of pasted text was not read, with its 1-based line number. */
export type ParseError =
  | { readonly kind: "empty" }
  | { readonly kind: "long"; readonly max: number }
  | { readonly kind: "column"; readonly column: string }
  | { readonly kind: "option" | "line" | "name"; readonly n: number }
  | { readonly kind: "amount" | "decimals"; readonly n: number; readonly value: string }
  | { readonly kind: "per"; readonly n: number; readonly value: string }
  | { readonly kind: "source"; readonly n: number; readonly max: number }
  | { readonly kind: "rows" | "options" | "lines"; readonly max: number }
  | { readonly kind: "two" };

export interface Parsed {
  readonly rows: readonly CostRow[];
  readonly errors: readonly ParseError[];
}

export const LIMITS = { chars: 20000, rows: 200, options: 6, lines: 12, source: 240 } as const;

const SYNONYMS = {
  option: ["option", "offer", "angebot", "anbieter", "supplier", "lieferant", "variante"],
  line: ["line", "zeile", "position", "item", "kostenart", "posten"],
  amount: ["amount", "betrag", "eur", "euro", "usd", "price", "preis", "kosten", "cost", "wert", "value"],
  per: ["per", "je", "frequency", "rhythmus", "turnus", "interval", "intervall"],
  source: ["source", "where", "stelle", "quelle", "beleg", "wo"],
} as const;
const ONCE = ["once", "one-off", "one off", "one time", "einmalig", "einmal", "single"];
const YEARLY = ["year", "yearly", "per year", "annual", "annually", "jährlich", "jaehrlich", "pro jahr", "jahr", "p.a.", "pa"];

const low = (value: string | undefined): string => String(value ?? "").trim().toLowerCase();

/** One CSV row: the separator, double quotes around a cell, "" for a quote inside one. */
export function splitRow(line: string, separator: string): readonly string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else quoted = false;
      } else current += char;
    } else if (char === '"' && current.trim() === "") {
      quoted = true;
      current = "";
    } else if (char === separator) {
      out.push(current);
      current = "";
    } else current += char;
  }
  out.push(current);
  return out.map((cell) => cell.trim());
}

/**
 * An amount in cents. German reads "1.234,56", English "1,234.56"; a lone comma is a decimal comma in
 * German, a lone dot a decimal dot unless it groups thousands in German. Brackets and a leading minus
 * (hyphen or U+2212) make it negative.
 */
export function parseCents(raw: string, lang: Lang): { readonly cents: number } | { readonly err: "nan" | "decimals" | "large" } {
  let text = String(raw)
    .replace(/[\s\u00a0\u202f']/g, "")
    .replace(/^(EUR|USD|CHF|GBP)/i, "")
    .replace(/(EUR|USD|CHF|GBP)$/i, "")
    .replace(/[€$£]/g, "");
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (/^[-−]/.test(text)) {
    negative = !negative;
    text = text.slice(1);
  }
  if (!/^[0-9.,]+$/.test(text) || !/[0-9]/.test(text)) return { err: "nan" };
  const hasDot = text.includes(".");
  const hasComma = text.includes(",");
  let decimal: "." | "," | null = null;
  if (hasDot && hasComma) decimal = text.lastIndexOf(".") > text.lastIndexOf(",") ? "." : ",";
  else if (hasComma) decimal = lang === "de" || !/^\d{1,3}(,\d{3})+$/.test(text) ? "," : null;
  else if (hasDot) decimal = lang === "de" && /^\d{1,3}(\.\d{3})+$/.test(text) ? null : ".";
  let whole = text;
  let fraction = "";
  if (decimal) {
    const at = text.lastIndexOf(decimal);
    whole = text.slice(0, at);
    fraction = text.slice(at + 1);
  }
  if (/[.,]/.test(fraction)) return { err: "nan" };
  if (fraction.length > 2) return { err: "decimals" };
  // Thousands come in groups of three with one kind of separator: 1.234.567 or 1,234,567, never 1.2.3.
  if (/[.,]/.test(whole) && !/^\d{1,3}(\.\d{3})+$/.test(whole) && !/^\d{1,3}(,\d{3})+$/.test(whole)) return { err: "nan" };
  whole = whole.replace(/[.,]/g, "") || "0";
  if (whole.length > 12) return { err: "large" };
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt(`${fraction}00`.slice(0, 2), 10);
  return { cents: negative ? -cents : cents };
}

function perKind(raw: string, config: StackConfig): Per | null {
  const value = low(raw);
  const unitOne = low(config.horizon.unit_one);
  const unit = low(config.horizon.unit);
  if (value === "" || value === low(config.once) || ONCE.includes(value)) return "once";
  let recurring = [low(config.recurring), unitOne, unit, `per ${unitOne}`, `pro ${unitOne}`, `je ${unitOne}`];
  if (unitOne === "year" || unitOne === "jahr") recurring = [...recurring, ...YEARLY];
  return recurring.includes(value) ? "recurring" : null;
}

/** The kit's file and the visitor's lines, one path. Rows only when nothing failed. */
export function parse(input: string, lang: Lang, config: StackConfig): Parsed {
  const text = String(input ?? "").replace(/^\ufeff/, "").replace(/\r\n?/g, "\n");
  if (text.length > LIMITS.chars) return { rows: [], errors: [{ kind: "long", max: LIMITS.chars }] };
  const lines = text
    .split("\n")
    .map((value, index) => ({ text: value, n: index + 1 }))
    .filter((line) => line.text.trim() !== "");
  if (lines.length === 0) return { rows: [], errors: [{ kind: "empty" }] };
  const first = lines[0]!.text;
  const separator = first.includes("\t") ? "\t" : first.includes(";") ? ";" : ",";
  const head = splitRow(first, separator).map(low);
  const find = (key: keyof typeof SYNONYMS): number => {
    const names: readonly string[] = [low(config.columns[key]), ...SYNONYMS[key]];
    return head.findIndex((cell) => names.includes(cell));
  };
  let index = { option: 0, line: 1, amount: 2, per: 3, source: -1 };
  let start = 0;
  if (find("option") >= 0 && find("amount") >= 0) {
    index = { option: find("option"), line: find("line"), amount: find("amount"), per: find("per"), source: find("source") };
    start = 1;
    if (index.line < 0) return { rows: [], errors: [{ kind: "column", column: config.columns.line }] };
  }
  const errors: ParseError[] = [];
  const rows: CostRow[] = [];
  const options: string[] = [];
  const names: string[] = [];
  for (const { text: row, n } of lines.slice(start)) {
    const cells = splitRow(row, separator);
    const option = cells[index.option] ?? "";
    const line = cells[index.line] ?? "";
    const amount = cells[index.amount] ?? "";
    const per = index.per >= 0 ? (cells[index.per] ?? "") : "";
    const src = index.source >= 0 ? (cells[index.source] ?? "") : "";
    if (!option) {
      errors.push({ kind: "option", n });
      continue;
    }
    if (!line) {
      errors.push({ kind: "line", n });
      continue;
    }
    const cents = parseCents(amount, lang);
    if ("err" in cents) {
      errors.push({ kind: cents.err === "decimals" ? "decimals" : "amount", n, value: amount });
      continue;
    }
    const kind = perKind(per, config);
    if (!kind) {
      errors.push({ kind: "per", n, value: per });
      continue;
    }
    if (option.length > 40 || line.length > 40) {
      errors.push({ kind: "name", n });
      continue;
    }
    if (src.length > LIMITS.source) {
      errors.push({ kind: "source", n, max: LIMITS.source });
      continue;
    }
    if (!options.includes(option)) options.push(option);
    if (!names.includes(line)) names.push(line);
    rows.push({ option, line, cents: cents.cents, per: kind, src });
  }
  if (rows.length > LIMITS.rows) errors.push({ kind: "rows", max: LIMITS.rows });
  if (options.length > LIMITS.options) errors.push({ kind: "options", max: LIMITS.options });
  if (names.length > LIMITS.lines) errors.push({ kind: "lines", max: LIMITS.lines });
  if (errors.length === 0 && options.length < 2) errors.push({ kind: "two" });
  return { rows: errors.length ? [] : rows, errors };
}

/** One line scaled by a factor (the paper index), on one offer or on all. */
export interface Scale {
  readonly line: string;
  readonly option?: string;
  readonly factor: number;
}

export interface OptionModel {
  readonly name: string;
  /** The line as counted over the horizon, after any scale; 0 where the line is missing. */
  readonly lines: Readonly<Record<string, number>>;
  /** The amount as written. */
  readonly raw: Readonly<Record<string, number>>;
  readonly per: Readonly<Record<string, Per>>;
  readonly src: Readonly<Record<string, string>>;
  /** Lines another offer has and this one lacks: open, never 0. */
  readonly missing: readonly string[];
  readonly total: number;
  /** The headline line as written ("Ware"). */
  readonly headline: number;
}

export interface StackModel {
  readonly options: readonly OptionModel[];
  /** Every line name, the headline first. */
  readonly lines: readonly string[];
  readonly ranked: readonly OptionModel[];
  readonly byHeadline: readonly OptionModel[];
  readonly winner: OptionModel;
  readonly runner: OptionModel;
  readonly last: OptionModel;
  readonly gap: number;
  readonly headWinner: OptionModel;
  readonly headGap: number;
  /** The line with the largest difference between the runner-up and the winner. */
  readonly decider: string;
  readonly missing: readonly { readonly option: string; readonly line: string }[];
  /** No line is missing anywhere: only then is there a winner to name. */
  readonly complete: boolean;
}

/** Rounds |cents| x factor half away from zero, keeping the sign. */
export function scaled(cents: number, factor: number): number {
  const rounded = Math.floor(Math.abs(cents) * factor + 0.5);
  return cents < 0 ? -rounded : rounded;
}

export function compute(rows: readonly CostRow[], horizon: number, scale: Scale | null, config: StackConfig): StackModel {
  const order: string[] = [];
  const lines: string[] = [];
  const by = new Map<string, { raw: Record<string, number>; per: Record<string, Per>; src: Record<string, string> }>();
  for (const row of rows) {
    if (!by.has(row.option)) {
      by.set(row.option, { raw: {}, per: {}, src: {} });
      order.push(row.option);
    }
    if (!lines.includes(row.line)) lines.push(row.line);
    const entry = by.get(row.option)!;
    entry.raw[row.line] = (entry.raw[row.line] ?? 0) + row.cents;
    entry.per[row.line] = row.per;
    if (row.src) entry.src[row.line] = entry.src[row.line] ? `${entry.src[row.line]} · ${row.src}` : row.src;
  }
  const headlineAt = lines.indexOf(config.headline);
  if (headlineAt > 0) lines.unshift(...lines.splice(headlineAt, 1));
  const missing: { option: string; line: string }[] = [];
  const options: OptionModel[] = order.map((name) => {
    const entry = by.get(name)!;
    const own: string[] = [];
    const counted: Record<string, number> = {};
    let total = 0;
    for (const line of lines) {
      if (!Object.hasOwn(entry.raw, line)) {
        own.push(line);
        missing.push({ option: name, line });
      }
      const raw = entry.raw[line] ?? 0;
      let value = entry.per[line] === "recurring" ? raw * horizon : raw;
      if (scale && scale.line === line && (!scale.option || scale.option === name)) value = scaled(value, scale.factor);
      counted[line] = value;
      total += value;
    }
    return { name, lines: counted, raw: entry.raw, per: entry.per, src: entry.src, missing: own, total, headline: entry.raw[config.headline] ?? 0 };
  });
  const sign = config.better === "higher" ? -1 : 1;
  const indexOf = (option: OptionModel) => options.indexOf(option);
  const ranked = [...options].sort((a, b) => sign * (a.total - b.total) || indexOf(a) - indexOf(b));
  const byHeadline = [...options].sort((a, b) => sign * (a.headline - b.headline) || indexOf(a) - indexOf(b));
  const winner = ranked[0]!;
  const runner = ranked[1] ?? winner;
  let decider = config.headline;
  let best = 0;
  for (const line of lines) {
    const difference = sign * ((runner.lines[line] ?? 0) - (winner.lines[line] ?? 0));
    if (difference > best) {
      best = difference;
      decider = line;
    }
  }
  return {
    options,
    lines,
    ranked,
    byHeadline,
    winner,
    runner,
    last: ranked[ranked.length - 1]!,
    gap: Math.abs(runner.total - winner.total),
    headWinner: byHeadline[0]!,
    headGap: Math.abs((byHeadline[1] ?? byHeadline[0]!).headline - byHeadline[0]!.headline),
    decider,
    missing,
    complete: missing.length === 0,
  };
}

/** The index stops of the apply beat as factors on the scaled line: 1 + share x v / 100. */
export function factorsOf(index: { readonly values: readonly number[]; readonly share: number }): readonly number[] {
  return index.values.map((value) => 1 + (index.share * value) / 100);
}

export interface FlipPoint {
  /** The index rise at which the scaled offer loses first place, in percent. */
  readonly v: number;
  /** The offer that takes first place there. */
  readonly rival: string;
  /** Where that rise sits on the stops' track, 0 to 1 (stops evenly spaced). */
  readonly pos: number;
}

/**
 * Where the first place changes as the scaled line grows, computed from the data at factor 1, never
 * typed in. Null when the model is incomplete or the flip lies outside the stops.
 */
export function flipPoint(
  rows: readonly CostRow[],
  horizon: number,
  apply: { readonly line: string; readonly option: string; readonly index: { readonly values: readonly number[]; readonly share: number } },
  config: StackConfig,
): FlipPoint | null {
  const model = compute(rows, horizon, null, config);
  if (!model.complete || model.options.length < 2) return null;
  const option = model.options.find((candidate) => candidate.name === apply.option);
  const base = option ? (option.lines[apply.line] ?? 0) : 0;
  if (!option || !base) return null;
  const sign = config.better === "higher" ? -1 : 1;
  let rival: OptionModel | null = null;
  for (const candidate of model.options) {
    if (candidate !== option && (!rival || sign * (candidate.total - rival.total) < 0)) rival = candidate;
  }
  if (!rival) return null;
  const factor = 1 + (rival.total - option.total) / base;
  const v = ((factor - 1) / apply.index.share) * 100;
  const values = apply.index.values;
  if (!(v > values[0]!) || v > values[values.length - 1]!) return null;
  let k = 0;
  while (k < values.length - 2 && v > values[k + 1]!) k++;
  return { v, rival: rival.name, pos: (k + (v - values[k]!) / (values[k + 1]! - values[k]!)) / (values.length - 1) };
}

/** Whole euros, German "26.554 €" or English "€26,554", minus sign U+2212. */
export function fmtEur(cents: number, lang: Lang): string {
  const negative = cents < 0;
  const rounded = Math.floor((Math.abs(cents) + 50) / 100);
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "de" ? "." : ",");
  const sign = negative ? "−" : "";
  return lang === "de" ? `${sign}${grouped} €` : `${sign}€${grouped}`;
}

/** A number with up to `places` decimals, trailing zeros dropped, German decimal comma. */
export function fmtNumber(value: number, places: number, lang: Lang): string {
  // Trailing zeros go only after a decimal point: 6.50 is "6,5", but 10 stays "10".
  const text = (Math.round(value * 10 ** places) / 10 ** places).toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return lang === "de" ? text.replace(".", ",") : text;
}

/** Fills {name} placeholders; an unknown name stays as written. */
export function fill(text: string, vars: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{(\w+)\}/g, (all, key: string) => (Object.hasOwn(vars, key) ? String(vars[key]) : all));
}
