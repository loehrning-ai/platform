import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { deflateRawSync } from "node:zlib";
import { crc32 } from "../course03/kit-archive.mjs";
import {
  assertClean,
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
import { buildKitArchive, dosDateTime, KIT_RELEASE_DATE, readKitArchive, ZIP_NAME } from "../workshop04/kit-archive.mjs";
import { questionnaireCsv } from "../workshop04/questionnaire-csv.mjs";

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
  // The deck keeps its own brand line, without a partner.
  const slides = read("slides.html").toString("utf8");
  assert.match(slides, /<title>Answer ESG by Friday · loehrning\.ai<\/title>/);
  assert.match(read("lib/esg.js").toString("utf8"), /loehrning\.ai · Workshop 04/);
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
  assert.ok(FORBIDDEN.length >= 3);
});

test("the deck's five prompts are identical to the code blocks in the kit's START-HERE.md", () => {
  const deck = deckPrompts(read("slides.html").toString("utf8"));
  const guide = kitPrompts(kit().get("START-HERE.md").toString("utf8"));
  assert.deepEqual([...deck.keys()].sort(), [1, 2, 3, 4, 5]);
  for (const [n, prompt] of deck) assert.equal(prompt, guide.get(n), `prompt ${n}`);
});

test("the kit zip holds exactly the reviewed kit files and is rebuilt byte for byte from them", () => {
  const archive = read(ZIP_NAME);
  const entries = readKitArchive(archive);
  assert.deepEqual(entries.map(([name]) => name), [...KIT_FILES].sort());
  assert.ok(buildKitArchive(entries).equals(archive), `${ZIP_NAME} is not the deterministic build of its own entries`);
  const { date, time } = dosDateTime(KIT_RELEASE_DATE);
  assert.equal(archive.readUInt16LE(10), time);
  assert.equal(archive.readUInt16LE(12), date);
  // The questionnaire ships as CSV; the guide and the deck name that file.
  assert.ok(!KIT_FILES.some((name) => name.endsWith(".xlsx")));
  assert.match(kit().get("START-HERE.md").toString("utf8"), /Attach `inbox\/1-customer-questionnaire\.csv`/);
  assert.match(read("slides.html").toString("utf8"), /Attach <b>1-customer-questionnaire\.csv<\/b>/);
  const questionnaire = kit().get("inbox/1-customer-questionnaire.csv").toString("utf8").split("\n");
  assert.equal(questionnaire[3], "#,Topic,Question,Answer,Source,Status");
  assert.equal(questionnaire.filter((line) => /^\d+,/.test(line)).length, 16);
});

test("the kit archive refuses anything but plain text entries and duplicates", () => {
  assert.throws(() => buildKitArchive([["x.pdf", Buffer.from("%PDF")]]), /not CSV or Markdown/);
  assert.throws(() => buildKitArchive([["a.md", Buffer.from("a")], ["a.md", Buffer.from("a")]]), /Duplicate/);
  assert.throws(() => buildKitArchive([["../a.md", Buffer.from("a")]]), /plain relative path/);
  const entries = [["b.md", Buffer.from("b\n")], ["a.csv", Buffer.from("a,b\n")]];
  assert.ok(buildKitArchive(entries).equals(buildKitArchive([...entries].reverse())));
});

/** A minimal .xlsx container (deflated entries) for the converter tests. */
function xlsx(sheet, { sheets = 1 } = {}) {
  const files = [
    ["xl/workbook.xml", `<workbook><sheets>${'<sheet name="s"/>'.repeat(sheets)}</sheets></workbook>`],
    ["xl/worksheets/sheet1.xml", `<worksheet><sheetData>${sheet}</sheetData></worksheet>`],
  ];
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [file, text] of files) {
    const name = Buffer.from(file);
    const raw = Buffer.from(text);
    const data = deflateRawSync(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    locals.push(local, name, data);
    central.push(entry, name);
    offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

test("the questionnaire converter keeps rows, blank rows and quoting, and refuses what it cannot read", () => {
  const sheet =
    '<row r="1"><c r="A1" t="inlineStr"><is><t>Title, with comma</t></is></c></row>' +
    '<row r="3"><c r="A3" t="n"><v>1</v></c><c r="C3" t="inlineStr"><is><t>Say &quot;hi&quot; &amp; go</t></is></c></row>';
  assert.equal(questionnaireCsv(xlsx(sheet)), '"Title, with comma",,,,,\n,,,,,\n1,,"Say ""hi"" & go",,,\n');
  assert.throws(() => questionnaireCsv(xlsx('<row r="1"><c r="A1" t="s"><v>0</v></c></row>')), /cell type s/);
  assert.throws(() => questionnaireCsv(xlsx('<row r="1"><c r="A1"><f>1+1</f><v>2</v></c></row>')), /formulas/);
  assert.throws(() => questionnaireCsv(xlsx('<row r="1"><c r="G1" t="n"><v>1</v></c></row>')), /column G/);
  assert.throws(() => questionnaireCsv(xlsx("", { sheets: 2 })), /exactly one sheet/);
});

test("every file the deck loads is published", () => {
  const slides = read("slides.html").toString("utf8");
  const refs = [...slides.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)].map((match) => match[1]);
  assert.ok(refs.length >= 8);
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
  for (const name of PUBLISHED_FILES.filter((file) => /\.(?:jpg|webp|woff2|zip)$/.test(file))) {
    assert.ok(rows.some((row) => row.path === `${WORKSHOP_RELATIVE}/${name}`), `no row for ${name}`);
  }
});

// The course source lives outside this repository. Where it is available (set
// ESG_PASSPORT_SOURCE to its folder), a fresh export must reproduce the published folder.
test("a fresh export from the course source reproduces the published folder", { skip: !process.env.ESG_PASSPORT_SOURCE && "ESG_PASSPORT_SOURCE not set" }, () => {
  const run = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts/workshop04/export-esg-passport.mjs"), process.env.ESG_PASSPORT_SOURCE, "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
});
