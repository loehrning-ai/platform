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
    title: "Eine Prognose an ihren alten Fehlern prüfen",
    sentences: [
      "Ein erfundener Suppenhersteller lässt seinen Wochenabsatz von einem Tool vorhersagen.",
      "Du prüfst diese Prognose an ihren alten Fehlern und siehst, ob sie besser ist als die einfache Regel ‚so viel wie letzte Woche‘.",
      "Am Ende hast du eine Prüfregel für deine eigene Prognose und einen Skill, mit dem Claude sie nachrechnet.",
      "Das dauert etwa {minutes} Minuten, und alles bleibt in deinem Browser.",
    ],
    start: "Mit der Schätzung starten",
  },
  en: {
    title: "Check a forecast against its own past errors",
    sentences: [
      "An invented soup maker lets a tool forecast its weekly sales.",
      "You check that forecast against its own past errors and see whether it beats the simple rule ‘same as last week’.",
      "You leave with a release rule for your own forecast and a skill that lets Claude redo the maths.",
      "It takes about {minutes} minutes, and everything stays in your browser.",
    ],
    start: "Start with your guess",
  },
};
