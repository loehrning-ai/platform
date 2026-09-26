#!/usr/bin/env node
/* Workshop 04 learner pages: guide.html, field-card.html, transfer.html.

   Templates live in scripts/workshop04/pages/*.template.html. Every figure on a page is a
   placeholder resolved from scripts/workshop04/data/w04-data.json (built by
   data/build_dataset.py, the same file the deck build reads), so a page can never show a
   number the dataset does not hold:

     {{n:key}}            numbers[key].en            "1,444.0 t"
     {{n:key:abs}}        without sign and unit      "495.5"
     {{n:key:absunit}}    without sign               "495.5 t"
     {{n:key:bare}}       without unit               "−102.3"
     {{j:path}}           any JSON value by dot path (array segments: index, row_id, id, step)
     {{j:path:int|fix1|fix2|pct|dmy}}
     {{fig:name}}         a figure generated below from the JSON
     {{strip:page}}       the shared top strip with numbered material tabs
     {{sec}}              the next section number (guide)
     {{toc}}              table of contents built from the guide's h2 elements
     {{kit:href|size}}    the kit archive's file name, or its size read from disk ("90 KB")

   Numbers keep their unit on the same line (U+00A0 before the unit), factor editions and
   ISO dates do not break at their hyphens, and hyphenated IDs in <code> get class "nowrap".

   After resolving, the build fails if a template carries a literal digit outside a placeholder
   that is not on the short allowlist of non-data facts (years, legal references, durations),
   if any U+2013 or U+2014 dash appears, if an inline event handler, fetch, storage or innerHTML
   sink appears, if an href ends in "/", if a mixed-case token of 40+ characters appears, or if
   a placeholder is left unresolved.

   Usage: node scripts/workshop04/build-pages.mjs [--check] [--data <path>] */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");
const outDir = join(repo, "packages/website/public/workshops/esg-berichte-mit-ki");
const args = process.argv.slice(2);
const check = args.includes("--check");
const dataArg = args.indexOf("--data");
const dataPath = dataArg >= 0 ? resolve(args[dataArg + 1]) : (process.env.W04_DATA ? resolve(process.env.W04_DATA) : join(here, "data", "w04-data.json"));
const data = JSON.parse(readFileSync(dataPath, "utf8"));

const problems = [];
const fail = (msg) => problems.push(msg);

/* ------------------------------------------------------------------ resolvers */
const UNIT = /\s+(t\/Mio\. EUR|kWh|MWh|t|l)$/;
const SIGN = /^[+−-]/;

const NBSP = "\u00A0";
const keepUnit = (s) => s.replace(/ (t\/Mio\.) (EUR)$/, `${NBSP}$1${NBSP}$2`).replace(/ (kWh|MWh|t|l)$/, `${NBSP}$1`);
function num(key, form = "") {
  const entry = data.numbers?.[key];
  if (!entry) { fail(`unknown number key: ${key}`); return `??${key}??`; }
  const en = String(entry.en);
  switch (form) {
    case "": return keepUnit(en);
    case "bare": return en.replace(UNIT, "");
    case "abs": return en.replace(UNIT, "").replace(SIGN, "");
    case "absunit": return keepUnit(en.replace(SIGN, ""));
    default: fail(`unknown number form ${form} for ${key}`); return en;
  }
}
const val = (key) => Number(data.numbers[key].value);

function pick(list, segment) {
  if (/^\d+$/.test(segment)) return list[Number(segment)];
  return list.find((item) => item && typeof item === "object"
    && (item.row_id === segment || item.id === segment || item.step === segment || String(item.n) === segment));
}
function jpath(path) {
  let value = data;
  for (const segment of path.split(".")) {
    if (value == null) break;
    value = Array.isArray(value) ? pick(value, segment) : value[segment];
  }
  return value;
}
function j(path, form = "") {
  const value = jpath(path);
  if (value == null || typeof value === "object") { fail(`unresolved JSON path: ${path}`); return `??${path}??`; }
  switch (form) {
    case "": return String(value);
    case "int": return Number(value).toLocaleString("en-US");
    case "fix1": return Number(value).toFixed(1);
    case "fix2": return Number(value).toFixed(2);
    case "pct": return `${Number(value)}%`;
    case "dmy": { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value)); if (!m) fail(`not an ISO date: ${path}`); return m ? `${m[3]}.${m[2]}.${m[1]}` : String(value); }
    default: fail(`unknown JSON form ${form} for ${path}`); return String(value);
  }
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtKwh = (n) => `${Number(n).toLocaleString("en-US")}${NBSP}kWh`;
/* A JSON string in running text: keep "1.240 MWh" and "Lehrwerte v1.0" together, and never
   break an ISO date at its hyphens. Returns HTML. */
const jText = (s) => esc(s)
  .replace(/(\d) (MWh|kWh)\b/g, `$1${NBSP}$2`)
  .replace(/Lehrwerte v/g, `Lehrwerte${NBSP}v`)
  .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, '<span class="nowrap">$1</span>');
/* The factor label as a chip or caption: the JSON sentence without its closing period. */
const factorLabel = () => String(data.meta.factorLabel_en).replace(/\.$/, "");
const KIT = "kellbrunn-esg-kit.zip";

/* ------------------------------------------------------------------ data assertions the figures rely on */
function assert(cond, msg) { if (!cond) fail(`data check: ${msg}`); }
{
  const ct = data.controlTotal;
  const docs = ct.filter((r) => r.group === "document");
  const docSum = docs.reduce((s, r) => s + r.kwh, 0);
  const excluded = docs.filter((r) => r.status.startsWith("ausgeschlossen")).reduce((s, r) => s + r.kwh, 0);
  const meter = ct.filter((r) => r.group === "meter").reduce((s, r) => s + r.kwh, 0);
  assert(docSum === val("ctl_docs_kwh"), "control total documents");
  assert(excluded === val("ctl_excluded_kwh"), "control total excluded");
  assert(meter === val("ctl_meter_kwh"), "control total meter");
  assert(docSum - excluded + meter === val("ctl_total_kwh"), "control total arithmetic");
  assert(val("ctl_total_kwh") === val("el_total_kwh"), "control total equals electricity total");
  const mr = data.inputs.meterReadings;
  assert(mr[10].date === "31.10.2025" && mr[9].date === "30.09.2025", "meter reading indices");
  assert(mr[10].kwh - mr[9].kwh === val("oct_kwh"), "October from meter readings");
  assert(val("dup_kwh") - val("oct_kwh") === Number(data.numbers.wn_net_raw_vs_right_kwh.value), "duplicate minus October");
  const lb = data.waterfall.lb;
  let run = lb[0].running_t;
  for (const step of lb.slice(1)) { run = Math.round((run + step.change_t) * 10) / 10; assert(Math.abs(run - step.running_t) < 0.05, `waterfall LB ${step.step}`); }
  assert(Math.abs(lb[0].running_t - val("wrong_total_lb")) < 0.05 && Math.abs(lb.at(-1).running_t - val("total_lb_2025")) < 0.05, "waterfall ends");
  const s2 = val("s2lb_2025") + val("bridge_cert_t") + val("bridge_rm_t");
  assert(Math.abs(s2 - val("s2mb_2025")) < 0.05, "Scope 2 bridge");
  const drvLb = data.drivers.lb.reduce((s, d) => s + d.t, 0);
  assert(Math.abs(drvLb - val("chg_lb_t")) < 0.15, "LB drivers sum to the change");
  assert(Math.abs(val("drv_lb_grid_t") + val("drv_lb_own_t") - val("chg_lb_t")) < 0.15, "LB grid + own use");
  const drvMb = data.drivers.mb.reduce((s, d) => s + d.t, 0);
  assert(Math.abs(drvMb - val("chg_mb_t")) < 0.15, "MB drivers sum to the change");
  assert(data.factors["F-EL-LB-2025"].value * val("el_total_kwh") / 1000 === val("s2lb_2025"), "location-based Scope 2");
  assert(data.inputs.ws.printed === "1.240 MWh", "Werk Süd printed value");
  const cov = data.coverage;
  assert(cov.asDelivered["WN Strom"].length === 12 && cov.expected["WN Strom"].length === 12, "coverage months");
  const ws = data.ledger.find((r) => r.row_id === "E-WS-01");
  assert(ws && ws.instrument_id === "I-WS-GO" && ws.factor_mb === "F-EL-GO", "Werk Süd ledger row");
  // the month strip draws every file in the Werk Nord electricity folder: month cells plus the Talbrück bill
  const raw = cov.asDelivered["WN Strom"];
  const monthFiles = raw.filter((c) => c === "1").length + 2 * raw.filter((c) => c === "2").length + (raw.includes("S") ? 1 : 0);
  const wnDocs = data.documents.filter((d) => d.path.includes("/Werk_Nord/Strom/"));
  const tb = data.ledger.find((r) => r.row_id === "E-TB-01");
  assert(tb && tb.status === "excluded" && wnDocs.some((d) => d.path === tb.source_file), "Talbrück bill is in the Werk Nord electricity folder");
  assert(monthFiles + 1 === val("files_wn_electricity") && wnDocs.length === val("files_wn_electricity"), "month strip draws all Werk Nord electricity files");
  assert(raw.filter((c) => c !== "0").length === val("months_wn_covered_raw"), "months covered as delivered");
  // labels every learner page must carry (brief: illustrative teaching values; constructed from documented failure modes)
  assert(/^Illustrative teaching values/.test(data.meta.factorLabel_en), "factor label says illustrative teaching values");
  assert(/^Constructed from documented failure modes/.test(data.meta.constructedLabel_en), "constructed label names documented failure modes");
  assert(Math.abs(val("s2lb_2025") + val("bridge_cert_t") - val("mb_grid_avg_wrong_s2_t")) < 0.05, "grid-average market-based = location-based minus certificate");
}

/* ------------------------------------------------------------------ figures */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function monthStrip(codes, mode) {
  // codes: coverage letters per month; consecutive "S" cells merge into one cell (one bill, several months).
  // Labels over hatching sit on a paper chip; the meter cell is solid Schiefer with on-dark text.
  const cells = [];
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (c === "S") {
      let k = i; while (k + 1 < codes.length && codes[k + 1] === "S") k++;
      const span = k - i + 1;
      const cls = mode === "raw" ? "mg-c mg-c--bill" : "mg-c mg-c--row";
      cells.push(`<span class="${cls} mg-c--span" style="grid-column:span ${span}" title="${MONTHS[i]} to ${MONTHS[k]}: one bill">` +
        `<span class="mg-t">one bill</span></span>`);
      i = k; continue;
    }
    if (c === "1") cells.push(`<span class="mg-c ${mode === "raw" ? "mg-c--bill" : "mg-c--row"}" title="${MONTHS[i]}: one bill"></span>`);
    else if (c === "2") cells.push(`<span class="mg-c mg-c--bill mg-c--twice" title="${MONTHS[i]}: the same bill twice"><span class="mg-badge">2</span></span>`);
    else if (c === "0") cells.push(`<span class="mg-c mg-c--none" title="${MONTHS[i]}: no bill"><span class="mg-t">none</span></span>`);
    else if (c === "Z") cells.push(`<span class="mg-c mg-c--meter" title="${MONTHS[i]}: meter reading, grade B"><span class="mg-t">meter</span></span>`);
    else fail(`unexpected coverage code ${c}`);
  }
  // the thirteenth file in the folder: the Talbrück bill, detached from the months
  if (mode === "raw") cells.push(`<span class="mg-c mg-c--bill mg-c--other" title="Talbrück's annual bill: in the folder, not Kellbrunn's"><span class="mg-t">Talbrück</span></span>`);
  else cells.push(`<span class="mg-c mg-c--out" title="Talbrück's bill: kept in the ledger as excluded, with the reason"><span class="mg-t">out</span></span>`);
  return cells.join("");
}

function figMonths() {
  const raw = data.coverage.asDelivered["WN Strom"];
  const exp = data.coverage.expected["WN Strom"];
  const dup = MONTH_LONG[raw.indexOf("2")];
  const gap = MONTH_LONG[raw.indexOf("0")];
  const head = MONTHS.map((m) => `<span>${m.slice(0, 1)}</span>`).join("") + `<span class="mg-mon-other">JV</span>`;
  return `<figure class="fig" aria-labelledby="fig-months-cap">
  <div class="mg">
    <div class="mg-row"><span class="mg-lab">As the folder arrived<small>${esc(num("files_wn_electricity"))} files, Werk Nord electricity</small></span><span class="mg-wrap"><span class="mg-mon" aria-hidden="true">${head}</span><span class="mg-cells" role="img" aria-label="As the folder arrived, ${esc(num("files_wn_electricity"))} files: ${dup} twice, ${gap} missing, November and December on one bill, and Talbrück's annual bill, which is not Kellbrunn's.">${monthStrip(raw, "raw")}</span></span></div>
    <div class="mg-row"><span class="mg-lab">In the ledger<small>every month once, October from the meter</small></span><span class="mg-cells" role="img" aria-label="In the ledger: every month once, ${gap} from the meter readings, November and December on one bill, and the Talbrück row kept as excluded.">${monthStrip(exp, "ledger")}</span></div>
  </div>
  <p class="fig-sum"><span class="mono">+${esc(num("dup_kwh"))} − ${esc(num("oct_kwh"))} = ${esc(num("wn_net_raw_vs_right_kwh"))}</span><span>the duplicate March bill minus the missing October</span></p>
  <ul class="legend" aria-label="Legend">
    <li><span class="sw sw--bill"></span>Bill in the folder</li>
    <li><span class="sw sw--twice"></span>Same bill twice</li>
    <li><span class="sw sw--none"></span>No bill for the month</li>
    <li><span class="sw sw--other"></span>Another company's bill</li>
    <li><span class="sw sw--row"></span>Ledger row</li>
    <li><span class="sw sw--meter"></span>Meter reading, grade B</li>
    <li><span class="sw sw--out"></span>Excluded row, with the reason</li>
  </ul>
  <figcaption id="fig-months-cap" class="wf-caption">Werk Nord electricity 2025, month by month. JV: the joint venture Talbrück, which Kellbrunn does not run. Fictional company.</figcaption>
</figure>`;
}

function barRows(rows, lo, hi, opts = {}) {
  const span = hi - lo;
  const pct = (v) => (((v - lo) / span) * 100).toFixed(2);
  const lines = (opts.limits || []).map((l) => `<span class="br-lim" style="left:${pct(l.v)}%"></span>`).join("");
  const limHead = opts.limits ? `<div class="br-row br-row--head" aria-hidden="true"><span class="br-lab"></span><span class="br-track">${opts.limits.map((l) => `<span class="br-limlab" style="left:${pct(l.v)}%">${esc(l.text)}</span>`).join("")}${lines}</span><span class="br-val"></span></div>` : "";
  const body = rows.map((r) => {
    const a = Math.min(r.from, r.to), b = Math.max(r.from, r.to);
    const cut = opts.cut && a <= lo ? " br-bar--cut" : "";
    return `<div class="br-row${r.strong ? " br-row--strong" : ""}${r.muted ? " br-row--muted" : ""}"><span class="br-lab">${r.label}</span>` +
      `<span class="br-track">${lines}<span class="br-bar br-bar--${r.style}${cut}" style="left:${pct(Math.max(a, lo))}%;width:${(((b - Math.max(a, lo)) / span) * 100).toFixed(2)}%"></span></span>` +
      `<span class="br-val${r.accent ? " wf-accent" : ""}${r.muted ? " br-val--muted" : ""}">${r.value}</span></div>`;
  }).join("\n    ");
  return `${limHead}\n    ${body}`;
}

function figWaterfall() {
  const wf = data.waterfall.lb.filter((s) => s.step === "start" || Math.abs(s.change_t) > 0);
  const min = val("wf_lb_min_t"), max = val("wf_lb_max_t");
  const lo = Math.floor((min - 60) / 100) * 100, hi = Math.ceil((max + 40) / 100) * 100;
  const rows = [];
  let prev = null;
  for (const s of wf) {
    if (s.step === "start") rows.push({ label: "Raw-folder answer <small>constructed</small>", from: lo, to: s.running_t, style: "hatch", value: `${s.running_en}${NBSP}t` });
    else rows.push({ label: `${esc(s.label_en)}`, from: prev, to: s.running_t, style: "ink", value: s.change_en });
    prev = s.running_t;
  }
  rows.push({ label: "Right total", from: lo, to: prev, style: "ink", value: num("total_lb_2025"), strong: true });
  const last = wf.at(-1);
  assert(Math.abs(last.running_t - val("total_lb_2025")) < 0.05, "waterfall ends at the right total");
  const table = barRows(rows, lo, hi, { cut: true, limits: [{ v: min, text: num("wf_lb_min_t") }, { v: max, text: num("wf_lb_max_t") }] });
  return `<figure class="fig" aria-labelledby="fig-wf-cap">
  <div class="br" role="img" aria-label="Waterfall, location-based Scope 1 and 2: the constructed answer ${esc(num("wrong_total_lb"))}; removing the errors one by one swings the running total between ${esc(num("wf_lb_min_t"))} and ${esc(num("wf_lb_max_t"))}; it ends at the right total, ${esc(num("total_lb_2025"))}.">
    ${table}
  </div>
  <figcaption id="fig-wf-cap" class="wf-caption">Location-based Scope 1 and 2, errors removed one at a time in a fixed order. Computed from the traps: what they do when they fire. The raw-folder answer is constructed from documented failure modes, not a recorded run. The axis starts above zero; the dashed lines mark the lowest and highest running total.</figcaption>
</figure>`;
}

function figBridge() {
  const lbv = val("s2lb_2025"), mbv = val("s2mb_2025"), cert = val("bridge_cert_t"), rm = val("bridge_rm_t");
  const mid = lbv + cert;
  const wrong = val("mb_grid_avg_wrong_s2_t");
  const rows = [
    { label: "Location-based", from: 0, to: lbv, style: "ink", value: num("s2lb_2025") },
    { label: "Certificate, Werk Süd", from: mid, to: lbv, style: "open", value: num("bridge_cert_t") },
    { label: "Rest at the grid average <small>wrong for market-based</small>", from: 0, to: wrong, style: "dash", value: num("mb_grid_avg_wrong_s2_t"), muted: true },
    { label: "Residual mix on the rest", from: mid, to: mid + rm, style: "slate", value: num("bridge_rm_t") },
    { label: "Market-based", from: 0, to: mbv, style: "ink", value: num("s2mb_2025"), strong: true },
  ];
  return `<figure class="fig" aria-labelledby="fig-bridge-cap">
  <div class="br" role="img" aria-label="Scope 2 2025: location-based ${esc(num("s2lb_2025"))}; the certificate for Werk Süd removes ${esc(num("bridge_cert_t", "absunit"))}; stopping there, with the rest at the grid average, gives ${esc(num("mb_grid_avg_wrong_s2_t"))}, which is wrong for market-based; the residual mix on the rest adds ${esc(num("bridge_rm_t", "absunit"))}; market-based ${esc(num("s2mb_2025"))}.">
    ${barRows(rows, 0, Math.max(lbv, mbv) * 1.02)}
  </div>
  <figcaption id="fig-bridge-cap" class="wf-caption">Scope 2 2025, from location-based to market-based. The dashed bar is where the wrong ${esc(num("mb_grid_avg_wrong_s2_t"))} comes from: the certificate is taken off, and the rest stays at the grid average instead of the residual mix. ${esc(factorLabel())}.</figcaption>
</figure>`;
}

function figDrivers() {
  // both groups share one scale, set by the largest bar (the certificates), so the grid factor's
  // −72.2 t reads as about a tenth of the certificates' −744.0 t
  const max = Math.max(...[...data.drivers.lb, ...data.drivers.mb].map((d) => Math.abs(d.t)));
  assert(max === Math.abs(val("drv_mb_cert_t")), "the certificates are the largest driver");
  const group = (list, highlight) => {
    return barRows(list.map((d) => ({
      label: esc(d.en), from: 0, to: Math.abs(d.t), style: d.id === highlight ? "accent" : "ink", accent: d.id === highlight,
      value: `${d.t < 0 ? "−" : "+"}${Math.abs(d.t).toFixed(1)}${NBSP}t`,
    })), 0, max * 1.02);
  };
  return `<figure class="fig" aria-labelledby="fig-drv-cap">
  <p class="fig-head">Location-based, ${esc(num("chg_lb_t"))} against 2024</p>
  <div class="br" role="img" aria-label="Location-based decrease ${esc(num("chg_lb_t", "absunit"))}: grid factor ${esc(num("drv_lb_grid_t", "absunit"))}, less electricity ${esc(num("drv_lb_elec_t", "absunit"))}, less gas ${esc(num("drv_lb_gas_t", "absunit"))}, less diesel ${esc(num("drv_lb_diesel_t", "absunit"))}.">
    ${group(data.drivers.lb, "grid_factor")}
  </div>
  <p class="fig-head">Market-based, ${esc(num("chg_mb_t"))} against 2024</p>
  <div class="br" role="img" aria-label="Market-based decrease ${esc(num("chg_mb_t", "absunit"))}: guarantees of origin ${esc(num("drv_mb_cert_t", "absunit"))}, less electricity ${esc(num("drv_mb_elec_t", "absunit"))}, less gas and diesel ${esc(num("drv_mb_s1_t", "absunit"))}.">
    ${group(data.drivers.mb, "")}
  </div>
  <figcaption id="fig-drv-cap" class="wf-caption">What drove the change, 2024 to 2025. Both groups are drawn on one scale. ${esc(data.drivers.convention_en)} ${esc(factorLabel())}.</figcaption>
</figure>`;
}

function figControl() {
  const status = { "enthalten": "included", "ausgeschlossen: Duplikat": "excluded: duplicate", "ausgeschlossen: Grenze": "excluded: boundary", "ergänzt: Zählerstand, DQ B": "added: meter reading, grade B" };
  const docs = data.controlTotal.filter((r) => r.group === "document");
  const meter = data.controlTotal.filter((r) => r.group === "meter");
  const row = (r) => {
    const s = status[r.status]; if (!s) fail(`unknown control-total status ${r.status}`);
    return `<tr${r.status.startsWith("ausgeschlossen") ? ' class="ct-out"' : ""}><td>${esc(r.en)}<small>${esc(s)}</small></td><td class="num">${fmtKwh(r.kwh)}</td></tr>`;
  };
  return `<figure class="fig" aria-labelledby="fig-ct-cap">
  <table class="wf-table ct">
    <thead><tr><th scope="col">Electricity 2025</th><th scope="col" class="num">kWh</th></tr></thead>
    <tbody>
      ${docs.map(row).join("\n      ")}
      <tr class="ct-sum"><td>All electricity on documents</td><td class="num">${esc(num("ctl_docs_kwh"))}</td></tr>
      <tr><td>minus excluded with a reason</td><td class="num">−${esc(num("ctl_excluded_kwh"))}</td></tr>
      ${meter.map((r) => `<tr><td>plus ${esc(r.en)}<small>${esc(status[r.status])}</small></td><td class="num">+${fmtKwh(r.kwh)}</td></tr>`).join("")}
      <tr class="ct-sum ct-total"><td>In the ledger</td><td class="num">${esc(num("ctl_total_kwh"))}</td></tr>
    </tbody>
  </table>
  <figcaption id="fig-ct-cap" class="wf-caption">Control total for electricity, as in the kit file <code>erwartet/kontrollsumme_strom_2025.csv</code>.</figcaption>
</figure>`;
}

function figDot() {
  // One printed line from the Werk Süd statement. The dot is its own tspan in Mennige, so it is
  // marked exactly whatever the font; the underline below it uses the monospace advance.
  const line = data.inputs.ws.printed;            // "1.240 MWh"
  const prefix = "Verbrauch 2025: ";
  const full = prefix + line;
  const dotIndex = full.indexOf(".");
  const size = 17, adv = size * 0.6, x0 = 16;
  const file = `${data.traceTwo[0].file} · page ${data.ledger.find((r) => r.row_id === "E-WS-01").source_page}`;
  if (data.traceTwo[0].quote !== full) fail("dot figure: the quote differs from the printed line");
  const width = Math.ceil(x0 * 2 + Math.max(full.length * adv, file.length * 12 * 0.6));
  const ux = x0 + dotIndex * adv;
  return `<figure class="fig fig-dot" aria-labelledby="fig-dot-cap">
  <svg class="dot-svg" viewBox="0 0 ${width} 84" width="${width}" height="84" role="img" aria-label="The printed line reads ${esc(full)}. The dot after the 1 is marked: on a German document it separates thousands.">
    <rect x="0.5" y="0.5" width="${width - 1}" height="83" class="dot-paper"/>
    <text x="${x0}" y="24" class="dot-file">${esc(file)}</text>
    <text x="${x0}" y="58" class="dot-line" font-size="${size}">${esc(full.slice(0, dotIndex))}<tspan class="dot-hit">.</tspan>${esc(full.slice(dotIndex + 1))}</text>
    <rect x="${(ux - 1).toFixed(1)}" y="66" width="${(adv + 2).toFixed(1)}" height="3" class="dot-under"/>
  </svg>
  <dl class="dot-read">
    <div><dt>Dot separates thousands</dt><dd><span class="mono">${esc(num("el_ws_kwh"))}</span> · ${esc(num("ws_kwh_per_employee"))} per employee</dd></div>
    <div class="is-wrong"><dt>Dot read as a decimal point</dt><dd><span class="mono">${esc(j("inputs.ws.misreadKwh", "int"))}${NBSP}kWh</span> · ${esc(num("ws_misread_kwh_per_employee"))} per employee</dd></div>
    <div><dt>Printed on the same page for last year</dt><dd><span class="mono">${jText(data.inputs.ws.priorYearPrinted)}</span></dd></div>
  </dl>
  <figcaption id="fig-dot-cap" class="wf-caption">Werk Süd annual statement 2025, text rendering from the kit. Per employee: ${esc(j("company.staff_WS"))} staff at Werk Süd.</figcaption>
</figure>`;
}

function glyphMonths() {
  // header glyph for the field card: Werk Nord as it arrived. One square per bill, the doubled
  // March raised in Mennige, October dashed, November and December one wide cell. Captioned.
  const codes = data.coverage.asDelivered["WN Strom"];
  const out = [];
  const step = 11, size = 9;
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i], x = 1 + i * step;
    if (c === "S") {
      let k = i; while (k + 1 < codes.length && codes[k + 1] === "S") k++;
      out.push(`<rect x="${x}" y="8" width="${(k - i) * step + size}" height="${size}" fill="#121212"/>`);
      i = k; continue;
    }
    if (c === "0") out.push(`<rect x="${x + 0.5}" y="8.5" width="${size - 1}" height="${size - 1}" fill="none" stroke="#121212" stroke-dasharray="2 1.5"/>`);
    else if (c === "2") out.push(`<rect x="${x}" y="8" width="${size}" height="${size}" fill="#b73a15"/><rect x="${x}" y="1" width="${size}" height="5" fill="#b73a15"/>`);
    else out.push(`<rect x="${x}" y="8" width="${size}" height="${size}" fill="#121212"/>`);
  }
  const w = codes.length * step + 2;
  const dup = MONTH_LONG[codes.indexOf("2")], gap = MONTH_LONG[codes.indexOf("0")];
  const s0 = codes.indexOf("S"), s1 = codes.lastIndexOf("S");
  return `<figure class="glyph"><svg width="${w * 1.5}" height="27" viewBox="0 0 ${w} 18" aria-hidden="true" focusable="false">${out.join("")}</svg>` +
    `<figcaption>Werk Nord 2025 as it arrived: ${dup} twice, ${gap} missing, ${MONTH_LONG[s0]} and ${MONTH_LONG[s1]} on one bill.</figcaption></figure>`;
}

const FIGS = { months: figMonths, waterfall: figWaterfall, bridge: figBridge, drivers: figDrivers, control: figControl, dot: figDot, glyph: glyphMonths };

/* ------------------------------------------------------------------ shared strip
   Same order as MATERIALS in src/lib/workshops-esg-reporting.ts (presenter view left out, as in
   the other workshops' strips) and as the demo strip in demo.template.html. */
const MATS = [
  ["slides.html", "Deck"],
  ["demo.html", "Interactive demo"],
  [KIT, "Kit"],
  ["transfer.html", "Transfer sheet"],
  ["guide.html", "Learner guide"],
  ["field-card.html", "Field card"],
];
function kit(what) {
  const file = join(outDir, KIT);
  if (!existsSync(file)) { fail(`kit archive missing: ${KIT}`); return "??kit??"; }
  if (what === "href") return KIT;
  if (what === "size") return `${Math.round(statSync(file).size / 1024)}${NBSP}KB`;
  fail(`unknown kit placeholder ${what}`); return "??kit??";
}
function strip(page) {
  const tabs = MATS.map(([href, label], i) => {
    const cur = href === page ? ' aria-current="page"' : "";
    const dl = href.endsWith(".zip") ? " download" : "";
    return `    <a href="./${href}"${cur}${dl}><span>${String(i + 1).padStart(2, "0")}</span>${label}</a>`;
  }).join("\n");
  return `<header class="wf-strip" data-wf-slug="esg-berichte-mit-ki">
  <a class="wf-brand" href="/en/workshops"><img src="./assets/lockup-horizontal.svg" width="176" height="34" alt="loehrning.ai workshops"></a>
  <nav class="wf-back" aria-label="Workshop page">
    <a class="wf-back-main" href="/en/workshops/esg-berichte-mit-ki">← Back to workshop</a>
    <a class="wf-back-alt" href="/workshops/esg-berichte-mit-ki" lang="de" hreflang="de">Workshop-Seite auf Deutsch</a>
  </nav>
  <nav class="wf-mats" aria-label="Workshop materials">
${tabs}
  </nav>
</header>`;
}

/* ------------------------------------------------------------------ literal-number audit
   Text outside placeholders may carry digits only in these non-data phrases. Everything the
   case computes comes from the JSON. */
const ALLOWED_PHRASES = [
  // regulation (SPEC §1.3, §4, §9; not dataset values)
  "more than 1,000 employees and more than €450m turnover", "18 March 2026", "19 March 2027", "27 September 2026",
  "26 September 2026", "26 Sep 2026", "Directive 2024/825", "Directive (EU) 2024/825", "§ 5 UWG", "category 15", "Category 15",
  // study figures (SPEC §4 §13, §10 sources)
  "ESGReveal, GPT-4, 2023: 76.9%", "ESG Insight, DeepSeek, 2026: 78.2%",
  // durations and course facts
  "about 25 minutes", "Optional, 20 minutes", "5 minutes plus an optional 30-minute stretch", "After 90 minutes",
  // unit rule (a definition, not a value)
  "MWh × 1,000", "Workshop 04", "one A4 page", "Scope 1 + 2", "Scope 1 and 2",
];
const ALLOWED_TOKEN = [/^20\d\d$/];                  // years
const ALLOWED_AFTER = /(Scope|prompt|Prompt|page)\s$/;  // "Scope 1", "prompt 01", "page 2"

function auditTemplate(name, tpl) {
  let text = tpl
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<code>[\s\S]*?<\/code>/g, " ")
    .replace(/\{\{[^}]+\}\}/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ");
  for (const p of ALLOWED_PHRASES) text = text.split(p).join(" ");
  const re = /\d[\d.,]*/g;
  let m;
  while ((m = re.exec(text))) {
    const tok = m[0].replace(/[.,]+$/, "");
    if (ALLOWED_TOKEN.some((r) => r.test(tok))) continue;
    if (ALLOWED_AFTER.test(text.slice(Math.max(0, m.index - 8), m.index))) continue;
    fail(`${name}: literal number "${tok}" outside a placeholder: …${text.slice(Math.max(0, m.index - 40), m.index + 20).replace(/\s+/g, " ")}…`);
  }
}

/* ------------------------------------------------------------------ build one page */
function render(name, tpl) {
  auditTemplate(name, tpl);
  let sec = 0;
  let html = tpl.replace(/\{\{([a-z]+):?([^}]*)\}\}/g, (all, kind, rest) => {
    const [a, b = ""] = rest.split(/:(?=[a-z][a-z0-9]*$)/);
    switch (kind) {
      case "n": return esc(num(a, b));
      case "j": return jText(j(a, b));
      case "kit": return esc(kit(a));
      case "factorlabel": return esc(factorLabel());
      case "fig": if (!FIGS[a]) { fail(`unknown figure ${a}`); return all; } return FIGS[a]();
      case "strip": return strip(a);
      case "sec": sec += 1; return String(sec);
      case "toc": case "toccount": return all; // second pass
      default: fail(`${name}: unknown placeholder ${all}`); return all;
    }
  });
  if (html.includes("{{toc}}")) {
    const items = [...html.matchAll(/<h2 id="([^"]+)"[^>]*><span class="g-n">(\d+)<\/span>([\s\S]*?)<\/h2>/g)];
    const list = items.map(([, id, n, title]) => `<li><a href="#${id}"><span>${n.padStart(2, "0")}</span>${title.replace(/<[^>]+>/g, "")}</a></li>`).join("");
    html = html.split("{{toc}}").join(`<ol>${list}</ol>`).replace("{{toccount}}", String(items.length));
  }
  // hyphenated IDs (F-EL-LB-2025, E-WS-01, I-WS-GO) never break at a hyphen
  html = html.replace(/<code>([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)<\/code>/g, '<code class="nowrap">$1</code>');
  // output checks
  if (/[\u2013\u2014]/.test(html)) fail(`${name}: en or em dash in output`);
  if (/\son[a-z]+\s*=/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) fail(`${name}: inline event handler attribute`);
  if (/\b(fetch|localStorage|innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval)\b/.test(html)) fail(`${name}: forbidden sink`);
  if (/<iframe/i.test(html)) fail(`${name}: iframe`);
  for (const [, href] of html.matchAll(/href="([^"]*)"/g)) if (href.endsWith("/")) fail(`${name}: href ends in "/": ${href}`);
  for (const [tok] of html.matchAll(/[A-Za-z0-9_+/=-]{40,}/g)) if (/[a-z]/.test(tok) && /[A-Z]/.test(tok)) fail(`${name}: mixed-case token of 40+ chars: ${tok.slice(0, 50)}`);
  if (/\{\{|\?\?[a-z_.]+\?\?/.test(html)) fail(`${name}: unresolved placeholder`);
  if (/esg-kit\.zip/.test(html.replace(new RegExp(KIT.replace(/\./g, "\\."), "g"), ""))) fail(`${name}: stale kit file name`);
  if (!html.includes(`href="./${KIT}"`)) fail(`${name}: no link to the kit`);
  if (!/[Ii]llustrative teaching/.test(html)) fail(`${name}: the factors are not labelled illustrative teaching values`);
  for (const [, href] of html.matchAll(/(?:href|src)="\.\/([^"#?]+)"/g)) {
    if (!existsSync(join(outDir, href)) && !["guide.html", "field-card.html", "transfer.html"].includes(href)) fail(`${name}: local reference missing: ${href}`);
  }
  return html;
}

const PAGES = ["guide", "field-card", "transfer"];
const outputs = {};
for (const page of PAGES) {
  const tpl = readFileSync(join(here, "pages", `${page}.template.html`), "utf8");
  outputs[page] = render(page, tpl);
}

if (problems.length) {
  console.error(`build-pages: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

let drift = 0;
for (const page of PAGES) {
  const target = join(outDir, `${page}.html`);
  if (check) {
    const current = existsSync(target) ? readFileSync(target, "utf8") : "";
    if (current !== outputs[page]) { console.error(`drift: ${page}.html`); drift++; }
  } else {
    writeFileSync(target, outputs[page]);
    console.log(`wrote ${target} (${Buffer.byteLength(outputs[page])} bytes)`);
  }
}
if (check) {
  if (drift) process.exit(1);
  console.log("build-pages: guide, field card and transfer sheet are up to date.");
}
