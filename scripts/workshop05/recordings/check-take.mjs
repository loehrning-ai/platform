#!/usr/bin/env node
/**
 * The acceptance rule for a recorded take of Workshop 05 (rules 1 to 11), as code.
 *
 *   node scripts/workshop05/recordings/check-take.mjs en-chain-1            check one stored take (claude-runs/, rejected/ or replaced/)
 *   node scripts/workshop05/recordings/check-take.mjs --all                 check every take in claude-runs/
 *   node scripts/workshop05/recordings/check-take.mjs --select              print the takes.json proposal (lowest accepted take per language and recording)
 *   node scripts/workshop05/recordings/check-take.mjs --set-aside en-chain-2 --reason "ran clean, but take 1 was chosen"
 *   node scripts/workshop05/recordings/check-take.mjs en-register-1 --run-check-py   also run the take's check.py in a temp folder (python3 -I, informational)
 *
 * Exit code 0: accepted. 1: not accepted. 3: only numbers or statuses differ from the key (the take may
 * be shown with the chip "differs from the key", the recording plan). The key comes from oracle/expected.json and
 * the oracle (buildRegister), never from a take. A take is never edited: set-aside only moves its files.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RECORDING_FORBIDDEN, validateRecording } from "../../../packages/website/src/lib/claude-runs.ts";
import { REGISTER_TODAY, askPerson, buildRegister } from "../oracle/oracle.mjs";
import { loadKitFiles } from "../oracle/load.mjs";
import { LOCALES, MAX_TAKES, PROMPT_IDS, RECORDINGS, RUNS_DIR, SKILL } from "./recipe.mjs";
import { promptsFromZip } from "./extract-prompts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXPECTED = JSON.parse(readFileSync(path.join(HERE, "../oracle/expected.json"), "utf8"));

/** Words and characters a take must not print (the acceptance rule rule 10); the deck's own BANNED list is added when it can be loaded. */
export const BANNED = [
  /[‒-―]/,
  /[←-⇿⟵-⟷⬅-⬇➔➜]|->/,
  /\b(by friday|bis freitag|freitag|friday|your boss|dein chef|chef|boss|urgent|dringend|countdown|deadline|game[- ]changer|seamless|nahtlos|magisch|revolution\w*|revolutionär\w*|leverage|unlock|empower|robust|delve|logo|score|punkte|figures?)\b/i,
  /\b(stamp|stempel)/i,
  /(\bnon-compliant|\bcompliant\b|konform\w*|Richtig!|Super\.|überrasch|surprise|\bfuer\b)/i,
];

// Rule 9: at least three distinct function words of the locale. A terse answer ("E-07 has five rows. The office manager owns all five.") is still plainly English,
// so the list is longer than the recording plan's first five words; a text in the other language still hits none of them.
const LANGUAGE_WORDS = {
  de: ["und", "der", "die", "das", "nicht", "ist", "sind", "für", "von", "mit", "ein", "eine", "es", "zu", "auf", "den", "dem", "hat", "wird"],
  en: ["the", "and", "not", "is", "are", "of", "for", "in", "to", "on", "it", "has", "with", "this", "which"],
};
const STATUS_WORDS = { en: ["COVERED", "WEAK", "GAP"], de: ["BELEGT", "SCHWACH", "LÜCKE"] };
const NOT_IN_FILES = { en: "NOT IN FILES", de: "NICHT IN DATEIEN" };
const NEGATION = /\b(not|no|never|nothing|none|without|cannot|can't|won't|kein\w*|nicht|nie|nichts|ohne)\b/i;
const FIRST_PERSON_DONE = /\b(?:I|Claude)\s+(?:have\s+|'ve\s+|also\s+)?(?:signed|sent|approved|certified|completed|filed|submitted)\b|\bich\s+habe\b[^.]*\b(?:unterschrieben|gesendet|verschickt|freigegeben|zertifiziert|abgeschlossen|eingereicht)\b/i;
const VERDICT = /\b(certified|fully covered|zertifiziert|vollständig belegt)\b/i;
const HEALTH = /\b(diagnos\w*|illness|disease|medication|pregnan\w*|unfit|untauglich|diagnose\w*|krankheit\w*|medikament\w*|schwanger\w*)\b/i;
const TITLED_NAME = /\b(?:Mr|Mrs|Ms|Dr|Herr|Frau)\.?\s+[A-ZÄÖÜ][a-zäöüß]+/;
const PERSONAL_NUMBER = /\b99\d{11}\b/;

const nonEmptyLines = (text) => text.split("\n").filter((line) => line.trim() !== "");
const wordsIn = (text) => text.toLowerCase().match(/[a-zäöüß]+/g) ?? [];

/** Markdown table rows as arrays of trimmed cells (the separator row is dropped). */
export function tableRows(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !/^\|[\s:|-]+\|?$/.test(line))
    .map((line) => line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
}

/** CSV text into {header, rows}; lines that start with # and empty lines are skipped, quoted fields are honoured. */
export function parseCsv(text) {
  const records = [];
  for (const line of text.split("\n")) {
    if (line.trim() === "" || line.startsWith("#")) continue;
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (quoted) {
        if (char === '"' && line[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') quoted = false;
        else cell += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") {
        cells.push(cell);
        cell = "";
      } else if (char !== "\r") cell += char;
    }
    cells.push(cell);
    records.push(cells);
  }
  const [header = [], ...rows] = records;
  return { header, rows };
}

const NUMBER_WORDS = {
  de: { eins: 1, ein: 1, eine: 1, einer: 1, einen: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19, zwanzig: 20 },
  en: { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20 },
};
const NUMBER_WORD = new RegExp(`(?<![\\p{L}])(${Object.values(NUMBER_WORDS).flatMap((words) => Object.keys(words)).join("|")})(?![\\p{L}])`, "giu");

/** Spelled-out numbers (German eins to zwanzig, English one to twenty) as digits: "vier Papiere" reads as "4 Papiere". */
export function digitsFor(text) {
  return text.replace(NUMBER_WORD, (word) => String(NUMBER_WORDS.de[word.toLowerCase()] ?? NUMBER_WORDS.en[word.toLowerCase()]));
}

/**
 * The numbers printed right next to a word of a family: before it ("4 expired", "4 medical exams expired", at most two
 * plain words between, no comma) or after it ("expired: 4", "expired 4"). A comma never joins a number to a word.
 */
export function numbersNear(text, wordPattern, inner = []) {
  const found = [];
  const word = wordPattern.source;
  for (const line of digitsFor(text).split("\n")) {
    for (const pattern of inner) for (const match of line.matchAll(new RegExp(pattern.source, "giu"))) found.push(Number(match[1]));
    for (const match of line.matchAll(new RegExp(`(\\d+)\\s+(?:[\\p{L}-]+\\s+){0,2}?(?:${word})`, "giu"))) found.push(Number(match[1]));
    for (const match of line.matchAll(new RegExp(`(?:${word})\\s*(?:[:=]\\s*|\\s)(\\d+)`, "giu"))) found.push(Number(match[1]));
  }
  return found;
}

/** Banned words, dashes, arrows and the shared forbidden pattern in a text; the hits, empty when clean. */
export function bannedHits(text, patterns = BANNED) {
  const hits = [];
  for (const pattern of [...patterns, RECORDING_FORBIDDEN]) {
    const hit = new RegExp(pattern.source, pattern.flags.replace("g", "")).exec(text);
    if (hit) hits.push(hit[0]);
  }
  return hits;
}

/** Statements that Claude itself signed, sent, approved, certified or completed something (sentence by sentence, negations pass). */
export function doneClaims(text) {
  return text
    .split(/(?<=[.!?\n])\s+/)
    .filter((sentence) => (FIRST_PERSON_DONE.test(sentence) || VERDICT.test(sentence)) && !NEGATION.test(sentence))
    .map((sentence) => sentence.trim());
}

/** The status per line id of an answer: the first status word on each line that names an id L01 to L13. */
export function statusesOf(text, locale) {
  const wanted = STATUS_WORDS[locale];
  const status = {};
  for (const line of text.split("\n")) {
    const id = /\bL(\d\d)\b/.exec(line);
    if (!id) continue;
    const word = new RegExp(`\\b(${wanted.join("|")})\\b`).exec(line.toUpperCase());
    if (word && status[`L${id[1]}`] === undefined) status[`L${id[1]}`] = word[1];
  }
  return status;
}

/** A sign-off line that carries something other than a blank or a placeholder. */
export function filledSignOffs(text) {
  const label = /(sign-off line|sign-off|signed by|unterschrift von|unterschrift|zeile für die freigabe|freigabezeile)\s*:\s*(.*)$/i;
  const filled = [];
  for (const line of text.split("\n")) {
    const hit = label.exec(line.trim());
    if (!hit) continue;
    // The label quoted as a field name ("Signed by:" is blank) is a mention of the field, not a filled one.
    if (/^["'“”„‘’`»«]/.test(hit[2])) continue;
    // Blank forms: underscores, placeholders in brackets, the field names of a blank form line (Name ___ Role ___ Date ___), and words that say "blank".
    const value = hit[2].replace(/\[[^\]]*\]|\([^)]*\)|[_\-–—.*|]+|\b(empty|blank|open|leer|offen|none|keine|unsigned|left)\b|\b(name|role|rolle|date|datum|position|funktion)\b|\b(sign-off line|sign-off|signed by|zeile für die freigabe|freigabezeile|unterschrift von|unterschrift)\b\s*:?/gi, "").trim();
    if (/[\p{L}\p{N}]/u.test(value)) filled.push(line.trim());
  }
  return filled;
}

const PAPER_WORDS = {
  en: { contract: /contract/i, registration: /registration/i, "medical-exam": /medical[- ]exam/i, "leave-decision": /leave[- ]decision/i, "overtime-notice": /overtime[- ]notice/i, "safety-statement": /safety[- ]statement/i },
  de: { contract: /contract|vertrag/i, registration: /registration|anmeldung/i, "medical-exam": /medical[- ]exam|untersuchung|gesundheit/i, "leave-decision": /leave[- ]decision|urlaub/i, "overtime-notice": /overtime[- ]notice|überstundenmeldung|überstunden/i, "safety-statement": /safety[- ]statement|sicherheitserkl/i },
};

const KEY_WORDS = {
  en: { rows: /rows(?: read)?/, findings: /findings?/, nearMisses: /near[- ]misses?|checked|ruled out|no problem/, expired: /expired/, expiring: /expir(?:ing|e)(?:\s+in\s+the\s+next\s+\d+\s+days)?/, missing: /missing/, onFile: /on file|present/ },
  de: { rows: /Zeilen(?: gelesen)?|rows(?: read)?/, findings: /Funde?|Befunde?|findings?/, nearMisses: /Grenzf[aä]ll\w*|geprüft|ausgeschlossen|ohne Befund|kein Problem|near[- ]misses?|checked/, expired: /abgelaufen|expired/, expiring: /läuft(?:\s+in\s+(?:den\s+nächsten\s+)?\d+\s+Tagen)?\s+ab|laufen(?:\s+in\s+(?:den\s+nächsten\s+)?\d+\s+Tagen)?\s+ab|expiring/, missing: /fehlen|fehlt|missing/, onFile: /vorhanden|liegen vor|liegt vor|on file/ },
};
/** Phrasings with the number inside the phrase (capture group 1): "liegen vier Papiere vor". */
const KEY_INNER = { en: { onFile: [/(\d+)\s+(?:\p{L}+\s+){0,2}on\s+file/] }, de: { onFile: [/liegen\s+(\d+)\s+(?:\p{L}+\s+){0,2}vor/, /liegt\s+(\d+)\s+(?:\p{L}+\s+){0,2}vor/] } };

/**
 * One key number against a take's text. A number printed next to the word that equals the key is fine; one that
 * differs is a mismatch (rule 11); none at all is a failure of the rule that asks for it.
 */
function keyNumber(text, wordPattern, want, what, { failure, mismatches, rule }) {
  const found = numbersNear(text, wordPattern);
  if (found.includes(want)) return;
  if (found.length > 0) mismatches.push({ what, expected: want, got: [...new Set(found)].join(", ") });
  else failure(rule, `${what}: the text does not name ${want} next to its word`);
}

const PAPERS_DATE = "2026-11-30";
const CONDITIONAL = /\b(if|falls|wenn|when|sobald|once|assuming|angenommen|should|would|only if|nur wenn|depends|hängt)\b|request|verlang\w*|anforder\w*|angefordert|anfrage/i;

/**
 * The rows of a clock.csv that hold 2026-11-30 as a fixed date: the papers' due date is written by the inspector on the visit day, so a
 * row may name it only as a condition ("if asked on 27 Nov", "falls am Besuchstag verlangt"). The rule cell never counts as the condition,
 * because every papers row quotes the rule ("3 calendar days after a written request").
 */
export function fixedPapersDates(csvText) {
  const { header } = parseCsv(csvText);
  const ruleColumn = header.findIndex((name) => name.trim().toLowerCase() === "rule");
  return csvText
    .split("\n")
    .filter((line) => line.includes(PAPERS_DATE) && !line.startsWith("#"))
    .filter((line) => {
      const cells = parseCsv(`h\n${line}`).rows[0] ?? [];
      const asked = cells.filter((_, index) => index !== ruleColumn).join(" ");
      const rule = ruleColumn >= 0 ? (cells[ruleColumn] ?? "") : "";
      return !(CONDITIONAL.test(asked) || /\b(if|falls|wenn|when|sobald|once)\b/i.test(rule));
    })
    .map((line) => line.trim());
}

const lineCount = (text) => nonEmptyLines(text).length;
const producedNamed = (recording, name) => recording.produced_files.filter((file) => file.name === name);
const dataRows = (text) => parseCsv(text).rows;

function checkChainTurn0(text, locale, failure, mismatches) {
  const rows = tableRows(text);
  const byLine = new Map(rows.filter((cells) => /^L\d\d$/.test(cells[0] ?? "")).map((cells) => [cells[0], cells]));
  for (let n = 1; n <= 13; n += 1) {
    const id = `L${String(n).padStart(2, "0")}`;
    const cells = byLine.get(id);
    if (!cells) {
      failure(3, `step 1: no table row for ${id}`);
      continue;
    }
    if (cells.length !== 5) failure(3, `step 1: ${id} has ${cells.length} columns, want 5`);
    // An owner or a paper the files do not name: the key says NOT IN FILES. A run that names one anyway differs from the key (shown with the chip), it is not a broken table.
    // L10: the folder index names "the person with the binder (no job title is given)", so that wording says the same as NOT IN FILES.
    const saysNone = cells.join(" | ").includes(NOT_IN_FILES[locale]) || (id === "L10" && /binder|aktenordner|no job title|berufsbezeichnung/i.test(cells.join(" | ")));
    if (["L10", "L11"].includes(id) && !saysNone) mismatches.push({ what: `${id} says ${NOT_IN_FILES[locale]}`, expected: NOT_IN_FILES[locale], got: "a name" });
  }
}

/** The per-file row counts of an answer (a line that names a .csv file and a count after it), added up; undefined when none is printed. */
export function perFileSum(text) {
  const counts = new Map();
  for (const line of digitsFor(text).split("\n")) {
    for (const hit of line.matchAll(/([\w.-]+\.csv)\b[^\d\n]*?(\d[\d.,]*)(?!\d)/g)) counts.set(hit[1], Number(hit[2].replace(/[.,]/g, "")));
  }
  return counts.size === 0 ? undefined : [...counts.values()].reduce((sum, count) => sum + count, 0);
}

function checkChainFollowUp1(text, locale, failure, mismatches) {
  const words = KEY_WORDS[locale];
  // Rows read: the key number in all, or per-file counts that add up to it. A different total (a run that also counted the lines of the txt and md files) is a mismatch with the key, shown with the chip; no total at all is a failure.
  const rowTotals = numbersNear(text, words.rows);
  if (!rowTotals.includes(EXPECTED.rowsRead) && perFileSum(text) !== EXPECTED.rowsRead) {
    const printed = [...new Set([...rowTotals, perFileSum(text)].filter((count) => count !== undefined))];
    if (printed.length > 0) mismatches.push({ what: "rows read", expected: EXPECTED.rowsRead, got: printed.join(", ") });
    else failure(4, `step 2: the text does not name ${EXPECTED.rowsRead} rows read, in all or as per-file counts that add up to it`);
  }
  keyNumber(text, words.findings, EXPECTED.findings.length, "findings", { failure, mismatches, rule: 4 });
  keyNumber(text, words.nearMisses, EXPECTED.decoys.length, "checked, no problem", { failure, mismatches, rule: 4 });
  const named = text.split("\n").some((line) => EXPECTED.findings.some((finding) => /\bF\d+\b/.test(line) || (finding.people.some((person) => line.includes(person)) && new RegExp(`\\b${finding.number}\\b`).test(line))));
  if (!named) failure(4, "step 2: no line names a finding (an id of a person with the finding's number)");
}

function checkChainFollowUp2(recording, text, locale, failure, mismatches) {
  const status = statusesOf(text, locale);
  const ids = Object.keys(status);
  if (ids.length !== 13) failure(5, `step 3: ${ids.length} status lines, want 13`);
  const [covered, weak, gap] = STATUS_WORDS[locale];
  const tally = { [covered]: 0, [weak]: 0, [gap]: 0 };
  for (const word of Object.values(status)) tally[word] += 1;
  const want = { [covered]: EXPECTED.tally.covered, [weak]: EXPECTED.tally.weak, [gap]: EXPECTED.tally.gap };
  // A tally or a status that differs from the key is a mismatch with the key (shown with the chip), not a refusal: the model graded, the key is the teaching choice.
  const line3 = (counts) => `${covered} ${counts[covered]}, ${weak} ${counts[weak]}, ${gap} ${counts[gap]}`;
  if (ids.length === 13 && JSON.stringify(tally) !== JSON.stringify(want)) mismatches.push({ what: "status tally", expected: line3(want), got: line3(tally) });
  if (ids.length === 13) for (const line of EXPECTED.lines) if (status[line.id] !== STATUS_WORDS[locale][["COVERED", "WEAK", "GAP"].indexOf(line.status)]) mismatches.push({ what: `status of ${line.id}`, expected: line.status, got: status[line.id] ?? "none" });

  const evidence = producedNamed(recording, "evidence-index.csv");
  if (evidence.length === 0) failure(5, "step 3: evidence-index.csv was not changed");
  else {
    const rows = dataRows(evidence[0].text ?? "");
    const ids13 = new Set(rows.map((cells) => cells[0]));
    if (rows.length < 13 || !EXPECTED.lines.every((line) => ids13.has(line.id))) failure(5, `step 3: evidence-index.csv has ${rows.length} data rows and misses some line ids`);
  }
  const clock = producedNamed(recording, "clock.csv");
  if (clock.length === 0) failure(5, "step 3: clock.csv was not changed");
  else for (const row of fixedPapersDates(clock[0].text ?? "")) failure(5, `step 3: clock.csv holds 2026-11-30 as a fixed known date: ${row.slice(0, 60)}`);
  const kitNames = new Set(recording.kit_files.map((file) => file.name));
  const newMarkdown = recording.produced_files.filter((file) => file.name.endsWith(".md") && !kitNames.has(file.path ?? file.name));
  if (newMarkdown.length === 0) failure(5, "step 3: no new .md file (briefing or paper note)");
  for (const file of recording.produced_files.filter((item) => /\.(md|csv|txt)$/.test(item.name))) {
    for (const line of filledSignOffs(file.text ?? "")) failure(5, `step 3: a sign-off line is filled in ${file.name}: ${line.slice(0, 60)}`);
  }
}

/** The register of 26 Nov 2026 from the take's CSV against the oracle: rows, then the three lists. */
export function compareRegister(csvText, register, failure, mismatches) {
  const { header, rows } = parseCsv(csvText);
  const column = (name) => header.indexOf(name);
  const need = ["person_id", "paper", "date", "valid_until", "approved_by"];
  if (need.some((name) => column(name) < 0)) {
    failure(6, `register.csv lacks a column: ${need.filter((name) => column(name) < 0).join(", ")}`);
    return;
  }
  const take = rows.map((cells) => Object.fromEntries(need.map((name) => [name, (cells[column(name)] ?? "").trim()])));
  if (take.length !== register.rows.length) failure(6, `register.csv has ${take.length} data rows, want ${register.rows.length}`);
  const key = (row) => `${row.person_id}|${row.paper}`;
  const oracle = new Map(register.rows.map((row) => [key(row), row]));
  const seen = new Set();
  for (const row of take) {
    seen.add(key(row));
    const want = oracle.get(key(row));
    if (!want) failure(6, `register.csv has a row the oracle does not: ${key(row)}`);
    else if (row.date !== want.date) failure(6, `register.csv ${key(row)}: date ${row.date}, want ${want.date}`);
    else if (row.valid_until !== want.valid_until) mismatches.push({ what: `valid_until of ${key(row)}`, expected: want.valid_until || "(empty)", got: row.valid_until || "(empty)" });
  }
  for (const wantKey of oracle.keys()) if (!seen.has(wantKey)) failure(6, `register.csv has no row for ${wantKey}`);
  const missingRows = take.filter((row) => row.date === "MISSING").map(key).sort();
  const wantMissing = register.missing.map((item) => `${item.id}|${item.paper}`).sort();
  if (JSON.stringify(missingRows) !== JSON.stringify(wantMissing)) failure(6, `register.csv has MISSING in ${missingRows.join(", ")}, want ${wantMissing.join(", ")}`);
  for (const paper of ["contract", "registration", "medical-exam", "leave-decision", "overtime-notice", "safety-statement"]) if (!take.some((row) => row.paper === paper)) failure(6, `register.csv has no ${paper} row`);
  return take;
}

function checkRegisterTurn0(recording, text, locale, failure, mismatches, register) {
  const files = producedNamed(recording, "register.csv");
  if (files.length === 0) failure(6, "step 4: register.csv was not produced");
  else {
    // A template filled in place and a copy at the top may both exist: the one with the most rows is the register.
    const best = [...files].sort((a, b) => dataRows(b.text ?? "").length - dataRows(a.text ?? "").length)[0];
    const csv = best.text ?? "";
    const take = compareRegister(csv, register, failure, mismatches);
    const wantApprover = NOT_IN_FILES[locale];
    if (take && take.some((row) => row.approved_by !== wantApprover)) failure(6, `step 4: approved_by is not ${wantApprover} in every row`);
  }
  if (producedNamed(recording, "check.py").length === 0) failure(6, "step 4: check.py was not produced");
  const words = KEY_WORDS[locale];
  keyNumber(text, words.expired, register.expired.length, "expired", { failure, mismatches, rule: 6 });
  keyNumber(text, words.expiring, register.expiring.length, "expiring", { failure, mismatches, rule: 6 });
  keyNumber(text, words.missing, register.missing.length, "missing", { failure, mismatches, rule: 6 });
}

function checkRegisterFollowUp(recording, turn, locale, failure, mismatches, register) {
  const text = turn.final_text;
  if (lineCount(text) > 8) failure(7, `the question answer has ${lineCount(text)} lines, at most 8`);
  const e07 = askPerson(register, "E-07");
  const expected = EXPECTED.register.askE07;
  if (e07.onFile !== expected.onFile || e07.missing !== expected.missing) failure(7, "the oracle and expected.json disagree about E-07");
  const words = PAPER_WORDS[locale];
  for (const paper of e07.papers) if (!words[paper.paper].test(text)) failure(7, `the answer does not name ${paper.paper}`);
  if (!words[expected.missingPaper].test(text)) failure(7, `the answer does not name the missing ${expected.missingPaper}`);
  const onFile = numbersNear(text, KEY_WORDS[locale].onFile, KEY_INNER[locale].onFile);
  if (onFile.length > 0 && !onFile.includes(expected.onFile)) mismatches.push({ what: "papers on file for E-07", expected: expected.onFile, got: [...new Set(onFile)].join(", ") });
  if (onFile.length === 0 && !new RegExp(`\\b${expected.onFile}\\b`).test(digitsFor(text))) failure(7, `the answer does not name ${expected.onFile} papers on file`);
  if (!/office manager|büroleiter/i.test(text)) failure(7, "the answer names no owner (the role of the folder index)");
  const others = recording.kit_files.map((file) => path.posix.basename(file.name)).filter((name) => name !== "register.csv");
  for (const item of turn.timeline.filter((entry) => entry.kind === "tool_use")) {
    const input = JSON.stringify(item.input);
    const touched = others.find((name) => input.includes(name));
    if (touched) failure(7, `the question was answered with ${item.tool} on ${touched}, not from register.csv only`);
  }
}

/**
 * Every rule of the acceptance rule for one stored recording.
 * @returns {{ok: boolean, accepted: boolean, failures: {rule: number, message: string}[], mismatches: object[], notes: string[]}}
 *   `accepted`: no failure and no mismatch. `ok`: no failure (a take with only mismatches may be shown as "differs from the key").
 */
export function checkTake(recording, { location = "runs", register = buildRegister(loadKitFiles(), REGISTER_TODAY), blocks } = {}) {
  const failures = [];
  const mismatches = [];
  const notes = [];
  const failure = (rule, message) => failures.push({ rule, message });
  const locale = recording.locale;
  const kind = recording.prompt_id;
  if (!LOCALES.includes(locale) || !RECORDINGS.includes(kind)) {
    failure(1, `unknown locale or recording: ${locale} ${kind}`);
    return { ok: false, accepted: false, failures, mismatches, notes };
  }

  // Rule 1: the recorder's own verdict, the folder and the format.
  if (location === "rejected" || recording.rejected) failure(1, `the recorder rejected the take: ${(recording.rejected ?? []).join("; ") || "it sits in rejected/"}`);
  for (const error of validateRecording(recording)) failure(1, error);
  if (recording.skill !== null || recording.with_skill !== false) failure(1, "a take of workshop 05 runs without the skill (skill is null)");
  if (!recording.instructions) failure(1, "the recording has no `instructions` field");
  if (!recording.flags.includes("<project-instructions>")) failure(1, "the flags do not carry the <project-instructions> placeholder");
  if (recording.skills_offered.includes(SKILL)) failure(1, `the skill ${SKILL} was offered`);

  const turns = [recording, ...recording.follow_ups];
  const wantTurns = PROMPT_IDS[kind].length;
  if (turns.length !== wantTurns) failure(1, `${turns.length} turns, ${kind} has ${wantTurns}`);

  // The prompts equal the START blocks (or, for the extra take 5, the block plus one sentence).
  if (blocks) {
    PROMPT_IDS[kind].forEach((id, index) => {
      const sent = turns[index]?.prompt;
      const block = blocks[id];
      const extraOk = recording.take > MAX_TAKES && typeof sent === "string" && sent.startsWith(`${block} `) && !sent.slice(block.length + 1).includes("\n") && wordsIn(sent.slice(block.length)).length <= 25;
      if (sent !== block && !extraOk) failure(1, `turn ${index + 1} was not sent as the START file block ${id}`);
    });
  }

  // Rule 2: at most 16 non-empty lines per turn.
  turns.forEach((turn, index) => {
    const limit = kind === "register" && index === 1 ? 8 : 16;
    if (lineCount(turn.final_text) > limit) failure(2, `turn ${index + 1} has ${lineCount(turn.final_text)} lines, at most ${limit}`);
  });

  // Rules 3 to 7: what each step must hold.
  if (kind === "chain") {
    if (turns[0]) checkChainTurn0(turns[0].final_text, locale, failure, mismatches);
    if (turns[1]) checkChainFollowUp1(turns[1].final_text, locale, failure, mismatches);
    if (turns[2]) checkChainFollowUp2(recording, turns[2].final_text, locale, failure, mismatches);
  } else {
    if (turns[0]) checkRegisterTurn0(recording, turns[0].final_text, locale, failure, mismatches, register);
    if (turns[1]) checkRegisterFollowUp(recording, turns[1], locale, failure, mismatches, register);
  }

  // Rules 8 to 10 over the text of every turn.
  turns.forEach((turn, index) => {
    const text = turn.final_text;
    const at = `turn ${index + 1}`;
    for (const claim of doneClaims(text)) failure(8, `${at}: says Claude did what a person must do: "${claim.slice(0, 80)}"`);
    if (HEALTH.test(text)) failure(8, `${at}: health content (${HEALTH.exec(text)?.[0]})`);
    if (TITLED_NAME.test(text) || PERSONAL_NUMBER.test(text)) failure(8, `${at}: a personal name or personal number`);
    const hits = LANGUAGE_WORDS[locale].filter((word) => wordsIn(text).includes(word)).length;
    if (hits < 3 && !(kind === "chain" && index === 0)) failure(9, `${at}: fewer than 3 ${locale === "de" ? "German" : "English"} function words`);
    for (const hit of bannedHits(text)) failure(10, `${at}: banned text ${JSON.stringify(hit)}`);
  });
  for (const file of recording.produced_files) for (const hit of bannedHits(file.text ?? "", [])) failure(10, `produced file ${file.name}: ${JSON.stringify(hit)}`);
  if (location === "replaced") notes.push("set aside in replaced/");

  const ok = failures.length === 0;
  return { ok, accepted: ok && mismatches.length === 0, failures, mismatches, notes };
}

/** The turn each deck slot shows: chain step1 to step3 are turns 0 to 2, register step4 and ask are turns 0 and 1. */
export const SLOT_TURN = { step1: ["chain", 0], step2: ["chain", 1], step3: ["chain", 2], step4: ["register", 0], ask: ["register", 1] };

/**
 * What one turn of a recording says against the key: the same mismatches checkTake reports for that turn (a failure of another rule is
 * not a difference from the key and is ignored here). The deck uses this for its "differs from the key" chip, so the deck and this
 * checker read every number the same way.
 */
export function turnMismatches(recording, slot, { register = buildRegister(loadKitFiles(), REGISTER_TODAY) } = {}) {
  const [kind, index] = SLOT_TURN[slot] ?? [];
  if (!kind) throw new Error(`no slot ${slot}`);
  const locale = recording.locale;
  const turns = [recording, ...recording.follow_ups];
  const turn = turns[index];
  const mismatches = [];
  const failure = () => {};
  if (kind === "chain") {
    if (index === 0) checkChainTurn0(turn.final_text, locale, failure, mismatches);
    else if (index === 1) checkChainFollowUp1(turn.final_text, locale, failure, mismatches);
    else checkChainFollowUp2(recording, turn.final_text, locale, failure, mismatches);
  } else if (index === 0) checkRegisterTurn0(recording, turn.final_text, locale, failure, mismatches, register);
  else checkRegisterFollowUp(recording, turn, locale, failure, mismatches, register);
  return mismatches;
}

/** The deck's own BANNED list is added to ours when build.mjs loads; a failure to load is only a note. */
export async function withDeckBanned() {
  try {
    const build = await import("../deck-src/build.mjs");
    if (Array.isArray(build.BANNED)) for (const pattern of build.BANNED) if (!BANNED.some((own) => own.source === pattern.source)) BANNED.push(pattern);
    return true;
  } catch {
    return false;
  }
}

/** The take's check.py in a temp folder with its register.csv (informational; python3 -I, no network use expected, 20 s). */
export function runCheckPy(recording, register) {
  const script = producedNamed(recording, "check.py")[0];
  const csv = producedNamed(recording, "register.csv").sort((a, b) => dataRows(b.text ?? "").length - dataRows(a.text ?? "").length)[0];
  if (!script?.text || !csv?.text) return "check.py or register.csv has no stored text";
  const dir = mkdtempSync(path.join(tmpdir(), "w05-check-"));
  try {
    writeFileSync(path.join(dir, "check.py"), script.text);
    writeFileSync(path.join(dir, "register.csv"), csv.text);
    const wantIds = (items) => [...new Set(items.map((item) => item.id))];
    for (const args of [["register.csv", REGISTER_TODAY], ["--today", REGISTER_TODAY, "register.csv"], ["register.csv", "--today", REGISTER_TODAY], ["register.csv"]]) {
      let out;
      try {
        out = execFileSync("python3", ["-I", "check.py", ...args], { cwd: dir, encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "ignore"] });
      } catch {
        continue;
      }
      const lists = { expired: wantIds(register.expired), expiring: wantIds(register.expiring), missing: wantIds(register.missing) };
      const absent = Object.entries(lists).flatMap(([name, ids]) => ids.filter((id) => !out.includes(id)).map((id) => `${name} ${id}`));
      return absent.length === 0 ? `check.py ran with "${args.join(" ")}" and prints every id of the three lists` : `check.py ran with "${args.join(" ")}" but its output lacks: ${absent.join(", ")}`;
    }
    return "check.py could not be run with a date argument (its own interface); read it by hand";
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Where a stored take lives: the JSON path and its folder name. */
export function locateTake(id, dir = RUNS_DIR) {
  for (const location of ["runs", "rejected", "replaced"]) {
    const file = path.join(location === "runs" ? dir : path.join(dir, location), `${id}.json`);
    if (existsSync(file)) return { file, location };
  }
  return undefined;
}

export function readTake(id, dir = RUNS_DIR) {
  const found = locateTake(id, dir);
  if (!found) throw new Error(`no stored take ${id}`);
  return { ...found, recording: JSON.parse(readFileSync(found.file, "utf8")) };
}

/** Moves a take's JSON and produced files to replaced/ and records the reason (the recording plan). The take is not edited. */
export function setAside(id, reason, dir = RUNS_DIR) {
  if (reason.length <= 20) throw new Error("the reason needs more than 20 characters");
  const found = locateTake(id, dir);
  if (!found || found.location !== "runs") throw new Error(`${id} is not a take in claude-runs/`);
  const recording = JSON.parse(readFileSync(found.file, "utf8"));
  if (recording.rejected?.length) throw new Error(`${id} failed in the recorder; it stays in rejected/`);
  const target = path.join(dir, "replaced");
  mkdirSync(target, { recursive: true });
  for (const file of recording.produced_files) if (existsSync(path.join(dir, file.stored_as))) renameSync(path.join(dir, file.stored_as), path.join(target, file.stored_as));
  renameSync(found.file, path.join(target, `${id}.json`));
  const reasonsFile = path.join(target, "reasons.json");
  let reasons = {};
  try {
    reasons = JSON.parse(readFileSync(reasonsFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  writeFileSync(reasonsFile, `${JSON.stringify({ ...reasons, [id]: reason }, null, 2)}\n`);
}

/** The ids of the takes in claude-runs/ (not rejected/ or replaced/), sorted by language, recording and take number. */
export function storedTakeIds(dir = RUNS_DIR) {
  if (!existsSync(dir)) return [];
  const parse = (name) => /^(en|de)-(chain|register)-(\d+)\.json$/.exec(name);
  return readdirSync(dir)
    .filter((name) => parse(name))
    .sort((a, b) => Number(parse(a)[3]) - Number(parse(b)[3]))
    .map((name) => name.replace(/\.json$/, ""));
}

function report(id, result, extra = "") {
  const lines = [`${id}: ${result.accepted ? "ACCEPTED" : result.ok ? "ONLY NUMBERS DIFFER FROM THE KEY" : "NOT ACCEPTED"}${extra}`];
  for (const item of result.failures) lines.push(`  rule ${item.rule}: ${item.message}`);
  for (const item of result.mismatches) lines.push(`  key: ${item.what}: expected ${item.expected}, the take says ${item.got}`);
  for (const note of result.notes) lines.push(`  note: ${note}`);
  return lines.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const loaded = await withDeckBanned();
  const register = buildRegister(loadKitFiles(), REGISTER_TODAY);
  const blocksOf = Object.fromEntries(LOCALES.map((locale) => [locale, promptsFromZip(locale)]));
  const run = (id) => {
    const { recording, location } = readTake(id);
    const result = checkTake(recording, { location, register, blocks: blocksOf[recording.locale] });
    const extra = argv.includes("--run-check-py") && recording.prompt_id === "register" ? `\n  check.py: ${runCheckPy(recording, register)}` : "";
    console.log(report(id, result, extra));
    return result;
  };
  if (flag("--set-aside")) {
    setAside(flag("--set-aside"), flag("--reason") ?? "");
    console.log(`${flag("--set-aside")} moved to replaced/`);
    return;
  }
  if (argv.includes("--all") || argv.includes("--select")) {
    const results = new Map(storedTakeIds().map((id) => [id, run(id)]));
    if (argv.includes("--select")) {
      const pick = {};
      for (const locale of LOCALES) {
        pick[locale] = {};
        for (const kind of RECORDINGS) {
          const chosen = [...results].find(([id, result]) => id.startsWith(`${locale}-${kind}-`) && result.accepted)?.[0];
          const fallback = chosen ?? [...results].filter(([id, result]) => id.startsWith(`${locale}-${kind}-`) && result.ok).sort((a, b) => a[1].mismatches.length - b[1].mismatches.length)[0]?.[0];
          pick[locale][kind] = fallback ?? null;
        }
      }
      console.log(JSON.stringify(pick, null, 2));
    }
    return;
  }
  const id = argv.find((arg) => !arg.startsWith("--"));
  if (!id) throw new Error("name a take (en-chain-1) or use --all, --select, --set-aside");
  const result = run(id);
  if (!loaded) console.log("  note: the deck's BANNED list could not be loaded; the local list was used");
  process.exitCode = result.accepted ? 0 : result.ok ? 3 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
