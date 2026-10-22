/**
 * The shape of demo 03's copy and the helpers every module may use. This file
 * holds no locale's strings: copy-de.ts and copy-en.ts do, and only server code
 * (index.tsx) and tests import them, through copy.ts. Client components get the
 * current locale's DemoText as a prop, so the browser loads one language.
 * Rule texts carry {placeholders}; identifiers sit in `backticks` and are set
 * in mono by the renderer, which also wraps the English terms of the German
 * copy in <span lang="en">.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { TableId } from "./data";
import type {
  Base,
  Behavior,
  Blank,
  Combine,
  DefinitionRequestId,
  FixedLine,
  FreshTick,
  Gap,
  Grain,
  Kind,
  Lock,
  Period,
  RequestId,
  RowLabel,
  RuleId,
  TriageCard,
  TriageRuleId,
  Verdict,
} from "./model";

export interface Option {
  readonly label: string;
  readonly gloss?: string;
}

export interface Takeaway {
  readonly id: "definition" | "adding" | "test" | "instruction";
  readonly title: string;
  /** Shown in full and copied exactly as shown. */
  readonly text: string;
  /** Shown below the card text, never copied. */
  readonly example?: { readonly label: string; readonly text: string };
  readonly note?: string;
}

export type ApprovedTable =
  | "analytics.mrr_summary_monthly"
  | "analytics.account_mrr_monthly"
  | "analytics.logo_churn_by_segment_quarter"
  | "analytics.attrition_by_department_quarter";

export interface DemoText {
  /** The locale this copy is written in; number formatting follows it. */
  readonly locale: Locale;
  readonly railLabel: string;
  readonly railStates: { readonly open: string; readonly tried: string; readonly solved: string };
  readonly requestWord: string;
  readonly requestTitles: Readonly<Record<RequestId, string>>;
  readonly questions: Readonly<Record<DefinitionRequestId, string>>;
  readonly context: string;
  readonly context05: string;
  readonly decision05: string;
  readonly start01: string;
  readonly intro04: string;
  readonly path: string;
  readonly fixedNote: string;
  readonly fixed: Readonly<Record<FixedLine, string>>;
  readonly legends: Readonly<Record<Blank, string>>;
  readonly kind: Readonly<Record<Kind, Option>>;
  readonly kind05: Readonly<Record<Kind, Option>>;
  readonly grain: Readonly<Record<Grain, string>>;
  readonly period: Readonly<Record<Period, string>>;
  readonly base03: Readonly<Record<Exclude<Base, "averageHeadcount">, string>>;
  readonly base05: Readonly<Record<"startOfQuarter" | "averageHeadcount", string>>;
  readonly combine: Readonly<Record<Combine, string>>;
  readonly tableTag: { readonly approved: string; readonly export: string };
  readonly views: Readonly<Record<ApprovedTable, string>>;
  readonly cardWord: string;
  readonly behaviorLegend: string;
  readonly behaviors: Readonly<Record<Behavior, string>>;
  readonly cards: Readonly<Record<TriageCard, string>>;
  readonly gapsLegend: string;
  readonly gaps: Readonly<Record<Gap, string>>;
  readonly yourAsk: string;
  readonly lockLegend: string;
  readonly locks: Readonly<Record<Lock, Option>>;
  readonly lockWhy: Readonly<Record<Exclude<Lock, "postgresRole">, string>>;
  readonly ticksLegend: string;
  readonly ticks: Readonly<Record<FreshTick, string>>;
  readonly tickShort: Readonly<Record<FreshTick, string>>;
  readonly and: string;
  readonly check: string;
  readonly receiptHeading: string;
  readonly receipt: string;
  readonly receiptEmpty: string;
  readonly receiptEmptyCard: string;
  readonly yours: string;
  readonly dbCheck: string;
  readonly noRows: string;
  readonly stale: string;
  readonly changeBlank: string;
  readonly next: string;
  readonly nextTakeaways: string;
  readonly verdicts: Readonly<Record<Verdict, string>>;
  readonly parts: {
    readonly behavior: string;
    readonly gaps: string;
    readonly lock: string;
    readonly freshTicks: string;
    readonly right: string;
    readonly wrong: string;
    readonly open: string;
  };
  readonly live: string;
  readonly liveOpen: string;
  readonly liveCard: string;
  readonly liveCopied: string;
  readonly plausible: string;
  readonly recorded: string;
  readonly rowLabels: Readonly<Record<RowLabel, string>>;
  readonly dataLine: Readonly<Record<DefinitionRequestId, string>>;
  readonly figure: {
    readonly levels: string;
    readonly changes: string;
    readonly scaleNote: string;
    readonly months: Readonly<Record<"2026-03" | "2026-04" | "2026-05" | "2026-06", string>>;
    readonly stayed: string;
    readonly churned: string;
    readonly joined: string;
    readonly base: string;
    readonly departments: Readonly<Record<"engineering" | "sales" | "support" | "other", string>>;
    readonly attrition: string;
    readonly noCounts: string;
    readonly people: string;
    /** Key above each figure: solid is your definition, dashed the database check, outline for comparison. */
    readonly keyYours: string;
    readonly keyData: string;
    readonly keyContext: string;
    /** Prefix of the one pooled label of request 03. */
    readonly allSegments: string;
    readonly keyBase: string;
    /** The tower against June's level: "= 2,75 × Juni". */
    readonly times: string;
  };
  /** Hint under a legend whose group takes several ticks. */
  readonly multiHint: string;
  /** Screen-reader names of the receipt table's row column and of an empty cell. */
  readonly rowHeader: string;
  readonly noRow: string;
  readonly incompleteCard: { readonly behavior: string; readonly lock: string };
  readonly rules: Readonly<Record<RuleId, string>>;
  readonly triageRules: Readonly<Record<TriageRuleId, string>>;
  readonly askBack: {
    readonly kind: string;
    readonly grain: string;
    readonly grainAnd: string;
    readonly period: string;
    readonly periodAnd: string;
    readonly table: string;
    readonly tableAnd: string;
    readonly none: string;
  };
  readonly takeawaysH: string;
  readonly takeawaysIntro: string;
  readonly takeaways: readonly Takeaway[];
  readonly copy: string;
  readonly copied: string;
  readonly copyFailed: string;
  readonly closing: string;
  readonly provenance: string;
}

/** "32.380 €", "9,5 %", "3 Std.": a number never parts from its unit at a line break. */
export function bindUnits(text: string): string {
  return text.replace(/(\d) (?=€|%|Std\.|Stunden\b|h\b|hours?\b)/g, "$1\u00a0");
}

/** Every string of a copy tree with bindUnits applied; the tree stays the same shape. */
export function bindAll<T>(value: T): T {
  if (typeof value === "string") return bindUnits(value) as T;
  if (Array.isArray(value)) return value.map((item) => bindAll(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, bindAll(item)])) as T;
  }
  return value;
}

/** Replace {key} with the given values; unknown keys stay as they are. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** "A, B und C" / "A, B and C". */
export function joinList(items: readonly string[], copy: DemoText): string {
  if (items.length <= 1) return items.join("");
  const and = copy.and;
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

/** The ask-back of card C01, built from the ticked gaps (spec section 9). */
export function askBackSentence(gaps: ReadonlySet<Gap>, copy: DemoText): string {
  const text = copy.askBack;
  const parts: string[] = [];
  if (gaps.has("kind")) parts.push(text.kind);
  if (gaps.has("grain")) parts.push(parts.length > 0 ? text.grainAnd : text.grain);
  if (gaps.has("period")) parts.push(parts.length > 0 ? text.periodAnd : text.period);
  if (gaps.has("table")) parts.push(parts.length > 0 ? text.tableAnd : text.table);
  return parts.length > 0 ? parts.join(" ") : text.none;
}

/** The label of a table option: the view name for approved views. */
export function viewName(table: TableId, copy: DemoText): string | undefined {
  const views = copy.views as Readonly<Record<string, string>>;
  return views[table];
}

/** English terms inside the German copy, wrapped in <span lang="en"> by the renderer. */
export const ENGLISH_TERMS = [
  "Net New MRR",
  "permission denied",
  "Read-only SQL guard",
  "Course policy",
  "PostgreSQL role",
  "Guide",
  "Lifetime Value",
] as const;
