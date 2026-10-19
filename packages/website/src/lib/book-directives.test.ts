import { describe, expect, it } from "vitest";
import {
  DirectiveError,
  figureIdsOf,
  figureKey,
  hasDirectives,
  listDirectives,
  parseDirective,
  replaceDirectives,
} from "./book-directives";

describe("parseDirective", () => {
  it("reads a figure line in any case", () => {
    expect(parseDirective('::figure{id="C4"}')).toEqual({
      name: "figure",
      attrs: { id: "C4" },
      source: '::figure{id="C4"}',
    });
    expect(figureKey(" C4 ")).toBe("c4");
  });

  it("reads several attributes, including sentences with commas and umlauts", () => {
    const d = parseDirective('::ticker{ref="c4.weighted_share" tail="der Firmen mit Website, die KI schreiben."}');
    expect(d?.attrs).toEqual({ ref: "c4.weighted_share", tail: "der Firmen mit Website, die KI schreiben." });
  });

  it("ignores ordinary lines", () => {
    expect(parseDirective("Ein Satz mit :: und {braces}.")).toBeNull();
    expect(parseDirective("::: nicht dies")).toBeNull();
    expect(parseDirective("")).toBeNull();
  });

  it("fails loudly for unknown names, missing attributes and unreadable attributes", () => {
    expect(() => parseDirective('::chart{id="C4"}')).toThrow(DirectiveError);
    expect(() => parseDirective("::figure{}")).toThrow(/needs id/);
    expect(() => parseDirective("::figure{id=C4}")).toThrow(/cannot read/);
    expect(() => parseDirective('::ticker{ref="c4.x"}')).toThrow(/needs tail/);
  });
});

describe("listDirectives", () => {
  const doc = [
    "Text.",
    '::figure{id="C1"}',
    "```",
    '::figure{id="C99"}',
    "```",
    "~~~md",
    '::figure{id="C98"}',
    "~~~",
    '  ::figure{id="C2"}  ',
    '::ticker{ref="c4.weighted_share" tail="Test."}',
  ].join("\n");

  it("lists directives in reading order and skips code fences", () => {
    expect(listDirectives(doc).map((d) => d.name)).toEqual(["figure", "figure", "ticker"]);
    expect(figureIdsOf(doc)).toEqual(["c1", "c2"]);
    expect(hasDirectives(doc)).toBe(true);
    expect(hasDirectives("Nur Text.")).toBe(false);
  });

  it("replaces directive lines and leaves the rest as it was", () => {
    const out = replaceDirectives(doc, (d) => (d.name === "figure" ? `*Abbildung ${d.attrs["id"]}*` : null));
    expect(out).toContain("*Abbildung C1*");
    expect(out).toContain("*Abbildung C2*");
    expect(out).toContain('::figure{id="C99"}');
    expect(out).not.toContain("::ticker");
  });
});
