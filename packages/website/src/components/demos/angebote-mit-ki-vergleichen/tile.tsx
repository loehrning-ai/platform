import { kitRows, modelAt } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import { fmtEur } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import { TileSvg, type TileProps } from "../hub/tile-kit";

/*
 * W06 "Die Vergleichsbasis", hub miniature: the lowest unit price is the most expensive offer. Three
 * rows in goods order (B, C, A) draw their goods price in ink; freight, one-off costs and storage
 * stack on in the scene's mid; then the rows move to the delivered order (C, A, B) and the totals
 * arrive. Every length and number comes from the kit's kostenzeilen.csv through the demo's engine.
 * End frame: C on top, B at the bottom with the longest bar. Motion: tile-motion.ts.
 */
const COPY = {
  de: { before: "nach dem Stückpreis", after: "geliefert und bezahlt", goods: "Ware", added: "Fracht, Lager, Einmalkosten" },
  en: { before: "by unit price", after: "delivered and paid", goods: "goods", added: "freight, storage, one-off costs" },
} as const;

const MODEL = modelAt(kitRows("de"), 0);
const X0 = 118;
const WIDTH = 252;
const ROW_Y = [74, 146, 218] as const;
const BAR_H = 26;
const max = Math.max(
  ...MODEL.options.map((option) => MODEL.lines.reduce((sum, line) => sum + Math.max(0, option.lines[line] ?? 0), 0)),
);
const scale = (cents: number) => Math.round((cents / max) * WIDTH * 10) / 10;

/** Each offer in goods order, with its goods bar, its added bar and where the motion starts it (start = ty in tile-motion.ts). */
export const TILE_ROWS = MODEL.byHeadline.map((option, from) => {
  const goods = scale(option.lines[MODEL.lines[0]!] ?? 0);
  const added = scale(MODEL.lines.slice(1).reduce((sum, line) => sum + Math.max(0, option.lines[line] ?? 0), 0));
  const to = MODEL.ranked.indexOf(option);
  return { option, from, to, goods, added, start: ROW_Y[from]! - ROW_Y[to]! };
});

export default function Tile({ locale, reducedMotion }: TileProps) {
  const words = COPY[locale];
  return (
    <TileSvg reducedMotion={reducedMotion}>
      <g data-t="before">
        <text className="dt-fig dt-fill-ink" x="24" y="40" fontSize="17">
          {words.before}
        </text>
      </g>
      <g data-t="after">
        <text className="dt-fig dt-fill-ink" x="24" y="40" fontSize="17">
          {words.after}
        </text>
      </g>
      <g data-t="legend">
        <rect className="dt-fill-ink" x="24" y="281" width="14" height="10" />
        <text className="dt-fig dt-fill-ink" x="44" y="291" fontSize="13">
          {words.goods}
        </text>
        <rect className="dt-fill-mid" x="104" y="281" width="14" height="10" />
        <text className="dt-fig dt-fill-ink" x="124" y="291" fontSize="13">
          {words.added}
        </text>
      </g>
      {TILE_ROWS.map(({ option, to, goods, added }) => {
        // The end frame: the delivered order. The motion starts each row at its goods-order place.
        const y = ROW_Y[to]!;
        const letter = option.name.slice(0, 1);
        return (
          <g key={option.name} data-t={`row-${letter.toLowerCase()}`}>
            <text className="dt-fig dt-fill-ink" x="24" y={y + 20} fontSize="22">
              {letter}
            </text>
            <rect data-t={`goods-${letter.toLowerCase()}`} className="dt-fill-ink" x={X0} y={y} width={goods} height={BAR_H} />
            {added > 0 ? (
              <rect data-t={`added-${letter.toLowerCase()}`} className="dt-fill-mid" x={X0 + goods} y={y} width={added} height={BAR_H} />
            ) : null}
            <g data-t={`total-${letter.toLowerCase()}`}>
              <text className="dt-fig dt-fill-ink" x={X0} y={y + 46} fontSize="15">
                {fmtEur(option.total, locale)}
              </text>
            </g>
            <text className="dt-fig dt-fill-ink" x="44" y={y + 20} fontSize="13">
              {option.name.slice(2)}
            </text>
          </g>
        );
      })}
    </TileSvg>
  );
}
