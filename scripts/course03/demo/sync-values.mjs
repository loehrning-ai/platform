#!/usr/bin/env node
/**
 * Keeps the Workshop 03 demo's static final state in step with its data.
 *
 * demo.html shows every number on load, without JavaScript and without a click.
 * Those numbers are written into the page as plain text, so they must match
 * demo-data.json. This script is the only place that turns data into that text:
 *
 *   <b data-v="g01.bad.v0">−€19,960</b>      text content from VALUES["g01.bad.v0"]
 *   <i data-bar="g01.db.v0" style="--v:.8645"> bar height (0..1) from BARS["g01.db.v0"]
 *
 * It also re-embeds demo-data.json into <script type="application/json" id="demo-data">
 * when the embedded copy no longer parses to the same object (capture.py normally does
 * that and then calls this script).
 *
 * Usage (from the repository root):
 *   node scripts/course03/demo/sync-values.mjs           rewrite demo.html in place
 *   node scripts/course03/demo/sync-values.mjs --check   exit 1 if demo.html is stale
 */
import { readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(here, "demo.html");
const DATA = path.join(here, "demo-data.json");
const EMBED = /(<script type="application\/json" id="demo-data">)([\s\S]*?)(<\/script>)/;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const group = (n) => Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
/** −€19,960 with a true minus sign (U+2212). */
export const eur = (n) => `${n < 0 ? "−" : ""}€${group(n)}`;
const month = (iso) => MONTHS[Number(iso.slice(5, 7)) - 1];
const day = (iso) => `${Number(iso.slice(8, 10))} ${SHORT[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const word = (n) => WORDS[n] ?? String(n);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function yamlField(text, key) {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => new RegExp(`^\\s{4}${key}:`).test(line));
  if (at < 0) throw new Error(`definition field ${key} missing`);
  const inline = lines[at].replace(new RegExp(`^\\s{4}${key}:\\s*`), "");
  if (inline && inline !== ">-") return inline.trim();
  const out = [];
  for (let i = at + 1; i < lines.length && /^\s{6,}/.test(lines[i]); i += 1) out.push(lines[i].trim());
  return out.join(" ");
}

/** Every value the page prints, derived from the captured data only. */
export function derive(d) {
  const byId = Object.fromEntries(d.cases.map((c) => [c.id, c]));
  const g01 = byId.G01;
  const g02 = byId.G02;
  const g03 = byId.G03;
  const rel = (lane, name) => d.lanes[lane].relations.find((r) => r.name === name);
  const col = (r, name) => r.columns.findIndex((c) => c.name === name);
  const summary = rel("ready", "mrr_summary_monthly");
  const sumRow = (iso) => summary.rows.find((row) => row[col(summary, "month_start")] === iso);
  const checkPairs = d.checks.G01.expected.split(",").map((part) => part.trim().split(/\s+/)).map(([iso, v]) => [iso, Number(v)]);
  const picked = (lane, sql) => d.lanes[lane].relations.map((r) => r.name).filter((name) => new RegExp(`\\b${name}\\b`).test(sql));

  const v = {};
  const bars = {};
  v["company.accounts"] = String(rel("bad", "customer_master").rowCount);
  v["bad.count"] = word(d.lanes.bad.relations.length);
  v["ready.count"] = word(d.lanes.ready.relations.length);
  v["ready.count.n"] = String(d.lanes.ready.relations.length);
  v["ready.role"] = d.lanes.ready.role;
  v["ready.searchPath"] = d.lanes.ready.searchPath;
  v["recorded.on"] = day(d.recorded.capturedAtUtc.slice(0, 10));
  v["recorded.month"] = `${MONTHS[Number(d.recorded.capturedAtUtc.slice(5, 7)) - 1]} ${d.recorded.capturedAtUtc.slice(0, 4)}`;
  v["captured.on"] = day(d.capturedOn);
  v["postgres"] = d.postgres.split(" ")[0];
  v["checks.summary"] = `${cap(d.checks._summary.replace(/^DB CHECKS /, "").toLowerCase().replace(/\.$/, ""))}.`;
  v["checks.count"] = String(Object.keys(d.checks).filter((k) => k !== "_summary").length);
  v["clock"] = `${day(d.clockUtc.slice(0, 10))}, ${d.clockUtc.slice(11, 16)} UTC`;

  v["g01.question"] = g01.question;
  v["g01.bad.picked"] = picked("bad", g01.bad.sql).join(", ");
  v["g01.bad.col"] = g01.bad.columns[1];
  v["g01.bad.rows"] = cap(word(g01.bad.rows.length));
  const max = Math.max(...checkPairs.map(([, n]) => n), ...g01.bad.rows.map((r) => Math.abs(r[1])));
  g01.bad.rows.forEach(([iso, n], i) => {
    v[`g01.m${i}`] = month(iso);
    v[`g01.bad.v${i}`] = eur(n);
    bars[`g01.bad.v${i}`] = Math.abs(n) / max;
    const row = sumRow(iso);
    v[`view.netnew.v${i}`] = eur(row[col(summary, "net_new_mrr_eur")]);
  });
  checkPairs.forEach(([, n], i) => {
    v[`g01.db.v${i}`] = eur(n);
    bars[`g01.db.v${i}`] = n / max;
  });
  g01.ready.rows.forEach(([, n], i) => { v[`g01.ready.v${i}`] = eur(n); });
  const matches = g01.ready.rows.filter(([iso, n], i) => checkPairs[i][0] === iso && checkPairs[i][1] === n).length;
  v["g01.ready.matches"] = `${matches} of ${g01.ready.rows.length}`;
  v["g01.ready.picked"] = picked("ready", g01.ready.sql).join(", ");
  v["g01.sum"] = eur(g01.bad.rows.reduce((s, r) => s + r[1], 0));
  v["g01.sumTerms"] = g01.bad.rows.map((r, i) => (i === 0 ? eur(r[1]) : `+ ${eur(r[1])}`)).join(" ");
  v["g02.expected"] = eur(Number(d.checks.G02.expected));
  v["sql.g01.bad"] = g01.bad.sql;
  v["sql.g01.ready"] = g01.ready.sql;

  const cites = d.recorded.summary.ready;
  v["gap.citations"] = `${cites.metricCitationPasses} of ${cites.trials}`;

  const def = d.definitions.ending_mrr;
  v["def.type"] = yamlField(def, "type");
  v["def.grain"] = yamlField(def, "result_grain");
  v["def.relation"] = yamlField(def, "relation");
  v["def.expression"] = yamlField(def, "expression");
  v["def.version"] = yamlField(def, "version");
  v["def.owner"] = yamlField(def, "owner");
  v["def.full"] = def;
  v["view.name"] = `${summary.schema}.${summary.name}`;
  v["view.rows"] = String(summary.rowCount);
  v["view.comment"] = summary.comment;
  v["view.comment.rule"] = summary.comment.split(/(?<=\.)\s+/).find((sentence) => /^Never\b/.test(sentence)) ?? summary.comment;
  v["view.sql"] = summary.definition;
  v["check.BP01"] = d.checks["B-P01"].expected;

  v["forbidden.sql"] = d.forbidden.sql;
  v["forbidden.error"] = `ERROR ${d.forbidden.error.sqlstate}: ${d.forbidden.error.message}`;
  d.rules.forEach((r, i) => {
    v[`rule${i}.q`] = r.question;
    v[`rule${i}.msg`] = r.message;
  });

  const [g02bad] = g02.bad.rows;
  const gi = (name) => g02.bad.columns.indexOf(name);
  v["g02.question"] = g02.question;
  v["g02.bad"] = eur(g02bad[gi("net_new_mrr")]);
  v["g02.bad.june"] = eur(g02bad[gi("end_of_last_quarter_mrr")]);
  v["g02.bad.march"] = eur(g02bad[gi("end_of_prior_quarter_mrr")]);
  v["g02.db"] = eur(Number(d.checks.G02.expected));
  v["g02.endJune"] = eur(sumRow("2026-06-01")[col(summary, "ending_mrr_eur")]);
  v["g02.endMarch"] = eur(sumRow("2026-03-01")[col(summary, "ending_mrr_eur")]);

  const hist = rel("bad", "acct_history");
  v["g03.question"] = g03.question;
  v["g03.error"] = `ERROR ${g03.bad.error.sqlstate}: ${g03.bad.error.message}`;
  v["g03.idcol"] = hist.columns[0].name;
  v["g03.states"] = [...new Set(hist.rows.map((r) => r[col(hist, "state")]))].sort().join(" and ");
  const [seg] = g03.ready.rows;
  const same = g03.ready.rows.every((r) => r[1] === seg[1] && r[2] === seg[2] && r[3] === seg[3]);
  v["g03.db"] = same ? `${seg[3].toFixed(1)} % in each segment` : g03.ready.rows.map((r) => `${r[0]} ${r[3].toFixed(1)} %`).join(", ");
  v["g03.db.detail"] = `${seg[2]} of ${seg[1]}`;
  return { values: v, bars };
}

const TAG = /<([a-z][a-z0-9]*)\b([^>]*?)\sdata-v="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g;
const BAR = /(<[a-z][a-z0-9]*\b[^>]*?\sdata-bar="([^"]+)")(?:\sstyle="--v:[^"]*")?([^>]*>)/g;

export function render(html, data) {
  const { values, bars } = derive(data);
  const missing = new Set();
  let out = html.replace(TAG, (whole, tag, before, key, after, inner) => {
    if (!(key in values)) { missing.add(key); return whole; }
    if (/<[a-z]/i.test(inner)) throw new Error(`data-v="${key}" must hold plain text only`);
    return `<${tag}${before} data-v="${key}"${after}>${esc(values[key])}</${tag}>`;
  });
  out = out.replace(BAR, (whole, head, key, tail) => {
    if (!(key in bars)) { missing.add(key); return whole; }
    return `${head} style="--v:${bars[key].toFixed(4)}"${tail}`;
  });
  if (missing.size) throw new Error(`unknown keys in demo.html: ${[...missing].join(", ")}`);
  const embedded = out.match(EMBED);
  if (!embedded) throw new Error("demo.html has no demo-data block");
  let same = false;
  try { same = isDeepStrictEqual(JSON.parse(embedded[2]), data); } catch { same = false; }
  if (!same) out = out.replace(EMBED, (m, open, body, close) => `${open}${JSON.stringify(data).replace(/<\//g, "<\\/")}${close}`);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = readFileSync(PAGE, "utf8");
  const next = render(html, JSON.parse(readFileSync(DATA, "utf8")));
  if (process.argv.includes("--check")) {
    if (next !== html) {
      console.error("demo.html is stale; run node scripts/course03/demo/sync-values.mjs");
      process.exit(1);
    }
    console.log("demo.html values match demo-data.json.");
  } else if (next !== html) {
    writeFileSync(PAGE, next);
    console.log("demo.html values refreshed from demo-data.json.");
  } else {
    console.log("demo.html values already match demo-data.json.");
  }
}
