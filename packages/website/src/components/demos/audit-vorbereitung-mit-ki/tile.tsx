import { Fragment } from "react";
import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W05 "Ordner und Register", hub miniature: thirteen question chips on the left, the
 * papers they read on the right, a line between each pair. A test bar sweeps
 * down; one line turns dashed (weak), ten break apart (gap), two stay solid
 * (covered), and the counter drops from 13/13 to 2/13. The start frame
 * already shows the whole folder linked. Motion: tile-motion.ts. End frame:
 * two solid, one dashed, ten broken, 2/13.
 */
const ROWS = 13;
export const ROW_Y = Array.from({ length: ROWS }, (_, i) => Math.round(60 + i * 16.5));
/** Per question: "c" covered, "w" weak, "g" gap; the order of the oracle's tally (2, 1, 10). */
export const STATES = ["c", "g", "g", "g", "g", "g", "g", "g", "g", "g", "w", "g", "c"] as const;
const LEFT = 108;
const RIGHT = 240;
const MID = (LEFT + RIGHT) / 2;

/** One path for many boxes: the static parts are drawn once, so the tile stays small. */
const boxes = (x: number, width: number) => ROW_Y.map((y) => `M${x} ${y - 6}h${width}v12h-${width}z`).join("");
const GHOSTS = ROW_Y.map((y, i) => `M${RIGHT + 9} ${y - 2}h${44 + ((i * 23) % 50)}v4H${RIGHT + 9}z`).join("");
const COVERED = ROW_Y.filter((_, i) => STATES[i] === "c").map((y) => `M${LEFT} ${y}H${RIGHT}`).join("");

export default function Tile({ reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <path className="dt-fill-ground dt-stroke-ink" d={boxes(36, 72) + boxes(RIGHT, 124)} strokeWidth="2" />
      <path className="dt-fill-ghost" d={GHOSTS} />
      <path className="dt-stroke-ink" d={COVERED} strokeWidth="3" fill="none" />
      <g strokeWidth="3" fill="none">
        {ROW_Y.map((y, i) => {
          const state = STATES[i];
          if (state === "c") return null;
          const solid = <path data-t={`s${i}`} className="dt-stroke-ink" d={`M${LEFT} ${y}H${RIGHT}`} style={{ opacity: 0 }} />;
          return state === "w" ? (
            <Fragment key={y}>
              {solid}
              <path data-t={`d${i}`} className="dt-stroke-mark" d={`M${LEFT} ${y}H${RIGHT}`} strokeDasharray="9 6" />
            </Fragment>
          ) : (
            <Fragment key={y}>
              {solid}
              <path data-t={`a${i}`} className="dt-stroke-mark" d={`M${LEFT} ${y}H${MID - 10}M${MID + 10} ${y}H${RIGHT}`} />
            </Fragment>
          );
        })}
      </g>
      <rect data-t="scan" className="dt-fill-ink" x="30" y="44" width="340" height="3" style={{ opacity: 0 }} />
      <text data-t="n8" className="dt-fig dt-fill-ink" x="364" y="34" fontSize="26" textAnchor="end" style={{ opacity: 0 }}>
        13/13
      </text>
      <text data-t="n2" className="dt-fig dt-fill-mark" x="364" y="34" fontSize="26" textAnchor="end">
        2/13
      </text>
    </TileSvg>
  );
}
