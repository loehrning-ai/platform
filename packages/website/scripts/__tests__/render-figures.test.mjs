import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { ALL_FIXTURES } from "../../src/lib/figures/__tests__/fixtures.ts";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "render-figures.mjs");

function folder(specs = ALL_FIXTURES) {
  const dir = mkdtempSync(join(tmpdir(), "figures-"));
  for (const spec of specs) writeFileSync(join(dir, `${spec.id}.json`), JSON.stringify(spec, null, 2));
  return dir;
}
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

test("writes one standalone SVG per spec, deterministically", () => {
  const dir = folder();
  const first = run("--in", dir);
  assert.equal(first.status, 0, first.stderr);
  const svgs = readdirSync(dir).filter((f) => f.endsWith(".svg"));
  assert.equal(svgs.length, ALL_FIXTURES.length);
  const body = readFileSync(join(dir, "t-waterfall.svg"), "utf8");
  assert.match(body, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(body, /width="640"/);
  const again = run("--in", dir, "--check");
  assert.equal(again.status, 0, again.stderr);
});

test("--check fails when a file is stale and writes nothing", () => {
  const dir = folder([ALL_FIXTURES[0]]);
  run("--in", dir);
  writeFileSync(join(dir, `${ALL_FIXTURES[0].id}.svg`), "old");
  const res = run("--in", dir, "--check");
  assert.equal(res.status, 1);
  assert.match(res.stderr, /stale figure files/);
  assert.equal(readFileSync(join(dir, `${ALL_FIXTURES[0].id}.svg`), "utf8"), "old");
});

test("writes CSV next to the SVG on request and honours --out and --width", () => {
  const dir = folder([ALL_FIXTURES[1]]);
  const out = mkdtempSync(join(tmpdir(), "figures-out-"));
  const res = run("--in", dir, "--out", out, "--csv", "--width", "500");
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(readdirSync(out).sort(), [`${ALL_FIXTURES[1].id}.csv`, `${ALL_FIXTURES[1].id}.svg`]);
  assert.match(readFileSync(join(out, `${ALL_FIXTURES[1].id}.svg`), "utf8"), /width="500"/);
});

test("refuses a spec that fails the privacy gate and writes nothing", () => {
  const spec = JSON.parse(JSON.stringify(ALL_FIXTURES[1]));
  spec.data.items[0].n = 3;
  const dir = folder([spec]);
  const res = run("--in", dir);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /privacy gate/);
  assert.equal(readdirSync(dir).filter((f) => f.endsWith(".svg")).length, 0);
});

test("refuses an invalid spec and a mismatching file name", () => {
  const dir = folder([]);
  writeFileSync(join(dir, "broken.json"), JSON.stringify({ id: "broken" }));
  const res = run("--in", dir);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /broken\.json/);
  const dir2 = folder([]);
  writeFileSync(join(dir2, "other.json"), JSON.stringify(ALL_FIXTURES[1]));
  assert.match(run("--in", dir2).stderr, /file name must be/);
});

test("fails on an empty folder and an unknown argument", () => {
  assert.equal(run("--in", folder([])).status, 1);
  assert.notEqual(run("--bogus").status, 0);
});
