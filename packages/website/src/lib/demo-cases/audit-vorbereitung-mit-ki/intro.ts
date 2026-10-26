import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8) and its shell. Owned by this
 * demo's builder: switch SHELL to "v4" when the demo runs on the Glas shell.
 * The sentences are drafts from the language standard; check every claim
 * against the kit before shipping v4.
 */
export const SHELL: DemoShellVersion = "v3";

export const INTRO: DemoIntroData = {
  de: {
    title: "Prüfen, welche Datei wirklich belegt",
    sentences: [
      "Ein Kunde schickt einer erfundenen Firma acht Fragen vor einem Audit, und im Ordner liegen elf Dateien.",
      "Du prüfst, welche Datei wirklich belegt, was gefragt ist, und welche nur so heißt.",
      "Am Ende hast du eine Lückenliste mit Anfragen und einen Skill, der ohne wörtliches Zitat nichts als belegt zählt.",
      "Das dauert etwa {minutes} Minuten, und alles bleibt in deinem Browser.",
    ],
    start: "Mit der ersten Frage starten",
  },
  en: {
    title: "Check which file really proves it",
    sentences: [
      "A customer sends an invented company eight questions before an audit, and the folder holds eleven files.",
      "You check which file really proves what is asked and which one only has the right name.",
      "At the end you have a gap list with requests and a skill that counts nothing as proven without a word-for-word quote.",
      "It takes about {minutes} minutes, and everything stays in your browser.",
    ],
    start: "Start with the first question",
  },
};
