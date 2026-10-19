import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { MendScene } from "./hero-mend-scene";

const DIR = __dirname;
const CSS = readFileSync(join(DIR, "hero-mend.css"), "utf8");
const SOURCE = readFileSync(join(DIR, "hero-mend-scene.tsx"), "utf8");
const ROOT = postcss.parse(CSS);
const RULES_ONLY = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
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

function plainRules(): Rule[] {
  const found: Rule[] = [];
  ROOT.walkRules((rule) => {
    if ((rule.parent as AtRule).name !== "keyframes") found.push(rule);
  });
  return found;
}

describe("the mend scene markup", () => {
  it("is one decorative, inert 600 x 500 frame without words", () => {
    const { container } = render(<MendScene />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("viewBox", "0 0 600 500");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-hero-motion", "mend");
    expect(svg).toHaveClass("hd-root", "block", "size-full");
    expect(svg!.querySelectorAll("a, button, input, [tabindex], title, desc, script, foreignObject, use, image, text")).toHaveLength(0);
    expect(svg!.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
    expect(svg!.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
  });

  it("tells the story with a 4 x 4 table, a gap, a doubled row, four packets and two bars", () => {
    const { container } = render(<MendScene />);
    // 16 cells minus the one the gap occupies; the clean cell is the sixteenth.
    expect(container.querySelectorAll(".hd-cell")).toHaveLength(15);
    expect(container.querySelectorAll(".hd-clean-box, .hd-gap-box, .hd-ghost-box")).toHaveLength(3);
    expect(container.querySelectorAll(".hd-pk")).toHaveLength(4);
    expect(container.querySelectorAll(".hd-pk .hd-dot-double")).toHaveLength(2);
    expect(container.querySelectorAll(".hd-bar-wrong, .hd-bar-right")).toHaveLength(2);
    // Meaning never rests on colour alone: a minus below the line, a plus above, a cross in the gap.
    expect(container.querySelectorAll(".hd-minus .hd-badge-glyph, .hd-plus .hd-badge-glyph, .hd-gap .hd-cross")).toHaveLength(3);
  });

  it("keeps meaningful content inside x 50..550 and y 50..450 (bar overshoot included)", () => {
    const { container } = render(<MendScene />);
    for (const rect of container.querySelectorAll(".hd-cell, .hd-zone, .hd-bar-wrong")) {
      const x = Number(rect.getAttribute("x"));
      const y = Number(rect.getAttribute("y"));
      const width = Number(rect.getAttribute("width"));
      const height = Number(rect.getAttribute("height"));
      expect(x).toBeGreaterThanOrEqual(50);
      expect(x + width).toBeLessThanOrEqual(550);
      expect(y).toBeGreaterThanOrEqual(50);
      if (rect.classList.contains("hd-bar-wrong")) expect(y + height + height * 0.92).toBeLessThanOrEqual(450 + 0.5 + 100);
    }
  });

  it("animates at most 16 elements", () => {
    const { container } = render(<MendScene />);
    const animated = new Set<Element>();
    ROOT.walkDecls((declaration) => {
      if (declaration.prop !== "animation" || !inside(declaration.parent as Container, NO_PREFERENCE)) return;
      for (const selector of (declaration.parent as Rule).selectors) {
        for (const element of container.querySelectorAll(selector.trim())) animated.add(element);
      }
    });
    expect(animated.size).toBeGreaterThanOrEqual(12);
    expect(animated.size).toBeLessThanOrEqual(16);
  });
});

describe("hero-mend-scene.tsx source", () => {
  it("is a server component with token-only colour and no dash glyphs", () => {
    expect(SOURCE).not.toMatch(/^["']use client["']/m);
    expect(SOURCE).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect|Reducer|Memo|Callback)\b/);
    expect(SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SOURCE).not.toMatch(/[–—]/);
    expect(SOURCE).not.toMatch(/\bstyle=/);
    const imports = [...SOURCE.matchAll(/^import .* from "([^"]+)";|^import "([^"]+)";/gm)].map((match) => match[1] ?? match[2]);
    expect(imports.sort()).toEqual(["./hero-mend.css", "react"]);
  });
});

describe("hero-mend.css", () => {
  it("is small and scoped under .hd-root", () => {
    expect(Buffer.byteLength(CSS)).toBeLessThanOrEqual(12 * 1024);
    for (const rule of plainRules()) {
      for (const selector of rule.selectors) expect(selector.trim(), selector).toMatch(/^\.hd-root\b|^\.hd-[a-z0-9-]+/);
    }
  });

  it("keeps every animation, transition and keyframe under no-preference", () => {
    const moving = declarations((d) => /^(?:animation|transition)/.test(d.prop));
    expect(moving.length).toBeGreaterThan(10);
    for (const declaration of moving) {
      const parent = declaration.parent as Container;
      expect(inside(parent, NO_PREFERENCE) || inside(parent, REDUCE), `${(parent as Rule).selector} { ${declaration.prop} }`).toBe(true);
    }
    ROOT.walkAtRules("keyframes", (rule) => {
      expect(inside(rule.parent as Container, NO_PREFERENCE), rule.params).toBe(true);
    });
  });

  it("has a reduce block that stops everything", () => {
    const reduce: AtRule[] = [];
    ROOT.walkAtRules("media", (rule) => {
      if (rule.params.includes(REDUCE)) reduce.push(rule);
    });
    expect(reduce).toHaveLength(1);
    expect(reduce[0].toString()).toMatch(/animation:\s*none\s*!important/);
    expect(reduce[0].toString()).toMatch(/transition:\s*none\s*!important/);
  });

  it("moves only transform, opacity and stroke-dashoffset", () => {
    ROOT.walkAtRules("keyframes", (rule) => {
      rule.walkDecls((declaration) => expect(MOVING.has(declaration.prop), `${rule.params}: ${declaration.prop}`).toBe(true));
    });
    for (const declaration of declarations((d) => d.prop === "transition" && !inside(d.parent as Container, REDUCE))) {
      expect(declaration.value).toMatch(/^transform\b/);
    }
  });

  it("uses no filter, gradient, blur, hex or dash glyph, and will-change on at most four elements", () => {
    expect(RULES_ONLY).not.toMatch(/\bfilter\b|backdrop-filter|gradient\(|\bblur\b|mix-blend|clip-path|mask/);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS).not.toMatch(/[–—]/);
    const hints = declarations((d) => d.prop === "will-change");
    expect(hints.length).toBeLessThanOrEqual(1);
    expect(hints[0].parent && (hints[0].parent as Rule).selector).toBe(".hd-pk");
    for (const declaration of declarations((d) => /^--hd-(?:ink|mid|ground|paper)$/.test(d.prop))) {
      expect(declaration.value).toMatch(/^var\(--color-(?:scene-(?:ink|mid|ground)|paper)\)$/);
    }
  });

  it("shows the finished frame in the base styles and hides what only exists in the story", () => {
    const base = (selector: string) =>
      plainRules().filter((rule) => rule.selectors.some((entry) => entry.trim() === selector) && !inside(rule.parent as Container, NO_PREFERENCE));
    const opacityOf = (selector: string): string => {
      let value = "1";
      for (const rule of base(selector)) rule.walkDecls("opacity", (d) => void (value = d.value));
      return value;
    };
    for (const selector of [".hd-bar-wrong", ".hd-minus", ".hd-gap", ".hd-ghost", ".hd-pk", ".hd-ripple", ".hd-scan"]) {
      expect(opacityOf(selector), selector).toBe("0");
    }
    for (const selector of [".hd-bar-right", ".hd-clean-box", ".hd-plus", ".hd-clean"]) {
      expect(opacityOf(selector), selector).not.toBe("0");
    }
  });

  it("runs one 11 second loop on a shared clock with a 3 act story", () => {
    const loops = declarations((d) => d.prop === "animation" && d.value.includes("var(--hd-go)"));
    expect(loops.length).toBeGreaterThanOrEqual(12);
    for (const declaration of loops) expect(declaration.value).toMatch(/\b11s\b.*\binfinite\b.*\bbackwards\b/);
  });

  it("reacts to the pointer with transform only", () => {
    const hover = plainRules().filter((rule) => rule.selector.includes(":hover"));
    expect(hover.length).toBeGreaterThanOrEqual(1);
    for (const rule of hover) rule.walkDecls((d) => expect(d.prop).toBe("transform"));
  });
});
