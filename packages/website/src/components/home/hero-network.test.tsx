/**
 * hero-network.test.tsx (regression coverage)
 *
 * HeroNetwork is a rotating-globe SVG whose heavy spherical-projection helpers
 * (buildGrid / projectRings / projectRingsClosed / createProjector / ll3d /
 * dp) are module-private, so they cannot be imported directly. They are
 * exercised end-to-end by the component's STATIC fallback render (mobile +
 * prefers-reduced-motion), which projects the real world-atlas country
 * polylines at Berlin and emits distinguishable SVG paths. The animated path
 * begins with a sparse declarative frame generated from the same geometry;
 * its rAF loop replaces that shell after the client mount.
 *
 * We also assert the exported STEPS journey data (order, coordinate ranges,
 * the San-Francisco rotation override, and real diacritic spellings).
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { motionValue } from "framer-motion";
import { HeroNetwork, STEPS } from "./hero-network";

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
  it("desktop animated mode emits the real first-paint shell and lays out label + cursor", () => {
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} />,
    );

    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "running",
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
    const shell = container.querySelector("[data-hero-network-shell]");
    expect(shell).not.toBeNull();
    expect(shell?.querySelectorAll("path").length).toBeGreaterThan(0);
    // The typing word + blinking cursor <text> nodes are present.
    expect(container.querySelectorAll("text")).toHaveLength(2);
  });

  it("mobile mode renders the static Berlin graticule and countries without a label", () => {
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} mobile />,
    );

    // buildGrid produced real front-facing graticule segments.
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
    // The mobile static composition now matches the desktop first frame.
    expect(
      container.querySelectorAll('path[stroke="#C4431A"]').length,
    ).toBeGreaterThan(0);
    expect(container.querySelector("[data-hero-network-shell]")).toBeNull();
    // Label + cursor are gated behind !mobile.
    expect(container.querySelectorAll("text")).toHaveLength(0);
    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "static",
    );
  });

  it("clears imperative live layers when the viewport switches to mobile", () => {
    const { container, rerender } = render(
      <HeroNetwork scrollProgress={motionValue(0)} />,
    );
    const liveLayer = container.querySelector(
      '[data-hero-network-live="grid-back"]',
    );

    // Model the real rAF-owned DOM: these children are not part of React's
    // virtual tree and must be removed explicitly when static mode takes over.
    const injectedPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    liveLayer?.appendChild(injectedPath);
    expect(injectedPath.isConnected).toBe(true);

    rerender(<HeroNetwork scrollProgress={motionValue(0)} mobile />);

    expect(injectedPath.isConnected).toBe(false);
    expect(liveLayer).toHaveAttribute("display", "none");
    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "static",
    );
  });

  it("marks an explicit user pause while preserving the first-paint shell", () => {
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} paused />,
    );

    expect(container.firstElementChild).toHaveAttribute(
      "data-hero-network-motion",
      "paused",
    );
    expect(container.querySelector("[data-hero-network-shell]")).not.toBeNull();
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("reduced-motion mode renders the full static composition: grid + Kupfer countries + hatch fills + label", () => {
    const { container } = render(
      <HeroNetwork scrollProgress={motionValue(0)} reducedMotion />,
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
    expect(container.querySelector("[data-hero-network-shell]")).toBeNull();
  });
});
