import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshopBySlug } from "@/lib/workshops";
import { WorkshopDetailContent } from "./workshop-detail-content";

describe("<WorkshopDetailContent>", () => {
  it("leads with the summary and facts, puts the German decision before materials and moves long context into native references", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    const { container } = render(
      <WorkshopDetailContent workshop={workshop!} locale="de" />,
    );

    expect(
      screen.getByRole("heading", { name: workshop!.title }),
    ).toBeInTheDocument();
    const lead = screen.getByText(workshop!.summary);
    expect(lead.closest("header")).not.toBeNull();
    expect(screen.getByText(workshop!.eyebrow)).toHaveTextContent(
      "Workshop 01 · Prognosen",
    );
    expect(screen.getByText(workshop!.description).closest("details")).toBe(
      container.querySelector("details"),
    );
    const access = screen.getByText(/Kein KI-Zugang nötig.*statisch im Browser/);
    const facts = container.querySelector("header dl");
    expect(facts).not.toBeNull();
    expect(facts).toHaveTextContent("Material:6");
    expect(
      lead.compareDocumentPosition(facts!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      facts!.compareDocumentPosition(access) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const lab = screen
      .getByRole("heading", { name: "1.050 Stück. Wer bekommt sie?" })
      .closest("section");
    const materials = screen
      .getByRole("heading", { name: "Material zum Mitnehmen" })
      .closest("section");
    expect(lab).not.toBeNull();
    expect(materials).not.toBeNull();
    expect(
      lab!.compareDocumentPosition(materials!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const references = [...container.querySelectorAll("details")];
    expect(references).toHaveLength(4);
    expect(references.every((detail) => !detail.open)).toBe(true);
    expect(references[0]).toHaveTextContent(/^Worum es geht/);
    expect(screen.getByText("Für wen")).toBeInTheDocument();
    expect(screen.getByText("Die sechs Schritte")).toBeInTheDocument();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("keeps the active surface flat and removes undersized or decorative UI", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/app/workshops/[slug]/workshop-detail-content.tsx",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/motion-safe|motion-reduce|animate-/);
    expect(source).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
    expect(source).not.toMatch(/shadow-/);
    // Stays a Server Component; only the material link hydrates.
    expect(source).not.toMatch(/^["']use client["']/m);
  });

  it("opens HTML materials in the same tab and downloads archives", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de");
    expect(workshop).toBeDefined();
    const { container } = render(
      <WorkshopDetailContent workshop={workshop!} locale="de" />,
    );

    for (const material of workshop!.materials) {
      const link = container.querySelector(`a[href="${material.href}"]`);
      expect(link).not.toBeNull();
      if (material.kind === "zip") {
        // Bare download attribute: the file keeps its published name.
        expect(link).toHaveAttribute("download", "");
        expect(link).not.toHaveAttribute("target");
      } else {
        expect(link).not.toHaveAttribute("target");
        expect(link).not.toHaveAttribute("download");
      }
    }
  });

  it("derives the all-English note from the materials and drops it when one is German", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    const mixed = {
      ...workshop!,
      materials: workshop!.materials.map((material, index) =>
        index === 0 ? { ...material, language: "de" as const } : material,
      ),
    };
    render(<WorkshopDetailContent workshop={mixed} locale="de" />);
    expect(screen.getByText("Kostenlos, ohne Anmeldung.")).toBeInTheDocument();
    expect(screen.queryByText(/Alle Materialien auf Englisch/)).toBeNull();
  });

  it("offers the W01 dataset as a CSV download under its published name", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", locale);
      expect(workshop).toBeDefined();
      const { container, unmount } = render(
        <WorkshopDetailContent workshop={workshop!} locale={locale} />,
      );
      const link = container.querySelector(
        'a[href="/workshops/ki-prognosen-einschaetzen/data/demand-weekly.csv"]',
      );
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("download", "");
      unmount();
    }
  });

  it("preserves every German material exactly once with truthful language labels", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    render(<WorkshopDetailContent workshop={workshop!} locale="de" />);

    expect(
      screen.getByText("Kostenlos, ohne Anmeldung. Alle Materialien auf Englisch."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Das Material selbst bleibt in der angegebenen Sprache."),
    ).toBeNull();
    for (const material of workshop!.materials) {
      expect(material.label).not.toMatch(/Englisch|English|\(|\)/);
    }
    expect(screen.getAllByText("Sprache: Englisch")).toHaveLength(
      workshop!.materials.length,
    );
    expect(
      screen.getByRole("link", { name: "Zurück zu allen Workshops" }),
    ).toHaveAttribute("href", "/workshops");

    const materialSection = screen
      .getByRole("heading", { name: "Material zum Mitnehmen" })
      .closest("section");
    expect(materialSection).not.toBeNull();
    const materialLinks = within(materialSection as HTMLElement).getAllByRole(
      "link",
    );
    expect(materialLinks).toHaveLength(workshop!.materials.length);
    for (const [index, material] of workshop!.materials.entries()) {
      expect(materialLinks[index]).toHaveAttribute("href", material.href);
      expect(materialLinks[index]).toHaveAttribute("hreflang", "en");
    }
  });

  it("renders the English provider boundary and locale-preserving reference experience", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en");
    expect(workshop).toBeDefined();
    const { container } = render(
      <WorkshopDetailContent workshop={workshop!} locale="en" />,
    );

    expect(
      screen.getByRole("heading", { name: "Read business reports with AI" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Claude steps require suitable Claude access/),
    ).toHaveTextContent(/files may reach that service/);
    expect(screen.getByText("Who this is for")).toBeInTheDocument();
    expect(screen.getByText("Practice case")).toBeInTheDocument();
    expect(screen.getByText("Seven steps")).toBeInTheDocument();
    expect(screen.queryByText("Für wen")).toBeNull();

    const caseReference = screen.getByText("Practice case").closest("details");
    expect(caseReference).not.toBeNull();
    fireEvent.click(
      within(caseReference as HTMLElement).getByText("Practice case"),
    );
    expect(
      screen.getByRole("heading", { name: "Apply the method to real data" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Meta Q2 2026 Results/ }),
    ).toHaveAttribute(
      "href",
      "https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/meta-06302026xexhibit991.htm",
    );
    expect(screen.getByText(/unaudited quarterly figures/)).toBeVisible();
    expect(
      container.querySelector('time[datetime="2026-07-29"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('time[datetime="2026-08-26"]'),
    ).not.toBeNull();

    expect(
      screen.getByRole("link", { name: "Back to all workshops" }),
    ).toHaveAttribute("href", "/en/workshops");
    expect(screen.getAllByText("Language: English")).toHaveLength(
      workshop!.materials.length,
    );
    expect(screen.getByText("Free, no sign-up.")).toBeInTheDocument();
    expect(screen.queryByText(/All materials in English/)).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
