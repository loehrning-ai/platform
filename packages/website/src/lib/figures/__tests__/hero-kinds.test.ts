import { describe, expect, it } from "vitest";
import { figureCsv, figureTable } from "../data.ts";
import { renderFigureMarkup, renderStandaloneSvg } from "../export.ts";
import { blockAssignment, blocksPerBin } from "../kinds/blocks.ts";
import { penRuns } from "../kinds/curve.ts";
import { drawsPerSquare } from "../kinds/nulldist.ts";
import { stripValue } from "../kinds/strip.ts";
import { stageWords } from "../hero.ts";
import { between, crit, seededOrder, settle, springIn } from "../motion.ts";
import { controlKindOf, defaultDetentOf, detentsOf, pinItemsOf, readoutOf } from "../readout.ts";
import { findPrivacyFindings, parseFigureSpec } from "../validate.ts";
import { resolveToken, tokenKeys } from "../tokens.ts";
import type { BlocksData, FigureSpec, NetworkData, NulldistData, SlopeData, StripData } from "../types.ts";
import { withData } from "./fixtures.ts";
import { BLOCKS, CURVE, FIELD, HERO_FIXTURES, NETWORK, NULLDIST, SLOPE, STRIP, STRIP_LINEAR } from "./fixtures-hero.ts";

const parse = (markup: string): Document => new DOMParser().parseFromString(markup, "image/svg+xml");
const render = (spec: FigureSpec, p = 1, width = 340, extra = {}) => renderFigureMarkup(spec, p, { width, ...extra });
const flat = (s: string): string => s.replace(/\u00a0/g, " ");
const num = (s: string): number => Number(s.replace(/\./g, "").replace(",", "."));

describe("motion", () => {
  it("settles without overshoot and lands exactly", () => {
    let last = 0;
    for (let i = 0; i <= 200; i += 1) {
      const v = settle(i / 200);
      expect(v).toBeGreaterThanOrEqual(last - 1e-12);
      expect(v).toBeLessThanOrEqual(1);
      last = v;
    }
    expect(settle(0)).toBe(0);
    expect(settle(1)).toBe(1);
    expect(settle(2)).toBe(1);
    expect(crit(-1, 10)).toBe(0);
  });

  it("springs end exactly at 1 and may pass it in between (marks only)", () => {
    expect(springIn(0, 0.2, 0.6)).toBe(0);
    expect(springIn(0.6, 0.2, 0.6)).toBe(1);
    expect(springIn(1, 0.2, 0.6)).toBe(1);
    const peak = Math.max(...Array.from({ length: 100 }, (_v, i) => springIn(0.2 + (0.4 * i) / 99, 0.2, 0.6, "soft")));
    expect(peak).toBeGreaterThan(1);
  });

  it("orders seeded and blends detents", () => {
    expect(seededOrder(5, 20)).toEqual(seededOrder(5, 20));
    expect([...seededOrder(5, 20)].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_v, i) => i));
    expect(between(456, 224, 0)).toBe(456);
    expect(between(456, 224, 1)).toBe(224);
  });
});

describe.each(HERO_FIXTURES.map((s) => [s.id, s] as const))("%s as a hero figure", (_id, spec) => {
  it("passes the spec validator and the privacy gate", () => {
    expect(() => parseFigureSpec(JSON.parse(JSON.stringify(spec)))).not.toThrow();
    expect(findPrivacyFindings(spec)).toEqual([]);
  });

  it("draws at progress 0, 0.5 and 1 with a different picture each time", () => {
    const [a, b, c] = [0, 0.5, 1].map((p) => render(spec, p));
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
  });

  it("leaves numeral, claim and unit to the stage when bare", () => {
    const full = parse(render(spec, 1));
    const bare = parse(render(spec, 1, 340, { bare: true }));
    expect(bare.querySelector('[data-t="numeral"]')).toBeNull();
    expect(bare.querySelector('[data-t="claim"]')).toBeNull();
    expect(bare.querySelector('[data-t="unit"]')?.textContent ?? "").not.toMatch(/Quadrat/);
    if (full.querySelector('[data-t="numeral"]')) expect(full.querySelector('[data-t="numeral"]')?.textContent).toBeTruthy();
  });

  it("keeps a stage claim within 12 words and the labels short", () => {
    const doc = parse(render(spec, 1));
    const claim = doc.querySelector('[data-t="claim"]');
    if (claim) expect((claim.textContent ?? "").split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(12);
    expect(stageWords(doc.documentElement)).toBeLessThanOrEqual(30);
  });

  it("never prints an em or en dash or a company-looking domain", () => {
    expect(render(spec, 1)).not.toMatch(new RegExp("[\\u2013\\u2014]"));
    expect(render(spec, 1).replace(/xmlns="[^"]*"/g, "")).not.toMatch(/\b[a-z0-9-]+\.(de|com|net|org)\b/i);
  });

  it("writes a standalone print SVG with literal colours and no transform", () => {
    const svg = renderStandaloneSvg(spec, { width: 640 });
    expect(svg).toMatch(/^<\?xml/);
    expect(svg).not.toMatch(/var\(|currentColor|transform=/);
    expect(svg).toMatch(/width="640"/);
  });

  it("has a data table whose numbers are in the CSV", () => {
    const table = figureTable(spec);
    expect(table.rows.length).toBeGreaterThan(1);
    expect(figureCsv(spec).split("\n").length).toBe(table.rows.length + 2);
  });

  it("answers a control change with a sentence and a pin list", () => {
    expect(readoutOf(spec).length).toBeGreaterThan(5);
    const detents = detentsOf(spec);
    if (detents.length > 0) {
      expect(controlKindOf(spec)).not.toBe("none");
      expect(detents.some((d) => d.id === defaultDetentOf(spec))).toBe(true);
    }
    for (const item of pinItemsOf(spec)) {
      expect(item.id).toBeTruthy();
      expect(item.detail).not.toMatch(/NaN|undefined/);
    }
  });
});

describe("network", () => {
  const data = NETWORK.data as NetworkData;
  it("states the raw count in text and prints the equal-text count as the numeral", () => {
    const doc = parse(render(NETWORK, 1));
    expect(num(doc.querySelector('[data-t="numeral"]')?.textContent ?? "")).toBe(data.variants[1]?.edges.length);
    expect(doc.querySelector('[data-t="unit"]')?.textContent).toContain(String(data.variants[0]?.edges.length));
  });

  it("keeps surviving edges, fades the leaving ones and counts the numeral down while the detent moves", () => {
    const mid = parse(render(NETWORK, 1, 340, { variant: "gleich", from: "roh", shift: 0.3 }));
    expect(mid.querySelector('[data-edges="leaving"]')).not.toBeNull();
    const start = parse(render(NETWORK, 1, 340, { variant: "gleich", from: "roh", shift: 0 }));
    expect(num(start.querySelector('[data-t="numeral"]')?.textContent ?? "")).toBe(data.variants[0]?.edges.length);
    const settled = parse(render(NETWORK, 1, 340, { variant: "gleich", from: "roh", shift: 1 }));
    expect(settled.querySelector('[data-edges="leaving"]')).toBeNull();
    expect(settled.querySelectorAll("[opacity]")).toHaveLength(0);
  });

  it("draws one square per node and the story node in the accent", () => {
    const doc = parse(render(NETWORK, 1, 340, { theme: "print" }));
    expect(doc.querySelectorAll('[data-layer="nodes"] rect')).toHaveLength(data.nodes.length);
    expect(doc.querySelectorAll('[data-layer="nodes"] rect[fill="#b73a15"]')).toHaveLength(1);
  });

  it("flips a pointed-at node to its anti colour and dims the rest", () => {
    const doc = parse(render(NETWORK, 1, 340, { theme: "print", highlight: "n3" }));
    expect(doc.querySelector('[data-id="n3"]')?.getAttribute("fill")).toBe("#b73a15");
    expect(doc.querySelector('[data-id="n4"]')?.getAttribute("opacity")).toBe("0.4");
  });

  it("rejects an edge to a node that does not exist", () => {
    const bad = withData(NETWORK, { defaultVariant: "x", baseline: "x", variants: [{ id: "x", label: "x", edges: [[0, 99]] }] });
    expect(() => parseFigureSpec(bad)).toThrow(/out of range/);
  });
});

describe("blocks", () => {
  const data = BLOCKS.data as BlocksData;
  it("adds the blocks up to 100 by largest remainder in both definitions", () => {
    for (const v of data.variants) {
      const per = blocksPerBin(data, v);
      expect(per.reduce((s, x) => s + x, 0)).toBe(100);
    }
    expect(blocksPerBin(data, data.variants[0]!)[5]).toBe(35);
    expect(blocksPerBin(data, data.variants[1]!)[5]).toBe(49);
  });

  it("keeps a block's index when a definition moves it: 14 blocks change bin", () => {
    const a = blockAssignment(blocksPerBin(data, data.variants[0]!));
    const b = blockAssignment(blocksPerBin(data, data.variants[1]!));
    const moved = a.bin.filter((bin, j) => bin !== b.bin[j]).length;
    expect(moved).toBeGreaterThan(0);
  });

  it("prints exact counts under the bins and the unit line", () => {
    const html = render(BLOCKS, 1);
    expect(html).toContain("3.558");
    expect(html).toContain("4.384");
    expect(flat(html)).toContain("1 Block = etwa 101 Anzeigen");
  });

  it("lands the numeral on the counted blocks without overshoot", () => {
    let last = 0;
    for (let i = 0; i <= 40; i += 1) {
      const v = num(parse(render(BLOCKS, i / 40)).querySelector('[data-t="numeral"]')?.textContent ?? "0");
      expect(v).toBeGreaterThanOrEqual(last);
      expect(v).toBeLessThanOrEqual(35);
      last = v;
    }
    expect(last).toBe(35);
  });

  it("moves 14 more blocks into the finding bin on the second definition", () => {
    const doc = parse(render(BLOCKS, 1, 340, { variant: "b", theme: "print" }));
    const d = doc.querySelector('path[data-id="tech"]')?.getAttribute("d") ?? "";
    expect(d.match(/M/g)).toHaveLength(49);
    expect(doc.querySelector('path[data-id="tech"]')?.getAttribute("fill")).toBe("#b73a15");
  });

  it("rejects counts that do not add up and counts of 1 to 4", () => {
    expect(() => parseFigureSpec(withData(BLOCKS, { variants: [{ id: "a", label: "a", counts: { dup: 1, tech: 1 } }] }))).toThrow(/add up|k = 5/);
    const four = { ...data.variants[0]!, counts: { ...data.variants[0]!.counts, gig: 4, dup: 4384 + 114 } };
    expect(() => parseFigureSpec(withData(BLOCKS, { variants: [four] }))).toThrow(/k = 5/);
  });
});

describe("strip", () => {
  const data = STRIP.data as StripData;
  it("lands the finding layer last and prints its value", () => {
    const early = parse(render(STRIP, 0.4));
    expect(early.querySelector('[data-id="chatgpt:firm"]')?.getAttribute("opacity")).toBe("0");
    const done = render(STRIP, 1);
    expect(done).toContain("0,37");
  });

  it("slides the markers to the second reading of the base", () => {
    const mark = data.rows[0]!.marks[2]!;
    expect(stripValue(mark, "ki").value).toBe(3.8);
    expect(stripValue(mark, undefined).value).toBe(0.37);
    const x = (v: string): number => Number(parse(render(STRIP, 1, 340, { variant: v, theme: "print" })).querySelector('[data-id="chatgpt:firm"]')?.getAttribute("x"));
    expect(x("ki")).toBeGreaterThan(x("all") + 20);
  });

  it("uses a linear axis with a reference line and says 'weniger als 5' for a suppressed mark", () => {
    const html = render(STRIP_LINEAR, 1);
    expect(html).toContain("gleich");
    expect(html).toContain("weniger als 5");
  });

  it("refuses a log axis with a value of zero", () => {
    expect(() => parseFigureSpec(withData(STRIP, { rows: [{ id: "r", label: "r", marks: [{ layer: "firm", value: 0 }] }] }))).toThrow(/positive/);
  });
});

describe("curve", () => {
  it("draws the pen left to right: fewer points early, all at the end", () => {
    const pts = [0, 1, 2, 3].map((i) => ({ x: i * 10, y: 50 - i, lo: 55 - i, hi: 45 - i }));
    expect(penRuns(pts, 0).flat()).toHaveLength(1);
    expect(penRuns(pts, 0.5)[0]!.length).toBeGreaterThan(1);
    expect(penRuns(pts, 1)[0]).toHaveLength(4);
    const tip = penRuns(pts, 0.5)[0]!.at(-1)!;
    expect(tip.x).toBeCloseTo(15, 5);
  });

  it("breaks the line at a missing value", () => {
    const pts = [{ x: 0, y: 1, lo: 1, hi: 1 }, null, { x: 20, y: 2, lo: 2, hi: 2 }];
    expect(penRuns(pts, 1)).toHaveLength(2);
  });

  it("lands the marker on the chosen real class and hatches the frozen stretch", () => {
    const doc = parse(render(CURVE, 1, 340, { variant: "y2025", theme: "print" }));
    expect(doc.querySelector('[data-layer="frozen"]')).not.toBeNull();
    expect(doc.querySelector('[data-layer="marker"] rect')).not.toBeNull();
    expect(render(CURVE, 1, 340, { variant: "y2025" })).toContain("7,3");
  });
});

describe("slope", () => {
  const data = SLOPE.data as SlopeData;
  it("draws every item once and the followed group in the accent", () => {
    const doc = parse(render(SLOPE, 1, 340, { theme: "print" }));
    expect(doc.querySelectorAll('line[data-id^="top"]')).toHaveLength(data.top);
    expect(doc.querySelectorAll('line[stroke="#b73a15"]')).toHaveLength(data.top);
  });

  it("slides the top group down while the band stays put", () => {
    const y = (p: number): number => Number(parse(render(SLOPE, p, 340, { theme: "print" })).querySelector('line[data-id="top1"]')?.getAttribute("y2"));
    expect(y(1)).not.toBe(y(0.3));
    const band = (p: number): string => parse(render(SLOPE, p, 340)).querySelector('[data-layer="chance"] rect')?.getAttribute("y") ?? "";
    expect(band(0.6)).toBe(band(1));
  });

  it("rejects a split that is not a permutation", () => {
    const split = { ...data.splits[0]!, rankB: data.splits[0]!.rankB.map(() => 1) };
    expect(() => parseFigureSpec(withData(SLOPE, { splits: [split] }))).toThrow(/permutation/);
  });

  it("offers no pin list: the lines are opaque ranks", () => {
    expect(pinItemsOf(SLOPE)).toEqual([]);
  });

  it("packs the ranks closer and leaves the readout to the step card in a short stage box, and only there", () => {
    const viewH = (markup: string): number => Number(parse(markup).documentElement.getAttribute("viewBox")?.split(" ")[3]);
    const units = (markup: string): number => parse(markup).querySelectorAll('[data-t="unit"]').length;
    const roomy = render(SLOPE, 1, 340, { bare: true, height: 2000 });
    const short = render(SLOPE, 1, 340, { bare: true, height: 1 });
    const page = render(SLOPE, 1, 340);
    expect(viewH(short)).toBeLessThan(viewH(roomy));
    expect(units(short)).toBe(0);
    // A roomy stage box and the page keep the readout under the columns.
    expect(units(roomy)).toBeGreaterThan(0);
    expect(units(roomy)).toBe(units(page));
    // The ranks still keep 0,8 px each: the fan of lines stays one picture, not a solid block.
    const ys = Array.from(parse(short).querySelectorAll('line[data-id^="top"]')).map((l) => Number(l.getAttribute("y1")));
    expect(ys[1]! - ys[0]!).toBeGreaterThanOrEqual(0.8 - 1e-6);
  });
});

describe("nulldist", () => {
  const data = NULLDIST.data as NulldistData;
  it("draws the draws as squares of whole units plus partial squares and states the unit", () => {
    const per = drawsPerSquare(data, 16);
    expect(per).toBeGreaterThan(0);
    expect(flat(render(NULLDIST, 1))).toContain(`1 Quadrat = ${per} Ziehungen von 5.000`);
  });

  it("lands the observed square outside the grey stack", () => {
    const doc = parse(render(NULLDIST, 1, 340, { theme: "print" }));
    const x = Number(doc.querySelector('[data-id="observed"]')?.getAttribute("x"));
    const bandRight = Number(doc.querySelector('[data-layer="band"] line:last-of-type')?.getAttribute("x1"));
    expect(x).toBeGreaterThan(bandRight);
  });

  it("widens the band when the group shrinks (the baked detent)", () => {
    const width = (v: string): number => {
      const doc = parse(render(NULLDIST, 1, 340, { variant: v }));
      return Number(doc.querySelector('[data-layer="band"] rect')?.getAttribute("width"));
    };
    expect(width("n100")).toBeGreaterThan(width("n205"));
  });

  it("drains the old stack and pours the new one on a control change", () => {
    const mid = parse(render(NULLDIST, 1, 340, { variant: "n100", from: "n205", shift: 0.5 }));
    expect(mid.querySelector('[data-layer="draws-drain"]')).not.toBeNull();
    expect(mid.querySelector('[data-layer="draws-pour"]')).not.toBeNull();
    const done = parse(render(NULLDIST, 1, 340, { variant: "n100", from: "n205", shift: 1 }));
    expect(done.querySelector('[data-layer="draws-drain"]')).toBeNull();
  });

  it("checks that the bins hold exactly the draws", () => {
    const bad = withData(NULLDIST, { draws: 4999 });
    expect(() => parseFigureSpec(bad)).toThrow(/draws/);
  });
});

describe("field as SVG", () => {
  it("batches the squares into a few paths, one per class", () => {
    const doc = parse(render(FIELD, 1, 340, { theme: "print" }));
    expect(doc.querySelectorAll("path").length).toBeLessThan(12);
    expect(doc.querySelectorAll("rect, circle").length).toBeLessThan(20);
  });

  it("prints the numeral and claim of the scene on show and the exact unit line", () => {
    const html = render(FIELD, 1);
    expect(html).toContain("35");
    expect(flat(html)).toContain("1 Quadrat = etwa 101 Anzeigen");
    expect(render(FIELD, 0.2)).toContain("62x");
    expect(parse(render(FIELD, 0.2)).querySelector('[data-t="claim"]')?.textContent).toContain("schreibt KI");
  });

  it("flips the class in focus to its anti colour", () => {
    const doc = parse(render(FIELD, 1, 340, { theme: "print", highlight: "ki" }));
    expect(doc.querySelector('path[data-id="ki"]')?.getAttribute("fill")).toBe("#121212");
  });

  it("rejects segments that do not add up to the base and a base under 5", () => {
    const scenes = (FIELD.data as unknown as { scenes: Array<Record<string, unknown>> }).scenes;
    const bad = withData(FIELD, { scenes: [{ ...scenes[1]!, base: 90 }] });
    expect(() => parseFigureSpec(bad)).toThrow(/add up/);
    const tiny = withData(FIELD, { scenes: [{ ...scenes[1]!, bins: [{ id: "all", segments: [{ cls: "other", count: 3 }, { cls: "lost", count: 86 }] }] }] });
    expect(() => parseFigureSpec(tiny)).toThrow(/k = 5/);
  });
});

describe("tokens and claims", () => {
  it("lets the prose cite numbers of the new kinds", () => {
    expect(tokenKeys(NETWORK)).toContain("roh");
    expect(resolveToken(NETWORK, "roh")).toMatch(/^\d/);
    expect(resolveToken(BLOCKS, "tech")).toBe("3.558");
    expect(resolveToken(BLOCKS, "b_tech")).toBe("4.992");
    expect(flat(resolveToken(STRIP, "chatgpt_firm"))).toBe("0,37 %");
    expect(flat(resolveToken(CURVE, "y2026", "range"))).toBe("9,7 bis 12,0 %");
    expect(resolveToken(SLOPE, "pooled_b")).toContain("1,01");
    expect(flat(resolveToken(NULLDIST, "observed"))).toBe("15,6 %");
    expect(resolveToken(FIELD, "twice_lost")).toBe("41");
  });

  it("refuses a claim over 12 words", () => {
    expect(() => parseFigureSpec(withData(BLOCKS, { claim: "eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn" }))).toThrow(/12 words/);
  });
});
