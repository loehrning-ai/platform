#!/usr/bin/env node
/** Export only reviewed teaching surfaces; never copy the source repository wholesale. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectZipArchive } from "../packages/website/scripts/open-source/zip-inspection.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] && path.resolve(process.argv[2]);
if (!source || !statSync(path.join(source, "slides.html")).isFile()) {
  throw new Error("Usage: node scripts/export-data-readiness-workshop.mjs <course-source-directory>");
}
const relative = "packages/website/public/workshops/datenbereitschaft-fuer-ki";
const target = path.join(root, relative);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const written = new Map();
const sourceHashes = {};
function put(name, bytes) {
  if (path.isAbsolute(name) || name.split("/").includes("..")) throw new Error("Unsafe export path");
  const content = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  mkdirSync(path.dirname(path.join(target, name)), { recursive: true });
  writeFileSync(path.join(target, name), content);
  written.set(name, content);
}
function safeText(text) {
  return text.replace(/(?:\/Users|\/home)\/[^\s"'`<>]+/g, "[local authoring path omitted]");
}
function copyText(name) {
  const bytes = readFileSync(path.join(source, name));
  sourceHashes[name] = sha256(bytes);
  put(name, safeText(bytes.toString()));
}
const libFiles = ["cover-globe.css", "deck-runtime.js", "deck-stage.js", "demo-adapter.js", "model-capture-data.js", "presenter-notes.js", "presenter.css", "presenter.js", "replay-data.js", "story.css", "tokens.css"];
const sceneNames = ["appendix-access-controls", "appendix-architecture", "appendix-ask-boundary", "appendix-evaluation", "appendix-lineage-freshness", "appendix-research", "appendix-run-metadata", "appendix-semantic-contract", "bad-architecture", "bad-ask", "contract-consumers", "controlled-comparison", "cover", "evaluation", "failure-anatomy", "freshness", "generalization", "honest-no", "host", "ready-architecture", "ready-rematch", "resolution", "semantic-contract", "the-arc", "the-case", "your-data"];
for (const name of [...libFiles, ...sceneNames.map((name) => `scenes/${name}.css`), "scenes/failure-anatomy.js", "scenes/resolution.js"]) copyText(`lib/${name}`);
put("lib/presenter-notes.js", written.get("lib/presenter-notes.js").toString().replaceAll("release gate BLOCKED", "AI deployment BLOCKED").replaceAll("release gate is BLOCKED", "AI deployment is BLOCKED"));
put("presenter.html", safeText(readFileSync(path.join(source, "presenter.html"), "utf8")).replace('<h1>Presenter console</h1>', '<h1>Presenter console</h1><p><a href="./slides.html">Open the course first, then press P to connect this console.</a></p>'));
let slides = readFileSync(path.join(source, "slides.html"), "utf8");
sourceHashes["slides.html"] = sha256(Buffer.from(slides));
if (!slides.includes('src="./assets/tim-loehr.jpg"') || !slides.includes('<div class="ab-shots"')) throw new Error("Public visual transforms need review");
// Reuse the exact author-supplied portrait already published with Workshop 02.
// This narrowly approved asset is not permission to export other source images.
const portraitPath = "packages/website/public/workshops/geschaeftsberichte-mit-ki-lesen/assets/tim-loehr.jpg";
const portraitRecord = JSON.parse(readFileSync(path.join(root, "ASSET_MANIFEST.json"), "utf8")).assets.find((entry) => entry.path === portraitPath);
const portrait = readFileSync(path.join(root, portraitPath));
if (!portraitRecord || sha256(portrait) !== portraitRecord.sha256 || portrait.length !== portraitRecord.sizeBytes || sha256(portrait) !== "3df97f11e0ccc2cc6ada1216eeec12c80725764857b011bd3f9ce79e792401c4") {
  throw new Error("Established workshop portrait no longer matches its reviewed asset record");
}
put("assets/tim-loehr.jpg", portrait);
slides = slides.replace(/<div class="ab-shots"[\s\S]*?<\/div>/,
  `<div class="ab-shots" data-visual="recorded-boundary-summary">
  <figure class="ab-shot"><div class="ab-public-panel"><strong>Two synthetic connections</strong><p>Bad: unclear raw fields.</p><p>Ready: approved analytical views.</p><p>Same frozen FOLDLINE dataset.</p></div><figcaption class="ab-shot__name">Historical source setup, summarized</figcaption></figure>
  <figure class="ab-shot"><div class="ab-public-panel"><strong>Three recorded questions</strong><p>Ending balance. Net change. Churn.</p><p>One observed run per question and lane.</p><p>No new model call on this page.</p></div><figcaption class="ab-shot__name">Historical run record, summarized</figcaption></figure>
  <p class="ab-provenance">Original teaching summary of the August 2026 record. Third-party interface screenshots are omitted from this public edition.</p></div>`);
slides = slides.replace(/External Ask audit: <span class="mono">[^<]*<\/span> · course made no edits\./g,
  "Historical application audit; the public course does not operate that application.");
put("slides.html", safeText(slides).replaceAll("release gate BLOCKED", "AI deployment BLOCKED"));
put("lib/scenes/appendix-ask-boundary.css", `${written.get("lib/scenes/appendix-ask-boundary.css").toString()}\n.ab-public-panel{height:300px;border:3px solid var(--ink);padding:24px;font-size:25px;line-height:1.35;box-sizing:border-box}.ab-public-panel strong{font-size:29px}.ab-public-panel p{margin:16px 0}\n`);

// Public and local previews of this export always use the embedded record, even with ?mode=live.
let adapter = written.get("lib/demo-adapter.js").toString();
adapter = adapter.replace(/async initialize\(\) \{[\s\S]*?\n    useReplay\(reason\)/,
  'async initialize() {\n      this.useReplay("public teaching edition; recorded evidence only");\n      return this.adapter.status();\n    }\n\n    useReplay(reason)');
if (!adapter.includes("public teaching edition; recorded evidence only")) throw new Error("Replay adapter transform no longer matches");
put("lib/demo-adapter.js", adapter);

for (const name of ["favicon.svg", "globe.svg", "mark-black.svg", "lockup-horizontal.svg", "lockup-horizontal-dark.svg"]) {
  put(`assets/${name}`, readFileSync(path.join(source, "assets", name)));
}
for (const weight of [400, 500, 600, 700]) {
  put(`assets/fonts/Typing-Static-${weight}.ttf`, readFileSync(path.join(source, `assets/fonts/Typing-Static-${weight}.ttf`)));
}
// Reuse the already inventoried OFL font, preserving its notice, instead of unsealed source derivatives.
const mono = readFileSync(path.join(root, "packages/website/public/workshops/geschaeftsberichte-mit-ki-lesen/assets/fonts/JetBrainsMono-var.woff2"));
for (const weight of [400, 700]) put(`assets/fonts/JetBrainsMono-Static-${weight}.woff2`, mono);
put("assets/fonts/OFL-1.1.txt", `${readFileSync(path.join(root, "LICENSES/OFL-1.1.txt"), "utf8").trimEnd()}\n`);
put("assets/fonts/OFL-1.1-JetBrainsMono.txt", `${readFileSync(path.join(root, "LICENSES/OFL-1.1-JetBrainsMono.txt"), "utf8").trimEnd()}\n`);
copyText("data-readiness-kit/readiness-lab.html");
const kitFiles = ["START-HERE.md", "QUESTION-CARD.md", "READY-CANVAS.md", "FOLDLINE-SCENARIOS.md", "semantic-template/model.yml", "semantic-template/metric.yml", "semantic-template/policy.yml", "semantic-template/verified-questions.yml", "agent/CLAUDE.example.md"];
for (const name of kitFiles) {
  copyText(`data-readiness-kit/${name}`);
  const key = `data-readiness-kit/${name}`;
  put(key, written.get(key).toString().replaceAll("`readiness-lab.html`", "[the public browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html)"));
}
put("data-readiness-kit/README.md", `# Data Readiness worksheets\n\nThis archive contains the question card, review canvas, synthetic scenario cards and definition templates for Workshop 03.\n\nOpen the interactive lab at https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html and the learner guide at https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html. The lab is a deterministic simulation, not a database or AI service. The text templates are examples, not active controls.\n\nUse invented examples only. Copyright Tim Löhr. All rights reserved; publication on loehrning.ai does not grant reuse rights.\n`);
put("data-readiness-kit/ASSET-RIGHTS.md", "# Worksheet rights\n\nOriginal course material by Tim Löhr, published by the owner on loehrning.ai. All rights reserved. No third-party visual assets are included. Public access is not a reuse license.\n");

// Deterministic, stored ZIP: no timestamps, platform metadata, hidden files, or executable HTML.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const zipFiles = [...kitFiles, "README.md", "ASSET-RIGHTS.md"];
const locals = [], central = [];
let offset = 0;
for (const file of zipFiles) {
  const name = Buffer.from(`data-readiness-kit/${file}`);
  const content = written.get(`data-readiness-kit/${file}`);
  const crc = crc32(content);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
  local.writeUInt16LE(33, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(content.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(name.length, 26);
  locals.push(local, name, content);
  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(0x314, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x800, 8); entry.writeUInt16LE(33, 14);
  entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(content.length, 20); entry.writeUInt32LE(content.length, 24); entry.writeUInt16LE(name.length, 28); entry.writeUInt32LE((0o100644 * 65536) >>> 0, 38); entry.writeUInt32LE(offset, 42);
  central.push(entry, name); offset += local.length + name.length + content.length;
}
const directory = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50); end.writeUInt16LE(zipFiles.length, 8); end.writeUInt16LE(zipFiles.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...locals, directory, end]);
inspectZipArchive(archive, { label: "data-readiness-kit.zip" });
put("data-readiness-kit.zip", archive);
put("guide.html", readFileSync(path.join(root, "scripts/course03/guide.html")));
put("PUBLICATION.md", `# Public teaching edition\n\nPublished by the course owner on loehrning.ai. Original course content remains copyright Tim Löhr, all rights reserved. Fonts retain their bundled SIL Open Font License notices.\n\nThis edition includes the interactive deck, presenter notes, learner guide, synthetic browser lab and text worksheets. Slide 2 reuses the author-supplied portrait already published in Workshop 02, at the author's request. Its existing asset restrictions remain unchanged. This edition omits third-party interface screenshots, unused third-party marks, the supplied syllabus, authoring logs, runtime services and credentials. The screenshot appendix uses an explicitly labelled textual teaching summary. The source monospace derivatives are replaced with the platform's inventoried JetBrains Mono variable font.\n\nThe deck always replays embedded historical observations. The lab is a deterministic browser simulation. Neither establishes present-day model reliability, permissions or production readiness.\n`);

const manifestPath = path.join(root, "ASSET_MANIFEST.json");
if (existsSync(path.join(target, "card-preview.webp"))) put("card-preview.webp", readFileSync(path.join(target, "card-preview.webp")));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.assets = manifest.assets.filter((entry) => !entry.path.startsWith(`${relative}/`));
for (const [name, bytes] of written) {
  if (name === "assets/tim-loehr.jpg") {
    manifest.assets.push({ ...portraitRecord, path: `${relative}/${name}` });
    continue;
  }
  if (!/\.(?:svg|ttf|woff2|zip|webp)$/.test(name)) continue;
  const isFont = /\.(?:ttf|woff2)$/.test(name);
  manifest.assets.push({ path: `${relative}/${name}`, sizeBytes: bytes.length, sha256: sha256(bytes),
    owner: isFont ? (name.includes("JetBrains") ? "The JetBrains Mono Project Authors" : "The Inter Project Authors; modified and renamed by loehrning.ai") : "Tim Löhr",
    source: isFont ? (name.includes("JetBrains") ? "Existing platform-inventoried JetBrains Mono variable font" : "Course Typing v2.1 statics, renamed Inter 4.001 derivatives") : name === "card-preview.webp" ? "Chromium screenshot of the original course cover, resized to 1024 by 576 pixels" : "Original Data Readiness for AI course material, owner-authorized loehrning.ai publication",
    license: isFont ? "OFL-1.1" : "LicenseRef-Loehrning-Brand",
    redistribution: isFont ? "Permitted with the OFL notices bundled beside the fonts" : "Included for loehrning.ai course operation; no standalone reuse rights granted" });
}
// Restore the established unrelated order; only this workshop's rows are new.
const trackedManifest = JSON.parse(execFileSync("git", ["show", "HEAD:ASSET_MANIFEST.json"], { cwd: root, encoding: "utf8" }));
const oldOrder = new Map(trackedManifest.assets.map((entry, index) => [entry.path, index]));
manifest.assets.sort((a, b) => (oldOrder.get(a.path) ?? Infinity) - (oldOrder.get(b.path) ?? Infinity) || a.path.localeCompare(b.path));
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2).replace(/[\u007f-\uffff]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`)}\n`);
put("bundle-manifest.json", `${JSON.stringify({ version: 1, evidenceMode: "historical-recording-and-synthetic-simulation", sourceHashes, files: [...written].map(([name, bytes]) => ({ path: name, sizeBytes: bytes.length, sha256: sha256(bytes) })) }, null, 2)}\n`);
function publishedFiles(dir = "") {
  return readdirSync(path.join(target, dir), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? publishedFiles(`${dir}${entry.name}/`) : [`${dir}${entry.name}`]);
}
const unexpected = publishedFiles().filter((name) => !written.has(name) && name !== "card-preview.webp");
if (unexpected.length) throw new Error(`Unreviewed public files: ${unexpected.join(", ")}`);
console.log(`Exported ${written.size} reviewed course files. Historical evidence anchors retained; no local paths or live service required.`);
