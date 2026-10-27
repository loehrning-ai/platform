import { readFileSync } from "node:fs";
import { workshopObjective } from "@/lib/workshop-objectives";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshopBySlug, getWorkshops, workshopFileMaterials, type Workshop } from "@/lib/workshops";
import { workshopStage } from "@/lib/workshop-stage";
import { PLAKAT, PLAKAT_KEYS, WORKSHOP_PLAKAT, type PlakatKey } from "@/lib/plakat/palettes";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";
import {
  bandLede,
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


/** A public second case as the page renders one; no catalogue entry carries one at the moment. */
function withRealWorldCase(workshop: Workshop): Workshop {
  return {
    ...workshop,
    provenance: { ...workshop.provenance, data: "synthetic-and-public" },
    realWorldCase: {
      companyName: "Example Corp",
      source: "Example Corp Q2 Results",
      sourceHref: "https://example.com/q2-results.htm",
      sourcePublishedAt: "2026-07-29",
      sourceReviewedAt: "2026-08-26",
      sourceLimitation: "Company release with unaudited figures.",
      narrative: "The same method on a public quarterly release.",
      metrics: [{ label: "Revenue", value: "+28%" }],
      decisionQuestion: "Which figure describes the quarter?",
    },
  };
}
describe("<WorkshopDetailContent>", () => {
  it("puts the band, the stage, the kit explainer and the provenance line in that order, with nothing collapsible, no outcomes, no case section and no agenda", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="de" />,
    );

    const h1 = screen.getByRole("heading", { level: 1, name: workshop.title });
    const cover = h1.closest("[data-cover-band]");
    expect(cover).not.toBeNull();
    expect(cover).toHaveClass("plakat-lemons");
    const caps = (cover as HTMLElement).querySelector(".plakat-caps");
    expect(caps?.textContent).toBe(workshop.eyebrow);
    expect(within(cover as HTMLElement).getByText(workshop.summary)).toBeInTheDocument();

    // The agenda is gone from the page; it stays in the registry.
    expect(screen.queryByRole("heading", { name: "Ablauf" })).toBeNull();
    expect(container.querySelector("[data-workshop-redline], ol[data-route-mode], #ablauf")).toBeNull();
    for (const heading of container.querySelectorAll("h2, h3")) {
      expect(heading.textContent, "a numbered heading").not.toMatch(/^\d/);
    }
    for (const item of workshop.agenda) expect(container).not.toHaveTextContent(item.label);

    const stage = container.querySelector("[data-workshop-stage]") as HTMLElement;
    expect(cover!.nextElementSibling).toBe(stage);
    expect(stage.querySelectorAll("[data-action-card]")).toHaveLength(2);

    // No collapsible UI anywhere: no details, no summary, no "Mehr Details".
    expect(container.querySelectorAll("details, summary, [aria-expanded]")).toHaveLength(0);
    expect(screen.queryByText("Mehr Details")).toBeNull();
    expect(container.querySelector("#fall, [data-case-question], [data-result-chart]")).toBeNull();
    for (const line of workshop.outcomes) expect(container).not.toHaveTextContent(line);
    expect(container).not.toHaveTextContent("Du nimmst mit");

    // The explainer follows the stage directly, with a heading and a body.
    const explainer = container.querySelector("[data-stage-explainer]") as HTMLElement;
    expect(stage.nextElementSibling).toBe(explainer);
    expect(within(explainer).getByRole("heading", { level: 2, name: workshop.stageExplainer.heading })).toBeInTheDocument();
    expect(explainer).toHaveTextContent(workshop.stageExplainer.body);
    const facts = explainer.querySelector("[data-workshop-facts]") as HTMLElement;
    for (const fact of workshop.stageExplainer.facts ?? []) expect(facts).toHaveTextContent(fact);

    // Both of Workshop 01's files are reached by the two cards: no material list.
    expect(container.querySelector("#material, [data-material-row]")).toBeNull();

    // The slim provenance line closes the page and carries the honest notes.
    const footer = container.querySelector('footer[aria-label="Stand und Herkunft"]') as HTMLElement;
    expect(follows(explainer, footer)).toBe(true);
    expect(footer).toHaveTextContent("Tim Löhr");
    expect(footer).toHaveTextContent("geprüft 25. Oktober 2026");
    expect(footer).toHaveTextContent(workshop.provenance.note);
    // Workshop 01's kit has a German edition, so the page claims no English-only material.
    expect(footer).not.toHaveTextContent("Material auf Englisch");
    expect(screen.queryByText("Referenz")).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("sets a title's subtitle on its own line and keeps the full title as the heading name", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshopBySlug("audit-vorbereitung-mit-ki", locale)!;
      const { unmount } = render(
        <WorkshopDetailContent workshop={workshop} locale={locale} />,
      );
      const [head, subtitle] = workshop.title.split(": ");
      expect(subtitle).toBeTruthy();
      const h1 = screen.getByRole("heading", { level: 1, name: workshop.title });
      // The text reads as the full title, colon included; only the subtitle
      // moves to its own line.
      expect(h1.textContent).toBe(workshop.title);
      // The head is split only for the highlight band: the positioned lead,
      // then the marked tail.
      const lead = h1.firstElementChild;
      const mark = h1.querySelector("span.title-mark");
      expect(lead).toHaveClass("relative");
      // The colon sits inside the band, never alone after it.
      expect(`${lead?.textContent} ${mark?.textContent}`).toBe(`${head}:`);
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

  it("lands the Workshop 05 band on the head's last pair, in both locales, and keeps the full title as the heading", () => {
    for (const [locale, mark, lead] of [
      ["en", "with AI", "Audit Preparation"],
      ["de", "mit KI", "Audit-Vorbereitung"],
    ] as const) {
      const workshop = getWorkshopBySlug("audit-vorbereitung-mit-ki", locale)!;
      const { unmount } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
      const h1 = screen.getByRole("heading", { level: 1, name: workshop.title });
      expect(h1.textContent).toBe(workshop.title);
      expect(h1.firstElementChild).toHaveClass("relative");
      expect(h1.textContent?.slice(0, h1.textContent.indexOf(mark)).trim()).toBe(lead);
      const marks = h1.querySelectorAll("span.title-mark");
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent(new RegExp(`^${mark}:?$`));
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
      // A line's box is taller than its band (0.84em), so the same words also
      // sit on the bare ground: display floor 3 there too (Bogen on Kraft, 1.93,
      // passed the line above and failed the pixel check).
      expect(contrast(text, rgb(ground)), `${key} words on the ground`).toBeGreaterThanOrEqual(3);
      // The band is a visible mark on its ground: 1.6:1 or more (a wash that
      // matched the ground marked nothing; idea 35% and autumn 30% were 1.54 and 1.40).
      expect(contrast(rgb(ground), painted), `${key} band on its ground`).toBeGreaterThanOrEqual(1.6);
    }
  });

  it("puts the first material on card A and the lab or the case on card B, and no buttons in the band", () => {
    const w01 = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    const { container, unmount } = render(<WorkshopDetailContent workshop={w01} locale="de" />);
    const cover = screen
      .getByRole("heading", { level: 1 })
      .closest("[data-cover-band]") as HTMLElement;
    const lab = w01.materials.find((material) => material.primary)!;
    const demo = w01.materials.find((material) => material.role === "demo")!;
    const w01Kit = w01.materials.find((material) => material.role === "kit")!;
    const stage = container.querySelector("[data-workshop-stage]") as HTMLElement;
    // W01 has no slide deck: the labs are card A, the demo (the kit, performed)
    // is card A's secondary link, the German kit zip is card B.
    expect(lab.role).toBe("lab");
    expect(within(stage).getByRole("link", { name: /^Labor öffnen/ })).toHaveAttribute("href", lab.href);
    expect(within(stage).getByRole("link", { name: /^Demo öffnen/ })).toHaveAttribute("href", demo.href);
    expect(within(stage).getByRole("link", { name: /^Kit herunterladen/ })).toHaveAttribute("href", w01Kit.href);
    expect(w01Kit.href).toMatch(/\/prognose-pruefen-kit\.zip$/);
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
      it(`${locale}/${workshop.slug}: shows the explainer, the honest notes and nothing collapsible`, () => {
        const { container } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        expect(container.querySelectorAll("details, summary, [aria-expanded]")).toHaveLength(0);
        expect(container.textContent).not.toMatch(/Mehr Details|More details/);
        expect(screen.queryByRole("heading", { name: locale === "de" ? "Nach dem Workshop" : "After this you can" })).toBeNull();
        // No h2 other than the stage heading, the explainer heading and the Lernziel.
        const objective = workshopObjective(workshop.slug, locale);
        expect([...container.querySelectorAll("h2")].map((heading) => heading.id)).toEqual([
          "workshop-stage-heading",
          "workshop-explainer-heading",
          ...(objective ? ["workshop-objective-heading"] : []),
        ]);
        if (objective) {
          const block = container.querySelector("[data-workshop-objective]") as HTMLElement;
          expect(follows(container.querySelector("[data-stage-explainer]")!, block)).toBe(true);
          expect(follows(block, container.querySelector("footer")!)).toBe(true);
          expect(block).toHaveTextContent(objective.objective);
          expect(block.querySelectorAll("[data-objective-card] > li")).toHaveLength(3);
        }
        // Order: band, stage, explainer, provenance footer.
        const band = container.querySelector("[data-cover-band]")!;
        const stage = container.querySelector("[data-workshop-stage]")!;
        const explainer = container.querySelector("[data-stage-explainer]")!;
        const footer = container.querySelector("footer")!;
        for (const [first, second] of [
          [band, stage],
          [stage, explainer],
          [explainer, footer],
        ] as const) {
          expect(follows(first, second)).toBe(true);
        }
        // The explainer: a question heading and a body of about 35 words at most, in the page language.
        expect(within(explainer as HTMLElement).getByRole("heading", { level: 2 })).toHaveTextContent(workshop.stageExplainer.heading);
        expect(workshop.stageExplainer.heading).toMatch(/\?$/);
        expect(workshop.stageExplainer.body.split(/\s+/).length).toBeLessThanOrEqual(40);
        expect(explainer).toHaveTextContent(workshop.stageExplainer.body);
        // Invented data is said in the provenance line, or the real source is named there.
        if (workshop.caseStudy.isFictional) {
          expect(footer.textContent).toMatch(/erfunden|invented/i);
        }
        if (workshop.realWorldCase) {
          const real = workshop.realWorldCase;
          const link = within(footer as HTMLElement).getByRole("link", { name: new RegExp(real.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
          expect(link).toHaveAttribute("href", real.sourceHref);
          expect(footer.querySelector(`time[datetime="${real.sourcePublishedAt}"]`)).not.toBeNull();
        }
        // The workshops that say "not legal advice" keep saying it on the page.
        const sayLegal = /Rechtsberatung|legal advice/i.test(workshop.provenance.note);
        if (sayLegal) expect(footer.textContent).toMatch(/Keine Rechtsberatung|Not legal advice/);
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
    // Nothing collapses: no disclosure or accordion in the page source.
    expect(source).not.toMatch(/<details|<summary|aria-expanded/);
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
    expect(container.querySelector("footer")).not.toHaveTextContent("Material auf Englisch");
  });

  it("offers at most two files per workshop, the deck and the kit, plus the optional practice demo", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const files = workshopFileMaterials(workshop);
        expect(files.length, workshop.slug).toBeLessThanOrEqual(2);
        expect(files.filter((material) => material.optional), workshop.slug).toEqual([]);
        // Workshop 01 has no slide deck: its labs play that part, next to its kit.
        const allowed = workshop.slug === "ki-prognosen-einschaetzen" ? ["lab", "kit"] : ["deck", "kit"];
        for (const material of files) expect(allowed, material.href).toContain(material.role);
        // The one non-file material is the demo page: optional, never primary.
        const demos = workshop.materials.filter((material) => material.role === "demo");
        expect(demos.map((material) => [material.optional, material.primary ?? false]), workshop.slug).toEqual([[true, false]]);
        const { container, unmount } = render(
          <WorkshopDetailContent workshop={workshop} locale={locale} />,
        );
        expect(container.querySelector("#material, details"), workshop.slug).toBeNull();
        unmount();
      }
    }
  });

  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: lists no materials, because the two cards reach both files and the demo`, () => {
        const { container } = render(<WorkshopDetailContent workshop={workshop} locale={locale} />);
        const stage = workshopStage(workshop, locale);
        const reached = new Set([stage.a?.href, stage.b?.href]);
        expect(workshopFileMaterials(workshop).every((material) => reached.has(material.href))).toBe(true);
        // Card A's secondary link reaches the demo page.
        const demo = workshop.materials.find((material) => material.role === "demo");
        expect(stage.a?.demoHref).toBe(demo?.href);
        expect(container.querySelector(`a[href="${demo?.href}"]`)).not.toBeNull();
        expect(container.querySelector("#material, [data-material-row]")).toBeNull();
        expect(screen.queryByRole("heading", { name: locale === "de" ? "Material" : "Materials" })).toBeNull();
        expect(screen.queryByRole("link", { name: locale === "de" ? "Material ansehen" : "See materials" })).toBeNull();
      });
    }
  }

  it("keeps the German material note and back link", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")!;
    render(<WorkshopDetailContent workshop={workshop} locale="de" />);

    // The kit has a German edition, so the provenance line says no "auf Englisch".
    expect(document.querySelector("footer")).not.toHaveTextContent("Material auf Englisch");
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
    const workshop = withRealWorldCase(getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en")!);
    const { container } = render(
      <WorkshopDetailContent workshop={workshop} locale="en" />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Read business reports with AI" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "What is the kit?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Who this is for" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "The case" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "After this you can" })).toBeNull();
    // The real source stays on the page, in the provenance line, with publisher and date.
    const source = screen.getByRole("link", { name: /Example Corp Q2 Results/ });
    expect(source.closest("footer")).not.toBeNull();
    expect(source).toHaveAttribute("href", "https://example.com/q2-results.htm");
    expect(source).toHaveAttribute("target", "_blank");
    expect(container.querySelector('time[datetime="2026-07-29"]')).not.toBeNull();

    for (const link of screen.getAllByRole("link", { name: "Back to all workshops" })) {
      expect(link).toHaveAttribute("href", "/en/workshops");
    }
    expect(screen.queryByText(/All materials in English/)).toBeNull();
    expect(container.textContent).not.toMatch(
      /Für wen|Alle Workshops|Die offene Entscheidung|Material zum Mitnehmen|Kostenlos/,
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
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

  it("sets the explainer facts as a short row of plain facts, in full ink", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "de")!;
    const { container } = render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const facts = container.querySelector("[data-workshop-facts]") as HTMLElement;
    expect(facts.tagName).toBe("UL");
    const items = [...facts.querySelectorAll(":scope > li")];
    expect(items.map((item) => item.textContent)).toEqual([...(workshop.stageExplainer.facts ?? [])]);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.length).toBeLessThanOrEqual(3);
    for (const item of items) expect(item).toHaveClass("text-foreground");
  });

  it("names the origin of the data once, in the provenance line", () => {
    const workshop = withRealWorldCase(getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")!);
    const { container } = render(<WorkshopDetailContent workshop={workshop} locale="de" />);
    const footer = container.querySelector('footer[aria-label="Stand und Herkunft"]') as HTMLElement;
    expect(footer).toHaveTextContent(workshop.provenance.note);
    expect(footer).toHaveTextContent("Quelle: Example Corp Q2 Results");
    expect(container.querySelector("[data-stage-explainer]")).not.toHaveTextContent(/öffentliche Zahlen/);
  });
});
