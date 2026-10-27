/**
 * Kit and demo in lockstep: the FOLDLINE editions in the kit's claude/ folder
 * are what "Deine Karte" makes from the FOLDLINE preset, byte for byte, and
 * claude/README.md embeds the shared install steps for the one skill.
 * Regenerate after a copy change: UPDATE_KIT=1 bunx vitest run kit-lockstep
 * then node scripts/course03/refresh-published.mjs.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { claudeUiMarkdown } from "@/lib/claude-ui";
import type { OwnCard } from "./card";
import { DE } from "./copy-de";
import { EN } from "./copy-en";
import { checklistMd, definitionsMd, projectInstructions } from "./files";
import { SKILL_NAME } from "./skill-text";

const ROOT = join(__dirname, "../../../../../..");
const KIT = join(ROOT, "scripts/course03/kit");
const DE_CARD = DE.presets[0]?.card as OwnCard;
const EN_CARD = EN.presets[0]?.card as OwnCard;

function readme(): string {
  return readFileSync(join(ROOT, "scripts/course03/kit-claude-readme.md"), "utf8")
    .replace("{{install-de}}", claudeUiMarkdown("de", SKILL_NAME).trimEnd())
    .replace("{{install-en}}", claudeUiMarkdown("en", SKILL_NAME).trimEnd());
}

const GENERATED: Readonly<Record<string, () => string>> = {
  "claude/README.md": readme,
  [`claude/${SKILL_NAME}/references/kennzahlen.md`]: () => definitionsMd(DE_CARD, DE.files),
  "claude/PROJEKT-ANWEISUNG-VORLAGE.txt": () => projectInstructions(DE_CARD, DE.files),
  "claude/PROJECT-INSTRUCTIONS-TEMPLATE.txt": () => projectInstructions(EN_CARD, EN.files),
  "claude/PRUEFLISTE-VORLAGE.md": () => checklistMd(DE_CARD, DE.files),
  "claude/TEST-LIST-TEMPLATE.md": () => checklistMd(EN_CARD, EN.files),
};

describe("kit lockstep", () => {
  for (const [name, make] of Object.entries(GENERATED)) {
    it(`scripts/course03/kit/${name} is what the demo makes`, () => {
      const path = join(KIT, name);
      const expected = make();
      if (process.env.UPDATE_KIT === "1") {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, expected);
      }
      expect(readFileSync(path, "utf8")).toBe(expected);
    });
  }

  it("embeds the install steps of the one skill in both languages", () => {
    const text = readme();
    expect(text).toContain(claudeUiMarkdown("de", SKILL_NAME).trimEnd());
    expect(text).toContain(claudeUiMarkdown("en", SKILL_NAME).trimEnd());
    expect(text).not.toContain("{{");
  });
});
