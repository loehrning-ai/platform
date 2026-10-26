import type { Beat } from "@/lib/demo-beats";

/**
 * The red line of workshop 06, the same in deck, kit and demo, as rotfaden's demo.json orders it: a
 * guess on the goods price (commit), the full cost lines stacking in (reveal), the three lines of the
 * field card (tool), the paper index of offer C (apply), the visitor's own lines (own) and the
 * take-home. Plain data, both languages; config.test.ts holds ids, kinds and German labels equal to
 * demo.json, and every kitFile is a path in angebote-vergleichen-kit.zip.
 */
const KIT = "angebote-vergleichen-kit";

export const BEATS: readonly Beat[] = [
  { id: "tipp", kind: "commit", seconds: 0.8, label: { de: "Tipp", en: "Guess" }, kitFile: `${KIT}/kostenzeilen.csv` },
  { id: "kipp", kind: "reveal", seconds: 2.6, label: { de: "Kipp", en: "Turn" }, kitFile: `${KIT}/ANSWERS.md` },
  { id: "methode", kind: "tool", seconds: 0.8, label: { de: "Methode", en: "Method" }, kitFile: `${KIT}/karten/feldkarte.md` },
  { id: "papier", kind: "apply", seconds: 0.6, label: { de: "Papier", en: "Paper" }, kitFile: `${KIT}/fall/angebot-c-brno.md` },
  { id: "deins", kind: "own", seconds: 0, label: { de: "Deins", en: "Yours" }, kitFile: `${KIT}/fall/zweiter-fall.csv` },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" }, kitFile: `${KIT}/vorlagen/vergleichsbasis.md` },
];
