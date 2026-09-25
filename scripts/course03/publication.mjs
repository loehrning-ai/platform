/**
 * Manifest rows for the published Data Readiness workshop, shared by
 * scripts/export-data-readiness-workshop.mjs and
 * scripts/course03/refresh-published.mjs so both write identical records.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const WORKSHOP_RELATIVE = "packages/website/public/workshops/datenbereitschaft-fuer-ki";
export const PORTRAIT_SOURCE = "packages/website/public/workshops/geschaeftsberichte-mit-ki-lesen/assets/tim-loehr.jpg";
export const PORTRAIT_SHA256 = "3df97f11e0ccc2cc6ada1216eeec12c80725764857b011bd3f9ce79e792401c4";
export const BUILDER_PAGE_SOURCE = "scripts/course03/builder/page/builder.html";
export const BUILDER_KIT_SOURCE = "scripts/course03/builder/kit/builder";
export const GUIDE_SOURCE = "scripts/course03/guide.html";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Every file below `dir`, as sorted forward-slash paths relative to it. */
export function listFiles(dir, prefix = "") {
  return readdirSync(path.join(dir, prefix), { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? listFiles(dir, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]))
    .sort();
}

const byPath = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** bundle-manifest.json text: sorted file records plus the external source hashes. */
export function bundleManifestText(sourceHashes, files) {
  const records = [...files]
    .filter(([name]) => name !== "bundle-manifest.json")
    .sort(([a], [b]) => byPath(a, b))
    .map(([name, bytes]) => ({ path: name, sizeBytes: bytes.length, sha256: sha256(bytes) }));
  return `${JSON.stringify({ version: 1, evidenceMode: "historical-recording-and-synthetic-simulation", sourceHashes, files: records }, null, 2)}\n`;
}

/** ASSET_MANIFEST.json rows for the binary and brand files of this workshop. */
export function assetRows(files, portraitRecord) {
  const rows = [];
  for (const [name, bytes] of [...files].sort(([a], [b]) => byPath(a, b))) {
    if (name === "assets/tim-loehr.jpg") {
      rows.push({ ...portraitRecord, path: `${WORKSHOP_RELATIVE}/${name}` });
      continue;
    }
    if (!/\.(?:svg|ttf|woff2|zip|webp)$/.test(name)) continue;
    const isFont = /\.(?:ttf|woff2)$/.test(name);
    rows.push({
      path: `${WORKSHOP_RELATIVE}/${name}`,
      sizeBytes: bytes.length,
      sha256: sha256(bytes),
      owner: isFont ? (name.includes("JetBrains") ? "The JetBrains Mono Project Authors" : "The Inter Project Authors; modified and renamed by loehrning.ai") : "Tim Löhr",
      source: isFont
        ? (name.includes("JetBrains") ? "Existing platform-inventoried JetBrains Mono variable font" : "Course Typing v2.1 statics, renamed Inter 4.001 derivatives")
        : name === "card-preview.webp"
          ? "Chromium screenshot of the course cover, resized to 1024 by 576 pixels"
          : "Original Data Readiness for AI course material, owner-authorized loehrning.ai publication",
      license: isFont ? "OFL-1.1" : "LicenseRef-Loehrning-Brand",
      redistribution: isFont ? "Permitted with the OFL notices bundled beside the fonts" : "Included for loehrning.ai course operation; no standalone reuse rights granted",
    });
  }
  return rows;
}

/** The reviewed portrait record already published with Workshop 02. */
export function portraitRecord(root) {
  const manifest = JSON.parse(readFileSync(path.join(root, "ASSET_MANIFEST.json"), "utf8"));
  const record = manifest.assets.find((entry) => entry.path === PORTRAIT_SOURCE);
  const portrait = readFileSync(path.join(root, PORTRAIT_SOURCE));
  if (!record || sha256(portrait) !== record.sha256 || portrait.length !== record.sizeBytes || sha256(portrait) !== PORTRAIT_SHA256) {
    throw new Error("Established workshop portrait no longer matches its reviewed asset record");
  }
  return { record, portrait };
}

/**
 * ASSET_MANIFEST.json text with this workshop's rows replaced. Unrelated rows
 * keep their order; this workshop's rows keep their previous position and new
 * rows follow, sorted by path.
 */
export function assetManifestText(root, rows) {
  const manifestPath = path.join(root, "ASSET_MANIFEST.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const oldOrder = new Map(manifest.assets.map((entry, index) => [entry.path, index]));
  manifest.assets = manifest.assets.filter((entry) => !entry.path.startsWith(`${WORKSHOP_RELATIVE}/`)).concat(rows);
  manifest.assets.sort((a, b) => (oldOrder.get(a.path) ?? Infinity) - (oldOrder.get(b.path) ?? Infinity) || byPath(a.path, b.path));
  return `${JSON.stringify(manifest, null, 2).replace(/[\u007f-￿]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`)}\n`;
}

export function writeAssetManifest(root, rows) {
  writeFileSync(path.join(root, "ASSET_MANIFEST.json"), assetManifestText(root, rows));
}
