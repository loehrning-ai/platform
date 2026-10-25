import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { validateBeats } from "@/lib/demo-beats";
import { keyIndex, keyItems } from "./answer-key";
import { BEATS } from "./beats";
import { ITEMS, sampleReply, vardarContext } from "./case";
import { EVIDENCE_COLUMNS, templateHeader } from "./csv";
import { indexRows, itemStatus, kitDoc, tally } from "./evidence";
import { FOLDER_FILES, KIT_TEXT, kitText } from "./kit";
import { VARDAR_VALUES, renderGapRequest, renderInstructions } from "./render";

const KIT_DIR = join(__dirname, "../../../../../../scripts/workshop05/kit");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("W05 kit lockstep", () => {
  it("kit.ts holds every kit file byte for byte", () => {
    const files = walk(KIT_DIR).map((path) => relative(KIT_DIR, path)).sort();
    expect(Object.keys(KIT_TEXT).sort()).toEqual(files.filter((file) => file !== "START-HERE.md"));
    for (const file of Object.keys(KIT_TEXT)) expect(KIT_TEXT[file], file).toBe(readFileSync(join(KIT_DIR, file), "utf8"));
  });

  it("has eleven folder files", () => {
    expect(FOLDER_FILES).toHaveLength(11);
  });

  it("every candidate quote is a substring of its file", () => {
    for (const item of ITEMS) {
      for (const candidate of item.candidates) {
        const text = kitText(`folder/${candidate.file}`);
        const match = candidate.quote.exec(text);
        expect(match, `${item.id} ${candidate.file}`).not.toBeNull();
        expect(text.includes((match as RegExpExecArray)[0])).toBe(true);
      }
    }
  });

  it("the CSV export header equals the kit template", () => {
    expect(EVIDENCE_COLUMNS.join(",")).toBe(templateHeader());
  });

  it("renders project-instructions.md byte for byte from the Vardar values", () => {
    expect(renderInstructions(VARDAR_VALUES)).toBe(kitText("project-instructions.md"));
  });

  it("renders the R7 email exactly as ANSWERS.md shows it", () => {
    const context = vardarContext();
    const r7 = itemStatus(ITEMS.find((item) => item.id === "R7")!, context);
    const mail = renderGapRequest(r7, context, kitText("templates/gap-request.md"), "en").trimEnd();
    const answers = kitText("ANSWERS.md");
    const block = /Example email \(R7\)[\s\S]*?```\n([\s\S]*?)```/.exec(answers)?.[1]?.trimEnd();
    expect(mail).toBe(block);
  });

  it("the sample reply is the honest reply of ANSWERS.md", () => {
    expect(sampleReply()).toMatch(/25 of 120 staff are trained/);
    expect(sampleReply()).toMatch(/not run a restore test in 2026/);
  });

  it("beats meet the v3 contract", () => {
    expect(validateBeats(BEATS)).toEqual([]);
  });
});

describe("W05 engine against the answer key", () => {
  const context = vardarContext();

  it("reads the request's own numbers", () => {
    expect(context.trainingShare).toBe(0.95);
    expect(context.noticeHours).toBe(48);
    expect(context.systems).toEqual(["Servicepult", "Sprechband", "Nordlager", "Claude Team"]);
  });

  it("every item status equals ANSWERS.md Mission 2, tally 2 · 4 · 2", () => {
    const key = keyItems();
    expect(key).toHaveLength(8);
    const results = ITEMS.map((item) => itemStatus(item, context));
    for (const row of key) expect(results.find((result) => result.item.id === row.id)?.status, row.id).toBe(row.status);
    expect(tally(results)).toEqual({ covered: 2, weak: 4, gap: 2 });
  });

  it("Mission 1: 8 of 11 files pass, exactly the files of the key", () => {
    const rows = indexRows(FOLDER_FILES.map(kitDoc), context.windowStart);
    const key = keyIndex();
    expect(key).toHaveLength(11);
    for (const row of key) {
      const found = rows.find((entry) => entry.doc.file === row.file);
      expect(found?.date.pass, `${row.file} DATE`).toBe(row.date);
      expect(found?.approval.pass, `${row.file} APPROVAL`).toBe(row.approval);
      expect(found?.doc.type, `${row.file} type`).toBe(row.type);
    }
    expect(rows.filter((row) => row.passes)).toHaveLength(8);
  });

  it("computes 295 days, 1 of 4 systems, 25 of 120, 30.5 hours, 638 days", () => {
    const at = (id: string) => itemStatus(ITEMS.find((item) => item.id === id)!, context);
    expect(at("R3").tests.scope.uncoveredDays).toBe(295);
    expect(at("R4").tests.scope.coveredSystems).toHaveLength(1);
    const r5 = at("R5").tests.quote.figures;
    expect([r5.rows, r5.unique, r5.staff, r5.needed, r5.missing, r5.duplicateId]).toEqual([26, 25, 120, 114, 89, "E014"]);
    expect(Math.round((r5.share ?? 0) * 1000) / 10).toBe(20.8);
    expect(at("R6").tests.quote.figures.hours).toBe(30.5);
    expect(at("R8").tests.date.daysShort).toBe(638);
  });

  it("the naive name links fail where the key says: R8 v4 on APPROVAL", () => {
    const r8 = ITEMS.find((item) => item.id === "R8")!;
    expect(r8.naive).toBe("infosec-policy_v4_DRAFT.md");
  });
});
