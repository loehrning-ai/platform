import { formatNumber } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";
import { canPair, formatters, ratio, type Series } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/series";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";

/**
 * The closing proof, to scale: the last level as one block, and all the levels
 * added as one row of blocks, one per month. The row is as many times the
 * block as the ratio says (2,75 for the workshop's numbers). Every length
 * is the number itself; the room is always reserved and `pair` (0..1, from
 * the scene) only fades it in.
 */
export function ScalePair({
  series,
  pair,
  pack,
}: {
  readonly series: Series;
  readonly pair: number;
  readonly pack: DemoPack;
}) {
  const locale = pack.locale;
  const { num } = formatters(series, locale);
  // Nothing honest to compare (levels that rest on an assumed zero, or negative ones): no block, no reserved room.
  if (!canPair(series)) return null;
  const levels = series.levels;
  const total = levels.reduce((sum, value) => sum + value, 0);
  const last = levels[levels.length - 1] ?? 0;
  const times = ratio(series);
  const shown = pair > 0;
  return (
    <section
      className="dr3-pair"
      aria-hidden={pair < 0.5 ? true : undefined}
      data-pair={shown ? "on" : "off"}
      style={{ opacity: pair, visibility: shown ? "visible" : "hidden" }}
    >
      <p className="dr3-pair-ticker" data-ticker="">
        <span>{fill(pack.ops.tickerSum, { x: num(total) })}</span> <span className="dr3-nowrap">{fill(pack.ops.tickerRatio, { r: formatNumber(times, locale, 2) })}</span>
      </p>
      <p className="dr3-pair-label">{pack.ops.pairLast}</p>
      <div className="dr3-pair-row">
        <span className="dr3-pair-block dr3-pair-block-last" style={{ width: `${((last / total) * 100).toFixed(3)}%` }}>
          <span>{num(last)}</span>
        </span>
      </div>
      <p className="dr3-pair-label">{pack.ops.pairSum}</p>
      <div className="dr3-pair-row">
        {levels.map((value, index) => (
          <span key={index} className="dr3-pair-block" style={{ width: `${((value / total) * 100).toFixed(3)}%` }} data-month={index}>
            <span>{levels.length <= 4 ? num(value) : ""}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
