/**
 * Copy plus computed values: the one place a number from the engine meets a
 * word from the pack. Pure; the stage, the panels and the take-home texts
 * all format through here.
 */

import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatDecimal } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/counts";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import type { Evaluation } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";

export type Loc = "de" | "en";

/** A quote cut to the words after its label, for a card one line wide: "Restore test: not done in 2026." becomes "…not done in 2026.". */
export function quoteTail(quote: string): string {
  const colon = quote.lastIndexOf(": ");
  return colon > 0 && quote.length - colon > 8 ? `…${quote.slice(colon + 2)}` : quote;
}

/**
 * What is wrong with a file for an item, in one short line; null when nothing
 * is. `short` is for the link stage's file cards on a phone: column names
 * become words and a long quote keeps its answering tail.
 */
export function defectOf(result: Evaluation, copy: W05Copy, locale: Loc, short = false): string | null {
  const { tests } = result;
  const first = result.failed[0];
  if (!first) {
    const hours = tests.quote.figures.hours;
    return hours !== undefined ? fill(copy.defect.hours, { hours: formatDecimal(hours, locale) }) : null;
  }
  if (first === "date" && tests.date.uncoveredDays > 0) return fill(copy.defect.days, { days: tests.date.uncoveredDays, of: tests.scope.windowDays });
  if (first === "date") return fill(copy.defect.reviewDue, { date: formatShort(tests.date.used?.iso ?? "", locale) });
  if (first === "approval") return result.doc.meta.notReviewed ? copy.defect.notReviewed : copy.defect.approvalOpen;
  if (first === "scope") {
    const { missingSystems, coveredSystems } = tests.scope;
    return fill(copy.defect.systems, { covered: coveredSystems.length, total: coveredSystems.length + missingSystems.length });
  }
  if (tests.quote.kind === "part") {
    if (!short) return fill(copy.defect.empty, { parts: tests.quote.missingParts.join(", ") });
    const names: Readonly<Record<string, string>> = copy.defect.parts;
    return fill(copy.defect.emptyShort, { parts: tests.quote.missingParts.map((part) => names[part] ?? part).join(", ") });
  }
  const { unique, staff } = tests.quote.figures;
  if (unique !== undefined && staff !== undefined) return fill(copy.defect.trained, { unique, staff });
  if (!tests.quote.quote) return null;
  return `"${short ? quoteTail(tests.quote.quote) : tests.quote.quote}"`;
}

/** The date the file itself states, with its kind ("2026-09-02 freigegeben"). */
export function dateLine(result: Evaluation, copy: W05Copy): string {
  const fact = result.tests.date.used ?? result.doc.date;
  return fact ? `${fact.iso} ${copy.dateKind[fact.kind]}` : "";
}

export function statusWord(copy: W05Copy, status: Evaluation["status"]): string {
  return copy.status[status];
}

export function filesLabel(copy: W05Copy, n: number): string {
  return n === 1 ? copy.own.oneFile : fill(copy.own.manyFiles, { n });
}
