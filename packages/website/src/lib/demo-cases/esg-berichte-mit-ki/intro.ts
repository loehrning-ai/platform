import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8, W04 contract section 2) and
 * its shell. Every claim checked against the kit: the winery is invented, the
 * bank asks for the electricity use, the shelf card is claim 3 of
 * anfragen/2-werbeaussagen.md, and the own file never leaves the browser.
 */
export const SHELL: DemoShellVersion = "v4";

export const INTRO: DemoIntroData = {
  de: {
    title: "ESG-Antworten belegen",
    sentences: [
      "Ein erfundenes Weingut will „Zertifizierte Bio-Weinberge“ auf seine Regalkarten drucken und einer Bank seinen Stromverbrauch nennen.",
      "Du verbindest jede Antwort mit der Zeile, die sie belegt, und findest das fehlende Dokument.",
      "Am Ende prüfst du deine eigene Stromdatei und nimmst einen Skill für Claude mit.",
      "Das dauert etwa {minutes} Minuten, und nichts verlässt deinen Browser.",
    ],
    start: "Mit der Regalkarte starten",
  },
  en: {
    title: "Back your ESG answers",
    sentences: [
      "An invented winery wants “Certified organic vineyards” on its shelf cards and must report its electricity use to a bank.",
      "You link each answer to the line that backs it and find the missing document.",
      "At the end you check your own electricity file and take home a skill for Claude.",
      "It takes about {minutes} minutes, and nothing leaves your browser.",
    ],
    start: "Start with the shelf card",
  },
};
