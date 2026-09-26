#!/usr/bin/env node
// Builds packages/website/public/workshops/esg-berichte-mit-ki/demo.html from
//   scripts/workshop04/demo.template.html  (page, styles, static copy)
//   scripts/workshop04/demo-core.js        (pure state and number formatting, shared with the page)
//   scripts/workshop04/demo-app.js         (interaction)
//   scripts/workshop04/data/w04-data.json  (every number; written by scripts/workshop04/build_dataset.py)
// and writes the two scripts next to the page as lib/w04-demo-core.js and lib/w04-demo.js
// (loaded with <script src defer>; the page has no inline executable script).
// The final state (every trap fixed, location-based) is rendered into the HTML, so the page reads without JS.
// Usage: node scripts/workshop04/build-demo.mjs [--data path/to/w04-data.json] [--check]
//   --check exits 1 when demo.html or the two scripts differ from what the build would write (nothing is written).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const OUT = path.join(repo, "packages/website/public/workshops/esg-berichte-mit-ki/demo.html");
const OUT_CORE = path.join(path.dirname(OUT), "lib/w04-demo-core.js");
const OUT_APP = path.join(path.dirname(OUT), "lib/w04-demo.js");
const args = process.argv.slice(2);
const check = args.includes("--check");
const di = args.indexOf("--data");
const DATA_CANDIDATES = [
  di !== -1 ? path.resolve(args[di + 1]) : null,
  process.env.W04_DATA ? path.resolve(process.env.W04_DATA) : null,
  path.join(here, "data", "w04-data.json"), // the one dataset (build_dataset.py), also read by the deck and pages builds
].filter(Boolean);
const dataPath = DATA_CANDIDATES.find((p) => existsSync(p));
if (!dataPath) {
  console.error("w04-data.json not found. Pass --data <path> or set W04_DATA. Tried:\n  " + DATA_CANDIDATES.join("\n  "));
  process.exit(2);
}

const D = JSON.parse(readFileSync(dataPath, "utf8"));
const coreSrc = readFileSync(path.join(here, "demo-core.js"), "utf8");
const appSrc = readFileSync(path.join(here, "demo-app.js"), "utf8");
const template = readFileSync(path.join(here, "demo.template.html"), "utf8");
const ctx = {};
vm.runInNewContext(coreSrc + "\n;this.W04Core = W04Core;", ctx);
const C = ctx.W04Core;

/* ------------------------------------------------ helpers */
const problems = [];
function assert(ok, msg) { if (!ok) problems.push(msg); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function n(key) {
  const v = D.numbers[key];
  if (!v) throw new Error("numbers." + key + " missing in w04-data.json");
  return v.en;
}
function nAbs(key) { return n(key).replace(/^[−+]/, ""); }
function at(p) { return p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), D); }
function fileName(p) { return p.split("/").pop(); }
const t10 = (v) => Math.round(v * 10);
/* straight double quotes in JSON display text become curly quotes on the page (the JSON stays as it is) */
function curly(s) { return String(s).replace(/"([^"]*)"/g, "“$1”"); }
/* T7's JSON name ends in "(market-based)"; the page shows that as a tag instead */
function trapTitle(t) { return curly(t.en.replace(/\s*\(market-based\)$/, "")).replace(/ (\S+)$/, "\u00a0$1"); }
const mbOnly = (t) => t10(t.isolated.lb_t) === 0;
const R = D.combinations["0"], W = D.combinations["127"];
const V0 = C.view(D, 0, "lb");

/* ------------------------------------------------ section 1: lanes */
function laneRows(c) {
  return [
    ["Scope 1", C.num(c.s1_t) + " t", ""],
    ["Scope 2 location-based", C.num(c.s2lb_t) + " t", ""],
    ["Scope 2 market-based", C.num(c.s2mb_t) + " t", ""],
    ["Total, location-based", C.num(c.lb_t) + " t", "big"],
    ["Total, market-based", C.num(c.mb_t) + " t", ""],
    ["Change vs 2024, location-based", C.pct(c.vs2024_lb_pct), ""],
    ["Change vs 2024, market-based", C.pct(c.vs2024_mb_pct), ""],
  ].map(([k, v, cls]) => `<div><dt>${esc(k)}</dt><dd class="num${cls ? " " + cls : ""}">${esc(v)}</dd></div>`).join("");
}
const lanes = `<div class="lanes">
  <article class="lane lane--export" aria-labelledby="lane-raw">
    <h3 class="lane__head" id="lane-raw"><span>Raw folder</span></h3>
    <p class="lane__note">${esc(D.meta.constructedLabel_en)}</p>
    <dl>${laneRows(W)}</dl>
  </article>
  <article class="lane lane--approved" aria-labelledby="lane-right">
    <h3 class="lane__head" id="lane-right">Ledger</h3>
    <p class="lane__note">Computed from <code>belegtabelle_2025.csv</code> with the written rules and the teaching factors.</p>
    <dl>${laneRows(R)}</dl>
  </article>
</div>
<p class="gapline">The raw-folder total is <b class="num">${esc(n("gap_lb_t"))} below</b> the right one, ${esc(n("gap_lb_pct"))} of the total. Its change against 2024 is off by ${esc(n("chg_lb_pp_shift"))} percentage points, and its explanation is wrong.</p>
<details class="more">
  <summary>Read the raw-folder answer as text</summary>
  <div class="quote">
    <p>“Kellbrunn's 2025 emissions: Scope 1 ${esc(n("wrong_s1"))} CO₂e, Scope 2 ${esc(n("wrong_s2lb"))} CO₂e (location-based), total ${esc(n("wrong_total_lb"))}. That is ${esc(nAbs("wrong_chg_lb_pct"))} below 2024 (${esc(n("total_lb_2024"))}). Scope 2 market-based: ${esc(n("wrong_s2mb"))}. Since 2025 Kellbrunn runs on green electricity (Ökostrom Plus). The reduction comes mainly from efficiency measures at Werk Nord. Scope 1 rose by ${esc(nAbs("wrong_chg_s1_pct"))}, probably due to higher heating demand.”</p>
    <p class="caption">${esc(D.meta.constructedLabel_en)}</p>
  </div>
</details>`;
assert(W.lb_t === D.numbers.wrong_total_lb.rounded && W.s1_t === D.numbers.wrong_s1.rounded && W.s2lb_t === D.numbers.wrong_s2lb.rounded, "combinations[127] differs from the wrong_* keys");
assert(R.lb_t === D.numbers.total_lb_2025.rounded && R.mb_t === D.numbers.total_mb_2025.rounded, "combinations[0] differs from total_*_2025");
assert(t10(Math.abs(W.delta_vs_right_lb_t)) === t10(D.numbers.gap_lb_t.rounded), "gap_lb_t differs from combinations[127]");

/* ------------------------------------------------ section 2: guided sequence */
const SQ = D.demoSequence;
const T = Object.fromEntries(D.traps.map((t) => [t.id, t]));
assert(t10(T.T4.isolated.lb_t) === t10(D.numbers.unit_lb_t.rounded), "unit_lb_t differs from traps.T4");
for (const s of SQ) {
  if (s.state_mask === undefined || !s.keys) continue;
  const c = D.combinations[s.state_mask], m = s.method || "lb";
  if (s.n === 5) {
    assert(t10(c.lb_t - R.lb_t) === t10(D.numbers[s.keys[0]].rounded), "step 5 LB pair value differs from combinations");
    assert(t10(c.mb_t - R.mb_t) === t10(D.numbers[s.keys[1]].rounded), "step 5 MB pair value differs from combinations");
  } else {
    assert(t10(c[m + "_t"]) === t10(D.numbers[s.keys[0]].rounded), `step ${s.n} total differs from combinations[${s.state_mask}]`);
    assert(t10(c["vs2024_" + m + "_pct"]) === t10(D.numbers[s.keys[1]].rounded), `step ${s.n} change differs from combinations[${s.state_mask}]`);
  }
}
const stepN = (k) => SQ.find((s) => s.n === k);
// The step texts rephrase demoSequence[].action_en so they name the controls on the page;
// every number still comes from the step's own keys.
assert(D.numbers[stepN(2).keys[1]].rounded > 0 && D.numbers[stepN(3).keys[1]].rounded < 0 && D.numbers[stepN(4).keys[1]].rounded < 0, "guided steps 2 to 4: sign of the change differs from the copy");
assert(D.factors["F-EL-GO"].value === 0 && t10(T.T4.isolated.mb_t) === 0, "step 4 copy: the certificate factor is not 0");
assert(stepN(4).method === "mb" && stepN(5).method === "lb" && stepN(5).state_mask === "3", "guided steps 4 and 5: method or mask changed");
const STEP = {
  2: { act: `Set only the Talbrück bill (T3) to “As the AI did it”.`,
       why: `${n(stepN(2).keys[1])} against 2024 makes anyone ask what happened, so this error gets caught.` },
  3: { act: `Also set the MWh misread (T4) to “As the AI did it”.`,
       why: `A fall of ${nAbs(stepN(3).keys[1])} looks plausible again, so nobody asks.` },
  4: { act: `Switch the method to market-based. The MWh row now shows 0 t.`,
       why: `Market-based hides the unit error completely, because the certificate prices Werk Süd's power at zero. A fall of ${nAbs(stepN(4).keys[1])} looks fine with the Talbrück bill still inside.` },
  5: { act: `Switch back to location-based, then set only the duplicate March (T1) and October (T2) to “As the AI did it”.`,
       why: `Together they move the total by only ${n(stepN(5).keys[0])}, so a check on the total misses both. In market-based the pair moves it by ${n(stepN(5).keys[1])}.` },
  6: { act: `Open the evidence drawer from “${nAbs(stepN(6).keys[0])}” in the rewritten sentence in section 4.`,
       why: `In this case's teaching values, ${n("drv_lb_grid_share_pct")} of the location-based decrease comes from the lower grid factor. Kellbrunn did nothing for it.` },
};
function stepRes(s) {
  if (!s.keys || s.n === 6) return "";
  if (s.n === 5) { const c = D.combinations[s.state_mask]; return `<b>${esc(C.num(c.lb_t))} t</b> · ${esc(C.pct(c.vs2024_lb_pct))} vs 2024.`; }
  const m = s.method === "mb" ? " (market-based)" : "";
  return `<b>${esc(n(s.keys[0]))}</b> · ${esc(n(s.keys[1]))} vs 2024${m}.`;
}
const seqItems = SQ.map((s) => {
  if (s.n === 1) {
    return `<li><div class="step"><p class="act">${esc(curly(s.action_en))}</p>
      <fieldset class="predict"><legend class="sr-only">Your prediction</legend>
        <div class="opts">
          <label><input type="radio" name="predict" value="T1"> Duplicate March</label>
          <label><input type="radio" name="predict" value="T3"> Talbrück bill</label>
          <label><input type="radio" name="predict" value="T4"> ${esc(curly('"' + D.inputs.ws.printed + '"'))}</label>
        </div>
        <p class="status" id="p-status" role="status"></p>
        <p class="res" id="p-answer" hidden>The MWh misread moves it most: <b>${esc(n(s.answer_key))}</b> on its own, location-based. Talbrück alone adds ${esc(T.T3.isolated.lb_en)} t, the duplicate ${esc(T.T1.isolated.lb_en)} t.</p>
      </fieldset></div></li>`;
  }
  const copy = STEP[s.n];
  assert(copy, "guided step " + s.n + " has no page text");
  const go = s.n === 6
    ? `<button class="btn" type="button" data-open="drv:grid">Open ${esc(nAbs(s.keys[0]))}</button>`
    : `<button class="btn stepgo" type="button" data-step="${s.n}">Set this up<span class="sr-only">: step ${s.n}</span></button>`;
  const res = stepRes(s);
  return `<li><div class="step"><p class="act">${esc(copy.act)}</p>${res ? `<p class="res">${res}</p>` : ""}<p class="why"><span class="why__l">Why it matters</span> ${esc(copy.why)}</p></div>${go}</li>`;
}).join("\n");
const sequence = `<details class="seq" id="seq">
  <summary>Guided sequence<span>${SQ.length} steps, about 6 minutes</span></summary>
  <ol class="steps">${seqItems}</ol>
</details>`;

/* ------------------------------------------------ section 2: console (tabs, presets, meters) */
const M0 = V0.meters;
const lbl = (long, short) => `<span class="label"><span class="l-long">${esc(long)}</span><span class="l-short">${esc(short)}</span></span>`;
const consoleBlock = `<div class="console">
  <div class="controls" id="board-top">
    <div class="tabs" role="tablist" aria-label="Scope 2 method">
      <button class="tab" type="button" role="tab" id="tab-lb" data-method="lb" aria-selected="true" aria-controls="board" tabindex="0">Location-based</button>
      <button class="tab" type="button" role="tab" id="tab-mb" data-method="mb" aria-selected="false" aria-controls="board" tabindex="-1">Market-based</button>
    </div>
    <div class="presets" role="group" aria-label="Presets">
      <button class="btn preset" type="button" data-mask="127" aria-pressed="false">The AI's raw-folder run (constructed)</button>
      <button class="btn preset" type="button" data-mask="0" aria-pressed="true">All fixed</button>
    </div>
  </div>
  <div class="meters">
    <p class="meter">${lbl("This answer", "This answer")}<b id="m-total" class="num">${esc(M0.total)}</b><span class="sub sub--scopes"><span class="nw" id="m-s1">Scope 1 ${esc(M0.s1)}</span> · <span class="nw" id="m-s2">Scope 2 ${esc(M0.s2)}</span></span></p>
    <p class="meter meter--dist${M0.distZero ? " is-zero" : ""}" id="meter-dist">${lbl("Distance from the right answer", "Distance")}<b id="m-dist" class="num">${esc(M0.dist)}</b><span class="gauge" aria-hidden="true"><i id="g-dist" style="--w:${M0.distW}%"></i></span><span class="sub" id="m-dist-pct">${esc(M0.distPct)}</span></p>
    <p class="meter">${lbl("Change vs 2024", "vs 2024")}<b id="m-vs" class="num">${esc(M0.vs)}</b><span class="gauge gauge--vs" aria-hidden="true"><s id="g-vs-right" style="--p:${M0.vsRightPos}%"></s><i id="g-vs" style="--p:${M0.vsPos}%"></i></span><span class="sub" id="m-vs-right">Right answer: ${esc(M0.vsRight)}</span></p>
  </div>
  <p class="sr-only" id="live" aria-live="polite"></p>
</div>`;
assert(M0.total === n("total_lb_2025") && M0.vs === n("chg_lb_pct"), "default meters differ from total_lb_2025 / chg_lb_pct");

/* ------------------------------------------------ section 2: board */
// Visible link text names the document; the file name is in the title and in the drawer header.
const T4DOC = fileName(D.documents.find((d) => d.trap === "T4").path);
const TWO = fileName(D.documents.find((d) => d.trap === "two-month").path);
// The two CSV exports are not documents; their paths come from the ledger rows they produced.
const rowFile = (id) => D.ledger.find((r) => r.row_id === id).source_file;
const METER_CSV = rowFile("E-WN-10");
const FUEL_CSV = rowFile("D-FL-01");
const DOCLINK = {
  T1: ["Scanned March bill", D.inputs.wnDuplicate.file],
  T2: ["Meter readings", fileName(METER_CSV)],
  T3: ["Talbrück annual bill", D.inputs.jvBill.file],
  T4: ["Werk Süd statement", T4DOC],
  T5: ["Two gas bills", D.inputs.gas.WN.file + " and " + D.inputs.gas.WS.file],
  T6: ["Fuel-card export", fileName(FUEL_CSV)],
  T7: ["Factor file", "faktoren_lehrwerte.csv"],
};
function style(g) { return g ? ` style="--l:${g.l}%;--w:${g.w}%;--cl:${g.cl}%;--cw:${g.cw}%"` : ""; }
const docBtn = (open, label, file) => `<button class="linkish doc" type="button" data-open="${esc(open)}" title="${esc(file)}"><span class="sr-only">Open the evidence: </span>${esc(label)}</button>`;
function trapRow(t) {
  const r = V0.rows[t.id];
  const scope = mbOnly(t) ? ` <span class="tag tag--scope" id="ts-${t.id}">Market-based only</span>` : "";
  return `<li class="trap${r.pressed ? " is-on" : ""}${V0.ghost ? " is-ghost" : ""}" data-trap="${t.id}">
  <div class="trap__main">
    <p class="trap__name"><span class="trap__id">${t.id}</span><span class="trap__t"><span id="tn-${t.id}">${esc(trapTitle(t))}</span>${scope}</span></p>
    <p class="trap__meta"><span class="tag">${esc(t.role)}</span>${docBtn("trap:" + t.id, DOCLINK[t.id][0], DOCLINK[t.id][1])}</p>
  </div>
  <button class="sw" type="button" data-trap="${t.id}" aria-pressed="${r.pressed}" aria-labelledby="tn-${t.id}${scope ? " ts-" + t.id : ""}" aria-describedby="te-${t.id}"><span class="sw__box" aria-hidden="true"></span><span class="sw__t">${esc(r.sw)}</span></button>
  <p class="iso${r.isoZero ? " is-zero" : ""}" id="te-${t.id}"><b>${esc(r.iso)}</b><span class="iso__tail">${r.isoZero ? "" : " if only this trap fires"}</span> <button class="linkish only" type="button" data-only="${t.id}">Only this trap<span class="sr-only">: ${esc(trapTitle(t))}</span></button></p>
  <div class="mob">
    <div class="track" data-open="trap:${t.id}" aria-hidden="true"><span class="ghost"${style(r.ghost)}${r.ghost ? "" : " hidden"}></span><span class="bar${r.bar && !r.bar.neg ? " is-up" : ""}"${style(r.bar)}${r.bar ? "" : " hidden"}></span></div>
    <p class="fx num">${esc(r.fx)}</p>
    <p class="run num">${esc(r.run)}</p>
  </div>
</li>`;
}
assert(D.traps.filter(mbOnly).map((t) => t.id).join() === "T7" && /\(market-based\)$/.test(T.T7.en), "only T7 should be tagged market-based only");
const noteRow = `<li class="trap trap--note">
  <div class="trap__main">
    <p class="trap__name"><span class="trap__id">·</span><span class="trap__t">Two months on one bill</span></p>
    <p class="trap__meta"><span class="tag">Clerk</span>${docBtn("doc:" + TWO, "Nov and Dec bill", TWO)}</p>
  </div>
  <span class="nosw">No switch</span>
  <p class="noteline">${esc(D.trapNotes.twoMonthBill_en)}</p>
</li>`;
const rowsHtml = D.traps.map((t) => trapRow(t) + (t.id === "T2" ? "\n" + noteRow : "")).join("\n");
const legend = `<span class="blegend"><span><i class="lg lg--down" aria-hidden="true"></i>Fixing lowers the total</span><span><i class="lg lg--up" aria-hidden="true"></i>Fixing raises it</span></span>`;
const board = `<div class="mobhint"><p>Under each switch: the effect if only that trap fires, then the bar that fixes it and the running total.</p>${legend}</div>
<div class="board__head" aria-hidden="true"><span class="c3">Trap, switch, and its effect if only this trap fires</span><span class="bh-chart"><span id="bh-chart">${esc(V0.head)}</span>${legend}</span><span class="r">Fixing it changes the total by</span><span class="r">Running total</span></div>
<div id="board" role="tabpanel" aria-labelledby="tab-lb" data-method="lb"><ul class="board">
<li class="tot tot--start${V0.ghost ? " is-ghost" : ""}">
  <p class="tot__label"><b>${esc(V0.start.label)}</b><span class="tot__sub"><span id="ts-sub">${esc(V0.start.sub)}</span><span class="tot__axis" id="ts-axis">${V0.start.sub ? " " : ""}${esc(V0.start.axis)}</span></span></p>
  <div class="track" aria-hidden="true"><span class="ghost" style="--l:0%;--w:${V0.start.gw}%"${V0.ghost ? "" : " hidden"}></span><span class="bar${V0.start.raw ? " is-raw" : ""}" style="--l:0%;--w:${V0.start.w}%"${V0.ghost ? " hidden" : ""}></span><span class="cut"></span></div>
  <p class="fx num"></p>
  <p class="run num">${esc(V0.start.t)}</p>
</li>
${rowsHtml}
<li class="tot tot--end">
  <p class="tot__label"><b>Right answer</b><span class="tot__sub">Every trap fixed, computed from the ledger.</span></p>
  <div class="track" aria-hidden="true"><span class="bar" style="--l:0%;--w:${V0.end.w}%"></span><span class="cut"></span></div>
  <p class="fx num"></p>
  <p class="run num">${esc(V0.end.t)}</p>
</li>
</ul></div>
<div class="boardfoot"><p class="caption" id="board-caption">${esc(V0.caption)}</p><p class="check" id="board-check"${V0.check ? "" : " hidden"}>${esc(V0.check)}</p><p class="caption mbnote" id="board-mbnote"${V0.mbNote ? "" : " hidden"}>${esc(V0.mbNote)}</p></div>`;
// the ghost path must be the stored waterfall, and it must chain from its own start row
for (const m of ["lb", "mb"]) {
  const st = C.state(D, 127, m);
  D.waterfall[m].slice(1).forEach((w, i) => {
    const r = st.rows[i];
    assert(r.active && t10(r.effect) === t10(w.change_t) && t10(r.to) === t10(w.running_t), `waterfall.${m} ${w.step} differs from the combinations`);
  });
  const v = C.view(D, 0, m);
  let run = t10(Number(v.start.t.replace(/,/g, "")));
  for (const id of C.ORDER) {
    const r = v.rows[id];
    if (!r.fx) continue;
    run += t10(Number(r.fx.replace("−", "-").replace(/[+,]/g, "")));
    assert(run === t10(Number(r.run.replace(/,/g, ""))), `default ${m}: ${id} running total does not follow from the start row`);
  }
  assert(run === t10(Number(v.end.t.replace(/,/g, ""))), `default ${m}: the path does not end at the right answer`);
}
{
  const v = C.view(D, 127, "mb");
  const want = ["T1", "T2", "T3"].map((id) => T[id].isolated.mb_en);
  assert(want.every((x) => v.mbNote.includes(x)) && [1, 2, 3].every((i) => v.mbNote.includes(C.signed(D.waterfall.mb[i].change_t))), "market-based caption misses the T1 to T3 values");
  assert(C.view(D, 127, "lb").mbNote === "" && C.view(D, 1, "mb").mbNote === "", "market-based caption shows without T7");
}
for (const k of Object.keys(D.combinations)) for (const m of ["lb", "mb"]) assert(C.state(D, Number(k), m).sumOk, `bars do not add up for mask ${k} ${m}`);

/* ------------------------------------------------ section 3: folder tree */
const TAG = { T1: "T1 duplicate", T3: "T3 not ours", T4: "T4 unit", T5: "T5 Hs basis", "real-dip": "August dip", "two-month": "two months", scope2: "certificate" };
const folders = [];
function folderOf(p) { return p.split("/").slice(1, -1).join("/"); }
for (const d of D.documents) {
  const f = folderOf(d.path);
  let g = folders.find((x) => x.name === f);
  if (!g) folders.push((g = { name: f, items: [] }));
  g.items.push({ label: fileName(d.path), open: "doc:" + fileName(d.path), tag: TAG[d.trap] || "" });
}
const wnS = folders.find((f) => f.name === "werk_nord/strom");
// October has no bill: the tree shows the file that should be there, named like its neighbours.
const OCT_FILE = D.inputs.wnBills.find((b) => b.firstMonth === 9).file.replace("2025-09_", "2025-10_");
assert(OCT_FILE.startsWith("2025-10_") && !D.documents.some((d) => fileName(d.path) === OCT_FILE), "missing October file name");
wnS.items.splice(9, 0, { label: OCT_FILE, open: "trap:T2", tag: "missing", missing: true });
folders.push({ name: folderOf(METER_CSV), items: [{ label: fileName(METER_CSV), open: "trap:T2", tag: "T2 October" }] });
folders.push({ name: folderOf(FUEL_CSV), items: [{ label: fileName(FUEL_CSV), open: "trap:T6", tag: "T6 AdBlue" }] });
folders.push({ name: "faktoren", items: [{ label: "faktoren_lehrwerte.csv", open: "trap:T7", tag: "T7 method" }] });
// the order the folders have on disk: Werk Nord (electricity, meter readings, gas), Werk Süd, Lager Ost, fleet, factors
const DISK = ["werk_nord/strom", "werk_nord", "werk_nord/gas", "werk_sued", "lager_ost", "flotte", "faktoren"];
assert(folders.length === DISK.length && folders.every((f) => DISK.includes(f.name)), "folder list differs from the disk order: " + folders.map((f) => f.name).join(", "));
folders.sort((a, b) => DISK.indexOf(a.name) - DISK.indexOf(b.name));
const treeHtml = folders.map((f) => `<section class="folder" aria-label="${esc(f.name)}"><h3>${esc(f.name)}/<span>${f.items.filter((i) => !i.missing).length} ${f.items.filter((i) => !i.missing).length === 1 ? "file" : "files"}</span></h3>
<ul class="files">${f.items.map((i) => `<li><button class="file${i.missing ? " file--missing" : ""}" type="button" data-open="${esc(i.open)}"><code>${esc(i.label)}</code>${i.tag ? `<span class="chip${i.missing ? " chip--gap" : " chip--muted"}">${esc(i.tag)}</span>` : ""}</button></li>`).join("")}</ul></section>`).join("\n");
assert(wnS.items.filter((i) => !i.missing).length === D.numbers.files_wn_electricity.rounded, "Werk Nord electricity file count differs");
const tree = `<details class="tree" id="tree" open>
  <summary>All ${esc(n("files_raw_2025"))} files of the raw folder, plus the factor file</summary>
  <div class="folders">${treeHtml}</div>
  <p class="caption">The dashed entry is the October bill that never arrived. Opening it shows the meter readings that replace it.</p>
</details>`;

/* ------------------------------------------------ section 4: bridges, sentence, ranking */
// Both bridges share one axis. It starts at a round value below the lowest total (not at zero),
// so the total bars are shortened; the page says where the axis starts.
const all = [D.numbers.total_lb_2024.rounded, D.numbers.total_lb_2025.rounded, D.numbers.total_mb_2024.rounded, D.numbers.total_mb_2025.rounded];
const hiB = Math.max(...all), lowB = Math.min(...all), spanB = hiB - lowB;
const AXIS_B = Math.floor((lowB - spanB * 0.12) / 100) * 100;
const topB = hiB + spanB * 0.02;
const bp = (v) => Math.round(100 * (v - AXIS_B) / (topB - AXIS_B) * 100) / 100;
assert(AXIS_B > 0 && AXIS_B < lowB, "bridge axis start out of range");
function bridge(m, title) {
  const y24 = D.numbers[`total_${m}_2024`].rounded, y25 = D.numbers[`total_${m}_2025`].rounded;
  let run = y24, sum = t10(y24);
  const rows = [`<li class="brow brow--tot"><span class="brow__l">2024</span><span class="track"><span class="bar" style="--l:0%;--w:${bp(y24)}%"></span><span class="cut"></span></span><span class="brow__v">${esc(C.num(y24))}</span></li>`];
  for (const d of D.drivers[m]) {
    const a = run, b = run + d.t; run = b; sum += t10(d.t);
    const l = Math.min(bp(a), bp(b)), w = Math.abs(bp(b) - bp(a));
    const k = { grid_factor: "drv:grid", certificates: "drv:cert" }[d.id] || (m === "lb" ? "drv:own" : "chg:mb");
    rows.push(`<li class="brow"><span class="brow__l"><button class="linkish" type="button" data-open="${k}">${esc(d.en)}</button></span><span class="track"><span class="bar" style="--l:${l}%;--w:${w}%"></span></span><span class="brow__v">${esc(C.signed(d.t))}</span></li>`);
  }
  assert(sum === t10(y25), `drivers.${m} do not add up to the 2025 total`);
  rows.push(`<li class="brow brow--tot brow--2025"><span class="brow__l">2025</span><span class="track"><span class="bar" style="--l:0%;--w:${bp(y25)}%"></span><span class="cut"></span></span><span class="brow__v">${esc(C.num(y25))}</span></li>`);
  if (m === "lb") rows.push(`<li class="brow brow--own"><span class="brow__l">Own use together (electricity, gas, diesel)</span><span></span><span class="brow__v">${esc(n("drv_lb_own_t").replace(" t", ""))}</span></li>`);
  return `<figure class="bridge"><h3>${esc(title)}</h3><ol aria-label="${esc(title)}, t CO₂e">${rows.join("")}</ol></figure>`;
}
const bridges = `<div class="bridges">${bridge("lb", "Location-based, 2024 to 2025 (t CO₂e)")}${bridge("mb", "Market-based, 2024 to 2025 (t CO₂e)")}</div>
<p class="caption axisnote">Both bridges share one axis that starts at ${esc(C.num(AXIS_B, 0))} t, not at zero. The change bars are to scale; the 2024 and 2025 bars are shortened.</p>`;
const nb = (label, k, accent) => `<button class="nbtn${accent ? " nbtn--accent" : ""}" type="button" data-open="${k}">${esc(label)}</button>`;
const sentence = `<div class="sentence" id="sentence">
  <p class="label">The rewritten sentence. Every number opens its driver line and rows.</p>
  <p>Scope 1 and 2 fell ${nb(nAbs("chg_lb_pct"), "chg:lb")} location-based <span class="num">(${nb(n("chg_lb_t"), "chg:lb")})</span>. In this case's teaching values, ${nb(nAbs("drv_lb_grid_t"), "drv:grid", true)} of that comes from a lower grid factor and ${nb(nAbs("drv_lb_own_t"), "drv:own")} from using less electricity, gas and diesel. Market-based fell ${nb(nAbs("chg_mb_pct"), "chg:mb")}; ${nb(nAbs("drv_mb_cert_t"), "drv:cert")} of that is guarantees of origin covering Werk Süd since January 2025.</p>
</div>
<p class="struck">The AI's sentence: <s>“The reduction comes mainly from efficiency measures at Werk Nord.”</s> The folder has no production volumes, so “used less” is supported and “more efficient” is not.</p>`;
const top3 = (m) => D.ranking[m].slice(0, 3);
const rankRows = [0, 1, 2].map((i) => {
  const a = top3("lb")[i], b = top3("mb")[i];
  return `<tr><td>${i + 1}</td><td>${esc(a.en)}</td><td class="n">${esc(C.num(a.t))} t · ${esc(C.num(a.share_pct))}%</td><td>${esc(b.en)}</td><td class="n">${esc(C.num(b.t))} t · ${esc(C.num(b.share_pct))}%</td></tr>`;
}).join("");
const ranking = `<details class="more rank" id="rank" open>
  <summary>Largest sources depend on the method</summary>
  <table><thead><tr><th scope="col">#</th><th scope="col">Location-based</th><th scope="col" class="n">t · share</th><th scope="col">Market-based</th><th scope="col" class="n">t · share</th></tr></thead><tbody>${rankRows}</tbody></table>
  <p class="caption">Werk Süd drops out of the market-based ranking because of the certificate, not lower use. ${esc(D.ranking.shareNote_en)}</p>
</details>`;

/* ------------------------------------------------ section 5: coverage grid and control total */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const LEG_EN = { "1": "one bill", "2": "counted twice", "0": "missing", S: "part of a bill for two months", Z: "meter reading instead of a bill (grade B)", J: "annual bill", Q: "quarterly statement", X: "outside the boundary" };
// The JSON codes are German initials (J = Jahresrechnung, Z = Zählerstand, S = split bill). The page shows English glyphs;
// the class names keep the JSON code. demo-app.js uses the same map.
const GLYPH = { "1": "1", "2": "2", "0": "0", S: "½", Z: "M", J: "Y", Q: "Q", X: "" };
assert(Object.keys(D.coverage.legend).every((k) => k in GLYPH), "coverage legend has a code without an English glyph");
assert(Object.keys(D.coverage.legend).every((k) => LEG_EN[k]), "coverage legend has a code without an English label");
const ROWNAME = { "WN Strom": "Werk Nord, electricity", "WS Strom": "Werk Süd, electricity", "LO Strom": "Lager Ost, electricity", "WN Gas": "Werk Nord, gas", "WS Gas": "Werk Süd, gas", "FL Diesel": "Fleet, diesel" };
const SHORT = { "WN Strom": "WN el.", "WS Strom": "WS el.", "LO Strom": "LO el.", "WN Gas": "WN gas", "WS Gas": "WS gas", "FL Diesel": "Fleet" };
const cell = (row, i) => { const code = D.coverage.expected[row][i]; return `<td data-row="${esc(row)}" data-m="${i}" data-month="${MONTHS_LONG[i]}" class="k-${code}" aria-label="${MONTHS_LONG[i]}: ${esc(LEG_EN[code])}"><span aria-hidden="true">${GLYPH[code]}</span></td>`; };
const tbCell = (i) => `<td class="k-X tbc" aria-label="Talbrück, ${MONTHS_LONG[i]}: ${esc(LEG_EN.X)}"><span aria-hidden="true">${GLYPH.J}</span></td>`;
const wide = `<table class="covtab covtab--wide"><caption class="sr-only">Coverage per site and month, 2025</caption>
      <thead><tr><th scope="col" class="pin">Site</th>${MONTHS.map((m) => `<th scope="col">${m}</th>`).join("")}</tr></thead>
      <tbody>${D.coverage.rows.map((r) => `<tr><th scope="row" class="pin">${esc(ROWNAME[r] || r)}</th>${MONTHS.map((m, i) => cell(r, i)).join("")}</tr>`).join("")}
      <tr class="outside tbc"><th scope="row" class="pin">Talbrück (not ours)</th>${MONTHS.map((m, i) => tbCell(i)).join("")}</tr></tbody></table>`;
const tall = `<table class="covtab covtab--tall"><caption class="sr-only">Coverage per month and site, 2025</caption>
      <thead><tr><th scope="col">Month</th>${D.coverage.rows.map((r) => `<th scope="col"><abbr title="${esc(ROWNAME[r] || r)}">${esc(SHORT[r] || r)}</abbr></th>`).join("")}<th scope="col" class="tbc"><abbr title="Talbrück, not ours">TB</abbr></th></tr></thead>
      <tbody>${MONTHS.map((m, i) => `<tr><th scope="row">${m}</th>${D.coverage.rows.map((r) => cell(r, i)).join("")}${tbCell(i)}</tr>`).join("")}</tbody></table>`;
const grid = `<div class="covwrap">
  <div class="gridbar"><button class="btn" type="button" id="cov-toggle" aria-pressed="false">As the folder arrived</button><p class="caption" id="cov-caption" aria-live="polite">As the ledger has it. October comes from the meter readings (grade B).</p></div>
  <div class="cov" id="cov" data-tb="0" role="region" aria-label="Coverage grid" tabindex="0">
    ${wide}
    ${tall}
  </div>
  <p class="legend">${["1", "2", "0", "S", "Z", "J", "Q", "X"].map((k) => `<span data-code="${k}" data-label="${esc(LEG_EN[k])}" data-glyph="${esc(GLYPH[k])}"><i class="k-${k}" aria-hidden="true">${esc(GLYPH[k])}</i>${esc(LEG_EN[k])}</span>`).join("")}</p>
  <p class="flagline"><span class="chip chip--muted">Flag, do not correct</span> August ${esc(n("aug_kwh"))} is a real dip during the plant holiday.</p>
</div>`;
const STATUS_EN = { enthalten: "included", "ausgeschlossen: Duplikat": "excluded: duplicate", "ausgeschlossen: Grenze": "excluded: boundary", "ergänzt: Zählerstand, DQ B": "added: meter reading, grade B" };
const docs = D.controlTotal.filter((r) => r.group === "document"), meters = D.controlTotal.filter((r) => r.group === "meter");
const sumDocs = docs.reduce((s, r) => s + r.kwh, 0), exc = docs.filter((r) => r.status.startsWith("ausgeschlossen")).reduce((s, r) => s + r.kwh, 0);
assert(sumDocs === D.numbers.ctl_docs_kwh.value, "control total: documents do not add up to ctl_docs_kwh");
assert(exc === D.numbers.ctl_excluded_kwh.value, "control total: excluded rows differ from ctl_excluded_kwh");
assert(sumDocs - exc === D.numbers.ctl_included_kwh.value, "control total: included differs");
assert(sumDocs - exc + meters.reduce((s, r) => s + r.kwh, 0) === D.numbers.ctl_total_kwh.value, "control total: final differs");
for (const r of D.controlTotal) assert(STATUS_EN[r.status], "control total status without English label: " + r.status);
const kwh = (k) => esc(n(k).replace(" kWh", ""));
const control = `<details class="more ctl" id="ctl" open><summary>Control total, electricity 2025 (kWh)</summary><table>
  <tbody>
    ${docs.map((r) => `<tr><th scope="row">${esc(r.en).replace(/(\d+-\d+)/g, '<span class="nw">$1</span>')}<br><span class="st">${esc(STATUS_EN[r.status])}</span></th><td class="n">${esc(C.num(r.kwh, 0))}</td></tr>`).join("")}
    <tr class="sum"><th scope="row">Documents in the folder</th><td class="n">${kwh("ctl_docs_kwh")}</td></tr>
    <tr><th scope="row">minus excluded (duplicate, Talbrück)</th><td class="n">${esc(C.num(-D.numbers.ctl_excluded_kwh.value, 0))}</td></tr>
    <tr><th scope="row">Included documents</th><td class="n">${kwh("ctl_included_kwh")}</td></tr>
    ${meters.map((r) => `<tr><th scope="row">plus ${esc(r.en)}<br><span class="st">${esc(STATUS_EN[r.status])}</span></th><td class="n">+${esc(C.num(r.kwh, 0))}</td></tr>`).join("")}
    <tr class="fin"><th scope="row">Electricity in the boundary</th><td class="n">${kwh("ctl_total_kwh")}</td></tr>
  </tbody></table>
  <p class="caption">The meter row stays below the documents sum because it is not a document in the folder.</p>
</details>`;

/* ------------------------------------------------ section 6: run record */
const runs = D.runs;
const runsHtml = runs.status === "not_captured" ? `<div class="runs">
  <div>
    <p><span class="chip chip--gap">Not captured yet</span></p>
    <p>${esc(D.meta.constructedLabel_en)}</p>
    <p class="tlabel"><span class="chip">${esc(D.meta.targetLabel_en)}</span></p>
    <p>Used for the ledger answer in the deck and the guide.</p>
  </div>
  <details class="more proto" id="proto" open><summary>The capture protocol</summary><ol aria-label="Run protocol">
    <li>Hold the model, prompt, factor file, 2024 summary and date constant.</li>
    <li>Conditions: ${esc(runs.plannedConditions.join("; "))}.</li>
    <li>${esc(String(runs.runsPerCondition))} runs per condition, each scored on ${esc(String(runs.scoredItems.length))} items, from Scope 1 to whether it asks about other Scope 1 sources.</li>
  </ol></details>
</div>` : `<p>Recorded runs are in <code>runs.table</code>.</p>`;

/* ------------------------------------------------ assemble */
const blocks = { lanes, sequence, console: consoleBlock, board, tree, bridges, sentence, ranking, grid, control, runs: runsHtml };
const safeJson = JSON.stringify(D).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
let html = template
  .replace(/\{\{block:([a-z]+)\}\}/g, (_, k) => { if (!(k in blocks)) throw new Error("unknown block " + k); return blocks[k]; })
  .replace(/\{\{n:([a-z0-9_]+)\}\}/g, (_, k) => esc(n(k)))
  .replace(/\{\{c:count\}\}/g, String(Object.keys(D.combinations).length))
  .replace(/\{\{t:([A-Za-z0-9_.]+)\}\}/g, (_, p) => { const v = at(p); if (v === undefined) throw new Error("missing text " + p); return esc(v); });
html = html.replace("{{data}}", () => safeJson);
const GEN = "/* Generated by scripts/workshop04/build-demo.mjs from scripts/workshop04/%s. Edit the source there and rebuild. */\n";
const coreOut = GEN.replace("%s", "demo-core.js") + coreSrc.trim() + "\n";
const appOut = GEN.replace("%s", "demo-app.js") + appSrc.trim() + "\n";

/* ------------------------------------------------ page-level checks */
assert(!/\{\{[^}]*\}\}/.test(html), "unresolved placeholder in output");
assert(!/[–—]/.test(html), "en or em dash in output");
assert(!/\son[a-z]+\s*=\s*["']/i.test(html.replace(/<script[\s\S]*?<\/script>/g, "")), "inline event handler attribute in output");
// no inline executable script: every <script> either has a src or is JSON data
for (const tag of html.match(/<script\b[^>]*>/g) || []) assert(/\ssrc="/.test(tag) || /type="application\/json"/.test(tag), "inline executable script in output: " + tag);
for (const [name, src] of [["w04-demo-core.js", coreOut], ["w04-demo.js", appOut]]) {
  assert(!/[–—]/.test(src), name + ": en or em dash");
  assert(!/innerHTML|insertAdjacentHTML|document\.write|localStorage|fetch\(|XMLHttpRequest/.test(src), name + ": forbidden API");
  assert(!(src.match(/[A-Za-z0-9_]{40,}/g) || []).some((t) => /[a-z]/.test(t) && /[A-Z]/.test(t)), name + ": mixed-case token of 40+ chars");
  assert(html.includes(`<script src="./lib/${name}" defer></script>`), "demo.html does not load lib/" + name);
}
assert(!/down to the right answer/.test(html + coreOut + appOut), "caption says 'down to the right answer'");
assert(D.documents.find((d) => d.trap === "T1").lines.some((l) => l.includes("Enerqie")), "duplicate drawer copy: the scan no longer spells 'Enerqie'");
assert(!/innerHTML|insertAdjacentHTML|document\.write|localStorage|fetch\(|XMLHttpRequest|<iframe/i.test(html.replace(/<script type="application\/json"[\s\S]*?<\/script>/, "")), "forbidden API in output");
const longTok = (html.match(/[A-Za-z0-9_]{40,}/g) || []).filter((t) => /[a-z]/.test(t) && /[A-Z]/.test(t));
assert(longTok.length === 0, "mixed-case token of 40+ chars: " + longTok.slice(0, 3).join(", "));
assert(!/href="[^"]*\/"/.test(html), "href ending in /");
// ledger arithmetic shown in the drawer must reproduce the CSV values
for (const r of D.ledger) {
  if (!["actual", "actual_meter"].includes(r.status)) continue;
  const q = Number(r.qty_norm);
  assert(t10(q * D.factors[r.factor_lb].value / 1000) === t10(C.deNum(r.t_lb)), `ledger ${r.row_id}: LB arithmetic differs from t_lb`);
  assert(t10(q * D.factors[r.factor_mb].value / 1000) === t10(C.deNum(r.t_mb)), `ledger ${r.row_id}: MB arithmetic differs from t_mb`);
}
const MR = D.inputs.meterReadings, oct = MR.find((m) => m.date === "31.10.2025").kwh - MR.find((m) => m.date === "30.09.2025").kwh;
assert(oct === D.numbers.oct_kwh.value, "meter subtraction differs from oct_kwh");
assert(D.inputs.dieselMonthL.reduce((a, b) => a + b, 0) === D.numbers.diesel_l.value, "diesel months differ from diesel_l");
assert(D.inputs.adblueMonthL.reduce((a, b) => a + b, 0) === D.numbers.adblue_l.value, "AdBlue months differ from adblue_l");
const unc = D.numbers.el_uncovered_kwh.value;
assert(t10(unc * D.factors["F-EL-RM-2025"].value / 1000) === t10(D.numbers.s2mb_2025.rounded), "residual-mix arithmetic differs from s2mb_2025");
assert(t10(unc * D.factors["F-EL-LB-2025"].value / 1000) === t10(D.numbers.mb_grid_avg_wrong_s2_t.rounded), "grid-average arithmetic differs");
const inc = D.ledger.filter((r) => r.carrier === "Strom" && r.in_boundary === "ja" && r.status !== "excluded").reduce((s, r) => s + Number(r.qty_norm), 0);
assert(inc === D.numbers.el_total_kwh.value, "included electricity rows differ from el_total_kwh");
assert(t10(D.drivers.lb.slice(1).reduce((s, d) => s + d.t, 0)) === t10(D.numbers.drv_lb_own_t.rounded), "own-use drivers differ from drv_lb_own_t");

if (problems.length) {
  console.error("build-demo: " + problems.length + " problem(s):\n  " + problems.join("\n  "));
  process.exit(1);
}
const outputs = [[OUT, html], [OUT_CORE, coreOut], [OUT_APP, appOut]];
if (check) {
  let drift = 0;
  for (const [file, text] of outputs) {
    const cur = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (cur !== text) { drift++; console.error(`drift: ${path.relative(repo, file)} differs from the build (run node scripts/workshop04/build-demo.mjs)`); }
  }
  if (drift) process.exit(1);
  console.log(`demo.html and its two scripts are up to date (${Buffer.byteLength(html)} bytes, data ${path.relative(repo, dataPath)})`);
} else {
  for (const [file, text] of outputs) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
    console.log(`wrote ${path.relative(repo, file)} (${Buffer.byteLength(text)} bytes)`);
  }
  console.log(`data ${path.relative(repo, dataPath)}`);
}
