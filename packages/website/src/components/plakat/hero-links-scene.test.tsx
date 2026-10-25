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

  it("tells the demo's first screen: eight requests, eight files, eight links; two hold, four turn dashed, two break", () => {
    const { container } = render(<LinksScene />);
    expect(container.querySelectorAll(".hk-request")).toHaveLength(8);
    expect(container.querySelectorAll(".hk-file")).toHaveLength(8);
    expect(container.querySelector(".hk-links")!.getAttribute("d")!.match(/M/g)).toHaveLength(8);
    expect(container.querySelectorAll(".hk-fail")).toHaveLength(6);
    expect(container.querySelectorAll(".hk-weak")).toHaveLength(4);
    expect(container.querySelectorAll(".hk-gap")).toHaveLength(2);
    // A broken link is two pieces and a cut: the shape says it, not the colour.
    for (const gap of container.querySelectorAll(".hk-gap")) expect(gap.getAttribute("d")!.match(/M/g)).toHaveLength(2);
    expect(container.querySelectorAll(".hk-gap-cut")).toHaveLength(2);
    // Every failing row marks exactly the one test it failed.
    for (const fail of container.querySelectorAll(".hk-fail")) expect(fail.querySelectorAll(".hk-tick-fail")).toHaveLength(1);
  });

  it("keeps the cards inside the safe area (x 50..550, y 50..450)", () => {
    const { container } = render(<LinksScene />);
    for (const shape of container.querySelectorAll(".hk-request, .hk-file")) {
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
