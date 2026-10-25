import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { FACTS_AS_OF, NOT_IN_FILES, W05_FACTS, formatFactDate } from "./facts";
import { SAMPLES } from "./samples";

const KIT = join(process.cwd(), "public/workshops/ki-im-unternehmen-sicher-nutzen/ai-at-work-kit.zip");

function readZipEntry(zip: Buffer, name: string): string {
  let offset = 0;
  while (offset + 30 <= zip.length && zip.readUInt32LE(offset) === 0x04034b50) {
    const method = zip.readUInt16LE(offset + 8);
    const compressed = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const entryName = zip.toString("utf8", offset + 30, offset + 30 + nameLength);
    const start = offset + 30 + nameLength + extraLength;
    const data = zip.subarray(start, start + compressed);
    if (entryName === name) return method === 0 ? data.toString("utf8") : inflateRawSync(data).toString("utf8");
    offset = start + compressed;
  }
  throw new Error(`${name} not found in the kit`);
}

const zip = readFileSync(KIT);
const kit = (file: string) => readZipEntry(zip, `ai-at-work-kit/${file}`);

describe("the facts mirror the kit's facts.md verbatim", () => {
  const facts = kit("facts.md");

  it("finds every used fact line, with its dates as one list", () => {
    for (const fact of W05_FACTS) {
      expect(facts, `F${fact.id}`).toContain(`${fact.id}. ${fact.statementEn} | ${fact.source} | ${fact.dates.join(", ")}`);
    }
  });

  it("uses the facts the verdicts cite, 4, 6, 7, 10 and 13", () => {
    expect(W05_FACTS.map((fact) => fact.id)).toEqual([4, 6, 7, 10, 13]);
  });

  it("mirrors the 'Not in the files' sentence and the check date", () => {
    expect(facts).toContain(NOT_IN_FILES.en);
    expect(facts).toContain("Checked 18 Oct 2026.");
    expect(FACTS_AS_OF.de).toContain("18. Oktober 2026");
  });
});

describe("the samples match the kit", () => {
  it("Ana's English text is the kit's scene 1 text", () => {
    expect(kit("scenes.md")).toContain(SAMPLES.en[0].text);
  });

  it("the accounts are the kit's scenes 1, 4 and 6", () => {
    const scenes = kit("scenes.md");
    expect(scenes).toContain("Scene 1\nAna, support agent. Personal account");
    expect(scenes).toContain("Scene 4\nMarko, developer. Personal account");
    expect(scenes).toContain("Scene 6\nMila, finance. Company account: Claude Enterprise");
    expect(SAMPLES.de.map((s) => s.account)).toEqual(["personal", "personal", "enterprise"]);
  });

  it("the kit key says 1 RED, 4 RED, 6 AMBER and that Enterprise does not turn red into green", () => {
    const answers = kit("ANSWERS.md");
    expect(answers).toContain("1. RED. Customer data on a personal account.");
    expect(answers).toContain("4. RED. A key is a secret. Change it.");
    expect(answers).toContain("6. AMBER. Enterprise is a company account");
    expect(answers).toContain("Enterprise does not turn red into green.");
  });
});

describe("the words", () => {
  const flat = JSON.stringify(COPY);

  it("has no em or en dash and no emoji", () => {
    expect(flat).not.toMatch(/[–—]/);
    expect(flat).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("never claims safety, compliance or certification", () => {
    expect(flat).not.toMatch(/\b(?:sicher|compliant|konform|zertifiziert|certified|secure)\b/i);
  });

  it("keeps both languages in the same shape, with real umlauts in German", () => {
    const keys = (value: unknown): string[] =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.entries(value).flatMap(([key, inner]) => [key, ...keys(inner).map((k) => `${key}.${k}`)])
        : [];
    expect(keys(COPY.en)).toEqual(keys(COPY.de));
    expect(JSON.stringify(COPY.de)).not.toMatch(/Schluessel|fuer |Moeglich|ueber /);
  });

  it("uses German du, not Sie, in the German interface", () => {
    const interfaceText = JSON.stringify({ ...COPY.de, samples: undefined });
    expect(interfaceText).not.toMatch(/\bSie\b|\bIhre\b/);
  });
});

describe("facts on the German page", () => {
  it("never shows an English source or date word in German", () => {
    for (const fact of W05_FACTS) {
      expect(fact.sourceDe, `F${fact.id}`).not.toMatch(/Derived|Regulation|privacy|help |undated|read /);
      for (const entry of fact.dates) {
        const de = formatFactDate(entry, "de");
        expect(de, `F${fact.id} ${entry}`).not.toMatch(/undated|read |\d{4}-\d{2}-\d{2}/);
      }
    }
    expect(formatFactDate("undated", "de")).toBe("ohne Datum");
    expect(formatFactDate("read 2026-10-18", "de")).toBe("gelesen 18.10.2026");
    expect(formatFactDate("2026-09-01", "de")).toBe("01.09.2026");
    expect(formatFactDate("read 2026-10-18", "en")).toBe("read 2026-10-18");
  });
});
