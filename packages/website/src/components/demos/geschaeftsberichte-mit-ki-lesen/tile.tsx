import { rate, type Counter } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { tileNumber } from "@/lib/demo-tiles/format";
import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W02 "Eine Datei, drei Antworten", hub miniature: one CSV, three rails.
 * Records per 1.000 shipped (dashes, one per record), affected units
 * (outline) and scrapped units (Mennige). Each rail is drawn at its
 * September length with a ghost tick at August: shorter, the same, longer.
 * The first frame shows the August lengths; motion: tile-motion.ts.
 */
const X0 = 40;
const FULL = 300;
const BAR_H = 26;
const RAILS: readonly { readonly counter: Counter; readonly y: number; readonly id: string; readonly fig: string; readonly sign: string }[] = [
  { counter: "records", y: 74, id: "ra", fig: "fa", sign: "↓" },
  { counter: "affected", y: 158, id: "rb", fig: "fb", sign: "=" },
  { counter: "scrapped", y: 242, id: "rc", fig: "fc", sign: "↑" },
];

function lengths(counter: Counter) {
  const aug = rate(counter, "aug");
  const sep = rate(counter, "sep");
  const top = Math.max(aug, sep);
  return { aug: Math.round((aug / top) * FULL), sep: Math.round((sep / top) * FULL), value: sep };
}

export default function Tile({ locale, reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      {RAILS.map(({ counter, y, id, fig, sign }) => {
        const { aug, sep, value } = lengths(counter);
        const digits = counter === "records" ? 2 : 0;
        const bar =
          counter === "records" ? (
            <path data-t={id} className="dt-stroke-ink" d={`M${X0} ${y + BAR_H / 2}H${X0 + sep}`} strokeWidth={BAR_H} strokeDasharray="7 5" />
          ) : (
            <rect
              data-t={id}
              className={counter === "scrapped" ? "dt-fill-mark" : "dt-fill-ground dt-stroke-ink"}
              x={X0}
              y={y}
              width={sep}
              height={BAR_H}
              strokeWidth="3"
            />
          );
        return (
          <g key={counter}>
            <path className="dt-stroke-ghost" d={`M${X0 + aug} ${y - 8}V${y + BAR_H + 8}`} strokeWidth="2" strokeDasharray="4 3" />
            {bar}
            <text data-t={fig} className={`dt-fig ${counter === "scrapped" ? "dt-fill-mark" : "dt-fill-ink"}`} x={X0 + FULL + 20} y={y - 10} textAnchor="end" fontSize="26">
              {`${sign} ${tileNumber(value, locale, { digits })}`}
            </text>
          </g>
        );
      })}
      <path className="dt-stroke-ink" d={`M${X0 - 6} 40V286`} strokeWidth="3" />
    </TileSvg>
  );
}
