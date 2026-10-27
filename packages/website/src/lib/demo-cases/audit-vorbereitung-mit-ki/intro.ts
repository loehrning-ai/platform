import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8) and its shell. Every claim
 * is checked against the kit: the case is invented, the request lists eight
 * items, the skill runs the same four checks; the shell's footnote says
 * that everything stays in the browser.
 */
export const SHELL: DemoShellVersion = "v4";

export const INTRO: DemoIntroData = {
  de: {
    title: "Audit-Nachweise prüfen",
    sentences: [
      "Ein Kunde will vor einem Audit acht Nachweise von einer erfundenen Firma sehen.",
      "Du prüfst mit vier Fragen, welche Datei im Ordner wirklich belegt, was verlangt ist.",
      "Du nimmst die Lücken, fertige Anfragen und einen Skill für Claude mit.",
      "Das dauert etwa {minutes} Minuten, und deine Dateien bleiben in deinem Browser.",
    ],
    start: "Ordner ansehen und schätzen",
  },
  en: {
    title: "Check audit evidence",
    sentences: [
      "Before an audit, a customer wants eight pieces of evidence from an invented company.",
      "You use four questions to check which file in the folder really proves what is asked.",
      "You take home the gaps, ready-made requests and a skill for Claude.",
      "It takes about {minutes} minutes, and your files stay in your browser.",
    ],
    start: "Look at the folder and guess",
  },
};
