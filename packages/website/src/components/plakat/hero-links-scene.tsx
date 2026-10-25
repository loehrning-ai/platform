import type { ReactNode } from "react";
import "./hero-links.css";

/**
 * "The links": the scene of Workshop 05 (audit preparation), drawn from the
 * first screen of its demo. Eight requests on the left, eight files on the
 * right, a line from each request to the file whose name fits. A band sweeps
 * down the rows: the four tests run. Two links hold, four turn dashed (WEAK)
 * and two break apart (GAP), and each failing file gets an accent frame and a
 * mark on the test it failed. A fitting name is not evidence.
 *
 * Meaning sits in shape (solid, dashed, broken), never in colour alone, and no
 * word is drawn. Pure SVG with class names, no id, no gradient, no filter, no
 * script. hero-links.css holds the colours (scene tokens) and plays the story
 * under `prefers-reduced-motion: no-preference` only; the base styles are the
 * finished still frame. One viewBox (600 x 500).
 */

const ROW_Y = [102, 144, 186, 228, 270, 312, 354, 396] as const;
const REQUEST = { x: 56, w: 118, h: 26 } as const;
const FILE = { x: 388, w: 156, h: 30 } as const;
const LINK = { from: REQUEST.x + REQUEST.w, to: FILE.x } as const;
/** Label bar lengths on the request tabs and the file cards, so the rows do not look stamped. */
const REQUEST_BAR = [64, 52, 70, 58, 48, 66, 54, 60] as const;
const FILE_BAR = [96, 110, 84, 118, 102, 90, 108, 120] as const;
/** The four test ticks under each link. */
const TICK = { x: 246, step: 18, w: 11, h: 6, dy: 9 } as const;

type Outcome = { readonly row: number; readonly kind: "weak" | "gap"; readonly failsAt: number };

/** The demo's naive run: R2 QUOTE, R3 SCOPE, R4 SCOPE, R8 APPROVAL turn WEAK; R5 and R7 fail QUOTE and break. */
const OUTCOMES: readonly Outcome[] = [
  { row: 1, kind: "weak", failsAt: 3 },
  { row: 2, kind: "weak", failsAt: 2 },
  { row: 3, kind: "weak", failsAt: 2 },
  { row: 4, kind: "gap", failsAt: 3 },
  { row: 6, kind: "gap", failsAt: 3 },
  { row: 7, kind: "weak", failsAt: 1 },
];
/** Where a broken link opens. */
const GAP = { from: 262, to: 300 } as const;

const DUST: readonly (readonly [number, number, number])[] = [
  [40, 60, 2.4],
  [300, 54, 2.2],
  [566, 74, 2.8],
  [578, 440, 2.4],
  [292, 452, 2.2],
  [30, 446, 2.6],
];

const linkPath = ROW_Y.map((y) => `M${LINK.from} ${y}H${LINK.to}`).join("");

function Failure({ outcome }: { readonly outcome: Outcome }): ReactNode {
  const y = ROW_Y[outcome.row] as number;
  return (
    <g className={`hk-fail hk-fail-${outcome.row + 1}`}>
      {/* Paper over the solid link, then the dashed or the broken one. */}
      <path d={`M${LINK.from + 2} ${y}H${LINK.to - 2}`} className="hk-erase" />
      {outcome.kind === "weak" ? (
        <path d={`M${LINK.from} ${y}H${LINK.to}`} className="hk-weak" />
      ) : (
        <path d={`M${LINK.from} ${y}H${GAP.from}M${GAP.to} ${y}H${LINK.to}`} className="hk-gap" />
      )}
      {outcome.kind === "gap" ? <path d={`M${GAP.from + 10} ${y - 9}L${GAP.to - 10} ${y + 9}`} className="hk-gap-cut" /> : null}
      {/* The tests after the failing one never ran: hollow. The failing one: the accent. */}
      {[0, 1, 2, 3].map((test) =>
        test >= outcome.failsAt ? (
          <rect
            key={test}
            x={TICK.x + test * TICK.step}
            y={y + TICK.dy}
            width={TICK.w}
            height={TICK.h}
            className={test === outcome.failsAt ? "hk-tick-fail" : "hk-tick-open"}
          />
        ) : null,
      )}
      <rect x={FILE.x} y={y - FILE.h / 2} width={FILE.w} height={FILE.h} className="hk-file-flag" />
    </g>
  );
}

export function LinksScene(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="links"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="hk-root block size-full"
    >
      {/* Far layer: a little dust. */}
      <g className="hk-far">
        {DUST.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hk-dust" />
        ))}
      </g>

      {/* Mid layer: the requests and the files. */}
      <g className="hk-cards">
        {ROW_Y.map((y, index) => (
          <g key={y}>
            <rect x={REQUEST.x} y={y - REQUEST.h / 2} width={REQUEST.w} height={REQUEST.h} className="hk-request" />
            <rect x={REQUEST.x + 8} y={y - 6} width="12" height="12" className="hk-id" />
            <path d={`M${REQUEST.x + 30} ${y}H${REQUEST.x + 30 + REQUEST_BAR[index]}`} className="hk-bar" />
            <rect x={FILE.x} y={y - FILE.h / 2} width={FILE.w} height={FILE.h} className="hk-file" />
            <path d={`M${FILE.x + 12} ${y}H${FILE.x + 12 + FILE_BAR[index]}`} className="hk-bar hk-bar-mono" />
            {[0, 1, 2, 3].map((test) => (
              <rect key={test} x={TICK.x + test * TICK.step} y={y + TICK.dy} width={TICK.w} height={TICK.h} className="hk-tick" />
            ))}
          </g>
        ))}
      </g>

      {/* Near layer: every request is linked to the file whose name fits. */}
      <path d={linkPath} pathLength={1} className="hk-links" />

      {/* The four tests sweep the rows. */}
      <rect x="40" y={(ROW_Y[0] as number) - 21} width="520" height="42" className="hk-scan" />

      {/* What the tests leave: two hold, four weak, two broken. */}
      {OUTCOMES.map((outcome) => (
        <Failure key={outcome.row} outcome={outcome} />
      ))}
    </svg>
  );
}
