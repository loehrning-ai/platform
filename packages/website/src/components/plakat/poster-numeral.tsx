import { cx } from "@/components/werk/cx";
import { PLAKAT, plakatClass, type PlakatKey } from "@/lib/plakat/palettes";

export type PosterNumeralProps = {
  /** The figure, from data (the hub's workshop count). */
  readonly value: number | string;
  readonly plakat: PlakatKey;
  /**
   * band: the lg art column, a 26rem glyph. strip: the phone band strip,
   * 13rem, so the figure fills the 128px strip once the bottom edge cuts it.
   */
  readonly format?: "band" | "strip";
  readonly className?: string;
};

const FORMAT_CLASS = {
  band: "text-[26rem]",
  strip: "text-[13rem]",
} as const;

/**
 * The key numeral of a band (the workshops hub: "4", the workshop count), a
 * poster object in the scene's meaningful-mark colour (Ocker hell on Rost,
 * 3.24:1, display size only) at the palette's numeral weight. It sits against
 * the bottom-right corner of its box and bleeds off the right and bottom
 * edges, which are the band's own. Decorative: aria-hidden, the number is
 * stated in the band's caps line.
 */
export function PosterNumeral({ value, plakat, format = "band", className }: PosterNumeralProps) {
  const { numWeight } = PLAKAT[plakat];
  const tracking = numWeight === 400 ? "-0.05em" : "-0.065em";
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-poster-numeral={format}
      className={cx(plakatClass(plakat), "block size-full overflow-hidden", className)}
    >
      <text
        x="100%"
        y="100%"
        dx="0.02em"
        dy="0.14em"
        textAnchor="end"
        fontWeight={numWeight}
        letterSpacing={tracking}
        strokeWidth="0.05em"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        className={cx(FORMAT_CLASS[format], "fill-scene-mark stroke-scene-ground font-sans normal-nums")}
      >
        {value}
      </text>
    </svg>
  );
}
