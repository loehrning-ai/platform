import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";
import { WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { HERO_MOTION, HeroMotion, heroMotionArt, heroMotionScene } from "./hero-motion";

const DIR = __dirname;
const SLUG = "ki-im-unternehmen-sicher-nutzen";
const SOURCES = ["hero-motion.tsx", "hero-gate-scene.tsx"] as const;
const CSS = readFileSync(join(DIR, "hero-motion.css"), "utf8");
const ROOT = postcss.parse(CSS);
const RULES_ONLY = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

const NO_PREFERENCE = "prefers-reduced-motion: no-preference";
const REDUCE = "prefers-reduced-motion: reduce";
/** The only properties a keyframe may move (docs/experience-system.md, "Hero scenes"). */
const MOVING = new Set(["transform", "opacity", "stroke-dashoffset", "animation-timing-function"]);

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

function renderBoth() {
  const art = heroMotionArt(SLUG, "05");
  expect(art).toBeDefined();
  return render(
    <div>
      <div data-slot="art">{art!.art}</div>
      <div data-slot="art-phone">{art!.artPhone}</div>
    </div>,
  );
}

describe("hero motion registry", () => {
  it("wires only Workshop 05, and only to a workshop that has a poster scene", () => {
    expect(Object.keys(HERO_MOTION)).toEqual([SLUG]);
    expect(heroMotionScene(SLUG)).toBe("gate");
    for (const slug of Object.keys(WORKSHOP_PLAKAT)) {
      if (slug !== SLUG) {
        expect(heroMotionScene(slug), slug).toBeUndefined();
        expect(heroMotionArt(slug, "01"), slug).toBeUndefined();
      }
    }
    for (const slug of Object.keys(HERO_MOTION)) expect(Object.keys(WORKSHOP_PLAKAT)).toContain(slug);
    expect(heroMotionScene("constructor")).toBeUndefined();
  });
});

describe("the gate scene", () => {
  it("renders the lg column and the phone row, decorative and inert", () => {
    const { container } = renderBoth();
    const svgs = [...container.querySelectorAll("svg")];
    expect(svgs.map((svg) => svg.getAttribute("data-hero-variant"))).toEqual(["portrait", "landscape"]);
    expect(svgs.map((svg) => svg.getAttribute("viewBox"))).toEqual(["0 0 400 500", "0 0 640 360"]);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg).toHaveAttribute("data-hero-motion", "gate");
      expect(svg).toHaveClass("hm-root", "size-full");
      // Nothing to focus, click or announce, and nothing that needs an id:
      // both instances sit in one document.
      expect(svg.querySelectorAll("a, button, input, select, textarea, [tabindex], title, desc, script, foreignObject, use, image")).toHaveLength(0);
      expect(svg.querySelectorAll("[id], [href], [onclick], [style]")).toHaveLength(0);
      expect(svg.querySelectorAll("defs, linearGradient, radialGradient, filter, clipPath, mask, pattern")).toHaveLength(0);
      expect(svg.querySelector("text")).toHaveTextContent("05");
    }
  });

  it("draws no figure when no numeral is passed", () => {
    const { container } = render(<HeroMotion scene="gate" variant="portrait" />);
    expect(container.querySelector("text")).toBeNull();
  });

  it("tells the story with three cards, three lamps and the ring, the same parts in both layouts", () => {
    const { container } = renderBoth();
    for (const svg of container.querySelectorAll("svg")) {
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
      // The scene draws no word but the figure.
      expect([...svg.querySelectorAll("text")].map((text) => text.textContent)).toEqual(["05"]);
    }
  });

  it("keeps every part inside its canvas, so nothing shifts the layout", () => {
    const { container } = renderBoth();
    for (const svg of container.querySelectorAll("svg")) {
      const [, , width, height] = (svg.getAttribute("viewBox") ?? "").split(" ").map(Number);
      for (const shape of svg.querySelectorAll(".hm-screen, .hm-housing, .hm-base")) {
        const x = Number(shape.getAttribute("x"));
        const y = Number(shape.getAttribute("y"));
        expect(x, shape.getAttribute("class") ?? "").toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + Number(shape.getAttribute("width") ?? 0)).toBeLessThanOrEqual(width);
        expect(y + Number(shape.getAttribute("height") ?? 0)).toBeLessThanOrEqual(height);
      }
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
    expect(readFileSync(join(DIR, "hero-motion.tsx"), "utf8")).toContain('import "./hero-motion.css";');
  });
});

describe("hero-motion.css", () => {
  it("keeps every animation, transition and keyframe under no-preference", () => {
    const moving = declarations((declaration) => /^(?:animation|transition)/.test(declaration.prop));
    expect(moving.length).toBeGreaterThan(20);
    for (const declaration of moving) {
      const allowed = inside(declaration.parent as Container, NO_PREFERENCE) || inside(declaration.parent as Container, REDUCE);
      expect(allowed, `${declaration.parent && "selector" in declaration.parent ? (declaration.parent as Rule).selector : ""} { ${declaration.prop} }`).toBe(true);
    }
    const keyframes: AtRule[] = [];
    ROOT.walkAtRules("keyframes", (rule) => {
      keyframes.push(rule);
    });
    expect(keyframes.length).toBeGreaterThan(20);
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
    // Ripples, the shield, the scan and the wash only exist in the story.
    for (const selector of [".hm-ripple", ".hm-shield", ".hm-scan", ".hm-wash", ".hm-pulse", ".hm-spoke"]) {
      let opacity = "";
      for (const rule of base(selector)) {
        rule.walkDecls("opacity", (declaration) => {
          opacity = declaration.value;
        });
      }
      expect(opacity, selector).toBe("0");
    }
  });

  it("starts the story after the intro and runs one 9 second loop with a shared clock", () => {
    const loops = declarations((declaration) => declaration.prop === "animation" && declaration.value.includes("var(--hm-go)"));
    expect(loops.length).toBeGreaterThanOrEqual(15);
    for (const declaration of loops) {
      expect(declaration.value, declaration.value).toMatch(/\b9s\b.*\binfinite\b.*\bbackwards\b/);
    }
  });

  it("switches the lane per layout and hides the costly detail on the narrowest phones", () => {
    expect(CSS).toMatch(/\[data-hero-variant="portrait"\][^{]*\{[^}]*--hm-ly:\s*300px/s);
    expect(CSS).toMatch(/\[data-hero-variant="landscape"\][^{]*\{[^}]*--hm-lx:\s*444px/s);
    expect(CSS).toMatch(/@media \(width < 22\.5rem\)[^{]*\{[^}]*\.hm-ripple[^}]*\.hm-cursor[^}]*display:\s*none/s);
  });

  it("reacts to the pointer with CSS only, scoped to the band", () => {
    const hover = rules((rule) => rule.selector.includes(":hover"));
    expect(hover.length).toBeGreaterThanOrEqual(3);
    for (const rule of hover) {
      expect(rule.selector).toMatch(/^\[data-cover-band\]:is\(:hover, :focus-within\) \.hm-/);
      rule.walkDecls((declaration) => expect(declaration.prop).toBe("transform"));
    }
  });
});
