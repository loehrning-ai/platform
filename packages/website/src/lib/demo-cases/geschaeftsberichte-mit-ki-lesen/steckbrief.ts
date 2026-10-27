/**
 * The visitor's own metric card (beat "Deine Kennzahl"): the fields, the
 * deterministic lint R1 to R8 and the Markdown block. Pure: the words come in
 * from the copy pack, so the browser bundle holds one language.
 */

export type NumeratorKind = "" | "events" | "quantity";
export type PeriodKind = "" | "month" | "week" | "workday" | "quarter" | "year" | "other";
export type Comparison = "" | "previous" | "lastYear" | "plan";

export interface OwnCard {
  readonly name: string;
  readonly decision: string;
  readonly numerator: string;
  readonly numeratorKind: NumeratorKind;
  readonly denominator: string;
  readonly noDenominator: boolean;
  readonly period: PeriodKind;
  readonly comparison: Comparison;
  readonly sourceFile: string;
  readonly sourceColumn: string;
  readonly limit: string;
  readonly trigger: string;
  /** The fork "Berichtet | Bereinigt": the card defines an adjusted figure. */
  readonly adjusted: boolean;
}

export type TextField = "name" | "decision" | "numerator" | "denominator" | "sourceFile" | "sourceColumn" | "limit" | "trigger";

/** Form limits, in characters. */
export const FIELD_LIMITS: Readonly<Record<TextField, number>> = {
  name: 60,
  decision: 120,
  numerator: 120,
  denominator: 120,
  sourceFile: 80,
  sourceColumn: 80,
  limit: 160,
  trigger: 160,
};

/** At most this many cards go into the take-home. */
export const MAX_CARDS = 5;

export const EMPTY_CARD: OwnCard = {
  name: "",
  decision: "",
  numerator: "",
  numeratorKind: "",
  denominator: "",
  noDenominator: false,
  period: "",
  comparison: "",
  sourceFile: "",
  sourceColumn: "",
  limit: "",
  trigger: "",
  adjusted: false,
};

export type RuleId = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8";
export type CardField = TextField | "period";

export interface Finding {
  readonly rule: RuleId;
  /** The field the finding is shown under. */
  readonly field: CardField;
}

/** "Bereinigt" and its cousins: a definition of its own (SEC C&DI 100.01, ESMA APM). */
export const ADJUSTED = /\b(bereinigt\w*|adjusted|underlying|operativ\w*)\b|ohne (sonder|einmal)|\bebitda\b/i;

const filled = (value: string) => value.trim() !== "";

/** Every finding for a card, in rule order. R4, R5 and R8 wait until the card has a name. */
export function lintCard(card: OwnCard): readonly Finding[] {
  const findings: Finding[] = [];
  const started = filled(card.name);
  if (card.numeratorKind === "events") findings.push({ rule: "R1", field: "numerator" });
  if (card.noDenominator) findings.push({ rule: "R2", field: "denominator" });
  if (card.period === "month" && card.comparison === "previous") findings.push({ rule: "R3", field: "period" });
  if (started && filled(card.sourceFile) && !filled(card.sourceColumn)) findings.push({ rule: "R4", field: "sourceColumn" });
  if (started && !filled(card.limit)) findings.push({ rule: "R5", field: "limit" });
  if (card.adjusted || ADJUSTED.test(card.name) || ADJUSTED.test(card.numerator)) findings.push({ rule: "R6", field: "name" });
  if (filled(card.trigger) && card.numeratorKind === "events") findings.push({ rule: "R7", field: "trigger" });
  if (started && !filled(card.decision)) findings.push({ rule: "R8", field: "decision" });
  return findings;
}

/** Kennzahl, Zähler, Nenner (or "keiner") and Zeitraum are set. */
export function canAddCard(card: OwnCard): boolean {
  return filled(card.name) && filled(card.numerator) && (card.noDenominator || filled(card.denominator)) && card.period !== "";
}

/** One line of card text: no line breaks, no leading heading or rule marks, within its limit. */
export function cleanField(value: string, limit: number): string {
  const flat = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const unmarked = flat.replace(/^(?:(?:-{3,}|#+|>+)\s*)+/, "").trim();
  return unmarked.slice(0, limit).trim();
}

/** The words a card block is written in (from the copy pack). */
export interface CardWords {
  readonly decision: string;
  readonly numerator: string;
  readonly denominator: string;
  readonly period: string;
  readonly source: string;
  readonly limit: string;
  readonly trigger: string;
  readonly column: string;
  readonly comparison: string;
  readonly none: string;
  readonly unset: string;
  readonly kinds: Readonly<Record<Exclude<NumeratorKind, "">, string>>;
  readonly periods: Readonly<Record<Exclude<PeriodKind, "">, string>>;
  readonly comparisons: Readonly<Record<Exclude<Comparison, "">, string>>;
  readonly adjusted: string;
}

/** The card as a Markdown block, the same format as claude/kennzahlen-steckbrief/SKILL.md. */
export function cardToMarkdown(card: OwnCard, words: CardWords): string {
  const text = (field: TextField) => cleanField(card[field], FIELD_LIMITS[field]) || words.unset;
  const notes = [card.numeratorKind ? words.kinds[card.numeratorKind] : "", card.adjusted ? words.adjusted : ""].filter(Boolean);
  const kind = notes.length > 0 ? ` (${notes.join(", ")})` : "";
  const denominator = card.noDenominator ? words.none : text("denominator");
  const period = card.period ? `${words.periods[card.period]}${card.comparison ? `, ${words.comparison} ${words.comparisons[card.comparison]}` : ""}` : words.unset;
  const column = cleanField(card.sourceColumn, FIELD_LIMITS.sourceColumn);
  const source = `${text("sourceFile")}${column ? `, ${words.column} ${column}` : ""}`;
  return [
    `### ${cleanField(card.name, FIELD_LIMITS.name) || words.unset}`,
    `- ${words.decision}: ${text("decision")}`,
    `- ${words.numerator}: ${text("numerator")}${kind}`,
    `- ${words.denominator}: ${denominator}`,
    `- ${words.period}: ${period}`,
    `- ${words.source}: ${source}`,
    `- ${words.limit}: ${text("limit")}`,
    `- ${words.trigger}: ${text("trigger")}`,
  ].join("\n");
}

/**
 * The stage preview before and while the visitor types: every field the
 * visitor has not set yet shows the example's value. `typed[i]` says whether
 * line i of cardToMarkdown (heading, then the seven lines) is the visitor's.
 */
export function withExample(card: OwnCard, example: OwnCard): { readonly card: OwnCard; readonly typed: readonly boolean[] } {
  const own = (field: TextField) => filled(card[field]);
  const pick = (field: TextField) => (own(field) ? card[field] : example[field]);
  const numeratorOwn = own("numerator") || card.numeratorKind !== "";
  const denominatorOwn = own("denominator") || card.noDenominator;
  const periodOwn = card.period !== "";
  const sourceOwn = own("sourceFile") || own("sourceColumn");
  const merged: OwnCard = {
    name: pick("name"),
    decision: pick("decision"),
    numerator: numeratorOwn ? card.numerator : example.numerator,
    numeratorKind: numeratorOwn ? card.numeratorKind : example.numeratorKind,
    denominator: denominatorOwn ? card.denominator : example.denominator,
    noDenominator: denominatorOwn ? card.noDenominator : example.noDenominator,
    period: periodOwn ? card.period : example.period,
    comparison: periodOwn ? card.comparison : example.comparison,
    sourceFile: sourceOwn ? card.sourceFile : example.sourceFile,
    sourceColumn: sourceOwn ? card.sourceColumn : example.sourceColumn,
    limit: pick("limit"),
    trigger: pick("trigger"),
    adjusted: card.adjusted || example.adjusted,
  };
  return {
    card: merged,
    typed: [own("name"), own("decision"), numeratorOwn, denominatorOwn, periodOwn, sourceOwn, own("limit"), own("trigger")],
  };
}
