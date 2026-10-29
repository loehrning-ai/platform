import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { validateBeatsV4 } from "@/lib/demo-beats";
import { demos } from "@/lib/demos";
import { keyIndex, keyItems } from "./answer-key";
import { BEATS, SCENE_MINUTES } from "./beats";
import { ITEMS, sampleReply, vardarContext } from "./case";
import { EVIDENCE_COLUMNS, templateHeader } from "./csv";
import { indexRows, itemStatus, kitDoc, tally } from "./evidence";
import { FOLDER_FILES, KIT_TEXT, kitText } from "./kit";
import { VARDAR_VALUES, renderGapRequest, renderInstructions } from "./render";

const KIT_DIR = join(__dirname, "../../../../../../scripts/workshop05/kit");
const KIT_DIR_DE = join(__dirname, "../../../../../../scripts/workshop05/kit-de");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("W05 kit lockstep", () => {
  it("kit.ts holds every kit file byte for byte", () => {
    const en = walk(KIT_DIR).map((path) => relative(KIT_DIR, path)).filter((file) => file !== "START-HERE.md");
    const de = walk(KIT_DIR_DE).map((path) => relative(KIT_DIR_DE, path)).filter((file) => file !== "START-HIER.md");
    expect(Object.keys(KIT_TEXT).sort()).toEqual([...en, ...de.map((file) => `de/${file}`)].sort());
    for (const file of Object.keys(KIT_TEXT)) {
      const source = file.startsWith("de/") ? join(KIT_DIR_DE, file.slice(3)) : join(KIT_DIR, file);
      expect(KIT_TEXT[file], file).toBe(readFileSync(source, "utf8"));
    }
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
    expect(renderInstructions(VARDAR_VALUES, "de")).toBe(kitText("de/projektanweisungen.md"));
  });

  it("the German instructions keep the English rule numbers: 13 rules, the four tests at 4 to 7", () => {
    const rules = (text: string) => [...text.matchAll(/^(\d+)\. (\S+)/gm)].map((match) => [Number(match[1]), match[2]]);
    const en = rules(kitText("project-instructions.md"));
    const de = rules(kitText("de/projektanweisungen.md"));
    expect(de.map(([n]) => n)).toEqual(en.map(([n]) => n));
    expect(de.slice(3, 7).map(([, word]) => word)).toEqual(["ZITAT:", "ZEITRAUM:", "UMFANG:", "FREIGABE:"]);
    expect(en.slice(3, 7).map(([, word]) => word)).toEqual(["QUOTE:", "PERIOD:", "SCOPE:", "APPROVAL:"]);
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
    expect(sampleReply().trim().split(/\s+/).length).toBeLessThanOrEqual(150);
    expect(sampleReply()).not.toMatch(/we are reviewing|it is attached/);
    expect(sampleReply()).toContain("Our folder contains neither");
    expect(sampleReply()).toContain("These are commitments, not completed controls");
  });

  it("beats meet the v4 contract", () => {
    expect(validateBeatsV4(BEATS)).toEqual([]);
  });

  it("the scene minutes add up to the minutes the hub tile names", () => {
    const total = Object.values(SCENE_MINUTES).reduce((sum, minutes) => sum + minutes, 0);
    const demo = demos.find((entry) => entry.slug === "audit-vorbereitung-mit-ki");
    expect(total).toBe(demo?.minutes);
  });
});

describe("W05 engine against the answer key", () => {
  const context = vardarContext();

  it("reads the request's own numbers", () => {
    expect(context.trainingShare).toBe(0.95);
    expect(context.noticeHours).toBe(48);
    expect(context.systems).toEqual(["Servicepult", "Sprechband", "Nordlager", "Claude Team"]);
  });

  it.each(["en", "de"] as const)("every item status equals the %s key, step 2, tally 2 · 1 · 5", (locale) => {
    const key = keyItems(locale);
    expect(key).toHaveLength(8);
    const results = ITEMS.map((item) => itemStatus(item, context));
    for (const row of key) expect(results.find((result) => result.item.id === row.id)?.status, row.id).toBe(row.status);
    expect(tally(results)).toEqual({ covered: 2, weak: 1, gap: 5 });
  });

  it.each(["en", "de"] as const)("%s key, step 1: 8 of 11 files pass, exactly the files of the key", (locale) => {
    const rows = indexRows(FOLDER_FILES.map(kitDoc), context.windowStart);
    const key = keyIndex(locale);
    expect(key).toHaveLength(11);
    for (const row of key) {
      const found = rows.find((entry) => entry.doc.file === row.file);
      expect(found?.date.pass, `${row.file} DATE`).toBe(row.date);
      expect(found?.approval.pass, `${row.file} APPROVAL`).toBe(row.approval);
      if (locale === "en") expect(found?.doc.type, `${row.file} type`).toBe(row.type);
    }
    expect(rows.filter((row) => row.passes)).toHaveLength(8);
  });

  it("computes 295 days, 1 of 4 systems, 25 of 120, 30.5 hours, 638 days", () => {
    const at = (id: string) => itemStatus(ITEMS.find((item) => item.id === id)!, context);
    expect(at("R3").tests.scope.uncoveredDays).toBe(295);
    expect(at("R3").tests.date.uncoveredDays).toBe(295);
    expect(at("R3").tests.date.pass).toBe(false);
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
