#!/usr/bin/env node
/** Export only reviewed teaching surfaces; never copy the source repository wholesale. */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildKitArchive, kitArchiveFiles, KIT_SOURCE_FILES } from "./course03/kit-archive.mjs";
import { loadOverrides, resolveOverride, writeManifest as writeOverrideManifest } from "./course03/overrides.mjs";
import { KIT_ASSET_RIGHTS, KIT_README, PUBLICATION } from "./course03/published-text.mjs";
import { assetRows, BUILDER_KIT_SOURCE, BUILDER_PAGE_SOURCE, bundleManifestText, GUIDE_SOURCE, listFiles, portraitRecord, sha256, writeAssetManifest } from "./course03/publication.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] && path.resolve(process.argv[2]);
if (!source || !statSync(path.join(source, "slides.html")).isFile()) {
  throw new Error("Usage: node scripts/export-data-readiness-workshop.mjs <course-source-directory>");
}
const relative = "packages/website/public/workshops/datenbereitschaft-fuer-ki";
const target = path.join(root, relative);
// Nothing touches the published folder until every transform, override and guard has passed.
const written = new Map();
const sourceHashes = {};
function put(name, bytes) {
  if (path.isAbsolute(name) || name.split("/").includes("..")) throw new Error("Unsafe export path");
  written.set(name, Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes));
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
const { record: portraitRecordEntry, portrait } = portraitRecord(root);
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
for (const name of KIT_SOURCE_FILES) {
  copyText(`data-readiness-kit/${name}`);
  const key = `data-readiness-kit/${name}`;
  put(key, written.get(key).toString().replaceAll("`readiness-lab.html`", "[the public browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html)"));
}

// Repository-authored fixes replace the matching export output. The guard throws
// when the course source changed underneath a recorded fix (see overrides.mjs).
const overrides = loadOverrides(root);
const overridden = new Set();
const exported = {};
for (const [name, bytes] of written) {
  exported[name] = sha256(bytes);
  const { bytes: resolved, status } = resolveOverride(overrides, name, bytes);
  if (status === "none") continue;
  overridden.add(name);
  written.set(name, resolved);
  if (status === "upstreamed") console.log(`Course source now contains the override for ${name}; its entry can be removed.`);
}
const orphaned = [...overrides.entries.keys()].filter((name) => !overridden.has(name));
if (orphaned.length) throw new Error(`Overrides for files this export no longer writes: ${orphaned.join(", ")}`);

// Repository-authored surfaces: kit notes, learner guide, builder guide and kit.
put("data-readiness-kit/README.md", KIT_README);
put("data-readiness-kit/ASSET-RIGHTS.md", KIT_ASSET_RIGHTS);
const builderFiles = listFiles(path.join(root, BUILDER_KIT_SOURCE));
for (const name of builderFiles) put(`data-readiness-kit/builder/${name}`, readFileSync(path.join(root, BUILDER_KIT_SOURCE, name)));
put("builder.html", readFileSync(path.join(root, BUILDER_PAGE_SOURCE)));
put("guide.html", readFileSync(path.join(root, GUIDE_SOURCE)));
put("PUBLICATION.md", PUBLICATION);
put("data-readiness-kit.zip", buildKitArchive(kitArchiveFiles(builderFiles).map((name) => [name, written.get(`data-readiness-kit/${name}`)])));
if (existsSync(path.join(target, "card-preview.webp"))) put("card-preview.webp", readFileSync(path.join(target, "card-preview.webp")));
for (const [name, bytes] of written) {
  if (/\.(?:css|csv|html|js|json|md|py|sql|txt|yml)$/.test(name) && /(?:\/Users|\/home)\//.test(bytes.toString())) throw new Error(`Local authoring path in ${name}`);
}

function publishedFiles(dir = "") {
  if (!existsSync(path.join(target, dir))) return [];
  return readdirSync(path.join(target, dir), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? publishedFiles(`${dir}${entry.name}/`) : [`${dir}${entry.name}`]);
}
const unexpected = publishedFiles().filter((name) => !written.has(name) && name !== "bundle-manifest.json");
if (unexpected.length) throw new Error(`Unreviewed public files: ${unexpected.join(", ")}`);

for (const [name, bytes] of written) {
  mkdirSync(path.dirname(path.join(target, name)), { recursive: true });
  writeFileSync(path.join(target, name), bytes);
}
writeFileSync(path.join(target, "bundle-manifest.json"), bundleManifestText(sourceHashes, written));
writeAssetManifest(root, assetRows(written, portraitRecordEntry));
writeOverrideManifest(root, { exported, files: overrides.manifest.files });
console.log(`Exported ${written.size} reviewed course files (${overridden.size} repository overrides). Historical evidence anchors retained; no local paths or live service required.`);
