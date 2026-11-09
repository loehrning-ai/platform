#!/usr/bin/env node
/**
 * Checks the Workshop 05 kit ("Audit Preparation with AI: Organize Evidence and Find Gaps") against
 * itself and against the independent recount. It holds the tree (41 files per edition, 12 top-level
 * entries, the two roots), a label on every file, the two comment lines of every CSV, the row counts of
 * the folder (693 rows read), the four step headings and their verbatim prompts, the five-line block of
 * the start file, rules 4 to 7 of the project instructions, the numbers and the quotes of the answer
 * key (every quote found again in its file), the register of Step 4 (oracle, recount, expected.json and
 * both answer keys agree), English and German parity, the one allowed external URL, the banned words and
 * dashes, the word that recordings must not hold, the clock, both zips under the 120 KB cap, and the
 * recount of oracle/recount.mjs against oracle/expected.json. Exit code 1 when anything drifts.
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
import { analyse, askKeyLine, askPerson, buildRegister, registerSummary, REGISTER_TODAY } from "./oracle/oracle.mjs";
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
expect("filesWithSkill", [entriesEn.length, entriesDe.length], [41, 41]);
expect("topLevelEntries", [new Set(entriesEn.map(([file]) => file.split("/")[0])).size, new Set(entriesDe.map(([file]) => file.split("/")[0])).size], [12, 12]);
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
  expect(`zipMembers ${root}`, [members.length, members.every((name) => name.startsWith(root))], [41, true]);
}

// The shared recording test forbids one lowercase word in every recorded file (SPEC-2 4.3). The count over
// everything that can go into a workspace, and over the prompts of the start file, must be 0 in both editions.
const RECORDED = (file) => /^(folder|ordner|checklists|listen|templates|vorlagen)\//.test(file) || ["cases/case-A-labour.md", "faelle/fall-A-arbeit.md", "project-instructions.md", "projektanweisungen.md", "notice_DIT_2026-11-23.md", "mitteilung_DIT_2026-11-23.md"].includes(file);
const forbidden = ["sig", "nature"].join("");
const recordedText = (entries, startFile) => [
  ...entries.filter(([file]) => RECORDED(file)).map(([, bytes]) => bytes.toString("utf8")),
  ...[...entries.find(([file]) => file === startFile)[1].toString("utf8").matchAll(/^ {4}(\S.*)$/gm)].map((match) => match[1]),
];
expect(
  "recordedFilesWithForbiddenWord",
  [recordedText(entriesEn, "START-HERE.md"), recordedText(entriesDe, "START-HIER.md")].map((texts) => texts.filter((text) => text.toLowerCase().includes(forbidden)).length),
  [0, 0],
);

// 2. Labels, comment lines, style, words, URLs.
// The one privacy link of the start file, plus the sources of keep-watch/ (DE bereit-bleiben/): two Anthropic help pages and the
// verified watch list (Anthropic help centre, projects and scheduled tasks; AZLP, Služben vesnik, DIT). Nothing else may link out.
const ALLOWED_URLS = new Set([
  "https://privacy.claude.com/en/articles/7996890",
  "https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork",
  "https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects",
  "https://dit.gov.mk/",
  "https://slvesnik.com.mk/besplaten-pristap-do-izdanija.nspx",
  "https://azlp.mk/feed/",
  "https://mzzpr.org.mk/feed/",
]);
const KEEP_WATCH = /^(keep-watch|bereit-bleiben)\//;
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
    for (const url of text.match(/https?:\/\/[^\s)>"]+/g) ?? []) if (!ALLOWED_URLS.has(url) || (url !== "https://privacy.claude.com/en/articles/7996890" && !KEEP_WATCH.test(file))) fail(`${where} links ${url}`);
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
for (const name of ["evidence-index.csv", "clock.csv", "sample-rows_attendance.csv", "register.csv"]) if (read(`templates/${name}`) !== readDe(`vorlagen/${name}`)) fail(`${name}: the template bytes differ between the editions`);
expect("evidenceIndexHeader", [read("templates/evidence-index.csv").split("\n")[2], rows(read("templates/evidence-index.csv")).length], ["line_id,article,paper,owner,where,quote,period,scope,approval,status,closes_with,due", 0]);
expect("clockHeader", [read("templates/clock.csv").split("\n")[2], rows(read("templates/clock.csv")).length], ["event,rule,date", 1]);
expect("clockExampleRow", read("templates/clock.csv").split("\n")[3].startsWith("example"), true);
expect("sampleRows", [read("templates/sample-rows_attendance.csv").split("\n")[2], rows(read("templates/sample-rows_attendance.csv")).map((line) => line.split(",")[0])], ["id,date,start,end,tick,code", ["X-01", "X-02", "X-03"]]);
expect("registerTemplate", [read("templates/register.csv").split("\n").slice(0, 2), read("templates/register.csv").split("\n")[2], rows(read("templates/register.csv")).length], [
  ["# Fictional training material, invented for the exercise.", "# Erfundenes Übungsmaterial, für die Übung erfunden."],
  "person_id,paper,date,valid_until,owner,where,approved_by",
  0,
]);
expect("folderFiles", [FOLDER_FILES.length, FOLDER_FILES_DE.length], [14, 14]);

// 4. The start files: the five-line block (the pinned COPY strings), three steps, the optional block, one marker.
// The top block: the disclaimer, a heading and the three rule lines (the pinned COPY strings); the set-up line that opens the Project follows the set-up heading.
const BLOCK = {
  en: [
    "Fictional training material, invented for the exercise. Not legal advice.",
    "## The rules in one minute",
    "A file is evidence only when its quote, period, scope and approval hold. I give Claude those four tests as rules, and nothing counts without a verbatim quote.",
    "COVERED, WEAK or GAP. A file out of date or unapproved: WEAK. A part without evidence, or the record shows “not met”: GAP. The weakest part counts.",
    "No quote, no COVERED. A policy shows intent; only a record shows practice.",
  ],
  de: [
    "Erfundenes Übungsmaterial, für die Übung erfunden. Keine Rechtsberatung.",
    "## Die Regeln in einer Minute",
    "Eine Datei ist erst ein Nachweis, wenn Zitat, Zeitraum, Umfang und Freigabe stimmen. Diese vier Prüfungen gebe ich Claude als Regeln, und ohne wörtliches Zitat zählt nichts.",
    "BELEGT, SCHWACH oder LÜCKE. Datei veraltet oder nicht freigegeben: SCHWACH. Ein Teil ohne Nachweis, oder der Nachweis zeigt „nicht erfüllt“: LÜCKE. Der schwächste Teil zählt.",
    "Ohne Zitat kein BELEGT. Eine Richtlinie zeigt Absicht, nur ein Protokoll zeigt Praxis.",
  ],
};
const SETUP_FIRST = {
  en: "Open Claude, make a Project, paste project-instructions.md, add checklists/ and folder/. These files are invented, so this is Level 2 of the data ladder. Your own firm later: Level 3, only column names and 3 invented rows.",
  de: "Öffne Claude, lege ein Projekt an, füge projektanweisungen.md ein, füge listen/ und ordner/ hinzu. Diese Dateien sind erfunden, das ist also Stufe 2 der Datenleiter. Eigene Firma später: Stufe 3, nur Spaltennamen und 3 erfundene Zeilen.",
};
const INTRO = { en: ["## The rules in one minute", "## What you do", "## Set up once"], de: ["## Die Regeln in einer Minute", "## Was du tust", "## Einmal einrichten"] };
const SKILL_HEADING = { en: "## Optional: install the skill", de: "## Freiwillig: den Skill einrichten" };
// The four step headings carry the step names of the deck (slides 9, 10, 12 and 13).
const STEP_HEADINGS = {
  en: ["## Step 1: make the table", "## Step 2: run the check", "## Step 3: status, plan, briefing", "## Step 4: build the register"],
  de: ["## Schritt 1: die Tabelle bauen", "## Schritt 2: den Check laufen lassen", "## Schritt 3: Status, Plan, Briefing", "## Schritt 4: das Register bauen"],
};
// The verbatim texts of Step 4 and the answer-length sentences (design: SPEC-2 section 4.4).
const STEP4 = {
  en: {
    first:
      "Build the register. Read folder-index.md and the CSV files in the folder. Skip the lines that start with #. Make register.csv with the columns of templates/register.csv and one row per person and paper. Papers: contract, registration, medical-exam (valid 24 months), leave-decision (only for people with 6 months of service on 26 Nov 2026), overtime-notice (for every person with overtime weeks) and safety-statement (one row for the firm, person_id FIRM). Take the owner from folder-index.md. Where a paper is missing, write MISSING in the date column. Where no file names an approver, write NOT IN FILES. Use ids, no names, and no health content, dates only. Then write check.py. It reads register.csv and prints three lists for today: expired, expiring in the next 60 days, missing. Run it with today's date, 26 Nov 2026. Answer in 16 lines at most: the three counts, then the first five rows of register.csv.",
    second: "Look at register.csv. Which papers are on file for E-07, which one is missing, and who owns each? Answer from register.csv only, in 8 lines at most. If a row is not there, say NOT IN FILES.",
    then: "Then ask the register:",
    month: "Every month: see templates/monthly-check.md.",
    noCode: "Code execution switched off? Ask Claude for check.py and run it on your own computer.",
    ends: [
      ["Answer with the table only.", 0],
      ["Answer in 16 lines at most.", 1],
      ["Answer with one line per question: line id, status, at most 8 words why. The rest goes in the files. At most 16 lines.", 2],
    ],
    intro: "In four steps Claude helps you build a table, run a check, write a plan and build a register.",
    setup: "Add cases/case-A-labour.md and templates/register.csv to the Project as well.",
    signOff: "Leave every sign-off line empty.",
    line: "Write plain sentences. Use no dashes or arrows. Say sign-off line where a person signs.",
  },
  de: {
    first:
      "Baue das Register. Lies ordner-index.md und die CSV-Dateien im Ordner. Überspringe die Zeilen, die mit # beginnen. Mach register.csv mit den Spalten aus vorlagen/register.csv und einer Zeile pro Person und Papier. Papiere: contract, registration, medical-exam (gültig 24 Monate), leave-decision (nur für Personen mit 6 Monaten Betriebszugehörigkeit am 26. Nov. 2026), overtime-notice (für jede Person mit Überstundenwochen) und safety-statement (eine Zeile für die Firma, person_id FIRM). Nimm die Zuständigkeit aus ordner-index.md. Fehlt ein Papier, schreib MISSING in die Spalte date. Nennt keine Datei eine freigebende Person, schreib NICHT IN DATEIEN. Nimm Kennungen, keine Namen, und keine Gesundheitsinhalte, nur Daten. Schreibe dann check.py. Es liest register.csv und gibt für heute drei Listen aus: abgelaufen, läuft in den nächsten 60 Tagen ab, fehlt. Führe es mit dem heutigen Datum aus, 26. Nov. 2026. Antworte in höchstens 16 Zeilen: die drei Zahlen, dann die ersten fünf Zeilen von register.csv.",
    second: "Sieh dir register.csv an. Welche Papiere liegen für E-07 vor, welches fehlt, und wer ist jeweils zuständig? Antworte nur aus register.csv, in höchstens 8 Zeilen. Fehlt eine Zeile, sag NICHT IN DATEIEN.",
    then: "Dann frag das Register:",
    month: "Jeden Monat: siehe vorlagen/monatscheck.md.",
    noCode: "Codeausführung ausgeschaltet? Bitte Claude um check.py und führe es auf deinem eigenen Rechner aus.",
    ends: [
      ["Antworte nur mit der Tabelle.", 0],
      ["Antworte in höchstens 16 Zeilen.", 1],
      ["Antworte mit einer Zeile pro Frage: Zeilen-Id, Status, höchstens 8 Wörter Grund. Alles andere kommt in die Dateien. Höchstens 16 Zeilen.", 2],
    ],
    intro: "In vier Schritten hilft dir Claude, eine Tabelle zu bauen, einen Check laufen zu lassen, einen Plan zu schreiben und ein Register zu bauen.",
    setup: "Füge faelle/fall-A-arbeit.md und vorlagen/register.csv ebenfalls zum Projekt hinzu.",
    signOff: "Lass jede Unterschriftszeile leer.",
    line: "Schreibe einfache Sätze. Nimm keine Gedankenstriche und keine Pfeile. Sag Zeile für die Freigabe, wo eine Person unterschreibt.",
  },
};
// "Stay ready" names every file of the keep-watch folder, so a learner finds what keeps the register current after the audit.
const STAY = {
  en: ["## Stay ready", "keep-watch/", ["weekly-check_scheduled-task.md", "monthly-check_by-hand.md", "register-project-instructions.md", "safety-card.md", "watch-list.md"]],
  de: ["## Bereit bleiben", "bereit-bleiben/", ["wochencheck_geplante-aufgabe.md", "monatscheck_von-hand.md", "register-projektanweisungen.md", "sicherheitskarte.md", "beobachtungsliste.md"]],
};
for (const [locale, text, start, after, marker] of [
  ["en", read("START-HERE.md"), "START-HERE.md", "## After the visit (optional)", "<!-- claude-ui:en -->"],
  ["de", readDe("START-HIER.md"), "START-HIER.md", "## Nach dem Besuch (optional)", "<!-- claude-ui:de -->"],
]) {
  const [stayHeading, stayDir, stayFiles] = STAY[locale];
  const stayText = text.slice(text.indexOf(stayHeading), text.indexOf(after));
  for (const file of stayFiles) if (!stayText.includes(`${stayDir}${file}`)) fail(`${start}: "${stayHeading}" must name ${stayDir}${file}`);
  expect(`${start} block`, text.slice(0, text.indexOf(INTRO[locale][1])).split("\n").filter((line) => line !== ""), BLOCK[locale]);
  expect(`${start} set-up opens the Project`, text.split(`${INTRO[locale][2]}\n\n`)[1]?.split("\n")[0], SETUP_FIRST[locale]);
  expect(`${start} headings`, text.split("\n").filter((line) => line.startsWith("## ")), [...INTRO[locale], ...STEP_HEADINGS[locale], stayHeading, after, SKILL_HEADING[locale]]);
  // The install text of the skill is the last section (optional); the file ends with its one marker line.
  expect(`${start} marker`, [text.split(marker).length - 1, text.indexOf(marker) > text.indexOf(SKILL_HEADING[locale]), text.trimEnd().endsWith(marker)], [1, true, true]);
  const prompts = [...text.matchAll(/^ {4}(\S.*)$/gm)].map((match) => match[1]);
  expect(`${start} prompts`, prompts.length, 5);
  expect(`${start} prompt words`, prompts.map((prompt) => prompt.split(/\s+/).length <= 150), [true, true, true, true, true]);
  const v = STEP4[locale];
  expect(`${start} step 4 prompts`, [prompts[3], prompts[4]], [v.first, v.second]);
  expect(`${start} step 4 words`, [v.first.split(/\s+/).length, v.second.split(/\s+/).length], locale === "en" ? [149, 37] : [145, 32]);
  for (const [sentence, index] of v.ends) if (!prompts[index].endsWith(sentence)) fail(`${start}: prompt ${index + 1} must end with "${sentence}"`);
  if (!prompts[2].includes(v.signOff)) fail(`${start}: the Step 3 prompt must say "${v.signOff}"`);
  for (const needle of [v.then, v.month, v.noCode, v.intro, v.setup]) if (!text.includes(needle)) fail(`${start} lacks "${needle}"`);
  if (text.split(v.noCode).length - 1 !== 2) fail(`${start}: the no-code-tool sentence must stand in Step 2 and in Step 4`);
}
// The room minutes are the deck's slots; the desk minutes are an estimate and the file says so.
const timeLines = (text) => [...text.matchAll(/^(?:In the room|Im Raum) (\d+)(?: minutes| Minuten)\. (?:At your desk about|Am Schreibtisch etwa) (\d+), (?:our estimate, not measured|unsere Schätzung, nicht gemessen)\./gm)].map((match) => [Number(match[1]), Number(match[2])]);
expect("stepMinutes", [timeLines(read("START-HERE.md")), timeLines(readDe("START-HIER.md"))], [[[6, 20], [9, 20], [8, 30], [11, 20]], [[6, 20], [9, 20], [8, 30], [11, 20]]]);
for (const [text, word] of [
  [read("START-HERE.md"), "Predict first, then check ANSWERS.md."],
  [readDe("START-HIER.md"), "Sag es voraus, dann prüf es in LOESUNGEN.md."],
]) if (text.split(word).length - 1 !== 4) fail(`a start file must say "${word}" in each of the four steps`);
if (!read("START-HERE.md").includes("skipping CSV lines that start with #")) fail("Step 2 must say that lines starting with # are skipped");
// The prompt-to-checker contract (recordings/check-take.mjs reads exactly these words): the closing totals line of Step 2,
// the status rule and the open papers date of Step 3, the firm id of Step 4.
for (const [file, texts] of [
  ["START-HERE.md", ["End with one totals line: rows read, findings, near misses checked.", "GAP: someone has no paper, or the record shows the rule broken. WEAK: the paper is there, only date or approval fails.", "the papers' date left open (the inspector sets it on the visit day)", "person_id FIRM"]],
  ["START-HIER.md", ["Schließe mit einer Zeile Summen: Zeilen gelesen, Funde, Grenzfälle geprüft.", "LÜCKE: für jemanden fehlt das Papier, oder der Nachweis zeigt die Regel verletzt. SCHWACH: das Papier ist da, nur Datum oder Freigabe stimmt nicht.", "lass das Datum der Papiere offen (der Inspektor setzt es am Besuchstag)", "person_id FIRM"]],
]) for (const needle of texts) if (!(file === "START-HERE.md" ? read(file) : readDe(file)).includes(needle)) fail(`${file} lacks "${needle}"`);
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
for (const [name, text, locale] of [["project-instructions.md", read("project-instructions.md"), "en"], ["projektanweisungen.md", readDe("projektanweisungen.md"), "de"]]) {
  expect(`${name} last line`, text.trimEnd().split("\n").at(-1), STEP4[locale].line);
}
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
    steps: ["## Step 1", "## Step 2", "## Step 3", "## Step 4", "## The clock"],
    count2: "Count: 10 findings, 8 checked, no problem.",
    count3: "Count: 2 COVERED, 1 WEAK, 10 GAP.",
    count4: "Count: 98 rows, 4 expired, 1 expiring, 4 missing.",
    total: "Total",
    approver: "NOT IN FILES in approved_by",
    leaveNote: ["ZRO Art. 139", "ZRO Art. 140", "teaching choice, not settled law"],
    laterSentence: "An AI run will differ in wording. The counts must not.",
    sentences: ["Answer only what is asked", "there is no such paper, we are writing it today", "Do not sign minutes that do not match"],
    folderText: FOLDER_FILES.map((file) => read(`folder/${file}`)).join("\n"),
    quote: /"([^"]+)"/g,
    stepFile: "START-HERE.md",
  },
  {
    locale: "de",
    text: readDe("LOESUNGEN.md"),
    steps: ["## Schritt 1", "## Schritt 2", "## Schritt 3", "## Schritt 4", "## Die Fristen"],
    count2: "Zählung: 10 Funde, 8 geprüft ohne Befund.",
    count3: "Zählung: 2 BELEGT, 1 SCHWACH, 10 LÜCKE.",
    count4: "Zählung: 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen.",
    total: "Summe",
    approver: "NICHT IN DATEIEN in approved_by",
    leaveNote: ["ZRO Art. 139", "ZRO Art. 140", "Entscheidung für die Übung, kein geklärtes Recht"],
    laterSentence: "Ein KI-Lauf weicht in der Formulierung ab. Die Zahlen dürfen es nicht.",
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
  if (!text.includes(key.count4)) fail(`${name} lacks "${key.count4}"`);
  for (const sentence of key.sentences) if (!text.includes(sentence)) fail(`${name} lacks the briefing sentence "${sentence}"`);
  const briefing = /^> (.*)$/m.exec(text)?.[1] ?? "";
  expect(`${name} briefing words`, briefing.split(/\s+/).length <= 150, true);
  const [s1, s2, s3, s4, clock] = key.steps;
  const step1 = section(text, s1, s2);
  const step2 = section(text, s2, s3);
  const step3 = section(text, s3, s4);
  const step4 = section(text, s4, clock);
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
  // Step 4: the register. Every number of the section is the oracle's, and the recount agrees (checked above).
  const reg = buildRegister(loadKitFiles(), REGISTER_TODAY);
  const e07 = askPerson(reg, "E-07");
  const countLine = locale === "en" ? `Count: ${reg.rows.length} rows, ${reg.expired.length} expired, ${reg.expiring.length} expiring, ${reg.missing.length} missing.` : `Zählung: ${reg.rows.length} Zeilen, ${reg.expired.length} abgelaufen, ${reg.expiring.length} läuft ab, ${reg.missing.length} fehlen.`;
  if (!step4.includes(countLine)) fail(`${name}: step 4 must say "${countLine}"`);
  if (!step4.includes(registerSummary(reg, locale))) fail(`${name}: step 4 must hold the summary line "${registerSummary(reg, locale)}"`);
  if (!step4.includes(askKeyLine(e07, locale))) fail(`${name}: step 4 must hold the key line "${askKeyLine(e07, locale)}"`);
  const paperRows = rowsOfTable(step4, /^\| (contract|registration|medical-exam|leave-decision|overtime-notice|safety-statement) \|/);
  expect(`${name} step 4 papers`, Object.fromEntries(paperRows.map((row) => row.split("|").slice(1, 3).map((cell) => cell.trim()))), Object.fromEntries(Object.entries(reg.byPaper).map(([paper, n]) => [paper, String(n)])));
  if (!new RegExp(`\\| ${key.total} \\| ${reg.rows.length} \\|`).test(step4)) fail(`${name}: the papers of step 4 must add up to ${reg.rows.length}`);
  for (const entry of [...reg.expired, ...reg.expiring, ...reg.missing]) if (!step4.includes(entry.id)) fail(`${name}: step 4 must name ${entry.id}`);
  for (const sentence of [key.approver, ...key.leaveNote, key.laterSentence, "2027-01-05", "2027-03-01"]) if (!step4.includes(sentence)) fail(`${name}: step 4 lacks "${sentence}"`);
  for (const entry of reg.expiring) if (!step4.includes(entry.validUntil)) fail(`${name}: step 4 must print ${entry.validUntil}`);
  if (/\b(sent|signed|approved) (it|the|a)\b/i.test(step4) && locale === "en") fail(`${name}: the sample of step 4 must not say that the AI sent, signed or approved something`);
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
  ["CHANGELOG.md", ["## 2026-11-08", "## 2026-11-07", "Rebuilt for workshop 5", "Added Step 4"]],
  ["cases/case-A-labour.md", ["## Bottlenecks", "## How often it comes and how it starts", "5,664 regular inspections in 2025 divided by 73,310 active enterprises in 2024 is, on paper, about one regular inspection a year for every 13 active enterprises. It is not the chance for one firm.", "Gradba-Pro was last inspected in spring 2024. Normally nobody opens the binders.", "Sourced:", "This kit's story (invented)", "read on 2026-11-07", "Not legal advice"]],
  ["folder/folder-index.md", ["Last labour inspection: spring 2024 (invented). Nobody has opened the binders since."]],
  ["templates/monthly-check.md", ["Once a month, on a fixed day, one named person does this.", "Run check.py on register.csv with today's date. Print three lists: expired, expiring in the next 60 days, missing. Then draft one short message per owner role. Draft only: send nothing and change no row.", "Never change an old row to hide a gap.", "a small database such as SQLite", "Dates only, no health content."]],
  ["cases/case-B-tax.md", ["Sourced:", "This kit's story (invented)", "ZDP Art. 47(2)", "Size thresholds unverified", "single vendors only, not a market average"]],
  ["cases/case-C-iso.md", ["Sourced:", "This kit's story (invented)", "IAF MD 5:2023", "not a certifier's tariff and not a market average"]],
];
for (const [file, needles] of mustHave) for (const needle of needles) if (!read(file).includes(needle)) fail(`${file} lacks "${needle}"`);
for (const [file, needles] of [
  ["inspektor/verlangen_unterlagen_2026-11-27.md", ["Am Tag des Besuchs öffnen.", "Mo 30. November 2026", "ZIN Art. 53(1)", "E-02"]],
  ["inspektor/protokoll_beispiel_2026-11-27.md", ["Nach Schritt 3 öffnen.", "E-12", "erlässt einen Bescheid mit einer Frist zur Behebung"]],
  ["vorlagen/uebertragungsblatt.md", ["1. Wer prüft", "6. Dein Satz", "Stufe 4"]],
  ["AENDERUNGEN.md", ["## 2026-11-08", "## 2026-11-07"]],
  ["faelle/fall-A-arbeit.md", ["## Wie oft sie kommt und wie sie beginnt", "5.664 reguläre Inspektionen 2025, geteilt durch 73.310 aktive Unternehmen 2024, ergibt auf dem Papier etwa eine reguläre Inspektion im Jahr auf 13 aktive Unternehmen. Das ist nicht die Chance für eine einzelne Firma.", "Gradba-Pro wurde zuletzt im Frühjahr 2024 kontrolliert.", "Belegt:", "Die Geschichte dieses Kits (erfunden)"]],
  ["ordner/ordner-index.md", ["Letzte Arbeitsinspektion: Frühjahr 2024 (erfunden). Seitdem hat niemand die Ordner geöffnet."]],
  ["vorlagen/monatscheck.md", ["Einmal im Monat, an einem festen Tag, macht das eine benannte Person.", "Führe check.py auf register.csv mit dem heutigen Datum aus. Gib drei Listen aus: abgelaufen, läuft in den nächsten 60 Tagen ab, fehlt. Entwirf dann eine kurze Nachricht pro Rolle der Verantwortlichen. Nur Entwürfe: nichts senden und keine Zeile ändern.", "Ändere nie eine alte Zeile, um eine Lücke zu verstecken.", "einer kleinen Datenbank wie SQLite", "Nur Daten, keine Gesundheitsinhalte."]],
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
