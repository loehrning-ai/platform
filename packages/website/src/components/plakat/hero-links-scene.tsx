import type { ReactNode } from "react";
import "./hero-links.css";

/**
 * "The links": the scene of Workshop 05 (audit preparation). Story: four days,
 * thirteen questions, one door. Four day tiles fill one after the other and a
 * fifth, outlined tile waits. Thirteen sheets stand in rows of 5, 4 and 4; a
 * thin bar scans across them and leaves a mark on ten (the gaps). Two sheets
 * stay plain, one carries a small outlined corner (weak). Then someone knocks,
 * the door on the right opens, and a new sheet slides in under the old one:
 * fix forward, the old one stays.
 *
 * Meaning sits in shape (plain, outlined corner, cross), never in colour alone,
 * and no word or number is drawn. Pure SVG with class names, no id, no
 * gradient, no filter, no script. hero-links.css holds the colours (scene
 * tokens) and plays the story under `prefers-reduced-motion: no-preference`
 * only; the base styles are the finished still frame. One viewBox (600 x 500).
 */

const TILE = { x: 66, y: 60, w: 84, h: 38, gap: 12 } as const;
const SHEET = { w: 62, h: 60 } as const;
const ROW_Y = [126, 202, 278] as const;
const ROW_X = [60, 98, 98] as const;
const ROW_COUNT = [5, 4, 4] as const;
const STEP = 76;
/** Length of the one text bar on each sheet, so the sheets do not look stamped. */
const BAR = [38, 28, 42, 32, 40, 30, 36, 44, 26, 40, 34, 30, 38] as const;

/** Sheet index (row-major, 0 to 12) of the two covered ones and the weak one. */
const COVERED: readonly number[] = [1, 7];
const WEAK = 4;
/** The ten gap sheets in five groups of two, in the order the scan bar passes them. */
const MARKER_GROUPS: readonly (readonly [number, number])[] = [
  [0, 5],
  [9, 6],
  [10, 2],
  [11, 3],
  [8, 12],
];

type Spot = { readonly index: number; readonly x: number; readonly y: number };

const SHEETS: readonly Spot[] = ROW_COUNT.flatMap((count, row) =>
  Array.from({ length: count }, (_, col) => ({ x: (ROW_X[row] as number) + col * STEP, y: ROW_Y[row] as number })),
).map((spot, index) => ({ ...spot, index }));

function Cross({ spot }: { readonly spot: Spot }): ReactNode {
  const { x, y } = spot;
  return <path d={`M${x + 20} ${y + 24}L${x + 42} ${y + 46}M${x + 42} ${y + 24}L${x + 20} ${y + 46}`} className="hk-x" />;
}

export function LinksScene(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="links"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="hk-root block size-full"
    >
      {/* Top: four days fill one after the other; the fifth tile is the visit. */}
      <g className="hk-links">
        {[0, 1, 2, 3, 4].map((day) => (
          <rect
            key={day}
            x={TILE.x + day * (TILE.w + TILE.gap)}
            y={TILE.y}
            width={TILE.w}
            height={TILE.h}
            className={day === 4 ? "hk-tile hk-tile-last" : "hk-tile"}
          />
        ))}
        {[0, 1, 2, 3].map((day) => (
          <rect
            key={day}
            x={TILE.x + day * (TILE.w + TILE.gap)}
            y={TILE.y}
            width={TILE.w}
            height={TILE.h}
            className={`hk-day hk-day-${day + 1}`}
          />
        ))}
      </g>

      {/* Middle: thirteen sheets, one line of text on each. */}
      <g className="hk-sheets">
        {SHEETS.map((spot) => (
          <g key={spot.index}>
            <rect
              x={spot.x}
              y={spot.y}
              width={SHEET.w}
              height={SHEET.h}
              className={COVERED.includes(spot.index) ? "hk-sheet hk-sheet-plain" : "hk-sheet"}
            />
            <path d={`M${spot.x + 10} ${spot.y + 12}H${spot.x + 10 + (BAR[spot.index] as number)}`} className="hk-bar" />
            {spot.index === WEAK ? (
              <rect x={spot.x + SHEET.w - 22} y={spot.y + SHEET.h - 22} width="12" height="12" className="hk-weak" />
            ) : null}
          </g>
        ))}
      </g>

      {/* Ten gaps, marked in five groups of two as the bar passes. */}
      {MARKER_GROUPS.map((pair, group) => (
        <g key={group} className={`hk-fail hk-fail-${group + 1}`}>
          {pair.map((index) => (
            <Cross key={index} spot={SHEETS[index] as Spot} />
          ))}
        </g>
      ))}

      {/* The scan bar. */}
      <rect x="50" y="112" width="6" height="238" className="hk-scan" />

      {/* Right: the doorway, the door and the knocks. */}
      <rect x="462" y="126" width="86" height="212" className="hk-doorway" />
      <g className="hk-far">
        <rect x="466" y="130" width="78" height="204" className="hk-door" />
        <circle cx="530" cy="232" r="5" className="hk-knob" />
      </g>
      <g className="hk-knock">
        <path d="M444 204Q452 232 444 260" className="hk-arc" />
        <path d="M436 190Q448 232 436 274" className="hk-arc" />
        <path d="M428 176Q444 232 428 288" className="hk-arc" />
      </g>

      {/* Bottom: the old paper stays, the new one slides in beside it. */}
      <rect x="60" y="372" width="56" height="64" className="hk-paper-old" />
      <path d="M70 388H104M70 400H96" className="hk-bar" />
      <g className="hk-new">
        <rect x="132" y="372" width="56" height="64" className="hk-paper-new" />
        <path d="M142 388H176M142 400H168" className="hk-bar" />
      </g>
    </svg>
  );
}
