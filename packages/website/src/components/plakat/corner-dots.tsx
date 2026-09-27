import { cx } from "@/components/werk/cx";

export type CornerDotsProps = {
  readonly className?: string;
};

/** Centre of each dot from its corner, in px. */
const INSET = 16;
const RADIUS = 4;

const CORNERS = [
  { x: "0", y: "0", cx: INSET, cy: INSET },
  { x: "100%", y: "0", cx: -INSET, cy: INSET },
  { x: "0", y: "100%", cx: INSET, cy: -INSET },
  { x: "100%", y: "100%", cx: -INSET, cy: -INSET },
] as const;

/**
 * The IDEA poster's four corner dots, as a band ornament: one aria-hidden
 * SVG over the band with a dot 16px inside each corner, in the scene ink.
 * Each dot sits in a 1px nested viewport pinned to its corner (a zero size
 * would disable rendering) and paints past it, so the dots hold their inset
 * at any band size without CSS geometry properties.
 * SVG circles, not round-cornered boxes (demo surfaces ban that utility).
 * The parent must be `relative`.
 */
export function CornerDots({ className }: CornerDotsProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-corner-dots=""
      className={cx("pointer-events-none absolute inset-0 size-full overflow-visible", className)}
    >
      {CORNERS.map((corner) => (
        <svg key={`${corner.x}-${corner.y}`} x={corner.x} y={corner.y} width="1" height="1" overflow="visible">
          <circle cx={corner.cx} cy={corner.cy} r={RADIUS} className="fill-scene-ink" />
        </svg>
      ))}
    </svg>
  );
}
