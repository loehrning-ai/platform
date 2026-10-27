/**
 * The Claude scene of W02: recorded runs of Claude Code with the take-home
 * skill kennzahlen-steckbrief and four files of the kit (the September
 * report and the three CSVs), each question with and without the skill, in
 * both languages. Never edit a take; record a new one with
 * scripts/demos/record-claude-run.mjs. Takes that broke the honesty rules
 * (mostly a shell command outside the allowed list) stay in rejected/ and are
 * counted per question.
 */

import type { ClaudeRecording, ClaudeSceneData } from "@/lib/claude-runs";
import deMarketingWith6 from "./de-marketing-with-6.json";
import deMarketingWithout1 from "./de-marketing-without-1.json";
import deQualitaetWith2 from "./de-qualitaet-with-2.json";
import deQualitaetWithout1 from "./de-qualitaet-without-1.json";
import deQualitaetWithout2 from "./de-qualitaet-without-2.json";
import enMarketingWith8 from "./en-marketing-with-8.json";
import enMarketingWithout2 from "./en-marketing-without-2.json";
import enQualityWith1 from "./en-quality-with-1.json";
import enQualityWithout1 from "./en-quality-without-1.json";

const take = (json: unknown) => json as ClaudeRecording;

export const SCENE: ClaudeSceneData | null = {
  slug: "geschaeftsberichte-mit-ki-lesen",
  prompts: [
    {
      id: "qualitaet",
      locale: "de",
      label: "Ist die Qualität besser geworden?",
      withSkill: ["de-qualitaet-with-2"],
      withoutSkill: ["de-qualitaet-without-1", "de-qualitaet-without-2"],
      rejected: 1,
    },
    {
      id: "marketing",
      locale: "de",
      label: "Mehr Marketing für die Linie?",
      withSkill: ["de-marketing-with-6"],
      withoutSkill: ["de-marketing-without-1"],
      rejected: 6,
    },
    {
      id: "quality",
      locale: "en",
      label: "Did quality improve?",
      withSkill: ["en-quality-with-1"],
      withoutSkill: ["en-quality-without-1"],
      rejected: 0,
    },
    {
      id: "marketing",
      locale: "en",
      label: "More marketing for the line?",
      withSkill: ["en-marketing-with-8"],
      withoutSkill: ["en-marketing-without-2"],
      rejected: 8,
    },
  ],
  recordings: [
    take(deQualitaetWith2),
    take(deQualitaetWithout1),
    take(deQualitaetWithout2),
    take(deMarketingWith6),
    take(deMarketingWithout1),
    take(enQualityWith1),
    take(enQualityWithout1),
    take(enMarketingWith8),
    take(enMarketingWithout2),
  ],
  notes: {
    de: [
      "Ohne Skill rechnet Claude mehrere Zählweisen nach und kommt zum selben Schluss. Welche Zählweise künftig gelten soll, schreibt es nicht fest.",
      "Mit Skill schreibt Claude zwei Definitionen der Defektrate als Steckbriefe auf und verfolgt die 2,51 bis zu den 23 Zeilen der Datei zurück. Am Ende fragt es euch, welche Definition gelten soll.",
      "Bei der Frage nach mehr Marketing raten beide Fassungen zur Nacharbeit. Mit Skill schreibt Claude den Auslöser ausdrücklich in Stück, weil sich Meldungen zusammenlegen lassen.",
    ],
    en: [
      "Without the skill, Claude recomputes several ways of counting and reaches the same conclusion. It doesn't write down which way of counting should apply from now on.",
      "With the skill, Claude shows two definitions of the defect rate side by side and names the filtered rows behind both figures. It says that no team definition was available and doesn't pick one for you.",
      "Asked about more marketing, both versions recommend rework first. With the skill, Claude writes the trigger in units on purpose, because a target based on records could be met by merging them.",
    ],
  },
};
