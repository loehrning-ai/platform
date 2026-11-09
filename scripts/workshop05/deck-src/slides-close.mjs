/**
 * S16 close (REDESIGN-3 D4). Press 0: last time, Monday to Thursday, four greyed day cards across the page. Press 1: the payoff:
 * the four days fold together into one register row, and the weekly check with its three lists for the exercise day (the
 * kit's answer key) rises under it (one scene). No duration race here: slide 7 carries Claude's run time with its caveat. Press 2: the four doors of slide 4 again, the same poll, the first vote as ghost bars.
 * Press 3: the take-away, three QR cards in a clean row and the question round. Each press replaces the one before.
 */
import { esc, spread } from "./motion.mjs";
import { draw, icon, rise } from "./scene.mjs";
import { cap } from "./slides-intro.mjs";
import { pollButtons } from "./slides-parts.mjs";
import { rowCells } from "./slides-rules.mjs";

const img = (label) => ` role="img" aria-label="${esc(label)}"`;

/** Last time folds into next time: four greyed days (standing from the entry) fold into one register row and the weekly loop on press k; the whole card leaves on press out. */
function payoff(it, c, d, { k, out }) {
  const l = c.s.letter;
  const r = c.s.register;
  const w = c.s.watch;
  const t = c.s.close;
  const day = Object.values(d.register.byDate)[0];
  // the four days gather onto Monday one after another (--i staggers each card's share of the press), then the gathered card
  // unrolls to the right as the register row
  const days = [0, 1, 2, 3].map((i) => `<li style="--i:${i};--dx:${-i * 429}px"><b>${esc(l.days[i])}</b><span>${esc(l.ev[i])}</span></li>`).join("");
  const row = `<p class="cp__row">${rowCells(d.register.sample[0], c).map((y) => `<span>${esc(y)}</span>`).join("")}</p>`;
  const counts = [day.expired, day.expiring, day.missing].map((n, i) => `<span><b>${n}</b><small>${esc(w.resL[i])}</small></span>`).join("");
  // the fold (the scene, no exit of its own, so it stays folded) sits in a plain card that stands from the entry and leaves on press out
  const fold = it({
    tag: "div", cls: "cp", k, fx: "none", attrs: "data-scene data-keep",
    html: `<div class="cp__old"><b class="cp__l">${esc(r.then)}</b><ol>${days}</ol></div><div class="cp__new"><b class="cp__l">${esc(t.now)}</b>${row}<p class="cp__wk">${icon("loop", { it, k, win: ".4,1", cls: "cp__loop" })}<b>${esc(t.wk)}</b>${counts}</p></div>`,
  });
  return it({ id: "pay", tag: "div", cls: "cpw fig", zone: "pay", out, html: fold });
}

export function close(it, ctx, d, c) {
  const t = c.s.close;
  const pay = String(t.pay).split(/(?<=\.)\s+/);
  if (pay.length !== 2) throw new Error("close.pay: expected two sentences, last time and next time");
  const ed = d.lang === "en" ? "-en" : "";
  const bars = [0, 1, 2, 3].map((i) => it({ tag: "i", cls: "gb__bar", k: 2, out: 3, fx: "line", win: ".3,1", attrs: `data-value="${i}"` })).join("");
  const ghost = it({ id: "gb", tag: "div", cls: "gb fig", zone: "gb", k: 2, out: 3, fx: "none", win: ".3,1", attrs: `data-poll-show="door"${img(t.gb)}`, html: bars });
  const urls = { kit: "/workshops/audit-vorbereitung-mit-ki/kit", demo: "/demos/audit-vorbereitung-mit-ki", skill: "/skills/audit-nachweise.zip" };
  // the code carries the full address; the card names only the site, so the caption stays one line (the alt text keeps the path)
  const address = (code) => `loehrning.ai${d.lang === "en" && code !== "skill" ? "/en" : ""}${urls[code]}`;
  // press 3: once the poll has gone (it leaves by .25) the three cards rise in turn (one scene); never over the poll icons
  const qr = ["kit", "demo", "skill"]
    .map((code, i) => rise(it, { tag: "figure", cls: "qr", k: 3, win: spread(i, 3, 0.25, 0.5), html: `<img src="./assets/qr-${code}-g26${ed}.svg" width="300" height="300" alt="${esc(`${t.qrLabels[i]}: ${address(code)}`)}"><figcaption><b>${esc(t.qrLabels[i])}</b><span class="fig qr__url">loehrning.ai</span></figcaption>` }))
    .join("");
  // Labour is the inspector, "not sure" a question mark
  const icons = ["inspector", "paper", "check", "question"];
  const doors = t.pb.map((x, i) => `<li>${draw(icons[i])}<b>${esc(x)}</b></li>`).join("");
  const stage = [
    it({ id: "h0", tag: "h2", cls: "headline hl", zone: "h", out: 2, text: t.h0 }),
    it({ id: "h", tag: "h2", cls: "headline hl", zone: "h", k: 2, out: 3, win: ".3,1", text: t.h }),
    it({ id: "t2", tag: "h2", cls: "headline hl", zone: "h", k: 3, win: ".3,1", text: t.t2 }),
    // the payoff sentence in its two halves: last time with the greyed days, next time with the fold
    cap(it, "pay0", pay[0], 0, 1),
    cap(it, "pay1", pay[1], 1, 2, { win: ".3,1" }),
    payoff(it, c, d, { k: 1, out: 2 }),
    // entrants in zones nobody leaves start early, so the frame never passes through empty paper (the M2 law holds for shared zones)
    // press 2 has no empty beat: the doors and the poll arrive from the first frame while the payoff fades (other zones)
    it({ id: "doors", tag: "ul", cls: "doors fig", zone: "doors", k: 2, out: 3, win: "0,.4", html: doors }),
    it({ id: "pc", cls: "t cap", zone: "cap", k: 2, out: 3, win: ".3,1", text: t.pc }),
    pollButtons(it, { id: "pb", name: "door-end", labels: t.pb, k: 2, out: 3, zone: "pb", win: "0,.45" }),
    ghost,
    it({ id: "qr", tag: "div", cls: "qrs fig", zone: "qr", k: 3, fx: "none", attrs: img(t.qrLabels.join(", ")), html: qr }),
    it({ id: "qs", cls: "t t--lead", zone: "qs", k: 3, win: ".15,.6", text: t.qs }),
  ].join("\n");
  return { head: "", stage };
}
