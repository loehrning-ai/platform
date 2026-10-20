import type { ReactNode } from "react";
import "./hero-weave.css";

/**
 * "The weave": the hero scene of Workshop 04 (ESG reporting with AI).
 *
 * Three requests arrive on the left: an importer's question, a bank form, a
 * check of a green claim. In the middle sit the facts, a grid of eight tiles
 * (and one empty slot). Each request is a thread that weaves through exactly
 * the tiles it needs; the same tile serves several requests. A sheet leaves on
 * the right for every request. The third thread runs into the empty slot: the
 * slot stays dashed, a dash marks it, and that sheet leaves with a gap row
 * instead of an invented figure. Idea: answer every request from the same
 * facts, and name what is missing.
 *
 * Pure SVG with class names: no word, no id, no style attribute, no gradient,
 * no filter, no script. The base styles in hero-weave.css are the finished
 * still frame; the loop plays only under `prefers-reduced-motion:
 * no-preference`. The scene takes no props and fills its box (viewBox 600 x
 * 500, content inside x 50..550 and y 50..450).
 */

type Point = readonly [x: number, y: number];

const TILE = 52;
const PITCH = 78;
const ORIGIN_X = 222;
const ORIGIN_Y = 172;
const REQUEST_X = 60;
const REQUEST_Y = [140, 250, 360] as const;
const SHEET_X = 468;

/** Centre of the tile at column c, row r of the 3 x 3 grid. */
const cell = (c: number, r: number): Point => [ORIGIN_X + c * PITCH, ORIGIN_Y + r * PITCH];

/** The empty slot is the last cell; the other eight hold facts. */
const SLOT: Point = cell(2, 2);
const FACT_CELLS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [0, 2],
  [1, 2],
];

/** Tiles each request needs (column, row). Tile (1, 1) serves all three. */
const NEEDS: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 0], [1, 1], [2, 0]],
  [[0, 1], [1, 0], [2, 1]],
  [[0, 2], [1, 1], [1, 2]],
];

const THREADS: readonly string[] = [
  "M104 140L140 140L222 172L300 250L378 172L420 172C440 172 448 140 468 140",
  "M104 250L222 250L300 172L378 250L468 250",
  "M104 360L140 360L222 328L300 250L300 328L350 328",
];

/** One small ink figure per fact tile, so the tiles read as different facts. */
function Glyph({ index }: { readonly index: number }): ReactNode {
  switch (index) {
    case 0:
      return <path d="M-14-9H14M-14 0H14M-14 9H6" className="hw-fine" />;
    case 1:
      return (
        <>
          <circle cx="-8" cy="-2" r="5" className="hw-solid" />
          <path d="M2 -2H14M-14 10H14" className="hw-fine" />
        </>
      );
    case 2:
      return <circle r="10" className="hw-fine" />;
    case 3:
      return <path d="M-14 12V2M-5 12V-4M4 12V-10M13 12V-1" className="hw-fine" />;
    case 4:
      return (
        <>
          <circle cx="-9" cy="-9" r="3.2" className="hw-solid" />
          <circle cx="9" cy="-9" r="3.2" className="hw-solid" />
          <circle cx="-9" cy="9" r="3.2" className="hw-solid" />
          <circle cx="9" cy="9" r="3.2" className="hw-solid" />
        </>
      );
    case 5:
      return <path d="M-14 8L-4-2L4 4L14-10" className="hw-fine" />;
    case 6:
      return (
        <>
          <path d="M-14-8H14" className="hw-fine" />
          <circle cx="0" cy="6" r="5" className="hw-solid" />
        </>
      );
    default:
      return <path d="M-13 9L0-10L13 9Z" className="hw-fine" />;
  }
}

function Request({ index }: { readonly index: number }): ReactNode {
  const cy = REQUEST_Y[index] ?? 0;
  const x = REQUEST_X;
  const y = cy - 22;
  return (
    <g className="hw-request" data-request={index + 1}>
      <path d={`M${x} ${y}H${x + 32}L${x + 44} ${y + 12}V${y + 44}H${x}Z`} className="hw-frame" />
      <path d={`M${x + 32} ${y}V${y + 12}H${x + 44}`} className="hw-fine" />
      {index === 0 ? <path d={`M${x + 10} ${cy - 2}H${x + 30}M${x + 10} ${cy + 8}H${x + 24}`} className="hw-fine" /> : null}
      {index === 1 ? (
        <>
          <circle cx={x + 13} cy={cy + 2} r="4" className="hw-solid" />
          <path d={`M${x + 22} ${cy + 2}H${x + 34}M${x + 10} ${cy + 13}H${x + 34}`} className="hw-fine" />
        </>
      ) : null}
      {index === 2 ? <path d={`M${x + 10} ${cy - 4}H${x + 34}M${x + 10} ${cy + 3}H${x + 28}M${x + 10} ${cy + 10}H${x + 34}`} className="hw-fine" /> : null}
    </g>
  );
}

function Sheet({ index }: { readonly index: number }): ReactNode {
  const cy = REQUEST_Y[index] ?? 0;
  const top = cy - 38;
  const left = SHEET_X;
  const rows = [top + 16, top + 36, top + 56];
  const widths = [index === 1 ? 30 : 36, index === 0 ? 28 : 36, index === 1 ? 24 : 32];
  return (
    <g className={`hw-sheet hw-sheet-${index + 1}`} data-sheet={index + 1}>
      <rect x={left} y={top} width="56" height="76" className="hw-frame" />
      {rows.map((rowY, row) => {
        const isGap = index === 2 && row === 1;
        if (isGap) {
          return (
            <g key={rowY}>
              <rect x={left + 9} y={rowY - 5} width="38" height="12" className="hw-gap-row" />
              <path d={`M${left + 20} ${rowY + 1}H${left + 36}`} className="hw-dash-glyph" />
            </g>
          );
        }
        return (
          <g key={rowY}>
            <circle cx={left + 12} cy={rowY + 1} r="2.6" className="hw-solid" />
            <rect x={left + 19} y={rowY - 3} width={widths[row] ?? 30} height="8" rx="2" className="hw-solid" />
          </g>
        );
      })}
    </g>
  );
}

function Lit({ index }: { readonly index: number }): ReactNode {
  return (
    <g className={`hw-lit hw-lit-${index + 1}`}>
      {(NEEDS[index] ?? []).map(([c, r]) => {
        const [x, y] = cell(c, r);
        return (
          <g key={`${c}-${r}`}>
            <rect x={x - TILE / 2} y={y - TILE / 2} width={TILE} height={TILE} className="hw-lit-fill" />
            <rect x={x - TILE / 2 - 7} y={y - TILE / 2 - 7} width={TILE + 14} height={TILE + 14} className="hw-lit-ring" />
          </g>
        );
      })}
    </g>
  );
}

const DUST: readonly (readonly [number, number, number])[] = [
  [86, 86, 2.6],
  [196, 112, 2],
  [420, 90, 2.8],
  [540, 84, 2.2],
  [150, 436, 2.4],
  [326, 430, 2.8],
  [512, 436, 2.2],
  [66, 300, 2],
];

export function WeaveScene(): ReactNode {
  const [slotX, slotY] = SLOT;
  return (
    <svg
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="hw-root block size-full"
      aria-hidden="true"
      focusable="false"
      data-hero-motion="weave"
    >
      {/* Far layer: stepped flat discs and dust, drifting slowly. */}
      <g className="hw-far">
        <circle cx="300" cy="250" r="214" className="hw-disc" />
        <circle cx="300" cy="250" r="150" className="hw-disc" />
        <circle cx="300" cy="250" r="88" className="hw-disc" />
      </g>
      <g className="hw-dust">
        {DUST.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hw-dot" />
        ))}
      </g>

      {/* Mid layer: the threads, behind the tiles, so they weave through them. */}
      {THREADS.map((d, index) => (
        <path key={d} d={d} pathLength="1" className={`hw-thread hw-thread-${index + 1}`} />
      ))}

      <g className="hw-tiles">
        {FACT_CELLS.map(([c, r], index) => {
          const [x, y] = cell(c, r);
          return (
            <g key={`${c}-${r}`} transform={`translate(${x} ${y})`}>
              <rect x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} className="hw-tile" />
              <Glyph index={index} />
            </g>
          );
        })}
        <rect x={slotX - TILE / 2} y={slotY - TILE / 2} width={TILE} height={TILE} className="hw-slot" />
      </g>

      {[0, 1, 2].map((index) => (
        <Lit key={index} index={index} />
      ))}

      {/* The gap: a dash in the empty slot and a dashed line to the sheet that carries the gap. */}
      <g className="hw-gap">
        <path d={`M${slotX + TILE / 2} ${slotY}C${slotX + 62} ${slotY} ${slotX + 64} 360 ${SHEET_X} 360`} className="hw-gap-line" />
        <path d={`M${slotX - 11} ${slotY}H${slotX + 11}`} className="hw-dash-glyph" />
      </g>

      {/* Near layer: requests in, sheets out. */}
      {[0, 1, 2].map((index) => (
        <Request key={index} index={index} />
      ))}
      {[0, 1, 2].map((index) => (
        <Sheet key={index} index={index} />
      ))}
    </svg>
  );
}
