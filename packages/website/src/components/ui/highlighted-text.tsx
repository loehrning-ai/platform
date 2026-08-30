import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The band's height and its offset from the top of each line's content-area
 * box, both in em. An inline box-decoration-clone span's default background
 * positioning area tracks font ascent+descent (~1.21em for the brand face),
 * not `line-height` -- painting the full content-area height is what causes
 * the band to overlap between wrapped lines at leading-[0.9]. Keeping
 * offset + height at or under the line-height-em stride guarantees adjacent
 * lines' bands cannot touch, regardless of exact vertical centering.
 */
export const HIGHLIGHT_BAND_HEIGHT_EM = 0.75;
export const HIGHLIGHT_BAND_OFFSET_EM = 0.1;

interface HighlightedTextProps {
  readonly children: ReactNode;
  /** A `--color-*` custom property name, e.g. "--color-brand-acid". */
  readonly colorVar: `--color-${string}`;
  /** Opacity percentage (0-100) applied via color-mix, matching Tailwind's own opacity-modifier output. */
  readonly opacity?: number;
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
  className,
}: HighlightedTextProps) {
  const color = `color-mix(in oklab, var(${colorVar}) ${opacity}%, transparent)`;
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(${color}, ${color})`,
    backgroundSize: `100% ${HIGHLIGHT_BAND_HEIGHT_EM}em`,
    backgroundPosition: `0 ${HIGHLIGHT_BAND_OFFSET_EM}em`,
    backgroundRepeat: "no-repeat",
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
