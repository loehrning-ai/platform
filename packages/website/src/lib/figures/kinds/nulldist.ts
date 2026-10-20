/**
 * Nulldist (H12): a seeded stacked-square histogram of randomisation draws
 * (what chance alone gives), the observed value landing outside the grey
 * stack, and below it a strip of the other words as observed divided by
 * expected. A control with real detents (205, 100, 50 firms) swaps the
 * histogram for the baked one; the band widens as the group shrinks.
 */

import type { ReactElement } from "react";
import { formatDecimal, formatInterval, formatValue } from "../format.ts";
import { HM, flexible, flip, heroHeader, partialsPath, pickVariant, roleText, squaresPath } from "../hero.ts";
import { hashSeed, mulberry32, niceTicks, scaleLinear } from "../math.ts";
import { settleIn, springIn } from "../motion.ts";
import { FS, dim, el, frame, op, textWidth, translate, type Ctx, type SvgNode } from "../svg.ts";
import { langOf, strings, tr } from "../i18n.ts";
import { frameReveal } from "../timing.ts";
import type { NullVariant, NulldistData } from "../types.ts";

/** Space kept free under the axis ticks, so the control row never covers them. */
const AXIS_INSET = 20;
const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

/** Draws per square: the smallest round number that keeps the tallest stack within `rows` squares. */
export function drawsPerSquare(data: NulldistData, rows: number): number {
  const peak = Math.max(...data.variants.flatMap((v) => v.bins.map((b) => b.draws)));
  return NICE.find((q) => peak / q <= rows) ?? Math.ceil(peak / rows);
}

interface Square {
  readonly bin: number;
  readonly level: number;
  readonly x: number;
  readonly y: number;
  /** 1 for a whole square, less for the partial square on top. */
  readonly fill: number;
}

export function renderNulldist(ctx: Ctx<NulldistData>): ReactElement {
  const { data, pal, p, width, compact } = ctx;
  const lang = langOf(ctx.spec);
  const T = strings(lang);
  const { to, from, shift } = pickVariant(ctx, data.variants as ReadonlyArray<NullVariant>, data.defaultVariant);
  const focus = data.words.find((w) => w.id === data.focusWord) ?? data.words[0];
  const head = heroHeader(ctx, {
    numeral: focus ? `${formatDecimal(focus.ratio, 1, false, lang)}x` : undefined,
    claim: data.claim,
    accent: true,
    drop: [0.5, 0.66],
  });
  const nodes: SvgNode[] = [...head.nodes];

  const allBins = data.variants.flatMap((v) => v.bins);
  const lo = Math.min(...allBins.map((b) => b.lo), data.observed.lo ?? data.observed.value, data.observed.value);
  const hi = Math.max(...allBins.map((b) => b.hi), data.observed.hi ?? data.observed.value, data.observed.value);
  const plot = { x: HM + 4, w: width - HM * 2 - 8, y: head.bottom + 36, h: 0 };
  const axis = scaleLinear([lo, hi], [plot.x, plot.x + plot.w]);
  const ticks = niceTicks(lo, hi, compact ? 4 : 6).filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9);
  // Squares as wide as the narrowest bin, so neighbours never overlap.
  const binPx = Math.min(...allBins.map((b) => axis(b.hi) - axis(b.lo)));
  const cell = Math.max(6, binPx);
  const side = Math.max(5, cell - (cell >= 12 ? 2 : 1.4));
  // About 35 % of a pinned stage is histogram; the axis labels keep 20 px of their own under the axis.
  const boxH = ctx.opts.height;
  const natural = boxH === undefined ? (compact ? 190 : 250) : Math.max(110, boxH * 0.35);
  const maxH = flexible(ctx, plot.y, 66 + 22 + data.words.length * 26 + 40 + AXIS_INSET, natural, 80);
  const rowsMax = Math.max(6, Math.min(compact ? 30 : 36, Math.floor(maxH / cell)));
  const per = drawsPerSquare(data, rowsMax);
  plot.h = rowsMax * cell;
  const baseY = plot.y + plot.h;
  const seed = ctx.seed;

  const stack = (v: NullVariant): Square[] => {
    const out: Square[] = [];
    v.bins.forEach((b, bi) => {
      const exact = b.draws / per;
      const whole = Math.floor(exact + 1e-9);
      const part = exact - whole;
      const cx = axis((b.lo + b.hi) / 2);
      for (let l = 0; l < whole; l += 1) out.push({ bin: bi, level: l, x: cx - side / 2, y: baseY - (l + 1) * cell + (cell - side), fill: 1 });
      if (part > 0.05) out.push({ bin: bi, level: whole, x: cx - side / 2, y: baseY - (whole + 1) * cell + (cell - side), fill: Math.round(part * 100) / 100 });
    });
    return out;
  };

  const o = op(frameReveal(p));
  const ease = shift >= 1 ? 1 : springIn(shift, 0, 1, "stiff");
  const bandNow = {
    lo: from.band.lo + (to.band.lo - from.band.lo) * ease,
    hi: from.band.hi + (to.band.hi - from.band.hi) * ease,
  };
  const bx0 = axis(bandNow.lo);
  const bx1 = axis(bandNow.hi);
  nodes.push(
    el("g", { "data-layer": "band", opacity: o },
      el("rect", { x: bx0, y: plot.y - 6, width: bx1 - bx0, height: plot.h + 6, fill: pal.inset }),
      el("line", { x1: bx0, y1: plot.y - 6, x2: bx0, y2: baseY, stroke: pal.ink, strokeWidth: 1 }),
      el("line", { x1: bx1, y1: plot.y - 6, x2: bx1, y2: baseY, stroke: pal.ink, strokeWidth: 1 }),
    ),
  );
  nodes.push(roleText("label", (bx0 + bx1) / 2, plot.y - 12, T.chanceBand, { size: FS.small, weight: 700, fill: pal.ink, anchor: "middle", opacity: o }));

  // Squares: seeded settle on entry; on a control change the old stack drains and the new one pours.
  const draw = (v: NullVariant, mode: "enter" | "drain" | "pour"): SvgNode => {
    const squares = stack(v);
    const whole: Array<readonly [number, number]> = [];
    const parts: Array<readonly [number, number, number, number]> = [];
    const rand = mulberry32((hashSeed(`${ctx.spec.id}:${v.id}`) ^ seed) >>> 0);
    const rise = plot.h + 30;
    squares.forEach((q) => {
      const jitter = rand();
      const start = 0.02 + (q.bin / Math.max(1, binCountOf(data))) * 0.18 + jitter * 0.12 + q.level * 0.003;
      let off: number;
      if (mode === "enter") {
        if (p <= start) return;
        off = -(1 - springIn(p, start, start + 0.2, "med")) * rise;
      } else if (mode === "drain") {
        off = springIn(shift, 0, 0.55, "soft") * (rise + 20);
      } else {
        off = -(1 - springIn(shift, 0.3 + jitter * 0.2, 1, "med")) * rise;
      }
      if (q.fill >= 1) whole.push([q.x, q.y + off]);
      else parts.push([q.x, q.y + off, side, q.fill]);
    });
    return el("g", { key: `${mode}${v.id}`, "data-layer": `draws-${mode}` },
      el("path", { d: squaresPath(whole, side), fill: pal.edge }),
      parts.length > 0 ? el("path", { d: partialsPath(parts), fill: pal.edge }) : null,
    );
  };
  if (shift < 1) {
    nodes.push(draw(from, "drain"));
    nodes.push(draw(to, "pour"));
  } else {
    nodes.push(draw(to, "enter"));
  }

  // Axis with ticks and unit.
  nodes.push(el("line", { x1: plot.x, y1: baseY + 1, x2: plot.x + plot.w, y2: baseY + 1, stroke: pal.ink, strokeWidth: 1.6, opacity: o }));
  const unit = data.fmt.style === "percent" ? "\u00a0%" : data.fmt.unit ? `\u00a0${data.fmt.unit}` : "";
  const tickText = (t: number): string => `${formatDecimal(t, Number.isInteger(t) ? 0 : 1, false, lang)}${unit}`;
  ticks.forEach((t, i) => {
    const x = axis(t);
    const last = i === ticks.length - 1;
    nodes.push(
      el("line", { key: `t${i}`, x1: x, y1: baseY + 1, x2: x, y2: baseY + 6, stroke: pal.ink, strokeWidth: 1, opacity: o }),
      roleText("tick", x, baseY + 22, tickText(t), { size: FS.small, fill: pal.mutedLight, anchor: last ? "end" : i === 0 ? "start" : "middle", opacity: o }),
    );
  });

  // The observed value: one accent square lands outside the grey stack, on its interval.
  const ox = axis(data.observed.value);
  const land = springIn(p, 0.5, 0.66, "snap");
  const oy = baseY - cell / 2 - 2;
  const labelOpacity = op(settleIn(p, 0.62, 0.76));
  nodes.push(
    el("g", { "data-layer": "observed", opacity: p < 0.5 ? 0 : undefined, transform: translate(0, -(1 - land) * (plot.h + 20)) },
      data.observed.lo !== undefined && data.observed.hi !== undefined
        ? el("line", { x1: axis(data.observed.lo), y1: oy, x2: axis(data.observed.hi), y2: oy, stroke: pal.accent, strokeWidth: 2.5 })
        : null,
      data.observed.lo !== undefined && data.observed.hi !== undefined
        ? el("line", { x1: axis(data.observed.lo), y1: oy - 6, x2: axis(data.observed.lo), y2: oy + 6, stroke: pal.accent, strokeWidth: 1.6 })
        : null,
      data.observed.lo !== undefined && data.observed.hi !== undefined
        ? el("line", { x1: axis(data.observed.hi), y1: oy - 6, x2: axis(data.observed.hi), y2: oy + 6, stroke: pal.accent, strokeWidth: 1.6 })
        : null,
      el("rect", { "data-id": "observed", x: ox - 7, y: oy - 7, width: 14, height: 14, fill: flip(ctx, "observed", pal.accent) }),
    ),
  );
  const valueText = formatValue(data.fmt, data.observed.value, false, lang);
  const observedLabel = tr(lang, data.observed.label);
  const labelW = Math.max(textWidth(observedLabel, FS.label, 700), textWidth(valueText, FS.value, 700));
  const lx0 = Math.min(plot.x + plot.w - labelW / 2, Math.max(bx1 + labelW / 2 + 6, ox));
  const lx = lx0;
  // Leader from the label to the marker, and a column that drops with it: the number has an anchor.
  nodes.push(
    el("g", { "data-layer": "observed-anchor", opacity: labelOpacity },
      el("line", { x1: ox, y1: oy - 24, x2: ox, y2: oy - 8, stroke: pal.accent, strokeWidth: 1.6 }),
      lx0 !== ox ? el("line", { x1: Math.min(lx0, ox), y1: oy - 24, x2: Math.max(lx0, ox), y2: oy - 24, stroke: pal.accent, strokeWidth: 1.6 }) : null,
    ),
  );
  nodes.push(
    roleText("value", lx, oy - 44, valueText, { size: FS.value, weight: 700, fill: pal.accent, anchor: "middle", opacity: labelOpacity }),
    roleText("label", lx, oy - 28, observedLabel, { size: FS.label, weight: 700, fill: pal.accent, anchor: "middle", opacity: labelOpacity }),
  );

  // The words: observed divided by expected, one line, with the 1,0 line.
  const y = baseY + 66;
  const words = data.words;
  const maxRatio = Math.max(...words.map((w) => w.hi ?? w.ratio), 1.2);
  const labelCol = Math.max(...words.map((w) => textWidth(tr(lang, w.label), FS.label, 600))) + 12;
  const wx0 = HM + labelCol;
  const wx1 = width - HM - 40;
  const wAxis = scaleLinear([0, Math.ceil(maxRatio * 2) / 2], [wx0, wx1]);
  const rowH = 26;
  nodes.push(
    roleText("tick", HM, y - 26, T.factorVsChance, { size: FS.small, weight: 700, fill: pal.ink, anchor: "start", opacity: op(settleIn(p, 0.66, 0.8)) }),
    el("line", { x1: wAxis(1), y1: y - 6, x2: wAxis(1), y2: y + words.length * rowH - 4, stroke: pal.ink, strokeWidth: 1.6, opacity: op(settleIn(p, 0.66, 0.8)) }),
    roleText("tick", wAxis(1) + 6, y - 10, `${T.expected} ${formatDecimal(1, 1, false, lang)}`, { size: FS.small, fill: pal.ink, anchor: "start", opacity: op(settleIn(p, 0.66, 0.8)) }),
  );
  words.forEach((w, i) => {
    const start = 0.62 + i * 0.04;
    const t = springIn(p, start, start + 0.22, "med");
    const isFocus = w.id === focus?.id;
    const wy = y + i * rowH + 8;
    const x = wAxis(w.ratio);
    const shown = p > start ? undefined : 0;
    nodes.push(
      roleText("label", HM, wy + 5, tr(lang, w.label), { size: FS.label, weight: isFocus ? 700 : 400, fill: pal.ink, opacity: op(settleIn(p, start - 0.02, start + 0.12)) }),
      w.lo !== undefined && w.hi !== undefined
        ? el("line", { key: `wi${w.id}`, x1: wAxis(w.lo), y1: wy, x2: wAxis(w.hi), y2: wy, stroke: isFocus ? pal.accent : pal.ink, strokeWidth: 2, opacity: shown })
        : null,
      el("rect", { key: `wm${w.id}`, "data-id": w.id, x: x - 5, y: wy - 5, width: 10, height: 10, fill: flip(ctx, w.id, isFocus ? pal.accent : pal.ink), opacity: shown === 0 ? 0 : op(dim(ctx, w.id)), transform: translate((1 - t) * (wAxis(0) - x) * 0.5, 0) }),
      roleText("value", width - HM, wy + 5, formatDecimal(w.ratio, 1, false, lang), { size: FS.value, weight: 700, fill: isFocus ? pal.accent : pal.ink, anchor: "end", opacity: op(settleIn(p, start + 0.06, start + 0.2)) }),
    );
  });
  const bottom = y + words.length * rowH + 10;
  if (!ctx.opts.bare) {
    nodes.push(roleText("unit", HM, bottom + 8, T.square(formatDecimal(per, 0, false, lang), formatDecimal(data.draws, 0, false, lang)), { size: FS.small, fill: pal.mutedLight, opacity: op(settleIn(p, 0.9, 1)) }));
  }
  void formatInterval;
  return frame({ ctx, height: ctx.opts.bare ? bottom + 4 : bottom + 26, children: nodes });
}

function binCountOf(data: NulldistData): number {
  return Math.max(...data.variants.map((v) => v.bins.length));
}
