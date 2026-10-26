import { describe, expect, it } from "vitest";
import { boundOf } from "./bound";
import { checkAnswer, MAX_ANSWER, MAX_LINE, MAX_QUOTES, parseClaudeAnswer } from "./claude-answer";
import { vardarContext } from "./case";
import { toEvidenceCsv } from "./csv";
import { daysBetween, firstDate, formatShort, parseDateTokens, windowStart } from "./dates";
import { extractMeta, documentDate } from "./meta";
import { frame, drawIn } from "./motion";
import { MAX_READ, MAX_SLICE_BYTES, READ_BUDGET_BYTES, assessFolder, datesWereCopied, type OwnEntry } from "./own-folder";
import { parseList } from "./parse-list";
import { verifyQuote } from "./quote";
import { stemOf, versionChains } from "./versions";
import { formatPercent } from "./counts";
import { COPY } from "./copy";

describe("dates", () => {
  it("clamps the window start on a leap day", () => {
    expect(windowStart("2028-02-29")).toBe("2027-02-28");
    expect(windowStart("2026-12-10")).toBe("2025-12-10");
    expect(windowStart("2026-12-10", 6)).toBe("2026-06-10");
  });
  it("reads quarters and bare years as uncertain starts", () => {
    expect(firstDate("Plan 2026-Q2")).toMatchObject({ iso: "2026-04-01", uncertain: true });
    expect(firstDate("Report 2025")).toMatchObject({ iso: "2025-01-01", uncertain: true });
  });
  it("rejects impossible dates", () => {
    expect(firstDate("2026-13-40")?.iso ?? null).toBeNull();
    expect(firstDate("scan_20261234.pdf")?.iso ?? null).toBeNull();
  });
  it("marks 05/06/2026 ambiguous", () => {
    expect(parseDateTokens("05/06/2026")[0]).toMatchObject({ ambiguous: true });
  });
  it("reads German and English dates", () => {
    expect(firstDate("Freigegeben am 12.03.2024")?.iso).toBe("2024-03-12");
    expect(firstDate("printed 6 October 2026")?.iso).toBe("2026-10-06");
    expect(daysBetween("2025-12-10", "2026-10-01")).toBe(295);
    expect(formatShort("2026-12-10", "de")).toBe("10.12.2026");
  });
});

describe("meta", () => {
  it("finds an approver with a date, and an open approval", () => {
    const meta = extractMeta("# Policy\nOwner: Goran. Approved 2026-09-02 by Dragan Ilievski, Managing Director.");
    expect(meta.approvedBy).toMatch(/Dragan/);
    expect(documentDate(meta)?.iso).toBe("2026-09-02");
    const open = extractMeta("# Policy v4 DRAFT\nEdited 2026-09-18. Approved by: (open)");
    expect(open.approvedBy).toBeNull();
    expect(open.approvalOpen).toBe(true);
    expect(open.draft).toBe(true);
  });
  it("never takes a date from a negated clause", () => {
    expect(extractMeta("Restore test: not done in 2026.").dates).toEqual([]);
  });
  it("German header words", () => {
    const meta = extractMeta("Freigegeben am 03.02.2026 von Eva Muster.");
    expect(meta.approvedBy).toMatch(/Eva Muster/);
    expect(meta.dates[0]?.iso).toBe("2026-02-03");
  });
});

describe("versions", () => {
  it("chains the versions of one document", () => {
    const names = ["Leitlinie_v2.docx", "Leitlinie_v3_final.docx", "Leitlinie_v3_final (2).docx", "Leitlinie Entwurf.docx", "Reisekosten.xlsx"];
    const chains = versionChains(names.map((name) => ({ name })));
    expect(chains).toHaveLength(1);
    expect(chains[0]?.files).toHaveLength(4);
  });
  it("folds NFD and NFC to one stem", () => {
    expect(stemOf("Prüfbericht_v1.md".normalize("NFD"))).toBe(stemOf("Prüfbericht_v2.md".normalize("NFC")));
  });
});

describe("bound", () => {
  it("never reaches BELEGT on 1000 inputs", () => {
    const tri = [true, false, null] as const;
    let seed = 7;
    const pick = <T,>(list: readonly T[]) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return list[seed % list.length] as T;
    };
    for (let i = 0; i < 1000; i += 1) {
      const bound = boundOf({ hasCandidate: pick([true, false]), date: pick(tri), approval: pick(tri) });
      expect(["none", "weak", "open"]).toContain(bound);
    }
    expect(boundOf({ hasCandidate: true, date: true, approval: true })).toBe("open");
  });
});

describe("own folder", () => {
  const entry = (name: string, extra: Partial<OwnEntry> = {}): OwnEntry => ({ name, size: 100, lastModified: null, listedDate: null, yearMissing: false, text: null, ...extra });
  it("an old listed training file is at most WEAK, a missing item a gap", () => {
    const result = assessFolder([entry("Schulungsnachweise_2024.xlsx", { listedDate: "2024-05-02" })], "2025-12-10");
    expect(result.items.find((item) => item.id === "R5")?.bound).toBe("weak");
    expect(result.items.find((item) => item.id === "R7")?.bound).toBe("none");
  });
  it("skips system files and flags lock files", () => {
    const result = assessFolder([entry(".DS_Store"), entry("~$Backup.docx"), entry("Thumbs.db")], "2025-12-10");
    expect(result.ignored).toBe(2);
    expect(result.files[0]?.notes).toContain("lock");
  });
  it("reads a text file's approval, never BELEGT", () => {
    const result = assessFolder([entry("backup-test.md", { text: "# Restore test record\nDone 2026-03-02 by IT. Approved 2026-03-03 by Eva Muster." })], "2025-12-10");
    expect(result.items.find((item) => item.id === "R7")?.bound).toBe("open");
  });
  it("a record whose text says planned is LÜCKE unless another record exists, never BELEGT", () => {
    const text = "Backup report October 2026. Generated 2026-11-01 by the backup system. Owner: IT lead.\nRestore test: planned for Q4.";
    const result = assessFolder([entry("backup-bericht_2026-10.txt", { text })], "2025-12-10");
    const file = result.files[0];
    expect(file?.type).toBe("RECORD");
    expect(file?.dateTest).toBe(true);
    expect(file?.notMet).toBe("planned");
    expect(result.items.find((item) => item.id === "R7")?.bound).toBe("notMet");
  });
  it("a policy that plans something is intent, not a failed record", () => {
    const result = assessFolder([entry("backup-richtlinie.md", { text: "# Backup policy\nApproved 2026-03-03 by the Managing Director.\nRestore tests are planned twice a year." })], "2025-12-10");
    expect(result.files[0]?.notMet).toBeNull();
  });
  it("an unreadable listed date is a note and DATUM open; an uncertain one fails only when its last day is before the window", () => {
    const garbled = assessFolder([entry("Unterauftragsverarbeiter.xlsx", { listedInvalid: true })], "2025-12-10");
    expect(garbled.files[0]?.notes).toContain("dateUnreadable");
    expect(garbled.files[0]?.dateTest).toBeNull();
    const year = assessFolder([entry("Schulung.xlsx", { listedDate: "2025-01-01", listedLatest: "2025-12-31" })], "2025-12-10");
    expect(year.files[0]?.dateTest).toBeNull();
    const old = assessFolder([entry("Schulung.xlsx", { listedDate: "2024-01-01", listedLatest: "2024-12-31" })], "2025-12-10");
    expect(old.files[0]?.dateTest).toBe(false);
  });
  it("flags a dd/mm/yyyy date in a name as ambiguous", () => {
    const result = assessFolder([entry("Datenschutz_Schulung_05/06/2026.pdf")], "2025-12-10");
    expect(result.files[0]?.notes).toContain("dateAmbiguous");
  });
  it("types a file without umlauts the same as with them", () => {
    const result = assessFolder([entry("Zugriffspruefung_Q2-2026.xlsx"), entry("Zugriffsprüfung_Q2-2026.xlsx")], "2025-12-10");
    expect(result.files.map((file) => file.type)).toEqual(["RECORD", "RECORD"]);
  });
  it("detects copied modification dates", () => {
    const now = Date.UTC(2026, 9, 25);
    expect(datesWereCopied([0, 1, 2, 3].map((i) => entry(`a${i}.md`, { lastModified: now + i * 100 })))).toBe(true);
  });
});

describe("parse list", () => {
  it("reads dir /b, ls -l and tab lists, reports unread lines", () => {
    const parsed = parseList("Backup-Bericht.pdf\n-rw-r--r--  1 tim  staff  1200 Oct  6 12:01 Notizen.md\nRichtlinie.docx\t12.03.2024\n???\n");
    expect(parsed.files.map((file) => file.name)).toEqual(["Backup-Bericht.pdf", "Notizen.md", "Richtlinie.docx"]);
    expect(parsed.files[1]?.yearMissing).toBe(true);
    expect(parsed.files[2]?.date?.iso).toBe("2024-03-12");
    expect(parsed.unread).toEqual([4]);
  });
  it("reads a Windows dir line: the date is not a file name", () => {
    const parsed = parseList(" Verzeichnis von C:\\Audit\n\n25.10.2026  09:14    48.211 Leitlinie_IT-Sicherheit_v4_ENTWURF.docx\n25.10.2026  09:10    <DIR>          Alt\n               1 Datei(en),         48.211 Bytes");
    expect(parsed.files.map((file) => file.name)).toEqual(["Leitlinie_IT-Sicherheit_v4_ENTWURF.docx"]);
    expect(parsed.files[0]?.date?.iso).toBe("2026-10-25");
    expect(parsed.unread).toEqual([]);
  });
  it("keeps a dd/mm/yyyy date inside a name and flags it ambiguous", () => {
    const parsed = parseList("Datenschutz_Schulung_05/06/2026.pdf\nC:\\Audit\\Backup\\Restore-Test.pdf\nAudit/Backup/Restore.pdf");
    expect(parsed.files.map((file) => file.name)).toEqual(["Datenschutz_Schulung_05/06/2026.pdf", "Restore-Test.pdf", "Restore.pdf"]);
    expect(parsed.files[0]?.dateAmbiguous).toBe(true);
  });
  it("never reads a garbled date as a year", () => {
    const parsed = parseList("Unterauftragsverarbeiter.xlsx  2026/13/45");
    expect(parsed.files[0]?.date).toBeNull();
    expect(parsed.files[0]?.dateInvalid).toBe(true);
    expect(firstDate("2026/13/45")).toBeNull();
    expect(parseDateTokens("2026/13/45")[0]).toMatchObject({ invalid: true, iso: null });
    expect(firstDate("Bericht 2025")).toMatchObject({ iso: "2025-01-01", latest: "2025-12-31" });
    expect(firstDate("2026-Q2")).toMatchObject({ iso: "2026-04-01", latest: "2026-06-30" });
  });
});

describe("quote and Claude's answer", () => {
  const files = [{ name: "backup-report_2026-10.txt", text: "Restore test: not done in 2026." }];
  it("finds verbatim, similar and missing quotes", () => {
    expect(verifyQuote("Restore test: not done in 2026.", files).kind).toBe("found");
    expect(verifyQuote("Restore test: not done in 2026", files).kind).toBe("found");
    expect(verifyQuote("The restore test: not done in 2026.", files).kind).toBe("similar");
    expect(verifyQuote("Backups are restore-tested monthly.", files).kind).toBe("missing");
  });
  it("flags a policy quoted for a record, a missing file and compliance words", () => {
    const answer = [
      "| R7 | infosec-policy_v3_FINAL.md | \"Backups are restore-tested twice a year.\" | COVERED |",
      "| R4 | access-policy.md | \"Administrator access is reviewed every quarter\" | compliant, COVERED |",
    ].join("\n");
    const checked = checkAnswer(parseClaudeAnswer(answer), vardarContext());
    const r7 = checked.find((row) => row.row.item === "R7")!;
    expect(r7.flags.map((flag) => flag.kind)).toEqual(expect.arrayContaining(["policy-for-record", "source-fails", "status-differs"]));
    const r4 = checked.find((row) => row.row.item === "R4")!;
    expect(r4.flags.map((flag) => flag.kind)).toEqual(expect.arrayContaining(["missing-file", "compliance-word", "status-differs"]));
  });
  it("catches 26 and 21.7 on R5 and reads a German plain line", () => {
    const checked = checkAnswer(parseClaudeAnswer("R5: training-records_2026.csv, 26 Personen geschult, 21,7 %, SCHWACH"), vardarContext());
    const flags = checked[0]?.flags ?? [];
    expect(flags).toEqual(expect.arrayContaining([{ kind: "number-differs", found: 26, expected: 25 }, { kind: "status-differs", expected: "gap" }]));
  });
  it("finds all three planted mistakes in the probe's sample lines, in both languages", () => {
    for (const lang of ["de", "en"] as const) {
      const checked = checkAnswer(parseClaudeAnswer(COPY[lang].probe.sampleText), vardarContext());
      const kinds = (item: string) => checked.find((row) => row.row.item === item)?.flags.map((flag) => flag.kind) ?? [];
      expect(kinds("R7"), lang).toContain("policy-for-record");
      expect(kinds("R5"), lang).toContain("number-differs");
      expect(kinds("R4"), lang).toContain("compliance-word");
    }
  });
  it("flags a section number that is in no file", () => {
    const checked = checkAnswer(parseClaudeAnswer('R8 | infosec-policy_v3_FINAL.md | ISO 27001 A.5.1 | "Approved 2024-03-12" | WEAK'), vardarContext());
    expect(checked[0]?.flags.map((flag) => flag.kind)).toContain("unknown-ref");
  });
});

describe("csv", () => {
  it("writes BOM, ; for German, guards formulas, escapes quotes", () => {
    const csv = toEvidenceCsv([{ item: "R1", file: '=HYPERLINK("x")', quote: 'a "b"; c' }], "de");
    expect(csv.startsWith("﻿item;request;")).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"a ""b""; c"');
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(toEvidenceCsv([], "en").split(",")).toHaveLength(17);
  });
  it("formats shares per locale", () => {
    expect(formatPercent(25 / 120, "de")).toBe("20,8 %");
    expect(formatPercent(25 / 120, "en")).toBe("20.8%");
  });
});

describe("motion", () => {
  const links = [
    { failsAt: null, status: "covered" as const },
    { failsAt: "approval" as const, status: "weak" as const },
    { failsAt: "quote" as const, status: "gap" as const },
  ];
  it("frame(0) is clean and frame(1) is the end state", () => {
    const start = frame(0, links);
    expect(start.links.every((link) => !link.dashed && !link.broken && link.labelOpacity === 0)).toBe(true);
    expect(start.tallyOpacity).toBe(0);
    const end = frame(1, links);
    expect(end.links.map((link) => [link.dashed, link.broken])).toEqual([
      [false, false],
      [true, false],
      [false, true],
    ]);
    expect(end.tallyOpacity).toBe(1);
    expect(end.links[2]?.breakT).toBe(1);
  });
  it("is pure and the break only grows", () => {
    let last = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      expect(frame(t, links)).toEqual(frame(t, links));
      const value = frame(t, links).links[2]?.breakT ?? 0;
      expect(value).toBeGreaterThanOrEqual(last);
      last = value;
    }
    expect(drawIn(0, 0)).toBe(0);
    expect(drawIn(1, 7)).toBe(1);
  });
});

describe("text decoding", () => {
  it("strips the BOM and falls back to windows-1252", async () => {
    const { decodeText } = await import("./text-decode");
    expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]))).toBe("A");
    expect(decodeText(new Uint8Array([0x47, 0x72, 0xfc, 0xdf, 0x65]))).toBe("Grüße");
  });
});

describe("model", () => {
  it("the naive run ends 2 · 1 · 5 and fails where the stage draws it", async () => {
    const { buildModel } = await import("./model");
    const model = buildModel();
    expect(model.tally).toEqual({ covered: 2, weak: 1, gap: 5 });
    expect(model.exercise).toBe("2026-11-09");
    expect(Object.fromEntries(model.rows.map((row) => [row.item.id, row.failsAt]))).toEqual({
      R1: null,
      R2: "quote",
      R3: "date",
      R4: "scope",
      R5: "quote",
      R6: null,
      R7: "quote",
      R8: "approval",
    });
    expect(model.unlinked).toEqual(["vendor-page_claude_2026-06-15.md", "it-notes_2026-10-06.md", "infosec-policy_v3_FINAL.md"]);
    expect(model.r7.map((result) => result.status)).toEqual(["gap", "gap", "gap"]);
    expect(model.r7.map((result) => result.failed)).toEqual([["quote", "date"], ["quote", "approval"], ["quote"]]);
  });
});

describe("the Zitat-Probe on hostile input", () => {
  it("parses a long run without an extension in bounded time", () => {
    const line = `| R1 | ${"a".repeat(1_900)} | COVERED |`;
    const started = performance.now();
    for (let i = 0; i < 25; i += 1) parseClaudeAnswer(`${line}\n`.repeat(20));
    expect(performance.now() - started).toBeLessThan(1_500);
  });

  it("cuts the answer, each line and the quotes to their caps", () => {
    const quoted = `| R2 | ${Array.from({ length: 200 }, (_, i) => `"quote number ${i} is long"`).join(" ")} | GAP |`;
    const [row] = parseClaudeAnswer(quoted);
    expect(row?.quotes.length).toBeLessThanOrEqual(MAX_QUOTES);
    expect(row?.raw.length).toBeLessThanOrEqual(MAX_LINE);
    const beyond = `${"x".repeat(MAX_ANSWER)}\n| R3 | ai-use-rule_v1.md | GAP |`;
    expect(parseClaudeAnswer(beyond)).toEqual([]);
  });
});

describe("the own folder reads a bounded head of each file", () => {
  it("states the slice and the budget", () => {
    expect(MAX_SLICE_BYTES).toBe(64 * 1024);
    expect(READ_BUDGET_BYTES).toBe(8 * 1024 * 1024);
    expect(MAX_READ * MAX_SLICE_BYTES).toBeLessThanOrEqual(READ_BUDGET_BYTES);
  });

  it("parses each file once when only the window changes", () => {
    const entry: OwnEntry = { name: "backup-report_2026.txt", size: 40, lastModified: null, listedDate: null, yearMissing: false, text: "Generated 2026-11-01.\nRestore test: not done in 2026.\n" };
    const first = assessFolder([entry], "2025-12-10");
    const second = assessFolder([entry], "2026-06-01");
    expect(first.files[0]?.type).toBe(second.files[0]?.type);
    expect(first.files[0]?.date?.iso).toBe(second.files[0]?.date?.iso);
  });
});
