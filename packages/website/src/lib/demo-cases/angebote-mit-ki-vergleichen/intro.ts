import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro of this demo (language-standard B.8) on the Glas shell. Sentence 2 repeats the learning
 * objective's list word for word, so "gemeinsame Basis" is defined where it first appears. Brandtwerk
 * and its three offers are in the kit's case (fall/anfrage.md); the three take-home files are the
 * filled table, the negotiation email and the skill. Sentence 4 gives only the length: the card's
 * footnote already says that nothing leaves the browser.
 */
export const SHELL: DemoShellVersion = "v4";

/** The last beat draws the Claude window and the take-home in the stage (demo-intros.ts). */
export const TAKEHOME_IN_STAGE = true;

export const INTRO: DemoIntroData = {
  de: {
    title: "Drei Angebote fair vergleichen",
    sentences: [
      "Die erfundene Firma Brandtwerk hat drei Angebote für Versandkartons bekommen.",
      "Du schätzt zuerst, welches am günstigsten ist. Dann rechnest du alle drei auf eine gemeinsame Basis um: gleiche Menge, je Stück, bis ins Werk, mit Einmalkosten und Skonto.",
      "Zum Schluss siehst du in einer echten Aufzeichnung, wie Claude dieselben Angebote vergleicht. Tabelle, Verhandlungsmail und Skill nimmst du mit.",
      "Das dauert etwa {minutes} Minuten.",
    ],
    start: "Mit der Schätzung starten",
  },
  en: {
    title: "Compare three offers fairly",
    sentences: [
      "The invented company Brandtwerk has received three offers for shipping boxes.",
      "First you guess which one is cheapest. Then you convert all three to one shared basis: same quantity, per unit, delivered to the plant, with one-off costs and early-payment discount.",
      "At the end, a real recording shows Claude comparing the same offers. You take home the table, the negotiation email and the skill.",
      "It takes about {minutes} minutes.",
    ],
    start: "Start with your guess",
  },
};
