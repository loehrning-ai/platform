import { describe, expect, it } from "vitest";
import { allCheckSets, breaksFor, brokenBy, eachCheckDistinct, survivors } from "./breaks";
import { auditDateOf, dueDateOf, ITEMS, itemById, vardarContext, windowMonthsOf, windowStartOf } from "./case";
import { decisionFor, decisionLines, docLines, lineOf } from "./decision-lines";
import { parseClaudeAnswer } from "./claude-answer";
import { SCENE } from "./claude-runs";
import { evaluate, tally, TEST_ORDER, type TestId } from "./evidence";
import { FOLDER_FILES, kitText } from "./kit";
import { buildModel } from "./model";
import { attachedFiles, probeAnswer, probeSummary, quotedSpans } from "./probe";
import { MAX_FILE } from "./quote";

const model = buildModel();

describe("kit dates are parsed from the kit text", () => {
  it("reads the audit, the window start and the due date", () => {
    expect(auditDateOf()).toBe("2026-12-10");
    expect(windowStartOf()).toBe("2025-12-10");
    expect(dueDateOf("en")).toBe("2026-12-02");
    expect(dueDateOf("de")).toBe("2026-12-02");
    expect(windowMonthsOf(windowStartOf(), auditDateOf())).toBe(12);
    const context = vardarContext();
    expect([context.audit, context.windowStart, context.due]).toEqual([auditDateOf(), windowStartOf(), dueDateOf("en")]);
  });

  it("follows the request text when its dates change", () => {
    const text = kitText("request_tannwald.md").replace("Thursday 10 December 2026", "Friday 11 December 2026").replace("on or after 10 December 2025", "on or after 11 December 2025");
    expect(auditDateOf(text)).toBe("2026-12-11");
    expect(windowStartOf(text)).toBe("2025-12-11");
  });
});

describe("breaksFor over the 16 check sets", () => {
  it("name links fail where the engine says", () => {
    const failing = (test: TestId) => [...brokenBy(model.rows, test)].sort();
    expect(failing("quote")).toEqual(["R2", "R5", "R7"]);
    expect(failing("date")).toEqual(["R3"]);
    expect(failing("scope")).toEqual(["R4"]);
    expect(failing("approval")).toEqual(["R8"]);
  });

  it("every set's survivors equal 8 minus the rows any active check breaks", () => {
    for (const set of allCheckSets()) {
      const expected = model.rows.filter((row) => row.naive.failed.some((test) => set.has(test))).length;
      expect(breaksFor(model.rows, set).size).toBe(expected);
      expect(survivors(model.rows, set)).toBe(8 - expected);
    }
  });

  it("matches the measured counts of the build contract", () => {
    const count = (tests: readonly TestId[]) => survivors(model.rows, new Set(tests));
    expect(count([])).toBe(8);
    expect(count(["quote"])).toBe(5);
    expect(count(["date"])).toBe(7);
    expect(count(["quote", "date", "scope", "approval"])).toBe(2);
    expect(count(["date", "scope", "approval"])).toBe(5);
    expect(allCheckSets()).toHaveLength(16);
  });

  it("each check rules out different files, so that sentence may be shown", () => {
    expect(eachCheckDistinct(model.rows)).toBe(true);
    const rows = model.rows.map((row) => (row.item.id === "R3" ? { ...row, naive: { ...row.naive, failed: ["date", "quote"] as readonly TestId[] } } : row));
    expect(eachCheckDistinct(rows)).toBe(false);
  });

  it("all four on leaves exactly the kit's covered items", () => {
    expect(survivors(model.rows, new Set(TEST_ORDER))).toBe(model.tally.covered);
  });
});

describe("decision lines are verbatim kit text", () => {
  it("every span of every item and candidate stands in its file, on its line", () => {
    for (const item of ITEMS) {
      for (const file of FOLDER_FILES) {
        const evaluation = evaluate(item, file, model.context);
        for (const entry of decisionLines(evaluation)) {
          const lines = docLines(evaluation.doc.text);
          expect(lines[entry.line - 1], `${item.id} ${file} ${entry.test}`).toContain(entry.span);
          expect(evaluation.doc.text).toContain(entry.span);
        }
      }
    }
  });

  it("the card backs of scene 2 show the lines the contract names", () => {
    const row = (id: string) => model.rows.find((entry) => entry.item.id === id)!;
    expect(decisionFor(row("R3").naive, "date")?.span).toBe("Valid from 2026-10-01.");
    expect(decisionFor(row("R4").naive, "scope")?.span).toBe("Review of administrator accounts in Servicepult");
    expect(decisionFor(row("R8").naive, "approval")?.span).toBe("Approved by: (open)");
    expect(row("R2").naive.tests.quote.missingParts).toEqual(["last_review", "transfer_basis"]);
  });

  it("the restore test lines of scene 3", () => {
    const [policy, notes, report] = model.r7;
    expect(decisionFor(policy!, "quote")?.span).toBe("Backups are restore-tested twice a year.");
    expect(decisionFor(policy!, "date")?.span).toBe("Approved 2024-03-12 by Dragan Ilievski, Managing Director. Next review: March 2025.");
    expect(decisionFor(notes!, "quote")?.span).toBe("Backups are tested, the jobs run every night.");
    expect(decisionFor(notes!, "approval")?.span).toBe("Not reviewed by anyone.");
    expect(decisionFor(report!, "quote")).toEqual({ test: "quote", line: 5, span: "Restore test: not done in 2026.", pass: false });
    expect(decisionFor(report!, "scope")?.span).toBe("Jobs: Servicepult export, file share.");
    expect(decisionFor(report!, "date")?.span).toBe("Generated 2026-11-01 06:00 by the backup system.");
    expect(decisionFor(report!, "approval")?.span).toBe("Owner: Goran Petrovski, IT lead.");
    expect(report!.failed).toEqual(["quote"]);
    expect(policy!.failed).toEqual(expect.arrayContaining(["quote", "date"]));
    expect(notes!.failed).toEqual(expect.arrayContaining(["quote", "approval"]));
  });

  it("R1's storage line cites the vendor page", () => {
    const r1 = model.rows.find((entry) => entry.item.id === "R1")!;
    expect(decisionFor(r1.naive, "quote")?.span).toBe("United States (see vendor-page_claude_2026-06-15.md)");
    expect(lineOf(kitText("folder/vendor-page_claude_2026-06-15.md"), "Page date: 15 June 2026.")).toBe(4);
  });
});

describe("the quote probe", () => {
  it("MAX_FILE covers every attached file", () => {
    for (const file of attachedFiles()) expect(file.text.length, file.name).toBeLessThanOrEqual(MAX_FILE);
    expect(attachedFiles()).toHaveLength(12);
  });

  it("finds a verbatim quote with its line, a near quote as similar, an invented one as missing", () => {
    const text = 'The report says "Restore test: not done in 2026." The policy says "Backups are restore-tested twice a year, always." And "We test our backups every single month."';
    const marks = probeAnswer(text);
    expect(marks.map((mark) => mark.check.kind)).toEqual(["found", "similar", "missing"]);
    expect(marks[0]).toMatchObject({ line: 5, check: { kind: "found", file: "backup-report_2026-10.txt" } });
    expect(text.slice(marks[0]!.start, marks[0]!.end)).toBe("Restore test: not done in 2026.");
    expect(probeSummary(marks)).toEqual({ found: 1, similar: 1, missing: 1 });
  });

  it("reads German quote marks and skips single words", () => {
    expect(quotedSpans("Laut Bericht: „Restore test: not done in 2026.“ und „leer“.").map((span) => span.quote)).toEqual(["Restore test: not done in 2026."]);
  });

  it("finds clause 7 in the request", () => {
    const [mark] = probeAnswer('Clause 7: "Customer Data is stored in the EU or EEA unless the Customer agrees in writing."');
    expect(mark?.check).toEqual({ kind: "found", file: "request_tannwald.md" });
  });
});

describe("items", () => {
  it("R7's three candidates are the policy, the note and the report", () => {
    expect(itemById("R7").candidates.map((candidate) => candidate.file).sort()).toEqual(["backup-report_2026-10.txt", "infosec-policy_v3_FINAL.md", "it-notes_2026-10-06.md"]);
  });
});

describe("the gap request fills slot by slot", () => {
  it("recovers every placeholder's value from the filled R7 request, in both languages", async () => {
    const { mailSegments } = await import("./mail-slots");
    const { renderGapRequest } = await import("./render");
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const row = model.rows.find((entry) => entry.item.id === "R7")!;
    for (const [locale, file] of [["de", "luecken-anfrage.md"], ["en", "en/luecken-anfrage.md"]] as const) {
      const template = readFileSync(path.join(process.cwd(), "content/vorlagen", file), "utf8");
      const filled = renderGapRequest(row.best, model.context, template, locale);
      const segments = mailSegments(template, filled);
      expect(segments, locale).not.toBeNull();
      expect(segments!.map((segment) => segment.text).join("")).toBe(filled);
      const values = segments!.filter((segment) => segment.slot !== null);
      expect(values.length).toBe([...template.matchAll(/\[[^\]\n]+\]/g)].length);
      expect(values.some((segment) => segment.text === "R7")).toBe(true);
    }
    expect(mailSegments("Hi [a], bye", "Hello X, bye")).toBeNull();
  });
});

describe("the recorded answers the probe counts", () => {
  /** Covered, weak and gap per take, when the answer gives all eight a status (the probe's count line). */
  const counted = (id: string) => {
    const take = SCENE?.recordings.find((entry) => entry.id === id);
    if (!take) throw new Error(`no take ${id}`);
    const rows = parseClaudeAnswer(take.final_text).filter((row) => row.status !== null);
    return rows.length === 8 ? tally(rows.map((row) => ({ status: row.status as NonNullable<typeof row.status> }))) : null;
  };

  it("reads the status tables of the takes on R1 to R8", () => {
    expect(counted("de-alle-with-1")).toEqual({ covered: 2, weak: 1, gap: 5 });
    expect(counted("de-alle-with-2")).toEqual({ covered: 2, weak: 1, gap: 5 });
    expect(counted("en-alle-with-2")).toEqual({ covered: 1, weak: 1, gap: 6 });
    // Ready / Missing / Out of date and Partial are not the kit's words: no count.
    expect(counted("en-alle-with-1")).toBeNull();
    expect(counted("de-alle-without-5")).toBeNull();
    expect(counted("en-alle-without-1")).toBeNull();
    expect(counted("en-alle-without-2")).toBeNull();
  });

  it("keeps the table's status when a later line mentions the request again", () => {
    const rows = parseClaudeAnswer("| R6 Incidents | **Covered** | INC-02 |\nIf it does, R6 becomes a gap too.");
    expect(rows[0]?.status).toBe("covered");
  });

  it("lists each question in both languages with takes on both sides", () => {
    for (const locale of ["de", "en"] as const) {
      const prompts = SCENE?.prompts.filter((prompt) => prompt.locale === locale) ?? [];
      expect(prompts.map((prompt) => prompt.id)).toEqual(["r7", "alle"]);
      for (const prompt of prompts) {
        expect(prompt.withSkill.length, `${locale} ${prompt.id}`).toBeGreaterThan(0);
        expect(prompt.withoutSkill.length, `${locale} ${prompt.id}`).toBeGreaterThan(0);
      }
    }
  });
});
