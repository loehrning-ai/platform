import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  assertClean,
  assertPlainPng,
  FORBIDDEN,
  hashedWordGuard,
  KIT_FILES,
  listFiles,
  mentionsClient,
  PUBLISHED_FILES,
  REPO_ROOT,
  WORKSHOP_DIR,
  WORKSHOP_RELATIVE,
} from "../workshop04/export-esg-passport.mjs";
import { buildKitArchive, readKitArchive, ZIP_NAME } from "../workshop04/kit-archive.mjs";

const read = (name) => readFileSync(path.join(WORKSHOP_DIR, name));
const kit = () => new Map(readKitArchive(read(ZIP_NAME)));
const TEXT = /\.(?:css|csv|html|js|md|svg|txt)$/;

/** Five prompts from the deck: <p ... data-prompt="N">text</p>, HTML entities resolved. */
function deckPrompts(html) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'" };
  return new Map(
    [...html.matchAll(/data-prompt="(\d)">([\s\S]*?)<\/p>/g)].map(([, n, body]) => [
      Number(n),
      body.replace(/&(amp|lt|gt|quot|#39|apos);/g, (_, name) => entities[name]).trim(),
    ]),
  );
}

/** The code block under each "## Step N" heading of START-HERE.md. */
function kitPrompts(markdown) {
  const prompts = new Map();
  for (const section of markdown.split(/\n(?=## )/)) {
    const step = /^## Step (\d)/.exec(section)?.[1];
    const block = /```\n([\s\S]*?)```/.exec(section)?.[1];
    if (step && block) prompts.set(Number(step), block.trim());
  }
  return prompts;
}

test("the published folder holds exactly the allowlisted files", () => {
  assert.deepEqual(listFiles(WORKSHOP_DIR), PUBLISHED_FILES);
  for (const name of PUBLISHED_FILES) {
    assert.ok(!/(?:^|\/)(?:facilitator|_build|README\.md|course\.json)/.test(name), name);
  }
});

test("no published file or kit entry names the client, a local path or presenter-only material", () => {
  for (const name of PUBLISHED_FILES.filter((file) => TEXT.test(file))) {
    assert.doesNotThrow(() => assertClean(name, read(name)), name);
  }
  for (const [name, bytes] of kit()) {
    assert.doesNotThrow(() => assertClean(`${ZIP_NAME}/${name}`, bytes), name);
  }
  // The requested partner mark is the only co-branding on the cover; it remains a logo lockup.
  const slides = read("slides.html").toString("utf8");
  assert.match(slides, /<title>ESG Reporting with AI: From Raw Inputs to Clearer Insights · loehrning\.ai<\/title>/);
  assert.match(read("lib/esg.js").toString("utf8"), /loehrning\.ai · Workshop 04/);
  assert.match(slides, /<span class="cv-x" aria-hidden="true">×<\/span>/);
  assert.match(slides, /assets\/brainster-logo\.svg" alt="Brainster"/);
  assert.match(slides, /Tim Löhr · North Macedonia · 16 October 2026 · 60 minutes/);
  assert.match(slides, /Download the kit from the workshop page\./);
});

test("the client-name guard finds a hashed word alone, inside a word and in any case", () => {
  const word = "acmewidget";
  const guard = hashedWordGuard(createHash("sha256").update(word).digest("hex"), word.length);
  assert.equal(guard("Made by AcmeWidget."), true);
  assert.equal(guard("theacmewidgets"), true);
  assert.equal(guard("acme widget"), false);
  assert.equal(mentionsClient("loehrning.ai · Workshop 04"), false);
  assert.throws(() => assertClean("x.html", Buffer.from("<p>loehrning.ai × Partner</p>")), /co-branding/);
  assert.throws(() => assertClean("x.md", Buffer.from(["", "Users", "someone", "kit"].join("/"))), /local path/);
  assert.throws(() => assertClean("x.md", Buffer.from("Vinăria Trei Dealuri")), /retired case name/);
  assert.ok(FORBIDDEN.length >= 4);
});

test("the deck's five prompts are identical to the code blocks in the kit's START-HERE.md", () => {
  const deck = deckPrompts(read("slides.html").toString("utf8"));
  const guide = kitPrompts(kit().get("START-HERE.md").toString("utf8"));
  assert.deepEqual([...deck.keys()].sort(), [1, 2, 3, 4, 5]);
  for (const [n, prompt] of deck) assert.equal(prompt, guide.get(n), `prompt ${n}`);
});

test("the kit zip holds exactly the reviewed kit files, including its post-session answer key", () => {
  const archive = read(ZIP_NAME);
  const entries = readKitArchive(archive);
  assert.deepEqual(entries.map(([name]) => name).sort(), [...KIT_FILES].sort());
  assert.equal(entries.some(([name]) => name === "ANSWERS.md"), true);
  assert.equal(archive.length, 896622);
  // The late invoice is a photo; the deck shows the same bytes.
  const photo = kit().get("inbox/4-september-invoice.png");
  assert.ok(photo.equals(read("assets/proof/september-invoice.png")));
  assert.doesNotThrow(() => assertPlainPng("invoice", photo));
  assert.match(kit().get("START-HERE.md").toString("utf8"), /Attach `inbox\/4-september-invoice\.png`/);
});

test("the deterministic kit archive builder refuses other file types, duplicates and PNGs with metadata", () => {
  assert.throws(() => buildKitArchive([["x.pdf", Buffer.from("%PDF")]]), /not CSV, Markdown, text or PNG/);
  assert.throws(() => buildKitArchive([["a.md", Buffer.from("a")], ["a.md", Buffer.from("a")]]), /Duplicate/);
  assert.throws(() => buildKitArchive([["../a.md", Buffer.from("a")]]), /plain relative path/);
  assert.throws(() => buildKitArchive([["x.png", Buffer.from("not a png")]]), /PNG/);
  const entries = [["b.md", Buffer.from("b\n")], ["a.csv", Buffer.from("a,b\n")]];
  assert.ok(buildKitArchive(entries).equals(buildKitArchive([...entries].reverse())));
  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  const text = Buffer.concat([Buffer.from([0, 0, 0, 1]), Buffer.from("tEXt"), Buffer.from("x"), Buffer.alloc(4)]);
  const head = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.throws(() => assertPlainPng("x.png", Buffer.concat([head, text, iend])), /tEXt chunk/);
});

test("every file the deck loads is published", () => {
  const slides = read("slides.html").toString("utf8");
  const refs = [...slides.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)].map((match) => match[1]);
  assert.ok(refs.length >= 10);
  const css = read("lib/tokens.css").toString("utf8");
  const fonts = [...css.matchAll(/url\('\.\.\/([^']+)'\)/g)].map((match) => match[1]);
  assert.equal(fonts.length, 5);
  for (const ref of [...refs, ...fonts]) assert.ok(PUBLISHED_FILES.includes(ref), ref);
  assert.match(css, /--cover-ground:/, "tokens.css carries the poster scene block");
});

test("the ASSET_MANIFEST rows of this folder match the published binaries", () => {
  const manifest = JSON.parse(readFileSync(path.join(REPO_ROOT, "ASSET_MANIFEST.json"), "utf8"));
  const rows = manifest.assets.filter((row) => row.path.startsWith(`${WORKSHOP_RELATIVE}/`));
  for (const row of rows) {
    const name = row.path.slice(WORKSHOP_RELATIVE.length + 1);
    assert.ok(PUBLISHED_FILES.includes(name), `stale row ${name}`);
    const bytes = read(name);
    assert.equal(row.sha256, createHash("sha256").update(bytes).digest("hex"), name);
    assert.equal(row.sizeBytes, bytes.length, name);
  }
  for (const name of PUBLISHED_FILES.filter((file) => /\.(?:jpg|png|webp|woff2|zip)$/.test(file))) {
    assert.ok(rows.some((row) => row.path === `${WORKSHOP_RELATIVE}/${name}`), `no row for ${name}`);
  }
});

// The course source lives outside this repository. Where it is available (set
// ESG_PASSPORT_SOURCE to its folder), a fresh export must reproduce the published folder.
test("a fresh export from the course source reproduces the published folder", { skip: !process.env.ESG_PASSPORT_SOURCE && "ESG_PASSPORT_SOURCE not set" }, () => {
  const run = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts/workshop04/export-esg-passport.mjs"), process.env.ESG_PASSPORT_SOURCE, "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
});
