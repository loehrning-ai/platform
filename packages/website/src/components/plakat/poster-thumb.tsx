import { cx } from "@/components/werk/cx";
import type { MotifId, PlakatKey } from "@/lib/plakat/palettes";
import { PosterArt } from "./poster-art";

export type PosterThumbSize = "xs" | "sm" | "md" | "cover";

/**
 * Widths of the 4:5 poster box (SPEC §3.4):
 * - xs 64 x 80: the next-proof card on /kurse.
 * - sm 72 x 90 on phones, 80 x 100 from sm, 96 x 120 from lg: /kurse ledger rows.
 * - md 80 x 100: workshop hub rows on phones.
 * - cover: the column's width (PosterCover).
 */
export const POSTER_THUMB_SIZE: Readonly<Record<PosterThumbSize, string>> = {
  xs: "w-16",
  sm: "w-[4.5rem] sm:w-20 lg:w-24",
  md: "w-20",
  cover: "w-full",
};

export type PosterThumbProps = {
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
  /** "01" to "04" where a sequence exists; Technikkurse carry none (SPEC D9). */
  readonly numeral?: string | null;
  readonly size?: PosterThumbSize;
  readonly cornerDots?: boolean;
  readonly className?: string;
};

/**
 * A mini poster beside a row's title. Decorative: the row's heading and link
 * carry the name, so it is aria-hidden and never focusable (a focusable
 * poster would need an inset ring, SPEC §3.9). No radius, no shadow: the
 * poster's own ground is its edge, except IDEA: Kreide on Kalkweiß is
 * 1.05:1 (SPEC §1.1 "never a card on Kalkweiß"), so its edge is a 1px Kobalt
 * hairline drawn over the art, and the corner dots sit inside a visible
 * object.
 */
export function PosterThumb({
  plakat,
  motif,
  numeral = null,
  size = "md",
  cornerDots,
  className,
}: PosterThumbProps) {
  return (
    <span
      aria-hidden="true"
      data-poster-thumb=""
      className={cx(
        "relative block aspect-[4/5] shrink-0 overflow-hidden",
        plakat === "idea" && "after:pointer-events-none after:absolute after:inset-0 after:border after:border-kobalt after:content-['']",
        POSTER_THUMB_SIZE[size],
        className,
      )}
    >
      <PosterArt
        plakat={plakat}
        motif={motif}
        numeral={numeral}
        format="portrait"
        {...(cornerDots === undefined ? {} : { cornerDots })}
      />
    </span>
  );
}
