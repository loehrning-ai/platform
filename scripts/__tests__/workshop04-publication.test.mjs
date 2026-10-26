import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { lintLines } from "../copy-lint.mjs";
import {
  assertClean,
  assertPlainPng,
  BUDGET,
  DECK_KEYS,
  DECK_KEYS_SOURCE,
  FORBIDDEN,
  hashedWordGuard,
  isHeld,
  KIT_V3_ZIPS,
  listFiles,
  mentionsClient,
  PUBLISHED_FILES,
  REPO_ROOT,
  WORKSHOP_DIR,
  WORKSHOP_RELATIVE,
} from "../workshop04/export-esg-passport.mjs";
import { buildKitArchive, readKitArchive } from "../workshop04/kit-archive.mjs";
import { KITS, kitFiles, PLATFORM_FILES, zipName } from "../workshop04/kit-v3.mjs";

const read = (name) => readFileSync(path.join(WORKSHOP_DIR, name));
const text = (name) => read(name).toString("utf8");
const TEXT = /\.(?:css|csv|html|js|md|svg|txt)$/;
const EDITIONS = { de: "slides.html", en: "en/slides.html" };
const PRESENTERS = { de: "presenter.html", en: "en/presenter.html" };

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'" };
const decode = (value) => value.replace(/&(amp|lt|gt|quot|#39|apos);/g, (_, name) => ENTITIES[name]);
/** Applies one replacement until the text stops changing, so removing a match never leaves a new one. */
const replaceUntilStable = (text, pattern, replacement) => {
  let previous;
  do {
    previous = text;
    text = text.replace(pattern, replacement);
  } while (text !== previous);
  return text;
};
const visible = (html) => decode(replaceUntilStable(html, /<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

const startGuide = (locale) => {
  const entries = new Map(readKitArchive(read(zipName(locale)), { prefix: `${KITS[locale].name}/` }));
  return entries.get(KITS[locale].start).toString("utf8");
};

/** The five prompts of one deck edition: <pre class="prompt__text" id="prompt-N">. */
function deckPrompts(html) {
  return new Map(
    [...html.matchAll(/<pre class="prompt__text" id="prompt-(\d)">([\s\S]*?)<\/pre>/g)].map(([, n, body]) => [Number(n), decode(body).trim()]),
  );
}

/** The code block under each "## Schritt N" / "## Step N" heading of the kit guide. */
function kitPrompts(markdown) {
  const prompts = new Map();
  for (const section of markdown.split(/\n(?=## )/)) {
    const step = /^## (?:Schritt|Step) (\d)/.exec(section)?.[1];
    const block = /```\n([\s\S]*?)```/.exec(section)?.[1];
    if (step && block) prompts.set(Number(step), block.trim());
  }
  return prompts;
}

/** Slide ids, kinds and step counts, in order. */
const slideShape = (html) =>
  [...html.matchAll(/<section class="slide[^"]*" id="([^"]+)" data-kind="(main|appendix)"[^>]*data-step-total="(\d+)"/g)].map(([, id, kind, total]) => `${id}:${kind}:${total}`);

/** Every line of visible copy: slide text and speaker notes, without styles, scripts and prompts. */
function copyLines(html) {
  const notes = /<script type="application\/json" id="speaker-notes">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "[]";
  const noteStrings = [];
  const walk = (value) => {
    if (typeof value === "string") noteStrings.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(JSON.parse(notes));
  const withoutCode = replaceUntilStable(
    replaceUntilStable(html, /<style\b[\s\S]*?<\/style\b[^>]*>/gi, ""),
    /<script\b[\s\S]*?<\/script\b[^>]*>/gi,
    "",
  );
  const body = withoutCode
    .replace(/<pre class="prompt__text"[\s\S]*?<\/pre>/g, "")
    .replace(/<(?:p|li|h\d|td|th|div|blockquote|figcaption)\b/g, "\n$&");
  // A folder name such as "answers/" is a path, the same machine token the copy lint blanks out.
  const lines = decode(replaceUntilStable(body, /<[^>]+>/g, " "))
    .replace(/(^|\s)[\p{L}\d_-]+\/(?=\s|$)/gmu, "$1 ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const noteLines = noteStrings.flatMap((note) => note.split("\n")).map((line) => line.replace(/(^|\s)[\p{L}\d_-]+\/(?=[\s.,)]|$)/gu, "$1 "));
  return [...lines, ...noteLines].map((line, i) => ({ line: i + 1, text: line }));
}

test("the published folder holds exactly the allowlisted files, plus the held file this export never touches", () => {
  const present = listFiles(WORKSHOP_DIR);
  assert.deepEqual(present.filter((name) => !isHeld(name)), PUBLISHED_FILES);
  assert.ok(present.filter(isHeld).length <= 1);
  for (const name of PUBLISHED_FILES) {
    assert.ok(!/(?:^|\/)(?:facilitator|admin|_build|README\.md|course\.json)/.test(name), name);
  }
});

test("no published file or kit entry names the client, a local path or presenter-only material", () => {
  for (const name of PUBLISHED_FILES.filter((file) => TEXT.test(file))) {
    assert.doesNotThrow(() => assertClean(name, read(name)), name);
  }
  for (const [zip, prefix] of Object.entries(KIT_V3_ZIPS)) {
    for (const [name, bytes] of readKitArchive(read(zip), { prefix })) {
      assert.doesNotThrow(() => assertClean(`${zip}/${name}`, bytes), name);
    }
  }
  for (const name of [...Object.values(EDITIONS), ...Object.values(PRESENTERS), "sheet.html"]) {
    assert.doesNotMatch(text(name), /logo/i, `${name} links no logo`);
  }
});

test("the client-name guard finds a hashed word alone, inside a word and in any case", () => {
  const word = "acmewidget";
  const guard = hashedWordGuard(createHash("sha256").update(word).digest("hex"), word.length);
  assert.equal(guard("Made by AcmeWidget."), true);
  assert.equal(guard("theacmewidgets"), true);
  assert.equal(guard("acme widget"), false);
  assert.equal(mentionsClient("loehrning.ai · Workshop 04"), false);
  assert.throws(() => assertClean("x.md", Buffer.from(["", "Users", "someone", "kit"].join("/"))), /local path/);
  assert.throws(() => assertClean("x.md", Buffer.from("Vinăria Trei Dealuri")), /retired case name/);
  assert.ok(FORBIDDEN.length >= 4);
});

test("each deck edition carries the kit's five prompts byte for byte", () => {
  for (const [locale, file] of Object.entries(EDITIONS)) {
    const deck = deckPrompts(text(file));
    const guide = kitPrompts(startGuide(locale));
    assert.deepEqual([...deck.keys()].sort(), [1, 2, 3, 4, 5], locale);
    for (const [n, prompt] of deck) assert.equal(prompt, guide.get(n), `${locale} prompt ${n}`);
  }
});

test("the objective is word for word the same in deck, kit and demo, in both languages", () => {
  const demo = readFileSync(path.join(REPO_ROOT, "packages/website/src/lib/demo-cases/esg-berichte-mit-ki/copy.ts"), "utf8");
  const marks = { de: /"(Jede Antwort, die die Firma verlässt[^"]+)"/, en: /"(Every answer that leaves the company[^"]+)"/ };
  const labels = { de: "**Lernziel:**", en: "**Learning objective:**" };
  for (const [locale, file] of Object.entries(EDITIONS)) {
    const fromDemo = marks[locale].exec(demo)?.[1];
    const guide = startGuide(locale);
    const at = guide.indexOf(labels[locale]);
    assert.ok(at >= 0, `${locale}: kit names the objective`);
    const fromKit = guide.slice(at + labels[locale].length).split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
    const blocks = [...text(file).matchAll(/<blockquote class="objective"[^>]*>([\s\S]*?)<\/blockquote>/g)].map(([, body]) => visible(body));
    assert.ok(blocks.length >= 1, `${locale}: deck shows the objective`);
    for (const fromDeck of blocks) assert.equal(fromDeck, fromKit, `${locale}: deck`);
    assert.equal(fromDemo, fromKit, `${locale}: demo`);
  }
});

test("both editions have the same slides, steps and bound figures, and every figure is a number", () => {
  const [de, en] = [text(EDITIONS.de), text(EDITIONS.en)];
  const shape = slideShape(de);
  assert.deepEqual(slideShape(en), shape);
  assert.equal(shape.filter((row) => row.includes(":main:")).length, 15);
  assert.equal(shape.filter((row) => row.includes(":appendix:")).length, 3);
  const lastMain = shape.findLastIndex((row) => row.includes(":main:"));
  assert.ok(shape.findIndex((row) => row.includes(":appendix:")) > lastMain, "appendix after the last main slide");
  const keys = (html) => [...html.matchAll(/data-v="([A-Za-z0-9]+)">([^<]*)</g)].map(([, key, value]) => [key, value]);
  assert.ok(keys(de).length >= 10);
  assert.deepEqual(keys(en).map(([key]) => key), keys(de).map(([key]) => key));
  for (const [key, value] of [...keys(de), ...keys(en)]) assert.match(value, /\d/, key);
});

test("each edition shows the kit QR on the setup slide, ends on the take-home QR and has no clock", () => {
  for (const file of Object.values(EDITIONS)) {
    const html = text(file);
    const slides = html.split(/(?=<section class="slide)/).slice(1);
    const main = slides.filter((slide) => slide.includes('data-kind="main"'));
    assert.match(main.find((slide) => slide.includes('id="kit"')), /<svg[\s\S]*?\/workshops\/esg-berichte-mit-ki/, `${file}: kit slide`);
    assert.match(main.at(-1), /<svg[\s\S]*?\/demos\/esg-berichte-mit-ki/, `${file}: last main slide`);
    assert.doesNotMatch(html, /countdown|data-clock|session-clock/i, file);
    assert.doesNotMatch(html, /\{\{(?:claude-ui|qr):/, `${file}: placeholders filled`);
  }
});

test("deck copy passes the shared copy lint in both editions", () => {
  for (const file of Object.values(EDITIONS)) {
    const findings = lintLines(`${WORKSHOP_RELATIVE}/${file}`, copyLines(text(file)));
    assert.deepEqual(findings.map(({ rule, match, text: line }) => `${rule}: ${match} (${line})`), [], file);
  }
});

test("the deck loads the repository's deck-keys contract and stays inside its budgets", () => {
  assert.ok(read(DECK_KEYS).equals(readFileSync(DECK_KEYS_SOURCE)), "lib/deck-keys.js is the shared contract");
  for (const [name, limit] of Object.entries(BUDGET)) assert.ok(read(name).length <= limit, `${name}: ${read(name).length} > ${limit}`);
});

test("both kit editions hold exactly the reviewed files, with the website's skill and templates byte for byte", () => {
  for (const locale of ["de", "en"]) {
    const entries = new Map(readKitArchive(read(zipName(locale)), { prefix: `${KITS[locale].name}/` }));
    assert.deepEqual([...entries.keys()].sort(), kitFiles(locale));
    for (const [name, source] of Object.entries(PLATFORM_FILES[locale])) {
      assert.ok(entries.get(name).equals(readFileSync(path.join(REPO_ROOT, "packages/website", source))), `${locale}: ${name}`);
    }
    for (const [name, bytes] of entries) if (name.endsWith(".png")) assert.doesNotThrow(() => assertPlainPng(name, bytes));
    assert.doesNotMatch(entries.get(KITS[locale].start).toString("utf8"), /\{\{CLAUDE_UI\}\}/);
  }
});

test("the deterministic kit archive builder refuses other file types, duplicates and PNGs with metadata", () => {
  assert.throws(() => buildKitArchive([["x.pdf", Buffer.from("%PDF")]]), /not CSV, Markdown, text or PNG/);
  assert.throws(() => buildKitArchive([["a.md", Buffer.from("a")], ["a.md", Buffer.from("a")]]), /Duplicate/);
  assert.throws(() => buildKitArchive([["../a.md", Buffer.from("a")]]), /plain relative path/);
  assert.throws(() => buildKitArchive([["x.png", Buffer.from("not a png")]]), /PNG/);
  const entries = [["b.md", Buffer.from("b\n")], ["a.csv", Buffer.from("a,b\n")]];
  assert.ok(buildKitArchive(entries).equals(buildKitArchive([...entries].reverse())));
  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  const chunk = Buffer.concat([Buffer.from([0, 0, 0, 1]), Buffer.from("tEXt"), Buffer.from("x"), Buffer.alloc(4)]);
  const head = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.throws(() => assertPlainPng("x.png", Buffer.concat([head, chunk, iend])), /tEXt chunk/);
});

test("every file the decks and presenters load is published", () => {
  for (const file of [...Object.values(EDITIONS), ...Object.values(PRESENTERS), "sheet.html"]) {
    const dir = path.posix.dirname(file);
    const refs = [...text(file).matchAll(/(?:src|href)="(\.{1,2}\/[^"#?]+)/g)].map(([, ref]) => path.posix.normalize(path.posix.join(dir, ref)));
    assert.ok(refs.length >= 3, file);
    for (const ref of refs) assert.ok(PUBLISHED_FILES.includes(ref), `${file} -> ${ref}`);
  }
  const css = text("lib/tokens.css");
  const fonts = [...css.matchAll(/url\('\.\.\/([^']+)'\)/g)].map((match) => match[1]);
  assert.ok(fonts.length >= 4);
  for (const ref of fonts) assert.ok(PUBLISHED_FILES.includes(ref), ref);
  assert.match(css, /--cover-ground:/, "tokens.css carries the poster scene block");
});

test("the ASSET_MANIFEST rows of this folder match the published binaries", () => {
  const manifest = JSON.parse(readFileSync(path.join(REPO_ROOT, "ASSET_MANIFEST.json"), "utf8"));
  const rows = manifest.assets.filter((row) => row.path.startsWith(`${WORKSHOP_RELATIVE}/`));
  for (const row of rows) {
    const name = row.path.slice(WORKSHOP_RELATIVE.length + 1);
    if (isHeld(name)) continue;
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
// ESG_PASSPORT_SOURCE to its built site folder), a fresh export must reproduce the published folder.
test("a fresh export from the course source reproduces the published folder", { skip: !process.env.ESG_PASSPORT_SOURCE && "ESG_PASSPORT_SOURCE not set" }, () => {
  const run = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts/workshop04/export-esg-passport.mjs"), process.env.ESG_PASSPORT_SOURCE, "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
});
