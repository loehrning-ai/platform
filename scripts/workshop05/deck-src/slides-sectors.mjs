/**
 * S04 sectors (REDESIGN-3 D4): which firms get checked and why. Press 0: every active firm of 2024 settles as the country
 * (one dot per twenty, already formed: the dust stays the cover's). Press 1: the dots regroup by sector, trade first. Press 2: the dots give way to a wall of nine tiles that
 * stand up: the inspectorate's seven risk areas and two Reform Agenda targets (dashed). Press 3: why, as bars of informal
 * jobs on the tiles. Press 4: the panel of who else checks (tap a tile, lib/w05-scrub.js hotspots) and the poll door, which
 * the close slide reads as ghost bars. Appendix a4 (matrix and blanks) is linked from here.
 */
import { esc, fill, spread } from "./motion.mjs";
import { field, fieldGroups, icon, numFmt, standUp, target } from "./scene.mjs";
import { ico, pollButtons } from "./slides-parts.mjs";
import { cap, head, src } from "./slides-intro.mjs";
import { BITOLA } from "./seats.mjs";

/** Firms per dot on this slide: 20 (3,666 dots), half the cover's density, so the regroup stays light on a slow laptop. */
const PER = 20;

/** The field box (stage px). Kept at 1040 x 720: the canvas is drawn at DPR 2 every frame of the regroup, and a larger box pushes the press past 50 ms under a 4x CPU throttle. */
const BOX = { w: 1040, h: 720, pad: 24, seed: 73310 };
/** The drawing over each sector column (none over "all other"). */
const GROUP_ICONS = ["shop", "notebook", "factory", "site", "truck", "cafe", null];
/** Active enterprises 2024 by NACE section (SSO, DATA-33 and INDUSTRIES-58); "all other" is the rest of 73,310. */
const SECTIONS = [21373, 8321, 7956, 6146, 5649, 5066];
/** The nine tiles: icon, informal share Q2 2026 in percent (INDUSTRIES-55, own calculation; null where none), Reform Agenda only, hotspot value. */
const TILES = [
  { ic: "factory", inf: 3.9, hot: "make" },
  { ic: "site", inf: 36.6, hot: "build" },
  { ic: "beam", inf: null },
  { ic: "shop", inf: 5.5, hot: "trade" },
  { ic: "care", inf: null },
  { ic: "mine", inf: null },
  { ic: "truck", inf: 5.6 },
  { ic: "cafe", inf: 11.7, ra: true, hot: "food" },
  { ic: "field", inf: 66.6, ra: true },
];
const HOTS = ["make", "build", "trade", "food"];

export function sectors(it, ctx, d, c) {
  const t = c.s.sectors;
  const n = Math.round(d.field.firms / PER);
  const counts = [...SECTIONS, d.field.firms - SECTIONS.reduce((s, x) => s + x, 0)];
  const rects = fieldGroups(counts, { n, w: BOX.w, h: BOX.h, pad: BOX.pad });
  const labels = rects
    .map((r, i) => it({ tag: "span", cls: `sf__lb${i === 0 ? " sf__lb--on" : ""}`, k: 1, win: spread(i, 7, 0.45, 0.4), attrs: `style="left:${(r.x + r.w / 2).toFixed(0)}px;top:${(r.y - 12).toFixed(0)}px"`, html: `${GROUP_ICONS[i] ? icon(GROUP_ICONS[i], { cls: "sf__i" }) : ""}${esc(t.groups[i])}<b>${numFmt(counts[i], d.lang)}</b>` }))
    .join("");
  const legend = it({ tag: "p", cls: "flegend sf__legend", k: 0, win: ".6,1", html: `<i class="flegend__dot"></i>${esc(t.legend)}` });
  const map = field(it, {
    id: "field", zone: "map", k: 0, out: 2, w: BOX.w, h: BOX.h, n, seed: BOX.seed, pad: BOX.pad, outline: true, cls: "sf fig", groups: { sector: counts },
    mark: BITOLA, markGroup: { sector: 0 },
    plan: [{ k: 0, from: "country", win: ".1,.9" }, { k: 1, from: "country", to: "groups:sector" }],
    label: fill(t.field, { dots: numFmt(n, d.lang) }), overlay: `${legend}${labels}`,
  });
  const pct = (x) => `${numFmt(Math.floor(x), d.lang)}${d.lang === "de" ? "," : "."}${Math.round((x % 1) * 10)} %`;
  const tiles = TILES.map((tile, i) => {
    const bar = tile.inf === null ? "" : `<span class="st__bar">${it({ tag: "i", cls: "st__fill", k: 3, fx: "line", win: spread(i, 9, 0, 0.5), attrs: `style="--w:${tile.inf}"` })}</span>${it({ tag: "span", cls: "st__v", k: 3, win: spread(i, 9, 0.35, 0.5), text: `${pct(tile.inf)} ${t.informal}` })}`;
    const hi = HOTS.indexOf(tile.hot);
    const button = tile.hot ? `<button type="button" class="st__b" data-w05-hot="wall" data-value="${tile.hot}" aria-pressed="false" aria-label="${esc(t.hotAria[hi])}"></button>` : "";
    return standUp(it, {
      // the tiles rise from the first frame of the press while the field fades out: they start at a third of their tone and
      // 900 px back (deck.css), so the wall is there on the first frame and no frame is empty between dots and wall
      // data-keep: every tile is on screen from the first frame of the press, far back and faint, and flies forward in turn
      cls: `st${tile.ra ? " st--ra" : ""}${tile.hot === "trade" ? " st--on" : ""}`, k: 2, win: spread(i, 9, 0, 0.45), attrs: "data-keep",
      html: `${button}${tile.hot ? '<i class="st__dot" aria-hidden="true"></i>' : ""}${icon(tile.ic, { cls: "st__i" })}<b class="st__n">${esc(t.tiles[i])}</b>${bar}`,
    });
  }).join("");
  const panel = HOTS.map((h) => `<div class="sp__b sp__b--${h}">${t.hot[h].map((x) => `<p>${esc(x)}</p>`).join("")}</div>`).join("");
  const stage = [
    `<a class="bk fig" href="#a4">${ico("book")}<span class="bk__l">${esc(t.sources)}</span></a>`,
    head(it, t),
    cap(it, "c0", fill(t.c0, { firms: numFmt(d.field.firms, d.lang) }), 0, 1),
    src(it, "t0", t.t0, 0, 2),
    map,
    cap(it, "c1", t.c1, 1, 2),
    // the wall host is there from the first frame of press 2 (win 0,.01): its own entry must not wait for the field to leave
    it({ id: "wall", tag: "div", cls: "stw w05-s3d fig", zone: "wall", k: 2, fx: "none", win: "0,.01", attrs: `role="group" aria-label="${esc(t.wall)}"`, html: `${tiles}${it({ tag: "p", cls: "stw__l", k: 2, win: ".5,.9", text: t.wl })}` }),
    cap(it, "c2", t.c2, 2, 3),
    src(it, "t2", t.t2, 2, 3),
    cap(it, "c3", t.c3, 3, 4),
    src(it, "t3", t.t3, 3, 4),
    cap(it, "c4", t.c4, 4, null),
    pollButtons(it, { id: "pb", name: "door", labels: t.pb, k: 4, zone: "pb" }),
    it({ id: "panel", tag: "div", cls: "sp fig", zone: "panel", k: 4, attrs: target("wall", { hot: "trade" }), html: `<p class="sp__h">${esc(t.ph)}</p>${panel}<p class="sp__all">${esc(t.all)}</p>` }),
  ].join("\n");
  return { head: "", stage };
}
