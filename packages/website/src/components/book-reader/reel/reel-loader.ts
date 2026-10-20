import type { ReelEngine } from "./reel-contract";

/**
 * Loads the reel engine, lazily: the cover calls this only after the browser is
 * idle and never under reduced motion, so the engine and the film's data are a
 * separate chunk that the first paint does not wait for (budget: 40 KB gzip).
 */
export async function loadReelEngine(): Promise<ReelEngine | null> {
  return (await import("@/components/book-figures/reel/engine")).reelEngine;
}
