#!/usr/bin/env node
/**
 * build-type-metrics.mjs
 *
 * Writes src/lib/plakat/type-metrics.ts, the advance-width table behind the
 * poster headline fit rule (src/lib/plakat/fit.ts, SPEC §4):
 *
 * - the advance of every glyph that public/fonts/loehrning-sans-bold-v1.woff2
 *   maps (the code points come from the font's own cmap table);
 * - the kerning of every pair of title characters (letters, digits, German
 *   and French accents, title punctuation), as the browser shapes them;
 * - the ink of each figure 0 to 9 as horizontal bands, which plakat.test.tsx
 *   uses to hold the poster numerals clear of neighbouring shapes;
 * - the same figure advances, kerning and ink for
 *   public/fonts/loehrning-sans-regular-v1.woff2, the light autumn numeral
 *   (weight 400), so the 4.5% margin check covers every palette.
 *
 * Both are measured in Playwright's Chromium with canvas measureText at
 * 2048px, the font's units per em, so every value is a whole font unit.
 * opentype.js and fontkit are not installed; the WOFF2 cmap is read here with
 * Node's built-in Brotli.
 *
 * `--check` is non-mutating: it measures again and exits 1 when the committed
 * file differs. Regenerate with:
 *   node scripts/plakat/build-type-metrics.mjs
 *
 * Chromium: set PLAKAT_CHROMIUM (or PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) to a
 * Chromium binary when Playwright's own download is not installed.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const FONT_PATH = join(ROOT, "public", "fonts", "loehrning-sans-bold-v1.woff2");
const FONT_LABEL = "public/fonts/loehrning-sans-bold-v1.woff2";
const REGULAR_FONT_PATH = join(ROOT, "public", "fonts", "loehrning-sans-regular-v1.woff2");
const REGULAR_FONT_LABEL = "public/fonts/loehrning-sans-regular-v1.woff2";
const OUTPUT_PATH = join(ROOT, "src", "lib", "plakat", "type-metrics.ts");
const OUTPUT_LABEL = "src/lib/plakat/type-metrics.ts";

/**
 * Characters whose pair kerning is recorded. Poster titles are German and
 * English sentences; this covers them with room for loanwords.
 */
const KERNING_CHARACTERS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."0123456789",
  ..."\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df",
  ..."\u00e0\u00e1\u00e2\u00e9\u00e8\u00ea\u00eb\u00ed\u00ee\u00ef\u00f3\u00f4\u00f2\u00fa\u00fb\u00f9\u00e7\u00f1",
  ..."-.,:;?!'\"()&/",
  ..."\u201e\u201c\u201d\u201a\u2018\u2019\u2026\u2013\u2014\u00b7",
];

/** Horizontal bands per figure in the ink profile. */
const INK_BANDS = 24;

const checkOnly = process.argv.includes("--check");
const unexpectedArgs = process.argv.slice(2).filter((arg) => arg !== "--check");
if (unexpectedArgs.length > 0) {
  console.error(`Unknown argument(s): ${unexpectedArgs.join(", ")}`);
  process.exit(2);
}

// ─── WOFF2: table directory and the untransformed cmap and head tables ────

const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca",
  "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea",
  "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL",
  "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar",
  "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

function readWoff2Tables(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "wOF2") throw new Error(`${FONT_LABEL} is not a WOFF2 file`);
  const numTables = buffer.readUInt16BE(12);
  const totalCompressedSize = buffer.readUInt32BE(20);
  let offset = 48;
  const readBase128 = () => {
    let value = 0;
    for (let index = 0; index < 5; index++) {
      const byte = buffer[offset++];
      value = value * 128 + (byte & 0x7f);
      if ((byte & 0x80) === 0) return value;
    }
    throw new Error("Malformed UIntBase128 in the WOFF2 table directory");
  };
  const tables = [];
  for (let index = 0; index < numTables; index++) {
    const flags = buffer[offset++];
    let tag;
    if ((flags & 0x3f) === 0x3f) {
      tag = buffer.toString("ascii", offset, offset + 4);
      offset += 4;
    } else {
      tag = KNOWN_TAGS[flags & 0x3f];
    }
    const version = (flags >> 6) & 3;
    const origLength = readBase128();
    // glyf and loca are transformed at version 0; every other table at 1 to 3.
    const transformed = tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
    const length = transformed ? readBase128() : origLength;
    tables.push({ tag, length, transformed });
  }
  const stream = brotliDecompressSync(buffer.subarray(offset, offset + totalCompressedSize));
  const byTag = new Map();
  let position = 0;
  for (const table of tables) {
    byTag.set(table.tag, { ...table, data: stream.subarray(position, position + table.length) });
    position += table.length;
  }
  return byTag;
}

/** Every code point the font maps to a real glyph (cmap formats 4 and 12). */
function mappedCodePoints(cmap) {
  const found = new Set();
  const subtables = cmap.readUInt16BE(2);
  for (let index = 0; index < subtables; index++) {
    const start = cmap.readUInt32BE(8 + index * 8);
    const format = cmap.readUInt16BE(start);
    if (format === 4) {
      const segX2 = cmap.readUInt16BE(start + 6);
      const ends = start + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const rangeOffsets = deltas + segX2;
      for (let segment = 0; segment < segX2 / 2; segment++) {
        const end = cmap.readUInt16BE(ends + 2 * segment);
        const first = cmap.readUInt16BE(starts + 2 * segment);
        const delta = cmap.readInt16BE(deltas + 2 * segment);
        const rangeOffset = cmap.readUInt16BE(rangeOffsets + 2 * segment);
        for (let code = first; code <= end && code !== 0xffff; code++) {
          let glyph;
          if (rangeOffset === 0) {
            glyph = (code + delta) & 0xffff;
          } else {
            glyph = cmap.readUInt16BE(rangeOffsets + 2 * segment + rangeOffset + 2 * (code - first));
            if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
          }
          if (glyph !== 0) found.add(code);
        }
      }
    } else if (format === 12) {
      const groups = cmap.readUInt32BE(start + 12);
      for (let group = 0; group < groups; group++) {
        const first = cmap.readUInt32BE(start + 16 + 12 * group);
        const last = cmap.readUInt32BE(start + 20 + 12 * group);
        const glyph = cmap.readUInt32BE(start + 24 + 12 * group);
        for (let code = first; code <= last; code++) if (glyph + (code - first) !== 0) found.add(code);
      }
    }
  }
  // Control characters are never set; C0 and C1 stay out of the table.
  return [...found].filter((code) => code >= 0x20 && (code < 0x7f || code > 0x9f)).sort((a, b) => a - b);
}

// ─── Measurement in Chromium ───────────────────────────────────────────────

async function launchChromium() {
  const require = createRequire(join(ROOT, "package.json"));
  const { chromium } = require("@playwright/test");
  const candidates = [
    process.env.PLAKAT_CHROMIUM,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    chromium.executablePath(),
  ].filter(Boolean);
  const executablePath = candidates.find((path) => existsSync(path));
  if (!executablePath) {
    throw new Error(
      "No Chromium found. Set PLAKAT_CHROMIUM to a Chromium binary or install Playwright's Chromium.",
    );
  }
  return chromium.launch({ executablePath });
}

async function measure(fontBytes, regularBytes, codePoints, unitsPerEm) {
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><html><body></body></html>");
    return await page.evaluate(
      async ({ base64, regularBase64, codes, pairChars, size, bandCount }) => {
        const loadFace = async (family, data, weight) => {
          const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
          const face = new FontFace(family, bytes.buffer, { weight });
          await face.load();
          document.fonts.add(face);
        };
        await loadFace("PlakatMetricsProbe", base64, "700");
        await loadFace("PlakatMetricsRegular", regularBase64, "400");
        const context = document.createElement("canvas").getContext("2d");
        context.font = `700 ${size}px "PlakatMetricsProbe"`;
        const width = (text) => context.measureText(text).width;
        const advances = {};
        for (const code of codes) advances[String.fromCodePoint(code)] = Math.round(width(String.fromCodePoint(code)));
        const kerning = {};
        for (const first of pairChars) {
          for (const second of pairChars) {
            const delta = Math.round(width(first + second) - width(first) - width(second));
            if (delta !== 0) kerning[first + second] = delta;
          }
        }
        // Ink of each figure: draw it at the full em size, scan the alpha
        // channel row by row, and fold the rows into bands of left and right
        // extents. Units: font units, x from the pen, y from the baseline
        // (negative above it).
        const pad = Math.round(size * 0.25);
        const canvas = document.createElement("canvas");
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ink = canvas.getContext("2d", { willReadFrequently: true });
        const inkOf = (font) => {
          ink.font = font;
          const figureInk = {};
          for (const figure of "0123456789") {
            ink.clearRect(0, 0, canvas.width, canvas.height);
            ink.fillStyle = "#000";
            const baseline = pad + size;
            ink.fillText(figure, pad, baseline);
            const { data } = ink.getImageData(0, 0, canvas.width, canvas.height);
            const rows = [];
            for (let y = 0; y < canvas.height; y++) {
              let left = -1;
              let right = -1;
              for (let x = 0; x < canvas.width; x++) {
                if (data[(y * canvas.width + x) * 4 + 3] > 0) {
                  if (left < 0) left = x;
                  right = x + 1;
                }
              }
              if (left >= 0) rows.push([y, left, right]);
            }
            const top = rows[0][0];
            const bottom = rows[rows.length - 1][0] + 1;
            const bands = [];
            for (let band = 0; band < bandCount; band++) {
              const from = top + Math.floor(((bottom - top) * band) / bandCount);
              const to = top + Math.floor(((bottom - top) * (band + 1)) / bandCount);
              const inBand = rows.filter(([y]) => y >= from && y < to);
              if (inBand.length === 0) continue;
              bands.push([
                from - baseline,
                to - baseline,
                Math.min(...inBand.map(([, left]) => left)) - pad,
                Math.max(...inBand.map(([, , right]) => right)) - pad,
              ]);
            }
            figureInk[figure] = bands;
          }
          return figureInk;
        };
        const figureInk = inkOf(`700 ${size}px "PlakatMetricsProbe"`);
        // The light autumn numeral: figure advances, figure pair kerning and ink at 400.
        const regular = document.createElement("canvas").getContext("2d");
        regular.font = `400 ${size}px "PlakatMetricsRegular"`;
        const regularWidth = (text) => regular.measureText(text).width;
        const regularAdvances = {};
        const regularKerning = {};
        for (const first of "0123456789") {
          regularAdvances[first] = Math.round(regularWidth(first));
          for (const second of "0123456789") {
            const delta = Math.round(regularWidth(first + second) - regularWidth(first) - regularWidth(second));
            if (delta !== 0) regularKerning[first + second] = delta;
          }
        }
        const regularInk = inkOf(`400 ${size}px "PlakatMetricsRegular"`);
        return { advances, kerning, figureInk, regularAdvances, regularKerning, regularInk };
      },
      {
        base64: fontBytes.toString("base64"),
        regularBase64: regularBytes.toString("base64"),
        codes: codePoints,
        pairChars: KERNING_CHARACTERS,
        size: unitsPerEm,
        bandCount: INK_BANDS,
      },
    );
  } finally {
    await browser.close();
  }
}

// ─── Output ────────────────────────────────────────────────────────────────

/** A TypeScript string literal with ASCII escapes, so the file stays ASCII. */
function literal(text) {
  let out = '"';
  for (const character of text) {
    const code = character.codePointAt(0);
    if (character === '"' || character === "\\") out += `\\${character}`;
    else if (code >= 0x20 && code < 0x7f) out += character;
    else out += `\\u${code.toString(16).padStart(4, "0")}`;
  }
  return `${out}"`;
}

function inkBlock(figureInk) {
  return Object.entries(figureInk)
    .map(
      ([figure, bands]) =>
        `  ${literal(figure)}: [\n${bands.map((band) => `    [${band.join(", ")}],`).join("\n")}\n  ],`,
    )
    .join("\n");
}

function numberBlock(values) {
  return Object.entries(values)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `  ${literal(key)}: ${value},`)
    .join("\n");
}

function render({
  sha256,
  regularSha256,
  unitsPerEm,
  ascender,
  descender,
  advances,
  kerning,
  figureInk,
  regularAdvances,
  regularKerning,
  regularInk,
}) {
  const advanceLines = Object.entries(advances)
    .sort(([a], [b]) => a.codePointAt(0) - b.codePointAt(0))
    .map(([character, value]) => `  ${literal(character)}: ${value},`);
  const kerningLines = Object.entries(kerning)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([pair, value]) => `  ${literal(pair)}: ${value},`);
  return `// Generated by scripts/plakat/build-type-metrics.mjs. Do not edit by hand.
// Source: ${FONT_LABEL} (sha256 ${sha256}).
// Measured in Chromium with canvas measureText at ${unitsPerEm}px, the font's
// units per em, so every value is a whole font unit. Regenerate with
//   node scripts/plakat/build-type-metrics.mjs
// and check with --check. src/lib/plakat/fit.ts reads this table.

/** sha256 of the measured font file; fit.test.ts compares it with the file on disk. */
export const TYPE_METRICS_FONT_SHA256 = ${literal(sha256)};

/** Font units per em: divide an advance or a kerning value by this for em. */
export const UNITS_PER_EM = ${unitsPerEm};

/**
 * hhea ascender and descender in font units (the descender is negative).
 * Text renderers without a DOM (Satori in OG images) place the baseline
 * from these, so og.tsx uses them to set a numeral on a poster.
 */
export const BOLD_ASCENDER = ${ascender};
export const BOLD_DESCENDER = ${descender};

/** Advance width of every glyph the font maps, in font units. */
export const BOLD_ADVANCES: Readonly<Record<string, number>> = {
${advanceLines.join("\n")}
};

/**
 * Pair kerning between title characters, in font units, as Chromium shapes
 * the pair (negative tightens). Pairs not listed are 0.
 */
export const BOLD_KERNING: Readonly<Record<string, number>> = {
${kerningLines.join("\n")}
};

/**
 * Ink of each bold figure as ${INK_BANDS} horizontal bands [top, bottom, left, right]
 * in font units: x from the pen position, y from the baseline (negative
 * above it). plakat.test.tsx checks numeral clearance against it.
 */
export const BOLD_FIGURE_INK: Readonly<
  Record<string, readonly (readonly [number, number, number, number])[]>
> = {
${inkBlock(figureInk)}
};

/** sha256 of ${REGULAR_FONT_LABEL}, the light autumn numeral (weight 400). */
export const REGULAR_FONT_SHA256 = ${literal(regularSha256)};

/** Advance of each regular (400) figure, in font units. */
export const REGULAR_FIGURE_ADVANCES: Readonly<Record<string, number>> = {
${numberBlock(regularAdvances)}
};

/** Pair kerning between regular (400) figures, in font units. Pairs not listed are 0. */
export const REGULAR_FIGURE_KERNING: Readonly<Record<string, number>> = {
${numberBlock(regularKerning)}
};

/** Ink of each regular (400) figure, in the same bands as BOLD_FIGURE_INK. */
export const REGULAR_FIGURE_INK: Readonly<
  Record<string, readonly (readonly [number, number, number, number])[]>
> = {
${inkBlock(regularInk)}
};
`;
}

const fontBytes = readFileSync(FONT_PATH);
const sha256 = createHash("sha256").update(fontBytes).digest("hex");
const tables = readWoff2Tables(fontBytes);
const cmap = tables.get("cmap");
const head = tables.get("head");
if (!cmap || cmap.transformed || !head || head.transformed) {
  throw new Error(`${FONT_LABEL}: expected untransformed cmap and head tables`);
}
const unitsPerEm = head.data.readUInt16BE(18);
const hhea = tables.get("hhea");
if (!hhea || hhea.transformed) throw new Error(`${FONT_LABEL}: expected an untransformed hhea table`);
const ascender = hhea.data.readInt16BE(4);
const descender = hhea.data.readInt16BE(6);
const codePoints = mappedCodePoints(cmap.data);
const missing = KERNING_CHARACTERS.filter((character) => !codePoints.includes(character.codePointAt(0)));
if (missing.length > 0) throw new Error(`${FONT_LABEL} does not map: ${missing.join(" ")}`);

const regularBytes = readFileSync(REGULAR_FONT_PATH);
const regularSha256 = createHash("sha256").update(regularBytes).digest("hex");
const measured = await measure(fontBytes, regularBytes, codePoints, unitsPerEm);
const output = render({ sha256, regularSha256, unitsPerEm, ascender, descender, ...measured });

if (checkOnly) {
  const current = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : "";
  if (current !== output) {
    console.error(`${OUTPUT_LABEL} is stale. Run: node scripts/plakat/build-type-metrics.mjs`);
    process.exit(1);
  }
  console.log(
    `${OUTPUT_LABEL} is up to date (${codePoints.length} glyphs, ${Object.keys(measured.kerning).length} kerning pairs).`,
  );
} else {
  writeFileSync(OUTPUT_PATH, output);
  console.log(
    `Wrote ${OUTPUT_LABEL}: ${codePoints.length} glyphs, ${Object.keys(measured.kerning).length} kerning pairs.`,
  );
}
