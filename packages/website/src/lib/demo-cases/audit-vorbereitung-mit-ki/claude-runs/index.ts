/**
 * The Claude scene of W05: recorded runs of Claude Code on 26 October 2026
 * with the kit's request and its eleven folder files, with the skill
 * audit-nachweise and without it, in both languages. Never edit a take;
 * record a new one with scripts/demos/record-claude-run.mjs (see the builder
 * guide). Takes that broke the honesty rules stay in rejected/ and are
 * counted. The notes below are ours, written from these takes.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import deAlleWith1 from "./de-alle-with-1.json";
import deAlleWith2 from "./de-alle-with-2.json";
import deAlleWithout5 from "./de-alle-without-5.json";
import deR7With1 from "./de-r7-with-1.json";
import deR7With2 from "./de-r7-with-2.json";
import deR7Without1 from "./de-r7-without-1.json";
import deR7Without2 from "./de-r7-without-2.json";
import enAlleWith1 from "./en-alle-with-1.json";
import enAlleWith2 from "./en-alle-with-2.json";
import enAlleWithout1 from "./en-alle-without-1.json";
import enAlleWithout2 from "./en-alle-without-2.json";
import enR7With1 from "./en-r7-with-1.json";
import enR7With2 from "./en-r7-with-2.json";
import enR7Without1 from "./en-r7-without-1.json";
import enR7Without2 from "./en-r7-without-2.json";

const TAKES = [
  deR7With1,
  deR7With2,
  deR7Without1,
  deR7Without2,
  deAlleWith1,
  deAlleWith2,
  deAlleWithout5,
  enR7With1,
  enR7With2,
  enR7Without1,
  enR7Without2,
  enAlleWith1,
  enAlleWith2,
  enAlleWithout1,
  enAlleWithout2,
] as unknown as readonly ClaudeRecording[];

export const SCENE: ClaudeSceneData | null = {
  slug: "audit-vorbereitung-mit-ki",
  prompts: [
    { id: "r7", locale: "de", label: "Nachweis für R7", withSkill: ["de-r7-with-1", "de-r7-with-2"], withoutSkill: ["de-r7-without-1", "de-r7-without-2"] },
    {
      id: "alle",
      locale: "de",
      label: "R1 bis R8 vorbereiten",
      withSkill: ["de-alle-with-1", "de-alle-with-2"],
      withoutSkill: ["de-alle-without-5"],
      rejected: 4,
    },
    { id: "r7", locale: "en", label: "Evidence for R7", withSkill: ["en-r7-with-1", "en-r7-with-2"], withoutSkill: ["en-r7-without-1", "en-r7-without-2"] },
    { id: "alle", locale: "en", label: "Prepare R1 to R8", withSkill: ["en-alle-with-1", "en-alle-with-2"], withoutSkill: ["en-alle-without-1", "en-alle-without-2"] },
  ],
  recordings: TAKES,
  notes: {
    de: [
      "Bei R7 sagen alle acht Aufnahmen, dass keine Datei im Ordner als Nachweis taugt, mit und ohne Skill.",
      "Bei R7 schreibt Claude mit dem Skill zu jeder Datei die vier Prüfungen Zitat, Zeitraum, Umfang und Freigabe in eine Tabelle. Ohne den Skill nennt Claude Gründe, aber nicht diese vier Prüfungen.",
      "Bei R1 bis R8 sucht Claude mit dem Skill in allen vier Aufnahmen am Ende jedes Zitat noch einmal in seiner Datei.",
      "Ohne den Skill legt Claude in zwei von drei Aufnahmen zu R1 bis R8 Kopien der Ordnerdateien als Versandpaket an.",
      "Ohne den Skill wechseln die Statuswörter von Aufnahme zu Aufnahme.",
    ],
    en: [
      "On R7, all eight recordings say that no file in the folder works as evidence, with and without the skill.",
      "On R7, Claude with the skill puts the four checks quote, period, scope and approval for each file into a table. Without the skill, Claude gives reasons, but not these four checks.",
      "On R1 to R8, Claude with the skill looks up every quote in its file once more at the end, in all four recordings.",
      "Without the skill, Claude copies the folder files into a pack to send in two of the three recordings on R1 to R8.",
      "Without the skill, the status words change from one recording to the next.",
    ],
  },
};
