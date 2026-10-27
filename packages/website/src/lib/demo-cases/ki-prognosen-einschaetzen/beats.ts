import type { Beat } from "@/lib/demo-beats";

/**
 * "Die Fehlerliste" on the v4 shell: one column (actual minus forecast) built
 * by hand and read four ways, the four tasks of the kit's uebung.md and the
 * four lamps of pruefregel.md. Plain data, both languages.
 *
 *   messlatte    commit    guess the simplest rule, then build it by sliding the sales line
 *   fehlerliste  reveal    scrub 2025: every week's miss drops into two strips
 *   spanne       tool      the 26 errors before a week, sorted, give its range
 *   planzahl     apply     drag the order line over 26 jars, the costs draw their curve
 *   pruefregel   apply     a 13-week bracket on the strip lights four lamps
 *   meine-daten  own       the same check on the visitor's own file, in the browser
 *   mitnehmen    takehome  the skill, the filled rule, the question for Claude, the kit
 */
export const BEATS = [
  {
    id: "messlatte",
    kind: "commit",
    seconds: 0.6,
    label: { de: "Messlatte", en: "Baseline" },
    step: { de: "Du baust die einfachste Regel selbst.", en: "You build the simplest rule yourself." },
  },
  {
    id: "fehlerliste",
    kind: "reveal",
    seconds: 0.6,
    label: { de: "Fehlerliste", en: "Error list" },
    step: { de: "Du sammelst die Fehler Woche für Woche.", en: "You collect the errors week by week." },
    nextName: { de: "die Fehlerliste", en: "the error list" },
  },
  {
    id: "spanne",
    kind: "tool",
    seconds: 0.6,
    label: { de: "Spanne", en: "Range" },
    step: { de: "Du prüfst, ob die Spanne hält.", en: "You check whether the range holds." },
    nextName: { de: "die Spanne", en: "the range" },
  },
  {
    id: "planzahl",
    kind: "apply",
    seconds: 0.6,
    label: { de: "Planzahl", en: "Order quantity" },
    step: { de: "Du suchst die günstigste Menge.", en: "You look for the cheapest quantity." },
    nextName: { de: "die Planzahl", en: "the order quantity" },
  },
  {
    id: "pruefregel",
    kind: "apply",
    seconds: 0.6,
    label: { de: "Prüfregel", en: "Release rule" },
    step: { de: "Du siehst, wann die Prognose allein gilt.", en: "You see when the forecast needs no sign-off." },
    nextName: { de: "die Prüfregel", en: "the release rule" },
  },
  {
    id: "meine-daten",
    kind: "own",
    seconds: 0,
    label: { de: "Deine Daten", en: "Your data" },
    step: { de: "Du prüfst deine Datei im Browser.", en: "You check your own file in the browser." },
    nextName: { de: "deine Daten", en: "your data" },
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    step: { de: "Du nimmst Skill, Prüfregel und Kit mit.", en: "You take the skill, the rule and the kit." },
    nextName: { de: "zum Mitnehmen", en: "take home" },
  },
] as const satisfies readonly Beat[];

export type BeatId = (typeof BEATS)[number]["id"];

export const BEAT_INDEX: Readonly<Record<BeatId, number>> = Object.fromEntries(
  BEATS.map((beat, index) => [beat.id, index]),
) as Record<BeatId, number>;
