import { kitCheck } from "@/lib/demo-cases/ki-prognosen-einschaetzen/kit";
import { tileNumber } from "@/lib/demo-tiles/format";
import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W01 "Die Fehlerliste", hub miniature: the demo's hook. The last 26 weeks
 * of the kit's lentil soup rise as bars; the tool's forecast lands on them as
 * mark ticks next to its claim, 94,2 %; then the dashed line of "same as last
 * week" (the bars moved one week) and its own score with the same formula,
 * 92,6 %. Two numbers that close are the question the demo answers. Every
 * value comes from the same check as the demo. Motion: tile-motion.ts.
 */
const { check, result } = kitCheck(null, null);
const WEEKS = check.wochen.slice(-26);
const LEFT = 24;
const RIGHT = 376;
const BASE = 270;
const TOP = 120;
const STEP = (RIGHT - LEFT) / WEEKS.length;
const BAR = Math.round(STEP * 0.62);
const values = WEEKS.flatMap((t) => [check.rows[t]?.ist ?? 0, check.forecast(t) ?? 0, check.rule(t) ?? 0]);
const FLOOR = Math.floor((Math.min(...values) - 40) / 50) * 50;
const CEIL = Math.max(...values);
const y = (value: number) => Math.round(BASE - ((value - FLOOR) / (CEIL - FLOOR)) * (BASE - TOP));
const x = (i: number) => Math.round(LEFT + i * STEP + (STEP - BAR) / 2);

const BARS = WEEKS.map((t, i) => `M${x(i)} ${BASE}V${y(check.rows[t]?.ist ?? FLOOR)}h${BAR}V${BASE}z`).join("");
const TICKS = WEEKS.map((t, i) => `M${x(i) - 2} ${y(check.forecast(t) ?? FLOOR)}h${BAR + 4}`).join("");
const RULE = WEEKS.map((t, i) => `${i === 0 ? "M" : "L"}${x(i) - 2} ${y(check.rule(t) ?? FLOOR)}h${BAR + 4}`).join("");
const TOOL = 1 - (result.tabelle.Prognose?.wape ?? 0);
/** What each number is, under its mark: the tool's own claim and the simplest rule. */
const LABELS = {
  de: { tool: "sagt das Tool", plain: "wie letzte Woche" },
  en: { tool: "the tool claims", plain: "same as last week" },
} as const;
const PLAIN = 1 - (result.tabelle["wie letzte Woche"]?.wape ?? 0);

export default function Tile({ locale, reducedMotion }: TileProps) {
  const percent = (share: number) => `${tileNumber(share * 100, locale, { digits: 1 })}\u00a0%`;
  const words = LABELS[locale];
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <path data-t="bars" className="dt-fill-ink" d={BARS} />
      <path data-t="ticks" className="dt-stroke-mark" d={TICKS} strokeWidth="4" />
      <path data-t="rule" className="dt-stroke-ink" d={RULE} strokeWidth="2.5" strokeDasharray="5 3" />
      <path className="dt-stroke-ink" d={`M${LEFT} ${BASE + 2}H${RIGHT}`} strokeWidth="3" />
      <g data-t="tool">
        <text className="dt-fig dt-fill-mark" x={LEFT} y="70" fontSize="50">
          {percent(TOOL)}
        </text>
        <path className="dt-stroke-mark" d={`M${LEFT} 88h52`} strokeWidth="5" />
        <text className="dt-fig dt-fill-mark" x={LEFT + 60} y="93" fontSize="15">
          {words.tool}
        </text>
      </g>
      <g data-t="plain">
        <text className="dt-fig dt-fill-ink" x={RIGHT} y="70" fontSize="50" textAnchor="end">
          {percent(PLAIN)}
        </text>
        <path className="dt-stroke-ink" d={`M${RIGHT - 52} 88h52`} strokeWidth="3" strokeDasharray="6 4" />
        <text className="dt-fig dt-fill-ink" x={RIGHT - 60} y="93" fontSize="15" textAnchor="end">
          {words.plain}
        </text>
      </g>
    </TileSvg>
  );
}
