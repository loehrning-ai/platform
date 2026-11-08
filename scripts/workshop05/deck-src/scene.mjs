/**
 * Drawings and small helpers the redesigned Workshop 05 slides share. Everything here is markup or a pure function: line
 * drawings in currentColor (stroke 3 on a 120 box), the outline of North Macedonia from the deck's own geo file, number
 * and duration formats. No text lives inside an SVG (the words test skips svg and a label there would be invisible to it);
 * labels are HTML on top of the drawing.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GEO_FILE = path.resolve(HERE, "../../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib/geo.js");

/** "26,484" in English, "26.484" in German (the same grouping scenes.js writes while a count runs). */
export const numFmt = (n, lang) => new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB", { useGrouping: true, maximumFractionDigits: 0 }).format(n);

/** The seconds of a recorded turn as "60 s" (or "2 min 5 s"), read from stats.duration_ms; null when the recording has none. */
export function durationText(turn) {
  const ms = turn?.stats?.duration_ms;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.round(ms / 1000);
  return s >= 120 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
}

/* ── the map ─────────────────────────────────────────────────────────── */
let geo;
function macedonia() {
  if (!geo) {
    const sandbox = { window: {} };
    vm.runInNewContext(readFileSync(GEO_FILE, "utf8"), sandbox);
    geo = sandbox.window.ESG_GEO.macedonia[0];
  }
  return geo;
}
const SCALE = 300;
const LAT0 = 41.6;
const K = Math.cos((LAT0 * Math.PI) / 180);
/** The outline of North Macedonia as one SVG path in a small box, plus where Bitola and Skopje sit in it. */
export function mapOf() {
  const ring = macedonia();
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pad = 10;
  const px = (lon) => pad + (lon - x0) * K * SCALE;
  const py = (lat) => pad + (y1 - lat) * SCALE;
  const w = Math.round((x1 - x0) * K * SCALE + pad * 2);
  const h = Math.round((y1 - y0) * SCALE + pad * 2);
  const d = ring.map(([lon, lat], i) => `${i ? "L" : "M"}${px(lon).toFixed(1)} ${py(lat).toFixed(1)}`).join("") + "Z";
  const at = (lon, lat) => ({ x: +px(lon).toFixed(1), y: +py(lat).toFixed(1), left: `${((px(lon) / w) * 100).toFixed(2)}%`, top: `${((py(lat) / h) * 100).toFixed(2)}%` });
  return { w, h, d, bitola: at(21.34, 41.03), skopje: at(21.43, 42.0) };
}

/* ── line drawings (120 box, stroke 3, currentColor) ─────────────────── */
const SVG = (inner, box = "0 0 120 120") =>
  `<svg class="dr" viewBox="${box}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const drawings = {
  /** a sheet with lines and a magnifier: what an inspector can ask for */
  ask: () => SVG(`<path d="M26 14h42l18 18v50H26z"/><path d="M68 14v18h18"/><path d="M38 46h34M38 58h24M38 70h14"/><circle cx="78" cy="82" r="14"/><path d="M88 92l16 16"/>`),
  /** a sheet with a check and a spark: papers checked by AI */
  check: () => SVG(`<path d="M24 14h44l18 18v74H24z"/><path d="M68 14v18h18"/><path d="M38 70l12 12 24-26"/><path d="M96 16v16M88 24h16"/>`),
  /** a table with a loop: a register that stays current */
  register: () => SVG(`<rect x="8" y="26" width="62" height="62" rx="6"/><path d="M8 47h62M8 67h62M34 26v62"/><path d="M108 66a15 15 0 1 1-4-10"/><path d="M106 46v11h-11"/>`),
  /** the zip: a box with a zipper */
  zip: () => SVG(`<path d="M22 14h76v92H22z"/><path d="M60 14v14M60 36v8M60 52v8"/><rect x="50" y="64" width="20" height="26" rx="4"/>`),
  /** a folder */
  folder: () => SVG(`<path d="M12 32a6 6 0 0 1 6-6h28l10 12h46a6 6 0 0 1 6 6v46a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z"/>`),
  /** a paper with a fold, for a record */
  paper: () => SVG(`<path d="M28 12h44l20 20v76H28z"/><path d="M72 12v20h20"/><path d="M42 54h36M42 68h36M42 82h24"/>`),
  /** a door ajar: a visit */
  door: () => SVG(`<path d="M30 108V14h60v94"/><path d="M16 108h88"/><circle cx="76" cy="62" r="4"/>`),
  /** a person: head and shoulders */
  person: () => SVG(`<circle cx="60" cy="38" r="20"/><path d="M20 108c2-24 18-36 40-36s38 12 40 36"/>`),
};

/** An inline drawing wrapped for a label row. */
export const draw = (name) => drawings[name]();
