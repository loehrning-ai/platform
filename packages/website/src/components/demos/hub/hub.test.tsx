import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_SLUGS } from "@/lib/demos";
import { compileAllCss, sample } from "@/lib/demo-tiles/motion";
import { MAX_STORY_MS, type TileMotion } from "@/lib/demo-tiles/types";
import { DemoTileStage } from "./demo-tile-stage";
import { TILES } from "./tiles";

const WEBSITE = join(__dirname, "../../../..");
const GENERATED = readFileSync(join(__dirname, "tile-scenes.css"), "utf8");
const HAND_CSS = readFileSync(join(__dirname, "demo-tile.css"), "utf8");
const HAND_RULES = HAND_CSS.replace(/\/\*[\s\S]*?\*\//g, "");

async function motionOf(slug: string): Promise<TileMotion> {
  return (await import(`../${slug}/tile-motion.ts`)).MOTION as TileMotion;
}

describe("hub tile scenes", () => {
  it("commits the css the tracks compile to (run `bun run demo-tiles:generate`)", async () => {
    const scenes = await Promise.all(
      DEMO_SLUGS.map(async (slug, index) => ({ scene: `w0${index + 1}`, motion: await motionOf(slug) })),
    );
    expect(GENERATED).toBe(compileAllCss(scenes));
  });

  it("holds the still frame equal to the end frame, in the motion budget, on allowed properties", async () => {
    for (const slug of DEMO_SLUGS) {
      const motion = await motionOf(slug);
      expect(motion.storyMs, slug).toBeLessThanOrEqual(MAX_STORY_MS);
      for (const track of motion.tracks) {
        const last = track.keys[track.keys.length - 1];
        expect(sample(track, 1), `${slug}/${track.id}/${track.prop}`).toBe(last?.[1]);
        expect(["tx", "ty", "sx", "sy", "o", "dash"]).toContain(track.prop);
        expect(track.keys[0]?.[0], `${slug}/${track.id}`).toBe(0);
        const times = track.keys.map((key) => key[0]);
        expect(times, `${slug}/${track.id}`).toEqual([...times].sort((a, b) => a - b));
      }
    }
  });

  it("generates css with nothing but transform-like properties, no gradient, filter or colour", () => {
    expect(GENERATED).not.toMatch(/gradient|filter|blur|box-shadow|#[0-9a-f]{3,8}\b|rgb\(|transition/i);
    const properties = new Set(
      [...GENERATED.matchAll(/(?:^|[{;]\s*)([a-z-]+)\s*:/gm)].map((match) => match[1]),
    );
    for (const property of properties) {
      expect(
        [
          "translate", "scale", "opacity", "stroke-dashoffset", "transform-box", "transform-origin",
          "animation-name", "animation-duration", "animation-timing-function", "animation-fill-mode",
          "animation-play-state", "animation-delay", "--tile-t",
        ],
        `property ${property}`,
      ).toContain(property);
    }
    // Every animation rule and keyframe sits in the no-preference, screen-only query.
    const outside = GENERATED.replace(/@media screen and \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/g, "");
    expect(outside).not.toMatch(/@keyframes|animation/);
  });

  it("draws every track target and no text but figures, in both languages, within the size budget", async () => {
    let total = "";
    for (const slug of DEMO_SLUGS) {
      const Tile = TILES[slug];
      const motion = await motionOf(slug);
      for (const locale of ["de", "en"] as const) {
        const markup = renderToStaticMarkup(<Tile locale={locale} />);
        total += markup;
        expect(markup, slug).toContain('aria-hidden="true"');
        expect(markup, slug).toContain('viewBox="0 0 400 300"');
        for (const id of new Set(motion.tracks.map((track) => track.id))) {
          expect(markup, `${slug} draws ${id}`).toContain(`data-t="${id}"`);
        }
        const texts = [...markup.matchAll(/<text\b[^>]*>/g)].map((match) => match[0]);
        for (const tag of texts) expect(tag, slug).toContain("dt-fig");
        expect(markup, slug).not.toMatch(/gradient|filter|<animate|<style|#[0-9a-f]{6}\b/i);
        expect(markup.length, `${slug} ${locale}`).toBeLessThan(3600);
        // Reduced motion hook for a demo hero that mounts the same tile.
        expect(renderToStaticMarkup(<Tile locale={locale} reducedMotion />)).toContain("data-reduced");
      }
    }
    expect(gzipSync(total + GENERATED + HAND_CSS).length).toBeLessThan(12 * 1024);
  });

  it("formats the figures for the language", () => {
    const Tile = TILES["ki-prognosen-einschaetzen"];
    // W01: the hook, the tool's claim against "same as last week" with the same formula.
    const de = renderToStaticMarkup(<Tile locale="de" />);
    const en = renderToStaticMarkup(<Tile locale="en" />);
    expect(de).toContain(">94,2\u00a0%<");
    expect(de).toContain(">92,6\u00a0%<");
    expect(en).toContain(">94.2\u00a0%<");
    expect(en).toContain(">92.6\u00a0%<");
    expect(de).not.toContain(">748<");
  });
});

describe("hub styles", () => {
  it("draws Glas tiles without any filter, with explicit transitions and fine-pointer hover", () => {
    // Frost: six tiles cost zero live filters, so no backdrop-filter, filter or gradient here.
    expect(HAND_RULES).not.toMatch(/backdrop-filter|filter:|gradient|transition:\s*all/);
    expect(HAND_CSS).toMatch(/\.dt-card \{[^}]*border-radius: 28px/);
    expect(HAND_CSS).toMatch(/\.dt-cap \{[^}]*border-radius: 20px/);
    expect(HAND_CSS).toMatch(/@media \(hover: hover\) and \(pointer: fine\)/);
    expect(HAND_CSS).toMatch(/\.dt-item:has\(\.dt-link:focus-visible\)/);
    expect(HAND_CSS).toMatch(/prefers-reduced-transparency: reduce/);
    const transitions = [...HAND_CSS.matchAll(/transition:[^;]+;/g)].map((match) => match[0]);
    expect(transitions.length).toBeGreaterThan(0);
    // Only transform and opacity move; a shadow never animates.
    for (const transition of transitions) {
      expect(transition).toMatch(/transform/);
      expect(transition).not.toMatch(/box-shadow/);
    }
    // Transitions only without a reduced-motion request.
    const motionBlock = HAND_CSS.slice(HAND_CSS.indexOf("@media (prefers-reduced-motion: no-preference)"));
    expect(motionBlock).toContain("transition:");
    expect(HAND_CSS.slice(0, HAND_CSS.indexOf("@media (prefers-reduced-motion: no-preference)"))).not.toContain(
      "transition:",
    );
  });

  it("never lets the hub import a demo component or its css", () => {
    const page = readFileSync(join(WEBSITE, "src/app/demos/page.tsx"), "utf8");
    // The shared Glas design system is allowed; no demo's own folder is.
    expect(page).not.toMatch(/components\/demos\/(?!hub\/|glas\/)[a-z-]+\//);
  });
});

describe("DemoTileStage", () => {
  type Observed = { callback: IntersectionObserverCallback; elements: Element[] };
  let observers: Observed[] = [];
  let reduce = false;

  beforeEach(() => {
    observers = [];
    reduce = false;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        readonly record: Observed;
        constructor(callback: IntersectionObserverCallback) {
          this.record = { callback, elements: [] };
          observers.push(this.record);
        }
        observe(element: Element) {
          this.record.elements.push(element);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes("reduce") ? reduce : query.includes("hover: hover"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const list = () => (
    <DemoTileStage label="Demos" className="dt-grid">
      <li data-dt-tile="" className="dt-item" data-scene="w01">
        <a href="/x">one</a>
      </li>
      <li data-dt-tile="" className="dt-item" data-scene="w02">
        <a href="/y">two</a>
      </li>
    </DemoTileStage>
  );

  it("arms the tiles and plays one when it is first seen", () => {
    const { container } = render(list());
    const tiles = container.querySelectorAll("[data-dt-tile]");
    expect(tiles[0]).toHaveClass("is-armed");
    expect(tiles[0]).not.toHaveClass("is-playing");
    const record = observers[0] as Observed;
    act(() => {
      record.callback(
        [{ isIntersecting: true, target: tiles[0] } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(tiles[0]).toHaveClass("is-playing");
    expect(tiles[1]).not.toHaveClass("is-playing");
  });

  it("leaves the end frame alone for reduced motion", () => {
    reduce = true;
    const { container } = render(list());
    expect(container.querySelector(".is-armed, .is-playing")).toBeNull();
    expect(observers).toHaveLength(0);
  });
});
