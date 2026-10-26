import type { Beat } from "@/lib/demo-beats";

/**
 * The guided path of workshop 04, the same red line as deck and kit: the
 * shelf card and its quotes (commit, reveal), rewriting the claim (tool), the
 * electricity file, the late invoice and the folder (apply, kit steps 1 to
 * 5), the visitor's own file (own) and the take-home. Plain data, both
 * languages. The kit files differ per edition (ordner/ and files/), so the
 * beats name no single kitFile; the stage quotes both zips (kit-text.ts).
 * Nothing runs on its own: every beat waits for the finger, so seconds is 0.
 */
export const BEATS: readonly Beat[] = [
  {
    id: "regalkarte",
    kind: "commit",
    seconds: 0,
    label: { de: "Regalkarte", en: "Shelf card" },
    step: { de: "Du entscheidest über eine Regalkarte.", en: "You decide on a shelf card." },
  },
  {
    id: "zitate",
    kind: "reveal",
    seconds: 0,
    label: { de: "Zitate", en: "Quotes" },
    step: { de: "Du verbindest Werbeaussage und Zeilen.", en: "You link the claim to its lines." },
    nextName: { de: "die Zitate", en: "the quotes" },
  },
  {
    id: "umschreiben",
    kind: "tool",
    seconds: 0,
    label: { de: "Umschreiben", en: "Rewrite" },
    step: { de: "Du schreibst die Werbeaussage um.", en: "You rewrite the claim." },
    nextName: { de: "das Umschreiben", en: "the rewrite" },
  },
  {
    id: "strom",
    kind: "apply",
    seconds: 0,
    label: { de: "Stromdatei", en: "Electricity file" },
    step: { de: "Du prüfst die Zahl für die Bank.", en: "You check the figure for the bank." },
    nextName: { de: "die Stromdatei", en: "the electricity file" },
  },
  {
    id: "rechnung",
    kind: "apply",
    seconds: 0,
    label: { de: "Rechnung", en: "Invoice" },
    step: { de: "Du legst die Rechnung in die Lücke.", en: "You put the invoice into the gap." },
    nextName: { de: "die Septemberrechnung", en: "the September invoice" },
  },
  {
    id: "ordner",
    kind: "apply",
    seconds: 0,
    label: { de: "Ordner", en: "Folder" },
    step: { de: "Du siehst, was an jeder Datei hängt.", en: "You see what depends on each file." },
    nextName: { de: "der Ordner", en: "the folder" },
  },
  {
    id: "deine-datei",
    kind: "own",
    seconds: 0,
    label: { de: "Deine Datei", en: "Your file" },
    step: { de: "Du prüfst deine eigene Stromdatei.", en: "You check your own electricity file." },
    nextName: { de: "deine Datei", en: "your file" },
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Mitnehmen", en: "Take home" },
    step: { de: "Du nimmst Skill und Vorlagen mit.", en: "You take the skill and the templates." },
    nextName: { de: "zum Mitnehmen", en: "to take home" },
  },
];

export type BeatId = "regalkarte" | "zitate" | "umschreiben" | "strom" | "rechnung" | "ordner" | "deine-datei" | "mitnehmen";
