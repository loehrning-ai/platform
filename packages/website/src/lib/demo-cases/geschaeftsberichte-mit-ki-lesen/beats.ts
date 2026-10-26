/**
 * The guided path of "Eine Datei, drei Antworten" on the v4 shell: six
 * scenes that walk the learning objective clause by clause (Zähler, Nenner,
 * Zeitraum, eine Zahl prüfen, entscheiden), then the visitor's own card and
 * the take-home. Each beat names the kit file it acts on (checked by
 * demo-contract.test.ts). Plain data in both languages, safe for the browser.
 */
import type { Beat } from "@/lib/demo-beats";
import { takeHomeFor } from "@/lib/demo-takehome";
import { KIT_SKILL_PATH } from "./skill-file";

const KIT = "northwind-analyst-kit";
/** The kit's start page, as the take-home entry names it. */
const INSTALL_DOC = installDoc();

function installDoc(): string {
  const doc = takeHomeFor("geschaeftsberichte-mit-ki-lesen")?.kit.de.installDoc;
  if (!doc) throw new Error("the take-home entry of geschaeftsberichte-mit-ki-lesen names no start page");
  return doc;
}

export const BEATS: readonly Beat[] = [
  {
    id: "schaetzen",
    kind: "commit",
    seconds: 0.6,
    label: { de: "Schätzen", en: "Guess" },
    step: {
      de: "Du schätzt, bevor du die Daten siehst.",
      en: "You make a guess before you see the data.",
    },
    kitFile: `${KIT}/reports/2023-09-monthly-report.md`,
  },
  {
    id: "zaehlen",
    kind: "reveal",
    seconds: 0.6,
    label: { de: "Zählen", en: "Count" },
    step: {
      de: "Du wählst, was gezählt wird.",
      en: "You choose what gets counted.",
    },
    nextName: { de: "Zählen", en: "Count" },
    kitFile: `${KIT}/data/ncr_records.csv`,
  },
  {
    id: "zusammenfassen",
    kind: "tool",
    seconds: 0.4,
    label: { de: "Zusammenfassen", en: "Merge" },
    step: {
      de: "Du fasst Meldungen zusammen.",
      en: "You merge records.",
    },
    nextName: { de: "Zusammenfassen", en: "Merge" },
    kitFile: `${KIT}/metric-cards.md`,
  },
  {
    id: "zeitraum",
    kind: "apply",
    seconds: 0.4,
    label: { de: "Zeitraum", en: "Period" },
    step: {
      de: "Du legst fest, wo der September endet.",
      en: "You decide where September ends.",
    },
    nextName: { de: "Zeitraum", en: "Period" },
    kitFile: `${KIT}/data/demand_actuals.csv`,
  },
  {
    id: "nachrechnen",
    kind: "apply",
    seconds: 0.4,
    label: { de: "Nachrechnen", en: "Trace" },
    step: {
      de: "Du verfolgst eine Zahl bis zu ihren Zeilen.",
      en: "You trace one figure back to its rows.",
    },
    nextName: { de: "Nachrechnen", en: "Trace" },
    kitFile: `${KIT}/data/product_lines.csv`,
  },
  {
    id: "entscheiden",
    kind: "apply",
    seconds: 0.4,
    label: { de: "Entscheiden", en: "Decide" },
    step: {
      de: "Dein Steckbrief ergibt eine Entscheidung.",
      en: "Your metric card leads to a decision.",
    },
    nextName: { de: "Entscheiden", en: "Decide" },
    kitFile: INSTALL_DOC,
  },
  {
    id: "deine-kennzahl",
    kind: "own",
    seconds: 0,
    label: { de: "Deine Kennzahl", en: "Your metric" },
    step: {
      de: "Du schreibst einen eigenen Steckbrief.",
      en: "You write a card of your own.",
    },
    nextName: { de: "deine eigene Kennzahl", en: "your own metric" },
    kitFile: KIT_SKILL_PATH,
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    step: {
      de: "Du nimmst Skill und Vorlage mit.",
      en: "You take the skill and the template home.",
    },
    nextName: { de: "Mitnehmen", en: "Take home" },
    kitFile: `${KIT}/project-instructions.md`,
  },
];

export type BeatId = "schaetzen" | "zaehlen" | "zusammenfassen" | "zeitraum" | "nachrechnen" | "entscheiden" | "deine-kennzahl" | "mitnehmen";
