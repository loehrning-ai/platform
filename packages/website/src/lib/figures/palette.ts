/**
 * Brand colours as literal hex values, so the same SVG prints in the PDF
 * without CSS variables. Values mirror the platform tokens in globals.css
 * (web) and brand CI v5.3 (print). One accent, no gradients.
 */

export interface Palette {
  /** Druckschwarz: text and strokes. */
  readonly ink: string;
  /** Kalkweiss ground. */
  readonly paper: string;
  /** Bogen: raised sheet, knock-outs. */
  readonly card: string;
  /** Mennige, the one accent. */
  readonly accent: string;
  /** Schiefer: secondary text, 8:1 on paper. */
  readonly muted: string;
  /** Schiefer hell: captions, 5.7:1 on paper. */
  readonly mutedLight: string;
  /** Kante: boundary of a shape, 3.7:1 on paper. */
  readonly edge: string;
  /** Leinen: hairlines and grids, decorative only. */
  readonly track: string;
  /** Beton: recessed fills. */
  readonly inset: string;
  /** Lightest step of the sequential ramp. */
  readonly rampLow: string;
}

export const PALETTES: Readonly<Record<"web" | "print", Palette>> = {
  web: {
    ink: "#121212",
    paper: "#f7f1e7",
    card: "#fffcf5",
    accent: "#b73a15",
    muted: "#4f4640",
    mutedLight: "#655c54",
    edge: "#827970",
    track: "#d4cec5",
    inset: "#ece5d8",
    rampLow: "#f0e3d3",
  },
  print: {
    ink: "#121212",
    paper: "#f3f0e9",
    card: "#fbf9f4",
    accent: "#b73a15",
    muted: "#4f4640",
    mutedLight: "#655c54",
    edge: "#827970",
    track: "#d4cec5",
    inset: "#e8e3d8",
    rampLow: "#efe4d6",
  },
};

export const FONT_STACK =
  "Figtree, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(rgb: readonly number[]): string {
  return `#${rgb
    .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Linear mix of two hex colours, t = 0 gives a. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex(ca.map((v, i) => v + ((cb[i] ?? 0) - v) * t));
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio of two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** The ink or card colour that reads better on `background`. */
export function readableOn(background: string, palette: Palette): string {
  return contrastRatio(palette.ink, background) >=
    contrastRatio(palette.card, background)
    ? palette.ink
    : palette.card;
}

/** Sequential single-hue ramp from the lightest tint (t = 0) to Mennige (t = 1). */
export function rampColor(palette: Palette, t: number): string {
  return mixHex(palette.rampLow, palette.accent, Math.min(1, Math.max(0, t)));
}

/** The five classes of a classed map; every one keeps 4.5:1 for its printed value. */
export const RAMP_CLASSES = [0, 0.25, 0.5, 0.75, 1] as const;

/** Colour of the class a value share (0 to 1 of the ramp maximum) falls in. */
export function rampClassColor(palette: Palette, share: number): string {
  const index = Math.min(RAMP_CLASSES.length - 1, Math.max(0, Math.floor(share * RAMP_CLASSES.length)));
  return rampColor(palette, RAMP_CLASSES[index] ?? 0);
}

/** Accent at a low strength over the paper, as a solid colour. */
export function accentTint(palette: Palette, strength = 0.18): string {
  return mixHex(palette.paper, palette.accent, strength);
}
