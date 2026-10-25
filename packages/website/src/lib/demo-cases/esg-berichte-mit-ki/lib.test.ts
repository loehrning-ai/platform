import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ASCII, analyse, ladder, maxMissingFor, shortfall, statusOf, stripOf, valueCoverage } from "./analyse";
import { COPY } from "./copy";
import { ELECTRICITY, HOLE, WATER, electricityWith } from "./data";
import { decimalsOf, formatNumber, formatPercent, formatSmart, round } from "./numbers";
import { NO_RESOLUTION, detectConvention, parseNumber, parseSeries, resolveCells, unitHints } from "./parse";
import { INTRO_MS, introAt, sceneAt, seg } from "./scene";
import { buildAnswerLine, buildMail, buildRule, buildTakeaways, monthsText } from "./takeaways";
import type { MonthCell, Series } from "./types";

const WEBSITE = join(__dirname, "../../../..");
const ZIP = join(WEBSITE, "public/workshops/esg-berichte-mit-ki/crvena-zemja-esg-kit.zip");

function kitFile(path: string): string | null {
  if (!existsSync(ZIP)) return null;
  try {
    return execFileSync("unzip", ["-p", ZIP, `crvena-zemja-esg-kit/${path}`], { encoding: "utf8" });
  } catch {
    return null;
  }
}

function csvColumn(text: string, column: string): Map<number, number> {
  const [header, ...rows] = text.split("\n").filter((line) => line && !line.startsWith("#"));
  const names = (header as string).split(",");
  const at = names.indexOf(column);
  return new Map(rows.map((row) => {
    const cells = row.split(",");
    return [Number((cells[0] as string).slice(5)), Number(cells[at])] as const;
  }));
}

const energy = kitFile("project-files/energy_bills_2025.csv");
const water = kitFile("project-files/water_bills_2025.csv");

describe("the data matches the workshop kit", () => {
  it.skipIf(energy === null)("electricity: eleven bills, September absent, sum 279 700 kWh", () => {
    const kwh = csvColumn(energy as string, "kWh");
    expect(kwh.size).toBe(11);
    expect(kwh.has(9)).toBe(false);
    for (const cell of ELECTRICITY.cells) {
      if (cell.month === 9) continue;
      expect(round((kwh.get(cell.month) as number) / 1000)).toBe(cell.value);
    }
    expect([...kwh.values()].reduce((a, b) => a + b, 0)).toBe(279_700);
  });
  it.skipIf(water === null)("water: twelve bills, 4 630 m3", () => {
    const m3 = csvColumn(water as string, "m3");
    expect(m3.size).toBe(12);
    expect(WATER.cells.map((cell) => cell.value)).toEqual(Array.from({ length: 12 }, (_, i) => m3.get(i + 1)));
    expect([...m3.values()].reduce((a, b) => a + b, 0)).toBe(4630);
  });
  it("names the invoice number of the hole", () => {
    expect(ELECTRICITY.cells[8]).toMatchObject({ month: 9, value: null, state: "missing", invoiceNo: "EL-25-09" });
  });
});

describe("analyse: the spec's numbers", () => {
  const a = analyse(ELECTRICITY);
  it("sums the proven months and counts coverage", () => {
    expect(a.provenSum).toBe(279.7);
    expect(a.provenMonths).toBe(11);
    expect(a.missingMonths).toEqual([9]);
    expect(round(a.monthCoverage * 100, 1)).toBe(91.7);
  });
  it("computes the shortcuts", () => {
    expect(a.avgTimes12).toBeCloseTo(305.127, 3);
    expect(formatNumber(a.avgTimes12 as number, "de", 1)).toBe("305,1");
    expect(a.maxFill).toBe(318.4);
    expect(a.band).toEqual({ min: 19.2, max: 38.7 });
  });
  it("knows the truth only through the bill", () => {
    expect(round(HOLE.draftTotal + HOLE.truth, 1)).toBe(320.9);
    const coverage = valueCoverage(a.provenSum, HOLE.truthTotal);
    expect(formatPercent(coverage, "de", 1)).toBe("87,2 %");
    expect(maxMissingFor(a.provenSum, 0.95)).toBeCloseTo(14.72, 2);
    expect(formatNumber(maxMissingFor(a.provenSum, 0.95), "de", 1)).toBe("14,7");
    expect(formatPercent(shortfall(a.provenSum, HOLE.truthTotal), "de", 1)).toBe("12,8 %");
    expect(formatPercent(shortfall(a.provenSum, HOLE.truthTotal), "en", 1)).toBe("12.8 %");
    // the smallest proven month (19.2) is above the 14.7 cap: no honest September fits
    expect((a.band as { min: number }).min).toBeGreaterThan(maxMissingFor(a.provenSum, 0.95));
  });
  it("water is complete and says OK", () => {
    const w = analyse(WATER);
    expect(w.provenMonths).toBe(12);
    expect(w.provenSum).toBe(4630);
    expect(w.status).toBe("OK");
    expect(stripOf(WATER.cells)).toBe("■■■■■■■■■■■■");
  });
  it("status: missing beats estimate beats OK", () => {
    expect(statusOf(1, 1)).toBe("NOT_FOUND");
    expect(statusOf(0, 1)).toBe("NEEDS_CHECK");
    expect(statusOf(0, 0)).toBe("OK");
    expect(a.status).toBe("NOT_FOUND");
    expect(analyse(electricityWith(30, false, "x")).status).toBe("NEEDS_CHECK");
    expect(analyse(electricityWith(30, true, "x")).status).toBe("OK");
  });
  it("never adds an estimate to the proven sum", () => {
    const guessed = analyse(electricityWith(33.3, false, "x"));
    expect(guessed.provenSum).toBe(279.7);
    expect(guessed.estimateMonths).toBe(1);
    expect(stripOf(electricityWith(33.3, false, "x").cells)).toBe("■■■■■■■■▨■■■");
    expect(stripOf(ELECTRICITY.cells)).toBe("■■■■■■■■□■■■");
    expect(stripOf(ELECTRICITY.cells, true)).toBe("XXXXXXXX_XXX");
  });
  it("the ladder leads with the guess, runs the shortcuts ascending and ends on the bill", () => {
    const rows = ladder(a, HOLE.truthTotal, 30);
    expect(rows.map((row) => row.id)).toEqual(["guess", "draft", "average", "maxFill", "bill"]);
    const shortcutValues = rows.slice(1).map((row) => row.value);
    expect(shortcutValues).toEqual([...shortcutValues].sort((x, y) => x - y));
    expect(ladder(a, HOLE.truthTotal, null)).toHaveLength(4);
    const shortcuts = rows.filter((row) => row.id === "average" || row.id === "maxFill" || row.id === "draft");
    for (const row of shortcuts) expect(row.value).toBeLessThan(HOLE.truthTotal);
  });
});

describe("parseNumber", () => {
  it("resolves both separators by the last one", () => {
    expect(parseNumber("1.234,5")?.value).toBe(1234.5);
    expect(parseNumber("1,234.5")?.value).toBe(1234.5);
    expect(parseNumber("1.234.567")?.value).toBe(1234567);
    expect(parseNumber("20,6")?.value).toBe(20.6);
    expect(parseNumber("20600")?.value).toBe(20600);
    expect(parseNumber("21.400kWh")?.value).toBe(21400);
  });
  it("reads a single dot plus three digits as thousands and keeps the other reading", () => {
    expect(parseNumber("21.400")).toEqual({ value: 21400, alt: 21.4, separator: "." });
    expect(parseNumber("21,400")).toEqual({ value: 21400, alt: 21.4, separator: "," });
    expect(parseNumber("0.125")).toEqual({ value: 0.125, alt: null, separator: null });
  });
  it("rejects text", () => {
    expect(parseNumber("EL-25-03")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});

describe("parseSeries", () => {
  const cellsOf = (text: string) => resolveCells(parseSeries(text)).cells;
  const values = (cells: readonly MonthCell[]) => cells.map((cell) => cell.value);

  it("reads a column of twelve in position, a blank line or a dash is a hole", () => {
    const text = "21400\n19800\n20600\n19200\n22500\n26800\n30400\n32100\n\n38700\n25300\n22900";
    const parsed = parseSeries(text);
    expect(parsed.countMismatch).toBeNull();
    const cells = resolveCells(parsed).cells;
    expect(cells[8]).toMatchObject({ state: "missing", value: null });
    expect(cells[9]?.value).toBe(38700);
    expect(stripOf(cells)).toBe("■■■■■■■■□■■■");
    expect(stripOf(cellsOf(text.replace("\n\n", "\n-\n")))).toBe("■■■■■■■■□■■■");
  });
  it("reads a tab separated row from Excel", () => {
    const cells = cellsOf("1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t11\t12");
    expect(values(cells)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it("reads month labels in every notation", () => {
    const cells = cellsOf("Jan 21.400\nMärz 20,6\n2025-03 EL-25-03 20600\nmay 5\n3 99\n12 7");
    expect(cells[0]?.value).toBe(21400);
    expect(cells[4]?.value).toBe(5);
    expect(cells[11]?.value).toBe(7);
    // March appears three times: the first row is kept, both others are listed as duplicates
    expect(cells[2]?.value).toBe(20.6);
  });
  it("marks a repeated month and lets the second row win on request", () => {
    const parsed = parseSeries("Jan 10\nJan 20\nFeb 5");
    const first = resolveCells(parsed);
    expect(first.cells[0]?.value).toBe(10);
    expect(first.duplicates).toEqual([{ month: 1, first: 0, second: 1 }]);
    const swapped = resolveCells(parsed, { ...NO_RESOLUTION, swaps: new Set([1]) });
    expect(swapped.cells[0]?.value).toBe(20);
  });
  it("flips an ambiguous number and keeps the choice visible", () => {
    // English page: "21.400" has three decimals as far as the page language goes, so it is shown, not decided.
    const parsed = parseSeries("Jan 21.400", "en");
    const entry = parsed.entries[0];
    expect(entry).toMatchObject({ value: 21.4, alt: 21400, separator: "." });
    const flipped = resolveCells(parsed, { ...NO_RESOLUTION, flips: new Set([0]) });
    expect(flipped.cells[0]?.value).toBe(21400);
  });
  it("reads the page language's own thousands separator silently, and flags the foreign one", () => {
    const de = parseSeries("Jan 21.400\nFeb 22.100\nMär 23.000", "de");
    expect(de.entries.map((entry) => [entry.value, entry.alt])).toEqual([[21400, null], [22100, null], [23000, null]]);
    const en = parseSeries("Jan 21,400\nFeb 22,100", "en");
    expect(en.entries.map((entry) => [entry.value, entry.alt])).toEqual([[21400, null], [22100, null]]);
    // "21,400" on a German page: three decimals, shown with the other reading
    const foreign = parseSeries("Jan 21,400", "de").entries[0];
    expect(foreign).toMatchObject({ value: 21.4, alt: 21400 });
  });
  it("lets the paste itself settle the separators, and flags the one token that disagrees", () => {
    expect(detectConvention("1,234.5\n2,000.5", "de")).toMatchObject({ thousands: ",", evident: true });
    expect(detectConvention("1.234,5", "en")).toMatchObject({ thousands: ".", evident: true });
    expect(detectConvention("21.400\n19.800", "de")).toMatchObject({ thousands: ".", evident: false });
    // "1,234.5" says: comma is thousands, dot is decimal. "1.234" is then a number with three decimals: shown.
    // "2,500" is read as thousands because the paste says so, against the page language: shown too, so it can be flipped.
    const mixed = parseSeries("Jan 1,234.5\nFeb 1.234\nMär 2,500", "de");
    expect(mixed.entries.map((entry) => [entry.value, entry.alt])).toEqual([[1234.5, null], [1.234, 1234], [2500, 2.5]]);
  });
  it("joins a space as thousands separator and never reads a group as a zero", () => {
    for (const text of ["Aug 24 000", "Aug 24 000", "Aug 24\u00a0000", "Aug 24\u202f000", "Aug 24 000 kWh", "Aug 24000"]) {
      const cell = resolveCells(parseSeries(text)).cells[7];
      expect(cell, text).toMatchObject({ value: 24000, state: "proven" });
    }
    expect(parseNumber("1 234 567,8")?.value).toBe(1234567.8);
    expect(parseNumber("24 00")).toBeNull();
    // a column of Excel cells keeps the same reading
    expect(resolveCells(parseSeries("24 000\n19 800")).cells[0]?.value).toBe(24000);
  });
  it("lists a line it cannot read in full instead of taking a part of it", () => {
    for (const text of ["Aug 24 0x0", "Aug 24000 25000", "Aug 24000 abc!"]) {
      const parsed = parseSeries(text);
      expect(parsed.entries[0]?.kind, text).toBe("unread");
      expect(resolveCells(parsed).cells[7]?.state, text).toBe("missing");
    }
    // a year next to the value, a unit and a note after it are fine
    expect(resolveCells(parseSeries("Mär 2025 20600")).cells[2]?.value).toBe(20600);
    expect(resolveCells(parseSeries("Mär 20,6 MWh (geschätzt)")).cells[2]?.value).toBe(20.6);
  });
  it("a zero is shown for confirmation, never as a quiet proven month", () => {
    const resolved = resolveCells(parseSeries("Jan 5\nAug 0"));
    expect(resolved.cells[7]).toMatchObject({ value: 0, state: "proven" });
    expect(resolved.zeroHints).toEqual([8]);
    expect(resolveCells(parseSeries("Jan 5\nAug 3")).zeroHints).toEqual([]);
  });
  it("marks ~ and ca. as estimate, dash and words as missing", () => {
    const cells = cellsOf("Jan ~100\nFeb ca. 90\nMär -\nApr fehlt\nMai 70");
    expect(cells[0]).toMatchObject({ value: 100, state: "estimate" });
    expect(cells[1]).toMatchObject({ value: 90, state: "estimate" });
    expect(cells[2]?.state).toBe("missing");
    expect(cells[3]?.state).toBe("missing");
    expect(cells[4]).toMatchObject({ value: 70, state: "proven" });
  });
  it("keeps a line it cannot read, never drops it", () => {
    const parsed = parseSeries("Jan 5\nhello world\nFeb 6");
    const unread = parsed.entries.filter((entry) => entry.kind === "unread");
    expect(unread).toHaveLength(1);
    expect(unread[0]?.raw).toBe("hello world");
  });
  it("lists a header above the values and says when the count is not twelve", () => {
    const parsed = parseSeries("kWh\n1\n2\n3");
    expect(parsed.entries[0]).toMatchObject({ kind: "unread", month: null });
    expect(parsed.countMismatch).toBe(3);
    expect(resolveCells(parsed).cells[0]?.value).toBe(1);
  });
  it("hints at a unit mistake by a factor of twenty", () => {
    const cells: MonthCell[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      value: i === 5 ? 21400 : 21.4,
      state: "proven" as const,
    }));
    expect(unitHints(cells)).toEqual([6]);
  });
  it("applies hand edits last", () => {
    const parsed = parseSeries("Jan 5");
    const edited = resolveCells(parsed, { ...NO_RESOLUTION, edits: new Map([[1, ""], [2, "~7,5"]]) });
    expect(edited.cells[0]?.state).toBe("missing");
    expect(edited.cells[1]).toMatchObject({ value: 7.5, state: "estimate" });
  });
  it("is empty for empty input", () => {
    expect(parseSeries("   ").entries).toEqual([]);
    expect(stripOf(resolveCells(parseSeries("")).cells)).toBe("□□□□□□□□□□□□");
  });
});

describe("scene", () => {
  it("p = 0 and p = 1 are the end frames", () => {
    const start = sceneAt(0, null);
    expect(start.total).toBe(279.7);
    expect(start.barHeight).toBe(0);
    expect(start.stripFlip).toBe(0);
    const end = sceneAt(1, 30);
    expect(end.total).toBe(320.9);
    expect(end.barHeight).toBe(41.2);
    expect(end.stampStrike).toBe(1);
    expect(end.stampLift).toBe(1);
    expect(sceneAt(0, 12).stampLift).toBe(0);
    expect(end.stripFlip).toBe(1);
    expect(end.ghost).toBe(1);
    expect(end.ladder.every((value) => value === 1)).toBe(true);
    expect(end.sheetOpacity).toBe(0);
    expect(start.sheetOpacity).toBe(0);
    expect(sceneAt(1, null).ghost).toBe(0);
  });
  it("the sheet falls onto the slot, rides up behind the bar, and is gone before the bar settles", () => {
    const at = (p: number) => sceneAt(p, 30);
    expect(at(0.01).sheetOpacity).toBeLessThan(0.5);
    expect(at(0.3).sheetOpacity).toBe(1);
    expect(at(0.3).sheetBottom).toBeCloseTo(3, 5);
    expect(at(0.1).sheetBottom).toBeGreaterThan(at(0.2).sheetBottom);
    expect(at(0.6).sheetBottom).toBeGreaterThan(at(0.3).sheetBottom);
    expect(at(0.9).sheetOpacity).toBe(0);
    expect(at(0.3).barHeight).toBe(0);
  });
  it("every frame of the roll is a figure of one decimal, and the stamp is struck and lifted in separate windows", () => {
    for (let i = 0; i <= 1000; i += 1) {
      const frame = sceneAt(i / 1000, 33.3);
      expect(Math.round(frame.total * 10) / 10).toBe(frame.total);
      expect(frame.stampStrike === 1 || frame.stampLift === 0).toBe(true);
    }
    expect(sceneAt(0.8, 44).total).toBeGreaterThanOrEqual(320.9);
  });
  it("the off-by label waits until the roll has landed and needs a guess", () => {
    expect(sceneAt(0.8, 30).offLabel).toBe(0);
    expect(sceneAt(1, 30).offLabel).toBe(1);
    expect(sceneAt(1, null).offLabel).toBe(0);
  });
  it("the number starts from the draft plus the guess", () => {
    expect(sceneAt(0, 12.5).total).toBe(292.2);
  });
  it("is finite everywhere, monotone for the total, and the bar overshoots once", () => {
    let last = -Infinity;
    let peak = 0;
    for (let i = 0; i <= 1000; i += 1) {
      const frame = sceneAt(i / 1000, 20);
      for (const value of [frame.total, frame.barHeight, frame.envelope, frame.ghost, frame.stampStrike, frame.stampLift, ...frame.ladder]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(frame.total).toBeGreaterThanOrEqual(last);
      last = frame.total;
      peak = Math.max(peak, frame.barHeight);
    }
    expect(peak).toBeGreaterThan(41.2);
    expect(peak).toBeLessThan(50);
    expect(sceneAt(-3, null)).toEqual(sceneAt(0, null));
    expect(sceneAt(7, null)).toEqual(sceneAt(1, null));
  });
  it("seg clamps", () => {
    expect(seg(-1, 0.2, 0.4)).toBe(0);
    expect(seg(2, 0.2, 0.4)).toBe(1);
  });
  it("the intro ends in the hero state", () => {
    const end = introAt(1);
    expect(end.bars.every((bar) => bar === 1)).toBe(true);
    expect(end.stamp).toBe(1);
    expect(end.pulse).toBe(0);
    expect(introAt(0).bars.every((bar) => bar === 0)).toBe(true);
    expect(INTRO_MS).toBeLessThanOrEqual(900);
  });
});

describe("takeaways", () => {
  const fixtures = (locale: "de" | "en") => ({
    locale,
    texts: COPY[locale].texts,
    months: COPY[locale].months,
  });
  const folder: Series = { ...ELECTRICITY, label: "Stromverbrauch 2025" };
  const analysis = analyse(folder);

  it("answer line, German, exactly as specced", () => {
    expect(buildAnswerLine(folder, analysis, { ...fixtures("de"), ascii: false })).toBe(
      "Stromverbrauch 2025: mindestens 279,7 MWh belegt (11 von 12 Monatsrechnungen, 91,7 % der Monate). Beleg-Streifen J-D: ■■■■■■■■□■■■. Es fehlt: September 2025. Jahreswert: NOT FOUND, bis die Rechnung vorliegt. Quelle: energy_bills_2025.csv.",
    );
  });
  it("answer line, English and ASCII", () => {
    const english = { ...folder, label: "Electricity 2025" };
    expect(buildAnswerLine(english, analysis, { ...fixtures("en"), ascii: false })).toBe(
      "Electricity 2025: at least 279.7 MWh proven (11 of 12 monthly bills, 91.7 % of months). Beleg-Streifen (evidence strip) Jan-Dec: ■■■■■■■■□■■■. Missing: September 2025. Annual figure: NOT FOUND until the bill arrives. Source: energy_bills_2025.csv.",
    );
    expect(buildAnswerLine(english, analysis, { ...fixtures("en"), ascii: true })).toContain("XXXXXXXX_XXX");
    expect(buildAnswerLine(english, analysis, { ...fixtures("en"), ascii: true })).not.toMatch(/[■▨□]/);
  });
  it("complete series: water", () => {
    const series: Series = { ...WATER, label: "Wasserentnahme 2025" };
    expect(buildAnswerLine(series, analyse(series), { ...fixtures("de"), ascii: false })).toBe(
      "Wasserentnahme 2025: 4.630 m³ aus 12 von 12 Monatsrechnungen (water_bills_2025.csv). Beleg-Streifen J-D: ■■■■■■■■■■■■. Status: OK.",
    );
    const en: Series = { ...WATER, label: "Water withdrawn 2025" };
    expect(buildAnswerLine(en, analyse(en), { ...fixtures("en"), ascii: false })).toBe(
      "Water withdrawn 2025: 4,630 m³ from 12 of 12 monthly bills (water_bills_2025.csv). Beleg-Streifen (evidence strip) Jan-Dec: ■■■■■■■■■■■■. Status: OK.",
    );
  });
  it("estimates and plural holes", () => {
    const cells = ELECTRICITY.cells.map((cell) =>
      cell.month === 3 ? { ...cell, value: null, state: "missing" as const } : cell.month === 5 ? { ...cell, value: 22.5, state: "estimate" as const } : cell,
    );
    const series: Series = { ...ELECTRICITY, id: "own", source: undefined, year: undefined, label: "", cells };
    const line = buildAnswerLine(series, analyse(series), { ...fixtures("de"), ascii: false });
    expect(line).toContain("Es fehlen: März und September.");
    expect(line).toContain("bis sie vorliegen");
    expect(line).toContain("Geschätzt: Mai (NEEDS CHECK, Grund: Schätzung).");
    // No label set: no placeholder name leaks into a line the visitor copies.
    expect(line).not.toContain("Meine Reihe");
    expect(line.startsWith("Mindestens")).toBe(true);
    const mail = buildMail(series, analyse(series), { ...fixtures("de"), ascii: false });
    expect(mail).not.toContain("Meine Reihe");
    expect(mail).toContain("für diese Zahlen");
    expect(line).not.toContain("Quelle");
  });
  it("mail names the invoice number and its neighbours, German and English", () => {
    expect(buildMail(folder, analysis, { ...fixtures("de"), ascii: false })).toBe(
      "Betreff: Fehlende Stromrechnung 09/2025 (EL-25-09)\n\nHallo [Name], für die Stromauswertung 2025 fehlt mir die Rechnung für September 2025 (Nummer EL-25-09, in der Folge zwischen EL-25-08 und EL-25-10). Bitte schick sie mir als PDF oder den Zählerstand vom Lieferanten bis [Datum]. Die anderen elf Monate liegen vor. Ohne diese Rechnung kann ich keinen Jahreswert belegen. Danke!",
    );
    expect(buildMail(folder, analysis, { ...fixtures("en"), ascii: false })).toBe(
      "Subject: Missing electricity bill 09/2025 (EL-25-09)\n\nHi [name], for the 2025 electricity figure I am missing the bill for September 2025 (number EL-25-09, between EL-25-08 and EL-25-10). Please send it as a PDF, or the meter reading from the supplier, by [date]. The other eleven months are in. Without it I cannot prove an annual figure. Thanks!",
    );
  });
  it("own data: no invoice number, no meter reading unless the unit is energy", () => {
    const cells = Array.from({ length: 12 }, (_, i): MonthCell => i === 2 ? { month: 3, value: null, state: "missing" } : { month: i + 1, value: 10, state: "proven" });
    const own: Series = { id: "own", label: "Gas", unit: "m³", digits: 0, cells };
    const mail = buildMail(own, analyse(own), { ...fixtures("de"), ascii: false }) as string;
    expect(mail).toContain("Betreff: Fehlende Rechnung März");
    expect(mail).toContain("für Gas fehlt mir die Rechnung für März.");
    expect(mail).not.toContain("EL-25");
    expect(mail).not.toContain("Zählerstand");
    expect(mail).toContain("Die anderen elf Monate");
    const kwh = buildMail({ ...own, unit: "kWh" }, analyse(own), { ...fixtures("de"), ascii: false }) as string;
    expect(kwh).toContain("Zählerstand");
  });
  it("nothing missing: no mail", () => {
    expect(buildMail(WATER, analyse(WATER), { ...fixtures("de"), ascii: false })).toBeNull();
  });
  it("the rule is static and swaps its legend", () => {
    expect(buildRule({ ...fixtures("de"), ascii: false })).toContain("■ Rechnung liegt im Ordner, ▨ Schätzung, □ fehlt.");
    expect(buildRule({ ...fixtures("de"), ascii: true })).toContain("X Rechnung liegt im Ordner, ~ Schätzung, _ fehlt.");
    expect(buildRule({ ...fixtures("en"), ascii: false }).startsWith("4. Beleg-Streifen (evidence strip):")).toBe(true);
  });
  it("a guess never changes any takeaway", () => {
    for (const locale of ["de", "en"] as const) {
      const options = { ...fixtures(locale), ascii: false };
      const folderOnly = buildTakeaways(electricityWith(null, false, "L"), analyse(ELECTRICITY), options);
      const again = buildTakeaways({ ...ELECTRICITY, label: "L" }, analyse(ELECTRICITY), options);
      expect(again).toEqual(folderOnly);
    }
  });
  it("makes no 'full year' claim outside the rule, and uses no dashes", () => {
    for (const locale of ["de", "en"] as const) {
      const options = { ...fixtures(locale), ascii: false };
      const texts = [
        buildAnswerLine(folder, analysis, options),
        buildMail(folder, analysis, options) as string,
      ];
      for (const text of texts) {
        expect(text).not.toMatch(/[–—]/);
        expect(text.replace(/Annual figure: NOT FOUND/, "")).not.toMatch(/Gesamtjahr|ganzes Jahr|full year/i);
      }
    }
  });
  it("lists months in natural language", () => {
    const names = COPY.en.months;
    expect(monthsText([9], names, "and", 2025)).toBe("September 2025");
    expect(monthsText([9, 11], names, "and", 2025)).toBe("September and November 2025");
    expect(monthsText([1, 2, 3], names, "and")).toBe("January, February and March");
  });
});

describe("numbers", () => {
  it("formats by locale and finds decimals", () => {
    expect(formatNumber(4630, "de", 0)).toBe("4.630");
    expect(formatNumber(4630, "en", 0)).toBe("4,630");
    expect(decimalsOf([21.4, 20, 5.25])).toBe(2);
    expect(decimalsOf([1, 2, 3])).toBe(0);
    expect(ASCII.missing).toBe("_");
  });
});

describe("formatSmart", () => {
  it("prints only the decimals a figure needs", () => {
    expect(formatSmart(30000, "de", 1)).toBe("30.000");
    expect(formatSmart(279.7, "de", 1)).toBe("279,7");
    expect(formatSmart(30000, "en", 2)).toBe("30,000");
    expect(formatSmart(12.25, "de", 1)).toBe("12,3");
  });
});

describe("takeaways after the bill", () => {
  it("the 12 of 12 variant has no hole, no NOT FOUND and no mail", () => {
    const texts = COPY.de.texts;
    const withBill = electricityWith(null, true, COPY.de.form.electricity);
    const options = { locale: "de" as const, texts, months: COPY.de.months, ascii: false };
    const [answer, mail] = buildTakeaways(withBill, analyse(withBill), options);
    expect(answer?.text).toBe(
      "Stromverbrauch 2025: 320,9 MWh aus 12 von 12 Monatsrechnungen (energy_bills_2025.csv). Beleg-Streifen J-D: ■■■■■■■■■■■■. Status: OK.",
    );
    expect(mail?.text).toBeNull();
    expect(answer?.text).not.toContain("NOT FOUND");
  });
  it("own sums that are whole numbers carry no trailing decimals", () => {
    const own: Series = {
      id: "own", label: "", unit: "kWh", digits: 1,
      cells: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: i === 0 ? 20000.5 : 1000, state: "proven" as const })),
    };
    const half = { ...own, cells: own.cells.map((cell, i) => (i === 0 ? { ...cell, value: 19000 } : cell)) };
    const text = buildAnswerLine(half, analyse(half), { locale: "de", texts: COPY.de.texts, months: COPY.de.months, ascii: false });
    expect(text).toContain("30.000 kWh");
    expect(text).not.toContain("30.000,0");
  });
});
