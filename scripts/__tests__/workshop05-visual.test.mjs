/**
 * Workshop 05 deck, visual law (static part). The deck has no filled black or ink surface: ink is for text and for lines of
 * 1 to 2 px. This test scans the three style sheets of the deck page (engine.css is frozen, deck.css and w05-fx.css are ours):
 *  - V2: no background of ink, charcoal, dark, black or a near-black grey; engine.css has exactly three known hits, which
 *    w05-fx.css overrides (V3);
 *  - V3: the overrides are there, with sage fills and ink outlines of 2 px at most; no ink border or shadow wider than 2 px;
 *  - V4: the surface tokens are defined once, on :root of w05-fx.css, and no new rule holds a hex literal;
 *  - V11: every var() the W05 style sheets use is defined (or written by scenes.js, with a fallback).
 * The luminance rule V1 (every element, every press) is checked in the browser by the deck e2e spec.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib");
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const SHEETS = Object.fromEntries(["engine.css", "deck.css", "w05-fx.css"].map((name) => [name, strip(readFileSync(path.join(LIB, name), "utf8"))]));

/** The rules of a sheet: { selector, body }, nested at-rules flattened (their inner rules are listed too). */
const rulesOf = (css) => [...css.matchAll(/([^{}@;][^{}]*)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }));
const declarations = (body) => body.split(";").map((d) => d.trim()).filter(Boolean).map((d) => [d.slice(0, d.indexOf(":")).trim(), d.slice(d.indexOf(":") + 1).replace(/!important/, "").trim()]);

/** V1 exemption constant: icon masks, the globe canvas, the unused tile, the presenter window. One selector per line. */
export const V1_EXEMPT = [".ico", ".chip::before", "[data-glyph]", "canvas", ".tile > .face--back", ".presenter"];

/** Values V2 forbids as a background. */
const FORBIDDEN = [/var\(--ink\)/, /var\(--charcoal\)/, /var\(--dark\)/, /#000(?:000)?\b/i, /\bblack\b/i, /#121212/i, /#2A2622/i, /#2A2521/i, /#5E5D59/i, /rgba\(\s*18\s*,\s*18\s*,\s*18\s*,\s*(?:0?\.[3-9]\d*|1(?:\.0+)?)\s*\)/i];
const isBackground = (prop) => prop === "background" || prop === "background-color";
const hits = (css) =>
  rulesOf(css).flatMap(({ selector, body }) =>
    declarations(body)
      .filter(([prop, value]) => isBackground(prop) && FORBIDDEN.some((re) => re.test(value)))
      .map(([prop, value]) => `${selector} { ${prop}: ${value} }`),
  );

/** The three places where the frozen engine fills a surface with ink (V3 overrides them in w05-fx.css). */
const ENGINE_KNOWN = [
  { selector: ".strip > li[data-on]", value: "#2A2622" },
  { selector: ".cw-file > i", value: "#5E5D59" },
  { selector: '.tile > .face--back[data-tone="belegt"]', value: "rgba(18,18,18,.82)" },
];

test("V2: deck.css and w05-fx.css hold no ink, charcoal, black or near-black background", () => {
  assert.deepEqual(hits(SHEETS["deck.css"]), []);
  assert.deepEqual(hits(SHEETS["w05-fx.css"]), []);
});

test("V2: engine.css has exactly the three known ink fills and no new one", () => {
  const found = hits(SHEETS["engine.css"]);
  assert.equal(found.length, ENGINE_KNOWN.length, found.join("\n"));
  for (const { selector, value } of ENGINE_KNOWN) assert.ok(found.some((line) => line.startsWith(selector) && line.includes(value)), `engine hit ${selector}`);
});

test("V3: w05-fx.css overrides each of the three engine ink fills with a sage fill and no ink background", () => {
  const rules = rulesOf(SHEETS["w05-fx.css"]);
  for (const { selector } of ENGINE_KNOWN) {
    const own = rules.filter((r) => r.selector.split(",").map((s) => s.trim()).includes(selector));
    assert.ok(own.length >= 1, `an override for ${selector}`);
    const bg = own.flatMap((r) => declarations(r.body)).find(([prop]) => isBackground(prop));
    assert.ok(bg && /var\(--w05-sage-(?:100|200|400)\)/.test(bg[1]), `${selector}: a sage background (${bg?.[1]})`);
  }
  assert.match(SHEETS["w05-fx.css"], /\.strip > li\[data-on\]\{background:var\(--w05-sage-200\);color:var\(--ink\);box-shadow:inset 0 0 0 2px var\(--ink\)\}/);
  assert.match(SHEETS["w05-fx.css"], /\.cw-file > i\{background:var\(--w05-sage-400\);color:var\(--ink\)\}/);
});

test("V3: no border, outline or inset shadow in ink is wider than 2 px in deck.css or w05-fx.css", () => {
  for (const name of ["deck.css", "w05-fx.css"]) {
    for (const { selector, body } of rulesOf(SHEETS[name])) {
      for (const [prop, value] of declarations(body)) {
        if (!/^(border|outline)/.test(prop) && prop !== "box-shadow") continue;
        if (!/var\(--ink\)|#121212/i.test(value)) continue;
        for (const m of value.matchAll(/(?:inset\s+)?(?:-?[\d.]+(?:px)?\s+){3}(-?[\d.]+)px/g)) assert.ok(Number(m[1]) <= 2, `${name} ${selector}: ${prop} ${value}`);
        if (prop !== "box-shadow") for (const m of value.matchAll(/(\d+(?:\.\d+)?)px/g)) assert.ok(Number(m[1]) <= 2, `${name} ${selector}: ${prop} ${value}`);
      }
    }
  }
});

test("V4: the surface tokens are defined once, on :root of w05-fx.css, with their designed values", () => {
  const TOKENS = {
    "--w05-sage-50": "#EEF3EE",
    "--w05-sage-100": "#DFE9E0",
    "--w05-sage-200": "#C8D8CB",
    "--w05-sage-400": "#8DAA95",
    "--w05-sage-600": "#5B7F68",
    "--w05-green": "#1F4A38",
    "--w05-hair": "rgba(18,18,18,.14)",
    "--w05-accent-soft": "rgba(183,58,21,.10)",
    "--surface": "#FFFEFB",
    "--tint": "#EFEBE0",
  };
  const root = /:root\s*\{([^{}]*)\}/.exec(SHEETS["w05-fx.css"])[1];
  const defined = Object.fromEntries(declarations(root));
  assert.deepEqual(defined, TOKENS);
  for (const name of ["engine.css", "deck.css"]) {
    for (const token of Object.keys(TOKENS)) assert.ok(!new RegExp(`${token}\\s*:`).test(SHEETS[name]), `${token} is not redefined in ${name}`);
  }
  assert.equal([...SHEETS["w05-fx.css"].matchAll(/--w05-sage-100\s*:/g)].length, 1);
});

test("V4: no hex literal in a rule of deck.css or w05-fx.css (the :root tokens are the only place)", () => {
  assert.doesNotMatch(SHEETS["deck.css"], /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(SHEETS["w05-fx.css"].replace(/:root\s*\{[^{}]*\}/, ""), /#[0-9a-fA-F]{3,8}\b/);
});

test("V4: every colour in a background or fill of w05-fx.css and deck.css is a token of the list or transparent", () => {
  const OK = /^(?:var\(--(?:w05-sage-(?:50|100|200|400|600)|w05-accent-soft|paper|surface|tint|accent|cw-[\w-]+|faint|e-[\w-]+|line)\)|transparent|none|currentColor|inherit)$/;
  for (const name of ["w05-fx.css", "deck.css"]) {
    for (const { selector, body } of rulesOf(SHEETS[name])) {
      for (const [prop, value] of declarations(body)) {
        if (!isBackground(prop) && prop !== "fill") continue;
        assert.ok(OK.test(value), `${name} ${selector}: ${prop}: ${value}`);
      }
    }
  }
  // sage-600 is a fill without text: it may only be used as a background of an element that holds no text
  for (const { selector, body } of rulesOf(SHEETS["deck.css"])) {
    if (/var\(--w05-sage-600\)/.test(body)) assert.match(selector, /dots|\bi\b|__d|data-on|is-on/, `sage-600 on ${selector}`);
  }
  assert.doesNotMatch(SHEETS["deck.css"] + SHEETS["w05-fx.css"], /background[^;}]*var\(--w05-green\)/, "--w05-green is a text and line colour, never a fill");
});

test("V11: every var() of deck.css and w05-fx.css is defined in engine.css, deck.css or w05-fx.css (or written by scenes.js, with a fallback)", () => {
  const all = Object.values(SHEETS).join("\n");
  const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const RUNTIME = new Set(["--p", "--share", "--cx"]);
  for (const name of ["deck.css", "w05-fx.css"]) {
    for (const m of SHEETS[name].matchAll(/var\((--[\w-]+)(,)?/g)) {
      if (defined.has(m[1])) continue;
      assert.ok(RUNTIME.has(m[1]) && m[2] === ",", `${name}: ${m[1]} is not defined`);
    }
  }
});

test("the sheets name no filter blur behind a surface and no gradient surface", () => {
  for (const name of ["deck.css", "w05-fx.css"]) {
    assert.doesNotMatch(SHEETS[name], /backdrop-filter/, name);
    for (const { selector, body } of rulesOf(SHEETS[name])) {
      for (const [prop, value] of declarations(body)) if (isBackground(prop)) assert.doesNotMatch(value, /gradient/, `${name} ${selector}`);
    }
  }
});

test("V1 constant: the exemptions are one selector per entry and none is a W05 content class", () => {
  assert.equal(new Set(V1_EXEMPT).size, V1_EXEMPT.length);
  for (const selector of V1_EXEMPT) assert.doesNotMatch(selector, /\.(?:tk|rec|poll|strip|rg|gb|sh|av|tl|ax|tbl)\b/, selector);
});
