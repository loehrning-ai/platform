import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { HERO_MOTION, HeroMotion, heroMotionScene, isHeroSceneWired, renderHeroScene } from "./hero-motion";

const DIR = __dirname;
const SLUG = "audit-vorbereitung-mit-ki";
const SOURCES = ["hero-motion.tsx", "hero-links-scene.tsx"] as const;
const SCENE_KEYS = ["cone", "trace", "mend", "weave", "links"];

describe("hero motion registry", () => {
  it("maps all five workshops to one scene key each, and each slug to a workshop that has a poster", () => {
    expect(Object.keys(HERO_MOTION).sort()).toEqual(Object.keys(WORKSHOP_PLAKAT).sort());
    expect(Object.values(HERO_MOTION).sort()).toEqual([...SCENE_KEYS].sort());
    for (const slug of Object.keys(WORKSHOP_PLAKAT)) {
      expect(heroMotionScene(slug), slug).toBe(HERO_MOTION[slug]);
    }
    expect(heroMotionScene(SLUG)).toBe("links");
    expect(heroMotionScene("constructor")).toBeUndefined();
    expect(heroMotionScene("not-a-workshop")).toBeUndefined();
  });

  it("renders a wired scene into the stage and nothing for a scene that is not wired yet", () => {
    expect(isHeroSceneWired("links")).toBe(true);
    const { container } = render(<div>{renderHeroScene(SLUG)}</div>);
    expect(container.querySelectorAll("svg[data-hero-motion='links']")).toHaveLength(1);
    // Every wired scene renders; every unwired one renders nothing and is not claimed by the stage.
    for (const key of SCENE_KEYS as ("cone" | "trace" | "mend" | "weave" | "links")[]) {
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
    expect(readFileSync(join(DIR, "hero-links-scene.tsx"), "utf8")).toContain('import "./hero-links.css";');
  });
});
