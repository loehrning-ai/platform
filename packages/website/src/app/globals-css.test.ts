import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const CSS_PATH = join(__dirname, "globals.css");
const css = readFileSync(CSS_PATH, "utf8");
const root = postcss.parse(css);

function getDeclarations(selector: string): Map<string, string> {
  const declarations = new Map<string, string>();
  root.walkRules(selector, (rule) => {
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value);
    });
  });
  return declarations;
}

function getThemeDeclarations(): Map<string, string> {
  const declarations = new Map<string, string>();
  root.walkAtRules("theme", (rule) => {
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value);
    });
  });
  return declarations;
}

function parseHex(value: string): readonly [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) throw new Error(`Expected a six-digit hex color, received ${value}`);
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ];
}

function relativeLuminance(value: string): number {
  const linear = parseHex(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(a: string, b: string): number {
  const aLuminance = relativeLuminance(a);
  const bLuminance = relativeLuminance(b);
  return (
    (Math.max(aLuminance, bLuminance) + 0.05) /
    (Math.min(aLuminance, bLuminance) + 0.05)
  );
}

function blend(foreground: string, background: string, alpha: number): string {
  const foregroundRgb = parseHex(foreground);
  const backgroundRgb = parseHex(background);
  return `#${foregroundRgb
    .map((channel, index) =>
      Math.round(channel * alpha + backgroundRgb[index] * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

describe("global interaction and typography defaults", () => {
  it("balances primary headings to prevent single-word final lines", () => {
    const headingRule = root.nodes
      .flatMap((node) => ("nodes" in node ? node.nodes ?? [] : []))
      .find(
        (node) =>
          node.type === "rule" &&
          node.selector === ":where(h1, h2, h3)",
      );

    expect(headingRule?.type).toBe("rule");
    const textWrap = new Map<string, string>();
    if (headingRule?.type === "rule") {
      headingRule.walkDecls((declaration) => {
        textWrap.set(declaration.prop, declaration.value);
      });
    }
    expect(textWrap.get("text-wrap")).toBe("balance");
  });

  it("keeps pinch zoom while removing delayed taps on scoped interactive controls", () => {
    const declarations = new Map<string, string>();

    root.walkRules((rule) => {
      if (
        rule.selector.includes("a[href]") &&
        rule.selector.includes("button") &&
        rule.selector.includes('[role="button"]')
      ) {
        rule.walkDecls((declaration) => {
          declarations.set(declaration.prop, declaration.value);
        });
      }
    });

    expect(declarations.get("touch-action")).toBe("manipulation");
    expect(declarations.get("-webkit-tap-highlight-color")).toBe(
      "rgba(183, 58, 21, 0.18)",
    );
    expect(css).not.toMatch(/user-scalable\s*=\s*no|max(?:imum)?-scale\s*=\s*1/i);
  });
});

describe("semantic palette contrast", () => {
  const theme = getThemeDeclarations();
  const dark = getDeclarations(".dark-section");
  const lightSurfaces = [
    theme.get("--color-background"),
    theme.get("--color-card"),
  ] as const;
  const foregroundTokens = [
    "--color-brand-sand",
    "--color-brand-amber",
    "--color-destructive",
    "--color-risk-green",
    "--color-risk-yellow",
    "--color-risk-red",
  ] as const;

  it.each(foregroundTokens)(
    "%s remains AA on light surfaces and its own 20% card tint",
    (token) => {
      const color = theme.get(token);
      const card = theme.get("--color-card");
      expect(color, `${token} must exist`).toBeDefined();
      expect(card, "--color-card must exist").toBeDefined();

      for (const surface of lightSurfaces) {
        expect(surface, "light surface token must exist").toBeDefined();
        expect(contrastRatio(color!, surface!)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastRatio(color!, blend(color!, card!, 0.2))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each([
    "--color-brand-orange",
    ...foregroundTokens,
  ] as const)("%s has an AA dark-section override", (token) => {
    const color = dark.get(token);
    const darkBackground = theme.get("--color-dark-bg");
    expect(color, `${token} dark override must exist`).toBeDefined();
    expect(darkBackground, "--color-dark-bg must exist").toBeDefined();
    expect(contrastRatio(color!, darkBackground!)).toBeGreaterThanOrEqual(4.5);
  });
});
