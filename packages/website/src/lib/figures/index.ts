/**
 * Figure engine for the interactive book.
 *
 *   renderFigure(spec, progress, options) -> React SVG element tree (pure, server-renderable)
 *
 * progress runs 0 to 1. Scroll, a slider and autoplay feed it a moving value;
 * reduced motion, no JS and the PDF call it with 1 (the finished chart, no
 * transforms, no opacity, no dash tricks). Movement is written as transform,
 * opacity and stroke-dashoffset only. Stepped figures expose stepProgress() and
 * activeStep() so a sticky stage can jump to step k with renderFigure(spec,
 * stepProgress(spec, k)). Elements that a reader can point at carry data-id
 * (waffle dots carry data-group); pass options.highlight to dim the rest.
 *
 * Not in this module on purpose: react-dom/server (see export.ts, used by
 * scripts/render-figures.mjs) and any client code. The islands (T6, T7) own
 * hover, pins, sorting and the C13 and C14 inputs.
 */

export * from "./types.ts";
export { renderFigure, DEFAULT_WIDTH, MIN_WIDTH, COMPACT_BELOW } from "./render.ts";
export * from "./math.ts";
export * from "./format.ts";
export { PALETTES, FONT_STACK, contrastRatio, mixHex, readableOn, rampColor, rampClassColor, RAMP_CLASSES, accentTint } from "./palette.ts";
export type { Palette } from "./palette.ts";
export { segment, revealWindow, reveal, frameReveal, stepCount, stepProgress, activeStep, focusIds } from "./timing.ts";
export { figureTable, figureCsv } from "./data.ts";
export type { FigureTable, Cell } from "./data.ts";
export { parseFigureSpec, findPrivacyFindings, FigureSpecError } from "./validate.ts";
export type { PrivacyFinding } from "./validate.ts";
export { TILE_LAYOUT } from "./kinds/tilemap.ts";
export type { TilePlace } from "./kinds/tilemap.ts";
