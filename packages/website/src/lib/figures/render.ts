/**
 * renderFigure(spec, progress): the one entry point. A figure is a pure
 * function of its spec and a progress from 0 to 1. Scroll, slider, autoplay
 * and print all call it; reduced motion, no JS and the PDF call it with 1.
 */

import type { ReactElement } from "react";
import { clamp, hashSeed } from "./math.ts";
import { PALETTES } from "./palette.ts";
import { makeFocus, type Ctx } from "./svg.ts";
import type { FigureSpec, RenderOptions } from "./types.ts";
import { renderBars } from "./kinds/bars.ts";
import { renderDotplot } from "./kinds/dotplot.ts";
import { renderDumbbell } from "./kinds/dumbbell.ts";
import { renderFunnel } from "./kinds/funnel.ts";
import { renderIceberg } from "./kinds/iceberg.ts";
import { renderLadder } from "./kinds/ladder.ts";
import { renderLorenz } from "./kinds/lorenz.ts";
import { renderTilemap } from "./kinds/tilemap.ts";
import { renderTimeline } from "./kinds/timeline.ts";
import { renderWaffle } from "./kinds/waffle.ts";
import { renderWaterfall } from "./kinds/waterfall.ts";

export const DEFAULT_WIDTH = 560;
export const MIN_WIDTH = 280;
/** Below this width the layouts switch to the phone variant. */
export const COMPACT_BELOW = 480;

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function context<D>(spec: FigureSpec, data: D, progress: number, options: RenderOptions): Ctx<D> {
  const width = Math.max(MIN_WIDTH, options.width ?? DEFAULT_WIDTH);
  const p = Number.isFinite(progress) ? clamp(progress) : 1;
  const idBase = `fig-${sanitizeId(spec.id)}`;
  return {
    spec,
    data,
    p,
    width,
    compact: width < COMPACT_BELOW,
    pal: PALETTES[options.theme ?? "web"],
    opts: options,
    idBase,
    hatchId: `${idBase}-hatch`,
    seed: spec.seed ?? hashSeed(spec.id),
    focus: makeFocus(spec, p),
  };
}

export function renderFigure(
  spec: FigureSpec,
  progress = 1,
  options: RenderOptions = {},
): ReactElement {
  switch (spec.kind) {
    case "waffle": return renderWaffle(context(spec, spec.data, progress, options));
    case "bars": return renderBars(context(spec, spec.data, progress, options));
    case "dotplot": return renderDotplot(context(spec, spec.data, progress, options));
    case "tilemap": return renderTilemap(context(spec, spec.data, progress, options));
    case "funnel": return renderFunnel(context(spec, spec.data, progress, options));
    case "dumbbell": return renderDumbbell(context(spec, spec.data, progress, options));
    case "lorenz": return renderLorenz(context(spec, spec.data, progress, options));
    case "waterfall": return renderWaterfall(context(spec, spec.data, progress, options));
    case "ladder": return renderLadder(context(spec, spec.data, progress, options));
    case "timeline": return renderTimeline(context(spec, spec.data, progress, options));
    case "iceberg": return renderIceberg(context(spec, spec.data, progress, options));
  }
}
