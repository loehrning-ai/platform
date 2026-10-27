import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SKILL_MD, SKILL_NAME } from "./skill-text";

describe("skill-text", () => {
  it("is byte for byte content/skills/kennzahl-fragekarte/SKILL.md", () => {
    const file = readFileSync(join(__dirname, `../../../../content/skills/${SKILL_NAME}/SKILL.md`), "utf8");
    expect(SKILL_MD).toBe(file);
  });
});
