import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8): the real news first, then
 * the case's question and what the visitor does. The two news items are the
 * deck's slide "Echte Meldungen" (IHK Schwerin on the UWG amendment of
 * 12.02.2026, in force since 27.09.2026; EBRD press release of 18.12.2025,
 * EUR 8 million to Sparkasse Bank Skopje for green SME loans). The winery is
 * invented. The page runs no AI: Claude's answers are recordings.
 */
export const SHELL: DemoShellVersion = "v4";

/** The demo draws its take-home and the Claude app inside the stage. */
export const TAKEHOME_IN_STAGE = true;

export const INTRO: DemoIntroData = {
  de: {
    title: "ESG-Antworten mit Claude belegen",
    sentences: [
      "Seit dem 27.09.2026 verbietet deutsches Recht Werbung mit „klimaneutral“, die auf gekauften CO₂-Zertifikaten beruht.",
      "Im Dezember 2025 lieh die EBRD einer Bank in Skopje 8 Millionen Euro für grüne Kredite an kleine Firmen.",
      "Ein erfundenes Weingut dort fragt: Welche Antworten belegen unsere Dateien, welches Dokument fehlt?",
      "Du schickst die fünf Prompts aus dem Kit an Claude und prüfst jede Antwort, in etwa {minutes} Minuten.",
    ],
    start: "Mit dem Fragebogen starten",
  },
  en: {
    title: "Back ESG answers with Claude",
    sentences: [
      "Since 27.09.2026 German law bans “climate neutral” claims that rest on bought carbon credits.",
      "In December 2025 the EBRD lent a bank in Skopje 8 million euros for green loans to small firms.",
      "So an invented winery there asks: which answers do our files prove, which document is missing?",
      "You send the kit's five prompts to Claude and check each answer, in about {minutes} minutes.",
    ],
    start: "Start with the questionnaire",
  },
};
