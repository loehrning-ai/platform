/**
 * S14 watch: set Claude up so the firm stays ready (REDESIGN-3 D4). One scene: the weekly loop is the hero, a calendar ring of
 * four weeks around the register, the check fixed at twelve o'clock.
 * Press 0: the register (its row count from the oracle) in the middle; the ring with one node per week draws around it (M13),
 * the first week under the check carries its tick. Presses 1 to 3: the ring turns one week per press, so the next week arrives
 * under the check and its tick lands (a scene of nested rotors, each a pure function of its press and --p).
 * Press 1: the two ways to keep the rhythm stand beside it; the toggle shows the Free plan's monthly rhythm instead (Anthropic
 * help centre, scheduled tasks: scheduled tasks are paid only, the built-in schedule has no monthly option); in Free, three of four weeks fade.
 * Press 2: check day: the check's three lists for the exercise day (expected.json). Press 3: the watch list of official
 * sources rises in (the labour inspectorate, the official gazette, the data protection agency). Press 4: the next audit works
 * the same way: the kit's three cases (labour today, tax and ISO as field cards), their files read from the zip.
 * The slide builds: the two plans, the toggle and the check's result stay to the end; the watch list and then the three cases
 * take the lower slot in turn.
 */
import { esc, fill, spread } from "./motion.mjs";
import { icon, rise, toggle } from "./scene.mjs";
import { cap } from "./slides-intro.mjs";
import { claudePanel, clIcon, spark } from "./slides-parts.mjs";

const SIZE = 760;
const R = 300;
const C = SIZE / 2;
/** A point on the ring at an angle in degrees (0 is twelve o'clock, clockwise). */
const at = (deg, r = R) => ({ x: +(C + r * Math.sin((deg * Math.PI) / 180)).toFixed(1), y: +(C - r * Math.cos((deg * Math.PI) / 180)).toFixed(1) });
const dateText = (iso, lang) => new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const SVG = `viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`;
/** The week nodes (four, one month), clockwise from twelve o'clock; the ring turns a quarter back per press, so week n arrives at the top on press n. */
const WEEKS = [0, 90, 180, 270];
/** A tick drawn upright at twelve o'clock on the node, then turned to its week, so it stands upright when the week reaches the top. */
const tickD = (() => { const p = at(0); return `M${p.x - 11} ${p.y + 1} L${p.x - 3} ${p.y + 9} L${p.x + 12} ${p.y - 9}`; })();

export function watch(it, ctx, d, c) {
  const t = c.s.watch;
  const ui = c.claudeUi;
  const [iso, day] = Object.entries(d.register.byDate)[0];
  const nodes = WEEKS.map((deg, i) => { const p = at(deg); return `<circle class="wr__n wr__n--${i}" cx="${p.x}" cy="${p.y}" r="24" pathLength="1"/>`; }).join("");
  // week 1's tick draws with the ring; weeks 2 to 4 get theirs when the ring has turned them under the check
  const tick = (i, k) => `<g transform="rotate(${WEEKS[i]} ${C} ${C})">${k === 0 ? `<path class="wr__t wr__t--0" d="${tickD}" pathLength="1"/>` : it({ tag: "path", cls: `wr__t wr__t--${i}`, k, fx: "draw", win: ".55,1", attrs: `d="${tickD}" pathLength="1"` })}</g>`;
  const ring = it({ tag: "svg", cls: "wr__ring", k: 0, fx: "draw", win: ".25,1", attrs: SVG, html: `<circle cx="${C}" cy="${C}" r="${R}" pathLength="1" transform="rotate(-90 ${C} ${C})"/>${nodes}${tick(0, 0)}` });
  const ticks = (k) => `<svg class="wr__ticks" ${SVG}>${tick(k, k)}</svg>`;
  // three nested rotors: each turns a quarter back on its press, so the turns add up week by week (data-keep: they stand from the entry)
  const rotor = (k, inner) => it({ tag: "div", cls: "wr__rot", k, fx: "none", attrs: "data-scene data-keep", html: inner });
  const turning = rotor(1, rotor(2, rotor(3, `${ring}${ticks(1)}${ticks(2)}${ticks(3)}`)));
  // the check runs: a playhead dot goes once round the ring on each of presses 1 to 3 and rests at twelve o'clock, under the bell
  const head = `<svg class="wr__ph" ${SVG}><circle cx="${C}" cy="${C - R}" r="13"/></svg>`;
  const orbit = (k, inner) => it({ tag: "div", cls: "wr__orb", k, fx: "none", attrs: "data-scene data-keep", html: inner });
  const playhead = orbit(1, orbit(2, orbit(3, head)));
  // the check stands still at twelve o'clock; the arrow outside the ring shows the way the weeks come round
  const top = at(0, R + 70);
  const bell = icon("bell", { cls: "wr__bell" }).replace("<svg ", `<svg style="left:${top.x}px;top:${top.y}px" `);
  const a0 = at(28, R + 46);
  const a1 = at(150, R + 46);
  // the head at the upper end: the weeks travel anticlockwise, so its wings point back along the clockwise tangent
  const tan = (28 * Math.PI) / 180;
  const wing = (turn) => { const a = tan + turn; return `${+(a0.x + 18 * Math.cos(a)).toFixed(1)} ${+(a0.y + 18 * Math.sin(a)).toFixed(1)}`; };
  const loop = `<svg class="wr__loop" ${SVG}><path d="M${a1.x} ${a1.y} A${R + 46} ${R + 46} 0 0 0 ${a0.x} ${a0.y}"/><path d="M${wing(0.49)} L${a0.x} ${a0.y} L${wing(-0.49)}"/></svg>`;
  const centre = `<div class="wr__c">${icon("register", { it, k: 0, win: ".1,.9", cls: "dr wr__reg" })}<b>${esc(t.reg)}</b><span><em>${d.register.rows}</em> ${esc(t.regN)}</span><small class="wr__l wr__l--paid">${esc(t.ring[0])}</small><small class="wr__l wr__l--free">${esc(t.ring[1])}</small></div>`;
  const ringHost = it({ id: "ring", tag: "div", cls: "wr fig", zone: "ring", fx: "none", attrs: `role="img" aria-label="${esc(`${t.reg}, ${d.register.rows} ${t.regN}. ${t.ring[0]} / ${t.ring[1]}`)}"`, html: `${loop}${turning}${playhead}${bell}${centre}` });
  // the two plans and the check's result rise into place when they arrive (flat since round 5) (no dashed placeholders before)
  const plans = it({
    id: "plans", tag: "div", cls: "wp wup3 fig", zone: "plans", k: 1, fx: "none", attrs: "data-scene",
    // the two plans sit in Claude's own window (D4): the scheduled task (paid) or the check by hand (Free) is a thing you do in Claude
    // round 6: the paid plan is the app's task: its card names it and says what it does; the window's bar carries its schedule,
    // its next run (the first check date of the register) and its state (hidden on Free: that plan has no task in Claude)
    html: `${claudePanel({ ui, crumbs: ui.scheduled, tail: `<span class="wp__m"><em>${clIcon("repeat")}${esc(ui.weekly)}</em><em>${esc(fill(ui.next, { date: dateText(iso, d.lang) }))}</em><em class="wp__on">${esc(ui.active)}</em></span>`, body: t.plans.map(([h, s], i) => `<p class="wp__c wp__c--${i ? "free" : "paid"}">${icon(i ? "calendar" : "clock")}<b>${esc(h)}</b><span>${esc(s)}</span></p>`).join("") })}<small>${esc(t.plansSrc)}</small>`,
  });
  const res = it({
    id: "res", tag: "div", cls: "wres cl-ui wup3 fig", zone: "res", k: 2, win: ".2,.9", fx: "none", attrs: "data-scene",
    // the weekly task's answer, as Claude's reply (D4)
    html: `<p class="wres__h">${spark()}${esc(fill(t.res, { date: dateText(iso, d.lang) }))}</p><p class="wres__n">${[day.expired, day.expiring, day.missing].map((n, i) => `<span><b>${n}</b><small>${esc(t.resL[i])}</small></span>`).join("")}</p><p class="wres__note">${esc(t.resNote)}</p>`,
  });
  const listIcons = ["inspector", "notebook", "lock"];
  const cards = t.list.map(([n, w, h], i) => rise(it, { cls: "wl__c", k: 3, win: spread(i, 3, 0, 0.6), html: `${icon(listIcons[i], { it, k: 3, win: spread(i, 3, 0.2, 0.6) })}<b>${esc(n)}</b><span>${esc(w)}</span><small>${esc(h)}</small>` })).join("");
  const list = it({ id: "list", tag: "div", cls: "wl fig", zone: "list", k: 3, out: 4, fx: "none", html: `${cards}<p class="wl__src">${esc(t.listSrc)}</p>` });
  // press 4: the three cases of the kit; the file names come from the zip of this edition: case A in the core path
  // (cases/, faelle/), cases B and C wherever the zip keeps them (extras/ since the lean kit of 13 Nov 2026)
  const caseFiles = ["A", "B", "C"].map((x) => d.kitPaths.find((p) => new RegExp(`(^|/)(case|fall)-${x}-[^/]*\\.md$`).test(p)));
  if (caseFiles.some((p) => !p) || caseFiles.length !== t.cases.length) throw new Error(`watch: the three case files are not all in the ${d.lang} zip`);
  const caseIcons = ["inspector", "coin", "sheet-check"];
  const caseCards = t.cases.map(([n, w], i) => rise(it, { cls: `wl__c${i === 0 ? " wl__c--on" : ""}`, k: 4, win: spread(i, 3, 0.3, 0.5), html: `${icon(caseIcons[i])}<b>${esc(n)}</b><span>${esc(w)}</span><small>${esc(caseFiles[i])}</small>` })).join("");
  const cases = it({ id: "cases", tag: "div", cls: "wl fig", zone: "cases", k: 4, fx: "none", html: `${caseCards}<p class="wl__src">${esc(t.casesSrc)}</p>` });
  // the toggle's target holds the ring and the plans: the Free state dims three week nodes and the paid card (CSS)
  const scene = `<div class="wv" data-w05-name="plan" data-w05-start-toggle="paid" data-w05-state="paid">${ringHost}${plans}</div>`;
  const stage = [
    it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", text: t.pill }),
    it({ id: "h", tag: "h2", cls: "headline hl", zone: "h", text: t.h }),
    cap(it, "c0", t.c0, 0, 1),
    cap(it, "c1", t.c1, 1, 2),
    cap(it, "c2", t.c2, 2, 3),
    cap(it, "c3", t.c3, 3, 4),
    cap(it, "c4", t.c4, 4, null),
    scene,
    toggle(it, { id: "tg", zone: "tg", k: 1, win: ".6,1", target: "plan", values: ["paid", "free"], labels: t.tg, aria: t.tgAria }),
    res,
    list,
    cases,
  ].join("\n");
  return { head: "", stage };
}
