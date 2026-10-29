/**
 * The Claude scene of W05: recorded runs of Claude Code on 26 October 2026
 * with the kit's request and its eleven folder files, with the skill
 * audit-nachweise and without it, in both languages. Never edit a take;
 * record a new one with scripts/demos/record-claude-run.mjs (see the builder
 * guide). Takes that broke the honesty rules stay in rejected/ and are
 * counted. The notes below are ours, written from these takes and held to
 * them by v4.test.ts; review.ts says which take each question shows.
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

const R7_NOTES = {
  de: [
    "Bei R7 kommen alle acht Aufnahmen zum selben Ergebnis: Keine Datei im Ordner taugt als Nachweis, mit und ohne Skill.",
    "Mit dem Skill schreibt Claude zu jeder Datei die vier Prüfungen Zitat, Zeitraum, Umfang und Freigabe in eine Tabelle. Ohne den Skill nennt Claude Gründe, aber nicht diese vier Prüfungen.",
  ],
  en: [
    "On R7, all eight recordings reach the same result: no file in the folder works as evidence, with or without the skill.",
    "With the skill, Claude puts the four tests quote, period, scope and approval for each file into a table. Without the skill, Claude gives reasons, but not these four tests.",
  ],
} as const;

const ALL_NOTES = {
  de: [
    "Mit dem Skill schreibt Claude in allen vier Aufnahmen eine Datei mit den Nachweisen. Die Seite findet jedes Zitat darin wörtlich in den Ordnerdateien.",
    "Ohne den Skill legt Claude in fünf von sieben Aufnahmen Kopien der Ordnerdateien an. Vier dieser sieben zeigt die Seite nicht. Drei hat unser Rekorder nicht vollständig festgehalten, in einer stehen zwei verschiedene Dateien mit demselben Namen.",
    "In der gezeigten Aufnahme ohne Skill steht Klausel 7 auf Deutsch in Anführungszeichen. Der Vertrag sagt es auf Englisch, also ist das kein wörtliches Zitat.",
    "Mit dem Skill zählt Claude bei R3 30 Tage ohne Regel: Claude Team läuft seit 1.9., die Regel gilt ab 1.10. Das Kit zählt nach Regel 5 den ganzen Prüfzeitraum ab 10.12.2025, also 295 Tage. Beides ist richtig gerechnet, nur über verschiedene Zeiträume.",
    "Mit dem Skill nennt Claude den kostenlosen Chatbot aus der IT-Notiz als möglichen Vorfall für R6 und überlässt die Entscheidung der Geschäftsführung. So steht es auch im Kit.",
  ],
  en: [
    "With the skill, Claude writes a file with the evidence in all four recordings. The page finds every quote in it, word for word, in the folder files.",
    "Without the skill, Claude makes copies of the folder files in five of seven recordings. The page does not show four of these seven. Our recorder did not capture three of them completely, and one holds two different files with the same name.",
    "In the recording without the skill shown here, Claude gives none of the eight requests one of the statuses covered, weak or gap.",
    "With the skill, Claude counts only September for R3: Claude Team has run since 1 September, the rule applies from 1 October. The kit counts the whole audit window from 10 December 2025 under rule 5, so 295 days. Both are counted correctly, over different spans.",
    "With the skill, Claude names the free chatbot from the IT notes as a possible R6 incident and leaves the decision to the managing director. The kit says the same.",
  ],
} as const;

export const SCENE: ClaudeSceneData | null = {
  slug: "audit-vorbereitung-mit-ki",
  prompts: [
    { id: "r7", locale: "de", label: "Nachweis für R7", withSkill: ["de-r7-with-1", "de-r7-with-2"], withoutSkill: ["de-r7-without-1", "de-r7-without-2"], notes: R7_NOTES.de },
    {
      id: "alle",
      locale: "de",
      label: "R1 bis R8 vorbereiten",
      withSkill: ["de-alle-with-1", "de-alle-with-2"],
      withoutSkill: ["de-alle-without-5"],
      rejected: 3,
      // Takes 1, 2 and 4 (rejected/): the recorder could not match the streamed answer to the final text, because Claude kept working after it.
      // Take 3 (replaced/, reasons.json): two files Claude wrote have the same name and different content, so the recording cannot keep both.
      rejectedReason: "Unser Rekorder konnte ihr Ende nicht vollständig festhalten, weil Claude nach der Antwort weitergearbeitet hat",
      notes: ALL_NOTES.de,
    },
    { id: "r7", locale: "en", label: "Evidence for R7", withSkill: ["en-r7-with-1", "en-r7-with-2"], withoutSkill: ["en-r7-without-1", "en-r7-without-2"], notes: R7_NOTES.en },
    {
      id: "alle",
      locale: "en",
      label: "Prepare R1 to R8",
      withSkill: ["en-alle-with-1", "en-alle-with-2"],
      withoutSkill: ["en-alle-without-1", "en-alle-without-2"],
      notes: ALL_NOTES.en,
    },
  ],
  recordings: TAKES,
};
