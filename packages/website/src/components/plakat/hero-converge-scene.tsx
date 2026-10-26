import type { ReactNode } from "react";
import "./hero-converge.css";

/**
 * "The basis": the scene of Workshop 06 (comparing offers), drawn from its demo. Three offers on the
 * left, each sheet led by its goods price. Lines from all three meet in one frame of five fields (the
 * basis: quantity, unit, delivered to, one-off costs, discount) and fan out to three bars. Each bar
 * starts as the goods price alone, in the goods order (B, C, A); then freight, one-off costs and
 * storage stack on, the early-payment discount is cut back from the end as an outlined block, and the
 * rows move to the delivered order (C, A, B). C gets the accent frame: the lowest unit price was the
 * most expensive offer.
 *
 * The amounts are the kit's (kostenzeilen.csv, one year), checked by hero-converge-scene.test.tsx
 * against the demo's own model. Meaning sits in order, length and outline, never in colour alone, and
 * no word is drawn. Pure SVG with class names, no id, no gradient, no filter, no script.
 * hero-converge.css holds the colours (scene tokens) and plays the story under
 * `prefers-reduced-motion: no-preference` only; the base styles are the finished still frame. One
 * viewBox (600 x 500).
 */

export type ConvergeRow = {
  readonly option: "A" | "B" | "C";
  /** Euro per year: the goods price, the added lines in the kit's order (freight, one-off, storage), the discount. */
  readonly goods: number;
  readonly added: readonly [number, number, number];
  readonly discount: number;
};

/** The three offers of the kit, in document order. */
export const CONVERGE_ROWS: readonly ConvergeRow[] = [
  { option: "A", goods: 26400, added: [0, 0, 0], discount: 528 },
  { option: "B", goods: 20800, added: [2800, 1450, 1920], discount: 416 },
  { option: "C", goods: 23000, added: [2600, 0, 0], discount: 690 },
];

/** Row centres of the bars: before (goods order B, C, A) and after (delivered order C, A, B). */
const SLOT_Y = [150, 250, 350] as const;
export const GOODS_ORDER = ["B", "C", "A"] as const;
export const DELIVERED_ORDER = ["C", "A", "B"] as const;

const SHEET = { x: 56, w: 120, h: 84, head: 96 } as const;
const SHEET_Y = [124, 250, 376] as const;
const BASIS = { x: 262, y: 180, w: 76, h: 140 } as const;
const BAR = { x: 362, w: 188, h: 28 } as const;
const BASIS_FIELDS = [204, 230, 256, 282, 308] as const;

const positive = (row: ConvergeRow) => row.goods + row.added[0] + row.added[1] + row.added[2];
const MAX = Math.max(...CONVERGE_ROWS.map(positive));
const GOODS_MAX = Math.max(...CONVERGE_ROWS.map((row) => row.goods));
const px = (euro: number) => Math.round((euro / MAX) * BAR.w * 10) / 10;

const DUST: readonly (readonly [number, number, number])[] = [
  [40, 58, 2.4],
  [300, 60, 2.2],
  [566, 70, 2.8],
  [574, 440, 2.4],
  [300, 446, 2.2],
  [34, 448, 2.6],
];

const convergePath = SHEET_Y.map((y, index) => `M${SHEET.x + SHEET.w} ${y}L${BASIS.x} ${226 + index * 24}`).join("");
const fanPath = SLOT_Y.map((y) => `M${BASIS.x + BASIS.w} 250L${BAR.x - 6} ${y}`).join("");

function Bar({ row }: { readonly row: ConvergeRow }): ReactNode {
  const y = SLOT_Y[DELIVERED_ORDER.indexOf(row.option)] - BAR.h / 2;
  let x = BAR.x + px(row.goods);
  const segments = row.added.flatMap((amount, kind) => {
    if (amount <= 0) return [];
    const left = x;
    x += px(amount);
    return [<rect key={kind} x={left} y={y} width={px(amount)} height={BAR.h} className={`hb-add hb-add-${kind + 1}`} />];
  });
  const cut = px(row.discount);
  return (
    <g className={`hb-row hb-row-${row.option.toLowerCase()}`}>
      <rect x={BAR.x} y={y} width={px(row.goods)} height={BAR.h} className="hb-goods" />
      {segments}
      <rect x={x - cut} y={y} width={cut} height={BAR.h} className="hb-neg" />
    </g>
  );
}

export function ConvergeScene(): ReactNode {
  const winnerY = SLOT_Y[0] - BAR.h / 2 - 10;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="converge"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="hb-root block size-full"
    >
      {/* Far layer: a little dust. */}
      <g className="hb-far">
        {DUST.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hb-dust" />
        ))}
      </g>

      {/* Mid layer: three offers, each led by its goods price, and the basis of five fields. */}
      <g className="hb-cards">
        {CONVERGE_ROWS.map((row, index) => {
          const y = SHEET_Y[index] - SHEET.h / 2;
          return (
            <g key={row.option}>
              <rect x={SHEET.x} y={y} width={SHEET.w} height={SHEET.h} className="hb-sheet" />
              <rect x={SHEET.x + 12} y={y + 14} width={Math.round((row.goods / GOODS_MAX) * SHEET.head)} height="12" className="hb-head" />
              <path d={`M${SHEET.x + 12} ${y + 44}H${SHEET.x + 84}M${SHEET.x + 12} ${y + 62}H${SHEET.x + 66}`} className="hb-line" />
            </g>
          );
        })}
        <rect x={BASIS.x} y={BASIS.y} width={BASIS.w} height={BASIS.h} className="hb-basis" />
        {BASIS_FIELDS.map((y) => (
          <g key={y}>
            <rect x={BASIS.x + 10} y={y - 5} width="10" height="10" className="hb-field" />
            <path d={`M${BASIS.x + 28} ${y}H${BASIS.x + 64}`} className="hb-line" />
          </g>
        ))}
      </g>

      {/* Near layer: every offer onto the one basis, and from it to the bars. */}
      <path d={convergePath} pathLength={1} className="hb-converge" />
      <path d={fanPath} pathLength={1} className="hb-fan" />

      {/* The bars: goods in ink, the other lines in the accent, the discount outlined. */}
      {CONVERGE_ROWS.map((row) => (
        <Bar key={row.option} row={row} />
      ))}

      {/* Delivered and paid, C costs least. */}
      <rect x={BAR.x - 8} y={winnerY} width={BAR.w + 8} height={BAR.h + 20} className="hb-win" />
    </svg>
  );
}
