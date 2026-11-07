/**
 * Workshop 05: the five effect scripts (lib/w05-*.js) are small, quiet and safe. They hold no timer, no key handler,
 * no storage of their own, no random numbers and no backdrop-filter; they write no data-fx value outside the engine's
 * list; and each one loads in a bare context (no document) and exports its pure functions.
 * The glass test does not scan public/**\/*.js, so this test does.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib");
const SCRIPTS = ["w05-tally.js", "w05-clock.js", "w05-matrix.js", "w05-days.js", "w05-gates.js"];
const BANNED = ["backdrop-filter", "setInterval", "setTimeout", "keydown", "keyup", "keypress", "localStorage", "sessionStorage", "Date.now", "Math.random", "requestAnimationFrame", "fetch(", "XMLHttpRequest", "eval(", "new Function", "innerHTML"];
const ENGINE_FX = ["fade", "none", "line", "move", "draw", "pop", "fly", "flip", "strike", "type", "glow", "blur", "arc", "travel", "dim", "zoom", "grow"];
const read = (name) => readFileSync(path.join(LIB, name), "utf8");

test("the five scripts exist and are the only w05-*.js files", () => {
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

test("w05-fx.css states its end states for reduced motion and html.w05-final", () => {
  const css = read("w05-fx.css");
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /html\.w05-final/);
});

test("the tally helper counts five with Shift and one without; the gate list is the four names of the spec", () => {
  const load = (name) => {
    const sandbox = { module: { exports: {} } };
    vm.runInNewContext(read(name), sandbox, { filename: name });
    return sandbox.module.exports;
  };
  const tally = load("w05-tally.js");
  assert.equal(tally.clicksFor(true), 5);
  assert.equal(tally.clicksFor(false), 1);
  const gates = load("w05-gates.js");
  assert.deepEqual(Array.from(gates.GATES), ["subscription", "contract", "security", "transfer"]);
  assert.equal(gates.allOpen(["subscription", "contract", "security"]), false);
  assert.equal(gates.allOpen(["transfer", "security", "contract", "subscription"]), true);
});
