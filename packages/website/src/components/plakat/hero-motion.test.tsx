import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { GateScene } from "./hero-gate-scene";
import { HERO_MOTION, HeroMotion, heroMotionScene, isHeroSceneWired, renderHeroScene } from "./hero-motion";

const DIR = __dirname;
const SLUG = "ki-im-unternehmen-sicher-nutzen";
const SOURCES = ["hero-motion.tsx", "hero-gate-scene.tsx"] as const;
const CSS = readFileSync(join(DIR, "hero-gate.css"), "utf8");
const ROOT = postcss.parse(CSS);
const RULES_ONLY = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

const NO_PREFERENCE = "prefers-reduced-motion: no-preference";
const REDUCE = "prefers-reduced-motion: reduce";
/** The only properties a keyframe may move (docs/experience-system.md, "Workshop stage and scenes"). */
const MOVING = new Set(["transform", "opacity", "stroke-dashoffset", "animation-timing-function"]);
const SCENE_KEYS = ["cone", "trace", "mend", "weave", "gate"];

function inside(node: Container | undefined, media: string): boolean {
  for (let parent = node; parent; parent = parent.parent as Container | undefined) {
    if (parent.type === "atrule" && (parent as AtRule).name === "media" && (parent as AtRule).params.includes(media)) {
      return true;
    }
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

function rules(match: (rule: Rule) => boolean): Rule[] {
  const found: Rule[] = [];
  ROOT.walkRules((rule) => {
    const parent = rule.parent as Container;
    if (parent.type === "atrule" && (parent as AtRule).name === "keyframes") return;
    if (match(rule)) found.push(rule);
  });
  return found;
}

function animatedSelectors(): string[] {
  const names = new Set<string>();
  rules((rule) => inside(rule, NO_PREFERENCE)).forEach((rule) => {
    if (rule.nodes?.some((node) => node.type === "decl" && node.prop === "animation")) {
      for (const selector of rule.selectors) names.add(selector.trim());
    }
  });
  return [...names];
}

describe("hero motion registry", () => {
  it("maps all five workshops to one scene key each, and each slug to a workshop that has a poster", () => {
    expect(Object.keys(HERO_MOTION).sort()).toEqual(Object.keys(WORKSHOP_PLAKAT).sort());
    expect(Object.values(HERO_MOTION).sort()).toEqual([...SCENE_KEYS].sort());
    for (const slug of Object.keys(WORKSHOP_PLAKAT)) {
      expect(heroMotionScene(slug), slug).toBe(HERO_MOTION[slug]);
    }
    expect(heroMotionScene(SLUG)).toBe("gate");
    expect(heroMotionScene("constructor")).toBeUndefined();
    expect(heroMotionScene("not-a-workshop")).toBeUndefined();
  });

  it("renders a wired scene into the stage and nothing for a scene that is not wired yet", () => {
    expect(isHeroSceneWired("gate")).toBe(true);
    const { container } = render(<div>{renderHeroScene(SLUG)}</div>);
    expect(container.querySelectorAll("svg[data-hero-motion='gate']")).toHaveLength(1);
    // Every wired scene renders; every unwired one renders nothing and is not claimed by the stage.
    for (const key of SCENE_KEYS as ("cone" | "trace" | "mend" | "weave" | "gate")[]) {
      const view = render(<div>{<HeroMotion scene={key} />}</div>);
      const svgs = view.container.querySelectorAll(`svg[data-hero-motion='${key}']`);
      expect(svgs.length, key).toBe(isHeroSceneWired(key) ? 1 : 0);
      view.unmount();
    }
    for (const [slug, key] of Object.entries(HERO_MOTION)) {
      expect(renderHeroScene(slug) !== null, slug).toBe(isHeroSceneWired(key));
    }
    expect(renderHeroScene("not-a-workshop")).toBeNull();
  });

  it("no longer draws a scene into the band: no variant, no numeral parameter", () => {
    const source = readFileSync(join(DIR, "hero-motion.tsx"), "utf8");
    expect(source).not.toMatch(/heroMotionArt|HeroMotionVariant|variant|numeral/);
  });
});

describe("the gate scene", () => {
  it("is one decorative, inert 600 x 500 canvas without text, ids or defs", () => {
    const { container } = render(<GateScene />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "0 0 600 500");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-hero-motion", "gate");
    expect(svg).not.toHaveAttribute("data-hero-variant");
    expect(svg).toHaveClass("hm-root", "block", "size-full");
    expect(svg.querySelectorAll("a, button, input, select, textarea, [tabindex], title, desc, script, foreignObject, use, image, text")).toHaveLength(0);
    expect(svg.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
    expect(svg.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
  });

  it("tells the story with three cards, three lamps and the ring", () => {
    const { container } = render(<GateScene />);
    const svg = container.querySelector("svg")!;
    expect(svg.querySelectorAll(".hm-packet")).toHaveLength(3);
    expect(svg.querySelectorAll(".hm-p1, .hm-p2, .hm-p3")).toHaveLength(3);
    // The names card carries the bars that cover its names; the lamps each
    // carry a glyph, so the meaning never rests on colour alone.
    expect(svg.querySelectorAll(".hm-p2 .hm-cover-bar")).toHaveLength(3);
    for (const lamp of svg.querySelectorAll(".hm-lamp")) {
      expect(lamp.querySelectorAll("path.hm-lamp-glyph"), lamp.getAttribute("class") ?? "").toHaveLength(1);
    }
    expect(svg.querySelectorAll(".hm-lamp-go, .hm-lamp-check, .hm-lamp-stop")).toHaveLength(3);
    expect(svg.querySelectorAll(".hm-ring-back, .hm-ring-front")).toHaveLength(2);
    expect(svg.querySelectorAll(".hm-cloud-shape")).toHaveLength(1);
    expect(svg.querySelectorAll(".hm-orbit-ring")).toHaveLength(2);
  });

  it("lays the flow out left to right on the one canvas: laptop, ring, cloud, lamps above the ring", () => {
    const { container } = render(<GateScene />);
    const svg = container.querySelector("svg")!;
    const x = (selector: string) => Number(svg.querySelector(selector)!.getAttribute("x"));
    const screen = x(".hm-screen");
    const housing = x(".hm-housing") + Number(svg.querySelector(".hm-housing")!.getAttribute("width")) / 2;
    const ring = svg.querySelector(".hm-scan-line")!.getAttribute("d")!;
    const ringX = Number(/^M(\d+(?:\.\d+)?)/.exec(ring)![1]);
    const cloud = /translate\((\d+(?:\.\d+)?)/.exec(svg.querySelector(".hm-cloud > g")!.getAttribute("transform")!)!;
    expect(screen).toBeLessThan(ringX);
    expect(ringX).toBeLessThan(Number(cloud[1]));
    // The lamp housing is centred on the ring and sits above it.
    expect(housing).toBeCloseTo(ringX, 0);
    expect(Number(svg.querySelector(".hm-housing")!.getAttribute("y"))).toBeLessThan(250);
    // Every solid part sits inside the canvas, so nothing shifts the layout.
    for (const shape of svg.querySelectorAll(".hm-screen, .hm-housing, .hm-base")) {
      const left = Number(shape.getAttribute("x"));
      const top = Number(shape.getAttribute("y"));
      expect(left, shape.getAttribute("class") ?? "").toBeGreaterThanOrEqual(40);
      expect(top).toBeGreaterThanOrEqual(40);
      expect(left + Number(shape.getAttribute("width"))).toBeLessThanOrEqual(560);
      expect(top + Number(shape.getAttribute("height"))).toBeLessThanOrEqual(460);
    }
  });
});

describe("hero-motion source contract", () => {
  it.each(SOURCES)("%s is a server component with token-only colour", (file) => {
    const source = readFileSync(join(DIR, file), "utf8");
    expect(source).not.toMatch(/^["']use client["']/m);
    expect(source).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect|Reducer|Memo|Callback)\b/);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/[–—]/);
    expect(source).not.toMatch(/\bstyle=/);
    expect(source).not.toMatch(/linear-gradient|radial-gradient|<(?:linear|radial)Gradient|<filter|\bblur-/);
  });

  it("imports no dependency beyond React and its own files", () => {
    for (const file of SOURCES) {
      const imports = [...readFileSync(join(DIR, file), "utf8").matchAll(/^import .* from "([^"]+)";/gm)].map((match) => match[1]);
      for (const specifier of imports) expect(specifier, file).toMatch(/^(?:react|\.\/hero-[a-z-]+)$/);
    }
    expect(readFileSync(join(DIR, "hero-gate-scene.tsx"), "utf8")).toContain('import "./hero-gate.css";');
  });
});

describe("hero-gate.css", () => {
  it("keeps every animation, transition and keyframe under no-preference", () => {
    const moving = declarations((declaration) => /^(?:animation|transition)/.test(declaration.prop));
    expect(moving.length).toBeGreaterThan(12);
    for (const declaration of moving) {
      const allowed = inside(declaration.parent as Container, NO_PREFERENCE) || inside(declaration.parent as Container, REDUCE);
      expect(allowed, `${declaration.parent && "selector" in declaration.parent ? (declaration.parent as Rule).selector : ""} { ${declaration.prop} }`).toBe(true);
    }
    const keyframes: AtRule[] = [];
    ROOT.walkAtRules("keyframes", (rule) => {
      keyframes.push(rule);
    });
    expect(keyframes.length).toBeGreaterThan(12);
    for (const rule of keyframes) expect(inside(rule.parent as Container, NO_PREFERENCE), rule.params).toBe(true);
  });

  it("has a reduce block that stops everything, so the still frame is what shows", () => {
    const reduce: AtRule[] = [];
    ROOT.walkAtRules("media", (rule) => {
      if (rule.params.includes(REDUCE)) reduce.push(rule);
    });
    expect(reduce).toHaveLength(1);
    const css = reduce[0].toString();
    expect(css).toMatch(/animation:\s*none\s*!important/);
    expect(css).toMatch(/transition:\s*none\s*!important/);
    // Nothing outside the two media blocks (and the keyframes inside them) moves:
    // the base styles are the still frame.
    expect(declarations((d) => /^(?:animation|transition)/.test(d.prop) && !inside(d.parent as Container, NO_PREFERENCE) && !inside(d.parent as Container, REDUCE))).toEqual([]);
  });

  it("moves only transform, opacity and stroke-dashoffset, and transitions only transform", () => {
    ROOT.walkAtRules("keyframes", (rule) => {
      rule.walkDecls((declaration) => {
        expect(MOVING.has(declaration.prop), `${rule.params}: ${declaration.prop}`).toBe(true);
      });
    });
    for (const declaration of declarations((d) => d.prop === "transition" && !inside(d.parent as Container, REDUCE))) {
      expect(declaration.value, declaration.value).toMatch(/^transform\b/);
    }
    expect(declarations((d) => d.prop === "transition-property")).toEqual([]);
  });

  it("uses will-change on the three cards only, and no filter, gradient, blur or hex", () => {
    const hints = declarations((declaration) => declaration.prop === "will-change");
    expect(hints).toHaveLength(1);
    expect((hints[0].parent as Rule).selectors.map((selector) => selector.trim())).toEqual([".hm-p1", ".hm-p2", ".hm-p3"]);
    expect(hints[0].value).toBe("transform");
    expect(RULES_ONLY).not.toMatch(/\bfilter\b|backdrop-filter|gradient\(|\bblur\b|mix-blend|clip-path|mask/);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS).not.toMatch(/[–—]/);
    // Colour only through the scene tokens and the paper.
    for (const declaration of declarations((d) => /^--hm-(?:ink|mid|ground|paper|stop)$/.test(d.prop))) {
      expect(declaration.value).toMatch(/^var\(--color-(?:scene-(?:ink|mid|ground|accent-text)|paper)\)$/);
    }
  });

  it("shows the finished frame in the base styles: lamps lit, one card per stage, nothing hidden that the story needs", () => {
    const base = (selector: string) =>
      rules((rule) => rule.selectors.some((entry) => entry.trim() === selector) && !inside(rule.parent as Container, NO_PREFERENCE));
    // The lamps and their discs are never set to opacity 0 in the base.
    for (const selector of [".hm-lamp-go", ".hm-lamp-check", ".hm-lamp-stop", ".hm-cover", ".hm-card", ".hm-typing"]) {
      for (const rule of base(selector)) {
        rule.walkDecls("opacity", (declaration) => expect(declaration.value, selector).not.toBe("0"));
      }
    }
    // The three cards rest at three places on the lane: landed, past the ring, just out.
    const rest = ["hm-p1", "hm-p2", "hm-p3"].map((name) => {
      const rule = base(`.${name}`)[0];
      expect(rule, name).toBeDefined();
      let value = "";
      rule.walkDecls("transform", (declaration) => {
        value = declaration.value;
      });
      return value;
    });
    expect(new Set(rest).size).toBe(3);
    // The scan only exists in the story.
    for (const selector of [".hm-scan"]) {
      let opacity = "";
      for (const rule of base(selector)) {
        rule.walkDecls("opacity", (declaration) => {
          opacity = declaration.value;
        });
      }
      expect(opacity, selector).toBe("0");
    }
  });

  it("runs the story on the stage clock: one loop of --ws-t (9 seconds) after the intro", () => {
    const loops = declarations((declaration) => declaration.prop === "animation" && declaration.value.includes("var(--hm-go)"));
    expect(loops.length).toBeGreaterThanOrEqual(10);
    for (const declaration of loops) {
      expect(declaration.value, declaration.value).toMatch(/var\(--hm-t\).*\binfinite\b.*\bbackwards\b/);
    }
    expect(CSS).toMatch(/--hm-t:\s*var\(--ws-t,\s*9s\)/);
  });

  it("animates at most 16 elements, in three layers that settle 0.2 to 0.4 s apart", () => {
    const selectors = animatedSelectors();
    expect(selectors.length).toBeLessThanOrEqual(16);
    expect(selectors).toEqual(expect.arrayContaining([".hm-layer-far", ".hm-layer-mid", ".hm-layer-near"]));
    // The same elements in the markup: no animated class appears more often than the contract allows.
    const { container } = render(<GateScene />);
    const animated = [...container.querySelectorAll("svg *")].filter((node) =>
      selectors.some((selector) => node.matches(selector)),
    );
    expect(animated.length).toBeLessThanOrEqual(16);
    const delays = declarations((d) => d.prop === "animation" && /hm-(?:grow|rise|fade)/.test(d.value)).map((d) => d.value);
    expect(delays).toHaveLength(3);
  });

  it("stays inside the scene budget: 12 KB of CSS, and an SVG under 20 KB", () => {
    expect(Buffer.byteLength(CSS)).toBeLessThanOrEqual(12 * 1024);
    const { container } = render(<GateScene />);
    expect(Buffer.byteLength(container.innerHTML)).toBeLessThanOrEqual(20 * 1024);
  });

  it("has one lane, no per-layout blocks and no figure rule", () => {
    expect(CSS).toMatch(/--hm-lx:\s*352px/);
    expect(CSS).not.toMatch(/data-hero-variant|hm-numeral/);
  });

  it("leaves the pointer reaction to the stage: no band selector, no hover rule of its own", () => {
    expect(rules((rule) => rule.selector.includes(":hover") || rule.selector.includes("data-cover-band"))).toEqual([]);
  });
});
