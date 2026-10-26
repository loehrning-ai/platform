/**
 * The W05 beats (the red line of deck, kit and demo): estimate, the four
 * tests run over the name links, the tool, R7, R5, all eight, the own
 * folder, the take-home. Plain data, both languages, importable from client code.
 * The kit ships in two editions (vardar-audit-kit, vardar-audit-kit-de) with
 * different paths, so the beats name no single kitFile; the stage names the
 * files in the page's language (DEMO_TAKEHOME).
 */

import type { Beat } from "@/lib/demo-beats";

/** The reality run: four passes over eight links, then the tally. */
export const RUN_SECONDS = 6.4;
export const R7_SECONDS = 2.4;
export const R5_SECONDS = 5;

export const BEATS: readonly Beat[] = [
  { id: "schaetzen", kind: "commit", seconds: 1.2, label: { de: "Schätzen", en: "Estimate" } },
  { id: "pruefen", kind: "reveal", seconds: RUN_SECONDS, label: { de: "Prüfen", en: "Test" } },
  { id: "regeln", kind: "tool", seconds: 0.8, label: { de: "Vier Prüfungen", en: "Four tests" } },
  { id: "r7", kind: "apply", seconds: R7_SECONDS, label: { de: "R7 selbst", en: "R7 yourself" } },
  { id: "r5", kind: "apply", seconds: R5_SECONDS, label: { de: "Zählen", en: "Count" } },
  { id: "alle-acht", kind: "apply", seconds: 0.6, label: { de: "Alle acht", en: "All eight" } },
  { id: "ordner", kind: "own", seconds: 0, label: { de: "Dein Ordner", en: "Your folder" } },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" } },
];
