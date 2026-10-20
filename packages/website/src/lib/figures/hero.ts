/**
 * Shared parts of the hero kinds: the numeral and claim block (one giant
 * numeral, a sentence of at most 12 words), text roles for the word budget,
 * batched square paths and the colours of a tone. Pure SVG building blocks.
 */

import type { ReactElement } from "react";
import { clamp, r2 } from "./math.ts";
import { settleIn, springIn } from "./motion.ts";
import type { Palette } from "./palette.ts";
import { FS, el, op, text, textLines, textWidth, translate, wrapText, type Ctx, type SvgNode } from "./svg.ts";
import type { HeroTone, NumFmt } from "./types.ts";
import { formatValue } from "./format.ts";

/** Side margin of every hero figure in user units. */
export const HM = 16;

/**
 * What a text node is, for the rubric: numerals, units and ticks are free;
 * claims and labels count against the 12-word stage budget.
 */
export type TextRole = "numeral" | "claim" | "label" | "value" | "tick" | "unit";

export const ROLE_ATTR = "data-t";

export function roleText(
  role: TextRole,
  x: number,
  y: number,
  content: string,
  o: Parameters<typeof text>[3],
): ReactElement {
  return text(x, y, content, { ...o, extra: { ...o.extra, [ROLE_ATTR]: role } });
}

/** Words of the claim and label texts of a rendered SVG (document order). */
export function stageWords(svg: Element): number {
  let words = 0;
  for (const node of Array.from(svg.querySelectorAll("text"))) {
    const role = node.getAttribute(ROLE_ATTR);
    if (role !== "claim" && role !== "label") continue;
    words += (node.textContent ?? "").split(/\s+/).filter(Boolean).length;
  }
  return words;
}

/* ----------------------------------------------------------------- colours */

export function toneFill(pal: Palette, tone: HeroTone | "leinen"): { fill: string; stroke?: string; strokeWidth?: number } {
  switch (tone) {
    case "accent": return { fill: pal.accent };
    case "ink": return { fill: pal.ink };
    case "grey": return { fill: pal.edge };
    case "leinen": return { fill: pal.track };
    default: return { fill: "none", stroke: pal.ink, strokeWidth: 1.75 };
  }
}

/** Anti colour of a mark: ink marks go accent, accent marks go ink. */
export function antiOf(pal: Palette, fill: string): string {
  return fill === pal.accent ? pal.ink : pal.accent;
}

/* ------------------------------------------------------------ square paths */

/** One path of hard-edged squares of side `s` at the given top-left corners. */
export function squaresPath(corners: ReadonlyArray<readonly [number, number]>, s: number): string {
  const side = r2(s);
  let d = "";
  for (const [x, y] of corners) d += `M${r2(x)} ${r2(y)}h${side}v${side}h${-side}z`;
  return d;
}

/** Partial squares, filled from the bottom: [x, y, side, fill]. */
export function partialsPath(items: ReadonlyArray<readonly [number, number, number, number]>): string {
  let d = "";
  for (const [x, y, s, f] of items) {
    const h = r2(s * clamp(f));
    d += `M${r2(x)} ${r2(y + s - h)}h${r2(s)}v${h}h${r2(-s)}z`;
  }
  return d;
}

/* ------------------------------------------------------------------ header */

export interface HeroHeaderInput {
  /** The one giant numeral, already formatted. */
  readonly numeral?: string;
  readonly claim?: string;
  /** Numeral in the accent (only when the numeral is the finding). */
  readonly accent?: boolean;
  /** Progress window of the numeral's drop. */
  readonly drop?: readonly [number, number];
}

export interface HeroHeaderResult {
  readonly nodes: SvgNode[];
  /** y below the block. */
  readonly bottom: number;
}

/** Font size of the numeral for a view width: about 0.34 of it, fitted so the text stays inside the margins. */
export function numeralSize(width: number, content: string): number {
  const wanted = clamp(width * 0.34, 56, 190);
  const em = textWidth(content, 1, 800);
  // Extra-bold digits run wider than the estimate; keep a tenth of the line free.
  const room = Math.max(40, (width - HM * 2) * 0.9);
  return Math.floor(Math.min(wanted, room / Math.max(em, 0.5)));
}

/**
 * Wraps a sentence into as few lines as it needs, then evens the lines out so
 * no line ends on one orphaned word.
 */
export function balancedLines(content: string, maxWidth: number, size: number, maxLines = 3, weight = 400): string[] {
  const words = content.split(/\s+/).filter(Boolean);
  const greedy = (limit: number): string[] => {
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || textWidth(candidate, size, weight) <= limit) current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  };
  const natural = greedy(maxWidth);
  if (natural.length > maxLines) return wrapText(content, maxWidth, size, maxLines, weight);
  if (natural.length < 2) return natural;
  // Narrow the measure until one more line would be needed: the lines come out even.
  let best = natural;
  for (let limit = maxWidth; limit >= maxWidth * 0.5; limit -= 3) {
    const lines = greedy(limit);
    if (lines.length !== natural.length) break;
    best = lines;
  }
  return best;
}

export function claimSize(width: number): number {
  return width < 480 ? 22 : 30;
}

/**
 * Numeral and claim, left-anchored. The numeral drops in on a soft spring
 * (it may overshoot by a hair, it is large type); the claim follows with the
 * first marks. `bare` leaves both out (the stage prints them in the page).
 */
export function heroHeader(ctx: Ctx<unknown>, input: HeroHeaderInput): HeroHeaderResult {
  const { width, pal, p } = ctx;
  if (ctx.opts.bare) return { nodes: [], bottom: 8 };
  const nodes: SvgNode[] = [];
  let y = 4;
  if (input.numeral) {
    const size = numeralSize(width, input.numeral);
    const [d0, d1] = input.drop ?? [0, 0.16];
    const drop = springIn(p, d0, d1, "soft");
    const baseline = y + size * 0.82;
    nodes.push(
      roleText("numeral", HM, baseline, input.numeral, {
        size,
        weight: 800,
        fill: input.accent ? pal.accent : pal.ink,
        opacity: op(settleIn(p, d0, d0 + (d1 - d0) * 0.5)),
        extra: { transform: translate(0, -(1 - drop) * size * 0.35), "data-hero": "numeral" },
      }),
    );
    // The comma and the percent sign hang below the baseline: leave a fifth of the size before the claim.
    y = baseline + Math.max(14, Math.round(size * 0.2));
  }
  if (input.claim) {
    const size = claimSize(width);
    const lines = balancedLines(input.claim, width - HM * 2, size, 3, 700);
    const o = op(settleIn(p, 0.04, 0.2));
    nodes.push(textLines(HM, y + size, lines, size * 1.2, { size, weight: 700, fill: pal.ink, opacity: o, extra: { [ROLE_ATTR]: "claim" } }));
    y += size * 1.2 * lines.length + 14;
  }
  return { nodes, bottom: y };
}

/** Fill (or stroke) colour of a mark: the anti colour while the reader points at it. */
export function flip(ctx: Ctx<unknown>, id: string, colour: string): string {
  return ctx.opts.highlight === id ? antiOf(ctx.pal, colour) : colour;
}

/**
 * A flexible dimension (rows, plot height) fitted to the box the stage leaves
 * the figure: the natural size without a height option, otherwise what is
 * left after the fixed parts, never below `min`.
 */
export function flexible(ctx: Ctx<unknown>, top: number, below: number, natural: number, min: number): number {
  const box = ctx.opts.height;
  if (box === undefined) return natural;
  return Math.max(min, Math.min(natural, box - top - below));
}

/** The unit line under a field: one quiet line. Left out when the stage prints it. */
export function unitNode(ctx: Ctx<unknown>, x: number, y: number, content: string): SvgNode {
  if (!content || ctx.opts.bare) return null;
  return roleText("unit", x, y, content, { size: FS.small, fill: ctx.pal.mutedLight, opacity: op(settleIn(ctx.p, 0.05, 0.2)) });
}

/** A number in the numeral line: value with its unit, tight suffix optional. */
export function numeralText(fmt: NumFmt, value: number, suffix?: string): string {
  if (suffix !== undefined) return `${formatValue({ ...fmt, unit: undefined, style: fmt.style === "percent" ? "decimal" : fmt.style }, value)}${suffix}`;
  return formatValue(fmt, value);
}

/* ------------------------------------------------------------------ variants */

export interface VariantPick<V extends { readonly id: string }> {
  readonly to: V;
  readonly from: V;
  /** 0 to 1 from `from` to `to`; 1 when settled. */
  readonly shift: number;
}

/** The variant to show, the one it leaves and how far the change has run. */
export function pickVariant<V extends { readonly id: string }>(
  ctx: Ctx<unknown>,
  variants: readonly V[],
  fallbackId: string | undefined,
): VariantPick<V> {
  const byId = (id: string | undefined): V | undefined => variants.find((v) => v.id === id);
  const last = variants[variants.length - 1] as V;
  const to = byId(ctx.opts.variant) ?? byId(fallbackId) ?? last;
  const shift = ctx.opts.from !== undefined && ctx.opts.shift !== undefined ? clamp(ctx.opts.shift) : 1;
  // A settled change (shift 1) is just the target: nothing is left to blend.
  const from = shift >= 1 ? to : (byId(ctx.opts.from) ?? to);
  return { to, from, shift };
}

/** A stroke or fill attribute pair for a hairline. */
export const hair = (pal: Palette): { stroke: string; strokeWidth: number } => ({ stroke: pal.track, strokeWidth: 1 });

export function rectNode(x: number, y: number, w: number, h: number, attrs: Record<string, string | number | undefined>): ReactElement {
  return el("rect", { x, y, width: w, height: h, ...attrs });
}

/* ------------------------------------------------------------------ legend */

export interface LabelLegendItem {
  readonly label: string;
  /** Draws the marker with its centre at (x, y). */
  readonly marker: (x: number, y: number) => SvgNode;
}

/** A legend whose texts count as direct labels (role "label"), flowing into rows. */
export function labelLegend(
  ctx: Ctx<unknown>,
  items: readonly LabelLegendItem[],
  top: number,
  opacity?: number,
): { nodes: SvgNode[]; bottom: number } {
  const left = HM;
  const right = ctx.width - HM;
  const rowH = 22;
  const nodes: SvgNode[] = [];
  let x = left;
  let y = top;
  items.forEach((item, i) => {
    const w = 18 + textWidth(item.label, FS.small, 600) + 16;
    if (x > left && x + w - 16 > right) {
      x = left;
      y += rowH;
    }
    nodes.push(
      el("g", { key: `lg${i}`, opacity }, item.marker(x + 6, y), roleText("label", x + 18, y + 4, item.label, { size: FS.small, weight: 600, fill: ctx.pal.ink })),
    );
    x += w;
  });
  return { nodes, bottom: y + rowH };
}
