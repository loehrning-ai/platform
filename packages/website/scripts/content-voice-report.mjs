#!/usr/bin/env node
/**
 * content-voice-report.mjs
 *
 * Per-file voice metrics for learner-facing prose: sentence count, mean and
 * standard deviation of sentence length (words), share of paragraphs with
 * more than five sentences, list-size histogram and share of three-item
 * lists, banned-phrase hits (the lint's tables, allowlist applied), connector
 * counts and Du/Sie counts. File discovery, prose extraction and rule tables
 * are shared with content-lint.mjs, so both tools agree on what counts.
 *
 * Usage:
 *   bun run content:voice-report -- [--markdown | --json] [--verbose]
 *       [--baseline <git ref>] [--paths <glob or dir>[,<more>]]...
 *       [--changed-since <git ref>] [--list]
 *
 *   --markdown         summary table per surface (default output)
 *   --verbose          add one row per file
 *   --json             machine-readable output instead of Markdown
 *   --baseline <ref>   compute the same metrics on `git show <ref>:<path>`
 *                      and print before -> after; files missing at the
 *                      baseline are marked new
 *   --paths <list>     restrict to files matching a directory prefix or glob
 *                      (relative to packages/website), repeatable
 *   --changed-since    restrict to learner-facing files changed against the
 *                      ref (three-dot diff plus the working tree)
 *   --list             print the selected files, one per line, and exit
 *
 * Surfaces: content/<course>[/en], content/books/<book>[/en], src/lib/<course>[/de]
 * and "copy modules". The report never fails the build; exit code 2 marks a
 * usage error.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectLearnerFacingFiles,
  extractProseUnits,
  isLearnerFacingFile,
} from "./content-prose.mjs";
import {
  analyzeVoice,
  applyAllowlist,
  computeVoiceMetrics,
  loadVoiceConfig,
} from "./content-voice-rules.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const VOICE_CONFIG_PATHS = {
  scopePath: join(__dirname, "content-lint.voice-scope.json"),
  allowlistPath: join(__dirname, "content-lint.allowlist.json"),
  formMapPath: join(__dirname, "content-lint.form-map.json"),
};

/** Rules counted as banned-phrase hits (form and structure are shown separately). */
export const BAN_RULES = new Set([
  "VOICE-OPENER",
  "VOICE-FILLER",
  "VOICE-HEDGE",
  "VOICE-TRANSITION",
  "VOICE-CLAIM",
  "VOICE-COUNT-COURSE",
  "VOICE-COUNT-LESSON",
]);

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const options = {
    json: false,
    markdown: false,
    verbose: false,
    list: false,
    help: false,
    baseline: null,
    changedSince: null,
    paths: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--json") options.json = true;
    else if (arg === "--markdown") options.markdown = true;
    else if (arg === "--verbose") options.verbose = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--baseline" || arg === "--changed-since" || arg === "--paths") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${arg} needs a value`);
      }
      i++;
      if (arg === "--baseline") options.baseline = value;
      else if (arg === "--changed-since") options.changedSince = value;
      else options.paths.push(...value.split(",").map((p) => p.trim()).filter(Boolean));
    } else if (arg.startsWith("--paths=")) {
      options.paths.push(...arg.slice(8).split(",").map((p) => p.trim()).filter(Boolean));
    } else if (arg.startsWith("--baseline=")) options.baseline = arg.slice(11);
    else if (arg.startsWith("--changed-since=")) options.changedSince = arg.slice(16);
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!options.json) options.markdown = true;
  return options;
}

/** Converts a directory prefix or a glob (`*`, `**`) into a path matcher. */
export function pathMatcher(spec) {
  const normalized = spec.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!/[*?]/.test(normalized)) {
    const prefix = normalized.replace(/\/$/, "");
    return (relFile) => relFile === prefix || relFile.startsWith(`${prefix}/`);
  }
  const source = normalized
    .split("**")
    .map((part) =>
      part
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, "[^/]"),
    )
    .join(".*");
  const re = new RegExp(`^${source}$`);
  return (relFile) => re.test(relFile);
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function repoRoot(root) {
  try {
    return git(["rev-parse", "--show-toplevel"], root).trim();
  } catch {
    return null;
  }
}

/** Website-relative learner-facing files changed against `ref` (plus the working tree). */
export function changedLearnerFiles(ref, root = ROOT) {
  const top = repoRoot(root);
  if (top === null) throw new Error("not a git checkout; --changed-since needs git");
  const websitePrefix = relative(top, root).replaceAll("\\", "/");
  const outputs = [
    git(["diff", "--name-only", `${ref}...HEAD`], top),
    git(["diff", "--name-only", "HEAD"], top),
    git(["ls-files", "--others", "--exclude-standard"], top),
  ];
  const files = new Set();
  for (const output of outputs) {
    for (const line of output.split("\n")) {
      const path = line.trim();
      if (path === "") continue;
      const rel = websitePrefix === "" ? path : path.startsWith(`${websitePrefix}/`) ? path.slice(websitePrefix.length + 1) : null;
      if (rel !== null && isLearnerFacingFile(rel) && existsSync(join(root, rel))) {
        files.add(rel);
      }
    }
  }
  return [...files].sort();
}

function baselineText(ref, relFile, root) {
  const top = repoRoot(root);
  if (top === null) return null;
  const repoRel = relative(top, join(root, relFile)).replaceAll("\\", "/");
  try {
    return git(["show", `${ref}:${repoRel}`], top);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Corpus analysis
// ---------------------------------------------------------------------------

/**
 * Analyses `{ relFile, text }` entries with the lint's rules and returns a
 * Map relFile -> { unit, metrics, bans, terms, findingsByRule }.
 */
export function analyzeCorpus(entries, config) {
  const units = entries
    .map(({ relFile, text }) => extractProseUnits(relFile, text))
    .sort((a, b) => a.relFile.localeCompare(b.relFile));
  const findings = analyzeVoice(units, { formMap: config.formMap });
  const { kept } = applyAllowlist(findings, config.allowlist);
  const byFile = new Map();
  for (const unit of units) {
    byFile.set(unit.relFile, {
      unit,
      metrics: computeVoiceMetrics(unit),
      bans: 0,
      terms: 0,
      findingsByRule: {},
    });
  }
  for (const item of kept) {
    const row = byFile.get(item.relFile);
    if (!row) continue;
    row.findingsByRule[item.rule] = (row.findingsByRule[item.rule] ?? 0) + 1;
    if (BAN_RULES.has(item.rule)) row.bans++;
    if (item.rule === "VOICE-TERM") row.terms++;
  }
  return byFile;
}

const EMPTY_AGGREGATE = () => ({
  files: 0,
  newFiles: 0,
  words: 0,
  sentences: 0,
  sentenceLengthSum: 0,
  sentenceLengthSumSq: 0,
  paragraphs: 0,
  longParagraphs: 0,
  lists: 0,
  threeItemLists: 0,
  bans: 0,
  terms: 0,
  connectors: 0,
  du: 0,
  sie: 0,
});

function addRow(aggregate, row) {
  const m = row.metrics;
  aggregate.files++;
  aggregate.words += m.words;
  aggregate.sentences += m.sentences;
  aggregate.sentenceLengthSum += m.sentenceLengthSum;
  aggregate.sentenceLengthSumSq += m.sentenceLengthSumSq;
  aggregate.paragraphs += m.paragraphs;
  aggregate.longParagraphs += m.longParagraphs;
  aggregate.lists += m.lists;
  aggregate.threeItemLists += m.threeItemLists;
  aggregate.bans += row.bans;
  aggregate.terms += row.terms;
  aggregate.connectors += m.connectorTotal;
  aggregate.du += m.du;
  aggregate.sie += m.sie;
}

/** Derived values for an aggregate: mean, sd and shares. */
export function finishAggregate(aggregate) {
  const n = aggregate.sentences;
  const mean = n === 0 ? 0 : aggregate.sentenceLengthSum / n;
  const variance = n === 0 ? 0 : Math.max(0, aggregate.sentenceLengthSumSq / n - mean * mean);
  return {
    ...aggregate,
    sentenceLengthMean: mean,
    sentenceLengthSd: Math.sqrt(variance),
    longParagraphShare: aggregate.paragraphs === 0 ? 0 : aggregate.longParagraphs / aggregate.paragraphs,
    threeItemListShare: aggregate.lists === 0 ? 0 : aggregate.threeItemLists / aggregate.lists,
  };
}

/**
 * Groups current (and optional baseline) rows by surface and appends a Total
 * row. Files absent from the baseline count as new and are excluded from the
 * baseline aggregate.
 */
export function aggregateBySurface(current, baseline) {
  const surfaces = new Map();
  for (const [relFile, row] of current) {
    const key = row.unit.surface;
    if (!surfaces.has(key)) {
      surfaces.set(key, { surface: key, current: EMPTY_AGGREGATE(), baseline: baseline ? EMPTY_AGGREGATE() : null });
    }
    const entry = surfaces.get(key);
    addRow(entry.current, row);
    if (baseline) {
      const before = baseline.get(relFile);
      if (before) addRow(entry.baseline, before);
      else entry.current.newFiles++;
    }
  }
  const rows = [...surfaces.values()].sort((a, b) => a.surface.localeCompare(b.surface));
  const total = { surface: "Total", current: EMPTY_AGGREGATE(), baseline: baseline ? EMPTY_AGGREGATE() : null };
  for (const row of rows) {
    for (const key of Object.keys(total.current)) total.current[key] += row.current[key];
    if (baseline) for (const key of Object.keys(total.baseline)) total.baseline[key] += row.baseline[key];
  }
  rows.push(total);
  return rows.map((row) => ({
    surface: row.surface,
    current: finishAggregate(row.current),
    baseline: row.baseline ? finishAggregate(row.baseline) : null,
  }));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const fixed = (value, digits = 1) => Number(value).toFixed(digits);
const percent = (value) => `${Math.round(value * 100)}%`;

function cell(before, after, format) {
  if (before === null || before === undefined) return format(after);
  const left = format(before);
  const right = format(after);
  return left === right ? right : `${left} -> ${right}`;
}

function metricCells(before, after) {
  return [
    cell(before?.sentenceLengthMean, after.sentenceLengthMean, fixed),
    cell(before?.sentenceLengthSd, after.sentenceLengthSd, fixed),
    cell(before?.longParagraphShare, after.longParagraphShare, percent),
    cell(before?.threeItemListShare, after.threeItemListShare, percent),
    cell(before?.bans, after.bans, String),
    cell(before?.connectors ?? before?.connectorTotal, after.connectors ?? after.connectorTotal, String),
    `${cell(before?.du, after.du, String)} / ${cell(before?.sie, after.sie, String)}`,
  ];
}

function table(header, rows) {
  const line = (cells) => `| ${cells.join(" | ")} |`;
  return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
}

/** Markdown summary table per surface (before -> after when a baseline is set). */
export function renderSummaryMarkdown(surfaceRows, { baseline = null } = {}) {
  const header = ["Surface", "Files", "Words", "Sentences", "Mean len", "SD len", "Para > 5", "Lists = 3", "Bans", "Connectors", "Du / Sie"];
  const rows = surfaceRows.map(({ surface, current, baseline: before }) => [
    surface === "Total" ? "**Total**" : surface,
    current.newFiles > 0 ? `${current.files} (${current.newFiles} new)` : String(current.files),
    cell(before?.words, current.words, String),
    cell(before?.sentences, current.sentences, String),
    ...metricCells(before, current),
  ]);
  const title = baseline ? `Voice report (baseline \`${baseline}\`; cells show before -> after)` : "Voice report";
  return `### ${title}\n\n${table(header, rows)}`;
}

/** Markdown rows per file; a file missing at the baseline is marked new. */
export function renderFilesMarkdown(current, baseline) {
  const header = ["File", "Lang", "Form", "Words", "Sentences", "Mean len", "SD len", "Para > 5", "Lists = 3", "Bans", "Connectors", "Du / Sie"];
  const rows = [];
  for (const [relFile, row] of [...current].sort(([a], [b]) => a.localeCompare(b))) {
    const before = baseline ? baseline.get(relFile) : null;
    const beforeMetrics = before ? { ...before.metrics, bans: before.bans, connectors: before.metrics.connectorTotal } : null;
    const afterMetrics = { ...row.metrics, bans: row.bans, connectors: row.metrics.connectorTotal };
    rows.push([
      baseline && !before ? `${relFile} (new)` : relFile,
      row.unit.lang,
      row.metrics.form,
      cell(beforeMetrics?.words, afterMetrics.words, String),
      cell(beforeMetrics?.sentences, afterMetrics.sentences, String),
      ...metricCells(beforeMetrics, afterMetrics),
    ]);
  }
  return `#### Files\n\n${table(header, rows)}`;
}

function jsonRow(row) {
  return {
    ...row.metrics,
    bans: row.bans,
    terms: row.terms,
    findingsByRule: row.findingsByRule,
  };
}

export function renderJson(current, baseline, surfaceRows, options) {
  return {
    baseline: options.baseline,
    surfaces: surfaceRows,
    files: [...current].sort(([a], [b]) => a.localeCompare(b)).map(([relFile, row]) => ({
      relFile,
      surface: row.unit.surface,
      lang: row.unit.lang,
      newAtBaseline: baseline ? !baseline.has(relFile) : null,
      current: jsonRow(row),
      baseline: baseline?.get(relFile) ? jsonRow(baseline.get(relFile)) : null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function selectFiles(options, root) {
  let files = options.changedSince
    ? changedLearnerFiles(options.changedSince, root)
    : collectLearnerFacingFiles(root);
  if (options.paths.length > 0) {
    const matchers = options.paths.map((spec) => {
      const rel = isAbsolute(spec) ? relative(root, spec) : spec;
      return pathMatcher(rel.replaceAll("\\", "/"));
    });
    files = files.filter((relFile) => matchers.some((matches) => matches(relFile)));
  }
  return files;
}

export function buildReport(options, root = ROOT) {
  const config = loadVoiceConfig(VOICE_CONFIG_PATHS);
  const files = selectFiles(options, root);
  const current = analyzeCorpus(
    files.map((relFile) => ({ relFile, text: readFileSync(join(root, relFile), "utf-8") })),
    config,
  );
  let baseline = null;
  if (options.baseline) {
    const entries = [];
    for (const relFile of files) {
      const text = baselineText(options.baseline, relFile, root);
      if (text !== null) entries.push({ relFile, text });
    }
    baseline = analyzeCorpus(entries, config);
  }
  const surfaceRows = aggregateBySurface(current, baseline);
  return { config, files, current, baseline, surfaceRows };
}

function main(argv) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (cause) {
    console.error(`content-voice-report: ${cause.message}`);
    return 2;
  }
  if (options.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf-8").split("*/")[0]);
    return 0;
  }
  if (options.list) {
    for (const relFile of selectFiles(options, ROOT)) console.log(relFile);
    return 0;
  }
  const report = buildReport(options, ROOT);
  for (const problem of report.config.errors) {
    console.error(`content-voice-report: ${problem.file}: ${problem.message}`);
  }
  if (report.files.length === 0) {
    console.log(options.changedSince ? `No learner-facing files changed since ${options.changedSince}.` : "No learner-facing files selected.");
    return 0;
  }
  if (options.json) {
    console.log(JSON.stringify(renderJson(report.current, report.baseline, report.surfaceRows, options), null, 2));
    return 0;
  }
  const sections = [renderSummaryMarkdown(report.surfaceRows, { baseline: options.baseline })];
  if (options.verbose) sections.push(renderFilesMarkdown(report.current, report.baseline));
  console.log(sections.join("\n\n"));
  return 0;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
