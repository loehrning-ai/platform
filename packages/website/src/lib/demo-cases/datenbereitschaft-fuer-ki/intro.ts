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
      "Die Demo zeigt die Datei als Wanne mit Wasser, und du ziehst am Wasserstand, bis du siehst, welche Zahl der Datei fehlt.",
      "Danach füllst du die fünf Kästchen der Fragekarte aus und nimmst einen Skill, eine Projektanweisung und eine Prüfliste für deinen Claude mit.",
      "Der geführte Teil dauert etwa {minutes} Minuten.",
    ],
    start: "Mit Claudes Tabelle starten",
  },
  en: {
    title: "The question card",
    sentences: [
      "While building this course, Claude took a correct export file from an invented subscription company and built a wrong monthly table.",
      "The demo shows the file as a tub of water, and you drag the level until you see which number is missing.",
      "Then you fill in the question card's five boxes and take home a skill, project instructions and a test list for your Claude.",
      "The guided part takes about {minutes} minutes.",
    ],
    start: "Start with Claude's table",
  },
};
