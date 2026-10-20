/**
 * Field (Das Feld) as SVG: the print, reduced-motion and no-JS painter of the
 * unit-square engine. It draws the same frame() the canvas draws, so the page,
 * the film and the PDF cannot disagree. Squares are batched into one path per
 * class (no element per square), so even 1.034 squares stay a few kilobytes.
 */

import type { ReactElement } from "react";
import { formatDecimal } from "../format.ts";
import { langOf } from "../i18n.ts";
import { compileFeld, type FeldModel } from "../feld/model.ts";
import { createFrameBuffer, frame } from "../feld/frame.ts";
import { F, STRIDE } from "../feld/model.ts";
import { HM, antiOf, heroHeader, labelLegend, partialsPath, roleText, squaresPath, unitNode } from "../hero.ts";
import { r2 } from "../math.ts";
import { settleIn } from "../motion.ts";
import { FS, dim, el, frame as svgFrame, op, type Ctx, type SvgNode } from "../svg.ts";
import type { FieldData, FieldNumeral, FieldTone } from "../types.ts";
import type { Palette } from "../palette.ts";

/** Height of the field region for a view width: the phone gets a squarer block. */
export function fieldHeight(width: number): number {
  return Math.round(width < 480 ? width * 0.96 : width * 0.72);
}

const cache = new WeakMap<FieldData, Map<string, FeldModel>>();

/** Compiled model per data object and size; compile is cheap but React re-renders often. */
export function modelFor(data: FieldData, width: number, height: number, lang: "de" | "en" = "de"): FeldModel {
  let bySize = cache.get(data);
  if (!bySize) {
    bySize = new Map();
    cache.set(data, bySize);
  }
  const key = `${width}x${height}${lang}`;
  let model = bySize.get(key);
  if (!model) {
    model = compileFeld(data, { width, height, lang });
    bySize.set(key, model);
  }
  return model;
}

export function toneColour(pal: Palette, tone: FieldTone): string {
  switch (tone) {
    case "accent": return pal.accent;
    case "leinen": return pal.track;
    case "ghost": return pal.edge;
    default: return pal.ink;
  }
}

interface Group {
  readonly whole: Array<readonly [number, number]>;
  readonly parts: Array<readonly [number, number, number, number]>;
  readonly ghosts: Array<readonly [number, number]>;
  side: number;
}

/** The numeral of a scene as printed: "62x", "46 %", "35". */
export function fieldNumeralText(n: FieldNumeral): string {
  const digits = n.fmt.digits ?? (n.fmt.style === "percent" ? 1 : 0);
  return `${formatDecimal(n.value, digits)}${n.suffix ?? (n.fmt.style === "percent" ? " %" : "")}`;
}

export function renderField(ctx: Ctx<FieldData>): ReactElement {
  const { data, pal, p, width } = ctx;
  const height = fieldHeight(width);
  const model = modelFor(data, width, height, langOf(ctx.spec));
  const buf = createFrameBuffer(model);
  const info = frame(model, p, buf);
  const scene = model.scenes[info.display] ?? model.scenes[0]!;
  const settled = model.scenes[info.index] ?? scene;

  const numeral = scene.numeral;
  const head = heroHeader(ctx, {
    numeral: numeral ? fieldNumeralText(numeral) : undefined,
    claim: scene.claim,
    accent: true,
  });
  const nodes: SvgNode[] = [...head.nodes];
  const top = head.bottom + 4;

  const groups = new Map<number, Group>();
  const groupOf = (cls: number): Group => {
    let g = groups.get(cls);
    if (!g) {
      g = { whole: [], parts: [], ghosts: [], side: 0 };
      groups.set(cls, g);
    }
    return g;
  };
  let visible = 0;
  for (let i = 0; i < model.capacity; i += 1) {
    const o = i * STRIDE;
    const cls = buf[o + F.cls] ?? -1;
    const size = buf[o + F.size] ?? 0;
    if (cls >= 0) {
      const x = buf[o + F.x] ?? 0;
      const y = buf[o + F.y] ?? 0;
      if (y < height && y + size > 0) {
        const g = groupOf(cls);
        g.side = size;
        const fill = buf[o + F.fill] ?? 1;
        if (fill >= 1) g.whole.push([x, y + top]);
        else g.parts.push([x, y + top, size, fill]);
        visible += 1;
      }
    }
    const ga = buf[o + F.ga] ?? 0;
    if (ga > 0.5) {
      const home = settled.cls[i] ?? -1;
      if (home >= 0) {
        const g = groupOf(home);
        g.ghosts.push([buf[o + F.gx] ?? 0, (buf[o + F.gy] ?? 0) + top]);
        g.side = settled.side;
        visible += 1;
      }
    }
  }

  const order = [...groups.keys()].sort((a, b) => rank(model, a) - rank(model, b));
  const layers: SvgNode[] = [];
  for (const cls of order) {
    const g = groups.get(cls) as Group;
    const c = model.classes[cls];
    if (!c) continue;
    const id = c.id === "__ink" ? "ink" : c.id;
    const opacity = op(dim(ctx, id));
    if (c.tone === "ghost") {
      if (g.ghosts.length > 0) {
        layers.push(
          el("path", {
            key: `gh${id}`, "data-id": id, "data-ghost": "true", d: ghostPath(g.ghosts, g.side), fill: "none", stroke: pal.edge, strokeWidth: 1.4, opacity,
          }),
        );
      }
      if (g.whole.length > 0) layers.push(el("path", { key: `gw${id}`, d: squaresPath(g.whole, g.side), fill: pal.ink, opacity }));
      continue;
    }
    const base = toneColour(pal, c.tone);
    const colour = ctx.opts.highlight === id ? antiOf(pal, base) : base;
    if (g.parts.length > 0) {
      layers.push(
        el("path", { key: `po${id}`, d: ghostPath(g.parts.map((q) => [q[0], q[1]] as const), g.side), fill: "none", stroke: pal.edge, strokeWidth: 1, opacity }),
        el("path", { key: `pf${id}`, "data-id": id, d: partialsPath(g.parts), fill: colour, opacity }),
      );
    }
    if (g.whole.length > 0) layers.push(el("path", { key: `w${id}`, "data-id": id, d: squaresPath(g.whole, g.side), fill: colour, opacity }));
  }
  nodes.push(el("g", { "data-layer": "field", opacity: visible === 0 ? 0 : undefined }, ...layers));

  // Direct labels of the bins, once the scene is formed.
  const labelOpacity = op(settleIn(p, model.starts[info.index] ?? 0, (model.starts[info.index] ?? 0) + 0.12 + 0.3 * ((model.starts[info.index + 1] ?? 1) - (model.starts[info.index] ?? 0))));
  const labelNodes: SvgNode[] = settled.labels.map((l, i) =>
    roleText(l.role, l.x, l.y + top, l.text, { size: l.size ?? (l.role === "value" ? FS.value : FS.label), weight: l.role === "value" ? 700 : 600, fill: pal.ink, anchor: l.anchor, extra: { key: `l${i}` } }),
  );
  if (labelNodes.length > 0) nodes.push(el("g", { "data-layer": "labels", opacity: info.settled ? labelOpacity : 0 }, ...labelNodes));

  let bottom = top + height + 6;
  // Legend of the classes: marker, name, exact count.
  const legendIds = settled.legend.length > 0 ? settled.legend : [];
  if (legendIds.length > 0) {
    const legend = labelLegend(
      ctx,
      legendIds.map((cls) => {
        const c = model.classes[cls];
        const colour = c ? toneColour(pal, c.tone) : pal.ink;
        const tone = c?.tone;
        return {
          label: `${c?.label ?? ""} ${formatDecimal(settled.counts[cls] ?? 0, 0)}`,
          marker: (x: number, y: number) =>
            el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, fill: tone === "ghost" ? "none" : colour, stroke: tone === "ghost" ? pal.edge : undefined, strokeWidth: tone === "ghost" ? 1.4 : undefined }),
        };
      }),
      bottom + 8,
      undefined,
    );
    nodes.push(...legend.nodes);
    bottom = legend.bottom;
  }
  nodes.push(unitNode(ctx, HM, bottom + 14, scene.unit));
  return svgFrame({ ctx, height: ctx.opts.bare ? bottom + 4 : bottom + 30, children: nodes });
}

/** Outlines of squares of side s, as one path of open-fill rectangles. */
function ghostPath(corners: ReadonlyArray<readonly [number, number]>, s: number): string {
  const side = r2(Math.max(1, s - 1));
  let d = "";
  for (const [x, y] of corners) d += `M${r2(x + 0.5)} ${r2(y + 0.5)}h${side}v${side}h${-side}z`;
  return d;
}

/** Paint order: leinen and outlines first, ink next, the accent on top. */
function rank(model: FeldModel, cls: number): number {
  switch (model.classes[cls]?.tone) {
    case "leinen": return 0;
    case "ghost": return 1;
    case "accent": return 3;
    default: return 2;
  }
}
