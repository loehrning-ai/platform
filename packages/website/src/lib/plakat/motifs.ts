import { PLAKAT, type MotifId, type PlakatKey } from "./palettes.ts";

/**
 * Poster geometry (Werkzeichnung v2, SPEC §3.5), ported from the reference
 * module spec-work/plakat-motifs.mjs. Every motif returns shapes with a ROLE
 * (ground, ink or mid), never a colour: the React poster maps roles to
 * `fill-scene-*` classes inside a `.plakat-*` scope, and poster-svg.ts maps
 * them to hex from PLAKAT for OG images, cards and deck covers.
 *
 * Rules held here: three roles only, flat fills, no strokes on shapes (only
 * the ground-coloured keyline on numerals), shapes bleed off at least one
 * edge, type holds a 4.5% margin, one big flat shape plus one small counter
 * shape per course thumbnail, no UI-icon motifs.
 *
 * Canvases: portrait 400 x 500 (4:5), landscape 800 x 450 (16:9) and the
 * phone band strip 400 x 128.
 */

export type ShapeRole = "ground" | "ink" | "mid";

export interface PosterShape {
  readonly role: ShapeRole;
  readonly d: string;
  readonly transform?: string;
}

export type PosterFormat = "portrait" | "landscape" | "strip";

export const POSTER_CANVAS = {
  portrait: { width: 400, height: 500 },
  landscape: { width: 800, height: 450 },
  strip: { width: 400, height: 128 },
} as const satisfies Record<PosterFormat, { width: number; height: number }>;

/** Motifs retired by the spec (UI icons and clip-art). None may return. */
export const RETIRED_MOTIFS = ["lines", "branch", "gauge", "bars"] as const;

// ─── Primitives (one decimal, as the reference) ────────────────────────────

const r1 = (value: number): number => Math.round(value * 10) / 10;

function shape(role: ShapeRole, d: string, transform?: string): PosterShape {
  return transform ? { role, d, transform } : { role, d };
}

function rect(x: number, y: number, width: number, height: number): string {
  return `M${r1(x)} ${r1(y)}h${r1(width)}v${r1(height)}h${r1(-width)}Z`;
}

function circle(cx: number, cy: number, r: number): string {
  return `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
}

/** Sector from angle a0 to a1 in degrees (0 = 3 o'clock, clockwise positive in SVG y-down). */
function sector(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const point = (angle: number): [number, number] => [
    cx + r * Math.cos((angle * Math.PI) / 180),
    cy + r * Math.sin((angle * Math.PI) / 180),
  ];
  const [x0, y0] = point(a0);
  const [x1, y1] = point(a1);
  const large = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M${r1(cx)} ${r1(cy)}L${r1(x0)} ${r1(y0)}A${r1(r)} ${r1(r)} 0 ${large} 1 ${r1(x1)} ${r1(y1)}Z`;
}

/** Ellipse as a closed path of two arcs, rotated by `degrees`. */
function ellipse(cx: number, cy: number, rx: number, ry: number, degrees: number): string {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const p1 = [cx - rx * cos, cy - rx * sin];
  const p2 = [cx + rx * cos, cy + rx * sin];
  return (
    `M${r1(p1[0])} ${r1(p1[1])}A${r1(rx)} ${r1(ry)} ${r1(degrees)} 1 0 ${r1(p2[0])} ${r1(p2[1])}` +
    `A${r1(rx)} ${r1(ry)} ${r1(degrees)} 1 0 ${r1(p1[0])} ${r1(p1[1])}Z`
  );
}

// ─── Oak leaf (graft from proto-wayfinding/work/leaf2.mjs) ────────────────

export interface OakLeafOptions {
  readonly len?: number;
  readonly width?: number;
  readonly lobes?: number;
  readonly seed?: number;
  readonly stem?: number;
}

/**
 * One oak leaf, base at 0,0 and tip towards -y. The blade is a union of
 * subpaths (each drawn as its own path, since a mixed-winding union under
 * nonzero can punch holes): a slim body along the axis, alternating finger
 * lobes per side that lean toward the tip and grow toward it, and a terminal
 * lobe. A curved stem in the leaf colour extends 0.16 x len beyond the base.
 * The midrib is a tapered knockout in the ground role, 0.018 x width wide,
 * from the base to 0.72 x len.
 */
export function oakLeaf({ len = 200, width = 150, lobes = 3, seed = 0, stem = 0.16 }: OakLeafOptions = {}): {
  readonly parts: readonly string[];
  readonly midrib: string;
} {
  const parts: string[] = [];
  const bodyWidth = width * 0.2;
  const body =
    `M0 ${r1(-len * 0.04)}C${r1(bodyWidth)} ${r1(-len * 0.3)} ${r1(bodyWidth * 1.1)} ${r1(-len * 0.72)} 0 ${r1(-len * 0.97)}` +
    `C${r1(-bodyWidth * 1.1)} ${r1(-len * 0.72)} ${r1(-bodyWidth)} ${r1(-len * 0.3)} 0 ${r1(-len * 0.04)}Z`;
  const envelope = (t: number) =>
    Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.04) / 0.94))), 0.65) * (0.62 + 0.38 * t);
  const jitter = (index: number) => ((((seed * 13 + index * 7) % 5) - 2) * 0.008);
  for (const side of [1, -1]) {
    for (let index = 0; index < lobes; index++) {
      const t = 0.24 + (index + (side < 0 ? 0.42 : 0)) * (0.6 / lobes) + jitter(index + (side < 0 ? 3 : 0));
      const e = envelope(t);
      const reach = width * 0.5 * e;
      const lean = (28 + 14 * t) * (Math.PI / 180);
      const rx = Math.max(reach * 0.62, width * 0.07);
      const ry = width * 0.118 * (0.6 + 0.4 * e);
      const dx = Math.cos(lean);
      const dy = -Math.sin(lean);
      const cx = side * dx * (reach - rx);
      const cy = -t * len + dy * (reach - rx);
      const degrees = side * (-(lean * 180) / Math.PI);
      parts.push(ellipse(cx, cy, rx, ry, degrees));
    }
  }
  parts.push(body);
  parts.push(ellipse(0, -len * 0.86, width * 0.15, len * 0.12, 0));
  const stemWidth = Math.max(2.2, width * 0.032);
  parts.push(
    `M${r1(-stemWidth / 2)} ${r1(-len * 0.06)}L${r1(stemWidth / 2)} ${r1(-len * 0.06)}` +
      `Q${r1(stemWidth / 2 + len * 0.01)} ${r1(len * stem * 0.6)} ${r1(stemWidth / 2 + len * 0.045)} ${r1(len * stem)}` +
      `L${r1(-stemWidth / 2 + len * 0.045)} ${r1(len * stem)}` +
      `Q${r1(-stemWidth / 2 + len * 0.01)} ${r1(len * stem * 0.6)} ${r1(-stemWidth / 2)} ${r1(-len * 0.06)}Z`,
  );
  const midribWidth = Math.max(1.4, width * 0.018);
  const midrib =
    `M${r1(-midribWidth / 2)} ${r1(-len * 0.05)}Q${r1(-midribWidth * 0.4)} ${r1(-len * 0.45)} 0 ${r1(-len * 0.72)}` +
    `Q${r1(midribWidth * 0.4)} ${r1(-len * 0.45)} ${r1(midribWidth / 2)} ${r1(-len * 0.05)}Z`;
  return { parts, midrib };
}

interface LeafPlacement {
  readonly cx: number;
  readonly cy: number;
  readonly rot: number;
  readonly len: number;
  readonly wid?: number;
  readonly seed?: number;
  readonly lobes?: number;
}

/** A leaf centred on cx,cy, rotated by `rot` degrees; its midrib follows in the ground role. */
function leafAt(role: ShapeRole, { cx, cy, rot, len, wid, seed = 0, lobes = 3 }: LeafPlacement): PosterShape[] {
  const angle = (rot * Math.PI) / 180;
  const baseX = cx - Math.sin(angle) * len * 0.45;
  const baseY = cy + Math.cos(angle) * len * 0.45;
  const { parts, midrib } = oakLeaf({ len, width: wid ?? len * 0.74, lobes, seed });
  const transform = `translate(${r1(baseX)} ${r1(baseY)}) rotate(${rot})`;
  return [...parts.map((d) => shape(role, d, transform)), shape("ground", midrib, transform)];
}

// ─── Portrait motifs (400 x 500) ────────────────────────────────────────────

const PORTRAIT_MOTIFS = {
  // W01 Prognosen (lemons): forecast fan. History as a thin ink band, the
  // future as a widening mid fan, cut by the right edge.
  fan: () => [
    shape("mid", "M 32 356 C 180 330, 320 240, 420 110 L 420 560 C 320 470, 180 380, 32 356 Z"),
    shape("ink", "M 32 356 C 180 340, 320 300, 420 272 L 420 392 C 320 386, 180 368, 32 356 Z"),
  ],
  // W02 Geschäftsberichte (idea): three-quarter pie in ink, the pulled-out
  // quarter in mid, separated by a 22-unit ground gap so Himbeere never
  // touches Kobalt. The corner dots come with the palette.
  pie: () => [shape("ink", sector(190, 404, 140, 0, 270)), shape("mid", sector(214, 380, 140, 270, 360))],
  // W03 Datenbereitschaft (bloom): the sun rising over three table rows, one counter dot.
  dome: () => [
    shape("mid", "M 118 404 A 196 196 0 0 1 510 404 Z"),
    shape("ink", rect(118, 420, 300, 18)),
    shape("ink", rect(118, 452, 300, 18)),
    shape("ink", rect(118, 484, 300, 18)),
    shape("ink", circle(66, 440, 30)),
  ],
  // W04 ESG (autumn): two broad oak leaves, ink over mid, cut by the right and
  // bottom edges. The ink leaf matches the mid leaf's mass and leans only 16
  // degrees, so the pair never reads as a feather.
  leaves: () => [
    ...leafAt("mid", { cx: 196, cy: 402, rot: -30, len: 290, wid: 250, seed: 4 }),
    ...leafAt("ink", { cx: 334, cy: 338, rot: 16, len: 276, wid: 258, seed: 1 }),
  ],
  // Grundlagenpfad (lemons), numerals 01 to 04.
  disc: () => [shape("mid", circle(300, 392, 168)), shape("ink", circle(118, 300, 40))],
  pair: () => [shape("ink", circle(176, 402, 118)), shape("mid", circle(330, 402, 118))],
  // The ring sits low enough that its bottom three dots bleed off the edge.
  ring: () => {
    const shapes = [shape("mid", circle(236, 388, 58))];
    for (let index = 0; index < 12; index++) {
      const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
      shapes.push(shape("ink", circle(236 + 118 * Math.cos(angle), 388 + 118 * Math.sin(angle), 15)));
    }
    return shapes;
  },
  // Four steps of 72; the last bleeds 10 units off the right edge, so the
  // landscape crop (portrait x up to about 379) still shows it whole.
  steps: () =>
    [0, 1, 2, 3].map((index) =>
      shape(
        index === 3 ? "ink" : "mid",
        rect(96 + index * 72, 440 - index * 66, index === 3 ? 98 : 72, 80 + index * 66),
      ),
    ),
  // Technikkurse: one big flat shape plus one small counter shape, no numeral.
  // Claude Course (idea)
  quarter: () => [shape("ink", sector(0, 500, 330, 270, 360)), shape("mid", circle(318, 118, 34))],
  // Codex-Kurs (idea)
  wedge: () => [shape("ink", "M 60 520 L 420 160 L 420 520 Z"), shape("mid", rect(48, 96, 72, 72))],
  // The AI-Native Operator (idea)
  halfdisc: () => [shape("ink", sector(0, 290, 250, 270, 450)), shape("mid", rect(262, 404, 110, 30))],
  // Data Infrastructure (bloom)
  slab: () => [shape("ink", rect(40, 300, 380, 220)), shape("mid", circle(250, 236, 64))],
  // Data Engineering Fundamentals (bloom): the band starts inside the canvas
  // and bleeds off the right edge only, so a full-height band art shows no
  // cut next to the text; the counter dot sits below it, never on it.
  band: () => [shape("mid", rect(40, 250, 370, 120)), shape("ink", circle(112, 436, 36))],
  // Data Science Fundamentals (bloom)
  sun: () => [shape("mid", circle(330, 150, 190)), shape("ink", circle(92, 392, 34))],
} as const satisfies Record<MotifId, () => PosterShape[]>;

const MOTIF_CACHE = new Map<MotifId, readonly PosterShape[]>();

/** The shapes of a motif on the portrait canvas, in paint order. */
export function motifShapes(motif: MotifId): readonly PosterShape[] {
  let shapes = MOTIF_CACHE.get(motif);
  if (!shapes) {
    shapes = Object.freeze(PORTRAIT_MOTIFS[motif]());
    MOTIF_CACHE.set(motif, shapes);
  }
  return shapes;
}

/** Corner dots (IDEA only): ink, r 8, 20 units from each corner of the portrait canvas. */
export const CORNER_DOTS: readonly PosterShape[] = [
  [20, 20],
  [380, 20],
  [20, 480],
  [380, 480],
].map(([x, y]) => shape("ink", circle(x, y, 8)));

// ─── Numerals ──────────────────────────────────────────────────────────────

export interface NumeralLayout {
  readonly x: number;
  /** Baseline. */
  readonly y: number;
  readonly fontSize: number;
  /** Letter-spacing in canvas units (-0.065em at 700, -0.05em at 400). */
  readonly letterSpacing: number;
  readonly fontWeight: 400 | 700;
  /** Which role colours the numeral: IDEA sets it in the mid (Himbeere). */
  readonly role: "ink" | "mid";
  /** The ground-coloured keyline under the fill, 0.05em. */
  readonly keyline: number;
}

/**
 * Figure height of Loehrning Sans as the reference placed it: the digits'
 * top sits at `baseline - 0.727em`.
 */
const FIGURE_TOP = 0.727;

/**
 * Where a numeral sits on each canvas.
 * - portrait: 236 units, top at 38 (the reference poster).
 * - landscape: 300 units at x 40, top at 40, left of the motif.
 * - strip: 140 units, pen at x 0 (the band's content padding aligns it with
 *   the text column), baseline 12 units above the bottom edge.
 */
export function numeralLayout(plakat: PlakatKey, format: PosterFormat): NumeralLayout {
  const { numWeight, numRole } = PLAKAT[plakat];
  const tracking = numWeight === 400 ? -0.05 : -0.065;
  const place = (x: number, top: number | null, baseline: number | null, fontSize: number): NumeralLayout => ({
    x,
    y: baseline ?? r1((top ?? 0) + fontSize * FIGURE_TOP),
    fontSize,
    letterSpacing: r1(tracking * fontSize),
    fontWeight: numWeight,
    role: numRole,
    keyline: r1(fontSize * 0.05),
  });
  switch (format) {
    case "portrait":
      return place(numWeight === 400 ? 22 : 18, 38, null, 236);
    case "landscape":
      return place(40, 40, null, 300);
    case "strip":
      return place(0, null, POSTER_CANVAS.strip.height - 12, 140);
  }
}

// ─── Compositions: portrait, landscape and strip ─────────────────────────

/** A nested SVG viewport: it positions, scales and clips what it holds. */
export interface PosterViewport {
  readonly x: number | string;
  readonly y: number | string;
  readonly width: number | string;
  readonly height: number | string;
  readonly viewBox: string;
  readonly preserveAspectRatio: string;
  /** Let the content paint past the viewport (the numeral's keyline). */
  readonly overflowVisible?: boolean;
}

export type PosterNode =
  | { readonly kind: "shapes"; readonly shapes: readonly PosterShape[] }
  | {
      readonly kind: "viewport";
      readonly viewport: PosterViewport;
      readonly children: readonly PosterNode[];
    }
  | { readonly kind: "numeral"; readonly text: string; readonly layout: NumeralLayout };

export interface PosterComposition {
  readonly format: PosterFormat;
  /** Root viewBox; null for the strip, whose root fills its box in CSS pixels. */
  readonly viewBox: string | null;
  readonly preserveAspectRatio: string | null;
  readonly children: readonly PosterNode[];
}

export interface PosterCompositionOptions {
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
  /** "01" to "04" where a sequence exists, otherwise null (SPEC D9). */
  readonly numeral?: string | null;
  readonly format?: PosterFormat;
  /** Corner dots at the poster's corners. Defaults to the palette (IDEA only); never on a strip. */
  readonly cornerDots?: boolean;
  /**
   * How a portrait or landscape poster fits a box of another shape. The
   * default, xMaxYMax meet, keeps the whole poster against the box's right
   * and bottom edges: in a band the poster's own edges vanish into the same
   * ground, so shapes bleed off the band and nothing is cut inside it.
   */
  readonly preserveAspectRatio?: string;
}

/**
 * The ground, oversized so a letterboxed poster (meet) still paints its
 * scene around it in renderers without CSS backgrounds.
 */
const GROUND: PosterShape = { role: "ground", d: "M-2000 -2000h4800v4800h-4800Z" };

/**
 * Landscape: the portrait motif group placed with translate(440 -25)
 * scale(0.95) and clipped to its own frame, right of the numeral. A nested
 * viewport does the placing and the clipping, so no clipPath id can collide
 * on a page with many posters.
 */
export const LANDSCAPE_MOTIF_VIEWPORT: PosterViewport = {
  x: 440,
  y: -25,
  width: 380,
  height: 475,
  viewBox: "0 0 400 500",
  preserveAspectRatio: "xMidYMid meet",
};

/**
 * Strip windows: the part of the portrait canvas (top and bottom y) that the
 * 128-unit strip shows. Each window starts 12 units above the motif's
 * highest shape, so no shape is cut by the strip's top edge, which sits
 * inside the band; shapes bleed off the right and bottom edges, which are the
 * band's own. Designed for the four workshop motifs (the phone band art);
 * a motif that bleeds off the portrait's left edge (quarter, halfdisc)
 * shows that cut inside a strip.
 */
const STRIP_WINDOWS: Record<MotifId, readonly [top: number, bottom: number]> = {
  fan: [98, 440],
  pie: [228, 440],
  dome: [196, 500],
  leaves: [168, 380],
  disc: [212, 500],
  pair: [272, 500],
  ring: [243, 500],
  steps: [230, 500],
  quarter: [72, 500],
  wedge: [84, 500],
  halfdisc: [28, 500],
  slab: [160, 500],
  band: [238, 500],
  sun: [-52, 500],
};

/** The motif's window on the 400 x 128 strip canvas, against its bottom-right corner. */
export function stripMotifViewport(motif: MotifId): PosterViewport {
  const [top, bottom] = STRIP_WINDOWS[motif];
  const { width, height } = POSTER_CANVAS.strip;
  const portraitWidth = POSTER_CANVAS.portrait.width;
  const scale = height / (bottom - top);
  return {
    x: r1(width - portraitWidth * scale),
    y: 0,
    width: r1(portraitWidth * scale),
    height,
    viewBox: `0 ${top} ${portraitWidth} ${bottom - top}`,
    preserveAspectRatio: "xMidYMid meet",
  };
}

/** The strip canvas, 400 x 128, anchored to one side of a box of any width. */
function stripCanvas(anchor: "xMinYMax" | "xMaxYMax", children: readonly PosterNode[], overflowVisible = false): PosterNode {
  const { width, height } = POSTER_CANVAS.strip;
  return {
    kind: "viewport",
    viewport: {
      x: 0,
      y: 0,
      width: "100%",
      height: "100%",
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: `${anchor} meet`,
      ...(overflowVisible ? { overflowVisible } : {}),
    },
    children,
  };
}

function cornerDotsFor(format: "portrait" | "landscape"): readonly PosterShape[] {
  if (format === "portrait") return CORNER_DOTS;
  const { width, height } = POSTER_CANVAS.landscape;
  return [
    [20, 20],
    [width - 20, 20],
    [20, height - 20],
    [width - 20, height - 20],
  ].map(([x, y]) => shape("ink", circle(x, y, 8)));
}

/**
 * One poster as a tree of shapes, nested viewports and the numeral. The React
 * poster (components/plakat/poster-art.tsx) and the string renderer
 * (poster-svg.ts) both draw this tree, so the site, the OG images and the
 * static materials show the same drawing.
 *
 * - portrait (400 x 500): ground, motif, corner dots, numeral top-left.
 * - landscape (800 x 450): numeral left, the portrait motif right.
 * - strip (a box of any width, drawn on a 400 x 128 canvas): numeral against
 *   the left edge, the motif's window against the bottom-right corner. Below
 *   400 units of width both scale down together; above it they move apart.
 */
export function posterComposition({
  plakat,
  motif,
  numeral = null,
  format = "portrait",
  cornerDots = PLAKAT[plakat].cornerDots,
  preserveAspectRatio = "xMaxYMax meet",
}: PosterCompositionOptions): PosterComposition {
  const motifNode: PosterNode = { kind: "shapes", shapes: motifShapes(motif) };
  const numeralNode: PosterNode | null = numeral
    ? { kind: "numeral", text: numeral, layout: numeralLayout(plakat, format) }
    : null;
  const ground: PosterNode = { kind: "shapes", shapes: [GROUND] };

  if (format === "strip") {
    return {
      format,
      viewBox: null,
      preserveAspectRatio: null,
      children: [
        ground,
        stripCanvas("xMaxYMax", [
          { kind: "viewport", viewport: stripMotifViewport(motif), children: [motifNode] },
        ]),
        ...(numeralNode ? [stripCanvas("xMinYMax", [numeralNode], true)] : []),
      ],
    };
  }

  const { width, height } = POSTER_CANVAS[format];
  const dots: PosterNode[] = cornerDots ? [{ kind: "shapes", shapes: cornerDotsFor(format) }] : [];
  const art: PosterNode =
    format === "landscape"
      ? { kind: "viewport", viewport: LANDSCAPE_MOTIF_VIEWPORT, children: [motifNode] }
      : motifNode;
  return {
    format,
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio,
    children: [ground, art, ...dots, ...(numeralNode ? [numeralNode] : [])],
  };
}
