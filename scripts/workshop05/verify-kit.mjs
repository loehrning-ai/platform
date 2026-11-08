#!/usr/bin/env node
/**
 * Checks the Workshop 05 kit ("Audit Preparation with AI: Four Days Until the Inspection") against
 * itself and against the independent recount. It holds the tree (34 files per edition, 11 top-level
 * entries, the two roots), a label on every file, the two comment lines of every CSV, the row counts of
 * the folder (693 rows read), the three step headings, the five-line block of the start file, rules 4 to
 * 7 of the project instructions, the numbers and the quotes of the answer key (every quote found again
 * in its file), English and German parity, the one allowed external URL, the banned words and dashes,
 * the clock, both zips under the 120 KB cap, and the recount of oracle/recount.mjs against
 * oracle/expected.json. Exit code 1 when anything drifts.
 *
 * Usage (from the repository root): node scripts/workshop05/verify-kit.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FOLDER_FILES,
  FOLDER_FILES_DE,
  KIT_FILES,
  KIT_FILES_DE,
  KIT_NAME,
  KIT_NAME_DE,
  ZIP_NAME,
  ZIP_NAME_DE,
  buildKit,
  buildKitDe,
  kitEntries,
  kitEntriesDe,
} from "./build-kit.mjs";
import { compareWithExpected, recount } from "./oracle/recount.mjs";
import { analyse } from "./oracle/oracle.mjs";
import { loadKitFiles } from "./oracle/load.mjs";
import { expectedText } from "./oracle/write-expected.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(HERE, "kit");
const KIT_DE = path.join(HERE, "kit-de");
const WEBSITE = path.resolve(HERE, "../../packages/website");
const read = (file) => readFileSync(path.join(KIT, file), "utf8");
const readDe = (file) => readFileSync(path.join(KIT_DE, file), "utf8");
export const ZIP_CAP = 120 * 1024;

const failures = [];
const facts = {};
function expect(name, actual, expected) {
  facts[name] = actual;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}
const fail = (message) => failures.push(message);

const walk = (dir, base = "") =>
  readdirSync(dir)
    .filter((entry) => entry !== ".DS_Store")
    .flatMap((entry) => (statSync(path.join(dir, entry)).isDirectory() ? walk(path.join(dir, entry), `${base}${entry}/`) : [`${base}${entry}`]));

// 1. The tree, the roots and the zips.
expect("files", walk(KIT).sort(), [...KIT_FILES].sort());
expect("filesDe", walk(KIT_DE).sort(), [...KIT_FILES_DE].sort());
expect("zipNames", [ZIP_NAME, ZIP_NAME_DE], ["gradba-audit-kit.zip", "gradba-audit-kit-de.zip"]);
const entriesEn = kitEntries();
const entriesDe = kitEntriesDe();
expect("filesWithSkill", [entriesEn.length, entriesDe.length], [34, 34]);
expect("topLevelEntries", [new Set(entriesEn.map(([file]) => file.split("/")[0])).size, new Set(entriesDe.map(([file]) => file.split("/")[0])).size], [11, 11]);
const skillSource = readFileSync(path.join(WEBSITE, "content/skills/audit-nachweise/SKILL.md"), "utf8");
expect("skillInBothKits", [entriesEn, entriesDe].map((entries) => entries.find(([file]) => file === "claude/audit-nachweise/SKILL.md")?.[1].toString("utf8") === skillSource), [true, true]);

/** Names and sizes of the members of a stored zip, read from its central directory. */
function zipMembers(archive) {
  const end = archive.length - 22;
  if (archive.readUInt32LE(end) !== 0x06054b50) throw new Error("no end of central directory");
  const count = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  const members = [];
  for (let index = 0; index < count; index += 1) {
    const nameLength = archive.readUInt16LE(offset + 28);
    members.push(archive.subarray(offset + 46, offset + 46 + nameLength).toString("utf8"));
    offset += 46 + nameLength;
  }
  return members;
}
const zipEn = buildKit();
const zipDe = buildKitDe();
facts.zipBytes = zipEn.length;
facts.zipBytesDe = zipDe.length;
expect("zipUnder120KB", zipEn.length < ZIP_CAP && zipDe.length < ZIP_CAP, true);
for (const [archive, root] of [
  [zipEn, `${KIT_NAME}/`],
  [zipDe, `${KIT_NAME_DE}/`],
]) {
  const members = zipMembers(archive);
  expect(`zipMembers ${root}`, [members.length, members.every((name) => name.startsWith(root))], [34, true]);
}

// 2. Labels, comment lines, style, words, URLs.
const ALLOWED_URL = "https://privacy.claude.com/en/articles/7996890";
const INTERNAL = new RegExp(["\\/Users\\/", "\\/private\\/", "maven" + "gence", "facilitator\\/", "CLAUDE" + "\\.md", "vard" + "ar", "tann" + "wald", "plans\\/"].join("|"), "i");
const BANNED_EN = /\b(friday|saturday|sunday|deadline|compliant|compliance|score|scores|stamp|countdown|urgent|boss|seamless|leverage|unlock|empower|robust|delve|game.?changer)\b/i;
const BANNED_DE = /\b(Freitag|Samstag|Sonntag|Deadline|konform|Countdown|dringend|Stempel|Punkte|Chef|nahtlos|revolutionär)\b/;
const EDITIONS = [
  { name: "en", files: KIT_FILES, text: read, label: "Fictional training material", banned: BANNED_EN },
  { name: "de", files: KIT_FILES_DE, text: readDe, label: "Erfundenes Übungsmaterial", banned: BANNED_DE },
];
for (const edition of EDITIONS) {
  for (const file of edition.files) {
    const text = edition.text(file);
    const where = `${edition.name}/${file}`;
    if (text.includes("\r") || !text.endsWith("\n")) fail(`${where}: needs LF line ends and a final newline`);
    if (file.endsWith(".csv")) {
      const lines = text.split("\n");
      if (lines[0] !== "# Fictional training material, invented for the exercise." || lines[1] !== "# Erfundenes Übungsmaterial, für die Übung erfunden.") fail(`${where}: the two comment lines are missing`);
    } else if (!text.split("\n").slice(0, 3).join("\n").includes(edition.label)) fail(`${where}: the first 3 lines must say ${edition.label}`);
    if (/[‒–—―→←↔]/.test(text)) fail(`${where} has a dash or an arrow`);
    if (INTERNAL.test(text)) fail(`${where} holds an internal or retired word`);
    for (const url of text.match(/https?:\/\/[^\s)>"]+/g) ?? []) if (url !== ALLOWED_URL) fail(`${where} links ${url}`);
    if (edition.banned.test(text)) fail(`${where} uses a banned word (${text.match(edition.banned)?.[0]})`);
    if (/\b(Fri|Sat|Sun|Fr|Sa|So)\b\.? \d/.test(text) || /\b(Friday|Saturday|Sunday|Freitag|Samstag|Sonntag)\b/.test(text)) fail(`${where} prints a weekday that is never printed`);
  }
}
if (!/# The 13-digit ids starting with 99 are invented and are not real personal numbers\./.test(read("folder/employee_records_2026.csv").split("\n")[2] ?? "")) fail("employee_records_2026.csv lacks its third comment line");

// 3. Row counts of the folder, the same CSV bytes in both editions, the templates.
const rows = (text) => text.split("\n").filter((line) => line && !line.startsWith("#")).slice(1);
const COUNTS = {
  "contracts_register_2026.csv": 24,
  "registration_M1M2_2026.csv": 24,
  "employee_records_2026.csv": 24,
  "attendance_2026-11.csv": 432,
  "overtime_weekly_2026.csv": 34,
  "payroll_runs_2026.csv": 10,
  "payroll_lines_2026-07_to_10.csv": 96,
  "leave_decisions_2026.csv": 21,
  "absences_2026.csv": 1,
  "medical_exams.csv": 24,
  "training_proofs_2026.csv": 3,
};
expect("rowCounts", Object.fromEntries(Object.keys(COUNTS).map((name) => [name, rows(read(`folder/${name}`)).length])), COUNTS);
expect("rowsRead", Object.values(COUNTS).reduce((sum, n) => sum + n, 0), 693);
for (const name of Object.keys(COUNTS)) if (read(`folder/${name}`) !== readDe(`ordner/${name}`)) fail(`${name}: the CSV bytes differ between the editions`);
for (const name of ["evidence-index.csv", "clock.csv", "sample-rows_attendance.csv"]) if (read(`templates/${name}`) !== readDe(`vorlagen/${name}`)) fail(`${name}: the template bytes differ between the editions`);
expect("evidenceIndexHeader", [read("templates/evidence-index.csv").split("\n")[2], rows(read("templates/evidence-index.csv")).length], ["line_id,article,paper,owner,where,quote,period,scope,approval,status,closes_with,due", 0]);
expect("clockHeader", [read("templates/clock.csv").split("\n")[2], rows(read("templates/clock.csv")).length], ["event,rule,date", 1]);
expect("clockExampleRow", read("templates/clock.csv").split("\n")[3].startsWith("example"), true);
expect("sampleRows", [read("templates/sample-rows_attendance.csv").split("\n")[2], rows(read("templates/sample-rows_attendance.csv")).map((line) => line.split(",")[0])], ["id,date,start,end,tick,code", ["X-01", "X-02", "X-03"]]);
expect("folderFiles", [FOLDER_FILES.length, FOLDER_FILES_DE.length], [14, 14]);

// 4. The start files: the five-line block (the pinned COPY strings), three steps, the optional block, one marker.
const BLOCK = {
  en: [
    "Fictional training material, invented for the exercise. Not legal advice.",
    "A file is evidence only when its quote, period, scope and approval hold. I give Claude those four tests as rules, and nothing counts without a verbatim quote.",
    "COVERED, WEAK or GAP. A file out of date or unapproved: WEAK. A part without evidence, or the record shows “not met”: GAP. The weakest part counts.",
    "No quote, no COVERED. A policy shows intent; only a record shows practice.",
    "Open Claude, make a Project, paste project-instructions.md, add checklists/ and folder/. These files are invented, so this is Level 2 of the data ladder. Your own firm later: Level 3, only column names and 3 invented rows.",
  ],
  de: [
    "Erfundenes Übungsmaterial, für die Übung erfunden. Keine Rechtsberatung.",
    "Eine Datei ist erst ein Nachweis, wenn Zitat, Zeitraum, Umfang und Freigabe stimmen. Diese vier Prüfungen gebe ich Claude als Regeln, und ohne wörtliches Zitat zählt nichts.",
    "BELEGT, SCHWACH oder LÜCKE. Datei veraltet oder nicht freigegeben: SCHWACH. Ein Teil ohne Nachweis, oder der Nachweis zeigt „nicht erfüllt“: LÜCKE. Der schwächste Teil zählt.",
    "Ohne Zitat kein BELEGT. Eine Richtlinie zeigt Absicht, nur ein Protokoll zeigt Praxis.",
    "Öffne Claude, lege ein Projekt an, füge projektanweisungen.md ein, füge listen/ und ordner/ hinzu. Diese Dateien sind erfunden, das ist also Stufe 2 der Datenleiter. Eigene Firma später: Stufe 3, nur Spaltennamen und 3 erfundene Zeilen.",
  ],
};
const INTRO = { en: ["## What you do", "## Set up once"], de: ["## Was du tust", "## Einmal einrichten"] };
for (const [locale, text, start, step, after, marker] of [
  ["en", read("START-HERE.md"), "START-HERE.md", "Step", "## After the visit (optional)", "<!-- claude-ui:en -->"],
  ["de", readDe("START-HIER.md"), "START-HIER.md", "Schritt", "## Nach dem Besuch (optional)", "<!-- claude-ui:de -->"],
]) {
  expect(`${start} block`, text.split("\n").slice(0, 5), BLOCK[locale]);
  expect(`${start} headings`, text.split("\n").filter((line) => line.startsWith("## ")), [...INTRO[locale], `## ${step} 1`, `## ${step} 2`, `## ${step} 3`, after]);
  // The install text of the skill sits in the set-up section, above Step 1, and the file ends with the after-visit block.
  expect(`${start} marker`, [text.split(marker).length - 1, text.indexOf(marker) > text.indexOf(INTRO[locale][1]) && text.indexOf(marker) < text.indexOf(`## ${step} 1`)], [1, true]);
  const prompts = [...text.matchAll(/^ {4}(\S.*)$/gm)].map((match) => match[1]);
  expect(`${start} prompts`, prompts.length, 3);
  expect(`${start} prompt words`, prompts.map((prompt) => prompt.split(/\s+/).length <= 150), [true, true, true]);
}
// The room minutes are the deck's slots; the desk minutes are an estimate and the file says so.
const timeLines = (text) => [...text.matchAll(/^(?:In the room|Im Raum) (\d+)(?: minutes| Minuten)\. (?:At your desk about|Am Schreibtisch etwa) (\d+), (?:our estimate, not measured|unsere Schätzung, nicht gemessen)\./gm)].map((match) => [Number(match[1]), Number(match[2])]);
expect("stepMinutes", [timeLines(read("START-HERE.md")), timeLines(readDe("START-HIER.md"))], [[[5, 20], [7, 20], [6, 30]], [[5, 20], [7, 20], [6, 30]]]);
for (const [text, word] of [
  [read("START-HERE.md"), "Predict first, then check ANSWERS.md."],
  [readDe("START-HIER.md"), "Sag es voraus, dann prüf es in LOESUNGEN.md."],
]) if (text.split(word).length - 1 !== 3) fail(`a start file must say "${word}" in each of the three steps`);
if (!read("START-HERE.md").includes("skip the lines that start with #")) fail("Step 2 must say that lines starting with # are skipped");
// The skill: where to get it and what the kit holds (the kit has the folder, not a zip).
for (const [text, needle] of [
  [read("START-HERE.md"), "loehrning.ai/skills/audit-nachweise.zip"],
  [read("START-HERE.md"), "cases/case-A-labour.md"],
  [readDe("START-HIER.md"), "loehrning.ai/skills/audit-nachweise.zip"],
  [readDe("START-HIER.md"), "faelle/fall-A-arbeit.md"],
]) if (!text.includes(needle)) fail(`a start file must name ${needle}`);

// 5. Project instructions: 13 rules, rules 4 to 7 are the four tests (and equal the registry once it names this kit).
const rulesOf = (text) => [...text.matchAll(/^(\d+)\. (.*)$/gm)].map((match) => [Number(match[1]), match[2]]);
const rulesEn = rulesOf(read("project-instructions.md"));
const rulesDe = rulesOf(readDe("projektanweisungen.md"));
expect("ruleNumbers", [rulesEn.map(([n]) => n), rulesDe.map(([n]) => n)], [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]]);
expect("ruleWords", [rulesEn.slice(3, 7).map(([, text]) => text.split(":")[0]), rulesDe.slice(3, 7).map(([, text]) => text.split(":")[0])], [["QUOTE", "PERIOD", "SCOPE", "APPROVAL"], ["ZITAT", "ZEITRAUM", "UMFANG", "FREIGABE"]]);
const registryFile = path.join(WEBSITE, "src/lib/workshops-audit-kit.ts");
if (existsSync(registryFile)) {
  const registry = readFileSync(registryFile, "utf8");
  if (registry.includes("gradba-audit-kit")) {
    const blockOf = (locale) => {
      const start = registry.indexOf(locale === "de" ? "  de: {" : "  en: {");
      const section = registry.slice(start);
      const list = /rules: \[\n([\s\S]*?)\n\s*\],/.exec(section)?.[1] ?? "";
      return [...list.matchAll(/^\s*("(?:[^"\\]|\\.)*"),?$/gm)].map((match) => JSON.parse(match[1]));
    };
    expect("registryRulesEn", blockOf("en"), rulesEn.slice(3, 7).map(([, text]) => text));
    expect("registryRulesDe", blockOf("de"), rulesDe.slice(3, 7).map(([, text]) => text));
  } else facts.registryRules = "skipped: the registry still names the old kit (lane R)";
}

// 6. The answer key: numbers, tables, quotes, parity.
const expectedJson = JSON.parse(readFileSync(path.join(HERE, "oracle/expected.json"), "utf8"));
const rc = recount();
for (const diff of compareWithExpected(rc, expectedJson)) fail(`recount: ${diff}`);
if (expectedText() !== readFileSync(path.join(HERE, "oracle/expected.json"), "utf8")) fail("expected.json is not the output of the oracle on the kit files");
expect("recount", [rc.rowsRead, rc.findingCount, rc.nearMissCount, [rc.tally.covered, rc.tally.weak, rc.tally.gap], rc.over, rc.under], [693, 10, 8, [2, 1, 10], 12, 9]);
const analysis = analyse(loadKitFiles());
expect("peopleInFindings", analysis.peopleInFindings, expectedJson.peopleInFindings);

const section = (text, from, to) => text.slice(text.indexOf(from), to ? text.indexOf(to) : undefined);
const STATUS_WORDS = { en: ["COVERED", "WEAK", "GAP"], de: ["BELEGT", "SCHWACH", "LÜCKE"] };
const KEYS = [
  {
    locale: "en",
    text: read("ANSWERS.md"),
    steps: ["## Step 1", "## Step 2", "## Step 3", "## The clock"],
    count2: "Count: 10 findings, 8 checked, no problem.",
    count3: "Count: 2 COVERED, 1 WEAK, 10 GAP.",
    sentences: ["Answer only what is asked", "there is no such paper, we are writing it today", "Do not sign minutes that do not match"],
    folderText: FOLDER_FILES.map((file) => read(`folder/${file}`)).join("\n"),
    quote: /"([^"]+)"/g,
    stepFile: "START-HERE.md",
  },
  {
    locale: "de",
    text: readDe("LOESUNGEN.md"),
    steps: ["## Schritt 1", "## Schritt 2", "## Schritt 3", "## Die Fristen"],
    count2: "Zählung: 10 Funde, 8 geprüft ohne Befund.",
    count3: "Zählung: 2 BELEGT, 1 SCHWACH, 10 LÜCKE.",
    sentences: ["Beantworte nur, was gefragt wird", "dieses Papier gibt es nicht, wir schreiben es heute", "Unterschreibe kein Protokoll, das nicht stimmt"],
    folderText: FOLDER_FILES_DE.map((file) => readDe(`ordner/${file}`)).join("\n"),
    quote: /„([^“]+)“/g,
    stepFile: "START-HIER.md",
  },
];
const statusByLine = {};
for (const key of KEYS) {
  const { locale, text } = key;
  const name = locale === "en" ? "ANSWERS.md" : "LOESUNGEN.md";
  if (!text.includes(key.count2)) fail(`${name} lacks "${key.count2}"`);
  if (!text.includes(key.count3)) fail(`${name} lacks "${key.count3}"`);
  for (const sentence of key.sentences) if (!text.includes(sentence)) fail(`${name} lacks the briefing sentence "${sentence}"`);
  const briefing = /^> (.*)$/m.exec(text)?.[1] ?? "";
  expect(`${name} briefing words`, briefing.split(/\s+/).length <= 150, true);
  const [s1, s2, s3, clock] = key.steps;
  const step1 = section(text, s1, s2);
  const step2 = section(text, s2, s3);
  const step3 = section(text, s3, clock);
  const rowsOfTable = (block, pattern) => block.split("\n").filter((line) => pattern.test(line));
  const lineRows = rowsOfTable(step1, /^\| L\d\d \|/);
  expect(`${name} step 1 rows`, [lineRows.length, lineRows.every((row) => row.split("|").length === 7)], [13, true]);
  expect(`${name} step 1 ids`, lineRows.map((row) => row.split("|")[1].trim()), analysis.lines.map((line) => line.id));
  const fileRows = rowsOfTable(step2, /^\| [a-z_0-9A-Z.\-]+\.csv \|/);
  expect(`${name} rows read`, Object.fromEntries(fileRows.map((row) => row.split("|").slice(1, 3).map((cell) => cell.trim()))), Object.fromEntries(Object.entries(expectedJson.rowsByFile).map(([file, n]) => [file, String(n)])));
  if (!new RegExp(`\\| ${locale === "en" ? "Total" : "Summe"} \\| 693 \\|`).test(step2)) fail(`${name}: the rows read must add up to 693`);
  expect(`${name} findings`, rowsOfTable(step2, /^\| F\d+ \|/).map((row) => row.split("|")[1].trim()), ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"]);
  expect(`${name} near misses`, rowsOfTable(step2, /^\| D\d \|/).map((row) => row.split("|")[1].trim()), ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"]);
  for (const finding of analysis.findings) {
    const row = rowsOfTable(step2, new RegExp(`^\\| ${finding.id} \\|`))[0] ?? "";
    if (!row.includes(`${finding.number}`)) fail(`${name}: ${finding.id} must print the number ${finding.number}`);
  }
  expect(`${name} wrong answers`, [/\| (?:Findings|Funde) \| (\d+) \| (\d+) \|/.exec(step2)?.slice(1).map(Number)], [[12, 9]]);
  const statusRows = rowsOfTable(step3, new RegExp(`^\\| L\\d\\d \\| (${STATUS_WORDS[locale].join("|")}) \\|`));
  expect(`${name} step 3 rows`, statusRows.length, 13);
  statusByLine[locale] = Object.fromEntries(statusRows.map((row) => [row.split("|")[1].trim(), STATUS_WORDS[locale].indexOf(row.split("|")[2].trim())]));
  const tallyOf = (index) => Object.values(statusByLine[locale]).filter((value) => value === index).length;
  expect(`${name} tally`, [tallyOf(0), tallyOf(1), tallyOf(2)], [2, 1, 10]);
  for (const row of statusRows) {
    const id = row.split("|")[1].trim();
    const quotes = [...row.split("|")[4].matchAll(key.quote)].map((match) => match[1]);
    if (quotes.length === 0) fail(`${name}: ${id} has no quote`);
    for (const quote of quotes) if (!key.folderText.includes(quote)) fail(`${name}: ${id} quote "${quote}" is not word for word in the folder`);
  }
  expect(`${name} statuses equal the oracle`, Object.fromEntries(analysis.lines.map((line) => [line.id, ["COVERED", "WEAK", "GAP"].indexOf(line.status)])), statusByLine[locale]);
  const newPapers = rowsOfTable(step3, /^\| L\d\d \| (?!COVERED|WEAK|GAP|BELEGT|SCHWACH|LÜCKE)/);
  expect(`${name} new papers`, newPapers.map((row) => row.split("|")[1].trim()), ["L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12"]);
  const clockText = section(text, clock);
  if (!/\b(?:Thu|Do)\b/.test(clockText)) fail(`${name}: the clock must name today`);
  if (!clockText.includes("2026-11-30")) fail(`${name}: the clock must name the papers date of the invented request`);
  if (!text.includes("2026-11-23") || !text.includes("2026-11-27")) fail(`${name}: the clock must name the notice and the visit date`);
}
expect("statuses EN equal DE", statusByLine.en, statusByLine.de);

// 7. Document request, minutes, cases, templates: the facts they must hold.
const mustHave = [
  ["inspector/document-request_2026-11-27.md", ["Open on the day of the visit.", "Mon 30 November 2026", "ZIN Art. 53(1)", "E-02"]],
  ["inspector/minutes_sample_2026-11-27.md", ["Open after Step 3.", "E-12", "the inspector issues an act with a fix period", "Reason, if you do not sign: ______"]],
  ["templates/transfer-sheet.md", ["1. Who checks", "6. Your sentence", "Before [date], [role] checks [paper] against [rule].", "Level 4"]],
  ["templates/new-paper-note.md", ["Signed by: ______", "The old paper stays untouched."]],
  ["templates/comment-on-minutes.md", ["at most four sentences", "Signed by: ______"]],
  ["notice_DIT_2026-11-23.md", ["22-0487/1", "27 November 2026, 09:00", "ZIN Art. 57, 54, 55", "ZIN is the general law since 1 Jan 2026", "Name one employee"]],
  ["CHANGELOG.md", ["## 2026-11-07", "Rebuilt for workshop 5"]],
  ["cases/case-A-labour.md", ["## Bottlenecks", "Sourced:", "This kit's story (invented)", "read on 2026-11-07", "Not legal advice"]],
  ["cases/case-B-tax.md", ["Sourced:", "This kit's story (invented)", "ZDP Art. 47(2)", "Size thresholds unverified", "single vendors only, not a market average"]],
  ["cases/case-C-iso.md", ["Sourced:", "This kit's story (invented)", "IAF MD 5:2023", "not a certifier's tariff and not a market average"]],
];
for (const [file, needles] of mustHave) for (const needle of needles) if (!read(file).includes(needle)) fail(`${file} lacks "${needle}"`);
for (const [file, needles] of [
  ["inspektor/verlangen_unterlagen_2026-11-27.md", ["Am Tag des Besuchs öffnen.", "Mo 30. November 2026", "ZIN Art. 53(1)", "E-02"]],
  ["inspektor/protokoll_beispiel_2026-11-27.md", ["Nach Schritt 3 öffnen.", "E-12", "erlässt einen Bescheid mit einer Frist zur Behebung"]],
  ["vorlagen/uebertragungsblatt.md", ["1. Wer prüft", "6. Dein Satz", "Stufe 4"]],
  ["AENDERUNGEN.md", ["## 2026-11-07"]],
  ["faelle/fall-A-arbeit.md", ["Belegt:", "Die Geschichte dieses Kits (erfunden)"]],
  ["faelle/fall-B-steuer.md", ["Belegt:", "Die Geschichte dieses Kits (erfunden)", "Größenschwellen ungeprüft"]],
  ["faelle/fall-C-iso.md", ["Belegt:", "Die Geschichte dieses Kits (erfunden)", "IAF MD 5:2023"]],
]) for (const needle of needles) if (!readDe(file).includes(needle)) fail(`kit-de/${file} lacks "${needle}"`);

// 8. The generator reproduces the CSV files (runs oracle/generate.mjs --check).
const generated = spawnSync(process.execPath, [path.join(HERE, "oracle/generate.mjs"), "--check"], { encoding: "utf8" });
if (generated.status !== 0) fail(`generate.mjs --check failed: ${(generated.stderr || generated.stdout).trim()}`);

console.log(JSON.stringify(facts, null, 2));
if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nWorkshop 05 kit: every check passed.");
