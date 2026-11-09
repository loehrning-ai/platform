/**
 * Part 0 of the deck: S01 cover and S02 today (S03 why is slides-why.mjs, S05 and S06 slides-case.mjs). Each body is a function of `it` (motion.mjs)
 * and returns { head, stage } (or { raw } for the cover). One scene per slide: the headline and the drawing stay on screen,
 * a press adds a part to the drawing and swaps the one caption. Labels on a drawing are figure cells (class fig); the caption
 * and the source line are counted words. Every number that is computed comes from d.vars; the public figures are copy.
 */
import { esc, fill, spread } from "./motion.mjs";
import { field, fieldPoint, icon, numFmt } from "./scene.mjs";
import { BITOLA, REGIONS } from "./seats.mjs";
import { AGENDA_PARTS } from "./data.mjs";

export const head = (it, t, zone = "h") => it({ id: "h", tag: "h2", cls: "headline hl", zone, text: t.h });
/** The caption slot: texts swap in one place, each leaves as the next arrives. */
export const cap = (it, id, text, k, out, extra = {}) => it({ id, cls: "t cap", zone: "cap", k, out, text, ...extra });
export const src = (it, id, text, k, out, extra = {}) => it({ id, cls: "src", zone: "src", k, out, text, ...extra });

/** The dot field of S01 and S02 (one shot across the cut): the same canvas, the same seed, the same place on the page. */
export const FIELD = { left: 790, top: 104, w: 1060, h: 838, seed: 73310 };
/** The stage of a slide starts at 112, 88 on the page (the slide padding). */
const STAGE = { left: 112, top: 88 };

/** The Gradba-Pro tag on the map: a figure cell beside the Bitola dot, with a short leader; it fades in as the year closes. */
function mapTag(text, cls = "", sub = "", start = "") {
  const at = fieldPoint(BITOLA, FIELD);
  const tail = `${sub ? `<em class="fmark__near">${esc(sub)}</em>` : ""}${start ? `<em class="fmark__start">${esc(start)}</em>` : ""}`;
  return `<span class="fmark fig${cls}" style="left:${at.x}px;top:${at.y}px"><b>${esc(text)}</b>${tail}<i class="fmark__ln"></i></span>`;
}
/** The calm push-in of the cover ends on Bitola: the scale's centre as offsets from the host's transform origin (x 50 %, y given). */
function pushVars(oy) {
  const at = fieldPoint(BITOLA, FIELD);
  return `--tx:${(at.x - FIELD.w / 2).toFixed(1)}px;--ty:${(at.y - FIELD.h * oy).toFixed(1)}px`;
}

/**
 * The cover entry (law L1, widened on purpose in round 4): one entry host of 12 s. The share 0 to .12 is the dust settling
 * into the country, .12 to .86 is the inspection year 2025 (one sage ring per 300 inspections out of the eight DIT regions,
 * the counter running to their sum), .86 to 1 closes on Bitola. A press at any moment goes on to Today; reduced motion and
 * preview show the end at once.
 */
export const COVER = { ms: 12000, year: [0.12, 0.86], pulse: 300 };

/** S01: the title page. No press: one entry host replays the inspection year 2025 over the country, then Bitola lights up. */
export function cover(it, ctx, d, c) {
  const t = c.s.cover;
  const title = esc(t.title).replace(/ (mit|with) /, "<br>$1 ");
  const vars = { per: d.field.per, firms: numFmt(d.field.firms, d.lang), dots: numFmt(d.field.dots, d.lang) };
  const legend = `<p class="flegend fig"><i class="flegend__dot"></i>${esc(fill(t.legend, vars))}</p>`;
  const near = fill(t.near, { firms: numFmt(d.field.bitola, d.lang) });
  const total = REGIONS.reduce((sum, r) => sum + r.inspections, 0);
  if (total !== d.dit.total) throw new Error(`cover: the regions add up to ${total}, the report to ${d.dit.total}`);
  const last = REGIONS.findIndex((r) => r.at === BITOLA);
  const [y0, y1] = COVER.year;
  const map = field(it, {
    id: "map", zone: "fmap", w: FIELD.w, h: FIELD.h, n: d.field.dots, seed: FIELD.seed, outline: true, mark: BITOLA, near: d.field.near,
    regions: REGIONS, year: COVER.year, pulse: COVER.pulse, pulseLast: last,
    plan: [{ k: 0, from: "scatter", to: "country", win: "0,1", ease: "linear" }], cls: "cover__map", label: `${fill(t.map, vars)}. ${fill(t.year, { n: numFmt(total, d.lang), unit: COVER.pulse })} ${near}`, style: `left:${FIELD.left}px;top:${FIELD.top}px;${pushVars(0.6)}`,
    hostAttrs: 'data-keep data-ease="linear"', overlay: `${mapTag(t.tag, "", near)}${legend}`,
  });
  const n = it({ tag: "p", cls: "ccount__n fig", k: 0, fx: "none", win: `${y0},${y1}`, count: `0,${total},0`, attrs: 'data-ease="linear" data-keep', text: numFmt(total, d.lang) });
  const count = `<div class="ccount" aria-hidden="true"><p class="ccount__k fig">${esc(t.count)}</p>${n}<p class="ccount__u fig">${esc(t.unit)}</p><p class="ccount__r fig"><i class="ccount__ring"></i>${esc(fill(t.ring, { unit: COVER.pulse }))}</p><p class="cyear fig"><span>${esc(t.months[0])}</span><i class="cyear__bar"><i></i></i><span>${esc(t.months[1])}</span></p></div>`;
  const host = it({ id: "year", tag: "div", cls: "cover__year", zone: "map", fx: "none", attrs: `data-scene data-keep data-ease="linear" style="--y0:${y0};--y1:${y1}"`, html: `${map}${count}` });
  return {
    raw: (foot) => `${host}
<div class="cover__main">
<p class="cover__pill"><span class="pill pill--quiet">${esc(t.pill)}</span></p>
<p class="cover__num">${esc(t.num)}</p>
<h1 class="cover__title">${title}</h1>
<p class="cover__sub">${esc(t.sub)}</p>
</div>
${foot}`,
  };
}

/**
 * S02 on the floor of the cover's map: where the three stations stand (field pixels, the map's own box) and how the camera
 * moves on each press (cx, cy, cz in px, ry in degrees, added up press by press). The station in focus stands forward by
 * FWD; on the next press it steps back by BACK (x, y, z).
 */
export const TODAY = {
  stations: [[196, 548], [540, 520], [884, 548]],
  cam: [
    { cx: 150, cy: 110, cz: 140, ry: 4 },
    { cx: -170, cy: -10, cz: -20, ry: -6 },
    { cx: -10, cy: -12, cz: -150, ry: 1 },
  ],
  fwd: 60,
  back: { x: 0, y: -50, z: -110 },
};

/** A smooth path through points (Catmull-Rom as cubic Bézier), one SVG path per leg. */
function legs(points) {
  const at = (i) => points[Math.max(0, Math.min(points.length - 1, i))];
  return points.slice(0, -1).map((p, i) => {
    const [a, b, q, e] = [at(i - 1), p, at(i + 1), at(i + 2)];
    const c1 = [b[0] + (q[0] - a[0]) / 6, b[1] + (q[1] - a[1]) / 6];
    const c2 = [q[0] - (e[0] - b[0]) / 6, q[1] - (e[1] - b[1]) / 6];
    const f = (x) => x.toFixed(1);
    return `M${f(b[0])} ${f(b[1])}C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(q[0])} ${f(q[1])}`;
  });
}

/**
 * S02: one shot from the cover. Press 0: the cover's map tilts back into a floor, the Bitola tag stands up on it and a path
 * runs from Bitola to the first of three stations (the three parts). Presses 1 to 3: the camera dollies along the path; at
 * each station a card stands up (icon, part, minutes, outcome, the arc tag); the card in focus stands forward, the one before
 * steps back. On the kit station the files fly into a Claude project.
 */
export function today(it, ctx, d, c) {
  const t = c.s.today;
  const cv = c.s.cover;
  const v = (x) => fill(x, d.vars);
  const bitola = fieldPoint(BITOLA, FIELD);
  // the route and its rings end short of the last card (200 px left)'s foot, so the third ring is never half under the card
  const stops = TODAY.stations.map(([x, y], i) => (i === TODAY.stations.length - 1 ? [x - 200, y + 24] : [x, y]));
  const pts = [[bitola.x, bitola.y], ...stops];
  const paths = legs(pts);
  // the path and the station rings lie in the floor's own plane; leg 0 draws on press 0, leg 1 on press 2, leg 2 on press 3
  const legK = [0, 2, 3];
  const svgAttrs = `viewBox="0 0 ${FIELD.w} ${FIELD.h}" aria-hidden="true" focusable="false" fill="none"`;
  const route = paths.map((dd, i) => it({ tag: "path", cls: "troute__leg", k: legK[i], fx: "draw", win: i === 0 ? ".5,1" : ".05,.6", attrs: `d="${dd}" pathLength="1"` })).join("");
  const rings = stops.map(([x, y], i) => it({ tag: "circle", cls: "troute__stop", k: 0, fx: "draw", win: spread(i, 3, 0.55, 0.4), attrs: `cx="${x}" cy="${y}" r="30" pathLength="1"` })).join("");
  const gx = Array.from({ length: 9 }, (_, i) => `<path d="M${Math.round((FIELD.w * i) / 8)} 0V${FIELD.h}" pathLength="1"/>`).join("");
  const gy = Array.from({ length: 7 }, (_, i) => `<path d="M0 ${Math.round((FIELD.h * i) / 6)}H${FIELD.w}" pathLength="1"/>`).join("");
  const grid = it({ tag: "svg", cls: "fgrid", k: 0, fx: "draw", win: ".45,1", attrs: `${svgAttrs} preserveAspectRatio="none"`, html: `${gx}${gy}` });
  const routeSvg = `<svg class="troute" ${svgAttrs}>${rings}${route}</svg>`;

  // the three cards
  const icons = ["inspector", "sheet-check", "register"];
  const notes = [v(t.case), "", v(t.loop)];
  // the four things slide 8 tells you to add to the project, read from this edition's zip (never typed)
  const at = (re) => d.kitPaths.find((p) => re.test(p));
  const dirOf = (p) => (p ? `${p.split("/")[0]}/` : null);
  const files = [[dirOf(at(/^(checklists|listen)\//)), "folder"], [dirOf(at(/^(folder|ordner)\//)), "folder"], [at(/^(cases|faelle)\/[^/]*-A-[^/]*\.md$/), "sheet"], [at(/^(templates|vorlagen)\/register\.csv$/), "spreadsheet"]];
  if (files.some(([name]) => !name)) throw new Error("today: the kit files the project card shows are not in the kit");
  const project = (k) => {
    const chips = files
      .map(([name, ico], i) => it({ tag: "span", cls: "tfile", k, fx: "move", win: spread(i, files.length, 0.4, 0.45), attrs: `style="--dx:${-150 - 40 * i}px;--dy:${-210 + 30 * i}px"`, html: `${icon(ico)}<b>${esc(name).replace(/\//g, "/<wbr>")}</b>` }))
      .join("");
    return `<div class="tproj fig"><p class="tproj__h">${icon("assistant")}<b>${esc(t.project)}</b><span>${esc(fill(t.files, d.vars))}</span></p><div class="tproj__files">${chips}</div></div>`;
  };
  const stations = TODAY.stations.map(([x, y], i) => {
    const k = i + 1;
    const body = `<div class="tcard__hd">${icon(icons[i], { it, k, win: ".3,.8", cls: "dr" })}<p class="tcard__part fig"><b>${esc(t.seg[i])}</b><span>${AGENDA_PARTS[k]} ${esc(t.min)}</span></p></div>
<p class="tcard__o fig">${esc(t.o[i])}</p>
<p class="tcard__tag fig">${esc(t.tags[i])}</p>
${i === 1 ? project(k) : `<p class="tcard__note t">${esc(notes[i])}</p>`}`;
    const card = it({ tag: "div", cls: `tcard tcard--${k}`, k, fx: "none", attrs: `data-scene style="--fwd:${TODAY.fwd}px"`, html: body });
    const b = TODAY.back;
    const held = i < 2 ? it({ tag: "div", cls: "tback", k: k + 1, fx: "none", attrs: `data-keep data-ease="linear" style="--bx:${b.x}px;--by:${b.y}px;--bz:${b.z}px"`, html: card }) : card;
    return `<div class="tst" style="left:${x}px;top:${y}px">${held}</div>`;
  }).join("");
  const tag = `<div class="tst tst--tag" style="left:${bitola.x}px;top:${bitola.y}px">${mapTag(cv.tag, " fmark--today", fill(cv.near, { firms: numFmt(d.field.bitola, d.lang) }), `${t.seg0} · ${AGENDA_PARTS[0]} ${t.min}`).replace(/style="left:[^"]*"/, "")}</div>`;
  const legend = `<p class="flegend flegend--out fig" aria-hidden="true"><i class="flegend__dot"></i>${esc(fill(cv.legend, { per: d.field.per, firms: numFmt(d.field.firms, d.lang), dots: numFmt(d.field.dots, d.lang) }))}</p>`;
  const floor = field(it, {
    id: "floor", zone: "floor", w: FIELD.w, h: FIELD.h, n: d.field.dots, seed: FIELD.seed, outline: true, mark: BITOLA, near: d.field.near,
    plan: [{ k: 0, from: "country", win: "0,1" }], cls: "w05-floor today__floor", label: `${t.floor}. ${t.bar}`, hostAttrs: 'data-keep data-ease="linear"', style: `left:${FIELD.left - STAGE.left}px;top:${FIELD.top - STAGE.top}px;${pushVars(1)}`,
    plane: { under: grid, over: routeSvg },
    overlay: `${legend}${tag}${stations}`,
  });
  // the camera: one wrapper per press, each adds its move (a smoothstep of its own --p); the scene inside keeps its 3D
  const cam = TODAY.cam.reduceRight((inner, m, i) => it({ id: i === 0 ? "world" : undefined, tag: "div", cls: "tcam", zone: i === 0 ? "world" : undefined, k: i + 1, fx: "none", attrs: `data-scene data-keep data-ease="linear" style="--cx:${m.cx}px;--cy:${m.cy}px;--cz:${m.cz}px;--ry:${m.ry}deg"`, html: inner }), floor);
  return { head: "", stage: [cam, head(it, t)].join("\n") };
}
