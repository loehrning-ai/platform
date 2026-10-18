import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

function read(relativePath: string): string {
  return readFileSync(join(SRC, relativePath), "utf8");
}

function productionSources(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : productionSources(absolute);
    }
    return /\.(?:css|ts|tsx)$/.test(entry.name) &&
      !/\.(?:test|spec)\.(?:ts|tsx)$/.test(entry.name)
      ? [readFileSync(absolute, "utf8")]
      : [];
  });
}

describe("website motion policy", () => {
  it("never transitions every property in production source", () => {
    const source = productionSources(SRC).join("\n");

    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/transition\s*:\s*["']all\b/);
    expect(source).not.toMatch(/transition\s*:\s*all\b/);
  });

  it("removes ambient blog ticker, pulse, scroll-hint, and reveal motion", () => {
    const blogIndex = read("app/blog/_styles/blog-index.css");
    const blogArchive = read("app/blog/_styles/blog.css");
    const post = read("app/blog/_styles/post.css");
    const page = read("app/blog/page.tsx");
    const postPage = read("app/blog/eu-ai-act-grundlagen/page.tsx");
    const heroDe = read("app/blog/eu-ai-act-grundlagen/_sections/hero.tsx");
    const heroEn = read("app/blog/eu-ai-act-grundlagen/_sections/en/hero.tsx");

    expect(blogIndex).not.toMatch(/runline|animation:[^;]*infinite/);
    expect(blogArchive).not.toContain("data-scroll-reveal");
    expect(post).not.toMatch(/hero__scroll|scrollHint/);
    expect(post).not.toContain("data-scroll-reveal");
    expect(post).not.toContain("word-reveal");
    expect(page).not.toMatch(/Runline|runlineStatus/);
    expect(postPage).not.toContain("ScrollReveal");
    expect(heroDe).not.toContain("hero__scroll");
    expect(heroEn).not.toContain("hero__scroll");
  });

  it("keeps the global reduced-motion fallback static", () => {
    const globalCss = read("app/globals.css");
    expect(globalCss).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(globalCss).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(globalCss).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });

  it("gives the globe intrinsic neutral volume without a coloured hero wash", () => {
    const globalCss = read("app/globals.css");
    const hero = read("components/home/hero.tsx");
    const band = read("components/home/phone-hero.css");
    const network = read("components/home/hero-network.tsx");
    const frame = read("components/home/hero-globe-frame.tsx");
    const heroRule = globalCss.match(/\.berlin-hero\s*\{[^}]*\}/s)?.[0] ?? "";

    // The hero is the paper hero at every width: paper ground, no tinted
    // wash, and the phone band never recolours it (no graphit band).
    expect(hero).toContain("berlin-hero");
    expect(heroRule).toContain("background: var(--color-paper)");
    expect(heroRule).not.toMatch(
      /169\s*,\s*221\s*,\s*252|203\s*,\s*188\s*,\s*255/,
    );
    expect(band).not.toMatch(/--color-background\s*:/);
    expect(band).not.toMatch(/background[^;]*#(?:000|111|141414|1a1a1a)\b/i);
    expect(band).not.toMatch(
      /169\s*,\s*221\s*,\s*252|203\s*,\s*188\s*,\s*255/,
    );
    expect(hero).not.toContain("bg-brand-peach/20");
    // Volume comes from one warm-neutral radial gradient, on the live globe
    // and on the phone's server frame alike; no limb halo.
    expect(network).toContain("<radialGradient id={ids.volume}");
    expect(frame).toContain("<radialGradient id={`${ID}-volume`}");
    expect(network).not.toContain("limbHalo");
    expect(frame).not.toContain("limbHalo");
  });

  it("stops formerly ambient demos after one finite explanatory run", () => {
    for (const file of [
      "components/demos/cost-drift-observability-demo.tsx",
      "components/demos/n8n-supply-chain-demo.tsx",
    ]) {
      expect(read(file)).not.toContain("setInterval(");
    }

    expect(read("components/demos/rechnung-zu-sap-demo.tsx")).not.toContain(
      "setStage(0), 8500",
    );
    expect(read("components/demos/agent-pipeline-demo.tsx")).not.toContain(
      "const restart",
    );
    expect(read("components/demos/outbound-workflow-demo.tsx")).not.toContain(
      "setLeadIdx",
    );
    expect(read("components/demos/excel-demo.tsx")).not.toMatch(
      /usePhasedLoop|Auto-Play/,
    );

    const observability = read("components/ai-native/demos/observ-demo.tsx");
    expect(observability).toContain("if (!running) return");
    expect(observability).toContain("completedSteps >= OBSERVATION_STEPS");
    expect(observability).toContain("aria-pressed={running}");
  });

  it("keeps selected pipeline and scanner signals finite", () => {
    const courseCss = read(
      "components/data-engineering-fundamentals/de-course.css",
    );

    expect(courseCss).not.toMatch(/lp-pulse-ring[^;]*\binfinite\b/);
    expect(courseCss).not.toMatch(/sc-col-pulse[^;]*\binfinite\b/);
    expect(courseCss).not.toMatch(
      /\.cap-(?:ship-cursor|2-trace-spin)\s*\{[^}]*\banimation\s*:/s,
    );
  });

  it("bounds the homepage globe continuous-motion exception", () => {
    const hero = read("components/home/hero.tsx");
    const toggle = read("components/home/globe-toggle.tsx");
    const network = read("components/home/hero-network.tsx");
    const policy = readFileSync(
      join(SRC, "..", "docs/experience-system.md"),
      "utf8",
    );

    expect(hero).not.toContain("setGlobeSettled(true)");
    expect(hero).toContain('import("@/components/home/hero-network")');
    expect(hero).toContain('networkMode === "desktop"');
    // Mounted on the same rem query as Tailwind lg and the phone renderer.
    expect(hero).toContain("window.matchMedia(LG_QUERY)");
    expect(hero).not.toContain("(min-width: 1024px)");
    // One visible pause control beside the action; no invisible surface
    // button over the globe. Fixed name, pressed state.
    expect(hero).not.toContain("data-hero-globe-surface-control");
    expect(hero).toContain('controls="home-hero-network"');
    expect(hero).toContain("paused={networkPaused}");
    expect(toggle).toContain("data-hero-globe-toggle");
    expect(toggle).toContain("aria-pressed={paused}");
    expect(toggle).toContain("aria-controls={controls}");
    expect(hero).toContain("data-hero-globe-motion");
    expect(network).toContain(
      'window.matchMedia("(prefers-reduced-motion: reduce)")',
    );
    expect(network).toContain("IntersectionObserver");
    expect(network).toContain('frozen?.on("change"');
    expect(network).toContain('document.addEventListener("visibilitychange"');
    expect(network).toContain("HERO_GLOBE_FPS = 60");
    expect(network).toContain("HERO_GLOBE_STEP_SECONDS = 7");
    expect(network).toContain("HERO_GLOBE_DWELL_RATIO = 0.78");
    expect(network).toContain("HERO_GLOBE_START_DELAY_SECONDS = 2");
    expect(network).not.toContain("HERO_GLOBE_AMBIENT_FPS");
    expect(network).toContain("data-hero-network-motion");
    expect(policy).toContain(
      "Homepage globe: narrow continuous-motion exception",
    );
    expect(policy).toContain(
      "The desktop composition is not rendered below lg",
    );
    expect(policy).toContain(
      "A visible 44px pause control sits beside the primary action whenever the globe moves",
    );
  });

  it("bounds the phone globe exception", () => {
    const hero = read("components/home/hero.tsx");
    const loader = read("components/home/phone-globe.tsx");
    const frame = read("components/home/hero-globe-frame.tsx");
    const network = read("components/home/hero-network.tsx");
    const css = read("components/home/phone-hero.css");
    const policy = readFileSync(
      join(SRC, "..", "docs/experience-system.md"),
      "utf8",
    );

    // Its own slot and state namespace, decorative and never focusable.
    expect(hero).toContain("data-home-globe-motion={phoneGlobeState.state}");
    expect(hero).toMatch(/id="home-phone-globe"[\s\S]{0,200}aria-hidden="true"/);
    // The first frame is server-rendered SVG, and the whole globe for every
    // visitor who does not get motion.
    expect(frame).not.toContain('"use client"');
    expect(frame).toContain("data-home-globe-ssr");
    // The projection is a lazy chunk, gated on width, motion, data and
    // Save-Data, requested only after load plus an idle callback.
    expect(hero).not.toMatch(/^import[^;]*from "@\/components\/home\/hero-network";/m);
    expect(loader).toContain('import("@/components/home/hero-network")');
    expect(loader).toContain('export const LG_QUERY = "(min-width: 64rem)"');
    expect(loader).toContain('"(prefers-reduced-motion: reduce)"');
    expect(loader).toContain('"(prefers-reduced-data: reduce)"');
    expect(loader).toContain("saveData");
    expect(loader).toContain("requestIdleCallback");
    // A pause control exists exactly while the globe moves.
    expect(loader).toContain('if (globe.state === "static") return null;');
    expect(hero).toContain("paused={phoneGlobeState.paused}");
    // The compact globe runs at half the desktop cap and suspends off screen
    // and in hidden documents (the shared gating effect).
    expect(network).toContain("HERO_GLOBE_COMPACT_FPS = 30");
    expect(network).toContain(
      "1000 / (compact ? HERO_GLOBE_COMPACT_FPS : HERO_GLOBE_FPS)",
    );
    expect(network).toContain("IntersectionObserver");
    expect(network).toContain('document.addEventListener("visibilitychange"');
    // The opening is finite and exists only without a reduced-motion preference.
    expect(css).toContain("prefers-reduced-motion: no-preference");
    expect(css).not.toMatch(/\binfinite\b/);
    expect(policy).toContain("Phone globe: narrow continuous-motion exception");
  });
});
