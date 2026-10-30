import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CLAUDE_UI, claudeUiMarkdown, fillSkillName } from "./claude-ui";
import { DEMO_TAKEHOME, takeHomeArtifacts, type TakeHome } from "./demo-takehome";
import { DEMO_SLUGS, type DemoSlug } from "./demos";
import { VORLAGEN } from "./vorlagen/registry";
import { readZipText } from "./zip/read";

const entries = Object.entries(DEMO_TAKEHOME) as [DemoSlug, TakeHome][];

describe("the install text (src/lib/claude-ui.ts)", () => {
  it("has the same shape in both languages, no dashes, and the 200-character-era upload path", () => {
    const shape = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.length
        : value && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
          : typeof value;
    expect(shape(CLAUDE_UI.en)).toEqual(shape(CLAUDE_UI.de));
    expect(JSON.stringify(CLAUDE_UI)).not.toMatch(/[–—]/);
    for (const locale of ["de", "en"] as const) {
      const text = JSON.stringify(CLAUDE_UI[locale]);
      for (const label of ["Code execution and file creation", "Create skill", "Upload a skill", "Set project instructions", "Save instructions", "New Project"]) {
        expect(text, `${locale}: ${label}`).toContain(label);
      }
      expect(text).toContain("claude.ai/customize/skills");
    }
  });

  it("fills the skill name into the Claude Code paths and the Markdown block", () => {
    expect(fillSkillName(CLAUDE_UI.de.code.allProjects, "probe")).toBe("unzip probe.zip -d ~/.claude/skills/");
    const markdown = claudeUiMarkdown("en", "probe");
    expect(markdown).toContain("`unzip probe.zip -d .claude/skills/`");
    expect(markdown).toContain("SKILL.md then sits in skills/probe/");
    expect(markdown).not.toContain("{name}");
    expect(markdown).toMatch(/^### claude\.ai and the desktop app\n\n1\. /);
  });
});

describe("DEMO_TAKEHOME", () => {
  it("only names known demos", () => {
    for (const [slug] of entries) expect(DEMO_SLUGS).toContain(slug);
  });

  const cases: [string, TakeHome | null][] = entries.length > 0 ? entries : [["(none yet)", null]];
  it.each(cases)(
    "%s points at real files that say the same thing as the page",
    (slug, entry) => {
      if (!entry) return;
      const skill = path.join(process.cwd(), "content/skills", entry.skill.name, "SKILL.md");
      expect(existsSync(skill), `${slug}: skill ${entry.skill.name}`).toBe(true);
      for (const { vorlage } of entry.templates) {
        expect(VORLAGEN.find((item) => item.slug === vorlage)?.kind, `${slug}: ${vorlage}`).toBe("template");
      }
      for (const locale of ["de", "en"] as const) {
        const kit = entry.kit[locale];
        const zip = new Uint8Array(readFileSync(path.join(process.cwd(), "public", kit.href)));
        expect(readZipText(zip, kit.instructions), `${kit.href}: ${kit.instructions}`).not.toBeNull();
        const install = readZipText(zip, kit.installDoc) ?? "";
        expect(install, `${kit.href}: ${kit.installDoc} embeds claudeUiMarkdown(${locale})`).toContain(
          claudeUiMarkdown(locale, entry.skill.locales?.[locale] ?? entry.skill.name),
        );
        for (const file of kit.shown) expect(readZipText(zip, file), `${kit.href}: ${file}`).not.toBeNull();
      }
      expect(takeHomeArtifacts(slug as DemoSlug).slice(0, 2)).toEqual(["kit", "skill"]);
    },
  );
});
