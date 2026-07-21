import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import postcss from "postcss";

// ─── Scoped stylesheet regression guard (plan 012 stage 3) ───────────
//
// `ds-v8-scope.css` is a scoped port of the source's 4 CSS files
// (v8-styles.css + src/v8/overview.css + src/v8/sims.css +
// src/v8/v8-polish.css, ~1315 combined source lines), every selector
// prefixed under a `.ds-v8-scope` root class so its broad, unprefixed
// selectors (`.app`, `.sb`, `.btn`, `.panel`, ...) cannot bleed onto
// unrelated Tailwind/shadcn pages elsewhere in the monorepo. This test
// parses the real committed file with the same CSS engine the app build
// uses (not a one-time manual grep) so a future hand-edit that
// reintroduces an unscoped selector fails CI, not just this port's
// initial commit. Mirrors data-engineering-fundamentals's
// de-course-css.test.ts (plan 011 stage 3) precedent.

const CSS_PATH = join(__dirname, "ds-v8-scope.css");
const css = readFileSync(CSS_PATH, "utf8");
const root = postcss.parse(css);

// Splits a CSS selector list on top-level commas only — respects nesting
// inside [ ], ( ), and quoted strings, so an attribute selector whose value
// itself contains a comma (e.g. [style*="rgba(91,62,232,0.08)"]) is never
// split apart into bogus fragments.
function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (const ch of selector) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "[" || ch === "(") {
      depth += 1;
      current += ch;
      continue;
    }
    if (ch === "]" || ch === ")") {
      depth -= 1;
      current += ch;
      continue;
    }
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

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

describe("ds-v8-scope.css (plan 012 stage 3)", () => {
  it("exists and is a substantial, real port (not a stub)", () => {
    expect(statSync(CSS_PATH).size).toBeGreaterThan(40_000);
  });

  it("parses as valid CSS", () => {
    expect(() => postcss.parse(css)).not.toThrow();
  });

  it("every non-keyframes rule selector is scoped under .ds-v8-scope (no bare top-level selector can bleed onto other pages)", () => {
    const selectors: string[] = [];
    collectRuleSelectors(root, selectors);
    expect(selectors.length).toBeGreaterThan(300);

    const unscoped = selectors.filter((selector) =>
      splitSelectorList(selector)
        .map((s) => s.trim())
        .some(
          (part) =>
            part !== ".ds-v8-scope" &&
            !part.startsWith(".ds-v8-scope ") &&
            !part.startsWith(".ds-v8-scope[") &&
            !part.startsWith(".ds-v8-scope.") &&
            !part.startsWith(".ds-v8-scope:") &&
            !part.startsWith(".ds-v8-scope>") &&
            !part.startsWith(".ds-v8-scope+") &&
            !part.startsWith(".ds-v8-scope~"),
        ),
    );
    expect(unscoped).toEqual([]);
  });

  it("has no leftover live :root/html/body rule (only doc-comment mentions the words)", () => {
    const bareRootRules: string[] = [];
    root.walkRules((rule) => {
      if (
        splitSelectorList(rule.selector).some((s) =>
          [":root", "html", "body"].includes(s.trim()),
        )
      ) {
        bareRootRules.push(rule.selector);
      }
    });
    expect(bareRootRules).toEqual([]);
  });

  it("defines the paper/ink design tokens and font tokens on .ds-v8-scope (the scope root)", () => {
    expect(css).toContain(".ds-v8-scope {");
    expect(css).toContain("--bg:");
    expect(css).toContain("--ink-1:");
    expect(css).toContain("--font-sans:");
    expect(css).toContain("--font-serif:");
    expect(css).toContain("--font-mono:");
  });

  it("preserves INK_MAP-adjacent accent-ink tokens for AA-readable text on light paper", () => {
    expect(css).toContain("--violet-ink:");
    expect(css).toContain("--magenta-ink:");
    expect(css).toContain("--good-ink:");
  });

  it("carries at least one real @media breakpoint and one @keyframes animation, both preserved from source", () => {
    let mediaCount = 0;
    let keyframesCount = 0;
    root.walkAtRules((atRule) => {
      if (atRule.name === "media") mediaCount += 1;
      if (atRule.name === "keyframes") keyframesCount += 1;
    });
    expect(mediaCount).toBeGreaterThan(5);
    expect(keyframesCount).toBeGreaterThan(3);
  });

  it("scopes the ambient body::before/::after paper texture onto the scope root's own pseudo-elements", () => {
    expect(css).toContain(".ds-v8-scope::before");
    expect(css).toContain(".ds-v8-scope::after");
    expect(css).not.toContain("body::before");
    expect(css).not.toContain("body::after");
  });

  it("scopes the bare universal selector and range-input selectors instead of leaving them global", () => {
    expect(css).toContain(".ds-v8-scope *");
    expect(css).toContain('.ds-v8-scope input[type="range"]');
    expect(css).not.toMatch(/^\* \{/m);
    expect(css).not.toMatch(/^input\[type="range"\]/m);
  });
});
