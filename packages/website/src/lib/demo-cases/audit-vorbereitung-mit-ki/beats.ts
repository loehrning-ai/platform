/**
 * The W05 beats (the red line of deck, kit and demo): estimate, the four
 * tests run over the name links, the tool, R7, R5, all eight, the own
 * folder, the take-home. Plain data, both languages, importable from client code.
 */

import type { Beat } from "@/lib/demo-beats";

/** The reality run: four passes over eight links, then the tally. */
export const RUN_SECONDS = 6.4;
export const R7_SECONDS = 2.4;
export const R5_SECONDS = 5;

export const BEATS: readonly Beat[] = [
  { id: "schaetzen", kind: "commit", seconds: 1.2, label: { de: "Schätzen", en: "Estimate" }, kitFile: "vardar-audit-kit/request_tannwald.md" },
  { id: "pruefen", kind: "reveal", seconds: RUN_SECONDS, label: { de: "Prüfen", en: "Test" }, kitFile: "vardar-audit-kit/ANSWERS.md" },
  { id: "regeln", kind: "tool", seconds: 0.8, label: { de: "Vier Prüfungen", en: "Four tests" }, kitFile: "vardar-audit-kit/project-instructions.md" },
  { id: "r7", kind: "apply", seconds: R7_SECONDS, label: { de: "R7 selbst", en: "R7 yourself" }, kitFile: "vardar-audit-kit/folder/backup-report_2026-10.txt" },
  { id: "r5", kind: "apply", seconds: R5_SECONDS, label: { de: "Zählen", en: "Count" }, kitFile: "vardar-audit-kit/folder/training-records_2026.csv" },
  { id: "alle-acht", kind: "apply", seconds: 0.6, label: { de: "Alle acht", en: "All eight" }, kitFile: "vardar-audit-kit/ANSWERS.md" },
  { id: "ordner", kind: "own", seconds: 0, label: { de: "Dein Ordner", en: "Your folder" } },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" }, kitFile: "vardar-audit-kit/START-HERE.md" },
];
