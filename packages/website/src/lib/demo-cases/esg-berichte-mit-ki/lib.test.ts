import { describe, expect, it } from "vitest";
import { BEATS } from "./beats";
import { validateBeatsV4 } from "@/lib/demo-beats";
import {
  BOM,
  csvCell,
  fill,
  missingDocMails,
  monthList,
  safeWording,
  toMarkdownTable,
  toRegisterCsv,
  type ExportWords,
} from "./export";
import { BIO, PV, SEPTEMBER_INVOICE, STICHTAG, STROM, WASSER } from "./kit";
import { affectedBy, cascadeFlips, citeCounts, ledgerCounts, LEDGER, missingDocuments, tileStatus, VSME, vsmeCounts } from "./ledger";
import { EXPIRED_DAYS } from "./figures";
import {
  addRow,
  cleanSentence,
  EMPTY_INPUT,
  MAX_ROWS,
  probeOwn,
  validate,
  type OwnInput,
  type OwnRow,
} from "./own";
import {
  countStatuses,
  coverage,
  daysBetween,
  distinctMonths,
  meterCheck,
  naiveSum,
  parseDate,
  payback,
  roundTo,
  share,
  sumDistinct,
  weakest,
} from "./rules";

// The words come from the server-only pack; the tests load it through vitest, which has no server-only guard.
import { COPY } from "./copy";

const mwh = (kwh: number) => roundTo(kwh / 1000, 1);
const words = (locale: "de" | "en"): ExportWords => COPY[locale].own.words;

describe("energy: months, not rows", () => {
  const count = distinctMonths(STROM, 2025);
  it("finds 11 months, the October duplicate on lines 11 and 12, September missing", () => {
    expect(count.months).toHaveLength(11);
    expect(count.duplicates).toEqual([{ invoice: "EL-25-10", lines: [11, 12] }]);
    expect(count.missing).toEqual([9]);
    expect(count.conflicts).toEqual([]);
  });
  it("re-derives every figure of LOESUNGEN.md", () => {
    expect(mwh(sumDistinct(STROM))).toBe(279.7);
    expect(mwh(naiveSum(STROM))).toBe(318.4);
    const withSeptember = sumDistinct(STROM) + SEPTEMBER_INVOICE.kwh;
    expect(mwh(withSeptember)).toBe(320.9);
    expect(roundTo((sumDistinct(STROM) / 11) * 12 / 1000, 1)).toBe(305.1);
    expect(roundTo(mwh(withSeptember) - 305.1, 1)).toBe(15.8);
    expect(roundTo(mwh(withSeptember) - 279.7, 1)).toBe(41.2);
    expect(roundTo(coverage(11) * 100, 1)).toBe(91.7);
    expect(roundTo(share(PV.yieldMwh, 279.7) * 100, 1)).toBe(64.4);
    expect(roundTo(share(PV.yieldMwh, 320.9) * 100, 1)).toBe(56.1);
    expect(roundTo(payback(PV.investmentMkd, PV.yieldMwh * 1000, PV.tariff), 1)).toBe(5);
    expect(sumDistinct(WASSER)).toBe(4630);
    expect(distinctMonths(WASSER, 2025).months).toHaveLength(12);
  });
  it("checks the invoice photo against itself and catches a mismatch", () => {
    expect(meterCheck(SEPTEMBER_INVOICE.meterOld, SEPTEMBER_INVOICE.meterNew, SEPTEMBER_INVOICE.kwh)).toEqual({ difference: 41200, matches: true });
    expect(meterCheck(1284350, 1325550, 42100).matches).toBe(false);
    expect(SEPTEMBER_INVOICE.kwh * SEPTEMBER_INVOICE.tariff).toBe(SEPTEMBER_INVOICE.totalMkd);
  });
  it("counts two different invoices for one month as a conflict", () => {
    const rows = [
      { month: "2025-01", invoice: "A", amount: 1, line: 3 },
      { month: "2025-01", invoice: "B", amount: 2, line: 4 },
    ];
    expect(distinctMonths(rows, 2025).conflicts).toEqual(["2025-01"]);
  });
});

describe("dates", () => {
  it("counts 46 days from 31.08.2026 to the Stichtag 16.10.2026", () => {
    expect(daysBetween(BIO.validUntil, STICHTAG)).toBe(46);
    expect(EXPIRED_DAYS).toBe(46);
  });
  it("parses only real days", () => {
    expect(parseDate("31.08.2026")).toEqual({ year: 2026, month: 8, day: 31 });
    expect(parseDate("31.02.2026")).toBeNull();
    expect(parseDate("2026-08-31")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
});

describe("statuses", () => {
  it("lets the weakest part count", () => {
    expect(weakest(["belegt", "schwach"])).toBe("schwach");
    expect(weakest(["schwach", "luecke", "belegt"])).toBe("luecke");
    expect(weakest([])).toBe("belegt");
  });
});

describe("the register", () => {
  it("counts 9 BELEGT, 3 SCHWACH, 9 LÜCKE before and 10, 4, 7 after", () => {
    expect(LEDGER).toHaveLength(21);
    expect(ledgerCounts("before")).toEqual({ belegt: 9, schwach: 3, luecke: 9 });
    expect(ledgerCounts("after")).toEqual({ belegt: 10, schwach: 4, luecke: 7 });
  });
  it("rechecks the six rows that cite the electricity file and flips exactly F2 and F3", () => {
    expect(affectedBy("strom")).toEqual(["Q1", "Q2", "C5", "F2", "F3", "F4"]);
    expect(cascadeFlips()).toEqual(["F2", "F3"]);
    expect(LEDGER.find((row) => row.id === "F2")?.after).toBe("belegt");
    expect(LEDGER.find((row) => row.id === "F3")?.after).toBe("schwach");
    expect(citeCounts().strom).toBe(6);
  });
  it("orders VSME into 5 BELEGT and 6 LÜCKE, B3 from 0 of 4 to 1 of 4", () => {
    expect(vsmeCounts("before")).toEqual({ belegt: 5, schwach: 0, luecke: 6 });
    expect(vsmeCounts("after")).toEqual({ belegt: 5, schwach: 0, luecke: 6 });
    const b3 = VSME.find((tile) => tile.id === "B3")!;
    expect([b3.done, b3.doneAfter, b3.total]).toEqual([0, 1, 4]);
    expect(tileStatus(1, 4)).toBe("luecke");
  });
  it("puts the September invoice first in the request list, with six dependents", () => {
    const list = missingDocuments();
    expect(list[0]).toEqual({ doc: "septemberInvoice", dependents: ["Q1", "Q2", "C5", "F2", "F3", "B3"] });
    expect(new Set(list.map((entry) => entry.doc))).toEqual(
      new Set(["septemberInvoice", "gridFactor", "diesel", "bioRenewed", "supplyMix", "bills2024", "permit", "siteMap", "waste", "hoursWorked", "minimumWage"]),
    );
    expect(missingDocuments("after").some((entry) => entry.doc === "septemberInvoice")).toBe(false);
  });
  it("matches the statuses of the four sentences: LÜCKE, LÜCKE, LÜCKE (4c), BELEGT", () => {
    const byId = (id: string) => LEDGER.find((row) => row.id === id)!;
    expect([byId("C3").before, byId("C3").gate]).toEqual(["luecke", "4b"]);
    expect(byId("F2").before).toBe("luecke");
    expect([byId("C1").before, byId("C1").gate]).toEqual(["luecke", "4c"]);
    expect(byId("C7").before).toBe("belegt");
  });
});

const input = (patch: Partial<OwnInput>): OwnInput => ({ ...EMPTY_INPUT, sentence: "Unser Satz", ...patch });

describe("own sentences", () => {
  it("refuses an empty sentence and strips control characters", () => {
    expect(validate(input({ sentence: "  " }))).toContain("sentenceEmpty");
    expect(cleanSentence("A\u0007B\nC")).toBe("AB C");
    expect(cleanSentence("x".repeat(300))).toHaveLength(280);
  });
  it("flags a bad date and a missing reference date", () => {
    expect(validate(input({ evidence: "certificate", validUntil: "31.13.2026" }))).toContain("validUntilFormat");
    expect(validate(input({ evidence: "certificate", validUntil: "31.08.2026" }))).toContain("stichtagNeeded");
    expect(validate(input({ evidence: "certificate", validUntil: "31.08.2026", stichtag: "16.10.2026" }))).toEqual([]);
  });
  it("gives LÜCKE at once for nothing", () => {
    const result = probeOwn(input({ evidence: "nothing" }));
    expect(result.status).toBe("luecke");
    expect(result.missing).toEqual([{ code: "nothing" }]);
  });
  it("gives LÜCKE for bills without months, and for a whole year with a month missing", () => {
    expect(probeOwn(input({ evidence: "bills" })).status).toBe("luecke");
    const months = Array.from({ length: 12 }, (_, index) => index !== 8);
    const result = probeOwn(input({ evidence: "bills", months }));
    expect(result.status).toBe("luecke");
    expect(result.missing).toEqual([{ code: "months", months: [9], year: null }]);
    expect(probeOwn(input({ sentence: "Strom 2025: 412 MWh", evidence: "bills", months })).missing).toEqual([{ code: "months", months: [9], year: 2025 }]);
    expect(probeOwn(input({ evidence: "bills", months: Array(12).fill(true) })).status).toBe("belegt");
  });
  it("gives SCHWACH for an expired certificate, with the days", () => {
    const result = probeOwn(input({ evidence: "certificate", validUntil: "31.08.2026", stichtag: "16.10.2026" }));
    expect(result.status).toBe("schwach");
    expect(result.reasons).toContainEqual({ code: "expired", days: 46, validUntil: "31.08.2026" });
  });
  it("names the missing reference date as the reason, and lets a signed declaration go without an expiry", () => {
    const certificate = probeOwn(input({ evidence: "certificate", validUntil: "31.08.2026", stichtag: "" }));
    expect(certificate.status).toBe("schwach");
    expect(certificate.reasons).toContainEqual({ code: "noStichtag" });
    const statement = probeOwn(input({ evidence: "statement", stichtag: "16.10.2026" }));
    expect(statement.status).toBe("belegt");
    expect(statement.reasons).toEqual([]);
    expect(probeOwn(input({ evidence: "certificate", stichtag: "16.10.2026" })).reasons).toContainEqual({ code: "noValidity" });
  });
  it("never counts an offer, a draft or an offset certificate as final", () => {
    for (const evidence of ["offer", "draft", "offset"] as const) {
      const result = probeOwn(input({ evidence, final: "yes" }));
      expect(result.checks.stand).toBe("fail");
      expect(result.status).toBe("schwach");
    }
  });
  it("pre-sets 4b on a consumer claim that covers only a part, and cuts it", () => {
    const result = probeOwn(input({ destination: "label", evidence: "certificate", validUntil: "31.12.2027", stichtag: "16.10.2026", scope: "part" }));
    expect(result.gates).toContain("4b");
    expect(result.decision).toBe("streichen");
    expect(probeOwn(input({ destination: "bank", scope: "part", evidence: "bills", months: Array(12).fill(true) })).gates).toEqual([]);
  });
  it("cuts a climate neutral label claim on offsets (4c)", () => {
    const result = probeOwn(input({ sentence: "Unser Wein ist klimaneutral", destination: "label", evidence: "offset", gates: { "4c": true } }));
    expect(result.decision).toBe("streichen");
    expect(result.gates).toContain("4c");
  });
  it("cuts a future promise without a checked plan, keeps it with one", () => {
    const base = input({ destination: "website", evidence: "statement", validUntil: "31.12.2027", stichtag: "16.10.2026", gates: { zukunft: true } });
    expect(probeOwn(base).gates).toContain("zukunft");
    expect(probeOwn({ ...base, plan: true }).gates).not.toContain("zukunft");
  });
  it("refuses the 21st row", () => {
    const row = { sentence: "s" } as OwnRow;
    const full = Array.from({ length: MAX_ROWS }, () => row);
    expect(addRow(full, row)).toBe(full);
    expect(addRow([], row)).toHaveLength(1);
  });
});

const rowFor = (patch: Partial<OwnInput>, locale: "de" | "en" = "de"): OwnRow => {
  const own = input(patch);
  const result = probeOwn(own);
  const sentence = cleanSentence(own.sentence);
  return { sentence, destination: own.destination, evidence: own.evidence, result, safe: safeWording(own, result, sentence, words(locale)), period: "" };
};

describe("exports", () => {
  it("builds the safe wording only from what was entered", () => {
    const months = Array(12).fill(true);
    expect(rowFor({ sentence: "Strom 2025: 412 MWh", evidence: "bills", months }).safe).toBe("Strom 2025: 412 MWh, laut Rechnungen, das ganze Jahr.");
    expect(rowFor({ destination: "label", evidence: "nothing" }).safe).toBeNull();
  });
  it("writes a CSV with BOM, the separator and RFC 4180 quoting", () => {
    const csv = toRegisterCsv([rowFor({ sentence: 'Wir sagen "grün"; immer', evidence: "nothing" })], words("de"));
    expect(csv.startsWith(BOM)).toBe(true);
    const [header, line] = csv.slice(1).split("\r\n");
    expect(header!.split(";")).toHaveLength(12);
    expect(line).toContain('"Wir sagen ""grün""; immer"');
    expect(csvCell("a\nb", ",")).toBe('"a\nb"');
    expect(toRegisterCsv([], words("en")).slice(1).split("\r\n")[0]!.split(",")).toHaveLength(12);
  });
  it("never writes a cell a spreadsheet would run as a formula", () => {
    expect(csvCell("=HYPERLINK(\"x\")", ";")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+49 Strom", ";")).toBe("'+49 Strom");
    expect(csvCell("-12 %", ",")).toBe("'-12 %");
    expect(csvCell("@SUM(A1)", ",")).toBe("'@SUM(A1)");
    expect(csvCell("12 von 40 ha", ",")).toBe("12 von 40 ha");
    const csv = toRegisterCsv([rowFor({ sentence: "=1+1", evidence: "nothing" })], words("de"));
    expect(csv).toContain(";'=1+1;");
  });
  it("escapes pipes in the Markdown table", () => {
    const table = toMarkdownTable([rowFor({ sentence: "a | b", evidence: "nothing" })], words("de"));
    expect(table).toContain("a \\| b");
    // A backslash before a pipe would otherwise turn the escape back into a column break.
    const slashed = toMarkdownTable([rowFor({ sentence: "C:\\ | x \\| y", evidence: "nothing" })], words("de"));
    expect(slashed).toContain("C:\\\\ \\| x \\\\\\| y");
    expect(table.split("\n")[0]).toBe("| Antwort | Wohin | Nachweis | Status | Fehlt |");
  });
  it("writes month runs as ranges, with the count", () => {
    const months = Array.from({ length: 12 }, (_, index) => index !== 8);
    expect(rowFor({ sentence: "Strom 2025: 412 MWh", evidence: "bills", months, wholeYear: false }).safe).toBe(
      "Strom 2025: 412 MWh, laut Rechnungen, Januar bis August und Oktober bis Dezember (11 von 12 Monaten).",
    );
    expect(monthList([1, 2, 5], words("de"))).toBe("Januar, Februar und Mai");
    expect(monthList([10, 11, 12], words("en"))).toBe("October to December");
  });
  it("names the year and the destination in the mail, without a form-letter colon", () => {
    const months = Array.from({ length: 12 }, (_, index) => index !== 8);
    const [mail] = missingDocMails([rowFor({ sentence: "Strom 2025: 412 MWh", evidence: "bills", months })], words("de"));
    expect(mail!.text).toContain("für den Fragebogen eines Kunden brauche ich Rechnungen für September 2025.");
  });
  it("writes one mail per missing document and leaves nothing in brackets", () => {
    const rows = [rowFor({ evidence: "nothing" }), rowFor({ evidence: "nothing", sentence: "Zweiter Satz" }), rowFor({ evidence: "offer" }, "de")];
    const mails = missingDocMails(rows, words("de"));
    expect(mails).toHaveLength(2);
    for (const mail of mails) {
      expect(mail.text).not.toMatch(/[[\]{}]/);
      expect(mail.text).toContain(mail.doc);
    }
  });
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(fill("{a} und {b}", { a: 1 })).toBe("1 und {b}");
  });
});

describe("beats and copy", () => {
  it("meets the beat contract", () => {
    expect(validateBeatsV4(BEATS)).toEqual([]);
  });
  it("takes the card's capitals from the skill: ZITAT · ZEITRAUM · UMFANG · FREIGABE and QUOTE · PERIOD · SCOPE · APPROVAL", () => {
    expect(Object.values(COPY.de.checks)).toEqual(["ZITAT", "ZEITRAUM", "UMFANG", "FREIGABE"]);
    expect(Object.values(COPY.en.checks)).toEqual(["QUOTE", "PERIOD", "SCOPE", "APPROVAL"]);
    expect(Object.values(COPY.de.statuses)).toEqual(["Belegt", "Schwach belegt", "Lücke"]);
    expect(Object.values(COPY.en.statuses)).toEqual(["Covered", "Weak", "Gap"]);
    const english = JSON.stringify(COPY.en);
    for (const word of ["BELEGT", "SCHWACH", "LÜCKE", "Lücke", "Zeile"]) expect(english).not.toContain(word);
  });
  it("counts statuses", () => {
    expect(countStatuses(["belegt", "luecke"])).toEqual({ belegt: 1, schwach: 0, luecke: 1 });
  });
});
