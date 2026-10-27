/**
 * The skill of Workshop 03, byte for byte the file content/skills/kennzahl-fragekarte/SKILL.md
 * (skill-text.test.ts). The demo needs the text in the browser to build the visitor's skill zip
 * without a request; the frontmatter is static, so no visitor text can reach it. The text is
 * data (skill-text.json), not page copy.
 */
import SKILL_TEXT from "./skill-text.json";

export const SKILL_NAME = "kennzahl-fragekarte";

export const SKILL_MD: string = SKILL_TEXT.skill;
