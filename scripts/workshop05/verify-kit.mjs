#!/usr/bin/env node
/**
 * Checks the Workshop 05 kit ("Audit Preparation with AI: Organize Evidence and Find Gaps") against
 * itself: exactly the files build-kit.mjs lists, every file labelled as fictional training material,
 * every figure ANSWERS.md states recomputed from the folder (8 of 11 in the index, 2 COVERED, 4 WEAK,
 * 2 GAP, 25 of 120 trained, 114 needed, 30.5 hours, 295 days without a rule, 638 days since v3), the
 * weekdays of the letter, every quote ANSWERS.md gives found word for word in its file, the R7 email
 * equal to the template filled in, and no dash, path or banned word. Exit code 1 when one of them drifts.
 *
 * Usage (from the repository root): node scripts/workshop05/verify-kit.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KIT_FILES, buildKit } from "./build-kit.mjs";

const KIT = path.join(path.dirname(fileURLToPath(import.meta.url)), "kit");
const read = (file) => readFileSync(path.join(KIT, file), "utf8");
const DAY = 86_400_000;
const days = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
const weekday = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });

const failures = [];
const facts = {};
function expect(name, actual, expected) {
  facts[name] = actual;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

// 1. Exactly the kit files, under 40 KB zipped.
const walk = (dir, base = "") =>
  readdirSync(dir).flatMap((entry) => (statSync(path.join(dir, entry)).isDirectory() ? walk(path.join(dir, entry), `${base}${entry}/`) : [`${base}${entry}`]));
expect("files", walk(KIT).sort(), [...KIT_FILES].sort());
const zipBytes = buildKit().length;
expect("zipUnder40KB", zipBytes < 40 * 1024, true);
facts.zipBytes = zipBytes;

// 2. Labels and style.
for (const file of KIT_FILES) {
  const text = read(file);
  const head = text.split("\n").slice(0, 3).join("\n");
  if (!file.startsWith("templates/") && !/Fictional training material/.test(head)) failures.push(`${file}: the first lines must say Fictional training material`);
  if (/[‒–—―]/.test(text)) failures.push(`${file} has an en or em dash`);
  if (/\/Users\/|\/private\/|mavengence|facilitator\//i.test(text)) failures.push(`${file} holds an internal path`);
  const urls = text.match(/https?:\/\/\S+/g) ?? [];
  for (const url of urls) if (url !== "https://privacy.claude.com/en/articles/7996890") failures.push(`${file} links ${url}`);
  if (/by friday|your boss|urgent|countdown|game changer|seamless|\bscores?\b/i.test(text)) failures.push(`${file} uses a banned word`);
  if (/^#{1,6}\s.*\?\s*$/m.test(text)) failures.push(`${file} has a heading that asks`);
}

// 3. The letter: weekdays and the window.
const request = read("request_tannwald.md");
expect("sentWeekday", weekday("2026-11-09"), "Monday");
expect("auditWeekday", weekday("2026-12-10"), "Thursday");
expect("dueWeekday", weekday("2026-11-25"), "Wednesday");
for (const line of ["Sent: Monday 9 November 2026", "Remote audit: Thursday 10 December 2026", "by Wednesday 25 November 2026", "dated on or after 10 December 2025", "at least 95%", "within 48 hours"]) {
  if (!request.includes(line)) failures.push(`request_tannwald.md lacks "${line}"`);
}
if (!read("START-HERE.md").includes("Exercise date: Monday 9 November 2026.")) failures.push("START-HERE.md must state the exercise date");

// 4. Figures recomputed from the folder.
const rows = (file) => read(`folder/${file}`).split("\n").filter((line) => line && !line.startsWith("#")).slice(1);
const training = rows("training-records_2026.csv").map((line) => line.split(",")[0]);
const unique = new Set(training).size;
const staff = Number(read("folder/training-records_2026.csv").match(/Staff on \S+ (\d+)\./)[1]);
expect("trainingRows", training.length, 26);
expect("trainingUnique", unique, 25);
expect("staff", staff, 120);
expect("sharePercent", Math.round((unique / staff) * 1000) / 10, 20.8);
expect("needed", Math.ceil(0.95 * staff), 114);
expect("missing", Math.ceil(0.95 * staff) - unique, 89);
const inc02 = read("folder/incident-log_2026.csv").split("\n").find((line) => line.startsWith("INC-02"));
const [detected, told] = inc02.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g);
expect("incidentHours", (Date.parse(`${told.replace(" ", "T")}:00Z`) - Date.parse(`${detected.replace(" ", "T")}:00Z`)) / 3_600_000, 30.5);
expect("ruleGapDays", days("2025-12-10", "2026-10-01"), 295);
expect("v3DaysShort", days("2024-03-12", "2025-12-10"), 638);

// 5. ANSWERS.md states the same figures and every quote it gives is in its file.
const answers = read("ANSWERS.md");
for (const line of ["8 of 11 files pass DATE and APPROVAL.", "Count: 2 COVERED, 4 WEAK, 2 GAP.", "25 of 120 = 20.8%; 95% needs 114", "told after 30.5 hours", "(295 days)"]) {
  if (!answers.includes(line)) failures.push(`ANSWERS.md lacks "${line}"`);
}
const mission2 = answers.slice(answers.indexOf("## Mission 2"), answers.indexOf("Count:"));
const statuses = [...mission2.matchAll(/^\| R\d \|.*\| (COVERED|WEAK|GAP) \|$/gm)].map((match) => match[1]);
expect("statusCount", ["COVERED", "WEAK", "GAP"].map((status) => statuses.filter((value) => value === status).length), [2, 4, 2]);
const fileOf = { R1: "system-list_2026-09.csv", R2: "subprocessors_2026-09.csv", R3: "ai-use-rule_v1.md", R4: "access-review_2026-08-14.csv", R5: "training-records_2026.csv", R6: "incident-log_2026.csv", R7: "backup-report_2026-10.txt" };
for (const [item, file] of Object.entries(fileOf)) {
  const row = mission2.split("\n").find((line) => line.startsWith(`| ${item} |`));
  for (const [, quote] of row.matchAll(/"([^"]+)"/g)) if (!read(`folder/${file}`).includes(quote)) failures.push(`${item}: "${quote}" is not in ${file}`);
}
const mission1 = answers.slice(answers.indexOf("## Mission 1"), answers.indexOf("## Mission 2"));
expect("indexPass", [...mission1.matchAll(/\| pass \| pass \|$/gm)].length, 8);

// 6. The R7 email in ANSWERS.md is the template, filled in.
const filled = read("templates/gap-request.md")
  .replace("[Customer] audit on [audit date], [item]: [document] needed by [date]", "Tannwald audit on 10 December 2026, R7: restore test record needed by 2 December 2026")
  .replace("[owner]", "Goran")
  .replace("[customer] audit on [audit date], item [item]", "Tannwald audit on 10 December 2026, item R7")
  .replace("[request text, word for word]", "A restore test of your backups from the last 12 months, with its result")
  .replace("[file], dated [date]", "backup-report_2026-10.txt, dated 1 November 2026")
  .replace("[DATE / APPROVAL / SCOPE / QUOTE]: [one sentence with the quote or the empty field]", 'QUOTE: the record says "Restore test: not done in 2026." and no other file shows one')
  .replace(
    "[document], dated on or after [window start], [approved / made] by [role], covering [systems, people, period]",
    "a restore test record (date, data restored, result, who), dated on or after 10 December 2025, made by the IT lead, covering the Servicepult export and the file share",
  )
  .replace("by [date]", "by 2 December 2026")
  .replace("give [customer] a date", "give Tannwald a date");
const emailBlock = answers.match(/Example email \(R7\)[^\n]*\n\n```\n([\s\S]*?)```/)?.[1];
expect("r7EmailIsTemplate", emailBlock === filled, true);
if (emailBlock !== filled) console.error(JSON.stringify({ emailBlock, filled }, null, 1));

// 7. The vendor lines, verbatim.
const vendor = read("folder/vendor-page_claude_2026-06-15.md");
for (const line of ['"By default, we may route customer traffic to select countries in the US, Europe, Asia and Australia"', '"Note that data is stored in the US."', "Page date: 15 June 2026."]) {
  if (!vendor.includes(line)) failures.push(`vendor page lacks ${line}`);
}

console.log(JSON.stringify(facts, null, 2));
if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nWorkshop 05 kit: every check passed.");
