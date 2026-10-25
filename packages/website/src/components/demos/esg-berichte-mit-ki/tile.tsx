import { tileNumber } from "@/lib/demo-tiles/format";
import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W04 "Nachweisprobe", hub miniature: the certificate that is attached and
 * does not prove the sentence. Line 8 of bio_zertifikat_weinberg.txt says
 * "Gültig bis 31.08.2026"; a validity ruler draws to that date, then a
 * Mennige segment overshoots to the reference date 16.10.2026: 46 days
 * expired. Below, 12 of 40 hectare cells fill; 28 stay open. End frame: the
 * overshoot, the 46 and the 12 of 40. Motion: tile-motion.ts.
 */
const COPY = {
  de: { line6: "Geltungsbereich: 12,0 ha von 40 ha", line8: "Gültig bis: 31.08.2026", days: "Tage", ha: "von 40 ha" },
  en: { line6: "Scope: vineyard, 12.0 ha of 40 ha", line8: "Valid until: 31.08.2026", days: "days", ha: "of 40 ha" },
} as const;

const RULER_Y = 160;
const START_X = 28;
const END_X = 288;
const EXPIRED_DAYS = 46;
/** To scale: one year of validity is END_X - START_X, the 46 days past it on the same scale. */
const STICHTAG_X = END_X + Math.round(((END_X - START_X) * EXPIRED_DAYS) / 365);
const cellX = (index: number) => 28 + (index % 8) * 24;
const cellY = (index: number) => 214 + Math.floor(index / 8) * 15;
const cells = (from: number, to: number, inset: number) =>
  Array.from({ length: to - from }, (_, offset) => {
    const index = from + offset;
    return `M${cellX(index) + inset} ${cellY(index) + inset}h${20 - 2 * inset}v${11 - 2 * inset}h${2 * inset - 20}z`;
  }).join("");
/** 12 certified hectares as solid cells, 28 open. */
const FILLED = cells(0, 12, 0);
const OPEN = cells(12, 40, 1);

export default function Tile({ locale, reducedMotion }: TileProps) {
  const words = COPY[locale];
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <rect className="dt-fill-ground dt-stroke-ink" x="20" y="22" width="360" height="86" strokeWidth="2" />
      <text className="dt-fig dt-fill-mid" x="34" y="54" fontSize="15">
        6
      </text>
      <text className="dt-fig dt-fill-ink" x="60" y="54" fontSize="15">
        {words.line6}
      </text>
      <rect data-t="band" className="dt-fill-ink" x="22" y="68" width="356" height="30" />
      <text className="dt-fig dt-fill-ground" x="34" y="89" fontSize="16">
        8
      </text>
      <text className="dt-fig dt-fill-ground" x="60" y="89" fontSize="18">
        {words.line8}
      </text>
      <path className="dt-stroke-ink" d={`M28 ${RULER_Y - 12}V${RULER_Y + 12}`} strokeWidth="3" />
      <path data-t="ruler" className="dt-stroke-ink" d={`M28 ${RULER_Y}H${END_X}`} strokeWidth="8" pathLength="1" strokeDasharray="1" />
      <path className="dt-stroke-ink" d={`M${END_X} ${RULER_Y - 16}V${RULER_Y + 16}`} strokeWidth="3" />
      <path data-t="over" className="dt-stroke-mark" d={`M${END_X} ${RULER_Y}H${STICHTAG_X}`} strokeWidth="8" pathLength="1" strokeDasharray="1" />
      <path data-t="stichtag" className="dt-stroke-mark" d={`M${STICHTAG_X} ${RULER_Y - 16}V${RULER_Y + 16}`} strokeWidth="3" />
      <g data-t="days">
        <text className="dt-fig dt-fill-mark" x={STICHTAG_X + 4} y="136" fontSize="30" textAnchor="end">
          {tileNumber(EXPIRED_DAYS, locale)} {words.days}
        </text>
      </g>
      <g data-t="cells">
        <path className="dt-fill-ink" d={FILLED} />
        <path className="dt-stroke-ink" fill="none" d={OPEN} strokeWidth="1.5" />
      </g>
      <g data-t="ha">
        <text className="dt-fig dt-fill-ink" x="372" y="246" fontSize="40" textAnchor="end">
          12
        </text>
        <text className="dt-fig dt-fill-ink" x="372" y="272" fontSize="16" textAnchor="end">
          {words.ha}
        </text>
      </g>
    </TileSvg>
  );
}
