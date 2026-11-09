/**
 * The scene kit the Workshop 05 slides share (REDESIGN-3, MOTION-SCOUT 4.2): the W05 icon set (icon, draw), the dot field
 * (field, fieldPoint, fieldGroups; lib/w05-field.js), the card motions (rise, flat; standUp and binder, 3D, only where depth is the idea; CSS in lib/w05-fx.css), the
 * presenter controls (toggle, scrubber, hotspots, target; lib/w05-scrub.js), the outline of North Macedonia from the deck's
 * own geo file, number and duration formats. Everything here is markup or a pure function. No text lives inside an SVG (the
 * words test skips svg and a label there would be invisible to it); labels are HTML on top of the drawing.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { esc } from "./motion.mjs";

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
export function macedonia() {
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

/* ── icons: the one W05 set (lib/w05-icons.svg, 24 grid, stroke 1.5) ─── */
const ICON_FILE = path.resolve(HERE, "../../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib/w05-icons.svg");
let iconCache;
/** Every symbol of w05-icons.svg: id without the "w05-" prefix to its inner markup. */
export function iconSet() {
  if (!iconCache) {
    iconCache = new Map();
    for (const m of readFileSync(ICON_FILE, "utf8").matchAll(/<symbol id="w05-([\w-]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) iconCache.set(m[1], m[2]);
  }
  return iconCache;
}
const ICON_ATTRS = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

/**
 * One icon of the W05 set inlined (so its paths can draw). icon(name) is still markup; icon(name, { it, k, win }) makes it a
 * stepped svg with data-fx="draw" that draws itself during press k (every shape has pathLength 1). cls adds classes.
 */
export function icon(name, { it, k = 0, win, cls = "", out } = {}) {
  const inner = iconSet().get(name);
  if (inner === undefined) throw new Error(`icon w05-${name} is not in w05-icons.svg`);
  const klass = `ico ico--w05${cls ? ` ${cls}` : ""}`;
  if (!it) return `<svg class="${klass}" ${ICON_ATTRS}>${inner}</svg>`;
  return it({ tag: "svg", cls: klass, k, win, out, fx: "draw", attrs: ICON_ATTRS, html: inner });
}

/** The old drawing names, now drawn with the W05 set at large size (one visual language; class dr keeps their size rules). */
const DRAWING = { ask: "inspector", check: "sheet-check", register: "register", zip: "zip", folder: "folder", paper: "sheet", door: "door", person: "person" };
/** An inline drawing (markup only), for the slides that still call draw(name). */
export const draw = (name) => icon(DRAWING[name] ?? name, { cls: "dr" });

/* ── the dot field (lib/w05-field.js) ───────────────────────────────── */
const FIELD_FILE = path.resolve(HERE, "../../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib/w05-field.js");
let fieldApi;
/** The pure half of lib/w05-field.js, the very code the page runs (so a label placed here sits on its dot there). */
export function fieldLib() {
  if (!fieldApi) {
    const sandbox = { module: { exports: {} } };
    vm.runInNewContext(readFileSync(FIELD_FILE, "utf8"), sandbox, { filename: "w05-field.js" });
    fieldApi = sandbox.module.exports;
  }
  return fieldApi;
}
/** Box pixels of a lon/lat point on a field of w by h with pad (the same projection the canvas draws). */
export function fieldPoint([lon, lat], { w, h, pad = 24 }) {
  const pr = fieldLib().projector(macedonia(), w, h, pad);
  return { x: +pr.x(lon).toFixed(1), y: +pr.y(lat).toFixed(1) };
}
/** The column rectangles of a groups layout (for labels under the columns), exactly as the canvas lays them out. */
export const fieldGroups = (counts, { n, w, h, pad = 24 }) => fieldLib().groupsGeometry(counts, n, w, h, { pad }).rects;

/**
 * A field scene: a stepped host (fx none, data-scene) holding the canvas and one driver per planned press. plan:
 * [{ k, from, to, win }] (from and to are layout names: scatter, country, regions, floor, groups:<key>). The host enters at
 * press `k` (default 0). overlay: markup on top of the canvas (labels: figure cells, placed with fieldPoint). groups:
 * { key: counts }, markGroup: { key: index }, regions: [{ at, inspections }], mark: [lon, lat]. style: more of the host's
 * inline style (its place); hostAttrs: more attributes (data-keep shows the host already at --p 0). year: [a, b], the share
 * of the entry press that is dust (0 to a), the year (a to b: `waves` straight fronts shared out over `regions` by their
 * inspections cross each region and deepen its dots, darker for more) and the close on the mark (b to 1); give that plan
 * entry ease "linear". still: the host stands
 * without motion on its entry (no scene there, so another idea may move on that press); only the presses that change the
 * layout get a driver. plane: { under, over }, flat markup in the canvas's own plane (a grid under the dots, a route over
 * them), painted with the canvas as one layer, so a 3D camera composites one floor instead of three.
 */
export function field(it, { id, zone, k = 0, out, outWin, w, h, n, seed, pad = 24, plan, mark, near, outline = false, regions, year, waves, groups = {}, markGroup = {}, cls = "", overlay = "", plane, label, hostAttrs = "", style = "", still = false }) {
  const planText = plan.map((e) => `${e.k}:${e.from}${e.to && e.to !== e.from ? `>${e.to}` : ""}`).join(";");
  const extra = [
    mark ? `data-mark="${mark.join(",")}"` : "",
    near ? `data-near="${near}"` : "",
    outline ? "data-outline" : "",
    regions ? `data-regions="${regions.map((r) => `${r.at.join(",")},${r.inspections}`).join(";")}"` : "",
    year ? `data-year="${year.join(",")}"` : "",
    waves ? `data-waves="${waves}"` : "",
    ...Object.entries(groups).map(([key, counts]) => `data-groups-${key}="${counts.join(",")}"`),
    ...Object.entries(markGroup).map(([key, g]) => `data-mark-group-${key}="${g}"`),
  ].filter(Boolean).join(" ");
  const canvas = `<canvas class="w05-field__c" data-w05-field width="${w * 2}" height="${h * 2}" style="width:${w}px;height:${h}px" data-n="${n}" data-seed="${seed}" data-pad="${pad}" data-plan="${planText}" ${extra} aria-hidden="true"></canvas>`;
  const drivers = plan.filter((e) => !still || (e.to && e.to !== e.from)).map((e) => it({ tag: "i", cls: "w05-drive", k: e.k, fx: "none", win: e.win, attrs: `data-scene aria-hidden="true"${e.ease ? ` data-ease="${e.ease}"` : ""}` })).join("");
  const aria = label ? ` role="img" aria-label="${esc(label)}"` : "";
  return it({ id, tag: "div", cls: `w05-field${cls ? ` ${cls}` : ""}`, zone, k, out, outWin, fx: "none", attrs: `${still ? "" : "data-scene "}style="width:${w}px;height:${h}px${style ? `;${style}` : ""}"${aria}${hostAttrs ? ` ${hostAttrs}` : ""}`, html: `${plane ? `<div class="w05-field__plane">${plane.under || ""}${canvas}${plane.over || ""}</div>` : canvas}${drivers}${overlay}` });
}

/* ── card motions (CSS in lib/w05-fx.css, all a function of --p) ───── */
/**
 * A flat card that rises into its place during its press (round 5, D2: 28 px up and a fade, no depth). The card is a stepped
 * element with data-scene, so icons that draw inside it in the same press belong to its one idea (law L5).
 */
export const rise = (it, o) => it({ tag: "div", fx: "none", ...o, cls: `w05-rise${o.cls ? ` ${o.cls}` : ""}`, attrs: `data-scene${o.attrs ? ` ${o.attrs}` : ""}` });
/**
 * A card that stands up out of the floor during its press (rotateX 90 to 0 around its bottom edge). 3D, so only where depth is
 * the idea (the safety stair, a ladder); inside an element of class w05-s3d (the perspective).
 */
export const standUp = (it, o) => it({ tag: "div", fx: "none", ...o, cls: `w05-card${o.cls ? ` ${o.cls}` : ""}`, attrs: `data-scene${o.attrs ? ` ${o.attrs}` : ""}` });
/** A window that slides up into its place during its press (the Claude window, T6; flat since round 5). */
export const plane = (it, o) => it({ tag: "div", fx: "none", ...o, cls: `w05-plane${o.cls ? ` ${o.cls}` : ""}`, attrs: `data-scene${o.attrs ? ` ${o.attrs}` : ""}` });

/**
 * A binder (the kit as a folder, T1): back board, `sheets` pages and a front cover that swings open on its spine during its
 * press. Size and place come from the caller (style or slide CSS); put it inside a w05-s3d host for depth. `front` is markup on
 * the cover (it turns with it), `html` lies on the top sheet under the cover; an `aria-label` in attrs replaces aria-hidden.
 */
export const binder = (it, { sheets = 3, front = "", ...o }) =>
  it({ tag: "div", fx: "none", ...o, cls: `w05-binder${o.cls ? ` ${o.cls}` : ""}`, attrs: `data-scene${o.attrs?.includes("aria-label") ? "" : ' aria-hidden="true"'}${o.attrs ? ` ${o.attrs}` : ""}`, html: `<i class="w05-binder__back"></i>${'<i class="w05-binder__sheet"></i>'.repeat(sheets)}${o.html ?? ""}<i class="w05-binder__front">${front}</i>` });

/* ── presenter controls (lib/w05-scrub.js) ─────────────────────────── */
/** The attributes a scrub, toggle or hotspot target carries: its name and its start values (r and Shift+R return to them). */
export const target = (name, { at, state, hot } = {}) =>
  [`data-w05-name="${esc(name)}"`, at !== undefined ? `data-w05-start-scrub="${at}"` : "", state !== undefined ? `data-w05-start-toggle="${esc(state)}"` : "", hot !== undefined ? `data-w05-start-hot="${esc(hot)}"` : ""].filter(Boolean).join(" ");

/** One row of presenter buttons (a figure cell): kind scrub, toggle or hot; values and labels in order. */
export function controls(it, { id, zone, k = 0, out, win, kind, name, values, labels, aria, cls = "" }) {
  if (!["scrub", "toggle", "hot"].includes(kind)) throw new Error(`controls: kind ${kind}`);
  const buttons = values.map((v, i) => `<button type="button" class="w05-btn" data-w05-${kind}="${esc(name)}" data-value="${esc(v)}" aria-pressed="false">${esc(labels[i])}</button>`).join("");
  return it({ id, tag: "div", cls: `w05-ctl w05-ctl--${kind} fig${cls ? ` ${cls}` : ""}`, zone, k, out, win, attrs: `role="group" aria-label="${esc(aria ?? labels.join(", "))}"`, html: buttons });
}
/** A segmented toggle (T8) for the target `name`. */
export const toggle = (it, { target: name, ...o }) => controls(it, { ...o, kind: "toggle", name });
/** Scrubber chips (T7) under an axis: each sets the target's --at. */
export const scrubber = (it, { target: name, ...o }) => controls(it, { ...o, kind: "scrub", name });
/** Hotspot buttons (T8): a second click clears. */
export const hotspots = (it, { target: name, ...o }) => controls(it, { ...o, kind: "hot", name });
