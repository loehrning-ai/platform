import type { Beat } from "@/lib/demo-beats";

/**
 * The guided path of workshop 04, the deck's red line: the kit's five steps
 * in the depicted Claude app (questionnaire, marketing claims, bank form,
 * register, late invoice), then the measured time, the visitor's own Claude
 * (install the skill, use it on your own files) and the take-home. Plain
 * data, both languages. The kit files differ per edition, so the beats name
 * no single kitFile; app-steps.ts names the attached files per edition.
 * Nothing runs on its own: the visitor sends every prompt, so seconds is 0.
 */
export const BEATS: readonly Beat[] = [
  {
    id: "schritt-1",
    kind: "commit",
    seconds: 0,
    label: { de: "Fragebogen", en: "Questionnaire" },
    step: { de: "Du schickst den Fragebogen des Importeurs an Claude.", en: "You send the importer's questionnaire to Claude." },
  },
  {
    id: "schritt-2",
    kind: "reveal",
    seconds: 0,
    label: { de: "Werbeaussagen", en: "Claims" },
    step: { de: "Du lässt Claude die sieben Werbeaussagen prüfen.", en: "You have Claude check the seven marketing claims." },
    nextName: { de: "die Werbeaussagen", en: "the claims" },
  },
  {
    id: "schritt-3",
    kind: "tool",
    seconds: 0,
    label: { de: "Bankformular", en: "Bank form" },
    step: { de: "Du lässt Claude das Formular der Bank ausfüllen.", en: "You have Claude fill in the bank's form." },
    nextName: { de: "das Bankformular", en: "the bank form" },
  },
  {
    id: "schritt-4",
    kind: "apply",
    seconds: 0,
    label: { de: "Register", en: "Register" },
    step: { de: "Du lässt Claude alle Antworten in ein Register schreiben.", en: "You have Claude put every answer into one register." },
    nextName: { de: "das Register", en: "the register" },
  },
  {
    id: "schritt-5",
    kind: "apply",
    seconds: 0,
    label: { de: "Nachreichung", en: "Late invoice" },
    step: { de: "Du gibst Claude die Stromrechnung, die gefehlt hat.", en: "You give Claude the electricity bill that was missing." },
    nextName: { de: "die Nachreichung", en: "the late invoice" },
  },
  {
    id: "gemessen",
    kind: "apply",
    seconds: 0,
    label: { de: "Gemessen", en: "Measured" },
    step: { de: "Du siehst, wie lange die fünf Schritte gedauert haben.", en: "You see how long the five steps took." },
    nextName: { de: "die Messung", en: "the measurement" },
  },
  {
    id: "dein-claude",
    kind: "own",
    seconds: 0,
    label: { de: "Dein Claude", en: "Your Claude" },
    step: { de: "Du richtest den Skill in deinem eigenen Claude ein.", en: "You set up the skill in your own Claude." },
    nextName: { de: "dein Claude", en: "your Claude" },
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    step: { de: "Du lädst Skill, Kit und Vorlagen herunter.", en: "You download the skill, the kit and the templates." },
    nextName: { de: "zum Mitnehmen", en: "to take home" },
  },
];

export type BeatId = "schritt-1" | "schritt-2" | "schritt-3" | "schritt-4" | "schritt-5" | "gemessen" | "dein-claude" | "mitnehmen";
