import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import {
  DECK_KEYS_EQUIVALENT,
  DECK_KEYS_SOURCE,
  DECK_KEYS_WORKSHOPS,
  deckFolder,
  deckKeysCopyPath,
  equivalenceProblems,
  wiringProblems,
} from "../workshops/sync-deck-keys.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = path.join(REPO_ROOT, "scripts/workshops/sync-deck-keys.mjs");

function load() {
  const window = {};
  vm.runInNewContext(readFileSync(DECK_KEYS_SOURCE, "utf8"), { window, globalThis: window });
  return window.DeckKeys;
}

const keyEvent = (key, init = {}) => {
  const event = { key, target: null, repeat: false, defaultPrevented: false, ...init, prevented: 0 };
  event.preventDefault = () => {
    event.prevented += 1;
  };
  return event;
};

const typing = { closest: (selector) => (selector.includes("input") ? {} : null) };
const button = { closest: () => null };

test("binds exactly ArrowRight, ArrowLeft, r and Shift+R, P, and Escape inside an appendix", () => {
  const keys = load();
  assert.equal(keys.resolve(keyEvent("ArrowRight")), "next");
  assert.equal(keys.resolve(keyEvent("ArrowLeft")), "prev");
  assert.equal(keys.resolve(keyEvent("r")), "reset");
  assert.equal(keys.resolve(keyEvent("R", { shiftKey: true })), "reset");
  assert.equal(keys.resolve(keyEvent("p")), "presenter");
  assert.equal(keys.resolve(keyEvent("P", { shiftKey: true })), "presenter");
  assert.equal(keys.resolve(keyEvent("Escape")), null);
  assert.equal(keys.resolve(keyEvent("Escape"), { inAppendix: true }), "leave-appendix");
  for (const key of [" ", "Enter", "PageUp", "PageDown", "Home", "End", "0", "1", "9", "f", "ArrowUp", "ArrowDown"]) {
    assert.equal(keys.resolve(keyEvent(key)), null, JSON.stringify(key));
  }
});

test("never fires with Ctrl, Meta or Alt, in a text field, or on a handled event", () => {
  const keys = load();
  for (const modifier of ["ctrlKey", "metaKey", "altKey"]) assert.equal(keys.resolve(keyEvent("r", { [modifier]: true })), null, modifier);
  assert.equal(keys.resolve(keyEvent("ArrowRight", { target: typing })), null);
  assert.equal(keys.resolve(keyEvent("ArrowRight", { target: { isContentEditable: true } })), null);
  assert.equal(keys.resolve(keyEvent("ArrowRight", { target: button })), "next", "buttons and links are not typing targets");
  assert.equal(keys.resolve(keyEvent("ArrowRight", { defaultPrevented: true })), null);
});

test("handle prevents the default of a bound key and swallows its repeats", () => {
  const keys = load();
  const calls = [];
  const handlers = { next: () => calls.push("next"), reset: () => calls.push("reset") };
  const first = keyEvent("ArrowRight");
  assert.equal(keys.handle(first, handlers), true);
  assert.equal(first.prevented, 1);
  const held = keyEvent("ArrowRight", { repeat: true });
  assert.equal(keys.handle(held, handlers), true);
  assert.equal(held.prevented, 1);
  const space = keyEvent(" ");
  assert.equal(keys.handle(space, handlers), false);
  assert.equal(space.prevented, 0);
  keys.handle(keyEvent("r"), handlers);
  assert.deepEqual(calls, ["next", "reset"]);
});

test("names channels, windows and storage per deck id", () => {
  const keys = load();
  assert.equal(keys.presenterChannel("datenbereitschaft-fuer-ki"), "deck-presenter:datenbereitschaft-fuer-ki");
  assert.equal(keys.storageKey("datenbereitschaft-fuer-ki", "slide"), "deck:datenbereitschaft-fuer-ki:slide");
  const doc = { documentElement: { getAttribute: () => "geschaeftsberichte-mit-ki-lesen" }, body: { getAttribute: () => null } };
  assert.equal(keys.deckId(doc), "geschaeftsberichte-mit-ki-lesen");
  assert.deepEqual([...keys.PRESENTER_KEYS], ["ArrowRight", "ArrowLeft", "r", "R"]);
});

test("wiringProblems wants the keys loaded before the stage and the deck id on <html>", () => {
  const good = '<html lang="en" data-deck-id="x"><script src="./lib/deck-keys.js"></script><script src="./lib/deck-stage.js"></script>';
  assert.deepEqual(wiringProblems("x", good), []);
  assert.equal(wiringProblems("x", '<html lang="en"><script src="./lib/deck-stage.js"></script><script src="./lib/deck-keys.js"></script>').length, 2);
  assert.match(wiringProblems("x", "<html>")[0], /does not load/);
});

test("every wired deck holds the canonical copy and passes --check", () => {
  const source = readFileSync(DECK_KEYS_SOURCE);
  for (const slug of DECK_KEYS_WORKSHOPS) assert.ok(readFileSync(deckKeysCopyPath(slug)).equals(source), slug);
  const run = spawnSync(process.execPath, [SCRIPT, "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
});

test("a deck with its own engine is the pinned file and keeps the five contract keys", () => {
  assert.deepEqual(Object.keys(DECK_KEYS_EQUIVALENT), ["angebote-mit-ki-vergleichen"]);
  for (const [slug, entry] of Object.entries(DECK_KEYS_EQUIVALENT)) {
    assert.ok(!DECK_KEYS_WORKSHOPS.includes(slug), `${slug} is wired or equivalent, not both`);
    const bytes = readFileSync(path.join(deckFolder(slug), entry.page));
    assert.deepEqual(equivalenceProblems(slug, bytes), []);
    const changed = Buffer.from(bytes.toString("utf8").replace("else if (k === 'p' || k === 'P') togglePresenter();", ""));
    const problems = equivalenceProblems(slug, changed);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /lost/);
    assert.match(problems[1], /re-check the key equivalence/);
  }
  assert.match(equivalenceProblems("unknown", Buffer.from(""))[0], /no key equivalence/);
});
