import type { DimensionId } from "@/lib/ki-check/types";

/**
 * One palette hue per competency field, so colour on this route carries
 * meaning instead of decorating. The rail item, the question's field chip and
 * the result breakdown all read the same map, which is what lets a learner
 * recognise "this is the Recht field" by colour alone across three different
 * views of the same run.
 *
 * Tints stay low (12 to 18 percent over paper) because five of them stack
 * vertically in the rail; the surrounding routes use the same restraint for
 * the same reason. Every pairing below prints foreground or muted-foreground
 * ink and clears AA at these strengths.
 */
interface DimensionTone {
  /** Wash for the active rail item and the field chip. */
  readonly wash: string;
  /** 3px edge marker that pairs with the wash. */
  readonly edge: string;
  /** Solid swatch for the compact field key. */
  readonly solid: string;
}

const TONES: Readonly<Record<DimensionId, DimensionTone>> = {
  grundlagen: {
    wash: "bg-brand-acid/18",
    edge: "border-l-brand-acid",
    solid: "bg-brand-acid",
  },
  urteil: {
    wash: "bg-brand-sky/18",
    edge: "border-l-brand-sky",
    solid: "bg-brand-sky",
  },
  recht: {
    wash: "bg-brand-pink/18",
    edge: "border-l-brand-pink",
    solid: "bg-brand-pink",
  },
  verantwortung: {
    wash: "bg-brand-peach/18",
    edge: "border-l-brand-peach",
    solid: "bg-brand-peach",
  },
  praxis: {
    wash: "bg-brand-teal/12",
    edge: "border-l-brand-teal",
    solid: "bg-brand-teal",
  },
};

export function dimensionTone(id: DimensionId): DimensionTone {
  return TONES[id];
}

/**
 * Answer options are an ordered self-assessment scale, not four unrelated
 * choices. The rung meter fills to the option's Likert score so the ladder is
 * visible before anything is picked; the ink deepens with the rung so the
 * column reads as a progression down the list.
 */
export const RUNG_INK = [
  "bg-muted-foreground/35",
  "bg-muted-foreground/55",
  "bg-brand-orange/70",
  "bg-brand-orange",
] as const;
