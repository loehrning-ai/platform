import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { LinksScene } from "./hero-links-scene";

const DIR = __dirname;
const SOURCE = readFileSync(join(DIR, "hero-links-scene.tsx"), "utf8");
const CSS = readFileSync(join(DIR, "hero-links.css"), "utf8");
const ROOT = postcss.parse(CSS);
const NO_PREFERENCE = "prefers-reduced-motion: no-preference";
const REDUCE = "prefers-reduced-motion: reduce";
const MOVING = new Set(["transform", "opacity", "stroke-dashoffset", "animation-timing-function"]);

function inside(node: Container | undefined, media: string): boolean {
  for (let parent = node; parent; parent = parent.parent as Container | undefined) {
    if (parent.type === "atrule" && (parent as AtRule).name === "media" && (parent as AtRule).params.includes(media)) return true;
  }
  return false;
}

function declarations(match: (declaration: Declaration) => boolean): Declaration[] {
  const found: Declaration[] = [];
  ROOT.walkDecls((declaration) => {
    if (match(declaration)) found.push(declaration);
  });
  return found;
}

describe("the links scene", () => {
  it("is one decorative, inert 600 x 500 frame without text", () => {
    const { container } = render(<LinksScene />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "0 0 600 500");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-hero-motion", "links");
    expect(svg).toHaveClass("hk-root", "size-full");
    expect(svg.querySelectorAll("text, a, button, input, [tabindex], title, desc, script, foreignObject, use, image")).toHaveLength(0);
    expect(svg.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
    expect(svg.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
  });

  it("tells four days, thirteen questions, one door: 13 sheets, 10 crosses in 5 groups, 1 weak marker, 1 door", () => {
    const { container } = render(<LinksScene />);
    expect(container.querySelectorAll(".hk-sheet")).toHaveLength(13);
    expect(container.querySelectorAll(".hk-sheet-plain")).toHaveLength(2);
    // Rows of 5, 4 and 4.
    const rows = new Map<string, number>();
    for (const sheet of container.querySelectorAll(".hk-sheet")) rows.set(sheet.getAttribute("y")!, (rows.get(sheet.getAttribute("y")!) ?? 0) + 1);
    expect([...rows.values()]).toEqual([5, 4, 4]);
    // Four day tiles fill, a fifth outlined tile stays.
    expect(container.querySelectorAll(".hk-links .hk-tile")).toHaveLength(5);
    expect(container.querySelectorAll(".hk-links .hk-day")).toHaveLength(4);
    expect(container.querySelectorAll(".hk-tile-last")).toHaveLength(1);
    // Ten crosses in five groups of two; the fifth group keeps its e2e hook.
    expect(container.querySelectorAll(".hk-fail")).toHaveLength(5);
    expect(container.querySelectorAll(".hk-fail-5")).toHaveLength(1);
    for (const group of container.querySelectorAll(".hk-fail")) expect(group.querySelectorAll(".hk-x")).toHaveLength(2);
    expect(container.querySelectorAll(".hk-x")).toHaveLength(10);
    expect(container.querySelectorAll(".hk-weak")).toHaveLength(1);
    // One scan bar, one door, one knock group of three arcs, an old and a new sheet.
    expect(container.querySelectorAll(".hk-scan")).toHaveLength(1);
    expect(container.querySelectorAll(".hk-far")).toHaveLength(1);
    expect(container.querySelectorAll(".hk-knock .hk-arc")).toHaveLength(3);
    expect(container.querySelectorAll(".hk-paper-old")).toHaveLength(1);
    expect(container.querySelectorAll(".hk-paper-new")).toHaveLength(1);
  });

  it("keeps every shape inside the safe area (x 50..550, y 50..450)", () => {
    const { container } = render(<LinksScene />);
    const shapes = container.querySelectorAll(".hk-tile, .hk-sheet, .hk-doorway, .hk-door, .hk-paper-old, .hk-paper-new, .hk-scan, .hk-weak");
    expect(shapes.length).toBeGreaterThan(20);
    for (const shape of shapes) {
      const x = Number(shape.getAttribute("x"));
      const y = Number(shape.getAttribute("y"));
      expect(x).toBeGreaterThanOrEqual(50);
      expect(x + Number(shape.getAttribute("width"))).toBeLessThanOrEqual(550);
      expect(y).toBeGreaterThanOrEqual(50);
      expect(y + Number(shape.getAttribute("height"))).toBeLessThanOrEqual(450);
    }
  });
});

describe("hero-links source contract", () => {
  it("is a server component with token-only colour and no dash characters", () => {
    expect(SOURCE).not.toMatch(/^["']use client["']/m);
    expect(SOURCE).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect|Reducer|Memo|Callback)\b/);
    expect(SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SOURCE).not.toMatch(/[–—]/);
    expect(SOURCE).not.toMatch(/\bstyle=/);
    const imports = [...SOURCE.matchAll(/^import .* from "([^"]+)";|^import "([^"]+)";/gm)].map((match) => match[1] ?? match[2]);
    expect(imports).toEqual(["react", "./hero-links.css"]);
  });
});

describe("hero-links.css", () => {
  it("stays within its size budget, scoped to .hk-root, token colours only", () => {
    expect(Buffer.byteLength(CSS)).toBeLessThanOrEqual(12 * 1024);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS).not.toMatch(/[–—]/);
    expect(CSS).not.toMatch(/gradient|filter|blur|box-shadow|drop-shadow/);
    ROOT.walkRules((rule: Rule) => {
      if ((rule.parent as Container).type === "atrule" && (rule.parent as AtRule).name === "keyframes") return;
      for (const selector of rule.selectors) expect(selector.trim(), selector).toMatch(/^\.hk-/);
    });
    for (const declaration of declarations((d) => /^--hk-/.test(d.prop))) {
      expect(declaration.value).toMatch(/^var\(--color-(?:scene-(?:ink|mid|ground)|paper)\)$/);
    }
  });

  it("keeps every animation and keyframe under no-preference, with a reduce block that stops everything", () => {
    const moving = declarations((declaration) => /^(?:animation|transition)/.test(declaration.prop) && !inside(declaration.parent as Container, REDUCE));
    expect(moving.length).toBeGreaterThanOrEqual(9);
    for (const declaration of moving) expect(inside(declaration.parent as Container, NO_PREFERENCE)).toBe(true);
    const keyframes: AtRule[] = [];
    ROOT.walkAtRules("keyframes", (rule) => {
      keyframes.push(rule);
    });
    expect(keyframes.length).toBeGreaterThanOrEqual(9);
    for (const rule of keyframes) expect(inside(rule.parent as Container, NO_PREFERENCE), rule.params).toBe(true);
    const reduce: AtRule[] = [];
    ROOT.walkAtRules("media", (rule) => {
      if (rule.params.includes(REDUCE)) reduce.push(rule);
    });
    expect(reduce).toHaveLength(1);
    expect(reduce[0]!.toString()).toMatch(/animation:\s*none\s*!important/);
  });

  it("moves only transform, opacity and stroke-dashoffset, on at most 16 elements, and the still frame has no sweep", () => {
    ROOT.walkAtRules("keyframes", (rule) => {
      rule.walkDecls((declaration) => {
        expect(MOVING.has(declaration.prop), `${rule.params}: ${declaration.prop}`).toBe(true);
      });
    });
    const animated = new Set<string>();
    ROOT.walkRules((rule) => {
      if (rule.some((node) => node.type === "decl" && node.prop === "animation") && inside(rule, NO_PREFERENCE)) {
        for (const selector of rule.selectors) animated.add(selector.trim());
      }
    });
    const { container } = render(<LinksScene />);
    const nodes = [...container.querySelectorAll("svg *")].filter((node) => [...animated].some((selector) => node.matches(selector)));
    expect(nodes.length).toBeGreaterThan(6);
    expect(nodes.length).toBeLessThanOrEqual(16);
    expect(declarations((d) => d.prop === "will-change")).toHaveLength(0);
    const scanOpacity = declarations((d) => d.prop === "opacity" && (d.parent as Rule).selector === ".hk-scan" && !inside(d.parent as Container, NO_PREFERENCE));
    expect(scanOpacity.map((d) => d.value)).toEqual(["0"]);
  });
});

describe("no ink fill (visual law V1/V2)", () => {
  /** Ink fills that stay: the doorway wash is 0.14 alpha, the scan bar is 6 px wide, the knob is a 10 px dot. */
  const ALLOWED_INK_FILL = new Set([".hk-doorway", ".hk-scan", ".hk-knob"]);

  it("fills no surface with ink or a near black in hero-links.css, apart from the three small marks", () => {
    ROOT.walkRules((rule: Rule) => {
      if ((rule.parent as Container).type === "atrule" && (rule.parent as AtRule).name === "keyframes") return;
      rule.walkDecls(/^(?:fill|background(?:-color)?)$/, (declaration) => {
        if (!/var\(--hk-ink\)|#000|black|#121212/.test(declaration.value)) return;
        for (const selector of rule.selectors) expect(ALLOWED_INK_FILL.has(selector.trim()), `${selector}: ${declaration.prop}`).toBe(true);
      });
    });
  });

  it("paints the four day tiles in the mid tone, not in ink", () => {
    const day = declarations((d) => d.prop === "fill" && (d.parent as Rule).selector === ".hk-day" && !inside(d.parent as Container, NO_PREFERENCE));
    expect(day.map((d) => d.value)).toEqual(["var(--hk-mid)"]);
  });

  it("sets no inline or attribute fill in the scene source", () => {
    expect(SOURCE).not.toMatch(/\bfill=["'](?:#|black|var\(--hk-ink)/);
    expect(SOURCE).not.toMatch(/\bfill=/);
  });
});
