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

  it("keeps the restored globe on the paper band, never a black or tinted hero", () => {
    const hero = read("components/home/hero.tsx");
    const band = read("components/home/phone-hero.css");

    // The restored hero is the paper band with its grain at every width; the
    // black graphit band and coloured washes stay out.
    expect(hero).toContain("berlin-hero");
    expect(band).toContain("var(--color-paper)");
    expect(band).not.toContain("#141414");
    expect(band).not.toMatch(
      /169\s*,\s*221\s*,\s*252|203\s*,\s*188\s*,\s*255/,
    );
    expect(hero).not.toContain("bg-brand-peach/20");
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
      "The projection module and SVG tree are not loaded or rendered on mobile",
    );
    expect(policy).toContain(
      "A visible 44px pause control sits beside the primary action whenever the globe moves",
    );
  });

  it("bounds the restored phone globe exception", () => {
    const loader = read("components/home/phone-globe.tsx");
    const css = read("components/home/phone-hero.css");

    // The phone reuses the line globe as a lazy chunk, gated on width,
    // motion, data and Save-Data, and loaded only when the browser is idle.
    expect(loader).toContain('import("@/components/home/hero-network")');
    expect(loader).toContain('export const LG_QUERY = "(min-width: 64rem)"');
    expect(loader).toContain('"(prefers-reduced-motion: reduce)"');
    expect(loader).toContain('"(prefers-reduced-data: reduce)"');
    expect(loader).toContain("saveData");
    expect(loader).toContain("requestIdleCallback");
    // Any opening animation is finite and only runs without a reduced-motion preference.
    expect(css).toContain("prefers-reduced-motion: no-preference");
    expect(css).not.toMatch(/\binfinite\b/);
  });
  it("bounds the /login dot-field continuous-motion exception", () => {
    const scene = read("components/login/login-scene.tsx");
    const field = read("components/login/dot-field.tsx");
    const shapes = read("components/login/dot-field-shapes.ts");
    const css = read("app/login/login-scene.css");
    const policy = readFileSync(
      join(SRC, "..", "docs/experience-system.md"),
      "utf8",
    );

    // A lazy client chunk, never rendered on the server, and only loaded
    // when motion is allowed.
    expect(scene).toContain('import("@/components/login/dot-field")');
    expect(scene).toContain("ssr: false");
    expect(scene).toContain('"(prefers-reduced-motion: reduce)"');
    expect(scene).toContain("{motionAllowed ? <DotField paused={paused} /> : null}");
    // A visible 44px pause toggle with a fixed name and a pressed state.
    expect(scene).toContain("aria-pressed={paused}");
    expect(scene).toContain("aria-controls={LOGIN_SCENE_LAYER_ID}");
    expect(css).toMatch(/\.login-scene-toggle\s*\{[^}]*width:\s*2\.75rem;[^}]*height:\s*2\.75rem/s);
    // The renderer checks the media query itself, pauses on a hidden
    // document, and paces itself at about 30fps.
    expect(field).toContain('"(prefers-reduced-motion: reduce)"');
    expect(field).toContain('document.addEventListener("visibilitychange", sync)');
    expect(field).toContain('aria-hidden="true"');
    expect(shapes).toContain("DOT_FIELD_FPS = 30");
    expect(shapes).toContain("DOT_FIELD_MAX_DPR = 2");
    // CSS hides the canvas under reduce too, and the card's rise is finite.
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce\)\s*\{\s*\.login-dot-field\s*\{\s*display:\s*none/s);
    expect(css).toContain("prefers-reduced-motion: no-preference");
    expect(css).not.toMatch(/\binfinite\b/);
    expect(policy).toContain("Login dot field: narrow continuous-motion exception");
    expect(policy).toContain(
      "A visible 44px pause toggle sits at the top right of the scene whenever the shapes move",
    );
  });
});
