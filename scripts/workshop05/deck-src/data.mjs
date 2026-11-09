/**
 * Every fact the Workshop 05 deck computes or reads: the oracle's answer on the kit files, the kit's own
 * prompts, the register of step 4 and the public figures the slides count. build.mjs hands this object to the
 * slide files, which write computed numbers into the HTML only (placeholders of deck-copy.json, data-count
 * and data-fill attributes). deck-copy.json is hand written; scripts/__tests__/workshop05-lockstep.test.mjs holds
 * its numbers to this file.
 *
 * The kit's business files are all English; the German edition differs only in the prompts, which come from kit-de.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { kitEntries, kitEntriesDe } from "../build-kit.mjs";
import { analyse, askPerson, buildRegister, registerSummary, registerExpected, askKeyLine, REGISTER_EXPIRING_DAYS } from "../oracle/oracle.mjs";
import { loadKitFiles } from "../oracle/load.mjs";
import { CHECK_DATE, NOTICE_DATE, TODAY_IN_EXERCISE } from "../oracle/plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const KIT_DIR = path.join(HERE, "..", "kit");
export const KIT_DIR_DE = path.join(HERE, "..", "kit-de");

export const kit = (file) => readFileSync(path.join(KIT_DIR, file), "utf8");
export const kitDe = (file) => readFileSync(path.join(KIT_DIR_DE, file), "utf8");

const must = (value, what) => {
  if (value === undefined || value === null || value === "" || Number.isNaN(value)) throw new Error(`deck data: ${what} not found`);
  return value;
};

/** The indented prompt blocks of a START-HERE section, in order (the text the cards show byte for byte). */
export function promptBlocks(startHere, heading) {
  const from = startHere.indexOf(heading);
  must(from >= 0 ? from : null, `heading ${heading}`);
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
  return must(blocks.length ? blocks : null, `prompt block under ${heading}`);
}

/**
 * Public figures slide 3 counts (the proposed DIT annual report 2025). They are not in the kit; each is printed with its
 * source tag, and the dots are computed from them here: the share of extraordinary inspections, rounded to 100.
 */
export const PUBLIC = {
  dit2025: { regular: 5664, followUp: 6515, extraordinary: 14305 },
  /** DIT decisions in 2025 (DATA-23): about one inspection in four ended with a decision. */
  ditDecisions2025: 6359,
  staff: 24,
  /** Active enterprises in 2024, State Statistical Office, preliminary, published 15 Apr 2026 (verified row DATA-32). */
  firms2024: 73310,
  /** Firms per dot of the W05 field (cover and today): 73,310 / 10 = 7,331 dots, our own arithmetic. */
  firmsPerDot: 10,
  /** Active enterprises in Bitola municipality, 2024 (DATA-32): the town the cover darkens, 3,529 / 10 = 353 dots. */
  firmsBitola2024: 3529,
};

let cached;
/** The oracle on the committed kit files. Pure and fast, so every edition shares one run. */
export function oracleResult() {
  if (!cached) {
    const files = loadKitFiles();
    const result = analyse(files);
    const register = buildRegister(files);
    cached = { files, result, register, e07: askPerson(register, "E-07") };
  }
  return cached;
}

/** Top-level names of the kit zip, as the folder tree of slide 6 prints them (a folder has a trailing slash). */
function treeNames(entries) {
  const seen = [];
  for (const [name] of entries) {
    const top = name.includes("/") ? `${name.split("/")[0]}/` : name;
    if (!seen.includes(top)) seen.push(top);
  }
  return seen;
}

/** Files per top-level folder of the zip (a plain file counts 1), keyed like treeNames. */
function treeCounts(entries) {
  const counts = {};
  for (const [name] of entries) {
    const top = name.includes("/") ? `${name.split("/")[0]}/` : name;
    counts[top] = (counts[top] ?? 0) + 1;
  }
  return counts;
}

export function deckData(lang = "en") {
  const { result, register, e07 } = oracleResult();
  const de = lang === "de";
  const startHere = de ? kitDe("START-HIER.md") : kit("START-HERE.md");
  const step = de ? "## Schritt" : "## Step";
  const entries = de ? kitEntriesDe() : kitEntries();

  const notice = must(result.days?.notice, "notice date");
  const visit = must(result.days?.visit, "visit date");
  const l10 = must(result.findings.find((f) => f.id === "F10"), "finding F10").facts;

  const dit = PUBLIC.dit2025;
  const ditTotal = dit.regular + dit.followUp + dit.extraordinary;
  const dots = Math.round((dit.extraordinary / ditTotal) * 100);

  const prompts = {
    step1: promptBlocks(startHere, `${step} 1`)[0],
    step2: promptBlocks(startHere, `${step} 2`)[0],
    step3: promptBlocks(startHere, `${step} 3`)[0],
    step4: promptBlocks(startHere, `${step} 4`)[0],
    step4b: promptBlocks(startHere, `${step} 4`)[1],
  };
  if (promptBlocks(startHere, `${step} 4`).length !== 2) throw new Error("deck data: step 4 holds two prompt blocks");

  const summary = { en: registerSummary(register, "en"), de: registerSummary(register, "de") };
  /** A few real rows of register.csv for the table that builds on slide 12: the first row of each paper, then the first expired medical exam. */
  const seen = new Set();
  const sample = register.rows.filter((r) => (seen.has(r.paper) ? false : seen.add(r.paper)));
  const expiredIds = new Set(register.expired.map((x) => x.id));
  const firstExpired = register.rows.find((r) => r.paper === "medical-exam" && expiredIds.has(r.person_id));
  const rowsShown = [...sample.slice(0, 5), firstExpired].filter(Boolean).map((r) => ({ id: r.person_id, paper: r.paper, date: r.date, validUntil: r.valid_until, where: r.where, owner: r.owner, approved: r.approved_by }));
  // the state of every register row on the check day, in file order (the micro grid of slide 13): x expired, s expiring, m missing
  const stateKey = (id, paper) => `${id}|${paper}`;
  const states = [["x", register.expired], ["s", register.expiring], ["m", register.missing]].map(([code, list]) => [code, new Set(list.map((x) => stateKey(x.id, x.paper)))]);
  const cells = register.rows.map((r) => states.find(([, set]) => set.has(stateKey(r.person_id, r.paper)))?.[0] ?? "");
  const reg = {
    byDate: registerExpected(oracleResult().files).byDate,
    cells,
    sample: rowsShown,
    today: register.today,
    rows: register.rows.length,
    expired: register.expired.length,
    expiring: register.expiring.length,
    missing: register.missing.length,
    summary,
    ask: { id: e07.id, onFile: e07.onFile, missing: e07.missing, missingPaper: e07.missingPapers[0], key: askKeyLine(e07, lang) },
  };

  /** The placeholders deck-copy.json uses; the slide files fill them with fill(text, d.vars). */
  const vars = {
    files: entries.length,
    rows: result.lines.length,
    cols: 5,
    rowsRead: result.rowsRead,
    findings: result.findings.length,
    decoys: result.decoys.length,
    covered: result.tally.covered,
    weak: result.tally.weak,
    gap: result.tally.gap,
    jobs: l10.titles,
    listed: l10.listed,
    calendar: must(result.days.calendar, "calendar days"),
    dots,
    expired: reg.expired,
    expiring: reg.expiring,
    expiringDays: REGISTER_EXPIRING_DAYS,
    missing: reg.missing,
    registerRows: reg.rows,
    askOnFile: reg.ask.onFile,
    askMissing: reg.ask.missing,
  };

  const field = { firms: PUBLIC.firms2024, per: PUBLIC.firmsPerDot, dots: Math.round(PUBLIC.firms2024 / PUBLIC.firmsPerDot), bitola: PUBLIC.firmsBitola2024, near: Math.round(PUBLIC.firmsBitola2024 / PUBLIC.firmsPerDot) };

  return {
    lang,
    field,
    notice: NOTICE_DATE,
    checkDate: CHECK_DATE,
    today: TODAY_IN_EXERCISE,
    rowsRead: result.rowsRead,
    tally: result.tally,
    findings: result.findings,
    decoys: result.decoys,
    days: result.days,
    oracle: result,
    register: reg,
    files: entries.length,
    tree: treeNames(entries),
    treeCounts: treeCounts(entries),
    /** Every path inside this edition's zip (the files a prompt reads are shown from here, never typed). */
    kitPaths: entries.map(([p]) => p),
    public: PUBLIC,
    dit: { ...dit, total: ditTotal, decisions: PUBLIC.ditDecisions2025 },
    dots,
    finds: [result.findings.length - 4, result.findings.length, result.findings.length + 4, result.findings.length * 2],
    startHere,
    prompts,
    vars,
    /** What the key says for the take comparison (take.mjs compareWithKey). */
    key: {
      rows: result.lines.length,
      cols: 5,
      noOwner: ["L10", "L11"],
      rowsRead: result.rowsRead,
      findings: result.findings.length,
      checked: result.decoys.length,
      tally: result.tally,
      register: { rows: reg.rows, expired: reg.expired, expiring: reg.expiring, missing: reg.missing },
      ask: reg.ask,
    },
  };
}

/** The agenda in minutes per main slide, in deck order (slides.mjs asserts that SLIDES carry exactly these). */
export const AGENDA_MINUTES = [1, 3, 5, 4, 4, 7, 4, 5, 6, 9, 5, 8, 11, 8, 6, 4];
/**
 * The three parts of the day with the start (cover and today) in front, as slide index ranges [from, to):
 * start (slides 1 and 2), the case (3 to 7: evidence, what happens, the clock, by hand), Claude the first time (8 to 12:
 * the kit and steps 1 to 3), set up for later (13 to 16: the register, staying ready, safety, the close).
 */
export const AGENDA_RANGES = [[0, 2], [2, 7], [7, 12], [12, 16]];
export const AGENDA_PARTS = AGENDA_RANGES.map(([from, to]) => AGENDA_MINUTES.slice(from, to).reduce((sum, n) => sum + n, 0));
