/**
 * The Workshop 03 builder page (scripts/course03/builder/page/builder.html, published as
 * packages/website/public/workshops/datenbereitschaft-fuer-ki/builder.html) renders its
 * JSON data island into the DOM. Text from the island reaches HTML only through esc() or
 * md(); everything else a sink line interpolates is a number, fixed markup, or markup the
 * page assembled from escaped parts. These tests keep it that way.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = "scripts/course03/builder/page/builder.html";
const PUBLISHED = "packages/website/public/workshops/datenbereitschaft-fuer-ki/builder.html";

const html = readFileSync(path.join(root, SOURCE), "utf8");
const island = /<script type="application\/json" id="builder-data">([\s\S]*?)<\/script>/.exec(html);
const data = JSON.parse(island[1]);
// Every line of every inline script (any spelling of the tags; the JSON island is data, not
// code), with its line number in the page.
const scriptLines = [];
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi)) {
  if (/\btype\s*=\s*["']?application\/json/i.test(m[1])) continue;
  const first = html.slice(0, m.index).split("\n").length;
  m[2].split("\n").forEach((text, i) => scriptLines.push([first + i, text]));
}
const script = scriptLines.map(([, text]) => text).join("\n");

function* strings(value, at = "D") {
  if (typeof value === "string") yield [at, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, `${at}[${i}]`);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) yield* strings(v, `${at}.${k}`);
}

/** Top-level ${...} interpolations of one source line, nested braces balanced. */
function interpolations(line) {
  const out = [];
  for (let i = line.indexOf("${"); i >= 0; i = line.indexOf("${", i + 2)) {
    let depth = 0;
    let j = i + 1;
    for (; j < line.length; j++) {
      if (line[j] === "{") depth++;
      else if (line[j] === "}" && --depth === 0) break;
    }
    out.push(line.slice(i + 2, j).trim());
    i = j - 1;
  }
  return out;
}

// A line that builds HTML: an innerHTML assignment, el(tag, attrs, html), or a template literal
// that starts with markup (the helpers that return HTML for those sinks).
const SINK_LINE = /\.innerHTML\s*=|\bel\(\s*'[a-z]+'\s*,|`\s*</;
// esc() and md() escape; a chip helper is safe when its word is a literal or escaped.
const CHIP = /^(?:passChip|failChip|gapChip)\((?:'[^']*'|"[^"]*"|esc\([^()]*(?:\([^()]*\))?[^()]*\))?\)$/;
const WRAPPED = (expr) => /^(?:esc|md)\(/.test(expr) || CHIP.test(expr);

// Raw interpolations on sink lines, each reviewed. Adding one means reviewing it too: text from
// the data island goes through esc() or md(), never onto this list.
const REVIEWED = new Set([
  // numbers, formatted by grp() (Math.round, digits and commas only)
  "D.recorded.g01.map(eur).join(' / ')",
  "D.tub.slice(4).map(t => eur(t.end)).join(' / ')",
  "D.tub.slice(4).map(t => signed(t.chg)).join(' ')",
  "eur(D.trace.april)",
  "eur(t.end)",
  "int(D.q2.end)",
  "int(D.q2.netNew)",
  "int(D.q2.start)",
  "int(D.trace.april)",
  "i ? signed(t.chg) : 'starting level'",
  "pct(avg, 2)",
  "pct(email, 2)",
  "pct(pooled, 2)",
  "pct(search, 2)",
  "at(h)",
  // fixed markup, constants and class toggles
  "'<span class=\"chip chip--muted\">Answer</span>'",
  "'<span class=\"chip chip--muted\">Fresh</span>'",
  "i < D.trace.withMrr ? 'f' : ''",
  "o.temp && !roleLock ? 'PostgreSQL grants TEMP on a new database to PUBLIC. Verified on PostgreSQL 16. Fix: REVOKE ALL ON DATABASE … FROM PUBLIC (B-T01).' : 'A superuser connection defeats everything.'",
  // the chip helpers' own word parameter; every call passes a literal or esc() (tested below)
  "w",
  "word",
  "/\\.(txt|md)$/.test(name) ? ' prose' : ''",
  "MINUS",
  "animate ? 'stamp' : ''",
  "i < D.steps.length - 1 ? ` <button class=\"btn btn--small no-print\" type=\"button\" data-next=\"${i + 1}\">Next step</button>` : ''",
  "i <= lastIdx ? 'stamp' : 'fade'",
  "i === 0 ? ' checked' : ''",
  "i === 0 ? ' open' : ''",
  "icon",
  "lab",
  "passTag",
  "r.kind === 'fill' ? '<span class=\"fill\"></span>' : `<span class=\"mark${r.look ? ' is-look' : ''}\"></span>`",
  "r.label", // the four fixed bar labels of the pooling figure, not data
  "user ? 'fade' : ''",
  "v", // the three fixed verdict words
  "withheld ? ' is-withheld' : ''",
  "withheld ? '<p class=\"fig__note\">Not answered.</p>' : ''",
  // markup the page assembles from escaped parts (dots from counts, cards from esc()/md())
  "approved",
  "cls",
  "dots",
  "extra",
  "head",
  "r.res",
  "vals",
  "D.blanks.map((b, k) => `<div class=\"field\"><label for=\"y-b${k}\">${esc(b.label)}</label><input type=\"text\" id=\"y-b${k}\" autocomplete=\"off\"></div>`).join('')",
  "D.blanks.map(b => esc(b.guess)).join('; ')",
  "aps.map(a => `<tr><td>${esc(a.id)}</td><td>${md(a.symptom)}</td><td>${md(a.instance)}</td><td>${md(a.fix)}</td><td>${md(a.caught)}</td></tr>`).join('')",
  "d.blanks.map((v, k) => `<div class=\"blank\"><span class=\"label\">${esc(labels[k])}</span><span class=\"blank__v\">${md(v)}</span></div>`).join('')",
  "d.renames.map(r => `<li><s>${esc(r[0])}</s> → <strong>${esc(r[1])}</strong></li>`).join('')",
  "n.guesses.map(g => `<li>${esc(g)}</li>`).join('')",
  "opts.map(o => `<button class=\"btn\" type=\"button\" data-opt=\"${esc(o)}\"><code>${esc(o)}</code></button>`).join('')",
  "t.rows.map(r => `<tr><td data-label=\"Aspect\"><strong>${esc(r[0])}</strong></td><td data-label=\"${esc(t.tab)}\">${md(r[1])}</td></tr>`).join('')",
  // attribute values, which el() sets with setAttribute
  "idPrefix",
  "it.id",
  "st",
  "tags.split(' ').map(t => D.rules.find(r => r.id === t).label).join(', ')",
  "text.trim()",
]);

test("the published builder page is the source page", () => {
  assert.ok(readFileSync(path.join(root, PUBLISHED)).equals(readFileSync(path.join(root, SOURCE))));
});

test("the data island carries text, not HTML elements", () => {
  const markup = [...strings(data)].filter(([, v]) => /<\/?(?:a|b|br|code|div|em|i|iframe|img|p|s|script|span|strong|style|svg)\b/i.test(v));
  assert.deepEqual(markup.map(([at]) => at), [], "write code spans as `backticks` and render them with md()");
  for (const r of data.requests) assert.doesNotMatch(r.label, /</, `request ${r.id}`);
  assert.ok(data.requests.some((r) => r.label.includes("`SELECT contact_email FROM core.accounts`")));
});

test("text from the data island reaches HTML only through esc() or md()", () => {
  const unreviewed = [];
  const seen = new Set();
  for (const [lineNo, line] of scriptLines) {
    if (!SINK_LINE.test(line)) continue;
    for (const expr of interpolations(line)) {
      if (WRAPPED(expr)) continue;
      seen.add(expr);
      if (!REVIEWED.has(expr)) unreviewed.push(`${SOURCE}:${lineNo}: \${${expr}}`);
    }
  }
  assert.deepEqual(unreviewed, [], "route data through esc() or md(), or build the node with textContent");
  assert.deepEqual([...REVIEWED].filter((expr) => !seen.has(expr)), [], "stale entries in REVIEWED");
});

test("every chip helper call passes a literal word or an escaped one", () => {
  const calls = [...script.matchAll(/\b(?:passChip|failChip|gapChip)\((?:[^()]|\([^()]*\))*\)/g)].map((m) => m[0]);
  assert.ok(calls.length > 30, "the chip helpers are in use");
  assert.deepEqual(calls.filter((call) => !CHIP.test(call)), []);
});

test("the values that used to reach HTML raw are escaped", () => {
  for (const raw of [
    /\$\{D\.churn\.\w+\}/, /\$\{F\.(?:loaded|warn|invented)\}(?! h(?: warn|\?)?`\))/, /\$\{s\.n\}/, /\$\{a\.anchor\}/,
    /\$\{f\.badge\}/, /\$\{badgeWord\[f\.badge\]\}/, /\$\{D\.fresh\.(?:loaded|clockAge)\}, /, /value="\$\{r\.id\}"/,
    /<span>\$\{r\.label\}<\/span><\/label>/, /<th scope="row">\$\{t\.label\}</, /Fixed in \$\{t\.layer\}/,
  ]) assert.doesNotMatch(script, raw);
  assert.match(script, /const lab = \(h, text\) => \{ const s = el\('span'\); s\.textContent = text;/);
});

test("kit file links are relative, URL-encoded per segment and inside the kit", () => {
  assert.match(script, /'\.\/data-readiness-kit\/builder\/' \+ f\.src\.split\('\/'\)\.map\(segment => encodeURIComponent\(segment\)\)\.join\('\/'\)/);
  for (const [name, f] of Object.entries(data.files)) {
    const segments = f.src.split("/");
    assert.ok(segments.every((s) => /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(s)), `${name}: ${f.src}`);
    assert.equal(segments.map(encodeURIComponent).join("/"), f.src, `${name}: encoding changes the link`);
  }
});
