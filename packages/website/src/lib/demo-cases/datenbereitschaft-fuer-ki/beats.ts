import type { Beat } from "@/lib/demo-beats";
import KIT_NAMES from "./kit-names.json";

const KIT = "data-readiness-kit/";

/**
 * The red line of "Die Fragekarte", the same in deck, kit and demo: Claude's
 * answer, the tub that shows what the file cannot know, then the five boxes
 * of the question card (1 and 2 together, 3, then 4 and 5 in the project),
 * the visitor's own card and the take-home. Each beat names the kit file it
 * shows, as a path inside the kit zip.
 */
export const BEATS: readonly Beat[] = [
  {
    id: "antwort",
    kind: "commit",
    seconds: 0.6,
    label: { de: "Antwort", en: "Answer" },
    kitFile: `${KIT}builder/claude-demo/AI-RUN-LOG.md`,
    step: { de: "Du entscheidest, wohin Claudes Tabelle geht.", en: "You decide where Claude's table goes." },
  },
  {
    id: "wanne",
    kind: "reveal",
    seconds: 0,
    label: { de: "Wanne", en: "Tub" },
    kitFile: `${KIT}builder/claude-demo/A-export-tables/monthly_revenue.csv`,
    step: { de: "Du ziehst am Wasser und am Anfang der Datei.", en: "You pull the water and the start of the file." },
    nextName: { de: "die Wanne", en: "the tub" },
  },
  {
    id: "sicht",
    kind: "tool",
    seconds: 0,
    label: { de: "Frage und Sicht", en: "Question, view" },
    kitFile: `${KIT}builder/claude/project/mrr_summary_monthly.csv`,
    step: { de: "Du baust die Frage und wählst die Tabelle.", en: "You build the question and pick the table." },
    nextName: { de: "Frage und Sicht", en: "question and view" },
  },
  {
    id: "wer-zaehlt",
    kind: "apply",
    seconds: 0,
    label: { de: "Wer zählt", en: "Who counts" },
    kitFile: `${KIT}builder/claude-demo/A-export-tables/customer_master.csv`,
    step: { de: "Du gießt Monate zusammen und schreibst die Zählregel.", en: "You pour months together and write the counting rule." },
    nextName: { de: "wer zählt", en: "who counts" },
  },
  {
    id: "projekt",
    kind: "apply",
    seconds: 0,
    label: { de: "Projekt", en: "Project" },
    kitFile: `${KIT}builder/claude/project/${KIT_NAMES.instructions}`,
    step: { de: "Du sortierst die Dateien und machst den Test.", en: "You sort the files and run the test." },
    nextName: { de: "das Projekt", en: "the project" },
  },
  {
    id: "deine-karte",
    kind: "own",
    seconds: 0,
    label: { de: "Deine Karte", en: "Your card" },
    kitFile: `${KIT}${KIT_NAMES.cardDe}`,
    step: { de: "Du füllst die Karte für eine eigene Zahl aus.", en: "You fill in the card for a number of your own." },
    nextName: { de: "deine Karte", en: "your card" },
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    kitFile: `${KIT}claude/${KIT_NAMES.readme}`,
    step: { de: "Du nimmst Skill, Projekt und Prüfliste mit.", en: "You take the skill, the project and the test list." },
    nextName: { de: "Mitnehmen", en: "take home" },
  },
];

export type BeatId = "antwort" | "wanne" | "sicht" | "wer-zaehlt" | "projekt" | "deine-karte" | "mitnehmen";

/** Where an old v3 link of the kit lands: the beat and the inner move (1 or 2). */
export interface BeatTarget {
  readonly id: BeatId;
  readonly move: 1 | 2;
}

/**
 * The v3 ids the kit still links to (FRAGEKARTE.md, QUESTION-CARD.md, both
 * vorlagen, the readiness-lab.html redirect). They stay valid, so no kit file
 * has to change. "sicht" and "wer-zaehlt" kept their ids.
 */
export const BEAT_ALIASES: Readonly<Record<string, BeatTarget>> = {
  lesarten: { id: "wanne", move: 1 },
  grenze: { id: "projekt", move: 1 },
  test: { id: "projekt", move: 2 },
};

/** The beat a ?beat= value opens through an alias, or null when the shell reads it itself. */
export function aliasTarget(value: string | null): (BeatTarget & { readonly index: number }) | null {
  if (value === null) return null;
  const target = BEAT_ALIASES[value];
  if (!target) return null;
  const index = BEATS.findIndex((beat) => beat.id === target.id);
  return index < 0 ? null : { ...target, index };
}
