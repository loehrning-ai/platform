import type { Beat } from "@/lib/demo-beats";

/**
 * The red line of workshop 04, the same in deck, kit and demo: one sentence
 * and its file (commit), the probe (reveal), the Nachweisprobe card (tool),
 * three more sentences, the folder and the late invoice (apply, kit steps 1
 * to 5), the visitor's own sentences (own) and the take-home. Plain data,
 * both languages. The kit files differ per edition (ordner/ and files/), so
 * the beats name no single kitFile; the stage quotes both zips verbatim
 * (kit-lockstep.test.ts).
 */
export const BEATS: readonly Beat[] = [
  { id: "satz", kind: "commit", seconds: 0.9, label: { de: "Satz", en: "Sentence" } },
  { id: "probe", kind: "reveal", seconds: 3.6, label: { de: "Probe", en: "Check" } },
  { id: "regel", kind: "tool", seconds: 0.8, label: { de: "Regel", en: "Rule" } },
  { id: "drei-saetze", kind: "apply", seconds: 0.6, label: { de: "Drei Sätze", en: "Three more" } },
  { id: "ordner", kind: "apply", seconds: 0.6, label: { de: "Ordner", en: "Folder" } },
  { id: "rechnung", kind: "apply", seconds: 0.6, label: { de: "Rechnung", en: "Invoice" } },
  { id: "deine-saetze", kind: "own", seconds: 0, label: { de: "Deine Sätze", en: "Your sentences" } },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" } },
];
