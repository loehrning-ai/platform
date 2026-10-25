/**
 * The eight beats of "Eine Datei, drei Antworten": each is one kit step and
 * names the kit file it acts on (a path inside both kit zips, checked by
 * demo-contract.test.ts). Plain data in both languages, safe for the browser.
 */
import type { Beat } from "@/lib/demo-beats";

const KIT = "northwind-analyst-kit";

export const BEATS: readonly Beat[] = [
  { id: "frage", kind: "commit", seconds: 0.6, label: { de: "Frage", en: "Question" }, kitFile: `${KIT}/reports/2023-09-monthly-report.md` },
  { id: "drei-zaehlweisen", kind: "reveal", seconds: 3, label: { de: "Drei Zählweisen", en: "Three counts" }, kitFile: `${KIT}/data/ncr_records.csv` },
  { id: "zaehler-waehlen", kind: "tool", seconds: 0.4, label: { de: "Zähler", en: "Numerator" }, kitFile: `${KIT}/metric-cards.md` },
  { id: "zeitraum", kind: "apply", seconds: 1, label: { de: "Zeitraum", en: "Period" }, kitFile: `${KIT}/data/demand_actuals.csv` },
  { id: "zahl-pruefen", kind: "apply", seconds: 0.4, label: { de: "Prüfen", en: "Trace" }, kitFile: `${KIT}/data/product_lines.csv` },
  { id: "entscheiden", kind: "apply", seconds: 1, label: { de: "Entscheiden", en: "Decide" }, kitFile: `${KIT}/dashboard/index.html` },
  { id: "deine-kennzahl", kind: "own", seconds: 0, label: { de: "Deine Kennzahl", en: "Your metric" }, kitFile: `${KIT}/kennzahlen-steckbrief/SKILL.md` },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" }, kitFile: `${KIT}/project-instructions.md` },
];

export type BeatId =
  | "frage"
  | "drei-zaehlweisen"
  | "zaehler-waehlen"
  | "zeitraum"
  | "zahl-pruefen"
  | "entscheiden"
  | "deine-kennzahl"
  | "mitnehmen";
