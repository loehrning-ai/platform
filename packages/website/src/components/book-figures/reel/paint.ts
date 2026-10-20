/**
 * Painters. Both read the same buffers: the SVG painter returns a markup
 * string (film frames, SSR poster, print, reduced motion, no JS); the canvas
 * painter draws the same picture live with three batched fills for the squares.
 */

import { STRIDE } from "./field.ts";
import { type ReelLayout, COLORS, VH, VW } from "./layout.ts";
import type { Overlay, Prim, Rect } from "./overlay.ts";
import { r2 } from "./motion.ts";

export interface Scene {
  readonly layout: ReelLayout;
  readonly ground: readonly Rect[];
  readonly overlay: Overlay;
  readonly squares: Float32Array;
  readonly count: number;
}

const BODY = [COLORS.leinen, COLORS.ink, COLORS.accent] as const;

function clipRect(l: ReelLayout): Rect {
  return { x: 0, y: l.field.y, w: l.W, h: VH * l.field.sc };
}

/** Square bodies and partial fills as three `d` strings: Leinen, ink, Mennige. */
function squarePaths(squares: Float32Array, count: number): [string, string, string] {
  const d = ["", "", ""];
  for (let n = 0; n < count; n += 1) {
    const o = n * STRIDE;
    const x = r2(squares[o] as number);
    const y = r2(squares[o + 1] as number);
    const w = r2(squares[o + 2] as number);
    const h = r2(squares[o + 3] as number);
    const cls = squares[o + 4] as number;
    const fill = squares[o + 5] as number;
    d[cls] += `M${x} ${y}h${w}v${h}h${-w}z`;
    if (fill > 0.004) {
      const fh = r2(h * fill);
      d[2] += `M${x} ${r2(y + h - fh)}h${w}v${fh}h${-w}z`;
    }
  }
  return [d[0] as string, d[1] as string, d[2] as string];
}

function primSvg(p: Prim): string {
  const a = p.a < 0.999 ? ` opacity="${r2(p.a)}"` : "";
  if (p.kind === "poly") {
    const pts = p.pts ?? [];
    let d = "";
    for (let i = 0; i < pts.length; i += 2) d += `${i === 0 ? "M" : "L"}${r2(pts[i] as number)} ${r2(pts[i + 1] as number)}`;
    return `<path d="${d}Z" fill="none" stroke="${p.stroke}" stroke-width="${p.sw}" stroke-linejoin="miter"${a}/>`;
  }
  if (p.kind === "line") {
    return `<path d="M${r2(p.x)} ${r2(p.y)}l${r2(p.w)} ${r2(p.h)}" stroke="${p.stroke}" stroke-width="${p.sw}" fill="none"${a}/>`;
  }
  const fill = p.fill ? ` fill="${p.fill}"` : ' fill="none"';
  const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.sw}"` : "";
  return `<rect x="${r2(p.x)}" y="${r2(p.y)}" width="${r2(p.w)}" height="${r2(p.h)}"${fill}${stroke}${a}/>`;
}

/** The picture without text, as an SVG string; `extra` is appended on top (static text). */
export function svgMarkup(scene: Scene, idSuffix = "", extra = ""): string {
  const { layout: l } = scene;
  const clip = clipRect(l);
  const [leinen, ink, accent] = squarePaths(scene.squares, scene.count);
  const ground = scene.ground
    .map((g) => `<rect x="${r2(g.x)}" y="${r2(g.y)}" width="${r2(g.w)}" height="${r2(g.h)}" fill="${COLORS.ink}"/>`)
    .join("");
  const under = scene.overlay.under.map(primSvg).join("");
  const over = scene.overlay.over.map(primSvg).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="reel-svg" viewBox="0 0 ${l.W} ${l.H}" width="${l.W}" height="${l.H}" aria-hidden="true">` +
    `<defs><clipPath id="reel-clip${idSuffix}"><rect x="${clip.x}" y="${clip.y}" width="${clip.w}" height="${clip.h}"/></clipPath></defs>` +
    `<rect width="${l.W}" height="${l.H}" fill="${COLORS.paper}"/>${ground}${under}` +
    `<g clip-path="url(#reel-clip${idSuffix})"><path d="${leinen}" fill="${BODY[0]}"/><path d="${ink}" fill="${BODY[1]}"/><path d="${accent}" fill="${BODY[2]}"/></g>` +
    `${over}${extra}</svg>`
  );
}

/** Minimal canvas surface the painter needs (also satisfied by a test double). */
export interface Surface {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  rect(x: number, y: number, w: number, h: number): void;
  moveTo(x: number, y: number): void;
  closePath(): void;
  lineTo(x: number, y: number): void;
  fill(): void;
  stroke(): void;
  save(): void;
  restore(): void;
  clip(): void;
}

function drawPrim(c: Surface, p: Prim): void {
  c.globalAlpha = p.a;
  if (p.kind === "poly") {
    const pts = p.pts ?? [];
    c.strokeStyle = p.stroke ?? COLORS.ink;
    c.lineWidth = p.sw;
    c.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      if (i === 0) c.moveTo(pts[i] as number, pts[i + 1] as number);
      else c.lineTo(pts[i] as number, pts[i + 1] as number);
    }
    c.closePath();
    c.stroke();
    c.globalAlpha = 1;
    return;
  }
  if (p.kind === "line") {
    c.strokeStyle = p.stroke ?? COLORS.ink;
    c.lineWidth = p.sw;
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.x + p.w, p.y + p.h);
    c.stroke();
  } else {
    if (p.fill) {
      c.fillStyle = p.fill;
      c.fillRect(p.x, p.y, p.w, p.h);
    }
    if (p.stroke) {
      c.strokeStyle = p.stroke;
      c.lineWidth = p.sw;
      c.strokeRect(p.x, p.y, p.w, p.h);
    }
  }
  c.globalAlpha = 1;
}

/** Draw the picture without text onto a canvas whose units are stage pixels. */
export function paintCanvas(c: Surface, scene: Scene): void {
  const { layout: l } = scene;
  c.globalAlpha = 1;
  c.fillStyle = COLORS.paper;
  c.fillRect(0, 0, l.W, l.H);
  c.fillStyle = COLORS.ink;
  for (const g of scene.ground) c.fillRect(g.x, g.y, g.w, g.h);
  for (const p of scene.overlay.under) drawPrim(c, p);
  const clip = clipRect(l);
  c.save();
  c.beginPath();
  c.rect(clip.x, clip.y, clip.w, clip.h);
  c.clip();
  // Three batched fills: Leinen, ink, Mennige (partial fills ride with Mennige).
  for (let cls = 0; cls < 3; cls += 1) {
    c.fillStyle = BODY[cls] as string;
    c.beginPath();
    for (let n = 0; n < scene.count; n += 1) {
      const o = n * STRIDE;
      const x = scene.squares[o] as number;
      const y = scene.squares[o + 1] as number;
      const w = scene.squares[o + 2] as number;
      const h = scene.squares[o + 3] as number;
      const k = scene.squares[o + 4] as number;
      const fill = scene.squares[o + 5] as number;
      if (k === cls) c.rect(x, y, w, h);
      if (cls === 2 && fill > 0.004) c.rect(x, y + h * (1 - fill), w, h * fill);
    }
    c.fill();
  }
  c.restore();
  for (const p of scene.overlay.over) drawPrim(c, p);
  void VW;
}
