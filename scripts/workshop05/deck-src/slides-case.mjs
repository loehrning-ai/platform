/**
 * The invented case (REDESIGN-3 D4): S05 we and S06 letter. One scene per slide, the headline and the pill stay, a press
 * adds a part and swaps the one caption. Labels on a drawing are figure cells (class fig); captions and sources are counted.
 *
 * S05: 24 people draw themselves in four groups; a time line from 2024 to the letter, scrubbable (lib/w05-scrub.js); the
 * inspectorate's risk ladder stands up with trade on its rung; the visits without a plan run along the line as a band.
 * S06: the letter comes out of its envelope over the floor of the week; the week stands up; the poll and a scrubber that
 * moves the visit along the days; the braces of the clocks; the time limits after the visit; the hardest case.
 */
import { esc, fill, spread } from "./motion.mjs";
import { icon, scrubber, standUp, target } from "./scene.mjs";
import { ico, pollButtons } from "./slides-parts.mjs";
import { cap, head, src } from "./slides-intro.mjs";

const img = (label) => ` role="img" aria-label="${esc(label)}"`;
const pill = (it, t) => it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", text: t.pill });

/* ── S05 we ─────────────────────────────────────────────────────────── */
const SIZES = [8, 6, 4, 6];
/** The time line runs from January 2024 (month 0) to November 2026 (month 34); the four scrub stops sit on these months. */
const MONTHS = 35;
const STOPS = [3, 15, 27, 34];
const pos = (m) => `${((m / MONTHS) * 100).toFixed(2)}%`;

export function we(it, ctx, d, c) {
  const t = c.s.we;
  let person = 0;
  const groups = t.roles
    .map((role, g) => {
      const people = Array.from({ length: SIZES[g] }, (_, i) => {
        const win = spread(person++, 24, 0, 0.5);
        return `<span class="pp${g === 3 && i < 2 ? " pp--who" : ""}">${icon("person", { it, k: 0, win, cls: "pp__i" })}</span>`;
      }).join("");
      const who = g === 3 ? `<p class="crew__who">${t.who.map((x) => `<span>${esc(x)}</span>`).join("")}</p>` : "";
      // the office row lifts on press 2 (a 3D scene of the press, with the ladder)
      const row = g === 3 ? it({ tag: "div", cls: "crew__lift", k: 2, fx: "none", attrs: "data-scene data-keep", html: people }) : people;
      return `<div class="crew__g"><p class="crew__l">${esc(role)} <b>${SIZES[g]}</b></p><div class="crew__p">${row}</div>${who}</div>`;
    })
    .join("");
  const crew = it({ id: "crew", tag: "div", cls: "crew2 fig", zone: "crew", fx: "none", attrs: img(t.av), html: groups });
  const years = [["2024", 0], ["2025", 12], ["2026", 24]];
  const tl = it({
    id: "tl", tag: "div", cls: "tl2 fig", zone: "tl", k: 0, fx: "none", attrs: `${img(t.tl)} ${target("tl", { at: 0 })}`,
    html: [
      // the axis and its years fade in on the entry (M13; the people drawing in are the entry's one moving idea, M1), so press 1 only adds the marks
      it({ tag: "i", cls: "tl2__axis", k: 0, win: ".35,.8" }),
      ...years.map(([y, m], i) => it({ tag: "span", cls: "tl2__yr", k: 0, win: spread(i, 3, 0.45, 0.4), attrs: `style="left:${pos(m)}"`, text: y })),
      it({ tag: "span", cls: "tl2__yr tl2__yr--end", k: 0, win: ".7,1", attrs: `style="left:${pos(34)}"`, text: t.tb }),
      it({ tag: "span", cls: "tl2__a", k: 1, win: ".3,.7", attrs: `style="left:${pos(3)}"`, html: `<i></i><b>${esc(t.ta)}</b><small>${esc(t.tm)}</small>` }),
      it({ tag: "i", cls: "tl2__gap", k: 1, fx: "line", win: ".45,1", attrs: `style="left:${pos(3)};right:${pos(1)}"` }),
      it({ tag: "span", cls: "tl2__g", k: 1, win: ".75,1", attrs: `style="left:${pos(16)}"`, text: t.tg }),
      it({ tag: "span", cls: "tl2__pt", k: 2, win: ".5,1", attrs: `style="left:${pos(27)}"`, text: t.pt }),
      it({ tag: "i", cls: "tl2__band", k: 3, fx: "line", win: ".1,.8" }),
      it({ tag: "span", cls: "tl2__bl", k: 3, win: ".6,1", text: t.band }),
      `<span class="tl2__head" aria-hidden="true"><i></i></span>`,
      `<p class="tl2__ro">${t.ro.map((x, i) => `<span class="tl2__r tl2__r--${i}">${esc(x)}</span>`).join("")}</p>`,
    ].join(""),
  });
  const rungs = t.rungs
    .map((r, i) => standUp(it, { cls: `rung rung--${3 - i}`, k: 2, win: spread(i, 3, 0, 0.6), html: `<b>${esc(r.g)}</b><span>${esc(r.w)}</span><small>${esc(r.f)}</small>` }))
    .join("") + it({ tag: "small", cls: "rungs__src", k: 3, win: ".3,1", text: t.t2 });
  const stage = [
    pill(it, t),
    head(it, t),
    crew,
    cap(it, "c0", t.c0, 0, 1),
    cap(it, "c1", t.c1, 1, 2),
    tl,
    scrubber(it, { id: "sc", zone: "sc", k: 1, win: ".6,1", target: "tl", values: ["0", "1", "2", "3"], labels: t.sc, aria: t.scAria }),
    cap(it, "c2", t.c2, 2, 3),
    src(it, "t2", t.t2, 2, 3),
    it({ id: "rungs", tag: "div", cls: "rungs w05-s3d fig", zone: "rungs", k: 2, fx: "none", html: rungs }),
    cap(it, "c3", t.c3, 3, null),
    src(it, "t3", t.t3, 3, null),
  ].join("\n");
  return { head: "", stage };
}

/* ── S06 letter ─────────────────────────────────────────────────────── */
export function letter(it, ctx, d, c) {
  const t = c.s.letter;
  const env = it({
    id: "env", tag: "div", cls: "w05-env lt-env", zone: "env", fx: "none", attrs: 'data-scene',
    html: `<div class="envelope"><div class="envelope__back"></div><div class="envelope__flap"></div><div class="envelope__letter">${ico("paper")}<p class="qd lt-env__t" lang="mk">${esc(t.qd)}</p><p class="qd-gloss lt-env__g">${esc(t.gl)}</p><p class="lt-env__d fig">${esc(t.dates)}</p></div><div class="envelope__front"></div></div>`,
  });
  const week = t.wk.map((x, i) => standUp(it, { cls: `ltw ltw--${i + 1}`, k: 1, win: spread(i, 3, 0, 0.6), text: x })).join("");
  const tiles = t.days
    .map((day, i) => {
      let body = "";
      if (i === 0) body = `<span class="ltd__ev">${ico("envelope")}${esc(t.ev[0])}</span>`;
      if (i === 4) body = `<span class="ltd__ev ltd__ev--v">${esc(t.ev[4])}</span>`;
      if (i === 5) body = it({ tag: "span", cls: "ltd__ev ltd__ev--due", k: 5, win: ".5,1", text: t.ev[5] });
      return `<div class="ltd ltd--${i}"><b class="ltd__h">${esc(day)}</b>${body}</div>`;
    })
    .join("");
  const chips = t.chips.map((x, i) => standUp(it, { cls: "ltc", k: 6, win: spread(i, 4, 0, 0.55), text: x })).join("");
  const after = `<div class="ltd ltd--after"><b class="ltd__h">${esc(t.after)}</b><div class="ltd__chips w05-s3d">${chips}</div></div>`;
  const marker = it({ tag: "span", cls: "lt-mk", k: 2, out: 3, html: `<span class="lt-mk__h"><b>${esc(t.mk2)}</b><i></i></span>` });
  const ro = `<p class="lt-ro">${t.ro.map((x, i) => `<span class="lt-ro__r lt-ro__r--${i}">${esc(x)}</span>`).join("")}</p>`;
  const braces = [
    it({ tag: "i", cls: "lt-br lt-br--3", k: 3, fx: "line", win: ".1,.7" }),
    it({ tag: "span", cls: "lt-brl lt-brl--3", k: 3, win: ".6,1", text: t.br3 }),
    it({ tag: "i", cls: "lt-br lt-br--5", k: 5, fx: "line", win: ".1,.7" }),
    it({ tag: "span", cls: "lt-brl lt-brl--5", k: 5, win: ".6,1", text: t.br5 }),
  ].join("");
  const floor = it({
    id: "floor", tag: "div", cls: "ltf fig", zone: "floor", fx: "none", attrs: `${img(t.ln)} ${target("visit", { at: 0 })}`,
    html: `${tiles}${after}<div class="ltw-host w05-s3d">${week}</div>${marker}${braces}`,
  });
  const stage = [
    pill(it, t),
    `<a class="bk" href="#a1" aria-label="${esc(t.sources)}">${ico("book")}</a>`,
    head(it, t),
    env,
    floor,
    cap(it, "c0", t.c0, 0, 1),
    cap(it, "c1", t.c1, 1, 2),
    cap(it, "c2", t.c2, 2, 3),
    pollButtons(it, { id: "pb", name: "clock", labels: t.pb, k: 2, out: 3, zone: "pb" }),
    scrubber(it, { id: "sc", zone: "sc", k: 2, out: 3, target: "visit", values: ["0", "1", "2", "3"], labels: t.sc, aria: t.scAria }),
    it({ id: "ro", tag: "div", cls: "lt-rob fig", zone: "ro", k: 2, out: 3, attrs: `aria-live="polite"`, html: ro }),
    cap(it, "c3", t.c3, 3, 4),
    it({ id: "l3", tag: "p", cls: "lt-law fig", zone: "law", k: 3, out: 4, text: t.l3 }),
    cap(it, "c4", t.c4, 4, 5),
    icon("inspector", { it, k: 4, win: ".1,.9", cls: "dr lt-ins" }).replace("<svg ", '<svg data-zone="ins" data-id="ins" '),
    it({ id: "l4", tag: "p", cls: "lt-law fig", zone: "law", k: 4, out: 5, text: t.l4 }),
    cap(it, "c5", t.c5, 5, 6),
    it({ id: "l5", tag: "p", cls: "lt-law fig", zone: "law", k: 5, out: 6, text: t.l5 }),
    cap(it, "c6", t.c6, 6, 7),
    it({ id: "l6", tag: "p", cls: "lt-law fig", zone: "law", k: 6, out: 7, text: t.l6 }),
    it({ id: "wc", tag: "p", cls: "lt-wc fig", zone: "law", k: 7, fx: "pop", win: ".3,1", text: t.wc }),
    cap(it, "c7", t.c7, 7, null),
    src(it, "t7", t.t7, 7, null),
  ].join("\n");
  return { head: "", stage };
}
