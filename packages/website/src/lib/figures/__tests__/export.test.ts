// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { PRINT_OPTIONS, renderFigureMarkup, renderStandaloneSvg } from "../export.ts";
import { ALL_FIXTURES, WATERFALL } from "./fixtures.ts";

describe("standalone SVG for the PDF", () => {
  it.each(ALL_FIXTURES.map((spec) => [spec.id, spec] as const))("writes %s as a self-contained file", (_id, spec) => {
    const svg = renderStandaloneSvg(spec);
    expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    const root = doc.documentElement;
    expect(root.getAttribute("width")).toBe(String(PRINT_OPTIONS.width));
    expect(root.getAttribute("viewBox")).toMatch(/^0 0 640 /);
    expect(svg).not.toMatch(/var\(|currentColor|<script|<style|<use|clip-path|<filter|foreignObject/);
    expect(svg).not.toMatch(/\bopacity=|\btransform=/);
  });

  it("equals the web render at progress 1 apart from theme and size", () => {
    const standalone = renderStandaloneSvg(WATERFALL, { width: 640 });
    const markup = renderFigureMarkup(WATERFALL, 1, PRINT_OPTIONS);
    expect(standalone).toBe(`<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`);
  });

  it("lets the caller override the width", () => {
    expect(renderStandaloneSvg(WATERFALL, { width: 500 })).toContain('viewBox="0 0 500 ');
  });
});
