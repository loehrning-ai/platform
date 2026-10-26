/**
 * The Claude scene of W01: recorded runs of Claude Code with the skill
 * prognose-pruefen and the kit's three data files. Never edit a take; record
 * a new one with scripts/demos/record-claude-run.mjs (see the builder guide).
 * Takes that broke the honesty rules stay in rejected/ and are counted.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import take3 from "./de-trauen-with-3.json";

export const SCENE: ClaudeSceneData | null = {
  slug: "ki-prognosen-einschaetzen",
  prompts: [
    {
      id: "trauen",
      locale: "de",
      label: "Können wir der Prognose trauen?",
      withSkill: ["de-trauen-with-3"],
      withoutSkill: [],
      followUpLabel: "Nachfrage: Die Kantine hört auf",
      rejected: 2,
    },
  ],
  recordings: [take3 as unknown as ClaudeRecording],
};
