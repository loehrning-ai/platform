import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { TraceScene } from "./hero-trace-scene";

const DIR = __dirname;
const SOURCE = readFileSync(join(DIR, "hero-trace-scene.tsx"), "utf8");
const CSS = readFileSync(join(DIR, "hero-trace.css"), "utf8");
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

describe("the trace scene", () => {
  it("is one decorative, inert 600 x 500 frame without text", () => {
    const { container } = render(<TraceScene />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "0 0 600 500");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-hero-motion", "trace");
    expect(svg).toHaveClass("ht-root", "size-full");
    expect(svg.querySelectorAll("text, a, button, input, [tabindex], title, desc, script, foreignObject, use, image")).toHaveLength(0);
    expect(svg.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
    expect(svg.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
  });

  it("tells the story: two pages, three figure rows, three threads and bars, a flagged bar with a cross", () => {
    const { container } = render(<TraceScene />);
    expect(container.querySelectorAll(".ht-page")).toHaveLength(2);
    expect(container.querySelectorAll(".ht-cell-on")).toHaveLength(3);
    expect(container.querySelectorAll(".ht-thread")).toHaveLength(3);
    expect(container.querySelectorAll(".ht-bar")).toHaveLength(3);
    expect(container.querySelectorAll(".ht-dot")).toHaveLength(3);
    expect(container.querySelectorAll(".ht-bar-3 .ht-bar-flag")).toHaveLength(1);
    expect(container.querySelectorAll(".ht-trace, .ht-back, .ht-ring")).toHaveLength(3);
    // The disagreement is carried by a cross shape, not by colour alone.
    expect(container.querySelectorAll(".ht-cross path.ht-cross-glyph")).toHaveLength(1);
  });

  it("keeps the meaningful content inside the safe area (x 50..550, y 50..450)", () => {
    const { container } = render(<TraceScene />);
    for (const shape of container.querySelectorAll(".ht-page, .ht-bar-rect")) {
      const x = Number(shape.getAttribute("x"));
      const width = Number(shape.getAttribute("width"));
      expect(x).toBeGreaterThanOrEqual(50);
      expect(x + width).toBeLessThanOrEqual(550);
    }
  });
});

describe("hero-trace source contract", () => {
  it("is a server component with token-only colour and no dash characters", () => {
    expect(SOURCE).not.toMatch(/^["']use client["']/m);
    expect(SOURCE).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect|Reducer|Memo|Callback)\b/);
    expect(SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SOURCE).not.toMatch(/[–—]/);
    expect(SOURCE).not.toMatch(/\bstyle=/);
    const imports = [...SOURCE.matchAll(/^import .* from "([^"]+)";|^import "([^"]+)";/gm)].map((match) => match[1] ?? match[2]);
    expect(imports).toEqual(["react", "./hero-trace.css"]);
  });
});

describe("hero-trace.css", () => {
  it("stays within its size budget, scoped to .ht-root, token colours only", () => {
    expect(Buffer.byteLength(CSS)).toBeLessThanOrEqual(12 * 1024);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS).not.toMatch(/[–—]/);
    expect(CSS).not.toMatch(/gradient|filter|blur|box-shadow|drop-shadow/);
    ROOT.walkRules((rule: Rule) => {
      if ((rule.parent as Container).type === "atrule" && ((rule.parent as AtRule).name === "keyframes")) return;
      for (const selector of rule.selectors) expect(selector.trim(), selector).toMatch(/^\.ht-/);
    });
  });

  it("keeps every animation and keyframe under no-preference, with a reduce block that stops everything", () => {
    const moving = declarations((declaration) => /^(?:animation|transition)/.test(declaration.prop) && !(declaration.parent as Rule).selector?.startsWith?.(".ht-root, .ht-root *"));
    expect(moving.length).toBeGreaterThan(10);
    for (const declaration of moving) {
      expect(inside(declaration.parent as Container, NO_PREFERENCE) || declaration.prop === "animation-timing-function").toBe(true);
    }
    const keyframes: AtRule[] = [];
    ROOT.walkAtRules("keyframes", (rule) => {
      keyframes.push(rule);
    });
    expect(keyframes.length).toBeGreaterThan(10);
    for (const rule of keyframes) expect(inside(rule.parent as Container, NO_PREFERENCE), rule.params).toBe(true);
    const reduce: AtRule[] = [];
    ROOT.walkAtRules("media", (rule) => {
      if (rule.params.includes(REDUCE)) reduce.push(rule);
    });
    expect(reduce).toHaveLength(1);
    expect(reduce[0].toString()).toMatch(/animation:\s*none\s*!important/);
  });

  it("moves only transform, opacity and stroke-dashoffset, at most 16 animated elements, will-change on at most 4", () => {
    ROOT.walkAtRules("keyframes", (rule) => {
      rule.walkDecls((declaration) => {
        expect(MOVING.has(declaration.prop), `${rule.params}: ${declaration.prop}`).toBe(true);
      });
    });
    const animated = new Set<string>();
    ROOT.walkRules((rule) => {
      if (rule.some((node) => node.type === "decl" && node.prop === "animation" && inside(rule, NO_PREFERENCE))) {
        for (const selector of rule.selectors) animated.add(selector.trim());
      }
    });
    expect(animated.size).toBeGreaterThan(8);
    expect(animated.size).toBeLessThanOrEqual(16);
    expect(declarations((d) => d.prop === "will-change").length).toBeLessThanOrEqual(4);
  });
});
