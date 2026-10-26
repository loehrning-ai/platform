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
    title: "Vier Sätze an ihren Belegen prüfen",
    sentences: [
      "Ein erfundenes Weingut soll vier Sätze über seine Nachhaltigkeit verschicken.",
      "Du legst jeden Satz neben die Datei, die ihn belegen soll, und prüfst vier Dinge: Zitat, Zeitraum, Umfang und Freigabe.",
      "Danach prüfst du eigene Sätze und nimmst die Prüfkarte, einen Skill und ein Nachweisregister mit.",
      "Das dauert etwa {minutes} Minuten, und alles bleibt in deinem Browser.",
    ],
    start: "Mit dem ersten Satz starten",
  },
  en: {
    title: "Check four sentences against their evidence",
    sentences: [
      "An invented winery wants to send out four sentences about its sustainability.",
      "You put each sentence next to the file that should prove it and check four things: the quote, the period, the scope and the sign-off.",
      "Then you check sentences of your own and take the check card, a skill and an evidence register with you.",
      "It takes about {minutes} minutes, and everything stays in your browser.",
    ],
    start: "Start with the first sentence",
  },
};
