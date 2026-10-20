import { cx } from "@/components/werk/cx";
import { textWidth } from "@/lib/figures/svg";
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
  /**
   * Keep the whole string inside its box: the art is drawn in a view box as wide as the string and scaled to the
   * box (anchored bottom right), so a longer value ("46 %") is shown whole instead of bleeding off the edges.
   */
  readonly fit?: boolean;
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
export function PosterNumeral({ value, plakat, format = "band", fit = false, className }: PosterNumeralProps) {
  const { numWeight } = PLAKAT[plakat];
  const tracking = numWeight === 400 ? "-0.05em" : "-0.065em";
  if (fit) {
    const size = format === "band" ? 416 : 208;
    const text = String(value);
    const trackingEm = numWeight === 400 ? -0.05 : -0.065;
    const width = Math.ceil((textWidth(text, 1, 800) + trackingEm * [...text].length) * size * 1.06) + Math.round(size * 0.08);
    const height = Math.round(size * 0.98);
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        data-poster-numeral={format}
        data-poster-numeral-fit=""
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMaxYMax meet"
        className={cx(plakatClass(plakat), "block size-full overflow-hidden", className)}
      >
        <text
          x={width - Math.round(size * 0.04)}
          y={Math.round(size * 0.84)}
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
