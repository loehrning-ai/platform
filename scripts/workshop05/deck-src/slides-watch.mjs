/**
 * S14 watch: set Claude up so the firm stays ready (REDESIGN-3 D4). One scene: a clock ring around the register.
 * Press 0: the register (its row count from the oracle) in the middle; the ring with one node per week draws around it (M13).
 * Press 1: the two ways to keep the rhythm stand beside it, a toggle shows the Free plan's monthly rhythm instead (CLAUDE-22,
 * CLAUDE-23: scheduled tasks are paid only, the built-in schedule has no monthly option). Press 2: the bell on check day and the
 * loop around the ring draw; the check's three lists for the exercise day (expected.json). Press 3: the watch list of official
 * sources stands up (CLAUDE-82, 84, 85; ENER rejected, not shown). Press 4: the sentence template for the learner's own firm.
 * The slide builds: the two plans, the toggle and the check's result stay to the end; the watch list and then the sentence
 * template take the lower slot in turn.
 */
import { esc, fill, spread } from "./motion.mjs";
import { icon, standUp, toggle } from "./scene.mjs";
import { cap } from "./slides-intro.mjs";

const SIZE = 580;
const R = 240;
const C = SIZE / 2;
/** A point on the ring at an angle in degrees (0 is twelve o'clock, clockwise). */
const at = (deg, r = R) => ({ x: +(C + r * Math.sin((deg * Math.PI) / 180)).toFixed(1), y: +(C - r * Math.cos((deg * Math.PI) / 180)).toFixed(1) });
const dateText = (iso, lang) => new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const SVG = `viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`;
/** The week nodes (four, one month) and the day the bell rings on (the third node). */
const WEEKS = [0, 90, 180, 270];
const BELL = 90;

export function watch(it, ctx, d, c) {
  const t = c.s.watch;
  const [iso, day] = Object.entries(d.register.byDate)[0];
  const nodes = WEEKS.map((deg, i) => { const p = at(deg); return `<circle class="wr__n wr__n--${i}" cx="${p.x}" cy="${p.y}" r="16" pathLength="1"/>`; }).join("");
  const ring = it({ tag: "svg", cls: "wr__ring", k: 0, fx: "draw", win: ".25,1", attrs: SVG, html: `<circle cx="${C}" cy="${C}" r="${R}" pathLength="1" transform="rotate(-90 ${C} ${C})"/>${nodes}` });
  // the loop: an arc outside the ring with its arrow head, three quarters round, drawn on check day
  const a0 = at(20, R + 34);
  const a1 = at(300, R + 34);
  // the arrow head at the end: two wings back along the clockwise tangent, 28 degrees either side
  const tan = (300 * Math.PI) / 180;
  const wing = (turn) => { const a = Math.atan2(-Math.sin(tan), -Math.cos(tan)) + turn; return `${+(a1.x + 20 * Math.cos(a)).toFixed(1)} ${+(a1.y + 20 * Math.sin(a)).toFixed(1)}`; };
  const loop = it({ tag: "svg", cls: "wr__loop", k: 2, fx: "draw", win: ".25,1", attrs: SVG, html: `<path d="M${a0.x} ${a0.y} A${R + 34} ${R + 34} 0 1 1 ${a1.x} ${a1.y}" pathLength="1"/><path d="M${wing(0.49)} L${a1.x} ${a1.y} L${wing(-0.49)}" pathLength="1"/>` });
  const b = at(BELL);
  const bell = icon("bell", { it, k: 2, win: "0,.6", cls: "wr__bell" }).replace("<svg ", `<svg style="left:${b.x}px;top:${b.y}px" `);
  const centre = `<div class="wr__c">${icon("register", { it, k: 0, win: ".1,.9", cls: "dr wr__reg" })}<b>${esc(t.reg)}</b><span><em>${d.register.rows}</em> ${esc(t.regN)}</span><small class="wr__l wr__l--paid">${esc(t.ring[0])}</small><small class="wr__l wr__l--free">${esc(t.ring[1])}</small></div>`;
  const ringHost = it({ id: "ring", tag: "div", cls: "wr fig", zone: "ring", fx: "none", attrs: `role="img" aria-label="${esc(`${t.reg}, ${d.register.rows} ${t.regN}. ${t.ring[0]} / ${t.ring[1]}`)}"`, html: `${ring}${loop}${bell}${centre}` });
  const plans = it({
    id: "plans", tag: "div", cls: "wp fig", zone: "plans", k: 1,
    html: `${t.plans.map(([h, s], i) => `<p class="wp__c wp__c--${i ? "free" : "paid"}">${icon(i ? "calendar" : "clock")}<b>${esc(h)}</b><span>${esc(s)}</span></p>`).join("")}<small>${esc(t.plansSrc)}</small>`,
  });
  const res = it({
    id: "res", tag: "div", cls: "wres fig", zone: "res", k: 2, win: ".35,1",
    html: `<p class="wres__h">${esc(fill(t.res, { date: dateText(iso, d.lang) }))}</p><p class="wres__n">${[day.expired, day.expiring, day.missing].map((n, i) => `<span><b>${n}</b><small>${esc(t.resL[i])}</small></span>`).join("")}</p><p class="wres__note">${esc(t.resNote)}</p>`,
  });
  const listIcons = ["inspector", "notebook", "lock"];
  const cards = t.list.map(([n, w, h], i) => standUp(it, { cls: "wl__c", k: 3, win: spread(i, 3, 0, 0.6), html: `${icon(listIcons[i], { it, k: 3, win: spread(i, 3, 0.2, 0.6) })}<b>${esc(n)}</b><span>${esc(w)}</span><small>${esc(h)}</small>` })).join("");
  const list = it({ id: "list", tag: "div", cls: "wl w05-s3d fig", zone: "list", k: 3, out: 4, fx: "none", html: `${cards}<p class="wl__src">${esc(t.listSrc)}</p>` });
  const yours = it({
    id: "yours", tag: "div", cls: "wy", zone: "yours", k: 4, win: ".3,1",
    html: `${it({ tag: "p", cls: "t t--tpl wy__tp", k: 4, text: t.tp })}<p class="wy__ex fig">${esc(t.ex)}</p><p class="wy__line fig"><span>${esc(t.yours)}</span>${it({ tag: "i", cls: "yours__line", k: 4, fx: "line", win: ".35,1" })}</p>`,
  });
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
    yours,
  ].join("\n");
  return { head: "", stage };
}
