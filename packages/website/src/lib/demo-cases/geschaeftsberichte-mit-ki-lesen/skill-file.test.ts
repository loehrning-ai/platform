import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listZipEntries, readZipText } from "@/lib/zip/read";
import { kitText } from "@/test/northwind-kit";
import { COPY } from "./copy";
import { EMPTY_CARD } from "./steckbrief";
import { buildSkillZip, readSkillHeader, REFERENCES_PATH, renderProjectInstructions, renderReferences, SKILL_NAME } from "./skill-file";

const SKILLS = join(process.cwd(), "content/skills");
const skillText = readFileSync(join(SKILLS, SKILL_NAME, "SKILL.md"), "utf8");
const card = { ...EMPTY_CARD, name: "Quote", numerator: "Stück", denominator: "Lieferungen", period: "week" as const };

describe("the kennzahlen-steckbrief skill", () => {
  it("has a one-line frontmatter, its own name and a description of at most 200 characters", () => {
    const header = readSkillHeader(skillText);
    expect(header?.name).toBe(SKILL_NAME);
    expect(header?.description.length).toBeLessThanOrEqual(200);
  });

  it("every registered skill keeps ': ' out of its frontmatter values", () => {
    for (const name of readdirSync(SKILLS)) {
      const file = join(SKILLS, name, "SKILL.md");
      if (!existsSync(file)) continue;
      const header = readSkillHeader(readFileSync(file, "utf8"));
      expect(header, name).not.toBeNull();
      expect(header?.description.length, name).toBeLessThanOrEqual(200);
    }
  });

  it("names the W3 skill it hands over to and reads its references file", () => {
    expect(skillText).toContain("kennzahl-fragekarte");
    expect(skillText).toContain("references/steckbriefe.md");
  });

  it("ships byte for byte inside both kits", () => {
    expect(kitText("en", `claude/${SKILL_NAME}/SKILL.md`)).toBe(skillText);
    expect(kitText("de", `claude/${SKILL_NAME}/SKILL.md`)).toBe(skillText);
  });
});

describe("the personal zip", () => {
  it("keeps SKILL.md byte-identical and adds the cards under references", () => {
    const references = renderReferences([card], COPY.de.own.card, COPY.de.own.referencesTitle);
    const zip = buildSkillZip(skillText, references);
    expect(listZipEntries(zip).map((entry) => entry.path)).toEqual([`${SKILL_NAME}/SKILL.md`, REFERENCES_PATH]);
    expect(readZipText(zip, `${SKILL_NAME}/SKILL.md`)).toBe(skillText);
    expect(readZipText(zip, REFERENCES_PATH)).toBe(references);
    expect(references.startsWith(`# ${COPY.de.own.referencesTitle}\n`)).toBe(true);
  });

  it("is the plain skill without cards, and deterministic", () => {
    const zip = buildSkillZip(skillText, null);
    expect(listZipEntries(zip).map((entry) => entry.path)).toEqual([`${SKILL_NAME}/SKILL.md`]);
    expect(buildSkillZip(skillText, "x")).toEqual(buildSkillZip(skillText, "x"));
  });

  it("appends the cards to the project instructions and leaves them alone without", () => {
    const base = kitText("de", "project-instructions.md");
    expect(renderProjectInstructions(base, [], COPY.de.own.card)).toBe(base);
    const withCards = renderProjectInstructions(base, [card, card], COPY.de.own.card);
    expect(withCards.startsWith(base)).toBe(true);
    expect(withCards.match(/^### Quote$/gm)).toHaveLength(2);
  });
});
