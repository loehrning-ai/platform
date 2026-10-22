import type { RouteKey } from "./types";

/*
 * Motion as pure functions of progress t in [0, 1]. Only transform and
 * opacity move; one region at a time, sub-steps in sequence; t = 1 is the
 * meaningful end state that reduced motion shows at once.
 */

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const easeOut = (x: number): number => 1 - (1 - x) ** 3;

/** The route SVG's fixed viewBox: the packet travels from x0 to x1. */
export const ROUTE_VIEWBOX = { width: 320, height: 56 } as const;
export const PACKET_X0 = 40;
export const PACKET_X1 = 252;

/** Durations in ms. A commit runs the reveal (700) then the slot drop (200). */
export const MS = { reveal: 700, slot: 200, commit: 900, dial: 500, stamp: 180 } as const;

export function revealFrame(t: number, x0 = PACKET_X0, x1 = PACKET_X1) {
  const lamp = clamp01(t / 0.2);
  const travel = easeOut(clamp01((t - 0.2) / 0.55));
  const rows = clamp01((t - 0.75) / 0.25);
  return {
    lamp: { opacity: lamp, scale: 0.92 + 0.08 * lamp },
    packet: { x: x0 + (x1 - x0) * travel },
    rows: { opacity: rows, y: 6 * (1 - rows) },
  };
}

export function dialFrame(t: number, changed: readonly RouteKey[], x0 = PACKET_X0, x1 = PACKET_X1) {
  const travel = easeOut(clamp01(t / 0.6));
  const line = clamp01((t - 0.6) / 0.4);
  const underline: Partial<Record<RouteKey, number>> = {};
  for (const key of changed) underline[key] = line;
  return { packet: { x: x0 + (x1 - x0) * travel }, underline };
}

export function slotFrame(t: number) {
  const k = clamp01(t);
  return { opacity: k, scale: 0.6 + 0.4 * k };
}

export function stampFrame(t: number) {
  const k = clamp01(t);
  return { opacity: k, scale: 1.12 - 0.12 * easeOut(k) };
}

/** One commit timeline: the reveal first, then the slot drop. */
export function commitFrames(t: number) {
  const elapsed = clamp01(t) * MS.commit;
  return {
    reveal: clamp01(elapsed / MS.reveal),
    slot: clamp01((elapsed - MS.reveal) / MS.slot),
  };
}
