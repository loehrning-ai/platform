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
    title: "ESG-Antworten mit Datei und Zeile belegen",
    sentences: [
      "Ein erfundenes Weingut soll einer Bank seinen Stromverbrauch nennen und will „Zertifizierte Bio-Weinberge“ auf seine Regalkarten drucken.",
      "Du verbindest jede Antwort mit ihrer Zeile und prüfst, ob die Zeile die ganze Zeit und alles deckt, wovon die Antwort spricht.",
      "Danach prüfst du deine eigene Stromdatei und nimmst die Prüfkarte und einen Skill mit, der Claude genauso prüfen lässt.",
      "Das dauert etwa {minutes} Minuten, und alles bleibt in deinem Browser.",
    ],
    start: "Mit der Regalkarte starten",
  },
  en: {
    title: "Back every ESG answer with a file and a line",
    sentences: [
      "An invented winery must report its electricity use to its bank and wants “Certified organic vineyards” on its shelf cards.",
      "You link each answer to the line meant to back it, then check that the line covers the whole period and everything claimed.",
      "Then you check your own electricity file and take home a check card and a Claude skill that works the same way.",
      "It takes about {minutes} minutes, and nothing leaves your browser.",
    ],
    start: "Start with the shelf card",
  },
};
