#!/usr/bin/env node
/**
 * Checks every fact that ANSWERS.md and the deck print against the kit's source files:
 * counts, date differences, percentages and the strings (file plus row or quoted words) the answer key cites,
 * the one status rule across files, and the word budget of the guide, the key and the instructions.
 * Exit code 1 when one of them drifts.
 *
 * Usage (from the repository root): node scripts/workshop05/verify-kit.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.join(path.dirname(fileURLToPath(import.meta.url)), "kit");
const read = (file) => readFileSync(path.join(KIT, file), "utf8");
const lines = (file) => read(file).split("\n");
const csv = (file) =>
  lines(file)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.match(/("([^"]*)"|[^,]*)(,|$)/g).map((cell) => cell.replace(/,$/, "").replace(/^"|"$/g, "")))
    .slice(1);
const days = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
const addDays = (date, n) => new Date(Date.parse(date) + n * 86400000).toISOString().slice(0, 10);

const TODAY = "2026-11-13";
const AUDIT = "2026-12-03";
const failures = [];
const facts = {};
function expect(name, actual, expected) {
  facts[name] = actual;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

// Training: 31 staff, share trained, and the number needed for 95%.
const training = csv("project-files/training_records_2026.csv");
const security = training.filter((row) => row[3] !== "open").length;
const ai = training.filter((row) => row[4] !== "open").length;
expect("staff", training.length, 31);
expect("securityTrained", security, 26);
expect("aiTrained", ai, 19);
expect("securityPercent", Number(((security / 31) * 100).toFixed(1)), 83.9);
expect("aiPercent", Number(((ai / 31) * 100).toFixed(1)), 61.3);
expect("neededFor95", Math.ceil(0.95 * 31), 30);

// Tickets: 20, by tool, and the Claude tickets that carry a patient name.
const tickets = csv("project-files/support_tickets_sample.csv");
const byTool = (tool) => tickets.filter((row) => row[3] === tool);
expect("tickets", tickets.length, 20);
expect("triageTickets", byTool("triage-model").length, 9);
expect("claudeTickets", byTool("claude").length, 8);
expect("noToolTickets", byTool("none").length, 3);
const named = byTool("claude").filter((row) => /(Trajkova|Stojanova|Ilievski|Markovska|Dimitrov)/.test(row[4]));
expect("claudeWithPatientName", named.length, 5);
expect("claudeWithPatientNameIds", named.map((row) => row[0]), ["T-2285", "T-2286", "T-2291", "T-2293", "T-2298"]);
expect("triageTicketsWithName", byTool("triage-model").filter((row) => /[A-Z][a-z]+ [A-Z][a-z]+/.test(row[4].replace(/Patient P-\d+/g, ""))).length, 0);

// Access review: 9 admin accounts, 8 with MFA, 2 leavers who logged in after leaving.
const access = csv("project-files/access_review_2026.csv");
expect("adminAccounts", access.length, 9);
expect("adminWithMfa", access.filter((row) => row[3] === "yes").length, 8);
const leavers = access.filter((row) => row[1].startsWith("left"));
expect("leaversKept", leavers.map((row) => [row[0], row[5]]), [["adm-04", "keep"], ["adm-07", "keep"]]);
expect(
  "leaverLoginsAfterLeaving",
  leavers.map((row) => [row[0], days(row[1].replace("left ", ""), row[4])]),
  [["adm-04", 33], ["adm-07", 1]],
);

// Incidents.
const incidents = csv("project-files/incident_log_2026.csv");
const inc3 = incidents.find((row) => row[0] === "INC-03");
expect("inc3Days", days(inc3[1], inc3[5]), 7);
expect("inc3Hours", days(inc3[1], inc3[5]) * 24, 168);
expect("inc4OpenDays", days("2026-08-03", TODAY), 102);
expect("inc4OpenDaysAtExport", days("2026-08-03", "2026-11-02"), 91);

// Dates against the audit.
expect("auditCutoff", addDays(AUDIT, -365), "2025-12-03");
expect("pentestAgeMonthsToAudit", days("2025-02-28", AUDIT) > 600, true);
expect("pentestDaysToAudit", days("2025-02-28", AUDIT), 643);
expect("policyOverdueDays", days("2026-06-18", TODAY), 148);
expect("restoreTestAgeDays", days("2026-08-18", AUDIT), 107);
expect("daysTodayToAudit", days(TODAY, AUDIT), 20);

// The erasure trace and the surprise.
expect("erasureDays", days("2026-09-02", "2026-09-21"), 19);
expect("lastBackupExpired", addDays("2026-09-21", 35), "2026-10-26");
expect("lastBackupExpiredFromRequest", addDays("2026-09-02", 35), "2026-10-07");
expect("triageServerDays", days("2026-03-27", TODAY), 231);
expect("policyBeforeServerDays", days("2025-06-18", "2026-03-27"), 282);
expect("hostingNoteAfterServerDays", days("2026-03-27", "2026-04-09"), 13);
expect("invoiceAgeDays", days("2026-11-01", TODAY), 12);
expect("invoiceTotal", 389 + 25, 414);

// Training: everyone with AI training also has security training, so 19 have both.
expect("trainedInBoth", training.filter((row) => row[3] !== "open" && row[4] !== "open").length, 19);

// Strings the answer key cites. The key names a file plus a row ID or quoted words, never a line number.
function has(file, pattern) {
  if (!pattern.test(read(file))) failures.push(`${file} does not match ${pattern}`);
}
has("project-files/data_inventory.csv", /^termin-support-exports \(bucket\),.*,us-central1,/m);
has("project-files/supplier_register.csv", /^Nordgrid Cloud AB,.*,pending,,none,$/m);
has("project-files/supplier_register.csv", /^Anthropic .*,none by policy,not recorded,accepted online,/m);
has("project-files/supplier_register.csv", /^Mailrelay Oy,.*,2025-03-01$/m);
has("project-files/supplier_register.csv", /^Google Cloud EMEA,.*,europe-west3 and us-central1,signed,.*,SCCs in the DPA,/m);
has("project-files/ai_acceptable_use_policy.md", /Next review: 2026-06-18/);
has("project-files/ai_acceptable_use_policy.md", /Approved: 2025-06-18/);
has("project-files/ai_acceptable_use_policy.md", /The model runs in our EU environment/);
has("project-files/ai_acceptable_use_policy.md", /Never paste patient data into the Claude workspace/);
has("project-files/ai_hosting_note.txt", /Name, version and licence: not recorded\. Not fine-tuned\./);
has("project-files/ai_hosting_note.txt", /Written by the Head of Engineering on 2026-04-09/);
has("project-files/ai_hosting_note.txt", /sales page says "EU data centre"/);
has("project-files/ai_hosting_note.txt", /never rotated or deleted/);
has("project-files/ai_hosting_note.txt", /impact assessment: not done/);
has("project-files/pentest_summary_2025.txt", /Report date: 2025-02-28/);
has("project-files/pentest_summary_2025.txt", /Out of scope: admin back office, helpdesk exports, any AI component/);
has("project-files/incident_log_2026.csv", /exported on 2026-11-02/);
has("project-files/incident_log_2026.csv", /^INC-03,2026-05-04,.*,2026-05-11,manual export step,,closed$/m);
has("project-files/incident_log_2026.csv", /^INC-04,2026-08-03,.*,not decided,not investigated,,open$/m);
has("project-files/access_review_2026.csv", /^adm-04,left 2026-06-30/m);
has("project-files/access_review_2026.csv", /^adm-06,.*,no,/m);
has("project-files/access_review_2026.csv", /^adm-07,left 2026-07-31/m);
has("project-files/access_review_2026.csv", /performed 2026-08-14 by the Head of Operations/);
has("project-files/backup_restore_test_2026.txt", /First attempt failed.*CH-0412/);
has("project-files/backup_restore_test_2026.txt", /Second attempt succeeded.*3 h 10 min \(target 4 h\)/);
has("project-files/backup_restore_test_2026.txt", /kept for 35 days/);
has("project-files/backup_restore_test_2026.txt", /Previous test: 2026-02-17/);
has("project-files/retention_and_erasure_policy.md", /within 30 days/);
has("project-files/retention_and_erasure_policy.md", /production database, the lab-PDF bucket and the helpdesk/);
has("project-files/retention_and_erasure_policy.md", /expire after 35 days/);
has("project-files/company_profile.md", /We keep all production data in the EU/);
has("project-files/company_profile.md", /We have no certificate yet/);
has("project-files/company_profile.md", /Stage 1 is booked for February 2027/);
has("project-files/audit_topics_reference.md", /applied since 2 February 2025/);
has("inbox/1-rheinland-document-request.md", /Remote audit on Thursday 3 December 2026/);
has("inbox/3-erasure-request.md", /2026-09-02/);
const claims = lines("inbox/2-trust-page-claims.md").filter((line) => /^\d\. /.test(line));
expect("claimsCount", claims.length, 7);
for (const [n, text] of [[1, /never leaves the EU/], [2, /ISO 27001 certified/], [3, /EU data centre/], [4, /train or fine-tune/], [5, /All our staff are trained/], [6, /Every admin account/], [7, /back up daily/]]) {
  if (!text.test(claims[n - 1] ?? "") || !claims[n - 1].startsWith(`${n}. `)) failures.push(`claim ${n} is not as the key expects`);
}
expect("neededFor95Exact", Number((0.95 * 31).toFixed(2)), 29.45);

// The one status rule: identical wording in the instructions, the guide and the reference.
const rule3 = lines("project-instructions.md").find((line) => line.startsWith("3. ")).slice(3);
const bulletRule = (file) =>
  lines(file)
    .filter((line) => /^- (\*\*)?(COVERED|WEAK|GAP|Several parts|Claims)/.test(line) || line.startsWith("- A named owner"))
    .map((line) => line.replace(/^- /, "").replace(/\*\*/g, ""))
    .join(" ");
for (const file of ["START-HERE.md", "project-files/audit_topics_reference.md"]) {
  if (bulletRule(file) !== rule3) failures.push(`${file}: the status rule differs from rule 3 of project-instructions.md`);
}

// Simplicity budget (words as wc -w counts them) and no line-number citations.
const words = (file) => read(file).split(/\s+/).filter(Boolean).length;
for (const [file, max] of [["START-HERE.md", 1700], ["ANSWERS.md", 2500], ["project-instructions.md", 300]]) {
  expect(`words ${file}`, words(file) <= max, true);
  facts[`words ${file}`] = words(file);
}
for (const file of ["START-HERE.md", "ANSWERS.md"]) {
  if (/\blines? \d|\bLn \d/i.test(read(file))) failures.push(`${file} cites a line number`);
  if (/[\u2013\u2014]/.test(read(file))) failures.push(`${file} has a dash`);
}

console.log(JSON.stringify(facts, null, 2));
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nKit facts verified.");
