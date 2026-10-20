import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { ConeScene } from "./hero-cone-scene";

const DIR = __dirname;
const SOURCE = readFileSync(join(DIR, "hero-cone-scene.tsx"), "utf8");
const CSS = readFileSync(join(DIR, "hero-cone.css"), "utf8");
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

function animatedSelectors(): string[] {
  const names = new Set<string>();
  ROOT.walkRules((rule) => {
    const parent = rule.parent as Container;
    if (parent.type === "atrule" && (parent as AtRule).name === "keyframes") return;
    if (!inside(rule, NO_PREFERENCE)) return;
    if (rule.nodes?.some((node) => node.type === "decl" && node.prop === "animation")) {
      for (const selector of rule.selectors) names.add(selector.trim());
    }
  });
  return [...names];
}

describe("the cone scene", () => {
  it("is one decorative, inert 600 x 500 canvas without text, ids or defs", () => {
    const { container } = render(<ConeScene />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("viewBox", "0 0 600 500");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-hero-motion", "cone");
    expect(svg).toHaveClass("hc-root", "block", "size-full");
    expect(svg!.querySelectorAll("a, button, input, [tabindex], title, desc, script, foreignObject, use, image, text")).toHaveLength(0);
    expect(svg!.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
    expect(svg!.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
  });

  it("tells the story: history, nine forecasts, a band, one signed path, a stamp, the outcome", () => {
    const { container } = render(<ConeScene />);
    expect(container.querySelectorAll(".hc-history")).toHaveLength(1);
    expect(container.querySelectorAll(".hc-path")).toHaveLength(9);
    expect(container.querySelectorAll(".hc-cone-out .hc-path, .hc-cone-in .hc-path")).toHaveLength(8);
    expect(container.querySelectorAll(".hc-cone-kept .hc-path")).toHaveLength(1);
    expect(container.querySelectorAll(".hc-band-line")).toHaveLength(1);
    expect(container.querySelectorAll(".hc-signed")).toHaveLength(1);
    expect(container.querySelectorAll(".hc-stamp")).toHaveLength(1);
    expect(container.querySelectorAll(".hc-outcome")).toHaveLength(1);
  });

  it("keeps meaningful content inside the safe area", () => {
    const { container } = render(<ConeScene />);
    for (const circle of container.querySelectorAll(".hc-tip, .hc-end-dot, .hc-now-dot")) {
      const cx = Number(circle.getAttribute("cx"));
      const cy = Number(circle.getAttribute("cy"));
      expect(cx).toBeGreaterThanOrEqual(50);
      expect(cx).toBeLessThanOrEqual(550);
      expect(cy).toBeGreaterThanOrEqual(50);
      expect(cy).toBeLessThanOrEqual(450);
    }
  });

  it("lands the outcome inside the band and off the middle path", () => {
    const { container } = render(<ConeScene />);
    const band = container.querySelector(".hc-band-wash")!;
    const top = Number(band.getAttribute("y"));
    const bottom = top + Number(band.getAttribute("height"));
    const end = Number(container.querySelector(".hc-end-dot")!.getAttribute("cy"));
    const tips = [...container.querySelectorAll(".hc-tip")].map((tip) => Number(tip.getAttribute("cy")));
    expect(end).toBeGreaterThan(top);
    expect(end).toBeLessThan(bottom);
    // Exactly one forecast ends inside the band: the one the person signs.
    expect(tips.filter((y) => y > top && y < bottom)).toHaveLength(1);
    const middle = tips[4];
    expect(Math.abs(end - middle)).toBeGreaterThan(30);
  });
});

describe("hero-cone-scene source", () => {
  it("is a server component with token-only colour and no dash glyphs", () => {
    expect(SOURCE).not.toMatch(/^["']use client["']/m);
    expect(SOURCE).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect|Reducer|Memo|Callback)\b/);
    expect(SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SOURCE).not.toMatch(/[–—]/);
    expect(SOURCE).not.toMatch(/\bstyle=|<defs|<filter|Gradient/);
    expect(SOURCE).toContain('import "./hero-cone.css";');
    const imports = [...SOURCE.matchAll(/^import .* from "([^"]+)";/gm)].map((match) => match[1]);
    expect(imports).toEqual(["react"]);
  });

  it("stays inside the size budget", () => {
    expect(Buffer.byteLength(CSS)).toBeLessThanOrEqual(12 * 1024);
    const { container } = render(<ConeScene />);
    expect(Buffer.byteLength(container.innerHTML)).toBeLessThanOrEqual(20 * 1024);
  });
});

describe("hero-cone.css", () => {
  it("scopes every selector under .hc-root, with the hover reaction on the stage", () => {
    ROOT.walkRules((rule) => {
      const parent = rule.parent as Container;
      if (parent.type === "atrule" && (parent as AtRule).name === "keyframes") return;
      for (const selector of rule.selectors) {
        expect(selector, selector).toMatch(/\.hc-/);
        expect(selector, selector).not.toMatch(/\.(?!hc-|ws-)[a-z]/);
      }
    });
  });

  it("keeps every animation, transition and keyframe under no-preference", () => {
    const moving = declarations((declaration) => /^(?:animation|transition)/.test(declaration.prop));
    expect(moving.length).toBeGreaterThan(10);
    for (const declaration of moving) {
      expect(inside(declaration.parent as Container, NO_PREFERENCE) || inside(declaration.parent as Container, REDUCE)).toBe(true);
    }
    const keyframes: AtRule[] = [];
    ROOT.walkAtRules("keyframes", (rule) => {
      keyframes.push(rule);
    });
    expect(keyframes.length).toBeGreaterThan(10);
    for (const rule of keyframes) expect(inside(rule.parent as Container, NO_PREFERENCE), rule.params).toBe(true);
  });

  it("has one reduce block that stops everything", () => {
    const reduce: AtRule[] = [];
    ROOT.walkAtRules("media", (rule) => {
      if (rule.params.includes(REDUCE)) reduce.push(rule);
    });
    expect(reduce).toHaveLength(1);
    expect(reduce[0].toString()).toMatch(/animation:\s*none\s*!important/);
    expect(reduce[0].toString()).toMatch(/transition:\s*none\s*!important/);
  });

  it("moves only transform, opacity and stroke-dashoffset, and transitions only transform", () => {
    ROOT.walkAtRules("keyframes", (rule) => {
      rule.walkDecls((declaration) => expect(MOVING.has(declaration.prop), `${rule.params}: ${declaration.prop}`).toBe(true));
    });
    for (const declaration of declarations((d) => d.prop === "transition" && !inside(d.parent as Container, REDUCE))) {
      expect(declaration.value).toMatch(/^transform\b/);
    }
    expect(declarations((d) => ["width", "height", "top", "left", "margin"].includes(d.prop) && inside(d.parent as Container, NO_PREFERENCE))).toEqual([]);
  });

  it("uses no will-change, filter, gradient, blur or hex, and colours only through scene tokens", () => {
    expect(declarations((d) => d.prop === "will-change")).toEqual([]);
    expect(RULES_ONLY).not.toMatch(/\bfilter\b|backdrop-filter|gradient\(|\bblur\b|mix-blend|clip-path|mask/);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS).not.toMatch(/[–—]/);
    for (const declaration of declarations((d) => /^--hc-(?:ink|mid|ground|paper)$/.test(d.prop))) {
      expect(declaration.value).toMatch(/^var\(--color-(?:scene-(?:ink|mid|ground)|paper)\)$/);
    }
  });

  it("animates at most 16 elements and runs the story on the shared 9 second clock", () => {
    const selectors = animatedSelectors();
    expect(selectors.length).toBeLessThanOrEqual(16);
    const story = declarations((d) => d.prop === "animation" && d.value.includes("var(--hc-t)"));
    expect(story.length).toBeGreaterThanOrEqual(12);
    expect(CSS).toMatch(/--hc-t:\s*var\(--ws-t,\s*9s\)/);
    for (const declaration of story) expect(declaration.value).toMatch(/infinite/);
  });

  it("shows the finished frame in the base styles", () => {
    const base = (selector: string): Rule[] => {
      const found: Rule[] = [];
      ROOT.walkRules((rule) => {
        if (rule.selectors.some((entry) => entry.trim() === selector) && !inside(rule.parent as Container, NO_PREFERENCE)) found.push(rule);
      });
      return found;
    };
    const opacityOf = (selector: string): string | undefined => {
      let value: string | undefined;
      for (const rule of base(selector)) rule.walkDecls("opacity", (d) => void (value = d.value));
      return value;
    };
    // Visible at rest: history, signed path, stamp, outcome. Dimmed: the rest of the cone.
    for (const selector of [".hc-history", ".hc-signed", ".hc-stamp-body", ".hc-outcome", ".hc-end-dot"]) {
      expect(opacityOf(selector), selector).not.toBe("0");
    }
    expect(opacityOf(".hc-cone-out")).toBe("0.25");
    // The pulse and the stamp ripple only exist in the story.
    expect(opacityOf(".hc-now-ring")).toBe("0");
    expect(opacityOf(".hc-seal")).toBe("0");
    const dashed = base(".hc-history")[0];
    let offset = "";
    dashed.walkDecls("stroke-dashoffset", (d) => void (offset = d.value));
    expect(offset).toBe("0");
  });
});
