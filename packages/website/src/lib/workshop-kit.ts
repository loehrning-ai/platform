/**
 * The kit block of a workshop: everything the dedicated kit page
 * (/workshops/<slug>/kit) shows. A workshop that has a `kit` gets that page and
 * nothing else to write: the route and the renderer
 * (src/components/workshops/kit-page.tsx) are generic.
 *
 * What the block does NOT repeat: the zip's path and size live in the
 * workshop's `kit` material (role "kit", kind "zip"); the page reads them
 * from there, so a re-published kit changes one place.
 *
 * Rules for the copy, same as the rest of the catalogue: every number is
 * printed in the workshop's deck or kit, no dashes as punctuation, real
 * umlauts, fictional data stated as fictional.
 */

/**
 * How a status looks. The word always carries the meaning; the look only
 * repeats it (a filled square, an outline, a solid Mennige block).
 * - ok: proven (OK, GREEN)
 * - check: uncertain (NEEDS CHECK, AMBER)
 * - missing: not provable (NOT FOUND, RED)
 * - partial: partly proven (hatched)
 * - ink / accent: plain quantities, e.g. a total and the part that was missing
 */
export type WorkshopKitTone = "ok" | "check" | "missing" | "partial" | "ink" | "accent";

export const WORKSHOP_KIT_TONES: readonly WorkshopKitTone[] = [
  "ok",
  "check",
  "missing",
  "partial",
  "ink",
  "accent",
];

/** One block of a proportional strip; its width follows `value`. */
export interface WorkshopKitSegment {
  readonly tone: WorkshopKitTone;
  /** The status word or the quantity's name, as the kit prints it ("OK", "NOT FOUND", "September"). */
  readonly label: string;
  readonly value: number;
  /** Shown in the block and the legend; defaults to the plain value. */
  readonly display?: string;
}

/** One prompt of the kit, as a step of the explainer. */
export interface WorkshopKitStep {
  /** Short tab label: "Prompt 1". */
  readonly tag: string;
  readonly title: string;
  /** What goes in: the file or request attached to the prompt. */
  readonly input: string;
  /** What Claude does with it. */
  readonly action: string;
  /** What comes out. */
  readonly output: string;
  /** Name of a file Claude writes, shown as a chip under the output. */
  readonly file?: string;
  /** Statuses or quantities as one proportional strip with a legend. */
  readonly segments?: readonly WorkshopKitSegment[];
  /** One calculation line: `text` in ink, `result` in the accent. */
  readonly line?: { readonly text: string; readonly result: string };
  /** One sentence under the result: what to notice. */
  readonly note?: string;
}

export interface WorkshopKitStat {
  readonly value: string;
  readonly label: string;
}

export interface WorkshopKitContent {
  readonly name: string;
  readonly description: string;
}

export interface WorkshopKit {
  /** Published file name of the zip; must equal the end of the kit material's href. */
  readonly fileName: string;
  /** H1 of the kit page. */
  readonly title: string;
  /** One or two sentences under the H1. */
  readonly lead: string;
  /** The big numbers ("13 Dateien", "5 Prompts", "3 Regeln"). */
  readonly stats: readonly WorkshopKitStat[];
  /** Heading of the rules block, e.g. "Die drei Regeln". */
  readonly rulesHeading: string;
  readonly rules: readonly string[];
  /** Heading of the explainer, e.g. "Fünf Prompts, ein Ergebnis nach dem anderen". */
  readonly stepsHeading: string;
  readonly steps: readonly WorkshopKitStep[];
  /** One line: what Claude needs and that the files are transferred to Claude. */
  readonly howTo: string;
  /** One line: the data is invented. */
  readonly fictionalNote: string;
  /** What is inside the zip, one entry per top-level file or folder. */
  readonly contents: readonly WorkshopKitContent[];
}

/** The path of a workshop's kit page, without locale prefix. */
export function workshopKitPath(slug: string): string {
  return `/workshops/${slug}/kit`;
}
