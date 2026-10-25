import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { GateScene } from "./hero-gate-scene";
import { HERO_MOTION, HeroMotion, heroMotionScene, isHeroSceneWired, renderHeroScene } from "./hero-motion";

const SLUG = "ki-im-unternehmen-sicher-nutzen";
const SCENE_KEYS = ["cone", "trace", "mend", "weave", "gate"];

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
});
