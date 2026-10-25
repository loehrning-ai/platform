import { KIT_COSTS, kitCheck } from "@/lib/demo-cases/ki-prognosen-einschaetzen/kit";
import { tileNumber } from "@/lib/demo-tiles/format";
import { HatchDef, TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W01 "Die Fehlerliste", hub miniature: the release rule's 52-week strip of
 * the kit (ink = the forecast runs without sign-off, hatched Mennige = a
 * person decides), computed from the same check as the demo, and the
 * planning number of the plan week. End frame: 37 ink, 15 hatched, "748".
 * Motion: tile-motion.ts (the rows fill left to right, then the number).
 */
const HATCH = "dt-hatch-w01";
const COLUMNS = 13;
const LEFT = 20;
const RIGHT = 380;
const TOP = 128;
const ROW_H = 38;
const GAP = 5;
const CELL_W = (RIGHT - LEFT - GAP * (COLUMNS - 1)) / COLUMNS;
const CELL_H = ROW_H - GAP * 2;

const { check, result } = kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine);
const FREE = check.streifen.map((t) => check.lamps(t)?.frei === true);
const PLAN = result.naechste?.planzahl ?? 0;
const ROWS = Math.ceil(FREE.length / COLUMNS);

function cell(i: number): string {
  const x = LEFT + (i % COLUMNS) * (CELL_W + GAP);
  const y = TOP + Math.floor(i / COLUMNS) * ROW_H;
  return `M${x.toFixed(1)} ${y}h${CELL_W.toFixed(1)}v${CELL_H}h-${CELL_W.toFixed(1)}z`;
}

const rowPath = (row: number, free: boolean) =>
  FREE.map((value, i) => (Math.floor(i / COLUMNS) === row && value === free ? cell(i) : ""))
    .filter(Boolean)
    .join("");

export default function Tile({ locale, reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <HatchDef id={HATCH} />
      {Array.from({ length: ROWS }, (_, row) => (
        <g key={row} data-t={`row${row}`}>
          <path d={rowPath(row, true)} className="dt-fill-ink" />
          <path d={rowPath(row, false)} fill={`url(#${HATCH})`} className="dt-stroke-mark" strokeWidth="2" />
        </g>
      ))}
      <text data-t="plan" className="dt-fig dt-fill-mark" x={RIGHT} y="96" fontSize="64" textAnchor="end">
        {tileNumber(PLAN, locale)}
      </text>
    </TileSvg>
  );
}
