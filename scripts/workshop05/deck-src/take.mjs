/**
 * Recorded Claude runs for the Workshop 05 deck. The recordings are real runs of Claude Code (claude-recording/v1),
 * made by scripts/demos/record-claude-run.mjs and never edited. This module reads the accepted ones at build time and
 * turns a turn's answer into display rows, without changing one character of it:
 *
 *   takes.json                 {"en":{"chain":"en-chain-1","register":"en-register-1"},"de":{...}}  (written when a take is accepted)
 *   claude-runs/<id>.json      the recording; chain turn 0 = step 1, follow_ups[0] = step 2, follow_ups[1] = step 3;
 *                              register turn 0 = step 4, follow_ups[0] = the question about E-07.
 *
 * No takes.json, or no entry for a locale and recording, means "no accepted take yet": the slides then show the labelled
 * empty frame. An entry whose recording file is missing or does not fit the slot is an error, never a fallback.
 * The helpers modelName and recordedOn equal the ones of packages/website/src/lib/claude-runs.ts (checked by a test).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turnMismatches } from "../recordings/check-take.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");
export const TAKES_DIR = path.join(REPO, "packages/website/src/lib/demo-cases/audit-vorbereitung-mit-ki/claude-runs");
export const TAKES_JSON = path.join(HERE, "takes.json");
/** Words per display row (the deck rule allows 16; 11 fill one window line at 27 px). */
export const WORDS_PER_ROW = 11;
export const MAX_LINES = 16;

/** "claude-opus-5-5" to "Claude Opus 5.5"; an unknown id is shown as it is (the website's rule). */
export function modelName(id) {
  const match = /^claude-(opus|sonnet|haiku|fable)-(\d+)-(\d+)(?:-\d{8})?$/.exec(id);
  if (!match) return id;
  return `Claude ${match[1].charAt(0).toUpperCase()}${match[1].slice(1)} ${match[2]}.${match[3]}`;
}

/** The recording date as the website prints it: "26.10.2026" / "26 October 2026" (UTC, never "now"). */
export function recordedOn(iso, locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (locale === "de") {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
  }
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** The slots of a recording: which turns the deck shows, in order. */
export const SLOTS = { chain: ["step1", "step2", "step3"], register: ["step4", "ask"] };

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/**
 * The accepted recordings of one locale: { chain, register }, each a recording object or null.
 * `options.takesJson` and `options.dir` exist for tests and for trying a build on scratch recordings.
 */
export function loadTakes(lang, options = {}) {
  const takesJson = options.takesJson ?? process.env.W05_TAKES_JSON ?? TAKES_JSON;
  const dir = options.dir ?? process.env.W05_TAKES_DIR ?? TAKES_DIR;
  const out = { chain: null, register: null };
  if (!existsSync(takesJson)) return out;
  const listed = readJson(takesJson)[lang] ?? {};
  for (const key of Object.keys(SLOTS)) {
    const id = listed[key];
    if (!id) continue;
    const file = path.join(dir, `${id}.json`);
    if (!existsSync(file)) throw new Error(`takes.json names ${id} for ${lang} ${key}, but ${path.relative(REPO, file)} does not exist`);
    const recording = readJson(file);
    fits(recording, { id, lang, key });
    out[key] = recording;
  }
  return out;
}

/** A recording must be the one the slot names; the deck never guesses. */
export function fits(recording, { id, lang, key }) {
  const where = `take ${id}`;
  if (recording.schema !== "claude-recording/v1") throw new Error(`${where}: schema ${recording.schema}`);
  if (recording.id !== id) throw new Error(`${where}: the file holds ${recording.id}`);
  if (recording.locale !== lang) throw new Error(`${where}: locale ${recording.locale}, the slot is ${lang}`);
  if (recording.prompt_id !== key) throw new Error(`${where}: prompt ${recording.prompt_id}, the slot is ${key}`);
  if (recording.edited !== false) throw new Error(`${where}: edited is not the literal false`);
  const need = SLOTS[key].length - 1;
  if ((recording.follow_ups ?? []).length < need) throw new Error(`${where}: ${(recording.follow_ups ?? []).length} follow-ups, the deck shows ${need}`);
}

/** The turn a slide shows: slot "step1" and "step4" are turn 0, "step2" and "ask" the first follow-up, "step3" the second. */
export function turnOf(recording, key, slot) {
  const index = SLOTS[key].indexOf(slot);
  if (index < 0) throw new Error(`no slot ${slot} in ${key}`);
  return index === 0 ? recording : recording.follow_ups[index - 1];
}

const timeline = (turn) => turn.timeline ?? [];

/** What the take did besides talking: "script" for a run of code, "file" for a written or changed file. */
export function toolsOf(turn) {
  const tools = new Set();
  for (const item of timeline(turn)) {
    if (item.kind !== "tool_use") continue;
    if (/^(bash|python|shell)/i.test(item.tool)) tools.add("script");
    else if (/^(write|edit|multiedit|notebookedit)/i.test(item.tool)) tools.add("file");
  }
  return ["script", "file"].filter((t) => tools.has(t));
}

/** Names of the files a recording produced (base names), in the recorder's order. */
export function producedNames(recording) {
  return (recording.produced_files ?? []).map((f) => String(f.name).split("/").pop());
}

/** The chip of a take: "recorded <date>, <model>", or "recorded <date>, differs from the key" (the model is dropped). */
export function chipText(recording, lang, differs, copy) {
  const date = recordedOn(recording.recorded_at, lang);
  return differs ? copy.chipDiff.replace("{date}", date) : copy.chipSame.replace("{date}", date).replace("{model}", modelName(recording.model));
}

/* ── rows ─────────────────────────────────────────────────────────────── */

/** A row check.py prints: an id, then three cells divided by " | " (no leading pipe, so not a markdown table). */
export const PIPE_ROW = /^\s*L\d{2} \| [^|]+ \| [^|]+ \| /;

/** A markdown pipe row: its cells, trimmed. */
const cellsOf = (line) => {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
};
const isSeparator = (cells) => cells.every((cell) => /^:?-{2,}:?$/.test(cell));
const wordsIn = (text) => text.split(/\s+/).filter(Boolean);

/**
 * A line longer than `limit` words, cut at spaces into rows of about equal length (display only: the rows join back to the line).
 * At 27 px a row of 11 words is one line of the window, so a row never wraps and never leaves a one-word orphan row.
 */
export function wrapLine(line, limit = WORDS_PER_ROW) {
  const parts = line.trim().split(/(\s+)/);
  const words = parts.filter((part) => part && !/^\s+$/.test(part)).length;
  const rowCount = Math.max(1, Math.ceil(words / limit));
  const per = Math.ceil(words / rowCount);
  const rows = [];
  let current = "";
  let count = 0;
  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      if (count > 0) current += part;
      continue;
    }
    if (count === per) {
      rows.push(current.replace(/\s+$/, ""));
      current = "";
      count = 0;
    }
    current += part;
    count += 1;
  }
  if (current.trim()) rows.push(current.replace(/\s+$/, ""));
  return rows;
}

/**
 * The display rows of an answer: { kind: "line", line, rows } for text (one entry per recorded line, rows are its wrapped
 * parts) and { kind: "table", header, body, lines } for a run of pipe lines. Empty lines are not rows. The text of every
 * entry is the recorded text, nothing added or changed.
 */
export function takeRows(text, limit = WORDS_PER_ROW) {
  const lines = String(text).replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
  if (lines.length > MAX_LINES) throw new Error(`a take answer has ${lines.length} lines, the deck shows at most ${MAX_LINES}`);
  const entries = [];
  for (let i = 0; i < lines.length; ) {
    if (lines[i].trim().startsWith("|")) {
      const run = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) run.push(lines[i++]);
      const rows = run.map(cellsOf).filter((cells) => !isSeparator(cells));
      entries.push({ kind: "table", header: rows[0] ?? [], body: rows.slice(1), lines: run });
    } else {
      // a script row ("L05 | rule | count | detail") stays one row: it is drawn as a four-column grid row, never cut
      entries.push({ kind: "line", line: lines[i], rows: PIPE_ROW.test(lines[i]) ? [lines[i].trim()] : wrapLine(lines[i], limit) });
      i += 1;
    }
  }
  return entries;
}

/** Number of recorded lines (a table counts its pipe lines, wrapped rows do not add). */
export const lineCount = (text) => String(text).split("\n").filter((l) => l.trim() !== "").length;

/** The text of an answer as the page shows it: the rows joined, for the display test. */
export function shownText(entries) {
  return entries
    .flatMap((e) => (e.kind === "table" ? [[e.header, ...e.body].map((r) => r.join(" | ")).join("\n")] : [e.rows.join(" ")]))
    .join("\n");
}

/** The first row that names a finding (a finding id, a checklist line or a person id): it gets the sage highlight on step 2. */
export function findingLine(entries) {
  for (const [index, e] of entries.entries()) {
    if (e.kind === "line" && /\b(?:F\d{1,2}|L\d\d|E-\d\d)\b/.test(e.line)) return index;
  }
  return -1;
}

/** The status of each checklist line a step 3 answer prints ("L01 COVERED: ..." or "L01 BELEGT: ..."), in the order printed. */
export function statusLines(text) {
  const words = { covered: /\b(COVERED|BELEGT)\b/, weak: /\b(WEAK|SCHWACH)\b/, gap: /\b(GAP|LÜCKE)\b/ };
  const out = [];
  for (const line of String(text).split("\n")) {
    const id = /^\s*(L\d\d)\b/.exec(line)?.[1];
    if (!id) continue;
    const rest = line.slice(line.indexOf(id) + id.length);
    const hits = Object.entries(words).map(([status, re]) => [status, rest.search(re)]).filter(([, at]) => at >= 0).sort((a, b) => a[1] - b[1]);
    if (hits.length) out.push({ id, status: hits[0][0] });
  }
  return out;
}

/* ── comparison with the key ─────────────────────────────────────────── */

/**
 * Compares one turn of a recording with the key. Returns [] when the take agrees, else the differences, each { code, got, what }:
 * `code` picks the phrase the slide prints after "This run:", `got` is what the take printed. The reading of the numbers is the
 * acceptance checker's own (recordings/check-take.mjs turnMismatches), never a second parser, so the deck and the checker
 * can not disagree about a take.
 */
export function compareWithKey(recording, slot, options = {}) {
  return turnMismatches(recording, slot, options).map((m) => ({ code: codeOf(m.what), what: m.what, expected: m.expected, got: String(m.got).split(", ")[0] }));
}

/** The copy key (take.diffs) that names a mismatch of the checker. */
export function codeOf(what) {
  if (what === "rows read") return "rowsRead";
  if (what === "findings") return "findings";
  if (what === "checked, no problem") return "checked";
  if (what === "status tally" || /^status of /.test(what)) return "tally";
  if (/^L\d\d says /.test(what)) return "owner";
  if (what === "papers on file for E-07") return "answer";
  return "register";
}
