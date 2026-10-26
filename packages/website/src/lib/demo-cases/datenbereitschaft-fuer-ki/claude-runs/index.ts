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

const takes = [deMonatWith1, deMonatWithout1, deKontenWith1, deKontenWithout1, enMonthWith1, enMonthWithout1, enAccountsWith1, enAccountsWithout1];

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
  ],
  recordings: takes as unknown as readonly ClaudeRecording[],
  notes: {
    de: [
      "Mit dem Skill fragt Claude zuerst, ob die Spalte amount ein Stand oder eine Veränderung ist, und rechnet erst danach.",
      "Auf die Nachfrage hin nimmt Claude ohne Skill einen Anfangsstand von 0 an und zeigt 75.890, 85.665 und 128.230 als Ending MRR. Mit dem Skill bleibt der fehlende Anfangsstand als X in jeder Zeile stehen, und darunter steht die Herkunft.",
      "Bei den Konten nennt Claude ohne Skill zuerst 108 und erst danach 132. Mit dem Skill fragt Claude, welche Codes am 30. Juni als aktiv zählen.",
    ],
    en: [
      "With the skill, Claude first asks whether the amount column is a level or a change, and only then calculates.",
      "After the follow-up, Claude without the skill assumes an opening level of 0 and shows 75,890, 85,665 and 128,230 as ending MRR. With the skill, the missing opening level stays in every row as X, and the source note follows the table.",
      "For the accounts, Claude without the skill names 108 first and 132 only after that. With the skill, Claude asks which codes count as active on 30 June.",
    ],
  },
};
