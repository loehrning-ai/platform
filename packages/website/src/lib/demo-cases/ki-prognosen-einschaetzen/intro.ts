import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";

/**
 * The intro card of "Die Fehlerliste" (language-standard B.8) and its shell.
 * Every claim holds against the kit: the soup maker is invented, the rule is
 * the kit's Messlatte, the skill is prognose-pruefen.
 */
export const SHELL: DemoShellVersion = "v4";

export const INTRO: DemoIntroData = {
  de: {
    title: "Eine Prognose an ihren Fehlern prüfen",
    sentences: [
      "Ein erfundener Suppenhersteller kocht jede Woche so viel Linsensuppe, wie ein Tool vorhersagt.",
      "Du prüfst an den alten Fehlern, ob das Tool besser plant als die Regel ‚so viel wie letzte Woche‘, und fasst die Daten selbst an.",
      "Am Ende weißt du, wann ihr der Prognose folgen könnt, und hast einen Skill, mit dem Claude das jede Woche nachrechnet.",
      "Das dauert etwa {minutes} Minuten.",
    ],
    start: "Mit der Schätzung starten",
  },
  en: {
    title: "Check a forecast against its own errors",
    sentences: [
      "An invented soup maker cooks as much lentil soup each week as a tool forecasts.",
      "Using its past errors, you check whether the tool plans better than the rule ‘same as last week’, and you move the data yourself.",
      "At the end you know when you can follow the forecast, and you have a skill that lets Claude redo the check every week.",
      "It takes about {minutes} minutes.",
    ],
    start: "Start with your guess",
  },
};
