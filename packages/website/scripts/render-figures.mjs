#!/usr/bin/env node
/**
 * render-figures.mjs
 *
 * Writes one static SVG per figure spec, at progress 1 with literal colours,
 * for the PDF engine. The same renderFigure(spec, progress) that draws the web
 * figure draws this file, so the book and the page cannot drift apart.
 *
 *   figures/<id>.json  ->  figures/<id>.svg   (and, with --csv, <id>.csv)
 *
 * Every spec is validated first (shape, then the privacy gate: no count of 1
 * to 4, no contact data, no paths). A spec that fails stops the run with exit
 * code 1 and nothing is written for it.
 *
 * Usage (from packages/website; Node 22.18+ runs the TypeScript sources as is):
 *   node scripts/render-figures.mjs                       default folders
 *   node scripts/render-figures.mjs --in <dir> --out <dir>
 *   node scripts/render-figures.mjs --csv                 also write the plotted data
 *   node scripts/render-figures.mjs --width 640           viewBox width, default 640
 *   node scripts/render-figures.mjs --check               write nothing; exit 1 when a file is stale
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { figureCsv } from "../src/lib/figures/data.ts";
import { renderStandaloneSvg } from "../src/lib/figures/export.ts";
import { findPrivacyFindings, parseFigureSpec } from "../src/lib/figures/validate.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DIR = join(ROOT, "content", "books", "ki-landschaft", "figures");

function parseArgs(argv) {
  const args = { in: DEFAULT_DIR, out: undefined, csv: false, check: false, width: 640 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--in") args.in = resolve(argv[++i] ?? "");
    else if (arg === "--out") args.out = resolve(argv[++i] ?? "");
    else if (arg === "--csv") args.csv = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--width") args.width = Number(argv[++i]);
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!Number.isFinite(args.width) || args.width < 280) throw new Error("--width must be a number of at least 280");
  args.out ??= args.in;
  return args;
}

/** Loads, validates and renders every figures/*.json; returns the files to write and the problems. */
export function buildFigureFiles(inDir, width = 640, withCsv = false) {
  const files = [];
  const problems = [];
  const names = existsSync(inDir) ? readdirSync(inDir).filter((f) => f.endsWith(".json")).sort() : [];
  for (const name of names) {
    try {
      const spec = parseFigureSpec(JSON.parse(readFileSync(join(inDir, name), "utf8")));
      if (`${spec.id}.json` !== name) throw new Error(`file name must be ${spec.id}.json`);
      const findings = findPrivacyFindings(spec);
      if (findings.length > 0) {
        throw new Error(`privacy gate: ${findings.map((f) => `${f.path || "spec"} (${f.reason})`).join("; ")}`);
      }
      files.push({ name: `${spec.id}.svg`, content: renderStandaloneSvg(spec, { width }) });
      if (withCsv) files.push({ name: `${spec.id}.csv`, content: figureCsv(spec) });
    } catch (error) {
      problems.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { files, problems, count: names.length };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { files, problems, count } = buildFigureFiles(args.in, args.width, args.csv);
  for (const problem of problems) console.error(`[ERROR] ${problem}`);
  if (problems.length > 0) process.exit(1);
  if (count === 0) {
    console.error(`[ERROR] no figure specs (*.json) in ${basename(args.in)}`);
    process.exit(1);
  }
  const stale = [];
  for (const file of files) {
    const target = join(args.out, file.name);
    const current = existsSync(target) ? readFileSync(target, "utf8") : null;
    if (current === file.content) continue;
    stale.push(file.name);
    if (!args.check) {
      mkdirSync(args.out, { recursive: true });
      writeFileSync(target, file.content);
    }
  }
  if (args.check) {
    if (stale.length > 0) {
      console.error(`[ERROR] stale figure files: ${stale.join(", ")}. Run node scripts/render-figures.mjs`);
      process.exit(1);
    }
    console.log(`figures up to date: ${files.length} files`);
    return;
  }
  console.log(`figures: ${count} specs, ${files.length} files, ${stale.length} written to ${args.out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
