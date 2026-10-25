/**
 * The demo's state between beats: the visitor's bets on the stage. Pure; the
 * visitor's own card is separate and never reset by "Von vorn".
 */
import type { Boundary, WhoFilter } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";

export type Vote = "take" | "ask" | "reject";
export const VOTES: readonly Vote[] = ["take", "ask", "reject"];

export interface Bets {
  readonly vote: Vote | null;
  /** Reading 0 to 3 on the slider; the reveal ends on 3, the right levels. */
  readonly detent: number;
  /** Box 1: the exact question instead of "Wie viel MRR haben wir?". */
  readonly exact: boolean;
  readonly view: boolean;
  readonly who: WhoFilter | null;
  readonly boundary: Boundary;
  readonly tested: boolean;
}

export const START: Bets = { vote: null, detent: 3, exact: false, view: false, who: null, boundary: "instruction", tested: false };

/** Beat index of each box: 1 and 2 share the "sicht" beat. */
const BOX_BEAT = [2, 2, 3, 4, 5] as const;

/**
 * Which of the five boxes are filled: by the visitor's move on its beat, or
 * by passing the beat (the kit's answer then stands for the box).
 */
export function boxesDone(index: number, bets: Bets): readonly boolean[] {
  const moved = [bets.exact, bets.view, bets.who === "AN", bets.boundary !== "instruction", bets.tested];
  return BOX_BEAT.map((beat, box) => index > beat || (index === beat && (moved[box] as boolean)));
}
