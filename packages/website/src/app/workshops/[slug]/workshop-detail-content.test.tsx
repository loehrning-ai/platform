import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshopBySlug } from "@/lib/workshops";
import { WorkshopDetailContent } from "./workshop-detail-content";

describe("<WorkshopDetailContent>", () => {
  it("puts the German decision before materials and moves long context into native references", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    const { container } = render(
      <WorkshopDetailContent workshop={workshop!} locale="de" />,
    );

    expect(
      screen.getByRole("heading", { name: workshop!.title }),
    ).toBeInTheDocument();
    expect(screen.queryByText(workshop!.summary)).toBeNull();
    expect(screen.queryByText(workshop!.description)).toBeNull();
    expect(
      screen.getByText(/Kein KI-Zugang nötig.*statisch im Browser/),
    ).toBeInTheDocument();

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
    expect(references).toHaveLength(3);
    expect(references.every((detail) => !detail.open)).toBe(true);
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
  });

  it("preserves every German material exactly once with truthful language labels", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    render(<WorkshopDetailContent workshop={workshop!} locale="de" />);

    expect(
      screen.getByText(
        "Kostenlos und ohne Anmeldung abrufbar. Die Sprache steht an jedem Material.",
      ),
    ).toBeInTheDocument();
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
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
