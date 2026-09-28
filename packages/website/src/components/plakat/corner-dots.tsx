import { cx } from "@/components/werk/cx";

export type CornerDotsProps = {
  /** Which dots to draw. "top" and "bottom" draw one pair each. Default: all four. */
  readonly corners?: "all" | "top" | "bottom";
  /** Extra classes for every dot, e.g. `hidden lg:block`. */
  readonly className?: string;
};

/** Diameter of a dot, in px. Its box sits 12px in, so the centre is 16px in. */
const SIZE = 8;

const CORNERS = [
  { id: "top-left", row: "top", place: "top-3 left-3" },
  { id: "top-right", row: "top", place: "top-3 right-3" },
  { id: "bottom-left", row: "bottom", place: "bottom-3 left-3" },
  { id: "bottom-right", row: "bottom", place: "bottom-3 right-3" },
] as const;

/**
 * The IDEA poster's four corner dots, as a band ornament: a dot 16px inside
 * each corner, in the scene ink. Each dot is its own aria-hidden 8px SVG,
 * pinned to its corner, so no dot box covers a text box: axe can then check
 * the contrast of the band's text against the ground instead of marking it
 * incomplete. SVG circles, not round-cornered boxes (demo surfaces ban that
 * utility). The parent must be `relative`.
 */
export function CornerDots({ corners = "all", className }: CornerDotsProps) {
  return (
    <>
      {CORNERS.filter((corner) => corners === "all" || corner.row === corners).map((corner) => (
        <svg
          key={corner.id}
          aria-hidden="true"
          focusable="false"
          data-corner-dots=""
          data-corner={corner.id}
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={cx("pointer-events-none absolute size-2", corner.place, className)}
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} className="fill-scene-ink" />
        </svg>
      ))}
    </>
  );
}
