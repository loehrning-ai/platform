import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findPrivacyFindings } from "@/lib/figures";
import { C12_TIMELINE, C1_LADDER, C2_ICEBERG, C4_HEADLINE } from "./fixtures.provisional";

const DIR = __dirname;
const css = readFileSync(join(DIR, "story.css"), "utf8");

/** The text of every top-level at-rule block that starts with `header`. */
function blocks(source: string, header: RegExp): string[] {
  const out: string[] = [];
  const re = new RegExp(header.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const open = source.indexOf("{", match.index);
    let depth = 0;
    let i = open;
    for (; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      if (source[i] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    out.push(source.slice(open + 1, i));
  }
  return out;
}

function withoutBlocks(source: string, header: RegExp): string {
  let rest = source;
  for (const block of blocks(source, header)) rest = rest.replace(block, "");
  return rest;
}

describe("story.css motion contract", () => {
  it("has no transition: all and no gradients", () => {
    expect(css).not.toMatch(/transition:\s*all/);
    expect(css).not.toMatch(/gradient\(/);
  });

  it("moves only transform and opacity inside keyframes", () => {
    for (const frames of blocks(css, /@keyframes\s+[\w-]+/)) {
      const properties = [...frames.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
      for (const property of properties) expect(["opacity", "transform"]).toContain(property);
    }
  });

  it("starts every animation only inside prefers-reduced-motion: no-preference", () => {
    const outside = withoutBlocks(css, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/);
    expect(outside).not.toMatch(/animation-name\s*:/);
    expect(outside).not.toMatch(/animation-timeline\s*:/);
    expect(outside).not.toMatch(/view-timeline\s*:/);
    expect(outside).not.toMatch(/(^|[;{\s])animation\s*:/);
  });

  it("guards the scroll scrub with @supports and keeps an observer-driven fallback", () => {
    expect(css).toMatch(/@supports\s*\(animation-timeline:\s*view\(\)\)/);
    expect(css).toMatch(/@supports not\s*\(animation-timeline:\s*view\(\)\)/);
    expect(css).toMatch(/data-phase="armed"/);
  });

  it("keeps a finished-state base: parts have no opacity or transform outside the motion blocks", () => {
    const base = withoutBlocks(css, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/);
    expect(base).not.toMatch(/\.bf-ice[^{]*\{[^}]*opacity:\s*0/);
  });

  it("stacks the C4 steps for reduced motion, no JS, short screens and print", () => {
    for (const query of [/prefers-reduced-motion:\s*reduce/, /max-height:\s*699px/, /scripting:\s*none/]) {
      const found = blocks(css, new RegExp(`@media[^{]*${query.source}`));
      expect(found.length).toBeGreaterThan(0);
      expect(found.join("\n")).toMatch(/\.bf-wf-stage\s*\{\s*display:\s*none/);
      expect(found.join("\n")).toMatch(/\.bf-wf-static\s*\{[^}]*display:\s*block/);
    }
  });

  it("spaces the steps at least 60svh apart", () => {
    expect(css).toMatch(/\.bf-wf-step\s*\{[^}]*min-height:\s*62svh/);
    for (const [, value] of css.matchAll(/min-height:\s*(\d+)svh/g)) expect(Number(value)).toBeGreaterThanOrEqual(60);
  });

  it("keeps targets at 44px and text at 12px or larger", () => {
    expect(css).toMatch(/\.bf-chip,\s*\.bf-button\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.bf-select\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.bf-range\s*\{[^}]*height:\s*44px/);
    expect(css).toMatch(/\.bf-summary\s*\{[^}]*min-height:\s*44px/);
    for (const [, rem] of css.matchAll(/font-size:\s*([\d.]+)rem/g)) expect(Number(rem)).toBeGreaterThanOrEqual(0.75);
    for (const [, px] of css.matchAll(/font-size:\s*(\d+)px/g)) expect(Number(px)).toBeGreaterThanOrEqual(12);
  });

  it("uses hard edges and tokens: no radius, no shadow except the selected chip's foot", () => {
    expect(css).not.toMatch(/border-radius:\s*[1-9]/);
    const shadows = [...css.matchAll(/box-shadow:[^;]+;/g)].map((m) => m[0]);
    expect(shadows).toEqual(["box-shadow: inset 0 -3px 0 var(--bf-ink);"]);
    expect(css).not.toMatch(/100vh/);
  });

  it("reserves figure geometry in svh and container queries, not in JS", () => {
    expect(css).toMatch(/container-type:\s*inline-size/);
    expect(css).toMatch(/@container\s*\(min-width:\s*540px\)/);
  });
});

describe("source hygiene", () => {
  const files = readdirSync(DIR).filter((name) => /\.(tsx?|css)$/.test(name) && !/\.test\./.test(name));
  const sources = files.map((name) => [name, readFileSync(join(DIR, name), "utf8")] as const);

  it("uses no chart library, no Framer Motion and no inline scripts", () => {
    for (const [name, source] of sources) {
      expect(source, name).not.toMatch(/from\s+["'](d3|recharts|chart\.js|framer-motion|gsap)/);
      expect(source, name).not.toMatch(/dangerouslySetInnerHTML/);
    }
  });

  it("writes no em or en dashes and no vault, home or retired-brand strings", () => {
    const brand = ["Digi", "fyde"].join("");
    // Built from pieces so this file itself carries no private path.
    const vaultPattern = new RegExp(["\\/Us" + "ers\\/", "maven" + "gence_obs" + "idian", "\\/priv" + "ate\\/tmp"].join("|"));
    for (const [name, source] of sources) {
      expect(source, name).not.toMatch(/[–—]/);
      expect(source, name).not.toMatch(vaultPattern);
      expect(source.toLowerCase(), name).not.toContain(brand.toLowerCase());
    }
  });

  it("marks client files and keeps hooks out of server-safe ones", () => {
    const client = ["ai-act-timeline", "calculator", "iceberg-scrub", "placement", "survey-ladder", "waterfall-story", "step-chips", "use-motion"];
    for (const name of client) {
      const file = files.find((f) => f.startsWith(`${name}.`))!;
      expect(readFileSync(join(DIR, file), "utf8").startsWith('"use client"'), file).toBe(true);
    }
    for (const file of ["figure-shell.tsx", "figure-svg.tsx"]) {
      const source = readFileSync(join(DIR, file), "utf8");
      expect(source).not.toMatch(/use client|useState|useEffect/);
    }
  });
});

describe("provisional fixtures", () => {
  it("is labelled provisional and passes the privacy checks of the engine", () => {
    const fixtures = readFileSync(join(DIR, "fixtures.provisional.ts"), "utf8");
    expect(fixtures).toMatch(/PROVISIONAL/);
    for (const spec of [C4_HEADLINE, C1_LADDER, C2_ICEBERG, C12_TIMELINE]) {
      expect(findPrivacyFindings(spec), spec.id).toEqual([]);
    }
  });

  it("keeps the C4 numbers of the analysis and the ladder range of the sources", () => {
    expect(C4_HEADLINE.data.items.map((i) => i.value)).toEqual([8.2, 4.3, 4.0, 10.6, 6.3]);
    expect(C1_LADDER.data.rungs.map((r) => r.value)).toEqual([20, 26, 54.5, 57]);
    expect(C1_LADDER.data.ours?.axisMax).toBe(10);
  });
});
