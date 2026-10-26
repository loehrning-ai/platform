import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY as AUDIT } from "./audit-vorbereitung-mit-ki/copy";
import { TEST_ORDER } from "./audit-vorbereitung-mit-ki/evidence";
import { COPY as ESG } from "./esg-berichte-mit-ki/copy";

/**
 * Workshop 04 (esg-nachweise) and Workshop 05 (audit-nachweise) teach one evidence language:
 * the same four tests in the same order, the same three statuses and the same status rule
 * (the weakest part counts, a part without a file is a gap, a fact stays covered even when
 * it is bad news). The skills point at each other and open with their objective.
 */

const WORDS = {
  de: ["ZITAT", "ZEITRAUM", "UMFANG", "FREIGABE"],
  en: ["QUOTE", "PERIOD", "SCOPE", "APPROVAL"],
} as const;

const skill = (name: string) => readFileSync(resolve(process.cwd(), "content/skills", name, "SKILL.md"), "utf8");
const flat = (text: string) => text.replace(/\s+/g, " ").trim();

/** The first paragraph after the "# " heading, on one line. */
function firstParagraph(text: string): string {
  const body = text.slice(text.indexOf("\n# "));
  const afterHeading = body.slice(body.indexOf("\n", 1) + 1).trimStart();
  return flat(afterHeading.split(/\n\s*\n/)[0] ?? "");
}

describe("W04 and W05 evidence language", () => {
  it.each(["de", "en"] as const)("the %s words of both demos are the same four tests in the same order", (locale) => {
    expect(TEST_ORDER.map((test) => AUDIT[locale].test[test])).toEqual([...WORDS[locale]]);
    expect(Object.values(ESG[locale].checks)).toEqual([...WORDS[locale]]);
    expect(ESG[locale].regel.checks.map(([word]) => word)).toEqual([...WORDS[locale]]);
  });

  it.each(["esg-nachweise", "audit-nachweise"])("%s names the four tests in that order in both languages", (name) => {
    const text = flat(skill(name));
    expect(text).toContain(`Deutsch: ${WORDS.de.join(", ")} und BELEGT, SCHWACH, LÜCKE.`);
    expect(text).toContain(`Englisch: ${WORDS.en.join(", ")} und COVERED, WEAK, GAP.`);
  });

  it("each skill points at the other", () => {
    expect(skill("esg-nachweise")).toMatch(/audit-nachweise/);
    expect(skill("audit-nachweise")).toMatch(/esg-nachweise/);
  });

  it("both skills split a fact question from a threshold requirement", () => {
    for (const name of ["esg-nachweise", "audit-nachweise"]) {
      const text = flat(skill(name));
      expect(text, name).toMatch(/schwächste/);
      expect(text, name).toMatch(/weakest part/);
      expect(text, name).toMatch(/Fakt/);
      expect(text, name).toMatch(/\bfact\b/);
    }
  });

  it("each skill opens with its demo's objective", () => {
    expect(firstParagraph(skill("audit-nachweise"))).toBe(AUDIT.de.objective);
    expect(firstParagraph(skill("esg-nachweise")).startsWith(ESG.de.regel.objective)).toBe(true);
    expect(flat(skill("audit-nachweise"))).toContain(AUDIT.en.objective);
  });
});
