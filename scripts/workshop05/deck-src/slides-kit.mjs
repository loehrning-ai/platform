/**
 * Part 2 of the deck: S06 kit, S07 step 1, S08 step 2, S09 tests, S10 step 3. Each slide is one scene: the headline stays, the
 * drawing grows press by press. The take slides keep the Claude window replica with the kit prompt, then the real recorded
 * answer (slides-parts.mjs, take.mjs), its chip, its key line and, when the recording carries one, its measured time.
 */
import { esc, fill, spread } from "./motion.mjs";
import { binder, icon } from "./scene.mjs";
import { head } from "./slides-intro.mjs";
import { claudeWindow, fileName, filePreviews, ico, inFolder, named, pollButtons, progress, promptBubble, promptInputs, takeView } from "./slides-parts.mjs";

/** The checklist and folder directories of each edition (the zip's own top folders). */
const CHECK = ["checklists", "listen"];
const FOLDER = ["folder", "ordner"];
const isIndex = (p) => /(folder|ordner)-index\.md$/.test(p);

const split = (text) => String(text).split(" · ");
const img = (label) => ` role="img" aria-label="${esc(label)}"`;
/** "QUOTE: words copied" to a bold label and the rest. */
const labelled = (text) => {
  const at = text.indexOf(": ");
  return at < 0 ? esc(text) : `<b>${esc(text.slice(0, at + 1))}</b> ${esc(text.slice(at + 2))}`;
};
const cap = (it, id, text, k, out, extra = {}) => it({ id, cls: "t cap", zone: "cap", k, out, text, ...extra });

/**
 * S08 kit (REDESIGN-3 D4): the zip becomes a binder. Press 0: the closed binder with the zip on its cover and the download
 * button under it. Press 1: the cover swings open on its spine and the twelve top-level entries of the zip appear on the sheet.
 * Press 2: a Claude project slides in on its own plane; the instructions sit in it and the folders fly over from the binder; the
 * four first-time steps run along the bottom (CLAUDE-01, CLAUDE-02). Press 3: the files Claude can make (CLAUDE-07) draw in and
 * the data rule. The caption swaps in one place.
 */
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
      return it({ tag: "li", k: 1, win: spread(i, names.length, 0.35, 0.4), html: `${icon(folder ? "folder" : "sheet")}<span>${fileName(name)}</span>${count}` });
    })
    .join("");
  const front = `<span class="kb__cover">${icon("zip", { cls: "dr" })}<b>${esc(zipName)}</b><small>${esc(zipRest.join(", "))}</small></span><span class="kb__inside" aria-hidden="true"><b>${fileName(zipName)}</b><small>${esc(zipRest[0] ?? "")}</small></span>`;
  const book = binder(it, { id: "kb", zone: "kb", k: 1, sheets: 2, cls: "kb fig", attrs: `data-keep role="img" aria-label="${esc(v(t.binderAria))}"`, front, html: `<ul class="kb__tree">${rows}</ul>` });
  const fly = split(t.fly);
  // each chip flies from its row on the binder sheet to its cell in the project. Stage pixels measured on the rendered slide:
  // tree rows start at x 544 and sit 45 px apart (checklists/ centred at y 579); the project cells start at x 1019 and
  // 1405, centred at y 593 and 645. The four chips come from tree rows 2, 3, 5 and 6 (checklists, folder, cases, templates).
  const ROW = [2, 3, 5, 6];
  const chips = fly.map((x, i) => {
    const from = { x: 544, y: 579 + (ROW[i] - 2) * 45 };
    const to = { x: 1019 + (i % 2) * 386, y: 593 + Math.floor(i / 2) * 52 };
    return it({ tag: "li", k: 2, fx: "move", win: spread(i, fly.length, 0.2, 0.55), attrs: `style="--dx:${from.x - to.x}px;--dy:${from.y - to.y}px"`, html: `${icon(x.endsWith("/") ? "folder" : "sheet")}<span>${fileName(x)}</span>` });
  }).join("");
  const made = it({ tag: "div", cls: "kw__made", k: 3, fx: "none", html: `${["spreadsheet", "sheet", "sheet-check"].map((n, i) => icon(n, { it, k: 3, win: spread(i, 3, 0.1, 0.6) })).join("")}<span><b>${esc(t.made)}</b><small>${esc(t.madeSrc)}</small></span>` });
  // the project stands empty from the entry (its two slots outlined); press 2 fills it
  const ins = it({ tag: "p", cls: "kw__ins", k: 2, win: ".1,.5", html: `${icon("sheet")}<b>${esc(t.insFile)}</b><small>${esc(t.insNote)}</small>` });
  const thread = `<div class="kw__p fig"><p class="kw__h">${esc(t.ins)}</p><div class="kw__slot kw__slot--ins">${ins}</div><p class="kw__h">${esc(t.files)}</p><ul class="kw__files"><li class="kw__ghost" aria-hidden="true">${"<i></i>".repeat(fly.length)}</li>${chips}</ul>${made}</div>`;
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread, zone: "w", k: 0, plane: true, cls: "tk-cw--small kw" });
  const steps = t.steps.map((x, i) => it({ tag: "li", k: 2, win: spread(i, 4, 0.3, 0.45), html: `<b>${i + 1}</b><span>${esc(x)}</span>` })).join("");
  const stage = [
    head(it, t),
    cap(it, "c0", v(t.c0), 0, 1),
    cap(it, "c1", t.c1, 1, 2),
    cap(it, "c2", t.c2, 2, 3),
    cap(it, "c3", t.c3, 3, null),
    `<div class="kb-host w05-s3d">${book}</div>`,
    it({ id: "zip", tag: "p", cls: "kzip fig", zone: "zip", html: `<a class="zipbtn" href="${root}${esc(zipName)}" download aria-label="${esc(t.zipAria)}">${icon("zip")}<b>${esc(zipName)}</b></a>` }),
    `<div class="kw-host w05-s3d">${win}</div>`,
    it({ id: "steps", tag: "div", cls: "ksteps fig", zone: "steps", k: 2, fx: "none", html: `<ol>${steps}</ol><small>${esc(t.stepsSrc)}</small>` }),
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
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step1", k: 2, ms: 1500, head: true, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread: `${p.pr}${qs}${take.take}`, plane: true });
  // the files this prompt reads: the three checklist excerpts and the folder index
  const inputs = promptInputs(it, d, { out: 2, pick: (paths) => [...inFolder(paths, CHECK), ...inFolder(paths, FOLDER, isIndex)] });
  const stage = [
    p.h, win, inputs, p.pl, p.pf, p.prog,
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
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread: `${p.pr}${poll}${take.take}`, plane: true });
  // the check reads every file of the folder
  const inputs = promptInputs(it, d, { out: 2, pick: (paths) => inFolder(paths, FOLDER) });
  const stage = [
    p.h, win, inputs, p.pl, p.pf, p.prog,
    it({ id: "fd", cls: "tk-def fig", zone: "l1", k: 1, out: 2, text: t.fd }),
    it({ id: "pq", cls: "t t--s", zone: "l2", k: 1, out: 2, text: t.pq }),
    take.chip, take.key, take.scan,
  ].join("\n");
  return { head: "", stage, take };
}

/** S09: the L10 row stays at one size; four tests light up on it one after another, the ten empty job slots fill (eight listed), three statuses, the GAP lands on the row. */
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
  // the four tiles lie face down from the entry, showing their numbers; press 1 turns them over one after another (a 3D
  // scene): the face shows the rule
  const tiles = ["t1", "t2", "t3", "t4"].map((id, i) => it({ tag: "li", cls: `tt__i tt__i--${i + 1} flip3`, k: 1, fx: "none", win: spread(i, 4, 0, 0.5), attrs: "data-scene data-keep", html: `<span class="flip3__b" aria-hidden="true">${i + 1}</span><span class="flip3__f">${labelled(t[id])}</span>` })).join("");
  // the ten job slots stand empty from the entry, so the card keeps its size; press 3 names the count and fills eight
  const jobsRow = `<div class="jobs">${it({ tag: "span", cls: "jobs__l", k: 3, win: ".1,.5", text: v(t.jl) })}${it({ tag: "span", cls: "jobs__slots", k: 3, fx: "none", fill: listed, win: ".1,.9", attrs: "data-keep", html: slots })}${names}</div>`;
  const row = it({
    id: "row", tag: "div", cls: "rwcard fig", zone: "row", fx: "none", attrs: img(v(t.row)),
    html: `<div class="rw">${rowHtml}</div>${it({ tag: "ul", cls: "tt w05-s3d", k: 1, fx: "none", attrs: "data-keep", html: tiles })}${jobsRow}${verdict}`,
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
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step3", k: 1, ms: 1500, head: true, out: { take: 2, chip: 2, key: 2 }, board: { id: "board", zone: "l3", out: 3 }, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const files = it({ id: "files", tag: "div", cls: "tk-filesbox", zone: "t", k: 2, out: 3, html: filePreviews(T.chain, t.files, { skip: /^check\.py$/ }) });
  const win = claudeWindow(it, { id: "win", crumbs: t.win, thread: `${p.pr}${take.take}${files}`, out: 3, plane: true });
  // the templates this prompt fills, and the notice it reads the clock from
  const inputs = promptInputs(it, d, { out: 1, pick: (paths) => [...paths.filter((p) => /^(notice|mitteilung)_/.test(p)), ...named(paths, d.prompts.step3)] });
  const fixsc = it({
    id: "fixsc", tag: "div", cls: "fixsc fig", zone: "w", k: 3, fx: "none",
    html: `<span class="fixsc__c fixsc__c--old">${icon("sheet", { cls: "dr" })}<small>${esc(t.fixOld)}</small></span>${it({ tag: "i", cls: "fixsc__link", k: 3, fx: "line", win: ".45,1" })}<span class="fixsc__c fixsc__c--new">${icon("sheet-check", { cls: "dr" })}<small>${esc(t.fixNew)}</small></span>`,
  });
  const stage = [
    p.h, win, inputs, p.pl, p.pf, p.prog,
    take.chip, take.key, take.board,
    it({ id: "fc", cls: "t t--s", zone: "l1", k: 2, out: 3, text: t.fc }),
    fixsc,
    it({ id: "fix", cls: "t t--s", zone: "l1", k: 3, text: t.fix }),
  ].join("\n");
  return { head: "", stage, take };
}
