/**
 * The invented case (REDESIGN-3 D4): S05 we and S06 letter. One scene per slide, the headline and the pill stay, a press
 * adds a part and swaps the one caption. Labels on a drawing are figure cells (class fig); captions and sources are counted.
 *
 * S05: 24 people draw themselves in four groups, flat on paper (round 5); a time line from 2024 to the letter, scrubbable (lib/w05-scrub.js); the
 * inspectorate's rhythm as a clock (round 4): one ring per rung, trade on the two-year ring, the hand at the letter; the
 * visits without a plan run along the line as a band.
 * S06: the envelope rises from lying flat, opens, and the letter comes forward (an object: its 3D stays); below it the week
 * is a flat calendar strip of the days to the visit (round 5, D2); a card says plainly who wrote, when the visit is and what
 * comes with it; the events of the week rise into their days; the kit's three checklists close the slide.
 */
import { esc, fill, spread } from "./motion.mjs";
import { icon, rise, scrubber, target } from "./scene.mjs";
import { ico } from "./slides-parts.mjs";
import { cap, head, src } from "./slides-intro.mjs";

const img = (label) => ` role="img" aria-label="${esc(label)}"`;
const pill = (it, t) => it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", text: t.pill });

/* ── S05 we ─────────────────────────────────────────────────────────── */
/** The crew as in the kit's contracts register: shop 7 and the cleaner, hall 8, yard 4 (3 drivers, 1 dispatcher), office 4. */
const SIZES = [8, 8, 4, 4];
/** The time line runs from January 2024 (month 0) to November 2026 (month 34); the four scrub stops sit on these months. */
const MONTHS = 35;
const STOPS = [3, 15, 27, 34];
const pos = (m) => `${((m / MONTHS) * 100).toFixed(2)}%`;

/**
 * The rhythm as a clock: one turn is three years from our last inspection (spring 2024, at the top). Three arcs are the
 * inspectorate's plan targets (high: one year, medium, where trade sits: two years, low: three years; DIT annual plan 2026); the hand
 * stands at November 2026, 31 months on, past the two-year arc. Arcs and hand draw inside one scene (law L5).
 */
const CLOCK = { r: [170, 136, 102], turn: 36, months: [12, 24, 36], now: 31, size: 400 };
function arcPath(r, months) {
  const c = CLOCK.size / 2;
  const at = (m) => {
    const a = (2 * Math.PI * m) / CLOCK.turn;
    return [(c + r * Math.sin(a)).toFixed(1), (c - r * Math.cos(a)).toFixed(1)];
  };
  if (months >= CLOCK.turn) return `M${c} ${c - r}A${r} ${r} 0 1 1 ${c} ${c + r}A${r} ${r} 0 1 1 ${c} ${c - r}`;
  const [x, y] = at(months);
  return `M${c} ${c - r}A${r} ${r} 0 ${months > CLOCK.turn / 2 ? 1 : 0} 1 ${x} ${y}`;
}
function clock(it, t) {
  const c = CLOCK.size / 2;
  const ticks = Array.from({ length: CLOCK.turn }, (_, m) => {
    const a = (2 * Math.PI * m) / CLOCK.turn;
    const r0 = m % 12 === 0 ? 178 : 186;
    return `M${(c + r0 * Math.sin(a)).toFixed(1)} ${(c - r0 * Math.cos(a)).toFixed(1)}L${(c + 194 * Math.sin(a)).toFixed(1)} ${(c - 194 * Math.cos(a)).toFixed(1)}`;
  }).join("");
  const arcs = CLOCK.r.map((r, i) => it({ tag: "path", cls: `wclk__arc wclk__arc--${i}`, k: 2, fx: "draw", win: `${(0.2 + i * 0.12).toFixed(2)},${(0.6 + i * 0.12).toFixed(2)}`, attrs: `d="${arcPath(r, CLOCK.months[i])}" pathLength="1"` })).join("");
  const a = (2 * Math.PI * CLOCK.now) / CLOCK.turn;
  const hand = it({ tag: "path", cls: "wclk__hand", k: 2, fx: "draw", win: ".6,.95", attrs: `d="M${c} ${c}L${(c + 176 * Math.sin(a)).toFixed(1)} ${(c - 176 * Math.cos(a)).toFixed(1)}" pathLength="1"` });
  const svg = `<svg class="wclk__svg" viewBox="0 0 ${CLOCK.size} ${CLOCK.size}" aria-hidden="true" focusable="false" fill="none"><circle class="wclk__face" cx="${c}" cy="${c}" r="194"/><path class="wclk__ticks" d="${ticks}"/>${arcs}${hand}<circle class="wclk__hub" cx="${c}" cy="${c}" r="7"/></svg>`;
  const start = `<span class="wclk__start">${esc(t.ta)}</span>`;
  // on press 3 the needle's meaning is said at its tip: past the two-year arc, the visit is overdue (in ink: the needle is the one accent)
  const late = it({ tag: "b", cls: "wclk__od", k: 3, win: ".2,.6", text: t.od });
  const now = `<span class="wclk__now" style="left:${((100 * (c + 214 * Math.sin(a))) / CLOCK.size).toFixed(1)}%;top:${((100 * (c - 214 * Math.cos(a))) / CLOCK.size).toFixed(1)}%">${esc(t.tb)}${late}</span>`;
  const legend = t.rungs.map((r, i) => `<p class="wclk__lg wclk__lg--${i}"><i></i><b>${esc(r.f)}</b><span>${esc(r.g)}: ${esc(r.w)}</span></p>`).join("");
  return it({ id: "clk", tag: "div", cls: "wclk fig", zone: "clk", k: 2, fx: "none", attrs: `data-scene role="img" aria-label="${esc(t.clk)}"`, html: `<div class="wclk__dial">${svg}${start}${now}</div><div class="wclk__legend">${legend}<small>${esc(t.t2)}</small></div>` });
}

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
      return `<div class="crew__g"><p class="crew__l">${esc(role)} <b>${SIZES[g]}</b></p><div class="crew__p">${people}</div>${who}</div>`;
    })
    .join("");
  // the crew on paper: the people draw themselves on the entry (one scene, no floor)
  const crew = it({ id: "crew", tag: "div", cls: "crew2 fig", zone: "crew", fx: "none", attrs: `data-scene${img(t.av)}`, html: groups });
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
    clock(it, t),
    cap(it, "c3", t.c3, 3, null),
    src(it, "t3", t.t3, 3, null),
  ].join("\n");
  return { head: "", stage };
}

/* ── S06 letter ─────────────────────────────────────────────────────── */
/**
 * S06 (13 Nov 2026, Tim: no legal detail, no acronyms): the letter and what it says, the week, and the lesson for Claude.
 * Press 0: the envelope opens; a card says who wrote, when the visit is and what comes with it. Press 1: the events of the
 * week rise into their days. Press 2: the card makes way for the three checklists of the kit, the questions Claude checks
 * our files against (their file names read from this edition's zip, never typed).
 */
export function letter(it, ctx, d, c) {
  const t = c.s.letter;
  const env = it({
    id: "env", tag: "div", cls: "w05-env lt-env", zone: "env", fx: "none", attrs: 'data-scene',
    html: `<div class="envelope"><div class="envelope__back"></div><div class="envelope__flap"></div><div class="envelope__letter">${ico("file")}<p class="qd lt-env__t" lang="mk">${esc(t.qd)}</p><p class="qd-gloss lt-env__g">${esc(t.gl)}</p><p class="lt-env__d fig">${esc(t.dates)}</p></div><div class="envelope__front"></div></div>`,
  });
  // what the letter says, in three plain rows: who sends it, when the visit is, what comes with it
  const what = it({ id: "what", tag: "div", cls: "lt-what fig", zone: "law", k: 0, out: 2, win: ".45,1", html: t.what.map(([k, v]) => `<p class="lt-what__r"><b>${esc(k)}</b><span>${esc(v)}</span></p>`).join("") });
  const week = t.wk.map((x, i) => rise(it, { cls: `ltw ltw--${i + 1}`, k: 1, win: spread(i, 3, 0, 0.6), text: x })).join("");
  const tiles = t.days
    .map((day, i) => {
      let body = "";
      if (i === 0) body = `<span class="ltd__ev">${ico("envelope")}${esc(t.ev[0])}</span>`;
      if (i === t.days.length - 1) body = `<span class="ltd__ev ltd__ev--v">${esc(t.ev[i])}</span>`;
      return `<div class="ltd ltd--${i}"><b class="ltd__h">${esc(day)}</b>${body}</div>`;
    })
    .join("");
  const floor = it({ id: "floor", tag: "div", cls: "ltf fig", zone: "floor", fx: "none", attrs: img(t.ln).trim(), html: `<div class="ltf__row">${tiles}<div class="ltw-host">${week}</div></div>` });
  // press 2: the three checklists of the kit, by file name (the questions the inspector will ask)
  const lists = d.kitPaths.filter((p) => /^(checklists|listen)\/[^/]+\.md$/.test(p));
  if (lists.length !== 3) throw new Error(`letter: ${lists.length} checklist files in the ${d.lang} zip, want 3`);
  const dir = `${lists[0].split("/")[0]}/`;
  const card = it({
    id: "lists", tag: "div", cls: "lt-wc lt-lists fig", zone: "law", k: 2, win: ".3,1",
    html: `<p class="lt-lists__h">${ico("folder")}<b>${esc(dir)}</b><span>${esc(t.listsH)}</span></p><ul>${lists.map((p) => `<li>${ico("file")}<span>${esc(p.split("/").at(-1))}</span></li>`).join("")}</ul>`,
  });
  const stage = [
    pill(it, t),
    head(it, t),
    env,
    floor,
    cap(it, "c0", t.c0, 0, 1),
    what,
    cap(it, "c1", t.c1, 1, 2),
    cap(it, "c2", t.c2, 2, null),
    card,
  ].join("\n");
  return { head: "", stage };
}
