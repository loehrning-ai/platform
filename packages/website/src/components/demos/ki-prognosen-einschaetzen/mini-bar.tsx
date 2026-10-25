import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { columnPaths, makeFrame, yOf } from "./geometry";

const W = 112;
const H = 36;

/**
 * The sticky bar that keeps the answer in sight while the visitor works
 * further down (Waage, week strip, form) and the chart is off screen: the
 * count, the same staircase drawn small (black sold, red short, on paper)
 * and the stock.
 */
export function MiniBar({
  copy,
  samples,
  cap,
  short,
  domain,
  display,
}: {
  readonly copy: DemoPack;
  readonly samples: readonly number[];
  readonly cap: number;
  readonly short: number;
  readonly domain: readonly [number, number];
  readonly display: string;
}) {
  const frame = makeFrame(W, H, domain, {
    left: 4,
    right: 4,
    top: 4,
    bottom: 4,
  });
  const paths = columnPaths(frame, samples, cap);
  const capY = yOf(frame, cap);
  return (
    <div className="hw-minibar-slot">
      <div className="hw-minibar" data-hw-minibar="">
        <span className="hw-minibar-count">{short} / 100</span>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          focusable="false"
        >
          <rect width={W} height={H} className="hw-mini-bg" />
          <path d={paths.left} className="hw-grey" />
          <path d={paths.ink} className="hw-ink" />
          <path d={paths.short} className="hw-mennige" />
          <line x1="0" x2={W} y1={capY} y2={capY} className="hw-mini-line" />
        </svg>
        <span className="hw-minibar-cap">
          {fill(copy.controls.miniBar, { cap: display })}
        </span>
      </div>
    </div>
  );
}
