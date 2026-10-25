/**
 * The three files "Deine Karte" makes, built in the browser from the card:
 *
 *   kennzahl-fragekarte.zip   kennzahl-fragekarte/SKILL.md (static) + references/kennzahlen.md
 *   projekt-anweisung.txt     the instructions of a Claude Project
 *   pruefliste.md             the tests with expected values; never goes into Claude
 *
 * Pure functions of (card, the locale's file text). The kit ships the
 * FOLDLINE edition of each, made by these same functions (kit-lockstep.test.ts).
 * The expected values appear only in the test list.
 */
import { zipStore } from "@/lib/zip/store";
import { cell, clean, metricSlug, neverItems, parseExpected, type Lock, type OwnCard } from "./card";
import { formatNumber, countDecimals } from "./format";
import { canAdd, type AddRule, type Kind } from "./logic";
import { SKILL_MD, SKILL_NAME } from "./skill-text";

export interface FileText {
  readonly locale: "de" | "en";
  /** {slug} {metric} {question} {clock} {kindRule} {source} {who} {never} {locked} */
  readonly definitions: string;
  /** {openRisk} {metric} {slug} {clock} {source} {never} {kindRule} {who} */
  readonly instructions: string;
  /** {never} */
  readonly openRisk: string;
  /** {metric} {clock} {slug} {t1} {t2} {t3} {t4} */
  readonly checklist: string;
  /** Test rows: {question} {values} {unit} {source} */
  readonly t1: string;
  readonly t2: string;
  readonly t3: string;
  /** {metric} */
  readonly askBack: string;
  /** {item} {metric} */
  readonly refuse: string;
  readonly kindName: Readonly<Record<Kind, string>>;
  readonly addGroups: Readonly<Partial<Record<AddRule, string>>>;
  readonly addMonths: Readonly<Partial<Record<AddRule, string>>>;
  readonly addQuarter: Readonly<Partial<Record<AddRule, string>>>;
  readonly locked: Readonly<Record<Lock, string>>;
  /** {view} {column} */
  readonly viewColumn: string;
  readonly listAnd: string;
}

/** "{name}" placeholders; an unknown name stays visible, so a gap is never silent. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}

/** "a, b und c". */
export function joinList(items: readonly string[], and: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

/** The kind of number and its add rules, derived from canAdd(). */
export function kindRule(kind: Kind, text: FileText): string {
  return [
    `${text.kindName[kind]}.`,
    text.addGroups[canAdd(kind, "groups")],
    text.addMonths[canAdd(kind, "months")],
    text.addQuarter[canAdd(kind, "quarter")],
  ].join(" ");
}

function source(card: OwnCard, text: FileText): string {
  const view = clean(card.view);
  const column = clean(card.column);
  return column ? fill(text.viewColumn, { view, column }) : view;
}

/** The expected values as the locale writes them: "334.675 / 344.450 / 387.015". */
export function expectedText(card: OwnCard, locale: "de" | "en"): string {
  const parsed = parseExpected(card.expected, locale);
  if (!("values" in parsed)) return clean(card.expected);
  return parsed.values.map((value) => formatNumber(value, locale, countDecimals(value, 2))).join(" / ");
}

function common(card: OwnCard, text: FileText) {
  const metric = clean(card.metric);
  const never = neverItems(card.never);
  return {
    slug: metricSlug(metric),
    metric,
    question: clean(card.question),
    clock: clean(card.clock),
    kindRule: card.kind === "" ? "" : kindRule(card.kind, text),
    source: source(card, text),
    who: clean(card.who),
    never: joinList(never, text.listAnd),
    firstNever: never[0] ?? "",
  };
}

/** references/kennzahlen.md: the definition the skill and the Project read. No expected values. */
export function definitionsMd(card: OwnCard, text: FileText): string {
  const values = common(card, text);
  return fill(text.definitions, {
    ...values,
    locked: card.lockedBy === "" ? "" : text.locked[card.lockedBy],
  });
}

/** projekt-anweisung.txt: the Project instructions. No expected values. */
export function projectInstructions(card: OwnCard, text: FileText): string {
  const values = common(card, text);
  return fill(text.instructions, {
    ...values,
    openRisk: card.lockedBy === "open" ? fill(text.openRisk, { never: values.never }) : "",
  });
}

/** The two behaviour tests, prefilled from the card. */
export function behaviourTests(card: OwnCard, text: FileText): { readonly askBack: string; readonly refuse: string } {
  const values = common(card, text);
  return {
    askBack: fill(text.askBack, { metric: values.metric }),
    refuse: fill(text.refuse, { item: values.firstNever, metric: values.metric }),
  };
}

/** pruefliste.md: the tests with expected values and their source. Stays outside Claude. */
export function checklistMd(card: OwnCard, text: FileText): string {
  const values = common(card, text);
  const tests = behaviourTests(card, text);
  const row = { question: cell(values.question), values: expectedText(card, text.locale), unit: cell(card.unit), source: cell(card.source) };
  return fill(text.checklist, {
    metric: values.metric,
    clock: values.clock,
    slug: values.slug,
    t1: fill(text.t1, row),
    t2: fill(text.t2, { question: cell(tests.askBack) }),
    t3: fill(text.t3, { question: cell(tests.refuse) }),
  });
}

/** The visitor's skill zip: the unchanged SKILL.md plus their references file. */
export function skillZip(card: OwnCard, text: FileText): Uint8Array {
  return zipStore([
    { path: `${SKILL_NAME}/SKILL.md`, data: SKILL_MD },
    { path: `${SKILL_NAME}/references/kennzahlen.md`, data: definitionsMd(card, text) },
  ]);
}
