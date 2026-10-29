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
    step: { de: "Claude prüft den Fragebogen. Ihr schätzt vorher und prüft nachher.", en: "Claude checks the questionnaire. You predict first and check afterwards." },
  },
  {
    id: "schritt-2",
    kind: "reveal",
    seconds: 0,
    label: { de: "Werbeaussagen", en: "Claims" },
    step: { de: "Claude prüft sieben Werbeaussagen. Welche dürfen raus?", en: "Claude checks seven marketing claims. Which may go out?" },
    nextName: { de: "die Werbeaussagen", en: "the claims" },
  },
  {
    id: "schritt-3",
    kind: "tool",
    seconds: 0,
    label: { de: "Bankformular", en: "Bank form" },
    step: { de: "Claude füllt das Bankformular aus. Ihr rechnet nach.", en: "Claude fills in the bank form. You check the maths." },
    nextName: { de: "das Bankformular", en: "the bank form" },
  },
  {
    id: "schritt-4",
    kind: "apply",
    seconds: 0,
    label: { de: "Register", en: "Register" },
    step: { de: "Claude bündelt alle Antworten im Register. Ihr prüft ihre Belege.", en: "Claude puts every answer into one register. You check the evidence." },
    nextName: { de: "das Register", en: "the register" },
  },
  {
    id: "schritt-5",
    kind: "apply",
    seconds: 0,
    label: { de: "Nachreichung", en: "Late invoice" },
    step: { de: "Die fehlende Stromrechnung kommt dazu. Welche Antworten ändern sich?", en: "The missing electricity bill arrives. Which answers change?" },
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
    label: { de: "Für zu Hause", en: "At home" },
    step: { de: "Für nach dem Workshop: den Skill im eigenen Claude einrichten.", en: "After the workshop: set up the skill in your own Claude." },
    nextName: { de: "die Anleitung für zu Hause", en: "the setup for home" },
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
