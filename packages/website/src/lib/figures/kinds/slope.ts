/**
 * Slope (H06): rank-to-rank lines between two random halves of the same
 * items. The top group of half A slides down onto the chance band in half B.
 * Items are opaque ranks; no per-item value is in the data or on screen. The
 * reader can switch between baked random splits.
 */

import type { ReactElement } from "react";
import { formatDecimal, formatInterval } from "../format.ts";
import { HM, ROLE_ATTR, flexible, heroHeader, pickVariant, roleText, squaresPath } from "../hero.ts";
import { r2 } from "../math.ts";
import { between, settleIn, springIn } from "../motion.ts";
import { FS, dim, el, frame, op, textLines, wrapText, type Ctx, type SvgNode } from "../svg.ts";
import { langOf, strings, tr } from "../i18n.ts";
import { frameReveal } from "../timing.ts";
import type { SlopeData, SlopeSplit } from "../types.ts";

const numeralOf = (data: SlopeData, v: number, lang: "de" | "en" = "de"): string => `${formatDecimal(v, data.fmt.digits ?? 2, false, lang)}${data.fmt.unit ?? ""}`;

export function renderSlope(ctx: Ctx<SlopeData>): ReactElement {
  const { data, pal, p, width, compact } = ctx;
  const lang = langOf(ctx.spec);
  const T = strings(lang);
  const named = ctx.opts.variant !== undefined;
  const { to, from, shift } = pickVariant(ctx, data.splits as ReadonlyArray<SlopeSplit>, data.defaultVariant);
  // The big numeral is always the pooled value over all splits; the columns show one example split in a quieter tone.
  const top = data.pooled;
  const ease = shift >= 1 ? 1 : springIn(shift, 0, 1, "stiff");
  const slide = settleIn(p, 0.42, 0.86);
  const value = between(top.a, top.b, slide);
  // In a stage (bare) the example split's numbers hand over once the lines start to move: the one numeral
  // above counts 2,07 down to 1,01 alone, and only the chance band keeps a label. Print keeps every number.
  const quiet = ctx.opts.bare ? 1 - settleIn(p, 0.4, 0.5) : 1;
  const head = heroHeader(ctx, { numeral: numeralOf(data, value, lang), claim: data.claim, accent: true });
  const nodes: SvgNode[] = [...head.nodes];

  const gap = compact ? 150 : 260;
  const cx = width / 2;
  const xa = cx - gap / 2;
  const xb = cx + gap / 2;
  const n = data.items;
  const colTop = head.bottom + 54;
  const sp = flexible(ctx, colTop, 44 + 24 + (ctx.opts.bare ? 0 : 34), n * (compact ? 2.3 : 2.9), n * 1.4) / n;
  const yA = (i: number): number => colTop + i * sp;
  const yB = (rank1: number): number => colTop + (rank1 - 1) * sp;
  const o = op(frameReveal(p));

  // Column heads: the half, then the pooled multiple of the overall rate.
  const topA = data.pooled.a;
  const topB = data.pooled.b;
  nodes.push(
    roleText("label", xa, head.bottom + 14, tr(lang, data.aLabel), { size: FS.label, weight: 700, fill: pal.ink, anchor: "middle", opacity: o }),
    roleText("label", xb, head.bottom + 14, tr(lang, data.bLabel), { size: FS.label, weight: 700, fill: pal.ink, anchor: "middle", opacity: o }),
    roleText("value", xa, head.bottom + 38, numeralOf(data, named ? to.top.a : topA, lang), { size: FS.strong, weight: 800, fill: named ? pal.mutedLight : pal.accent, anchor: "middle", opacity: op(settleIn(p, 0.3, 0.45) * quiet) }),
    roleText("value", xb, head.bottom + 38, numeralOf(data, named ? to.top.b : topB, lang), { size: FS.strong, weight: 800, fill: named ? pal.mutedLight : pal.accent, anchor: "middle", opacity: ctx.opts.bare ? 0 : op(settleIn(p, 0.8, 0.95)) }),
  );
  // The columns show one example split; the big numeral above and the readout carry the pooled value. Say which is which.
  if (named) {
    nodes.push(roleText("label", cx, head.bottom + 38, T.exampleOf(tr(lang, to.label)), { size: FS.small, weight: 600, fill: pal.mutedLight, anchor: "middle", opacity: op(settleIn(p, 0.3, 0.45) * quiet) }));
  }

  // Chance band in half B: where a random group of this size lands.
  const bandY0 = yB(data.chance.lo);
  const bandY1 = yB(data.chance.hi);
  nodes.push(
    el("g", { "data-layer": "chance", opacity: op(settleIn(p, 0.1, 0.3)) },
      el("rect", { x: xb - 10, y: bandY0, width: compact ? 70 : 120, height: Math.max(2, bandY1 - bandY0), fill: pal.inset }),
      el("line", { x1: xb - 10, y1: yB(data.chance.mean), x2: xb + (compact ? 60 : 110), y2: yB(data.chance.mean), stroke: pal.ink, strokeWidth: 1.6 }),
      roleText("label", xb + (compact ? 16 : 26), bandY0 - 6, T.chance, { size: FS.small, weight: 700, fill: pal.ink }),
    ),
  );

  // Hairlines for everyone, rails of dots, and the followed group in the accent.
  const rankFor = (split: SlopeSplit, i: number): number => split.rankB[i] ?? i + 1;
  const endY = (i: number): number => {
    const target = rankFor(to, i);
    const origin = shift < 1 ? rankFor(from, i) : target;
    const rank = shift < 1 ? origin + (target - origin) * ease : target;
    const settled = yB(rank);
    return yA(i) + (settled - yA(i)) * slide;
  };
  let others = "";
  const leftDots: Array<readonly [number, number]> = [];
  const rightDots: Array<readonly [number, number]> = [];
  for (let i = data.top; i < n; i += 1) {
    const y2 = endY(i);
    others += `M${r2(xa)} ${r2(yA(i))}L${r2(xb)} ${r2(y2)}`;
    leftDots.push([xa - 1.2, yA(i) - 1.2]);
    rightDots.push([xb - 1.2, y2 - 1.2]);
  }
  nodes.push(
    el("g", { "data-layer": "others", opacity: op(settleIn(p, 0.02, 0.2)) },
      el("path", { d: others, fill: "none", stroke: pal.edge, strokeWidth: compact ? 0.7 : 0.9 }),
      el("path", { d: squaresPath(leftDots, 2.4) + squaresPath(rightDots, 2.4), fill: pal.ink }),
    ),
  );
  const topLines: SvgNode[] = [];
  const mark = settleIn(p, 0.2, 0.4);
  for (let i = 0; i < data.top; i += 1) {
    const y2 = endY(i);
    topLines.push(
      el("line", { key: `t${i}`, "data-id": `top${i + 1}`, x1: xa, y1: yA(i), x2: xb, y2, stroke: pal.accent, strokeWidth: compact ? 1.6 : 2, opacity: op(dim(ctx, `top${i + 1}`)) }),
      el("rect", { key: `ta${i}`, x: xa - 3, y: yA(i) - 3, width: 6, height: 6, fill: pal.accent }),
      el("rect", { key: `tb${i}`, x: xb - 3, y: y2 - 3, width: 6, height: 6, fill: pal.accent }),
    );
  }
  nodes.push(el("g", { "data-layer": "top", opacity: op(mark) }, ...topLines));

  const bottom = colTop + n * sp + 18;
  const pooledIv = data.pooled.lo !== undefined && data.pooled.hi !== undefined ? ` (${formatInterval(data.fmt, data.pooled.lo, data.pooled.hi, lang)})` : "";
  const pooledLine = T.allSplits(data.splits.length, numeralOf(data, data.pooled.a, lang), numeralOf(data, data.pooled.b, lang), pooledIv);
  const readout =
    to.top.lo !== undefined && to.top.hi !== undefined && named
      ? `${tr(lang, to.label)}: ${numeralOf(data, to.top.a, lang)} / ${numeralOf(data, to.top.b, lang)}. ${pooledLine}.`
      : data.pooled.lo !== undefined && data.pooled.hi !== undefined
        ? T.secondHalf(numeralOf(data, data.pooled.b, lang), ` (${T.interval95} ${formatInterval(data.fmt, data.pooled.lo, data.pooled.hi, lang)})`)
        : "";
  const lines = readout ? wrapText(readout, width - HM * 2, FS.small, 2) : [];
  if (lines.length > 0) {
    nodes.push(textLines(HM, bottom + 14, lines, 15, { size: FS.small, fill: pal.mutedLight, opacity: op(settleIn(p, 0.88, 1)), extra: { [ROLE_ATTR]: "unit" } }));
  }
  return frame({ ctx, height: bottom + (lines.length > 0 ? 18 + lines.length * 15 : 10), children: nodes });
}
