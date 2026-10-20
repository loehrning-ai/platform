/**
 * Blocks (H02): 100 unit blocks, each one percent of the raw count, fall from
 * a field into named bins. A definition control with two detents moves the
 * counted blocks between bins. Class sizes come from largest remainder, so
 * the blocks always add up; the exact counts are printed under each bin.
 */

import type { ReactElement } from "react";
import { formatDecimal } from "../format.ts";
import { HM, ROLE_ATTR, flip, heroHeader, pickVariant, roleText, squaresPath, toneFill, unitNode } from "../hero.ts";
import { r2 } from "../math.ts";
import { ENTRY, between, fallEase, settleIn, springIn } from "../motion.ts";
import { FS, dim, el, frame, labelLinesFit, op, textLines, translate, type Ctx, type SvgNode } from "../svg.ts";
import { langOf, tr } from "../i18n.ts";
import { frameReveal, segment } from "../timing.ts";
import { largestRemainder, unitLine } from "../units.ts";
import type { BlocksData, BlocksVariant } from "../types.ts";

/** Whole blocks per bin for a variant, by largest remainder. */
export function blocksPerBin(data: BlocksData, variant: BlocksVariant): number[] {
  return largestRemainder(data.bins.map((b) => variant.counts[b.id] ?? 0), data.blocks);
}

/** For each block 0 to blocks - 1: its bin index and its slot inside the bin. */
export function blockAssignment(perBin: readonly number[]): { bin: number[]; slot: number[] } {
  const bin: number[] = [];
  const slot: number[] = [];
  perBin.forEach((count, b) => {
    for (let s = 0; s < count; s += 1) {
      bin.push(b);
      slot.push(s);
    }
  });
  return { bin, slot };
}

interface Geometry {
  readonly s: number;
  readonly g: number;
  readonly cell: number;
  /** The field the blocks leave is drawn smaller than the stacks on a short box. */
  readonly fieldS: number;
  readonly fieldCell: number;
  readonly fieldX: number;
  readonly fieldY: number;
  readonly cols: number;
  readonly rows: number;
  readonly bcols: number;
  /** Top-left x of each bin and the baseline (bottom of the stack) of its row. */
  readonly binX: readonly number[];
  readonly binBase: readonly number[];
  readonly binW: number;
  readonly bottom: number;
  /** Name lines per bin (names wrap at the bin's width, two lines at most). */
  readonly names: readonly (readonly string[])[];
  readonly labelSize: number;
  /** Only the wide layout draws the field the blocks leave; the phone drops them in from the stage's top edge. */
  readonly showField: boolean;
  /** The stage box every block is clipped to: the blocks never leave it. */
  readonly clip: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  /** Top of the stacks area (blocks enter from here). */
  readonly stackTop: number;
  /** "columns": bins side by side, stacks grow upward (wide). "rows": one bin per row, blocks run left to right (phone stage). */
  readonly layout: "columns" | "rows";
  /** Rows layout: top and height of each bin's row, y of its first block line, and where its count is printed. */
  readonly rowTop: readonly number[];
  readonly rowH: readonly number[];
  readonly blockTop: readonly number[];
}

/** Gap between the claim above the stage and the first row of bins (px of the box). */
export const BLOCKS_TOP_GAP = 20;
const MAX_CELL = 14;
const MIN_CELL = 6;

interface Layout {
  readonly s: number;
  readonly g: number;
  readonly cell: number;
  readonly bcols: number;
  readonly binW: number;
  readonly areaX: number;
  readonly gap: number;
  /** Rows of blocks reserved per bin (the tallest any variant needs). */
  readonly most: readonly number[];
}

function layoutFor(ctx: Ctx<BlocksData>, cell: number, areaX: number, areaW: number, gap: number): Layout {
  const { data } = ctx;
  const g = cell >= 18 ? 3 : cell >= 11 ? 2 : 1;
  const s = cell - g;
  const perRow = 3;
  const binW = (areaW - gap * (perRow - 1)) / perRow;
  const bcols = Math.max(1, Math.floor(binW / cell));
  const most = data.bins.map((_b, i) => Math.max(...data.variants.map((v) => Math.ceil((blocksPerBin(data, v)[i] ?? 0) / bcols))));
  return { s, g, cell, bcols, binW, areaX, gap, most };
}

function columnsGeometry(ctx: Ctx<BlocksData>, top: number): Geometry {
  const { data, width, compact } = ctx;
  const lang = langOf(ctx.spec);
  const sideBySide = !compact;
  const perRow = 3;
  const gap = compact ? 6 : 14;
  const cols = Math.ceil(Math.sqrt(data.blocks));
  const rows = Math.ceil(data.blocks / cols);
  const base = FS.label;

  // Wide: a drawn field on the left, the bins beside it (the natural height of the figure).
  // Phone: the bins use the whole stage; the cell is the largest one whose two bin rows fit the box.
  const fieldCell = compact ? 0 : 18;
  const fieldW = cols * fieldCell;
  const areaX = sideBySide ? HM + fieldW + 26 : HM;
  const areaW = width - HM - areaX;
  const boxH = ctx.opts.height;
  const unitH = ctx.opts.bare ? 4 : 28;
  const gapTop = compact ? BLOCKS_TOP_GAP : 0;

  const probe = layoutFor(ctx, compact ? MAX_CELL : 18, areaX, areaW, gap);
  const fitted = data.bins.map((b) => labelLinesFit(tr(lang, b.label), probe.binW, base, 600));
  const labelSize = Math.min(...fitted.map((f) => f.size));
  const names = fitted.map((f) => f.lines);
  const nameLines = Math.max(1, ...names.map((q) => q.length));
  const labelH = 15 * nameLines + 30;
  const rowCount = Math.ceil(data.bins.length / perRow);

  const heightOf = (lay: Layout): number => {
    let h = 0;
    for (let r = 0; r < rowCount; r += 1) {
      const inRow = lay.most.slice(r * perRow, r * perRow + perRow);
      h += Math.max(1, ...inRow) * lay.cell + labelH;
    }
    return h;
  };

  let lay = layoutFor(ctx, compact ? MAX_CELL : 18, areaX, areaW, gap);
  if (compact) {
    const avail = boxH !== undefined ? boxH - top - gapTop - unitH : Infinity;
    for (let cell = MAX_CELL; cell >= MIN_CELL; cell -= 1) {
      lay = layoutFor(ctx, cell, areaX, areaW, gap);
      if (heightOf(lay) <= avail) break;
    }
  }
  const content = heightOf(lay);
  // Centre the block area in the free height of the stage.
  const free = boxH !== undefined && compact ? Math.max(0, boxH - top - gapTop - unitH - content) : 0;
  const tops = top + gapTop + free / 2;

  const binX: number[] = [];
  const binBase: number[] = [];
  let y = tops;
  for (let r = 0; r < rowCount; r += 1) {
    const inRow = data.bins.slice(r * perRow, r * perRow + perRow);
    const rowRows = Math.max(1, ...inRow.map((_b, k) => lay.most[r * perRow + k] ?? 1));
    const baseY = y + rowRows * lay.cell;
    inRow.forEach((_b, k) => {
      binX.push(lay.areaX + k * (lay.binW + lay.gap));
      binBase.push(baseY);
    });
    y = baseY + labelH;
  }
  const fieldH = rows * fieldCell;
  const bottom = Math.max(y, sideBySide ? top + fieldH : 0);
  const clipTop = top;
  const clipBottom = boxH !== undefined && compact ? boxH : bottom + unitH;
  return {
    s: lay.s,
    g: lay.g,
    cell: lay.cell,
    fieldS: Math.max(1, fieldCell - 3),
    fieldCell,
    fieldX: HM,
    fieldY: top,
    cols,
    rows,
    bcols: lay.bcols,
    binX,
    binBase,
    binW: lay.binW,
    bottom,
    names,
    labelSize,
    showField: !compact,
    clip: { x: 0, y: clipTop, w: width, h: Math.max(1, clipBottom - clipTop) },
    stackTop: tops,
    layout: "columns",
    rowTop: [],
    rowH: [],
    blockTop: [],
  };
}

const LABEL_W = 116;
const COUNT_W = 46;
const ROW_GAP = 6;
/** Breathing room above the first row of a phone stage (top of the box is 8). */
const ROWS_TOP_GAP = 12;

/**
 * Phone stage: one row per bin, name on the left, blocks running left to right (as many lines as the biggest
 * definition needs), the exact count on the right. All six bins and all counts are on screen from the first
 * frame; the cell is the largest that fits the box, and the block area is centred in what is left.
 */
function rowsGeometry(ctx: Ctx<BlocksData>, top: number): Geometry {
  const { data, width } = ctx;
  const lang = langOf(ctx.spec);
  const boxH = ctx.opts.height;
  const unitH = ctx.opts.bare ? 4 : 28;
  const fitted = data.bins.map((b) => labelLinesFit(tr(lang, b.label), LABEL_W, FS.label, 600));
  const labelSize = Math.min(...fitted.map((f) => f.size));
  const names = fitted.map((f) => f.lines);
  const areaX = HM + LABEL_W + 8;
  const areaW = Math.max(40, width - HM - COUNT_W - 6 - areaX);
  const avail = boxH !== undefined ? boxH - top - ROWS_TOP_GAP - unitH : Infinity;

  const plan = (cell: number) => {
    const bcols = Math.max(1, Math.floor(areaW / cell));
    const lines = data.bins.map((_b, i) => Math.max(...data.variants.map((v) => Math.ceil((blocksPerBin(data, v)[i] ?? 0) / bcols))));
    const rowH = data.bins.map((_b, i) => Math.max(lines[i]! * cell, (names[i]?.length ?? 1) * 15 + 2, 20));
    const total = rowH.reduce((sum, h) => sum + h, 0) + ROW_GAP * (data.bins.length - 1);
    return { bcols, lines, rowH, total };
  };
  let cell = 12;
  let pl = plan(cell);
  while (pl.total > avail && cell > 5) {
    cell -= 1;
    pl = plan(cell);
  }
  const g = cell >= 11 ? 2 : 1;
  const free = Number.isFinite(avail) ? Math.max(0, avail - pl.total) : 0;
  const tops = top + ROWS_TOP_GAP + free / 2;
  const rowTop: number[] = [];
  const blockTop: number[] = [];
  let y = tops;
  pl.rowH.forEach((h, i) => {
    rowTop.push(y);
    blockTop.push(y + (h - (pl.lines[i] ?? 1) * cell) / 2);
    y += h + ROW_GAP;
  });
  const bottom = y - ROW_GAP;
  const clipBottom = boxH !== undefined ? boxH : bottom + unitH;
  return {
    s: cell - g,
    g,
    cell,
    fieldS: 0,
    fieldCell: 0,
    fieldX: HM,
    fieldY: top,
    cols: 0,
    rows: 0,
    bcols: pl.bcols,
    binX: data.bins.map(() => areaX),
    binBase: rowTop.map((t, i) => t + (pl.rowH[i] ?? 0)),
    binW: areaW,
    bottom,
    names,
    labelSize,
    showField: false,
    clip: { x: 0, y: top, w: width, h: Math.max(1, clipBottom - top) },
    stackTop: tops,
    layout: "rows",
    rowTop,
    rowH: pl.rowH,
    blockTop,
  };
}

function geometry(ctx: Ctx<BlocksData>, top: number): Geometry {
  return ctx.compact ? rowsGeometry(ctx, top) : columnsGeometry(ctx, top);
}

export function renderBlocks(ctx: Ctx<BlocksData>): ReactElement {
  const { data, pal, p } = ctx;
  const lang = langOf(ctx.spec);
  const { to, from, shift } = pickVariant(ctx, data.variants, data.defaultVariant);
  const perTo = blocksPerBin(data, to);
  const perFrom = blocksPerBin(data, from);
  const asgTo = blockAssignment(perTo);
  const asgFrom = blockAssignment(perFrom);
  const findingIndex = Math.max(0, data.bins.findIndex((b) => b.id === data.finding));
  const found = between(perFrom[findingIndex] ?? 0, perTo[findingIndex] ?? 0, shift);
  const fallEnd = ENTRY.first + (data.bins.length - 1) * ENTRY.perBin + ENTRY.fall;
  const tick = settleIn(p, ENTRY.first + findingIndex * ENTRY.perBin + 0.08, Math.min(1, fallEnd + 0.04));
  const shown = Math.round(found * tick);
  const head = heroHeader(ctx, { numeral: formatDecimal(shown, 0, false, lang), claim: data.claim });
  const geo = geometry(ctx, head.bottom);
  const nodes: SvgNode[] = [...head.nodes];
  const o = op(frameReveal(p));

  // The field the blocks leave: outlines only (one path), so the origin stays readable.
  const outlines: Array<readonly [number, number]> = [];
  for (let j = 0; j < data.blocks; j += 1) {
    outlines.push([geo.fieldX + (j % geo.cols) * geo.fieldCell + 0.5, geo.fieldY + Math.floor(j / geo.cols) * geo.fieldCell + 0.5]);
  }
  let outlineD = "";
  const edge = geo.fieldS - 1;
  for (const [x, y] of outlines) outlineD += `M${r2(x)} ${r2(y)}h${edge}v${edge}h${-edge}z`;
  if (geo.showField) nodes.push(el("g", { "data-layer": "field", opacity: o }, el("path", { d: outlineD, fill: "none", stroke: pal.track, strokeWidth: 1 })));

  const slotPos = (asg: { bin: number[]; slot: number[] }, j: number): readonly [number, number] => {
    const b = asg.bin[j] ?? 0;
    const sl = asg.slot[j] ?? 0;
    const x = (geo.binX[b] ?? 0) + (sl % geo.bcols) * geo.cell;
    if (geo.layout === "rows") return [x, (geo.blockTop[b] ?? 0) + Math.floor(sl / geo.bcols) * geo.cell];
    const y = (geo.binBase[b] ?? 0) - (Math.floor(sl / geo.bcols) + 1) * geo.cell;
    return [x, y];
  };

  // Blocks at rest (in the field, or landed in a bin) are batched into one path per place and colour;
  // only the few that are moving this frame are elements of their own. Every block is clamped to the stage box.
  const inField: Array<readonly [number, number]> = [];
  const landed = data.bins.map(() => [] as Array<readonly [number, number]>);
  const moving: SvgNode[] = [];
  const minX = geo.clip.x;
  const maxX = geo.clip.x + geo.clip.w - geo.s;
  const minY = geo.clip.y;
  const maxY = geo.clip.y + geo.clip.h - geo.s;
  let movedRank = 0;
  for (let j = 0; j < data.blocks; j += 1) {
    const [tx, ty] = slotPos(asgTo, j);
    const [fx, fy] = slotPos(asgFrom, j);
    const bi = asgTo.bin[j] ?? 0;
    const slot = asgTo.slot[j] ?? 0;
    // The phone drops every block straight down from the stage's top edge (the clip hides the way in).
    const origin: readonly [number, number] = geo.showField
      ? [geo.fieldX + (j % geo.cols) * geo.fieldCell, geo.fieldY + Math.floor(j / geo.cols) * geo.fieldCell]
      : [tx, ty - 34];
    const enter = (j / data.blocks) * 0.07;
    const start = ENTRY.first + bi * ENTRY.perBin + slot * ENTRY.perSlot;
    const bin = data.bins[bi];
    const binId = bin?.id ?? "";
    if (shift >= 1) {
      if (p <= enter) continue;
      const dropping = geo.showField && p < enter + 0.06 && p < start;
      const falling = p > start && p < start + ENTRY.fall;
      if (!dropping && !falling) {
        if (p <= start) {
          if (geo.showField) inField.push(origin);
        } else landed[bi]?.push([tx, ty]);
        continue;
      }
    }
    let cx: number;
    let cy: number;
    let appear = 1;
    if (shift < 1) {
      // A definition change: only the blocks that change bin travel; first sideways, then down, one after the other.
      const travels = fx !== tx || fy !== ty;
      if (!travels) {
        landed[asgTo.bin[j] ?? 0]?.push([tx, ty]);
        continue;
      }
      const delay = Math.min(0.4, movedRank * 0.025);
      movedRank += 1;
      const local = Math.max(0, Math.min(1, (shift - delay) / (1 - delay)));
      const lx = settleIn(local, 0, 0.7);
      const ly = settleIn(local, 0.3, 1);
      cx = fx + (tx - fx) * lx;
      cy = fy + (ty - fy) * ly;
    } else {
      const fall = fallEase(segment(p, start, start + ENTRY.fall));
      const drop = geo.showField ? springIn(p, enter, enter + 0.06, "med") : 1;
      if (!geo.showField) appear = Math.min(1, fall * 4);
      cx = origin[0] + (tx - origin[0]) * fall;
      cy = origin[1] + (ty - origin[1]) * fall - (geo.showField ? (1 - drop) * 26 * (p < start ? 1 : 0) : 0);
    }
    cx = Math.max(minX, Math.min(maxX, cx));
    cy = geo.showField ? cy : Math.max(minY - 40, Math.min(maxY, cy));
    const tone = bin && bin.id === data.finding ? "accent" : (bin?.tone ?? "ink");
    const departed = p > start || shift < 1;
    const paint = toneFill(pal, departed ? tone : "ink");
    moving.push(
      el("rect", {
        key: `b${j}`,
        "data-id": binId,
        x: tx,
        y: ty,
        width: geo.s,
        height: geo.s,
        fill: flip(ctx, binId, paint.fill),
        opacity: op(dim(ctx, binId) * appear),
        transform: translate(cx - tx, cy - ty),
      }),
    );
  }
  const blockNodes: SvgNode[] = [];
  if (inField.length > 0) {
    blockNodes.push(el("path", { key: "field-blocks", d: squaresPath(inField, geo.fieldS), fill: pal.ink }));
  }
  landed.forEach((list, bi) => {
    const bin = data.bins[bi];
    if (!bin || list.length === 0) return;
    const tone = bin.id === data.finding ? "accent" : (bin.tone ?? "ink");
    blockNodes.push(
      el("path", { key: `landed-${bin.id}`, "data-id": bin.id, d: squaresPath(list, geo.s), fill: flip(ctx, bin.id, toneFill(pal, tone).fill), opacity: op(dim(ctx, bin.id)) }),
    );
  });
  // In a stage the blocks are clipped to the stage box; print and the standalone SVG need no clip (nothing leaves the box there).
  const clipId = `${ctx.idBase}-blocks-clip`;
  const clipped = !geo.showField && ctx.opts.height !== undefined;
  if (clipped) {
    nodes.push(el("clipPath", { key: "clip", id: clipId }, el("rect", { x: geo.clip.x, y: geo.clip.y, width: geo.clip.w, height: geo.clip.h })));
  }
  nodes.push(el("g", { "data-layer": "blocks", clipPath: clipped ? `url(#${clipId})` : undefined }, ...blockNodes, ...moving));

  if (geo.layout === "rows") {
    // One row per bin: name on the left, count on the right, a hairline under the row. Names and rules are
    // there from the first frame; the count arrives with the blocks.
    data.bins.forEach((b, i) => {
      const top0 = geo.rowTop[i] ?? 0;
      const h = geo.rowH[i] ?? 20;
      const lines = geo.names[i] ?? [tr(lang, b.label)];
      const count = to.counts[b.id] ?? 0;
      const isFinding = b.id === data.finding;
      const mid = top0 + h / 2;
      const first = mid - ((lines.length - 1) * 15) / 2 + geo.labelSize * 0.36;
      nodes.push(
        el("g", { key: `l${b.id}`, "data-label": b.id },
          el("line", { x1: HM, y1: top0 + h + ROW_GAP / 2, x2: ctx.width - HM, y2: top0 + h + ROW_GAP / 2, stroke: isFinding ? pal.accent : pal.track, strokeWidth: isFinding ? 1.6 : 1 }),
          textLines(HM, first, lines, 15, { size: geo.labelSize, weight: isFinding ? 700 : 600, fill: isFinding ? pal.accent : pal.ink, extra: { [ROLE_ATTR]: "label" } }),
          el("g", { opacity: op(settleIn(p, 0.02 + i * 0.03, 0.18 + i * 0.05)) },
            roleText("value", ctx.width - HM, mid + (FS.value + 2) * 0.36, formatDecimal(count, 0, false, lang), { size: FS.value + 2, weight: 700, fill: isFinding ? pal.accent : pal.ink, anchor: "end" }),
          ),
        ),
      );
    });
  } else {
    // Labels sit under each stack: the bin name and the line are there from the first frame (all bins
    // are readable before anything falls); the exact count arrives with the blocks.
    const maxNameLines = Math.max(1, ...geo.names.map((q) => q.length));
    data.bins.forEach((b, i) => {
      const x = geo.binX[i] ?? 0;
      const base = geo.binBase[i] ?? 0;
      const count = to.counts[b.id] ?? 0;
      const isFinding = b.id === data.finding;
      nodes.push(
        el("g", { key: `l${b.id}`, "data-label": b.id },
          el("line", { x1: x, y1: base + 2, x2: x + geo.binW, y2: base + 2, stroke: isFinding ? pal.accent : pal.ink, strokeWidth: 1.6 }),
          textLines(x, base + 18, geo.names[i] ?? [tr(lang, b.label)], 15, { size: geo.labelSize, weight: isFinding ? 700 : 600, fill: isFinding ? pal.accent : pal.ink, extra: { [ROLE_ATTR]: "label" } }),
          el("g", { opacity: op(settleIn(p, 0.02 + i * 0.03, 0.18 + i * 0.05)) },
            roleText("value", x, base + 18 + 15 * (maxNameLines - 1) + 17, formatDecimal(count, 0, false, lang), { size: FS.value + 2, weight: 700, fill: isFinding ? pal.accent : pal.ink }),
          ),
          count === 0 ? el("rect", { x: x + 0.5, y: base - geo.cell + 0.5, width: geo.s - 1, height: geo.s - 1, fill: "none", stroke: isFinding ? pal.accent : pal.ink, strokeWidth: 1 }) : null,
        ),
      );
    });

  }

  const unit = unitLine(data.total, data.blocks, data.unit, "Block");
  const unitY = geo.bottom + 4;
  nodes.push(unitNode(ctx, HM, unitY + 12, unit));
  const natural = ctx.opts.bare ? geo.bottom + 4 : unitY + 28;
  // In a stage the figure fills the box it is given (content centred), never less than its content.
  const filled = geo.showField ? natural : Math.max(natural, ctx.opts.height ?? 0);
  return frame({ ctx, height: filled, children: nodes });
}

export { geometry as blocksGeometry };
