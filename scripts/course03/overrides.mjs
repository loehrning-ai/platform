#!/usr/bin/env node
/**
 * Repository-authored overrides for the Data Readiness workshop export.
 *
 * The published deck, console, lab and worksheets are exported from an external
 * course source that is not in this repository. Fixes made here must survive a
 * re-export, so every externally sourced file that was changed in this
 * repository is stored under scripts/course03/overrides/<published path>.
 * overrides/manifest.json records:
 *
 *   exported  sha256 of every externally sourced file as the last export wrote it
 *   files     per overridden file: `original` (the export output the fix was made
 *             against) and `override` (the repository-authored replacement)
 *
 * During an export, output that still hashes to `original` is replaced by the
 * override. Output that already equals the override is kept (the fix reached
 * the course source; the entry can be removed). Any other output means the
 * course source changed underneath the fix, and the export stops so a
 * maintainer can reconcile both versions by hand.
 *
 * CLI (from the repository root):
 *   node scripts/course03/overrides.mjs capture [--baseline <git-revision>]
 *     Record every externally sourced published file that differs from its
 *     exported hash as an override, and refresh the override copies.
 *     --baseline reads the exported hashes from that revision's
 *     bundle-manifest.json (used once, to bootstrap the manifest).
 *   node scripts/course03/overrides.mjs check
 *     Fail when a published file changed without an override, or when an
 *     override copy, its manifest hash and the published file disagree.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WORKSHOP_RELATIVE = "packages/website/public/workshops/datenbereitschaft-fuer-ki";
export const OVERRIDES_RELATIVE = "scripts/course03/overrides";
const MANIFEST_NAME = "manifest.json";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Published files the repository writes itself; they never come from the course source. */
export function isRepositoryAuthored(name) {
  return (
    name === "guide.html" ||
    name === "builder.html" ||
    name === "demo.html" ||
    /^assets\/fonts\/Typing-(?:Regular|Medium|Bold)\.woff2$/.test(name) ||
    name === "card-preview.webp" ||
    name === "bundle-manifest.json" ||
    name === "PUBLICATION.md" ||
    name === "data-readiness-kit.zip" ||
    name === "data-readiness-kit/README.md" ||
    name === "data-readiness-kit/ASSET-RIGHTS.md" ||
    name.startsWith("data-readiness-kit/builder/")
  );
}

function assertSafeName(name) {
  if (path.isAbsolute(name) || name.split("/").includes("..") || name.includes("\\") || name === MANIFEST_NAME) {
    throw new Error(`Unsafe override path: ${name}`);
  }
}

const sortObject = (object) => Object.fromEntries(Object.entries(object).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

export function loadOverrides(root) {
  const dir = path.join(root, OVERRIDES_RELATIVE);
  const manifestPath = path.join(dir, MANIFEST_NAME);
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : { version: 1, exported: {}, files: {} };
  if (manifest.version !== 1 || typeof manifest.files !== "object" || typeof manifest.exported !== "object") {
    throw new Error("Unsupported override manifest");
  }
  const entries = new Map(Object.entries(manifest.files));
  for (const name of [...entries.keys(), ...Object.keys(manifest.exported)]) assertSafeName(name);
  return {
    dir,
    manifest,
    entries,
    read(name) {
      const bytes = readFileSync(path.join(dir, name));
      if (sha256(bytes) !== entries.get(name).override) {
        throw new Error(`Override ${OVERRIDES_RELATIVE}/${name} does not match its manifest hash. Run: node scripts/course03/overrides.mjs capture`);
      }
      return bytes;
    },
  };
}

export function writeManifest(root, { exported, files }) {
  mkdirSync(path.join(root, OVERRIDES_RELATIVE), { recursive: true });
  writeFileSync(
    path.join(root, OVERRIDES_RELATIVE, MANIFEST_NAME),
    `${JSON.stringify({ version: 1, exported: sortObject(exported), files: sortObject(files) }, null, 2)}\n`,
  );
}

/**
 * Resolve the bytes to publish for one exported file.
 * Returns { bytes, status } where status is "none", "applied" or "upstreamed".
 */
export function resolveOverride(overrides, name, exported) {
  const entry = overrides.entries.get(name);
  if (!entry) return { bytes: exported, status: "none" };
  const hash = sha256(exported);
  if (hash === entry.original) return { bytes: overrides.read(name), status: "applied" };
  if (hash === entry.override) return { bytes: exported, status: "upstreamed" };
  throw new Error(
    `The course source changed ${name} since its repository override was recorded ` +
      `(export ${hash.slice(0, 12)}, recorded original ${entry.original.slice(0, 12)}, override ${entry.override.slice(0, 12)}). ` +
      `Reconcile ${OVERRIDES_RELATIVE}/${name} with the new export by hand, then set its "original" in ${OVERRIDES_RELATIVE}/${MANIFEST_NAME} to the new export hash.`,
  );
}

function publishedBytes(root, name) {
  return readFileSync(path.join(root, WORKSHOP_RELATIVE, name));
}

function overrideCopies(dir, prefix = "") {
  if (!existsSync(path.join(dir, prefix))) return [];
  return readdirSync(path.join(dir, prefix), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? overrideCopies(dir, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
  ).filter((name) => name !== MANIFEST_NAME);
}

export function capture(root, baseline) {
  const { dir, manifest } = loadOverrides(root);
  let exported = manifest.exported;
  if (baseline) {
    const record = JSON.parse(
      execFileSync("git", ["show", `${baseline}:${WORKSHOP_RELATIVE}/bundle-manifest.json`], { cwd: root, encoding: "utf8" }),
    );
    exported = Object.fromEntries(record.files.filter(({ path: name }) => !isRepositoryAuthored(name)).map(({ path: name, sha256: hash }) => [name, hash]));
  }
  if (!Object.keys(exported).length) throw new Error("No exported hashes recorded; run capture --baseline <git-revision> once.");
  const files = {};
  for (const [name, original] of Object.entries(exported)) {
    const current = publishedBytes(root, name);
    const hash = sha256(current);
    if (hash === original) continue;
    files[name] = { original: manifest.files[name]?.original ?? original, override: hash };
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), current);
  }
  for (const stale of overrideCopies(dir).filter((name) => !files[name])) rmSync(path.join(dir, stale));
  writeManifest(root, { exported, files });
  return Object.keys(files).length;
}

export function check(root) {
  const overrides = loadOverrides(root);
  const { exported } = overrides.manifest;
  const problems = [];
  if (!Object.keys(exported).length) problems.push("manifest records no exported files");
  for (const [name, hash] of Object.entries(exported)) {
    if (isRepositoryAuthored(name)) problems.push(`${name}: repository-authored files are not exported from the course source`);
    if (!existsSync(path.join(root, WORKSHOP_RELATIVE, name))) {
      problems.push(`${name}: exported file is missing from the published folder`);
      continue;
    }
    const published = publishedBytes(root, name);
    const entry = overrides.entries.get(name);
    if (!entry) {
      if (sha256(published) !== hash) problems.push(`${name}: published file changed without an override. Run: node scripts/course03/overrides.mjs capture`);
      continue;
    }
    if (hash === entry.override) problems.push(`${name}: the course source now contains this override; remove its entry and copy`);
    else if (entry.original !== hash) problems.push(`${name}: override original does not match the recorded export`);
    if (entry.original === entry.override) problems.push(`${name}: override equals the original`);
    try {
      if (!overrides.read(name).equals(published)) problems.push(`${name}: published file differs from its override. Run: node scripts/course03/overrides.mjs capture`);
    } catch (error) {
      problems.push(error.message);
    }
  }
  for (const name of overrides.entries.keys()) if (!(name in exported)) problems.push(`${name}: override for a file the export does not write`);
  for (const name of overrideCopies(overrides.dir)) if (!overrides.entries.has(name)) problems.push(`${name}: stray file in ${OVERRIDES_RELATIVE}`);
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const [command, flag, revision] = process.argv.slice(2);
  if (command === "capture" && (!flag || (flag === "--baseline" && revision))) {
    console.log(`Recorded ${capture(root, revision)} overrides.`);
  } else if (command === "check") {
    const problems = check(root);
    if (problems.length) {
      console.error(problems.join("\n"));
      process.exit(1);
    }
    console.log("Overrides match the published files.");
  } else {
    console.error("Usage: node scripts/course03/overrides.mjs capture [--baseline <git-revision>] | check");
    process.exit(2);
  }
}
