import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { DS_FONT_VARIABLES } from "./fonts";

const stylesheet = postcss.parse(
  readFileSync(join(__dirname, "../../components/data-science/ds-v8-scope.css"), "utf8"),
);

describe("data-science local fonts", () => {
  it("uses the local font marker without importing a network font loader", () => {
    expect(DS_FONT_VARIABLES).toBe("ds-fonts-local");
  });

  it("keeps the four-weight Loehrning Sans family out of the mobile critical path", () => {
    const mobileFontRules: string[] = [];

    stylesheet.walkAtRules("media", (rule) => {
      if (rule.params !== "(max-width: 900px)") return;
      rule.walkRules(".ds-v8-scope", (nestedRule) => {
        nestedRule.walkDecls("--font-sans", (declaration) => {
          mobileFontRules.push(declaration.value);
        });
      });
    });

    expect(mobileFontRules).toEqual([
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ]);
    expect(mobileFontRules[0]).not.toContain("var(--font-loehrning)");
  });

  it("keeps the mobile LCP headline gradient static", () => {
    const mobileAnimations: string[] = [];
    let baseRuleIndex = -1;
    let mobileRuleIndex = -1;

    stylesheet.nodes.forEach((node, index) => {
      if (node.type === "rule" && node.selector === ".ds-v8-scope .ov-hero-title .accent") {
        node.walkDecls("animation", (declaration) => {
          if (declaration.value.includes("shimmer")) baseRuleIndex = index;
        });
      }
      if (node.type !== "atrule" || node.name !== "media") return;
      const rule = node;
      if (rule.params !== "(max-width: 900px)") return;
      rule.walkRules(".ds-v8-scope .ov-hero-title .accent", (nestedRule) => {
        nestedRule.walkDecls("animation", (declaration) => {
          mobileAnimations.push(declaration.value);
          mobileRuleIndex = index;
        });
      });
    });

    expect(mobileAnimations).toEqual(["none"]);
    expect(mobileRuleIndex).toBeGreaterThan(baseRuleIndex);
  });
});
