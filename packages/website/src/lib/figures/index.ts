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
export { quantityFor, resolveToken, resolveTokens, resolveTokensDeep, tokenKeys, hasToken, TokenError, TOKEN_PATTERN } from "./tokens.ts";
export type { Quantity, SpecLookup, TokenLocale } from "./tokens.ts";
export { TILE_LAYOUT } from "./kinds/tilemap.ts";
export { crit, settle, settleIn, springIn, staggerStart, seededOrder, between, shiftEase, SPRING_SECONDS } from "./motion.ts";
export { largestRemainder, allocateSquares, unitLine, unitPlural } from "./units.ts";
export { stageWords, ROLE_ATTR, HM } from "./hero.ts";
export type { TextRole } from "./hero.ts";
export { compileFeld, createFrameBuffer, frame as feldFrame, sceneAt, sceneSettled, FELD_CAPACITY, STRIDE as FELD_STRIDE, F as FELD_FIELDS, INK_CLASS } from "./feld/index.ts";
export type { FeldModel, FeldViewport, FrameInfo, SceneLabel, SceneModel } from "./feld/index.ts";
export { blocksPerBin, blockAssignment } from "./kinds/blocks.ts";
export { networkEdgeCounts } from "./kinds/network.ts";
export { stripValue } from "./kinds/strip.ts";
export { drawsPerSquare } from "./kinds/nulldist.ts";
export { penRuns } from "./kinds/curve.ts";
export { modelFor as feldModelFor, fieldHeight, fieldNumeralText, toneColour as feldToneColour } from "./kinds/field.ts";
export { FIELD_MAX_SQUARES } from "./limits.ts";
export { CLAIM_MAX_WORDS } from "./validate-hero.ts";
export type { TilePlace } from "./kinds/tilemap.ts";
export { detentsOf, defaultDetentOf, controlKindOf, controlLabelOf, readoutOf, pinItemsOf, fieldClassItems, fieldClassDetail } from "./readout.ts";
export type { ControlKind, Detent, PinItem } from "./readout.ts";
