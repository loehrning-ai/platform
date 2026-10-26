import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { kitRows, modelAt } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import { CONVERGE_ROWS, ConvergeScene, DELIVERED_ORDER, GOODS_ORDER } from "./hero-converge-scene";

const DIR = __dirname;
const SOURCE = readFileSync(join(DIR, "hero-converge-scene.tsx"), "utf8");
const CSS = readFileSync(join(DIR, "hero-converge.css"), "utf8");
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

describe("the basis scene", () => {
  it("is one decorative, inert 600 x 500 frame without text", () => {
    const { container } = render(<ConvergeScene />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "0 0 600 500");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-hero-motion", "converge");
    expect(svg).toHaveClass("hb-root", "size-full");
    expect(svg.querySelectorAll("text, a, button, input, [tabindex], title, desc, script, foreignObject, use, image")).toHaveLength(0);
    expect(svg.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
    expect(svg.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
  });

  it("draws the kit's numbers: the same lines, the goods order and the delivered order of the demo", () => {
    const model = modelAt(kitRows("de"), 0);
    const letter = (name: string) => name.slice(0, 1);
    expect(model.byHeadline.map((option) => letter(option.name))).toEqual([...GOODS_ORDER]);
    expect(model.ranked.map((option) => letter(option.name))).toEqual([...DELIVERED_ORDER]);
    for (const row of CONVERGE_ROWS) {
      const option = model.options.find((candidate) => letter(candidate.name) === row.option)!;
      expect(row.goods * 100, row.option).toBe(option.lines.Ware);
      expect(row.added.map((amount) => amount * 100), row.option).toEqual([option.lines.Fracht, option.lines.Einmalig, option.lines.Lager]);
      expect(-row.discount * 100, row.option).toBe(option.lines.Skonto);
    }
  });

  it("stacks the lines a bar has, cuts every discount back and frames the cheapest delivered offer", () => {
    const { container } = render(<ConvergeScene />);
    expect(container.querySelectorAll(".hb-sheet")).toHaveLength(3);
    expect(container.querySelectorAll(".hb-field")).toHaveLength(5);
    expect(container.querySelector(".hb-converge")!.getAttribute("d")!.match(/M/g)).toHaveLength(3);
    expect(container.querySelector(".hb-fan")!.getAttribute("d")!.match(/M/g)).toHaveLength(3);
    expect(container.querySelectorAll(".hb-row")).toHaveLength(3);
    expect(container.querySelectorAll(".hb-row-a .hb-add")).toHaveLength(0);
    expect(container.querySelectorAll(".hb-row-b .hb-add")).toHaveLength(3);
    expect(container.querySelectorAll(".hb-row-c .hb-add")).toHaveLength(1);
    expect(container.querySelectorAll(".hb-neg")).toHaveLength(3);
    const top = (row: string) => Number(container.querySelector(`.hb-row-${row} .hb-goods`)!.getAttribute("y"));
    expect(top("c")).toBeLessThan(top("a"));
    expect(top("a")).toBeLessThan(top("b"));
    const frame = container.querySelector(".hb-win")!;
    const frameTop = Number(frame.getAttribute("y"));
    expect(top("c")).toBeGreaterThan(frameTop);
    expect(top("c")).toBeLessThan(frameTop + Number(frame.getAttribute("height")));
  });

  it("keeps every shape inside the safe area (x 50..550, y 50..450)", () => {
    const { container } = render(<ConvergeScene />);
    for (const shape of container.querySelectorAll("rect")) {
      const x = Number(shape.getAttribute("x"));
      const y = Number(shape.getAttribute("y"));
      expect(x).toBeGreaterThanOrEqual(50);
      expect(x + Number(shape.getAttribute("width"))).toBeLessThanOrEqual(550.5);
      expect(y).toBeGreaterThanOrEqual(50);
      expect(y + Number(shape.getAttribute("height"))).toBeLessThanOrEqual(450);
    }
  });
});

describe("hero-converge source contract", () => {
  it("is a server component with token-only colour and no dash characters", () => {
    expect(SOURCE).not.toMatch(/^["']use client["']/m);
    expect(SOURCE).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect|Reducer|Memo|Callback)\b/);
    expect(SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SOURCE).not.toMatch(/[–—]/);
    expect(SOURCE).not.toMatch(/\bstyle=/);
    const imports = [...SOURCE.matchAll(/^import .* from "([^"]+)";|^import "([^"]+)";/gm)].map((match) => match[1] ?? match[2]);
    expect(imports).toEqual(["react", "./hero-converge.css"]);
  });
});

describe("hero-converge.css", () => {
  it("stays within its size budget, scoped to .hb-root, token colours only", () => {
    expect(Buffer.byteLength(CSS)).toBeLessThanOrEqual(12 * 1024);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS).not.toMatch(/[–—]/);
    expect(CSS).not.toMatch(/gradient|filter|blur|box-shadow|drop-shadow/);
    ROOT.walkRules((rule: Rule) => {
      if ((rule.parent as Container).type === "atrule" && (rule.parent as AtRule).name === "keyframes") return;
      for (const selector of rule.selectors) expect(selector.trim(), selector).toMatch(/^\.hb-/);
    });
    for (const declaration of declarations((d) => /^--hb-/.test(d.prop))) {
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

  it("moves only transform, opacity and stroke-dashoffset, on at most 16 elements, and the base styles are the still frame", () => {
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
    const { container } = render(<ConvergeScene />);
    const nodes = [...container.querySelectorAll("svg *")].filter((node) => [...animated].some((selector) => node.matches(selector)));
    expect(nodes.length).toBeGreaterThan(6);
    expect(nodes.length).toBeLessThanOrEqual(16);
    expect(declarations((d) => d.prop === "will-change")).toHaveLength(0);
    // Outside the motion query nothing hides or moves: the still frame shows the end of the story.
    const still = declarations((d) => (d.prop === "transform" || (d.prop === "opacity" && d.value === "0")) && !inside(d.parent as Container, NO_PREFERENCE));
    expect(still).toHaveLength(0);
  });
});
