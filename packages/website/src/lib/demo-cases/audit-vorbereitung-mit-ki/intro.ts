import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8) and its shell. The news is
 * the deck's real case (slide 03 and its sources in appendix A3: AP,
 * 7 Oct 2025, and Senate Estimates for the refund). Every other claim is
 * checked against the kit: the case is invented, the request lists eight
 * items with its dates, the draft reply has four sentences, the skill runs
 * the same four checks; the last sentence says everything stays in the
 * browser.
 */
export const SHELL: DemoShellVersion = "v4";

/** Scene 5 draws the Claude window and scene 6 the take-home in the stage, so the page shows neither again. */
export const TAKEHOME_IN_STAGE = true;

export const INTRO: DemoIntroData = {
  de: {
    title: "Acht Nachweise vor dem Audit",
    news: [
      "Im Oktober 2025 zahlte Deloitte dem australischen Arbeitsministerium 97.587 A$ von rund 440.000 A$ zurück, weil ein Bericht Quellen zitierte, die es nicht gab.",
    ],
    sentences: [
      "Vardar Works, eine erfundene Firma in Skopje, verarbeitet Kundendaten für Tannwald und soll bis 25. November acht Nachweise zur Datensicherheit liefern.",
      "Das Audit ist am 10. Dezember: Reichen die Dateien im Ordner für die Zusagen des Geschäftsführers?",
      "Im Workshop bediene ich Claude live, ihr schätzt und prüft; hier vergleichst du Aufzeichnungen mit den Originaldateien.",
      "In {minutes} Minuten prüfst du Zitat, Zeitraum, Umfang und Freigabe und nimmst das Kit für zu Hause mit.",
    ],
    start: "Ordner ansehen und schätzen",
    footnote: "Auf dieser Seite läuft keine KI. Claudes Antworten sind Aufzeichnungen; eigene Dateien bleiben im Browser.",
  },
  en: {
    title: "Eight pieces of evidence before the audit",
    news: ["In October 2025 Deloitte refunded A$97,587 of about A$440,000 to the Australian employment department, because a report cited sources that did not exist."],
    sentences: [
      "Vardar Works, an invented firm in Skopje, processes data for Tannwald and must provide eight security documents by 25 November.",
      "The audit is on 10 December: do those files support the managing director's promises?",
      "In the workshop I run Claude live; you predict and check, while this page shows recordings beside the source files.",
      "In {minutes} minutes you check quote, period, scope and approval and take the kit home.",
    ],
    start: "Look at the folder and guess",
    footnote: "No AI runs on this page. Claude's answers are recordings; your files stay in your browser.",
  },
};
