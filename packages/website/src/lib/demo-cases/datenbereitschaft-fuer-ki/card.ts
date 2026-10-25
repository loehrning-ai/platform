/**
 * "Deine Karte": the visitor's own question card, five boxes, eleven
 * fields. Pure: validation and hints never touch storage or the network, and
 * the card lives in component state only (the privacy line on the page is
 * literally true). The words of every message come from the locale pack.
 */
import type { Kind } from "./logic";
import { parseNumber } from "./parse";

export type Lock = "file" | "grant" | "open";
export const LOCKS: readonly Lock[] = ["file", "grant", "open"];

/** The card as typed. Every field is a string so the form never loses what was entered. */
export interface OwnCard {
  /** Box 1 */
  readonly metric: string;
  readonly question: string;
  /** YYYY-MM-DD */
  readonly clock: string;
  /** Box 2 */
  readonly view: string;
  readonly column: string;
  /** Box 3 */
  readonly kind: Kind | "";
  readonly who: string;
  /** Box 4: comma separated, 1 to 6 items */
  readonly never: string;
  readonly lockedBy: Lock | "";
  /** Box 5 */
  readonly expected: string;
  readonly unit: string;
  readonly source: string;
}

export type Field = keyof OwnCard;

export const FIELDS_BY_BOX: readonly (readonly Field[])[] = [
  ["metric", "question", "clock"],
  ["view", "column"],
  ["kind", "who"],
  ["never", "lockedBy"],
  ["expected", "unit", "source"],
];

export const EMPTY_CARD: OwnCard = {
  metric: "",
  question: "",
  clock: "",
  view: "",
  column: "",
  kind: "",
  who: "",
  never: "",
  lockedBy: "",
  expected: "",
  unit: "",
  source: "",
};

export const LIMITS = {
  metric: [3, 60],
  question: [10, 240],
  view: [1, 80],
  column: [0, 64],
  who: [3, 200],
  neverItem: [1, 60],
  neverItems: [1, 6],
  expectedValues: [1, 6],
  unit: [1, 12],
  source: [3, 120],
} as const;

export type ErrorCode =
  | "required"
  | "length"
  | "chars"
  | "forbidden"
  | "date"
  | "items"
  | "token"
  | "count"
  | "ai-source";

export interface FieldError {
  readonly field: Field;
  readonly code: ErrorCode;
  /** The character or token the message names, or the limits. */
  readonly detail?: string;
}

/** Control characters out, whitespace collapsed. */
export function clean(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

/** `<`, `>` and the backtick break Markdown in the generated files; the first one found is named. */
export function forbiddenChar(text: string): string | null {
  const match = /[<>`]/.exec(text);
  return match ? match[0] : null;
}

/** Splits the "never" list on commas and semicolons. */
export function neverItems(text: string): readonly string[] {
  return clean(text)
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

const VALUE_SEPARATORS = /[\t\r\n;]+|\s*\/\s*|\s*·\s*|,\s+|\s{2,}/;

/**
 * One token in the locale's notation. English groups with commas and marks
 * decimals with a point ("334,675", "9.5"); the parser reads German notation,
 * so English tokens are rewritten first ("334675", "9,5").
 */
function parseToken(token: string, locale: "de" | "en"): number | null {
  if (locale === "de") return parseNumber(token);
  return parseNumber(token.replace(/(\d),(?=\d{3}(?!\d))/g, "$1").replace(".", ","));
}

/** Expected values: 1 to 6 numbers. Returns the values, or the first token that is not a number. */
export function parseExpected(
  text: string,
  locale: "de" | "en" = "de",
): { readonly values: readonly number[] } | { readonly bad: string } | { readonly count: number } {
  const tokens = text
    .split(VALUE_SEPARATORS)
    .map(clean)
    .flatMap((token) => (token.includes(" ") && parseToken(token, locale) === null && !/^[+\-−(]\s/.test(token) ? token.split(" ") : [token]))
    .filter((token) => token !== "");
  const values: number[] = [];
  for (const token of tokens) {
    const value = parseToken(token, locale);
    if (value === null) return { bad: token };
    values.push(value);
  }
  if (values.length < LIMITS.expectedValues[0] || values.length > LIMITS.expectedValues[1]) return { count: values.length };
  return { values };
}

/** A source that is itself an AI: the test would measure whether the AI agrees with itself. */
const AI_SOURCE = /(?:^|[^\p{L}\p{N}])(ki|ai|claude|chatgpt|copilot|gpt|gemini)(?=$|[^\p{L}\p{N}])/iu;

export function isAiSource(text: string): boolean {
  return AI_SOURCE.test(text);
}

const VIEW_CHARS = /^[A-Za-z0-9_.\- ]+$/;
const COLUMN_CHARS = /^[A-Za-z0-9_]*$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDate(text: string): boolean {
  const match = DATE.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1) return false;
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] as number);
}

function length(field: Field, value: string, [min, max]: readonly [number, number], errors: FieldError[]) {
  if (value.length < min || value.length > max) errors.push({ field, code: "length", detail: `${min}-${max}` });
}

/** Every problem of the card, in box order. Empty when the three files can be made. */
export function validateCard(card: OwnCard, locale: "de" | "en" = "de"): readonly FieldError[] {
  const errors: FieldError[] = [];
  const text = (field: Field) => clean(String(card[field]));

  for (const field of ["metric", "question", "view", "column", "who", "never", "unit", "source"] as const) {
    const bad = forbiddenChar(card[field]);
    if (bad) errors.push({ field, code: "forbidden", detail: bad });
  }
  const failed = (field: Field) => errors.some((error) => error.field === field);
  const required = (field: Field) => {
    if (text(field) === "") {
      errors.push({ field, code: "required" });
      return false;
    }
    return !failed(field);
  };

  if (required("metric")) length("metric", text("metric"), LIMITS.metric, errors);
  if (required("question")) length("question", text("question"), LIMITS.question, errors);
  if (required("clock") && !isDate(text("clock"))) errors.push({ field: "clock", code: "date" });

  if (required("view")) {
    const view = text("view");
    if (!VIEW_CHARS.test(view)) errors.push({ field: "view", code: "chars" });
    else length("view", view, LIMITS.view, errors);
  }
  if (!failed("column")) {
    const column = text("column");
    if (!COLUMN_CHARS.test(column)) errors.push({ field: "column", code: "chars" });
    else length("column", column, LIMITS.column, errors);
  }

  if (card.kind === "") errors.push({ field: "kind", code: "required" });
  if (required("who")) length("who", text("who"), LIMITS.who, errors);

  if (required("never")) {
    const items = neverItems(card.never);
    const [min, max] = LIMITS.neverItems;
    if (items.length < min || items.length > max || items.some((item) => item.length > LIMITS.neverItem[1])) {
      errors.push({ field: "never", code: "items", detail: `${min}-${max}` });
    }
  }
  if (card.lockedBy === "") errors.push({ field: "lockedBy", code: "required" });

  if (required("expected")) {
    const parsed = parseExpected(card.expected, locale);
    if ("bad" in parsed) errors.push({ field: "expected", code: "token", detail: parsed.bad });
    else if ("count" in parsed) errors.push({ field: "expected", code: "count", detail: `${LIMITS.expectedValues[0]}-${LIMITS.expectedValues[1]}` });
  }
  if (required("unit")) length("unit", text("unit"), LIMITS.unit, errors);
  if (required("source")) {
    if (isAiSource(text("source"))) errors.push({ field: "source", code: "ai-source" });
    else length("source", text("source"), LIMITS.source, errors);
  }
  return errors;
}

/** "Ending MRR" -> "ending_mrr"; umlauts transliterated, at most 40 characters. */
export function metricSlug(name: string): string {
  const slug = clean(name)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
    .replace(/_+$/, "");
  return slug || "kennzahl";
}

export type QuestionHint = "period" | "kind" | "unit" | "levels-summed" | "rates-averaged";

const PERIOD = [
  /\b(?:19|20)\d{2}\b/,
  /\bq[1-4]\b/i,
  /quartal|quarter|monat|month|woche|week|\bkw\s?\d+/i,
  /\b(?:jan|feb|mär|mar|apr|mai|may|jun|jul|aug|sep|okt|oct|nov|dez|dec)[a-zä]*\b/i,
  /\b\d{1,2}\.\d{1,2}\./,
];
const KIND = /stand|bestand|\bende|monatsende|ending|\bend\b|offen|open|on hand|veränderung|zugang|abgang|netto|zuwachs|net new|change|quote|rate|anteil|%|prozent|percent/i;
const UNIT = /€|\beur\b|euro|stück|anzahl|count|%|prozent|percent|stunden|hours|units|tickets|\bpcs\b/i;

/** Hints for the exact question, never a block. DE and EN words in one list. */
export function lintQuestion(card: Pick<OwnCard, "question" | "kind" | "unit" | "who">): readonly QuestionHint[] {
  const question = clean(card.question);
  if (question === "") return [];
  const hints: QuestionHint[] = [];
  if (!PERIOD.some((pattern) => pattern.test(question))) hints.push("period");
  if (!KIND.test(question) && card.kind === "") hints.push("kind");
  if (!UNIT.test(question) && clean(card.unit) === "") hints.push("unit");
  const text = `${question} ${clean(card.who)}`;
  if (card.kind === "level" && /summ|addier|gesamt|total|\bsum\b|added/i.test(text)) hints.push("levels-summed");
  if (card.kind === "rate" && /durchschnitt|mittel|average|mean/i.test(text)) hints.push("rates-averaged");
  return hints;
}

/** "|" would split a Markdown table cell. */
export function cell(text: string): string {
  return clean(text).replace(/\|/g, "\\|");
}
