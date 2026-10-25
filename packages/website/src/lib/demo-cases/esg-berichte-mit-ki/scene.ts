import { HOLE } from "./data";
import { clamp, round } from "./numbers";
import type { IntroFrame, SceneFrame } from "./types";

/*
 * Motion as a pure function of progress. Two inputs only: `intro` (0..1,
 * plays once on mount) and `p` (the bill, 0..1, owned by the visitor's slider
 * or the button's tween). The component draws a frame and nothing else
 * animates. Reduced motion simply sets both to 1.
 */

export type Ease = (t: number) => number;

export const linear: Ease = (t) => t;
export const easeOutCubic: Ease = (t) => 1 - (1 - t) ** 3;
export const easeInOut: Ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutBack =
  (overshoot: number): Ease =>
  (t) => {
    const c3 = overshoot + 1;
    return 1 + c3 * (t - 1) ** 3 + overshoot * (t - 1) ** 2;
  };

/** The eased position of q inside [a, b], 0 before and 1 after. */
export function seg(q: number, a: number, b: number, ease: Ease = linear): number {
  return ease(clamp((q - a) / (b - a), 0, 1));
}

export const LADDER_ROWS = 5;
const OVERSHOOT = easeOutBack(1.4);
const SHEET_START = 50;
const SHEET_REST = 3;
const SHEET_LIFT = 9;
const SPAN = HOLE.truthTotal - HOLE.draftTotal;

/**
 * Every quantity drawn while the bill opens. The number rolls from the draft
 * (plus the visitor's guess) to the true total; the bar rises to the real
 * value with an overshoot and settles on it at p = 1.
 */
export function sceneAt(p: number, guess: number | null): SceneFrame {
  const q = clamp(p, 0, 1);
  const g = guess !== null && guess > 0 ? guess : 0;
  const envelope = seg(q, 0, 0.3, easeOutCubic);
  const rolled = seg(q, 0.55, 0.85, easeOutCubic);
  const rise = seg(q, 0.45, 0.75, OVERSHOOT);
  return {
    envelope,
    // The sheet falls onto the slot (value units above the baseline), then lifts a little as the bar
    // grows out from behind it, and is gone before the bar settles.
    sheetBottom: SHEET_START * (1 - envelope) + SHEET_REST + SHEET_LIFT * seg(q, 0.45, 0.75, easeInOut),
    sheetOpacity: q <= 0 ? 0 : seg(q, 0, 0.08) * (1 - seg(q, 0.74, 0.84)),
    barHeight: q >= 0.75 ? HOLE.truth : HOLE.truth * rise,
    // One decimal on every frame: the roll shows only figures the final one is made of.
    total: round(HOLE.draftTotal + g + (SPAN - g) * rolled, 1),
    // The stamp is struck, then lifted again once the roll has landed (0.85): two windows, no overlap.
    stampStrike: seg(q, 0.55, 0.65),
    stampLift: seg(q, 0.86, 0.92),
    offLabel: g > 0 ? seg(q, 0.84, 0.92) : 0,
    stripFlip: q >= 0.75 ? 1 : 0,
    ghost: g > 0 ? seg(q, 0.55, 0.8) : 0,
    ladder: Array.from({ length: LADDER_ROWS }, (_, i) => seg(q, 0.8 + i * 0.03, 0.88 + i * 0.03, easeOutCubic)),
  };
}

const BAR_STAGGER = 0.044;

/** The first 900 ms: bars rise one after the other, the stamp lands, the slot pulses. */
export function introAt(t: number): IntroFrame {
  const q = clamp(t, 0, 1);
  return {
    bars: Array.from({ length: 12 }, (_, i) => seg(q, i * BAR_STAGGER, i * BAR_STAGGER + 0.5, easeOutCubic)),
    stamp: seg(q, 0.72, 0.92, easeOutBack(2)),
    hole: seg(q, 0.3, 0.7, easeOutCubic),
    pulse: q >= 1 ? 0 : Math.sin(seg(q, 0.55, 1) * Math.PI),
  };
}

export const INTRO_MS = 900;
export const REVEAL_MS = 1600;
