/**
 * The W05 beats, the red line of deck, kit and demo: a folder that looks
 * complete, four tests that take it apart, one file read closely (the
 * restore test), the visitor's own folder, Claude doing the same four tests,
 * and the files to do it tomorrow. Plain data, both languages, importable
 * from client code. The kit ships in two editions with different paths, so
 * the beats name no single kitFile.
 */

import type { Beat } from "@/lib/demo-beats";

export type BeatId = "ordner" | "pruefungen" | "r7" | "ordner-eigen" | "claude" | "mitnehmen";

/** How long the link lines take to draw when the folder opens. */
export const DRAW_SECONDS = 0.9;

export const BEATS: readonly Beat[] = [
  {
    id: "ordner",
    kind: "commit",
    seconds: DRAW_SECONDS,
    label: { de: "Ordner", en: "Folder" },
    step: { de: "Du siehst dir den Ordner an und schätzt.", en: "You look at the folder and make a guess." },
  },
  {
    id: "pruefungen",
    kind: "reveal",
    seconds: 0,
    label: { de: "Vier Prüfungen", en: "Four tests" },
    step: { de: "Du schaltest die vier Prüfungen ein.", en: "You switch on the four tests." },
    nextName: { de: "die vier Prüfungen", en: "the four tests" },
  },
  {
    id: "r7",
    kind: "tool",
    seconds: 0,
    label: { de: "Restore-Test", en: "Restore test" },
    step: { de: "Du prüfst drei Dateien für R7.", en: "You check three files for R7." },
    nextName: { de: "der Wiederherstellungstest", en: "the restore test" },
  },
  {
    id: "ordner-eigen",
    kind: "own",
    seconds: 0,
    label: { de: "Dein Ordner", en: "Your folder" },
    step: { de: "Du prüfst deinen eigenen Ordner.", en: "You check your own folder." },
    nextName: { de: "dein Ordner", en: "your folder" },
  },
  {
    id: "claude",
    kind: "apply",
    seconds: 0,
    label: { de: "In deinem Claude", en: "In your Claude" },
    step: { de: "Du prüfst Claudes Zitate.", en: "You check Claude's quotes." },
    nextName: { de: "dein Claude", en: "your Claude" },
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    step: { de: "Du nimmst die Lücken und Vorlagen mit.", en: "You take the gaps and the templates with you." },
    nextName: { de: "Mitnehmen", en: "take home" },
  },
];

/** Minutes per scene; their sum is the demo's minutes in demos.ts (kit.test.ts). */
export const SCENE_MINUTES: Readonly<Record<BeatId, number>> = {
  ordner: 1,
  pruefungen: 2,
  r7: 2,
  "ordner-eigen": 1,
  claude: 1.5,
  mitnehmen: 0.5,
};
