import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8) on the Glas shell. Sentence 2 repeats the learning
 * objective's list word for word, so "gemeinsame Basis" is defined where it first appears. Brandtwerk
 * and its three offers are in the kit's case (fall/anfrage.md); the three take-home files are the
 * filled table, the negotiation email and the skill.
 */
export const SHELL: DemoShellVersion = "v4";

export const INTRO: DemoIntroData = {
  de: {
    title: "Drei Angebote fair vergleichen",
    sentences: [
      "Die erfundene Firma Brandtwerk hat drei Angebote für Versandkartons bekommen.",
      "Du schätzt zuerst, welches am günstigsten ist. Dann rechnest du alle drei auf eine gemeinsame Basis um: gleiche Menge, je Stück, bis ins Werk, mit Einmalkosten und Skonto.",
      "Du nimmst die Tabelle, eine Verhandlungsmail und einen Skill für deinen Claude mit.",
      "Das dauert etwa {minutes} Minuten, und alles läuft in deinem Browser.",
    ],
    start: "Mit der Schätzung starten",
  },
  en: {
    title: "Compare three offers fairly",
    sentences: [
      "The invented company Brandtwerk has received three offers for shipping boxes.",
      "First you guess which one is cheapest. Then you convert all three to one shared basis: same quantity, per unit, delivered to the plant, with one-off costs and early-payment discount.",
      "You take home the table, a negotiation email and a skill for your own Claude.",
      "It takes about {minutes} minutes, and everything runs in your browser.",
    ],
    start: "Start with your guess",
  },
};
