import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The band's height and its offset from the top of each line's content-area
 * box, both in em. An inline box-decoration-clone span's default background
 * positioning area tracks font ascent+descent (1.2em for Figtree), not
 * `line-height`, so a full-height background would overlap between wrapped
 * lines at display leading (0.9 to 0.92). The stripe is sized and placed
 * instead: Figtree's baseline sits 0.95em below the top of the content area
 * and its capitals 0.70em tall, so 0.19em to 1.03em covers the capitals with
 * 0.06em above and 0.08em below the baseline. The tail of a word on the band
 * (letters, never descenders) therefore sits fully on it. The only
 * non-overlap rule is that the height stays under the line-height stride, so
 * adjacent lines' bands keep a gap of stride minus height (0.06em at the
 * hub's 0.9, 0.08em at the poster's 0.92).
 */
export const HIGHLIGHT_BAND_HEIGHT_EM = 0.84;
export const HIGHLIGHT_BAND_OFFSET_EM = 0.19;

interface HighlightedTextProps {
  readonly children: ReactNode;
  /** A `--color-*` custom property name, e.g. "--color-brand-acid". */
  readonly colorVar: `--color-${string}`;
  /** Opacity percentage (0-100) applied via color-mix, matching Tailwind's own opacity-modifier output. */
  readonly opacity?: number;
  /** A `--color-*` custom property for the words on the band; the page text colour when left out. */
  readonly textColorVar?: `--color-${string}`;
  readonly className?: string;
}

/**
 * A marker-pen text highlight painted as a sized/positioned background-image
 * stripe instead of relying on the inline element's own content-area
 * background -- so the band's height is explicit and font-metric-independent
 * rather than tracking ascent+descent. Server-only, no motion.
 */
export function HighlightedText({
  children,
  colorVar,
  opacity = 80,
  textColorVar,
  className,
}: HighlightedTextProps) {
  const color = `color-mix(in oklab, var(${colorVar}) ${opacity}%, transparent)`;
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(${color}, ${color})`,
    backgroundSize: `100% ${HIGHLIGHT_BAND_HEIGHT_EM}em`,
    backgroundPosition: `0 ${HIGHLIGHT_BAND_OFFSET_EM}em`,
    backgroundRepeat: "no-repeat",
    ...(textColorVar ? { color: `var(${textColorVar})` } : {}),
  };

  return (
    <span
      className={cn("box-decoration-clone px-1 text-foreground", className)}
      style={style}
    >
      {children}
    </span>
  );
}
