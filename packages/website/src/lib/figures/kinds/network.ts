/**
 * Network (H01): up to 80 nodes at fixed positions (no force simulation) and
 * one baked edge set per detent. Moving the detent keeps the edges that
 * survive, fades the ones that go and counts the numeral down. The node the
 * story is about and its strongest neighbours carry the only labels.
 */

import type { ReactElement } from "react";
import { formatDecimal } from "../format.ts";
import { HM, flexible, flip, heroHeader, pickVariant, roleText, unitNode } from "../hero.ts";
import { clamp, r2 } from "../math.ts";
import { mixHex } from "../palette.ts";
import { between, settleIn, springIn } from "../motion.ts";
import { FS, dim, el, frame, op, scaleAbout, textWidth, type Ctx, type SvgNode } from "../svg.ts";
import { langOf, tr } from "../i18n.ts";
import type { NetworkData, NetworkEdge, NetworkVariant } from "../types.ts";

const edgeKey = (e: NetworkEdge): number => Math.min(e[0], e[1]) * 4096 + Math.max(e[0], e[1]);

interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

const overlaps = (a: Box, b: Box): boolean => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** Edge set sizes by variant, in order, for the table and the readout. */
export function networkEdgeCounts(data: NetworkData): readonly number[] {
  return data.variants.map((v) => v.edges.length);
}

function edgePath(edges: readonly NetworkEdge[], pt: (i: number) => readonly [number, number]): string {
  let d = "";
  for (const e of edges) {
    const [ax, ay] = pt(e[0]);
    const [bx, by] = pt(e[1]);
    d += `M${r2(ax)} ${r2(ay)}L${r2(bx)} ${r2(by)}`;
  }
  return d;
}

/** Path of edges that shrink toward their first node: at t = 0 whole, at t = 1 of zero length. */
function shrinkPath(edges: readonly NetworkEdge[], pt: (i: number) => readonly [number, number], t: number): string {
  let d = "";
  for (const e of edges) {
    const [ax, ay] = pt(e[0]);
    const [bx, by] = pt(e[1]);
    d += `M${r2(ax)} ${r2(ay)}L${r2(ax + (bx - ax) * (1 - t))} ${r2(ay + (by - ay) * (1 - t))}`;
  }
  return d;
}

interface Cached {
  readonly ghosts: string;
  readonly staying: string;
  readonly leaving: string;
  /** The leaving edges themselves, drawn shrinking toward one end while they go. */
  readonly leavingEdges: readonly NetworkEdge[];
  readonly entering: string;
  readonly counts: readonly [number, number, number, number];
}

const pathCache = new WeakMap<NetworkData, Map<string, Cached>>();

/** The four edge paths for a move between two detents; computed once per size, not once per frame. */
function edgePaths(
  data: NetworkData,
  from: NetworkVariant,
  to: NetworkVariant,
  kiIndex: number,
  pt: (i: number) => readonly [number, number],
  sizeKey: string,
): Cached {
  let bySize = pathCache.get(data);
  if (!bySize) {
    bySize = new Map();
    pathCache.set(data, bySize);
  }
  const key = `${sizeKey}:${from.id}>${to.id}`;
  const hit = bySize.get(key);
  if (hit) return hit;
  const inFrom = new Set(from.edges.map(edgeKey));
  const inTo = new Set(to.edges.map(edgeKey));
  const everything = new Map<number, NetworkEdge>();
  for (const v of data.variants) for (const e of v.edges) everything.set(edgeKey(e), e);
  const groups: Record<"ghosts" | "staying" | "leaving" | "entering", NetworkEdge[]> = { ghosts: [], staying: [], leaving: [], entering: [] };
  for (const [k, e] of everything) {
    if (e[0] === kiIndex || e[1] === kiIndex) continue;
    const a = inFrom.has(k);
    const b = inTo.has(k);
    if (a && b) groups.staying.push(e);
    else if (a) groups.leaving.push(e);
    else if (b) groups.entering.push(e);
    else groups.ghosts.push(e);
  }
  const made: Cached = {
    ghosts: edgePath(groups.ghosts, pt),
    staying: edgePath(groups.staying, pt),
    leaving: edgePath(groups.leaving, pt),
    leavingEdges: groups.leaving,
    entering: edgePath(groups.entering, pt),
    counts: [groups.ghosts.length, groups.staying.length, groups.leaving.length, groups.entering.length],
  };
  bySize.set(key, made);
  return made;
}

export function renderNetwork(ctx: Ctx<NetworkData>): ReactElement {
  const { data, pal, p, width, compact } = ctx;
  const { to, from, shift } = pickVariant(ctx, data.variants, data.defaultVariant ?? data.variants[data.variants.length - 1]?.id);
  const base: NetworkVariant = data.variants.find((v) => v.id === data.baseline) ?? (data.variants[0] as NetworkVariant);
  const counted = between(from.edges.length, to.edges.length, shift);
  const shown = Math.round(counted * settleIn(p, 0.3, 0.62));
  const head = heroHeader(ctx, { numeral: formatDecimal(shown, 0, false, langOf(ctx.spec)), claim: data.claim });
  const nodes: SvgNode[] = [...head.nodes];

  const areaW = width - HM * 2;
  const left = HM;
  const top = head.bottom + 6;
  // In a stage the network fills the whole box the shell leaves it (no cap at a natural height).
  const areaH = ctx.opts.height !== undefined ? Math.max(90, ctx.opts.height - top - 30) : flexible(ctx, top, 30, compact ? 300 : 380, 150);
  const pad = compact ? 8 : 12;
  const pt = (i: number): readonly [number, number] => {
    const n = data.nodes[i];
    return n ? [left + pad + (n.x / 100) * (areaW - pad * 2), top + pad + (n.y / 100) * (areaH - pad * 2)] : [left, top];
  };
  const ease = shift >= 1 ? 1 : springIn(shift, 0, 1, "stiff");
  const edgeIn = settleIn(p, 0.22, 0.55);
  const reduced = between(from.id === base.id ? 0 : 1, to.id === base.id ? 0 : 1, shift);

  // Module cells: hairline frames around three or more nodes.
  const hulls: SvgNode[] = [];
  data.modules.forEach((m) => {
    const members = data.nodes.map((n, i) => ({ n, i })).filter((q) => q.n.module === m.id);
    if (members.length < 3) return;
    const pts = members.map((q) => pt(q.i));
    const x0 = Math.min(...pts.map((q) => q[0])) - 10;
    const x1 = Math.max(...pts.map((q) => q[0])) + 10;
    const y0 = Math.min(...pts.map((q) => q[1])) - 10;
    const y1 = Math.max(...pts.map((q) => q[1])) + 10;
    hulls.push(el("rect", { key: m.id, "data-module": m.id, x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: "none", stroke: pal.track, strokeWidth: 1 }));
  });
  nodes.push(el("g", { "data-layer": "modules", opacity: op(settleIn(p, 0.08, 0.3)) }, ...hulls));

  // Edges in four batched paths: gone from the baseline, leaving, entering, staying (cached per size).
  const inFrom = new Set(from.edges.map(edgeKey));
  const inTo = new Set(to.edges.map(edgeKey));
  const kiIndex = data.nodes.findIndex((n) => n.ki);
  const plain = (e: NetworkEdge): boolean => e[0] !== kiIndex && e[1] !== kiIndex;
  const paths = edgePaths(data, from, to, kiIndex, pt, `${width}x${areaH}:${head.bottom}`);
  const edgeWidth = compact ? 0.9 : 1.1;
  nodes.push(
    el("g", { "data-layer": "edges", opacity: op(edgeIn) },
      el("path", { "data-edges": "ghost", d: paths.ghosts, fill: "none", stroke: pal.track, strokeWidth: edgeWidth * 0.7 }),
      // The edges that go shrink to zero length toward their lower-numbered end (they leave, they do not fade).
      paths.counts[2] > 0 && ease < 1
        ? el("path", { "data-edges": "leaving", d: shrinkPath(paths.leavingEdges, pt, ease), fill: "none", stroke: pal.edge, strokeWidth: edgeWidth, opacity: op(1 - ease * 0.6) })
        : null,
      paths.counts[3] > 0 ? el("path", { "data-edges": "entering", d: paths.entering, fill: "none", stroke: pal.edge, strokeWidth: edgeWidth, opacity: op(ease) }) : null,
      // The survivors turn Mennige once edges have gone (the halving), as a tint, lighter than the story node's own edges.
      el("path", { "data-edges": "staying", d: paths.staying, fill: "none", stroke: reduced > 0.01 ? mixHex(pal.edge, pal.accent, 0.7 * reduced) : pal.edge, strokeWidth: edgeWidth }),
    ),
  );

  // Edges of the story node: the accent, as thick as the odds are strong.
  const kiEdges: SvgNode[] = [];
  const seen = new Set<number>();
  for (const v of [from, to]) {
    for (const e of v.edges) {
      if (plain(e)) continue;
      const k = edgeKey(e);
      if (seen.has(k)) continue;
      seen.add(k);
      const odds = e[2] ?? 2;
      const a = inFrom.has(k) ? 1 : 0;
      const b = inTo.has(k) ? 1 : 0;
      const alpha = a + (b - a) * ease;
      if (alpha <= 0.001) continue;
      const [ax, ay] = pt(e[0]);
      const [bx, by] = pt(e[1]);
      kiEdges.push(
        el("line", {
          key: k, "data-id": data.nodes[e[0] === kiIndex ? e[1] : e[0]]?.id,
          x1: ax, y1: ay, x2: bx, y2: by, stroke: flip(ctx, data.nodes[e[0] === kiIndex ? e[1] : e[0]]?.id ?? "", pal.accent),
          strokeWidth: (compact ? 1.2 : 1.5) + clamp(0.55 * Math.log2(odds), 0.4, 2.8),
          opacity: op(alpha * edgeIn * dim(ctx, data.nodes[e[0] === kiIndex ? e[1] : e[0]]?.id ?? "")),
        }),
      );
    }
  }
  nodes.push(el("g", { "data-layer": "ki-edges" }, ...kiEdges));

  // Nodes: hard squares, popping in module by module.
  // Squares shrink with the box: on a short stage the 60 nodes stay readable squares, not a block of ink.
  const side = areaH < 200 ? 8 : 12;
  const kiSide = side * 1.5;
  const moduleIndex = new Map(data.modules.map((m, i) => [m.id, i]));
  const marks: SvgNode[] = [];
  data.nodes.forEach((n, i) => {
    const [x, y] = pt(i);
    const s = n.ki ? kiSide : side;
    const start = 0.02 + (moduleIndex.get(n.module) ?? 0) * 0.03 + (i % 7) * 0.004;
    const grow = springIn(p, start, start + 0.14, "snap");
    marks.push(
      el("rect", {
        key: n.id, "data-id": n.id, x: x - s / 2, y: y - s / 2, width: s, height: s,
        fill: flip(ctx, n.id, n.ki ? pal.accent : pal.ink), stroke: pal.paper, strokeWidth: 1,
        opacity: p <= start ? 0 : op(dim(ctx, n.id)),
        transform: scaleAbout(grow, grow, x, y),
      }),
    );
  });
  nodes.push(el("g", { "data-layer": "nodes" }, ...marks));

  // Labels: the story node and its three strongest neighbours, each where it fits.
  const placed: Box[] = data.nodes.map((q, i) => {
    const [nx, ny] = pt(i);
    const h = (q.ki ? kiSide : side) / 2 + 1;
    return { x0: nx - h, y0: ny - h, x1: nx + h, y1: ny + h };
  });
  const bounds: Box = { x0: left, y0: top, x1: left + areaW, y1: top + areaH };
  const labels: SvgNode[] = [];
  const labelFor = (nodeId: string, strong: boolean): void => {
    const idx = data.nodes.findIndex((n) => n.id === nodeId);
    const node = data.nodes[idx];
    if (!node) return;
    const [x, y] = pt(idx);
    const w = textWidth(node.label, FS.label, 700) + 4;
    const half = (node.ki ? kiSide : side) / 2 + 4;
    const candidates: ReadonlyArray<readonly [number, number, "start" | "end" | "middle"]> = [
      [x + half, y + 4, "start"], [x - half, y + 4, "end"], [x, y - half - 3, "middle"], [x, y + half + 14, "middle"],
      [x + half, y - 8, "start"], [x - half, y - 8, "end"], [x + half, y + 18, "start"], [x - half, y + 18, "end"],
    ];
    for (const [cx, cy, anchor] of candidates) {
      const x0 = anchor === "start" ? cx : anchor === "end" ? cx - w : cx - w / 2;
      const box: Box = { x0, y0: cy - 12, x1: x0 + w, y1: cy + 4 };
      if (box.x0 < bounds.x0 || box.x1 > bounds.x1 || box.y0 < bounds.y0 || box.y1 > bounds.y1) continue;
      if (placed.some((q) => overlaps(q, box))) continue;
      placed.push(box);
      labels.push(
        roleText("label", cx, cy, node.label, {
          size: FS.label, weight: 700, fill: node.ki || strong ? pal.accent : pal.ink, anchor,
          extra: { stroke: pal.paper, strokeWidth: 3.5, strokeLinejoin: "round", paintOrder: "stroke" },
        }),
      );
      return;
    }
  };
  if (kiIndex >= 0) {
    const kiNode = data.nodes[kiIndex];
    if (kiNode) labelFor(kiNode.id, true);
  }
  const strongest = [...(data.neighbours ?? [])].sort((a, b) => b.odds - a.odds).slice(0, 3);
  for (const nb of strongest) labelFor(nb.node, false);
  nodes.push(el("g", { "data-layer": "labels", opacity: op(settleIn(p, 0.55, 0.8)) }, ...labels));

  const bottom = top + areaH;
  const lang = langOf(ctx.spec);
  const edgeWord = tr(lang, data.edgeWord ?? "Verbindungen");
  const baseCount = base.edges.length;
  const line =
    to.id === base.id
      ? `${edgeWord}, ${tr(lang, to.label)}`
      : `${edgeWord} ${lang === "en" ? "at" : "bei"} ${tr(lang, to.label)}, ${tr(lang, base.label)}: ${formatDecimal(baseCount, 0, false, lang)}`;
  nodes.push(unitNode(ctx, HM, bottom + 20, line));
  return frame({ ctx, height: Math.max(bottom + 30, ctx.opts.height ?? 0), children: nodes });
}
