import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const CSS_PATH = join(__dirname, "globals.css");
const css = readFileSync(CSS_PATH, "utf8");
const root = postcss.parse(css);

/**
 * Declarations of every rule whose selector list contains `selector`, so
 * `.plakat-lemons` also finds `.plakat-lemons, [data-plakat-page="lemons"]
 * [data-plakat-band] { ... }`. A compound selector such as
 * `.plakat-lemons.foo` is its own entry and never matches `.plakat-lemons`.
 */
function getDeclarations(selector: string): Map<string, string> {
  const declarations = new Map<string, string>();
  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value);
    });
  });
  return declarations;
}

/** Every rule whose selector list contains `selector`. */
function getRules(selector: string): Rule[] {
  const rules: Rule[] = [];
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) rules.push(rule);
  });
  return rules;
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

/** A six-digit hex, or an rgba() composited over `ground` as a browser would. */
function resolveColour(value: string, ground: string): string {
  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i.exec(value.trim());
  if (!rgba) {
    parseHex(value);
    return value.toLowerCase();
  }
  const hex = `#${[rgba[1], rgba[2], rgba[3]]
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
  return blend(hex, ground, Number(rgba[4]));
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
  ] as const)("%s stays AA on the pastel Himmel-Wash, Himmel-Blatt and Pfirsich-Wash grounds", (token) => {
    const color = theme.get(token);
    expect(color, `${token} must exist`).toBeDefined();
    for (const ground of ["--color-sky-wash", "--color-sky-sheet", "--color-peach-wash"] as const) {
      const surface = theme.get(ground);
      expect(surface, `${ground} must exist`).toBeDefined();
      expect(contrastRatio(color!, surface!)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("Werkzeichnung palette contrast", () => {
  const theme = getThemeDeclarations();
  const token = (name: string): string => {
    const value = theme.get(name);
    if (!value) throw new Error(`${name} must exist in @theme`);
    return value;
  };
  const paperSurfaces = ["--color-background", "--color-card", "--color-inset"] as const;

  it.each([
    ["--color-foreground", 4.5],
    ["--color-muted-foreground", 4.5],
    ["--color-muted", 4.5],
    ["--color-pass", 4.5],
    ["--color-kupfer-dark", 4.5],
  ] as const)("%s stays AA as text on paper, Bogen and Beton", (name, floor) => {
    for (const surface of paperSurfaces) {
      expect(contrastRatio(token(name), token(surface))).toBeGreaterThanOrEqual(floor);
    }
  });

  it("keeps Mennige accent text AA on paper and Bogen", () => {
    for (const surface of ["--color-background", "--color-card"] as const) {
      expect(contrastRatio(token("--color-brand-orange"), token(surface))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the primary button (paper on Mennige) AA at rest and on hover", () => {
    expect(contrastRatio(token("--color-paper"), token("--color-mennige"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(token("--color-paper"), token("--color-kupfer-dark"))).toBeGreaterThanOrEqual(4.5);
  });

  it("retires the graphit band: no dark scope, no dark token and no near-black ground", () => {
    // The owner's rule: never a black, graphit or near-black background.
    expect(getRules(".dark-section")).toHaveLength(0);
    for (const name of ["--color-dark-bg", "--color-dark-fg", "--color-dark-muted", "--color-dark-border", "--color-dark-track"]) {
      expect(theme.has(name), name).toBe(false);
    }
    expect(css).not.toMatch(/\.plakat-footer|\.bg-dot-pattern-dark|\.bg-grid-dark/);
    // No rule outside print paints a near-black ground (luminance below
    // 0.05, about #3a3a3a); the poster grounds are colours well above it.
    root.walkDecls(/^background(?:-color)?$/, (declaration) => {
      let node = declaration.parent?.parent;
      while (node && node.type !== "root") {
        if (node.type === "atrule" && (node as { name?: string }).name === "media" && /print/.test((node as { params?: string }).params ?? "")) return;
        node = node.parent;
      }
      for (const hex of declaration.value.match(/#[0-9a-f]{6}\b/gi) ?? []) {
        expect(relativeLuminance(hex), hex).toBeGreaterThanOrEqual(0.05);
      }
    });
  });

  it("keeps every footer text token AA on the Pfirsich-Wash, with a visible control edge", () => {
    const ground = token("--color-peach-wash");
    for (const name of ["--color-foreground", "--color-muted-foreground", "--color-muted", "--color-kupfer-dark", "--color-brand-orange"]) {
      expect(contrastRatio(token(name), ground), name).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(token("--color-border"), ground)).toBeGreaterThanOrEqual(3);
  });

  it("keeps the Mennige bar above the 3:1 non-text floor on the pastel sheet", () => {
    expect(contrastRatio(token("--color-mennige"), token("--color-sky-sheet"))).toBeGreaterThanOrEqual(3);
  });

  it("sets code blocks in any prose on Beton, never the plugin's near-black pre", () => {
    const prose = getDeclarations(".prose");
    expect(prose.get("--tw-prose-pre-bg")).toBe("var(--color-inset)");
    expect(prose.get("--tw-prose-pre-code")).toBe("var(--color-foreground)");
    expect(contrastRatio(token("--color-foreground"), token("--color-inset"))).toBeGreaterThanOrEqual(4.5);
  });

  it("drops the offset stamp shadow and keeps an overlay shadow", () => {
    expect(theme.has("--shadow-tile")).toBe(false);
    expect(theme.get("--shadow-overlay")).toBeDefined();
  });
});

describe("global color scheme", () => {
  it("declares one light scheme and binds dark: to an explicit .dark ancestor", () => {
    expect(getDeclarations(":root").get("color-scheme")).toBe("light");
    const variants: string[] = [];
    root.walkAtRules("custom-variant", (rule) => {
      variants.push(rule.params);
    });
    // Without this, Tailwind's dark: follows prefers-color-scheme and flips
    // single utilities on a paper page for readers whose OS is dark.
    expect(variants).toContain("dark (&:where(.dark, .dark *))");
  });
});

describe("Plakat scenes (poster palettes)", () => {
  const theme = getThemeDeclarations();
  const token = (name: string): string => {
    const value = theme.get(name);
    if (!value) throw new Error(`${name} must exist in @theme`);
    return value;
  };
  const SCENES = ["lemons", "idea", "bloom", "autumn"] as const;
  const STATUS_TOKENS = [
    "--color-pass",
    "--color-destructive",
    "--color-risk-red",
    "--color-risk-yellow",
    "--color-risk-green",
    "--color-brand-sand",
    "--color-brand-amber",
  ] as const;
  const RAW_TOKENS = [
    "--color-ultramarin",
    "--color-butter",
    "--color-kreide",
    "--color-kobalt",
    "--color-himbeere",
    "--color-himbeere-tief",
    "--color-sand",
    "--color-aubergine",
    "--color-terrakotta",
    "--color-terrakotta-tief",
    "--color-rost",
    "--color-creme",
    "--color-ocker",
    "--color-ocker-hell",
    "--color-ocker-tief",
  ] as const;
  const SCENE_TOKENS = [
    "--color-scene-ground",
    "--color-scene-ink",
    "--color-scene-mid",
    "--color-scene-mark",
    "--color-scene-accent-text",
    "--color-scene-line",
    "--color-scene-button",
    "--color-scene-button-text",
  ] as const;

  it("keeps the raw palette and the scene roles in an always-emitted @theme block", () => {
    const staticTheme = new Map<string, string>();
    root.walkAtRules("theme", (rule) => {
      if (rule.params.trim() !== "static") return;
      rule.walkDecls((declaration) => {
        staticTheme.set(declaration.prop, declaration.value);
      });
    });
    for (const name of [...RAW_TOKENS, ...SCENE_TOKENS]) {
      expect(staticTheme.get(name), `${name} must sit in @theme static`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("gives the scene roles their paper defaults, so a component reads right outside a scene", () => {
    expect(token("--color-scene-ground")).toBe(token("--color-background"));
    expect(token("--color-scene-ink")).toBe(token("--color-foreground"));
    expect(token("--color-scene-mid")).toBe(token("--color-mennige"));
    expect(token("--color-scene-mark")).toBe(token("--color-mennige"));
    expect(token("--color-scene-accent-text")).toBe(token("--color-kupfer-dark"));
    expect(token("--color-scene-line")).toBe(token("--color-foreground"));
    // The paper default of the filled scene button is the old site's Kobalt
    // with a Bogen label, never an ink (near-black) fill.
    expect(token("--color-scene-button")).toBe(token("--color-brand-cobalt"));
    expect(token("--color-scene-button-text")).toBe(token("--color-paper"));
    expect(contrastRatio(token("--color-scene-button-text"), token("--color-scene-button"))).toBeGreaterThanOrEqual(4.5);
    for (const surface of ["--color-background", "--color-card", "--color-inset"]) {
      expect(contrastRatio(token("--color-scene-accent-text"), token(surface))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(SCENES)("scopes .plakat-%s and its page band in one rule", (scene) => {
    const rules = getRules(`.plakat-${scene}`);
    expect(rules).toHaveLength(1);
    expect(rules[0].selectors).toEqual([
      `.plakat-${scene}`,
      `[data-plakat-page="${scene}"] [data-plakat-band]`,
    ]);
    const scope = getDeclarations(`.plakat-${scene}`);
    expect(scope.get("background-color")).toBe("var(--color-background)");
    expect(scope.get("color")).toBe("var(--color-foreground)");
  });

  it.each(SCENES)("keeps every .plakat-%s token AA against its ground", (scene) => {
    const scope = getDeclarations(`.plakat-${scene}`);
    const own = (name: string): string => {
      const value = scope.get(name);
      if (!value) throw new Error(`.plakat-${scene} must set ${name}`);
      return resolveColour(value, scope.get("--color-background") ?? "#000000");
    };
    const ground = own("--color-background");
    const ink = own("--color-foreground");

    // One ground, one ink: the scene roles, the ring and the in-band line agree.
    expect(own("--color-scene-ground")).toBe(ground);
    expect(own("--color-scene-ink")).toBe(ink);
    expect(own("--color-scene-line")).toBe(ink);
    expect(own("--color-brand-orange")).toBe(ink);

    // Text tokens: no muted tier on a poster.
    for (const name of ["--color-foreground", "--color-muted-foreground", "--color-muted", "--color-kupfer", "--color-kupfer-dark"]) {
      expect(contrastRatio(own(name), ground), name).toBeGreaterThanOrEqual(4.5);
    }
    // The filled scene button: its label AA on the fill, the fill a visible
    // control against the ground (3:1), and never a near-black fill (the
    // owner's rule: Aubergine at luminance 0.023 reads as a black button).
    const button = own("--color-scene-button");
    expect(contrastRatio(own("--color-scene-button-text"), button), "button label on the button fill").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(button, ground), "button fill against the ground").toBeGreaterThanOrEqual(3);
    expect(relativeLuminance(button), "button fill luminance").toBeGreaterThan(0.033);
    expect(contrastRatio(own("--color-scene-accent-text"), ground)).toBeGreaterThanOrEqual(4.5);

    // Control edge, focus ring and meaningful marks: the 3:1 non-text floor.
    expect(contrastRatio(own("--color-border"), ground)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(own("--color-brand-orange"), ground)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(own("--color-scene-mark"), ground)).toBeGreaterThanOrEqual(3);

    // Hairlines and tracks stay decorative.
    expect(contrastRatio(own("--color-hairline"), ground)).toBeLessThan(2);
    expect(contrastRatio(own("--color-track"), ground)).toBeLessThan(2);

    // A tint is either the ground itself or keeps the ink AA on it.
    for (const name of ["--color-card-hover", "--color-inset"]) {
      const tint = own(name);
      if (tint !== ground) {
        expect(contrastRatio(ink, tint), `ink on ${name}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(own("--color-card")).toBe(ground);

    // Status tones: the scope's override or the inherited paper value.
    for (const name of STATUS_TOKENS) {
      const value = scope.has(name) ? own(name) : token(name);
      if (value !== ink) {
        expect(contrastRatio(value, ground), name).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each(SCENES)("never redefines paper or Mennige inside .plakat-%s", (scene) => {
    const scope = getDeclarations(`.plakat-${scene}`);
    expect(scope.has("--color-paper")).toBe(false);
    expect(scope.has("--color-mennige")).toBe(false);
  });

  it("holds the Rost rules in the autumn scope", () => {
    const autumn = getDeclarations(".plakat-autumn");
    const ink = autumn.get("--color-foreground");
    const ground = autumn.get("--color-background");
    // No muted tier, no tint, no status tone of its own.
    for (const name of ["--color-muted-foreground", "--color-muted", ...STATUS_TOKENS]) {
      expect(autumn.get(name), name).toBe(ink);
    }
    expect(autumn.get("--color-card-hover")).toBe(ground);
    expect(autumn.get("--color-inset")).toBe(ground);
    // A meaningful mark uses Ocker hell; Ocker itself stays decoration.
    expect(contrastRatio(autumn.get("--color-scene-mark")!, ground!)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(autumn.get("--color-scene-mid")!, ground!)).toBeLessThan(3);
    // The caps line grows to the 17px Rost floor.
    const caps = getDeclarations(".plakat-autumn .plakat-caps");
    expect(Number.parseFloat(caps.get("font-size") ?? "0")).toBeGreaterThanOrEqual(1.0625);
    expect(getRules(".plakat-autumn .plakat-caps")[0]?.selectors).toContain(
      '[data-plakat-page="autumn"] [data-plakat-band] .plakat-caps',
    );
  });

  it.each(SCENES)("draws the %s page scene line AA on every paper ground", (scene) => {
    const rules = getRules(`:root:has([data-plakat-page="${scene}"])`);
    expect(rules).toHaveLength(1);
    const line = getDeclarations(`:root:has([data-plakat-page="${scene}"])`).get("--color-scene-line");
    expect(line).toBeDefined();
    for (const surface of ["--color-background", "--color-card", "--color-inset"]) {
      expect(contrastRatio(line!, token(surface))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("draws the Kopflinie in the scene line", () => {
    expect(getDeclarations(".kopflinie").get("border-top")).toBe("2px solid var(--color-scene-line)");
  });

  it("defines one caps line at 14px or more, set by CSS from sentence-case text", () => {
    const caps = getRules(".plakat-caps").filter((rule) => rule.selector === ".plakat-caps");
    expect(caps).toHaveLength(1);
    const declarations = getDeclarations(".plakat-caps");
    expect(Number.parseFloat(declarations.get("font-size") ?? "0")).toBeGreaterThanOrEqual(0.875);
    expect(declarations.get("text-transform")).toBe("uppercase");
    expect(declarations.get("color")).toBe("var(--color-scene-ink)");
  });

  it("sets the poster headline only through --text-poster", () => {
    const title = getDeclarations(".poster-title");
    expect(title.get("font-size")).toContain("var(--text-poster)");
    expect(title.get("font-size")).toContain("var(--fit");
    expect(title.get("line-height")).toBe("var(--text-poster--line-height)");
    expect(title.get("letter-spacing")).toBe("var(--text-poster--letter-spacing)");
    expect(title.get("font-weight")).toBe("700");
    expect(token("--text-poster--letter-spacing")).toBe("-0.04em");
    expect(Number.parseFloat(token("--text-poster--line-height"))).toBeGreaterThanOrEqual(0.9);
    // The -0.04em tracking lives in the token alone; no rule hard-codes it.
    let hardCoded = 0;
    root.walkDecls("letter-spacing", (declaration) => {
      if (/-0\.0[3-9]/.test(declaration.value)) hardCoded += 1;
    });
    expect(hardCoded).toBe(0);
  });
});
