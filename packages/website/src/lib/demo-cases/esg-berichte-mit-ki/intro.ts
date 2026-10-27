import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8): the real news first, then
 * the case (why the winery has to answer), what the visitor does, what they
 * take away and how long. Figures from the kit: 31 % of sales to Germany
 * (ordner/firmenprofil.md line 12), 8 + 7 + 6 = 21 answers. The two news items are the
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
    news: [
      "Seit dem 27. September 2026 verbietet deutsches Recht Werbung mit „klimaneutral“, wenn sie auf gekauften CO₂-Zertifikaten beruht.",
      "Im Dezember 2025 gab die Osteuropabank EBRD einer Bank in Skopje 8 Millionen Euro für grüne Kredite an kleine Firmen.",
    ],
    sentences: [
      "Ein erfundenes Weingut in Nordmazedonien macht fast ein Drittel seines Umsatzes in Deutschland und muss 21 Antworten für Importeur, Marketing und Bank belegen.",
      "Du spielst die fünf Prompts aus dem Workshop-Kit ab, also die fertigen Aufträge an Claude, liest Claudes aufgezeichnete Antworten und prüfst sie selbst.",
      "Am Ende nimmst du den Skill mit, eine Anleitung, mit der dein Claude jede Antwort genauso belegt.",
      "Das dauert etwa {minutes} Minuten.",
    ],
    start: "Mit dem Fragebogen starten",
    footnote: "Auf dieser Seite läuft keine KI. Claudes Antworten sind Aufzeichnungen vom 26.10.2026.",
  },
  en: {
    title: "Back ESG answers with Claude",
    news: [
      "Since 27 September 2026, German law has banned “climate neutral” claims that rest on bought carbon credits.",
      "In December 2025 the European development bank EBRD lent a bank in Skopje 8 million euros for green loans to small firms.",
    ],
    sentences: [
      "An invented North Macedonian winery makes almost a third of its sales in Germany and must back 21 answers for its importer, marketing and bank.",
      "You play the workshop kit's five prompts, the ready-made instructions for Claude, and check Claude's recorded answers yourself.",
      "At the end you take the skill, instructions that make your own Claude back every answer this way.",
      "It takes about {minutes} minutes.",
    ],
    start: "Start with the questionnaire",
    footnote: "No AI runs on this page. Claude's answers are recordings from 26 October 2026.",
  },
};
