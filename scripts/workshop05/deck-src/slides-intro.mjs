/**
 * Part 0 of the deck: S01 cover and S02 today (S03 why is slides-why.mjs, S05 and S06 slides-case.mjs). Each body is a function of `it` (motion.mjs)
 * and returns { head, stage } (or { raw } for the cover). One scene per slide: the headline and the drawing stay on screen,
 * a press adds a part to the drawing and swaps the one caption. Labels on a drawing are figure cells (class fig); the caption
 * and the source line are counted words. Every number that is computed comes from d.vars; the public figures are copy.
 */
import { esc, fill, rowWindow, spread } from "./motion.mjs";
import { field, fieldPoint, icon, mapOf, numFmt, standUp } from "./scene.mjs";
import { BITOLA } from "./seats.mjs";
import { ico, pollButtons } from "./slides-parts.mjs";
import { AGENDA_PARTS } from "./data.mjs";

const img = (label) => ` role="img" aria-label="${esc(label)}"`;
export const head = (it, t, zone = "h") => it({ id: "h", tag: "h2", cls: "headline hl", zone, text: t.h });
/** The caption slot: texts swap in one place, each leaves as the next arrives. */
export const cap = (it, id, text, k, out, extra = {}) => it({ id, cls: "t cap", zone: "cap", k, out, text, ...extra });
export const src = (it, id, text, k, out, extra = {}) => it({ id, cls: "src", zone: "src", k, out, text, ...extra });

/** The dot field of S01 and S02 (one shot across the cut): the same canvas, the same seed, the same place on the page. */
export const FIELD = { left: 790, top: 104, w: 1060, h: 838, seed: 73310 };
/** The stage of a slide starts at 112, 88 on the page (the slide padding). */
const STAGE = { left: 112, top: 88 };

/** The Gradba-Pro tag on the map: a figure cell beside the Bitola dot, with a short leader; it fades in as the dust settles. */
function mapTag(text, cls = "", sub = "") {
  const at = fieldPoint(BITOLA, FIELD);
  return `<span class="fmark fig${cls}" style="left:${at.x}px;top:${at.y}px"><b>${esc(text)}</b>${sub ? `<em class="fmark__near">${esc(sub)}</em>` : ""}<i class="fmark__ln"></i></span>`;
}
/** The calm push-in of the cover ends on Bitola: the scale's centre as offsets from the host's transform origin (x 50 %, y given). */
function pushVars(oy) {
  const at = fieldPoint(BITOLA, FIELD);
  return `--tx:${(at.x - FIELD.w / 2).toFixed(1)}px;--ty:${(at.y - FIELD.h * oy).toFixed(1)}px`;
}

/** S01: the title page. No press: one entry host (1600 ms) lets 7,331 dots of dust settle into the country; Bitola lights up. */
export function cover(it, ctx, d, c) {
  const t = c.s.cover;
  const title = esc(t.title).replace(/ (mit|with) /, "<br>$1 ");
  const vars = { per: d.field.per, firms: numFmt(d.field.firms, d.lang), dots: numFmt(d.field.dots, d.lang) };
  const legend = `<p class="flegend fig"><i class="flegend__dot"></i>${esc(fill(t.legend, vars))}</p>`;
  const near = fill(t.near, { firms: numFmt(d.field.bitola, d.lang) });
  const map = field(it, {
    id: "map", zone: "map", w: FIELD.w, h: FIELD.h, n: d.field.dots, seed: FIELD.seed, outline: true, mark: BITOLA, near: d.field.near,
    plan: [{ k: 0, from: "scatter", to: "country", win: "0,1" }], cls: "cover__map", label: `${fill(t.map, vars)}. ${near}`, style: `left:${FIELD.left}px;top:${FIELD.top}px;${pushVars(0.6)}`,
    hostAttrs: "data-keep", overlay: `${mapTag(t.tag, "", near)}${legend}`,
  });
  return {
    raw: (foot) => `${map}
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
 * S02: one shot from the cover. Press 0: the cover's map tilts back into the floor of the session, the Bitola dot in front.
 * Press 1: the 90 minutes as one track, the three parts named, the arc of the session as tags under them. Press 2: on each
 * part its outcome stands up, the icons draw. Press 3: the case (pointing at its dot), the kit (its files fly in) and the
 * watch hang under their parts.
 */
export function today(it, ctx, d, c) {
  const t = c.s.today;
  const v = (x) => fill(x, d.vars);
  const total = AGENDA_PARTS.reduce((s, n) => s + n, 0);
  const W = 1696;
  let at = 0;
  const parts = AGENDA_PARTS.map((n, i) => {
    const left = Math.round((at / total) * W);
    at += n;
    return { n, i, left, w: Math.round((at / total) * W) - left };
  });
  const box = (p, inset = 0) => `left:${p.left + inset}px;width:${p.w - 2 * inset}px`;
  const floor = field(it, {
    id: "floor", zone: "floor", w: FIELD.w, h: FIELD.h, n: d.field.dots, seed: FIELD.seed, outline: true, mark: BITOLA, near: d.field.near,
    plan: [{ k: 0, from: "country", win: "0,1" }], cls: "w05-floor today__floor", label: t.floor, hostAttrs: 'data-keep data-ease="linear"', style: `left:${FIELD.left - STAGE.left}px;top:${FIELD.top - STAGE.top}px;${pushVars(1)}`,
    overlay: (() => {
      const at = fieldPoint(BITOLA, FIELD);
      const cv = c.s.cover;
      const legend = `<p class="flegend flegend--out fig" aria-hidden="true"><i class="flegend__dot"></i>${esc(fill(cv.legend, { per: d.field.per, firms: numFmt(d.field.firms, d.lang), dots: numFmt(d.field.dots, d.lang) }))}</p>`;
      // a grid in the floor's own plane: the tilt turns its lines into perspective, the depth cue of the floor (draws in late)
      const gx = Array.from({ length: 9 }, (_, i) => `<path d="M${Math.round((FIELD.w * i) / 8)} 0V${FIELD.h}" pathLength="1"/>`).join("");
      const gy = Array.from({ length: 7 }, (_, i) => `<path d="M0 ${Math.round((FIELD.h * i) / 6)}H${FIELD.w}" pathLength="1"/>`).join("");
      const grid = it({ tag: "svg", cls: "fgrid", k: 0, fx: "draw", win: ".45,1", attrs: `viewBox="0 0 ${FIELD.w} ${FIELD.h}" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none"`, html: `${gx}${gy}` });
      return `${grid}<i class="fprobe" style="left:${at.x}px;top:${at.y}px"></i>${mapTag(cv.tag, " fmark--out", fill(cv.near, { firms: numFmt(d.field.bitola, d.lang) }))}${legend}`;
    })(),
  });
  const icons = ["inspector", "sheet-check", "register"];
  const cards = t.o
    .map((label, i) => standUp(it, { cls: "ocard fig", k: 2, win: spread(i, 3, 0, 0.6), attrs: `style="${box(parts[i + 1], 10)}"`, html: `${icon(icons[i], { it, k: 2, win: spread(i, 3, 0.3, 0.6), cls: "dr" })}<b>${esc(label)}</b>` }))
    .join("");
  const labels = [t.seg0, ...t.seg];
  const segs = parts.map((p) => it({ tag: "i", cls: `bar__seg bar__seg--${p.i}`, k: 1, fx: "line", win: spread(p.i, 4, 0, 0.4), attrs: `style="${box(p)}"` })).join("");
  const names = parts
    .filter((p) => p.i > 0)
    .map((p) => it({ tag: "span", cls: `bar__lb fig`, k: 1, win: spread(p.i, 4, 0.3, 0.45), attrs: `style="${box(p)}"`, html: `<b>${esc(labels[p.i])}</b><small>${p.n} ${esc(t.min)}</small>` }))
    .join("");
  const tags = parts
    .filter((p) => p.i > 0)
    .map((p) => it({ tag: "span", cls: "bar__tag fig", k: 1, win: spread(p.i, 4, 0.45, 0.45), attrs: `style="${box(p, 10)}"`, text: t.tags[p.i - 1] }))
    .join("");
  const bar = it({
    id: "bar", tag: "div", cls: "bar", zone: "bar", fx: "none", k: 1, attrs: img(t.bar),
    html: `${segs}${names}${tags}${it({ tag: "span", cls: "bar__t0 fig", k: 1, html: `${esc(labels[0])}<br>${parts[0].n} ${esc(t.min)}` })}${it({ tag: "span", cls: "bar__t1 fig", k: 1, text: `90 ${t.min}` })}`,
  });
  const chips = Array.from({ length: d.vars.files }, (_, i) => {
    const col = i % 18;
    const row = Math.floor(i / 18);
    return it({ tag: "i", cls: "kchip", k: 3, fx: "move", win: rowWindow(i, 1400, 0.3, 14, 0.4), attrs: `style="--dx:${-60 - col * 22}px;--dy:${-30 - row * 18}px"` });
  }).join("");
  const notes = [
    it({ id: "case", tag: "div", cls: "callout callout--case", zone: "case", k: 3, win: ".05,.5", attrs: `style="${box(parts[1], 10)}"`, html: `<p class="t">${esc(v(t.case))}</p>` }),
    it({ id: "kitc", tag: "div", cls: "callout callout--kit", zone: "kitc", k: 3, win: ".15,.6", attrs: `style="${box(parts[2], 10)}"`, html: `${icon("zip")}<p class="t">${esc(v(t.kit))}</p><span class="kchips fig" aria-hidden="true">${chips}</span>` }),
    it({ id: "loop", tag: "div", cls: "callout callout--loop", zone: "loop", k: 3, win: ".25,.7", attrs: `style="${box(parts[3], 10)}"`, html: `${icon("loop")}<p class="t">${esc(v(t.loop))}</p>` }),
  ].join("\n");
  // press 0 ends on a large floor that fills the frame; on press 1 it sinks under the track as the track draws (no motion family of its own)
  const sink = it({ id: "sink", tag: "div", cls: "today__sink", zone: "sink", k: 1, fx: "none", attrs: "data-keep", html: floor });
  const stage = [
    sink,
    head(it, t),
    it({ id: "cards", tag: "div", cls: "cards3 w05-s3d", zone: "cards", k: 2, fx: "none", html: cards }),
    bar,
    notes,
  ].join("\n");
  return { head: "", stage };
}
