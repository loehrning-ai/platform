/**
 * Part 2 of the deck: S06 kit, S07 step 1, S08 step 2, S09 tests, S10 step 3. Each slide is one scene: the headline stays, the
 * drawing grows press by press. The take slides keep the Claude window replica with the kit prompt, then the real recorded
 * answer (slides-parts.mjs, take.mjs), its chip, its key line and, when the recording carries one, its measured time.
 */
import { esc, fill, spread } from "./motion.mjs";
import { draw } from "./scene.mjs";
import { head } from "./slides-intro.mjs";
import { claudeWindow, filePreviews, ico, pollButtons, progress, promptBubble, takeView } from "./slides-parts.mjs";

const split = (text) => String(text).split(" · ");
const img = (label) => ` role="img" aria-label="${esc(label)}"`;
/** "QUOTE: words copied" to a bold label and the rest. */
const labelled = (text) => {
  const at = text.indexOf(": ");
  return at < 0 ? esc(text) : `<b>${esc(text.slice(0, at + 1))}</b> ${esc(text.slice(at + 2))}`;
};
const cap = (it, id, text, k, out, extra = {}) => it({ id, cls: "t cap", zone: "cap", k, out, text, ...extra });

/** S06: the zip, the files in it (folders with their file counts), the Claude project they flow into, the three steps on a rail, the data rule. */
export function kit(it, ctx, d, c) {
  const t = c.s.kit;
  const v = (x) => fill(x, d.vars);
  const zipText = v(t.zip);
  const [zipName, ...zipRest] = zipText.split(",").map((x) => x.trim());
  const root = d.lang === "en" ? "../" : "./";
  const names = split(t.tree);
  const rows = names
    .map((name, i) => {
      const folder = name.endsWith("/");
      const count = folder ? `<em>${d.treeCounts[name] ?? ""}</em>` : "";
      return it({ tag: "li", k: 1, win: spread(i, names.length, 0, 0.45), html: `${ico(folder ? "folder" : "file")}<span>${esc(name)}</span>${count}` });
    })
    .join("");
  const [project, projectName, ...rest] = split(t.win);
  const side = rest.map((x, i) => it({ tag: "li", k: 2, fx: "move", win: spread(i, rest.length, 0, 0.55), attrs: 'style="--dx:-360px"', html: `${ico("folder")}<span>${esc(x)}</span>` })).join("");
  const win = claudeWindow(it, { id: "win", crumbs: `${project} · ${projectName}`, thread: `<ul class="tk-side fig">${side}</ul>`, zone: "w", cls: "tk-cw--small" });
  const steps = [t.s1, t.s2, t.s3].map((x, i) => it({ tag: "li", k: 2, win: spread(i, 3, 0.15, 0.5), html: `<b>${esc(x.slice(0, 1))}</b><span>${esc(x.slice(2))}</span>` })).join("");
  const stage = [
    head(it, t),
    it({ id: "zip", tag: "div", cls: "zipcard", zone: "zip", attrs: 'data-dim="2"', html: `${draw("zip")}<a class="zipbtn fig" href="${root}${esc(zipName)}" download aria-label="${esc(t.zipAria)}"><b>${esc(zipName)}</b><span>${esc(zipRest.join(", "))}</span></a>` }),
    it({ id: "tree", tag: "ul", cls: "tree fig", zone: "tree", k: 1, fx: "none", attrs: `data-dim="2"${img(t.tree)}`, html: rows }),
    win,
    it({ id: "steps", tag: "ol", cls: "steps3 fig", zone: "steps", k: 2, fx: "none", html: steps }),
    it({ id: "lv", tag: "div", cls: "kfoot", zone: "foot", k: 3, html: `<p class="t">${esc(v(t.lv))}</p><p class="t">${esc(t.go)}</p>` }),
  ].join("\n");
  return { head: "", stage };
}

/** The left column of a take slide: the headline and the four-dot progress stay; the captions swap in the slots l1 to l3. */
function promptPress(it, c, d, t, n, text) {
  return {
    h: it({ id: "h", tag: "h2", cls: "headline headline--s", zone: "h", text: t.h }),
    pl: it({ id: "pl", cls: "t t--s", zone: "l1", out: 1, text: t.pl }),
    pf: it({ id: "pf", cls: "src", zone: "l2", out: 1, text: t.pf }),
    pr: it({ id: "pr", tag: "div", cls: "tk-slot", zone: "t", out: 1, html: promptBubble(c, n, text) }),
    prog: progress(it, n),
  };
}

/** S07: step 1, make the table. */
export function step1(it, ctx, d, c, T) {
  const t = c.s.step1;
  const v = (x) => fill(x, d.vars);
  const p = promptPress(it, c, d, t, 1, d.prompts.step1);
  const questions = split(t.qs).map((q) => { const [id, ...rest] = q.split(" "); return `<li><b>${esc(id)}</b> ${esc(rest.join(" "))}</li>`; }).join("");
  const qs = it({ id: "qs", tag: "div", cls: "tk-doc fig", zone: "t", k: 1, out: 2, html: `<ul>${questions}</ul>` });
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step1", k: 2, ms: 1500, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread: `${p.pr}${qs}${take.take}` });
  const stage = [
    p.h, win, p.pl, p.pf, p.prog,
    it({ id: "pd", cls: "t t--s", zone: "l1", k: 1, out: 2, text: v(t.pd) }),
    it({ id: "pg", cls: "t t--s", zone: "l2", k: 1, out: 2, text: t.pg }),
    take.chip, take.key,
  ].join("\n");
  return { head: "", stage, take };
}

/** S08: step 2, run the check: the answer comes with a scan band and counters, then the measured time. */
export function step2(it, ctx, d, c, T) {
  const t = c.s.step2;
  const p = promptPress(it, c, d, t, 2, d.prompts.step2);
  const poll = pollButtons(it, { id: "pb", name: "finds", labels: d.finds.map(String), k: 1, out: 2, zone: "t", cls: "pb--grid" });
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step2", k: 2, ms: 1500, hit: true, head: true, scan: { id: "scan", zone: "l3" }, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread: `${p.pr}${poll}${take.take}` });
  const stage = [
    p.h, win, p.pl, p.pf, p.prog,
    it({ id: "fd", cls: "tk-def fig", zone: "l1", k: 1, out: 2, text: t.fd }),
    it({ id: "pq", cls: "t t--s", zone: "l2", k: 1, out: 2, text: t.pq }),
    take.chip, take.key, take.scan,
  ].join("\n");
  return { head: "", stage, take };
}

/** S09: the L10 row stays; four tests light up on it one after another, the ten jobs fill (eight listed), three statuses, the GAP lands on the row. */
export function tests(it, ctx, d, c) {
  const t = c.s.tests;
  const v = (x) => fill(x, d.vars);
  const pill = it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", text: t.pill });
  const [c0, c1, ...meta] = split(v(t.row));
  const rowHtml = `<span class="rw__c rw__c--0">${esc(c0)}</span><span class="rw__c rw__c--1">${esc(c1)}</span><div class="rw__m">${meta.map((x, i) => `<span class="rw__c rw__c--${i + 2}">${esc(x)}</span>`).join("")}</div>`;
  const jobs = Number(d.vars.jobs);
  const listed = Number(d.vars.listed);
  const slots = Array.from({ length: jobs }, (_, i) => (i < listed ? "<i data-cell></i>" : "<i></i>")).join("");
  const missing = t.miss.map((m, i) => `<b class="jobs__nm jobs__nm--${i}">${esc(m)}</b>`).join("");
  const names = it({ tag: "span", cls: "jobs__names", k: 4, fx: "fade", win: ".3,1", html: missing });
  const verdict = it({ tag: "span", cls: "chip chip--lg rwv", k: 4, win: ".3,1", attrs: 'data-tone="luecke"', text: t.s3.split(":")[0] });
  const tiles = ["t1", "t2", "t3", "t4"].map((id, i) => it({ tag: "li", cls: `tt__i tt__i--${i + 1}`, k: 1, win: spread(i, 4, 0, 0.5), html: labelled(t[id]) })).join("");
  const jobsRow = it({
    tag: "div", cls: "jobs", k: 3, fx: "none",
    html: `<span class="jobs__l">${esc(v(t.jl))}</span>${it({ tag: "span", cls: "jobs__slots", k: 3, fx: "none", fill: listed, win: ".1,.9", html: slots })}${names}`,
  });
  const row = it({
    id: "row", tag: "div", cls: "rwcard fig", zone: "row", fx: "none", attrs: img(v(t.row)),
    html: `<div class="rw">${rowHtml}</div>${it({ tag: "ul", cls: "tt", k: 1, fx: "none", html: tiles })}${jobsRow}${verdict}`,
  });
  const tone = { s1: "belegt", s2: "schwach", s3: "luecke" };
  const levels = ["s1", "s2", "s3"].map((id, i) => it({ tag: "li", cls: "sc__i", k: 2, win: spread(i, 3, 0, 0.5), attrs: `data-tone="${tone[id]}"`, html: `<span class="chip chip--lg" data-tone="${tone[id]}">${esc(t[id].split(":")[0])}</span><span>${esc(t[id].slice(t[id].indexOf(": ") + 2))}</span>` })).join("");
  const stage = [
    head(it, t, "h"),
    pill,
    row,
    it({ id: "scale", tag: "ul", cls: "sc fig", zone: "scale", k: 2, fx: "none", html: levels }),
    cap(it, "w", t.w, 2, 3),
    cap(it, "pq", v(t.pq), 3, 4),
    pollButtons(it, { id: "pb", name: "status", labels: t.pb, k: 3, out: 4, zone: "pb" }),
    cap(it, "r", null, 4, null, { html: `<b class="gapword">${esc(t.r.split(":")[0])}:</b> ${esc(t.r.slice(t.r.indexOf(": ") + 2))}`, text: undefined }),
  ].join("\n");
  return { head: "", stage };
}

/** S10: step 3: status, plan, briefing. The files open as page previews; the rule for mistakes is a record card and its new one. */
export function step3(it, ctx, d, c, T) {
  const t = c.s.step3;
  const p = promptPress(it, c, d, t, 3, d.prompts.step3);
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step3", k: 1, ms: 1500, out: { take: 2, chip: 2, key: 2 }, board: { id: "board", zone: "l3", out: 3 }, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const files = it({ id: "files", tag: "div", cls: "tk-filesbox", zone: "t", k: 2, out: 3, html: filePreviews(T.chain, t.files, { skip: /^check\.py$/ }) });
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread: `${p.pr}${take.take}${files}`, out: 3 });
  const fixsc = it({
    id: "fixsc", tag: "div", cls: "fixsc fig", zone: "w", k: 3, fx: "none",
    html: `<span class="fixsc__c fixsc__c--old">${draw("paper")}<small>${esc(t.fixOld)}</small></span>${it({ tag: "i", cls: "fixsc__link", k: 3, fx: "line", win: ".45,1" })}<span class="fixsc__c fixsc__c--new">${draw("paper")}<small>${esc(t.fixNew)}</small></span>`,
  });
  const stage = [
    p.h, win, p.pl, p.pf, p.prog,
    take.chip, take.key, take.board,
    it({ id: "fc", cls: "t t--s", zone: "l1", k: 2, out: 3, text: t.fc }),
    fixsc,
    it({ id: "fix", cls: "t t--s", zone: "l1", k: 3, text: t.fix }),
  ].join("\n");
  return { head: "", stage, take };
}
