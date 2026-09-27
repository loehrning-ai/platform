#!/usr/bin/env node
/**
 * Social cards of the four workshops (Werkzeichnung v2, SPEC §3.15):
 * public/workshops/<slug>/card-preview.webp at 1200 x 630.
 *
 *   left   the scene ground with the caps line (the workshop's eyebrow), the
 *          title head at poster size and the subtitle, all in the scene ink
 *   right  504 wide: the workshop's portrait poster with its numeral
 *   foot   an 80px Kalkweiß colophon strip under the text column with the
 *          header lockup (the 38px Mennige L tile and the ink wordmark) and
 *          the workshop's format; the tile would vanish on Rost (1.07:1)
 *          and Ultramarin (2.21:1), so it keeps its paper
 *
 * Copy comes from src/lib/workshops.ts (German, the site's default locale),
 * colours, motifs and numerals from src/lib/plakat, the type is Loehrning Sans
 * from public/fonts. Chromium (Playwright) renders the card at twice the size;
 * sharp scales it down and encodes WebP.
 *
 * scripts/plakat/cards.lock.json records, per card, the sha256 of the rendered
 * input (markup, copy, colours, fonts and the render settings) and of the WebP written from it, so
 * --check needs no browser: it fails when the copy, the palette, the geometry
 * or a font changed since the last build, or when a card file no longer is
 * the one built from its input.
 *
 * Usage (from packages/website or anywhere; needs Playwright's Chromium, or
 * PLAKAT_CHROMIUM=/path/to/chromium):
 *   node scripts/plakat/build-cards.mjs          render and write every card
 *   node scripts/plakat/build-cards.mjs --check  write nothing; exit 1 when a card is stale
 * Then, for Workshop 03, node scripts/course03/refresh-published.mjs (bundle
 * manifest), and update the ASSET_MANIFEST.json rows of the other three with
 * node scripts/scaffold-asset.mjs.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire, register } from "node:module";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { coverPosterSvg, PAPER, PLAKAT, PUBLIC_WORKSHOPS, REPO, WEBSITE, workshopScenes } from "./static-lib.mjs";

const CHECK = process.argv.includes("--check");
const LOCK = join(WEBSITE, "scripts/plakat/cards.lock.json");
const WIDTH = 1200;
const HEIGHT = 630;
const ART_WIDTH = 504;
const COLOPHON_HEIGHT = 80;
const INSET = 56;
const SCALE = 2;
/** Title fit (poster size down to the floor), resize kernel and WebP settings: part of the lock's input hash. */
const FIT = { from: 76, floor: 44, step: 2, maxLines: 3 };
const KERNEL = "lanczos3";
const WEBP = { quality: 90, effort: 6, smartSubsample: true };
/** Below this contrast the Kalkweiß strip gets a 2px scene-ink top rule, so it still reads as a panel (IDEA: Kreide 1.05:1). */
const STRIP_RULE_BELOW = 1.5;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// src/lib/workshops.ts imports its siblings without an extension, as the Next
// toolchain allows; resolve those to .ts for Node's type stripping.
register(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\\.[cm]?[jt]sx?$/.test(specifier)) {
      return next(specifier + ".ts", context);
    }
    throw error;
  }
}`)}`,
);
const { getWorkshops } = await import(pathToFileURL(join(WEBSITE, "src/lib/workshops.ts")).href);
const { splitTitle } = await import(pathToFileURL(join(WEBSITE, "src/app/workshops/workshop-title.ts")).href);

const FONTS = [
  [400, "loehrning-sans-regular-v1.woff2"],
  [600, "loehrning-sans-semibold-v1.woff2"],
  [700, "loehrning-sans-bold-v1.woff2"],
].map(([weight, file]) => {
  const bytes = readFileSync(join(WEBSITE, "public/fonts", file));
  return { weight, file, bytes, sha: sha256(bytes) };
});

/** WCAG contrast ratio of two #rrggbb colours. */
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Poster size, then smaller until the title fits its column: no word wider than the column, at most
 * FIT.maxLines lines, and the block clear of the colophon strip. Runs in the page; its source is hashed.
 */
function fitTitle({ from, floor, step, maxLines }) {
  const text = document.querySelector(".text");
  const title = document.querySelector("h1");
  const fits = () => {
    const range = document.createRange();
    range.selectNodeContents(title);
    const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
    return title.scrollWidth <= title.clientWidth && lines <= maxLines && text.scrollHeight <= text.clientHeight;
  };
  for (let size = from; size >= floor && !fits(); size -= step) title.style.fontSize = `${size - step}px`;
}

const RENDER = JSON.stringify({ WIDTH, HEIGHT, SCALE, FIT, KERNEL, WEBP, fitTitle: fitTitle.toString() });

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The card's markup. Fonts are referenced by name here and embedded at render time. */
function cardMarkup({ scene, workshop }) {
  const palette = PLAKAT[scene.plakat];
  const title = splitTitle(workshop.title);
  const autumn = scene.plakat === "autumn";
  const poster = coverPosterSvg(scene).trim();
  const textWidth = WIDTH - ART_WIDTH - 2 * INSET;
  const stripRule = contrast(palette.ground, PAPER.kalkweiss) < STRIP_RULE_BELOW ? `;border-top:2px solid ${palette.ink}` : "";
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><style>
@font-face-placeholder
*{box-sizing:border-box;margin:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{position:relative;background:${palette.ground};color:${palette.ink};font-family:"Loehrning Sans",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.art{position:absolute;top:0;right:0;width:${ART_WIDTH}px;height:${HEIGHT}px}
.art svg{display:block;width:100%;height:100%}
.text{position:absolute;top:${INSET}px;left:${INSET}px;width:${textWidth}px;bottom:${COLOPHON_HEIGHT + 40}px;display:flex;flex-direction:column}
.caps{font-size:${autumn ? 17 : 16}px;line-height:1.3;font-weight:600;letter-spacing:${autumn ? "0.12em" : "0.16em"};text-transform:uppercase;font-variant-numeric:tabular-nums}
h1{margin-top:22px;font-size:${FIT.from}px;line-height:0.92;letter-spacing:-0.04em;font-weight:700;text-wrap:balance;padding-bottom:0.06em}
.sub{margin-top:18px;font-size:30px;line-height:1.2;letter-spacing:-0.01em;font-weight:600;text-wrap:balance}
.colophon{position:absolute;left:0;bottom:0;width:${WIDTH - ART_WIDTH}px;height:${COLOPHON_HEIGHT}px;display:flex;align-items:center;justify-content:space-between;padding:0 ${INSET}px;background:${PAPER.kalkweiss};color:${PAPER.druckschwarz}${stripRule}}
.lockup{display:flex;align-items:center}
.tile{display:flex;align-items:center;justify-content:center;width:38px;height:38px;margin-right:12px;background:${PAPER.mennige};color:${PAPER.bogen};font-size:18px;font-weight:700;line-height:1}
.wordmark{font-size:20px;font-weight:700;line-height:1;letter-spacing:-0.015em}
.trailing{font-size:18px;font-weight:400;line-height:1}
</style></head><body>
<div class="art">${poster}</div>
<div class="text">
<p class="caps">${escapeHtml(workshop.eyebrow)}</p>
<h1>${escapeHtml(title.head)}${title.subtitle ? ":" : ""}</h1>
${title.subtitle ? `<p class="sub">${escapeHtml(title.subtitle)}</p>` : ""}
</div>
<div class="colophon"><div class="lockup"><div class="tile">L</div><div class="wordmark">loehrning.ai</div></div><div class="trailing">${escapeHtml(workshop.format)}</div></div>
</body></html>
`;
}

function withFonts(markup) {
  const faces = FONTS.map(
    ({ weight, bytes }) =>
      `@font-face{font-family:"Loehrning Sans";font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2")}`,
  ).join("\n");
  return markup.replace("@font-face-placeholder", faces);
}

/** sha256 of what the render depends on: the markup, the font files it embeds and the render settings. */
function inputHash(markup) {
  return sha256(`${markup}\n${FONTS.map(({ file, sha }) => `${file} ${sha}`).join("\n")}\n${RENDER}`);
}

/** Width and height from a WebP file's VP8, VP8L or VP8X header. */
export function webpSize(bytes) {
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") throw new Error("not a WebP file");
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (chunk === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  throw new Error(`unknown WebP chunk ${chunk}`);
}

const workshops = new Map(getWorkshops("de").map((workshop) => [workshop.slug, workshop]));
const cards = workshopScenes().map((scene) => {
  const workshop = workshops.get(scene.slug);
  if (!workshop) throw new Error(`No German workshop for ${scene.slug}`);
  if (workshop.number !== scene.numeral) throw new Error(`${scene.slug}: catalogue number ${workshop.number} is not the poster numeral ${scene.numeral}`);
  const markup = cardMarkup({ scene, workshop });
  return { scene, file: join(PUBLIC_WORKSHOPS, scene.slug, "card-preview.webp"), markup, input: inputHash(markup) };
});

/** One read, no separate existence check: a missing lock (ENOENT) starts empty. */
function readLock() {
  try {
    return JSON.parse(readFileSync(LOCK, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return { version: 1, cards: {} };
    throw error;
  }
}

const lock = readLock();

if (CHECK) {
  const problems = [];
  for (const { scene, file, input } of cards) {
    const entry = lock.cards?.[scene.slug];
    const name = relative(REPO, file);
    if (!entry) {
      problems.push(`${name}: not in scripts/plakat/cards.lock.json`);
      continue;
    }
    if (entry.input !== input) problems.push(`${name}: its copy, palette, poster, fonts or render settings changed since the card was built`);
    if (!existsSync(file)) {
      problems.push(`${name}: missing`);
      continue;
    }
    const bytes = readFileSync(file);
    if (sha256(bytes) !== entry.output) problems.push(`${name}: the file is not the card built from its input`);
    const { width, height } = webpSize(bytes);
    if (width !== WIDTH || height !== HEIGHT) problems.push(`${name}: ${width} x ${height}, expected ${WIDTH} x ${HEIGHT}`);
  }
  if (problems.length) {
    console.error(`Stale social cards (run node packages/website/scripts/plakat/build-cards.mjs):\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`Social cards up to date (${cards.length} cards, ${WIDTH} x ${HEIGHT}).`);
  process.exit(0);
}

const require = createRequire(join(WEBSITE, "package.json"));
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const executablePath = [process.env.PLAKAT_CHROMIUM, process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, "/opt/pw-browsers/chromium", chromium.executablePath()]
  .filter(Boolean)
  .find((path) => existsSync(path));
if (!executablePath) throw new Error("No Chromium found. Set PLAKAT_CHROMIUM to a Chromium binary.");

const browser = await chromium.launch({ executablePath });
const written = [];
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: SCALE });
  for (const card of cards) {
    await page.setContent(withFonts(card.markup), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(fitTitle, FIT);
    const png = await page.screenshot({ type: "png" });
    const webp = await sharp(png).resize(WIDTH, HEIGHT, { kernel: KERNEL }).webp(WEBP).toBuffer();
    writeFileSync(card.file, webp);
    lock.cards[card.scene.slug] = { input: card.input, output: sha256(webp), width: WIDTH, height: HEIGHT };
    written.push(`${relative(REPO, card.file)} (${webp.length} bytes)`);
  }
} finally {
  await browser.close();
}
lock.version = 1;
lock.cards = Object.fromEntries(Object.entries(lock.cards).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
console.log(`Wrote ${written.length} cards:\n  ${written.join("\n  ")}`);
console.log("Next: node scripts/course03/refresh-published.mjs (Workshop 03) and the ASSET_MANIFEST.json rows of the others.");
