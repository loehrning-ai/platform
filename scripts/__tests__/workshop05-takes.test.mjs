/**
 * Workshop 05 recordings: the prompt files are the START file blocks of the shipped zips, the recipe
 * names exactly the kit files the recording plan lists, the pre-flight is clean, the acceptance rule (rules 1
 * to 11, scripts/workshop05/recordings/check-take.mjs) accepts a take that matches the key and refuses
 * each way a take can go wrong, and every stored take named in deck-src/takes.json is current: its kit
 * files, its instructions and its prompts are the ones in the zip a visitor downloads. Without
 * takes.json (before the takes are chosen) only the stored-take checks are skipped.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { preflightProblems } from "../demos/record-claude-run.mjs";
import { REGISTER_TODAY, askPerson, buildRegister, registerCsv } from "../workshop05/oracle/oracle.mjs";
import { loadKitFiles } from "../workshop05/oracle/load.mjs";
import { takeCommand } from "../workshop05/recordings/commands.mjs";
import { bannedHits, checkTake, compareRegister, digitsFor, doneClaims, filledSignOffs, fixedPapersDates, numbersNear, parseCsv, perFileSum, setAside, statusesOf, storedTakeIds, tableRows } from "../workshop05/recordings/check-take.mjs";
import { indentedBlocks, promptsFromZip, readPromptFile } from "../workshop05/recordings/extract-prompts.mjs";
import {
  BLOCK_ORDER,
  EDITIONS,
  LOCALES,
  PROMPT_IDS,
  RECORDINGS,
  RUNS_DIR,
  SLUG,
  instructionsEntry,
  kitFilesFor,
  recorderArgs,
  zipEntries,
  zipPathRelative,
  zipText,
} from "../workshop05/recordings/recipe.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const EXPECTED = JSON.parse(readFileSync(path.join(REPO, "scripts/workshop05/oracle/expected.json"), "utf8"));
const TAKES_JSON = path.join(REPO, "scripts/workshop05/deck-src/takes.json");
const register = buildRegister(loadKitFiles(), REGISTER_TODAY);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const FORBIDDEN = /\/Users\/|\/private\/|\/var\/folders|session_id|signature|\/home\/[a-z]/;
const blocks = Object.fromEntries(LOCALES.map((locale) => [locale, promptsFromZip(locale)]));

// ---------------------------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------------------------

test("each prompt file is the 4-space-indented block of the START file inside the shipped zip", () => {
  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(blocks[locale]), BLOCK_ORDER);
    for (const id of BLOCK_ORDER) {
      assert.equal(readPromptFile(locale, id), blocks[locale][id], `${locale} ${id}: run scripts/workshop05/recordings/extract-prompts.mjs`);
      assert.ok(!blocks[locale][id].includes("\n"), `${locale} ${id} is one paragraph`);
    }
  }
  assert.deepEqual(indentedBlocks("text\n\n    one\n    two\n\ntext\n    three\n"), ["one\ntwo", "three"]);
});

test("the prompts keep the numbers of the step texts: step 4 has two prompts, no step prompt is above 150 words", () => {
  assert.deepEqual(PROMPT_IDS, { chain: ["chain-1", "chain-2", "chain-3"], register: ["register-1", "register-2"] });
  for (const locale of LOCALES) {
    for (const id of BLOCK_ORDER) assert.ok(blocks[locale][id].split(/\s+/).length <= 150, `${locale} ${id}`);
    assert.match(blocks[locale]["register-1"], /26\. ?Nov|26 Nov/);
    assert.match(blocks[locale]["register-2"], /E-07/);
  }
});

test("the deck shows the same prompt text as the START files once it carries the step 4 prompts", (t) => {
  for (const locale of LOCALES) {
    const file = path.join(REPO, "packages/website/public/workshops", SLUG, locale === "en" ? "en/slides.html" : "slides.html");
    if (!existsSync(file)) continue;
    const decode = (text) => text.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
    const bodies = [...readFileSync(file, "utf8").matchAll(/class="prompt-body[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p|pre|code)>/g)].map((match) => decode(match[1]));
    if (!bodies.some((body) => /register\.csv/.test(body))) {
      t.diagnostic(`${locale}: the deck does not carry the step 4 prompt yet (lane D); the comparison is skipped`);
      continue;
    }
    const all = Object.values(blocks[locale]);
    for (const body of bodies) assert.ok(all.includes(body), `${locale}: a prompt card differs from the START file: ${body.slice(0, 60)}`);
  }
});

// ---------------------------------------------------------------------------------------------
// Recipe and pre-flight
// ---------------------------------------------------------------------------------------------

test("a chain recording puts 22 kit files in the workspace, a register recording 15, and never the answers, the inspector files or cases B and C", () => {
  for (const locale of LOCALES) {
    const entries = zipEntries(locale);
    const chain = kitFilesFor(locale, "chain", entries);
    const reg = kitFilesFor(locale, "register", entries);
    assert.equal(chain.length, 3 + 14 + 5, `${locale} chain`);
    assert.equal(reg.length, 14 + 1, `${locale} register`);
    const edition = EDITIONS[locale];
    for (const file of [...chain, ...reg]) {
      assert.ok(entries.includes(file));
      assert.ok(!/ANSWERS|LOESUNGEN|inspector|inspektor|case-B|case-C|fall-B|fall-C|SKILL|CHANGELOG|AENDERUNGEN|START-/.test(file), file);
      assert.ok(!file.endsWith(edition.instructions), "the instructions go in as a system prompt, not as a file");
    }
    assert.ok(chain.includes(`${edition.root}/${edition.chain.files[0]}`));
    assert.ok(reg.includes(`${edition.root}/${edition.registerTemplate}`));
    assert.ok(!reg.some((file) => /checklist|pruefliste|cases|faelle|evidence|clock|note|papier|notice|mitteilung/.test(file.replace(/overtime_notices_folder|meldungen_ueberstunden_ordner/, ""))), `${locale} register has only the folder and the template`);
    assert.ok(entries.includes(instructionsEntry(locale)));
  }
});

test("the pre-flight is clean: no machine path and no forbidden word in a workspace file, the instructions or a prompt", () => {
  for (const locale of LOCALES) {
    const entries = zipEntries(locale);
    for (const recording of RECORDINGS) {
      const files = kitFilesFor(locale, recording, entries).map((entry) => ({ name: entry, text: zipText(locale, entry) }));
      const instructions = { name: "instructions", text: zipText(locale, instructionsEntry(locale)) };
      const prompts = PROMPT_IDS[recording].map((id) => blocks[locale][id]);
      assert.deepEqual(preflightProblems({ files, instructions, prompts }), [], `${locale} ${recording}`);
      for (const file of files) assert.equal((file.text.match(/signature/gi) ?? []).length, 0, file.name);
    }
  }
});

test("the recorder command line has the flags of the recording plan, one kit-file flag per file and the prompts in turn order", () => {
  for (const locale of LOCALES) {
    for (const recording of RECORDINGS) {
      const args = recorderArgs({ locale, recording, take: 2 });
      const at = (flag) => args.indexOf(flag);
      assert.equal(args[at("--id") + 1], `${locale}-${recording}-2`);
      assert.equal(args[at("--take") + 1], "2");
      assert.equal(args[at("--prompt-id") + 1], recording);
      assert.equal(args[at("--kit-zip") + 1], zipPathRelative(locale));
      assert.equal(args.filter((arg) => arg === "--kit-file").length, kitFilesFor(locale, recording).length);
      for (const flag of ["--keep-paths", "--no-skill", "--allow-python", "--allow-write", "--preflight"]) assert.ok(args.includes(flag), flag);
      assert.equal(args[at("--instructions-file") + 1], instructionsEntry(locale));
      assert.ok(!args.includes("--model"), "no --model unless the default model is unavailable");
      assert.deepEqual(args.filter((_, index) => args[index - 1] === "--follow-up-file").map((file) => path.basename(file)), PROMPT_IDS[recording].slice(1).map((id) => `prompt-${locale}-${id}.txt`));
      assert.equal(path.basename(args[at("--prompt-file") + 1]), `prompt-${locale}-${PROMPT_IDS[recording][0]}.txt`);
      assert.ok(args.every((arg) => !path.isAbsolute(arg) || arg.startsWith("$")), "relative paths only");
    }
  }
  assert.ok(recorderArgs({ locale: "en", recording: "chain", take: 1, model: "claude-opus-5-5" }).includes("--model"));
});

test("the extra take 5 reads prompt files copied with one plain sentence; takes 1 to 4 read the START blocks", () => {
  const extra = takeCommand({ locale: "de", recording: "register", take: 5 });
  assert.equal(extra.length, 3);
  assert.match(extra[0], /printf/);
  assert.match(extra[2], /--prompt-file \$RAW\/prompt-de-register-1\.txt/);
  const plain = takeCommand({ locale: "en", recording: "chain", take: 1 });
  assert.equal(plain.length, 1);
  assert.match(plain[0], /--prompt-file scripts\/workshop05\/recordings\/prompts\/prompt-en-chain-1\.txt/);
});

// ---------------------------------------------------------------------------------------------
// The acceptance rule on synthetic takes
// ---------------------------------------------------------------------------------------------

const WORDS = {
  en: { covered: "COVERED", weak: "WEAK", gap: "GAP", nif: "NOT IN FILES", approver: "NOT IN FILES" },
  de: { covered: "BELEGT", weak: "SCHWACH", gap: "LÜCKE", nif: "NICHT IN DATEIEN", approver: "NICHT IN DATEIEN" },
};

const turn = (text, timeline = []) => ({
  timeline: [...timeline, { t_ms: 1, kind: "text_start" }, { t_ms: 2, kind: "text", chunk: text }],
  final_text: text,
  stats: { duration_ms: 1, duration_api_ms: 1, ttft_ms: 1, num_turns: 1, output_tokens: 1 },
  is_error: false,
  stop_reason: "end_turn",
});

function producedFile(name, text, dir) {
  return { name, path: `${dir}/${name}`, bytes: Buffer.byteLength(text), sha256: sha(text), stored_as: `x.${name}`, text };
}

function chainText(locale) {
  const w = WORDS[locale];
  const header = locale === "en" ? "| Line | Article | Paper | Owner | Where |" : "| Zeile | Artikel | Papier | Zuständig | Ablage |";
  const rows = Array.from({ length: 13 }, (_, i) => {
    const id = `L${String(i + 1).padStart(2, "0")}`;
    const owner = id === "L10" || id === "L11" ? w.nif : "office manager";
    return `| ${id} | Art. ${i + 1} | paper ${i + 1} | ${owner} | a file |`;
  });
  const step1 = [header, "|---|---|---|---|---|", ...rows].join("\n");
  const step2 =
    locale === "en"
      ? "I read 693 rows in 11 files and found 10 findings.\nI checked 8 near misses and they are no problem.\nE-05 filed 4 days after the due date.\nI did not change any file, and the rest is in the check."
      : "Ich habe 693 Zeilen in 11 Dateien gelesen und 10 Funde gefunden.\nDie 8 Grenzfälle habe ich geprüft und sie sind kein Problem.\nE-05 hat 4 Tage nach dem Stichtag angemeldet.\nIch habe die Dateien nicht geändert, und der Rest steht im Check.";
  const status = EXPECTED.lines.map((line) => `${line.id} ${w[line.status.toLowerCase()]}, ${locale === "en" ? "a quote shows it" : "ein Zitat zeigt es"}`);
  const step3 = [...status, locale === "en" ? "The sign-off line stays empty, and the notes are not filled." : "Die Zeile für die Freigabe bleibt leer, und die Notizen sind nicht gefüllt."].join("\n");
  return [step1, step2, step3];
}

const evidenceCsv = () =>
  `# Fictional training material\nline_id,article,paper,owner,where,quote,period,scope,approval,status,closes_with,due\n${EXPECTED.lines.map((line) => `${line.id},a,p,o,w,q,ok,ok,ok,${line.status},new paper,2026-11-26`).join("\n")}\n`;

function goodChain(locale, over = {}) {
  const [one, two, three] = chainText(locale);
  const tpl = locale === "en" ? "templates" : "vorlagen";
  return base(locale, "chain", turn(one), [
    { prompt: blocks[locale]["chain-2"], ...turn(two) },
    { prompt: blocks[locale]["chain-3"], ...turn(over.three ?? three) },
  ], over.produced ?? [
    producedFile("evidence-index.csv", evidenceCsv(), tpl),
    producedFile("clock.csv", "event,rule,date\nrequest,3 calendar days,2026-11-26\n", tpl),
    producedFile("briefing.md", "One page for the person on 27 Nov.\n\nSign-off line:\n", "work"),
    producedFile("paper-note-E-11.md", "Title: leave\nSigned by: ______\n", "work"),
  ], over);
}

function registerRows(locale) {
  const approver = WORDS[locale].approver;
  return buildRegister(loadKitFiles(), REGISTER_TODAY).rows.map((row) => ({ ...row, approved_by: approver }));
}

function csvOf(locale, mutate = (rows) => rows) {
  const rows = mutate(registerRows(locale));
  return registerCsv({ rows });
}

function registerTexts(locale) {
  const first =
    locale === "en"
      ? "The counts are in the list and the register is not signed.\nregister.csv: 98 rows, 4 expired, 1 expiring, 4 missing\nE-01 contract 2022-12-26"
      : "Die Zahlen stehen in der Liste, und das Register ist nicht unterschrieben.\nregister.csv: 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen\nE-01 contract 2022-12-26";
  const second =
    locale === "en"
      ? "E-07 has 4 papers on file: contract, registration, medical-exam and leave-decision.\nThe overtime-notice is missing.\nThe owner of each is the office manager.\nI answer from register.csv and not from other files."
      : "Für E-07 sind 4 Papiere vorhanden: contract, registration, medical-exam und leave-decision.\nDas Papier overtime-notice fehlt.\nZuständig ist die Büroleiterin.\nIch antworte nur aus register.csv, nicht aus anderen Dateien.";
  return [first, second];
}

function goodRegister(locale, over = {}) {
  const [first, second] = registerTexts(locale);
  return base(locale, "register", turn(over.first ?? first), [{ prompt: blocks[locale]["register-2"], ...turn(over.second ?? second, over.timeline ?? [{ t_ms: 1, kind: "tool_use", tool: "Read", input: { file_path: "register.csv" } }]) }], over.produced ?? [
    producedFile("register.csv", over.csv ?? csvOf(locale), "work"),
    producedFile("check.py", "print('ok')\n", "work"),
  ], over);
}

function base(locale, kind, first, followUps, produced, over) {
  const ids = PROMPT_IDS[kind];
  const kitNames = kitFilesFor(locale, kind).map((entry) => entry.split("/").slice(1).join("/"));
  return {
    schema: "claude-recording/v1",
    id: `${locale}-${kind}-${over.take ?? 1}`,
    slug: SLUG,
    locale,
    prompt_id: kind,
    take: over.take ?? 1,
    recorded_at: "2026-11-08T12:00:00Z",
    surface: "claude-code-cli-headless",
    claude_code_version: "2.1.319",
    model: "claude-opus-5-5",
    models_used: ["claude-opus-5-5"],
    flags: ["--output-format", "stream-json", "--append-system-prompt", "<project-instructions>"],
    prompt: over.firstPrompt ?? blocks[locale][ids[0]],
    kit_zip: zipPathRelative(locale).replace("packages/website/", ""),
    kit_files: kitNames.map((name) => ({ name, path: `${EDITIONS[locale].root}/${name}`, bytes: 1, sha256: "x" })),
    instructions: { name: EDITIONS[locale].instructions, path: instructionsEntry(locale), bytes: 1, sha256: "x" },
    skill: null,
    skill_name: "audit-nachweise",
    with_skill: false,
    skill_invoked: false,
    skills_offered: [],
    memory_sources: [],
    ...first,
    follow_ups: followUps,
    produced_files: produced,
    edited: false,
    ...(over.rejected ? { rejected: over.rejected } : {}),
  };
}

const check = (recording, extra = {}) => checkTake(recording, { register, blocks: blocks[recording.locale], ...extra });
const rules = (result) => [...new Set(result.failures.map((item) => item.rule))].sort((a, b) => a - b);

test("a take that matches the key is accepted, in both languages and for both recordings", () => {
  for (const locale of LOCALES) {
    for (const recording of [goodChain(locale), goodRegister(locale)]) {
      const result = check(recording);
      assert.deepEqual(result.failures, [], `${recording.id}`);
      assert.deepEqual(result.mismatches, [], `${recording.id}`);
      assert.equal(result.accepted, true);
    }
  }
});

test("rule 1: a rejected take, a skill, a missing placeholder or a prompt that is not the START block is refused", () => {
  assert.ok(rules(check(goodChain("en", { rejected: ["a tool call was denied"] }))).includes(1));
  assert.ok(rules(check(goodChain("en"), { location: "rejected" })).includes(1));
  assert.ok(rules(check({ ...goodChain("en"), skill: { name: "audit-nachweise", sha256: "x" }, with_skill: true })).includes(1));
  assert.ok(rules(check({ ...goodChain("en"), flags: ["--output-format", "stream-json"] })).includes(1));
  assert.ok(rules(check(goodChain("en", { firstPrompt: `${blocks.en["chain-1"]} Be short.` }))).includes(1));
  assert.ok(rules(check({ ...goodChain("en"), follow_ups: goodChain("en").follow_ups.slice(0, 1) })).includes(1));
  // the extra take 5 may add one sentence, take 2 may not
  assert.deepEqual(check(goodChain("en", { take: 5, firstPrompt: `${blocks.en["chain-1"]} Write plain sentences.` })).failures, []);
  assert.ok(rules(check(goodChain("en", { take: 2, firstPrompt: `${blocks.en["chain-1"]} Write plain sentences.` }))).includes(1));
});

test("rule 2: more than 16 lines (more than 8 for the question) is refused", () => {
  const long = Array.from({ length: 17 }, (_, i) => `the line ${i} and not more`).join("\n");
  assert.ok(rules(check(goodChain("en", { three: `${chainText("en")[2]}\n${long}` }))).includes(2));
  assert.ok(rules(check(goodRegister("en", { second: Array.from({ length: 9 }, () => "E-07 has 4 papers on file and the overtime-notice is missing, not more").join("\n") }))).includes(2));
});

test("rule 3: a missing table row or 4 columns is refused; a name where the key says NOT IN FILES is a mismatch with the key", () => {
  const [one] = chainText("en");
  const drop = (text) => ({ ...goodChain("en"), ...turn(text) });
  assert.ok(rules(check(drop(one.split("\n").filter((line) => !line.startsWith("| L07")).join("\n")))).includes(3));
  assert.ok(rules(check(drop(one.replace("| L03 | Art. 3 | paper 3 | office manager | a file |", "| L03 | Art. 3 | paper 3 | office manager |")))).includes(3));
  const named = check(drop(one.replace(/(\| L10 .*?)NOT IN FILES/, "$1office manager")));
  assert.deepEqual(named.failures, []);
  assert.deepEqual(named.mismatches.map((item) => item.what), ["L10 says NOT IN FILES"]);
  assert.equal(named.accepted, false);
  const deNamed = check({ ...goodChain("de"), ...turn(chainText("de")[0].replace("NICHT IN DATEIEN", "Büroleiterin")) });
  assert.ok(deNamed.ok && deNamed.mismatches.length > 0);
});

test("rule 4: the text must name 693 rows, 10 findings and 8 checked next to their words, and one finding", () => {
  const withText = (text) => {
    const recording = goodChain("en");
    return { ...recording, follow_ups: [{ ...recording.follow_ups[0], ...turn(text) }, recording.follow_ups[1]] };
  };
  const [, two] = chainText("en");
  assert.deepEqual(check(withText(two)).failures, []);
  assert.ok(rules(check(withText(two.replace("693 rows", "all rows")))).includes(4));
  const wrong = check(withText(two.replace("10 findings", "9 findings")));
  assert.equal(wrong.ok, true, "a wrong number is a mismatch with the key, not a refusal");
  assert.equal(wrong.accepted, false);
  assert.deepEqual(wrong.mismatches.map((item) => item.what), ["findings"]);
  assert.ok(rules(check(withText(two.replace("E-05 filed 4 days after the due date.", "Nothing more.")))).includes(4));
  assert.ok(rules(check(withText(two.replace("I checked 8 near misses and they are no problem.", "They are fine, and not hard.")))).includes(4));
  // per-file counts that add up to 693 stand in for the total, next to the closing totals line
  const perFile = "contracts_register_2026.csv: 24\nregistration_M1M2_2026.csv: 24\nemployee_records_2026.csv: 24\nattendance_2026-11.csv: 432\novertime_weekly_2026.csv: 34\npayroll_runs_2026.csv: 10\npayroll_lines_2026-07_to_10.csv: 96\nleave_decisions_2026.csv: 21\nabsences_2026.csv: 1\nmedical_exams.csv: 24\ntraining_proofs_2026.csv: 3";
  const summed = two.replace("I read 693 rows in 11 files and found 10 findings.", `${perFile}\nTotals: 10 findings.`);
  assert.equal(perFileSum(perFile), 693);
  assert.deepEqual(check(withText(summed)).failures, []);
  const short = check(withText(summed.replace("attendance_2026-11.csv: 432", "attendance_2026-11.csv: 431")));
  assert.deepEqual(short.failures, [], "per-file counts that do not add up to 693 are a mismatch with the key, not a refusal");
  assert.deepEqual(short.mismatches.map((item) => item.what), ["rows read"]);
  assert.equal(short.accepted, false);
  // the German totals line the START-HIER prompt asks for
  const [, deTwo] = chainText("de");
  const deWithText = (text) => {
    const recording = goodChain("de");
    return { ...recording, follow_ups: [{ ...recording.follow_ups[0], ...turn(text) }, recording.follow_ups[1]] };
  };
  assert.deepEqual(check(deWithText(deTwo.replace("Ich habe 693 Zeilen in 11 Dateien gelesen und 10 Funde gefunden.\nDie 8 Grenzfälle habe ich geprüft und sie sind kein Problem.", "Summen: Zeilen gelesen: 693, Funde: 10, Grenzfälle geprüft: 8.\nDas ist die Zeile mit den Summen und nicht mehr."))).failures, []);
});

test("rule 5: 13 status lines with 2, 1 and 10; a changed evidence index and clock without 2026-11-30; a new .md; no sign-off filled", () => {
  const [, , three] = chainText("en");
  // a status tally that differs from the key is a mismatch with the key (exit 3, the chip), never a refusal
  const graded = check(goodChain("en", { three: three.replace("L02 GAP", "L02 WEAK") }));
  assert.equal(graded.ok, true);
  assert.equal(graded.accepted, false);
  assert.deepEqual(graded.mismatches.map((item) => item.what), ["status tally", "status of L02"]);
  assert.deepEqual(graded.mismatches[0], { what: "status tally", expected: "COVERED 2, WEAK 1, GAP 10", got: "COVERED 2, WEAK 2, GAP 9" });
  const deGraded = check(goodChain("de", { three: chainText("de")[2].replace("L10 LÜCKE", "L10 SCHWACH").replace("L03 LÜCKE", "L03 SCHWACH") }));
  assert.equal(deGraded.ok, true);
  assert.deepEqual(deGraded.mismatches.map((item) => item.what), ["status tally", "status of L03", "status of L10"]);
  assert.ok(rules(check(goodChain("en", { three: three.split("\n").slice(1).join("\n") }))).includes(5), "fewer than 13 status lines is still refused");
  const swapped = check(goodChain("en", { three: three.replace("L02 GAP", "L02 WEAK").replace("L11 WEAK", "L11 GAP") }));
  assert.equal(swapped.ok, true);
  assert.deepEqual(swapped.mismatches.map((item) => item.what), ["status of L02", "status of L11"]);
  const files = goodChain("en").produced_files;
  const without = (name) => files.filter((file) => file.name !== name);
  assert.ok(rules(check(goodChain("en", { produced: without("evidence-index.csv") }))).includes(5));
  assert.ok(rules(check(goodChain("en", { produced: without("clock.csv") }))).includes(5));
  const withClock = (text) => goodChain("en", { produced: files.map((file) => (file.name === "clock.csv" ? { ...file, text } : file)) });
  assert.ok(rules(check(withClock("event,rule,date\nvisit,3 days,2026-11-30\n"))).includes(5), "2026-11-30 as a fixed known date is refused");
  assert.ok(rules(check(withClock("event,rule,date\npapers,3 calendar days after the written request,2026-11-30\n"))).includes(5), "quoting the rule is not a condition");
  assert.deepEqual(check(withClock("event,rule,date\npapers asked for if the request comes on 27 Nov,3 calendar days after the written request,2026-11-30\n")).failures, [], "a conditional row may name 2026-11-30");
  assert.deepEqual(check(withClock("event,rule,date\nPapers,3 calendar days after the written request,open\n")).failures, []);
  assert.deepEqual(fixedPapersDates("event,rule,date\nPapers (falls am 27. Nov. verlangt),3 Kalendertage nach dem Verlangen,2026-11-30\nBesuch,x,2026-11-27\n"), []);
  assert.ok(rules(check(goodChain("en", { produced: files.filter((file) => !file.name.endsWith(".md")) }))).includes(5));
  assert.ok(rules(check(goodChain("en", { produced: files.map((file) => (file.name === "paper-note-E-11.md" ? { ...file, text: "Title: leave\nSigned by: Ana Petrova\n" } : file)) }))).includes(5));
  // blank sign-off lines of a form, and a quoted field name, are not filled in
  const withNote = (text) => goodChain("en", { produced: files.map((file) => (file.name === "paper-note-E-11.md" ? { ...file, text } : file)) });
  assert.deepEqual(check(withNote("Title: leave\nSign-off line: Name ___ Role ___ Date ___\nThe 2019 notice has a blank \"Signed by:\" field.\n")).failures, []);
  assert.ok(rules(check(goodChain("en", { produced: files.map((file) => (file.name === "evidence-index.csv" ? { ...file, text: "line_id\nL01\n" } : file)) }))).includes(5));
  // editing the kit's own template in place is not a new file
  const kitNote = goodChain("en").kit_files.find((file) => file.name.endsWith("new-paper-note.md")).name;
  assert.ok(rules(check(goodChain("en", { produced: files.filter((file) => file.name !== "briefing.md" && file.name !== "paper-note-E-11.md").concat({ ...producedFile("new-paper-note.md", "x", "templates"), path: kitNote }) }))).includes(5));
});

test("rule 6: the register has 98 rows, MISSING in exactly four, the right approver, a check.py and the three counts", () => {
  assert.deepEqual(check(goodRegister("en")).failures, []);
  const dropRow = csvOf("en", (rows) => rows.slice(1));
  assert.ok(rules(check(goodRegister("en", { csv: dropRow }))).includes(6));
  const noMissing = csvOf("en", (rows) => rows.map((row) => (row.person_id === "E-11" && row.paper === "leave-decision" ? { ...row, date: "2026-02-02" } : row)));
  assert.ok(rules(check(goodRegister("en", { csv: noMissing }))).includes(6));
  assert.ok(rules(check(goodRegister("en", { csv: csvOf("en", (rows) => rows.map((row, i) => (i === 3 ? { ...row, approved_by: "E-02" } : row))) }))).includes(6));
  assert.ok(rules(check(goodRegister("de", { csv: csvOf("en") }))).includes(6), "German approver text is NICHT IN DATEIEN");
  for (const id of ["FIRMA", "COMPANY"]) assert.ok(rules(check(goodRegister("de", { csv: csvOf("de", (rows) => rows.map((row) => (row.person_id === "FIRM" ? { ...row, person_id: id } : row))) }))).includes(6), `the firm id stays strictly FIRM, ${id} is refused`);
  assert.ok(rules(check(goodRegister("en", { produced: [producedFile("register.csv", csvOf("en"), "work")] }))).includes(6), "check.py is required");
  assert.ok(rules(check(goodRegister("en", { produced: [producedFile("check.py", "x", "work")] }))).includes(6), "register.csv is required");
  assert.ok(rules(check(goodRegister("en", { first: "register.csv is built.\nThe counts are not in the text and the rows follow." }))).includes(6));
  const off = check(goodRegister("en", { first: registerTexts("en")[0].replace("4 expired", "5 expired") }));
  assert.equal(off.ok, true);
  assert.deepEqual(off.mismatches.map((item) => item.what), ["expired"]);
  // a template filled in place and a copy at the top: the copy with the rows counts
  const both = [producedFile("register.csv", "person_id,paper,date,valid_until,owner,where,approved_by\n", "templates"), producedFile("register.csv", csvOf("en"), "work"), producedFile("check.py", "x", "work")];
  assert.deepEqual(check(goodRegister("en", { produced: both })).failures, []);
  const rowsOnly = parseCsv(csvOf("en")).rows;
  assert.equal(rowsOnly.length, 98);
  const failures = [];
  compareRegister(csvOf("en", (rows) => rows.map((row) => (row.paper === "medical-exam" && row.person_id === "E-01" ? { ...row, valid_until: "2030-01-01" } : row))), register, (rule, message) => failures.push([rule, message]), []);
  assert.deepEqual(failures, [], "a differing valid_until is a mismatch, not a failure");
});

test("rule 7: the question answer names the 4 papers on file for E-07, the missing overtime-notice and the owner, from register.csv only", () => {
  assert.deepEqual(check(goodRegister("en")).failures, []);
  assert.ok(rules(check(goodRegister("en", { second: "E-07 has 4 papers on file: contract, registration and leave-decision.\nThe owner is the office manager, and not the director." }))).includes(7));
  assert.ok(rules(check(goodRegister("en", { second: registerTexts("en")[1].replace("The overtime-notice is missing.", "Nothing is missing.") }))).includes(7));
  assert.ok(rules(check(goodRegister("en", { second: registerTexts("en")[1].replace("The owner of each is the office manager.", "The owner is unknown.") }))).includes(7));
  assert.ok(rules(check(goodRegister("en", { timeline: [{ t_ms: 1, kind: "tool_use", tool: "Read", input: { file_path: "folder/overtime_weekly_2026.csv" } }] }))).includes(7));
  const wrongCount = check(goodRegister("en", { second: registerTexts("en")[1].replace("4 papers on file", "5 papers on file") }));
  assert.equal(wrongCount.ok, true);
  assert.deepEqual(wrongCount.mismatches.map((item) => item.what), ["papers on file for E-07"]);
  assert.deepEqual(askPerson(register, "E-07").onFile, EXPECTED.register.askE07.onFile);
});

test("rule 8: a claim that Claude signed, sent, approved or completed is refused; a negation, health content and a personal name are not accepted", () => {
  assert.equal(doneClaims("Nothing is signed or sent. A person signs.").length, 0);
  assert.equal(doneClaims("I did not approve anything.").length, 0);
  assert.equal(doneClaims("I signed the notice and sent it.").length, 1);
  assert.equal(doneClaims("Ich habe die Meldung unterschrieben.").length, 1);
  assert.equal(doneClaims("The register is certified.").length, 1);
  const withClaim = (text) => goodRegister("en", { first: `${registerTexts("en")[0]}\n${text}` });
  assert.ok(rules(check(withClaim("I have signed the register and sent it to the office. The rest is the same and not new."))).includes(8));
  assert.ok(rules(check(withClaim("E-03 has a diagnosis in the file, and the rest is not new."))).includes(8));
  assert.ok(rules(check(withClaim("Ask Mr Petrov, and the rest is not new."))).includes(8));
  assert.ok(rules(check(withClaim("The number is 9900633999580 and the rest is not new."))).includes(8));
});

test("rule 9: the answer is in the language of the locale", () => {
  const german = goodRegister("en", { first: registerTexts("de")[0] });
  assert.ok(rules(check(german)).includes(9));
  assert.ok(rules(check(goodRegister("de", { first: registerTexts("en")[0] }))).includes(9));
});

test("rule 10: dashes, arrows, banned words and the forbidden pattern in the text are refused, and a take is never edited to hide them", () => {
  const dashChar = String.fromCharCode(0x2014);
  const arrow = String.fromCharCode(0x2192);
  const word = ["sig", "nature"].join("");
  const hit = (text) => rules(check(goodRegister("en", { first: `${registerTexts("en")[0]}\n${text} the rest is not new` })));
  assert.ok(hit(`Dated ${dashChar} today`).includes(10));
  assert.ok(hit(`a ${arrow} b`).includes(10));
  assert.ok(hit("a -> b").includes(10));
  for (const banned of ["Friday", "Freitag", "deadline", "countdown", "urgent", "dringend", "stamp", "Stempel", "score", "Punkte", "boss", "Chef", "logo", "konform", "compliant", "figure", "Super.", "überraschend", "surprise"]) {
    assert.ok(hit(`word ${banned} here`).includes(10), banned);
  }
  assert.ok(hit(`the ${word} line`).includes(10));
  assert.ok(hit(`see ${["", "Users", "x"].join("/")}/a`).includes(10));
  assert.deepEqual(bannedHits("A plain sentence, and a plain table | L01 |"), []);
  assert.deepEqual(bannedHits("Aufbau: Datum | Zeile für die Freigabe"), []);
});

test("rule 11 is separate: a take whose only difference is a number is shown with the chip, never accepted as the key", () => {
  const result = check(goodRegister("en", { first: registerTexts("en")[0].replace("1 expiring", "2 expiring") }));
  assert.equal(result.ok, true);
  assert.equal(result.accepted, false);
  assert.equal(result.failures.length, 0);
  assert.equal(result.mismatches.length, 1);
});

test("the helpers read tables, CSV with # lines, numbers next to words, statuses and sign-off lines", () => {
  assert.deepEqual(tableRows("| a | b |\n|---|---|\n| 1 | 2 |"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCsv('# c\nh1,h2\n"a,b",2\n\n').rows, [["a,b", "2"]]);
  assert.deepEqual(numbersNear("4 expired, 1 expiring, 4 missing", /expiring/), [1]);
  assert.deepEqual(numbersNear("expired: 4; 4 medical exams expired", /expired/), [4, 4]);
  assert.deepEqual(statusesOf("L01 COVERED ok\nL02 | GAP | no quote\nnothing", "en"), { L01: "COVERED", L02: "GAP" });
  assert.deepEqual(statusesOf("L10 LÜCKE", "de"), { L10: "LÜCKE" });
  assert.deepEqual(filledSignOffs("Signed by: ______\nSign-off line:\nSigned by: [name]\nUnterschrift von: (leer)"), []);
  assert.equal(filledSignOffs("Signed by: Ana").length, 1);
  assert.equal(filledSignOffs("Sign-off line: the director, 2026-11-26").length, 1);
  assert.deepEqual(filledSignOffs("Zeile für die Freigabe: Name ___ Rolle ___ Datum ___\nSign-off line: (name, role, date)\nSign-off line: left empty\nDas Feld \"Signed by:\" ist leer.\nUnterschrift von: Name: ______"), []);
  assert.equal(filledSignOffs("Zeile für die Freigabe: Name Ana Petrova Rolle Büroleiterin").length, 1);
  assert.equal(filledSignOffs("Signed by: ______ Ana").length, 1);
  assert.equal(digitsFor("vier Papiere, eins fehlt, zwanzig Tage; four on file, one missing; Vierzig bleibt"), "4 Papiere, 1 fehlt, 20 Tage; 4 on file, 1 missing; Vierzig bleibt");
  assert.deepEqual(numbersNear("Es liegen vier Papiere vor.", /vorhanden|liegen vor|liegt vor|on file/, [/liegen\s+(\d+)\s+(?:\p{L}+\s+){0,2}vor/]), [4]);
  assert.deepEqual(numbersNear("läuft in den nächsten 60 Tagen ab: 1", /läuft(?:\s+in\s+(?:den\s+nächsten\s+)?\d+\s+Tagen)?\s+ab/), [1]);
  assert.deepEqual(numbersNear("eins läuft in den nächsten 60 Tagen ab", /läuft(?:\s+in\s+(?:den\s+nächsten\s+)?\d+\s+Tagen)?\s+ab/), [1]);
});

// ---------------------------------------------------------------------------------------------
// Stored takes
// ---------------------------------------------------------------------------------------------

function filesBelow(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? filesBelow(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
}

test("no stored file holds a machine path, a session secret or the forbidden word, and replaced/ explains every take in it", () => {
  for (const file of filesBelow(RUNS_DIR).filter((item) => !item.endsWith(".ts"))) {
    assert.equal(FORBIDDEN.test(readFileSync(file, "utf8")), false, path.relative(REPO, file));
  }
  const replaced = path.join(RUNS_DIR, "replaced");
  if (existsSync(replaced)) {
    const reasons = JSON.parse(readFileSync(path.join(replaced, "reasons.json"), "utf8"));
    const takes = readdirSync(replaced).filter((name) => name.endsWith(".json") && name !== "reasons.json").map((name) => name.replace(/\.json$/, ""));
    assert.deepEqual(Object.keys(reasons).sort(), takes.sort());
    for (const [id, reason] of Object.entries(reasons)) assert.ok(reason.length > 20, `${id}: the reason names why`);
  }
});

test("the take that the deck shows is current: kit files, instructions and prompts are the ones in the zip a visitor downloads", (t) => {
  if (!existsSync(TAKES_JSON)) {
    t.diagnostic("deck-src/takes.json does not exist yet: no take is shown, nothing to check");
    return;
  }
  const chosen = JSON.parse(readFileSync(TAKES_JSON, "utf8"));
  for (const locale of LOCALES) {
    for (const kind of RECORDINGS) {
      const id = chosen[locale]?.[kind];
      if (!id) continue;
      const file = path.join(RUNS_DIR, `${id}.json`);
      assert.ok(existsSync(file), `${id} is named in takes.json but not stored in claude-runs/`);
      const recording = JSON.parse(readFileSync(file, "utf8"));
      assert.equal(recording.locale, locale);
      assert.equal(recording.prompt_id, kind);
      assert.equal(recording.skill, null);
      assert.equal(recording.edited, false);
      assert.equal(recording.kit_zip, zipPathRelative(locale).replace("packages/website/", ""));
      assert.deepEqual(recording.kit_files.map((item) => item.path).sort(), kitFilesFor(locale, kind), `${id}: the kit files of the recipe`);
      for (const item of recording.kit_files) assert.equal(sha(Buffer.from(zipText(locale, item.path), "utf8")), item.sha256, `${item.name} changed since the recording: record a new take`);
      assert.equal(recording.instructions.path, instructionsEntry(locale));
      assert.equal(sha(Buffer.from(zipText(locale, recording.instructions.path), "utf8")), recording.instructions.sha256, "the project instructions changed since the recording: record a new take");
      for (const item of recording.produced_files) {
        const stored = readFileSync(path.join(RUNS_DIR, item.stored_as));
        assert.equal(sha(stored), item.sha256);
        if (item.text !== undefined) assert.equal(item.text, stored.toString("utf8"));
      }
      const result = check(recording);
      assert.deepEqual(result.failures, [], `${id} no longer meets the acceptance rule`);
    }
  }
  const named = new Set(LOCALES.flatMap((locale) => RECORDINGS.map((kind) => chosen[locale]?.[kind]).filter(Boolean)));
  assert.deepEqual(storedTakeIds().filter((id) => !named.has(id)), [], "a take in claude-runs/ is not shown: move it to replaced/ with a reason");
});

test("set-aside moves a clean take to replaced/ with a reason of more than 20 characters and edits nothing", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync: read } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(path.join(tmpdir(), "w05-runs-"));
  const take = goodChain("en", { take: 2 });
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "en-chain-2.json"), `${JSON.stringify(take, null, 2)}\n`);
  for (const file of take.produced_files) writeFileSync(path.join(dir, file.stored_as), file.text);
  assert.throws(() => setAside("en-chain-2", "too short", dir), /more than 20/);
  setAside("en-chain-2", "ran clean, but take 1 was chosen and is shown", dir);
  assert.ok(!existsSync(path.join(dir, "en-chain-2.json")));
  assert.equal(JSON.stringify(JSON.parse(read(path.join(dir, "replaced/en-chain-2.json"), "utf8"))), JSON.stringify(take));
  assert.ok(existsSync(path.join(dir, "replaced", "x.evidence-index.csv")));
  assert.equal(JSON.parse(read(path.join(dir, "replaced/reasons.json"), "utf8"))["en-chain-2"], "ran clean, but take 1 was chosen and is shown");
  assert.throws(() => setAside("en-chain-2", "a long enough reason to move it twice", dir), /not a take/);
});
