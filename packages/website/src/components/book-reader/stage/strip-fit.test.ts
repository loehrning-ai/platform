import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { loadBookFigures } from "@/lib/book-figures";
import type { FigureSpec } from "@/lib/figures";
import { CONTROL_PX, MIN_LABEL_PX, STRIP_BAR_PX, STRIP_TOP_PX, smallestFont, stripFit, stripInnerHeight } from "./strip-fit";

const stageCss = readFileSync(join(__dirname, "chapter-stage.css"), "utf8");
const barCss = readFileSync(join(__dirname, "..", "insight-focus-bar.css"), "utf8");
const heroCss = readFileSync(join(__dirname, "..", "..", "book-figures", "hero", "hero.css"), "utf8");

describe("strip-fit mirrors the stylesheets", () => {
  it("uses the strip formula of chapter-stage.css and the reader bar height of insight-focus-bar.css", () => {
    expect(stageCss).toMatch(/clamp\(12rem, calc\(44svh - var\(--cs-top\) - var\(--cs-bar\)\), 20rem\)/);
    expect(stageCss).toMatch(/--cs-top:\s*var\(--nav-h-compact, 3rem\)/);
    expect(STRIP_TOP_PX).toBe(48);
    expect(barCss).toMatch(/\.ifb-row\s*\{[^}]*height:\s*3\.25rem/);
    expect(STRIP_BAR_PX).toBe(52 + 2);
    // 44 % of 740 minus 48 and 54, minus the pin's two 2px rules.
    expect(stripInnerHeight(740)).toBeCloseTo(0.44 * 740 - 48 - 54 - 4, 5);
    expect(stripInnerHeight(500)).toBe(192 - 4);
    expect(stripInnerHeight(1400)).toBe(320 - 4);
  });

  it("keeps the strip figure in its phone layout (34rem) and hides the segmented legend there, as the control heights assume", () => {
    expect(heroCss).toMatch(/@media \(max-width: 1023px\) \{\s*\.cs\[data-mode="scrub"\] \.hs\[data-hs-stage="true"\] \{\s*max-width: 34rem;/);
    expect(stageCss).toMatch(/min\(100cqw, 34rem\)/);
    expect(CONTROL_PX["none"]).toBe(0);
    expect(CONTROL_PX["cycle"]).toBeGreaterThanOrEqual(48);
    expect(MIN_LABEL_PX).toBe(11);
  });
});

describe("smallestFont", () => {
  it("finds the smallest visible font size in an engine tree and skips text drawn at opacity 0", () => {
    const tree = createElement(
      "svg",
      null,
      createElement("text", { fontSize: 14 }, "a"),
      createElement("g", { opacity: 0 }, createElement("text", { fontSize: 8 }, "hidden")),
      [createElement("text", { key: "k", fontSize: 12 }, "b")],
    );
    expect(smallestFont(tree)).toBe(12);
    expect(smallestFont(createElement("svg"))).toBe(Infinity);
  });
});

describe("stripFit on the book's stages", () => {
  it("pins every hero figure that keeps 11px labels in the 360x740 strip and stands the null distribution inline", async () => {
    const figures = await loadBookFigures("ki-landschaft");
    const fit = (id: string) => stripFit(figures.specs.get(id) as FigureSpec);
    for (const id of ["h05-dots", "h01-net", "h02-blocks", "h06-slope"]) expect(fit(id).fits, id).toBe(true);
    // Histogram, axis, five word rows and three buttons do not fit 220px at 11px.
    expect(fit("h12-null").fits).toBe(false);
    // Das Feld is a canvas at a fixed aspect: it fits, and the strip keeps its full height for it.
    expect(fit("h04-field")).toMatchObject({ fits: true, ratio: null });
    // A short figure hands the strip its own measure: the waffle needs less than half its width.
    const waffle = fit("h05-dots");
    expect(waffle.ratio).toBeGreaterThan(0.3);
    expect(waffle.ratio).toBeLessThan(0.6);
    expect(waffle.controlPx).toBe(0);
    expect(fit("h06-slope").controlPx).toBe(CONTROL_PX["cycle"]);
  });
});
