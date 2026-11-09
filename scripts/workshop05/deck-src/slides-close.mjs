/**
 * S16 close (REDESIGN-3 D4). Press 0: the payoff. Last time, Monday to Thursday, greyed; next time, the register rows and a weekly
 * check with its three lists for the exercise day (the oracle). Press 1: the four doors of slide 4 again, the same poll, the first
 * vote as ghost bars. Press 2: the take-away, three QR cards in a clean row and the question round. Nothing overlaps: each press
 * replaces the one before.
 */
import { esc } from "./motion.mjs";
import { draw, icon } from "./scene.mjs";
import { cap } from "./slides-intro.mjs";
import { pollButtons } from "./slides-parts.mjs";
import { rowCells } from "./slides-rules.mjs";

const img = (label) => ` role="img" aria-label="${esc(label)}"`;

/** Last time against next time: four greyed days beside the register and its weekly loop. */
function payoff(it, c, d, { k, out }) {
  const l = c.s.letter;
  const r = c.s.register;
  const w = c.s.watch;
  const t = c.s.close;
  const day = Object.values(d.register.byDate)[0];
  const days = [0, 1, 2, 3].map((i) => `<li><b>${esc(l.days[i])}</b><span>${esc(l.ev[i])}</span></li>`).join("");
  const rows = d.register.sample.slice(0, 3).map((x) => `<p class="ct__row">${rowCells(x, c).map((y) => `<span>${esc(y)}</span>`).join("")}</p>`).join("");
  const counts = [day.expired, day.expiring, day.missing].map((n, i) => `<span><b>${n}</b><small>${esc(w.resL[i])}</small></span>`).join("");
  return it({
    id: "pay", tag: "div", cls: "ct cp fig", zone: "pay", k, out, fx: "none",
    html: `<div class="ct__old"><b class="ct__l">${esc(r.then)}</b><ol>${days}</ol></div><div class="ct__new"><b class="ct__l">${esc(t.now)}</b>${rows}<p class="cp__wk">${icon("loop", { it, k, win: ".3,1", cls: "cp__loop" })}<b>${esc(t.wk)}</b>${counts}</p></div>`,
  });
}

export function close(it, ctx, d, c) {
  const t = c.s.close;
  const ed = d.lang === "en" ? "-en" : "";
  const bars = [0, 1, 2, 3].map((i) => it({ tag: "i", cls: "gb__bar", k: 1, out: 2, fx: "line", win: ".3,1", attrs: `data-value="${i}"` })).join("");
  const ghost = it({ id: "gb", tag: "div", cls: "gb fig", zone: "gb", k: 1, out: 2, fx: "none", win: ".3,1", attrs: `data-poll-show="door"${img(t.gb)}`, html: bars });
  const urls = { kit: "/workshops/audit-vorbereitung-mit-ki/kit", demo: "/demos/audit-vorbereitung-mit-ki", skill: "/skills/audit-nachweise" };
  // the web address breaks at its slashes, never inside a word
  const address = (code) => esc(`loehrning.ai${d.lang === "en" && code !== "skill" ? "/en" : ""}${urls[code]}`).replace(/\//g, "/<wbr>");
  const qr = ["kit", "demo", "skill"]
    .map((code, i) => `<figure class="qr"><img src="./assets/qr-${code}-g26${ed}.svg" width="300" height="300" alt="${esc(t.qrLabels[i])}"><figcaption><b>${esc(t.qrLabels[i])}</b><span class="fig qr__url">${address(code)}</span></figcaption></figure>`)
    .join("");
  const icons = ["door", "paper", "check", "ask"];
  const doors = t.pb.map((x, i) => `<li>${draw(icons[i])}<b>${esc(x)}</b></li>`).join("");
  const stage = [
    it({ id: "h0", tag: "h2", cls: "headline hl", zone: "h", out: 1, text: t.h0 }),
    it({ id: "h", tag: "h2", cls: "headline hl", zone: "h", k: 1, out: 2, win: ".3,1", text: t.h }),
    it({ id: "t2", tag: "h2", cls: "headline hl", zone: "h", k: 2, win: ".3,1", text: t.t2 }),
    cap(it, "pay0", t.pay, 0, 1),
    payoff(it, c, d, { k: 0, out: 1 }),
    it({ id: "doors", tag: "ul", cls: "doors fig", zone: "doors", k: 1, out: 2, win: ".3,1", html: doors }),
    it({ id: "pc", cls: "t cap", zone: "cap", k: 1, out: 2, win: ".3,1", text: t.pc }),
    pollButtons(it, { id: "pb", name: "door-end", labels: t.pb, k: 1, out: 2, zone: "pb", win: ".3,1" }),
    ghost,
    it({ id: "qr", tag: "div", cls: "qrs fig", zone: "qr", k: 2, win: ".3,1", attrs: img(t.qrLabels.join(", ")), html: qr }),
    it({ id: "qs", cls: "t t--lead", zone: "qs", k: 2, win: ".45,1", text: t.qs }),
  ].join("\n");
  return { head: "", stage };
}
