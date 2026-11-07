/**
 * The thirteen lines of the inspector's list as the kit writes them: id, article, question and the rule
 * sentence the check reads, parsed from the three checklist excerpts of the kit (English and German
 * edition), plus the short chip label and the folder files each line reads. The labels are the ones the
 * deck uses on its chips. Pure; kit.ts is the only input.
 */

import { FILE_NAMES, LINE_IDS, type LineId } from "./oracle";
import { kitText } from "./kit";

export type LinesLocale = "de" | "en";

export interface LineDef {
  readonly id: LineId;
  readonly label: string;
  readonly article: string;
  readonly question: string;
  /** The sentence the check reads. */
  readonly rule: string;
}

const LABELS: Readonly<Record<LineId, { readonly en: string; readonly de: string }>> = {
  L01: { en: "Contract", de: "Vertrag" },
  L02: { en: "Registration", de: "Anmeldung" },
  L03: { en: "Records", de: "Akten" },
  L04: { en: "Attendance", de: "Anwesenheit" },
  L05: { en: "Overtime cap", de: "Überstunden max." },
  L06: { en: "Overtime notice", de: "Überstundenmeldung" },
  L07: { en: "Overtime pay line", de: "Überstundenzeile" },
  L08: { en: "Pay date", de: "Zahltag" },
  L09: { en: "Leave", de: "Urlaub" },
  L10: { en: "Safety statement", de: "Sicherheitserklärung" },
  L11: { en: "Employee opinion", de: "Stellungnahme" },
  L12: { en: "Medical exams", de: "Untersuchungen" },
  L13: { en: "Training", de: "Unterweisung" },
};

const CHECKLISTS: Readonly<Record<LinesLocale, readonly string[]>> = {
  en: ["checklists/checklist_labour_excerpt.md", "checklists/checklist_safety_excerpt.md", "checklists/checklist_records_excerpt.md"],
  de: ["de/listen/pruefliste_arbeit_auszug.md", "de/listen/pruefliste_sicherheit_auszug.md", "de/listen/pruefliste_unterlagen_auszug.md"],
};

/** The folder files each line reads (keys of FILE_NAMES), the same reading the oracle does. */
export const LINE_FILES: Readonly<Record<LineId, readonly (keyof typeof FILE_NAMES)[]>> = {
  L01: ["contracts", "records"],
  L02: ["registration", "contracts"],
  L03: ["records"],
  L04: ["attendance", "absences"],
  L05: ["overtime"],
  L06: ["overtime", "notices"],
  L07: ["payLines", "overtime"],
  L08: ["runs"],
  L09: ["leave", "contracts"],
  L10: ["contracts", "statement"],
  L11: ["statement", "index"],
  L12: ["exams"],
  L13: ["training", "contracts"],
};

function parseRows(text: string): readonly (readonly string[])[] {
  return text
    .split("\n")
    .filter((line) => /^\| L\d\d \|/.test(line))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()));
}

const cache = new Map<LinesLocale, readonly LineDef[]>();

export function lineList(locale: LinesLocale): readonly LineDef[] {
  const hit = cache.get(locale);
  if (hit) return hit;
  const rows = new Map(CHECKLISTS[locale].flatMap((file) => parseRows(kitText(file))).map((cells) => [cells[0] as string, cells]));
  const list = LINE_IDS.map((id): LineDef => {
    const cells = rows.get(id);
    if (!cells || cells.length < 4) throw new Error(`kit: the checklists have no line ${id}`);
    return { id, label: LABELS[id][locale], article: cells[1] as string, question: cells[2] as string, rule: cells[3] as string };
  });
  cache.set(locale, list);
  return list;
}
