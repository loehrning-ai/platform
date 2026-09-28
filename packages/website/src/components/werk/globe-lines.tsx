import { cx } from "./cx";
import {
  GERMANY_OUTLINE,
  graticulePath,
  outlinePath,
  type GlobeView,
} from "./globe-geometry";

/** Europe faces the viewer and the north pole sits inside the top edge, as on the deck cover. */
export const DEFAULT_GLOBE_VIEW: GlobeView = {
  centerLat: 36,
  centerLon: 10,
  radius: 500,
};

export type GlobeLinesProps = {
  readonly className?: string;
  /** Degrees between graticule lines. The deck uses 10. */
  readonly step?: number;
  /** Trace Germany in Mennige at low opacity. */
  readonly highlightGermany?: boolean;
  readonly view?: GlobeView;
};

/**
 * Procedural line globe in the Workshop 03 deck style: an orthographic
 * graticule in thin ink strokes at low opacity on paper, with an optional
 * Mennige trace of Germany. Decorative only, so it is always aria-hidden.
 * The strokes take currentColor (the text ink by default), so the globe reads
 * on paper and pastel grounds; the site has no graphit band any more.
 *
 * The SVG is computed at render time on the server (no client JS) and stays
 * around 4 KB of markup.
 */
export function GlobeLines({
  className,
  step = 10,
  highlightGermany = true,
  view = DEFAULT_GLOBE_VIEW,
}: GlobeLinesProps) {
  const r = view.radius;
  const germany = highlightGermany ? outlinePath(GERMANY_OUTLINE, view) : "";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-werk-globe=""
      viewBox={`${-r - 2} ${-r - 2} ${2 * r + 4} ${2 * r + 4}`}
      fill="none"
      className={cx("block select-none text-foreground", className)}
    >
      <circle
        cx="0"
        cy="0"
        r={r}
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={graticulePath(view, step)}
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      {germany ? (
        <path
          data-werk-globe-country="DE"
          d={germany}
          fill="#b73a15"
          fillOpacity="0.1"
          stroke="#b73a15"
          strokeOpacity="0.7"
          strokeWidth="1.5"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
