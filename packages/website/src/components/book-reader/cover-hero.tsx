import type { CSSProperties } from "react";
import {
  formatInterval,
  formatN,
  formatValue,
  hashSeed,
  mulberry32,
  quantityFor,
  type FigureSpec,
} from "@/lib/figures";
import { isPreRescan } from "@/lib/book-figures";
import "./cover-hero.css";

/**
 * Cover hero of the data book: 100 dots, one per firm of a hundred, settle
 * into a 10 x 10 grid once; then the few that stand for the headline share
 * turn to the accent and the number lands next to them. The number is read
 * from the headline figure (C4, `weighted_share`), never typed here.
 *
 * Server markup and CSS only: the finished state is the base style, the one
 * settle-in lives in a prefers-reduced-motion: no-preference block, and there
 * is no script, so reduced motion, no JS and print all show the finished cover.
 */

const COLS = 10;
const STEP = 20;
const SIZE = COLS * STEP;
const R = 6.4;

interface Dot {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly dx: number;
  readonly dy: number;
}

/** Seeded start offsets, so the settle looks the same on every load and in every test. */
function dots(seed: number): Dot[] {
  const random = mulberry32(seed);
  return Array.from({ length: COLS * COLS }, (_, index) => ({
    index,
    cx: (index % COLS) * STEP + STEP / 2,
    cy: Math.floor(index / COLS) * STEP + STEP / 2,
    dx: Math.round((random() - 0.5) * 120),
    dy: Math.round(-30 - random() * 90),
  }));
}

export function BookCoverHero({
  spec,
  tokenKey = "weighted_share",
  inline = false,
}: {
  readonly spec: FigureSpec;
  readonly tokenKey?: string;
  /** Sits inside the title block, beside the title on desktop, so the number is on the first screen. */
  readonly inline?: boolean;
}) {
  const q = quantityFor(spec, tokenKey);
  if (!q) return null;
  // Whole dots for the whole part, one dot filled to its share for the rest: 3,8 is three dots and a dot at 80 percent,
  // never four full dots (that would read as 4).
  const whole = Math.max(0, Math.floor(q.value));
  const fraction = q.value - whole;
  const partial = fraction >= 0.05 ? fraction : 0;
  const marked = whole + (partial > 0 ? 1 : 0);
  const phrase = partial === 0 ? String(whole) : partial >= 0.5 ? `knapp ${marked}` : `gut ${whole}`;
  const all = dots(hashSeed(`${spec.id}-cover`));
  // The marked dots are the first of the grid (top left); the number carries the same accent.
  const markedDots = all.slice(0, whole);
  const partialDot = partial > 0 ? all[whole] : undefined;
  const value = formatValue(q.fmt, q.value);
  const range = q.lo !== undefined && q.hi !== undefined ? formatInterval(q.fmt, q.lo, q.hi) : null;
  const n = formatN(q.n ?? spec.n);
  const label = partialDot
    ? `100 Punkte stehen für 100 Firmen mit zugeordneter Website. ${whole} sind ganz hervorgehoben und einer zu ${Math.round(partial * 100)} Prozent: Auf diesen Seiten steht das Wort KI. Gemeint ist der Anteil von ${value}.`
    : `100 Punkte stehen für 100 Firmen mit zugeordneter Website. ${whole} sind hervorgehoben: Auf diesen Seiten steht das Wort KI. Gemeint ist der Anteil von ${value}.`;

  return (
    <section className={inline ? "bk-hero bk-hero--inline" : "bk-hero"} aria-labelledby="bk-hero-number" data-book-hero="true">
      <div className="bk-hero-copy">
        {isPreRescan(spec) ? <p className="bk-hero-flag">Vorläufig: Stand vor dem Neuscan</p> : null}
        <p className="bk-hero-kicker">Die Zahl dieses Buchs</p>
        <p id="bk-hero-number" className="bk-hero-number">
          {value}
        </p>
        <p className="bk-hero-tail">
          der Firmen mit zugeordneter Website schreiben das Wort KI auf ihre Startseite. Von 100 Firmen sind das {phrase}.
        </p>
        <p className="bk-hero-meta">
          {range ? `Gewichtet, 95-%-Intervall ${range}, ` : ""}
          {n}. Eine Stichprobe von Firmen mit zugeordneter Website, nicht Deutschland. Das Wort auf der Seite sagt nichts darüber, ob die Firma KI nutzt.
        </p>
      </div>
      <div className="bk-hero-dots">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label} className="bk-hero-svg">
          {all.map((dot) => (
            <circle
              key={dot.index}
              className="bk-dot"
              cx={dot.cx}
              cy={dot.cy}
              r={R}
              style={{ "--i": dot.index, "--dx": `${dot.dx}px`, "--dy": `${dot.dy}px` } as CSSProperties}
            />
          ))}
          {markedDots.map((dot) => (
            <circle
              key={`m${dot.index}`}
              className="bk-dot bk-dot--marked"
              cx={dot.cx}
              cy={dot.cy}
              r={R + 1.6}
              style={{ "--i": dot.index } as CSSProperties}
            />
          ))}
          {partialDot ? (
            // The grey ring of this dot is already drawn above; the fill inside it has the area of the share (80 percent of a full dot).
            <circle
              key={`p${partialDot.index}`}
              className="bk-dot bk-dot--marked bk-dot--part"
              cx={partialDot.cx}
              cy={partialDot.cy}
              r={(R + 1.6) * Math.sqrt(partial)}
              style={{ "--i": partialDot.index } as CSSProperties}
            />
          ) : null}
        </svg>
      </div>
    </section>
  );
}
