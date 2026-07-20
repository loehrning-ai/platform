/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DemoCta } from "./demo-cta";
import { trackDemoCta } from "@/lib/analytics";

/**
 * demo-cta.test.tsx (regression coverage)
 *
 * DemoCta is the retro-button link used across the /demos surfaces. Its only
 * logic is (1) the variant -> className switch (primary = orange fill + offset
 * shadow recipe, secondary = plain outline) and (2) firing
 * trackDemoCta(slug, target) on click. next/link renders a plain <a> under
 * jsdom, so we assert the real href, the real class recipe per variant, and the
 * analytics call. @/lib/analytics is mocked so the console.debug dispatcher does
 * not fire and the spy is directly assertable.
 */

vi.mock("@/lib/analytics", () => ({
  trackDemoCta: vi.fn(),
}));

// next/link renders an <a>; we stub it (repo convention: async React.createElement
// in the hoisted factory) so a click resolves the CTA's onClick (trackDemoCta)
// without invoking App Router navigation, which has no provider in jsdom.
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    default: ({ children, href, onClick, ...rest }: any) =>
      React.createElement(
        "a",
        {
          href: typeof href === "string" ? href : "#",
          onClick: (e: any) => {
            e.preventDefault();
            onClick?.(e);
          },
          ...rest,
        },
        children,
      ),
  };
});

describe("<DemoCta>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders its children inside a link that points at href", () => {
    render(
      <DemoCta slug="excel" target="kurs" href="/kurse">
        Kurs öffnen
      </DemoCta>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/kurse");
    expect(link).toHaveTextContent("Kurs öffnen");
  });

  it("uses the primary (orange fill + offset shadow) recipe by default", () => {
    render(
      <DemoCta slug="excel" target="kurs" href="/kurse">
        Weiter
      </DemoCta>,
    );
    const cls = screen.getByRole("link").className;
    expect(cls).toContain("bg-brand-orange");
    expect(cls).toContain("border-2");
    expect(cls).toContain("shadow-[3px_3px_0_0_var(--color-foreground)]");
  });

  it("uses the plain outline recipe (no orange fill) for the secondary variant", () => {
    render(
      <DemoCta
        slug="excel"
        target="back-to-gallery"
        href="/demos"
        variant="secondary"
      >
        Zur Galerie
      </DemoCta>,
    );
    const cls = screen.getByRole("link").className;
    expect(cls).not.toContain("bg-brand-orange");
    expect(cls).not.toContain("border-2");
    expect(cls).toContain("transition-colors");
    expect(cls).toContain("hover:bg-foreground");
  });

  it("fires trackDemoCta with the slug and target on click", () => {
    render(
      <DemoCta
        slug="rag-vertragsassistent"
        target="lektion"
        href="/eu-ai-act-kurs/kurs/block_2"
      >
        Zur Lektion
      </DemoCta>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(trackDemoCta).toHaveBeenCalledTimes(1);
    expect(trackDemoCta).toHaveBeenCalledWith("rag-vertragsassistent", "lektion");
  });
});
