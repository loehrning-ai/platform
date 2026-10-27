import { CLAUDE_ANSWER, ENDING_MRR, OPENING_DEC_2025 } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { tileNumber } from "@/lib/demo-tiles/format";
import { TileSvg, type TileProps } from "../hub/tile-kit";
import { PER_1000 } from "./tile-motion";

/*
 * W03 "Die Fragekarte", hub miniature: the demo's reveal in one column.
 * Claude's April figure 75.890 is right as a change and wrong as a level;
 * the opening level 258.785 slides in under it and the column stands at
 * 334.675, the ending MRR of the approved view. Then the five squares of the
 * question card fill. End frame: the stacked column, both parts labelled,
 * 334.675 large, five squares full. The opening is an outlined block, Claude's
 * part solid ink, so the two read apart without colour. Motion: tile-motion.ts.
 */
const FLOOR = 270;
const LEFT = 36;
const WIDTH = 112;
const h = (value: number) => Math.round((value / 1000) * PER_1000 * 10) / 10;
const CLAUDE_APRIL = CLAUDE_ANSWER[0] as number;
const BLOCK_TOP = FLOOR - h(OPENING_DEC_2025);
const BAR_TOP = BLOCK_TOP - h(CLAUDE_APRIL);
const SQUARE = 28;
const SQUARE_GAP = 8;
const SQUARES_X = 376 - 5 * SQUARE - 4 * SQUARE_GAP;

export default function Tile({ locale, reducedMotion }: TileProps) {
  const de = locale === "de";
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <path className="dt-stroke-ink" d={`M24 ${FLOOR}H376`} strokeWidth="3" />
      <g data-t="block">
        <rect className="dt-fill-ground dt-stroke-ink" x={LEFT + 1.5} y={BLOCK_TOP} width={WIDTH - 3} height={FLOOR - BLOCK_TOP} strokeWidth="3" />
        <text className="dt-fig dt-fill-ink" x={LEFT + WIDTH / 2} y={BLOCK_TOP + 34} fontSize="22" textAnchor="middle">
          {tileNumber(OPENING_DEC_2025, locale)}
        </text>
      </g>
      <g data-t="bar">
        <g data-t="grow">
          <rect className="dt-fill-ink" x={LEFT} y={BAR_TOP} width={WIDTH} height={BLOCK_TOP - BAR_TOP} />
        </g>
        <text data-t="bar-label" className="dt-fig dt-fill-ink" x={LEFT + WIDTH + 12} y={BAR_TOP + 30} fontSize="22">
          {tileNumber(CLAUDE_APRIL, locale)}
        </text>
      </g>
      <g data-t="fig-a">
        <text className="dt-fig dt-fill-ink" x="376" y="70" fontSize="50" textAnchor="end">
          {tileNumber(CLAUDE_APRIL, locale)}
        </text>
        <text className="dt-fig dt-fill-ink" x="376" y="98" fontSize="18" textAnchor="end">
          {de ? "Claudes Tabelle, April" : "Claude's table, April"}
        </text>
      </g>
      <g data-t="fig-b">
        <text className="dt-fig dt-fill-ink" x="376" y="70" fontSize="50" textAnchor="end">
          {tileNumber(ENDING_MRR["2026-04"], locale)}
        </text>
        <text className="dt-fig dt-fill-ink" x="376" y="98" fontSize="18" textAnchor="end">
          {de ? "Stand Ende April" : "Level, end of April"}
        </text>
      </g>
      {[0, 1, 2, 3, 4].map((box) => {
        const x = SQUARES_X + box * (SQUARE + SQUARE_GAP);
        return (
          <g key={box}>
            <rect className="dt-stroke-ink" x={x} y={FLOOR - SQUARE - 16} width={SQUARE} height={SQUARE} strokeWidth="3" fill="none" />
            <rect data-t={`sq${box + 1}`} className="dt-fill-ink" x={x + 5} y={FLOOR - SQUARE - 11} width={SQUARE - 10} height={SQUARE - 10} />
          </g>
        );
      })}
    </TileSvg>
  );
}
