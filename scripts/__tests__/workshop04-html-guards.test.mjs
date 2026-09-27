import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  inlineHandlerProblems,
  inlineScriptProblems,
  jsonBlockProblems,
  outputProblems,
  readTag,
  stripTags,
  withoutCodeAndComments,
} from "../workshop04/html-guards.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const WORKSHOP = path.join(REPO_ROOT, "packages/website/public/workshops/esg-berichte-mit-ki");

test("readTag tokenizes attributes as a browser does", () => {
  const html = `<script data-x=">" SRC = './a.js' type=module/>`;
  const tag = readTag(html, 0);
  assert.equal(tag.name, "script");
  assert.equal(tag.attrs.get("data-x"), ">");
  assert.equal(tag.attrs.get("src"), "./a.js");
  assert.equal(tag.attrs.get("type"), "module/");
  assert.equal(tag.end, html.length);
  assert.equal(readTag(`<script src="a.js" src="b.js">`, 0).attrs.get("src"), "a.js", "the first of two attributes counts");
  assert.equal(readTag(`<script/src="a.js">`, 0).attrs.get("src"), "a.js", "a slash separates attributes");
});

test("an inline script is found in any case and whatever its attributes pretend", () => {
  for (const html of [
    `<script>alert(1)</script>`,
    `<SCRIPT>alert(1)</SCRIPT>`, // passed the case-sensitive guard (audit F9)
    `<ScRiPt\ttype="module">alert(1)</ScRiPt>`,
    `<script data-x=' src="a.js"'>alert(1)</script>`, // src inside another attribute's value
    `<script data-x='type="application/json"'>alert(1)</script>`,
    `<script type="text/json">alert(1)</script>`,
    `<script src="">alert(1)</script>`,
    `<script src=" ">alert(1)</script>`,
    `<p title="<script>">x</p>`, // errs towards a failed build
  ]) {
    assert.equal(inlineScriptProblems(html).length, 1, html);
  }
  for (const html of [
    `<script src="./lib/a.js" defer></script>`,
    `<SCRIPT SRC=./lib/a.js></SCRIPT>`,
    `<script type="application/json" id="d">{"a":1}</script>`,
    `<script type=" APPLICATION/JSON ">{"a":1}</script>`,
    `<scripts>not a script</scripts>`,
  ]) {
    assert.deepEqual(inlineScriptProblems(html), [], html);
  }
});

test("an event handler attribute is found anywhere, even where a strip would have hidden it", () => {
  for (const html of [
    `<script>x</script ><img src=x onerror=alert(1)>`, // the lazy strip swallowed this (audit F9)
    `<img src=x onerror=alert(1)>`, // unquoted: build-demo only looked for quoted values
    `<img/onerror=alert(1)>`,
    `<img src="x"onerror=alert(1)>`,
    `<IMG SRC=x ONERROR = "alert(1)">`,
    `<svg><animate onbegin=alert(1) /></svg>`,
    `<script type="application/json">{"a":"<img src=x onerror=alert(1)>"}</script>`,
    `<p title="<script type='application/json'>"><img src=x onerror=alert(1)>"</script>`,
  ]) {
    assert.ok(inlineHandlerProblems(html).length >= 1, html);
  }
  for (const html of [`<p data-one="1" class="button">Scope 1 and Scope 2</p>`, `<a href="#once">once</a>`]) {
    assert.deepEqual(inlineHandlerProblems(html), [], html);
  }
  // The scan does not parse text from markup, so prose shaped like a handler fails the build too.
  assert.equal(inlineHandlerProblems(`<p>Count one = one</p>`).length, 1);
});

test("a JSON data block must parse and must not contain <", () => {
  assert.deepEqual(jsonBlockProblems(`<script type="application/json">{"a":"\\u003cb>"}</script>`), []);
  assert.equal(jsonBlockProblems(`<script type="application/json">{"a":"<b>"}</script>`).length, 1);
  const early = jsonBlockProblems(`<script type="application/json">{"a":"</SCRIPT ><img src=x>"}</script>`);
  assert.ok(early.some((p) => /does not parse/.test(p)), "a block that ends early is reported");
  assert.equal(jsonBlockProblems(`<script type="application/json">{"a":</script>`).length, 1);
});

test("the published Workshop 04 pages are clean", () => {
  for (const page of ["demo.html", "guide.html", "field-card.html", "transfer.html", "slides.html", "presenter.html"]) {
    assert.deepEqual(outputProblems(readFileSync(path.join(WORKSHOP, page), "utf8")), [], page);
  }
});

test("stripTags returns what the tag-removing regular expression returns", () => {
  const pieces = ["<", ">", "a", " ", "<b>", "</i>", 'x="1"', "<<", ">>", "<p title='>'>"];
  let seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < 20000; n++) {
    let fragment = "";
    for (let k = Math.floor(next() * 10); k > 0; k--) fragment += pieces[Math.floor(next() * pieces.length)];
    // split + join is the global replace without its replace call
    assert.equal(stripTags(fragment), fragment.split(/<[^>]+>/).join(""), JSON.stringify(fragment));
  }
});

test("the number audits blank scripts, styles and comments in every spelling", () => {
  const text = withoutCodeAndComments(`a<SCRIPT type=x>1</SCRIPT >b<style media="all">2</style\n>c<!-- 3 --!>d<!-- 4 -->e`);
  assert.equal(text.replace(/\s+/g, ""), "abcde");
});

test("every Workshop 04 builder runs the shared output guards", () => {
  for (const builder of ["build-deck.mjs", "build-demo.mjs", "build-pages.mjs"]) {
    const source = readFileSync(path.join(REPO_ROOT, "scripts/workshop04", builder), "utf8");
    assert.match(source, /import \{[^}]*\boutputProblems\b[^}]*\} from "\.\/html-guards\.mjs";/, builder);
    assert.match(source, /outputProblems\((?:html|text)\)/, builder);
    assert.doesNotMatch(source, /<script\[\\s\\S\]\*\?<\\\/script>\/g/, `${builder} strips scripts with a case-sensitive pattern`);
    assert.doesNotMatch(source, /\.replace\(\/<\[\^>\]\+>\/g, ""\)/, `${builder} removes tags with a multi-character replace`);
  }
});
