import type { ReactNode } from "react";
import "./hero-mend.css";

/**
 * "The mend": the stage scene of Workshop 03 (is your data ready for AI).
 *
 * Act 1: a scanner walks a 4 x 4 table column by column and a packet falls
 * from each column into one result bar. The first packets lift the bar above
 * its baseline. Column three holds a doubled row (a dashed copy slid half a
 * cell aside) and a gap (a dashed empty cell with a cross). Its packet is a
 * double, and the bar drops below the baseline: a wrong number, before any AI
 * is involved. Act 2: the scanner returns to column three, the copy slides
 * into its cell and merges, a clean cell snaps into the gap with a small
 * ripple. Act 3: the wrong bar collapses through zero and the right bar rises
 * above the baseline, with a plus where the minus was.
 *
 * Meaning rides on shape and place, never on colour alone: a minus badge below
 * the line, a plus badge above it, a cross in the gap, two dots for the double.
 * No word is drawn. Pure SVG with class names, no id, no gradient, no filter,
 * no script. hero-mend.css maps the classes; its base styles are the finished
 * still frame (clean cell in, bar up, plus shown) and the story plays over
 * them under `prefers-reduced-motion: no-preference` only.
 */

const COLUMNS = 4;
const ROWS = 4;
const CELL_W = 100;
const CELL_H = 30;
const GAP_X = 12;
const GAP_Y = 10;
const TABLE_X = 82;
const TABLE_Y = 66;
const BROKEN_COLUMN = 2;
const BROKEN_ROW = 1;
const GAP_ROW = 2;
const BASELINE_Y = 352;
const BAR_X = 256;
const BAR_W = 88;
const BAR_H = 100;
const BAR_CX = BAR_X + BAR_W / 2;
const PACKET_Y = 236;
/** Length of the value stroke inside a cell, per row and column: uneven on purpose. */
const VALUE_LENGTHS: readonly (readonly number[])[] = [
  [44, 36, 52, 30],
  [30, 48, 40, 46],
  [52, 34, 44, 38],
  [38, 54, 32, 50],
];

const cellX = (column: number): number => TABLE_X + column * (CELL_W + GAP_X);
const cellY = (row: number): number => TABLE_Y + row * (CELL_H + GAP_Y);
const columnCentre = (column: number): number => cellX(column) + CELL_W / 2;
const valuePath = (column: number, row: number): string =>
  `M${cellX(column) + 14} ${cellY(row) + CELL_H / 2}h${VALUE_LENGTHS[row][column]}`;

const COLUMN_INDEXES = Array.from({ length: COLUMNS }, (_, column) => column);
const ROW_INDEXES = Array.from({ length: ROWS }, (_, row) => row);

/** Far dust: [x, y, r]. */
const DUST: readonly (readonly [number, number, number])[] = [
  [66, 92, 2.6],
  [540, 120, 2.2],
  [74, 286, 3],
  [532, 318, 2.4],
  [92, 430, 2],
  [512, 436, 2.8],
  [330, 470, 2],
  [210, 54, 2.2],
];

function Cell({ column, row }: { readonly column: number; readonly row: number }): ReactNode {
  return (
    <g>
      <rect x={cellX(column)} y={cellY(row)} width={CELL_W} height={CELL_H} rx="4" className="hd-cell" />
      <path d={valuePath(column, row)} className="hd-value" />
    </g>
  );
}

function Packet({ column }: { readonly column: number }): ReactNode {
  const double = column === BROKEN_COLUMN;
  return (
    <g transform={`translate(${columnCentre(column)} ${PACKET_Y})`}>
      <g className={`hd-pk hd-pk-${column}`}>
        <path d="M-8 -16V-28M0 -16V-38M8 -16V-28" className="hd-speed" />
        {double ? (
          <>
            <circle cx="-10" cy="0" r="8" className="hd-dot hd-dot-double" />
            <circle cx="10" cy="0" r="8" className="hd-dot hd-dot-double" />
          </>
        ) : (
          <circle cx="0" cy="0" r="8" className="hd-dot" />
        )}
      </g>
    </g>
  );
}

export function MendScene(): ReactNode {
  const brokenX = cellX(BROKEN_COLUMN);
  const brokenY = cellY(BROKEN_ROW);
  const gapX = cellX(BROKEN_COLUMN);
  const gapY = cellY(GAP_ROW);
  const gapCx = gapX + CELL_W / 2;
  const gapCy = gapY + CELL_H / 2;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="mend"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="hd-root hd-mend block size-full"
    >
      {/* Far layer: soft discs and dust that drift slowly. */}
      <g className="hd-layer-far">
        <g className="hd-far">
          {[210, 160, 112].map((radius) => (
            <circle key={radius} cx={BAR_CX} cy="250" r={radius} className="hd-disc" />
          ))}
          {DUST.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hd-dust" />
          ))}
        </g>
      </g>

      {/* Mid layer: the table, the funnel lines and the baseline with the zone below it. */}
      <g className="hd-in hd-in-table">
        <rect x="76" y={BASELINE_Y} width="448" height="90" className="hd-zone" />
        {COLUMN_INDEXES.map((column) => (
          <path key={column} d={`M${columnCentre(column)} ${PACKET_Y - 12}L${BAR_CX} ${BASELINE_Y - 4}`} className="hd-funnel" />
        ))}
        {ROW_INDEXES.flatMap((row) =>
          COLUMN_INDEXES.filter((column) => !(column === BROKEN_COLUMN && row === GAP_ROW)).map((column) => (
            <Cell key={`${column}-${row}`} column={column} row={row} />
          )),
        )}
        {/* The gap: a dashed empty cell with a cross. Gone in the finished frame. */}
        <g className="hd-gap">
          <rect x={gapX} y={gapY} width={CELL_W} height={CELL_H} rx="4" className="hd-gap-box" />
          <path d={`M${gapCx - 6} ${gapCy - 6}l12 12M${gapCx + 6} ${gapCy - 6}l-12 12`} className="hd-cross" />
        </g>
        {/* The clean cell that closes it, with a ripple. */}
        <g className="hd-clean">
          <rect x={gapX} y={gapY} width={CELL_W} height={CELL_H} rx="4" className="hd-clean-box" />
          <path d={valuePath(BROKEN_COLUMN, GAP_ROW)} className="hd-clean-value" />
        </g>
        <rect x={gapX} y={gapY} width={CELL_W} height={CELL_H} rx="4" className="hd-ripple" />
        {/* The doubled row: a dashed copy slid half a cell aside. Merged in the finished frame. */}
        <g className="hd-ghost">
          <rect x={brokenX} y={brokenY} width={CELL_W} height={CELL_H} rx="4" className="hd-ghost-box" />
          <path d={valuePath(BROKEN_COLUMN, BROKEN_ROW)} className="hd-ghost-value" />
        </g>
        {/* The scanner: a frame that walks the columns. */}
        <rect x={cellX(0) - 6} y={TABLE_Y - 8} width={CELL_W + 12} height={4 * CELL_H + 3 * GAP_Y + 16} rx="6" className="hd-scan" />
      </g>

      {/* Near layer: the baseline, the result bars, the badges and the packets. */}
      <g className="hd-in hd-in-bar">
        <path d={`M76 ${BASELINE_Y}H524`} className="hd-baseline" />
        <rect x={BAR_X} y={BASELINE_Y - BAR_H} width={BAR_W} height={BAR_H} className="hd-bar hd-bar-wrong" />
        <rect x={BAR_X} y={BASELINE_Y - BAR_H} width={BAR_W} height={BAR_H} className="hd-bar hd-bar-right" />
        <g transform={`translate(${BAR_X - 48} ${BASELINE_Y + 36})`}>
          <g className="hd-badge hd-minus">
            <circle r="15" className="hd-badge-disc" />
            <path d="M-7 0H7" className="hd-badge-glyph" />
          </g>
        </g>
        <g transform={`translate(${BAR_X - 48} ${BASELINE_Y - 36})`}>
          <g className="hd-badge hd-plus">
            <circle r="15" className="hd-badge-disc hd-badge-disc-mid" />
            <path d="M-7 0H7M0 -7V7" className="hd-badge-glyph" />
          </g>
        </g>
      </g>
      {COLUMN_INDEXES.map((column) => (
        <Packet key={column} column={column} />
      ))}
    </svg>
  );
}
