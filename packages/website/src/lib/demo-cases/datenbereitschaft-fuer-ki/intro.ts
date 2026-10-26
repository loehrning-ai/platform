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
      "Beim Bau dieses Kurses hat Claude aus einer richtigen Exportdatei einer erfundenen Abo-Firma eine falsche Monatstabelle gebaut.",
      "Du ziehst selbst an der Datei und findest heraus, welche Zahl ihr fehlt.",
      "Danach füllst du die fünf Kästchen der Fragekarte aus und nimmst einen Skill, eine Projektanweisung und eine Prüfliste für deinen Claude mit.",
      "Der geführte Teil dauert etwa {minutes} Minuten.",
    ],
    start: "Mit Claudes Tabelle starten",
  },
  en: {
    title: "The question card",
    sentences: [
      "While we were building this course, Claude took a correct export file from an invented subscription company and built a wrong monthly table from it.",
      "You pull on the file yourself and find out which number it is missing.",
      "Then you fill in the five boxes of the question card and take home a skill, project instructions and a test list for your Claude.",
      "The guided part takes about {minutes} minutes.",
    ],
    start: "Start with Claude's table",
  },
};
