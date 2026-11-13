/**
 * Part 2 of the deck: S06 kit, S07 step 1, S08 step 2, S09 tests, S10 step 3. Each slide is one scene: the headline stays, the
 * drawing grows press by press. The take slides keep the Claude window replica with the kit prompt, then the real recorded
 * answer (slides-parts.mjs, take.mjs), its chip, its key line and, when the recording carries one, its measured time.
 */
import { esc, fill, spread } from "./motion.mjs";
import { binder, icon } from "./scene.mjs";
import { kit as kitFile, kitDe } from "./data.mjs";
import { head } from "./slides-intro.mjs";
import { claudeWindow, clIcon, dolly, takeModel, fileName, filePreviews, inFolder, named, progress, promptBubble, promptInputs, takeView } from "./slides-parts.mjs";

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
 * The status row of one line in the kit's answer key (ANSWERS.md, LOESUNGEN.md): its status, the tests that fail (in the
 * edition's own test words) and the quote copied from the file. Read at build time, so the tests slide never types a result.
 */
export function keyRow(lang, id) {
  const text = lang === "de" ? kitDe("LOESUNGEN.md") : kitFile("ANSWERS.md");
  const row = text.split("\n").find((l) => l.startsWith(`| ${id} | `) && /^\| L\d+ \| (COVERED|WEAK|GAP|BELEGT|SCHWACH|LÜCKE) \|/.test(l));
  if (!row) throw new Error(`tests: no status row for ${id} in the ${lang} answer key`);
  const cells = row.split("|").slice(1, -1).map((x) => x.trim());
  // the owner column of the same line in the key's evidence table: "NOT IN FILES" when no named person owns the paper
  const ev = text.split("\n").find((l) => l.startsWith(`| ${id} | `) && l.split("|").length === 7);
  const owner = ev ? ev.split("|")[4].trim() : "";
  return { status: cells[1], failing: cells[2], quote: cells[3], noOwner: /^(NOT IN FILES|NICHT IN DATEIEN)/.test(owner) };
}
/** The drawing of each of the four tests (quote, period, scope, approval). */
const TEST_ICONS = ["sheet", "calendar", "person", "contract"];

/**
 * S08 kit: how to get the kit and set it up, as the numbered steps of START-HERE.md (left, a figure list that grows press by
 * press) next to what the step makes (right). Press 0: step 1, the kit page as a QR code, its address and the zip; the closed
 * binder (the zip) stands up from the desk. Press 1: the binder opens on its spine and shows the top-level entries of the zip.
 * Press 2: steps 2 to 5; the binder makes way for the project window: the instructions, the files (one flat list) and the
 * switch in Settings. Press 3: step 6, one chat for the four steps, the line on extras/ and the data rule. The caption swaps in one place.
 */
/** The files of the project shown by name: one of each kind; the rest are counted ("+ 14 more"). */
const SHOWN = [/^(checklists\/checklist_labour|listen\/pruefliste_arbeit)/, /^(folder|ordner)\/(folder|ordner)-index\.md$/, /^(folder|ordner)\/medical_exams\.csv$/, /^(cases|faelle)\/(case|fall)-A-/, /^(templates|vorlagen)\/register\.csv$/];
export function kit(it, ctx, d, c) {
  const t = c.s.kit;
  const zipText = fill(t.zip, d.vars);
  const [zipName, ...zipRest] = zipText.split(",").map((x) => x.trim());
  // the files step 4 adds: everything in the checklist and folder directories, plus the case file and the register template
  const add = d.kitPaths.filter((p) => [...CHECK, ...FOLDER].includes(p.split("/")[0])).length + 2;
  const vars = { ...d.vars, zip: zipName, add, entries: d.tree.length };
  const v = (x) => fill(x, vars);
  const root = d.lang === "en" ? "../" : "./";
  const ed = d.lang === "en" ? "-en" : "";
  const address = `loehrning.ai${d.lang === "en" ? "/en" : ""}/workshops/audit-vorbereitung-mit-ki/kit`;
  // the left column: the six set-up steps; step 1 carries the kit page (QR code and address) and the zip itself
  const zipBtn = `<a class="zipbtn" href="${root}${esc(zipName)}" download aria-label="${esc(t.zipAria)}">${icon("zip")}<b>${esc(zipName)}</b></a>`;
  const page = `<div class="ks1"><img src="./assets/qr-kit-g26${ed}.svg" width="150" height="150" alt="${esc(`${t.page}: ${address}`)}"><span class="ks1__a"><small>${esc(t.page)}</small><b>${fileName(address)}</b>${zipBtn}</span></div>`;
  const when = [0, 2, 2, 2, 2, 3];
  const later = [1, 2, 3, 4];
  const steps = t.steps.map((x, i) => it({ tag: "li", cls: `ks__i ks__i--${i + 1}`, k: when[i], win: when[i] === 2 ? spread(later.indexOf(i), 4, 0.3, 0.45) : when[i] === 3 ? ".2,.7" : ".2,.7", html: `<b>${i + 1}</b><div class="ks__t"><span>${esc(v(x))}</span>${i === 0 ? page : ""}</div>` })).join("");
  const list = it({ id: "steps", tag: "div", cls: "ksteps fig", zone: "steps", fx: "none", html: `<ol>${steps}</ol>${it({ tag: "small", k: 2, win: ".6,1", text: t.stepsSrc })}` });
  // the optional folder gets one line under the Settings card, on the last press: everything outside the core path lives there
  const extras = it({ id: "kx", tag: "p", cls: "ks__x fig", zone: "kx", k: 3, win: ".5,1", html: `${icon("folder")}<span>${esc(t.extras)}</span>` });
  // the right column, presses 0 and 1: the kit as a binder that stands up and opens on its spine; its entries are the zip's
  // own top-level names, read from this edition's zip (never typed)
  const names = d.tree;
  const rows = names
    .map((name, i) => {
      const folder = name.endsWith("/");
      const count = folder ? `<em>${d.treeCounts[name] ?? ""}</em>` : "";
      return it({ tag: "li", k: 1, win: spread(i, names.length, 0.35, 0.4), html: `${icon(folder ? "folder" : "sheet")}<span>${fileName(name)}</span>${count}` });
    })
    .join("");
  const front = `<span class="kb__cover">${icon("zip", { cls: "dr" })}<b>${esc(zipName)}</b><small>${esc(zipRest.join(", "))}</small></span><span class="kb__inside" aria-hidden="true"><b>${fileName(zipName)}</b><small>${esc(zipRest[0] ?? "")}</small></span>`;
  const book = binder(it, { id: "kb", k: 1, sheets: 2, cls: "kb", attrs: `data-keep role="img" aria-label="${esc(v(t.binderAria))}"`, front, html: `<ul class="kb__tree">${rows}</ul>` });
  const desk = it({ tag: "div", cls: "kb-host", k: 0, fx: "none", attrs: "data-scene", html: book });
  const kbz = it({ id: "kbz", tag: "div", cls: "kbz fig", zone: "right", out: 2, win: "0,.15", html: desk });
  // press 2: the project window: its instructions and its files, one flat list, the rest counted
  const shown = SHOWN.map((re) => d.kitPaths.find((p) => re.test(p))).filter(Boolean);
  if (shown.length !== SHOWN.length) throw new Error(`kit: ${shown.length} of ${SHOWN.length} shown files found in the ${d.lang} zip`);
  const chips = shown.map((p) => `<li>${icon(/\.csv$/.test(p) ? "spreadsheet" : "sheet")}<span>${esc(p.split("/").at(-1))}</span></li>`).join("");
  const more = `<li class="kw__more">${esc(fill(t.more, { n: add - shown.length }))}</li>`;
  const ins = `<p class="kw__ins">${icon("sheet")}<b>${esc(t.insFile)}</b><small>${esc(t.insNote)}</small></p>`;
  const thread = `<div class="kw__p fig"><p class="kw__t">${clIcon("folder")}<b>${esc(split(t.win).at(-1))}</b></p><p class="kw__h">${esc(t.ins)}</p>${ins}<p class="kw__h">${esc(t.files)}<em>${esc(v(t.count))}</em></p><ul class="kw__files">${chips}${more}</ul></div>`;
  const win = claudeWindow(it, { id: "win", ui: c.claudeUi, side: "full", recents: [c.s.step1.h, c.s.step2.h, c.s.step3.h], crumbs: t.win, thread, k: 2, zone: "right", plane: true, cls: "tk-cw--small kw" });
  // the switch of step 5 lives in Settings, not in the project: its own card under the window
  const cap5 = it({ id: "kcap", tag: "div", cls: "kcap fig", zone: "kcap", k: 2, win: ".55,1", html: `<p class="kcap__h">${esc(t.capH)}</p><p class="kcap__r"><span>${esc(t.capOn)}</span><i class="kcap__sw" aria-hidden="true"><i></i></i></p>` });
  const stage = [
    head(it, t),
    cap(it, "c0", v(t.c0), 0, 1),
    cap(it, "c1", v(t.c1), 1, 2),
    cap(it, "c2", t.c2, 2, 3),
    cap(it, "c3", t.c3, 3, null),
    list,
    kbz,
    win,
    cap5,
    extras,
  ].join("\n");
  return { head: "", stage };
}

/**
 * The left column of a take slide: the headline and the four-dot progress stay; the captions swap in the slots l1 to l3.
 * The prompt leaves the window on press `promptOut` (1; step 2 keeps it until its answer comes on press 2).
 */
function promptPress(it, c, d, t, n, text, { promptOut = 1 } = {}) {
  return {
    h: it({ id: "h", tag: "h2", cls: "headline headline--s", zone: "h", text: t.h }),
    pl: it({ id: "pl", cls: "t t--s", zone: "l1", out: 1, text: t.pl }),
    pf: it({ id: "pf", cls: "src", zone: "l2", out: 1, text: t.pf }),
    pr: it({ id: "pr", tag: "div", cls: "tk-slot", zone: "t", out: promptOut, html: promptBubble(c, n, text) }),
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
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step1", k: 2, ms: 1500, head: true, hitRows: d.key.noOwner, zoom: ".78,1", ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  // the camera moves in on the window as the recorded table streams (press 2)
  const win = dolly(it, { k: 2, html: claudeWindow(it, { id: "win", ui: c.claudeUi, model: takeModel(take), crumbs: t.win, thread: `${p.pr}${qs}${take.take}`, plane: true, zone: null }) });
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
  const v = (x) => fill(x, d.vars);
  const p = promptPress(it, c, d, t, 2, d.prompts.step2, { promptOut: 2 });
  // the answer uses the window's full width (15 words a row) and draws the script's rows as a grid, so all ten findings fit
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step2", k: 2, ms: 1500, hit: true, head: true, wrap: 15, scan: { id: "scan", zone: "l3" }, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  // the camera moves in on the prompt (press 1), while the left column says what the check looks for; press 2 belongs to the scan and its counters
  const win = dolly(it, { k: 1, html: claudeWindow(it, { id: "win", ui: c.claudeUi, model: takeModel(take), crumbs: t.win, thread: `${p.pr}${take.take}`, plane: true, zone: null }) });
  // the check reads every file of the folder
  const inputs = promptInputs(it, d, { out: 2, pick: (paths) => inFolder(paths, FOLDER) });
  const stage = [
    p.h, win, inputs, p.pl, p.pf, p.prog,
    it({ id: "fd", cls: "tk-def fig", zone: "l1", k: 1, out: 2, text: t.fd }),
    it({ id: "sc", cls: "t t--s", zone: "l2", k: 1, out: 2, text: v(t.sc) }),
    take.chip, take.key, take.scan,
  ].join("\n");
  return { head: "", stage, take };
}

/** S09: the L10 row stays at one size; four tests are laid onto it one after another, the ten job slots in the scope test fill (eight listed), three statuses, the GAP lands on the row. */
export function tests(it, ctx, d, c) {
  const t = c.s.tests;
  const v = (x) => fill(x, d.vars);
  const pill = it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", text: t.pill });
  const [c0, c1, ...meta] = split(v(t.row));
  const rowHtml = `<span class="rw__c rw__c--0">${esc(c0)}</span><span class="rw__c rw__c--1">${esc(c1)}</span><div class="rw__m">${meta.map((x, i) => `<span class="rw__c rw__c--${i + 2}">${esc(x)}</span>`).join("")}</div>`;
  const jobs = Number(d.vars.jobs);
  const listed = Number(d.vars.listed);
  // the ten jobs as ten people: press 3 lights the eight the statement lists
  const slots = Array.from({ length: jobs }, (_, i) => `<i${i < listed ? " data-cell" : ""}>${icon("person")}</i>`).join("");
  const missing = t.miss.map((m, i) => `<b class="jobs__nm jobs__nm--${i}">${esc(m)}</b>`).join("");
  const names = it({ tag: "span", cls: "jobs__names", k: 4, fx: "fade", win: ".3,1", html: missing });
  const verdict = it({ tag: "span", cls: "chip chip--lg rwv", k: 4, win: ".3,1", attrs: 'data-tone="luecke"', text: t.s3.split(":")[0] });
  // the ten job slots sit inside the scope tile: it is the one test that counts people; press 3 names the count and fills eight
  const scope = `<span class="ttj">${it({ tag: "span", cls: "jobs__slots", k: 3, fx: "none", fill: listed, win: ".1,.9", attrs: "data-keep", html: slots })}${it({ tag: "span", cls: "jobs__l", k: 3, win: ".1,.5", text: v(t.jl) })}${names}</span>`;
  // each test's result on L10, from the kit's answer key: the tests it fails are listed there; the quote is the one it copied.
  // Press 3 shows the tests that do not decide the status (the weakest part is still to come); press 4 the one that
  // fails. APPROVAL stays open when the key's evidence table names no owner (step 1 taught that), and PERIOD says that this line
  // sets no deadline (the checklist row names none): neither is a pass, so both get a neutral chip with their reason.
  const key = keyRow(d.lang, "L10");
  const result = (id, i) => {
    const word = t[id].split(":")[0];
    const fails = key.failing.split(/,\s*/).includes(word);
    const quote = i === 0 ? `<q class="tt__q">${esc(key.quote.replace(/^["„“]|["“”]$/g, ""))}</q>` : "";
    const open = !fails && ((id === "t4" && key.noOwner) || id === "t2");
    const word2 = fails ? t.fail : open ? t.open[id] : t.pass;
    const tone = fails ? "fail" : open ? "open" : "pass";
    return it({ tag: "span", cls: `tt__r tt__r--${tone}`, k: fails ? 4 : 3, win: fails ? ".3,1" : spread(i, 4, 0.5, 0.4), html: `${quote}<b>${esc(word2)}</b>` });
  };
  // press 0: four outlined slots, each with its drawing; press 1 lays the four tests onto them, one after another: each comes
  // down onto its slot and covers its drawing (a scene; flat since round 5)
  // press 0: the four slots rise into the card one after another (a scene), so the entry is not four still outlines
  const tiles = ["t1", "t2", "t3", "t4"].map((id, i) => it({ tag: "li", cls: `tt__s tt__s--${i + 1}`, k: 0, fx: "none", win: spread(i, 4, 0.1, 0.5), attrs: "data-scene", html: `<i class="tt__g" aria-hidden="true">${icon(TEST_ICONS[i])}</i>${it({ tag: "span", cls: `tt__i tt__i--${i + 1}`, k: 1, fx: "none", win: spread(i, 4, 0, 0.55), attrs: "data-scene", html: `${icon(TEST_ICONS[i], { cls: "tt__ic" })}<span class="tt__f">${labelled(t[id])}</span>${id === "t3" ? scope : ""}${result(id, i)}` })}` })).join("");
  const row = it({
    id: "row", tag: "div", cls: "rwcard fig", zone: "row", fx: "none", attrs: img(v(t.row)),
    html: `<div class="rw">${rowHtml}</div><ul class="tt">${tiles}</ul>${verdict}`,
  });
  const tone = { s1: "belegt", s2: "schwach", s3: "luecke" };
  const levels = ["s1", "s2", "s3"].map((id, i) => it({ tag: "li", cls: "sc__i", k: 2, win: spread(i, 3, 0.3, 0.45), attrs: `data-tone="${tone[id]}"`, html: `<span class="chip chip--lg" data-tone="${tone[id]}">${esc(t[id].split(":")[0])}</span><span>${esc(t[id].slice(t[id].indexOf(": ") + 2))}</span>` })).join("");
  const stage = [
    head(it, t, "h"),
    pill,
    row,
    // the register's ten jobs stand under the row while the tests arrive (the people the scope test will count on press 3)
    it({ id: "crowd", tag: "div", cls: "crowd fig", zone: "scale", out: 2, attrs: img(v(t.reg)), html: `<b class="crowd__l">${esc(v(t.reg))}</b><span class="crowd__p">${Array.from({ length: jobs }, () => icon("person")).join("")}</span>` }),
    cap(it, "c0", t.c0, 0, 1),
    cap(it, "c1", t.c1, 1, 2),
    // the three statuses stay to the end: the verdict on press 4 is one of them
    it({ id: "scale", tag: "ul", cls: "sc fig", zone: "scale", k: 2, fx: "none", html: levels }),
    cap(it, "w", t.w, 2, 3),
    cap(it, "c3", v(t.c3), 3, 4),
    cap(it, "r", null, 4, null, { html: `<b class="gapword">${esc(t.r.split(":")[0])}:</b> ${esc(t.r.slice(t.r.indexOf(": ") + 2))}`, text: undefined }),
  ].join("\n");
  return { head: "", stage };
}

/** S10: step 3: status, plan, briefing. The files open as page previews; the rule for mistakes is a record card and its new one. */
export function step3(it, ctx, d, c, T) {
  const t = c.s.step3;
  const p = promptPress(it, c, d, t, 3, d.prompts.step3);
  const take = takeView(it, { c, d, takes: T, key: "chain", slot: "step3", k: 1, ms: 1500, head: true, out: { take: 2, chip: 2, key: 2 }, board: { id: "board", zone: "l3" }, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const files = it({ id: "files", tag: "div", cls: "tk-filesbox", zone: "t", k: 2, out: 3, html: filePreviews(T.chain, t.files, { skip: /^check\.py$/, it, k: 2 }) });
  // the camera moves in on the window as the status answer streams (press 1); the window leaves for the fix pair (press 3)
  const win = dolly(it, { k: 1, out: 3, html: claudeWindow(it, { id: "win", ui: c.claudeUi, model: takeModel(take), crumbs: t.win, thread: `${p.pr}${take.take}${files}`, out: 3, plane: true, zone: null }) });
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
