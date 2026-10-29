import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8): the real news first, then
 * the case in the deck's words (slide "Im Oktober kommen drei Anfragen":
 * October 2026, 8 + 7 + 6 = 21 answers, 22 % + 31 % = 53 % of
 * sales, ordner/firmenprofil.md line 12, and the solar loan), the deck's
 * question, what the visitor does, what they take away and how long. The two
 * news sentences are the deck's slide "Warum jetzt": Vinmonopolet's weight rule for suppliers
 * (since 01.01.2026) together with the UWG ban on offset-based climate claims (since
 * 27.09.2026) and the EBRD loan of up to EUR 8 million to Sparkasse Bank Skopje
 * for green SME loans (press release of 18.12.2025). The winery is invented.
 * The page runs no AI: Claude's answers are recordings.
 */
export const SHELL: DemoShellVersion = "v4";

/** The demo draws its take-home and the Claude app inside the stage. */
export const TAKEHOME_IN_STAGE = true;

export const INTRO: DemoIntroData = {
  de: {
    title: "Drei Anfragen an ein Weingut",
    news: [
      "Seit dem 1. Januar 2026 verlangt Norwegens Vinmonopolet für Stillwein unter 250 NOK Flaschen bis 420 g, seit dem 27.09.2026 verbietet Deutschland „klimaneutral“ durch CO₂-Ausgleich.",
      "Im Dezember 2025 lieh die Osteuropabank EBRD einer Bank in Skopje bis zu 8 Millionen Euro für grüne Kredite an kleine und mittlere Firmen.",
    ],
    sentences: [
      "Oktober 2026: Crvena Zemja, ein erfundenes Weingut in Nordmazedonien, bekommt drei Anfragen zu Umwelt, Sozialem und Unternehmensführung (ESG).",
      "Importeur, Marketing und Bank wollen 21 Antworten mit Belegen; 53 % des Umsatzes und ein Solarkredit stehen auf dem Spiel.",
      "Im Workshop bediene ich Claude live, ihr schätzt vorher und prüft nachher; hier laufen aufgezeichnete Antworten.",
      "In {minutes} Minuten klärst du, welche Antwort belegt ist und welches Dokument fehlt; das Kit nimmst du für zu Hause mit.",
    ],
    start: "Mit dem Fragebogen starten",
    footnote: "Auf dieser Seite läuft keine KI. Claudes Antworten sind Aufzeichnungen vom 26.10.2026.",
  },
  en: {
    title: "Three requests reach a winery",
    news: [
      "Since 1 January 2026 Norway's Vinmonopolet caps bottles of still wine under NOK 250 at 420 g; since 27.09.2026 Germany bans “climate neutral” via offsets.",
      "In December 2025 the development bank EBRD lent a bank in Skopje up to 8 million euros for green loans to small and medium-sized firms.",
    ],
    sentences: [
      "In October 2026 Crvena Zemja, an invented North Macedonian winery, receives three ESG requests about environment, people and governance.",
      "An importer, marketing and a bank need evidence for 21 answers; 53 % of sales and a solar loan are at stake.",
      "In the workshop I run Claude live; you predict first and check afterwards.",
      "Here you check recordings for {minutes} minutes: which answers hold, which documents are missing? Take the kit home.",
    ],
    start: "Start with the questionnaire",
    footnote: "No AI runs on this page. Claude's answers are recordings from 26 October 2026.",
  },
};
