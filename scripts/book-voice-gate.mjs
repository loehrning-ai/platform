#!/usr/bin/env node
/**
 * book-voice-gate.mjs
 *
 * Voice gate for the "KI-Landschaft" book: runs the platform's
 * content-voice-rules (the same rules `content:lint` uses, here with the whole
 * book treated as strict scope) plus the structural slop checks of
 * book-voice-structure.mjs on content/books/ki-landschaft/**, and exits 1 when
 * a threshold is missed.
 *
 *   node scripts/book-voice-gate.mjs [--root packages/website] [--book content/books/ki-landschaft]
 *                                    [--json] [--warnings-fail]
 *
 * Structural checks run on the German chapters (NN_*.md directly in the book
 * folder; the en/ mirror and figure JSON get the platform voice rules only).
 * A passing gate proves nothing about voice; the owner's read is the gate.
 * Pure Node, no dependencies, no network, reads only below --root.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractProseUnits, collectLearnerFacingFiles } from "../packages/website/scripts/content-prose.mjs";
import {
  analyzeVoice,
  applyAllowlist,
  loadVoiceConfig,
  severityFor,
} from "../packages/website/scripts/content-voice-rules.mjs";
import { GATE, WARN, lintChapter } from "./book-voice-structure.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(here, "..", "packages", "website");
export const DEFAULT_BOOK = "content/books/ki-landschaft";
const CHAPTER_FILE = /^\d\d_[^/]+\.md$/;

function voiceConfig(websiteScripts, book) {
  const loaded = loadVoiceConfig({
    scopePath: path.join(websiteScripts, "content-lint.voice-scope.json"),
    allowlistPath: path.join(websiteScripts, "content-lint.allowlist.json"),
    formMapPath: path.join(websiteScripts, "content-lint.form-map.json"),
  });
  // The whole book is strict: every voice finding on it is an error.
  return { ...loaded, strict: [...loaded.strict, `${book}/`] };
}

/** Platform voice rules on the book's files. Returns { errors, warnings, configErrors }. */
export function runPlatformVoice({ root, book, config }) {
  const prefix = `${book}/`;
  const files = collectLearnerFacingFiles(root).filter((f) => f.startsWith(prefix));
  const units = files.map((rel) => extractProseUnits(rel, readFileSync(path.join(root, rel), "utf-8")));
  const findings = analyzeVoice(units, { formMap: config.formMap });
  const { kept } = applyAllowlist(findings, config.allowlist);
  const errors = [];
  const warnings = [];
  for (const item of kept) (severityFor(item, config.strict) === "error" ? errors : warnings).push(item);
  return { files, errors, warnings, configErrors: config.errors };
}

/** Structural checks on the German chapters. */
export function runStructure({ root, book }) {
  const dir = path.join(root, book);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => CHAPTER_FILE.test(f))
    .sort()
    .map((f) => lintChapter(readFileSync(path.join(dir, f), "utf-8"), f));
}

/** Runs everything; returns the full result without printing or exiting. */
export function runGate({ root = DEFAULT_ROOT, book = DEFAULT_BOOK, warningsFail = false, websiteScripts } = {}) {
  const scriptsDir = websiteScripts ?? path.join(DEFAULT_ROOT, "scripts");
  const voice = runPlatformVoice({ root, book, config: voiceConfig(scriptsDir, book) });
  const chapters = runStructure({ root, book });
  const structFailures = chapters.flatMap((c) => c.gate.failures.map((m) => `${c.file}: ${m}`));
  const structWarnings = chapters.flatMap((c) => c.gate.warnings.map((m) => `${c.file}: ${m}`));
  const failed =
    voice.errors.length > 0 ||
    voice.configErrors.length > 0 ||
    structFailures.length > 0 ||
    (warningsFail && (voice.warnings.length > 0 || structWarnings.length > 0));
  return {
    pass: !failed,
    book,
    files: voice.files.length,
    chapters: chapters.length,
    voice: { errors: voice.errors, warnings: voice.warnings, configErrors: voice.configErrors },
    structure: { failures: structFailures, warnings: structWarnings, chapters },
    thresholds: { gate: GATE, warn: WARN },
  };
}

function formatText(result) {
  const out = [];
  const where = (i) => `${i.relFile}:${i.line}`;
  for (const p of result.voice.configErrors) out.push(`CONFIG  ${p.file}: ${p.message}`);
  for (const i of result.voice.errors) out.push(`ERROR   ${where(i)} ${i.rule} ${i.message}`);
  for (const m of result.structure.failures) out.push(`ERROR   structure ${m}`);
  for (const i of result.voice.warnings) out.push(`WARN    ${where(i)} ${i.rule} ${i.message}`);
  for (const m of result.structure.warnings) out.push(`WARN    structure ${m}`);
  out.push(
    `book-voice-gate: ${result.files} files, ${result.chapters} chapters, ` +
      `${result.voice.errors.length + result.structure.failures.length + result.voice.configErrors.length} error(s), ` +
      `${result.voice.warnings.length + result.structure.warnings.length} warning(s): ${result.pass ? "PASS" : "FAIL"}`,
  );
  return out.join("\n");
}

function parseArgs(argv) {
  const opts = { root: DEFAULT_ROOT, book: DEFAULT_BOOK, json: false, warningsFail: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") opts.root = path.resolve(argv[++i]);
    else if (a === "--book") opts.book = argv[++i].replace(/\/$/, "");
    else if (a === "--json") opts.json = true;
    else if (a === "--warnings-fail") opts.warningsFail = true;
    else {
      console.error(`book-voice-gate: unknown argument ${a}`);
      process.exit(2);
    }
  }
  return opts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opts = parseArgs(process.argv.slice(2));
  const result = runGate(opts);
  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else console.log(formatText(result));
  process.exit(result.pass ? 0 : 1);
}
