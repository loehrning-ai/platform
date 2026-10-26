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
    title: "Eine Datei, drei Antworten",
    sentences: [
      "Ein erfundener Monatsbericht behauptet, die Qualität einer Produktlinie habe sich verbessert.",
      "Du zählst dieselbe Datei auf drei Arten und siehst, wie aus einer Tabelle drei verschiedene Antworten werden.",
      "Danach legst du für eine Kennzahl aus deiner Arbeit fest, was sie zählt, und nimmst sie als Skill für Claude mit.",
      "Das dauert etwa {minutes} Minuten, und alles bleibt in deinem Browser.",
    ],
    start: "Mit dem Zählen starten",
  },
  en: {
    title: "One file, three answers",
    sentences: [
      "An invented monthly report claims that the quality of one product line has improved.",
      "You count the same file in three ways and see how one table turns into three different answers.",
      "Then you decide what a figure from your own work counts, and take it with you as a skill for Claude.",
      "It takes about {minutes} minutes, and everything stays in your browser.",
    ],
    start: "Start counting",
  },
};
