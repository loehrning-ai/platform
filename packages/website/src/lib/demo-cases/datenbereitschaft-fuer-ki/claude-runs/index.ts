/**
 * The Claude scene of W03: recorded runs of Claude Code with the skill
 * kennzahl-fragekarte and the kit's two export files. Never edit a take;
 * record a new one with scripts/demos/record-claude-run.mjs (see the builder
 * guide). Takes that broke the honesty rules stay in rejected/ and are counted.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import deKontenWith1 from "./de-konten-with-1.json";
import deKontenWithout1 from "./de-konten-without-1.json";
import deMonatWith1 from "./de-monat-with-1.json";
import deMonatWithout1 from "./de-monat-without-1.json";
import enAccountsWith1 from "./en-accounts-with-1.json";
import enAccountsWithout1 from "./en-accounts-without-1.json";
import enMonthWith1 from "./en-month-with-1.json";
import enMonthWithout1 from "./en-month-without-1.json";
import deSichtWith1 from "./de-sicht-with-1.json";
import deSichtWithout1 from "./de-sicht-without-1.json";
import enViewWith1 from "./en-view-with-1.json";
import enViewWithout1 from "./en-view-without-1.json";

const takes = [
  deMonatWith1,
  deMonatWithout1,
  deKontenWith1,
  deKontenWithout1,
  deSichtWith1,
  deSichtWithout1,
  enMonthWith1,
  enMonthWithout1,
  enAccountsWith1,
  enAccountsWithout1,
  enViewWith1,
  enViewWithout1,
];

/** Where a note's claim can be read: a take, its turn (1 is the first answer), and the words that turn must contain. */
export interface NoteEvidence {
  readonly take: string;
  readonly turn: number;
  readonly says: readonly string[];
}

/**
 * "Unsere Notiz": each line is written from the takes and names its evidence,
 * and notes.test.ts reads every quote and every number of the line back from
 * that locale's takes, so a note cannot claim what its take does not contain.
 */
export const NOTES: Record<"de" | "en", readonly { readonly text: string; readonly evidence: readonly NoteEvidence[] }[]> = {
  de: [
    {
      text: "Mit dem Skill rechnet Claude zuerst nichts und fragt, ob die Spalte amount ein Stand oder eine Veränderung ist.",
      evidence: [{ take: "de-monat-with-1", turn: 1, says: ["Ich habe noch nichts gerechnet", "Stand", "Veränderung"] }],
    },
    {
      text: "Ohne Skill sagt Claude in der ersten Antwort selbst, dass der Stand vom 31.12.2025 fehlt, und rechnet mit X als Stand vom Dezember.",
      evidence: [{ take: "de-monat-without-1", turn: 1, says: ["Stand vom 31.12.2025", "mit X als Ending MRR vom Dezember 2025"] }],
    },
    {
      text: "Auf die Bitte „Antworte direkt“ zeigt Claude ohne Skill 75.890, 85.665 und 128.230 als Ending MRR, mit Startwert 0.",
      evidence: [{ take: "de-monat-without-1", turn: 2, says: ["75.890", "85.665", "128.230", "Startwert 0"] }],
    },
    {
      text: "Mit dem Skill nennt Claude auch auf dieselbe Bitte keinen Stand, zeigt nur die Veränderungen und schreibt die Herkunft darunter.",
      evidence: [{ take: "de-monat-with-1", turn: 2, says: ["Den Ending MRR selbst kann ich deshalb nicht angeben", "Herkunft"] }],
    },
    {
      text: "Mit der freigegebenen Sicht nennen beide Läufe 334.675, 344.450 und 387.015. Der Lauf mit dem Skill schreibt zusätzlich die Herkunft darunter.",
      evidence: [
        { take: "de-sicht-with-1", turn: 1, says: ["334.675", "344.450", "387.015", "Herkunft"] },
        { take: "de-sicht-without-1", turn: 1, says: ["334.675", "344.450", "387.015"] },
      ],
    },
    {
      text: "Bei den Konten nennt Claude ohne Skill 108 und 132, je nach Code N. Mit dem Skill fragt Claude, welche Codes am 30. Juni zählen.",
      evidence: [
        { take: "de-konten-without-1", turn: 1, says: ["108", "132"] },
        { take: "de-konten-with-1", turn: 1, says: ["Welche Codes zählen am 30. Juni"] },
      ],
    },
  ],
  en: [
    {
      text: "With the skill, Claude calculates nothing first and asks whether the amount column is the MRR at month end or the change during the month.",
      evidence: [{ take: "en-month-with-1", turn: 1, says: ["I haven't calculated anything yet", "change in MRR during the month"] }],
    },
    {
      text: "Without the skill, the first answer shows 75,890, 85,665 and 128,230 but says they are not ending MRR.",
      evidence: [{ take: "en-month-without-1", turn: 1, says: ["75,890", "85,665", "128,230", "**not** ending MRR"] }],
    },
    {
      text: "After the request \"Answer directly\", Claude without the skill shows the same numbers as ending MRR and assumes MRR was zero going into January.",
      evidence: [{ take: "en-month-without-1", turn: 2, says: ["Ending MRR", "assumed MRR was zero going into January"] }],
    },
    {
      text: "With the skill, the same request gives each month as X plus the changes. The opening level stays open, and a source block follows.",
      evidence: [{ take: "en-month-with-1", turn: 2, says: ["31 Dec 2025 MRR (X) plus the changes added up from January", "Herkunft"] }],
    },
    {
      text: "With the approved view, both runs give 334,675, 344,450 and 387,015. The run with the skill adds a source block.",
      evidence: [
        { take: "en-view-with-1", turn: 1, says: ["334,675", "344,450", "387,015", "Herkunft"] },
        { take: "en-view-without-1", turn: 1, says: ["334,675", "344,450", "387,015"] },
      ],
    },
    {
      text: "For the accounts, Claude without the skill gives 108, or 132 if N counts. With the skill, Claude asks which status codes count as active.",
      evidence: [
        { take: "en-accounts-without-1", turn: 1, says: ["108", "132"] },
        { take: "en-accounts-with-1", turn: 1, says: ["Which status codes count as an active account"] },
      ],
    },
  ],
};

export const SCENE: ClaudeSceneData | null = {
  slug: "datenbereitschaft-fuer-ki",
  prompts: [
    {
      id: "monat",
      locale: "de",
      label: "Ending MRR je Monat im letzten Quartal",
      withSkill: ["de-monat-with-1"],
      withoutSkill: ["de-monat-without-1"],
      followUpLabel: "Nachfrage: Antworte direkt",
    },
    {
      id: "konten",
      locale: "de",
      label: "Aktive Konten am 30. Juni",
      withSkill: ["de-konten-with-1"],
      withoutSkill: ["de-konten-without-1"],
    },
    {
      id: "sicht",
      locale: "de",
      label: "Ending MRR aus der freigegebenen Sicht",
      withSkill: ["de-sicht-with-1"],
      withoutSkill: ["de-sicht-without-1"],
    },
    {
      id: "month",
      locale: "en",
      label: "Ending MRR by month, last quarter",
      withSkill: ["en-month-with-1"],
      withoutSkill: ["en-month-without-1"],
      followUpLabel: "Follow-up: Answer directly",
    },
    {
      id: "accounts",
      locale: "en",
      label: "Active accounts on 30 June",
      withSkill: ["en-accounts-with-1"],
      withoutSkill: ["en-accounts-without-1"],
    },
    {
      id: "view",
      locale: "en",
      label: "Ending MRR from the approved view",
      withSkill: ["en-view-with-1"],
      withoutSkill: ["en-view-without-1"],
    },
  ],
  recordings: takes as unknown as readonly ClaudeRecording[],
  notes: {
    de: NOTES.de.map((note) => note.text),
    en: NOTES.en.map((note) => note.text),
  },
};
