/**
 * The Claude scene of W04: recorded runs of Claude Code on the kit's files,
 * once with the skill esg-nachweise and once without it, two takes each.
 * Never edit a take; record a new one with scripts/demos/record-claude-run.mjs.
 * Takes set aside stay in rejected/ and are counted: the first ones ran under
 * a per-command Bash allowlist that denied ordinary loops, and the takes
 * recorded alongside them used different tools, so all of them were replaced.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import t_de_bio_with_5 from "./de-bio-with-5.json";
import t_de_bio_with_6 from "./de-bio-with-6.json";
import t_de_bio_without_5 from "./de-bio-without-5.json";
import t_de_bio_without_6 from "./de-bio-without-6.json";
import t_de_rechnung_with_1 from "./de-rechnung-with-1.json";
import t_de_rechnung_with_2 from "./de-rechnung-with-2.json";
import t_de_rechnung_without_1 from "./de-rechnung-without-1.json";
import t_de_rechnung_without_2 from "./de-rechnung-without-2.json";
import t_de_strom_with_6 from "./de-strom-with-6.json";
import t_de_strom_with_7 from "./de-strom-with-7.json";
import t_de_strom_without_5 from "./de-strom-without-5.json";
import t_de_strom_without_6 from "./de-strom-without-6.json";
import t_en_bio_with_1 from "./en-bio-with-1.json";
import t_en_bio_with_2 from "./en-bio-with-2.json";
import t_en_bio_without_1 from "./en-bio-without-1.json";
import t_en_bio_without_2 from "./en-bio-without-2.json";
import t_en_rechnung_with_1 from "./en-rechnung-with-1.json";
import t_en_rechnung_with_2 from "./en-rechnung-with-2.json";
import t_en_rechnung_without_1 from "./en-rechnung-without-1.json";
import t_en_rechnung_without_2 from "./en-rechnung-without-2.json";
import t_en_strom_with_1 from "./en-strom-with-1.json";
import t_en_strom_with_2 from "./en-strom-with-2.json";
import t_en_strom_without_1 from "./en-strom-without-1.json";
import t_en_strom_without_2 from "./en-strom-without-2.json";

export const SCENE: ClaudeSceneData | null = {
  slug: "esg-berichte-mit-ki",
  prompts: [
    {
      id: "strom",
      locale: "de",
      label: "Was tragen wir für Strom 2025 ein?",
      withSkill: ["de-strom-with-6", "de-strom-with-7"],
      withoutSkill: ["de-strom-without-5", "de-strom-without-6"],
      rejected: 9,
    },
    {
      id: "bio",
      locale: "de",
      label: "Darf die Regalkarte so an alle Weine?",
      withSkill: ["de-bio-with-5", "de-bio-with-6"],
      withoutSkill: ["de-bio-without-5", "de-bio-without-6"],
      rejected: 8,
    },
    {
      id: "rechnung",
      locale: "de",
      label: "Was ändert die Septemberrechnung?",
      withSkill: ["de-rechnung-with-1", "de-rechnung-with-2"],
      withoutSkill: ["de-rechnung-without-1", "de-rechnung-without-2"],
    },
    {
      id: "strom",
      locale: "en",
      label: "What do we enter for electricity 2025?",
      withSkill: ["en-strom-with-1", "en-strom-with-2"],
      withoutSkill: ["en-strom-without-1", "en-strom-without-2"],
    },
    {
      id: "bio",
      locale: "en",
      label: "Can the shelf card go next to every wine?",
      withSkill: ["en-bio-with-1", "en-bio-with-2"],
      withoutSkill: ["en-bio-without-1", "en-bio-without-2"],
    },
    {
      id: "rechnung",
      locale: "en",
      label: "What does the September invoice change?",
      withSkill: ["en-rechnung-with-1", "en-rechnung-with-2"],
      withoutSkill: ["en-rechnung-without-1", "en-rechnung-without-2"],
    },
  ],
  recordings: [
    t_de_bio_with_5 as unknown as ClaudeRecording,
    t_de_bio_with_6 as unknown as ClaudeRecording,
    t_de_bio_without_5 as unknown as ClaudeRecording,
    t_de_bio_without_6 as unknown as ClaudeRecording,
    t_de_rechnung_with_1 as unknown as ClaudeRecording,
    t_de_rechnung_with_2 as unknown as ClaudeRecording,
    t_de_rechnung_without_1 as unknown as ClaudeRecording,
    t_de_rechnung_without_2 as unknown as ClaudeRecording,
    t_de_strom_with_6 as unknown as ClaudeRecording,
    t_de_strom_with_7 as unknown as ClaudeRecording,
    t_de_strom_without_5 as unknown as ClaudeRecording,
    t_de_strom_without_6 as unknown as ClaudeRecording,
    t_en_bio_with_1 as unknown as ClaudeRecording,
    t_en_bio_with_2 as unknown as ClaudeRecording,
    t_en_bio_without_1 as unknown as ClaudeRecording,
    t_en_bio_without_2 as unknown as ClaudeRecording,
    t_en_rechnung_with_1 as unknown as ClaudeRecording,
    t_en_rechnung_with_2 as unknown as ClaudeRecording,
    t_en_rechnung_without_1 as unknown as ClaudeRecording,
    t_en_rechnung_without_2 as unknown as ClaudeRecording,
    t_en_strom_with_1 as unknown as ClaudeRecording,
    t_en_strom_with_2 as unknown as ClaudeRecording,
    t_en_strom_without_1 as unknown as ClaudeRecording,
    t_en_strom_without_2 as unknown as ClaudeRecording,
  ],
  notes: {
    de: [
      "Mit und ohne Skill findet Claude den doppelten Oktober und den fehlenden September.",
      "Mit dem Skill nennt Claude für jede Antwort Datei, Zeile, Status und das fehlende Dokument und trägt keine geschätzte Jahreszahl ein.",
      "Ohne den Skill schlägt Claude in einer Aufnahme eine Schätzung von 315 bis 318 MWh vor. Die echte Septemberrechnung ergibt 320,9 MWh.",
    ],
    en: [
      "With and without the skill, Claude finds the doubled October and the missing September.",
      "With the skill, Claude gives file, line, status and the missing document for every answer and enters no estimated yearly figure.",
      "Without the skill, one take suggests an estimate of about 315 MWh. The real September invoice gives 320.9 MWh.",
    ],
  },
};
