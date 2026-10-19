/**
 * Small SVG building blocks on top of React.createElement, so the engine runs
 * in Node without a JSX transform (scripts/render-figures.mjs imports it as
 * plain TypeScript) and renders on the server like any other element tree.
 */

import { createElement, type ReactElement, type ReactNode } from "react";
import { r2 } from "./math.ts";
import { FONT_STACK, type Palette } from "./palette.ts";
import { focusIds } from "./timing.ts";
import type { FigureBase, RenderOptions } from "./types.ts";

export type SvgNode = ReactElement | null | false | undefined;
type AttrValue = string | number | boolean | null | undefined;
export type Attrs = Readonly<Record<string, AttrValue>>;

/** Smallest text size in user units; the contract floor is 12px. */
export const FS = { small: 12, label: 13, value: 14, strong: 16, headline: 28 } as const;

export interface Ctx<D> {
  readonly spec: FigureBase & { readonly id: string; readonly title: string };
  readonly data: D;
  readonly p: number;
  readonly width: number;
  readonly compact: boolean;
  readonly pal: Palette;
  readonly opts: RenderOptions;
  readonly idBase: string;
  readonly hatchId: string;
  readonly seed: number;
  readonly focus: ReadonlySet<string> | null;
}

/** createElement with numbers rounded to 2 decimals and empty attributes dropped. */
export function el(
  tag: string,
  attrs: Attrs,
  ...children: readonly ReactNode[]
): ReactElement {
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    props[key] = typeof value === "number" ? r2(value) : value;
  }
  return createElement(tag, props, ...children);
}

export function group(attrs: Attrs, children: readonly SvgNode[]): ReactElement {
  return el("g", attrs, ...children.filter(Boolean));
}

export interface TextOptions {
  readonly size?: number;
  readonly weight?: 400 | 500 | 600 | 700;
  readonly anchor?: "start" | "middle" | "end";
  readonly fill?: string;
  readonly opacity?: number;
  readonly baseline?: "auto" | "middle" | "hanging";
  readonly extra?: Attrs;
}

export function text(
  x: number,
  y: number,
  content: string,
  o: TextOptions & { readonly fill: string },
): ReactElement {
  return el(
    "text",
    {
      x,
      y,
      fontSize: o.size ?? FS.label,
      fontWeight: o.weight && o.weight !== 400 ? o.weight : undefined,
      textAnchor: o.anchor && o.anchor !== "start" ? o.anchor : undefined,
      dominantBaseline: o.baseline && o.baseline !== "auto" ? o.baseline : undefined,
      fill: o.fill,
      opacity: o.opacity !== undefined && o.opacity < 1 ? o.opacity : undefined,
      ...o.extra,
    },
    content,
  );
}

/** Multi-line text; lines are separate tspans with an explicit step. */
export function textLines(
  x: number,
  y: number,
  lines: readonly string[],
  lineHeight: number,
  o: TextOptions & { readonly fill: string },
): ReactElement {
  return el(
    "text",
    {
      x,
      y,
      fontSize: o.size ?? FS.label,
      fontWeight: o.weight && o.weight !== 400 ? o.weight : undefined,
      textAnchor: o.anchor && o.anchor !== "start" ? o.anchor : undefined,
      fill: o.fill,
      opacity: o.opacity !== undefined && o.opacity < 1 ? o.opacity : undefined,
      ...o.extra,
    },
    ...lines.map((line, i) =>
      el("tspan", { key: i, x, dy: i === 0 ? 0 : lineHeight }, line),
    ),
  );
}

/* --------------------------------------------------------- text measuring */

const NARROW = new Set(["i", "l", "j", "t", "f", "I", ".", ",", ":", ";", "'", "|", "!", " ", " ", "(", ")", "/"]);
const WIDE = new Set(["m", "w", "M", "W", "%", "@"]);

/** Deterministic width estimate in user units; good enough to wrap and to fit. */
export function textWidth(content: string, size: number, weight = 400): number {
  let em = 0;
  for (const ch of content) {
    if (NARROW.has(ch)) em += 0.29;
    else if (WIDE.has(ch)) em += 0.86;
    else if (ch >= "0" && ch <= "9") em += 0.58;
    else if (ch >= "A" && ch <= "Z") em += 0.66;
    else em += 0.54;
  }
  return em * size * (weight >= 600 ? 1.07 : 1);
}

/** Wrap on spaces; text beyond `maxLines` is cut with an ellipsis. */
export function wrapText(
  content: string,
  maxWidth: number,
  size: number,
  maxLines = 3,
  weight = 400,
): string[] {
  const words = content.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || textWidth(candidate, size, weight) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const tail = lines.slice(maxLines - 1).join(" ");
    return [
      ...lines.slice(0, maxLines - 1),
      fitEllipsis(tail, maxWidth, size, weight),
    ];
  }
  return lines.map((line) => fitEllipsis(line, maxWidth, size, weight));
}

/** Cut one line to a width with an ellipsis. */
export function fitEllipsis(
  content: string,
  maxWidth: number,
  size: number,
  weight = 400,
): string {
  if (textWidth(content, size, weight) <= maxWidth) return content;
  let out = content;
  while (out.length > 1 && textWidth(`${out}…`, size, weight) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}…`;
}

/* ------------------------------------------------------------- transforms */

/** Scale about (cx, cy) as one matrix attribute; null at scale 1 (finished state). */
export function scaleAbout(
  sx: number,
  sy: number,
  cx: number,
  cy: number,
): string | undefined {
  if (sx === 1 && sy === 1) return undefined;
  return `matrix(${r2(sx)} 0 0 ${r2(sy)} ${r2(cx * (1 - sx))} ${r2(cy * (1 - sy))})`;
}

export function translate(dx: number, dy: number): string | undefined {
  if (dx === 0 && dy === 0) return undefined;
  return `translate(${r2(dx)} ${r2(dy)})`;
}

/** opacity attribute value, omitted at 1. */
export function op(value: number): number | undefined {
  return value >= 0.999 ? undefined : Math.max(0, r2(value));
}

/** Dimming from the reader's highlight or the active step's focus. */
export function dim(ctx: Ctx<unknown>, id: string): number {
  if (ctx.opts.highlight && ctx.opts.highlight !== id) return 0.4;
  if (ctx.focus && !ctx.focus.has(id)) return 0.4;
  return 1;
}

export function isEmphasised(ctx: Ctx<unknown>, id: string): boolean {
  return ctx.opts.highlight === id || (ctx.focus?.has(id) ?? false);
}

/* ---------------------------------------------------------------- patterns */

/** Hatch pattern for suppressed (fewer than 5) values. */
export function hatchPattern(id: string, pal: Palette): ReactElement {
  return el(
    "pattern",
    { id, patternUnits: "userSpaceOnUse", width: 6, height: 6, patternTransform: "rotate(45)" },
    el("rect", { width: 6, height: 6, fill: pal.paper }),
    el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: pal.edge, strokeWidth: 2 }),
  );
}

/* ------------------------------------------------------------------- frame */

export function makeFocus(spec: FigureBase, progress: number) {
  return focusIds(spec, progress);
}

export interface FrameProps {
  readonly ctx: Ctx<unknown>;
  readonly height: number;
  readonly children: readonly SvgNode[];
}

/** The svg root: accessible name and description, hatch defs, optional paper. */
export function frame({ ctx, height, children }: FrameProps): ReactElement {
  const { spec, width, pal, opts, idBase, hatchId } = ctx;
  const intrinsic = opts.intrinsic
    ? { width: r2(width), height: r2(height) }
    : {};
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: `0 0 ${r2(width)} ${r2(height)}`,
      role: "img",
      "aria-labelledby": `${idBase}-title ${idBase}-desc`,
      fontFamily: FONT_STACK,
      "data-figure": spec.id,
      "data-progress": r2(ctx.p),
      ...intrinsic,
      style: opts.intrinsic ? undefined : { display: "block", width: "100%", height: "auto", fontVariantNumeric: "tabular-nums" },
    } as Attrs,
    el("title", { id: `${idBase}-title` }, spec.title),
    el("desc", { id: `${idBase}-desc` }, spec.alt),
    el("defs", {}, hatchPattern(hatchId, pal)),
    opts.theme === "print"
      ? el("rect", { x: 0, y: 0, width, height, fill: pal.paper })
      : null,
    ...children.filter(Boolean),
  );
}

/* ------------------------------------------------------------------ legend */

export interface LegendItem {
  readonly label: string;
  /** Draws the marker with its centre at (x, y). */
  readonly marker: (x: number, y: number) => SvgNode;
  readonly markerWidth?: number;
}

/**
 * Legend that flows into rows inside [left, right]. Returns the nodes and the
 * y below the last row.
 */
export function flowLegend(
  items: readonly LegendItem[],
  left: number,
  right: number,
  top: number,
  fill: string,
  opacity?: number,
): { nodes: SvgNode[]; bottom: number } {
  const rowH = 20;
  const nodes: SvgNode[] = [];
  let x = left;
  let y = top;
  for (const item of items) {
    const mw = item.markerWidth ?? 16;
    const w = mw + 8 + textWidth(item.label, FS.small) + 18;
    if (x > left && x + w - 18 > right) {
      x = left;
      y += rowH;
    }
    nodes.push(
      el("g", { opacity }, item.marker(x + mw / 2, y), text(x + mw + 8, y + 4, item.label, { size: FS.small, fill })),
    );
    x += w;
  }
  return { nodes, bottom: y + rowH };
}
