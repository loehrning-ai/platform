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
    const network = read("components/home/hero-network.tsx");
    const heroRule = globalCss.match(/\.berlin-hero\s*\{[^}]*\}/s)?.[0] ?? "";

    expect(heroRule).toContain("background: var(--color-paper)");
    expect(heroRule).not.toMatch(
      /169\s*,\s*221\s*,\s*252|203\s*,\s*188\s*,\s*255/,
    );
    expect(hero).not.toContain("bg-brand-peach/20");
    expect(network).toContain('id="sphereVolume"');
    expect(network).not.toContain('id="limbHalo"');
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
    const network = read("components/home/hero-network.tsx");
    const policy = readFileSync(
      join(SRC, "..", "docs/experience-system.md"),
      "utf8",
    );

    expect(hero).not.toContain("setGlobeSettled(true)");
    expect(hero).toContain('import("@/components/home/hero-network")');
    expect(hero).toContain('networkMode === "desktop" ?');
    expect(hero).toContain('type="button"');
    expect(hero).toContain("aria-pressed={networkPaused}");
    expect(hero).toContain("size-11");
    expect(hero).toContain("motion-reduce:hidden");
    expect(hero).toContain("data-hero-globe-motion");
    expect(network).toContain(
      'window.matchMedia("(prefers-reduced-motion: reduce)")',
    );
    expect(network).toContain("IntersectionObserver");
    expect(network).toContain('frozen?.on("change"');
    expect(network).toContain('document.addEventListener("visibilitychange"');
    expect(network).toContain("HERO_GLOBE_INTRO_FPS = 20");
    expect(network).toContain("HERO_GLOBE_AMBIENT_FPS = 10");
    expect(network).toContain("data-hero-network-motion");
    expect(policy).toContain(
      "Homepage globe: narrow continuous-motion exception",
    );
    expect(policy).toContain(
      "The projection module and SVG tree are not loaded or rendered on mobile",
    );
  });
});
