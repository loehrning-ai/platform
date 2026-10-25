import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W05 "Was fliegt mit?", hub miniature: a message card whose four details sit
 * Mennige with their raw text showing; a scan beam runs down the card, each
 * detail is swept by a black bar and ends as a labelled slab (the label is
 * large enough to read at phone size) while the counter steps 4 to 0; then the
 * light under the card goes from red to amber and the lock's shackle snaps
 * shut, the body answering with a one-frame recoil. Danger turns safe, in that
 * order. Text is a few made-up words and the slab labels. Motion:
 * tile-motion.ts. End frame: four slabs, counter 0, amber light, lock shut.
 */
const RED = { fill: "var(--color-scene-anti-a)" } as const;
/** Row centres; every slab is SLAB tall. */
const ROWS = [84, 118, 152, 186] as const;
const SLAB = 28;
/** [row, x, width, the made-up raw text under the marker, the slab label]. */
const SLOTS: readonly (readonly [number, number, number, string, string])[] = [
  [0, 128, 76, "Mara B.", "NAME"],
  [1, 106, 132, "mara@b.invalid", "E-MAIL"],
  [2, 130, 130, "", "IBAN"],
  [3, 122, 118, "", "TEL"],
];
/** Grey text bars: [row, x, width]. */
const GHOST: readonly (readonly [number, number, number])[] = [
  [0, 58, 56], [0, 216, 110], [1, 58, 36], [1, 250, 66], [2, 58, 60], [2, 272, 70], [3, 252, 88],
];

export default function Tile({ reducedMotion }: TileProps) {
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <rect className="dt-stroke-ink" fill="none" x="40" y="62" width="320" height="170" strokeWidth="3" />
      {GHOST.map(([row, x, w]) => (
        <rect key={`${row}-${x}`} className="dt-fill-ghost" x={x} y={(ROWS[row] as number) - 6} width={w} height="12" />
      ))}
      {SLOTS.map(([row, x, w, raw, label], i) => {
        const y = (ROWS[row] as number) - SLAB / 2;
        return (
          <g key={i}>
            <g data-t={`m${i}`}>
              <rect style={RED} x={x} y={y} width={w} height={SLAB} />
              {raw ? (
                <text className="dt-fig dt-fill-ground" x={x + 7} y={y + 19} fontSize="15">
                  {raw}
                </text>
              ) : null}
            </g>
            <rect data-t={`b${i}`} className="dt-fill-ink" x={x} y={y} width={w} height={SLAB} />
            <g data-t={`p${i}`}>
              <rect className="dt-fill-ground dt-stroke-ink" x={x} y={y} width={w} height={SLAB} strokeWidth="2.5" />
              <text className="dt-fig dt-fill-ink" x={x + 9} y={y + 19.5} fontSize="16">
                {label}
              </text>
            </g>
          </g>
        );
      })}
      <rect data-t="scan" className="dt-fill-ink" x="40" y="66" width="320" height="3" />
      <rect className="dt-fill-mid dt-stroke-ink" x="40" y="250" width="262" height="14" strokeWidth="2.5" />
      <rect data-t="lr" style={RED} x="41.5" y="251.5" width="259" height="11" />
      <rect data-t="lb" className="dt-fill-ink" x="322" y="266" width="32" height="22" />
      <path data-t="lk" className="dt-stroke-ink" d="M330 266v-6a8 8 0 0 1 16 0v6" strokeWidth="4.5" />
      {[4, 3, 2, 1, 0].map((n) => (
        <text key={n} data-t={`n${n}`} className="dt-fig dt-fill-ink" x="360" y="48" fontSize="40" textAnchor="end">
          {n}
        </text>
      ))}
    </TileSvg>
  );
}
