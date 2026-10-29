/**
 * Every fact the Workshop 05 deck shows, read from the kit source (scripts/workshop05/kit, and for the
 * German edition the prompts and the R7 email from scripts/workshop05/kit-de) or computed from it. The deck never types a number or a quote by hand: build.mjs passes this object to slides.mjs,
 * and packages/website/src/lib/workshops-audit-deck.test.ts holds the result to the demo's model.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const KIT_DIR = path.join(HERE, "..", "kit");

export const KIT_DIR_DE = path.join(HERE, "..", "kit-de");
const GAP_TEMPLATE_DE = path.join(HERE, "../../../packages/website/content/vorlagen/luecken-anfrage.md");

export const kit = (file) => readFileSync(path.join(KIT_DIR, file), "utf8");
const kitDe = (file) => readFileSync(path.join(KIT_DIR_DE, file), "utf8");

/**
 * Per edition: the start file, its step headings, the gap template, the key that holds the filled R7 email,
 * the project instructions, and the one sentence of four rules the mistakes slide shows (rule number, pattern).
 */
const EDITION_SOURCES = {
  en: {
    start: () => kit("START-HERE.md"),
    step: "## Step",
    template: () => kit("templates/gap-request.md"),
    key: () => kit("ANSWERS.md"),
    email: "Example email (R7)",
    instructions: () => kit("project-instructions.md"),
    ruleLines: { 7: /DRAFT, "\(open\)", a blank field, or "FINAL" in a file name is no approval\./, 4: /A POLICY or STATEMENT shows intent;[^.]+\./, 11: /Remove duplicate rows[^.]+\./, 12: /Never invent a control number[^.]+\./ },
  },
  de: {
    start: () => kitDe("START-HIER.md"),
    step: "## Schritt",
    template: () => readFileSync(GAP_TEMPLATE_DE, "utf8"),
    key: () => kitDe("LOESUNGEN.md"),
    email: "Beispiel-Mail (R7)",
    instructions: () => kitDe("projektanweisungen.md"),
    ruleLines: { 7: /DRAFT, "\(open\)", ein leeres Feld oder "FINAL" im Dateinamen ist keine Freigabe\./, 4: /Eine RICHTLINIE oder AUSSAGE zeigt Absicht;[^.]+\./, 11: /Entferne doppelte Zeilen[^.]+\./, 12: /Erfinde nie eine Kontrollnummer[^.]+\./ },
  },
};

/**
 * Per item, the line of its name-matched file that the reality run quotes (the file is NAIVE[id].file).
 * The pattern must match the file's text, so the quote is always word for word.
 */
const ROW_QUOTES = {
  R1: /United States \(see [^)]+\)/,
  R2: /^Anthropic,Claude Team,United States,accepted online [\d-]+,,$/m,
  R3: /Valid from \d{4}-\d{2}-\d{2}\./,
  R4: /Review of administrator accounts in \w+/,
  R5: /Staff on [^:]+: \d+\./,
  R6: /INC-02,\d{4}-\d{2}-\d{2} \d{2}:\d{2},Tannwald/,
  R7: /Restore test: [^.]+\./,
  R8: /Approved by: \(open\)/,
};

const must = (value, what) => {
  if (value === undefined || value === null || value === "") throw new Error(`deck data: ${what} not found in the kit`);
  return value;
};

/** Days from a to b (ISO dates, UTC). */
export const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** The indented prompt blocks of a START-HERE section, in order. */
function promptBlocks(startHere, heading) {
  const from = startHere.indexOf(heading);
  const rest = startHere.slice(from + heading.length);
  const end = rest.search(/\n## /);
  const section = end === -1 ? rest : rest.slice(0, end);
  const blocks = [];
  let current = null;
  for (const line of section.split("\n")) {
    if (line.startsWith("    ")) {
      current ??= [];
      current.push(line.slice(4));
    } else if (current) {
      blocks.push(current.join("\n"));
      current = null;
    }
  }
  if (current) blocks.push(current.join("\n"));
  return must(blocks.length ? blocks : null, `prompt blocks under ${heading}`);
}

/** A Markdown table under a heading, as arrays of cells (header row dropped). */
function table(text, after) {
  const from = must(text.indexOf(after) >= 0 ? text.indexOf(after) : null, `table after ${after}`);
  const lines = text.slice(from).split("\n");
  const start = lines.findIndex((line) => line.startsWith("|"));
  const rows = [];
  for (let i = start + 2; i < lines.length && lines[i].startsWith("|"); i += 1) {
    rows.push(lines[i].slice(1, -1).split("|").map((cell) => cell.trim()));
  }
  return rows;
}

function quoteIn(file, pattern) {
  const match = pattern.exec(kit(file));
  return must(match && match[0], `${pattern} in ${file}`);
}

/**
 * The file whose name fits each item (the first screen of the demo) and the first test it fails there.
 * The demo computes both (src/lib/demo-cases/audit-vorbereitung-mit-ki/model.ts); the deck test holds
 * this table to that model.
 */
export const NAIVE = {
  R1: { file: "system-list_2026-09.csv", failsAt: null },
  R2: { file: "subprocessors_2026-09.csv", failsAt: "quote" },
  R3: { file: "ai-use-rule_v1.md", failsAt: "date" },
  R4: { file: "access-review_2026-08-14.csv", failsAt: "scope" },
  R5: { file: "training-records_2026.csv", failsAt: "quote" },
  R6: { file: "incident-log_2026.csv", failsAt: null },
  R7: { file: "backup-report_2026-10.txt", failsAt: "quote" },
  R8: { file: "infosec-policy_v4_DRAFT.md", failsAt: "date" },
};

export function deckData(lang = "en") {
  const source = EDITION_SOURCES[lang];
  const request = kit("request_tannwald.md");
  const draft = kit("draft-reply.md");
  const answers = kit("ANSWERS.md");
  const startHere = source.start();
  const training = kit("folder/training-records_2026.csv");
  const incidents = kit("folder/incident-log_2026.csv");

  const field = (name) => must(new RegExp(`^${name}: (.+)$`, "m").exec(request)?.[1], `request field ${name}`);
  const items = [...request.matchAll(/^\| (R[1-8]) \| (.+?) \| ([\d.]+) \|$/gm)].map((m) => ({ id: m[1], text: m[2], section: m[3] }));
  if (items.length !== 8) throw new Error("deck data: the request must hold R1 to R8");
  const rulesBlock = request.slice(request.indexOf("How we read your documents")).split("\n\n")[0];
  const rules = rulesBlock.split("\n").filter((line) => line.startsWith("- ")).map((line) => line.slice(2));
  const clause7 = must(/^Clause 7 .*?: "(.+)"$/m.exec(request)?.[1], "clause 7");

  // Training: rows, people, share, what 95 % needs. Counted the way rule 11 asks: duplicates out first.
  const rows = training.split("\n").filter((line) => /^E\d+,/.test(line));
  const ids = rows.map((line) => line.split(",")[0]);
  const unique = new Set(ids).size;
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  const staff = Number(must(/Staff on [\d-]+: (\d+)\./.exec(training)?.[1], "staff count"));
  const target = Number(must(/at least (\d+)%/.exec(request)?.[1], "training share")) / 100;
  const needed = Math.ceil(staff * target - 1e-9);
  const share = Math.round((unique / staff) * 1000) / 10;

  // R6: hours from detection to notice, INC-02.
  const inc = must(incidents.split("\n").find((line) => line.includes(",Tannwald,")), "the Tannwald incident");
  const [detected, told] = [...inc.matchAll(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/g)].map((m) => Date.parse(`${m[1]}T${m[2]}:00Z`));
  const noticeHours = Math.round(((told - detected) / 3600000) * 10) / 10;
  const allowedHours = Number(must(/within (\d+) hours/.exec(request)?.[1], "notice hours"));

  const windowStart = "2025-12-10";
  const ruleFrom = must(/Valid from (\d{4}-\d{2}-\d{2})/.exec(kit("folder/ai-use-rule_v1.md"))?.[1], "AI rule start");

  // Step 1: the index, straight from ANSWERS.md.
  const index = table(answers, "## Step 1").map(([file, type, date, by, dateTest, approvalTest]) => ({
    file,
    type,
    date,
    by,
    dateOk: dateTest === "pass",
    approvalOk: approvalTest === "pass",
  }));
  const passing = index.filter((row) => row.dateOk && row.approvalOk).length;

  // Step 2: status per item, straight from ANSWERS.md.
  const statusWord = { COVERED: "covered", WEAK: "weak", GAP: "gap" };
  const mission2 = table(answers, "## Step 2").map(([id, file, quote, failing, status]) => ({
    id,
    file,
    quote,
    failing,
    status: statusWord[status],
    naive: NAIVE[id].file,
    failsAt: NAIVE[id].failsAt,
    rowQuote: quoteIn(`folder/${NAIVE[id].file}`, ROW_QUOTES[id]),
  }));
  const tally = { covered: 0, weak: 0, gap: 0 };
  for (const row of mission2) tally[row.status] += 1;

  // The gap request for R7: the template, its slots, and the values the filled email in the key gives them.
  const template = source.template().trimEnd();
  const key = source.key();
  const emailStart = must(key.indexOf(source.email) >= 0 ? key.indexOf(source.email) : null, source.email);
  const email = must(/```\n([\s\S]*?)```/.exec(key.slice(emailStart))?.[1], "R7 email").trimEnd();
  const parts = template.split(/(\[[^\]]+\])/g);
  const pattern = new RegExp(
    "^" + parts.map((part, i) => (i % 2 ? "(.+?)" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("") + "$",
    "s",
  );
  const filled = must(pattern.exec(email), "R7 email matching the template");
  const emailSegments = parts.map((part, i) => (i % 2 ? { slot: part, value: filled[(i + 1) / 2] } : { text: part }));

  const sample = must(/```\n([\s\S]*?)```/.exec(answers.slice(answers.indexOf("Sample reply")))?.[1], "sample reply").trimEnd();

  const [m1] = promptBlocks(startHere, `${source.step} 1`);
  const [m2, m2follow] = promptBlocks(startHere, `${source.step} 2`);
  const [m3] = promptBlocks(startHere, `${source.step} 3`);

  const instructions = source.instructions();
  const ruleLines = Object.fromEntries(
    Object.entries(source.ruleLines).map(([n, pattern]) => [n, must(pattern.exec(instructions)?.[0], `rule ${n} in the project instructions`)]),
  );
  const instructionsHead = must(/^Audit: .+$/m.exec(instructions)?.[0], "the first line of the project instructions");
  // The lines the project slide types into "Project instructions": the role sentences, then rules 1, 2 and 10.
  const role = must(/^[^.\n]+\.\s[^.\n]+\./.exec(instructions.split("\n\n")[1])?.[0], "the role sentences of the project instructions");
  const instructionLines = [role, ...[1, 2, 10].map((n) => must(new RegExp(`^${n}\\. .+$`, "m").exec(instructions)?.[0], `rule ${n} in the project instructions`))];

  // The R7 email as Claude writes it: the subject line, then "What we have" up to the failed test and its sentence.
  const firstBreak = emailSegments.findIndex((seg) => seg.text !== undefined && seg.text.includes("\n"));
  const haveAt = emailSegments.findIndex((seg) => seg.text !== undefined && /\n\n[^\n]+: $/.test(seg.text) && emailSegments.indexOf(seg) > firstBreak + 6);
  const closeAt = emailSegments.findIndex((seg, i) => i > haveAt && seg.text !== undefined && seg.text.includes("\n\n"));
  const emailExcerpt = [
    ...emailSegments.slice(0, firstBreak),
    { text: "\n" },
    { text: emailSegments[haveAt].text.split("\n\n").pop() },
    ...emailSegments.slice(haveAt + 1, closeAt),
    { text: emailSegments[closeAt].text.split("\n\n")[0] },
  ];

  return {
    customer: "Tannwald",
    // The real case on slide 03 (Deloitte Australia, October 2025; sources in appendix A3): the fee and the refund.
    fee: 440000,
    refund: 97587,
    ruleLines,
    instructionsHead,
    instructionLines,
    emailExcerpt,
    systemApproved: must(/Approved (\d{4}-\d{2}-\d{2})/.exec(kit("folder/system-list_2026-09.csv"))?.[1], "system list approval date"),
    sent: field("Sent"),
    audit: "2026-12-10",
    auditLine: field("Remote audit"),
    sendBy: "2026-11-25",
    exercise: "2026-11-09",
    windowStart,
    due: "2026-12-02",
    from: field("From"),
    headline: must(rules[0], "first rule"),
    rules: rules.slice(1),
    items,
    clause7,
    draft: [...draft.matchAll(/^\d\. (.+)$/gm)].map((m) => m[1]),
    draftOpen: draft.slice(draft.indexOf("Dear"), draft.indexOf("\n1. ")).trim(),
    draftClose: draft.slice(draft.indexOf("Best regards")).trim(),
    files: index.map((row) => row.file),
    index,
    passing,
    mission2,
    tally,
    trainingDupIndex: ids.lastIndexOf(duplicate),
    training: { rows: rows.length, unique, duplicate, staff, share, needed, missing: needed - unique, target },
    notice: { hours: noticeHours, allowed: allowedHours },
    r3Days: days(windowStart, ruleFrom),
    quotes: {
      policyBackup: quoteIn("folder/infosec-policy_v3_FINAL.md", /Backups are restore-tested[^.]+\./),
      policyApproved: quoteIn("folder/infosec-policy_v3_FINAL.md", /Approved \d{4}-\d{2}-\d{2}/),
      notesBackup: quoteIn("folder/it-notes_2026-10-06.md", /Backups are tested[^.]+\./),
      notesReview: quoteIn("folder/it-notes_2026-10-06.md", /Not reviewed by anyone\./),
      reportRestore: quoteIn("folder/backup-report_2026-10.txt", /Restore test: [^.]+\./),
      systemUs: quoteIn("folder/system-list_2026-09.csv", /United States \(see [^)]+\)/),
      claudeRow: quoteIn("folder/system-list_2026-09.csv", /^Claude Team \(browser[^)]+\)/m),
      storedUs: quoteIn("folder/vendor-page_claude_2026-06-15.md", /Note that data is stored in the US\./),
      v4Open: quoteIn("folder/infosec-policy_v4_DRAFT.md", /Approved by: \(open\)/),
      staffLine: quoteIn("folder/training-records_2026.csv", /Staff on [^:]+: \d+\./),
      accessReview: quoteIn("folder/access-review_2026-08-14.csv", /Review of administrator accounts in \w+/),
      accessDone: quoteIn("folder/access-review_2026-08-14.csv", /Done \d{4}-\d{2}-\d{2}/),
    },
    email,
    emailSegments,
    sample,
    prompts: { m1, m2, m2follow, m3 },
  };
}
