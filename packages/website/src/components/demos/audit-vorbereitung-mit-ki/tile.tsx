import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W05 "Nachweisprüfung", hub miniature: eight request chips on the left, the
 * eight files their names link on the right, a line between each pair. A
 * test bar sweeps down; four lines turn dashed (SCHWACH), two break apart
 * (LÜCKE), two stay solid (BELEGT), and the counter drops from 8/8 to 2/8.
 * The start frame already shows the whole folder linked. Motion:
 * tile-motion.ts. End frame: two solid, four dashed, two broken, 2/8.
 */
export const ROW_Y = [62, 90, 118, 146, 174, 202, 230, 258] as const;
/** Per item: "c" covered, "w" weak, "g" gap; the order of the kit's answer key. */
export const STATES = ["c", "w", "w", "w", "g", "c", "g", "w"] as const;
const LEFT = 108;
const RIGHT = 240;
const MID = (LEFT + RIGHT) / 2;

/** One path for many boxes: the static parts are drawn once, so the tile stays small. */
const boxes = (x: number, width: number) => ROW_Y.map((y) => `M${x} ${y - 11}h${width}v22h-${width}z`).join("");
const GHOSTS = ROW_Y.map((y, i) => `M${RIGHT + 9} ${y - 3}h${44 + ((i * 23) % 50)}v6H${RIGHT + 9}z`).join("");
const COVERED = ROW_Y.filter((_, i) => STATES[i] === "c").map((y) => `M${LEFT} ${y}H${RIGHT}`).join("");

export default function Tile({ reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <path className="dt-fill-ground dt-stroke-ink" d={boxes(36, 72) + boxes(RIGHT, 124)} strokeWidth="2.5" />
      <path className="dt-fill-ghost" d={GHOSTS} />
      <path className="dt-stroke-ink" d={COVERED} strokeWidth="3" />
      <text className="dt-fig dt-fill-ink" fontSize="16">
        {ROW_Y.map((y, i) => (
          <tspan key={y} x="46" y={y + 6}>{`R${i + 1}`}</tspan>
        ))}
      </text>
      {ROW_Y.map((y, i) => {
        const state = STATES[i];
        if (state === "c") return null;
        const solid = <line data-t={`s${i}`} className="dt-stroke-ink" x1={LEFT} y1={y} x2={RIGHT} y2={y} strokeWidth="3" style={{ opacity: 0 }} />;
        return state === "w" ? (
          <g key={y}>
            {solid}
            <line data-t={`d${i}`} className="dt-stroke-mark" x1={LEFT} y1={y} x2={RIGHT} y2={y} strokeWidth="3" strokeDasharray="9 6" />
          </g>
        ) : (
          <g key={y}>
            {solid}
            <line data-t={`a${i}`} className="dt-stroke-mark" x1={LEFT} y1={y} x2={MID - 10} y2={y} strokeWidth="3" />
            <line data-t={`b${i}`} className="dt-stroke-mark" x1={MID + 10} y1={y} x2={RIGHT} y2={y} strokeWidth="3" />
          </g>
        );
      })}
      <rect data-t="scan" className="dt-fill-ink" x="30" y="44" width="340" height="3" style={{ opacity: 0 }} />
      <text data-t="n8" className="dt-fig dt-fill-ink" x="364" y="34" fontSize="26" textAnchor="end" style={{ opacity: 0 }}>
        8/8
      </text>
      <text data-t="n2" className="dt-fig dt-fill-mark" x="364" y="34" fontSize="26" textAnchor="end">
        2/8
      </text>
    </TileSvg>
  );
}
