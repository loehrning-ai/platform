/**
 * The reality run as a pure function of t in [0, 1]: four passes sweep the
 * eight links, one test per pass (DATUM, FREIGABE, UMFANG, ZITAT). A link
 * whose file fails a test turns dashed (SCHWACH); a record that shows "not
 * met" breaks the link (LÜCKE) and takes no further test. Labels and the
 * tally land at the end. Same t, same frame; no clock inside.
 */

import { TEST_ORDER, type Status, type TestId } from "./evidence";

export const PASS_START = 0.08;
export const PASS_LENGTH = 0.2;
export const LINK_STAGGER = 0.014;
export const LABELS_FROM = 0.88;
/** Share of a pass one link's test takes. */
const TEST_SPAN = 0.06;

export interface LinkInput {
  /** The first failed test, or null when all pass. */
  readonly failsAt: TestId | null;
  readonly status: Status;
}

export interface LinkFrame {
  /** Index of the last pass that reached this link (-1 before the first). */
  readonly passReached: number;
  readonly dashed: boolean;
  readonly broken: boolean;
  /** 0 to 1: how far the broken halves have pulled apart. */
  readonly breakT: number;
  /** 0 to 1: the defect drawn on the file card. */
  readonly defectT: number;
  readonly labelOpacity: number;
}

export interface RunFrame {
  readonly links: readonly LinkFrame[];
  /** The pass running now (0 to 3), or -1 before and 4 after. */
  readonly pass: number;
  readonly tallyOpacity: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const ease = (value: number) => 1 - (1 - clamp(value)) ** 3;

/** When link `index` meets the test of pass `pass`. */
export function testTime(pass: number, index: number): number {
  return PASS_START + pass * PASS_LENGTH + index * LINK_STAGGER;
}

export function frame(t: number, links: readonly LinkInput[]): RunFrame {
  const time = clamp(t);
  const out = links.map((link, index): LinkFrame => {
    let passReached = -1;
    for (let pass = 0; pass < TEST_ORDER.length; pass += 1) if (time >= testTime(pass, index)) passReached = pass;
    const failPass = link.failsAt ? TEST_ORDER.indexOf(link.failsAt) : -1;
    const at = failPass >= 0 ? testTime(failPass, index) : Number.POSITIVE_INFINITY;
    const failed = time >= at;
    const breaks = link.status === "gap";
    const progress = failed ? clamp((time - at) / TEST_SPAN) : 0;
    return {
      passReached: failed ? Math.min(passReached, failPass) : passReached,
      dashed: failed && !breaks,
      broken: failed && breaks,
      breakT: breaks ? ease(progress) : 0,
      defectT: ease(progress),
      labelOpacity: clamp((time - LABELS_FROM - index * 0.008) / 0.06),
    };
  });
  const pass = time < PASS_START ? -1 : time >= PASS_START + TEST_ORDER.length * PASS_LENGTH ? 4 : Math.floor((time - PASS_START) / PASS_LENGTH);
  return { links: out, pass, tallyOpacity: clamp((time - LABELS_FROM) / 0.08) };
}

/** Draw-in of the first screen's link lines (1.2 s of the commit beat). */
export function drawIn(t: number, index: number): number {
  return ease((clamp(t) - index * 0.04) / 0.68);
}

/** Small helpers for the stations, each 0 to 1 in its own window of t. */
export function within(t: number, from: number, to: number): number {
  return ease((clamp(t) - from) / (to - from));
}
