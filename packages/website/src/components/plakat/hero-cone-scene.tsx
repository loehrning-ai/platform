import type { ReactNode } from "react";
import "./hero-cone.css";

/**
 * "The cone": the scene of Workshop 01 (can AI predict the future).
 *
 * A solid line of what happened draws to NOW. Nine dashed forecasts fan out
 * of it into a widening cone: the further out, the less they agree. Two
 * hairlines on the right mark the band the business can live with. Forecasts
 * that leave the band dim, the cone narrows, and a person (a small square
 * stamp) hops onto the one path that stays inside and signs it. Then the real
 * outcome draws in Mennige: it lands inside the cone, but not on the middle
 * path. Forecasts widen with time and a person has to sign.
 *
 * Shapes only, no word. Pure SVG with class names, no id, no gradient, no
 * filter, no script. hero-cone.css holds the still frame (the story's last
 * beat) and plays the 9 second loop under `no-preference` only.
 * Canvas 600 x 500; meaningful content stays inside x 50..550, y 50..450.
 */

type Point = readonly [x: number, y: number];

const NOW: Point = [230, 250];
const TIP_X = 545;
/** End heights of the nine forecasts. Index 4 is the middle path, index 5 the signed one. */
const ENDS = [90, 128, 166, 198, 226, 272, 322, 364, 408] as const;
const MIDDLE = 4;
const SIGNED = 5;
const BAND: readonly [top: number, bottom: number] = [248, 302];
const OUTCOME_END = 292;

const round = (value: number): number => Math.round(value * 10) / 10;

function forecastPath(endY: number): string {
  const spread = endY - NOW[1];
  const c1: Point = [350, round(NOW[1] + spread * 0.1)];
  const c2: Point = [440, round(endY - spread * 0.04)];
  return `M${NOW[0]} ${NOW[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${TIP_X} ${endY}`;
}

/** The filled cone between the highest and lowest forecast, so the shape reads at a glance. */
function wedge(top: number, bottom: number): string {
  return `M${NOW[0]} ${NOW[1]}L${TIP_X} ${top}V${bottom}Z`;
}

/** A point on the signed forecast, found by walking the cubic until x is reached. */
function signedPoint(x: number): Point {
  const endY = ENDS[SIGNED];
  const spread = endY - NOW[1];
  const p = [NOW, [350, NOW[1] + spread * 0.1], [440, endY - spread * 0.04], [TIP_X, endY]] as const;
  let best: Point = NOW;
  for (let step = 0; step <= 200; step += 1) {
    const t = step / 200;
    const m = 1 - t;
    const px = m ** 3 * p[0][0] + 3 * m * m * t * p[1][0] + 3 * m * t * t * p[2][0] + t ** 3 * p[3][0];
    const py = m ** 3 * p[0][1] + 3 * m * m * t * p[1][1] + 3 * m * t * t * p[2][1] + t ** 3 * p[3][1];
    if (Math.abs(px - x) < Math.abs(best[0] - x)) best = [round(px), round(py)];
  }
  return best;
}

const HISTORY = "M62 322L86 298L106 308L130 276L152 290L174 262L196 272L214 254L230 250";
const OUTCOME = `M${NOW[0]} ${NOW[1]}C288 286 332 322 392 312S490 288 ${TIP_X} ${OUTCOME_END}`;

const DUST: readonly (readonly [number, number, number])[] = [
  [74, 120, 2.6],
  [150, 410, 2.2],
  [330, 70, 2.4],
  [498, 436, 2.8],
  [560, 150, 2],
  [60, 220, 2],
  [380, 440, 2.4],
];

const DISCS = [226, 176, 128, 84] as const;

function Forecast({ endY }: { readonly endY: number }): ReactNode {
  return (
    <>
      <path d={forecastPath(endY)} className="hc-path" />
      <circle cx={TIP_X} cy={endY} r={3.6} className="hc-tip" />
    </>
  );
}

export function ConeScene(): ReactNode {
  const stamp = signedPoint(488);
  const outer = [0, 1, 7, 8].map((index) => ENDS[index]);
  const inner = [2, 3, MIDDLE, 6].map((index) => ENDS[index]);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="cone"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="hc-root block size-full"
    >
      {/* Far layer: stepped paper discs around NOW and slow dust. */}
      <g className="hc-far">
        {DISCS.map((radius) => (
          <circle key={radius} cx={NOW[0]} cy={NOW[1]} r={radius} className="hc-disc" />
        ))}
      </g>
      <g className="hc-dust">
        {DUST.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hc-dust-dot" />
        ))}
      </g>

      <g className="hc-story">
        <path d={`M${NOW[0]} 84V416`} className="hc-now-line" />

        {/* Mid layer: the tolerance band on the right. */}
        <g className="hc-band">
          <rect x="432" y={BAND[0]} width="120" height={BAND[1] - BAND[0]} className="hc-band-wash" />
          <path d={`M432 ${BAND[0]}H552M432 ${BAND[1]}H552M552 ${BAND[0]}V${BAND[1]}`} className="hc-band-line" />
        </g>

        {/* The forecasts. The outer ones leave the band first, then the nearer ones. */}
        <g className="hc-cone hc-cone-out">
          <path d={wedge(ENDS[0], ENDS[8])} className="hc-wedge" />
          {outer.map((endY) => (
            <Forecast key={endY} endY={endY} />
          ))}
        </g>
        <g className="hc-cone hc-cone-in">
          {inner.map((endY) => (
            <Forecast key={endY} endY={endY} />
          ))}
        </g>
        <g className="hc-cone hc-cone-kept">
          <path d={wedge(ENDS[2], ENDS[6])} className="hc-wedge" />
          <Forecast endY={ENDS[SIGNED]} />
        </g>
        <path d={forecastPath(ENDS[SIGNED])} className="hc-signed" />

        {/* The past: a solid line that draws to NOW. */}
        <path d={HISTORY} pathLength={1} className="hc-history" />
        <g className="hc-now">
          <circle cx={NOW[0]} cy={NOW[1]} r={7.5} className="hc-now-dot" />
        </g>
        <circle cx={NOW[0]} cy={NOW[1]} r={15} className="hc-now-ring" />

        {/* Near layer: the person signs one forecast, then the real outcome arrives. */}
        <g transform={`translate(${stamp[0]} ${stamp[1]})`}>
          <rect x="-19" y="-19" width="38" height="38" className="hc-seal" />
          <g className="hc-stamp">
            <rect x="-17" y="-17" width="34" height="34" rx="4" className="hc-stamp-body" />
            <circle cx="0" cy="-5.5" r="6" className="hc-stamp-glyph" />
            <path d="M-11 12A11 8.5 0 0 1 11 12Z" className="hc-stamp-glyph" />
          </g>
        </g>
        <path d={OUTCOME} pathLength={1} className="hc-outcome-halo" />
        <path d={OUTCOME} pathLength={1} className="hc-outcome" />
        <g className="hc-end">
          <circle cx={TIP_X} cy={OUTCOME_END} r={9} className="hc-end-dot" />
        </g>
      </g>
    </svg>
  );
}
