/**
 * Every fact the Workshop 05 deck computes or reads: the oracle's answer on the kit files, the kit's own
 * prompts, and the public figures the slides count. build.mjs hands this object to slides.mjs, which writes
 * computed numbers into the HTML only (data-count attributes, the matrix JSON, chip texts). deck-copy.json
 * is hand written; scripts/__tests__/workshop05-lockstep.test.mjs holds its numbers to this file.
 *
 * Kit folder files are all English (the kit's business language); the German edition differs only in the
 * prompts, which come from kit-de.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyse, counter, whatIf } from "../oracle/oracle.mjs";
import { loadKitFiles } from "../oracle/load.mjs";
import { LINES, NOTICE_DATE, CHECK_DATE, TODAY_IN_EXERCISE } from "../oracle/plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const KIT_DIR = path.join(HERE, "..", "kit");
export const KIT_DIR_DE = path.join(HERE, "..", "kit-de");

export const kit = (file) => readFileSync(path.join(KIT_DIR, file), "utf8");
export const kitDe = (file) => readFileSync(path.join(KIT_DIR_DE, file), "utf8");

const must = (value, what) => {
  if (value === undefined || value === null || value === "" || Number.isNaN(value)) throw new Error(`deck data: ${what} not found`);
  return value;
};

/** Days from a to b (ISO dates, UTC). */
export const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** Mon to Fri days strictly between two ISO dates, no holiday list (the same rule as lib/w05-clock.js). */
export function workingDaysBetween(from, to) {
  let n = 0;
  for (let t = Date.parse(`${from}T00:00:00Z`) + 86400000; t < Date.parse(`${to}T00:00:00Z`); t += 86400000) {
    const day = new Date(t).getUTCDay();
    if (day !== 0 && day !== 6) n += 1;
  }
  return n;
}

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
 * Public figures the first slides count, each with its source in the notes of its slide. They are typed here
 * once (they are not in the kit) and the deck derives its dots and counters from them.
 *  - doors: SC-E01 31 building-site inspections in one day (22 Oct 2024, old law); SC-E10 214 businesses in one
 *    week (28 Jul to 3 Aug 2025, press quoting the tax office), irregularities at 66; C22 3 to 5 audit days.
 *  - firmSize: X11 (SSO 2022) 59,965 of 71,228 enterprises have 1 to 9 staff.
 *  - dit2025: C8 annual report 2025, proposal version of April 2026: 5,664 regular, 6,515 follow-up, 14,305 extraordinary.
 */
export const PUBLIC = {
  doors: { building: 31, tax: 214, taxIrregular: 66, isoFrom: 3, isoTo: 5 },
  firmSize: { micro: 59965, all: 71228 },
  dit2025: { regular: 5664, followUp: 6515, extraordinary: 14305, inspectors: 124 },
  checklists: { labour: 108, safety: 34, records: 27 },
  staff: 24,
};

/** 100 dots for a share, rounded; the three DIT kinds are rounded so that they add up to exactly 100. */
export function dotsFor(parts) {
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  const dots = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round((v / total) * 100)]));
  const sum = Object.values(dots).reduce((a, b) => a + b, 0);
  if (sum !== 100) throw new Error(`deck data: dots add up to ${sum}, not 100`);
  return { dots, total };
}

let cached;
/** The oracle on the committed kit files. Pure and fast, so every edition shares one run. */
export function oracleResult() {
  if (!cached) {
    const files = loadKitFiles();
    const result = analyse(files);
    cached = { files, result, counters: { base: counter(result) }, whatIfResults: {} };
    for (const kind of ["e08-nine-hours", "ticks-filled", "no-free-day-move"]) {
      const { files: f, options } = whatIf(files, kind);
      const run = analyse(f, options);
      cached.whatIfResults[kind] = run;
      cached.counters[kind] = counter(run);
    }
  }
  return cached;
}

export function deckData(lang = "en") {
  const { result, files, counters, whatIfResults } = oracleResult();
  const de = lang === "de";
  const startHere = de ? kitDe("START-HIER.md") : kit("START-HERE.md");
  const step = de ? "## Schritt" : "## Step";

  // S09 and S12: the 13 labels, straight from the plan the kit was made from.
  const lines = LINES.map((line) => {
    const found = must(result.lines.find((r) => r.id === line.id), `oracle line ${line.id}`);
    return { id: line.id, label: de ? line.labelDe : line.label, status: found.status };
  });
  if (lines.length !== 13) throw new Error("deck data: the kit holds 13 question lines");
  const statusOf = (id) => must(lines.find((l) => l.id === id), `line ${id}`).status;

  // S04: 84 of 100 firms with 1 to 9 staff (X11); S08: the three DIT kinds (C8).
  const micro = Math.round((PUBLIC.firmSize.micro / PUBLIC.firmSize.all) * 100);
  const dit = dotsFor({ extraordinary: PUBLIC.dit2025.extraordinary, followUp: PUBLIC.dit2025.followUp, regular: PUBLIC.dit2025.regular });

  // S05: the calendar between the letter and the visit.
  const notice = must(result.days?.notice, "notice date");
  const visit = must(result.days?.visit, "visit date");
  const clock = {
    notice,
    visit,
    today: TODAY_IN_EXERCISE,
    calendar: days(notice, visit),
    workingBetween: workingDaysBetween(notice, visit),
    buttons: ["2026-11-25", "2026-11-26", "2026-11-27"],
    workingFor: Object.fromEntries(["2026-11-25", "2026-11-26", "2026-11-27"].map((d) => [d, workingDaysBetween(notice, d)])),
    papersDue: result.days.papersDue,
  };

  // S07 and S11: the rows the slides show, read from the kit file, never typed.
  const attendance = files["attendance_2026-11.csv"].split("\n");
  const tickRows = attendance.filter((line) => line.startsWith("E-12,")).slice(0, 3).map((line) => line.split(","));
  const f8 = must(result.findings.find((f) => f.id === "F8"), "finding F8");
  const emptyFields = must(f8.number, "F8 empty cells");
  const opinionYear = Number(must(/opinion[^\n]*?(\d{4})-\d{2}-\d{2}/i.exec(files["safety_statement_2019.md"])?.[1], "opinion year in the safety statement"));

  // The slides print these sample papers; the oracle must agree with the copy.
  const sample = { contract: statusOf("L01"), opinion: statusOf("L11"), attendance: statusOf("L04") };
  const tests = { quote: statusOf("L04"), period: statusOf("L11"), scope: statusOf("L03"), approval: statusOf("L06") };

  return {
    lang,
    notice: NOTICE_DATE,
    checkDate: CHECK_DATE,
    lines,
    rowsRead: result.rowsRead,
    tally: result.tally,
    findings: result.findings,
    decoys: result.decoys,
    matrix: result.matrix,
    peopleInFindings: result.peopleInFindings,
    overtime: result.overtime,
    wrong: result.wrong,
    counters,
    whatIfCounters: counters,
    whatIfResults,
    oracle: result,
    kitFiles: files,
    public: PUBLIC,
    doors: PUBLIC.doors,
    micro: { share: micro, grey: micro, fade: 100 - micro - 1 },
    dit,
    clock,
    sample,
    tests,
    emptyFields,
    opinionYear,
    tickRows,
    startHere,
    prompts: { step1: promptBlocks(startHere, `${step} 1`)[0], step2: promptBlocks(startHere, `${step} 2`)[0], step3: promptBlocks(startHere, `${step} 3`)[0] },
  };
}
