import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of "Die Fragekarte" (language-standard B.8) and its shell. Every
 * claim is in the kit: the rehearsal table is builder/claude-demo/AI-RUN-LOG.md,
 * the company is invented (README), the three take-homes are the files the
 * last beat hands over. "{minutes}" is filled from demos.ts.
 */
export const SHELL: DemoShellVersion = "v4";

export const INTRO: DemoIntroData = {
  de: {
    title: "Die Fragekarte",
    sentences: [
      "Beim Bau dieses Kurses hat Claude aus der richtigen Exportdatei einer erfundenen Abo-Firma eine falsche Monatstabelle gebaut.",
      "Du ziehst am Wasserstand der Datei, bis du siehst, welche Zahl ihr fehlt.",
      "Dann füllst du die Fragekarte aus und nimmst einen Skill, eine Projektanweisung und eine Prüfliste für deinen Claude mit.",
      "Der geführte Teil dauert etwa {minutes} Minuten.",
    ],
    start: "Mit Claudes Tabelle starten",
  },
  en: {
    title: "The question card",
    sentences: [
      "While building this course, Claude turned a correct export file from an invented subscription company into a wrong monthly table.",
      "You drag the file's water level until you see which number it is missing.",
      "Then you fill in the question card and take home a skill, project instructions and a test list.",
      "The guided part takes about {minutes} minutes.",
    ],
    start: "Start with Claude's table",
  },
};
