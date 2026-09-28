import type { MotifId, PlakatKey } from "@/lib/plakat/palettes";
import { PosterThumb } from "./poster-thumb";

export type PosterCoverProps = {
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
  readonly numeral?: string | null;
  readonly className?: string;
};

/**
 * The 4:5 poster of a workshop in the hub list from md: it takes its grid
 * column's width (md 14rem, lg 18rem) and stands on Kalkweiß like the
 * reference posters, each in its own palette. Decorative (aria-hidden); the
 * row's heading names the workshop.
 */
export function PosterCover({ plakat, motif, numeral = null, className }: PosterCoverProps) {
  return <PosterThumb plakat={plakat} motif={motif} numeral={numeral} size="cover" className={className} />;
}
