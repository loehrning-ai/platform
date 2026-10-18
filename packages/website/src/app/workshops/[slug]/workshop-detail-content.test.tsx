import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { localizeHref } from "@/lib/i18n/locale";
import { workshopKitPath } from "@/lib/workshop-kit";
import { getWorkshopBySlug, getWorkshops } from "@/lib/workshops";
import { heroMotionScene } from "@/components/plakat/hero-motion";
import { PLAKAT, PLAKAT_KEYS, WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";
import {
  phoneDescription,
  TITLE_HIGHLIGHT,
  titleHighlight,
  WorkshopDetailContent,
} from "./workshop-detail-content";

type Rgb = readonly [number, number, number];

function rgb(hex: string): Rgb {
  return [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)) as unknown as Rgb;
}

function luminance(colour: Rgb): number {
  const [r, g, b] = colour.map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

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
  it("puts the cover, the brief, the case and the details in that order, with no agenda, no red line and no numbered headings", () => {
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

    // The agenda is gone from the page: no "Ablauf" section, no route rail, no
    // red-line jump nav, no numbered badge on any heading. It stays in the
    // registry for tests and machine surfaces.
    expect(screen.queryByRole("heading", { name: "Ablauf" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Ablauf" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Der Weg durch den Workshop" })).toBeNull();
    expect(container.querySelector("[data-workshop-redline], ol[data-route-mode], #ablauf")).toBeNull();
    for (const heading of container.querySelectorAll("h2, h3")) {
      expect(heading.textContent, "a numbered heading").not.toMatch(/^\d/);
    }
    for (const item of workshop.agenda) expect(container).not.toHaveTextContent(item.label);

    // The brief on paper: one facts line, the outcomes (visible), the one need.
    const brief = container.querySelector("[data-workshop-brief]") as HTMLElement;
    expect(follows(cover!, brief)).toBe(true);
    expect(brief.querySelector("[data-workshop-facts]")).toHaveTextContent("Selbstlernen ca. 90 Min.");
    expect(cover).not.toHaveTextContent("Selbstlernen ca. 90 Min.");
    const outcomes = sectionOf("Nach dem Workshop");
    expect(outcomes).toBe(brief);
    for (const line of workshop.outcomes) expect(brief).toHaveTextContent(line);
    expect(brief.querySelector("[data-workshop-need]")).toHaveTextContent(`Du brauchst: ${workshop.needs[0]}`);
    expect(container).not.toHaveTextContent("Du nimmst mit");
    expect(brief.closest("details")).toBeNull();

    // No "Ausprobieren" exercise band, no question card, no metrics row.
    expect(container.querySelector("[data-workshop-decision-lab]")).toBeNull();
    expect(container.querySelector("#workshop-lab")).toBeNull();
    expect(container).not.toHaveTextContent("Ausprobieren");
    expect(container.querySelectorAll("[data-question-card]")).toHaveLength(0);

    // The case follows the brief; the question sits in it once, with its bar.
    const caseSection = sectionOf("Der Fall");
    expect(follows(brief, caseSection)).toBe(true);
    expect(caseSection.querySelectorAll("[data-case-question]")).toHaveLength(1);
    expect(caseSection.querySelector("[data-case-question]")).toHaveTextContent(workshop.question);
    expect(caseSection.querySelector("[data-case-question] span[aria-hidden='true']")).toHaveClass("bg-mennige");
    expect(container.textContent?.split(workshop.question)).toHaveLength(2);
    expect(caseSection.querySelector("dl")).toBeNull();

    // Workshop 01's two band buttons reach both of its files: no material list.
    expect(container.querySelector("#material, [data-material-row]")).toBeNull();

    // Only the optional files and the reference wait behind closed disclosures.
    const disclosures = container.querySelectorAll("details");
    expect(disclosures).toHaveLength(1);
    for (const disclosure of disclosures) expect(disclosure).not.toHaveAttribute("open");
    const details = sectionOf("Mehr Details");
    expect(follows(caseSection, details)).toBe(true);
    expect(container.querySelector('footer[aria-label="Stand und Herkunft"]')).not.toBeNull();
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
      // The head is split only for the highlight band: the positioned lead,
      // then the marked tail.
      const lead = h1.firstElementChild;
      const mark = h1.querySelector("span.box-decoration-clone");
      expect(lead).toHaveClass("relative");
      expect(`${lead?.textContent} ${mark?.textContent}`).toBe(head);
      expect(h1.querySelector("[data-title-subtitle]")?.textContent).toBe(subtitle);
      unmount();
    }

    // A title without a colon stays one run of text.
    const w03 = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    render(<WorkshopDetailContent workshop={w03} locale="de" />);
    const h1 = screen.getByRole("heading", { level: 1, name: w03.title });
    expect(h1.querySelector("[data-title-subtitle]")).toBeNull();
  });

  it("marks a short phrase at the end of the H1, never two full lines", () => {
    expect(titleHighlight("ESG-Berichte mit KI")).toEqual({
      lead: "ESG-Berichte",
      highlight: "mit KI",
    });
    expect(titleHighlight("Sind deine Daten bereit für KI?")).toEqual({
      lead: "Sind deine Daten bereit",
      highlight: "für KI?",
    });
    expect(titleHighlight("Can AI predict the future?")).toEqual({
      lead: "Can AI predict",
      highlight: "the future?",
    });
    // A long last pair keeps only its last word on the band.
    expect(titleHighlight("Kann KI die Zukunft vorhersagen?")).toEqual({
      lead: "Kann KI die Zukunft",
      highlight: "vorhersagen?",
    });
    expect(titleHighlight("Workshop Eins")).toEqual({
      lead: "Workshop",
      highlight: "Eins",
    });
    expect(titleHighlight("Workshop")).toEqual({ lead: "Workshop", highlight: "" });
  });

  it("marks one chosen word and sets the rest after it", () => {
    expect(titleHighlight("Where Your Data Goes", "Data")).toEqual({
      lead: "Where Your",
      highlight: "Data",
      tail: "Goes",
    });
    expect(titleHighlight("Wohin deine Daten gehen", "Daten")).toEqual({
      lead: "Wohin deine",
      highlight: "Daten",
      tail: "gehen",
    });
    // A mark at the end has no tail; a mark that is not in the title falls back to the tail rule.
    expect(titleHighlight("ESG-Berichte mit KI", "KI")).toEqual({
      lead: "ESG-Berichte mit",
      highlight: "KI",
    });
    expect(titleHighlight("ESG-Berichte mit KI", "Daten")).toEqual({
      lead: "ESG-Berichte",
      highlight: "mit KI",
    });
  });

  it("lands the Workshop 05 band on the word Data, in both locales, and keeps the full title as the heading", () => {
    for (const [locale, mark, lead, tail] of [
      ["en", "Data", "Where Your", "Goes"],
      ["de", "Daten", "Wohin deine", "gehen"],
    ] as const) {
      const workshop = getWorkshopBySlug("ki-im-unternehmen-sicher-nutzen", locale)!;
      const { unmount } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
      const h1 = screen.getByRole("heading", { level: 1, name: workshop.title });
      expect(h1.textContent).toBe(workshop.title);
      expect(h1.firstElementChild).toHaveClass("relative");
      expect(h1.firstElementChild).toHaveTextContent(lead);
      const marks = h1.querySelectorAll("span.box-decoration-clone");
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent(new RegExp(`^${mark}$`));
      expect(marks[0].nextSibling?.textContent).toBe(` ${tail}`);
      // The words are never animated: no motion class or inline animation on the heading.
      expect(h1.outerHTML).not.toMatch(/animate-|animation|motion-/);
      unmount();
    }
  });

  it("keeps every scene's title band readable and visible", () => {
    for (const key of PLAKAT_KEYS) {
      const { ground, ink, mid } = PLAKAT[key];
      const band = TITLE_HIGHLIGHT[key];
      expect(band.colorVar).toBe("--color-scene-mid");
      // The browser composites the colour-mix over the ground in sRGB.
      const alpha = band.opacity / 100;
      const painted = rgb(mid).map((value, channel) =>
        Math.round(value * alpha + rgb(ground)[channel] * (1 - alpha)),
      ) as unknown as Rgb;
      // Display type (50px and up): the 3:1 floor, with margin.
      expect(contrast(rgb(ink), painted), `${key} ink on its band`).toBeGreaterThanOrEqual(3.4);
      // A band that matches the ground would mark nothing.
      expect(contrast(rgb(ground), painted), `${key} band on its ground`).toBeGreaterThanOrEqual(1.35);
    }
  });

  it("aligns the case figures when a label wraps", () => {
    const workshop = getWorkshopBySlug("esg-berichte-mit-ki", "de")!;
    render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const stats = sectionOf("Mehr Details").querySelector("dl");
    expect(stats).toHaveClass("[&>div]:justify-between");
  });

  it("keeps the case short and visible and folds the audience, needs, scope, figures and limits into one accordion", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );

    const caseSection = sectionOf("Der Fall");
    expect(caseSection).toHaveTextContent(workshop.caseStudy.companyName);
    expect(caseSection).toHaveTextContent(workshop.caseStudy.narrative);
    // The invented case is named once, in the caption line under the company.
    expect(caseSection).toHaveTextContent(
      ["Erfundener Fall", workshop.caseStudy.sector, workshop.caseStudy.period].join(" · "),
    );
    expect(caseSection).not.toHaveTextContent("und alle Zahlen sind für diesen Workshop erfunden");
    expect(container.querySelector("[data-workshop-facts]")).not.toHaveTextContent("erfundener Fall");
    // The open decision question and the figures are not on the open page.
    expect(caseSection).not.toHaveTextContent(workshop.caseStudy.decisionQuestion);
    expect(caseSection).not.toHaveTextContent("Die offene Entscheidung");
    expect(caseSection.querySelector("dl, details")).toBeNull();
    expect(caseSection.querySelector("[data-case-question]")).toHaveTextContent(workshop.question);

    const details = sectionOf("Mehr Details");
    expect(details.querySelector("details")).not.toHaveAttribute("open");
    const audience = sectionOf("Für wen");
    for (const line of workshop.audience) expect(audience).toHaveTextContent(line);
    expect(audience).toHaveTextContent(workshop.notForYou);
    // What you need is said once, in the line under the outcomes; the accordion lists what you do not need.
    const needs = sectionOf("Das brauchst du nicht");
    for (const line of workshop.notNeeded) expect(needs).toHaveTextContent(line);
    expect(within(details).queryByRole("heading", { name: "Das brauchst du" })).toBeNull();
    expect(container.querySelectorAll("[data-workshop-need]")).toHaveLength(1);
    expect(needs.querySelector('[data-callout="boundary"]')).toHaveTextContent(
      workshop.accessNote,
    );
    const notCovered = sectionOf("Nicht Teil dieses Workshops");
    for (const line of workshop.notCovered) {
      expect(notCovered).toHaveTextContent(line);
    }
    // The case figures, the limits and the provenance note sit in the same accordion.
    const facts = sectionOf(workshop.caseStudy.limitationsHeading ?? "Was die Daten nicht beantworten");
    const stats = facts.querySelector("dl");
    expect(stats).not.toBeNull();
    expect(within(stats as HTMLElement).getAllByRole("term")).toHaveLength(
      workshop.caseStudy.metrics.length,
    );
    for (const limitation of workshop.caseStudy.dataLimitations) {
      expect(facts).toHaveTextContent(limitation);
    }
    expect(facts).toHaveTextContent(workshop.provenance.note);
    for (const part of [audience, needs, notCovered, facts]) {
      expect(details).toContainElement(part);
    }
    // The outcomes are not in the accordion.
    expect(details).not.toContainElement(sectionOf("Nach dem Workshop"));

    // One slim provenance line: who, when it was checked, the kind of data.
    const provenance = container.querySelector(
      'footer[aria-label="Stand und Herkunft"]',
    );
    expect(provenance).toHaveTextContent("Tim Löhr");
    expect(provenance).toHaveTextContent("geprüft 26. September 2026");
    expect(provenance).toHaveTextContent("KI-Antworten aufgezeichnet August 2026");
    expect(provenance).toHaveTextContent("live gehalten 25. September 2026");
    // The invented data is named once, in the caption line of the case; the footer does not repeat it.
    expect(provenance).not.toHaveTextContent("erfundene Daten");
    expect(provenance).not.toHaveTextContent(workshop.provenance.note);
    expect(provenance?.querySelectorAll("p")).toHaveLength(1);
  });

  it("uses the primary material for the cover button and a lab or case for the second", () => {
    const w01 = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    const { unmount } = render(<WorkshopDetailContent workshop={w01} locale="de" />);
    const cover = screen
      .getByRole("heading", { level: 1 })
      .closest("[data-cover-band]") as HTMLElement;
    const lab = w01.materials.find((material) => material.primary)!;
    const caseStudy = w01.materials.find((material) => material.role === "case")!;
    expect(within(cover).getByRole("link", { name: "Labore öffnen" })).toHaveAttribute(
      "href",
      lab.href,
    );
    expect(within(cover).getByRole("link", { name: "Fall öffnen" })).toHaveAttribute(
      "href",
      caseStudy.href,
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
        // The tail of the title sits on a marker band in the scene's mid
        // colour; the words keep the scene ink (text-foreground in scope).
        const mark = h1.querySelector("span.box-decoration-clone") as HTMLElement;
        expect(mark).not.toBeNull();
        expect(mark.style.backgroundImage).toContain("var(--color-scene-mid)");
        expect(mark.style.backgroundSize).toBe("100% 0.75em");
        expect(mark).toHaveClass("text-foreground");
        expect(workshop.title.startsWith(`${h1.firstElementChild?.textContent} ${mark.textContent}`)).toBe(true);
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
        // Scene buttons: the scene's button pair and the ink outline, never
        // Mennige, and never an ink fill: Bloom's Aubergine ink would read
        // as a black button on the Sand poster.
        const [primary, secondary] = within(band)
          .getAllByRole("link")
          .filter((link) => !link.hasAttribute("data-cover-back"));
        expect(primary).toHaveClass("bg-scene-button", "text-scene-button-text", "min-h-12");
        expect(primary).not.toHaveClass("bg-scene-ink");
        expect(secondary).toHaveClass("border-scene-ink", "text-scene-ink", "min-h-12");
        expect(secondary.className).not.toMatch(/(^|\s)hover:bg-scene-ink(\s|$)/);
        // The poster: the lg art and the phone poster row (16:9, full
        // bleed), decorative, numbered.
        // A workshop with a hero scene (components/plakat/hero-motion.tsx)
        // shows it in both slots instead of the poster motif.
        const hero = heroMotionScene(workshop.slug);
        const posters = band.querySelectorAll(hero ? "svg[data-hero-motion]" : "svg[data-poster]");
        expect(
          [...posters].map((poster) => poster.getAttribute(hero ? "data-hero-variant" : "data-poster-format")),
        ).toEqual(["portrait", "landscape"]);
        expect(band.querySelectorAll(hero ? "svg[data-poster]" : "svg[data-hero-motion]")).toHaveLength(0);
        expect(band.querySelector("[data-plakat-art-phone]")).toHaveClass("aspect-[16/9]", "lg:hidden");
        for (const poster of posters) {
          expect(poster).toHaveAttribute("aria-hidden", "true");
          expect(poster).toHaveAttribute("focusable", "false");
          if (hero) {
            expect(poster).toHaveAttribute("data-hero-motion", hero);
            expect(poster.querySelector("text")).toHaveTextContent(workshop.number);
          } else {
            expect(poster.querySelector("[data-poster-numeral-text]")).toHaveTextContent(workshop.number);
          }
        }
        expectNoMennigeInScene(container);
        expectCapsInsideScene(container);
      });
    }
  }

  it("charts a case result on paper with a hatched AI answer and direct labels", () => {
    // No published workshop carries chart data at the moment, so the chart is
    // rendered from a fixture on the Workshop 04 page.
    const chartFixture = {
      de: {
        unit: "t CO₂e",
        basis: "Scope 1 und 2",
        note: "Die KI-Summe weicht um 48,7 t ab.",
        bars: [
          { label: "Vorjahr", value: 2017.5, display: "2.017,5 t", kind: "reference" },
          { label: "KI-Antwort", value: 1866.5, display: "1.866,5 t", note: "ungeprüft", kind: "answer" },
          { label: "Geprüft", value: 1915.2, display: "1.915,2 t", kind: "correct" },
        ],
      },
      en: {
        unit: "t CO₂e",
        basis: "Scope 1 and 2",
        note: "The AI total is 48.7 t off.",
        bars: [
          { label: "Last year", value: 2017.5, display: "2,017.5 t", kind: "reference" },
          { label: "AI answer", value: 1866.5, display: "1,866.5 t", note: "unchecked", kind: "answer" },
          { label: "Checked", value: 1915.2, display: "1,915.2 t", kind: "correct" },
        ],
      },
    } as const;
    for (const locale of ["de", "en"] as const) {
      const published = getWorkshopBySlug("esg-berichte-mit-ki", locale)!;
      const workshop = { ...published, caseStudy: { ...published.caseStudy, resultChart: chartFixture[locale] } };
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
    for (const slug of ["ki-prognosen-einschaetzen", "esg-berichte-mit-ki"]) {
      const { unmount } = render(<WorkshopDetailContent workshop={getWorkshopBySlug(slug, "de")!} locale="de" />);
      expect(document.querySelector("[data-result-chart]"), slug).toBeNull();
      unmount();
    }
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
    // Two disclosures only: optional files and the one "More details" accordion.
    expect(source.match(/<details/g)).toHaveLength(2);
    expect(source).not.toMatch(/from "lucide-react"/);
    // Stays a Server Component; only the material link hydrates.
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

  it("offers at most two materials per workshop, the deck and the kit, and no optional files", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        expect(workshop.materials.length, workshop.slug).toBeLessThanOrEqual(2);
        expect(workshop.materials.filter((material) => material.optional), workshop.slug).toEqual([]);
        // Workshop 01 has no slide deck: its labs and its case play that part.
        const allowed = workshop.slug === "ki-prognosen-einschaetzen" ? ["lab", "case"] : ["deck", "kit"];
        for (const material of workshop.materials) expect(allowed, material.href).toContain(material.role);
        const { container, unmount } = render(
          <WorkshopDetailContent workshop={workshop} locale={locale} />,
        );
        expect(container.querySelector("#material details"), workshop.slug).toBeNull();
        unmount();
      }
    }
  });

  // Which workshops list their files below the band: only those with a file
  // that neither band button reaches (Workshops 02 and 03 hand their kit zip
  // over from the list; 01, 04 and 05 reach everything from the band).
  const LISTS_MATERIALS: Readonly<Record<string, boolean>> = {
    "ki-prognosen-einschaetzen": false,
    "geschaeftsberichte-mit-ki-lesen": true,
    "datenbereitschaft-fuer-ki": true,
    "esg-berichte-mit-ki": false,
    "ki-im-unternehmen-sicher-nutzen": false,
  };

  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: lists its materials only when the band cannot reach them, in taught order, optional files folded, one link per row`, () => {
        const { container } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        const hrefOf = (material: (typeof workshop.materials)[number]) =>
          workshop.kit && material.role === "kit"
            ? localizeHref(workshopKitPath(workshop.slug), locale)
            : material.href;
        const band = container.querySelector("[data-cover-band]") as HTMLElement;
        const bandHrefs = new Set(
          within(band)
            .getAllByRole("link")
            .filter((link) => !link.hasAttribute("data-cover-back"))
            .map((link) => link.getAttribute("href")),
        );
        // The primary file is always on the band.
        expect(bandHrefs.has(hrefOf(workshop.materials.find((material) => material.primary)!))).toBe(true);
        const leftOver = workshop.materials.filter((material) => !bandHrefs.has(hrefOf(material)));
        expect(LISTS_MATERIALS[workshop.slug], workshop.slug).toBe(leftOver.length > 0);

        if (leftOver.length === 0) {
          expect(container.querySelector("#material, [data-material-row]")).toBeNull();
          expect(screen.queryByRole("heading", { name: locale === "de" ? "Material" : "Materials" })).toBeNull();
          // The band's second button never promises a list that is not there.
          expect(within(band).queryByRole("link", { name: locale === "de" ? "Material ansehen" : "See materials" })).toBeNull();
          return;
        }

        const materialSection = sectionOf(locale === "de" ? "Material" : "Materials");
        const rows = materialSection.querySelectorAll("[data-material-row]");
        expect(rows).toHaveLength(workshop.materials.length);

        const links = within(materialSection).getAllByRole("link");
        expect(links).toHaveLength(workshop.materials.length);
        const hrefs = links.map((link) => link.getAttribute("href"));
        expect(new Set(hrefs).size).toBe(workshop.materials.length);
        for (const material of workshop.materials) {
          const link = links.find((candidate) => candidate.getAttribute("href") === hrefOf(material))!;
          if (hrefOf(material) === material.href) {
            expect(link).toHaveAttribute("hreflang", material.language);
          } else {
            expect(link).not.toHaveAttribute("download");
          }
          expect(link).toHaveAccessibleName(new RegExp(material.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        }

        // Core materials first, in taught order; optional files sit in one
        // closed disclosure below them.
        const order = ["before", "during", "after"] as const;
        const taught = [...workshop.materials].sort(
          (a, b) => order.indexOf(a.phase) - order.indexOf(b.phase),
        );
        const expectedOrder = [
          ...taught.filter((material) => !material.optional),
          ...taught.filter((material) => material.optional),
        ].map(hrefOf);
        expect(hrefs).toEqual(expectedOrder);
        const optional = workshop.materials.filter((material) => material.optional);
        const folded = materialSection.querySelector("details");
        if (optional.length === 0) {
          expect(folded).toBeNull();
        } else {
          expect(folded).not.toHaveAttribute("open");
          expect(folded!.querySelectorAll("[data-material-row]")).toHaveLength(optional.length);
        }

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
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );
    const deck = container.querySelector('[data-material-role="deck"]')!;
    const short = deck.querySelector("[data-material-short]")!;
    expect(short).toHaveTextContent("Die Folien führen durch Firma, Kit, Prompts und Fall 2 mit Meta.");
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
