/**
 * One annotation per figure: a short note with a leader line on the single
 * most telling mark (the "moment" of a chart). The note is drawn into the
 * finished figure only (it fades in over the last tenth of the progress), so
 * the finished state, the PDF and reduced motion all show it.
 *
 * The engine does not know where a kind put its marks, so it reads them from
 * the element tree it just built: the target is the element with the
 * `data-id` of the annotation, the obstacles are every other mark and text.
 * Candidate positions around the target are scored by overlap with the
 * obstacles; the first free one wins, the least bad one otherwise.
 */

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { segment } from "./timing.ts";
import { FS, el, op, textWidth, wrapText, type Ctx } from "./svg.ts";
import { clamp } from "./math.ts";
import type { FigureAnnotation } from "./types.ts";

interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

function translateOf(transform: unknown): [number, number] {
  if (typeof transform !== "string") return [0, 0];
  const m = /^translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)$/.exec(transform.trim());
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}

function unionBox(a: Box | null, b: Box): Box {
  return a
    ? { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }
    : b;
}

type Props = Record<string, unknown> & { children?: ReactNode };

/** Box of one drawing element in user units, or null for elements without geometry. */
function boxOf(tag: string, p: Props, dx: number, dy: number, maxWidth: number): { box: Box; kind: "mark" | "text" } | null {
  switch (tag) {
    case "circle": {
      const cx = num(p["cx"]);
      const cy = num(p["cy"]);
      const r = num(p["r"]) ?? 0;
      return cx === null || cy === null ? null : { box: { x0: cx - r + dx, y0: cy - r + dy, x1: cx + r + dx, y1: cy + r + dy }, kind: "mark" };
    }
    case "rect": {
      const x = num(p["x"]) ?? 0;
      const y = num(p["y"]) ?? 0;
      const w = num(p["width"]);
      const h = num(p["height"]);
      if (w === null || h === null || w >= maxWidth * 0.9) return null;
      return { box: { x0: x + dx, y0: y + dy, x1: x + w + dx, y1: y + h + dy }, kind: "mark" };
    }
    case "line": {
      const x1 = num(p["x1"]);
      const y1 = num(p["y1"]);
      const x2 = num(p["x2"]);
      const y2 = num(p["y2"]);
      if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
      if (Math.abs(x2 - x1) > maxWidth * 0.6) return null;
      // A line has no area: give it a 2-unit halo so a note is kept off whiskers, gridlines and reference lines.
      return { box: { x0: Math.min(x1, x2) + dx - 2, y0: Math.min(y1, y2) + dy - 2, x1: Math.max(x1, x2) + dx + 2, y1: Math.max(y1, y2) + dy + 2 }, kind: "mark" };
    }
    case "path": {
      const d = typeof p["d"] === "string" ? p["d"] : "";
      const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      if (nums.length < 4 || nums.length % 2 !== 0 || /[a-z]/.test(d.replace(/[eE]/g, ""))) return null;
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      const box = { x0: Math.min(...xs) + dx, y0: Math.min(...ys) + dy, x1: Math.max(...xs) + dx, y1: Math.max(...ys) + dy };
      return box.x1 - box.x0 > maxWidth * 0.6 ? null : { box, kind: "mark" };
    }
    case "text": {
      const x = num(p["x"]);
      const y = num(p["y"]);
      if (x === null || y === null) return null;
      const size = num(p["fontSize"]) ?? FS.label;
      const weight = num(p["fontWeight"]) ?? 400;
      const lines: string[] = [];
      const collect = (child: ReactNode): void => {
        if (typeof child === "string" || typeof child === "number") lines.push(String(child));
        else if (isValidElement(child)) {
          const cp = child.props as Props;
          if (child.type === "tspan") lines.push(String(Children.toArray(cp.children).join("")));
        }
      };
      Children.toArray(p.children).forEach(collect);
      if (lines.length === 0) return null;
      const width = Math.max(...lines.map((line) => textWidth(line, size, weight >= 600 ? 600 : 400)));
      const anchor = p["textAnchor"];
      const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
      const lineH = size * 1.2;
      return { box: { x0: x0 + dx, y0: y - size + dy, x1: x0 + width + dx, y1: y - size + lineH * lines.length + dy }, kind: "text" };
    }
    default:
      return null;
  }
}

interface Found {
  readonly target: Box | null;
  readonly obstacles: Box[];
}

function scan(root: ReactElement, targetId: string, maxWidth: number): Found {
  let target: Box | null = null;
  const obstacles: Box[] = [];
  const visit = (node: ReactNode, dx: number, dy: number, inside: boolean): void => {
    if (Array.isArray(node)) {
      node.forEach((child) => visit(child, dx, dy, inside));
      return;
    }
    if (!isValidElement(node)) return;
    const props = node.props as Props;
    const tag = typeof node.type === "string" ? node.type : "";
    if (tag === "defs" || tag === "title" || tag === "desc") return;
    const [tx, ty] = translateOf(props["transform"]);
    const here = props["data-id"] === targetId || inside;
    const geometry = boxOf(tag, props, dx + tx, dy + ty, maxWidth);
    if (geometry) {
      if (here && geometry.kind === "mark") target = unionBox(target, geometry.box);
      else if (!here) obstacles.push(geometry.box);
    }
    Children.forEach(props.children, (child) => visit(child, dx + tx, dy + ty, here));
  };
  visit((root.props as Props).children, 0, 0, false);
  return { target, obstacles };
}

function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Longest distance from the mark to the middle of the note, in user units. */
const MAX_REACH = 190;
/** Overlap with other marks and words (user units squared) above which the note is left out. */
const MAX_COVERED = 30;

/** Adds the annotation to a finished-or-not figure; returns the svg untouched when it cannot place one. */
export function withAnnotation(svg: ReactElement, ctx: Ctx<unknown>, annotation: FigureAnnotation | undefined): ReactElement {
  if (!annotation) return svg;
  const appear = segment(ctx.p, 0.9, 1);
  if (appear <= 0) return svg;
  const { width, pal } = ctx;
  const viewBox = String((svg.props as Props)["viewBox"] ?? "").split(/\s+/).map(Number);
  const height = viewBox[3] && Number.isFinite(viewBox[3]) ? viewBox[3] : 0;
  if (!height) return svg;
  const { target, obstacles } = scan(svg, annotation.id, width);
  if (!target) return svg;

  const size = FS.small;
  const maxW = Math.min(ctx.compact ? 160 : 210, width * (ctx.compact ? 0.5 : 0.36));
  const lines = wrapText(annotation.text, maxW, size, 4, 600);
  const boxW = Math.max(...lines.map((line) => textWidth(line, size, 600)));
  const lineH = 15;
  const boxH = lines.length * lineH;
  const M = 6;
  const cx = (target.x0 + target.x1) / 2;
  const cy = (target.y0 + target.y1) / 2;
  const gap = 14;

  const candidates: Box[] = [];
  for (const distance of [gap, gap + 18, gap + 40]) {
    const right = target.x1 + distance;
    const left = target.x0 - distance - boxW;
    const above = target.y0 - distance - boxH;
    const below = target.y1 + distance;
    for (const x of [right, left, cx - boxW / 2]) {
      for (const y of [above, below, cy - boxH / 2]) {
        const bx = clamp(x, M, Math.max(M, width - M - boxW));
        const by = clamp(y, M, Math.max(M, height - M - boxH));
        candidates.push({ x0: bx, y0: by, x1: bx + boxW, y1: by + boxH });
      }
    }
  }
  // Free whitespace anywhere in the figure: the nearest empty spot beats a crowded one beside the mark.
  for (let y = M; y <= height - M - boxH; y += 10) {
    for (let x = M; x <= width - M - boxW; x += 16) {
      candidates.push({ x0: x, y0: y, x1: x + boxW, y1: y + boxH });
    }
  }
  const pad = 4;
  const tall = target.y1 - target.y0 > 24;
  const score = (c: Box): number => {
    const padded = { x0: c.x0 - pad, y0: c.y0 - pad, x1: c.x1 + pad, y1: c.y1 + pad };
    const hitsTarget = overlap(padded, target) * 4;
    const hits = obstacles.reduce((sum, o) => sum + overlap(padded, o), 0);
    const dist = Math.hypot((c.x0 + c.x1) / 2 - cx, (c.y0 + c.y1) / 2 - cy);
    // A tall mark (a bar) is pointed at near its top: a note that sits level with the middle of the bar is a worse place for it.
    const lowPenalty = tall && (c.y0 + c.y1) / 2 > target.y0 + 12 ? 200 : 0;
    return hitsTarget + hits * 2 + dist * 0.12 + lowPenalty;
  };
  const reach = (c: Box): number => Math.hypot((c.x0 + c.x1) / 2 - cx, (c.y0 + c.y1) / 2 - cy);
  // A leader longer than this crosses the figure; a note that must cover marks or words is worse than no note.
  const usable = candidates.filter((c) => reach(c) <= MAX_REACH);
  if (usable.length === 0) return svg;
  const best = usable.reduce((a, b) => (score(b) < score(a) ? b : a));
  const covered = obstacles.reduce((sum, o) => sum + overlap(best, o), 0);
  if (covered > MAX_COVERED || overlap(best, target) > 0) return svg;

  // Leader: from the nearest edge point of the target to the nearest point of the note.
  const nearest = (b: Box, px: number, py: number): [number, number] => [clamp(px, b.x0, b.x1), clamp(py, b.y0, b.y1)];
  const [lx, ly] = nearest(best, cx, cy);
  // The leader meets a tall mark at its top corner on the note's side, so it neither runs into the middle of the bar nor over its value label.
  const [nx, ny] = nearest(target, lx, ly);
  const sx = tall ? (lx < cx ? target.x0 : lx > cx ? target.x1 : nx) : nx;
  const sy = tall ? target.y0 + Math.min(10, (target.y1 - target.y0) / 4) : ny;
  const dist = Math.hypot(lx - sx, ly - sy);
  const anchorEnd = lx >= best.x1 - 0.5 ? "end" : "start";
  const textX = anchorEnd === "end" ? best.x1 : best.x0;
  const body = lines.map((line, i) => el("tspan", { key: i, x: textX, dy: i === 0 ? 0 : lineH }, line));
  const note = el(
    "g",
    { "data-annotation": annotation.id, opacity: op(appear) },
    dist > 3
      ? el("line", { x1: sx, y1: sy, x2: lx, y2: ly, stroke: pal.ink, strokeWidth: 1, strokeLinecap: "round" })
      : null,
    el("circle", { cx: sx, cy: sy, r: 2, fill: pal.ink }),
    // The paper-coloured copy underneath keeps the note readable over a gridline or a bar.
    el("text", { x: textX, y: best.y0 + size, fontSize: size, fontWeight: 600, textAnchor: anchorEnd === "end" ? "end" : undefined, fill: "none", stroke: pal.paper, strokeWidth: 4, strokeLinejoin: "round", "aria-hidden": "true" }, ...body),
    el("text", { x: textX, y: best.y0 + size, fontSize: size, fontWeight: 600, textAnchor: anchorEnd === "end" ? "end" : undefined, fill: pal.ink }, ...lines.map((line, i) => el("tspan", { key: `t${i}`, x: textX, dy: i === 0 ? 0 : lineH }, line))),
  );
  const children = Children.toArray((svg.props as Props).children);
  return cloneElement(svg, undefined, ...children, note);
}

