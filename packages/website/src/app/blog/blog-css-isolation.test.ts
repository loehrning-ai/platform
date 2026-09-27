import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "_styles/blog.css"), "utf8");
const postCss = readFileSync(join(__dirname, "_styles/post.css"), "utf8");
const indexCss = readFileSync(
  join(__dirname, "_styles/blog-index.css"),
  "utf8",
);
const layoutSource = readFileSync(join(__dirname, "layout.tsx"), "utf8");
const heroSource = readFileSync(
  join(__dirname, "eu-ai-act-grundlagen/_sections/hero.tsx"),
  "utf8",
);
const root = postcss.parse(css);
const postRoot = postcss.parse(postCss);
const indexRoot = postcss.parse(indexCss);

describe("blog stylesheet isolation", () => {
  it("does not replace site-wide typography tokens when Next.js prefetches the blog", () => {
    const globalRootRules: string[] = [];

    root.walkRules((rule) => {
      if (rule.selectors.some((selector) => selector.trim() === ":root")) {
        globalRootRules.push(rule.selector);
      }
    });

    expect(globalRootRules).toEqual([]);
  });

  it("defines the editorial token set on the blog boundary", () => {
    const declarations = new Map<string, string>();

    root.walkRules(".blog-root", (rule) => {
      if (rule.parent?.type !== "root") return;
      rule.walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value);
      });
    });

    expect(declarations.get("--font-sans")).toContain("var(--font-typing)");
    expect(declarations.get("--font-mono")).toContain("var(--font-geist-mono)");
    expect(declarations.get("--kupfer")?.toLowerCase()).toBe("#a5370f");
  });

  it("does not preload or late-swap four editorial fonts around above-fold content", () => {
    expect(layoutSource).toMatch(/display:\s*"optional"/);
    expect(layoutSource).toMatch(/preload:\s*false/);
  });

  it("does not load the four-face editorial sans family on mobile", () => {
    const mobileFontRules: string[] = [];

    root.walkAtRules("media", (rule) => {
      if (rule.params.replaceAll(" ", "") !== "(max-width:900px)") return;
      rule.walkRules(".blog-root", (nestedRule) => {
        nestedRule.walkDecls("--font-sans", (declaration) => {
          mobileFontRules.push(declaration.value);
        });
      });
    });

    expect(mobileFontRules).toEqual([
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ]);
    expect(mobileFontRules[0]).not.toContain("var(--font-typing)");
  });

  it("paints the article title in its settled position", () => {
    const declarations = new Map<string, string>();
    postRoot.walkRules(".hero__title .word", (rule) => {
      rule.walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value);
      });
    });

    expect(declarations.get("display")).toBe("inline-block");
    expect(declarations.has("transform")).toBe(false);
    expect(declarations.has("animation")).toBe(false);
    expect(heroSource).not.toContain("animationDelay");
  });

  it("restores a high-contrast focus-visible indicator on range sliders", () => {
    const declarations = new Map<string, string>();
    postRoot.walkRules(".sim__slider:focus-visible", (rule) => {
      rule.walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value);
      });
    });

    expect(declarations.get("outline")).toBe("3px solid var(--druckertinte)");
    expect(declarations.get("outline-offset")).toBe("5px");
  });

  it("scopes every index rule under the blog boundary", () => {
    const unscoped: string[] = [];
    indexRoot.walkRules((rule) => {
      for (const selector of rule.selectors) {
        if (!selector.trim().startsWith(".blog-root")) unscoped.push(selector);
      }
    });

    expect(unscoped).toEqual([]);
  });
});

describe("Werkzeichnung article stylesheet isolation (post-wz.css)", () => {
  const wzRoot = postcss.parse(
    readFileSync(join(__dirname, "_styles/post-wz.css"), "utf8"),
  );

  it("defines no :root rule", () => {
    const rootRules: string[] = [];
    wzRoot.walkRules((rule) => {
      if (rule.selectors.some((selector) => selector.includes(":root"))) {
        rootRules.push(rule.selector);
      }
    });
    expect(rootRules).toEqual([]);
  });

  it("scopes every selector to the article, its wz- parts or the print scope", () => {
    const unscoped: string[] = [];
    wzRoot.walkRules((rule) => {
      for (const raw of rule.selectors) {
        const selector = raw.trim();
        if (
          selector.startsWith(".post-wz") ||
          selector.startsWith(".wz-") ||
          selector.startsWith("html[data-print-scope")
        ) {
          continue;
        }
        unscoped.push(selector);
      }
    });
    expect(unscoped).toEqual([]);
  });

  it("leaves the shared railbar alone, also on paper", () => {
    const railbar: string[] = [];
    wzRoot.walkRules((rule) => {
      if (rule.selectors.some((selector) => selector.includes("railbar"))) {
        railbar.push(rule.selector);
      }
    });
    expect(railbar).toEqual([]);
  });

  it("is loaded after the editorial post stylesheet", () => {
    const post = layoutSource.indexOf('import "./_styles/post.css";');
    const wz = layoutSource.indexOf('import "./_styles/post-wz.css";');
    expect(post).toBeGreaterThan(-1);
    expect(wz).toBeGreaterThan(post);
  });
});
