/**
 * The Claude scene of W01: recorded runs of Claude Code on the kit's data
 * files, with the skill prognose-pruefen and without it. The "trauen" takes
 * end with the recorded second turn about the canteen. Never edit a take;
 * record a new one with scripts/demos/record-claude-run.mjs (see the builder
 * guide). Takes that broke the honesty rules (a denied tool call, a machine
 * path) stay in rejected/ and are counted. Two early takes that wrote to
 * Claude's memory folder under a temp path were deleted instead, because the
 * publication scan rejects that path; they are not in the count.
 *
 * Takes 1 to 5 were recorded with a narrow tool allowlist and auto-memory on.
 * Later takes ran Bash in the CLI sandbox (no network, writes only in the
 * workspace) with auto-memory off.
 *
 * The notes ("Unsere Notiz") say only what the listed takes show: the
 * quantities and weeks each take named and whether it wrote the release rule.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import deWith2 from "./de-trauen-with-2.json";
import deWith3 from "./de-trauen-with-3.json";
import deWith6 from "./de-trauen-with-6.json";
import deWithout1 from "./de-trauen-without-1.json";
import deWithout6 from "./de-trauen-without-6.json";
import deWithout7 from "./de-trauen-without-7.json";
import deWannWith2 from "./de-wann-with-2.json";
import deWannWithout1 from "./de-wann-without-1.json";
import enWith1 from "./en-trust-with-1.json";
import enWithout2 from "./en-trust-without-2.json";
import enWhenWith1 from "./en-when-with-1.json";
import enWhenWithout1 from "./en-when-without-1.json";

export const SCENE: ClaudeSceneData | null = {
  slug: "ki-prognosen-einschaetzen",
  prompts: [
    {
      id: "trauen",
      locale: "de",
      label: "Können wir der Prognose trauen?",
      withSkill: ["de-trauen-with-2", "de-trauen-with-3", "de-trauen-with-6"],
      withoutSkill: ["de-trauen-without-1", "de-trauen-without-6", "de-trauen-without-7"],
      followUpLabel: "Nachfrage: Die Kantine hört auf",
      rejected: 6,
    },
    {
      id: "wann",
      locale: "de",
      label: "Wann hätten wir nicht folgen dürfen?",
      withSkill: ["de-wann-with-2"],
      withoutSkill: ["de-wann-without-1"],
      rejected: 1,
    },
    {
      id: "trust",
      locale: "en",
      label: "Can we trust the forecast?",
      withSkill: ["en-trust-with-1"],
      withoutSkill: ["en-trust-without-2"],
      followUpLabel: "Follow-up: the canteen stops",
      rejected: 1,
    },
    {
      id: "when",
      locale: "en",
      label: "When should we not have followed it?",
      withSkill: ["en-when-with-1"],
      withoutSkill: ["en-when-without-1"],
    },
  ],
  recordings: [
    deWith2,
    deWith3,
    deWith6,
    deWithout1,
    deWithout6,
    deWithout7,
    deWannWith2,
    deWannWithout1,
    enWith1,
    enWithout2,
    enWhenWith1,
    enWhenWithout1,
  ] as unknown as readonly ClaudeRecording[],
  notes: {
    de: [
      "Zur Frage, ob wir der Prognose trauen können, nannte Claude ohne Skill in drei Aufnahmen 720, 740 und 735 Gläser. Nach der Nachfrage zur Kantine waren es 690, 700 und 705.",
      "Mit Skill waren es in allen drei Aufnahmen 748 und danach 729, die Planzahlen aus Schritt 4. Nur mit Skill hat Claude die Prüfregel als Datei geschrieben und gefragt, wer in roten Wochen entscheidet.",
      "Bei der Frage, wann wir nicht hätten folgen dürfen, zählte Claude mit Skill die roten Wochen der Prüfregel. Das waren der 03.02. und der 21.04. bis 21.07. Ohne Skill nannte es die Wochen nach der Auslistung, den 07.04. bis etwa 09.06., und riet, von Hand rund 70 Gläser abzuziehen.",
    ],
    en: [
      "Asked whether we can trust the forecast, Claude without the skill said 740 to 750 jars, and about 710 after the follow-up about the canteen.",
      "With the skill it named 748 jars, and 729 after the follow-up, the order quantities of step 4. Only with the skill did Claude write the release rule as a file and ask who decides in red weeks.",
      "Asked when we should not have followed the forecast, Claude with the skill counted the red weeks of the release rule. Those were 3 February and 7 April to 21 July. Without the skill it picked 7 April and 19 May, the two weeks where something was known in advance.",
    ],
  },
};
