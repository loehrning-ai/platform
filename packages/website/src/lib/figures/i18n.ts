/**
 * Locale of the strings the figure kinds write themselves (labels such as
 * "Zufall", sentences of the readout, number format). Specs say which locale
 * they are drawn in with `lang`; no `lang` means German. Words that come from
 * the frozen JSON keep their text; `tr` translates the few built-in label
 * patterns (halves, splits, group sizes) and the words of the hero charts.
 */

import type { FigureBase } from "./types.ts";

export type Lang = "de" | "en";

export const langOf = (spec: Pick<FigureBase, "lang">): Lang => (spec.lang === "en" ? "en" : "de");

interface Strings {
  readonly chance: string;
  readonly chanceBand: string;
  readonly factorVsChance: string;
  readonly example: string;
  readonly exampleOf: (label: string) => string;
  readonly allSplits: (n: number, a: string, b: string, interval: string) => string;
  readonly secondHalf: (b: string, interval: string) => string;
  readonly interval95: string;
  readonly to: string;
  readonly expected: string;
  readonly square: (per: string, draws: string) => string;
  readonly newSplit: string;
  readonly howMany: string;
  readonly sameJob: string;
  readonly base: string;
  readonly textAmount: string;
  readonly latest: string;
  readonly reading: string;
  readonly blocksIn: (label: string, shown: string, blocks: string, bin: string, count: string, total: string) => string;
  readonly spike: string;
  readonly observedByExpected: string;
  readonly pairs: string;
  readonly fewerThan5: string;
}

const DE: Strings = {
  chance: "Zufall",
  chanceBand: "Zufallsband",
  factorVsChance: "Faktor gegenüber Zufall",
  example: "Beispielteilung",
  exampleOf: (l) => (/^Teilung\b/.test(l) ? l.replace(/^Teilung/, "Beispielteilung") : `Beispiel: ${l}`),
  allSplits: (n, a, b, iv) => `Alle ${n} Teilungen zusammen: ${a} / ${b}${iv}`,
  secondHalf: (b, iv) => `Zweite Hälfte, alle Teilungen: ${b}${iv}`,
  interval95: "95 %-Intervall",
  to: "bis",
  expected: "erwartet",
  square: (per, draws) => `1 Quadrat = ${per} Ziehungen von ${draws}`,
  newSplit: "Neue Zufallsteilung",
  howMany: "Größe der Gruppe",
  sameJob: "Was heißt dieselbe Stelle?",
  base: "Basis der Zahlen",
  textAmount: "Textmenge halten, Stufen",
  latest: "Jüngstes Datum der Seite",
  reading: "Lesart",
  blocksIn: (label, shown, blocks, bin, count, total) => `${label}: ${shown} von ${blocks} Blöcken in ${bin}, ${count} von ${total}.`,
  spike: "Spitze",
  observedByExpected: "beobachtet durch erwartet",
  pairs: "aller Paare",
  fewerThan5: "weniger als 5",
};

const EN: Strings = {
  chance: "Chance",
  chanceBand: "Chance band",
  factorVsChance: "Factor against chance",
  example: "Example split",
  exampleOf: (l) => (/^Split\b/.test(l) ? l.replace(/^Split/, "Example split") : `Example: ${l}`),
  allSplits: (n, a, b, iv) => `All ${n} splits together: ${a} / ${b}${iv}`,
  secondHalf: (b, iv) => `Second half, all splits: ${b}${iv}`,
  interval95: "95% interval",
  to: "to",
  expected: "expected",
  square: (per, draws) => `1 square = ${per} draws of ${draws}`,
  newSplit: "New random split",
  howMany: "Size of the group",
  sameJob: "What counts as the same job?",
  base: "Base of the numbers",
  textAmount: "Hold the amount of text, levels",
  latest: "Newest date on the page",
  reading: "Reading",
  blocksIn: (label, shown, blocks, bin, count, total) => `${label}: ${shown} of ${blocks} blocks in ${bin}, ${count} of ${total}.`,
  spike: "Top",
  observedByExpected: "observed divided by expected",
  pairs: "of all pairs",
  fewerThan5: "fewer than 5",
};

export const strings = (lang: Lang): Strings => (lang === "en" ? EN : DE);

/** English of the German words of the hero charts that are drawn inside a figure. */
const EN_WORDS: Readonly<Record<string, string>> = {
  "Hälfte A": "Half A",
  "Hälfte B": "Half B",
  "Register-Firmen": "Register firms",
  Digitalisierung: "Digitalisation",
  Nachhaltigkeit: "Sustainability",
  KI: "AI",
  Doppelt: "Duplicates",
  "Gig-Plattformen": "Gig platforms",
  Studierende: "Students",
  Vermittler: "Intermediaries",
  "Business-Rollen": "Business roles",
  "Technische Stellenanzeigen": "Technical job ads",
  "Gleiche Firma und Titel zählen einmal": "Same firm and title count once",
  "Nur Kopien am selben Ort zählen einmal": "Only copies at the same place count once",
  Startseiten: "Homepages",
  Verbindungen: "connections",
  ohne: "without",
  Zufall: "Chance",
};

/** A label of a spec in the locale of the figure (German stays as written). */
export function tr(lang: Lang, label: string): string {
  if (lang === "de") return label;
  const hit = EN_WORDS[label];
  if (hit !== undefined) return hit;
  let m = /^(\d+) Firmen$/.exec(label);
  if (m) return `${m[1]} firms`;
  m = /^Teilung (\d+)$/.exec(label);
  if (m) return `Split ${m[1]}`;
  m = /^(\d+) Stufen$/.exec(label);
  if (m) return `${m[1]} levels`;
  if (label === "ohne Textkontrolle") return "no text control";
  return label;
}

/** The decimal mark and group mark of a locale. */
export function marks(lang: Lang): { readonly dec: string; readonly group: string } {
  return lang === "en" ? { dec: ".", group: "," } : { dec: ",", group: "." };
}
