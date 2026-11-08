/**
 * Part 3 to 5 of the deck: S11 ladder, S12 register, S13 other, S14 own, S15 close. One scene per slide: the headline stays,
 * the drawing (a ladder, a register table, cadence cards, a sentence paper) grows press by press. Labels on a drawing are
 * figure cells (class fig); captions and sources are counted words. Numbers of the register come from the oracle (data.mjs).
 */
import { esc, fill, spread } from "./motion.mjs";
import { draw, durationText } from "./scene.mjs";
import { cap, head, src } from "./slides-intro.mjs";
import { claudeWindow, pollButtons, progress, promptBubble, takeView } from "./slides-parts.mjs";
import { turnOf } from "./take.mjs";

const split = (text) => String(text).split(" · ");
const img = (label) => ` role="img" aria-label="${esc(label)}"`;
const dateText = (iso, lang) => new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const sentences = (text) => String(text).split(/(?<=\.)\s+/);

/** S11: the rules on cards (the record rule beside a struck record card), a ladder of four rungs placed one by one, the pick, the four gates. */
export function ladder(it, ctx, d, c) {
  const t = c.s.ladder;
  const rungs = split(t.rg);
  const m = /^(.*?):\s*(.*?)\.\s*(.*)$/.exec(t.g);
  if (!m) throw new Error("ladder.g: expected 'Gates: a, b, c, d. Ask ...'");
  const gates = m[2].split(", ");
  // rungs from the top (level 4) down; level 1 is placed first, levels 3 and 4 together with the poll
  const press = [1, 2, 3, 3];
  const ladderHtml = [3, 2, 1, 0]
    .map((i) => {
      const dim = i < 2 ? ' data-dim="4"' : "";
      const k = press[i];
      const win = i === 3 ? ".45,1" : i === 2 ? ".0,.55" : "";
      return `<li class="lad__r lad__r--${i + 1}"${dim}>${it({ tag: "i", cls: "lad__bar", k, win: win || undefined, attrs: "" })}<span class="lad__w">${it({ tag: "b", cls: "lad__t", k, win: win || undefined, text: rungs[i] })}${it({ tag: "small", cls: "lad__x", k, win: win || undefined, text: t.ex[i] })}</span></li>`;
    })
    .join("");
  const gateHtml = gates.map((x, i) => it({ tag: "li", cls: "lad__g", k: 5, win: spread(i, gates.length, 0.1, 0.5), text: x })).join("");
  const stage = [
    head(it, t),
    it({
      id: "rules", tag: "ul", cls: "rls fig", zone: "rules", fx: "none",
      html: [
        it({ tag: "li", cls: "rls__c", k: 0, html: `${draw("check")}<span>${esc(t.r1)}</span>` }),
        it({ tag: "li", cls: "rls__c", k: 1, html: `${draw("person")}<span>${esc(t.r2)}</span>` }),
        it({ tag: "li", cls: "rls__c rls__c--rec", k: 2, html: `<span class="rls__doc">${draw("paper")}${it({ tag: "i", cls: "rls__strike", k: 2, fx: "line", win: ".35,1" })}</span><span>${esc(t.r3)}</span>` }),
      ].join(""),
    }),
    it({ id: "lad", tag: "div", cls: "lad fig", zone: "lad", fx: "none", attrs: img(t.rg), html: `<i class="lad__rail lad__rail--l"></i><i class="lad__rail lad__rail--r"></i><a href="#a2" aria-label="${esc(t.rgAria ?? t.rg)}"><ol class="lad__rs">${ladderHtml}</ol></a>` }),
    it({ id: "pq", cls: "t cap fig", zone: "cap", k: 3, out: 4, text: t.pq }),
    pollButtons(it, { id: "pb", name: "ladder", labels: t.pb, k: 3, out: 4, zone: "pb" }),
    cap(it, "a", t.a, 4, 5),
    it({ id: "a2", cls: "t cap", zone: "cap2", k: 4, out: 5, text: t.a2 }),
    cap(it, "g", m[3], 5, null),
    it({ id: "gates", tag: "div", cls: "lad__gl fig", zone: "pb", k: 5, fx: "none", html: `<b>${esc(m[1])}</b><ul>${gateHtml}</ul>` }),
  ].join("\n");
  return { head: "", stage };
}

/**
 * The cells of a register row as the slides show them: id, paper, date, valid until, owner. The kit's business files are
 * English, so the German edition shows the German word for a paper, a role and the missing mark (copy: register.words);
 * a row with no end date says "no end", a missing paper says "open" (never an empty cell).
 */
export const rowCells = (r, c) => {
  const w = c.s.register.words;
  const missing = r.date === "MISSING";
  return [
    r.id,
    w.papers[r.paper] ?? r.paper,
    missing ? w.missing : r.date,
    r.validUntil || (missing ? w.open : w.noEnd),
    w.owners[r.owner] ?? r.owner,
  ];
};

/** The contrast the register ends on: last time (Mon to Thu, greyed) beside register rows and the next letter. */
export function contrast(it, c, d, { id, zone, k, out, win, rows = 1 }) {
  const l = c.s.letter;
  const t = c.s.register;
  const days = [0, 1, 2, 3].map((i) => `<li><b>${esc(l.days[i])}</b><span>${esc(l.ev[i])}</span></li>`).join("");
  const lines = d.register.sample.slice(0, rows).map((r) => `<p class="ct__row">${rowCells(r, c).map((x) => `<span>${esc(x)}</span>`).join("")}</p>`).join("");
  const z3 = sentences(t.z).at(-1);
  return it({
    id, tag: "div", cls: "ct fig", zone, k, out, win, fx: "none",
    html: `<div class="ct__old"><b class="ct__l">${esc(t.then)}</b><ol>${days}</ol></div><div class="ct__new"><b class="ct__l">${esc(t.tbl)}</b>${lines}<p class="ct__next">${esc(t.next)}</p><small>${esc(z3)}</small></div>`,
  });
}

/** S12: step 4. Window on a register table: the window leaves and the table fills, three dates change its counts, a question to it, the road. */
export function register(it, ctx, d, c, T) {
  const t = c.s.register;
  const take = takeView(it, { c, d, takes: T, key: "register", slot: "step4", k: 2, ms: 1200, out: { take: 3, chip: 3, key: 3, time: 3 }, files: true, time: { id: "time", zone: "l3" }, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const take2 = takeView(it, { c, d, takes: T, key: "register", slot: "ask", k: 6, ms: 1200, out: { take: 7, chip: 7, key: 7 }, tools: false, ids: { take: "take2", chip: "chip2", key: "key2" }, zones: { take: "t2", chip: "l2", key: "l3" } });
  const thread1 = [
    it({ id: "pr", tag: "div", cls: "tk-slot", zone: "t", k: 1, out: 2, html: promptBubble(c, 4, d.prompts.step4) }),
    take.take,
  ].join("");
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread: thread1, k: 1, out: 3, cls: "tk-cw--register" });
  const thread2 = [
    it({ id: "pr2", tag: "div", cls: "tk-slot", zone: "t", k: 6, out: 7, html: promptBubble(c, 5, d.prompts.step4b, { full: true }) }),
    take2.take,
  ].join("");
  const win2 = claudeWindow(it, { id: "win2", crumbs: t.win, thread: thread2, k: 6, out: 7, zone: "w2", cls: "tk-cw--register" });

  const none = c.take.noOwner;
  const colNames = [t.cols[0], t.cols[1], t.cols[2], t.cols[3], t.own, t.appr];
  const head6 = colNames.map((x) => `<span>${esc(x)}</span>`).join("");
  const sample = d.register.sample;
  // the frame (file name and header row) stands from the first press; the rows come in at press 3, after the window has left
  const rowsHtml = sample.map((r, i) => it({ tag: "p", cls: "reg__r", k: 3, win: spread(i, sample.length, 0.3, 0.3), html: [...rowCells(r, c), none].map((x, j) => `<span${j === 5 ? ' class="reg__na"' : ""}>${esc(x)}</span>`).join("") })).join("");
  const dates = Object.entries(d.register.byDate);
  const scrub = dates
    .map(([iso, n], i) => {
      const k = i === 0 ? 4 : 5;
      const win = i === 0 ? ".2,.9" : spread(i - 1, 2, 0, 0.5);
      const p = i === 0 ? null : dates[i - 1][1];
      const now = [n.rows, n.expired, n.expiring, n.missing];
      const before = i === 0 ? [0, 0, 0, 0] : [p.rows, p.expired, p.expiring, p.missing];
      const cells = now
        .map((v, j) => `<span class="scr__c"><b>${it({ tag: "span", k, win: i === 0 ? ".3,.9" : win, fx: "none", count: `0,${v},0`, text: String(v) })}</b><small>${esc(t.dc[j])}</small></span>`)
        .join("");
      return it({ tag: "p", cls: `scr__r scr__r--${i}`, k, win, html: `<i class="scr__node"></i><span class="scr__d">${esc(dateText(iso, d.lang))}</span>${cells}` });
    })
    .join("");
  const total = d.register.rows;
  const reg = it({
    id: "reg", tag: "div", cls: "reg fig", zone: "reg", fx: "none", out: 7, attrs: img(t.tbl),
    html: `<p class="reg__f">${esc(t.tbl)}</p><p class="reg__h">${head6}</p>${rowsHtml}${it({ tag: "p", cls: "reg__n", k: 3, win: ".3,1", html: `<b>${it({ tag: "span", k: 3, win: ".3,1", count: `0,${total},0`, text: String(total) })}</b><small>${esc(t.dc[0])}</small>` })}<div class="scr">${scrub}</div>`,
  });
  const z = sentences(t.z);
  // the recorded time of the step 4 turn (stats.duration_ms), only when the recording carries it, never typed
  const builtTime = take.rec ? durationText(turnOf(take.rec, "register", "step4")) : null;
  const built = builtTime ? it({ id: "built", tag: "p", cls: "t t--s built fig", zone: "l2", k: 7, text: fill(t.built, { time: builtTime }) }) : "";
  const stage = [
    it({ id: "h", tag: "h2", cls: "headline headline--s", zone: "h", text: t.h }),
    progress(it, 4),
    reg,
    win,
    win2,
    it({ id: "st", cls: "t t--s", zone: "l1", out: 1, text: t.st }),
    it({ id: "pl", cls: "t t--s", zone: "l1", k: 1, out: 2, text: t.pl }),
    it({ id: "pf", cls: "src", zone: "l2", k: 1, out: 2, text: t.pf }),
    take.chip, take.key, take.time,
    it({ id: "hc", cls: "t t--s", zone: "l1", k: 3, out: 4, text: t.hc }),
    it({ id: "m", cls: "t t--s", zone: "l1", k: 4, out: 5, text: t.m }),
    it({ id: "dm", cls: "t t--s", zone: "l1", k: 5, out: 6, text: t.dm }),
    it({ id: "aq", cls: "t t--s", zone: "l1", k: 6, out: 7, text: t.aq }),
    take2.chip, take2.key,
    it({ id: "z", cls: "t t--s", zone: "l1", k: 7, text: `${z[0]} ${z[1]}` }),
    contrast(it, c, d, { id: "pay", zone: "pay", k: 7, rows: 3 }),
    built,
  ].join("\n");
  return { head: "", stage, take, take2 };
}

/** S13: four checkers as cards (how often, how it starts), the poll, then the register's four homes as small tables. */
export function other(it, ctx, d, c) {
  const t = c.s.other;
  const r = c.s.register;
  const icons = ["door", "paper", "check", "person"];
  const cards = t.table.rows
    .map((row, i) => it({ tag: "li", cls: "cad__c", k: 0, html: `<span class="cad__h">${draw(icons[i])}<b>${esc(row[0])}</b></span><span class="cad__o">${esc(row[1])}</span><span class="cad__s">${esc(row[2])}</span>` }))
    .join("");
  const cols = [r.cols[1], r.cols[3]];
  const demo = d.register.sample[2];
  const cells = rowCells(demo, c);
  const sample = [cells[1], cells[3]];
  const homes = split(r.hm)
    .map((name, i) => it({ tag: "li", cls: "hm__c", k: 2, win: spread(i, 4, 0, 0.45), html: `<b>${esc(name)}</b><span class="hm__h">${cols.map((x) => `<small>${esc(x)}</small>`).join("")}</span><span class="hm__r">${sample.map((x) => `<small>${esc(x)}</small>`).join("")}</span>` }))
    .join("");
  const stage = [
    head(it, t),
    it({ id: "cards", tag: "ul", cls: "cad fig", zone: "cards", fx: "none", attrs: `data-dim="2"${img(t.tb)}`, html: cards }),
    it({ id: "tg", cls: "src fig", zone: "src", html: `<a href="#a4">${esc(t.tg)}</a>` }),
    cap(it, "pq", t.pq, 1, null),
    pollButtons(it, { id: "pb", name: "door", labels: t.pb, k: 1, zone: "pb" }),
    it({ id: "homes", tag: "div", cls: "hm fig", zone: "homes", k: 2, fx: "none", html: `<ul>${homes}</ul><div class="hm__t"><p>${esc(r.hmc)}</p><p class="hm__f">${esc(r.fd)} <small>${esc(r.fdt)}</small></p></div>` }),
  ].join("\n");
  return { head: "", stage };
}

/** S14: the six boxes of the sheet stay; the sentence paper fills part by part and each part lights the box it came from; yours is a ruled line; one register row. */
export function own(it, ctx, d, c) {
  const t = c.s.own;
  const labels = split(t.sh);
  const parts = t.exp.map((x) => x.split("|")).map(([text, box]) => ({ text, box: box ? Number(box) : 0 }));
  if (parts.map((p) => p.text).join("") !== t.ex) throw new Error(`own.exp does not join to own.ex: ${parts.map((p) => p.text).join("")}`);
  const winOf = (i) => spread(i, parts.length, 0, 0.55);
  const lit = {};
  parts.forEach((p, i) => { if (p.box) lit[p.box] = winOf(i); });
  const boxes = labels
    .map((x, i) => `<span class="sh__c${i === 5 ? " sh__c--you" : ""}">${lit[i + 1] ? it({ tag: "i", cls: "sh__lit", k: 2, win: lit[i + 1] }) : ""}<i>${i + 1}</i>${esc(x)}</span>`)
    .join("");
  const exHtml = parts.map((p, i) => it({ tag: "span", cls: `sent__w${p.box ? ` sent__w--${p.box}` : ""}`, k: 2, win: winOf(i), text: p.text })).join("");
  const sent = it({
    id: "sent", tag: "div", cls: "sent fig", zone: "sent", fx: "none",
    html: `${it({ tag: "p", cls: "sent__tp", k: 1, out: 2, win: ".0,.5", text: t.tp })}<p class="sent__ex">${exHtml}</p>`,
  });
  const cols = [...c.s.register.cols.slice(0, 4), c.s.register.own, c.s.register.appr];
  const stage = [
    head(it, t),
    it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", text: t.pill }),
    it({ id: "sh", tag: "div", cls: "sh fig", zone: "strip", fx: "none", attrs: img(labels.join(", ")), html: boxes }),
    sent,
    it({ id: "yours", tag: "div", cls: "yours fig", zone: "yours", k: 3, fx: "none", html: `<span>${esc(labels[5])}</span>${it({ tag: "i", cls: "yours__line", k: 3, fx: "line", win: ".3,1" })}` }),
    cap(it, "lt", t.lit, 2, 3),
    cap(it, "wr", t.wr, 3, 4),
    it({ id: "wc", cls: "t cap", zone: "cap2", k: 3, out: 4, text: t.wc }),
    cap(it, "rg", t.rg, 4, null),
    it({ id: "rowb", tag: "div", cls: "rowb fig", zone: "row", k: 4, fx: "none", html: `<p class="rowb__h">${cols.map((x) => `<span>${esc(x)}</span>`).join("")}</p><p class="rowb__r">${cols.map(() => "<i></i>").join("")}</p><small>${esc(c.s.register.tbl)}</small>` }),
  ].join("\n");
  return { head: "", stage };
}

/** S15: the four doors of slide 13 again, the poll with the first vote as ghost bars, then the take-away, three QR codes in a clean row and the contrast. */
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
    it({ id: "h", tag: "h2", cls: "headline hl", zone: "h", out: 2, text: t.h }),
    it({ id: "doors", tag: "ul", cls: "doors fig", zone: "doors", out: 2, fx: "fade", html: doors }),
    it({ id: "pc", cls: "t cap", zone: "cap", k: 1, out: 2, text: t.pc }),
    pollButtons(it, { id: "pb", name: "door-end", labels: t.pb, k: 1, out: 2, zone: "pb" }),
    ghost,
    it({ id: "t", cls: "t t--lead", zone: "t", k: 2, text: t.t }),
    it({ id: "t2", cls: "t cap", zone: "t2", k: 2, text: t.t2 }),
    it({ id: "qr", tag: "div", cls: "qrs fig", zone: "qr", k: 2, attrs: img(split(t.qr).join(", ")), html: qr }),
    it({ id: "qs", cls: "t t--lead", zone: "qs", k: 2, text: t.qs }),
    contrast(it, c, d, { id: "echo", zone: "echo", k: 2, rows: 2 }),
  ].join("\n");
  return { head: "", stage };
}
