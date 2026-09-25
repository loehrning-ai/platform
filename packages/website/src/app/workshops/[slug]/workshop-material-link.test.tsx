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

const CSV: WorkshopMaterial = {
  label: "Dataset",
  href: "/workshops/example/data/demand-weekly.csv",
  kind: "csv",
  language: "en",
  description: "The practice data.",
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
    // Bare attribute: the browser keeps the published file name (for example northwind-analyst-kit.zip).
    expect(link).toHaveAttribute("download", "");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
    expect(link).toHaveClass("material-row");
  });

  it("downloads CSV material under its published file name", () => {
    render(
      <WorkshopMaterialLink workshopSlug="ki-prognosen-einschaetzen" material={CSV}>
        Dataset
      </WorkshopMaterialLink>,
    );
    const link = screen.getByRole("link", { name: "Dataset" });
    expect(link).toHaveAttribute("download", "");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens same-origin HTML material in the same tab, so the page's own back link returns here", () => {
    render(
      <WorkshopMaterialLink
        workshopSlug="ki-prognosen-einschaetzen"
        material={HTML}
      >
        Slides
      </WorkshopMaterialLink>,
    );
    const link = screen.getByRole("link", { name: "Slides" });
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
    expect(link).toHaveAttribute("hreflang", "de");
    expect(link).not.toHaveAttribute("download");
  });

  it.each([
    [ZIP, "zip"],
    [HTML, "html"],
    [CSV, "csv"],
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
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("download");
  });
});
