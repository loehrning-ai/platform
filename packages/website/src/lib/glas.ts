/**
 * Glas: the design language of the demos (the /demos hub and the six
 * /demos/<slug> pages) and of nothing else on the site. The rest of the site
 * keeps Werkglas (src/lib/glass.ts), square corners and paper.
 *
 * Glas is the control layer that floats over the content: docks, sheets,
 * the intro card, readouts, the thumb that turns into a lens while you drag
 * it. The data itself is content and never glass. Four materials (clear,
 * thin, regular, thick) in two tones (hell over light grounds, dunkel over
 * dark grounds). Each text-bearing material has a more transparent 12px rim
 * zone where the field bleeds in, and a reading plate inside it with the
 * alpha that is proven for text below.
 *
 * The numbers live here so a unit test can prove every text and mark stays
 * legible over the worst thing a stage may paint behind it, with no credit
 * for the blur and pessimistic for saturate() and brightness(), and so the
 * CSS (src/components/demos/glas/glas.css) cannot quietly drop to a thinner
 * tint: glas.test.ts reads every alpha back from the stylesheet.
 */

import { contrastRatio, luminance, mixHex } from "@/lib/figures/palette";
import { PLAKAT, type PlakatKey } from "@/lib/plakat/palettes";

export type GlasTone = "hell" | "dunkel";
export type GlasMaterial = "clear" | "thin" | "regular" | "thick";
/** live: real backdrop-filter. frost: a static copy of the field, no filter. solid: opaque tint. */
export type GlasMode = "live" | "frost" | "solid";

/** Bogen, the light glass tint, and Druckschwarz warm, the dark one. */
export const GLAS_TINT: Readonly<Record<GlasTone, string>> = { hell: "#fffcf5", dunkel: "#1a1714" };

export interface GlasMaterialSpec {
  /** Alpha of the outer 12px rim zone, where the field shows through. */
  readonly rim: number;
  /** Composite alpha of the reading plate, the number proven for text. */
  readonly text: number;
  readonly blur: number;
  readonly saturate: number;
  readonly brightness: number;
}

export const GLAS_MATERIALS: Readonly<Record<GlasTone, Readonly<Record<GlasMaterial, GlasMaterialSpec>>>> = {
  hell: {
    clear: { rim: 0.1, text: 0.1, blur: 0, saturate: 1, brightness: 1 },
    thin: { rim: 0.56, text: 0.56, blur: 12, saturate: 2, brightness: 1.08 },
    regular: { rim: 0.56, text: 0.8, blur: 18, saturate: 2, brightness: 1.08 },
    thick: { rim: 0.56, text: 0.9, blur: 28, saturate: 1.8, brightness: 1.08 },
  },
  dunkel: {
    clear: { rim: 0.08, text: 0.08, blur: 0, saturate: 1, brightness: 1 },
    thin: { rim: 0.66, text: 0.66, blur: 12, saturate: 1.6, brightness: 0.92 },
    regular: { rim: 0.66, text: 0.84, blur: 18, saturate: 1.6, brightness: 0.92 },
    thick: { rim: 0.66, text: 0.9, blur: 28, saturate: 1.5, brightness: 0.92 },
  },
};

/** A sheet at its large detent turns more opaque (Apple: more opaque at full height). */
export const GLAS_SHEET_FULL_ALPHA = 0.96;

/** Alpha of the reading plate drawn inside the rim so that rim plus plate composite to `text`. */
export function plateAlpha(spec: GlasMaterialSpec): number {
  if (spec.text <= spec.rim) return 0;
  return 1 - (1 - spec.text) / (1 - spec.rim);
}

/** The colours that may sit on glass, per tone. Mennige marks only; Mennige tief is link text on thick only. */
export const GLAS_TEXT = {
  hell: { ink: "#121212", secondary: "#4f4640", linkOnThick: "#97300f", mark: "#b73a15" },
  dunkel: { ink: "#f7f1e7", secondary: "#c9c0b5", mark: "#e07050" },
} as const;

/** The one tint: the background of the one primary action per screen. */
export const GLAS_ACCENT = { fill: "#b73a15", pressed: "#97300f", alpha: 0.92, label: "#fffcf5" } as const;

/** WCAG AA for text, and the non-text floor for marks (rings, filled tracks, dots). */
export const GLAS_TEXT_MIN = 4.5;
export const GLAS_MARK_MIN = 3;

/** Which surfaces a text colour is proven on, and at which floor (the table of glass-spec 2.1). */
export const GLAS_PROOFS: readonly {
  readonly tone: GlasTone;
  readonly material: Exclude<GlasMaterial, "clear">;
  readonly colour: string;
  readonly role: string;
  readonly floor: number;
}[] = [
  { tone: "hell", material: "thin", colour: GLAS_TEXT.hell.ink, role: "Druckschwarz label", floor: GLAS_TEXT_MIN },
  { tone: "hell", material: "regular", colour: GLAS_TEXT.hell.ink, role: "Druckschwarz", floor: GLAS_TEXT_MIN },
  { tone: "hell", material: "regular", colour: GLAS_TEXT.hell.secondary, role: "Schiefer", floor: GLAS_TEXT_MIN },
  { tone: "hell", material: "regular", colour: GLAS_TEXT.hell.mark, role: "Mennige mark", floor: GLAS_MARK_MIN },
  { tone: "hell", material: "thick", colour: GLAS_TEXT.hell.ink, role: "Druckschwarz", floor: GLAS_TEXT_MIN },
  { tone: "hell", material: "thick", colour: GLAS_TEXT.hell.secondary, role: "Schiefer", floor: GLAS_TEXT_MIN },
  { tone: "hell", material: "thick", colour: GLAS_TEXT.hell.linkOnThick, role: "Mennige tief link", floor: GLAS_TEXT_MIN },
  { tone: "hell", material: "thick", colour: GLAS_TEXT.hell.mark, role: "Mennige mark", floor: GLAS_MARK_MIN },
  { tone: "dunkel", material: "thin", colour: GLAS_TEXT.dunkel.ink, role: "Kalkweiß label", floor: GLAS_TEXT_MIN },
  { tone: "dunkel", material: "regular", colour: GLAS_TEXT.dunkel.ink, role: "Kalkweiß", floor: GLAS_TEXT_MIN },
  { tone: "dunkel", material: "regular", colour: GLAS_TEXT.dunkel.secondary, role: "Stein", floor: GLAS_TEXT_MIN },
  { tone: "dunkel", material: "regular", colour: GLAS_TEXT.dunkel.mark, role: "Kupfer hell mark", floor: GLAS_MARK_MIN },
  { tone: "dunkel", material: "thick", colour: GLAS_TEXT.dunkel.ink, role: "Kalkweiß", floor: GLAS_TEXT_MIN },
  { tone: "dunkel", material: "thick", colour: GLAS_TEXT.dunkel.secondary, role: "Stein", floor: GLAS_TEXT_MIN },
  { tone: "dunkel", material: "thick", colour: GLAS_TEXT.dunkel.mark, role: "Kupfer hell mark", floor: GLAS_MARK_MIN },
];

/* ── The field ("Feld"): the backdrop every stage paints under its glass ─── */

export interface GlasPool {
  /** The pool colour, a palette hue or Mennige. Never the palette ink. */
  readonly colour: string;
  /** The largest alpha that keeps the palette ink at 4.5:1 over this pool (glass-spec 3). */
  readonly alpha: number;
}

/**
 * Three radial pools per workshop palette, from its own hues plus Mennige,
 * each at most at the alpha that keeps the palette ink legible over it.
 */
export const GLAS_POOLS: Readonly<Record<PlakatKey, readonly GlasPool[]>> = {
  lemons: [
    { colour: "#2e4d90", alpha: 0.7 },
    { colour: "#b73a15", alpha: 0.7 },
    { colour: "#fceeaf", alpha: 0.3 },
  ],
  idea: [
    { colour: "#a9ddfc", alpha: 0.7 },
    { colour: "#c94a7f", alpha: 0.3 },
    { colour: "#b73a15", alpha: 0.25 },
  ],
  bloom: [
    { colour: "#d1733d", alpha: 0.7 },
    { colour: "#ffb38a", alpha: 0.7 },
    { colour: "#b73a15", alpha: 0.5 },
  ],
  autumn: [
    { colour: "#b73a15", alpha: 0.7 },
    { colour: "#3b1f45", alpha: 0.7 },
  ],
  sage: [
    { colour: "#d9a441", alpha: 0.7 },
    { colour: "#a9ddfc", alpha: 0.7 },
    { colour: "#b73a15", alpha: 0.35 },
  ],
  kraft: [
    { colour: "#b73a15", alpha: 0.6 },
    { colour: "#fceeaf", alpha: 0.7 },
    { colour: "#e4a057", alpha: 0.7 },
  ],
};

/** The hub's own field: Kalkweiß with three soft pools from across the series. */
export const GLAS_HUB_GROUND = "#f7f1e7";
export const GLAS_HUB_POOLS: readonly GlasPool[] = [
  { colour: "#a9ddfc", alpha: 0.55 },
  { colour: "#fceeaf", alpha: 0.7 },
  { colour: "#ffb38a", alpha: 0.45 },
];

/** Below this ground luminance a stage defaults to dark glass. */
export const GLAS_DARK_GROUND_LUMINANCE = 0.18;

/** The default glass tone of a workshop stage, chosen statically from its ground (never sampled at runtime). */
export function glasToneFor(plakat: PlakatKey): GlasTone {
  return luminance(PLAKAT[plakat].ground) < GLAS_DARK_GROUND_LUMINANCE ? "dunkel" : "hell";
}

/**
 * Everything a stage of this palette may paint under its glass: the palette
 * roles, the pool colours (also at full strength, the pessimistic case),
 * Druckschwarz and Bogen, and pure black and white.
 */
export function glasWorstPaints(plakat: PlakatKey): readonly string[] {
  const palette = PLAKAT[plakat];
  const roles = [palette.ground, palette.ink, palette.mid, palette.mark, palette.accentText, palette.button, palette.chartAccent];
  const pools = GLAS_POOLS[plakat].map((pool) => pool.colour);
  return [...new Set([...roles, ...pools, "#121212", "#fffcf5", "#000000", "#ffffff"].map((colour) => colour.toLowerCase()))];
}

/* ── Compositing, pessimistic for the filter ──────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number];
}

function rgbToHex(rgb: readonly number[]): string {
  return `#${rgb.map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0")).join("")}`;
}

/** CSS saturate(s) on one colour (the Filter Effects matrix). */
export function saturateHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex).map((value) => value / 255) as [number, number, number];
  const s = amount;
  const out = [
    (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b,
  ];
  return rgbToHex(out.map((value) => Math.min(1, Math.max(0, value)) * 255));
}

/** CSS brightness(k) on one colour. */
export function brightnessHex(hex: string, amount: number): string {
  return rgbToHex(hexToRgb(hex).map((value) => value * amount));
}

/** The glass tint at `alpha` over `behind`; blur averages, so it is never credited. */
export function glasComposite(behind: string, tone: GlasTone, alpha: number): string {
  return mixHex(behind, GLAS_TINT[tone], alpha);
}

/**
 * Lowest contrast of `colour` on a material over every paint, each paint
 * also run through the material's saturate() and brightness() in both
 * orders, the worst result kept.
 */
export function worstGlasContrast(colour: string, tone: GlasTone, material: GlasMaterial, paints: readonly string[], alpha?: number): number {
  const spec = GLAS_MATERIALS[tone][material];
  const a = alpha ?? spec.text;
  let worst = Number.POSITIVE_INFINITY;
  for (const paint of paints) {
    for (const behind of [paint, brightnessHex(saturateHex(paint, spec.saturate), spec.brightness), saturateHex(brightnessHex(paint, spec.brightness), spec.saturate)]) {
      worst = Math.min(worst, contrastRatio(colour, glasComposite(behind, tone, a)));
    }
  }
  return worst;
}

/** Every palette's worst paints together: what the shared components must survive on any stage. */
export function glasAllPaints(): readonly string[] {
  const keys = Object.keys(PLAKAT) as PlakatKey[];
  return [...new Set([...keys.flatMap((key) => glasWorstPaints(key)), ...GLAS_HUB_POOLS.map((pool) => pool.colour), GLAS_HUB_GROUND])];
}

/** The pool at its alpha over the stage ground: what content text drawn over the pool is read against. */
export function poolComposite(plakat: PlakatKey, pool: GlasPool): string {
  return mixHex(PLAKAT[plakat].ground, pool.colour, pool.alpha);
}

/* ── Budget ────────────────────────────────────────────────────────────── */

/**
 * Live backdrop-filter surfaces visible at the same time, counting the
 * site's desktop nav (Werkglas). The lens costs no filter; a sheet at its
 * large detent switches its own glass off.
 */
export const GLAS_LIVE_BUDGET = { phone: 3, desktop: 5 } as const;
/** From this viewport width the desktop budget applies (the site's lg breakpoint). */
export const GLAS_DESKTOP_MIN_WIDTH = 1024;
/** The largest blur radius any material may use. */
export const GLAS_MAX_BLUR = 28;
/** Live glass may cover at most this share of the viewport. */
export const GLAS_MAX_AREA_SHARE = 0.4;

/* ── Shape ─────────────────────────────────────────────────────────────── */

export const GLAS_RADIUS = { stage: 36, sheet: 36, card: 28, cardInStage: 24, fixed: 16, minInner: 10 } as const;

/** Concentric corners: the inner radius is the outer radius minus the padding, never below 10px. */
export function innerRadius(outer: number, padding: number): number {
  return Math.max(GLAS_RADIUS.minInner, outer - padding);
}
