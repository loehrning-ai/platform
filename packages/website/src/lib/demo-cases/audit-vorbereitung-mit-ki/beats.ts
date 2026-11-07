/**
 * The W05 beats, the red line of deck, kit and demo, on the case "Four days": the thirteen questions of
 * the inspector's list (the visitor guesses), the clock from the notice to the visit, four tests on two
 * papers, the x-ray of the whole folder, an edit that cannot be hidden, the question what may go to a
 * tool, the visitor's own papers, and the files to do it tomorrow. Plain data, both languages,
 * importable from client code. The kit ships in two editions with different paths, so the beats name
 * no single kitFile.
 */

import type { Beat } from "@/lib/demo-beats";

export type BeatId = "ordner" | "uhr" | "pruefungen" | "roentgen" | "nachtrag" | "zuviel" | "ordner-eigen" | "mitnehmen";

/** The three lines the first beat asks the visitor to guess: one covered, one gap, one weak in the end. */
export const GUESS_LINES = ["L01", "L05", "L11"] as const;

/** How long the cards take to draw when the folder opens. */
export const DRAW_SECONDS = 0.9;
/** How long the scan runs over the 13 x 24 grid. */
export const SCAN_SECONDS = 2.4;

export const BEATS: readonly Beat[] = [
  {
    id: "ordner",
    kind: "commit",
    seconds: DRAW_SECONDS,
    label: { de: "Der Ordner", en: "The folder" },
    step: { de: "Du siehst dir die dreizehn Fragen an und schätzt drei davon.", en: "You look at the thirteen questions and guess three of them." },
  },
  {
    id: "uhr",
    kind: "reveal",
    seconds: 0,
    label: { de: "Die Uhr", en: "The clock" },
    step: { de: "Du zählst die Tage von der Mitteilung bis zum Besuch.", en: "You count the days from the notice to the visit." },
    nextName: { de: "die Uhr", en: "the clock" },
  },
  {
    id: "pruefungen",
    kind: "reveal",
    seconds: 0,
    label: { de: "Vier Prüfungen", en: "Four tests" },
    step: { de: "Du siehst vier Prüfungen an zwei Papieren.", en: "You see four tests on two papers." },
    nextName: { de: "die vier Prüfungen", en: "the four tests" },
  },
  {
    id: "roentgen",
    kind: "tool",
    seconds: SCAN_SECONDS,
    label: { de: "Röntgenbild", en: "X-ray" },
    step: { de: "Du wählst eine Frage und siehst, wen sie trifft.", en: "You pick a question and see whom it hits." },
    nextName: { de: "das Röntgenbild", en: "the x-ray" },
  },
  {
    id: "nachtrag",
    kind: "apply",
    seconds: 0,
    label: { de: "Nachtrag", en: "Late edit" },
    step: { de: "Du versuchst, ein Datum zu ändern, und schreibst dann ein neues Papier.", en: "You try to change a date and then write a new paper." },
    nextName: { de: "der Nachtrag", en: "the late edit" },
  },
  {
    id: "zuviel",
    kind: "apply",
    seconds: 0,
    label: { de: "Zu viel", en: "Too much" },
    step: { de: "Du wählst, welche Spalten an ein KI-Werkzeug gehen.", en: "You choose which columns go to an AI tool." },
    nextName: { de: "die Datenstufe", en: "the data level" },
  },
  {
    id: "ordner-eigen",
    kind: "own",
    seconds: 0,
    label: { de: "Eigener Ordner", en: "Your folder" },
    step: { de: "Du listest deine eigenen Papiere und wählst eine Prüfung je Papier.", en: "You list your own papers and pick a test for each." },
    nextName: { de: "dein Ordner", en: "your folder" },
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    step: { de: "Du nimmst Kit, Skill und das Briefing mit.", en: "You take the kit, the skill and the briefing with you." },
    nextName: { de: "Mitnehmen", en: "take home" },
  },
];

/** Minutes per scene; their sum is the demo's minutes in demos.ts. */
export const SCENE_MINUTES: Readonly<Record<BeatId, number>> = {
  ordner: 1,
  uhr: 1,
  pruefungen: 1,
  roentgen: 1.5,
  nachtrag: 1,
  zuviel: 1,
  "ordner-eigen": 1,
  mitnehmen: 0.5,
};
