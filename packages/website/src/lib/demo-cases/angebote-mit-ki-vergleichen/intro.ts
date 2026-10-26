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
    title: "Drei Angebote fair vergleichen",
    sentences: [
      "Eine erfundene Firma hat drei Angebote für Versandkartons.",
      "Du schätzt, welches am günstigsten ist, und rechnest dann alle drei auf dieselbe Basis: gleiche Menge, geliefert bis ins Werk, mit Einmalkosten und Skonto.",
      "Danach rechnest du eigene Angebote und nimmst die Vergleichsvorlage und einen Skill mit.",
      "Das dauert etwa {minutes} Minuten, und alles bleibt in deinem Browser.",
    ],
    start: "Mit der Schätzung starten",
  },
  en: {
    title: "Compare three offers fairly",
    sentences: [
      "An invented company has three offers for shipping boxes.",
      "You guess which is cheapest, then put all three on one basis: the same quantity, delivered to the plant, with one-off costs and cash discount.",
      "Then you compare offers of your own and take the comparison template and a skill with you.",
      "It takes about {minutes} minutes, and everything stays in your browser.",
    ],
    start: "Start with your guess",
  },
};
