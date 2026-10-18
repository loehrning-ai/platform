#!/usr/bin/env node
/**
 * Checks the Workshop 05 kit ("Where Your Data Goes: Using Claude at Work") against itself:
 * the seven files and nothing else, the word budgets, that every file START-HERE names exists,
 * that every prompt is a copy-paste block, that ANSWERS.md matches the invented data (counts,
 * weekdays, scene lights) and the dated lines in facts.md, that "compliant" and "certified" only
 * appear negated, and that nothing from the excluded list (fines, prices, seat numbers, other
 * vendors, article numbers) slipped in. Exit code 1 when one of them drifts.
 *
 * Usage (from the repository root): node scripts/workshop05/verify-kit.mjs
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.join(path.dirname(fileURLToPath(import.meta.url)), "kit");
const FILES = ["START-HERE.md", "ANSWERS.md", "project-instructions.md", "customer-email.md", "company-notes.md", "scenes.md", "facts.md"];
const read = (file) => readFileSync(path.join(KIT, file), "utf8");
const lines = (file) => read(file).split("\n");
const words = (file) => read(file).split(/\s+/).filter(Boolean).length;
const weekday = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });

const failures = [];
const facts = {};
function expect(name, actual, expected) {
  facts[name] = actual;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}
function has(file, pattern) {
  if (!pattern.test(read(file))) failures.push(`${file} does not match ${pattern}`);
}

// 1. Exactly the seven files, flat, text only.
const present = readdirSync(KIT, { recursive: true }).map(String).sort();
expect("files", present, [...FILES].sort());

// 2. Word budgets (as wc -w counts them, code fences included) and style.
for (const [file, max] of [["START-HERE.md", 700], ["ANSWERS.md", 600], ["project-instructions.md", 120], ["facts.md", 600]]) {
  expect(`words ${file}`, words(file) <= max, true);
  facts[`words ${file}`] = words(file);
}
for (const file of FILES) {
  const text = read(file);
  if (/[–—]/.test(text)) failures.push(`${file} has an en or em dash`);
  if (/\blines? \d|\bLn \d/i.test(text)) failures.push(`${file} cites a line number`);
  if (/\/Users\/|mavengence|https?:\/\//i.test(text)) failures.push(`${file} holds a path or a URL`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) failures.push(`${file} is not plain text`);
  if (!/^(#|Invented|Rule 1|Checked)/.test(lines(file)[0]) && file !== "project-instructions.md") failures.push(`${file}: first line is not a title or the word Invented`);
}
for (const file of ["customer-email.md", "company-notes.md", "scenes.md"]) {
  if (!/^Invented\./.test(lines(file)[0])) failures.push(`${file}: line one must say Invented.`);
}
if (!/^All data here is invented/m.test(read("START-HERE.md"))) failures.push("START-HERE.md must say the data is invented");

// 3. Every file START-HERE names exists; no stray file names; the Project step lists the four project files.
const named = [...new Set(read("START-HERE.md").match(/[A-Za-z][\w-]*\.(?:md|csv|txt|png|pdf|zip)\b/g) ?? [])];
expect("startHereNamesExist", named.filter((file) => !existsSync(path.join(KIT, file))), []);
expect("startHereNames", named.sort(), ["ANSWERS.md", "company-notes.md", "customer-email.md", "facts.md", "project-instructions.md", "scenes.md"].sort());

// 4. Prompts: five fenced blocks, each one ready to paste (no blanks, no angle-bracket or underscore holes).
const fences = [...read("START-HERE.md").matchAll(/```\n([\s\S]*?)\n```/g)].map((match) => match[1]);
expect("promptCount", fences.length, 5);
fences.forEach((prompt, index) => {
  if (/_{2,}|<[^>]+>|\[\.\.\.\]|TODO|XXX/.test(prompt)) failures.push(`prompt ${index + 1} has a hole to fill`);
  if (prompt.split(/\s+/).length < 20) failures.push(`prompt ${index + 1} is too short to be a prompt`);
});
expect("promptStarts", fences.map((prompt) => prompt.split(" ").slice(0, 3).join(" ")), [
  "Write a short,",
  "You are a",
  "Rate the 8",
  "Put each use",
  "Answer the three",
]);
has("START-HERE.md", /Mara Beispiel \(invented\), wrote: "My order TH-1042 arrived two days late and the box was damaged\. Can I get a refund\?"/);
has("START-HERE.md", /Use only facts\.md/);

// 5. The three rules: exactly three, the light vocabulary, the two banned words only as an instruction.
const rules = lines("project-instructions.md").filter(Boolean);
expect("ruleCount", rules.length, 3);
rules.forEach((rule, index) => {
  if (!rule.startsWith(`Rule ${index + 1}. `)) failures.push(`rule ${index + 1} is not numbered`);
});
has("project-instructions.md", /NOT IN FILES/);
has("project-instructions.md", /GREEN: public, fine on any tool\. AMBER: only on the company tool, names and numbers removed, a named person must check\. RED: not without a written okay\./);
has("project-instructions.md", /Never write "compliant" or "certified"\./);

// 6. The invented company (120 staff, 25 seats, 9 laptops) and the survey arithmetic.
const notes = read("company-notes.md");
expect("claudeTeamSeats", Number(notes.match(/Claude Team since 1 September\. (\d+) seats/)?.[1]), 25);
expect("desktopLaptops", Number(notes.match(/installed on (\d+) laptops/)?.[1]), 9);
expect("staff", Number(notes.match(/\((\d+) staff\)/)?.[1]), 120);
const survey = notes.match(/(\d+) of (\d+) answered: (\d+) use AI weekly\. (\d+) of those sometimes use a personal account\. (\d+) pasted customer text/);
expect("survey", survey?.slice(1).map(Number), [94, 120, 61, 38, 22]);
if (survey) {
  const [answered, staff, weekly, personal, pasted] = survey.slice(1).map(Number);
  expect("surveyOrder", answered <= staff && personal <= weekly && pasted <= answered, true);
  expect("answeredPercent", Math.round((answered / staff) * 100), 78);
}
has("company-notes.md", /A vendor rep told the CEO "data stays in Europe"\. There is nothing in writing\./);
has("company-notes.md", /In August HR tried a chatbot to rank 12 CVs\./);
has("company-notes.md", /written 6 Oct 2026/);

// 7. The customer: three questions, clause 7, the boss's draft with its three untrue-or-unsure sentences.
const email = read("customer-email.md");
expect("customerQuestions", lines("customer-email.md").filter((line) => /^[123]\. (Which|Where|Is) /.test(line)).length, 3);
has("customer-email.md", /Contract clause 7 \(invented\): AI tools only after written notice to the customer\. Customer data stays in the EU or EEA unless the customer agrees in writing\./);
has("customer-email.md", /1\. We use only the company Claude plan\./);
has("customer-email.md", /2\. All your data stays in the EU\./);
has("customer-email.md", /3\. Claude is never trained on our chats\./);
expect("emailDate", [weekday("2026-11-30"), weekday("2026-12-04")], ["Monday", "Friday"]);
has("customer-email.md", /Monday 30 November 2026/);
has("ANSWERS.md", /answer by 4 December/);

// 8. Scenes: eight, in the order ANSWERS.md keys, each at most 25 words, none with a light or an answer in it.
const sceneBlocks = [...read("scenes.md").matchAll(/^Scene (\d)\n(.+)$/gm)].map((match) => ({ n: Number(match[1]), text: match[2] }));
expect("sceneNumbers", sceneBlocks.map((scene) => scene.n), [1, 2, 3, 4, 5, 6, 7, 8]);
expect("sceneNames", sceneBlocks.map((scene) => scene.text.split(",")[0]), ["Ana", "Stefan", "Elena", "Marko", "Jovana", "Mila", "Petar", "Dario"]);
sceneBlocks.forEach((scene) => {
  if (scene.text.split(/\s+/).length > 25) failures.push(`scene ${scene.n} is over 25 words`);
  if (/\b(GREEN|AMBER|RED)\b/.test(scene.text)) failures.push(`scene ${scene.n} gives its light away`);
});
const sceneHints = [/complaint email/, /public text/, /Claude Team\. Pastes a customer call/, /API key/, /three CVs/, /IBANs/, /whole Documents folder/, /20 real rows/];
sceneHints.forEach((hint, index) => {
  if (!hint.test(sceneBlocks[index]?.text ?? "")) failures.push(`scene ${index + 1} does not match the key in ANSWERS.md`);
});
has("scenes.md", /Scene 1 text \(for mission 2, invented\):\n\nHello, my order TH-1042 never arrived\. My name is Mara Beispiel, I live at Beispielweg 7, 99999 Musterstadt\. Please write to mara\.beispiel@example\.com\. This is the second time\./);

// 9. ANSWERS.md mission 3 key: eight lights in the order of the scenes, 3 RED, 4 AMBER... counted from the key itself.
const answers = read("ANSWERS.md");
const key3 = answers.split("## Mission 3 key")[1].split("## Mission 4 key")[0];
const lights = [...key3.matchAll(/^(\d)\. (GREEN|AMBER|RED)\b/gm)].map((match) => [Number(match[1]), match[2]]);
expect("mission3Lights", lights, [[1, "RED"], [2, "GREEN"], [3, "AMBER"], [4, "RED"], [5, "AMBER"], [6, "AMBER"], [7, "RED"], [8, "RED"]]);
expect("mission3Counts", ["RED", "AMBER", "GREEN"].map((light) => lights.filter(([, value]) => value === light).length), [4, 3, 1]);
expect("sixOfEight", Math.ceil((6 / 8) * 100), 75);
has("ANSWERS.md", /Six of eight matching is good\. Enterprise does not turn red into green\./);
has("ANSWERS.md", /5\. AMBER\. Names out, ask HR\. Ranking people is high-risk from 2 Dec 2027\./);

// 10. Mission 4 key and the dated boxes: the same dates in START-HERE, ANSWERS.md and facts.md.
const key4 = answers.split("## Mission 4 key")[1].split("## Mission 5")[0];
const boxes = [...key4.matchAll(/^(\d)\. (EVERYDAY|TELL PEOPLE|HIGH-RISK|BANNED)/gm)].map((match) => [Number(match[1]), match[2]]);
expect("mission4Boxes", boxes, [[1, "EVERYDAY"], [2, "TELL PEOPLE"], [3, "TELL PEOPLE"], [4, "HIGH-RISK"], [5, "BANNED"]]);
has("ANSWERS.md", /2\. TELL PEOPLE since 2 Aug 2026\. Check your role\./);
has("ANSWERS.md", /4\. HIGH-RISK from 2 Dec 2027\./);
has("ANSWERS.md", /5\. BANNED since 2 Feb 2025\./);
expect("lawDatesInOrder", ["2025-02-02", "2026-08-02", "2027-12-02"].every((date, i, all) => i === 0 || date > all[i - 1]), true);
has("facts.md", /AI literacy duty since 2 Feb 2025\. Since 27 Jul 2026: take measures/);
has("facts.md", /Banned since 2 Feb 2025: reading staff emotions/);
has("facts.md", /Since 2 Aug 2026: tell people when they deal with AI/);
has("facts.md", /From 2 Dec 2027: high-risk uses such as ranking applicants or rating staff \(moved from 2 Aug 2026\)/);

// 11. Mission 5: the sample page agrees with facts.md and the notes, and the traps are set.
const mission5 = answers.split("## Mission 5")[1].split("## The three vendor questions")[0];
has("ANSWERS.md", /Anthropic's page of 15 June 2026 says data is stored in the US/);
has("facts.md", /Chat data is stored in the US\..*\| Anthropic privacy 7996890 \| 2026-06-15/);
has("ANSWERS.md", /Team chats are not used for training by default \(Anthropic, 18 August 2026\)/);
has("facts.md", /Team and Enterprise chats are not used for training by default\..*\| Anthropic privacy 7996868 \| 2026-08-18/);
expect("trapNotesVsFacts", [/data stays in Europe/.test(notes), /stored in the US/.test(read("facts.md")), /stays in the EU/.test(email)], [true, true, true]);
expect("sampleOwners", [...mission5.matchAll(/Owner: ([A-Za-z ]+)\./g)].map((match) => match[1]), ["IT lead", "CEO"]);
expect("sampleWordsUnder150", mission5.split("Sample page:")[1].split("Rules:")[0].split(/\s+/).filter(Boolean).length <= 150, true);

// 12. The three vendor questions equal the ones in the deck, and the limits line is word for word.
has("ANSWERS.md", /1\. Where is our chat data stored and processed\?/);
has("ANSWERS.md", /2\. Which contract applies to our plan\? Does it include a data processing agreement\?/);
has("ANSWERS.md", /3\. How long are our chats kept, and who can delete them\?/);
has("ANSWERS.md", /Not in the pages we read on 18 Oct 2026: Team retention period, EU storage for chat apps, what Desktop sends exactly\./);
has("ANSWERS.md", /Claude's wording varies\. Check its answer against the lines below, never against exact words\./);

// 13. facts.md: fifteen dated lines, each "statement | source | date", and the closing block.
const factLines = lines("facts.md").filter((line) => /^\d+\. /.test(line));
expect("factLines", factLines.length, 15);
factLines.forEach((line, index) => {
  const parts = line.replace(/^\d+\. /, "").split(" | ");
  if (parts.length !== 3 || parts.some((part) => !part.trim())) failures.push(`facts.md line ${index + 1} is not statement | source | date`);
  if (!/\d{4}-\d{2}-\d{2}|undated/.test(parts[2] ?? "")) failures.push(`facts.md line ${index + 1} has no date`);
});
has("facts.md", /^Checked 18 Oct 2026\. Vendor pages change: re-read before you rely on this\./m);
has("facts.md", /Not in the files: default of the training switch for new personal accounts, Team retention period, EU storage for the chat apps, whether Team gets a data processing agreement automatically, what Desktop sends exactly\. Write NOT IN FILES and ask the vendor in writing\./);

// 14. "compliant" and "certified" only as an instruction not to write them, or negated.
for (const file of FILES) {
  lines(file).forEach((line, index) => {
    if (/\b(compliant|certified)\b/i.test(line) && !/never|no certificate|must not|remove that word/i.test(line)) {
      failures.push(`${file}:${index + 1} uses compliant or certified without a negation`);
    }
  });
}
// A line that says the EU claim is fine must not exist.
if (/(stays|stay) in the EU[^.]*\bGREEN\b/i.test(answers)) failures.push("ANSWERS.md calls the EU claim GREEN");

// 15. Excluded on purpose: fines, prices, seat prices, other vendors, article numbers, switch default, retention number.
for (const file of FILES) {
  const text = read(file);
  const banned = [
    [/[€$£]|\bEUR\b|\bUSD\b|\bper seat\b|\bper month\b/i, "a price"],
    [/\bfines? (?:of|up to)\b|\bpenalt|\bmillion\b|% of (?:worldwide )?(?:annual )?turnover/i, "a fine"],
    [/\bSamsung\b|\bOpenAI\b|\bChatGPT\b|\bGartner\b|\bTELUS\b|\bLayerX\b|\bCyberhaven\b|\bIBM\b|\bEurostat\b/, "an excluded source"],
    [/\bArticle \d|\bArt\.? \d|\bAnnex\b/, "an article number"],
    [/2 Dec(?:ember)? 2026|2 Aug(?:ust)? 2028|2030/, "an excluded date"],
    [/\bsub-?processors?\b|\bzero data retention\b/i, "an excluded topic"],
  ];
  for (const [pattern, label] of banned) if (pattern.test(text)) failures.push(`${file} holds ${label}`);
  if (/\b(default is|on by default|off by default)\b/i.test(text) && !/Team|Enterprise|not confirmed|not state/.test(text)) failures.push(`${file} states a switch default`);
}
has("ANSWERS.md", /The default is not confirmed, so look at yours\./);
has("facts.md", /The page does not state the default: look at yours\./);
has("facts.md", /Team: saved chats have no fixed period stated\. Deleted chats go within 30 days\./);
has("facts.md", /The page offers no EU-only option\./);
has("facts.md", /Admins can switch Cowork off and limit it\. This is our reading: check the vendor page\./);
has("scenes.md", /Desktop app with Cowork\. Connects his whole Documents folder/);

console.log(JSON.stringify(facts, null, 2));
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nKit facts verified.");
