import { describe, expect, it } from "vitest";
import { renderFigureMarkup } from "../export.ts";
import { textWidth } from "../svg.ts";
import { waterfallBars } from "../kinds/waterfall.ts";
import { TILE_LAYOUT } from "../kinds/tilemap.ts";
import { RAMP_CLASSES, rampColor, PALETTES } from "../palette.ts";
import { FIGURE_KINDS, type FigureSpec } from "../types.ts";
import {
  ALL_FIXTURES, BARS_H, BARS_V, DOTPLOT, DUMBBELL, FUNNEL, ICEBERG, LADDER, LORENZ, TILEMAP,
  TIMELINE, WAFFLE, WATERFALL, withData,
} from "./fixtures.ts";

const pretty = (markup: string): string => markup.replace(/></g, ">\n<");
const render = (spec: FigureSpec, p = 1, width = 560, extra = {}) =>
  renderFigureMarkup(spec, p, { width, ...extra });
const parse = (markup: string): Document =>
  new DOMParser().parseFromString(markup, "image/svg+xml");

describe("fixtures", () => {
  it("cover every kind of the engine", () => {
    const covered = new Set(ALL_FIXTURES.map((f) => f.kind));
    for (const kind of FIGURE_KINDS) expect(covered.has(kind)).toBe(true);
  });
});

describe.each(ALL_FIXTURES.map((spec) => [spec.id, spec] as const))("%s", (_id, spec) => {
  it.each([0, 0.5, 1])("renders at progress %s (snapshot)", (p) => {
    expect(pretty(render(spec, p))).toMatchSnapshot();
  });

  it("is deterministic", () => {
    expect(render(spec, 0.37)).toBe(render(spec, 0.37));
  });

  it("treats reduced motion, no JS and print as progress 1", () => {
    const finished = render(spec, 1);
    expect(render(spec, 1.0001)).toBe(finished);
    expect(render(spec, 99)).toBe(finished);
    expect(render(spec, Number.NaN)).toBe(finished);
    expect(render(spec)).toBe(finished);
  });

  it("differs between progress 0, 0.5 and 1", () => {
    const [a, b, c] = [render(spec, 0), render(spec, 0.5), render(spec, 1)];
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(a).not.toBe(c);
  });

  it("hides marks at progress 0", () => {
    expect(render(spec, 0)).toMatch(/opacity="0"/);
  });

  it("is a clean finished state at progress 1: no transforms, no opacity, no dash tricks", () => {
    const doc = parse(render(spec, 1));
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelectorAll("[transform]")).toHaveLength(0);
    expect(doc.querySelectorAll("[opacity]")).toHaveLength(0);
    expect(doc.querySelectorAll("[pathLength], [pathlength]")).toHaveLength(0);
    expect(doc.querySelectorAll("[stroke-dashoffset]")).toHaveLength(0);
  });

  it("moves only through transform, opacity and dash offset", () => {
    const markup = render(spec, 0.5);
    expect(markup).not.toMatch(/<animate|<set |<script|transition|animation/);
  });

  it("is a labelled image with unique ids", () => {
    const doc = parse(render(spec, 1));
    const svg = doc.documentElement;
    expect(svg.getAttribute("role")).toBe("img");
    const labelled = (svg.getAttribute("aria-labelledby") ?? "").split(" ");
    expect(labelled).toHaveLength(2);
    for (const id of labelled) expect(doc.getElementById(id)).not.toBeNull();
    expect(doc.getElementById(labelled[0] ?? "")?.textContent).toBe(spec.title);
    expect(doc.getElementById(labelled[1] ?? "")?.textContent).toBe(spec.alt);
    const ids = Array.from(doc.querySelectorAll("[id]")).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each([280, 390, 560, 800, 1120])("keeps text at 12px or more and inside the box at width %s", (width) => {
    const doc = parse(render(spec, 1, width));
    const svg = doc.documentElement;
    expect(svg.getAttribute("viewBox")?.split(" ")[2]).toBe(String(width));
    for (const node of Array.from(doc.querySelectorAll("text"))) {
      expect(Number(node.getAttribute("font-size"))).toBeGreaterThanOrEqual(12);
      const x = Number(node.getAttribute("x"));
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
    }
  });

  it.each([280, 390, 560, 1120])("keeps every text line inside the viewBox at width %s", (width) => {
    const doc = parse(render(spec, 1, width));
    const offenders: string[] = [];
    for (const node of Array.from(doc.querySelectorAll("text"))) {
      const size = Number(node.getAttribute("font-size"));
      const weight = Number(node.getAttribute("font-weight") ?? 400);
      const anchor = node.getAttribute("text-anchor") ?? "start";
      const x = Number(node.getAttribute("x"));
      const lines = node.querySelector("tspan")
        ? Array.from(node.querySelectorAll("tspan")).map((t) => t.textContent ?? "")
        : [node.textContent ?? ""];
      for (const line of lines) {
        const w = textWidth(line, size, weight);
        const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
        if (left < -1 || left + w > width + 1) offenders.push(`${line} (${Math.round(left)}..${Math.round(left + w)})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("lays out a viewBox taller than zero and adds size attributes only when intrinsic", () => {
    const web = parse(render(spec, 1)).documentElement;
    expect(web.hasAttribute("width")).toBe(false);
    const box = (web.getAttribute("viewBox") ?? "").split(" ").map(Number);
    expect(box[3]).toBeGreaterThan(100);
    const print = parse(render(spec, 1, 640, { intrinsic: true, theme: "print" })).documentElement;
    expect(print.getAttribute("width")).toBe("640");
    expect(Number(print.getAttribute("height"))).toBeGreaterThan(100);
  });

  it("uses literal colours only in the print theme", () => {
    const doc = parse(render(spec, 1, 640, { theme: "print", intrinsic: true }));
    for (const node of Array.from(doc.querySelectorAll("[fill], [stroke]"))) {
      for (const attr of ["fill", "stroke"]) {
        const value = node.getAttribute(attr);
        if (value) expect(value).toMatch(/^(#[0-9a-f]{6}|none|url\(#[\w-]+\))$/);
      }
    }
    const first = doc.documentElement.querySelector("rect");
    expect(first?.getAttribute("fill")).toBe("#f3f0e9");
    expect(render(spec, 1, 640, { theme: "print" })).not.toMatch(/var\(|currentColor/);
  });

  it("dims everything but the highlighted element", () => {
    const doc0 = parse(render(spec, 1));
    expect(doc0.querySelectorAll("[opacity]")).toHaveLength(0);
    const id = Array.from(doc0.querySelectorAll("[data-id], [data-group]"))
      .map((e) => e.getAttribute("data-id") ?? e.getAttribute("data-group"))
      .find(Boolean);
    if (!id) return; // iceberg, lorenz, timeline have no hover targets of their own
    const doc = parse(render(spec, 1, 560, { highlight: id }));
    expect(doc.querySelectorAll("[opacity]").length).toBeGreaterThan(0);
  });
});

describe("waffle", () => {
  it("draws every dot once, in group style", () => {
    const doc = parse(render(WAFFLE, 1));
    const dots = Array.from(doc.querySelectorAll("circle[data-group]"));
    expect(dots).toHaveLength(100);
    const by = (g: string) => dots.filter((d) => d.getAttribute("data-group") === g).length;
    expect(by("shows")).toBe(21);
    expect(by("says")).toBe(70);
    expect(by("rest")).toBe(9);
    expect(doc.querySelectorAll('circle[data-group="shows"][fill="#b73a15"]')).toHaveLength(21);
  });

  it("settles dots from stable offsets", () => {
    const early = render(WAFFLE, 0.3);
    expect(early).toBe(render(WAFFLE, 0.3));
    expect(early).toMatch(/transform="translate\(/);
  });

  it("separates groups by fill and outline, not by colour alone", () => {
    const doc = parse(render(WAFFLE, 1));
    expect(doc.querySelector('circle[data-group="says"]')?.getAttribute("fill")).toBe("none");
    expect(doc.querySelector('circle[data-group="says"]')?.getAttribute("stroke")).toBeTruthy();
  });

  it("states the counts in the legend", () => {
    expect(render(WAFFLE, 1)).toContain("21 von 100");
  });
});

describe("bars", () => {
  it("prints values and hatches suppressed bars", () => {
    const html = render(BARS_H, 1);
    expect(html).toContain("11,6 %");
    expect(html).toContain("weniger als 5");
    expect(html).toContain("fig-t-bars-hatch");
  });

  it("supports vertical bars with a baseline", () => {
    const html = render(BARS_V, 1);
    expect(html).toContain("Mittel 5 %");
    expect(html).toContain("stroke-dasharray");
  });

  it("grows bars with a transform, not a width change", () => {
    const a = parse(render(BARS_H, 0.5));
    const b = parse(render(BARS_H, 1));
    const widthsA = Array.from(a.querySelectorAll("rect")).map((r) => r.getAttribute("width"));
    const widthsB = Array.from(b.querySelectorAll("rect")).map((r) => r.getAttribute("width"));
    expect(widthsA).toEqual(widthsB);
    expect(a.querySelector("rect[transform^='matrix(']")).not.toBeNull();
  });
});

describe("dotplot", () => {
  it("sorts by value with suppressed rows last and draws the reference", () => {
    const doc = parse(render(DOTPLOT, 1));
    const ids = Array.from(doc.querySelectorAll("g[data-id]")).map((g) => g.getAttribute("data-id"));
    expect(ids).toEqual(["a", "b", "c", "d", "e"]);
    expect(render(DOTPLOT, 1)).toContain("Alle: 4,0 %");
    expect(render(DOTPLOT, 1)).toContain("weniger als 5");
  });
});

describe("tilemap", () => {
  it("places 16 tiles and prints value and interval", () => {
    expect(TILE_LAYOUT).toHaveLength(16);
    expect(new Set(TILE_LAYOUT.map((t) => `${t.col}:${t.row}`)).size).toBe(16);
    const doc = parse(render(TILEMAP, 1));
    expect(doc.querySelectorAll("g[data-id]")).toHaveLength(16);
    const html = render(TILEMAP, 1);
    expect(html).toContain("3,9");
    expect(html).toContain("3,1 bis 4,8");
  });

  it("hatches suppressed Laender and outlines the emphasised region", () => {
    const doc = parse(render(TILEMAP, 1));
    const rect = (id: string) => doc.querySelector(`g[data-id="${id}"] rect`);
    expect(rect("ST")?.getAttribute("fill")).toMatch(/^url\(#/);
    expect(rect("SL")?.getAttribute("fill")).toMatch(/^url\(#/);
    for (const id of ["MV", "BB", "TH", "SN", "ST"]) expect(rect(id)?.getAttribute("stroke-width")).toBe("2");
    expect(rect("BY")?.getAttribute("stroke-width")).toBe("1");
  });

  it("colours tiles in the five legend classes only", () => {
    const classes = new Set(RAMP_CLASSES.map((t) => rampColor(PALETTES.web, t)));
    const doc = parse(render(TILEMAP, 1));
    const fills = Array.from(doc.querySelectorAll("g[data-id] rect"))
      .map((r) => r.getAttribute("fill") ?? "")
      .filter((f) => f.startsWith("#"));
    expect(fills.length).toBe(14);
    fills.forEach((f) => expect(classes.has(f)).toBe(true));
    expect(render(TILEMAP, 1)).toContain("ab 0,0");
  });

  it("pins the highlighted tile with a thick outline", () => {
    const doc = parse(render(TILEMAP, 1, 560, { highlight: "NW" }));
    expect(doc.querySelector('g[data-id="NW"] rect')?.getAttribute("stroke-width")).toBe("3");
  });
});

describe("funnel", () => {
  it("marks exactly the points outside the outer band", () => {
    const doc = parse(render(FUNNEL, 1));
    const outside = Array.from(doc.querySelectorAll("circle[data-id]")).filter((c) => c.getAttribute("fill") === "#b73a15");
    expect(outside.map((c) => c.getAttribute("data-id")).sort()).toEqual(["k8", "k9"]);
    expect(render(FUNNEL, 1)).toContain("Stadt A");
    expect(render(FUNNEL, 1)).toContain("99,8 % Zufallsband");
  });
});

describe("dumbbell", () => {
  it("keeps every dot inside the plot on a log axis", () => {
    const doc = parse(render(DUMBBELL, 1));
    const xs = Array.from(doc.querySelectorAll("g[data-id] circle")).map((c) => Number(c.getAttribute("cx")));
    expect(xs).toHaveLength(5);
    xs.forEach((x) => {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(560);
    });
    expect(render(DUMBBELL, 1)).toContain("Mittel = 100");
  });

  it("sorts by the first measure", () => {
    const doc = parse(render(DUMBBELL, 1));
    const ids = Array.from(doc.querySelectorAll("g[data-id]")).map((g) => g.getAttribute("data-id"));
    expect(ids).toEqual(["r1", "r2", "r3", "r4", "r5"]);
  });
});

describe("lorenz", () => {
  it("draws the curve from the origin and numbers the marks", () => {
    const html = render(LORENZ, 1);
    expect(html).toContain("Gini-Koeffizient 0,41");
    expect(html).toContain("Die 20 % mit den meisten Stellen");
    const doc = parse(html);
    const curve = Array.from(doc.querySelectorAll("path")).find((p) => p.getAttribute("stroke") === "#b73a15");
    expect(curve?.getAttribute("d")).toMatch(/^M/);
  });

  it("draws the curve on with a dash offset while in motion", () => {
    const doc = parse(render(LORENZ, 0.4));
    const curve = doc.querySelector("path[pathLength], path[pathlength]");
    expect(curve?.getAttribute("stroke-dasharray")).toBe("1");
    expect(Number(curve?.getAttribute("stroke-dashoffset"))).toBeGreaterThan(0);
    expect(Number(curve?.getAttribute("stroke-dashoffset"))).toBeLessThan(1);
  });
});

describe("waterfall", () => {
  it("keeps running levels", () => {
    const { bars, slots } = waterfallBars(WATERFALL.data as never);
    expect(bars.map((b) => [b.id, b.v0, b.v1])).toEqual([
      ["raw", 0, 8.2],
      ["shared", 8.2, 4.3],
      ["own", 0, 4.3],
      ["weighted", 4.3, 4],
      ["scan1", 0, 10.6],
      ["scan2", 10.6, 6.3],
      ["scan3", 0, 6.3],
    ]);
    expect(slots).toBe(7.5);
  });

  it("prints signed deltas with a real minus", () => {
    const html = render(WATERFALL, 1);
    expect(html).toContain("−3,9 %");
    expect(html).toContain("8,2 %");
  });

  it("reveals step by step and emphasises only the active step before the end", () => {
    const early = parse(render(WATERFALL, 0.3));
    const dimmed = Array.from(early.querySelectorAll("g[data-id][opacity]")).map((g) => g.getAttribute("data-id"));
    expect(dimmed).toContain("raw");
    expect(dimmed).not.toContain("shared");
    expect(parse(render(WATERFALL, 1)).querySelectorAll("g[data-id][opacity]")).toHaveLength(0);
  });

  it("lays out phones horizontally and wide screens vertically", () => {
    const phone = render(WATERFALL, 1, 390);
    const wide = render(WATERFALL, 1, 800);
    expect(phone).not.toBe(wide);
    const forced = render(withData(WATERFALL, { orientation: "vertical" }), 1, 390);
    expect(forced).not.toBe(phone);
  });
});

describe("ladder", () => {
  it("shows wording under every rung and our measure on its own axis", () => {
    const html = render(LADDER, 1);
    expect(html).toContain("Unternehmen mit mindestens 10 Beschäftigten");
    expect(html).toContain("Anderes Maß, eigene Achse");
    expect(html).toContain("Intervall 3,7 bis 4,2");
  });

  it("marks an earlier value with a hollow dot", () => {
    const doc = parse(render(LADDER, 1));
    const hollow = Array.from(doc.querySelectorAll("circle")).filter((c) => c.getAttribute("fill") === "#fffcf5" || c.getAttribute("fill") === "#f7f1e7");
    expect(hollow.length).toBeGreaterThan(0);
  });
});

describe("timeline", () => {
  it("keeps date order and puts today between past and future", () => {
    const html = render(TIMELINE, 1);
    expect(html.indexOf("02.02.2025")).toBeLessThan(html.indexOf("Stand 18.10.2026"));
    expect(html.indexOf("Stand 18.10.2026")).toBeLessThan(html.indexOf("02.08.2027"));
    expect(html.indexOf("02.08.2027")).toBeLessThan(html.indexOf("02.12.2027"));
  });

  it("says in words that the spacing is not to scale", () => {
    expect(render(TIMELINE, 1)).toContain("nicht maßstäblich");
  });

  it("uses a different marker shape per status", () => {
    const doc = parse(render(TIMELINE, 1));
    expect(doc.querySelectorAll("g[data-id] circle")).toHaveLength(2);
    expect(doc.querySelectorAll("g[data-id] path")).toHaveLength(1);
  });
});

describe("iceberg", () => {
  it("states visible, hidden and total", () => {
    const html = render(ICEBERG, 1);
    expect(html).toContain("2,2 %");
    expect(html).toContain("9,5 %");
    expect(html).toContain("Insgesamt 11,7 %");
  });

  it("keeps the tip proportional to the share", () => {
    const doc = parse(render(ICEBERG, 1));
    const lines = Array.from(doc.querySelectorAll("line")).filter((l) => !l.closest("pattern"));
    const brackets = lines.filter((l) => l.getAttribute("x1") === l.getAttribute("x2"));
    const bracket = brackets[0];
    const top = Number(bracket?.getAttribute("y1"));
    const bottom = Number(bracket?.getAttribute("y2"));
    const water = lines.find((l) => l.getAttribute("x1") === "0" && l.getAttribute("x2") === "560" && l.getAttribute("y1") === l.getAttribute("y2"));
    const yw = Number(water?.getAttribute("y1"));
    expect((yw - top) / (bottom - top)).toBeCloseTo(2.2 / 11.7, 2);
  });

  it("changes its silhouette with the seed", () => {
    const other = { ...ICEBERG, seed: 123 } as FigureSpec;
    expect(render(other, 1)).not.toBe(render(ICEBERG, 1));
  });
});
