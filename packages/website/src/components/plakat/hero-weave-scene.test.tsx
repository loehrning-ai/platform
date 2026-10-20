import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration } from "postcss";
import { describe, expect, it } from "vitest";
import { WeaveScene } from "./hero-weave-scene";

const DIR = __dirname;
const CSS = readFileSync(join(DIR, "hero-weave.css"), "utf8");
const SOURCE = readFileSync(join(DIR, "hero-weave-scene.tsx"), "utf8");
const ROOT = postcss.parse(CSS);
const NO_PREFERENCE = "prefers-reduced-motion: no-preference";
const MOVING = new Set(["transform", "opacity", "stroke-dashoffset", "animation-timing-function"]);

function inside(node: Container | undefined, media: string): boolean {
  for (let parent = node; parent; parent = parent.parent as Container | undefined) {
    if (parent.type === "atrule" && (parent as AtRule).name === "media" && (parent as AtRule).params.includes(media)) {
      return true;
    }
  }
  return false;
}

function svgOf(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
  return svg as SVGSVGElement;
}

describe("the weave scene markup", () => {
  it("is one decorative, inert 600 x 500 frame with no word, id or style", () => {
    const svg = svgOf(render(<WeaveScene />).container);
    expect(svg).toHaveAttribute("viewBox", "0 0 600 500");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-hero-motion", "weave");
    expect(svg).toHaveClass("hw-root", "block", "size-full");
    expect(svg.querySelectorAll("a, button, input, select, textarea, [tabindex], title, desc, script, foreignObject, use, image, text")).toHaveLength(0);
    expect(svg.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
    expect(svg.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
    expect(svg.textContent).toBe("");
  });

  it("tells the story: three requests, eight facts and one slot, three threads, three sheets", () => {
    const svg = svgOf(render(<WeaveScene />).container);
    expect(svg.querySelectorAll(".hw-request")).toHaveLength(3);
    expect(svg.querySelectorAll(".hw-tile")).toHaveLength(8);
    expect(svg.querySelectorAll(".hw-slot")).toHaveLength(1);
    expect(svg.querySelectorAll(".hw-thread")).toHaveLength(3);
    expect(svg.querySelectorAll(".hw-sheet")).toHaveLength(3);
    // Every thread is normalised, so one dash pattern draws it.
    for (const thread of svg.querySelectorAll(".hw-thread")) expect(thread).toHaveAttribute("pathLength", "1");
  });

  it("names the gap by shape, not by colour: a dash in the slot and a dashed row on the third sheet only", () => {
    const svg = svgOf(render(<WeaveScene />).container);
    expect(svg.querySelectorAll(".hw-gap-row")).toHaveLength(1);
    expect(svg.querySelectorAll(".hw-sheet-3 .hw-gap-row")).toHaveLength(1);
    expect(svg.querySelectorAll(".hw-sheet-1 .hw-gap-row, .hw-sheet-2 .hw-gap-row")).toHaveLength(0);
    expect(svg.querySelectorAll(".hw-dash-glyph")).toHaveLength(2);
    expect(svg.querySelectorAll(".hw-gap .hw-dash-glyph, .hw-sheet-3 .hw-dash-glyph")).toHaveLength(2);
  });

  it("keeps the meaningful content inside x 50..550 and y 50..450", () => {
    const svg = svgOf(render(<WeaveScene />).container);
    for (const shape of svg.querySelectorAll(".hw-frame, .hw-slot")) {
      const x = Number(shape.getAttribute("x"));
      const y = Number(shape.getAttribute("y"));
      if (shape.tagName !== "rect") continue;
      expect(x).toBeGreaterThanOrEqual(50);
      expect(y).toBeGreaterThanOrEqual(50);
      expect(x + Number(shape.getAttribute("width"))).toBeLessThanOrEqual(550);
      expect(y + Number(shape.getAttribute("height"))).toBeLessThanOrEqual(450);
    }
    for (const request of svg.querySelectorAll(".hw-request .hw-frame")) {
      const numbers = (request.getAttribute("d") ?? "").match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      expect(Math.min(...numbers)).toBeGreaterThanOrEqual(50);
    }
  });
});

describe("hero-weave.css contract", () => {
  it("stays within the budget", () => {
    expect(Buffer.byteLength(CSS)).toBeLessThanOrEqual(12 * 1024);
    expect(Buffer.byteLength(readFileSync(join(DIR, "hero-weave-scene.tsx"), "utf8"))).toBeLessThanOrEqual(20 * 1024);
  });

  it("scopes every selector under .hw-root", () => {
    ROOT.walkRules((rule) => {
      const parent = rule.parent as Container;
      if (parent.type === "atrule" && (parent as AtRule).name === "keyframes") return;
      for (const selector of rule.selectors) {
        expect(selector, selector).toMatch(/^\.hw-root\b|^\.hw-root$/);
        if (selector.includes("*")) expect(selector).toMatch(/^\.hw-root( \*)?$/);
      }
    });
  });

  it("plays animation only under prefers-reduced-motion: no-preference (or switches it off)", () => {
    ROOT.walkDecls(/^animation/, (declaration: Declaration) => {
      if (declaration.value === "none" && inside(declaration.parent as Container, "prefers-reduced-motion: reduce")) return;
      expect(inside(declaration.parent as Container, NO_PREFERENCE), `${declaration.parent?.type} ${declaration.prop}`).toBe(true);
    });
    ROOT.walkAtRules("keyframes", (rule) => {
      expect(inside(rule.parent as Container, NO_PREFERENCE), rule.params).toBe(true);
    });
    expect(CSS).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
  });

  it("moves only transform, opacity and stroke-dashoffset", () => {
    let frames = 0;
    ROOT.walkAtRules("keyframes", (rule) => {
      rule.walkDecls((declaration) => {
        frames += 1;
        expect(MOVING.has(declaration.prop), `${rule.params} ${declaration.prop}`).toBe(true);
      });
    });
    expect(frames).toBeGreaterThan(20);
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).not.toMatch(/\b(filter|backdrop-filter|box-shadow|text-shadow|gradient)\b/);
    expect(rules).not.toMatch(/\b(?:margin|top|left)\s*:/);
  });

  it("uses token colours only, and will-change on at most four elements", () => {
    expect(CSS.replace(/\/\*[\s\S]*?\*\//g, "")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS.match(/will-change/g)?.length ?? 0).toBeLessThanOrEqual(4);
    for (const token of ["--color-scene-ink", "--color-scene-mid", "--color-scene-ground", "--color-paper"]) expect(CSS).toContain(`var(${token})`);
  });

  it("animates at most 16 elements, every one with a keyframe set", () => {
    const names = new Set<string>();
    ROOT.walkDecls("animation-name", (declaration) => {
      names.add(declaration.value);
    });
    ROOT.walkDecls("animation", (declaration) => {
      const first = declaration.value.split(" ")[0] ?? "";
      if (first !== "none") names.add(first);
    });
    // Seven near/mid layers and three sheets plus far and dust, all named.
    expect(names.size).toBeLessThanOrEqual(16);
    const defined = new Set<string>();
    ROOT.walkAtRules("keyframes", (rule) => {
      defined.add(rule.params);
    });
    for (const name of names) expect(defined.has(name), name).toBe(true);
  });

  it("runs on the stage clock and keeps the story's last beat as the base frame", () => {
    expect(CSS).toContain("var(--ws-t, 9s)");
    // The base frame shows the gap line and dash (opacity is only animated, never set to 0 in the base).
    ROOT.walkRules((rule) => {
      if (inside(rule.parent as Container, NO_PREFERENCE)) return;
      if (/\.hw-(request|sheet|gap|tiles|thread)/.test(rule.selector)) {
        rule.walkDecls("opacity", (declaration) => {
          expect(declaration.value, rule.selector).not.toBe("0");
        });
      }
    });
  });
});

describe("hero-weave-scene source contract", () => {
  it("is a server component with no hooks", () => {
    expect(SOURCE).not.toMatch(/^["']use client["']/m);
    expect(SOURCE).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect|Reducer|Memo|Callback)\b/);
    expect(SOURCE).toContain('import "./hero-weave.css"');
    expect(SOURCE).not.toMatch(/—|–/);
    expect(CSS).not.toMatch(/—|–/);
  });
});
