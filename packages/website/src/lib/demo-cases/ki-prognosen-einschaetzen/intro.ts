/*
 * The count-in as a pure function of progress P (0..1 over INTRO_MS). The
 * staircase of hundred weeks is drawn from the first frame; a scan runs over
 * it from the left and settles each week as "sold" or "short" while the
 * counter counts the red ones. Then a ghost hand lifts the line to the
 * forecast and back. Nothing here keeps time; the component only advances P.
 */
export const INTRO_MS = 4400;

/** P at which the scan is done: a replay for a visitor who already saw the scan starts here. */
export const GHOST_FROM = 0.44;

const ease = (x: number) => x * x * (3 - 2 * x);
const seg = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)));

export interface IntroFrame {
  /** Weeks settled so far, counted from the left (0..100). */
  readonly visible: number;
  /** The cap the line shows: the visitor's, once they touched, else the ghost's. */
  readonly cap: number;
  readonly ghostCap: number;
  readonly ghostVisible: boolean;
}

export function introFrame(
  P: number,
  userCap: number | null,
  p50: number,
  supply: number,
): IntroFrame {
  const up = ease(seg(P, 0.52, 0.7));
  const down = ease(seg(P, 0.82, 0.97));
  const ghostCap = supply + (p50 - supply) * (up - down);
  return {
    visible: Math.round(seg(P, 0.03, 0.4) * 100),
    cap: userCap ?? ghostCap,
    ghostCap,
    ghostVisible: userCap === null && P > 0.46 && P < 0.98,
  };
}
