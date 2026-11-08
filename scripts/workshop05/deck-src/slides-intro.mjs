/**
 * Part 0 and 1 of the deck: S01 cover, S02 today, S03 why, S04 we, S05 letter. Each body is a function of `it` (motion.mjs)
 * and returns { head, stage } (or { raw } for the cover). One scene per slide: the headline and the drawing stay on screen,
 * a press adds a part to the drawing and swaps the one caption. Labels on a drawing are figure cells (class fig); the caption
 * and the source line are counted words. Every number that is computed comes from d.vars; the public figures are copy.
 */
import { esc, fill, spread } from "./motion.mjs";
import { draw, mapOf, numFmt } from "./scene.mjs";
import { ico, pollButtons } from "./slides-parts.mjs";
import { AGENDA_PARTS } from "./data.mjs";

const img = (label) => ` role="img" aria-label="${esc(label)}"`;
export const head = (it, t, zone = "h") => it({ id: "h", tag: "h2", cls: "headline hl", zone, text: t.h });
/** The caption slot: texts swap in one place, each leaves as the next arrives. */
export const cap = (it, id, text, k, out, extra = {}) => it({ id, cls: "t cap", zone: "cap", k, out, text, ...extra });
export const src = (it, id, text, k, out, extra = {}) => it({ id, cls: "src", zone: "src", k, out, text, ...extra });

/** S01: the title page. CSS entry only (w05-fx.css), no press, the globe stands still on North Macedonia. */
export function cover(it, ctx, d, c) {
  const t = c.s.cover;
  const title = esc(t.title).replace(/ (mit|with) /, "<br>$1 ");
  return {
    raw: (foot) => `<div class="cover__globe" aria-hidden="true"><canvas data-globe data-lat="40" data-speed="0" data-boost="0" data-home="0" data-cx="0.84" data-cy="0.5" data-r="0.44" data-arc-width="4" data-arc-land data-globe-steps="0:macedonia@1.5"></canvas></div>
<div class="cover__main">
<p class="cover__pill"><span class="pill pill--quiet">${esc(t.pill)}</span></p>
<p class="cover__num">${esc(t.num)}</p>
<h1 class="cover__title">${title}</h1>
<p class="cover__sub">${esc(t.sub)}</p>
</div>
${foot}`,
  };
}

/** S02: three outcomes stay on screen, a 90 minute bar (start and three parts named by what happens in them) fills, the case and the kit hang under their parts. */
export function today(it, ctx, d, c) {
  const t = c.s.today;
  const v = (x) => fill(x, d.vars);
  const icons = ["ask", "check", "register"];
  const cards = t.o
    .map((label, i) => it({ tag: "div", cls: "ocard fig", k: 0, win: spread(i, 3, 0, 0.5), html: `${draw(icons[i])}<b>${esc(label)}</b>` }))
    .join("");
  const total = AGENDA_PARTS.reduce((s, n) => s + n, 0);
  const W = 1696;
  const pct = (n) => `${((n / total) * 100).toFixed(3)}%`;
  const px = (n) => Math.round((n / total) * W);
  const labels = [t.seg0, ...t.seg];
  let at = 0;
  const parts = AGENDA_PARTS.map((n, i) => {
    const left = at;
    at += n;
    return { n, left, i };
  });
  const segs = parts
    .map((p) => it({ tag: "i", cls: `bar__seg bar__seg--${p.i}`, k: 1, fx: "line", win: spread(p.i, 4, 0, 0.4), attrs: `style="left:${pct(p.left)};width:${pct(p.n)}"` }))
    .join("");
  const names = parts
    .filter((p) => p.i > 0)
    .map((p) => it({ tag: "span", cls: `bar__lb fig bar__lb--${p.i}`, k: 1, win: spread(p.i, 4, 0.3, 0.45), attrs: `style="left:${pct(p.left)};width:${pct(p.n)}"`, html: `<b>${esc(labels[p.i])}</b><small>${p.n} ${esc(t.min)}</small>` }))
    .join("");
  // the case hangs under the second part, the kit under the third: a thin line from the part down to the note
  const callCase = it({ tag: "p", cls: "t callout callout--case", k: 2, attrs: `style="left:0;width:700px;--cx:${px(parts[1].left + parts[1].n / 2)}px"`, text: v(t.case) });
  const kitLeft = 760;
  const callKit = it({ tag: "p", cls: "t callout callout--kit", k: 3, attrs: `style="left:${kitLeft}px;width:600px;--cx:${px(parts[2].left + parts[2].n / 2) - kitLeft}px"`, text: v(t.kit) });
  const bar = it({ id: "bar", tag: "div", cls: "bar", zone: "bar", fx: "none", attrs: img(t.bar), html: `<i class="bar__rail"></i>${segs}${names}<span class="bar__t0 fig">${esc(`${labels[0]}, ${parts[0].n} ${t.min}`)}</span><span class="bar__t1 fig">90 ${esc(t.min)}</span>${callCase}${callKit}` });
  const stage = [head(it, t), it({ id: "cards", tag: "div", cls: "cards3", zone: "cards", fx: "none", html: cards }), bar].join("\n");
  return { head: "", stage };
}

/** The evidence card: date and source, the original title as printed, its translation. */
function evidenceCard(it, card, i, k) {
  const foreign = card.lang;
  const gl = card.gl ? `<p class="qd-gloss ecard__gl">${esc(card.gl)}</p>` : "";
  return it({
    id: `e${i + 1}`, tag: "div", cls: "ecard", zone: `e${i + 1}`, k, fx: "move",
    attrs: `style="grid-area:${Math.floor(i / 2) + 1}/${(i % 2) + 1};--dy:-28px"`,
    html: `<p class="ecard__meta fig"><b>${esc(card.date)}</b><span>${esc(card.src)}</span></p><p class="qd ecard__mk" lang="${foreign}">${esc(card.mk)}</p>${gl}`,
  });
}

/** S03: an evidence wall. A counter runs, four dated cards are pinned where they land, 100 circles fill, a map marks Bitola, the room answers. */
export function why(it, ctx, d, c) {
  const t = c.s.why;
  const v = (x) => fill(x, d.vars);
  const map = mapOf();
  const dots = Array.from({ length: 100 }, () => "<i data-cell></i>").join("");
  const base = Array.from({ length: 100 }, () => "<i></i>").join("");
  const number = it({
    id: "num", tag: "div", cls: "bign fig", zone: "n",
    html: `${it({ tag: "span", cls: "bign__n", fx: "none", count: `0,${d.dit.total},0`, win: ".08,.95", html: numFmt(d.dit.total, d.lang) })}<span class="bign__l">${esc(t.n)}</span>`,
  });
  const dotsBlock = it({ id: "dots", tag: "div", cls: "dots", zone: "dots", k: 5, fx: "none", attrs: img(v(t.dp)), html: `<div class="dots__base" aria-hidden="true">${base}</div>${it({ tag: "div", cls: "dots__fill w05-dots fig", k: 5, fx: "none", fill: d.dots, win: ".15,.95", html: dots })}` });
  const dotsLabel = it({ id: "dn", tag: "p", cls: "dots__n fig", zone: "dn", k: 5, html: `<b>${d.dots}</b> ${esc(t.dn)}` });
  const mapBox = it({
    id: "map", tag: "div", cls: "mapbox fig", zone: "map", k: 6, fx: "none", attrs: img(t.map),
    html: `<svg class="mapbox__svg" viewBox="0 0 ${map.w} ${map.h}" aria-hidden="true" focusable="false">${it({ tag: "path", cls: "mapbox__o", k: 6, fx: "draw", win: ".05,.7", attrs: `d="${map.d}" pathLength="1"` })}</svg>${it({ tag: "i", cls: "mapbox__pin", k: 6, win: ".65,1", attrs: `style="left:${map.bitola.left};top:${map.bitola.top}"` })}${it({ tag: "span", cls: "mapbox__tag", k: 6, win: ".7,1", attrs: `style="left:${map.bitola.left};top:${map.bitola.top}"`, text: "Bitola" })}`,
  });
  const facts = it({ id: "bf", tag: "p", cls: "bfacts fig", zone: "bf", k: 6, html: `<span>${esc(t.bt)}</span><b>${numFmt(1215, d.lang)}</b> ${esc(t.b1)}<br><b>${numFmt(228, d.lang)}</b> ${esc(t.b2)}` });
  const stage = [
    `<a class="bk" href="#a3" aria-label="${esc(t.sources)}">${ico("book")}</a>`,
    head(it, t),
    number,
    src(it, "t1", t.t1, 0, 5),
    it({ id: "wall", tag: "div", cls: "wall", zone: "wall", fx: "none", attrs: 'data-dim="7"', html: t.cards.map((card, i) => evidenceCard(it, card, i, i + 1)).join("") }),
    dotsBlock,
    dotsLabel,
    cap(it, "dc", t.dc, 5, 6),
    src(it, "dt", t.dt, 5, 6),
    src(it, "t1b", t.t1, 6),
    mapBox,
    facts,
    it({ id: "q6", tag: "p", cls: "t t--lead ask", zone: "q", k: 7, text: t.q6 }),
  ].join("\n");
  return { head: "", stage };
}

/** S04: Gradba-Pro as a picture: 24 people fill in four groups, a time line with year ticks, the reasons, 13 circles, the visits without notice. */
export function we(it, ctx, d, c) {
  const t = c.s.we;
  const headEl = it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", fx: "fade", text: t.pill });
  const sizes = [8, 6, 4, 6];
  const mark = (letter, who) => `<i class="pm${letter ? " pm--who" : ""}" data-cell>${letter ? esc(letter) : ""}</i>${who ? `<small class="pm__who">${esc(who)}</small>` : ""}`;
  const groups = t.roles
    .map((role, g) => {
      const people = Array.from({ length: sizes[g] }, (_, i) => {
        if (g === 3 && i === 0) return `<span class="pm__w">${mark("G", t.who[0])}</span>`;
        if (g === 3 && i === 1) return `<span class="pm__w">${mark("E", t.who[1])}</span>`;
        return mark("", "");
      }).join("");
      return `<div class="grp grp--${g}"><p class="grp__l">${esc(role)}<b>${sizes[g]}</b></p><div class="grp__p">${people}</div></div>`;
    })
    .join("");
  const crew = it({ id: "crew", tag: "div", cls: "crew fig", zone: "crew", fx: "none", fill: 24, win: ".1,.9", attrs: img(t.av), html: `${groups}<p class="crew__n">${esc(t.split)}</p>` });
  // time line from Jan 2024 to Nov 2026 (35 months): year ticks, the inspection mark in spring 2024, the quiet stretch grows from it to now
  const MONTHS = 35;
  const at = (m) => `${((m / MONTHS) * 100).toFixed(2)}%`;
  const years = [["2024", 0], ["2025", 12], ["2026", 24]];
  const tl = it({
    id: "tl", tag: "div", cls: "tl fig", zone: "tl", k: 1, fx: "none", attrs: img(t.tl),
    html: [
      it({ tag: "i", cls: "tl__axis", k: 1, fx: "line", win: ".0,.45" }),
      ...years.map(([y, m], i) => it({ tag: "span", cls: "tl__yr", k: 1, win: spread(i, 3, 0.05, 0.3), attrs: `style="left:${at(m)}"`, text: y })),
      it({ tag: "span", cls: "tl__yr tl__yr--end", k: 1, win: ".35,.65", attrs: `style="left:${at(34)}"`, text: t.tb }),
      it({ tag: "i", cls: "tl__mark", k: 1, win: ".3,.6", attrs: `style="left:${at(3)}"` }),
      it({ tag: "span", cls: "tl__a", k: 1, win: ".3,.7", attrs: `style="left:${at(3)}"`, html: `<b>${esc(t.ta)}</b><small>${esc(t.tm)}</small>` }),
      it({ tag: "i", cls: "tl__gap", k: 1, fx: "line", win: ".5,1", attrs: `style="left:${at(3)};right:${at(1)}"` }),
      it({ tag: "span", cls: "tl__g", k: 1, win: ".8,1", attrs: `style="left:${at(15)}"`, text: t.tg }),
    ].join(""),
  });
  const tags = it({ id: "tags", tag: "div", cls: "tags", zone: "tags", fx: "none", html: t.tags.map((x, i) => it({ tag: "p", cls: "tag fig", k: 2, win: spread(i, 3, 0, 0.5), text: x })).join("") });
  const thirteen = Array.from({ length: 13 }, (_, i) => `<i class="of__d${i === 0 ? " is-on" : ""}"></i>`).join("");
  const of = it({ id: "of", tag: "div", cls: "of fig", zone: "of", k: 3, attrs: img(t.of), html: `<div class="of__row">${thirteen}</div><p class="of__l">${esc(t.of)}</p>` });
  const xbar = it({ id: "xb", tag: "div", cls: "xb fig", zone: "xb", k: 4, fx: "none", html: `<span class="xb__bar">${it({ tag: "i", cls: "xb__fill", k: 4, fx: "line", win: ".2,.8" })}</span><p class="xb__l">${esc(t.xb)}</p>` });
  const stage = [
    head(it, t),
    crew,
    cap(it, "f", t.f, 0, 1),
    cap(it, "l1", t.l1, 1, 2),
    cap(it, "w", t.w, 2, 3),
    src(it, "wt", t.wt, 2, 3),
    cap(it, "o", t.o, 3, 4),
    src(it, "ot", t.ot, 3, 4),
    cap(it, "x", t.x, 4, null),
    src(it, "xt", t.xt, 4, null),
    tl,
    tags,
    of,
    xbar,
  ].join("\n");
  return { head: headEl, stage };
}

/** S05: the letter as a paper, the week as one strip, the poll on the same strip, the two clocks as marks, the papers as a list. */
export function letter(it, ctx, d, c) {
  const t = c.s.letter;
  const v = (x) => fill(x, d.vars);
  const headEl = it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", fx: "fade", text: t.pill });
  const paper = it({
    id: "paper", tag: "div", cls: "paper", zone: "paper",
    html: `${ico("paper")}<p class="qd paper__t" lang="mk">${esc(t.qd)}</p><p class="qd-gloss paper__g">${esc(t.gl)}</p><p class="paper__d fig">${esc(t.dates)}</p>`,
  });
  const places = t.places.map((p, i) => it({ tag: "span", cls: "wk__chip", k: 1, win: spread(i, 5, 0.25, 0.3), text: p })).join("");
  const eve = (n) => it({ tag: "span", cls: "wk__eve", k: 1, fx: "line", win: n === 2 ? ".55,.8" : ".7,.95", text: t.eve });
  const cols = t.days
    .map((day, i) => {
      let body = "";
      if (i === 0) body = `<span class="wk__ev wk__ev--0">${ico("envelope")}${esc(t.ev[0])}</span>`;
      if (i === 1) body = `${it({ tag: "span", cls: "wk__q", k: 2, out: 3, text: t.qmark })}<span class="wk__ev">${esc(t.ev[1])}</span><div class="wk__chips">${places}</div>`;
      if (i === 2) body = `<span class="wk__ev">${it({ tag: "b", cls: "wk__t", k: 1, win: ".5,.85", text: t.ev[2] })}</span>${eve(2)}`;
      if (i === 3) body = `<span class="wk__ev">${it({ tag: "b", cls: "wk__t", k: 1, win: ".6,.9", text: t.ev[3] })}</span>${eve(3)}${it({ tag: "span", cls: "wk__miss", k: 1, win: ".85,1", text: t.miss })}`;
      if (i === 4) body = `<span class="wk__ev wk__ev--v">${esc(t.ev[4])}</span>`;
      if (i === 5) body = `<span class="wk__ev wk__ev--d">${esc(t.ev[5])}</span>`;
      return `<div class="wk__d wk__d--${i}"><b class="wk__h">${esc(day)}</b>${body}</div>`;
    })
    .join("");
  const marks = [
    it({ tag: "i", cls: "wk__br wk__br--3", k: 3, fx: "line", win: ".1,.65" }),
    it({ tag: "span", cls: "wk__brl wk__brl--3", k: 3, win: ".55,1", text: t.span }),
    it({ tag: "i", cls: "wk__br wk__br--5", k: 4, fx: "line", win: ".1,.65" }),
    it({ tag: "span", cls: "wk__brl wk__brl--5", k: 4, win: ".55,1", text: t.paperdue }),
  ].join("");
  const week = it({ id: "week", tag: "div", cls: "wk fig", zone: "week", fx: "none", attrs: img(t.ln), html: `${cols}${marks}<i class="wk__gap" aria-hidden="true"></i>` });
  const five = t.five.map((x, i) => it({ tag: "li", cls: "ck", k: 5, win: spread(i, 5, 0, 0.4), html: `<i></i>${esc(x)}` })).join("");
  const safety = t.safety.map((x, i) => it({ tag: "li", cls: "ck ck--s", k: 6, win: spread(i, 2, 0, 0.5), html: `<i></i>${esc(x)}` })).join("");
  const list = it({ id: "ck", tag: "ul", cls: "cks fig", zone: "ck", k: 5, fx: "none", html: `${five}${safety}` });
  const stage = [
    head(it, t),
    paper,
    week,
    cap(it, "wk", t.wk, 1, 2),
    cap(it, "q", t.q, 2, 3),
    pollButtons(it, { id: "pb", name: "clock", labels: t.pb, k: 2, out: 3, zone: "pb" }),
    cap(it, "r", v(t.r), 3, 4),
    src(it, "rt", t.rt, 3, 4),
    cap(it, "c", t.c, 4, 5),
    src(it, "ct", null, 4, 5, { html: `<a href="#a1">${esc(t.ct)}</a>` }),
    cap(it, "a1", t.a1, 5, 6),
    src(it, "a1t", t.a1t, 5, 6),
    cap(it, "a2", t.a2, 6, 7),
    cap(it, "a3", t.a3, 7, null),
    src(it, "a3t", t.a3t, 7, null),
    list,
  ].join("\n");
  return { head: headEl, stage };
}
