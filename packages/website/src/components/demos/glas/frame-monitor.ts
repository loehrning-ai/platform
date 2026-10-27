/**
 * The frame monitor (glass-spec 7): during the first two seconds of the first
 * drag on a page, if more than 10 % of frames take longer than 24 ms, the
 * page switches from live glass to frost for the rest of the session. Pure
 * verdict logic here; the rAF sampling lives in glas-root.tsx.
 */

export const FRAME_WINDOW_MS = 2000;
export const FRAME_SLOW_MS = 24;
export const FRAME_SLOW_SHARE = 0.1;
/** Fewer frames than this say nothing (a tab in the background, a test). */
export const FRAME_MIN_SAMPLES = 20;

export type FrameVerdict = "pending" | "ok" | "slow";

/** The verdict for a list of frame durations sampled over `elapsedMs`. */
export function frameVerdict(deltas: readonly number[], elapsedMs: number): FrameVerdict {
  if (elapsedMs < FRAME_WINDOW_MS) return "pending";
  if (deltas.length < FRAME_MIN_SAMPLES) return "ok";
  const slow = deltas.filter((delta) => delta > FRAME_SLOW_MS).length;
  return slow / deltas.length > FRAME_SLOW_SHARE ? "slow" : "ok";
}
