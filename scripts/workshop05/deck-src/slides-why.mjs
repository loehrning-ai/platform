/**
 * S03 why (REDESIGN-3 D4, round 4): what happens and how often. Press 0 shows the inspections of 2025 while the country
 * settles on the right out of dust, one dot per ten inspections (the number stands: the cover counted it). Presses 1 to 4: a wall of four dated news cards in depth. Each card flies
 * in from the back plane to its place (title or quote as printed, in Macedonian, the hero of the card; our translation under
 * it); the card before steps back as the next arrives, and the camera drifts a little along the wall on every press. The map
 * stays in view at a quarter. Press 5: the cards leave while the dots pour into three columns by kind, a bracket over all three
 * carries the decisions. Press 6 builds on the cover's year instead of replaying it: the dots return to the country, the map
 * tilts back into a floor and the eight DIT regions rise as towers, each as tall as its inspections. Press 7 outlines the
 * Pelagonia tower (Bitola), shows Bitola's plan against what was done as two true-scale bars, and asks the room.
 */
import { esc, fill } from "./motion.mjs";
import { field, fieldGroups, fieldPoint, numFmt, standUp } from "./scene.mjs";
import { REGIONS } from "./seats.mjs";
import { ico } from "./slides-parts.mjs";
import { cap, head, src } from "./slides-intro.mjs";

/** The field box on the stage (stage pixels) and its seed. */
const BOX = { left: 676, top: 110, w: 1000, h: 760, pad: 24, seed: 26484 };
/** The tallest tower (Skopje, 5,984 inspections) in screen px; the others in proportion on screen. */
const TOWER = 330;
/** Bitola 2025, DIT proposed annual report (DATA-20): planned and done. */
const BITOLA_PLAN = { planned: 815, done: 1215 };
/** The floor of press 6 (deck.css .wfl): transform origin in field px, perspective, lift, tilt and scale. */
const FLOOR = { ox: 500, oy: 532, persp: 1700, lift: 40, tilt: 54, scale: 1.16, yaw: -14 };
/**
 * Where a tower's top lands on the stage: the same transform chain the CSS applies (yaw about z, scale in x and y, rotateX of the floor,
 * translateY, perspective about the origin); the tower stands upright, so its top is h up in the world (rotateX(-tilt) on the floor).
 */
function towerTop({ x, y }, h) {
  const a = (FLOOR.tilt * Math.PI) / 180;
  // the yaw turns the map in its own plane first (the towers turn back by the same angle, so they still stand upright)
  const b = (FLOOR.yaw * Math.PI) / 180;
  const rx = (x - FLOOR.ox) * Math.cos(b) - (y - FLOOR.oy) * Math.sin(b);
  const ry = (x - FLOOR.ox) * Math.sin(b) + (y - FLOOR.oy) * Math.cos(b);
  const X = rx * FLOOR.scale;
  const Y = (ry - h * Math.cos(a)) * FLOOR.scale;
  const lz = h * Math.sin(a);
  const Y2 = Y * Math.cos(a) - lz * Math.sin(a) + FLOOR.lift;
  const Z2 = Y * Math.sin(a) + lz * Math.cos(a);
  const f = FLOOR.persp / (FLOOR.persp - Z2);
  return { x: BOX.left + FLOOR.ox + X * f, y: BOX.top + FLOOR.oy + Y2 * f };
}
/** The world height a tower needs so that its height on screen is `screen` px (bisection on the same chain as towerTop). */
function worldHeight(at, screen) {
  const base = towerTop(at, 0).y;
  let lo = 0;
  let hi = 4 * screen;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (base - towerTop(at, mid).y < screen) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
/**
 * The towers' world heights: the floor's perspective shrinks a tower at the back and grows one at the front, so each height is
 * divided by its depth here, and on screen every tower stands exactly as tall as its share of the tallest (checked to 3 %).
 */
function towerHeights() {
  const vmax = Math.max(...REGIONS.map((g) => g.inspections));
  return REGIONS.map((g) => {
    const at = fieldPoint(g.at, BOX);
    const want = (TOWER * g.inspections) / vmax;
    const h = worldHeight(at, want);
    const got = towerTop(at, 0).y - towerTop(at, h).y;
    if (Math.abs(got - want) / want > 0.03) throw new Error(`why: tower ${g.key} ${got.toFixed(0)} px on screen, ${want.toFixed(0)} wanted`);
    return { at, h };
  });
}
/** Regions whose label sits under the tower's foot instead of over its top (a tower right behind it would be covered). */
const FOOT_LABEL = new Set([]);
/** The camera along the wall: on presses 2, 3 and 4 it turns a little more (degrees about y, px of x). */
const WALL_CAM = [{ ry: -3, x: -10 }, { ry: -3, x: -10 }, { ry: -2, x: -8 }];

export function why(it, ctx, d, c) {
  const t = c.s.why;
  const per = 10;
  const n = Math.round(d.dit.total / per);
  const kinds = [d.dit.regular, d.dit.followUp, d.dit.extraordinary];
  const rects = fieldGroups(kinds, { n, w: BOX.w, h: BOX.h, pad: BOX.pad });
  const kindLabels = rects
    .map((r, i) => it({ tag: "span", cls: "wf__kind", k: 5, out: 6, win: `.${5 + i},1`, attrs: `style="left:${(r.x + r.w / 2).toFixed(0)}px;top:${(r.y - 78).toFixed(0)}px"`, html: `<b>${numFmt(kinds[i], d.lang)}</b>${esc(t.kinds[i])}` }))
    .join("");
  // the decisions span every kind: a bracket over the three columns with the count at its middle (it fades; the regroup is the press's idea)
  const top = Math.min(...rects.map((r) => r.y)) - 104;
  const x0 = rects[0].x;
  const x1 = rects[rects.length - 1].x + rects[rects.length - 1].w;
  const dec = it({ tag: "span", cls: "wf__dec", k: 5, out: 6, win: ".6,1", attrs: `style="left:${x0.toFixed(0)}px;width:${(x1 - x0).toFixed(0)}px;top:${top.toFixed(0)}px"`, html: `<b>${esc(fill(t.dec, { n: numFmt(d.dit.decisions, d.lang) }))}</b>` });
  // the towers: one per region at its seat on the floor, rising during press 6 (a scene each: three outlined faces, sage)
  const heights = towerHeights();
  // the towers rise once every dot has landed in the country (the regroup ends at .6), so the map is whole before any tower grows
  const towers = REGIONS.map((g, i) => {
    const { at, h } = heights[i];
    const body = it({ tag: "span", cls: "wt__b", k: 6, fx: "none", win: `${(0.6 + i * 0.03).toFixed(2)},${(0.9 + i * 0.0125).toFixed(3)}`, attrs: `data-scene style="--h:${h.toFixed(1)}px"`, html: `<i class="wt__t"></i><i class="wt__s"></i><i class="wt__f"></i>` });
    return `<span class="wt wt--${g.key}" style="left:${at.x}px;top:${at.y}px">${body}</span>`;
  }).join("");
  // the tower labels stand flat on the stage above each projected top (always readable, never behind another tower)
  const labels = REGIONS.map((g, i) => {
    const foot = FOOT_LABEL.has(g.key);
    const top = towerTop(heights[i].at, foot ? 0 : heights[i].h);
    return `<span class="wtl__i wtl__i--${g.key}${foot ? " wtl__i--foot" : ""}" style="left:${top.x.toFixed(0)}px;top:${top.y.toFixed(0)}px">${esc(t.regions[i])}<b>${numFmt(g.inspections, d.lang)}</b></span>`;
  }).join("");
  const towerLabels = it({ id: "wtl", tag: "div", cls: "wtl fig", zone: "wtl", k: 6, win: ".85,1", html: labels });
  const legend = it({ tag: "p", cls: "flegend wf__legend", k: 0, win: ".6,1", html: `<i class="flegend__dot"></i>${esc(t.legend)}` });
  const map = field(it, {
    id: "field", k: 0, w: BOX.w, h: BOX.h, n, seed: BOX.seed, pad: BOX.pad, outline: true, cls: "wf fig", groups: { kind: kinds },
    // the entry does not replay the cover's dust: the country is already formed and the floor of Today rises back to a top
    // view (the .wup host below); 5 regroups by kind; 6 lands every dot back in the country by .6, then the towers grow
    plan: [{ k: 0, from: "country" }, { k: 5, from: "country", to: "groups:kind" }, { k: 6, from: "groups:kind", to: "country", win: "0,.6" }],
    label: fill(t.field, { dots: numFmt(n, d.lang) }), overlay: `${legend}${kindLabels}${dec}${towers}`,
  });
  // the floor: on press 6 the whole map tilts back (the towers stand on it); before that it is the flat map
  // the yaw is its own scene inside the floor and ends before the towers rise (window to .45), so they grow upright
  const yaw = it({ tag: "div", cls: "wyaw", k: 6, fx: "none", win: "0,.45", attrs: `data-scene data-keep style="--yaw:${FLOOR.yaw}deg"`, html: map });
  const floor = it({ id: "floor", tag: "div", cls: "wfl", k: 6, fx: "none", attrs: "data-scene data-keep", html: yaw });
  // the entry: the map lies as Today's floor (tilted 54 degrees) and rises to a top view, dots in place (press 0's one idea)
  const rise = it({ id: "up", tag: "div", cls: "wup", zone: "map", k: 0, fx: "none", attrs: "data-scene data-keep", html: floor });
  const cards = t.cards
    .map((card, i) => {
      const one = standUp(it, {
        cls: `ecard ecard--${i + 1}`, k: i + 1,
        html: `<p class="ecard__meta fig"><b>${esc(card.date)}</b><span>${esc(card.src)}</span></p><p class="qd ecard__mk" lang="${card.lang}">${esc(card.mk)}</p><p class="qd-gloss ecard__gl">${esc(card.gl)}</p>`,
      });
      // the card steps back as the next one lands (depth: the newest is always in front)
      return i < t.cards.length - 1 ? it({ tag: "div", cls: "eback", k: i + 2, fx: "none", attrs: "data-scene data-keep", html: one }) : one;
    })
    .join("");
  const wallCam = WALL_CAM.reduceRight((inner, m, i) => it({ tag: "div", cls: "wcam", k: i + 2, fx: "none", attrs: `data-scene data-keep style="--ry:${m.ry}deg;--wx:${m.x}px"`, html: inner }), `<div class="wall__grid">${cards}</div>`);
  const number = it({
    id: "num", tag: "div", cls: "bign fig", zone: "n",
    // the cover already counted the year: here the number simply stands (the dots that become the country are the entry's motion)
    html: `<span class="bign__n">${numFmt(d.dit.total, d.lang)}</span><span class="bign__l">${esc(t.n)}</span>`,
  });
  // Bitola on press 7: what the plan said against what was done, two bars true to scale
  const wmax = Math.max(BITOLA_PLAN.planned, BITOLA_PLAN.done);
  const bars = [["planned", BITOLA_PLAN.planned], ["done", BITOLA_PLAN.done]]
    .map(([key, v], i) => `<span class="wb7__r"><span style="width:${((v / wmax) * 100).toFixed(1)}%">${it({ tag: "i", cls: `wb7__bar wb7__bar--${key}`, k: 7, fx: "line", win: `${(0.35 + i * 0.15).toFixed(2)},${(0.75 + i * 0.15).toFixed(2)}` })}</span><b>${numFmt(v, d.lang)}</b></span>`)
    .join("");
  const bitola = it({ id: "bit", tag: "div", cls: "wb7 fig", zone: "bit", k: 7, win: ".3,1", html: `<p class="wb7__h">${esc(t.bitola)}</p>${bars}` });
  const stage = [
    `<a class="bk fig" href="#a3">${ico("book")}<span class="bk__l">${esc(t.sources)}</span></a>`,
    head(it, t),
    number,
    cap(it, "c0", t.c0, 0, 1),
    src(it, "t0", t.t0, 0, 1),
    ...t.cards.map((card, i) => cap(it, `c${i + 1}`, card.cap, i + 1, i + 2)),
    it({ id: "wall", tag: "div", cls: "wall w05-s3d", zone: "wall", k: 1, out: 5, fx: "none", html: wallCam }),
    rise,
    towerLabels,
    cap(it, "c6", t.c6, 5, 6),
    src(it, "t6", t.t6, 5, 6),
    cap(it, "c7", t.c7, 6, 7),
    src(it, "t7", t.t7, 6, 7),
    cap(it, "q8", t.q8, 7, null, { cls: "t cap ask" }),
    bitola,
  ].join("\n");
  return { head: "", stage };
}
