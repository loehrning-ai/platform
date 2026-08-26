import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import postcss from "postcss";

// ─── Scoped stylesheet regression guard ──────────
//
// `de-course.css` is a scoped port of the source's `styles.css` (5294
// lines) + `lib/theme-tokens.css` (233 lines), every selector prefixed
// under a `.de-course` root class so its broad, unprefixed selectors
// (`.btn`, `.chip`, `.panel`, `.section`, ...) cannot bleed onto unrelated
// Tailwind/shadcn pages elsewhere in the monorepo. This test parses the
// real committed file with the same CSS engine the app build uses (not a
// one-time manual grep) so a future hand-edit that reintroduces an
// unscoped selector fails CI, not just this port's initial commit.

const CSS_PATH = join(__dirname, "de-course.css");
const css = readFileSync(CSS_PATH, "utf8");
const root = postcss.parse(css);

// These are the only sub-12px labels left in the course. Every selector is an
// annotation embedded in a fixed-size timeline, pipeline, query plan, cluster,
// calendar, or code canvas. Navigation, controls, status, explanatory copy,
// evidence, and provenance are intentionally absent from this list.
const BOUNDED_GRAPHIC_TYPE_EXCEPTIONS = [
  ".de-course .bf-part .date",
  ".de-course .bf-part .sub",
  ".de-course .bt-stop-d",
  ".de-course .bt-stop-lat",
  ".de-course .bt-stop-num",
  ".de-course .bt-strip-skip",
  ".de-course .cap-merge-side .lab",
  ".de-course .cap-viz-agent .aq-a .src",
  ".de-course .cap-viz-agent .aq-trace",
  ".de-course .cap-viz-gate .ev",
  ".de-course .cap-viz-lineage .lx",
  ".de-course .cap-viz-merge",
  ".de-course .cap-viz-retry .lab",
  ".de-course .cap-viz-retry .note",
  ".de-course .cap2-ln-n",
  ".de-course .cap2-m-anno-ln",
  ".de-course .cap2-m-kind",
  ".de-course .cap2-m-lens",
  ".de-course .cap2-m-ref",
  ".de-course .cap2-signal-sub",
  ".de-course .cm-day .date",
  ".de-course .cm-day .num",
  ".de-course .cm-day .rc",
  ".de-course .cm-join span",
  ".de-course .cm-row",
  ".de-course .cm-tag",
  ".de-course .cm-thead",
  ".de-course .cs-blob",
  ".de-course .cs-diag-head",
  ".de-course .cs-node",
  ".de-course .cs-node-mem",
  ".de-course .cs-node-ssd",
  ".de-course .cs-stat-k",
  ".de-course .cv-ev",
  ".de-course .cv-label-gate .g",
  ".de-course .cv-label-gate .gsub",
  ".de-course .cv-label-now",
  ".de-course .cv-label-settled",
  ".de-course .cv-label-watermark",
  ".de-course .cv-label-watermark span",
  ".de-course .lc-dc-eyebrow",
  ".de-course .lc-dc-fail-lab",
  ".de-course .lc-dc-k",
  ".de-course .lc-de-lab",
  ".de-course .lc-fm-sub",
  ".de-course .lc-slab-api",
  ".de-course .lc-slab-num",
  ".de-course .lc-slab-sub",
  ".de-course .lp-consumer-eyebrow",
  ".de-course .lp-consumer-src",
  ".de-course .lp-dataset .lp-d-eyebrow",
  ".de-course .lp-dataset .lp-d-sub",
  ".de-course .lp-gs .bad",
  ".de-course .lp-gs .lab",
  ".de-course .lp-gs .sub",
  ".de-course .lp-label-analyst .lp-l-eyebrow",
  ".de-course .lp-label-analyst .lp-l-title",
  ".de-course .lp-label-gate .lp-l-broken",
  ".de-course .lp-label-gate .lp-l-n",
  ".de-course .lp-label-gate .lp-l-ref",
  ".de-course .lp-label-gate .lp-l-title",
  ".de-course .lp-label-src .lp-l-eyebrow",
  ".de-course .lp-label-src .lp-l-title",
  ".de-course .lp-row",
  ".de-course .lp-side-label",
  ".de-course .lp-side-label .sub",
  ".de-course .lp-sig-sub",
  ".de-course .pg-ide-ln .ln",
  ".de-course .qp-overload-label",
  ".de-course .sc-axis-left",
  ".de-course .sc-grid-head",
  ".de-course .sd-ast-leaf",
  ".de-course .sd-coord-dot",
  ".de-course .sd-coord-lab",
  ".de-course .sd-gantt-bar",
  ".de-course .sd-gantt-lab",
  ".de-course .sd-gantt-note",
  ".de-course .sd-op",
  ".de-course .sd-pc-lab",
  ".de-course .sd-phase-n",
  ".de-course .sd-phase-s",
  ".de-course .sd-stage-exch",
  ".de-course .sd-stage-k",
  ".de-course .sd-stage-op",
  ".de-course .sd-w-lab",
  ".de-course .tm-bar-ticks",
  ".de-course .tm-day .mark",
  ".de-course .tm-timeline-legend",
  ".de-course .wm-axis-label",
  ".de-course .wm-tick",
] as const;

const BOUNDED_INLINE_GRAPHIC_TYPE_EXCEPTIONS = [
  "simulators/dag-diagram.tsx:10.5",
  "simulators/lineage-camera.tsx:10",
  "simulators/watermark-sim.tsx:10",
] as const;

function normalizeSelector(selector: string): string {
  return selector.trim().replace(/\s+/g, " ");
}

function selectorsForRule(rule: import("postcss").Rule): readonly string[] {
  return rule.selector.split(",").map(normalizeSelector);
}

function pixelTypeSize(
  declaration: import("postcss").Declaration,
): number | null {
  if (declaration.prop === "font-size") {
    const match = declaration.value.match(/^([0-9.]+)px$/);
    return match ? Number(match[1]) : null;
  }
  if (declaration.prop === "font") {
    const match = declaration.value.match(/(?:^|\s)([0-9.]+)px(?:\/|\s)/);
    return match ? Number(match[1]) : null;
  }
  return null;
}

function lastDeclaration(selector: string, property: string): string | null {
  let value: string | null = null;
  root.walkRules((rule) => {
    if (!selectorsForRule(rule).includes(selector)) return;
    rule.walkDecls(property, (declaration) => {
      value = declaration.value;
    });
  });
  return value;
}

function collectRuleSelectors(
  node: import("postcss").Container,
  out: string[],
): void {
  node.each((child) => {
    if (child.type === "rule") {
      out.push(child.selector);
    } else if (child.type === "atrule") {
      const name = child.name.toLowerCase();
      if (name === "keyframes" || name === "font-face") return;
      collectRuleSelectors(child, out);
    }
  });
}

describe("de-course.css ", () => {
  it("exists and is a substantial, real port (not a stub)", () => {
    expect(statSync(CSS_PATH).size).toBeGreaterThan(200_000);
  });

  it("parses as valid CSS", () => {
    expect(() => postcss.parse(css)).not.toThrow();
  });

  it("every non-keyframes rule selector is scoped under .de-course (no bare top-level selector can bleed onto other pages)", () => {
    const selectors: string[] = [];
    collectRuleSelectors(root, selectors);
    expect(selectors.length).toBeGreaterThan(900);

    const unscoped = selectors.filter((selector) =>
      selector
        .split(",")
        .map((s) => s.trim())
        .some(
          (part) =>
            part !== ".de-course" &&
            !part.startsWith(".de-course ") &&
            !part.startsWith(".de-course[") &&
            !part.startsWith(".de-course.") &&
            !part.startsWith(".de-course:") &&
            !part.startsWith(".de-course>") &&
            !part.startsWith(".de-course+") &&
            !part.startsWith(".de-course~"),
        ),
    );
    expect(unscoped).toEqual([]);
  });

  it("has no leftover live :root rule (only theme-tokens.css's own doc-comment mentions the word)", () => {
    const rootRules: string[] = [];
    root.walkRules((rule) => {
      if (
        rule.selector
          .split(",")
          .some((s) => s.trim() === ":root" || s.trim().startsWith(":root["))
      ) {
        rootRules.push(rule.selector);
      }
    });
    expect(rootRules).toEqual([]);
  });

  it("defines --theme-blue and --accent on .de-course (the two token layers both land on the scope root)", () => {
    expect(css).toContain(".de-course {");
    expect(css).toContain("--theme-blue:");
    expect(css).toContain("--accent:");
  });

  it("carries at least one real @media breakpoint and one @keyframes animation, both preserved from source", () => {
    let mediaCount = 0;
    let keyframesCount = 0;
    root.walkAtRules((atRule) => {
      if (atRule.name === "media") mediaCount += 1;
      if (atRule.name === "keyframes") keyframesCount += 1;
    });
    expect(mediaCount).toBeGreaterThan(30);
    expect(keyframesCount).toBeGreaterThan(20);
  });

  it("uses the platform paper, ink, copper, Loehrning Sans, and Geist Mono identity without recoloring semantic data series", () => {
    expect(css).toContain("--theme-blue: var(--color-brand-orange, #a5370f)");
    expect(css).toContain("--bg-page: var(--color-background, #f3f0e9)");
    expect(css).toContain("--theme-black: var(--color-foreground, #0b0908)");
    expect(css).toContain(
      '--font-body: var(--font-loehrning-sans), "Inter", system-ui, sans-serif',
    );
    expect(css).toContain("--font-mono: var(--font-geist-mono), monospace");

    expect(css).toContain("--theme-green: #31a24c");
    expect(css).toContain("--theme-red: #e41e3f");
    expect(css).toContain("--theme-yellow: #f7b928");
    expect(css).toContain("--theme-cyan: #00c2cb");
    expect(css).toContain("--theme-purple: #a033ff");
  });

  it("keeps every essential label at 12px or larger and permits only named bounded graphic annotations below that floor", () => {
    const actual = new Set<string>();
    root.walkDecls((declaration) => {
      const size = pixelTypeSize(declaration);
      if (size === null || size >= 12) return;
      const rule = declaration.parent;
      expect(rule?.type).toBe("rule");
      if (rule?.type !== "rule") return;
      for (const selector of selectorsForRule(rule)) actual.add(selector);
    });

    expect([...actual].sort()).toEqual(
      [...BOUNDED_GRAPHIC_TYPE_EXCEPTIONS].sort(),
    );
  });

  it("permits sub-12px inline type only for named SVG annotations", () => {
    const actual: string[] = [];
    const files = readdirSync(__dirname, {
      encoding: "utf8",
      recursive: true,
    }).filter((path) => path.endsWith(".tsx"));

    for (const relativePath of files) {
      const source = readFileSync(join(__dirname, relativePath), "utf8");
      for (const match of source.matchAll(
        /fontSize:\s*(?:"([0-9.]+)px"|([0-9.]+))/g,
      )) {
        const size = Number(match[1] ?? match[2]);
        if (size < 12) actual.push(`${relativePath}:${size}`);
      }
    }

    expect(actual.sort()).toEqual(
      [...BOUNDED_INLINE_GRAPHIC_TYPE_EXCEPTIONS].sort(),
    );
  });

  it("caps editorial frame radii and all shell/canvas spacing at the compact system limits", () => {
    const oversizedRadii: string[] = [];
    const oversizedSpacing: string[] = [];

    root.walkDecls((declaration) => {
      const pixels = [...declaration.value.matchAll(/([0-9.]+)px/g)].map(
        (match) => Number(match[1]),
      );
      const rule = declaration.parent;
      const selector = rule?.type === "rule" ? rule.selector : "unknown";

      if (
        declaration.prop === "border-radius" &&
        pixels.some((value) => value > 8)
      ) {
        oversizedRadii.push(`${selector}: ${declaration.value}`);
      }
      if (
        /^(?:margin|padding|gap|row-gap|column-gap)(?:-.+)?$/.test(
          declaration.prop,
        ) &&
        pixels.some((value) => value > 48)
      ) {
        oversizedSpacing.push(
          `${selector}: ${declaration.prop}: ${declaration.value}`,
        );
      }
    });

    expect(oversizedRadii).toEqual([]);
    expect(oversizedSpacing).toEqual([]);
    expect(css).toContain("--r-pill: 4px");
    expect(css).toContain("--radius-panel: 8px");
    expect(css).toContain("--sp-16: 48px");
  });

  it("flattens shell chrome while retaining diagram state glows", () => {
    const flatShadowSelectors = [
      ".de-course .theme-card",
      ".de-course .panel",
      ".de-course .fmt-card",
      ".de-course .eng-card",
      ".de-course .ccard",
      ".de-course .ov-map",
      ".de-course .ov-card",
      ".de-course .ov-course",
    ];
    for (const selector of flatShadowSelectors) {
      expect(lastDeclaration(selector, "box-shadow"), selector).toBe("none");
    }

    const flatBackgroundSelectors = [
      ".de-course .sb-mark",
      ".de-course .section-label::after",
      ".de-course .panel::before",
      ".de-course .ov-hero-title em",
      ".de-course .ov2-title em",
      ".de-course .ov-cta-band::before",
      ".de-course .lp-tutorial-banner",
      ".de-course .lp-tutorial-progress-fill",
    ];
    for (const selector of flatBackgroundSelectors) {
      expect(lastDeclaration(selector, "background"), selector).not.toContain(
        "gradient(",
      );
    }

    expect(lastDeclaration(".de-course .sc-c.head", "box-shadow")).toContain(
      "rgba(247, 185, 40",
    );
  });

  it("sets a 44px floor for native learner controls, pagination, navigation, and ranges", () => {
    expect(css).toMatch(
      /\.de-course button,[\s\S]*?\.de-course input\[type="range"\],[\s\S]*?min-height: 44px;/,
    );
    expect(css).toMatch(
      /\.de-course button,[\s\S]*?\.de-course nav a,[\s\S]*?min-width: 44px;/,
    );
    expect(lastDeclaration(".de-course .btn", "min-height")).toBe("44px");
    expect(lastDeclaration(".de-course .tb", "min-height")).toBe("44px");
    expect(css).toContain(
      ".de-course nav[aria-label] > a > div > div:last-child",
    );
  });

  it("allows narrow layer names and descriptions to wrap instead of clipping", () => {
    expect(lastDeclaration(".de-course .lc-slab-name", "overflow-wrap")).toBe(
      "anywhere",
    );
    expect(lastDeclaration(".de-course .lc-slab-sub", "overflow-wrap")).toBe(
      "anywhere",
    );
  });

  it("lets narrow slider labels wrap without shrinking their values or ranges", () => {
    expect(lastDeclaration(".de-course .ctl-slider .row", "min-width")).toBe(
      "0",
    );
    expect(
      lastDeclaration(".de-course .ctl-slider .row .lab", "overflow-wrap"),
    ).toBe("anywhere");
    expect(lastDeclaration(".de-course .ctl-slider .row .val", "flex")).toBe(
      "0 0 auto",
    );
    expect(
      lastDeclaration(
        '.de-course .ctl-slider input[type="range"]',
        "min-width",
      ),
    ).toBe("0");
  });

  it("does not use transition-all shorthands", () => {
    expect(css).not.toMatch(/transition:\s*all\b/);
    expect(css).not.toMatch(/transition:\s*var\(--ease(?:-fast|-spring)?\)/);
    expect(css).not.toMatch(/--ease[^:]*:\s*all\b/);
  });

  it("has no persistent CSS loop and applies one reduced-motion guard to the full course subtree", () => {
    expect(css).not.toMatch(/animation:[^;]*\binfinite\b/);

    let guarded = false;
    root.walkAtRules("media", (atRule) => {
      if (!atRule.params.includes("prefers-reduced-motion: reduce")) return;
      atRule.walkRules((rule) => {
        if (!selectorsForRule(rule).includes(".de-course *")) return;
        rule.walkDecls("animation-iteration-count", (declaration) => {
          if (declaration.value === "1" && declaration.important)
            guarded = true;
        });
      });
    });
    expect(guarded).toBe(true);
  });

  it("keeps continuous simulator engines stopped by default behind the shared play/pause controller", () => {
    const controllerFiles = [
      "simulators/conveyor-sim.tsx",
      "simulators/living-pipeline.tsx",
      "simulators/pipeline-bar.tsx",
      "simulators/shuffle-sim.tsx",
      "simulators/watermark-sim.tsx",
    ];

    for (const relativePath of controllerFiles) {
      const source = readFileSync(join(__dirname, relativePath), "utf8");
      expect(source, relativePath).toContain("useControllableAnimation(false)");
      expect(source, relativePath).toMatch(/toggle(?:Running|Animation)/);
    }
  });
});
