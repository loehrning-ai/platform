import { WEEKS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { tileNumber } from "@/lib/demo-tiles/format";
import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W02 "Monatsgrenze", hub miniature: the same nine weeks (real heights) with a
 * cut line that moves; every cut gives another headline: +26 %, -20 %, +105 %.
 * The first frame is already the story's start (nine columns, cut after
 * week 4, +26 %); the other two cuts follow. End frame: the cut after week 3,
 * two ghost lines where it was, all three figures. Motion: tile-motion.ts.
 */
const BASE = 262;
const X0 = 47;
const SLOT = 34;
const colX = (index: number) => X0 + SLOT * index;
const colH = (index: number) => Math.round(((WEEKS[index]?.revenueEur ?? 0) / 4.5e6) * 118);
const cutX = (after: number) => colX(after) - 3;

const FIGURES = [
  { id: "f3", x: 86, value: 105, cut: "3 | 6", cls: "dt-fill-ink" },
  { id: "f1", x: 200, value: 26, cut: "4 | 5", cls: "dt-fill-ink" },
  { id: "f2", x: 314, value: -20, cut: "5 | 4", cls: "dt-fill-mark" },
] as const;

export default function Tile({ locale, reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      {WEEKS.map((_, index) => {
        const cls = index < 3 ? "dt-fill-ink" : "dt-fill-mark";
        const rect = (c: string, data?: string) => (
          <rect data-t={data} className={c} x={colX(index)} y={BASE - colH(index)} width="28" height={colH(index)} />
        );
        return (
          <g key={index}>
            {index === 3 || index === 4 ? rect("dt-fill-ink") : null}
            {index === 3 ? rect("dt-fill-mark", "m4") : index === 4 ? rect("dt-fill-mark", "m5") : rect(cls)}
          </g>
        );
      })}
      <path className="dt-stroke-ink" d={`M${X0 - 8} ${BASE}H${X0 + SLOT * 9}`} strokeWidth="3" />
      <path data-t="g4" className="dt-stroke-ghost" d={`M${cutX(4)} 126V270`} strokeWidth="2" strokeDasharray="5 4" />
      <path data-t="g5" className="dt-stroke-ghost" d={`M${cutX(5)} 126V270`} strokeWidth="2" strokeDasharray="5 4" />
      <g data-t="cut">
        <path className="dt-stroke-ink" d={`M${cutX(3)} 126V270`} strokeWidth="3" />
        <circle className="dt-fill-ink dt-stroke-ground" cx={cutX(3)} cy="126" r="11" strokeWidth="3" />
      </g>
      {FIGURES.map(({ id, x, value, cut, cls }) => (
        <g key={id} data-t={id}>
          <text className={`dt-fig ${cls}`} x={x} y="76" textAnchor="middle" fontSize="34">
            {`${tileNumber(value, locale, { sign: true })}\u202f%`}
          </text>
          <text className="dt-fig dt-fill-mid" x={x} y="98" textAnchor="middle" fontSize="15">
            {cut}
          </text>
        </g>
      ))}
    </TileSvg>
  );
}
