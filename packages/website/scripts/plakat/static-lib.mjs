/**
 * Shared pieces of the static poster generators (Werkzeichnung v2, SPEC §3.15):
 * scripts/plakat/build-static.mjs (deck cover posters and the --cover-* scene
 * tokens of the static workshop folders) and scripts/plakat/build-cards.mjs
 * (the 1200 x 630 social cards).
 *
 * Colours, motifs and numerals come from src/lib/plakat (palettes.ts,
 * motifs.ts, poster-svg.ts), loaded with Node's type stripping, so the files
 * these scripts write show the same drawing as the site's posters and use no
 * second palette mapping.
 *
 * A poster file is used as an <img> or a CSS background, where the page's web
 * fonts do not reach. The numeral is therefore drawn as outlines: the digits
 * of Figtree (src/fonts/Figtree-{Bold,Regular}.ttf) are read from
 * the font's glyf table and placed where numeralLayout() sets the site's
 * numeral, with the same tracking, kerning and ground-coloured keyline.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const WEBSITE = resolve(HERE, "../..");
export const REPO = resolve(WEBSITE, "../..");
export const PUBLIC_WORKSHOPS = join(WEBSITE, "public/workshops");

const lib = (name) => import(pathToFileURL(join(WEBSITE, "src/lib/plakat", name)).href);
const palettes = await lib("palettes.ts");
const motifs = await lib("motifs.ts");
const posterSvgModule = await lib("poster-svg.ts");
const typeMetrics = await lib("type-metrics.ts");

export const { PLAKAT, WORKSHOP_PLAKAT, PAPER } = palettes;
export const { numeralLayout, POSTER_CANVAS } = motifs;
export const { posterSvg } = posterSvgModule;

/** Workshop slugs in series order (01 to 04), with their scene and motif. */
export function workshopScenes() {
  return Object.entries(WORKSHOP_PLAKAT).map(([slug, { plakat, motif }], index) => ({
    slug,
    plakat,
    motif,
    numeral: String(index + 1).padStart(2, "0"),
    palette: PLAKAT[plakat],
  }));
}

// ─── TrueType outlines ──────────────────────────────────────────────────────

const FONT_FILES = {
  700: join(WEBSITE, "src/fonts/Figtree-Bold.ttf"),
  400: join(WEBSITE, "src/fonts/Figtree-Regular.ttf"),
};

function parseFont(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tables = {};
  const count = view.getUint16(4);
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 16;
    const tag = String.fromCharCode(...bytes.subarray(at, at + 4));
    tables[tag] = { offset: view.getUint32(at + 8), length: view.getUint32(at + 12) };
  }
  for (const tag of ["head", "hhea", "hmtx", "cmap", "loca", "glyf", "maxp"]) {
    if (!tables[tag]) throw new Error(`Font has no ${tag} table (a glyf-based TrueType file is required)`);
  }
  const unitsPerEm = view.getUint16(tables.head.offset + 18);
  const longLoca = view.getInt16(tables.head.offset + 50) === 1;
  const numGlyphs = view.getUint16(tables.maxp.offset + 4);
  const numberOfHMetrics = view.getUint16(tables.hhea.offset + 34);

  // cmap: the Windows Unicode BMP subtable (format 4) is enough for digits.
  const cmap = tables.cmap.offset;
  let format4 = null;
  for (let i = 0; i < view.getUint16(cmap + 2); i++) {
    const record = cmap + 4 + i * 8;
    const offset = cmap + view.getUint32(record + 4);
    if (view.getUint16(record) === 3 && view.getUint16(record + 2) === 1 && view.getUint16(offset) === 4) format4 = offset;
  }
  if (format4 === null) throw new Error("Font has no format 4 Unicode cmap");
  const glyphIndex = (codePoint) => {
    const segX2 = view.getUint16(format4 + 6);
    const ends = format4 + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const rangeOffsets = deltas + segX2;
    for (let i = 0; i < segX2 / 2; i++) {
      const end = view.getUint16(ends + i * 2);
      if (codePoint > end) continue;
      const start = view.getUint16(starts + i * 2);
      if (codePoint < start) return 0;
      const delta = view.getInt16(deltas + i * 2);
      const rangeOffset = view.getUint16(rangeOffsets + i * 2);
      if (rangeOffset === 0) return (codePoint + delta) & 0xffff;
      const at = rangeOffsets + i * 2 + rangeOffset + (codePoint - start) * 2;
      const glyph = view.getUint16(at);
      return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
  };

  const advance = (glyph) =>
    view.getUint16(tables.hmtx.offset + Math.min(glyph, numberOfHMetrics - 1) * 4);

  const glyphRange = (glyph) => {
    if (glyph >= numGlyphs) throw new Error(`Glyph ${glyph} out of range`);
    const loca = tables.loca.offset;
    const [start, end] = longLoca
      ? [view.getUint32(loca + glyph * 4), view.getUint32(loca + glyph * 4 + 4)]
      : [view.getUint16(loca + glyph * 2) * 2, view.getUint16(loca + glyph * 2 + 2) * 2];
    return [tables.glyf.offset + start, end - start];
  };

  /** Contours of a simple glyph as arrays of { x, y, on } points in font units. */
  const contours = (glyph) => {
    const [at, length] = glyphRange(glyph);
    if (length === 0) return [];
    const numberOfContours = view.getInt16(at);
    if (numberOfContours < 0) throw new Error(`Glyph ${glyph} is composite; only simple glyphs are supported`);
    let p = at + 10;
    const endPoints = [];
    for (let i = 0; i < numberOfContours; i++, p += 2) endPoints.push(view.getUint16(p));
    const points = endPoints.length ? endPoints[endPoints.length - 1] + 1 : 0;
    p += 2 + view.getUint16(p); // skip instructions
    const flags = [];
    while (flags.length < points) {
      const flag = view.getUint8(p++);
      flags.push(flag);
      if (flag & 8) {
        const repeat = view.getUint8(p++);
        for (let r = 0; r < repeat; r++) flags.push(flag);
      }
    }
    const read = (shortBit, sameBit) => {
      const values = [];
      let value = 0;
      for (const flag of flags) {
        if (flag & shortBit) {
          const delta = view.getUint8(p++);
          value += flag & sameBit ? delta : -delta;
        } else if (!(flag & sameBit)) {
          value += view.getInt16(p);
          p += 2;
        }
        values.push(value);
      }
      return values;
    };
    const xs = read(2, 16);
    const ys = read(4, 32);
    const result = [];
    let start = 0;
    for (const end of endPoints) {
      const contour = [];
      for (let i = start; i <= end; i++) contour.push({ x: xs[i], y: ys[i], on: (flags[i] & 1) === 1 });
      result.push(contour);
      start = end + 1;
    }
    return result;
  };

  return { unitsPerEm, glyphIndex, advance, contours };
}

const fonts = new Map();
function font(weight) {
  if (!fonts.has(weight)) fonts.set(weight, parseFont(readFileSync(FONT_FILES[weight])));
  return fonts.get(weight);
}

const n1 = (value) => {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

/** One TrueType contour (quadratic, on and off curve points) as SVG path data. */
function contourPath(points, place) {
  if (!points.length) return "";
  const at = (point) => place(point.x, point.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });
  // Start on an on-curve point; if none, start at the midpoint of the first two.
  let first = points.findIndex((point) => point.on);
  let ring;
  if (first === -1) {
    ring = [mid(points[0], points[1]), ...points.slice(1), points[0]];
    first = 0;
  } else {
    ring = [...points.slice(first), ...points.slice(0, first)];
  }
  const [sx, sy] = at(ring[0]);
  let d = `M${n1(sx)} ${n1(sy)}`;
  for (let i = 1; i <= ring.length; i++) {
    const point = ring[i % ring.length];
    const previous = ring[i - 1];
    if (point.on) {
      if (previous.on || i === 1) {
        const [x, y] = at(point);
        d += `L${n1(x)} ${n1(y)}`;
      }
      continue;
    }
    const next = ring[(i + 1) % ring.length];
    const end = next.on ? next : mid(point, next);
    const [cx, cy] = at(point);
    const [ex, ey] = at(end);
    d += `Q${n1(cx)} ${n1(cy)} ${n1(ex)} ${n1(ey)}`;
    if (next.on) i++;
  }
  return `${d}Z`;
}

function kerning(weight, pair) {
  const table = weight === 400 ? typeMetrics.REGULAR_FIGURE_KERNING : typeMetrics.BOLD_KERNING;
  return table[pair] ?? 0;
}

/**
 * The numeral as outline path data, set as the site sets its SVG text: the
 * pen starts at `x`, the baseline is `y`, every glyph advances by its width
 * plus the pair kerning plus the letter-spacing.
 */
export function numeralPath(text, { x, y, fontSize, letterSpacing, fontWeight }) {
  const face = font(fontWeight);
  const scale = fontSize / face.unitsPerEm;
  let pen = x;
  let d = "";
  const characters = [...text];
  characters.forEach((character, index) => {
    const glyph = face.glyphIndex(character.codePointAt(0));
    if (!glyph) throw new Error(`Figtree has no glyph for ${JSON.stringify(character)}`);
    const origin = pen;
    const place = (gx, gy) => [origin + gx * scale, y - gy * scale];
    d += face.contours(glyph).map((contour) => contourPath(contour, place)).join("");
    const next = characters[index + 1];
    pen += face.advance(glyph) * scale + letterSpacing + (next ? kerning(fontWeight, character + next) * scale : 0);
  });
  return d;
}

// ─── Poster files ───────────────────────────────────────────────────────────

/**
 * The workshop's portrait poster (400 x 500) as a standalone SVG file, with
 * the numeral in outlines. The oversized ground fills whatever box the file is
 * drawn in, and xMaxYMax meet keeps the poster against the box's right and
 * bottom edges, as the site's band art does.
 */
export function coverPosterSvg({ plakat, motif, numeral }) {
  const base = posterSvg({ plakat, motif, numeral: null, format: "portrait" });
  if (!numeral) return `${base}\n`;
  const layout = numeralLayout(plakat, "portrait");
  const palette = PLAKAT[plakat];
  const fill = layout.role === "mid" ? palette.mid : palette.ink;
  const numeralMarkup =
    `<path data-numeral="${numeral}" d="${numeralPath(numeral, layout)}" fill="${fill}" ` +
    `stroke="${palette.ground}" stroke-width="${layout.keyline}" stroke-linejoin="round" paint-order="stroke fill"/>`;
  return `${base.replace(/<\/svg>$/, `${numeralMarkup}</svg>`)}\n`;
}

/**
 * The phone strip (a 400 x 128 canvas that stretches to any width): the
 * numeral against the left edge, the motif's window against the bottom-right
 * corner, as the site's band strip. The root has no size of its own, so an
 * <img> sized by CSS (width 100%, height 128px) lays it out like the React
 * strip.
 */
export function stripPosterSvg({ plakat, motif, numeral }) {
  const base = posterSvg({ plakat, motif, numeral: null, format: "strip" }).replace(/ width="\d+" height="\d+"/, "");
  if (!numeral) return `${base}\n`;
  const layout = numeralLayout(plakat, "strip");
  const palette = PLAKAT[plakat];
  const fill = layout.role === "mid" ? palette.mid : palette.ink;
  const { width, height } = POSTER_CANVAS.strip;
  const numeralMarkup =
    `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMax meet" overflow="visible">` +
    `<path data-numeral="${numeral}" d="${numeralPath(numeral, layout)}" fill="${fill}" ` +
    `stroke="${palette.ground}" stroke-width="${layout.keyline}" stroke-linejoin="round" paint-order="stroke fill"/></svg>`;
  return `${base.replace(/<\/svg>$/, `${numeralMarkup}</svg>`)}\n`;
}

/** The --cover-* scene tokens of a workshop, in the order they are written. */
export function coverTokens(plakat) {
  const palette = PLAKAT[plakat];
  return [
    ["--cover-ground", palette.ground],
    ["--cover-ink", palette.ink],
    ["--cover-mid", palette.mid],
    ["--cover-line", palette.line],
  ];
}

export const COVER_BLOCK_START = "/* plakat:cover-scene: generated by scripts/plakat/build-static.mjs from src/lib/plakat/palettes.ts; do not edit by hand */";
export const COVER_BLOCK_END = "/* /plakat:cover-scene */";

/**
 * The marker-delimited :root block with the workshop's scene: ground, ink and
 * mid of the cover, and the scene's ink on paper for the Kopflinie.
 */
export function coverBlock(plakat) {
  const body = coverTokens(plakat).map(([name, value]) => `  ${name}: ${value};`).join("\n");
  return `${COVER_BLOCK_START}\n:root {\n${body}\n}\n${COVER_BLOCK_END}`;
}

/** Replace the cover block in a CSS text, or append it (after one blank line). */
export function withCoverBlock(css, plakat) {
  const block = coverBlock(plakat);
  const start = css.indexOf(COVER_BLOCK_START);
  if (start !== -1) {
    const end = css.indexOf(COVER_BLOCK_END, start);
    if (end === -1) throw new Error("Unterminated plakat:cover-scene block");
    return css.slice(0, start) + block + css.slice(end + COVER_BLOCK_END.length);
  }
  return `${css.replace(/\s*$/, "")}\n\n${block}\n`;
}

/**
 * The same block inside an HTML page's first <style> element (pages that
 * carry their tokens inline and load no tokens.css), placed right after the
 * opening tag so the page's own rules can read it.
 */
export function withCoverBlockInHtml(html, plakat) {
  if (html.includes(COVER_BLOCK_START)) return withCoverBlock(html, plakat);
  const open = html.search(/<style>\n/);
  if (open === -1) throw new Error("No <style> element to hold the cover scene block");
  const at = open + "<style>\n".length;
  return `${html.slice(0, at)}${coverBlock(plakat)}\n${html.slice(at)}`;
}
