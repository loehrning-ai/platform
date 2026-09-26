import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshopBySlug, getWorkshops } from "@/lib/workshops";
import { WorkshopDetailContent } from "./workshop-detail-content";

function follows(first: Element, second: Element): boolean {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

function sectionOf(name: string | RegExp): HTMLElement {
  const section = screen.getByRole("heading", { name }).closest("section");
  expect(section, String(name)).not.toBeNull();
  return section as HTMLElement;
}

describe("<WorkshopDetailContent>", () => {
  it("puts the cover, the agenda, the decision lab and the materials in that order, with no collapsed reference block", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );

    const h1 = screen.getByRole("heading", { level: 1, name: workshop.title });
    const cover = h1.closest("[data-cover-band]");
    expect(cover).not.toBeNull();
    expect(cover).toHaveClass("dark-section");
    expect(within(cover as HTMLElement).getByText(workshop.eyebrow)).toHaveTextContent(
      "Workshop 01 · Prognosen",
    );
    expect(within(cover as HTMLElement).getByText(workshop.summary)).toBeInTheDocument();
    // The fixed question sits in the dark q-card, once per page.
    const questionCards = container.querySelectorAll("[data-question-card]");
    expect(questionCards).toHaveLength(1);
    expect(questionCards[0]).toHaveAttribute("data-question-card", "dark");
    expect(questionCards[0]).toHaveTextContent(workshop.question);
    expect(cover).toHaveTextContent("Allein ca. 90 Min.");
    expect(cover).toHaveTextContent("Du gehst mit:Go/No-Go-Regel");
    expect(cover).toHaveTextContent("Du brauchst:einen Browser, kein KI-Konto");

    const agenda = sectionOf("Ablauf");
    const lab = container.querySelector("[data-workshop-decision-lab]")!;
    const materials = sectionOf("Material");
    expect(follows(cover!, agenda)).toBe(true);
    expect(follows(agenda, lab)).toBe(true);
    expect(follows(lab, materials)).toBe(true);

    // The Route lists every agenda item with its minutes, as an ordered list.
    const route = within(agenda).getByRole("list", { name: "Ablauf" });
    const stations = within(route).getAllByRole("listitem");
    expect(stations).toHaveLength(workshop.agenda.length);
    for (const [index, item] of workshop.agenda.entries()) {
      expect(stations[index]).toHaveTextContent(item.label);
      expect(stations[index]).toHaveTextContent(`${item.minutes} Min.`);
    }
    expect(agenda).toHaveTextContent(
      "Geplante Minuten, noch nicht mit Testpersonen gemessen.",
    );

    expect(container.querySelectorAll("details")).toHaveLength(0);
    expect(screen.queryByText("Referenz")).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("promotes the case, audience, outcomes, needs and limits into visible sections", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );

    const caseSection = sectionOf("Der Fall");
    expect(caseSection).toHaveTextContent(workshop.caseStudy.narrative);
    expect(caseSection).toHaveTextContent(workshop.caseStudy.decisionQuestion);
    const stats = caseSection.querySelector("dl");
    expect(stats).not.toBeNull();
    expect(within(stats as HTMLElement).getAllByRole("term")).toHaveLength(
      workshop.caseStudy.metrics.length,
    );
    const gap = caseSection.querySelector('[data-callout="gap"]');
    expect(gap).toHaveTextContent("Was die Daten nicht beantworten");
    for (const limitation of workshop.caseStudy.dataLimitations) {
      expect(gap).toHaveTextContent(limitation);
    }

    const audience = sectionOf("Für wen");
    for (const line of workshop.audience) expect(audience).toHaveTextContent(line);
    expect(audience).toHaveTextContent(workshop.notForYou);
    const outcomes = sectionOf("Danach kannst du");
    for (const line of workshop.outcomes) expect(outcomes).toHaveTextContent(line);
    expect(outcomes).toHaveTextContent(`Du gehst mit: ${workshop.outcome}`);

    const needs = sectionOf("Das brauchst du");
    for (const line of [...workshop.needs, ...workshop.notNeeded]) {
      expect(needs).toHaveTextContent(line);
    }
    expect(needs.querySelector('[data-callout="boundary"]')).toHaveTextContent(
      workshop.accessNote,
    );
    const notCovered = sectionOf("Nicht Teil dieses Workshops");
    for (const line of workshop.notCovered) {
      expect(notCovered).toHaveTextContent(line);
    }

    const provenance = container.querySelector(
      'footer[aria-label="Stand und Herkunft"]',
    );
    expect(provenance).toHaveTextContent("Von Tim Löhr");
    expect(provenance).toHaveTextContent("KI-Antworten aufgezeichnet August 2026");
    expect(provenance).toHaveTextContent("live gehalten 25. September 2026");
    expect(provenance).toHaveTextContent(workshop.provenance.note);
  });

  it("uses the primary material for the cover button and a demo or lab for the second", () => {
    const w03 = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    const { unmount } = render(<WorkshopDetailContent workshop={w03} locale="de" />);
    const cover = screen
      .getByRole("heading", { level: 1 })
      .closest("[data-cover-band]") as HTMLElement;
    const deck = w03.materials.find((material) => material.primary)!;
    const demo = w03.materials.find((material) => material.role === "demo")!;
    expect(within(cover).getByRole("link", { name: "Deck öffnen" })).toHaveAttribute(
      "href",
      deck.href,
    );
    expect(within(cover).getByRole("link", { name: "Demo starten" })).toHaveAttribute(
      "href",
      demo.href,
    );
    unmount();

    // W02 has no demo or lab: the second button jumps to the material list.
    const w02 = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en")!;
    render(<WorkshopDetailContent workshop={w02} locale="en" />);
    const enCover = screen
      .getByRole("heading", { level: 1 })
      .closest("[data-cover-band]") as HTMLElement;
    expect(within(enCover).getByRole("link", { name: "Open the deck" })).toHaveAttribute(
      "href",
      w02.materials.find((material) => material.primary)!.href,
    );
    expect(within(enCover).getByRole("link", { name: "See materials" })).toHaveAttribute(
      "href",
      "#material",
    );
    expect(document.getElementById("material")).not.toBeNull();
  });

  it("keeps one Mennige group: no orange rules, no mono eyebrows, no old risograph classes", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/workshops/[slug]/workshop-detail-content.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/motion-safe|motion-reduce|animate-/);
    expect(source).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
    expect(source).not.toMatch(/shadow-/);
    expect(source).not.toMatch(/border-l-(?:\[\d+px\]|\d)/);
    expect(source).not.toMatch(/uppercase|font-black|font-mono/);
    expect(source).not.toMatch(/tracking-\[-0\.0[2-9]/);
    expect(source).not.toMatch(/bg-brand-(?:acid|sky|pink|peach|cobalt|teal)/);
    expect(source).not.toMatch(/<details/);
    expect(source).not.toMatch(/from "lucide-react"/);
    // Stays a Server Component; only the material link and the lab hydrate.
    expect(source).not.toMatch(/^["']use client["']/m);
  });

  it("opens HTML materials in the same tab and downloads archives", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );

    for (const material of workshop.materials) {
      const links = container.querySelectorAll(`a[href="${material.href}"]`);
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        if (material.kind === "zip") {
          // Bare download attribute: the file keeps its published name.
          expect(link).toHaveAttribute("download", "");
          expect(link).not.toHaveAttribute("target");
        } else {
          expect(link).not.toHaveAttribute("target");
          expect(link).not.toHaveAttribute("download");
        }
      }
    }
  });

  it("derives the all-English note from the materials and drops it when one is German", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    const mixed = {
      ...workshop,
      materials: workshop.materials.map((material, index) =>
        index === 0 ? { ...material, language: "de" as const } : material,
      ),
    };
    const { container } = render(<WorkshopDetailContent workshop={mixed} locale="de" />);
    expect(screen.getByText("Kostenlos, ohne Anmeldung.")).toBeInTheDocument();
    expect(screen.queryByText(/Alle Materialien auf Englisch/)).toBeNull();
    expect(container.querySelector("[data-cover-band]")).not.toHaveTextContent(
      "Material auf Englisch",
    );
  });

  it("offers the W01 dataset as a CSV download under its published name", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", locale)!;
      const { container, unmount } = render(
        <WorkshopDetailContent workshop={workshop} locale={locale} />,
      );
      const link = container.querySelector(
        'a[href="/workshops/ki-prognosen-einschaetzen/data/demand-weekly.csv"]',
      );
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("download", "");
      expect(link?.closest("li")).toHaveTextContent("CSV · 1");
      unmount();
    }
  });

  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: lists every material once, grouped by phase, with one link per row`, () => {
        render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        const materialSection = sectionOf(locale === "de" ? "Material" : "Materials");
        const rows = materialSection.querySelectorAll("[data-material-row]");
        expect(rows).toHaveLength(workshop.materials.length);

        const links = within(materialSection).getAllByRole("link");
        expect(links).toHaveLength(workshop.materials.length);
        const hrefs = links.map((link) => link.getAttribute("href"));
        expect(new Set(hrefs).size).toBe(workshop.materials.length);
        for (const material of workshop.materials) {
          const link = links.find((candidate) => candidate.getAttribute("href") === material.href)!;
          expect(link).toHaveAttribute("hreflang", material.language);
          expect(link).toHaveAccessibleName(new RegExp(material.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        }

        // Phase groups appear in the order before, during, after.
        const groupHeadings = within(materialSection)
          .getAllByRole("heading", { level: 3 })
          .map((heading) => heading.textContent);
        const phaseLabel = {
          de: { before: "Vor dem Workshop", during: "Im Workshop", after: "Danach" },
          en: { before: "Before the workshop", during: "During the workshop", after: "Afterwards" },
        }[locale];
        const expected = (["before", "during", "after"] as const)
          .filter((phase) => workshop.materials.some((material) => material.phase === phase))
          .map((phase) => phaseLabel[phase]);
        expect(groupHeadings).toEqual(expected);

        // Exactly one row says where to start.
        expect(
          within(materialSection).getAllByText(locale === "de" ? /Hier starten/ : /Start here/),
        ).toHaveLength(1);
        expect(
          screen.getAllByText(locale === "de" ? "Sprache: Englisch" : "Language: English"),
        ).toHaveLength(workshop.materials.length);
      });
    }
  }

  it("keeps the German material note and back link", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    render(<WorkshopDetailContent workshop={workshop} locale="de" />);

    expect(
      screen.getByText("Kostenlos, ohne Anmeldung. Alle Materialien auf Englisch."),
    ).toBeInTheDocument();
    for (const material of workshop.materials) {
      expect(material.label).not.toMatch(/Englisch|English|\(|\)/);
    }
    expect(
      screen.getByRole("link", { name: "Zurück zu allen Workshops" }),
    ).toHaveAttribute("href", "/workshops");
  });

  it("renders the English page with the real-world case source, dates and no German interface copy", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="en" />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Read business reports with AI" }),
    ).toBeInTheDocument();
    expect(screen.getByText(workshop.accessNote)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Who this is for" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The case" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The same method on real figures" }),
    ).toBeVisible();
    const source = screen.getByRole("link", { name: /Meta Q2 2026 Results/ });
    expect(source).toHaveAttribute(
      "href",
      "https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/meta-06302026xexhibit991.htm",
    );
    expect(source).toHaveAttribute("target", "_blank");
    expect(screen.getByText(/unaudited quarterly figures/)).toBeVisible();
    expect(container.querySelector('time[datetime="2026-07-29"]')).not.toBeNull();
    expect(container.querySelector('time[datetime="2026-08-26"]')).not.toBeNull();

    expect(
      screen.getByRole("link", { name: "Back to all workshops" }),
    ).toHaveAttribute("href", "/en/workshops");
    expect(screen.getByText("Free, no sign-up.")).toBeInTheDocument();
    expect(screen.queryByText(/All materials in English/)).toBeNull();
    expect(container.textContent).not.toMatch(
      /Für wen|Alle Workshops|Die offene Entscheidung|Material zum Mitnehmen|Kostenlos/,
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
