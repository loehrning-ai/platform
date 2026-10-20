/**
 * Das Feld, frame step. frame(model, progress, out) is a pure function: it
 * writes the state of every square at a progress into a preallocated Float32Array and
 * allocates nothing. The same call draws a scroll step, a slider, a film
 * second (progress = t / duration) and the print frame (progress = 1).
 *
 * Motion, per scene:
 * - same population: every square springs from its old slot to its new one,
 *   staggered by target column; a joint table keeps the class, otherwise the
 *   square is ink while it moves
 * - new population: the old field falls out of the bottom, the new one pours
 *   in from the top (a "drain and pour", never a morph)
 * - a ghost class: its filled squares fall out of the field and an outline stays
 *   where they were
 */

import { clamp } from "../math.ts";
import { settleIn, springIn } from "../motion.ts";
import { F, INK_CLASS, STRIDE, TRANSITION, sceneAt, type FeldModel, type SceneModel } from "./model.ts";

export interface FrameInfo {
  /** Scene that owns the progress. */
  readonly index: number;
  /** Scene whose numeral, claim and unit line are shown (switches halfway through a drain and pour). */
  readonly display: number;
  /** Progress inside the scene, 0 to 1. */
  readonly local: number;
  /** Progress inside the scene's movement, 0 to 1. */
  readonly moving: number;
  /** True when the scene is formed and held. */
  readonly settled: boolean;
}

/** Share of the transition that is the drain of a population change. */
const DRAIN_END = 0.46;

export const frameLength = (model: FeldModel): number => model.capacity * STRIDE;

/** Allocates a buffer for a model; the only allocation, done once. */
export function createFrameBuffer(model: FeldModel): Float32Array {
  return new Float32Array(frameLength(model));
}

function write(out: Float32Array, i: number, x: number, y: number, size: number, cls: number, fill: number): void {
  const o = i * STRIDE;
  out[o + F.x] = x;
  out[o + F.y] = y;
  out[o + F.size] = size;
  out[o + F.cls] = cls;
  out[o + F.fill] = fill;
  out[o + F.gx] = 0;
  out[o + F.gy] = 0;
  out[o + F.ga] = 0;
}

/** A square that is not drawn: every field is written, so a reused buffer holds the same bytes whatever came before. */
function hide(out: Float32Array, i: number): void {
  const o = i * STRIDE;
  out[o + F.x] = 0;
  out[o + F.y] = 0;
  out[o + F.size] = 0;
  out[o + F.cls] = -1;
  out[o + F.fill] = 0;
  out[o + F.gx] = 0;
  out[o + F.gy] = 0;
  out[o + F.ga] = 0;
}

function ghostAt(out: Float32Array, i: number, x: number, y: number, alpha: number): void {
  const o = i * STRIDE;
  out[o + F.gx] = x;
  out[o + F.gy] = y;
  out[o + F.ga] = alpha;
}

const isGhost = (model: FeldModel, cls: number): boolean => model.classes[cls]?.tone === "ghost";

export function frame(model: FeldModel, progress: number, out: Float32Array): FrameInfo {
  const { index: k, local } = sceneAt(model, progress);
  const cur = model.scenes[k] as SceneModel;
  const prev = k > 0 ? (model.scenes[k - 1] as SceneModel) : null;
  const W = model.viewport.width;
  const H = model.viewport.height;
  const u = clamp(local / TRANSITION);
  const swap = prev !== null && prev.population !== cur.population;
  const mode: "none" | "pour" | "move" | "swap" =
    prev === null ? (model.firstEnter === "none" ? "none" : "pour") : swap ? "swap" : "move";
  const display = mode === "swap" && u < DRAIN_END ? k - 1 : k;

  for (let i = 0; i < model.capacity; i += 1) {
    const inCur = i < cur.squares;
    const inPrev = prev !== null && i < prev.squares;
    const cc = cur.cls[i] ?? -1;
    const cx = cur.x[i] ?? 0;
    const cy = cur.y[i] ?? 0;
    const cside = cur.side;
    const ghostCur = inCur && isGhost(model, cc);
    const out0 = H + cside * 2;

    if (mode === "none") {
      if (!inCur) {
        hide(out, i);
      } else if (ghostCur) {
        hide(out, i);
        ghostAt(out, i, cx, cy, 1);
      } else {
        write(out, i, cx, cy, cside, cc, cur.fill[i] ?? 1);
      }
      continue;
    }

    if (mode === "pour" || (mode === "swap" && u >= DRAIN_END)) {
      if (!inCur) {
        hide(out, i);
        continue;
      }
      const v = mode === "pour" ? u : clamp((u - 0.5) / 0.5);
      const delay = 0.05 + 0.25 * (cx / W) + 0.2 * (1 - cy / H);
      const s = springIn(v, delay, delay + 0.5, "med");
      if (ghostCur) {
        hide(out, i);
        ghostAt(out, i, cx, cy, settleIn(v, delay + 0.3, delay + 0.5));
      } else if (v <= delay) {
        hide(out, i);
      } else {
        write(out, i, cx, -cside * 3 + (cy + cside * 3) * s, cside, cc, cur.fill[i] ?? 1);
      }
      continue;
    }

    if (mode === "swap") {
      // Drain: the old field falls out of the bottom, column by column.
      const pc = prev?.cls[i] ?? -1;
      if (!inPrev || (prev && isGhost(model, pc))) {
        hide(out, i);
        continue;
      }
      const px = prev?.x[i] ?? 0;
      const py = prev?.y[i] ?? 0;
      const dd = (px / W) * 0.12;
      const s = springIn(u / DRAIN_END, dd, dd + 0.7, "soft");
      write(out, i, px, py + (H + (prev?.side ?? 8) * 2 - py) * s, prev?.side ?? 8, pc, prev?.fill[i] ?? 1);
      continue;
    }

    // mode "move": the same population, a new arrangement.
    const pc = prev?.cls[i] ?? -1;
    const prevOut = inPrev && prev !== null && isGhost(model, pc);
    const px = prev?.x[i] ?? cx;
    const py = prevOut ? H + (prev?.side ?? cside) * 2 : (prev?.y[i] ?? cy);
    const pside = prev?.side ?? cside;
    const delay = (cx / W) * 0.3;
    if (inPrev && inCur) {
      const s = springIn(u, delay, delay + 0.65, "med");
      if (ghostCur) {
        // Falls out of the field and leaves an outline at its place.
        const f = springIn(u, delay, delay + 0.6, "soft");
        write(out, i, px, py + (out0 - py) * f, pside, u <= delay ? pc : INK_CLASS, 1);
        ghostAt(out, i, cx, cy, settleIn(u, delay + 0.35, delay + 0.7));
        if (f >= 1) {
          hide(out, i);
          ghostAt(out, i, cx, cy, settleIn(u, delay + 0.35, delay + 0.7));
        }
        continue;
      }
      const moving = u > delay && s < 0.985;
      const cls = cur.joint ? (u > delay ? cc : pc) : moving ? INK_CLASS : u <= delay ? pc : cc;
      write(out, i, px + (cx - px) * s, py + (cy - py) * s, pside + (cside - pside) * s, cls, s > 0.5 ? (cur.fill[i] ?? 1) : (prev?.fill[i] ?? 1));
    } else if (inPrev) {
      if (prevOut) {
        hide(out, i);
        continue;
      }
      const s = springIn(u, delay, delay + 0.6, "soft");
      write(out, i, px, py + (out0 - py) * s, pside, pc, prev?.fill[i] ?? 1);
    } else if (inCur) {
      const d2 = 0.05 + 0.25 * (cx / W);
      const s = springIn(u, d2, d2 + 0.5, "med");
      if (ghostCur) {
        hide(out, i);
        ghostAt(out, i, cx, cy, settleIn(u, d2 + 0.3, d2 + 0.5));
      } else if (u <= d2) {
        hide(out, i);
      } else {
        write(out, i, cx, -cside * 3 + (cy + cside * 3) * s, cside, cc, cur.fill[i] ?? 1);
      }
    } else {
      hide(out, i);
    }
  }
  const moving = u;
  return { index: k, display: Math.max(0, display), local, moving, settled: local >= TRANSITION * 0.98 };
}
