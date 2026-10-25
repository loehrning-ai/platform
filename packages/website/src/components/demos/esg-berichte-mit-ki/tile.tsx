import { tileNumber } from "@/lib/demo-tiles/format";
import { HatchDef, TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W04 "Elf von zwölf", hub miniature: the missing month. Eleven bills rise
 * (MWh, energy_bills_2025.csv), September is a slot, the draft says 279,7. A
 * hatched guess rises, then the real bill overshoots above every bar and the
 * figure becomes 320,9; the draft figure stays, struck. The strip row under
 * the chart flips from eleven squares and a hole to twelve squares. End
 * frame: the tallest bar is the missing one. Motion: tile-motion.ts.
 */
const HATCH = "dt-hatch-w04";
const MWH = [21.4, 19.8, 20.6, 19.2, 22.5, 26.8, 30.4, 32.1, null, 38.7, 25.3, 22.9] as const;
const BASE = 232;
const PX = 3.6;
const GUESS = 25;
const BILL = 41.2;
const barX = (index: number) => 28 + index * 29;
const SEP = 8;

export default function Tile({ locale, reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <HatchDef id={HATCH} />
      <g data-t="bars">
        {MWH.map((value, index) =>
          value === null ? null : (
            <rect key={index} className="dt-fill-ink dt-swap-ink" x={barX(index)} y={BASE - value * PX} width="23" height={value * PX} />
          ),
        )}
      </g>
      <rect
        data-t="slot"
        className="dt-stroke-mark"
        fill="none"
        x={barX(SEP)}
        y={BASE - 46 * PX}
        width="23"
        height={46 * PX}
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <rect data-t="bill" className="dt-fill-mark dt-swap-mark" x={barX(SEP)} y={BASE - BILL * PX} width="23" height={BILL * PX} />
      <rect
        data-t="ghost"
        className="dt-stroke-ink"
        fill={`url(#${HATCH})`}
        x={barX(SEP)}
        y={BASE - GUESS * PX}
        width="23"
        height={GUESS * PX}
        strokeWidth="2"
        strokeDasharray="5 3"
      />
      <path className="dt-stroke-ink" d={`M22 ${BASE}H378`} strokeWidth="3" />
      {MWH.map((value, index) => (
        <rect key={index} className="dt-fill-ink dt-swap-ink" x={barX(index)} y="254" width="23" height="14" />
      ))}
      <rect data-t="cell-cover" className="dt-fill-ground" x={barX(SEP) - 1} y="253" width="25" height="16" />
      <rect
        data-t="cell-open"
        className="dt-stroke-mark"
        fill="none"
        x={barX(SEP)}
        y="254"
        width="23"
        height="14"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <text data-t="fig-a" className="dt-fig dt-fill-ink" x="110" y="52" textAnchor="middle" fontSize="30">
        {tileNumber(279.7, locale, { digits: 1 })}
      </text>
      <path data-t="strike" className="dt-stroke-mark" d="M62 43H158" strokeWidth="4" pathLength="1" strokeDasharray="1" />
      <text data-t="fig-b" className="dt-fig dt-fill-mark" x="290" y="56" textAnchor="middle" fontSize="40">
        {tileNumber(320.9, locale, { digits: 1 })}
      </text>
    </TileSvg>
  );
}
