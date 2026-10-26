import type { Beat } from "@/lib/demo-beats";
import KIT_NAMES from "./kit-names.json";

const KIT = "data-readiness-kit/";

/**
 * The guided path names no next step ("Weiter" alone), so the dots, back and
 * next fit one row on a phone; each step sentence fits one line at 390px.
 *
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
    step: { de: "Du ziehst am Wasser und am Dateianfang.", en: "You drag the water and the file's start." },
  },
  {
    id: "sicht",
    kind: "tool",
    seconds: 0,
    label: { de: "Frage und Sicht", en: "Question, view" },
    kitFile: `${KIT}builder/claude/project/mrr_summary_monthly.csv`,
    step: { de: "Du baust die Frage und wählst die Tabelle.", en: "You build the question and pick the table." },
  },
  {
    id: "wer-zaehlt",
    kind: "apply",
    seconds: 0,
    label: { de: "Wer zählt", en: "Who counts" },
    kitFile: `${KIT}builder/claude-demo/A-export-tables/customer_master.csv`,
    step: { de: "Du prüfst, was man addiert und wer zählt.", en: "You test what adds up and who counts." },
  },
  {
    id: "projekt",
    kind: "apply",
    seconds: 0,
    label: { de: "Projekt", en: "Project" },
    kitFile: `${KIT}builder/claude/project/${KIT_NAMES.instructions}`,
    step: { de: "Du sortierst die Dateien und machst den Test.", en: "You sort the files and run the test." },
  },
  {
    id: "deine-karte",
    kind: "own",
    seconds: 0,
    label: { de: "Deine Karte", en: "Your card" },
    kitFile: `${KIT}${KIT_NAMES.cardDe}`,
    step: { de: "Du füllst die Karte für deine Zahl aus.", en: "You fill in the card for your own number." },
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    kitFile: `${KIT}claude/${KIT_NAMES.readme}`,
    step: { de: "Du nimmst Skill, Projekt und Prüfliste mit.", en: "You take the skill, the project and the test list." },
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
