/**
 * The Workshop 05 deck as HTML on the shared deck engine (lib/scenes.js, lib/engine.css), one function per
 * slide. Every visible word comes from deck-copy.json (c, per slide c.s.<id>), every computed number from
 * data.mjs (d), so the German and the English edition share one structure and one set of numbers.
 *
 * Motion: an element with data-step="k" arrives on press k of its slide; data-win places it inside the press,
 * data-fx picks the motion (engine fx values only, see lib/engine.css), data-out="k2" takes it away again.
 * W05-local motion is a CSS class from lib/w05-fx.css that reads the element's --p (0 to 1). Paths are written
 * as "./lib/" and "./assets/"; build.mjs moves them one folder up for the English edition.
 *
 * Counting rule of the words test: an element is visible from its data-step to just before its data-out, so
 * every text element carries its own data-step and data-out. Exempt classes: .qd (quote), .qd-gloss (gloss),
 * .prompt-body (kit prompt), .fig (cells of a figure), .out (script output), .focus (hover and focus extra).
 *
 * Slides S01 to S13 are written by lane D1 in this file. The slides S14 to S26 and the appendix a1 to a5 are lane D2's:
 * see the block "LANE D2" at the end of the file. Ids, order and minutes are final.
 */

import makeAct4 from "./slides-act4.mjs";
import makeAct5 from "./slides-act5.mjs";
import makeAct6 from "./slides-act6.mjs";
import makeAppendix from "./slides-appendix.mjs";

export const esc = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
export const fill = (text, vars = {}) => String(text).replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
/** Copy with *word* marks: escaped, the marks become the slide's one accent. */
export const em = (text, vars) => esc(fill(text, vars)).replace(/\*([^*]+)\*/g, "<em>$1</em>");

export const MAIN_TOTAL = 26;
const nn = (n) => String(n).padStart(2, "0");
const r3 = (x) => String(Math.round(x * 1000) / 1000).replace(/^0\./, ".");

/** data-step attributes. o: { fx, win, ease, out, outWin, count, keep } */
export function s(k, o = {}) {
  let a = ` data-step="${k}"`;
  if (o.win) a += ` data-win="${o.win}"`;
  if (o.fx) a += ` data-fx="${o.fx}"`;
  if (o.ease) a += ` data-ease="${o.ease}"`;
  if (o.out !== undefined && o.out !== null) a += ` data-out="${o.out}"${o.outWin ? ` data-out-win="${o.outWin}"` : ""}`;
  if (o.count) a += ` data-count="${o.count}"`;
  if (o.keep) a += " data-keep";
  return a;
}

/** The window of item i of n inside one press, each `span` long, spread from `from` to `to`. */
export function stagger(i, n, span = 0.5, from = 0, to = 1) {
  const start = n <= 1 ? from : from + ((to - from - span) * i) / (n - 1);
  return `${r3(start)},${r3(Math.min(1, start + span))}`;
}

/** Icons come from the engine sprite (lib/icons.svg); an unknown id renders nothing. */
export const ico = (name, cls = "") => `<svg class="ico${cls ? ` ${cls}` : ""}" aria-hidden="true"><use href="./lib/icons.svg#i-${name}"/></svg>`;
/** The five icons the engine sprite lacks (door, notebook, clock, coin, drawer, site): lib/w05-icons.svg. */
export const ico5 = (name, cls = "") => `<svg class="ico${cls ? ` ${cls}` : ""}" aria-hidden="true"><use href="./lib/w05-icons.svg#w05-${name}"/></svg>`;
/** A fly or arc from (dx, dy) back home: data-fx="arc|fly|move" reads these. */
export const arcStyle = (dx, dy, lift = 120, scale = 0.6) => ` style="--dx:${Math.round(dx)}px;--dy:${Math.round(dy)}px;--lift:${lift}px;--s:${scale}"`;

const TONE = { COVERED: "belegt", WEAK: "schwach", GAP: "luecke" };
export const chip = (status, word, extra = "") => `<span class="chip${extra ? ` ${extra}` : ""}" data-tone="${TONE[status]}">${esc(word)}</span>`;

/** Headline of a slide; `o.attrs` carry its data-step and data-out (the headline is counted text). */
export const hd = (headline, o = {}) =>
  `<header class="hd"><h2 class="headline headline--${o.size || "m"}"${o.attrs || ""}>${o.raw ? headline : esc(headline)}</h2></header>`;

/** The footer prints the page counter only (the standard has no footer sentence). n is 1 to 26 or "A1". */
export function foot(c, n) {
  const label = typeof n === "number" ? `${nn(n)} / ${MAIN_TOTAL}` : `${esc(c.appendix)} ${n}`;
  return `<footer class="foot"><span class="foot__inv"></span><span class="foot__n">${label}</span></footer>`;
}

/* ── drawn shapes ───────────────────────────────────────────────────── */

/** A seven-segment numeral drawn as hard-edge polygons: no text node, so it is a shape and never a counted word. */
const SEG = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
export function numeral(text, cls = "", { w = 60, h = 100, t = 13, gap = 22, label = "" } = {}) {
  const half = h / 2;
  const rects = {
    a: [t, 0, w - 2 * t, t],
    b: [w - t, t, t, half - t],
    c: [w - t, half, t, half - t],
    d: [t, h - t, w - 2 * t, t],
    e: [0, half, t, half - t],
    f: [0, t, t, half - t],
    g: [t, half - t / 2, w - 2 * t, t],
  };
  const digits = [...text];
  const width = digits.length * w + (digits.length - 1) * gap;
  const body = digits
    .map((ch, i) => SEG[ch].split("").map((seg) => {
      const [x, y, rw, rh] = rects[seg];
      return `<rect x="${x + i * (w + gap)}" y="${y}" width="${rw}" height="${rh}"/>`;
    }).join(""))
    .join("");
  return `<svg class="${cls}" viewBox="0 0 ${width} ${h}" role="img" aria-label="${esc(label || text)}" fill="currentColor"><title>${esc(label || text)}</title>${body}</svg>`;
}

/** Elena and Goran as small person icons, always at the same place (top right). Icons carry no visible text. */
export function who(ids, c, attrs = "") {
  const names = { elena: "Elena", goran: "Goran" };
  return `<div class="w05-who" role="img" aria-label="${ids.map((id) => names[id]).join(", ")}"${attrs}>${ids.map((id) => `<i class="w05-who__i w05-who__i--${id}">${ico("user")}</i>`).join("")}</div>`;
}

/* ── S01 cover ──────────────────────────────────────────────────────── */

function cover(d, c) {
  const t = c.s.cover;
  const title = esc(t.title).replace(/ (mit|with) /, "<br>$1 ");
  // The fifth block is outlined (Mennige edge) and holds the numeral 27 as a stroked shape, never a text node.
  const twentySeven = `<svg viewBox="0 0 100 100" role="img" aria-label="27"><title>27</title><path d="M10 18H44V50H10V82H44"/><path d="M58 18H92L72 82"/></svg>`;
  return `<div class="cover__globe" aria-hidden="true"><canvas data-globe data-lat="40" data-speed="7" data-boost="120" data-home="84" data-cx="0.81" data-cy="0.5" data-r="0.44" data-arc-width="4" data-arc-land data-globe-steps="0:macedonia@1.5"></canvas></div>
<div class="cover__main">
<span class="w05-knock cover__numwrap"${s(0, { fx: "none", win: ".1,.9" })}>${numeral("05", "cover__num", { label: "05" })}<i></i><i></i><i></i></span>
<p class="cover__pill"${s(0, { fx: "pop", win: "0,.3" })}><span class="pill pill--quiet">${esc(t.pill)}</span></p>
<h1 class="cover__title"${s(0, { fx: "blur", win: ".1,.55" })}>${title}</h1>
<p class="cover__sub"${s(0, { fx: "fade", win: ".3,.7" })}>${esc(t.sub)}</p>
<div id="w05-cover-days" class="w05-days4 cover__days" role="img" aria-label="${esc(c.days)}"${s(0, { fx: "none", win: ".4,1" })}><i></i><i></i><i></i><i></i><i class="w05-days4__27">${twentySeven}</i></div>
</div>
${foot(c, 1)}`;
}

/* ── S02 doors ──────────────────────────────────────────────────────── */

function doors(d, c) {
  const t = c.s.doors;
  const n = d.doors.building;
  const site = `<svg class="ico" aria-hidden="true"><use href="./lib/w05-icons.svg#w05-site"/></svg>`;
  const sites = Array.from({ length: n }, (_, i) => `<i class="w05-ring door__site"${s(1, { fx: "pop", win: stagger(i, n, 0.14, 0.04, 0.96) })}>${site}</i>`).join("");
  const days = d.doors.isoTo;
  const tiles = Array.from({ length: days }, (_, i) => `<i class="door__day${i < d.doors.isoFrom ? " is-on" : ""}"${s(3, { fx: "pop", win: stagger(i, days, 0.3, 0.2, 1) })}></i>`).join("");
  const shape = (k) => `<div class="door__shape" aria-hidden="true"><i class="door__frame"></i><i class="door__leaf w05-swing"${s(k, { fx: "none", keep: true })}></i></div>`;
  return `${hd(t.title, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage doors__stage">
<div class="door door--a">${shape(1)}
<p class="door__name"${s(1, { fx: "fade" })}>${esc(t.aName)}</p>
<b id="w05-doors-a" class="door__n"${s(1, { fx: "none", count: `0,${n},0` })}>${n}</b>
<p class="door__d"${s(1, { fx: "fade", out: 3 })}>${esc(t.aDetail)}</p>
<p class="door__d"${s(1, { fx: "fade", out: 2 })}>${esc(t.aExtra)}</p>
<p class="door__d"${s(1, { fx: "fade", out: 2 })}>${esc(t.aWhen)}</p>
<div class="door__sites" aria-hidden="true">${sites}</div></div>
<div class="door door--b">${shape(2)}
<p class="door__name"${s(2, { fx: "fade" })}>${esc(t.bName)}</p>
<b class="door__n"${s(2, { fx: "none", count: `0,${d.doors.tax},0` })}>${d.doors.tax}</b>
<p class="door__d"${s(2, { fx: "fade", out: 3 })}>${esc(t.bDetail)}</p>
<p class="door__d"${s(2, { fx: "fade", out: 3 })}>${esc(t.bChecks)}</p>
<p class="door__d"${s(2, { fx: "fade", out: 3 })}>${esc(t.bSource)}</p></div>
<div class="door door--c">${shape(3)}
<p class="door__name"${s(3, { fx: "fade" })}>${esc(t.cName)}</p>
<span class="door__mail"${s(3, { fx: "arc", win: "0,.55" })}${arcStyle(-260, -150, 100, 0.7)}>${ico("envelope")}</span>
<p class="door__d door__d--big"${s(3, { fx: "fade" })}>${esc(t.cDays)}</p>
<p class="door__d"${s(3, { fx: "fade" })}>${esc(t.cStaff)}</p>
<p class="door__d"${s(3, { fx: "fade" })}>${esc(t.cDates)}</p>
<div class="door__days" aria-hidden="true">${tiles}</div></div>
</div>
${foot(c, 2)}`;
}

/* ── S03 papers ─────────────────────────────────────────────────────── */

const pollBtn = (name, value, label, k, extra = "") =>
  `<button class="poll__opt door-btn${extra ? ` ${extra}` : ""}" type="button" data-poll="${name}" data-value="${value}"${s(k, { fx: "pop", win: "0,.6" })}><span>${esc(label)}</span><span class="door-btn__n" data-poll-n${s(4, { fx: "fade" })}>0</span></button>`;

function papers(d, c) {
  const t = c.s.papers;
  const parts = (text) => text.split(" · ");
  const stack = (k, quote, gloss) =>
    parts(quote)
      .map((q, i) => `<div class="sheet"${s(k, { fx: "fly", win: stagger(i, 3, 0.5, 0, 1), out: 4, outWin: ".0,.4" })}${arcStyle(-70, 90, 0, 0.9)}><span class="qd">${esc(q)}</span><span class="qd-gloss">${esc(parts(gloss)[i])}</span></div>`)
      .join("");
  const ours = parts(t.cPapers)
    .map((p, i) => `<div class="sheet sheet--ours"${s(3, { fx: "fly", win: stagger(i, 3, 0.5, 0, 1), out: 4, outWin: ".0,.4" })}${arcStyle(-70, 90, 0, 0.9)}><span>${esc(p)}</span></div>`)
    .join("");
  return `${hd(t.title, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage papers__stage">
<p class="papers__q"${s(4, { fx: "fade", out: 5 })}>${esc(t.question)}</p>
<p class="papers__q papers__q--hold"${s(5, { fx: "fade" })}>${esc(t.hold)}</p>
<div class="papers__btns">
${pollBtn("door", 0, t.aName, 1)}${pollBtn("door", 1, t.bName, 2)}${pollBtn("door", 2, t.cName, 3)}${pollBtn("door", 3, t.notSure, 4)}
</div>
<div class="papers__stacks" aria-hidden="false">
<div class="papers__stack">${stack(1, t.aQuote, t.aGloss)}</div>
<div class="papers__stack">${stack(2, t.bQuote, t.bGloss)}</div>
<div class="papers__stack">${ours}</div>
</div>
</div>
${foot(c, 3)}`;
}

/* ── S04 letter ─────────────────────────────────────────────────────── */

function letter(d, c) {
  const t = c.s.letter;
  // 84 stay grey, 15 fade out (each leaves through its own data-out), the last one is Gradba-Pro (Mennige, with a ring).
  const dots = Array.from({ length: 100 }, (_, i) => {
    if (i < d.micro.grey) return "<i></i>";
    if (i < 99) return `<i class="is-fade"${s(3, { fx: "fade", win: "0,.2", out: 3, outWin: `${r3(0.45 + ((i - d.micro.grey) * 0.4) / 15)},${r3(0.6 + ((i - d.micro.grey) * 0.4) / 15)}` })}></i>`;
    return `<i class="is-me"${s(3, { fx: "pop", win: ".6,1" })}></i>`;
  }).join("");
  const tabs = t.tabs.split(" · ").map((tab, i) => `<span class="w05-tab"${s(2, { fx: "fly", win: stagger(i, 3, 0.5, 0, 1), out: 3 })}${arcStyle(-180, -40, 40, 0.8)}>${ico("file")}${esc(tab)}</span>`).join("");
  return `<header class="hd"><p class="label label--accent"${s(0, { fx: "fade", out: 3 })}>${esc(t.date)}</p><h2 class="headline headline--m"${s(0, { fx: "fade", out: 4 })}>${esc(t.firm)}</h2></header>
<div class="w05-who w05-who--tags" role="group">
<p class="w05-tag"${s(0, { fx: "pop", win: "0,.5" })}><i class="w05-who__i w05-who__i--elena">${ico("user")}</i><span>${esc(t.elena)}</span></p>
<p class="w05-tag"${s(0, { fx: "pop", win: ".2,.7" })}><i class="w05-who__i w05-who__i--goran">${ico("user")}</i><span>${esc(t.goran)}</span></p>
</div>
<div class="stage letter__stage">
<div class="letter__desk" aria-hidden="true"${s(0, { fx: "fade", out: 3 })}></div>
<div class="w05-env"${s(0, { fx: "fly", win: "0,.8", out: 3 })}${arcStyle(0, -240, 40, 0.9)}>
<div class="envelope"${s(1, { fx: "none", keep: true, win: "0,.7" })}>
<i class="envelope__back"></i><div class="envelope__letter"></div><i class="envelope__front"></i><i class="envelope__flap"></i></div></div>
<div class="w05-sheet w05-unfold"${s(1, { fx: "none", win: ".3,.9", out: 3 })}>
<p class="w05-sheet__title qd"${s(1, { fx: "type", ease: "linear", win: ".35,1", out: 3 })}>${esc(t.noticeQuote)}</p>
<p class="w05-sheet__gloss qd-gloss"${s(1, { fx: "fade", win: ".5,1", out: 3 })}>${esc(t.noticeGloss)}</p>
<p class="w05-sheet__visit"${s(1, { fx: "glow", win: ".6,1", out: 3 })}>${esc(t.visit)}</p>
</div>
<div class="letter__tabs">${tabs}</div>
<div class="letter__dotswrap" role="img" aria-label="84/100"${s(3, { fx: "fade", win: "0,.4", out: 4 })}><div class="w05-dots letter__dots">${dots}</div></div>
<p class="letter__dotsline"${s(3, { fx: "fade", win: ".5,1", out: 4 })}>${esc(t.dots)}</p>
<p class="letter__rule"${s(4, { fx: "fade", win: "0,.5" })}>${esc(t.rule)}</p>
<p class="letter__src src"${s(4, { fx: "fade", win: ".3,.8" })}>${esc(t.ruleSource)}</p>
</div>
${foot(c, 4)}`;
}

/* ── S05 clock ──────────────────────────────────────────────────────── */

function clock(d, c) {
  const t = c.s.clock;
  const dayNum = (iso) => Number(iso.slice(8));
  // Mon 23 to Fri 27; the strip shows numerals only (class fig), w05-clock.js lights the days between.
  const first = Date.parse(`${d.clock.notice}T00:00:00Z`);
  const dates = Array.from({ length: 5 }, (_, i) => new Date(first + i * 86400000).toISOString().slice(0, 10));
  const cells = dates.map((iso, i) => `<div class="cal__d fig" data-day="${iso}" style="--k:${i}">${dayNum(iso)}</div>`).join("");
  const visitBtns = d.clock.buttons.map((iso) => `<button class="clock__pick" type="button" data-clock-visit="${iso}" aria-pressed="false">${dayNum(iso)}</button>`).join("");
  const idle = d.clock.buttons[0];
  return `${hd(t.question, { attrs: s(0, { fx: "fade", out: 2 }) })}
<div class="stage clock__stage" data-clock data-notice="${d.clock.notice}" data-visit="${dayNum(idle)}" data-chip-short="${esc(t.chipShort)}" data-chip-unclear="${esc(t.chipUnclear)}" data-chip-fits="${esc(t.chipFits)}" data-none="${esc(t.none)}">
<div class="cal" role="img" aria-label="${dates.map(dayNum).join(" ")}"${s(0, { fx: "fade", win: "0,.6", keep: true })}>${cells}<i class="cal__marker" aria-hidden="true"></i></div>
<div class="clock__vote">
<button class="poll__opt clock__yn" type="button" data-poll="clock" data-value="0"${s(0, { fx: "fade", out: 2 })}><span>${esc(t.yes)}</span><span data-poll-n>0</span></button>
<button class="poll__opt clock__yn" type="button" data-poll="clock" data-value="1"${s(0, { fx: "fade", out: 2 })}><span>${esc(t.no)}</span><span data-poll-n>0</span></button>
</div>
<div class="clock__rule"${s(1, { fx: "line", win: "0,.6", keep: true })}><i class="clock__bar" data-clock-bar></i></div>
<p class="clock__line"${s(1, { fx: "fade", win: ".2,.8" })}><a class="clock__a1" href="#a1">${esc(t.rule)}</a><a class="clock__a5" href="#a5" aria-label="${esc(t.shortNames)}">${ico("book")}</a></p>
<p class="clock__line clock__line--dit"${s(1, { fx: "fade", win: ".4,1" })}>${esc(t.dit)}</p>
<div class="clock__readout"${s(1, { fx: "fade", win: ".5,1" })}><p class="clock__days">${esc(t.days).replace(/\d+$/, "")}<b data-clock-count>${d.clock.workingFor[idle]}</b></p><span class="chip clock__chip" data-clock-chip${s(2, { fx: "fade", win: ".3,1" })}>${esc(t.chipUnclear)}</span></div>
<div id="w05-clock-anchor" class="clock__picks"${s(2, { fx: "none", win: "0,.6" })}>${visitBtns}</div>
<div class="clock__extra"${s(3, { fx: "fade" })}><button class="clock__toggle" type="button" data-clock-mode="extra" aria-pressed="false">${esc(t.toggle)}</button><p class="clock__nonote">${esc(t.noNotice)}</p></div>
</div>
${foot(c, 5)}`;
}

/* ── S06 plan ───────────────────────────────────────────────────────── */

function plan(d, c) {
  const t = c.s.plan;
  const check = (k) => `<svg class="plan__check" viewBox="0 0 40 40" aria-hidden="true"${s(k, { fx: "draw", win: ".5,1" })}><rect x="3" y="3" width="34" height="34" pathLength="1"/><path d="M10 21l7 7 14-17" pathLength="1"/></svg>`;
  const row = (k, line, chipText, out) => `<li class="plan__row">
<span class="plan__box"${s(k, { fx: "fade", win: "0,.3" })}>${check(k)}</span>
<span class="chip plan__chip"${s(k, { fx: "pop", win: "0,.4" })}>${esc(chipText)}</span>
<p class="plan__line"${s(k, { fx: "type", ease: "linear", win: ".05,.8", out })}>${esc(line)}</p></li>`;
  const [fine, notSure, no] = t.options;
  return `${hd(t.question, { attrs: s(0, { fx: "fade" }) })}
${who(["elena"], c, s(0, { fx: "pop", win: ".2,.7" }))}
<div class="stage plan__stage">
<ol class="plan__rows">${row(1, t.l1, t.c1, 2)}${row(2, t.l2, t.c2, 3)}${row(3, t.l3, t.c3, 4)}</ol>
<div class="plan__vote">
${[fine, notSure, no].map((label, i) => `<button class="poll__opt plan__opt" type="button" data-poll="plan" data-value="${i}"${s(4, { fx: "pop", win: stagger(i, 3, 0.4, 0, 1) })}><span>${esc(label)}</span><span data-poll-n>0</span></button>`).join("")}
</div></div>
${foot(c, 6)}`;
}

/* ── S07 ghost ──────────────────────────────────────────────────────── */

function ghost(d, c) {
  const t = c.s.ghost;
  const rows = d.tickRows;
  const head = ["id", "date", "start", "end", "tick"].map((h) => `<span class="ghost__h">${h}</span>`).join("");
  const body = rows.map((row, i) => row.slice(0, 5).map((cell, j) => {
    if (i === 0 && j === 2) return `<span class="ghost__c"><b class="ghost__new"${s(1, { fx: "type", ease: "linear", win: ".35,.9" })}>${esc(t.cellNew)}</b></span>`;
    if (i === 0 && j === 4) return `<span class="ghost__c">${esc(cell)}<i${s(1, { fx: "strike", win: ".6,1" })}></i></span>`;
    return `<span class="ghost__c">${esc(cell)}</span>`;
  }).join("")).join("");
  return `${hd(t.hands, { attrs: s(0, { fx: "fade", out: 2 }) })}
${who(["elena", "goran"], c, s(0, { fx: "pop", win: ".2,.7" }))}
<div class="stage ghost__stage">
<div class="ghost__file fig"${s(1, { fx: "pop", win: "0,.4" })}>
<p class="ghost__name">${ico("csv")}<b>${esc(t.file)}</b></p>
<div class="ghost__grid">${head}${body}</div></div>
<div class="ghost__rows">
<p class="ghost__row"${s(2, { fx: "pop", win: "0,.5", out: 3 })}>${ico("scale")}<span>${esc(t.labour)}</span></p>
<p class="ghost__row ghost__row--fine"${s(2, { fx: "pop", win: ".3,.8" })}>${ico("euro")}<span>${esc(t.fine)}</span></p>
<p class="ghost__row ghost__row--law"${s(3, { fx: "fade", win: "0,.7" })}>${ico("alert")}<span>${esc(t.criminal)}</span></p>
</div></div>
${foot(c, 7)}`;
}

/* ── S08 neighbour ──────────────────────────────────────────────────── */

function neighbour(d, c) {
  const t = c.s.neighbour;
  const { extraordinary: e, followUp: f, regular: r } = d.dit.dots;
  // Overlays stack on the grey field. data-fill counts the first n cells without data-miss, so the cells an earlier
  // overlay already owns are marked data-miss (they stay empty).
  const cells = (from) => Array.from({ length: 100 }, (_, i) => `<i data-cell${i < from ? " data-miss" : ""}></i>`).join("");
  const base = Array.from({ length: 100 }, () => "<i></i>").join("");
  return `${hd(t.head, { attrs: s(0, { fx: "fade", out: 3 }) })}
<div class="stage neighbour__stage">
<div class="neighbour__grid" role="img" aria-label="100">
<div class="w05-dots">${base}</div>
<div class="w05-dots w05-dots--hot" data-fill="${e}"${s(1, { fx: "none", win: ".1,.95" })}>${cells(0)}</div>
<div class="w05-dots w05-dots--ink" data-fill="${f}"${s(2, { fx: "none", win: ".1,.9" })}>${cells(e)}</div>
<div class="w05-dots w05-dots--ring" data-fill="${r}"${s(2, { fx: "none", win: ".4,1" })}>${cells(e + f)}</div>
</div>
<div class="neighbour__side">
<a class="neighbour__src src" href="#a3"${s(0, { fx: "fade", keep: true })}>${esc(t.source)}</a>
<p class="neighbour__k neighbour__k--hot"${s(1, { fx: "fade" })}><i></i>${esc(t.extra)}</p>
<p class="neighbour__k neighbour__k--ink"${s(2, { fx: "fade", out: 4 })}><i></i>${esc(t.followUp)}</p>
<p class="neighbour__k neighbour__k--ring"${s(2, { fx: "fade", win: ".3,1", out: 4 })}><i></i>${esc(t.regular)}</p>
<p class="neighbour__why"${s(3, { fx: "type", ease: "linear", out: 4 })}>${esc(t.reasons)}</p>
<p class="neighbour__no"${s(3, { fx: "fade", win: ".6,1", out: 4 })}>${esc(t.noLetter)}</p>
<p class="neighbour__end"${s(4, { fx: "fade" })}>${esc(t.consequence)}</p>
</div></div>
${foot(c, 8)}`;
}

/* ── S09 table ──────────────────────────────────────────────────────── */

const LINE_ICON = { L01: "file", L02: "pen", L03: "folder", L04: "calendar", L05: "ruler", L06: "envelope", L07: "table", L08: "euro", L09: "sun", L10: "shield", L11: "people", L12: "eye", L13: "cap" };

function table(d, c) {
  const t = c.s.table;
  const labels = t.cells.split(" · ");
  if (labels.length !== d.lines.length || labels.some((label, i) => label !== d.lines[i].label)) {
    throw new Error(`${c.lang}: the 13 labels of the table slide differ from the oracle plan labels`);
  }
  const strips = t.strips.split(" ");
  const ticks = [d.public.checklists.labour, d.public.checklists.safety, d.public.checklists.records];
  const strip = (name, n, i) => `<p class="tbl__strip"${s(0, { fx: "fly", win: stagger(i, 3, 0.6, 0, 1) })}${arcStyle(-120, 0, 0, 1)}><span>${esc(name)}</span><i style="--n:${n}" role="img" aria-label="${n}"></i></p>`;
  const rows = d.lines.map((line, i) => `<li class="tbl__row fig" tabindex="0" data-line="${line.id}"${s(1, { fx: "pop", win: stagger(i, 13, 0.3, 0.25, 1) })}><b>${line.id}</b>${ico(LINE_ICON[line.id])}<span>${esc(line.label)}</span><em class="focus">${esc(t.focus[i])}</em></li>`).join("");
  return `${hd(t.title, { attrs: s(0, { fx: "fade" }) })}
<div class="stage tbl__stage">
<div class="tbl__left">
<div class="tbl__strips">${strips.map((name, i) => strip(name, ticks[i], i)).join("")}</div>
<div class="tbl__funnel" aria-hidden="true"${s(1, { fx: "pop", win: "0,.5" })}></div>
<div class="tbl__sample"${s(1, { fx: "fly", win: ".3,.9" })}${arcStyle(0, -170, 60, 0.9)}><p class="qd">${esc(t.quote)}</p><p class="qd-gloss">${esc(t.gloss)}</p></div>
<p class="tbl__count"${s(1, { fx: "fade", win: ".6,1" })}>${esc(t.count)}</p>
</div>
<ol class="tbl__rows">${rows}</ol>
<div class="tbl__tags">
<span class="chip tbl__public"${s(2, { fx: "glow", win: "0,.6" })}>${esc(t.public)}</span>
<span class="tbl__ours"${s(2, { fx: "fade", win: ".2,.8" })}>${esc(t.ours)}</span>
<span class="tbl__src src"${s(2, { fx: "fade", win: ".4,1" })}>${esc(t.source)}</span>
</div></div>
${foot(c, 9)}`;
}

/* ── S10 drawer ─────────────────────────────────────────────────────── */

function drawer(d, c) {
  const t = c.s.drawer;
  const places = t.path.split(/\.\s*/).filter(Boolean).map((p) => `${p}.`);
  const xs = [14, 38, 62, 86];
  const drawers = places.map((place, i) => `<div class="drawer__d" style="--x:${xs[i]}%">
<div class="drawer__box"><i class="drawer__front"${s(1, { fx: "move", win: stagger(i, 4, 0.25, 0.1, 0.9) })} style="--dx:0px;--dy:-46px"></i></div>
<p class="drawer__label"${s(1, { fx: "fade", win: stagger(i, 4, 0.25, 0.15, 0.95) })}>${esc(place)}</p></div>`).join("");
  return `${hd(t.title, { attrs: s(0, { fx: "fade" }) })}
${who(["elena"], c, s(0, { fx: "pop", win: ".3,.8" }))}
<div class="stage drawer__stage">
<div class="drawer__row">${drawers}</div>
<svg class="drawer__path" viewBox="0 0 1696 120" preserveAspectRatio="none" aria-hidden="true"><path d="M60 100 C 300 10, 520 110, 740 60 S 1180 10, 1500 80" pathLength="1"${s(1, { fx: "draw", win: ".0,1", ease: "linear" })}/></svg>
<div class="drawer__clock"${s(1, { fx: "fade", win: ".6,1" })}><i class="drawer__face" aria-hidden="true"><b></b></i><span>${esc(t.morning)}</span></div>
<p class="drawer__tag chip"${s(2, { fx: "pop" })}>${esc(t.assumption)}</p>
</div>
${foot(c, 10)}`;
}

/* ── S11 tests ──────────────────────────────────────────────────────── */

const TEST_ICON = ["quote", "calendar", "people", "pen"];

function tests(d, c) {
  const t = c.s.tests;
  const names = t.names;
  const bad = [t.t1, t.t2, t.t3, t.t4];
  const status = [d.tests.quote, d.tests.period, d.tests.scope, d.tests.approval];
  const words = t.statuses;
  const word = { COVERED: c.s.status.covered, WEAK: c.s.status.weak, GAP: c.s.status.gap };
  words.forEach((w, i) => {
    if (w !== word[status[i]]) throw new Error(`${c.lang}: test status ${i} is "${w}" in the copy but ${status[i]} in the oracle`);
  });
  if (!bad[1].includes(String(d.opinionYear)) || !bad[2].startsWith(String(d.emptyFields))) throw new Error(`${c.lang}: the failed papers of the tests slide differ from the kit`);
  const cards = names.map((name, i) => `<div class="tcard">
<p class="tcard__name"${s(0, { fx: "fade", keep: true })}>${esc(name)}</p>
<div class="tcard__flip"${s(1, { fx: "flip", win: stagger(i, 4, 0.5, 0, 1) })}>
<div class="face">${ico(TEST_ICON[i])}</div>
<div class="face face--back"><span class="tcard__bad">${esc(bad[i])}<i${s(1, { fx: "strike", win: ".7,1" })}></i></span></div></div>
<div class="tcard__status"${s(2, { fx: "pop", win: stagger(i, 4, 0.4, 0, 1) })}>${chip(status[i], words[i], "chip--lg")}</div>
${i === 3 ? `<p class="tcard__note"${s(2, { fx: "fade", win: ".4,1" })}>${esc(t.noNotice)}</p>` : ""}</div>`).join("");
  return `${hd(t.title, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage tests__stage">${cards}</div>
${foot(c, 11)}`;
}

/* ── S12 status ─────────────────────────────────────────────────────── */

function status(d, c) {
  const t = c.s.status;
  const samples = t.samples.split(" · ");
  const tile = (k, key, statusName, word, def, sample, out) => `<div class="stile stile--${key}">
<div class="stile__head"${s(k, { fx: "pop", win: "0,.5" })}>${chip(statusName, word, "chip--lg")}</div>
<p class="stile__def"${s(k, { fx: "fade", win: ".3,1", ...(out ? { out } : {}) })}>${esc(def)}</p>
<span class="stile__sample fig"${s(k, { fx: "move", win: ".5,1" })} style="--dx:0px;--dy:-130px">${esc(sample)}</span></div>`;
  if (d.sample.contract !== "COVERED" || d.sample.opinion !== "WEAK" || d.sample.attendance !== "GAP") throw new Error("the three sample papers of the status slide differ from the oracle");
  return `${hd(t.title, { attrs: s(0, { fx: "fade" }) })}
<div class="stage status__stage">
${tile(1, "covered", "COVERED", t.covered, t.coveredDef, samples[0], 2)}${tile(2, "weak", "WEAK", t.weak, t.weakDef, samples[1], 3)}${tile(3, "gap", "GAP", t.gap, t.gapDef, samples[2])}
</div>
${foot(c, 12)}`;
}

/* ── S13 forward ────────────────────────────────────────────────────── */

function forward(d, c) {
  const t = c.s.forward;
  const pair = (k, text) => {
    const [oldText, newText] = text.split(" · ");
    return `<li class="pair">
<span class="pair__old fig"${s(k, { fx: "pop", win: "0,.3", out: 5, outWin: ".0,.5" })}>${esc(oldText)}<i${s(k, { fx: "strike", win: ".3,.6" })}></i></span>
<i class="pair__line"${s(k, { fx: "line", win: ".5,.8", out: 5, outWin: ".0,.5" })}></i>
<span class="pair__new fig"${s(k, { fx: "arc", win: ".5,1", out: 5, outWin: ".0,.5" })}${arcStyle(-260, 0, 70, 0.8)}>${esc(newText)}</span></li>`;
  };
  const [fine, notSure, no] = t.options;
  const bars = [0, 1, 2].map((i) => `<i data-value="${i}"></i>`).join("");
  const btns = [fine, notSure, no].map((label, i) => `<button class="poll__opt pv__opt" type="button" data-poll="plan-after" data-value="${i}"${s(5, { fx: "pop", win: stagger(i, 3, 0.4, 0.1, 1) })}><span>${esc(label)}</span><span data-poll-n>0</span></button>`).join("");
  return `${hd(t.title, { attrs: s(0, { fx: "fade" }) })}
${who(["elena", "goran"], c, s(0, { fx: "pop", win: ".2,.7" }))}
<div class="stage forward__stage">
<p class="forward__never"${s(1, { fx: "fade", win: ".3,1" })}>${esc(t.never)}</p>
<ol class="forward__pairs">${pair(1, t.p1)}${pair(2, t.p2)}${pair(3, t.p3)}${pair(4, t.p4)}</ol>
<p class="forward__draft"${s(4, { fx: "fade", win: ".4,1", out: 5, outWin: ".0,.5" })}>${esc(t.draft)}</p>
<p class="forward__again"${s(5, { fx: "fade", win: "0,.5" })}>${esc(t.again)}</p>
<div class="pv">
<div class="pv__ghost w05-ghost w05-ghost--ink" data-poll-show="plan"${s(5, { fx: "none", win: ".1,1" })} aria-hidden="true">${bars}</div>
<div class="pv__btns">${btns}</div></div>
</div>
${foot(c, 13)}`;
}

/* ═══ LANE D2: slides S14 to S26 and the appendix a1 to a5 ═══════════════════════════════════════════════════
   Each slide is one function `(d, c) => html` that returns the inner HTML of its <section> (a header made with hd(),
   a .stage, and foot(c, n)). Copy lives in deck-copy.json under c.s.<id> (add the keys you need; the 31 notes exist
   already); computed numbers come from data.mjs (d). Replace the entry of SLIDES below: set `steps` (presses after
   the first), `ms` (steps + 1 durations) and `body`. Helpers exported above: s(), stagger(), ico(), arcStyle(),
   chip(), hd(), foot(), numeral(), who(), esc(), em(), fill(). Never change an id, the order or the minutes. */

/** The helpers lane D2's slide files build on (the files take them as an argument, so there is no import cycle). */
const H = { s, stagger, ico, ico5, arcStyle, chip, hd, foot, numeral, who, esc, em, fill };
const act4 = makeAct4(H);
const act5 = makeAct5(H);
const act6 = makeAct6(H);
const appx = makeAppendix(H);

/** The slides in deck order: id, presses after the first, milliseconds per press, minutes, body. */
export const SLIDES = [
  { id: "cover", steps: 0, ms: [2600], minutes: 1, body: cover },
  { id: "doors", steps: 3, ms: [1200, 2600, 2600, 2600], minutes: 2, body: doors },
  { id: "papers", steps: 5, ms: [1000, 1800, 1800, 1800, 1600, 1200], minutes: 2, body: papers },
  { id: "letter", steps: 4, ms: [1200, 2000, 1800, 1800, 1800], minutes: 2, body: letter },
  { id: "clock", steps: 3, ms: [1000, 1800, 2600, 1600], minutes: 3, body: clock },
  { id: "plan", steps: 4, ms: [900, 1500, 1500, 1500, 1500], minutes: 3, body: plan },
  { id: "ghost", steps: 3, ms: [1200, 2200, 2000, 2200], minutes: 3, body: ghost },
  { id: "neighbour", steps: 4, ms: [1000, 2400, 1600, 1600, 1600], minutes: 3, body: neighbour },
  { id: "table", steps: 2, ms: [1400, 2400, 1600], minutes: 3, body: table },
  { id: "drawer", steps: 2, ms: [800, 3200, 1400], minutes: 1, body: drawer },
  { id: "tests", steps: 2, ms: [1200, 3200, 2600], minutes: 3, body: tests },
  { id: "status", steps: 3, ms: [1200, 2600, 2600, 2600], minutes: 3, body: status },
  { id: "forward", steps: 5, ms: [900, 1500, 1500, 1500, 2000, 1800], minutes: 3, body: forward },
  // ── lane D2 (ids, order and minutes are final) ──
  { id: "step1", steps: 2, ms: [900, 1600, 1800], minutes: 5, body: act4.step1 },
  { id: "step2", steps: 4, ms: [900, 1800, 2000, 2200, 2200], minutes: 7, body: act4.step2 },
  { id: "xray", steps: 5, ms: [1200, 3200, 2800, 2000, 2200, 3000], minutes: 4, body: act4.xray },
  { id: "step3", steps: 5, ms: [900, 1600, 2400, 1800, 2000, 1600], minutes: 6, body: act4.step3 },
  { id: "ladder", steps: 5, ms: [1000, 2400, 2800, 2000, 2200, 2000], minutes: 4, body: act5.ladder },
  { id: "judge", steps: 2, ms: [1000, 2000, 1600], minutes: 2, body: act5.judge },
  { id: "visit", steps: 6, ms: [1000, 1200, 1200, 1200, 1200, 1500, 1800], minutes: 3, body: act5.visit },
  { id: "after", steps: 3, ms: [1000, 2600, 2400, 2200], minutes: 3, body: act5.after },
  { id: "taxsheet", steps: 7, ms: [900, 1500, 1800, 1500, 1800, 1800, 2000, 1800], minutes: 4, body: act6.taxsheet },
  { id: "isosheet", steps: 5, ms: [900, 2000, 2000, 2000, 2000, 1800], minutes: 4, body: act6.isosheet },
  { id: "notmeasured", steps: 1, ms: [900, 2200], minutes: 2, body: act6.notmeasured },
  { id: "transfer", steps: 6, ms: [1000, 2400, 2400, 2400, 2400, 2400, 2800], minutes: 6, body: act6.transfer },
  { id: "close", steps: 3, ms: [1000, 2000, 2400, 2000], minutes: 8, body: act6.close },
  { id: "a1", steps: 0, ms: [600], minutes: 0, body: appx.a1, kind: "appendix" },
  { id: "a2", steps: 0, ms: [600], minutes: 0, body: appx.a2, kind: "appendix" },
  { id: "a3", steps: 0, ms: [600], minutes: 0, body: appx.a3, kind: "appendix" },
  { id: "a4", steps: 0, ms: [600], minutes: 0, body: appx.a4, kind: "appendix" },
  { id: "a5", steps: 0, ms: [600], minutes: 0, body: appx.a5, kind: "appendix" },
];

/** Every section of one edition. data-label is the label of the first notes line ("NN · Label"). */
export function renderSlides(c, d) {
  return SLIDES.map((slide, index) => {
    if (slide.ms.length !== slide.steps + 1) throw new Error(`${slide.id}: ${slide.ms.length} durations for ${slide.steps + 1} presses`);
    const kind = slide.kind ?? "main";
    const label = c.notes[index].split("\n")[0].replace(/^[^·]*·\s*/, "");
    return `<section class="slide ${slide.id}" id="${slide.id}" data-kind="${kind}" data-label="${esc(label)}" data-seconds="${slide.minutes * 60}" data-step-total="${slide.steps}" data-step-current="0" data-durations="${slide.ms.join(",")}">
${slide.body(d, c)}
</section>`;
  });
}
