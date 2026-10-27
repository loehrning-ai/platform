/**
 * The Claude scene of W06: recorded runs of Claude Code with the take-home skill
 * angebote-vergleichen and the kit's case files. One prompt per language, byte for byte the same in
 * every take, so the attached files are the only difference: the request and the three offers
 * ("ohne-saetze"), and the same plus Brandtwerk's own freight and storage rates ("mit-saetzen").
 * Each set with and without the skill. Never edit a take; record a new one with
 * scripts/demos/record-claude-run.mjs.
 *
 * Takes set aside stay in rejected/ with their reason in "rejected" and are counted per prompt,
 * with the reason shown beside the count. Thirteen were refused by the recorder because its first
 * per-command allowlist denied an ordinary shell loop; the later takes ran in the CLI sandbox (the
 * recorder's --allow-python since W01's change). Two (de-ohne-saetze-without-2,
 * en-mit-saetzen-without-1) were set aside by hand, unedited apart from that reason: Claude listed
 * an empty workspace in them and never saw the attached files. None was set aside for its answer.
 * The notes are per question and say only what the listed takes say.
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
      rejectedReason: "5, weil unser Aufnahmeskript einen Befehl blockierte, 1, weil Claude die Dateien nicht sah, keine wegen der Antwort",
      notes: [
        "Mit Skill nennt Claude in allen drei Aufnahmen keinen Gewinner. Es lässt Fracht und Lager bei B und C offen und fragt nach unseren Sätzen.",
        "Ohne Skill schätzt Claude selbst, wie viel Fracht B und C vertragen, und rät am Ende zu B oder A. Dass C mit allen Kosten am günstigsten ist, steht in dieser Antwort nicht.",
      ],
    },
    {
      id: "mit-saetzen",
      locale: "de",
      label: FILE_SET_LABELS.de["mit-saetzen"],
      withSkill: ["de-mit-saetzen-with-3"],
      withoutSkill: ["de-mit-saetzen-without-4", "de-mit-saetzen-without-5"],
      rejected: 5,
      rejectedReason: "alle, weil unser Aufnahmeskript einen Befehl blockierte, keine wegen der Antwort",
      notes: [
        "Mit unseren Sätzen kommen alle drei Aufnahmen auf dieselben Summen wie du: C am günstigsten, dann A, dann B.",
        "Mit Skill steht zu jeder Zahl die Stelle im Dokument. Ohne Skill endet die Antwort mit einer Empfehlung, die vom Papierpreis abhängt.",
      ],
    },
    {
      id: "ohne-saetze",
      locale: "en",
      label: FILE_SET_LABELS.en["ohne-saetze"],
      withSkill: ["en-ohne-saetze-with-2"],
      withoutSkill: ["en-ohne-saetze-without-2"],
      rejected: 2,
      rejectedReason: "both because our recording script blocked a command, none because of the answer",
      notes: [
        "With the skill, Claude names no winner. It leaves freight and storage open for B and C and asks for our rates.",
        "Without the skill, Claude estimates the freight itself and says it wouldn't pick Kartovka, offer C. With our rates, C is the cheapest of the three.",
      ],
    },
    {
      id: "mit-saetzen",
      locale: "en",
      label: FILE_SET_LABELS.en["mit-saetzen"],
      withSkill: ["en-mit-saetzen-with-2"],
      withoutSkill: ["en-mit-saetzen-without-2"],
      rejected: 2,
      rejectedReason: "1 because our recording script blocked a command, 1 because Claude didn't see the files, none because of the answer",
      notes: [
        "With our rates, both answers reach the same totals as you: C cheapest, then A, then B.",
        "With the skill, every number names its place in the documents. Without it, the answer ends with a recommendation that depends on the paper price.",
      ],
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
};
