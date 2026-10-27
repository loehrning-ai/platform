/**
 * Copy plus computed values: the one place a number from the engine meets a
 * word from the pack. Numbers up to twelve become words, dates are written
 * out in the page's language, and every failing test gets its sentence.
 * Pure; the stage, the sheets and the take-home texts all format through here.
 */

import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatDecimal } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/counts";
import { formatLongDe, formatLongEn } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import type { Evaluation, TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";

export type Loc = "de" | "en";

export interface Fmt {
  readonly copy: W05Copy;
  readonly locale: Loc;
  readonly t: (template: string, values?: Readonly<Record<string, string | number>>) => string;
  readonly ts: (templates: readonly string[], values?: Readonly<Record<string, string | number>>) => string[];
  /** A count as a word up to twelve ("drei", "three"), else digits. */
  readonly word: (n: number) => string;
  /** The same, with a capital first letter, to open a sentence. */
  readonly Word: (n: number) => string;
  readonly date: (iso: string) => string;
  readonly decimal: (value: number) => string;
}

const upper = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function formatter(copy: W05Copy): Fmt {
  const locale = copy.locale as Loc;
  const t = (template: string, values: Readonly<Record<string, string | number>> = {}) => fill(template, values);
  const word = (n: number) => (Number.isInteger(n) && n >= 0 && n < copy.numbers.length ? (copy.numbers[n] as string) : String(n));
  return {
    copy,
    locale,
    t,
    ts: (templates, values = {}) => templates.map((template) => t(template, values)),
    word,
    Word: (n) => upper(word(n)),
    date: (iso) => (iso ? (locale === "de" ? formatLongDe(iso) : formatLongEn(iso)) : ""),
    decimal: (value) => formatDecimal(value, locale),
  };
}

/** Why a test fails for an evaluation, or what it found when it holds, as one or two sentences. */
export function testSentence(fmt: Fmt, result: Evaluation, test: TestId, noticeHours: number): string {
  const { copy } = fmt;
  const { tests } = result;
  const failed = result.failed.includes(test);
  if (!failed) {
    if (test === "quote" && tests.quote.figures.hours !== undefined) {
      return `${copy.sheet.pass.quote} ${fmt.t(copy.sheet.notice, { hours: fmt.decimal(tests.quote.figures.hours), allowed: noticeHours })}`;
    }
    if (test === "quote" && result.item.check === "storage") return `${copy.sheet.pass.quote} ${copy.sheet.storage}`;
    return copy.sheet.pass[test];
  }
  if (test === "quote") {
    const { kind, missingParts, figures } = tests.quote;
    if (kind === "part") {
      const names: Readonly<Record<string, string>> = copy.sheet.partNames;
      return fmt.t(copy.sheet.fail.part, { parts: missingParts.map((part) => names[part] ?? part).join(fmt.locale === "de" ? " und " : " and ") });
    }
    if (kind === "intent") return copy.sheet.fail.intent;
    if (kind === "notMet" && figures.unique !== undefined && figures.staff !== undefined) {
      return fmt.t(copy.checks.trained, { unique: figures.unique, staff: figures.staff });
    }
    if (kind === "notMet") return copy.sheet.fail.notMet;
    return copy.sheet.fail.none;
  }
  if (test === "date") {
    const { date, scope } = tests;
    if (date.uncoveredDays > 0) return fmt.t(copy.sheet.fail.days, { date: fmt.date(scope.validFrom ?? ""), days: date.uncoveredDays, of: scope.windowDays });
    const parts: string[] = [];
    if (date.used && date.daysShort !== null) parts.push(fmt.t(copy.sheet.fail.old, { date: fmt.date(date.used.iso), days: date.daysShort }));
    if (date.reviewDue) parts.push(fmt.t(copy.sheet.fail.review, { date: monthOf(fmt, date.reviewDue.iso) }));
    return parts.join(" ") || copy.sheet.fail.none;
  }
  if (test === "scope") {
    const { coveredSystems, missingSystems } = tests.scope;
    return fmt.t(copy.sheet.fail.scope, {
      covered: coveredSystems.length,
      total: coveredSystems.length + missingSystems.length,
      missing: missingSystems.join(", "),
    });
  }
  const { fail } = tests.approval;
  if (fail === "draft" || fail === "open") return copy.sheet.fail.draft;
  if (fail === "notReviewed") return copy.sheet.fail.notReviewed;
  return copy.sheet.fail.noApprover;
}

/** "März 2025" / "March 2025" for a month-only date such as a stated next review. */
function monthOf(fmt: Fmt, iso: string): string {
  const long = fmt.date(iso);
  return long.replace(/^\d+\.?\s+/, "");
}

/** Status word for the page ("Lücke", "Gap"). */
export function statusWord(fmt: Fmt, status: Evaluation["status"]): string {
  return fmt.copy.status[status];
}
