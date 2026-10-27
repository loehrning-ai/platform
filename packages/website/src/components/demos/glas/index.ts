/**
 * Glas, the design language of the demos (glass-spec, src/lib/glas.ts).
 * One import for every demo:
 *
 *   import { GlasPanel, GlasButton, GlasSlider, GlasStage, feldFor } from "@/components/demos/glas";
 *
 * Everything renders inside the page's <GlasRoot> (the v4 demo page and the
 * hub mount it). Demo CSS never sets backdrop-filter or selects .glas*: the
 * look lives in glas.css only (demo-contract.test.ts).
 */
export { GLAS_PRIORITY, allocateLiveLayers, budgetForWidth, countLiveBackdropLayers, isLiveBackdrop, type LiveClaim } from "./budget";
export { GlasButton, type GlasButtonProps, type GlasButtonSize, type GlasButtonVariant } from "./button";
export { GlasChip, type GlasChipKind } from "./chip";
export { DataHandle, SvgLens } from "./data-handle";
export { GlasDropZone } from "./drop-zone";
export { ESCAPE_PRIORITY, pushEscapeLayer } from "./escape-stack";
export { GlasStage } from "./feld";
export { FELD_REST, feldFor, frostImage, hubFeld, type Feld, type FeldPool } from "./feld-math";
export { frameVerdict, type FrameVerdict } from "./frame-monitor";
export { GlasRoot, LESS_GLASS_KEY, useGlas, useLiveSlot, type GlasContextValue } from "./glas-root";
export { GlasIcon, type GlasIconName } from "./icons";
export { DemoIntro, introWordCount, type DemoIntroContent } from "./intro";
export { LessGlassRow } from "./less-glass";
export { GlasGroup, GlasPanel, type GlasPanelProps, type GlasShape } from "./panel";
export { GlasProgress } from "./progress";
export { GlasReadout, GlasTooltip } from "./readout";
export { GlasSegmented, nearestSegment, pillStretch, type SegmentOption } from "./segmented";
export { GlasSheet, shouldDismiss } from "./sheet";
export { GlasSlider, SLIDER_ANNOUNCE_MS, type SliderTick } from "./slider";
export { keyToValue, lensTransform, pointerToValue, snapValue, valueToShare } from "./slider-math";
export { GlasToggle } from "./toggle";
export { createSpring, springConfig, usePrefersReducedMotion, useSpringValue, type SpringHandle } from "./use-spring";
export { GlasWeg, type WegCopy, type WegStep } from "./weg";
