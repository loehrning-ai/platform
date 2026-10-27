import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro card of "Eine Datei, drei Antworten" (language-standard B.8) and
 * its shell. Every claim is checked against the kit: the report is invented,
 * the records are counted three ways (scene 2), one figure is traced to its
 * rows (scene 5), and the own card goes home as a skill and a template.
 */
export const SHELL: DemoShellVersion = "v4";

export const INTRO: DemoIntroData = {
  de: {
    title: "Eine Datei, drei Antworten",
    sentences: [
      "Ein erfundener Bericht sagt, eine Küchenlinie sei im September besser geworden.",
      "Du zählst die Fehler dahinter auf drei Arten und prüfst eine Zahl nach.",
      "Dann legst du in einem Steckbrief fest, was eine Kennzahl zählt, und nimmst ihn als Skill mit.",
      "Der geführte Teil dauert etwa {minutes} Minuten, und nichts verlässt deinen Browser.",
    ],
    start: "Mit der Schätzung starten",
  },
  en: {
    title: "One file, three answers",
    sentences: [
      "An invented report claims that a kitchen line's quality got better in September.",
      "You count the defect records behind it in three ways and trace one figure down to its rows.",
      "Then you write a metric card that fixes what a metric counts, and take it home as a skill for Claude.",
      "The guided part takes about {minutes} minutes, and nothing leaves your browser.",
    ],
    start: "Start with your guess",
  },
};
