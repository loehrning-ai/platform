import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  HIGHLIGHT_BAND_HEIGHT_EM,
  HIGHLIGHT_BAND_OFFSET_EM,
  HighlightedText,
} from "./highlighted-text";

// The line-height every consumer currently pairs this component with
// (leading-[0.9] on buecher-content.tsx and workshops-content.tsx h1s).
// jsdom does not implement layout, so getClientRects() cannot verify real
// non-overlap the way a Playwright spec can -- this asserts the geometry
// invariant that makes overlap impossible regardless of exact rendering:
// the band's offset + height must stay within one line-height stride.
const CONSUMER_LINE_HEIGHT_EM = 0.9;

describe("<HighlightedText>", () => {
  it("keeps the band's offset + height within one line-height stride", () => {
    expect(
      HIGHLIGHT_BAND_OFFSET_EM + HIGHLIGHT_BAND_HEIGHT_EM,
    ).toBeLessThanOrEqual(CONSUMER_LINE_HEIGHT_EM);
  });

  it("paints the band as a sized/positioned background-image, not the content-area background", () => {
    const { container } = render(
      <HighlightedText colorVar="--color-brand-acid">Text</HighlightedText>,
    );
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.style.backgroundImage).toBe(
      "linear-gradient(color-mix(in oklab, var(--color-brand-acid) 80%, transparent), color-mix(in oklab, var(--color-brand-acid) 80%, transparent))",
    );
    expect(span?.style.backgroundSize).toBe(`100% ${HIGHLIGHT_BAND_HEIGHT_EM}em`);
    expect(span?.style.backgroundPosition).toBe(`0px ${HIGHLIGHT_BAND_OFFSET_EM}em`);
    expect(span?.style.backgroundRepeat).toBe("no-repeat");
    expect(span?.className).toContain("box-decoration-clone");
    expect(span?.className).not.toMatch(/\bbg-brand-/);
  });

  it("respects a custom opacity", () => {
    const { container } = render(
      <HighlightedText colorVar="--color-brand-sky" opacity={55}>
        Text
      </HighlightedText>,
    );
    const span = container.querySelector("span");
    expect(span?.style.backgroundImage).toContain(
      "color-mix(in oklab, var(--color-brand-sky) 55%, transparent)",
    );
  });
});
