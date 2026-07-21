import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import postcss from "postcss";

// ─── Scoped stylesheet regression guard (plan 011 stage 3) ──────────
//
// `de-course.css` is a scoped port of the source's `styles.css` (5294
// lines) + `lib/theme-tokens.css` (233 lines), every selector prefixed
// under a `.de-course` root class so its broad, unprefixed selectors
// (`.btn`, `.chip`, `.panel`, `.section`, ...) cannot bleed onto unrelated
// Tailwind/shadcn pages elsewhere in the monorepo. This test parses the
// real committed file with the same CSS engine the app build uses (not a
// one-time manual grep) so a future hand-edit that reintroduces an
// unscoped selector fails CI, not just this port's initial commit.

const CSS_PATH = join(__dirname, "de-course.css");
const css = readFileSync(CSS_PATH, "utf8");
const root = postcss.parse(css);

function collectRuleSelectors(node: import("postcss").Container, out: string[]): void {
  node.each((child) => {
    if (child.type === "rule") {
      out.push(child.selector);
    } else if (child.type === "atrule") {
      const name = child.name.toLowerCase();
      if (name === "keyframes" || name === "font-face") return;
      collectRuleSelectors(child, out);
    }
  });
}

describe("de-course.css (plan 011 stage 3)", () => {
  it("exists and is a substantial, real port (not a stub)", () => {
    expect(statSync(CSS_PATH).size).toBeGreaterThan(200_000);
  });

  it("parses as valid CSS", () => {
    expect(() => postcss.parse(css)).not.toThrow();
  });

  it("every non-keyframes rule selector is scoped under .de-course (no bare top-level selector can bleed onto other pages)", () => {
    const selectors: string[] = [];
    collectRuleSelectors(root, selectors);
    expect(selectors.length).toBeGreaterThan(900);

    const unscoped = selectors.filter((selector) =>
      selector
        .split(",")
        .map((s) => s.trim())
        .some((part) => part !== ".de-course" && !part.startsWith(".de-course ") && !part.startsWith(".de-course[") && !part.startsWith(".de-course.") && !part.startsWith(".de-course:") && !part.startsWith(".de-course>") && !part.startsWith(".de-course+") && !part.startsWith(".de-course~")),
    );
    expect(unscoped).toEqual([]);
  });

  it("has no leftover live :root rule (only theme-tokens.css's own doc-comment mentions the word)", () => {
    const rootRules: string[] = [];
    root.walkRules((rule) => {
      if (rule.selector.split(",").some((s) => s.trim() === ":root" || s.trim().startsWith(":root["))) {
        rootRules.push(rule.selector);
      }
    });
    expect(rootRules).toEqual([]);
  });

  it("defines --theme-blue and --accent on .de-course (the two token layers both land on the scope root)", () => {
    expect(css).toContain(".de-course {");
    expect(css).toContain("--theme-blue:");
    expect(css).toContain("--accent:");
  });

  it("carries at least one real @media breakpoint and one @keyframes animation, both preserved from source", () => {
    let mediaCount = 0;
    let keyframesCount = 0;
    root.walkAtRules((atRule) => {
      if (atRule.name === "media") mediaCount += 1;
      if (atRule.name === "keyframes") keyframesCount += 1;
    });
    expect(mediaCount).toBeGreaterThan(30);
    expect(keyframesCount).toBeGreaterThan(20);
  });
});
