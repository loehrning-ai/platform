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
    title: "ESG-Antworten mit Claude belegen",
    news: [
      "Seit dem 1. Januar 2026 verlangt Norwegens Vinmonopolet für Stillwein unter 250 NOK Flaschen bis 420 g, seit dem 27.09.2026 verbietet Deutschland „klimaneutral“ durch CO₂-Ausgleich.",
      "Im Dezember 2025 lieh die Osteuropabank EBRD einer Bank in Skopje bis zu 8 Millionen Euro für grüne Kredite an kleine und mittlere Firmen.",
    ],
    sentences: [
      "Im Oktober 2026 muss ein erfundenes Weingut in Nordmazedonien 21 Antworten belegen, und daran hängen 53 % des Umsatzes und ein Kredit.",
      "Du siehst fünf aufgezeichnete Läufe von Claude aus dem Workshop und prüfst jede Antwort selbst: Welche Antwort ist belegt, welches Dokument fehlt?",
      "Am Ende nimmst du den Skill mit, der deinem Claude dieselbe Prüfung beibringt.",
      "Das dauert etwa {minutes} Minuten.",
    ],
    start: "Mit dem Fragebogen starten",
    footnote: "Auf dieser Seite läuft keine KI. Claudes Antworten sind Aufzeichnungen vom 26.10.2026.",
  },
  en: {
    title: "Prove ESG answers with Claude",
    news: [
      "Since 1 January 2026 Norway's Vinmonopolet caps bottles of still wine under NOK 250 at 420 g; since 27.09.2026 Germany bans “climate neutral” via offsets.",
      "In December 2025 the development bank EBRD lent a bank in Skopje up to 8 million euros for green loans to small and medium-sized firms.",
    ],
    sentences: [
      "In October 2026 an invented North Macedonian winery must back 21 answers, and 53 % of its sales and a loan depend on them.",
      "You watch five recorded Claude runs and check each answer yourself: which one is covered, which document is missing?",
      "At the end you take the skill that teaches your Claude the same check.",
      "It takes about {minutes} minutes.",
    ],
    start: "Start with the questionnaire",
    footnote: "No AI runs on this page. Claude's answers are recordings from 26 October 2026.",
  },
};
