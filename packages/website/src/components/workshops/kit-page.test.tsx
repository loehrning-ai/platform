import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackMaterialOpened } from "@/lib/analytics/events";
import { getWorkshopBySlug } from "@/lib/workshops";
import { KitPage } from "./kit-page";

vi.mock("@/lib/analytics/events", () => ({ trackMaterialOpened: vi.fn() }));

const trackMock = vi.mocked(trackMaterialOpened);
/** The two workshops with a kit page: five steps (ESG) and three steps (Workshop 05). */
const SLUGS = ["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"] as const;

afterEach(() => {
  cleanup();
  trackMock.mockReset();
});

describe("<KitPage>", () => {
  it("renders nothing for a workshop without a kit block", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de")!;
    const { container } = render(<KitPage workshop={workshop} locale="de" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the plain poster in the band for both kit workshops, with no motion scene", () => {
    for (const slug of SLUGS) {
      const workshop = getWorkshopBySlug(slug, "en")!;
      const { container, unmount } = render(<KitPage workshop={workshop} locale="en" />);
      expect(container.querySelectorAll("svg[data-hero-motion]")).toHaveLength(0);
      expect(container.querySelectorAll("svg[data-poster]").length).toBeGreaterThan(0);
      unmount();
    }
  });

  for (const slug of SLUGS) {
    for (const locale of ["de", "en"] as const) {
      describe(`${slug} ${locale}`, () => {
        const workshop = getWorkshopBySlug(slug, locale)!;
        const kit = workshop.kit!;

        it("has one h1, the stats and one tab per step, the first selected", () => {
          render(<KitPage workshop={workshop} locale={locale} />);
          expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
          expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(kit.title);
          for (const stat of kit.stats) expect(screen.getAllByText(stat.value).length).toBeGreaterThan(0);
          const tabs = screen.getAllByRole("tab");
          expect(tabs).toHaveLength(kit.steps.length);
          expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(
            kit.steps.map((_, index) => (index === 0 ? "true" : "false")),
          );
          expect(screen.getByRole("tabpanel")).toBeInTheDocument();
        });

        it("is lean: no numbered headings, the rules and the file list short and open, nothing collapsed", () => {
          const { container } = render(<KitPage workshop={workshop} locale={locale} />);
          for (const heading of container.querySelectorAll("h2, h3")) {
            expect(heading.textContent, "a numbered heading").not.toMatch(/^\d/);
          }
          // Nothing collapses: the rules (one short line each) and the file list are always visible.
          expect(container.querySelectorAll("details, summary, [aria-expanded]")).toHaveLength(0);
          const rules = container.querySelector("[data-kit-rules]") as HTMLElement;
          const shown = kit.rulesShort ?? kit.rules;
          expect(shown).toHaveLength(kit.rules.length);
          for (const rule of shown) expect(rules).toHaveTextContent(rule);
          expect(rules.querySelectorAll("ol > li")).toHaveLength(kit.rules.length);
          const contents = container.querySelector("[data-kit-contents]") as HTMLElement;
          for (const item of kit.contents) expect(contents).toHaveTextContent(item.name);
          // The stats come before the explainer, the explainer before the download.
          const stats = container.querySelector("[data-kit-stat]") as HTMLElement;
          const stepper = container.querySelector("[data-kit-stepper]") as HTMLElement;
          const download = container.querySelector("[data-kit-download]") as HTMLElement;
          const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
          expect(follows(stats, stepper)).toBe(true);
          expect(follows(stepper, download)).toBe(true);
          // One big download button, and the band's jump button to it.
          expect(download.querySelectorAll('a[href$=".zip"]')).toHaveLength(1);
          expect(container.querySelectorAll('a[href="#download"]')).toHaveLength(1);
        });

        it("shows the selected step's input and action, optional result, and keyboard navigation", () => {
          render(<KitPage workshop={workshop} locale={locale} />);
          const panel = () => screen.getByRole("tabpanel");
          expect(panel()).toHaveTextContent(kit.steps[0].input);

          const tabs = screen.getAllByRole("tab");
          const last = tabs.length - 1;
          fireEvent.click(tabs[1]);
          expect(tabs[1]).toHaveAttribute("aria-selected", "true");
          expect(panel()).toHaveTextContent(kit.steps[1].action);
          for (const index of [1, last]) {
            if (kit.steps[index].line) expect(panel()).toHaveTextContent(kit.steps[index].line!.result);
          }

          fireEvent.keyDown(tabs[1], { key: "ArrowRight" });
          expect(tabs[2]).toHaveAttribute("aria-selected", "true");
          expect(tabs[2]).toHaveAttribute("tabindex", "0");
          expect(tabs[1]).toHaveAttribute("tabindex", "-1");
          fireEvent.keyDown(tabs[2], { key: "End" });
          expect(tabs[last]).toHaveAttribute("aria-selected", "true");
          expect(panel()).toHaveTextContent(kit.steps[last].action);

          // The last step's button starts again; the others go on.
          fireEvent.click(within(panel()).getByRole("button"));
          expect(tabs[0]).toHaveAttribute("aria-selected", "true");
          fireEvent.click(within(panel()).getByRole("button"));
          expect(tabs[1]).toHaveAttribute("aria-selected", "true");
        });

        it("has one big download link to the zip, with its size, and counts it as a zip opened", () => {
          render(<KitPage workshop={workshop} locale={locale} />);
          const downloads = screen
            .getAllByRole("link")
            .filter((link) => link.getAttribute("href")?.endsWith(".zip"));
          expect(downloads).toHaveLength(1);
          const link = downloads[0];
          expect(link).toHaveAttribute("href", `/workshops/${slug}/${kit.fileName}`);
          expect(link).toHaveAttribute("download");
          const sizeLabel = workshop.materials.find((material) => material.kind === "zip")!.sizeLabel!;
          // The size sits once, in the card caption beside the button, not inside the button.
          expect(link).not.toHaveTextContent(sizeLabel);
          expect(document.querySelector("[data-kit-download]")).toHaveTextContent(sizeLabel);
          link.addEventListener("click", (event) => event.preventDefault());
          fireEvent.click(link);
          expect(trackMock).toHaveBeenCalledTimes(1);
          expect(trackMock).toHaveBeenCalledWith(slug, "zip");
        });

        it("lists what is inside, states the file name, and asks for no email", () => {
          const { container } = render(<KitPage workshop={workshop} locale={locale} />);
          for (const item of kit.contents) expect(screen.getByText(item.name)).toBeInTheDocument();
          expect(container.querySelector("[data-kit-filename]")).toHaveTextContent(kit.fileName);
          expect(container.querySelector("input, form")).toBeNull();
        });

        it("links back to the workshop in the page locale and jumps to the download", () => {
          const { container } = render(<KitPage workshop={workshop} locale={locale} />);
          const detail = locale === "en" ? `/en/workshops/${slug}` : `/workshops/${slug}`;
          expect(container.querySelector(`a[href="${detail}"]`)).not.toBeNull();
          expect(container.querySelector('a[href="#download"]')).not.toBeNull();
          expect(container.querySelector("#download")).not.toBeNull();
        });

        it("never uses an en or em dash in what it renders", () => {
          const { container } = render(<KitPage workshop={workshop} locale={locale} />);
          expect(container.textContent).not.toMatch(/[–—]/);
        });
      });
    }
  }

  it("shows Workshop 05 as three missions with the four tests of the Project", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshopBySlug("audit-vorbereitung-mit-ki", locale)!;
      const { unmount } = render(<KitPage workshop={workshop} locale={locale} />);
      expect(screen.getAllByRole("tab")).toHaveLength(3);
      expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(
        workshop.kit!.steps.map((step, index) => `${index + 1}${step.title}`),
      );
      expect(screen.getByRole("heading", { name: workshop.kit!.stepsHeading })).toBeInTheDocument();
      expect(workshop.kit!.stats.map((stat) => stat.value)).toEqual(["18", "3", "13"]);
      expect(document.querySelectorAll("[data-kit-rules] ol > li")).toHaveLength(4);
      unmount();
    }
  });
});
