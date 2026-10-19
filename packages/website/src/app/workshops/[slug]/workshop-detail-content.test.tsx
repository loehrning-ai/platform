import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { localizeHref } from "@/lib/i18n/locale";
import { workshopKitPath } from "@/lib/workshop-kit";
import { getWorkshopBySlug, getWorkshops, type Workshop } from "@/lib/workshops";
import { workshopStage } from "@/lib/workshop-stage";
import { PLAKAT, PLAKAT_KEYS, WORKSHOP_PLAKAT, type PlakatKey } from "@/lib/plakat/palettes";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";
import {
  bandLede,
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
  it("puts the band, the stage, the facts line and the details in that order, with no outcomes, no case section, no agenda and no numbered headings", () => {
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

    // The stage follows the band directly: the two action cards, no outcomes.
    const stage = container.querySelector("[data-workshop-stage]") as HTMLElement;
    expect(stage).not.toBeNull();
    expect(follows(cover!, stage)).toBe(true);
    expect(cover!.nextElementSibling).toBe(stage);
    expect(stage.querySelectorAll("[data-action-card]")).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 2, name: "Starten" })).toBeInTheDocument();

    // The visible sections "Nach dem Workshop" and "Der Fall" are removed,
    // along with the brief, the need line and the question card.
    expect(screen.queryByRole("heading", { name: "Nach dem Workshop" })).toBeNull();
    expect(container.querySelector("#workshop-outcomes-heading, [data-workshop-brief], [data-workshop-need]")).toBeNull();
    for (const line of workshop.outcomes) expect(container).not.toHaveTextContent(line);
    expect(container).not.toHaveTextContent("Du nimmst mit");
    expect(screen.queryByRole("heading", { level: 2, name: "Der Fall" })).toBeNull();
    expect(container.querySelector("[data-question-card], [data-workshop-decision-lab], #workshop-lab")).toBeNull();
    expect(container).not.toHaveTextContent("Ausprobieren");

    // The facts line sits on paper under the stage, with no heading of its own.
    const facts = container.querySelector("[data-workshop-facts]") as HTMLElement;
    expect(follows(stage, facts)).toBe(true);
    expect(facts).toHaveTextContent("Ca. 90 Min.");
    expect(cover).not.toHaveTextContent("Ca. 90 Min.");
    expect(facts.closest("details")).toBeNull();

    // Both of Workshop 01's files are reached by the two cards: no material list.
    expect(container.querySelector("#material, [data-material-row]")).toBeNull();

    // One closed disclosure: "More details". The case and its one question live in it, once.
    const disclosures = container.querySelectorAll("details");
    expect(disclosures).toHaveLength(1);
    for (const disclosure of disclosures) expect(disclosure).not.toHaveAttribute("open");
    const details = sectionOf("Mehr Details");
    expect(follows(facts, details)).toBe(true);
    const caseSection = details.querySelector("#fall") as HTMLElement;
    expect(caseSection).not.toBeNull();
    expect(within(caseSection).getByRole("heading", { level: 3, name: "Der Fall" })).toBeInTheDocument();
    expect(caseSection.querySelectorAll("[data-case-question]")).toHaveLength(1);
    expect(caseSection.querySelector("[data-case-question]")).toHaveTextContent(workshop.question);
    expect(caseSection.querySelector("[data-case-question] span[aria-hidden='true']")).toHaveClass("bg-mennige");
    expect(container.textContent?.split(workshop.question)).toHaveLength(2);
    expect(container.querySelector('footer[aria-label="Stand und Herkunft"]')).not.toBeNull();
    expect(follows(details, container.querySelector('footer[aria-label="Stand und Herkunft"]')!)).toBe(true);
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
      const mark = h1.querySelector("span.title-mark");
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
      ["en", "data", "Where does your", " go?"],
      ["de", "Daten?", "Wohin gehen deine", ""],
    ] as const) {
      const workshop = getWorkshopBySlug("ki-im-unternehmen-sicher-nutzen", locale)!;
      const { unmount } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
      const h1 = screen.getByRole("heading", { level: 1, name: workshop.title });
      expect(h1.textContent).toBe(workshop.title);
      expect(h1.firstElementChild).toHaveClass("relative");
      expect(h1.firstElementChild).toHaveTextContent(lead);
      const marks = h1.querySelectorAll("span.title-mark");
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent(new RegExp(`^${mark.replace("?", "\\?")}$`));
      expect(marks[0].nextSibling?.textContent ?? "").toBe(tail);
      // The words are never animated: no motion class or inline animation on the heading.
      expect(h1.outerHTML).not.toMatch(/animate-|animation|motion-/);
      unmount();
    }
  });

  it("keeps every scene's title band readable and visible", () => {
    // The tokens a band may use, as the hex values the browser resolves them to.
    const hexOf = (key: PlakatKey, token: string): string => {
      const palette = PLAKAT[key];
      const table: Record<string, string> = {
        "--color-scene-mid": palette.mid,
        "--color-scene-accent-text": palette.accentText,
        "--color-scene-ink": palette.ink,
        "--color-paper": "#fffcf5",
        "--color-lab-ink": "#121212",
      };
      expect(table[token], `${key}: ${token}`).toBeDefined();
      return table[token];
    };
    for (const key of PLAKAT_KEYS) {
      const { ground } = PLAKAT[key];
      const band = TITLE_HIGHLIGHT[key];
      // The browser composites the colour-mix over the ground in sRGB.
      const alpha = band.opacity / 100;
      const markHex = hexOf(key, band.colorVar);
      const painted = rgb(markHex).map((value, channel) =>
        Math.round(value * alpha + rgb(ground)[channel] * (1 - alpha)),
      ) as unknown as Rgb;
      const text = rgb(hexOf(key, band.textColorVar ?? "--color-scene-ink"));
      // Display type (40px and up): the words on the band keep 4.4:1 or more.
      expect(contrast(text, painted), `${key} words on their band`).toBeGreaterThanOrEqual(4.4);
      // The band is a visible mark on its ground: 1.6:1 or more (a wash that
      // matched the ground marked nothing; idea 35% and autumn 30% were 1.54 and 1.40).
      expect(contrast(rgb(ground), painted), `${key} band on its ground`).toBeGreaterThanOrEqual(1.6);
    }
  });

  it("aligns the case figures when a label wraps", () => {
    const workshop = getWorkshopBySlug("esg-berichte-mit-ki", "de")!;
    render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const stats = sectionOf("Mehr Details").querySelector("dl");
    expect(stats).toHaveClass("[&>div]:justify-between");
  });

  it("folds the needs, scope, audience, case, figures and limits into one accordion, in that order", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );

    const details = sectionOf("Mehr Details");
    expect(details.querySelector("details")).not.toHaveAttribute("open");
    // What you need: every need, under the label "Du brauchst".
    const needs = sectionOf("Du brauchst");
    for (const line of workshop.needs) expect(needs).toHaveTextContent(line);
    expect(needs.querySelectorAll("li")).toHaveLength(workshop.needs.length);
    const notNeeded = sectionOf("Das brauchst du nicht");
    for (const line of workshop.notNeeded) expect(notNeeded).toHaveTextContent(line);
    expect(notNeeded.querySelector('[data-callout="boundary"]')).toHaveTextContent(
      workshop.accessNote,
    );
    const audience = sectionOf("Für wen");
    for (const line of workshop.audience) expect(audience).toHaveTextContent(line);
    expect(audience).toHaveTextContent(workshop.notForYou);
    const notCovered = sectionOf("Nicht Teil dieses Workshops");
    for (const line of workshop.notCovered) expect(notCovered).toHaveTextContent(line);

    // The case: company, one caption line, narrative and the one question. The
    // open decision question stays out of the page.
    const caseSection = sectionOf("Der Fall");
    expect(caseSection).toHaveAttribute("id", "fall");
    expect(caseSection).toHaveTextContent(workshop.caseStudy.companyName);
    expect(caseSection).toHaveTextContent(workshop.caseStudy.narrative);
    expect(caseSection).toHaveTextContent(
      ["Erfundener Fall", workshop.caseStudy.sector, workshop.caseStudy.period].join(" · "),
    );
    expect(caseSection).not.toHaveTextContent("und alle Zahlen sind für diesen Workshop erfunden");
    expect(container.querySelector("[data-workshop-facts]")).not.toHaveTextContent("erfundener Fall");
    expect(caseSection).not.toHaveTextContent(workshop.caseStudy.decisionQuestion);
    expect(caseSection).not.toHaveTextContent("Die offene Entscheidung");
    expect(caseSection.querySelector("[data-case-question]")).toHaveTextContent(workshop.question);

    // The case figures, the limits and the provenance note close the accordion.
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
    const parts = [needs, notNeeded, audience, notCovered, caseSection, facts];
    for (const part of parts) expect(details).toContainElement(part);
    for (let index = 1; index < parts.length; index += 1) {
      expect(follows(parts[index - 1], parts[index]), `block ${index}`).toBe(true);
    }

    // One slim provenance line: who, when it was checked, the kind of data.
    const provenance = container.querySelector(
      'footer[aria-label="Stand und Herkunft"]',
    );
    expect(provenance).toHaveTextContent("Tim Löhr");
    expect(provenance).toHaveTextContent("geprüft 26. September 2026");
    expect(provenance).toHaveTextContent("KI-Antworten aufgezeichnet August 2026");
    expect(provenance).not.toHaveTextContent("live gehalten");
    // The invented data is named once, in the caption line of the case; the footer does not repeat it.
    expect(provenance).not.toHaveTextContent("erfundene Daten");
    expect(provenance).not.toHaveTextContent(workshop.provenance.note);
    expect(provenance?.querySelectorAll("ul")).toHaveLength(1);
  });

  it("puts the first material on card A and the lab or the case on card B, and no buttons in the band", () => {
    const w01 = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    const { container, unmount } = render(<WorkshopDetailContent workshop={w01} locale="de" />);
    const cover = screen
      .getByRole("heading", { level: 1 })
      .closest("[data-cover-band]") as HTMLElement;
    const lab = w01.materials.find((material) => material.primary)!;
    const caseStudy = w01.materials.find((material) => material.role === "case")!;
    const stage = container.querySelector("[data-workshop-stage]") as HTMLElement;
    expect(within(stage).getByRole("link", { name: /^Labor öffnen/ })).toHaveAttribute("href", lab.href);
    expect(within(stage).getByRole("link", { name: /^Fall ansehen/ })).toHaveAttribute("href", caseStudy.href);
    // The band holds the poster and the words only: the back link is its one link.
    expect(
      within(cover).queryAllByRole("link").filter((link) => !link.hasAttribute("data-cover-back")),
    ).toHaveLength(0);
    unmount();

    // W02: the slides on card A, the kit zip on card B, downloaded by name.
    const w02 = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en")!;
    const view = render(<WorkshopDetailContent workshop={w02} locale="en" />);
    const enStage = view.container.querySelector("[data-workshop-stage]") as HTMLElement;
    expect(within(enStage).getByRole("link", { name: /^View the slides/ })).toHaveAttribute(
      "href",
      w02.materials.find((material) => material.primary)!.href,
    );
    const kit = within(enStage).getByRole("link", { name: /^Download the kit/ });
    expect(kit).toHaveAttribute("href", w02.materials.find((material) => material.role === "kit")!.href);
    expect(kit).toHaveAttribute("download", "");
    expect(screen.queryByRole("link", { name: "See materials" })).toBeNull();
    expect(document.getElementById("material")).toBeNull();
  });

  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: sets the band as the workshop's poster, with the stage and the facts on paper`, () => {
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
        // The tail of the title sits on a marker band (TITLE_HIGHLIGHT); its
        // padding is pulled back by an equal negative margin and never repeats
        // on a wrapped line, so the words keep the text column's edge.
        const mark = h1.querySelector("span.title-mark") as HTMLElement;
        expect(mark).not.toBeNull();
        expect(mark.style.backgroundImage).toContain(`var(${TITLE_HIGHLIGHT[scene].colorVar})`);
        expect(mark).toHaveClass("box-decoration-slice", "px-[0.12em]");
        expect(mark).not.toHaveClass("-mx-[0.1em]");
        expect(mark.style.backgroundSize).toBe("100% 0.84em");
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
        // No buttons in the band: the actions moved to the stage under it. The
        // band keeps the back link only.
        expect(
          within(band).queryAllByRole("link").filter((link) => !link.hasAttribute("data-cover-back")),
        ).toHaveLength(0);
        // The poster: the lg art and the phone poster strip (numeral flush
        // left, motif bleeding off the bottom right), decorative, numbered. Every workshop,
        // Workshop 05 included, shows its poster motif here: a motion scene
        // lives on the stage, never in the band.
        const posters = [...band.querySelectorAll("svg[data-poster]")];
        expect(posters.map((poster) => poster.getAttribute("data-poster-format"))).toEqual(["portrait", "strip"]);
        expect(band.querySelectorAll("svg[data-hero-motion]")).toHaveLength(0);
        expect(band.querySelector("[data-plakat-art-phone]")).toHaveClass("lg:hidden");
        for (const poster of posters) {
          expect(poster).toHaveAttribute("aria-hidden", "true");
          expect(poster).toHaveAttribute("focusable", "false");
          expect(poster.querySelector("[data-poster-numeral-text]")).toHaveTextContent(workshop.number);
        }
        // The scene (when wired) sits on the stage, outside the band.
        for (const scene of container.querySelectorAll("svg[data-hero-motion]")) {
          expect(scene.closest("[data-workshop-stage]")).not.toBeNull();
          expect(band).not.toContainElement(scene as HTMLElement);
        }
        expectNoMennigeInScene(container);
        expectCapsInsideScene(container);
      });
    }
  }

  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: has no outcomes section and no visible case section, and keeps the case and its sources in the closed accordion`, () => {
        const { container } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        const outcomesName = locale === "de" ? "Nach dem Workshop" : "After this you can";
        expect(screen.queryByRole("heading", { name: outcomesName })).toBeNull();
        expect(container.querySelector("#workshop-outcomes-heading, [data-workshop-brief], [data-workshop-need]")).toBeNull();
        // No h2 other than the stage heading and the one accordion heading.
        expect([...container.querySelectorAll("h2")].map((heading) => heading.id)).toEqual([
          "workshop-stage-heading",
          "workshop-details-heading",
        ]);
        // Order: band, stage, facts line, accordion, provenance footer.
        const band = container.querySelector("[data-cover-band]")!;
        const stage = container.querySelector("[data-workshop-stage]")!;
        const facts = container.querySelector("[data-workshop-facts]")!;
        const details = container.querySelector("details")!;
        const footer = container.querySelector("footer")!;
        for (const [first, second] of [
          [band, stage],
          [stage, facts],
          [facts, details],
          [details, footer],
        ] as const) {
          expect(follows(first, second)).toBe(true);
        }
        // The case, its one question and every legal source detail sit in the accordion.
        const caseSection = container.querySelector("#fall")!;
        expect(details).toContainElement(caseSection as HTMLElement);
        expect(caseSection.querySelectorAll("[data-case-question]")).toHaveLength(1);
        if (workshop.realWorldCase) {
          const real = workshop.realWorldCase;
          const link = within(caseSection as HTMLElement).getByRole("link", { name: new RegExp(real.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
          expect(link).toHaveAttribute("href", real.sourceHref);
          expect(caseSection.querySelector(`time[datetime="${real.sourcePublishedAt}"]`)).not.toBeNull();
          expect(caseSection.querySelector(`time[datetime="${real.sourceReviewedAt}"]`)).not.toBeNull();
          expect(caseSection).toHaveTextContent(real.sourceLimitation);
        }
        // The needs list is complete and labelled.
        const needs = sectionOf(locale === "de" ? "Du brauchst" : "You need");
        expect(needs.querySelectorAll("li")).toHaveLength(workshop.needs.length);
        expect(details).toContainElement(needs);
      });
    }
  }

  it("keeps the removed band buttons, outcomes list and jump link out of the source", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/workshops/[slug]/workshop-detail-content.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/PHONE_BUTTON|SECONDARY_ROLES|reachedByBand|bandArt|heroMotionArt|BUTTON_CLASSES/);
    expect(source).not.toMatch(/primaryAction|seeMaterials|outcomesHeading|workshop\.outcomes/);
    expect(source).toContain("<WorkshopStage");
  });

  it("charts a case result inside the case, with a hatched AI answer and direct labels", () => {
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
      expect(chart.closest("details")).not.toBeNull();
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

  /**
   * A workshop with a third file: the two cards reach the first two, so the
   * list in "More details" appears and carries every row.
   */
  function withExtraMaterials(workshop: Workshop): Workshop {
    const [first] = workshop.materials;
    return {
      ...workshop,
      materials: [
        ...workshop.materials,
        {
          ...first,
          label: `${first.label} Extra`,
          href: `${first.href}?extra`,
          role: "guide",
          phase: "after",
          primary: false,
          optional: false,
        },
        {
          ...first,
          label: `${first.label} Optional`,
          href: `${first.href}?optional`,
          role: "exercise",
          phase: "after",
          primary: false,
          optional: true,
        },
      ],
    };
  }

  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: lists no materials, because the two cards reach both files`, () => {
        const { container } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        const stage = workshopStage(workshop, locale);
        const reached = new Set([stage.a?.material, stage.b?.material]);
        expect(workshop.materials.every((material) => reached.has(material))).toBe(true);
        expect(container.querySelector("#material, [data-material-row]")).toBeNull();
        expect(screen.queryByRole("heading", { name: locale === "de" ? "Material" : "Materials" })).toBeNull();
        expect(screen.queryByRole("link", { name: locale === "de" ? "Material ansehen" : "See materials" })).toBeNull();
      });

      it(`${locale}/${workshop.slug}: lists a third file in "More details", in taught order, optional files folded, one link per row`, () => {
        const extended = withExtraMaterials(workshop);
        const { container } = render(<WorkshopDetailContent workshop={extended} locale={locale} />);
        const hrefOf = (material: (typeof extended.materials)[number]) =>
          extended.kit && material.role === "kit"
            ? localizeHref(workshopKitPath(extended.slug), locale)
            : material.href;
        const materialSection = sectionOf(locale === "de" ? "Material" : "Materials");
        expect(materialSection).toHaveAttribute("id", "material");
        expect(sectionOf(locale === "de" ? "Mehr Details" : "More details")).toContainElement(materialSection);
        const rows = materialSection.querySelectorAll("[data-material-row]");
        expect(rows).toHaveLength(extended.materials.length);

        const links = within(materialSection).getAllByRole("link");
        expect(links).toHaveLength(extended.materials.length);
        const hrefs = links.map((link) => link.getAttribute("href"));
        expect(new Set(hrefs).size).toBe(extended.materials.length);
        for (const material of extended.materials) {
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
        const taught = [...extended.materials].sort(
          (a, b) => order.indexOf(a.phase) - order.indexOf(b.phase),
        );
        const expectedOrder = [
          ...taught.filter((material) => !material.optional),
          ...taught.filter((material) => material.optional),
        ].map(hrefOf);
        expect(hrefs).toEqual(expectedOrder);
        const folded = materialSection.querySelector("details");
        expect(folded).not.toHaveAttribute("open");
        expect(folded!.querySelectorAll("[data-material-row]")).toHaveLength(1);

        // Exactly one row says where to start.
        expect(
          within(materialSection).getAllByText(locale === "de" ? /Hier starten/ : /Start here/),
        ).toHaveLength(1);
        expect(container.querySelectorAll("details")).toHaveLength(2);
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
    // One label and one size at every width.
    expect(back[0]).toHaveTextContent("Alle Workshops");
    expect(back[1]).toHaveTextContent("Alle Workshops");
    for (const link of back) expect(link).toHaveClass("text-[0.875rem]", "font-bold");
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
    expect(screen.queryByRole("heading", { level: 2, name: "The case" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "After this you can" })).toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: "The case" })).toBeInTheDocument();
    // The real-world case and its source stay on the page, inside the closed accordion.
    const realWorld = screen.getByRole("heading", { name: "The same method on real figures" });
    expect(realWorld.closest("details")).not.toBeNull();
    expect(realWorld.closest("#fall")).not.toBeNull();
    const source = screen.getByRole("link", { name: /Meta Q2 2026 Results/ });
    expect(source).toHaveAttribute(
      "href",
      "https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/meta-06302026xexhibit991.htm",
    );
    expect(source).toHaveAttribute("target", "_blank");
    expect(screen.getByText(/unaudited quarterly figures/)).toBeInTheDocument();
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
    // The two cards reach the deck and the kit, so a third file brings the list back.
    const published = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")!;
    const workshop = {
      ...published,
      materials: [
        ...published.materials,
        { ...published.materials[0], label: "Zusatz", href: `${published.materials[0].href}?x`, role: "guide" as const, primary: false },
      ],
    };
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

describe("the band lede", () => {
  it("keeps a short summary whole and cuts a long one after its first sentence", () => {
    const short = "In Browser-Laboren rechnest du aus, was eine falsche Prognose kostet.";
    expect(bandLede(short)).toBe(short);
    const long =
      "Eine erfundene nordmazedonische Weinkellerei bekommt drei ESG-Anfragen in einer Woche. Claude beantwortet alle aus denselben Dateien und benennt, was fehlt.";
    expect(bandLede(long)).toBe(
      "Eine erfundene nordmazedonische Weinkellerei bekommt drei ESG-Anfragen in einer Woche.",
    );
  });

  it("never leaves a band lede over the catalogue summary limit", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const lede = bandLede(workshop.summary);
        expect(lede.length, `${locale}/${workshop.slug}`).toBeLessThanOrEqual(150);
        expect(workshop.summary.startsWith(lede)).toBe(true);
        expect(lede).toMatch(/[.!?]$/);
      }
    }
  });
});

describe("the compact band and the facts", () => {
  it("keeps the phone band short: a 4.75rem poster strip with the numeral flush left, a 2.5rem headline", () => {
    const workshop = getWorkshopBySlug("esg-berichte-mit-ki", "de")!;
    const { container } = render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const band = container.querySelector("[data-cover-band]") as HTMLElement;
    expect(band.className).toContain("max-sm:[&>[data-plakat-art-phone]]:h-[4.75rem]");
    expect(band.className).toContain("sm:[&>[data-plakat-art-phone]]:h-28");
    // The stage starts at the same y on every workshop from lg.
    expect(band.className).toContain("lg:min-h-[19rem]");
    expect(band.querySelector("[data-plakat-art-phone]")).toHaveAttribute("data-plakat-art-phone-layout", "strip");
    expect(band.querySelector("[data-plakat-art-phone] svg")).toHaveAttribute("data-poster-format", "strip");
    const h1 = band.querySelector("h1") as HTMLElement;
    expect(h1.className).toContain("min-[380px]:max-sm:[--text-poster:2.5rem]");
    // Below 380px the headline scales with the width, so all three phone widths give the same lines.
    expect(h1.className).toContain("max-[379px]:[--text-poster:min(2.5rem,10vw)]");
    expect(h1.className).toContain("lg:[--text-poster:4.5rem]");
  });

  it("never jumps a heading level on the page", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const { container, unmount } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        const levels = [...container.querySelectorAll("h1, h2, h3, h4")].map((heading) => Number(heading.tagName[1]));
        expect(levels[0], `${locale}/${workshop.slug}`).toBe(1);
        for (let at = 1; at < levels.length; at += 1) {
          expect(levels[at] - levels[at - 1], `${locale}/${workshop.slug}: ${levels.join("")}`).toBeLessThanOrEqual(1);
        }
        unmount();
      }
    }
  });

  it("sets the facts as separate items behind a square, so no line starts or ends with a dot", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    const { container } = render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const facts = container.querySelector("[data-workshop-facts]") as HTMLElement;
    expect(facts.tagName).toBe("UL");
    const items = [...facts.querySelectorAll(":scope > li")];
    expect(items.length).toBeGreaterThan(2);
    // Each fact is one unit that wraps as a whole; the marker is a square, never a dot.
    for (const item of items) {
      expect(item).toHaveClass("inline-flex");
      expect(item.querySelector("[aria-hidden='true']")).toHaveClass("bg-foreground/70");
    }
    expect(facts.textContent).not.toMatch(/·/);
    // The facts line is body size or larger, in full ink.
    expect(facts).toHaveClass("text-foreground");
    expect(facts.className).toMatch(/text-\[0\.9375rem\]/);
  });

  it("names where the data comes from once: in the facts line, and in the footer only when the facts line does not", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")!;
    const { container } = render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const facts = container.querySelector("[data-workshop-facts]") as HTMLElement;
    const footer = container.querySelector('footer[aria-label="Stand und Herkunft"]') as HTMLElement;
    expect(facts).toHaveTextContent("rfundene Firma, dazu öffentliche Zahlen");
    expect(footer).not.toHaveTextContent(/erfunden|öffentliche Zahlen|Daten/);
  });
});
