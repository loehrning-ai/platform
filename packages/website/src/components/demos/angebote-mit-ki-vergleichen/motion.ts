/**
 * The chart's motion as a pure function of the beat's progress p in [0, 1] (rotfaden's drawChart):
 * "headline" shows the goods price only, "stack" stacks the other lines in over p in [0, 0.82] and
 * moves the rows to the delivered order over [0.84, 1], "full" is the end frame.
 */
export type Phase = "headline" | "stack" | "full";

export function ease(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - (1 - x) ** 3;
}

export function stackPhase(phase: Phase, progress: number): { readonly show: number; readonly reorder: number; readonly landed: boolean } {
  if (phase === "headline") return { show: 0, reorder: 0, landed: false };
  if (phase === "full") return { show: 1, reorder: 1, landed: true };
  return { show: progress, reorder: ease((progress - 0.84) / 0.16), landed: progress >= 0.84 };
}
