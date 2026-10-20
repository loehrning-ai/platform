import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type AtRule, type Container, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { PLAKAT, PLAKAT_KEYS, type PlakatKey } from "./palettes";

/**
 * The anti-colour rule (globals.css, "Anti colors"): the block that appears
 * behind a stage card on hover, focus and press is never the card's own
 * colour. Card A sits on the scene ground, card B on the scene ink.
 */
const GLOBALS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const MENNIGE = "#b73a15";
const DRUCKSCHWARZ = "#121212";

function declOf(selectorPart: string, prop: string): string {
  let found = "";
  postcss.parse(GLOBALS).walkRules((rule: Rule) => {
    if (found || !rule.selector.includes(selectorPart)) return;
    rule.walkDecls(prop, (decl) => {
      found = decl.value.replace(/\s*\/\*.*$/, "").trim();
    });
  });
  return found;
}

function rgb(hex: string): readonly [number, number, number] {
  return [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)) as unknown as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function hue(hex: string): number {
  const [r, g, b] = rgb(hex).map((value) => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function hueApart(a: string, b: string): number {
  const d = Math.abs(hue(a) - hue(b));
  return Math.min(d, 360 - d);
}

describe("anti colours of the stage cards", () => {
  for (const key of PLAKAT_KEYS) {
    for (const [slot, prop] of [
      ["a", "ground"],
      ["b", "ink"],
    ] as const) {
      it(`${key} card ${slot.toUpperCase()}: not the card's colour, from the palette accent or the brand, clearly different`, () => {
        const palette = PLAKAT[key as PlakatKey];
        const card = palette[prop];
        const anti = declOf(`.plakat-${key}`, `--color-scene-anti-${slot}`);
        expect(anti, `${key} defines --color-scene-anti-${slot}`).toMatch(/^#[0-9a-f]{6}$/);
        expect(anti).not.toBe(card);
        expect([palette.mid, MENNIGE, DRUCKSCHWARZ]).toContain(anti);
        // Clearly different: 3:1 in luminance against the card it sits behind, or 60 degrees apart in hue.
        const clear = contrast(card, anti) >= 3 || hueApart(card, anti) >= 60;
        expect(clear, `${key} ${slot}: ${contrast(card, anti).toFixed(2)}:1, ${hueApart(card, anti).toFixed(0)} deg`).toBe(true);
        // The page-root copy (outside the .plakat scope) carries the same value.
        expect(declOf(`:root:has([data-plakat-page="${key}"])`, `--color-scene-anti-${slot}`)).toBe(anti);
        // The block is seen on the page ground and next to the card edge: not invisible on Kalkweiß.
        expect(contrast("#f3f0e9", anti), `${key} ${slot} on the page`).toBeGreaterThanOrEqual(1.9);
      });
    }
  }

  it("feeds the offset block of each card from its own anti colour, never from the page's scene line", () => {
    const css = readFileSync(join(process.cwd(), "src/components/workshops/action-cards.css"), "utf8");
    expect(css).not.toContain("--ac-ring");
    expect(css).toMatch(/\.ac-list > li::before \{[^}]*background-color:\s*var\(--ac-anti/s);
    expect(css).toMatch(/li\[data-slot="a"\] \{\s*--ac-anti:\s*var\(--color-scene-anti-a\)/);
    expect(css).toMatch(/li\[data-slot="b"\] \{\s*--ac-anti:\s*var\(--color-scene-anti-b\)/);
  });

  it("keeps every :hover rule of the workshop styles behind a fine pointer, so a tap never sticks", () => {
    for (const file of [
      "src/components/workshops/action-cards.css",
      "src/components/workshops/workshop-stage.css",
      "src/components/workshops/kit-motion.css",
      "src/app/globals.css",
    ]) {
      const root = postcss.parse(readFileSync(join(process.cwd(), file), "utf8"));
      root.walkRules((rule: Rule) => {
        if (!/:hover/.test(rule.selector)) return;
        // Plain element hovers of the app shell are not workshop states.
        if (file.endsWith("globals.css") && !/anti-|ac-|ws-/.test(rule.selector)) return;
        let parent = rule.parent as Container | undefined;
        let guarded = false;
        while (parent && parent.type !== "root") {
          if (parent.type === "atrule" && /hover:\s*hover/.test((parent as AtRule).params)) guarded = true;
          parent = parent.parent as Container | undefined;
        }
        expect(guarded, `${file}: ${rule.selector}`).toBe(true);
      });
    }
  });
});
