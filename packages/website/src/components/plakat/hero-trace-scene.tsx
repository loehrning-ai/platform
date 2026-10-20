import type { ReactNode } from "react";
import "./hero-trace.css";

/**
 * "The trace": the hero scene of Workshop 02 (reading annual reports with AI).
 *
 * Two stacked report pages with rows. A ring sweeps down the rows and three
 * figure rows lift out as dots. Each dot travels along a dotted thread into a
 * bar of a small chart. Then the last thread is walked backwards: a hollow dot
 * returns to its page row, and the bar where the figure and the page disagree
 * turns Himbeere and gets a cross. Every number must trace back to its page.
 *
 * Meaning sits in shape and position (the cross, the returning thread), never
 * in colour alone, and no word is drawn. Pure SVG with class names; hero-trace.css
 * holds the colours (scene tokens) and plays the story under
 * `prefers-reduced-motion: no-preference` only. The base styles are the
 * finished still frame.
 */

const ROWS = [140, 170, 200, 230, 260, 290, 320, 350] as const;
const LABEL_WIDTH = [92, 70, 104, 60, 84, 98, 66, 80] as const;
/** Rows whose figure is lifted into the chart: index into ROWS. */
const FIGURE_ROWS = [1, 4, 6] as const;
const BARS = [
  { x: 400, height: 170 },
  { x: 452, height: 125 },
  { x: 504, height: 85 },
] as const;
const BASELINE = 384;
const THREADS = [
  "M258 170C311.3 170 364.7 214 418 214",
  "M258 260C328.7 260 399.3 259 470 259",
  "M258 320C346 320 434 299 522 299",
] as const;
const THREAD_BACK = "M522 299C434 299 346 320 258 320";
const DUST: readonly (readonly [number, number, number])[] = [
  [64, 52, 2.6],
  [330, 70, 2.2],
  [560, 120, 2.8],
  [330, 440, 2.4],
  [92, 440, 2],
  [566, 432, 2.6],
];

export function TraceScene(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="trace"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="ht-root block size-full"
    >
      <g transform="translate(0 38)">
        {/* Far layer: stepped discs behind the chart and a little dust. */}
        <g className="ht-far">
          <circle cx="440" cy="300" r="156" className="ht-disc ht-disc-a" />
          <circle cx="440" cy="300" r="117" className="ht-disc ht-disc-b" />
          <circle cx="440" cy="300" r="78" className="ht-disc ht-disc-c" />
        </g>
        <g className="ht-dust">
          {DUST.map(([x, y, r]) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={r}
              className="ht-dust-dot"
            />
          ))}
        </g>

        {/* The chart: baseline, axis, hairline guides, three bars. */}
        <path
          d={`M384 ${BASELINE}H554M384 ${BASELINE}V190`}
          className="ht-axis"
        />
        <path d="M392 214H552M392 299H552" className="ht-guide" />
        {BARS.map((bar, index) => (
          <g key={bar.x} className={`ht-bar ht-bar-${index + 1}`}>
            <rect
              x={bar.x}
              y={BASELINE - bar.height}
              width="36"
              height={bar.height}
              className="ht-bar-rect"
            />
            {index === 2 ? (
              <rect
                x={bar.x}
                y={BASELINE - bar.height}
                width="36"
                height={bar.height}
                className="ht-bar-flag"
              />
            ) : null}
          </g>
        ))}

        {/* The pages: one behind, one in front, rows on the front one. */}
        <g className="ht-pages">
          <rect
            x="58"
            y="66"
            width="196"
            height="300"
            className="ht-page ht-page-back"
          />
          <path d="M76 77H136" className="ht-peek" />
          <rect x="76" y="84" width="196" height="300" className="ht-page" />
          <path d="M96 106H186" className="ht-head" />
          {ROWS.map((y, index) => {
            const figure = (FIGURE_ROWS as readonly number[]).includes(index);
            return (
              <g key={y}>
                <path
                  d={`M96 ${y}H${96 + LABEL_WIDTH[index]}`}
                  className={figure ? "ht-label ht-label-on" : "ht-label"}
                />
                <rect
                  x="226"
                  y={y - 5}
                  width="30"
                  height="10"
                  rx="3"
                  className={figure ? "ht-cell ht-cell-on" : "ht-cell"}
                />
              </g>
            );
          })}
        </g>

        {/* Threads from the page to the bars, dotted. */}
        <g className="ht-threads">
          {THREADS.map((d, index) => (
            <path key={d} d={d} className={`ht-thread ht-thread-${index + 1}`} />
          ))}
        </g>
        <path d={THREAD_BACK} pathLength={1} className="ht-trace" />

        {/* The ring that sweeps down the rows. */}
        <g className="ht-scan">
          <rect x="76" y="126" width="196" height="28" className="ht-band" />
          <circle cx="241" cy="140" r="15" className="ht-scan-ring" />
        </g>

        {/* The page figure that disagrees turns Himbeere with the bar. */}
        <rect x="226" y="315" width="30" height="10" rx="3" className="ht-cell-flag" />

        {/* Three figures travel into the bars. */}
        <circle cx="418" cy="214" r="5.5" className="ht-dot ht-dot-1" />
        <circle cx="470" cy="259" r="5.5" className="ht-dot ht-dot-2" />
        <circle cx="522" cy="299" r="5.5" className="ht-dot ht-dot-3" />

        {/* Traced back: a hollow dot returns to its page row, a ring marks it. */}
        <circle cx="258" cy="320" r="6.5" className="ht-back" />
        <circle cx="241" cy="320" r="19" className="ht-ring" />

        {/* Where figure and page disagree: a cross above the bar. */}
        <g className="ht-cross">
          <circle cx="522" cy="268" r="14" className="ht-cross-disc" />
          <path
            d="M516 262L528 274M528 262L516 274"
            className="ht-cross-glyph"
          />
        </g>
      </g>
    </svg>
  );
}
