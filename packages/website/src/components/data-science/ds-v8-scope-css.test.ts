import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import postcss from "postcss";

// ─── Scoped stylesheet regression guard ───────────
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
// de-course-css.test.ts precedent.

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

function collectRuleSelectors(
  node: import("postcss").Container,
  out: string[],
): void {
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

function finalDeclarations(property: string): Map<string, string> {
  const declarations = new Map<string, string>();

  root.walkRules((rule) => {
    rule.walkDecls(property, (declaration) => {
      for (const selector of splitSelectorList(rule.selector)) {
        declarations.set(selector.trim(), declaration.value);
      }
    });
  });

  return declarations;
}

function finalDeclaration(
  selector: string,
  property: string,
): string | undefined {
  return finalDeclarations(property).get(selector);
}

const CHROME_SELECTORS = [
  ".ds-v8-scope .sb-mark",
  ".ds-v8-scope .sb-item",
  ".ds-v8-scope .sb-num",
  ".ds-v8-scope .tb-back",
  ".ds-v8-scope .btn",
  ".ds-v8-scope .panel",
  ".ds-v8-scope .callout",
  ".ds-v8-scope .takeaway",
  ".ds-v8-scope .ov-loop-wrap",
  ".ds-v8-scope .ov-course",
  ".ds-v8-scope .ov-cta-band",
  ".ds-v8-scope .sim-controls",
  ".ds-v8-scope .seg",
  ".ds-v8-scope .seg button",
  ".ds-v8-scope .loop-mini-stage",
  ".ds-v8-scope .plot-wrap",
  ".ds-v8-scope .cm-cell",
  ".ds-v8-scope .galton-stage",
  ".ds-v8-scope .roc-canvas",
  ".ds-v8-scope .ab-stage",
  ".ds-v8-scope .ab-verdict",
  ".ds-v8-scope .ab-power",
  ".ds-v8-scope .sim-stats",
  ".ds-v8-scope .ds-architecture-scroll",
] as const;

const SHARED_INTERACTION_SELECTORS = [
  ".ds-v8-scope .btn",
  ".ds-v8-scope .tb-back",
  ".ds-v8-scope .sb-item",
  ".ds-v8-scope .seg button",
  ".ds-v8-scope .ov-cta-ghost",
] as const;

const BOUNDED_GRAPHIC_TEXT_EXCEPTIONS = new Map([
  [".ds-v8-scope .plot-wrap svg text", "10px"],
]);

describe("ds-v8-scope.css ", () => {
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

  it("disables the legacy fixed texture and vignette at the end of the scoped cascade", () => {
    expect(finalDeclaration(".ds-v8-scope::before", "content")).toBe("none");
    expect(finalDeclaration(".ds-v8-scope::after", "content")).toBe("none");
    expect(finalDeclaration(".ds-v8-scope::before", "position")).toBe("static");
    expect(finalDeclaration(".ds-v8-scope::after", "position")).toBe("static");
    expect(css).not.toContain("body::before");
    expect(css).not.toContain("body::after");
  });

  it("scopes the bare universal selector and range-input selectors instead of leaving them global", () => {
    expect(css).toContain(".ds-v8-scope *");
    expect(css).toContain('.ds-v8-scope input[type="range"]');
    expect(css).not.toMatch(/^\* \{/m);
    expect(css).not.toMatch(/^input\[type="range"\]/m);
  });

  it("contains long course content and exposes intentional horizontal scrollers at 320px", () => {
    expect(css).toContain(".ds-v8-scope [data-horizontal-scroll]");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain(".ds-v8-scope .prose code");
    expect(css).toContain(".ds-v8-scope .simulation-disclosure");
    expect(css).toContain("@media (max-width: 460px)");
  });

  it("maps the reader shell to platform paper, ink, boundary, type, and copper tokens", () => {
    expect(finalDeclaration(".ds-v8-scope", "--bg")).toBe(
      "var(--color-background)",
    );
    expect(finalDeclaration(".ds-v8-scope", "--panel")).toBe(
      "var(--color-card)",
    );
    expect(finalDeclaration(".ds-v8-scope", "--ink-1")).toBe(
      "var(--color-foreground)",
    );
    expect(finalDeclaration(".ds-v8-scope", "--hair-2")).toBe(
      "var(--color-border)",
    );
    expect(css).toContain(
      '--font-sans: var(--font-loehrning-sans), "Inter", system-ui, sans-serif;',
    );
    expect(css).toContain("--font-mono: var(--font-geist-mono), monospace;");
    expect(finalDeclaration(".ds-v8-scope", "--instrument-accent")).toBe(
      "var(--color-brand-orange)",
    );
  });

  it("keeps semantic plot colors independent from the copper interface accent", () => {
    expect(finalDeclaration(".ds-v8-scope", "--good")).toBe("#1faf7e");
    expect(finalDeclaration(".ds-v8-scope", "--warn")).toBe("#e8a031");
    expect(finalDeclaration(".ds-v8-scope", "--bad")).toBe("#d83a3a");
    expect(finalDeclaration(".ds-v8-scope", "--violet")).toBe("#5b3ee8");
    expect(finalDeclaration(".ds-v8-scope", "--magenta")).toBe("#e8318f");
    expect(finalDeclaration(".ds-v8-scope", "--lime")).toBe("#6bcf3f");
    expect(finalDeclaration(".ds-v8-scope", "--cyan")).toBe("#1ca5d9");
  });

  it("removes glass blur and resolves shell/card/button chrome to an 8px maximum", () => {
    for (const selector of [".ds-v8-scope .tb", ".ds-v8-scope .sb"]) {
      expect(finalDeclaration(selector, "backdrop-filter")).toBe("none");
      expect(finalDeclaration(selector, "-webkit-backdrop-filter")).toBe(
        "none",
      );
    }

    for (const selector of CHROME_SELECTORS) {
      const radius = finalDeclaration(selector, "border-radius");
      expect(radius, selector).toMatch(/^\d+(?:\.\d+)?px$/);
      expect(Number.parseFloat(radius!), selector).toBeLessThanOrEqual(8);
    }

    for (const selector of [
      ".ds-v8-scope .sb-mark",
      ".ds-v8-scope .btn",
      ".ds-v8-scope .panel",
      ".ds-v8-scope .ov-course:hover",
    ]) {
      expect(finalDeclaration(selector, "box-shadow"), selector).toBe("none");
    }
  });

  it("gives shared buttons and chapter navigation a 44px interaction floor", () => {
    for (const selector of SHARED_INTERACTION_SELECTORS) {
      expect(finalDeclaration(selector, "min-height"), selector).toBe("44px");
    }
  });

  it("keeps every CSS interface label at 12px or larger with one bounded chart-annotation exception", () => {
    const undersized = [...finalDeclarations("font-size")]
      .filter(([, value]) => /^\d+(?:\.\d+)?px$/.test(value))
      .filter(([, value]) => Number.parseFloat(value) < 12)
      .sort(([left], [right]) => left.localeCompare(right));

    expect(undersized).toEqual(
      [...BOUNDED_GRAPHIC_TEXT_EXCEPTIONS].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    );
    expect(css).toContain(
      "Bounded graphic exception: plot axis/tick annotations, never UI controls.",
    );
  });

  it("caps section and canvas spacing at the platform's 48px ceiling", () => {
    expect(finalDeclaration(".ds-v8-scope .content", "padding")).toBe(
      "32px clamp(16px, 4vw, 32px) 48px",
    );
    expect(finalDeclaration(".ds-v8-scope .section", "margin-bottom")).toBe(
      "48px",
    );
    expect(finalDeclaration(".ds-v8-scope .chap-placeholder", "padding")).toBe(
      "48px 20px",
    );
    expect(finalDeclaration(".ds-v8-scope .ov-hero", "margin-bottom")).toBe(
      "48px",
    );
    expect(finalDeclaration(".ds-v8-scope .ov-cta-band", "margin")).toBe(
      "48px 0 20px",
    );
  });
});
