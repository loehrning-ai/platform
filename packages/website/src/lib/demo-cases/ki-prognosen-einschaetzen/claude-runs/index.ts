/**
 * The Claude scene of W01: recorded runs of Claude Code on the kit's three
 * data files, with the skill prognose-pruefen and without it, each followed
 * by the recorded second turn about the canteen. Never edit a take; record a
 * new one with scripts/demos/record-claude-run.mjs (see the builder guide).
 * Takes that broke the honesty rules (a denied tool call, a machine path)
 * stay in rejected/ and are counted. Two takes that wrote to Claude's memory
 * folder under a temp path were deleted instead, because the publication
 * scan rejects that path; they are not in the count.
 *
 * The notes ("Unsere Notiz") say only what the listed takes show: the
 * quantities each take named and whether it wrote the release rule.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import deWith2 from "./de-trauen-with-2.json";
import deWith3 from "./de-trauen-with-3.json";
import deWithout1 from "./de-trauen-without-1.json";
import enWith1 from "./en-trust-with-1.json";

export const SCENE: ClaudeSceneData | null = {
  slug: "ki-prognosen-einschaetzen",
  prompts: [
    {
      id: "trauen",
      locale: "de",
      label: "Können wir der Prognose trauen?",
      withSkill: ["de-trauen-with-2", "de-trauen-with-3"],
      withoutSkill: ["de-trauen-without-1"],
      followUpLabel: "Nachfrage: Die Kantine hört auf",
      rejected: 6,
    },
    {
      id: "trust",
      locale: "en",
      label: "Can we trust the forecast?",
      withSkill: ["en-trust-with-1"],
      withoutSkill: [],
      followUpLabel: "Follow-up: the canteen stops",
      rejected: 1,
    },
  ],
  recordings: [deWith2, deWith3, deWithout1, enWith1] as unknown as readonly ClaudeRecording[],
  notes: {
    de: [
      "Ohne Skill nannte Claude 720 Gläser. Mit Skill waren es in beiden Aufnahmen 748, die Planzahl aus Schritt 4.",
      "Nach der Nachfrage zur Kantine kamen ohne Skill 690 Gläser heraus, mit Skill in beiden Aufnahmen 729.",
      "Nur mit Skill hat Claude die Prüfregel als Datei geschrieben und gefragt, wer in roten Wochen entscheidet.",
    ],
    en: [
      "With the skill Claude named 748 jars, and 729 after the follow-up, the order quantities of step 4.",
      "It wrote the release rule as a file and asked who decides in red weeks.",
    ],
  },
};
