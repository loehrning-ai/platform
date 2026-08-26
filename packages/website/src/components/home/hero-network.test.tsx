/**
 * hero-network.test.tsx (regression coverage)
 *
 * HeroNetwork is a rotating-globe SVG whose heavy spherical-projection helpers
 * (buildGrid / projectRings / projectRingsClosed / project / ll3d / rX / rY /
 * dp) are module-private, so they cannot be imported directly. They ARE
 * exercised end-to-end by the component's STATIC fallback render (mobile +
 * prefers-reduced-motion), which projects the real world-atlas country
 * polylines at Berlin and emits distinguishable SVG paths. The animated path
 * defers all geometry to a rAF loop that never fires under the jsdom
 * IntersectionObserver mock, so at rest it emits zero static paths -- which is
 * itself an assertable contract.
 *
 * We also assert the exported STEPS journey data (order, coordinate ranges,
 * the San-Francisco rotation override, and real diacritic spellings).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { motionValue, useReducedMotion } from "framer-motion";
import { HeroNetwork, STEPS } from "./hero-network";

// Only useReducedMotion is overridden; every other framer-motion export
// (motionValue, the m.* proxies, types) stays real.
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

const mockedReducedMotion = vi.mocked(useReducedMotion);

afterEach(() => {
  mockedReducedMotion.mockReturnValue(false);
});

describe("STEPS journey data", () => {
  it("labels the six public-resource beats in canonical order", () => {
    expect(STEPS.map((s) => s.word)).toEqual([
      "Kurse",
      "Bücher",
      "Open Source",
      "Demos",
      "EU AI Act",
      "Blog",
    ]);
  });

  it("keeps every city coordinate inside valid lat/lon ranges", () => {
    for (const step of STEPS) {
      expect(step.lat).toBeGreaterThanOrEqual(-90);
      expect(step.lat).toBeLessThanOrEqual(90);
      expect(step.lon).toBeGreaterThanOrEqual(-180);
      expect(step.lon).toBeLessThanOrEqual(180);
      expect(step.city.length).toBeGreaterThan(0);
    }
  });

  it("overrides globe rotation for San Francisco only, framing the USA off the headline", () => {
    const sf = STEPS[3];
    expect(sf.city).toBe("SAN FRANCISCO");
    expect(sf.rLon).toBe(-82);
    // The override intentionally differs from the city's true longitude.
    expect(sf.rLon).not.toBe(sf.lon);
    // Exactly one step carries a rotation override.
    expect(STEPS.filter((s) => s.rLon !== undefined)).toHaveLength(1);
  });

  it("uses real diacritic city/word spellings, never ASCII substitutes", () => {
    const cities = STEPS.map((s) => s.city);
    expect(cities).toContain("SÃO PAULO");
    expect(cities).toContain("TŌKYŌ");
    expect(STEPS[1].word).toBe("Bücher"); // ü, not "Buecher"
  });
});

describe("HeroNetwork render branches", () => {
  it("desktop animated mode emits no static geometry but still lays out label + cursor", () => {
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} />,
    );

    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "running",
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
    // Grid + country <g> groups are filled by the rAF loop, which the jsdom
    // IntersectionObserver mock never triggers -> zero static <path> at rest.
    expect(container.querySelectorAll("path")).toHaveLength(0);
    // The typing word + blinking cursor <text> nodes are present.
    expect(container.querySelectorAll("text")).toHaveLength(2);
  });

  it("mobile mode renders the static Berlin graticule and hides label + countries", () => {
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} mobile />,
    );

    // buildGrid produced real front-facing graticule segments.
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
    // Country outlines are desktop-reduced-motion only -> no Kupfer strokes here.
    expect(container.querySelectorAll('path[stroke="#C4431A"]')).toHaveLength(
      0,
    );
    // Label + cursor are gated behind !mobile.
    expect(container.querySelectorAll("text")).toHaveLength(0);
    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "static",
    );
  });

  it("marks an explicit user pause without switching to reduced-motion geometry", () => {
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} paused />,
    );

    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "paused",
    );
    expect(container.querySelectorAll("path")).toHaveLength(0);
  });

  it("reduced-motion mode renders the full static composition: grid + Kupfer countries + hatch fills + label", () => {
    mockedReducedMotion.mockReturnValue(true);
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} />,
    );

    // Graticule.
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
    // projectRings emitted at least one front-facing country outline (Berlin).
    expect(
      container.querySelectorAll('path[stroke="#C4431A"]').length,
    ).toBeGreaterThan(0);
    // projectRingsClosed emitted at least one closed hatch fill.
    expect(
      container.querySelectorAll('path[fill="url(#countryHatch)"]').length,
    ).toBeGreaterThan(0);
    // Label + cursor present; the cursor shows the underscore glyph.
    const texts = Array.from(container.querySelectorAll("text"));
    expect(texts).toHaveLength(2);
    expect(texts.some((t) => t.textContent === "_")).toBe(true);
    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "static",
    );
  });
});
