import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type AtRule, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { GLASS_ACCENT, GLASS_ALPHA, GLASS_INK, GLASS_TINT, glassComposite, worstGlassContrast } from "./glass";

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
const root = postcss.parse(css);

function glassRules(): Rule[] {
  const rules: Rule[] = [];
  root.walkRules((rule) => {
    if (rule.selectors.some((selector) => /\.glass\b/.test(selector))) rules.push(rule);
  });
  return rules;
}

function declarations(rule: Rule): Map<string, string> {
  const map = new Map<string, string>();
  rule.walkDecls((declaration) => {
    map.set(declaration.prop, declaration.value);
  });
  return map;
}

const parentAtRule = (rule: Rule) => (rule.parent?.type === "atrule" ? (rule.parent as AtRule) : null);

describe(".glass contrast (amendment 27)", () => {
  it("keeps Druckschwarz text at AA and the Mennige marker at 3:1 over the worst backdrop", () => {
    expect(worstGlassContrast(GLASS_INK)).toBeGreaterThanOrEqual(4.5);
    expect(worstGlassContrast(GLASS_ACCENT)).toBeGreaterThanOrEqual(3);
  });

  it("would fail the marker at a thinner tint, so the alpha is load-bearing", () => {
    expect(worstGlassContrast(GLASS_ACCENT, 0.72)).toBeLessThan(3);
  });

  it("composites toward the tint, never past it", () => {
    expect(glassComposite("#121212", 1)).toBe(GLASS_TINT);
    expect(glassComposite("#121212", 0)).toBe("#121212");
  });
});

describe(".glass in globals.css", () => {
  const rules = glassRules();

  it("is one class with no compound or descendant selectors", () => {
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule.selectors).toEqual([".glass"]);
  });

  it("starts opaque, square and hairlined outside any at-rule", () => {
    const base = rules.find((rule) => parentAtRule(rule) === null);
    expect(base).toBeDefined();
    const decl = declarations(base!);
    expect(decl.get("background-color")).toBe("var(--color-background)");
    expect(decl.get("border-radius")).toBe("0");
    expect(decl.get("border")).toMatch(/^1px solid /);
    expect(decl.has("backdrop-filter")).toBe(false);
  });

  it("turns translucent only under @supports backdrop-filter, at GLASS_ALPHA of the tint", () => {
    const translucent = rules.filter((rule) => declarations(rule).has("backdrop-filter") && declarations(rule).get("backdrop-filter") !== "none");
    expect(translucent).toHaveLength(1);
    const rule = translucent[0]!;
    expect(parentAtRule(rule)?.name).toBe("supports");
    const decl = declarations(rule);
    expect(decl.get("-webkit-backdrop-filter")).toBe(decl.get("backdrop-filter"));
    const match = decl.get("background-color")?.match(/^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/);
    expect(match).not.toBeNull();
    const hex = `#${[match![1], match![2], match![3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
    expect(hex).toBe(GLASS_TINT);
    expect(Number(match![4])).toBe(GLASS_ALPHA);
  });

  it("falls back to opaque paper for reduced transparency and forced colours", () => {
    const media = rules.map(parentAtRule).filter((rule): rule is AtRule => rule?.name === "media").map((rule) => rule.params);
    expect(media).toEqual(expect.arrayContaining(["(prefers-reduced-transparency: reduce)", "(forced-colors: active)"]));
    for (const rule of rules.filter((r) => parentAtRule(r)?.name === "media")) {
      expect(declarations(rule).get("backdrop-filter")).toBe("none");
    }
  });

  it("never paints a gradient or a rounded corner", () => {
    for (const rule of rules) {
      for (const [prop, value] of declarations(rule)) {
        expect(value, prop).not.toMatch(/gradient/);
        if (prop === "border-radius") expect(value).toBe("0");
      }
    }
  });
});
