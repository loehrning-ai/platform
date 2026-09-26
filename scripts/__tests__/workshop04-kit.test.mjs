import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectZipArchive } from "../../packages/website/scripts/open-source/zip-inspection.mjs";
import {
  DATA_JSON,
  KIT_DIR,
  KIT_PREFIX,
  REPO_ROOT,
  WORKSHOP_DIR,
  ZIP_PATH,
  buildKitArchive,
  buildKitArchiveFromDir,
  dosDateTime,
  listKitFiles,
} from "../workshop04/kit-archive.mjs";

const published = () => readFileSync(ZIP_PATH);
const python = spawnSync("python3", ["--version"], { encoding: "utf8" });

test("the published kit zip is reproducible from the kit folder", () => {
  const first = buildKitArchiveFromDir();
  const second = buildKitArchiveFromDir();
  assert.ok(first.equals(second), "two builds differ");
  assert.ok(first.equals(published()), "kellbrunn-esg-kit.zip is stale: run node scripts/workshop04/kit-archive.mjs");
});

test("every entry uses the fixed release date and the order does not depend on the caller", () => {
  const entries = [["b.md", Buffer.from("b\n")], ["a.csv", Buffer.from("a;b\n")]];
  const archive = buildKitArchive(entries, { isoDate: "2026-09-26" });
  assert.ok(archive.equals(buildKitArchive(entries, { isoDate: "2026-09-26" })));
  const { date, time } = dosDateTime("2026-09-26");
  assert.equal(archive.readUInt16LE(10), time);
  assert.equal(archive.readUInt16LE(12), date);
  assert.throws(() => buildKitArchive([["x.pdf", Buffer.from("%PDF")]], { isoDate: "2026-09-26" }), /not CSV, Markdown or plain text/);
  assert.throws(() => buildKitArchive([["a.md", Buffer.from("a")], ["a.md", Buffer.from("a")]], { isoDate: "2026-09-26" }), /Duplicate/);
  const files = listKitFiles();
  assert.deepEqual(files, [...files].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
});

test("the zip holds text files only, all under esg-kit/, and passes the zip inspection rules", () => {
  const entries = inspectZipArchive(published(), { label: "kellbrunn-esg-kit.zip" });
  const files = entries.filter((entry) => entry.kind === "file");
  assert.equal(files.length, entries.length, "no directory entries");
  assert.deepEqual(files.map((entry) => entry.path), listKitFiles().map((file) => `${KIT_PREFIX}${file}`));
  for (const entry of files) {
    assert.match(entry.path, /^esg-kit\/[A-Za-z0-9._\-/]+\.(?:csv|md)$/, entry.path);
    assert.doesNotMatch(entry.text, /[–—]/, `${entry.path} has an en or em dash`);
    assert.doesNotMatch(path.posix.basename(entry.path).toLowerCase(), /^(?:claude|agents|notes)\.md$/);
    assert.doesNotMatch(entry.path, /(?:^|\/)plans\//);
    assert.doesNotMatch(entry.text, /<script|fetch\(|localStorage|innerHTML/i, entry.path);
  }
  const names = files.map((entry) => entry.path.slice(KIT_PREFIX.length));
  for (const required of ["START-HERE.md", "ASSET-RIGHTS.md", "CHANGELOG.md", "belegtabelle/grenzen_und_regeln.md", "belegtabelle/belegtabelle_2025_leer.csv", "faktoren/faktoren_lehrwerte.csv", "prompts/01_auslesen.md", "prompts/02_pruefen.md", "prompts/03_textentwurf.md", "vorlagen/datenanfrage_email.md"]) {
    assert.ok(names.includes(required), required);
  }
  // Twenty bills as Markdown text, as SPEC section 7.1 lists them.
  assert.equal(names.filter((name) => name.startsWith("rohdaten_2025/") && name.endsWith(".md")).length, 20);
  const factors = files.find((entry) => entry.path.endsWith("faktoren/faktoren_lehrwerte.csv"));
  assert.match(factors.text.split("\n")[0], /illustrative teaching values/);
});

test("the kit and the dataset match what build_dataset.py writes", { skip: python.status !== 0 && "python3 is not available" }, (t) => {
  const out = mkdtempSync(path.join(os.tmpdir(), "w04-dataset-"));
  t.after(() => rmSync(out, { force: true, recursive: true }));
  const run = spawnSync("python3", [path.join(REPO_ROOT, "scripts/workshop04/build_dataset.py"), "--out-dir", out], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.ok(readFileSync(path.join(out, "data/w04-data.json")).equals(readFileSync(DATA_JSON)), "data/w04-data.json is stale");
  const fresh = listKitFiles(path.join(out, "kit"));
  assert.deepEqual(listKitFiles(), fresh, "kit file list differs from the generator");
  for (const file of fresh) {
    assert.ok(readFileSync(path.join(out, "kit", file)).equals(readFileSync(path.join(KIT_DIR, file))), `kit/${file} is stale`);
  }
});

test("one dataset script writes the one dataset file every builder reads", () => {
  assert.equal(path.relative(REPO_ROOT, DATA_JSON).split(path.sep).join("/"), "scripts/workshop04/data/w04-data.json");
  const canonical = JSON.parse(readFileSync(DATA_JSON, "utf8"));
  assert.ok(canonical.kitRules, "kitRules present");
  // Former copies that drifted apart: a second generator and two more copies of the JSON.
  for (const gone of ["scripts/workshop04/data/build_dataset.py", "scripts/workshop04/w04-data.json", "packages/website/public/workshops/esg-berichte-mit-ki/data/w04-data.json"]) {
    assert.ok(!existsSync(path.join(REPO_ROOT, gone)), `${gone} is a second copy; build_dataset.py writes scripts/workshop04/data/w04-data.json only`);
  }
  for (const builder of ["build-deck.mjs", "build-demo.mjs", "build-pages.mjs"]) {
    const source = readFileSync(path.join(REPO_ROOT, "scripts/workshop04", builder), "utf8");
    assert.match(source, /join\((?:HERE|here), "data(?:\/w04-data\.json|", "w04-data\.json)"\)/, `${builder} reads data/w04-data.json next to it`);
  }
});

test("raw-folder paths are lower case, and no output carries a path-shaped token the public scanner reads as a secret", () => {
  const shaped = (text) => (text.match(/[A-Za-z0-9+/_-]{40,}/g) ?? []).filter((token) => /[a-z]/.test(token) && /[A-Z]/.test(token) && /[0-9]/.test(token));
  const data = JSON.parse(readFileSync(DATA_JSON, "utf8"));
  for (const doc of data.documents) assert.equal(doc.path, doc.path.toLowerCase(), doc.path);
  for (const row of data.ledger) assert.equal(row.source_file, row.source_file.toLowerCase(), row.row_id);
  for (const file of listKitFiles()) {
    if (!["START-HERE.md", "ASSET-RIGHTS.md", "CHANGELOG.md"].includes(file)) assert.equal(file, file.toLowerCase(), file);
  }
  assert.deepEqual(shaped(readFileSync(DATA_JSON, "utf8")), []);
  for (const file of listKitFiles()) assert.deepEqual(shaped(readFileSync(path.join(KIT_DIR, file), "utf8")), [], file);
  // Everything the builders write next to the deck, and their sources. Like the scanner, a run inside a
  // public URL (a cited source) does not count.
  const withoutUrls = (text) => text.replace(/https?:\/\/[^\s"'<>)\]]+/g, " ");
  const texts = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:html|js|mjs|css|py|json|md|csv)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
  for (const file of [...texts(WORKSHOP_DIR), ...texts(path.join(REPO_ROOT, "scripts/workshop04"))]) {
    assert.deepEqual(shaped(withoutUrls(readFileSync(file, "utf8"))), [], path.relative(REPO_ROOT, file));
  }
});

test("ASSET_MANIFEST.json records the published zip with its exact size and hash", () => {
  const manifest = JSON.parse(readFileSync(path.join(REPO_ROOT, "ASSET_MANIFEST.json"), "utf8"));
  const row = manifest.assets.find((asset) => asset.path === path.relative(REPO_ROOT, ZIP_PATH).split(path.sep).join("/"));
  assert.ok(row, "missing ASSET_MANIFEST.json row");
  const bytes = published();
  assert.equal(row.sizeBytes, bytes.length);
  assert.equal(row.sha256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(row.owner, "Tim Löhr");
  assert.equal(row.license, "LicenseRef-Loehrning-Brand");
});
