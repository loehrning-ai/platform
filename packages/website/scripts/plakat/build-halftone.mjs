#!/usr/bin/env node
/**
 * build-halftone.mjs
 *
 * Writes the poster layer's one-ink halftones (SPEC §3.12, decision D10):
 *
 *   public/plakat/halftone-demos.png  a spreadsheet window under a sky (the
 *                                     wayfinding prototype's sheetField)
 *   public/plakat/halftone-blog.png   cumulus clouds in a sky (the lower
 *                                     photo of the IDEA reference poster)
 *
 * Each is one alpha-only PNG, 1600 x 560: black dots whose alpha is the
 * mask. The site uses it as a CSS mask over a block filled with the scene ink
 * (components/plakat/halftone.tsx), so the dots are always a palette ink on
 * the palette ground, never grey, and one image replaces thousands of inline
 * circles.
 *
 * The field is drawn on a 600 x 210 unit canvas with a dot pitch of 6 units
 * (16px in the PNG): each dot's radius follows the field's darkness, as the
 * IDEA poster's photo halftone does. Coverage is computed analytically per
 * pixel, so the output does not depend on a rasteriser.
 *
 * `--check` is non-mutating: it exits 1 when a committed PNG's pixels differ
 * from a fresh render. Regenerate with:
 *   node scripts/plakat/build-halftone.mjs
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const OUTPUT_DIR = join(ROOT, "public", "plakat");

const UNITS = { width: 600, height: 210 };
const PIXELS = { width: 1600, height: 560 };
const PITCH = 6;
/** Dot radius at full darkness, in pitches: 0.56 lets the darkest dots merge. */
const MAX_RADIUS = 0.56;
/** Dots smaller than this (units) are dropped, as a press would lose them. */
const MIN_RADIUS = 0.35;

const checkOnly = process.argv.includes("--check");
const unexpectedArgs = process.argv.slice(2).filter((arg) => arg !== "--check");
if (unexpectedArgs.length > 0) {
  console.error(`Unknown argument(s): ${unexpectedArgs.join(", ")}`);
  process.exit(2);
}

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const gauss = (u, v, cu, cv, su, sv) => Math.exp(-(((u - cu) / su) ** 2 + ((v - cv) / sv) ** 2));

/**
 * Darkness of a spreadsheet window under a sky, 0 (ground) to 1 (ink), over
 * the unit box: the "Claude in Excel" demo as a halftone photo. Port of
 * sheetField() in proto-wayfinding/work/shapes.mjs.
 */
function sheetField(u, v) {
  const cloud = gauss(u, v, 0.3, 0.1, 0.22, 0.1) + 0.8 * gauss(u, v, 0.78, 0.06, 0.16, 0.08);
  const sky = 0.12 + 0.42 * Math.pow(1 - v, 1.6) - 0.4 * cloud;
  const inWindow = u > 0.14 && u < 0.97 && v > 0.22;
  if (!inWindow) return sky;
  if (v < 0.34) return 0.72; // title bar
  const cu = (u - 0.14) / 0.83;
  const cv = (v - 0.34) / 0.66;
  const column = Math.abs((cu * 6) % 1) < 0.07;
  const row = Math.abs((cv * 6) % 1) < 0.1;
  if (column || row) return 0.62;
  if (cu > 0.5 && cu < 0.667) return 0.3 + 0.25 * cv; // the column the model filled
  return 0.06;
}

/**
 * Cumulus clouds on the 600 x 210 canvas, drawn as an illustrator would: a
 * flat base (y) and a handful of round billows [x, y, r], each cloud wider
 * than tall and floating with sky below it. The large cloud sits inside the
 * centre crop that phones see (u 0.15 to 0.85), a second one right of it, a
 * small one low in the gap and a wisp bleeds off the right edge.
 */
const CLOUDS = [
  {
    base: 150,
    billows: [
      [150, 134, 22],
      [188, 114, 34],
      [234, 100, 40],
      [280, 112, 34],
      [318, 130, 22],
      [212, 130, 28],
      [258, 132, 28],
    ],
  },
  {
    base: 118,
    billows: [
      [404, 106, 15],
      [432, 92, 23],
      [464, 86, 25],
      [494, 100, 17],
      [448, 106, 19],
    ],
  },
  {
    base: 186,
    billows: [
      [360, 178, 10],
      [380, 170, 16],
      [404, 176, 11],
    ],
  },
  {
    base: 62,
    billows: [
      [552, 54, 10],
      [572, 46, 16],
      [596, 48, 14],
    ],
  },
].map(({ base, billows }) => ({
  base,
  billows,
  crown: Math.min(...billows.map(([, y, r]) => y - r)),
}));

/**
 * Darkness of a sky with cumulus clouds, as in the IDEA poster's cloud
 * photo: the sky darkens toward the top; a cloud is nearly bare ground at its
 * lit crown and shades toward its flat base.
 */
function cloudField(u, v) {
  const x = u * UNITS.width;
  const y = v * UNITS.height;
  let darkness = 0.4 + 0.32 * Math.pow(1 - v, 1.2);
  for (const { base, billows, crown } of CLOUDS) {
    if (y > base + 2) continue;
    let edge = -Infinity;
    for (const [cx, cy, r] of billows) edge = Math.max(edge, r - Math.hypot(x - cx, y - cy));
    // Distance inside the silhouette in units; a 2-unit rim keeps it round in dots.
    const cover = clamp01(edge / 2) * clamp01((base + 2 - y) / 3);
    if (cover <= 0) continue;
    const depth = clamp01((y - crown) / (base - crown));
    const shade = 0.02 + 0.16 * depth ** 2;
    darkness = darkness * (1 - cover) + shade * cover;
  }
  return darkness;
}

const FIELDS = {
  demos: sheetField,
  blog: cloudField,
};

/** Alpha coverage of the dot grid for one field, one byte per pixel. */
function renderAlpha(field) {
  const { width, height } = PIXELS;
  const scale = width / UNITS.width; // px per unit
  const dots = [];
  for (let y = PITCH / 2; y < UNITS.height + PITCH; y += PITCH) {
    for (let x = PITCH / 2; x < UNITS.width + PITCH; x += PITCH) {
      const darkness = clamp01(field(x / UNITS.width, y / UNITS.height));
      const radius = PITCH * MAX_RADIUS * Math.sqrt(darkness);
      if (radius >= MIN_RADIUS) dots.push([x * scale, y * scale, radius * scale]);
    }
  }
  const alpha = new Float32Array(width * height);
  for (const [cx, cy, r] of dots) {
    const x0 = Math.max(0, Math.floor(cx - r - 1));
    const x1 = Math.min(width - 1, Math.ceil(cx + r + 1));
    const y0 = Math.max(0, Math.floor(cy - r - 1));
    const y1 = Math.min(height - 1, Math.ceil(cy + r + 1));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        // Signed distance at the pixel centre gives a one-pixel antialiased edge.
        const coverage = clamp01(r - Math.hypot(px + 0.5 - cx, py + 0.5 - cy) + 0.5);
        const index = py * width + px;
        if (coverage > alpha[index]) alpha[index] = coverage;
      }
    }
  }
  const grey = Buffer.alloc(width * height * 2);
  for (let index = 0; index < alpha.length; index++) {
    grey[index * 2] = 0;
    grey[index * 2 + 1] = Math.round(alpha[index] * 255);
  }
  return { grey, dots: dots.length };
}

function encode(grey) {
  return sharp(grey, { raw: { width: PIXELS.width, height: PIXELS.height, channels: 2 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function decodeAlpha(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(info.width * info.height);
  for (let index = 0; index < alpha.length; index++) alpha[index] = data[index * info.channels + info.channels - 1];
  return { alpha, width: info.width, height: info.height };
}

let stale = false;
await mkdir(OUTPUT_DIR, { recursive: true });
for (const [name, field] of Object.entries(FIELDS)) {
  const path = join(OUTPUT_DIR, `halftone-${name}.png`);
  const label = `public/plakat/halftone-${name}.png`;
  const { grey, dots } = renderAlpha(field);
  if (checkOnly) {
    if (!existsSync(path)) {
      console.error(`${label} is missing. Run: node scripts/plakat/build-halftone.mjs`);
      stale = true;
      continue;
    }
    const current = await decodeAlpha(path);
    const expected = Buffer.alloc(PIXELS.width * PIXELS.height);
    for (let index = 0; index < expected.length; index++) expected[index] = grey[index * 2 + 1];
    if (current.width !== PIXELS.width || current.height !== PIXELS.height || !current.alpha.equals(expected)) {
      console.error(`${label} is stale. Run: node scripts/plakat/build-halftone.mjs`);
      stale = true;
    } else {
      console.log(`${label} is up to date (${dots} dots).`);
    }
  } else {
    const png = await encode(grey);
    await writeFile(path, png);
    console.log(`Wrote ${label}: ${dots} dots, ${png.length} bytes.`);
  }
}
if (stale) process.exit(1);
