import type { Beat } from "@/lib/demo-beats";

const KIT = "data-readiness-kit/";

/**
 * The red line of "Die Fragekarte", the same in deck, kit and demo: Claude's
 * answer, the four readings of one correct file, then the five boxes of the
 * question card (box 1 and 2 together, 3, 4, 5), the visitor's own card and
 * the take-home. Each beat names the kit file it shows, as a path inside the
 * kit zip.
 */
export const BEATS: readonly Beat[] = [
  { id: "antwort", kind: "commit", seconds: 0.6, label: { de: "Antwort", en: "Answer" }, kitFile: `${KIT}builder/claude-demo/AI-RUN-LOG.md` },
  {
    id: "lesarten",
    kind: "reveal",
    seconds: 2.4,
    label: { de: "Lesarten", en: "Readings" },
    kitFile: `${KIT}builder/claude-demo/A-export-tables/monthly_revenue.csv`,
  },
  { id: "sicht", kind: "tool", seconds: 0, label: { de: "Frage und Sicht", en: "Question, view" }, kitFile: `${KIT}builder/claude/project/mrr_summary_monthly.csv` },
  {
    id: "wer-zaehlt",
    kind: "apply",
    seconds: 0,
    label: { de: "Wer zählt", en: "Who counts" },
    kitFile: `${KIT}builder/claude-demo/A-export-tables/customer_master.csv`,
  },
  { id: "grenze", kind: "apply", seconds: 0, label: { de: "Sperre", en: "Never show" }, kitFile: `${KIT}builder/claude/project/PROJECT-INSTRUCTIONS.txt` },
  { id: "test", kind: "apply", seconds: 0, label: { de: "Test", en: "Test" }, kitFile: `${KIT}builder/claude-demo/CHECK-YOUR-RESULT.md` },
  { id: "deine-karte", kind: "own", seconds: 0, label: { de: "Deine Karte", en: "Your card" }, kitFile: `${KIT}FRAGEKARTE.md` },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" }, kitFile: `${KIT}claude/README.md` },
];
