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

/** What is wrong with a file for an item, in one short line; null when nothing is. */
export function defectOf(result: Evaluation, copy: W05Copy, locale: Loc): string | null {
  const { tests } = result;
  const first = result.failed[0];
  if (!first) {
    const hours = tests.quote.figures.hours;
    return hours !== undefined ? fill(copy.defect.hours, { hours: formatDecimal(hours, locale) }) : null;
  }
  if (first === "date") return fill(copy.defect.reviewDue, { date: formatShort(tests.date.used?.iso ?? "", locale) });
  if (first === "approval") return result.doc.meta.notReviewed ? copy.defect.notReviewed : copy.defect.approvalOpen;
  if (first === "scope") {
    const { missingSystems, coveredSystems, uncoveredDays, windowDays } = tests.scope;
    return missingSystems.length > 0
      ? fill(copy.defect.systems, { covered: coveredSystems.length, total: coveredSystems.length + missingSystems.length })
      : fill(copy.defect.days, { days: uncoveredDays, of: windowDays });
  }
  if (tests.quote.kind === "part") return fill(copy.defect.empty, { parts: tests.quote.missingParts.join(", ") });
  const { unique, staff } = tests.quote.figures;
  if (unique !== undefined && staff !== undefined) return fill(copy.defect.trained, { unique, staff });
  return tests.quote.quote ? `"${tests.quote.quote}"` : null;
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
