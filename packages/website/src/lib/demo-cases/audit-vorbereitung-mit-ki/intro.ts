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
    title: "Welche Anforderung ist belegt?",
    news: [
      "Im Oktober 2025 zahlte Deloitte dem australischen Arbeitsministerium 97.587 A$ von rund 440.000 A$ zurück, weil ein Bericht Quellen zitierte, die es nicht gab.",
    ],
    sentences: [
      "Die erfundene Firma Vardar Works in Skopje soll ihrem Kunden Tannwald bis 25. November acht Nachweise schicken, das Audit ist am 10. Dezember.",
      "Du prüfst mit vier Fragen, welche Datei im Ordner wirklich belegt, was verlangt ist, und welcher Satz im Antwortentwurf des Geschäftsführers hält.",
      "Du nimmst die Lückenliste, fertige Anfragen und einen Skill für Claude mit.",
      "Das dauert etwa {minutes} Minuten, und deine Dateien bleiben in deinem Browser.",
    ],
    start: "Ordner ansehen und schätzen",
  },
  en: {
    title: "Which request is covered?",
    news: ["In October 2025 Deloitte refunded A$97,587 of about A$440,000 to the Australian employment department, because a report cited sources that did not exist."],
    sentences: [
      "The invented firm Vardar Works in Skopje owes its customer Tannwald eight pieces of evidence by 25 November, before the audit on 10 December.",
      "You check with four questions which file really proves what is asked, and which sentence of the managing director's draft holds.",
      "You take home the gap list, ready-made requests and a skill for Claude.",
      "It takes about {minutes} minutes, and your files stay in your browser.",
    ],
    start: "Look at the folder and guess",
  },
};
