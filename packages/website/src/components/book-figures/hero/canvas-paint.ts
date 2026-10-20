/**
 * Canvas painter of Das Feld. One call draws one frame buffer with three
 * batched fills (leinen, ink, accent) and one batched stroke (outlines of the
 * squares that left): the cost per frame is the loop over the buffer, not the
 * number of squares. No allocation, no clock, no state.
 *
 * Hover and pin act on classes: the class in focus flips to its anti colour
 * (ink to Mennige, Mennige to Druckschwarz) and every other class dims to the
 * leinen tint.
 */

import { F, STRIDE, type FeldModel } from "@/lib/figures/feld";
import type { Palette } from "@/lib/figures";

/** The part of CanvasRenderingContext2D the painter uses; tests pass a recorder. */
export interface PaintContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  rect(x: number, y: number, w: number, h: number): void;
  fill(): void;
  stroke(): void;
}

export interface PaintOptions {
  readonly pal: Pick<Palette, "ink" | "accent" | "track" | "edge">;
  /** Device pixels per CSS pixel (already capped by the caller). */
  readonly dpr: number;
  /** Canvas size in CSS pixels; the model was compiled for the same size. */
  readonly width: number;
  readonly height: number;
  /** Scene whose classes name the outlines. */
  readonly scene: number;
  /** Class index in focus (hover, focus or pin), or -1. */
  readonly focus: number;
}

type Bucket = 0 | 1 | 2;
const LEINEN: Bucket = 0;
const INK: Bucket = 1;
const ACCENT: Bucket = 2;

/** Bucket of a class: its tone, flipped to the anti colour in focus, dimmed to leinen out of focus. */
function bucketOf(model: FeldModel, cls: number, focus: number): Bucket {
  const tone = model.classes[cls]?.tone ?? "ink";
  if (focus >= 0 && cls !== focus && cls !== 0) return LEINEN;
  if (focus >= 0 && cls === focus) return tone === "accent" ? INK : ACCENT;
  switch (tone) {
    case "accent": return ACCENT;
    case "leinen": return LEINEN;
    default: return INK;
  }
}

/** Draws a frame; returns the number of batched fills issued (at most 3) for tests and the perf bar. */
export function paintFeld(ctx: PaintContext, buf: Float32Array, model: FeldModel, o: PaintOptions): number {
  ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
  ctx.clearRect(0, 0, o.width, o.height);
  const n = model.capacity;
  const scene = model.scenes[o.scene] ?? model.scenes[0];
  const colours: readonly string[] = [o.pal.track, o.pal.ink, o.pal.accent];
  let fills = 0;
  for (let pass = 0; pass < 3; pass += 1) {
    let any = false;
    ctx.beginPath();
    for (let i = 0; i < n; i += 1) {
      const b = i * STRIDE;
      const cls = buf[b + F.cls] ?? -1;
      if (cls < 0) continue;
      const s = buf[b + F.size] ?? 0;
      const x = buf[b + F.x] ?? 0;
      const y = buf[b + F.y] ?? 0;
      if (y >= o.height || y + s <= 0 || x >= o.width || x + s <= 0) continue;
      const fill = buf[b + F.fill] ?? 1;
      const bucket = bucketOf(model, cls, o.focus);
      if (fill >= 1) {
        if (bucket === pass) {
          ctx.rect(x, y, s, s);
          any = true;
        }
      } else {
        // A partial square: its outline in leinen, the filled part from the bottom in its own class.
        if (pass === LEINEN) {
          ctx.rect(x, y, s, s);
          any = true;
        } else if (bucket === pass) {
          ctx.rect(x, y + s * (1 - fill), s, s * fill);
          any = true;
        }
      }
    }
    if (any) {
      ctx.fillStyle = colours[pass] as string;
      ctx.fill();
      fills += 1;
    }
  }
  // Outlines of squares that fell out of the field: one batched stroke.
  let outlines = false;
  ctx.beginPath();
  for (let i = 0; i < n; i += 1) {
    const b = i * STRIDE;
    if ((buf[b + F.ga] ?? 0) <= 0.5) continue;
    const home = scene?.cls[i] ?? -1;
    if (o.focus >= 0 && home !== o.focus) continue;
    const s = scene?.side ?? 8;
    ctx.rect((buf[b + F.gx] ?? 0) + 0.5, (buf[b + F.gy] ?? 0) + 0.5, s - 1, s - 1);
    outlines = true;
  }
  if (outlines) {
    ctx.strokeStyle = o.pal.ink;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  return fills;
}
