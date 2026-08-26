import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { DS_FONT_VARIABLES } from "./fonts";

const stylesheet = postcss.parse(
  readFileSync(
    join(__dirname, "../../components/data-science/ds-v8-scope.css"),
    "utf8",
  ),
);

describe("data-science local fonts", () => {
  it("uses the local font marker without importing a network font loader", () => {
    expect(DS_FONT_VARIABLES).toBe("ds-fonts-local");
  });

  it("uses the platform Loehrning Sans token without a mobile system-font override", () => {
    const scopeFontRules: string[] = [];
    const mobileFontRules: string[] = [];

    stylesheet.walkRules(".ds-v8-scope", (rule) => {
      rule.walkDecls("--font-sans", (declaration) => {
        scopeFontRules.push(declaration.value);
      });
    });
    stylesheet.walkAtRules("media", (rule) => {
      if (rule.params !== "(max-width: 900px)") return;
      rule.walkRules(".ds-v8-scope", (nestedRule) => {
        nestedRule.walkDecls("--font-sans", (declaration) => {
          mobileFontRules.push(declaration.value);
        });
      });
    });

    expect(scopeFontRules.at(-1)).toBe(
      'var(--font-loehrning-sans), "Inter", system-ui, sans-serif',
    );
    expect(mobileFontRules).toEqual([]);
  });

  it("keeps the mobile headline accent static", () => {
    const mobileAnimations: string[] = [];

    stylesheet.nodes.forEach((node) => {
      if (node.type !== "atrule" || node.name !== "media") return;
      const rule = node;
      if (rule.params !== "(max-width: 900px)") return;
      rule.walkRules(".ds-v8-scope .ov-hero-title .accent", (nestedRule) => {
        nestedRule.walkDecls("animation", (declaration) => {
          mobileAnimations.push(declaration.value);
        });
      });
    });

    expect(mobileAnimations).toEqual(["none"]);
    expect(
      stylesheet.nodes.some(
        (node) =>
          node.type === "atrule" &&
          node.name === "keyframes" &&
          node.params === "shimmer",
      ),
    ).toBe(false);
  });
});
