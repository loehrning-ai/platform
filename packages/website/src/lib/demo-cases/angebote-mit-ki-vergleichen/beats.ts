import type { Beat } from "@/lib/demo-beats";

/**
 * The red line of workshop 06 on the v4 shell, the same in deck, kit and demo: a guess on the
 * printed prices (commit), the basis built field by field in the field card's order (reveal, five
 * moves, the method sheet at its end), the paper index of offer C with a cap (apply), the visitor's
 * own offers (own) and the take-home with the Claude scene. rotfaden's separate method beat folded
 * into the end of the basis beat; ?beat=methode still opens it there. Every kitFile is a path in
 * angebote-vergleichen-kit.zip (config.test.ts).
 *
 * The paper beat has no nextName on purpose: during the basis beat "Weiter" moves through the
 * five fields first, so it must not name the paper price.
 */
const KIT = "angebote-vergleichen-kit";

export const BEATS: readonly Beat[] = [
  {
    id: "tipp",
    kind: "commit",
    seconds: 0.6,
    label: { de: "Schätzen", en: "Guess" },
    step: { de: "Du schätzt das günstigste Angebot.", en: "You guess the cheapest offer." },
    kitFile: `${KIT}/kostenzeilen.csv`,
  },
  {
    id: "kipp",
    kind: "reveal",
    seconds: 0.6,
    label: { de: "Basis", en: "Basis" },
    step: { de: "Du legst die Basis fest, Feld für Feld.", en: "You fix the basis, one field at a time." },
    nextName: { de: "die Menge", en: "the quantity" },
    kitFile: `${KIT}/karten/feldkarte.md`,
  },
  {
    id: "papier",
    kind: "apply",
    seconds: 0.6,
    label: { de: "Papierpreis", en: "Paper price" },
    step: { de: "Du lässt den Papierpreis bei C steigen.", en: "You raise the paper price at offer C." },
    kitFile: `${KIT}/fall/angebot-c-brno.md`,
  },
  {
    id: "deins",
    kind: "own",
    seconds: 0,
    label: { de: "Deine Angebote", en: "Your offers" },
    step: { de: "Du vergleichst deine eigenen Angebote.", en: "You compare offers of your own." },
    nextName: { de: "deine Angebote", en: "your offers" },
    kitFile: `${KIT}/fall/zweiter-fall.csv`,
  },
  {
    id: "mitnehmen",
    kind: "takehome",
    seconds: 0,
    label: { de: "Dein Claude", en: "For your Claude" },
    step: { de: "Du nimmst die Methode für deinen Claude mit.", en: "You take the method to your own Claude." },
    nextName: { de: "für deinen Claude", en: "for your Claude" },
    kitFile: `${KIT}/vorlagen/vergleichsbasis.md`,
  },
];

export type BeatId = "tipp" | "kipp" | "papier" | "deins" | "mitnehmen";
