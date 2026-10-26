/**
 * The Claude scene of W06: recorded runs of Claude Code with the take-home skill
 * angebote-vergleichen and the kit's case files. One prompt per language, byte for byte the same in
 * every take, so the attached files are the only difference: the request and the three offers
 * ("ohne-saetze"), and the same plus Brandtwerk's own freight and storage rates ("mit-saetzen").
 * Each set with and without the skill. Never edit a take; record a new one with
 * scripts/demos/record-claude-run.mjs.
 *
 * Takes set aside stay in rejected/ and are counted per prompt. Thirteen were refused by the
 * recorder because its first per-command allowlist denied an ordinary shell loop; the later takes
 * ran in the CLI sandbox. Two (de-ohne-saetze-without-2, en-mit-saetzen-without-1) were set aside
 * by hand, unedited: Claude listed an empty workspace in them and never saw the attached files.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import deMitWith3 from "./de-mit-saetzen-with-3.json";
import deMitWithout4 from "./de-mit-saetzen-without-4.json";
import deMitWithout5 from "./de-mit-saetzen-without-5.json";
import deOhneWith4 from "./de-ohne-saetze-with-4.json";
import deOhneWith5 from "./de-ohne-saetze-with-5.json";
import deOhneWith6 from "./de-ohne-saetze-with-6.json";
import deOhneWithout4 from "./de-ohne-saetze-without-4.json";
import enMitWith2 from "./en-mit-saetzen-with-2.json";
import enMitWithout2 from "./en-mit-saetzen-without-2.json";
import enOhneWith2 from "./en-ohne-saetze-with-2.json";
import enOhneWithout2 from "./en-ohne-saetze-without-2.json";

const take = (json: unknown) => json as ClaudeRecording;

/** The prompt labels name the file set; the demo's attach tray picks a set by these labels. */
export const FILE_SET_LABELS = {
  de: { "ohne-saetze": "Ohne unsere Sätze", "mit-saetzen": "Mit unseren Sätzen" },
  en: { "ohne-saetze": "Without our rates", "mit-saetzen": "With our rates" },
} as const;

export const SCENE: ClaudeSceneData | null = {
  slug: "angebote-mit-ki-vergleichen",
  prompts: [
    {
      id: "ohne-saetze",
      locale: "de",
      label: FILE_SET_LABELS.de["ohne-saetze"],
      withSkill: ["de-ohne-saetze-with-4", "de-ohne-saetze-with-5", "de-ohne-saetze-with-6"],
      withoutSkill: ["de-ohne-saetze-without-4"],
      rejected: 6,
    },
    {
      id: "mit-saetzen",
      locale: "de",
      label: FILE_SET_LABELS.de["mit-saetzen"],
      withSkill: ["de-mit-saetzen-with-3"],
      withoutSkill: ["de-mit-saetzen-without-4", "de-mit-saetzen-without-5"],
      rejected: 5,
    },
    {
      id: "ohne-saetze",
      locale: "en",
      label: FILE_SET_LABELS.en["ohne-saetze"],
      withSkill: ["en-ohne-saetze-with-2"],
      withoutSkill: ["en-ohne-saetze-without-2"],
      rejected: 2,
    },
    {
      id: "mit-saetzen",
      locale: "en",
      label: FILE_SET_LABELS.en["mit-saetzen"],
      withSkill: ["en-mit-saetzen-with-2"],
      withoutSkill: ["en-mit-saetzen-without-2"],
      rejected: 2,
    },
  ],
  recordings: [
    take(deOhneWith4),
    take(deOhneWith5),
    take(deOhneWith6),
    take(deOhneWithout4),
    take(deMitWith3),
    take(deMitWithout4),
    take(deMitWithout5),
    take(enOhneWith2),
    take(enOhneWithout2),
    take(enMitWith2),
    take(enMitWithout2),
  ],
  notes: {
    de: [
      "Ohne unsere Sätze nennt Claude mit Skill in allen drei Aufnahmen keinen Gewinner. Es lässt Fracht und Lager bei B und C offen und fragt nach den Sätzen.",
      "Ohne Skill nennt Claude B auf dem Papier am günstigsten und rechnet aus, wie viel Fracht der Vorteil verträgt. Nach unseren Sätzen fragt es nicht, es rät zu einem Frachtangebot.",
      "Mit unseren Sätzen kommen alle drei Aufnahmen auf dieselben Summen wie du. Mit Skill steht zu jeder Zahl die Stelle im Dokument, ohne Skill endet die Antwort mit einer Empfehlung.",
    ],
    en: [
      "Without our rates and with the skill, Claude names no winner. It leaves freight and storage open for B and C and asks for the rates.",
      "Without the skill, Claude calls B cheapest on paper and works out how much freight that lead can carry. It doesn't ask for our rates and suggests getting a freight quote.",
      "With our rates, both answers reach the same totals as you. With the skill every number names its place in the documents; without it, the answer ends with a recommendation.",
    ],
  },
};
