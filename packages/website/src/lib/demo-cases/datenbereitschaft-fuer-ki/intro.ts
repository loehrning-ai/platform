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
    title: "Fünf Fragen, bevor eine Zahl in den Bericht geht",
    sentences: [
      "In einem erfundenen Fall bekommt Claude eine richtige Datei und baut daraus eine falsche Tabelle.",
      "Du findest heraus, warum, und lernst fünf Fragen, die diesen Fehler abfangen, bevor die Zahl im Monatsbericht landet.",
      "Am Ende füllst du diese fünf Felder für eine eigene Kennzahl aus und bekommst einen Skill, eine Projektanweisung und eine Prüfliste.",
      "Das dauert etwa {minutes} Minuten, und alles bleibt in deinem Browser.",
    ],
    start: "Mit der Datei starten",
  },
  en: {
    title: "Five questions before a number goes into the report",
    sentences: [
      "In an invented case, Claude gets a correct file and builds a wrong table from it.",
      "You find out why, and learn five questions that catch this mistake before the number lands in the monthly report.",
      "At the end you fill in these five fields for a figure of your own and get a skill, a project instruction and a checklist.",
      "It takes about {minutes} minutes, and everything stays in your browser.",
    ],
    start: "Start with the file",
  },
};
