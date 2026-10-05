#!/usr/bin/env node
/**
 * Recolours the four Grundlagen course illustrations toward the Lemons poster
 * scene: public/course-covers/<slug>-cover-v3.webp -> <slug>-cover-v4.webp
 * (1440 x 630, WebP). The drawing, the people, the paper grain and the
 * print texture stay; only the colours move.
 *
 * Every pixel is remapped in Oklch, deterministically (no randomness, no
 * model):
 *
 *   hue      source hue families move onto the scene's hues: blues onto
 *            Ultramarin, teals, greens and violets onto Kobalt (violets as a
 *            pale Kobalt tint), oranges and reds onto Mennige, pastel pinks
 *            onto a Mennige tint, yellows onto Butter. Skin tones keep their
 *            own hue. Between control points the target hues blend as unit
 *            vectors, so there are no seams, and a blend between far-apart
 *            families passes through grey rather than through green.
 *   light    moves part of the way toward the family colour, linearly, so
 *            shading, highlights and grain keep their order. Only saturated
 *            pixels are darkened (pale washes stay pale tints); dark pixels
 *            are lifted toward Ultramarin instead of sinking to black.
 *   chroma   scaled toward the family colour's chroma and softly capped a
 *            little above it: Butter is paler than the source yellows,
 *            Ultramarin richer than the source blues.
 *   neutral  pale, warm, low-chroma pixels (the cream ground) move to
 *            Kalkweiß; dark ones (lines, hair) take a deep Ultramarin tint.
 *
 * The result is blended with the original in Oklab (the variant's `mix`,
 * 0.85 for v4) to keep some of the source's richness, then brought into
 * sRGB by reducing chroma at constant lightness and hue. The same input
 * always gives the same bytes.
 *
 * Anchor colours come from src/lib/plakat/palettes.ts (loaded with Node's
 * type stripping): Lemons Ultramarin, Mennige and Butter, IDEA Kobalt (and
 * Himbeere for the comparison variants), and PAPER.kalkweiss.
 *
 * Usage (from packages/website):
 *   node scripts/recolor-course-covers.mjs
 *       write public/course-covers/<slug>-cover-v4.webp for all four courses
 *   node scripts/recolor-course-covers.mjs --variant=<name> --out=<dir> [--only=<slug>] [--png]
 *       write a named variant elsewhere, for comparing (see VARIANTS)
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEBSITE = resolve(HERE, "..");
const COVERS = join(WEBSITE, "public/course-covers");
const require = createRequire(join(WEBSITE, "package.json"));
const sharp = require("sharp");

const { PLAKAT, PAPER } = await import(
  pathToFileURL(join(WEBSITE, "src/lib/plakat/palettes.ts")).href
);

export const SLUGS = ["ki-fuehrerschein", "ki-und-gesellschaft", "eu-ai-act-kurs", "ai-native"];
const SOURCE_VERSION = "v3";
const TARGET_VERSION = "v4";
const WEBP = { quality: 80, effort: 6 };

// ---------------------------------------------------------------- colour math

const SRGB_TO_LINEAR = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const v = i / 255;
  SRGB_TO_LINEAR[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb8(x) {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

/** Linear sRGB to Oklab, written into `out`. */
function linearToOklab(r, g, b, out) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  out[0] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  out[1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  out[2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
}

/** Oklab to linear sRGB, written into `out` (may be out of gamut). */
function oklabToLinear(L, a, b, out) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  out[0] = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  out[1] = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  out[2] = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
}

const inGamut = (c) => c[0] >= -1e-4 && c[0] <= 1.0001 && c[1] >= -1e-4 && c[1] <= 1.0001 && c[2] >= -1e-4 && c[2] <= 1.0001;

function hexToOklch(hex) {
  const lab = [0, 0, 0];
  linearToOklab(
    SRGB_TO_LINEAR[parseInt(hex.slice(1, 3), 16)],
    SRGB_TO_LINEAR[parseInt(hex.slice(3, 5), 16)],
    SRGB_TO_LINEAR[parseInt(hex.slice(5, 7), 16)],
    lab,
  );
  return { L: lab[0], C: Math.hypot(lab[1], lab[2]), h: (Math.atan2(lab[2], lab[1]) * 180) / Math.PI };
}

const smoothstep = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const wrap = (h) => ((h % 360) + 360) % 360;
/** Signed shortest turn from a to b, in degrees. */
const turn = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;

// ---------------------------------------------------------------- the scene

const ANCHOR = {
  ultramarin: hexToOklch(PLAKAT.lemons.ground),
  mennige: hexToOklch(PLAKAT.lemons.mid),
  butter: hexToOklch(PLAKAT.lemons.ink),
  kobalt: hexToOklch(PLAKAT.idea.ink),
  himbeere: hexToOklch(PLAKAT.idea.mid),
  paper: hexToOklch(PAPER.kalkweiss),
};

/** An anchor mixed toward Kalkweiß in Oklab (`tint` 0 = the anchor itself). */
function tinted(name, tint) {
  const a = ANCHOR[name];
  const p = ANCHOR.paper;
  const rad = (x) => (x * Math.PI) / 180;
  const aa = mix(a.C * Math.cos(rad(a.h)), p.C * Math.cos(rad(p.h)), tint);
  const bb = mix(a.C * Math.sin(rad(a.h)), p.C * Math.sin(rad(p.h)), tint);
  return { L: mix(a.L, p.L, tint), C: Math.hypot(aa, bb), h: wrap((Math.atan2(bb, aa) * 180) / Math.PI) };
}

/**
 * Hue control points on the source hue circle (Oklch degrees). Each names
 * the scene colour its pixels move toward, how pale that colour is (`tint`
 * toward Kalkweiß, for the pastel families), how strongly lightness follows
 * (`light`), and the family's typical chroma in the v3 illustrations
 * (`refC`, measured: blues about 0.1, oranges 0.14, yellows 0.13, pinks and
 * violets 0.05 to 0.08). `anchor: null` keeps the pixel's own hue (skin).
 */
function controlPoints(v) {
  return [
    { h: 0, anchor: v.pink, tint: v.pinkTint, refC: 0.06, light: 0.6 },
    { h: 22, anchor: v.pink, tint: v.pinkTint, refC: 0.08, light: 0.6 },
    { h: 36, anchor: "mennige", tint: 0, refC: 0.14, light: 1 },
    { h: 50, anchor: "mennige", tint: 0.15, refC: 0.12, light: 0.8 },
    { h: 64, anchor: null, tint: 0, refC: 0.07, light: 0 },
    { h: 80, anchor: "butter", tint: 0, refC: 0.1, light: 1 },
    { h: 112, anchor: "butter", tint: 0, refC: 0.13, light: 1 },
    { h: 122, anchor: "kobalt", tint: 0.2, refC: 0.07, light: 0.8 },
    { h: 200, anchor: "kobalt", tint: 0.1, refC: 0.09, light: 0.9 },
    { h: 240, anchor: "ultramarin", tint: 0, refC: 0.1, light: 1 },
    { h: 268, anchor: "ultramarin", tint: 0, refC: 0.12, light: 1 },
    { h: 292, anchor: v.violet, tint: v.violetTint, refC: 0.08, light: 0.8 },
    { h: 325, anchor: v.pink, tint: v.pinkTint, refC: 0.05, light: 0.6 },
  ];
}

/**
 * The variants compared on one image; `DEFAULT_VARIANT` writes v4.
 *   pullL  how far lightness moves toward the family colour (0 keeps it)
 *   pullC  how far chroma moves toward the family colour's chroma
 *   mix    share of the remapped colour; the rest is the v3 original
 */
export const VARIANTS = {
  // Pure Lemons: pinks fold into a Mennige tint, violets into Kobalt.
  "lemons-pure": {
    pink: "mennige",
    pinkTint: 0.5,
    violet: "kobalt",
    violetTint: 0.3,
    violetShift: 0,
    pullL: 0.55,
    pullC: 0.85,
    mix: 1,
    neutralPull: 0.85,
    darkTint: 0.05,
  },
  // The v4 files: pure Lemons with 15 % of the original blended back in, so
  // the washes keep a little of their old warmth and depth.
  lemons: {
    pink: "mennige",
    pinkTint: 0.5,
    violet: "kobalt",
    violetTint: 0.3,
    violetShift: 0,
    pullL: 0.55,
    pullC: 0.85,
    mix: 0.85,
    neutralPull: 0.85,
    darkTint: 0.05,
  },
  // Lemons plus the IDEA secondaries: pinks keep a Himbeere tint, violets a
  // Kobalt violet; 15 % of the original blended back in.
  "lemons-himbeere": {
    pink: "himbeere",
    pinkTint: 0.5,
    violet: "kobalt",
    violetTint: 0.25,
    violetShift: 8,
    pullL: 0.5,
    pullC: 0.8,
    mix: 0.85,
    neutralPull: 0.8,
    darkTint: 0.05,
  },
  // Softer: same families, gentler pull, 25 % original.
  "lemons-soft": {
    pink: "himbeere",
    pinkTint: 0.5,
    violet: "kobalt",
    violetTint: 0.25,
    violetShift: 8,
    pullL: 0.35,
    pullC: 0.65,
    mix: 0.75,
    neutralPull: 0.7,
    darkTint: 0.04,
  },
};
export const DEFAULT_VARIANT = "lemons";

/** Per control point: target hue and lightness, lightness pull, chroma scale and cap. */
function compile(v) {
  return controlPoints(v).map((p) => {
    if (p.anchor === null) {
      return { h: p.h, hue: p.h, targetL: 0.8, k: 0, cScale: 0.9, cap: 0.2 };
    }
    const a = tinted(p.anchor, p.tint);
    let hue = a.h;
    if (p.anchor === "kobalt" && p.h > 270 && p.h < 320) hue = wrap(hue + v.violetShift);
    return {
      h: p.h,
      hue,
      targetL: a.L,
      k: v.pullL * p.light,
      cScale: mix(1, a.C / p.refC, v.pullC),
      cap: a.C * 1.25,
    };
  });
}

/** Interpolated parameters for a source hue (circular, piecewise linear). */
function paramsAt(table, h) {
  const n = table.length;
  let i = n - 1;
  for (let k = 0; k < n; k++) if (table[k].h <= h) i = k;
  const p = table[i];
  const q = table[(i + 1) % n];
  const span = wrap(q.h - p.h) || 360;
  const t = wrap(h - p.h) / span;
  // Hues blend as unit vectors, not along the circle: between two far-apart
  // families (Butter and Kobalt) the blend passes through grey instead of
  // sweeping through a hue neither family has (green).
  const rad = (x) => (x * Math.PI) / 180;
  const x = mix(Math.cos(rad(p.hue)), Math.cos(rad(q.hue)), t);
  const y = mix(Math.sin(rad(p.hue)), Math.sin(rad(q.hue)), t);
  return {
    x,
    y,
    targetL: mix(p.targetL, q.targetL, t),
    k: mix(p.k, q.k, t),
    cScale: mix(p.cScale, q.cScale, t),
    cap: mix(p.cap, q.cap, t),
  };
}

/** A 360-entry lookup of paramsAt, one per whole degree. */
function hueTable(v) {
  const table = compile(v);
  return Array.from({ length: 360 }, (_, deg) => paramsAt(table, deg));
}

// ---------------------------------------------------------------- per pixel

function recolorPixels(data, channels, v) {
  const lut = hueTable(v);
  const paper = ANCHOR.paper;
  const paperA = paper.C * Math.cos((paper.h * Math.PI) / 180);
  const paperB = paper.C * Math.sin((paper.h * Math.PI) / 180);
  const ultraHue = (ANCHOR.ultramarin.h * Math.PI) / 180;
  const out = Buffer.alloc((data.length / channels) * 3);
  const lab = [0, 0, 0];
  const rgb = [0, 0, 0];

  for (let i = 0, o = 0; i < data.length; i += channels, o += 3) {
    linearToOklab(SRGB_TO_LINEAR[data[i]], SRGB_TO_LINEAR[data[i + 1]], SRGB_TO_LINEAR[data[i + 2]], lab);
    const [L0, a0, b0] = lab;
    const C0 = Math.hypot(a0, b0);
    const h0 = wrap((Math.atan2(b0, a0) * 180) / Math.PI);

    // How chromatic the pixel is. Pale warm pixels need more chroma to
    // count, so the cream ground reads as paper, not as a very pale yellow;
    // pale blue, pink and violet washes stay colour.
    const cream = 1 - smoothstep(30, 50, Math.abs(turn(h0, 80)));
    const c0 = 0.008 + cream * (0.006 + 0.03 * smoothstep(0.8, 0.95, L0));
    const w = smoothstep(c0, c0 + 0.03, C0);

    // Chromatic remap.
    const deg = Math.floor(h0) % 360;
    const p0 = lut[deg];
    const p1 = lut[(deg + 1) % 360];
    const f = h0 - Math.floor(h0);
    const hx = mix(p0.x, p1.x, f);
    const hy = mix(p0.y, p1.y, f);
    const targetL = mix(p0.targetL, p1.targetL, f);
    const k = mix(p0.k, p1.k, f);
    const cScale = mix(p0.cScale, p1.cScale, f);
    const cap = mix(p0.cap, p1.cap, f);
    // Lightness moves part of the way toward the family colour, so the order
    // of shades (and the grain) stays. Darkening needs saturation: pale
    // washes stay pale tints instead of turning into mid tones. Lifting does
    // not: dark blues rise toward Ultramarin instead of sinking to black.
    const darken = L0 > targetL ? smoothstep(0.02, 0.1, C0) : 1;
    const Lc = L0 + (targetL - L0) * k * darken;
    // Chroma scaled, then softly capped a little above the family colour.
    // (hx, hy) is shorter than 1 between far-apart families: less chroma.
    const Cc = cap * Math.tanh((C0 * cScale) / cap);
    const ac = Cc * hx;
    const bc = Cc * hy;

    // Neutral remap: pale toward Kalkweiß, dark toward a deep Ultramarin.
    const dark = 1 - smoothstep(0.18, 0.55, L0);
    const Ln = L0 + 0.06 * (1 - smoothstep(0, 0.3, L0));
    const pale = smoothstep(0.55, 0.9, L0);
    const an = mix(a0, mix(a0, paperA, v.neutralPull), pale) + v.darkTint * dark * Math.cos(ultraHue);
    const bn = mix(b0, mix(b0, paperB, v.neutralPull), pale) + v.darkTint * dark * Math.sin(ultraHue);

    // Dark chromatic pixels also get the lift, so no line ends up near-black.
    const Lr = mix(Ln, Lc, w);
    let L = mix(L0, Lr, v.mix);
    let a = mix(a0, mix(an, ac, w), v.mix);
    let b = mix(b0, mix(bn, bc, w), v.mix);

    // Into sRGB: keep L and hue, reduce chroma until the colour fits.
    oklabToLinear(L, a, b, rgb);
    if (!inGamut(rgb)) {
      let lo = 0;
      let hi = 1;
      for (let k = 0; k < 14; k++) {
        const mid = (lo + hi) / 2;
        oklabToLinear(L, a * mid, b * mid, rgb);
        if (inGamut(rgb)) lo = mid;
        else hi = mid;
      }
      a *= lo;
      b *= lo;
      oklabToLinear(L, a, b, rgb);
    }
    out[o] = linearToSrgb8(Math.max(0, rgb[0]));
    out[o + 1] = linearToSrgb8(Math.max(0, rgb[1]));
    out[o + 2] = linearToSrgb8(Math.max(0, rgb[2]));
  }
  return out;
}

export async function recolor(slug, variantName, outDir, { png = false, version = TARGET_VERSION } = {}) {
  const v = VARIANTS[variantName];
  if (!v) throw new Error(`Unknown variant ${variantName}; known: ${Object.keys(VARIANTS).join(", ")}`);
  const source = join(COVERS, `${slug}-cover-${SOURCE_VERSION}.webp`);
  const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = recolorPixels(data, info.channels, v);
  const raw = { raw: { width: info.width, height: info.height, channels: 3 } };
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, `${slug}-cover-${version}.webp`);
  await sharp(pixels, raw).webp(WEBP).toFile(target);
  if (png) await sharp(pixels, raw).png().toFile(join(outDir, `${slug}-cover-${version}.png`));
  return target;
}

async function main() {
  const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const variant = arg("variant") ?? DEFAULT_VARIANT;
  const outDir = resolve(arg("out") ?? COVERS);
  const only = arg("only");
  const png = process.argv.includes("--png");
  const slugs = only ? only.split(",") : SLUGS;
  for (const slug of slugs) {
    if (!SLUGS.includes(slug)) throw new Error(`Unknown course ${slug}`);
    const version = outDir === COVERS ? TARGET_VERSION : `${TARGET_VERSION}-${variant}`;
    const target = await recolor(slug, variant, outDir, { png, version });
    console.log(`${variant}: ${target}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
