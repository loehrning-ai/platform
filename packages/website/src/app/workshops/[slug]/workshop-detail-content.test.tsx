import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshopBySlug } from "@/lib/workshops";
import { WorkshopDetailContent } from "./workshop-detail-content";

describe("<WorkshopDetailContent>", () => {
  it("renders German labels, exact access facts, and unprefixed source files", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    render(<WorkshopDetailContent workshop={workshop!} locale="de" />);

    expect(screen.getByRole("heading", { name: workshop!.title })).toBeInTheDocument();
    expect(screen.getByText("Für wen")).toBeInTheDocument();
    expect(screen.getByText("Die sechs Schritte")).toBeInTheDocument();
    expect(
      screen.getByText("Kostenlos und ohne Anmeldung abrufbar. Die Sprache steht an jedem Material."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Sprache: Englisch")).toHaveLength(
      workshop!.materials.length,
    );
    expect(screen.getByRole("link", { name: "Zurück zu allen Workshops" })).toHaveAttribute(
      "href",
      "/workshops",
    );
    expect(screen.getByRole("link", { name: "Workshop-Hub (Englisch)" })).toHaveAttribute(
      "href",
      workshop!.materials[0]?.href,
    );
  });

  it("renders the complete English case, controls, and locale-preserving page links", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en");
    expect(workshop).toBeDefined();
    render(<WorkshopDetailContent workshop={workshop!} locale="en" />);

    expect(screen.getByRole("heading", { name: "Read business reports with AI" })).toBeInTheDocument();
    expect(screen.getByText("Who this is for")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Practice case" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Apply the method to real data" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seven steps" })).toBeInTheDocument();
    expect(screen.queryByText("Für wen")).toBeNull();
    expect(screen.getAllByText("Language: English")).toHaveLength(
      workshop!.materials.length,
    );

    for (const link of screen.getAllByRole("link", { name: "All workshops" })) {
      expect(link).toHaveAttribute("href", "/en/workshops");
    }

    const materialSection = screen
      .getByRole("heading", { name: "Workshop materials" })
      .closest("section");
    expect(materialSection).not.toBeNull();
    const materialLinks = within(materialSection as HTMLElement).getAllByRole("link");
    expect(materialLinks).toHaveLength(workshop!.materials.length);
    for (const [index, material] of workshop!.materials.entries()) {
      expect(materialLinks[index]).toHaveAttribute("href", material.href);
      expect(materialLinks[index]).toHaveAttribute("hreflang", "en");
    }
  });
});
