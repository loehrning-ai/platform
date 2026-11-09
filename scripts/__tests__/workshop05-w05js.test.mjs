/**
 * Workshop 05: the effect scripts (lib/w05-tally.js, the dot field lib/w05-field.js, the presenter controls lib/w05-scrub.js)
 * are small, quiet and safe. They hold no timer, no key handler, no storage of their own, no random numbers and no
 * backdrop-filter; they write no data-fx value outside the engine's list; and each one loads in a bare context (no document)
 * and exports its pure functions. L2 (MOTION-SCOUT section 7), on purpose: the field and the scrub scripts are admitted, the
 * field may observe its slide with a MutationObserver (scenes.js writes data-view every frame), each new script stays at most
 * 12 KB, and their pure functions are tested here. The icon set (lib/w05-icons.svg) is checked here too. Round 4, on purpose:
 * the field's budget is 18 KB (it draws the cover's year of inspection rings, pulses(), and since the fix round of round 4
 * prepares itself on its slide's first frame, flies dots as squares on a 1x backing store and bakes the settled country a slice
 * per dust frame, so the cover stays under 50 ms a frame at 4x CPU throttle); the scrub stays at 12 KB.
 * The glass test does not scan public/**\/*.js, so this test does.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib");
const SCRIPTS = ["w05-tally.js", "w05-field.js", "w05-scrub.js"];
/** L2: the size budget of each new script (MOTION-SCOUT 6.2). */
const BUDGET = 12 * 1024;
/** Round 4: the field draws the year of rings too. */
const FIELD_BUDGET = 18 * 1024;
const BANNED = ["backdrop-filter", "setInterval", "setTimeout", "keydown", "keyup", "keypress", "localStorage", "sessionStorage", "Date.now", "Math.random", "requestAnimationFrame", "fetch(", "XMLHttpRequest", "eval(", "new Function", "innerHTML"];
const ENGINE_FX = ["fade", "none", "line", "move", "draw", "pop", "fly", "flip", "strike", "type", "glow", "blur", "arc", "travel", "dim", "zoom", "grow"];
const read = (name) => readFileSync(path.join(LIB, name), "utf8");

test("the tally, field and scrub scripts exist and are the only w05-*.js files", () => {
  const found = readdirSync(LIB).filter((n) => /^w05-.*\.js$/.test(n)).sort();
  assert.deepEqual(found, [...SCRIPTS].sort());
});

for (const name of SCRIPTS) {
  test(`${name}: no banned call, no key handler, no timer, no storage`, () => {
    const src = read(name);
    for (const word of BANNED) assert.ok(!src.includes(word), `${name} contains ${word}`);
    assert.doesNotMatch(src, /addEventListener\(\s*['"]key/);
    assert.doesNotMatch(src, /\bon(key|keydown|keyup)\b/);
  });

  test(`${name}: uses the engine's deckreset event or none, never another custom event`, () => {
    const src = read(name);
    const events = [...src.matchAll(/CustomEvent\(\s*['"]([^'"]+)/g)].map((m) => m[1]);
    assert.deepEqual(events, [], "the scripts listen, they never dispatch custom events");
    for (const m of src.matchAll(/document\.addEventListener\(\s*['"]([^'"]+)/g)) {
      assert.ok(["click", "deckreset"].includes(m[1]), `${name} listens to ${m[1]}`);
    }
  });

  test(`${name}: loads in a bare context and exports without a document`, () => {
    const sandbox = { module: { exports: {} } };
    assert.doesNotThrow(() => vm.runInNewContext(read(name), sandbox, { filename: name }));
    assert.ok(Object.keys(sandbox.module.exports).length > 0, `${name} exports its pure functions`);
  });
}

test("no script writes a data-fx value outside the engine list", () => {
  for (const name of SCRIPTS) {
    const src = read(name);
    const values = [
      ...[...src.matchAll(/setAttribute\(\s*['"]data-fx['"]\s*,\s*['"]([^'"]*)['"]/g)].map((m) => m[1]),
      ...[...src.matchAll(/dataset\.fx\s*=\s*['"]([^'"]*)['"]/g)].map((m) => m[1]),
      ...[...src.matchAll(/data-fx=['"]?([a-z]+)/g)].map((m) => m[1]),
    ];
    for (const value of values) assert.ok(ENGINE_FX.includes(value), `${name} writes data-fx ${value}`);
  }
});

test("w05-fx.css: no backdrop-filter, no unknown data-fx selector, no arrows, no dash characters in comments or content", () => {
  const css = read("w05-fx.css");
  assert.ok(!css.includes("backdrop-filter"));
  for (const m of css.matchAll(/data-fx="([a-z]+)"/g)) assert.ok(ENGINE_FX.includes(m[1]), `data-fx ${m[1]}`);
  assert.doesNotMatch(css, /[–—→←]/, "no en dash, em dash or arrow characters");
  for (const name of [...SCRIPTS, "w05-icons.svg"]) assert.doesNotMatch(read(name), /[–—→←]/, name);
});

test("no script and no stylesheet names an internal path, a person or a secret", () => {
  for (const name of [...SCRIPTS, "w05-fx.css", "w05-icons.svg"]) {
    assert.doesNotMatch(read(name), /\/Users\/|\/private\/|mavengence|CLAUDE\.md|scratchpad|facilitator/i, name);
  }
});

test("w05-fx.css states its end state for reduced motion", () => {
  assert.match(read("w05-fx.css"), /@media \(prefers-reduced-motion:\s*reduce\)/);
});

test("the tally helper counts five with Shift and one without", () => {
  const load = (name) => {
    const sandbox = { module: { exports: {} } };
    vm.runInNewContext(read(name), sandbox, { filename: name });
    return sandbox.module.exports;
  };
  const tally = load("w05-tally.js");
  assert.equal(tally.clicksFor(true), 5);
  assert.equal(tally.clicksFor(false), 1);
});

const load = (name, extra = {}) => {
  const sandbox = { module: { exports: {} }, ...extra };
  vm.runInNewContext(read(name), sandbox, { filename: name });
  return sandbox.module.exports;
};
const ring = () => {
  const sandbox = { window: {} };
  vm.runInNewContext(read("geo.js"), sandbox);
  return sandbox.window.ESG_GEO.macedonia[0];
};

test("L2: the field stays within 18 KB and the scrub within 12 KB; only the field observes, and only its slide", () => {
  for (const [name, max] of [["w05-field.js", FIELD_BUDGET], ["w05-scrub.js", BUDGET]]) assert.ok(Buffer.byteLength(read(name)) <= max, `${name}: ${Buffer.byteLength(read(name))} bytes`);
  assert.match(read("w05-field.js"), /new MutationObserver\(draw\)\.observe\(slide, \{ attributes: true, attributeFilter: \['data-view', 'data-deck-active'\] \}\)/);
  assert.doesNotMatch(read("w05-scrub.js"), /Observer/);
  assert.doesNotMatch(read("w05-field.js"), /addEventListener/, "the field listens to nothing: it follows data-view");
});

test("w05-field: the seeded generator, the stipple and the scatter are deterministic, and the stipple has exactly n dots inside the country", () => {
  const f = load("w05-field.js");
  const a = f.mulberry32(7);
  const b = f.mulberry32(7);
  for (let i = 0; i < 5; i += 1) assert.equal(a(), b());
  const pr = f.projector(ring(), 1000, 790, 24);
  const poly = ring().map((q) => [pr.x(q[0]), pr.y(q[1])]);
  const one = f.stipple(poly, 7331, 1000, 790, 73310);
  const two = f.stipple(poly, 7331, 1000, 790, 73310);
  assert.equal(one.pts.length, 7331 * 2);
  assert.deepEqual(Array.from(one.pts.slice(0, 20)), Array.from(two.pts.slice(0, 20)));
  for (let i = 0; i < one.pts.length; i += 2) assert.ok(one.pts[i] >= 0 && one.pts[i] <= 1000 && one.pts[i + 1] >= 0 && one.pts[i + 1] <= 790);
  assert.ok(one.spacing > 6 && one.spacing < 12, `spacing ${one.spacing}`);
  assert.deepEqual(f.scatter(50, 100, 80, 3), f.scatter(50, 100, 80, 3));
});

test("w05-field: pulses gives one ring per unit, shared over the regions by largest remainder, seeded, the last ring at t 1 in the named region", () => {
  const f = load("w05-field.js");
  const vals = [2506, 4616, 2653, 2280, 3497, 2690, 2258, 5984];
  assert.equal(vals.reduce((x, y) => x + y, 0), 26484);
  const rings = f.pulses(vals, 300, 11, 4);
  assert.equal(rings.length, 88);
  const per = vals.map((_, g) => rings.filter((q) => q.g === g).length);
  assert.deepEqual(per, Array.from(f.shares(vals, 88)));
  for (let i = 1; i < rings.length; i += 1) assert.ok(rings[i].t >= rings[i - 1].t, "sorted by time");
  rings.forEach((q) => assert.ok(q.t >= 0 && q.t <= 1));
  const last = rings[rings.length - 1];
  assert.equal(last.t, 1);
  assert.equal(last.g, 4, "the year ends on Pelagonia (Bitola)");
  assert.deepEqual(JSON.parse(JSON.stringify(f.pulses(vals, 300, 11, 4))), JSON.parse(JSON.stringify(rings)));
  assert.notDeepEqual(JSON.parse(JSON.stringify(f.pulses(vals, 300, 12, 4))), JSON.parse(JSON.stringify(rings)));
});

test("w05-field: the projector keeps the country inside the pad and centres it", () => {
  const f = load("w05-field.js");
  const pr = f.projector(ring(), 1000, 790, 24);
  const xs = ring().map((q) => pr.x(q[0]));
  const ys = ring().map((q) => pr.y(q[1]));
  assert.ok(Math.min(...xs) >= 23.9 && Math.max(...xs) <= 976.1);
  assert.ok(Math.min(...ys) >= 23.9 && Math.max(...ys) <= 766.1);
  assert.ok(Math.abs(Math.min(...xs) + Math.max(...xs) - 1000) < 0.5 || Math.abs(Math.min(...ys) + Math.max(...ys) - 790) < 0.5);
});

test("w05-field: shares add up to n by largest remainder; groups put every dot in its column and the mark first in its group", () => {
  const f = load("w05-field.js");
  const counts = [21373, 8321, 7956, 6146, 5649, 5066];
  const sh = f.shares(counts, 1000);
  assert.equal(sh.reduce((x, y) => x + y, 0), 1000);
  assert.deepEqual(Array.from(f.shares([1, 1, 1], 10)), [4, 3, 3]);
  const geo = f.groupsGeometry(counts, 1000, 1000, 790, { pad: 24 });
  assert.equal(geo.rects.length, 6);
  geo.rects.forEach((r, i) => { assert.ok(r.x >= 0 && r.x + r.w <= 1000); assert.equal(r.dots, sh[i]); if (i) assert.ok(r.x > geo.rects[i - 1].x); });
  const from = f.scatter(1000, 1000, 790, 5);
  const out = f.groups(from, counts, 1000, 790, { pad: 24 }, 10, 2);
  assert.equal(out.length, 2000);
  const r2 = geo.rects[2];
  assert.ok(out[20] >= r2.x && out[20] <= r2.x + r2.w, "the mark sits in group 2");
});

test("w05-field: parsePlan and stateAt give the layout pair and progress for every press", () => {
  const f = load("w05-field.js");
  const plan = f.parsePlan("1:country>groups:a;0:scatter>country");
  assert.deepEqual(JSON.parse(JSON.stringify(plan.map((e) => [e.k, e.from, e.to]))), [[0, "scatter", "country"], [1, "country", "groups:a"]]);
  assert.deepEqual(Array.from(f.parsePlan("0:country").map((e) => e.to)), ["country"]);
  assert.throws(() => f.parsePlan("x:country"));
  const at = (view, p) => { const st = f.stateAt(plan, view, p); return [st.entry.k, st.p]; };
  assert.deepEqual(at(0, 0.4), [0, 0.4]);
  assert.deepEqual(at(1, 0.25), [1, 0.25]);
  assert.deepEqual(at(3, 0.1), [1, 1], "after the last planned press the field holds the end");
  assert.equal(f.seg(0.5, 0, 1) > 0.5, true);
  assert.equal(f.seg(2, 0, 1), 1);
  assert.equal(f.nearest([0, 0, 10, 10, 3, 4], 9, 9), 1);
});

test("w05-field: dots land exactly on the target at p 1 and on the start at p 0", () => {
  const f = load("w05-field.js");
  const a = [0, 0, 100, 50];
  const b = [10, 20, 30, 40];
  const out = new Float32Array(4);
  f.lerpDots(a, b, new Float32Array([0, 0.4]), new Float32Array([0.2, -0.2]), 1, out);
  assert.deepEqual(Array.from(out), b);
  f.lerpDots(a, b, new Float32Array([0, 0.4]), new Float32Array([0.2, -0.2]), 0, out);
  assert.deepEqual(Array.from(out), a);
});

test("w05-scrub: kinds, the value after a click (a hotspot clicked twice clears) and the pressed buttons", () => {
  const s = load("w05-scrub.js");
  assert.equal(s.kindOf({ "data-w05-toggle": "lanes" }), "toggle");
  assert.equal(s.kindOf({ "data-w05-scrub": "days" }), "scrub");
  assert.equal(s.kindOf({ "data-w05-hot": "wall" }), "hot");
  assert.equal(s.kindOf({ "data-poll": "x" }), null);
  assert.equal(s.nextValue("hot", "trade", "trade"), null);
  assert.equal(s.nextValue("hot", "trade", "food"), "food");
  assert.equal(s.nextValue("toggle", "hand", "hand"), "hand");
  assert.equal(s.nextValue("scrub", "1", "3"), "3");
  assert.deepEqual(Array.from(s.pressed(["a", "b", "c"], "b")), [false, true, false]);
  assert.deepEqual(Array.from(s.pressed(["a", "b"], null)), [false, false]);
});

test("w05-scrub: buttons only (never a range input), one click listener and the deckreset listener", () => {
  const src = read("w05-scrub.js");
  const listeners = [...src.matchAll(/addEventListener\(\s*['"]([^'"]+)/g)].map((m) => m[1]);
  assert.deepEqual(listeners.sort(), ["click", "deckreset"]);
  assert.match(src, /button\[data-w05-scrub\]/);
  assert.match(src, /event\.detail > 0\) button\.blur\(\)/, "a mouse click gives the arrow keys back to the deck");
});

test("w05-icons.svg: unique ids, a 24 grid, at most six shapes each, every shape pathLength 1, no fill, no banned word", () => {
  const svg = read("w05-icons.svg");
  const symbols = [...svg.matchAll(/<symbol id="w05-([a-z0-9-]+)" viewBox="0 0 24 24"[^>]*>([\s\S]*?)<\/symbol>/g)];
  assert.ok(symbols.length >= 35, `${symbols.length} icons`);
  const ids = symbols.map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id, body] of symbols) {
    const shapes = [...body.matchAll(/<(path|line|circle|rect|polyline|polygon|ellipse)\b([^>]*)>/g)];
    assert.ok(shapes.length >= 1 && shapes.length <= 6, `${id}: ${shapes.length} shapes`);
    for (const [, tag, attrs] of shapes) {
      assert.match(attrs, /pathLength="1"/, `${id}: a ${tag} without pathLength 1`);
      assert.doesNotMatch(attrs, /fill="(?!none)/, `${id}: a filled ${tag}`);
    }
    assert.doesNotMatch(id, /stamp|deadline|logo|score|chef|boss|countdown/);
  }
  assert.doesNotMatch(svg, /<text|<image|xlink:href|https?:\/\/(?!www\.w3\.org)/);
});
