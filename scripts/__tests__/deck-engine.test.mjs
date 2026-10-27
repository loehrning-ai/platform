import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ENGINE_DECKS,
  ENGINE_FILES,
  engineCopyPath,
  engineDrift,
  engineSourcePath,
} from "../workshops/sync-deck-engine.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = path.join(REPO_ROOT, "scripts/workshops/sync-deck-engine.mjs");

test("every deck on the engine carries each engine file byte for byte", () => {
  assert.ok(ENGINE_DECKS.includes("esg-berichte-mit-ki"));
  for (const slug of ENGINE_DECKS) {
    for (const name of ENGINE_FILES) {
      assert.ok(readFileSync(engineCopyPath(slug, name)).equals(readFileSync(engineSourcePath(name))), `${slug}/lib/${name}`);
    }
  }
  assert.deepEqual(engineDrift(), []);
});

test("each deck on the engine loads its stylesheet, step engine and stage", () => {
  for (const slug of ENGINE_DECKS) {
    for (const page of ["slides.html", "en/slides.html"]) {
      const html = readFileSync(path.join(REPO_ROOT, "packages/website/public/workshops", slug, page), "utf8");
      const lib = page.startsWith("en/") ? "../lib/" : "./lib/";
      for (const name of ["engine.css", "deck-stage.js", "scenes.js"]) assert.ok(html.includes(`"${lib}${name}"`), `${slug}/${page} loads ${name}`);
    }
  }
});

test("the engine stays inside its budgets and never turns on blur behind a surface", () => {
  assert.ok(readFileSync(engineSourcePath("scenes.js")).length <= 14_000, "scenes.js budget");
  for (const name of ENGINE_FILES) {
    const text = readFileSync(engineSourcePath(name), "utf8");
    const values = [...text.matchAll(/backdrop-filter\s*:\s*([^;}"'`]+)/g)].map((m) => m[1].trim()).filter((v) => v !== "none");
    assert.deepEqual(values, [], name);
    assert.doesNotMatch(text, /[\u2012-\u2015]/, `${name}: no figure, en or em dash`);
  }
});

test("the icon sprite is one SVG of symbols with unique ids", () => {
  const svg = readFileSync(engineSourcePath("icons.svg"), "utf8");
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg">/);
  const ids = [...svg.matchAll(/<symbol id="([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 30);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["i-file", "i-folder", "i-zip", "i-envelope", "i-bottle", "i-pin", "i-bank", "i-scale", "i-shield", "i-server", "i-key", "i-cap", "i-alert", "i-backup", "i-policy", "i-check", "i-cross", "i-calendar"]) {
    assert.ok(ids.includes(id), id);
  }
  assert.doesNotMatch(svg, /<script|\son[a-z]+=|href="http/i);
});

test("--check passes on the published decks", () => {
  const run = spawnSync(process.execPath, [SCRIPT, "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
});
