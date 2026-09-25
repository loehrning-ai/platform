import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { trackMaterialOpened } from "@/lib/analytics/events";
import type { WorkshopMaterial } from "@/lib/workshops";
import { WorkshopMaterialLink } from "./workshop-material-link";

vi.mock("@/lib/analytics/events", () => ({ trackMaterialOpened: vi.fn() }));

const trackMock = vi.mocked(trackMaterialOpened);

const ZIP: WorkshopMaterial = {
  label: "Kit",
  href: "/workshops/example/kit.zip",
  kind: "zip",
  language: "en",
  description: "Everything in one archive.",
};

const HTML: WorkshopMaterial = {
  label: "Slides",
  href: "/workshops/example/slides.html",
  kind: "html",
  language: "de",
  description: "Opens in the browser.",
};

/** Keep jsdom from attempting a navigation when a link is clicked. */
function preventNavigation(link: HTMLElement) {
  link.addEventListener("click", (event) => event.preventDefault());
}

afterEach(() => {
  cleanup();
  trackMock.mockClear();
});

describe("<WorkshopMaterialLink>", () => {
  it("keeps the download branch for ZIP material, without a new tab", () => {
    render(
      <WorkshopMaterialLink
        workshopSlug="ki-prognosen-einschaetzen"
        material={ZIP}
        className="material-row"
      >
        <span>Kit</span>
      </WorkshopMaterialLink>,
    );
    const link = screen.getByRole("link", { name: "Kit" });
    expect(link).toHaveAttribute("href", ZIP.href);
    expect(link).toHaveAttribute("hreflang", "en");
    expect(link).toHaveAttribute("download", "ki-prognosen-einschaetzen-kit.zip");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
    expect(link).toHaveClass("material-row");
  });

  it("opens same-origin HTML material in a new tab with noopener, keeping the referrer for the locale-aware back link", () => {
    render(
      <WorkshopMaterialLink
        workshopSlug="ki-prognosen-einschaetzen"
        material={HTML}
      >
        Slides
      </WorkshopMaterialLink>,
    );
    const link = screen.getByRole("link", { name: "Slides" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(link).toHaveAttribute("hreflang", "de");
    expect(link).not.toHaveAttribute("download");
  });

  it.each([
    [ZIP, "zip"],
    [HTML, "html"],
  ] as const)(
    "counts a click with only the workshop slug and the %s kind",
    (material, kind) => {
      render(
        <WorkshopMaterialLink
          workshopSlug="geschaeftsberichte-mit-ki-lesen"
          material={material}
        >
          Open
        </WorkshopMaterialLink>,
      );
      const link = screen.getByRole("link", { name: "Open" });
      preventNavigation(link);
      fireEvent.click(link);

      expect(trackMock.mock.calls).toEqual([
        ["geschaeftsberichte-mit-ki-lesen", kind],
      ]);
    },
  );

  it("sends nothing for a workshop slug outside the registered vocabulary", () => {
    render(
      <WorkshopMaterialLink workshopSlug="unregistered-workshop" material={HTML}>
        Open
      </WorkshopMaterialLink>,
    );
    const link = screen.getByRole("link", { name: "Open" });
    preventNavigation(link);
    fireEvent.click(link);
    expect(trackMock).not.toHaveBeenCalled();
    expect(link).toHaveAttribute("target", "_blank");
  });
});
