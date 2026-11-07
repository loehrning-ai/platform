import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8) and its shell. The case is invented: a small firm in
 * Bitola gets a letter from the labour inspectorate on a Monday and the visit comes four days later.
 * The news is the inspectorate's own annual report for 2025 (proposal version, April 2026), printed
 * with its label in the same line. The footnote says that no AI runs here and nothing leaves the tab.
 */
export const SHELL: DemoShellVersion = "v4";

/** The last beat draws the take-home in the stage, so the page shows no second block. */
export const TAKEHOME_IN_STAGE = true;

export const INTRO: DemoIntroData = {
  de: {
    title: "Vier Tage bis zur Kontrolle",
    news: [
      "Die Arbeits- und Sicherheitsinspektion führte 2025 insgesamt 26.484 Kontrollen durch (Jahresbericht 2025, Entwurfsfassung, April 2026).",
      "Mehr als die Hälfte waren außerordentlich, nach der Regel ohne Mitteilungsbrief.",
    ],
    sentences: [
      "Am Montagmorgen kommt im Büro einer kleinen Firma ein Brief an.",
      "Vier Tage später kommt der Arbeitsinspektor, und die erfundene Firma hat alle ihre Papiere an fünf Orten.",
      "Sieh dir die dreizehn Fragen an und rate, welche Papiere halten, dann zeigen die Prüfungen, wo du falsch lagst.",
      "Der ganze Durchgang dauert etwa {minutes} Minuten.",
    ],
    start: "Sieh dir den Ordner an",
    footnote: "Auf dieser Seite läuft keine KI. Die Firma ist erfunden, und deine Eingaben bleiben im Browser.",
  },
  en: {
    title: "Four days until the inspection",
    news: [
      "The labour and safety inspectorate made 26,484 inspections in 2025 (annual report 2025, proposal version, April 2026).",
      "More than half were extraordinary, by rule without a notice letter.",
    ],
    sentences: [
      "A letter reaches the office of a small firm on Monday morning.",
      "Four days later the labour inspector comes, and the invented firm keeps its papers in five places.",
      "Look at the thirteen questions and guess which papers hold up, then let the checks show where you were wrong.",
      "The whole run takes about {minutes} minutes.",
    ],
    start: "Look at the folder, then guess",
    footnote: "No AI runs on this page. The firm is invented, and what you type stays in your browser.",
  },
};
