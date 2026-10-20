#!/usr/bin/env node
/**
 * export-book-data.mjs
 *
 * Writes one CSV per figure spec: the plotted aggregates of the data book as a
 * download. Source and target are fixed by the book:
 *
 *   content/books/<slug>/figures/<id>.json  ->  public/books/<slug>/data/<id>.csv
 *
 * Same specs, same privacy gate and same table as the page ("Daten & Grenzen"
 * shows exactly these numbers). Plain UTF-8 without a byte order mark (the
 * publication scanner accepts canonical text only). Aggregates only; nothing
 * here reads a database.
 *
 * Usage (from packages/website; Node 22.18+ runs the TypeScript sources as is):
 *   node scripts/export-book-data.mjs                 write the files of ki-landschaft
 *   node scripts/export-book-data.mjs --book <slug>   another book
 *   node scripts/export-book-data.mjs --check         write nothing; exit 1 when a file is stale or missing
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { figureCsv } from "../src/lib/figures/data.ts";
import { findPrivacyFindings, parseFigureSpec } from "../src/lib/figures/validate.ts";

/** Reads a file once; a missing file is null. No exists-then-read race (CodeQL js/file-system-race). */
function readOrNull(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

/** Lists a directory once; a missing directory is an empty list. */
function listOrEmpty(path) {
  try {
    return readdirSync(path);
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}


const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { book: "ki-landschaft", check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--book") args.book = argv[++i] ?? "";
    else if (arg === "--check") args.check = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(args.book)) throw new Error("--book must be a book slug");
  return args;
}

/** The CSV files a book's figures produce: [{ name, content }]. Throws on a spec that fails validation. */
export function buildBookData(book, root = ROOT) {
  const dir = join(root, "content", "books", book, "figures");
  const names = listOrEmpty(dir).filter((f) => f.endsWith(".json")).sort();
  const files = [];
  for (const name of names) {
    const spec = parseFigureSpec(JSON.parse(readFileSync(join(dir, name), "utf8")));
    if (`${spec.id}.json` !== name) throw new Error(`${name}: file name must be ${spec.id}.json`);
    const findings = findPrivacyFindings(spec);
    if (findings.length > 0) {
      throw new Error(`${name}: privacy gate: ${findings.map((f) => `${f.path || "spec"} (${f.reason})`).join("; ")}`);
    }
    files.push({ name: `${spec.id}.csv`, content: figureCsv(spec) });
  }
  return files;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const out = join(ROOT, "public", "books", args.book, "data");
  let files;
  try {
    files = buildBookData(args.book);
  } catch (error) {
    console.error(`[ERROR] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.error(`[ERROR] no figure specs in content/books/${args.book}/figures`);
    process.exit(1);
  }
  const stale = [];
  for (const file of files) {
    const target = join(out, file.name);
    const current = readOrNull(target);
    if (current === file.content) continue;
    stale.push(file.name);
    if (!args.check) {
      mkdirSync(out, { recursive: true });
      writeFileSync(target, file.content);
    }
  }
  if (args.check) {
    if (stale.length > 0) {
      console.error(`[ERROR] stale data files: ${stale.join(", ")}. Run node scripts/export-book-data.mjs`);
      process.exit(1);
    }
    console.log(`book data up to date: ${files.length} files`);
    return;
  }
  console.log(`book data: ${files.length} CSV files, ${stale.length} written to public/books/${args.book}/data`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
