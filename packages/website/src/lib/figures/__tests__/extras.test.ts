import { describe, expect, it } from "vitest";
import { renderFigureMarkup } from "../export.ts";
import { parseFigureSpec } from "../validate.ts";
import {
  quantityFor,
  resolveToken,
  resolveTokens,
  resolveTokensDeep,
  TokenError,
  tokenKeys,
} from "../tokens.ts";
import type { FigureSpec } from "../types.ts";
import { BARS_H, DOTPLOT, LADDER, WATERFALL } from "./fixtures.ts";

const render = (spec: FigureSpec, p = 1, width = 560, extra = {}) => renderFigureMarkup(spec, p, { width, ...extra });

/* ------------------------------------------------------------- ghost bars */

describe("stepped waterfall ghost bars (review item 6)", () => {
  const stepped: FigureSpec = {
    ...WATERFALL,
    steps: [
      { id: "a", label: "Erster", reveal: ["raw"], focus: ["raw"] },
      { id: "b", label: "Zweiter", reveal: ["own"], focus: ["own"] },
    ],
  };
  const ids = (WATERFALL as Extract<FigureSpec, { kind: "waterfall" }>).data.items.map((i) => i.id);

  it("outlines the bars that come in a later step, for both layouts", () => {
    for (const width of [360, 560]) {
      const markup = render(stepped, 0.5, width);
      const ghosts = [...markup.matchAll(/data-ghost="([^"]+)"/g)].map((m) => m[1]);
      expect(ghosts.length).toBeGreaterThan(0);
      expect(ghosts).not.toContain(ids[0]);
      expect(markup).toContain("kommt noch");
    }
  });

  it("leaves no ghost in the finished figure, so print and reduced motion are unchanged", () => {
    expect(render(stepped, 1)).not.toContain("data-ghost");
    expect(render(stepped, 1)).not.toContain("kommt noch");
  });

  it("draws no ghost for a waterfall without steps", () => {
    expect(render({ ...WATERFALL, steps: undefined } as FigureSpec, 0.5)).not.toContain("data-ghost");
  });
});

/* ------------------------------------------------------------- annotation */

describe("annotation (review item 9)", () => {
  const annotated = (spec: FigureSpec, id: string, text: string): FigureSpec => ({ ...spec, annotation: { id, text } });

  it("draws the note with a leader into the finished figure", () => {
    const markup = render(annotated(BARS_H, "q5", "Fast zwölfmal so oft"), 1, 560);
    expect(markup).toContain('data-annotation="q5"');
    expect(markup).toContain("Fast zwölfmal so oft");
    expect(markup).toMatch(/<line [^>]*stroke="#121212"/);
  });

  it("appears only at the end of the progress, so a step in the middle stays clean", () => {
    expect(render(annotated(BARS_H, "q5", "Note"), 0.4)).not.toContain("data-annotation");
    expect(render(annotated(BARS_H, "q5", "Note"), 1)).toContain("data-annotation");
  });

  it("adds the note to the text description, so assistive technology gets it too", () => {
    expect(render(annotated(DOTPLOT, DOTPLOT.kind === "dotplot" ? DOTPLOT.data.items[0]!.id : "", "Hinweistext"), 1)).toContain(
      "Hinweis in der Abbildung: Hinweistext",
    );
  });

  it("keeps the note inside the viewBox on a phone", () => {
    const markup = render(annotated(BARS_H, "q5", "Ein längerer Hinweis, der in mehrere Zeilen umbrochen werden muss"), 1, 360);
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(markup);
    expect(box).not.toBeNull();
    const width = Number(box?.[1]);
    const xs = [...markup.matchAll(/<tspan x="([\d.]+)"/g)].map((m) => Number(m[1]));
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
    }
  });

  it("leaves the note out when it would have to cover marks or words", () => {
    const crowded = { ...BARS_H, annotation: { id: "q5", text: "Ein Hinweis, der nirgends hin passt, weil der Platz fehlt und die Beschriftungen im Weg stehen" } } as FigureSpec;
    expect(render(crowded, 1, 280)).not.toContain("data-annotation");
  });

  it("does nothing when the element does not exist", () => {
    expect(render(annotated(BARS_H, "gibt-es-nicht", "Note"), 1)).not.toContain("data-annotation");
  });

  it("is rejected by the validator when it has no text", () => {
    const bad = JSON.parse(JSON.stringify({ ...BARS_H, annotation: { id: "q5", text: "" } }));
    expect(() => parseFigureSpec(bad)).toThrow(/annotation/);
  });
});

/* ------------------------------------------------------------------ ladder */

describe("C1 ladder dimming (review item 10)", () => {
  it("dims the marks of an unselected rung but keeps its words readable", () => {
    const markup = render(LADDER, 1, 560, { highlight: "ours" });
    // Text stays at 0.92, the group no longer carries a 0.4 opacity.
    expect(markup).not.toMatch(/<g data-id="[^"]+" opacity="0\.4"/);
    expect(markup).toMatch(/<text [^>]*opacity="0\.92"/);
    expect(markup).toMatch(/<circle [^>]*opacity="0\.4"/);
  });

  it("is unchanged without a highlight", () => {
    expect(render(LADDER, 1, 560)).not.toContain('opacity="0.92"');
  });
});

/* ------------------------------------------------------------------ tokens */

const spec = (extra: Partial<Record<string, unknown>> = {}): FigureSpec =>
  parseFigureSpec({
    id: "t4",
    kind: "waterfall",
    title: "T",
    alt: "A",
    caption: "C",
    n: 37429,
    source: "S",
    asOf: "2026-10-18",
    limitation: "L",
    data: {
      fmt: { style: "percent", digits: 1 },
      items: [
        { id: "raw", label: "Roh", kind: "total", value: 8.2, n: 37429 },
        { id: "shared", label: "Geteilt", kind: "delta", value: -3.9 },
        { id: "own", label: "Eigene", kind: "total", value: 4.3, n: 25581 },
        { id: "weighted_total", label: "Gewichtet", kind: "total", value: 3.8, n: 24944 },
      ],
    },
    meta: {
      methodVersion: "v0-pre-rescan",
      aliases: { raw_share: "raw" },
      values: {
        weighted_share: { ref: "weighted_total", lo: 3.55, hi: 4.07 },
        ratio: { value: 1.68, lo: 1.4, hi: 2.09, fmt: { style: "decimal", digits: 2 } },
        sites: { value: 25581, fmt: { style: "number", digits: 0 } },
      },
    },
    ...extra,
  });

describe("number tokens", () => {
  const lookup = (id: string) => (id.toLowerCase() === "t4" ? spec() : undefined);

  it("resolves an alias, a value, an element id and the sample size", () => {
    expect(resolveToken(spec(), "raw_share")).toBe("8,2 %");
    expect(resolveToken(spec(), "weighted_share")).toBe("3,8 %");
    expect(resolveToken(spec(), "OWN")).toBe("4,3 %");
    expect(resolveToken(spec(), "n")).toBe("37.429");
    expect(resolveToken(spec(), "sites")).toBe("25.581");
  });

  it("takes a restated number from the element, so it cannot drift from the chart", () => {
    const changed = spec();
    const items = (changed.data as unknown as { items: { id: string; value: number }[] }).items;
    items.find((i) => i.id === "weighted_total")!.value = 4.0;
    expect(resolveToken(changed, "weighted_share")).toBe("4,0 %");
  });

  it("knows the fields: num, lo, hi, range, n and a digits override", () => {
    expect(resolveToken(spec(), "weighted_share", "num")).toBe("3,8");
    expect(resolveToken(spec(), "weighted_share", "lo")).toBe("3,6 %");
    expect(resolveToken(spec(), "weighted_share", "range")).toBe("3,6 bis 4,1 %");
    expect(resolveToken(spec(), "weighted_share", "n")).toBe("24.944");
    expect(resolveToken(spec(), "weighted_share", "value", 0)).toBe("4 %");
    expect(resolveToken(spec(), "ratio")).toBe("1,68");
  });

  it("prints a real minus for a change", () => {
    expect(resolveToken(spec(), "shared")).toBe("−3,9 %");
  });

  it("replaces tokens in a text and in nested copy", () => {
    expect(resolveTokens("Roh {{t4.raw_share}}, gewichtet {{t4.weighted_share:0}}.", lookup)).toBe("Roh 8,2 %, gewichtet 4 %.");
    const copy = resolveTokensDeep({ a: ["{{t4.own}}"], b: { c: "{{t4.n}}" }, d: 3 }, lookup);
    expect(copy).toEqual({ a: ["4,3 %"], b: { c: "37.429" }, d: 3 });
  });

  it("writes English separators for the English edition", () => {
    expect(resolveTokens("{{t4.weighted_share.range}} {{t4.n}}", lookup, "en")).toBe("3.6 to 4.1% 37,429");
  });

  it("fails loudly for an unknown figure, key or field", () => {
    expect(() => resolveTokens("{{x9.a}}", lookup)).toThrow(TokenError);
    expect(() => resolveTokens("{{t4.gibt_es_nicht}}", lookup)).toThrow(/Available/);
    expect(() => resolveToken(spec(), "raw", "range")).toThrow(/lower bound/);
  });

  it("never prints a suppressed value", () => {
    const withNull = parseFigureSpec({
      id: "t5",
      kind: "bars",
      title: "T",
      alt: "A",
      caption: "C",
      n: 100,
      source: "S",
      asOf: "2026-10-18",
      limitation: "L",
      data: { fmt: { style: "percent", digits: 1 }, items: [{ id: "a", label: "A", value: null }] },
    });
    expect(() => resolveToken(withNull, "a")).toThrow(/suppressed/);
    expect(tokenKeys(withNull)).not.toContain("a");
  });

  it("exposes the quantity of a key with interval and format", () => {
    const q = quantityFor(spec(), "weighted_share");
    expect(q).toMatchObject({ value: 3.8, lo: 3.55, hi: 4.07, n: 24944 });
  });

  it("rejects a malformed meta in the validator", () => {
    expect(() => parseFigureSpec({ ...JSON.parse(JSON.stringify(spec())), meta: { values: { Bad: { value: 1 } } } })).toThrow(/token names/);
    expect(() => parseFigureSpec({ ...JSON.parse(JSON.stringify(spec())), meta: { values: { ok: {} } } })).toThrow(/value or a ref/);
  });
});
