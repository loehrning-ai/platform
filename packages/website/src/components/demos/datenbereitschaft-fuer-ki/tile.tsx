import { tileNumber } from "@/lib/demo-tiles/format";
import { HatchDef, TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W03 "Stufe oder Treppe?", hub miniature: the lever. April hangs below the
 * zero line (hatched, -19.960); the steps are lifted onto ground that rises
 * from the floor, and the same three steps stand as a staircase: 334.675.
 * One scale (2.2 units per 1.000 EUR) in both frames, so a step is as long
 * at the start as at the end. End frame: the staircase with the start rung
 * labelled, the big level, the old figure small, the stamp. Motion: tile-motion.ts.
 */
const HATCH = "dt-hatch-w03";
/** Terrakotta tief: the demo's step colour, so the tile and the demo read as one object. */
const TIEF = "var(--color-terrakotta-tief)";
const ZERO = 196;
const FLOOR = 262;
/** y of a level on the staircase frame (300.000 sits on the floor). */
const at = (level: number) => Math.round((FLOOR - ((level - 300_000) / 1000) * 2.2) * 10) / 10;
const APR_TOP = at(354_635);
const APR_LEVEL = at(334_675);
const MAY_LEVEL = at(344_450);
const JUN_LEVEL = at(387_015);

export default function Tile({ locale, reducedMotion }: TileProps) {
  const money = (value: number) => (locale === "de" ? `${tileNumber(value, locale)} €` : `${value < 0 ? "−" : ""}€${tileNumber(Math.abs(value), locale)}`);
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <HatchDef id={HATCH} />
      <path data-t="floor" className="dt-stroke-ink" d={`M30 ${FLOOR}H370`} strokeWidth="3" />
      <rect data-t="p-apr" className="dt-fill-ink" x="50" y={APR_LEVEL} width="70" height={FLOOR - APR_LEVEL} />
      <rect data-t="p-may" className="dt-fill-ink" x="145" y={APR_LEVEL} width="70" height={FLOOR - APR_LEVEL} />
      <rect data-t="p-jun" className="dt-fill-ink" x="240" y={MAY_LEVEL} width="70" height={FLOOR - MAY_LEVEL} />
      <rect data-t="s-apr" fill={`url(#${HATCH})`} className="dt-stroke-ink" x="50" y={APR_TOP} width="70" height={APR_LEVEL - APR_TOP} strokeWidth="2.5" />
      <rect data-t="s-may" fill={TIEF} x="145" y={MAY_LEVEL} width="70" height={APR_LEVEL - MAY_LEVEL} />
      <rect data-t="s-jun" fill={TIEF} x="240" y={JUN_LEVEL} width="70" height={MAY_LEVEL - JUN_LEVEL} />
      <path data-t="zero" className="dt-stroke-mid" d={`M30 ${ZERO}H370`} strokeWidth="3" pathLength="1" strokeDasharray="1" />
      <text data-t="fig-a" className="dt-fig dt-fill-ink" x="30" y="76" fontSize="38">
        {money(-19960)}
      </text>
      <text data-t="fig-b" className="dt-fig dt-fill-ink" x="30" y="76" fontSize="38">
        {money(334675)}
      </text>
      <g data-t="rung">
        <path className="dt-stroke-ink" d={`M30 ${APR_TOP}H370`} strokeWidth="2.5" strokeDasharray="3 7" />
        <text className="dt-fig dt-fill-ink" x="30" y={APR_TOP - 8} fontSize="17">
          {`${locale === "de" ? "Start" : "Start"} ${tileNumber(354635, locale)}`}
        </text>
      </g>
      <g data-t="stamp">
        <rect className="dt-fill-ink" x="286" y="20" width="88" height="34" />
        <text className="dt-fig dt-fill-ground" x="330" y="44" fontSize="22" textAnchor="middle">
          {locale === "de" ? "Stand" : "Level"}
        </text>
      </g>
      <text data-t="ghost" className="dt-fig dt-fill-ink" x="30" y="106" fontSize="18">
        {`${locale === "de" ? "Stufe war" : "Step was"} ${money(-19960)}`}
      </text>
    </TileSvg>
  );
}
