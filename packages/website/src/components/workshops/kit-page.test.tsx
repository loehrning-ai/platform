import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackMaterialOpened } from "@/lib/analytics/events";
import { getWorkshopBySlug } from "@/lib/workshops";
import { KitPage } from "./kit-page";

vi.mock("@/lib/analytics/events", () => ({ trackMaterialOpened: vi.fn() }));

const trackMock = vi.mocked(trackMaterialOpened);
const SLUG = "esg-berichte-mit-ki";

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

  for (const locale of ["de", "en"] as const) {
    describe(locale, () => {
      const workshop = getWorkshopBySlug(SLUG, locale)!;
      const kit = workshop.kit!;

      it("has one h1, the stats, the three rules and a five-tab stepper", () => {
        render(<KitPage workshop={workshop} locale={locale} />);
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(kit.title);
        for (const stat of kit.stats) expect(screen.getAllByText(stat.value).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/NOT FOUND|NEEDS CHECK/).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("tab")).toHaveLength(5);
        expect(screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-selected"))).toEqual([
          "true",
          "false",
          "false",
          "false",
          "false",
        ]);
        expect(screen.getByRole("tabpanel")).toBeInTheDocument();
      });

      it("shows the selected step's input and action, optional result, and keyboard navigation", () => {
        render(<KitPage workshop={workshop} locale={locale} />);
        const panel = () => screen.getByRole("tabpanel");
        expect(panel()).toHaveTextContent(kit.steps[0].input);

        const tabs = screen.getAllByRole("tab");
        fireEvent.click(tabs[2]);
        expect(tabs[2]).toHaveAttribute("aria-selected", "true");
        expect(panel()).toHaveTextContent(kit.steps[2].action);
        if (kit.steps[2].line) expect(panel()).toHaveTextContent(kit.steps[2].line.result);

        fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
        expect(tabs[3]).toHaveAttribute("aria-selected", "true");
        expect(tabs[3]).toHaveAttribute("tabindex", "0");
        expect(tabs[2]).toHaveAttribute("tabindex", "-1");
        fireEvent.keyDown(tabs[3], { key: "End" });
        expect(tabs[4]).toHaveAttribute("aria-selected", "true");
        if (kit.steps[4].line) expect(panel()).toHaveTextContent(kit.steps[4].line.result);

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
        expect(link).toHaveAttribute("href", `/workshops/${SLUG}/${kit.fileName}`);
        expect(link).toHaveAttribute("download");
        expect(link).toHaveTextContent(workshop.materials.find((material) => material.kind === "zip")!.sizeLabel!);
        link.addEventListener("click", (event) => event.preventDefault());
        fireEvent.click(link);
        expect(trackMock).toHaveBeenCalledTimes(1);
        expect(trackMock).toHaveBeenCalledWith(SLUG, "zip");
      });

      it("lists what is inside, states the file name, and asks for no email", () => {
        const { container } = render(<KitPage workshop={workshop} locale={locale} />);
        for (const item of kit.contents) expect(screen.getByText(item.name)).toBeInTheDocument();
        expect(container.querySelector("[data-kit-filename]")).toHaveTextContent(kit.fileName);
        expect(container.querySelector("input, form")).toBeNull();
      });

      it("links back to the workshop in the page locale and jumps to the download", () => {
        const { container } = render(<KitPage workshop={workshop} locale={locale} />);
        const detail = locale === "en" ? `/en/workshops/${SLUG}` : `/workshops/${SLUG}`;
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
});
