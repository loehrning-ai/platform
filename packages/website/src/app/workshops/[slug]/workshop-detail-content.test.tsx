import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshopBySlug, getWorkshops } from "@/lib/workshops";
import { WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";
import { phoneDescription, WorkshopDetailContent } from "./workshop-detail-content";

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
    expect(cover).toHaveClass("plakat-lemons");
    // The caps line: the eyebrow as one line of text, its parts kept whole.
    const caps = (cover as HTMLElement).querySelector(".plakat-caps");
    expect(caps?.textContent).toBe(workshop.eyebrow);
    expect(caps).toHaveTextContent("Workshop 01 · Prognosen");
    expect(within(cover as HTMLElement).getByText(workshop.summary)).toBeInTheDocument();
    // The fixed question sits in the paper q-card at the top of the agenda,
    // once per page; the facts and the need follow it there (SPEC D11).
    const agenda = sectionOf("Ablauf");
    const questionCards = container.querySelectorAll("[data-question-card]");
    expect(questionCards).toHaveLength(1);
    expect(questionCards[0]).toHaveAttribute("data-question-card", "paper");
    expect(questionCards[0]).toHaveTextContent(workshop.question);
    expect(agenda).toContainElement(questionCards[0] as HTMLElement);
    expect(cover).not.toHaveTextContent("Selbstlernen ca. 90 Min.");
    expect(agenda).toHaveTextContent("Selbstlernen ca. 90 Min.");
    expect(agenda).toHaveTextContent("Du nimmst mitGo/No-Go-Regel");
    expect(agenda).toHaveTextContent("Du brauchsteinen Browser, kein KI-Konto");
    // The brief comes first in the agenda section, before its Kopflinie.
    expect(follows(agenda.querySelector("[data-workshop-brief]")!, agenda.querySelector("header")!)).toBe(true);

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
    // The station the lab mirrors is marked, and the agenda links down to the lab.
    expect(stations[0].querySelector("[data-lab-station]")).not.toBeNull();
    expect(stations[0]).toHaveTextContent("Übung unten");
    expect(route.querySelectorAll("[data-lab-station]")).toHaveLength(1);
    // It carries the inset "here" square and is the current step; the line
    // runs dashed from it on, and no station is read out with a state word.
    expect(stations[0]).toHaveAttribute("aria-current", "step");
    expect(stations[0].querySelector("[data-route-here]")).not.toBeNull();
    expect(route.querySelectorAll("[data-route-here]")).toHaveLength(1);
    expect(route.querySelectorAll("[aria-current]")).toHaveLength(1);
    expect(stations[0].querySelector("[data-route-line]")).toHaveAttribute(
      "data-route-line",
      "dashed",
    );
    expect(route).not.toHaveTextContent(/erledigt|aktuell|offen/);
    const labLink = within(agenda).getByRole("link", {
      name: `„${workshop.agenda[0].label}“ unten ausprobieren`,
    });
    expect(labLink).toHaveAttribute("href", "#workshop-lab");
    expect(lab).toHaveAttribute("id", "workshop-lab");
    expect(agenda).toHaveTextContent(
      "Geplante Minuten, noch nicht mit Testpersonen gemessen.",
    );

    expect(container.querySelectorAll("details")).toHaveLength(0);
    expect(screen.queryByText("Referenz")).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("sets a title's subtitle on its own line and keeps the full title as the heading name", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshopBySlug("esg-berichte-mit-ki", locale)!;
      const { unmount } = render(
        <WorkshopDetailContent workshop={workshop} locale={locale} />,
      );
      const [head, subtitle] = workshop.title.split(": ");
      const h1 = screen.getByRole("heading", { level: 1, name: workshop.title });
      // The text reads as the full title, colon included; only the subtitle
      // moves to its own line.
      expect(h1.textContent).toBe(workshop.title);
      expect(h1.firstChild?.textContent).toBe(head);
      expect(h1.querySelector("[data-title-subtitle]")?.textContent).toBe(subtitle);
      unmount();
    }

    // A title without a colon stays one run of text.
    const w03 = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    render(<WorkshopDetailContent workshop={w03} locale="de" />);
    const h1 = screen.getByRole("heading", { level: 1, name: w03.title });
    expect(h1.querySelector("[data-title-subtitle]")).toBeNull();
  });

  it("aligns the case figures when a label wraps", () => {
    const workshop = getWorkshopBySlug("esg-berichte-mit-ki", "de")!;
    render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const stats = sectionOf("Der Fall").querySelector("dl");
    expect(stats).toHaveClass("[&>div]:justify-between");
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
    const outcomes = sectionOf("Nach dem Workshop");
    for (const line of workshop.outcomes) expect(outcomes).toHaveTextContent(line);
    // "Du nimmst mit" is said once, in the brief under the band.
    expect(outcomes).not.toHaveTextContent("Du nimmst mit");
    expect(
      container.querySelector("[data-workshop-brief]"),
    ).toHaveTextContent(`Du nimmst mit${workshop.outcome}`);
    // The invented case is named in the section caption only, not again under the narrative.
    expect(caseSection).not.toHaveTextContent("und alle Zahlen sind für diesen Workshop erfunden");

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

  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: sets the band as the workshop's poster, with facts on paper`, () => {
        const { container } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        const scene = WORKSHOP_PLAKAT[workshop.slug as keyof typeof WORKSHOP_PLAKAT].plakat;
        const h1 = screen.getByRole("heading", { level: 1 });
        const band = h1.closest("[data-cover-band]") as HTMLElement;
        expect(band).toHaveClass(`plakat-${scene}`);
        expect(band).not.toHaveClass("dark-section");
        expect(container.querySelector("article")).toHaveAttribute("data-plakat-page", scene);
        // Poster title, fit to its longest word; a subtitle stays inside the
        // h1 at the band's body size.
        expect(h1).toHaveClass("poster-title", "text-scene-ink");
        expect(h1.style.getPropertyValue("--fit")).not.toBe("");
        const subtitle = h1.querySelector("[data-title-subtitle]");
        if (subtitle) expect(subtitle).toHaveClass("text-[1.0625rem]", "tracking-normal");
        // Type budget: one caps line, the title and 17px body. No question
        // card, meta list or small type in the band.
        expect(band.querySelectorAll(".plakat-caps")).toHaveLength(1);
        expect(band.querySelectorAll("[data-question-card], dl, input, select, textarea, [role=status], [data-chip]")).toHaveLength(0);
        // No muted tier and no reduced opacity either (Rost rule 2, SPEC
        // §1.6), held on every scene so the autumn band cannot regress.
        for (const node of band.querySelectorAll("*")) {
          const classes = node.getAttribute("class")?.split(/\s+/) ?? [];
          for (const small of ["text-caption", "text-label", "text-xs", "text-muted-foreground"]) {
            expect(classes, `${small} in the band`).not.toContain(small);
          }
          for (const name of classes) {
            expect(name, "reduced opacity in the band").not.toMatch(/(^|:)opacity-(?!100\b)/);
            expect(name, "a translucent colour in the band").not.toMatch(/(^|:)(text|decoration|border|bg|fill|stroke)-[\w-]+\/\d+$/);
          }
        }
        // Scene buttons: the ink fill and the ink outline, never Mennige.
        const [primary, secondary] = within(band)
          .getAllByRole("link")
          .filter((link) => !link.hasAttribute("data-cover-back"));
        expect(primary).toHaveClass("bg-scene-ink", "text-scene-ground", "min-h-12");
        expect(secondary).toHaveClass("border-scene-ink", "text-scene-ink", "min-h-12");
        // The poster: the lg art and the phone poster row (16:9, full
        // bleed), decorative, numbered.
        const posters = band.querySelectorAll("svg[data-poster]");
        expect([...posters].map((poster) => poster.getAttribute("data-poster-format"))).toEqual([
          "portrait",
          "landscape",
        ]);
        expect(band.querySelector("[data-plakat-art-phone]")).toHaveClass("aspect-[16/9]", "lg:hidden");
        for (const poster of posters) {
          expect(poster).toHaveAttribute("aria-hidden", "true");
          expect(poster.querySelector("[data-poster-numeral-text]")).toHaveTextContent(workshop.number);
        }
        expectNoMennigeInScene(container);
        expectCapsInsideScene(container);
      });
    }
  }

  it("charts the W04 result on paper with a hatched AI answer and direct labels", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshopBySlug("esg-berichte-mit-ki", locale)!;
      const { container, unmount } = render(
        <WorkshopDetailContent workshop={workshop} locale={locale} />,
      );
      const chart = container.querySelector("[data-result-chart]") as HTMLElement;
      expect(chart).not.toBeNull();
      expect(sectionOf(locale === "de" ? "Der Fall" : "The case")).toContainElement(chart);
      expect(
        within(chart).getByRole("heading", {
          level: 3,
          name: locale === "de" ? "Was der Fall zeigt" : "What the case shows",
        }),
      ).toBeInTheDocument();
      expect(chart.querySelector("figcaption")).toHaveTextContent(
        locale === "de"
          ? "t CO₂e, Scope 1 und 2, erfundene Zahlen"
          : "t CO₂e, Scope 1 and 2, invented figures",
      );
      const bars = [...chart.querySelectorAll("[data-result-bar]")];
      expect(bars.map((bar) => bar.getAttribute("data-result-bar"))).toEqual([
        "reference",
        "answer",
        "correct",
      ]);
      // Series differ by pattern and label, not by hue alone.
      expect(bars[1].querySelector("[data-result-bar-fill]")?.className).toMatch(/repeating-linear-gradient/);
      expect(bars[0].querySelector("[data-result-bar-fill]")).toHaveClass("bg-rost");
      expect(bars[2].querySelector("[data-result-bar-fill]")).toHaveClass("bg-rost");
      for (const bar of workshop.caseStudy.resultChart!.bars) {
        expect(chart).toHaveTextContent(bar.label);
        expect(chart).toHaveTextContent(bar.display);
      }
      unmount();
    }
    // Workshops without chart data show none.
    render(
      <WorkshopDetailContent workshop={getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!} locale="de" />,
    );
    expect(document.querySelector("[data-result-chart]")).toBeNull();
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
    // Sentence case only: the one uppercase allowed is the first letter of
    // the phone facts line once the minutes move to the agenda.
    expect(source).not.toMatch(/(?<!first-letter:)uppercase|font-black|font-mono/);
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
    expect(container.querySelector("[data-workshop-facts]")).toHaveTextContent(
      "kostenlos, ohne Anmeldung",
    );
    expect(container.querySelector("[data-workshop-facts]")).not.toHaveTextContent(
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

    // The language is said once in the facts line; the material rows carry EN chips.
    expect(document.querySelector("[data-workshop-facts]")).toHaveTextContent(
      "Material auf Englisch",
    );
    expect(screen.queryByText(/Alle Materialien auf Englisch/)).toBeNull();
    for (const material of workshop.materials) {
      expect(material.label).not.toMatch(/Englisch|English|\(|\)/);
    }
    // Two back links: the bar from sm, the band's top link on phones. Each
    // is display:none at the other size, so one is ever in the tree. The
    // name starts with the visible text of both (WCAG 2.5.3).
    const back = screen.getAllByRole("link", {
      name: "Alle Workshops, zurück zur Übersicht",
    });
    expect(back[0]).toHaveTextContent("Alle Workshops");
    expect(back[1]).toHaveTextContent("Workshops");
    // The bar is exactly as tall as the link, so its ring is drawn inside.
    expect(back[0]).toHaveClass("min-h-11", "focus-visible:outline-offset-[-3px]");
    expect(back).toHaveLength(2);
    for (const link of back) expect(link).toHaveAttribute("href", "/workshops");
    expect(back[0].closest("nav")).toHaveClass("max-sm:hidden");
    expect(back[1]).toHaveAttribute("data-cover-back");
    expect(back[1]).toHaveClass("min-h-11", "sm:hidden");
    expect(back[1].closest("[data-cover-band]")).not.toBeNull();
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

    for (const link of screen.getAllByRole("link", { name: "Back to all workshops" })) {
      expect(link).toHaveAttribute("href", "/en/workshops");
    }
    expect(container.querySelector("[data-workshop-facts]")).toHaveTextContent(
      "free, no sign-up",
    );
    expect(screen.queryByText(/All materials in English/)).toBeNull();
    expect(container.textContent).not.toMatch(
      /Für wen|Alle Workshops|Die offene Entscheidung|Material zum Mitnehmen|Kostenlos/,
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});

describe("phoneDescription", () => {
  it("keeps the first clause of a material description for a phone row", () => {
    expect(
      phoneDescription(
        "Etwa 77 Minuten Programm und 13 Minuten Fragen; die Demo ist optional (10 Min.). Pfeiltasten führen weiter.",
      ),
    ).toBe("Etwa 77 Minuten Programm und 13 Minuten Fragen.");
    expect(
      phoneDescription(
        "Die wöchentliche Nachfrage für die Übung (demand-weekly.csv). Erfundene Übungsdaten.",
      ),
    ).toBe("Die wöchentliche Nachfrage für die Übung.");
    const single = "Sieben Prüfungen auf einer A4-Seite, bevor du einer ESG-Zahl traust.";
    expect(phoneDescription(single)).toBe(single);
    // An authored short text wins over the first clause.
    expect(
      phoneDescription(
        "Schalte jede Falle einzeln ein, öffne jede Rechnung und sieh die Zeile, die daraus in der Belegtabelle wird.",
        "Schalte jede Falle einzeln ein und sieh, was aus jeder Rechnung wird.",
      ),
    ).toBe("Schalte jede Falle einzeln ein und sieh, was aus jeder Rechnung wird.");
  });

  it("never shows a cut-off description on a phone", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        for (const material of workshop.materials) {
          const phone = phoneDescription(material.description, material.short);
          expect(phone.length, material.href).toBeLessThanOrEqual(74);
          expect(phone, material.href).not.toContain("…");
          if (material.short !== undefined) {
            // Authored: a complete clause within two phone lines.
            expect(phone).toBe(material.short);
            expect(material.short.length, material.href).toBeLessThanOrEqual(72);
            expect(material.short, material.href).toMatch(/^\p{Lu}.*[.!?]$/u);
          } else {
            // Derived: the description's own first sentence, unchanged.
            expect(material.description.startsWith(phone.slice(0, -1)), material.href).toBe(true);
            expect(phone, material.href).toMatch(/[.!?]$/);
          }
        }
      }
    }
  });

  it("gives phones the short text and keeps the full one from sm", () => {
    const workshop = getWorkshopBySlug("esg-berichte-mit-ki", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );
    const deck = container.querySelector('[data-material-role="deck"]')!;
    const short = deck.querySelector("[data-material-short]")!;
    expect(short).toHaveTextContent("Für den Beamer.");
    expect(short).toHaveClass("sm:hidden");
    expect(short.nextElementSibling).toHaveClass("hidden", "sm:block");
    expect(deck).toHaveClass("has-[a:active]:bg-card-hover", "grid-cols-[1.5rem_minmax(0,1fr)]");
    // The link covers the row on a phone; the text keeps the full width.
    expect(within(deck as HTMLElement).getByRole("link")).toHaveClass(
      "max-sm:absolute",
      "max-sm:inset-0",
      "[-webkit-tap-highlight-color:transparent]",
    );
    expect(deck.querySelector("h4")).toHaveClass("max-sm:pr-8");
  });
});
