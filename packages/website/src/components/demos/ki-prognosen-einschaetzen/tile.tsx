import {
  CASE_WEEKS,
  LAUNCH_INDEX,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/case";
import { scenarios } from "@/lib/demo-cases/ki-prognosen-einschaetzen/quantile";
import { tileNumber } from "@/lib/demo-tiles/format";
import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W01 "Hundert Startwochen", hub miniature: the demo's own staircase, computed
 * from the same quantile module (40 of the 100 scenarios of the launch week).
 * End frame: the line at "Lager heute" 1.050 and "76 / 100", the hub's hook
 * ("1.050, erwartet 1.180: in 76 von 100 reicht es nicht"). The story lifts
 * the line to 1.180 (50 / 100) and brings it home. Motion: tile-motion.ts.
 * Every label sits on the ground above its line (cream on blue), never on the
 * columns, and is either on or off, never half faded; the numeral sits top
 * right, clear of the workshop chip.
 */
const HATCH = "dt-hatch-w01";
/** The shortage is the page's anti colour (Mennige): solid red with a cream hatch, so it reads at thumbnail size and not by colour alone. */
const RED = { fill: "var(--color-scene-anti-a)" } as const;
const LEFT = 20;
const RIGHT = 340;
const BASE = 270;
const PER_UNIT = 0.24;
const yOf = (value: number) =>
  Math.round((BASE - (value - 500) * PER_UNIT) * 10) / 10;
const COLUMNS = 40;
const STEP = (RIGHT - LEFT) / COLUMNS;

const samples = scenarios(
  CASE_WEEKS[LAUNCH_INDEX] as (typeof CASE_WEEKS)[number],
);
const COLUMN_PATH = Array.from({ length: COLUMNS }, (_, i) => {
  const value = samples[Math.min(99, Math.floor(i * 2.5 + 1))] as number;
  const y = Math.round(yOf(value) * 10) / 10;
  return `M${(LEFT + i * STEP).toFixed(1)} ${y}h${(STEP - 1.4).toFixed(1)}V${BASE}h-${(STEP - 1.4).toFixed(1)}z`;
}).join("");

/** The base (end) frame holds the line at the stock; the story lifts it to the forecast. */
const LINE_Y = yOf(1050);
const UP_Y = yOf(1180);

export default function Tile({ locale, reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <defs>
        <pattern
          id={HATCH}
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="9" height="9" style={RED} />
          <rect width="1.5" height="9" className="dt-fill-ink" />
        </pattern>
      </defs>
      <defs>
        <path id="dt-w01-cols" d={COLUMN_PATH} />
        <clipPath id="dt-w01-above">
          <rect x="0" y="0" width="400" height={LINE_Y} />
        </clipPath>
        <clipPath id="dt-w01-below">
          <rect x="0" y={LINE_Y} width="400" height={300 - LINE_Y} />
        </clipPath>
      </defs>
      <g data-t="wa" clipPath="url(#dt-w01-above)">
        <g data-t="ca">
          <g data-t="grow-a">
            <use href="#dt-w01-cols" fill={`url(#${HATCH})`} />
          </g>
        </g>
      </g>
      <g data-t="wb" clipPath="url(#dt-w01-below)">
        <g data-t="cb">
          <g data-t="grow-b">
            <use href="#dt-w01-cols" className="dt-fill-ink" />
          </g>
        </g>
      </g>
      <path
        data-t="tick"
        className="dt-stroke-ink"
        d={`M${LEFT} ${LINE_Y}H${RIGHT}`}
        strokeWidth="3.5"
        strokeDasharray="8 6"
      />
      <text
        data-t="l1050"
        className="dt-fig dt-fill-ink"
        x={LEFT + 4}
        y={LINE_Y - 12}
        fontSize="22"
      >
        {tileNumber(1050, locale)}
      </text>
      <text
        data-t="l1180"
        className="dt-fig dt-fill-ink"
        x={LEFT + 4}
        y={UP_Y - 12}
        fontSize="22"
      >
        {tileNumber(1180, locale)}
      </text>
      <g data-t="line">
        <path
          className="dt-stroke-ink"
          d={`M${LEFT} ${LINE_Y}H${RIGHT + 12}`}
          strokeWidth="3.5"
        />
        <rect
          className="dt-fill-ink"
          x={RIGHT + 12}
          y={LINE_Y - 15}
          width="30"
          height="30"
        />
      </g>
      <g data-t="ring">
        <circle
          className="dt-stroke-ink"
          cx={RIGHT + 27}
          cy={LINE_Y}
          r="27"
          strokeWidth="3"
          fill="none"
        />
      </g>
      <text
        data-t="c76"
        className="dt-fig dt-fill-mark"
        x={RIGHT + 40}
        y="56"
        fontSize="44"
        textAnchor="end"
      >
        76 / 100
      </text>
      <text
        data-t="c50"
        className="dt-fig dt-fill-mark"
        x={RIGHT + 40}
        y="56"
        fontSize="44"
        textAnchor="end"
      >
        50 / 100
      </text>
    </TileSvg>
  );
}
