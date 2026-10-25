import { estimateEm, fitSize } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/geometry";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";
import type { Scene } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/scene";
import { formatters, headline, type Series } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/series";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";

/**
 * The header of the stage: the name of the column, the word tag, and the big
 * counter. The counter is ONE number that runs from the change headline to
 * the level headline in tabular numerals; the word tag and the caption under
 * it cut over hard at p = 0.5 (never two texts on top of each other).
 */
export function Head({
  series,
  scene,
  pack,
  width,
}: {
  readonly series: Series;
  readonly scene: Scene;
  readonly pack: DemoPack;
  /** The plot box width in px: the counter shrinks to fit the longer of its two ends. */
  readonly width: number;
}) {
  const { ui } = pack;
  const { money } = formatters(series, pack.locale);
  const head = headline(series);
  const ends = [money(head.change), money(head.level)];
  const longest = ends.reduce((a, b) => (estimateEm(b) > estimateEm(a) ? b : a));
  const size = fitSize(longest, Math.max(120, width - 12), width >= 480 ? 52 : 38, 22);
  const first = series.changes[0] ?? 0;
  return (
    <div className="dr3-head" data-word={scene.word} aria-hidden="true">
      <div className="dr3-head-top">
        {series.name ? (
          <span className="dr3-chip" data-chip="">
            {series.name}
          </span>
        ) : (
          <span />
        )}
        <span className="dr3-tag" data-tag="">
          {scene.word === "change" ? ui.wordChange : ui.wordLevel}
        </span>
      </div>
      <p className="dr3-counter" style={{ fontSize: `${size}px` }} data-counter="">
        {money(scene.counter)}
      </p>
      <p className="dr3-ghost" data-ghost="">
        {head.first ? (
          <span style={{ opacity: scene.ghost }}>{fill(ui.before, { x: money(first) })}</span>
        ) : scene.word === "change" ? (
          ui.headGrowth
        ) : (
          ui.headLast
        )}
      </p>
    </div>
  );
}
