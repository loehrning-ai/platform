import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { ESG_REPORTING_KIT } from "@/lib/workshops-esg-reporting-kit";
import { ESG_COPY } from "./copy";
import { FACTS, STROM_MONDAY } from "./facts";
import { KIT_FILES } from "./kit-files";
import { BILLS_2025, INVOICE_EL_25_09, ROWS, STAYS_BECAUSE } from "./rows";
import { CHECKLIST, TAKEAWAYS } from "./takeaways";
import type { KitFile, L } from "./types";

const ZIP = resolve(process.cwd(), "public/workshops/esg-berichte-mit-ki/crvena-zemja-esg-kit.zip");
const ROOT = "crvena-zemja-esg-kit/";

/** A small reader for the kit zip: central directory, then stored or deflated entries. */
function readZip(path: string): Map<string, string> {
  const zip = readFileSync(path);
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i -= 1) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("No end of central directory");
  const count = zip.readUInt16LE(eocd + 10);
  let offset = zip.readUInt32LE(eocd + 16);
  const files = new Map<string, string>();
  for (let index = 0; index < count; index += 1) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) throw new Error("Bad central header");
    const method = zip.readUInt16LE(offset + 10);
    const size = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const local = zip.readUInt32LE(offset + 42);
    const name = zip.toString("utf8", offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/") || !/\.(md|txt|csv)$/.test(name)) continue;
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const raw = zip.subarray(start, start + size);
    const data = method === 8 ? inflateRawSync(raw) : raw;
    files.set(name, data.toString("utf8"));
  }
  return files;
}

const kit = readZip(ZIP);
const fileText = (name: string): string => {
  const text = kit.get(ROOT + name);
  if (text === undefined) throw new Error(`${name} is not in the kit zip`);
  return text;
};
const lines = (name: string): string[] => fileText(name).split("\n");
const kitPath = (file: KitFile): string => (file.startsWith("inbox/") ? file : `project-files/${file}`);

describe("kit fidelity", () => {
  it("quotes every kit file verbatim, line by line", () => {
    for (const [file, quoted] of Object.entries(KIT_FILES) as [KitFile, readonly string[]][]) {
      const real = lines(kitPath(file));
      expect(real.at(-1), file).toBe("");
      expect(quoted, file).toEqual(real.slice(0, -1));
    }
  });

  it("numbers every excerpt line as in a text editor", () => {
    for (const fact of [...FACTS, STROM_MONDAY]) {
      for (const item of fact.excerpt) {
        if (item === "gap" || item.n === null) continue;
        expect(item.text, `${fact.id} ${item.file} ${item.n}`).toBe(lines(kitPath(item.file))[item.n - 1]);
      }
    }
  });

  it("shows the requirement each card's feedback quotes", () => {
    const has = (id: string, file: string, n: number): boolean =>
      [...FACTS, STROM_MONDAY].some(
        (fact) => fact.id === id && fact.excerpt.some((item) => item !== "gap" && item.file === file && item.n === n),
      );
    const q = "inbox/1-nordvik-questionnaire.md";
    expect(has("zert", q, 7)).toBe(true);
    expect(has("zert", q, 11)).toBe(true);
    expect(has("zert", "organic_certificate_vineyard.txt", 9)).toBe(true);
    expect(has("strom", q, 12)).toBe(true);
    expect(has("glas", q, 21)).toBe(true);
    expect(lines(q)[6]).toBe("Reporting year 2025. Please return by Friday 23 October 2026.");
    expect(lines(q)[10]).toBe("- Certificates must be valid on the submission date.");
    expect(lines(q)[11]).toBe("- Energy data must cover the full reporting year (95% coverage).");
  });

  it("shows the CSV header line above every CSV excerpt", () => {
    for (const fact of FACTS) {
      const byFile = new Map<string, number[]>();
      for (const item of fact.excerpt) {
        if (item === "gap" || item.n === null || !item.file.endsWith(".csv")) continue;
        byFile.set(item.file, [...(byFile.get(item.file) ?? []), item.n]);
      }
      for (const [file, numbers] of byFile) expect(numbers[0], `${fact.id} ${file}`).toBe(2);
    }
  });

  it("decisive lines sit in the card's excerpt", () => {
    for (const fact of [...FACTS, STROM_MONDAY]) {
      for (const mark of fact.decisive) {
        const found = fact.excerpt.some((item) => item !== "gap" && item.file === mark.file && item.n === mark.n);
        expect(found, `${fact.id} ${mark.file} ${mark.n}`).toBe(true);
      }
    }
  });

  it("takes the bills from the CSV and the invoice from ANSWERS Step 5", () => {
    const csv = lines("project-files/energy_bills_2025.csv");
    for (const bill of BILLS_2025) {
      if (bill.kWh === null) {
        expect(csv.some((line) => line.startsWith(bill.month))).toBe(false);
        continue;
      }
      const row = csv[(bill.line ?? 0) - 1]?.split(",");
      expect(row?.[0]).toBe(bill.month);
      expect(Number(row?.[2])).toBe(bill.kWh);
    }
    const answers = fileText("ANSWERS.md");
    expect(answers).toContain("1,325,550 − 1,284,350 = 41,200 kWh");
    expect(answers).toContain("41,200 kWh at 9.50 MKD/kWh, which\ncomes to 391,400 MKD");
    expect(INVOICE_EL_25_09.readings.current - INVOICE_EL_25_09.readings.previous).toBe(INVOICE_EL_25_09.kWh);
  });

  it("uses the kit registry's DE rules and START-HERE's EN template and prompt verbatim", () => {
    const [de1, , de3] = TAKEAWAYS.de;
    for (const rule of ESG_REPORTING_KIT.de.rules) expect(de1.text).toContain(rule);
    const start = fileText("START-HERE.md");
    const [en1, en2] = TAKEAWAYS.en;
    expect(start).toContain(`\`\`\`\n${en1.text}\n\`\`\``);
    expect(start).toContain(`\`\`\`\n${en2.text}\n\`\`\``);
    expect(en1.fromKit && en2.fromKit).toBe(true);
    expect(de3.text.split("\n")).toHaveLength(8);
    expect(de3.text.startsWith(CHECKLIST.de.title)).toBe(true);
  });
});

/** Every L value in a nested structure. */
function collectL(value: unknown, out: L[] = []): L[] {
  if (Array.isArray(value)) {
    for (const item of value) collectL(item, out);
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.de === "string" && typeof record.en === "string" && Object.keys(record).length === 2) {
      out.push(record as unknown as L);
    } else {
      for (const item of Object.values(record)) collectL(item, out);
    }
  }
  return out;
}

/** Every string the copy objects produce, with the formatters called on sample input. */
function copyStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (typeof value === "function") {
    const result: unknown = (value as (...args: unknown[]) => unknown)(3, ["Q1"], ["F3"]);
    copyStrings(result, out);
  } else if (Array.isArray(value)) for (const item of value) copyStrings(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) copyStrings(item, out);
  return out;
}

describe("copy rules", () => {
  const localized = collectL([FACTS, STROM_MONDAY, ROWS, STAYS_BECAUSE]);

  it("has a DE and an EN text for every localized string", () => {
    expect(localized.length).toBeGreaterThan(150);
    for (const pair of localized) {
      expect(pair.de.trim().length, pair.en).toBeGreaterThan(0);
      expect(pair.en.trim().length, pair.de).toBeGreaterThan(0);
    }
    expect(Object.keys(ESG_COPY.de)).toEqual(Object.keys(ESG_COPY.en));
  });

  it("uses no em or en dash anywhere in the copy", () => {
    const strings = [
      ...localized.flatMap((pair) => [pair.de, pair.en]),
      ...copyStrings(ESG_COPY),
      ...TAKEAWAYS.de.map((card) => card.text),
      ...TAKEAWAYS.en.map((card) => card.text),
    ];
    for (const value of strings) expect(value, value).not.toMatch(/[–—]/);
  });

  it("keeps the arrow out of the copy (it marks before/after cells only)", () => {
    for (const value of copyStrings(ESG_COPY)) expect(value).not.toContain("→");
  });

  it("uses no randomness in the demo's source", () => {
    const dirs = [
      resolve(process.cwd(), "src/lib/demo-cases/esg-berichte-mit-ki"),
      resolve(process.cwd(), "src/components/demos/esg-berichte-mit-ki"),
    ];
    for (const dir of dirs) {
      for (const name of readdirSync(dir)) {
        if (/\.test\.tsx?$/.test(name)) continue;
        const source = readFileSync(join(dir, name), "utf8");
        expect(source, name).not.toContain("Math.random");
      }
    }
  });
});
