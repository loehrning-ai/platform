import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import postcss, { type AtRule, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import {
  GLASS_ACCENT,
  GLASS_ALPHA,
  GLASS_INK,
  GLASS_MARK_MIN,
  GLASS_TEXT,
  GLASS_TEXT_MIN,
  GLASS_TINT,
  glassComposite,
  worstGlassContrast,
} from "./glass";

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

  it("keeps every text colour allowed on glass at 4.5:1 over a black frame, with no credit for blur", () => {
    for (const text of GLASS_TEXT) expect(worstGlassContrast(text), text).toBeGreaterThanOrEqual(GLASS_TEXT_MIN);
  });

  it("lets Mennige mark but never write on glass, and keeps the light grey off it", () => {
    expect(worstGlassContrast(GLASS_ACCENT)).toBeGreaterThanOrEqual(GLASS_MARK_MIN);
    expect(worstGlassContrast(GLASS_ACCENT)).toBeLessThan(GLASS_TEXT_MIN);
    expect(GLASS_TEXT).not.toContain(GLASS_ACCENT);
    expect(worstGlassContrast("#655c54")).toBeLessThan(GLASS_TEXT_MIN);
  });

  it("keeps Schiefer at AA: it fails at a 0.72 tint and passes at GLASS_ALPHA", () => {
    expect(worstGlassContrast("#4f4640", 0.72)).toBeLessThan(GLASS_TEXT_MIN);
    expect(worstGlassContrast("#4f4640")).toBeGreaterThanOrEqual(GLASS_TEXT_MIN);
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

  it("falls back to opaque paper for reduced transparency, more contrast, forced colours and print", () => {
    const media = rules.map(parentAtRule).filter((rule): rule is AtRule => rule?.name === "media").map((rule) => rule.params);
    expect(media).toEqual(
      expect.arrayContaining([
        "(prefers-reduced-transparency: reduce)",
        "(prefers-contrast: more)",
        "(forced-colors: active)",
        "print",
      ]),
    );
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

/* ── One material, site-wide ──────────────────────────────────────────── */

const SRC = join(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(css|tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

const FILES = walk(SRC).map((path) => ({ file: relative(SRC, path), text: readFileSync(path, "utf8") }));

describe("Werkglas is the only glass on the site", () => {
  it("has no backdrop-filter outside .glass except switching one off", () => {
    const offenders: string[] = [];
    for (const { file, text } of FILES.filter((entry) => entry.file.endsWith(".css"))) {
      postcss.parse(text).walkDecls(/backdrop-filter$/, (declaration) => {
        const rule = declaration.parent as Rule;
        const isGlass = file === "app/globals.css" && rule.selectors?.every((selector) => selector === ".glass");
        if (!isGlass && declaration.value !== "none") offenders.push(`${file}: ${rule.selector} ${declaration.value}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("has no Tailwind backdrop blur or translucent frost in components", () => {
    // The site navigation keeps its own frosted desktop pill, unchanged on purpose.
    const KEEPS_OWN_LOOK = new Set(["components/nav.tsx"]);
    const offenders = FILES.filter((entry) => /\.tsx?$/.test(entry.file) && !KEEPS_OWN_LOOK.has(entry.file))
      .filter(({ text }) => /\bbackdrop-(?:blur|filter|saturate)(?!-none)/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("never transitions or animates the filter, and never refracts through SVG", () => {
    for (const { file, text } of FILES.filter((entry) => entry.file.endsWith(".css"))) {
      const root = postcss.parse(text);
      root.walkDecls(/^(?:transition|transition-property|will-change)$/, (declaration) => {
        expect(declaration.value, `${file}: ${declaration.prop}`).not.toMatch(/backdrop/);
      });
      root.walkAtRules(/keyframes$/, (keyframes) => {
        keyframes.walkDecls((declaration) => expect(declaration.prop, `${file}: @keyframes ${keyframes.params}`).not.toMatch(/backdrop/));
      });
      root.walkDecls(/backdrop-filter$/, (declaration) => expect(declaration.value, file).not.toMatch(/url\(/));
    }
    for (const rule of glassRules()) {
      for (const [prop] of declarations(rule)) expect(prop, ".glass").not.toMatch(/^(?:transition|animation|will-change)/);
    }
  });
});

/* ── The decks, labs and their build scripts ──────────────────────────────
   The workshop folders under public/ are hand-written or generated by the
   scripts under scripts/workshop*, scripts/workshops and scripts/course03.
   None of them is the site's nav, so none of them may carry glass: no slide
   is full-bleed, and a phone gets no fixed glass. A second copy of the
   recipe is exactly how the material drifts. */

const WEBSITE = join(__dirname, "../..");
const REPO = join(WEBSITE, "../..");

function walkAll(dir: string, accept: (name: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walkAll(path, accept, out);
    else if (accept(name)) out.push(path);
  }
  return out;
}

const DECK_FILES = [
  ...walkAll(join(WEBSITE, "public/workshops"), (name) => /\.(css|html)$/.test(name)),
  ...readdirSync(join(REPO, "scripts"))
    .filter((name) => /^(?:workshops?\d*|course\d+)$/.test(name))
    .flatMap((name) => walkAll(join(REPO, "scripts", name), (file) => /\.(css|html|mjs|js)$/.test(file) && !/\.test\./.test(file))),
].map((path) => ({ file: relative(REPO, path), text: readFileSync(path, "utf8") }));

describe("no glass in the decks, labs and their build scripts", () => {
  it("scans the deck folders and the deck build scripts", () => {
    expect(DECK_FILES.some(({ file }) => file.endsWith("audit-vorbereitung-mit-ki/lib/deck.css"))).toBe(true);
    expect(DECK_FILES.some(({ file }) => file === "scripts/workshop05/deck-src/build.mjs")).toBe(true);
  });

  it("switches backdrop-filter only off, never on", () => {
    const offenders = DECK_FILES.flatMap(({ file, text }) =>
      Array.from(text.matchAll(/backdrop-filter\s*:\s*([^;}"'`]+)/g))
        .map((match) => match[1]!.trim())
        .filter((value) => value !== "none")
        .map((value) => `${file}: ${value}`),
    );
    expect(offenders).toEqual([]);
  });

  it("neither defines nor applies a .glass class", () => {
    const offenders = DECK_FILES.filter(
      ({ text }) => /\.glass\b\s*[{,:]/.test(text) || /class="[^"]*\bglass\b/.test(text) || /classList\.(?:add|toggle)\(\s*["']glass["']/.test(text),
    ).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
